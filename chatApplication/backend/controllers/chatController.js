const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const uplaodFileToCloudinary = require("../config/cloudinaryConfig");
const response = require("../utils/responseHandler");

// Helper to reliably extract user ID regardless of key casing
const getUserId = (req) =>
  req.user?.userId || req.user?.userID || req.user?.id || req.user?._id;

// 1. Send Message
const sendMessage = async (req, res) => {
  try {
    const { content, receiverId, messageStatus } = req.body;
    const file = req.file;
    const senderId = getUserId(req);

    if (!senderId || !receiverId) {
      return response(res, 400, "Sender and Receiver IDs are required");
    }

    const participants = [senderId, receiverId].sort();

    // Find or create conversation
    let conversation = await Conversation.findOne({ participants });

    if (!conversation) {
      conversation = new Conversation({ participants });
      await conversation.save();
    }

    let imageOrVideoURL = null;
    let contentType = null;

    if (file) {
      const uploadFile = await uplaodFileToCloudinary(file);
      if (!uploadFile?.secure_url) {
        return response(res, 400, "Failed to upload media");
      }
      imageOrVideoURL = uploadFile.secure_url;

      if (file.mimetype.startsWith("image")) {
        contentType = "image";
      } else if (file.mimetype.startsWith("video")) {
        contentType = "video";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (content?.trim()) {
      contentType = "text";
    } else {
      return response(res, 400, "Message content or file is required");
    }

    const message = new Message({
      conversation: conversation._id,
      sender: senderId,
      receiver: receiverId,
      content: content?.trim() || null,
      contentType,
      imageOrVideoURL,
      messageStatus: messageStatus || "sent",
    });

    await message.save();

    // Update conversation metadata for ALL message types
    conversation.lastMessage = message._id;
    conversation.unreadCount = (conversation.unreadCount || 0) + 1;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture");
    //emit socket event for realtime
    if (req.io && req.socketUserMap) {
      const receiverSocketId = req.socketUserMap.get(receiverId);
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("receive_message", populatedMessage);
        message.messageStatus = "delivered";
        await message.save();
      }
    }

    return response(res, 201, "Message sent successfully", populatedMessage);
  } catch (error) {
    console.error("sendMessage Error:", error);
    return response(res, 500, error.message || "Internal server error");
  }
};

// 2. Get All Conversations
const getConversation = async (req, res) => {
  const userId = getUserId(req);
  try {
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "username profilePicture isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender receiver",
          select: "username profilePicture",
        },
      })
      .sort({ updatedAt: -1 });

    return response(
      res,
      200,
      "Conversations retrieved successfully",
      conversations,
    );
  } catch (error) {
    console.error("getConversation Error:", error);
    return response(res, 500, error.message || "Internal server error");
  }
};

// 3. Get Messages of Specific Conversation
const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userId = getUserId(req);

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return response(res, 404, "Conversation not found");
    }

    // Safely check participation with string conversion
    const isParticipant = conversation.participants.some(
      (id) => id.toString() === userId.toString(),
    );

    if (!isParticipant) {
      return response(res, 403, "Not authorized to view this conversation");
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .sort({ createdAt: 1 });

    // Mark unread messages received by current user as read
    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        messageStatus: { $in: ["sent", "delivered"] },
      },
      {
        $set: { messageStatus: "read" },
      },
    );

    conversation.unreadCount = 0;
    await conversation.save();

    return response(res, 200, "Messages retrieved successfully", messages);
  } catch (error) {
    console.error("getMessages Error:", error);
    return response(res, 500, error.message || "Internal server error");
  }
};

// 4. Mark Messages as Read
const markAsRead = async (req, res) => {
  const { messageIds } = req.body;
  const userId = getUserId(req);

  try {
    // Perform bulk update on the Message model
    await Message.updateMany(
      {
        _id: { $in: messageIds },
        receiver: userId,
      },
      {
        $set: { messageStatus: "read" },
      },
    );

    const updatedMessages = await Message.find({
      _id: { $in: messageIds },
      receiver: userId,
    });

    //notify to original sender
    if (req.io && req.socketUserMap) {
      for (const message of messages) {
        const senderSocketId = req.socketUserMap.get(message.sender.toString());
        if (senderSocketId) {
          const updatedMesage = {
            _id: message._id,
            messaheStatus: "read",
          };
          req.to.to(senderSocketId).emit("message_read", updatedMesage);
          await message.save();
        }
      }
    }

    return response(res, 200, "Messages marked as read", updatedMessages);
  } catch (error) {
    console.error("markAsRead Error:", error);
    return response(res, 500, error.message || "Internal server error");
  }
};

// 5. Delete Message
const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = getUserId(req);

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return response(res, 404, "Message not found");
    }

    if (message.sender.toString() !== userId.toString()) {
      return response(res, 403, "Not authorized to delete this message");
    }

    await message.deleteOne();
    //emit socket event
    if (req.io && req.socketUserMap) {
      const receiverSocketId = req.socketUserMap.get(
        message.receiver.toString(),
      );
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("message_deleted", messageId);
      }
    }

    return response(res, 200, "Message deleted successfully");
  } catch (error) {
    console.error("deleteMessage Error:", error);
    return response(res, 500, error.message || "Internal server error");
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getMessages,
  markAsRead,
  deleteMessage,
};
