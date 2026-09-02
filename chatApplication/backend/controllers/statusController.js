const { uplaodFileToCloudinary } = require("../config/cloudinaryConfig");
const Status = require("../models/Status");
const response = require("../utils/responseHandler");

// Helper to reliably extract user ID regardless of key casing
const getUserId = (req) =>
  req.user?.userId || req.user?.userID || req.user?.id || req.user?._id;

// Create Status
const createStatus = async (req, res) => {
  try {
    const { content, contentType } = req.body;
    const file = req.file;
    const userId = getUserId(req);

    if (!userId) {
      return response(res, 401, "User authorization required");
    }

    let mediaUrl = null;
    let finalContentType = contentType || "text";

    // Handle file upload
    if (file) {
      const uploadFile = await uplaodFileToCloudinary(file);
      if (!uploadFile?.secure_url) {
        return response(res, 400, "Failed to upload media");
      }
      mediaUrl = uploadFile.secure_url;

      if (file.mimetype.startsWith("image")) {
        finalContentType = "image";
      } else if (file.mimetype.startsWith("video")) {
        finalContentType = "video";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (content?.trim()) {
      finalContentType = "text";
    } else {
      return response(res, 400, "Status content or media file is required");
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create new status document
    const status = new Status({
      user: userId,
      content: mediaUrl || content?.trim() || null,
      contentType: finalContentType,
      mediaUrl,
      expiresAt,
    });

    await status.save();

    // Populate user metadata for immediate UI render
    const populatedStatus = await Status.findById(status._id)
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture");

    //emit socket event
    if (req.io && req.socketUserMap) {
      //broadcast to all connecting users except the creator
      for (const [connectedUserId, socketId] of req.socketUserMap) {
        if (connectedUserId !== userId) {
          req.io.to(socketId).emit("new_status", populatedStatus);
        }
      }
    }

    return response(res, 201, "Status created successfully", populatedStatus);
  } catch (error) {
    console.error("createStatus Error:", error);
    return response(res, 500, error.message || "Internal server error");
  }
};

//get Status
const getStatus = async (req, res) => {
  try {
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture")
      .sort({ createdAt: -1 });
    return response(res, 200, "statuses retrived successfullt", statuses);
  } catch (error) {
    console.error("createStatus Error:", error);
    return response(res, 500, error.message || "Internal server error");
  }
};

//view status
const viewStatus = async (req, res) => {
  const { statusId } = req.params;
  const userId = req.user.userID;
  try {
    const status = await Status.findById(statusId);
    if (!status) {
      return response(res, 404, "Status not found");
    }
    if (!status.viewers.includes(userId)) {
      status.viewers.push(userId);
      await status.save();

      const updatedStatus = await Status.findById(statusId)
        .populate("user", "username profilePicture")
        .populate("viewers", "username profilePicture");

      //emit socket event
      if (req.io && req.socketUserMap) {
        //broadcast to all connecting users except the creator
        const statusOwnerSocketId = req.socketUserMap.get(
          status.user._id.toString(),
        );
        if (statusOwnerSocketId) {
          const viewData = {
            statusId,
            viewerId: userId,
            totalViewers: updatedStatus.viewers.length,
            viewers: updatedStatus.viewers,
          };
          res.io.to(statusOwnerSocketId).emit("status_viewed", viewData);
        } else {
          console.log("status owner are not connected");
        }
      }
    } else {
      console.log("user already viewed the status");
    }

    return response(res, 200, "status viewed successfully");
  } catch (error) {
    console.error("createStatus Error:", error);
    return response(res, 500, error.message || "Internal server error");
  }
};

//delete status
const deleteStatus = async (req, res) => {
  const { statusId } = req.params;
  const userId = req.user.userID;

  try {
    const status = await Status.findById(statusId);
    if (!status) {
      return response(res, 404, "Status not found");
    }
    if (status.user.toString() !== userId) {
      return response(res, 403, "Not authorized to delte this status");
    }
    await status.deleteOne();
    //emit socket event
    if (req.io && req.socketUserMap) {
      //broadcast to all connecting users except the creator
      for (const [connectedUserId, socketId] of req.socketUserMap) {
        if (connectedUserId !== userId) {
          req.io.to(socketId).emit("status_deleted", statusId);
        }
      }
    }
    return response(res, 200, "Status Deleted successfully");
  } catch (error) {
    console.error("createStatus Error:", error);
    return response(res, 500, error.message || "Internal server error");
  }
};

module.exports = { createStatus, getStatus, viewStatus, deleteStatus };
