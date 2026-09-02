const { Server } = require("socket.io");
const User = require("../models/User");
const Message = require("../models/Message");

// Track online users count: userId -> set of socket IDs (multi-tab support)
const onlineUsers = new Map();

// Track typing status: userId -> { conversationId: timeoutRef }
const typingUsers = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },
    pingTimeout: 60000,
  });

  io.on("connection", (socket) => {
    let currentUserId = null;

    // 1. User Connects & Joins Personal Room
    socket.on("user_connected", async (connectingUserId) => {
      try {
        if (!connectingUserId) return;
        currentUserId = connectingUserId.toString();

        // Manage multi-device socket tracking
        if (!onlineUsers.has(currentUserId)) {
          onlineUsers.set(currentUserId, new Set());
        }
        onlineUsers.get(currentUserId).add(socket.id);

        // Join personal room for room-targeted emits
        socket.join(currentUserId);

        // Update database status
        await User.findByIdAndUpdate(currentUserId, {
          isOnline: true,
          lastSeen: new Date(),
        });

        // Broadcast online status to everyone
        io.emit("user_status", { userId: currentUserId, isOnline: true });
      } catch (error) {
        console.error("Error handling user connection:", error);
      }
    });

    // 2. Query User Online Status
    socket.on("get_user_status", (requestedUserId, callback) => {
      const isOnline = onlineUsers.has(requestedUserId?.toString());
      if (typeof callback === "function") {
        callback({
          userId: requestedUserId,
          isOnline,
          lastSeen: isOnline ? new Date() : null,
        });
      }
    });

    // 3. Real-time Direct Message Forwarding
    socket.on("send_message", (message) => {
      try {
        const receiverId =
          message?.receiver?._id?.toString() || message?.receiver;
        if (receiverId) {
          // Send to all active sockets of the receiver
          io.to(receiverId).emit("receive_message", message);
        }
      } catch (error) {
        console.error("Error sending message via socket:", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    // 4. Message Read Notification
    socket.on("message_read", async ({ messageIds, senderId }) => {
      try {
        if (!Array.isArray(messageIds) || messageIds.length === 0) return;

        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { messageStatus: "read" } },
        );

        if (senderId) {
          io.to(senderId.toString()).emit("message_status_update", {
            messageIds,
            messageStatus: "read",
          });
        }
      } catch (error) {
        console.error("Error updating message read status:", error);
      }
    });

    // 5. Typing Indicators
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!currentUserId || !conversationId || !receiverId) return;

      if (!typingUsers.has(currentUserId)) {
        typingUsers.set(currentUserId, {});
      }

      const userTimeouts = typingUsers.get(currentUserId);

      // Clear existing timeout for this conversation
      if (userTimeouts[conversationId]) {
        clearTimeout(userTimeouts[conversationId]);
      }

      // Auto-stop typing indicator after 3 seconds of inactivity
      userTimeouts[conversationId] = setTimeout(() => {
        delete userTimeouts[conversationId];
        io.to(receiverId.toString()).emit("user_typing", {
          userId: currentUserId,
          conversationId,
          isTyping: false,
        });
      }, 3000);

      // Notify receiver
      io.to(receiverId.toString()).emit("user_typing", {
        userId: currentUserId,
        conversationId,
        isTyping: true,
      });
    });

    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      if (!currentUserId || !conversationId || !receiverId) return;

      if (typingUsers.has(currentUserId)) {
        const userTimeouts = typingUsers.get(currentUserId);
        if (userTimeouts[conversationId]) {
          clearTimeout(userTimeouts[conversationId]);
          delete userTimeouts[conversationId];
        }
      }

      io.to(receiverId.toString()).emit("user_typing", {
        userId: currentUserId,
        conversationId,
        isTyping: false,
      });
    });

    // 6. Message Emoji Reactions
    socket.on("add_reaction", async ({ messageId, emoji, reactionUserId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const existingIndex = message.reactions.findIndex(
          (r) => r.user.toString() === reactionUserId.toString(),
        );

        if (existingIndex > -1) {
          const existing = message.reactions[existingIndex];
          if (existing.emoji === emoji) {
            // Remove reaction if same emoji toggled
            message.reactions.splice(existingIndex, 1);
          } else {
            // Update emoji
            message.reactions[existingIndex].emoji = emoji;
          }
        } else {
          // Add new reaction
          message.reactions.push({ user: reactionUserId, emoji });
        }

        await message.save();

        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "username profilePicture")
          .populate("receiver", "username profilePicture")
          .populate("reactions.user", "username");

        const reactionPayload = {
          messageId,
          reactions: populatedMessage.reactions,
        };

        // Notify both participants
        io.to(populatedMessage.sender._id.toString()).emit(
          "reaction_update",
          reactionPayload,
        );
        if (populatedMessage.receiver) {
          io.to(populatedMessage.receiver._id.toString()).emit(
            "reaction_update",
            reactionPayload,
          );
        }
      } catch (error) {
        console.error("Error handling reaction:", error);
      }
    });

    // 7. Disconnection Handler
    const handleDisconnect = async () => {
      if (!currentUserId) return;

      try {
        const userSockets = onlineUsers.get(currentUserId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            onlineUsers.delete(currentUserId);
          }
        }

        // Only mark offline if all devices/tabs are disconnected
        if (!onlineUsers.has(currentUserId)) {
          // Clear typing timeouts
          if (typingUsers.has(currentUserId)) {
            const userTimeouts = typingUsers.get(currentUserId);
            Object.keys(userTimeouts).forEach((key) =>
              clearTimeout(userTimeouts[key]),
            );
            typingUsers.delete(currentUserId);
          }

          const lastSeen = new Date();
          await User.findByIdAndUpdate(currentUserId, {
            isOnline: false,
            lastSeen,
          });

          io.emit("user_status", {
            userId: currentUserId,
            isOnline: false,
            lastSeen,
          });
        }

        socket.leave(currentUserId);
        console.log(`User ${currentUserId} socket ${socket.id} disconnected`);
      } catch (error) {
        console.error("Error handling disconnection:", error);
      }
    };

    socket.on("disconnect", handleDisconnect);
  });

  io.socketUserMap = onlineUsers;
  return io;
};

module.exports = initializeSocket;
