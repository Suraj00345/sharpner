const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const {uploadFileToCloudinary} = require("../config/cloudinaryConfig");
const response = require("../utils/responseHandler");

// Helper to reliably extract user ID regardless of auth middleware casing
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

    const senderStr = senderId.toString();
    const receiverStr = receiverId.toString();

    // Find or create conversation using reliable $all condition
    let conversation = await Conversation.findOne({
      participants: { $all: [senderStr, receiverStr], $size: 2 },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderStr, receiverStr].sort(),
      });
      await conversation.save();
    }

    let imageOrVideoURL = null;
    let contentType = null;

    if (file) {
      const uploadFile = await uploadFileToCloudinary(file);
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

    // Check if receiver is online via socket room or map
    const isReceiverOnline = req.socketUserMap
      ? req.socketUserMap.has(receiverStr) &&
        req.socketUserMap.get(receiverStr)?.size > 0
      : false;

    const initialStatus =
      messageStatus || (isReceiverOnline ? "delivered" : "sent");

    const message = new Message({
      conversation: conversation._id,
      sender: senderStr,
      receiver: receiverStr,
      content: content?.trim() || null,
      contentType,
      imageOrVideoURL,
      imageOrVideoUrl: imageOrVideoURL, // Backwards compatibility for client
      messageStatus: initialStatus,
    });

    await message.save();

    // Update conversation metadata
    conversation.lastMessage = message._id;
    conversation.unreadCount = (conversation.unreadCount || 0) + 1;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture");

    // Realtime direct room delivery
    if (req.io) {
      req.io.to(receiverStr).emit("receive_message", populatedMessage);
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

    const isParticipant = conversation.participants.some(
      (id) => id.toString() === userId.toString(),
    );

    if (!isParticipant) {
      return response(res, 403, "Not authorized to view this conversation");
    }

    // Find unread message IDs before bulk updating to notify sender
    const unreadMessages = await Message.find({
      conversation: conversationId,
      receiver: userId,
      messageStatus: { $in: ["sent", "delivered"] },
    }).select("_id sender");

    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map((m) => m._id);

      await Message.updateMany(
        { _id: { $in: unreadIds } },
        { $set: { messageStatus: "read" } },
      );

      // Notify the sender that messages have been read
      if (req.io) {
        const otherParticipant = conversation.participants.find(
          (p) => p.toString() !== userId.toString(),
        );
        if (otherParticipant) {
          req.io.to(otherParticipant.toString()).emit("message_status_update", {
            messageIds: unreadIds,
            messageStatus: "read",
            conversationId,
          });
        }
      }

      conversation.unreadCount = 0;
      await conversation.save();
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .sort({ createdAt: 1 });

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

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return response(res, 400, "messageIds array is required");
  }

  try {
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

    if (req.io) {
      for (const message of updatedMessages) {
        const senderId = message.sender?.toString();
        if (senderId) {
          // Emit directly to sender's personal room
          req.io.to(senderId).emit("message_status_update", {
            messageId: message._id,
            messageStatus: "read",
            conversationId: message.conversation,
          });
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

    const receiverId = message.receiver.toString();
    const conversationId = message.conversation;

    await message.deleteOne();

    // Realtime deletion emission matching client listener spec
    if (req.io) {
      req.io.to(receiverId).emit("message_deleted", {
        deletedMessageId: messageId,
        conversationId,
      });
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
