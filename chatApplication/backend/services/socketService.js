const { Server } = require("socket.io");
const User = require("../models/User");
const Message = require("../models/Message");

// Track online users: userId -> Set of socket IDs (multi-tab support)
const onlineUsers = new Map();

// Track typing status: userId -> { conversationId: timeoutRef }
const typingUsers = new Map();

const initializeSocket = (server) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
  ].filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
          return callback(null, true);
        }
        return callback(new Error("CORS origin not allowed by Socket.io"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },
    transports: ["polling", "websocket"], // Prevents immediate WebSocket closure
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", async (socket) => {
    let currentUserId = null;

    // Helper: Register user connection
    const registerUserConnection = async (userId) => {
      if (!userId) return;
      currentUserId = userId.toString();

      if (!onlineUsers.has(currentUserId)) {
        onlineUsers.set(currentUserId, new Set());
      }
      onlineUsers.get(currentUserId).add(socket.id);

      // Join room named after userId (enables io.to(userId).emit())
      socket.join(currentUserId);

      try {
        await User.findByIdAndUpdate(currentUserId, {
          isOnline: true,
          lastSeen: new Date(),
        });
      } catch (err) {
        console.error("DB update error on connect:", err);
      }

      io.emit("user_status", { userId: currentUserId, isOnline: true });
    };

    // 1. Check handshake auth first (preferred)
    const handshakeUserId = socket.handshake.auth?.userId;
    if (handshakeUserId) {
      await registerUserConnection(handshakeUserId);
    }

    // 2. Fallback / explicit connect event
    socket.on("user_connected", async (connectingUserId) => {
      await registerUserConnection(connectingUserId);
    });

    // 3. Query User Online Status
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

    // 4. Real-time Direct Message Forwarding
    socket.on("send_message", (message) => {
      try {
        const receiverId =
          message?.receiver?._id?.toString() ||
          message?.receiverId?._id?.toString() ||
          message?.receiverId ||
          message?.receiver;

        if (receiverId) {
          // Emits to all active sockets of the receiver in their personal room
          io.to(receiverId.toString()).emit("receive_message", message);
        }
      } catch (error) {
        console.error("Error sending message via socket:", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    // 5. Message Read Notification
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

    // 6. Typing Indicators
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!currentUserId || !conversationId || !receiverId) return;

      if (!typingUsers.has(currentUserId)) {
        typingUsers.set(currentUserId, {});
      }

      const userTimeouts = typingUsers.get(currentUserId);
      if (userTimeouts[conversationId]) {
        clearTimeout(userTimeouts[conversationId]);
      }

      userTimeouts[conversationId] = setTimeout(() => {
        delete userTimeouts[conversationId];
        io.to(receiverId.toString()).emit("user_typing", {
          userId: currentUserId,
          conversationId,
          isTyping: false,
        });
      }, 3000);

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

    // 7. Message Emoji Reactions
    socket.on(
      "add_reaction",
      async ({ messageId, emoji, userId: reactionUserId }) => {
        try {
          const message = await Message.findById(messageId);
          if (!message) return;

          const existingIndex = message.reactions.findIndex(
            (r) => r.user?.toString() === reactionUserId.toString(),
          );

          if (existingIndex > -1) {
            const existing = message.reactions[existingIndex];
            if (existing.emoji === emoji) {
              message.reactions.splice(existingIndex, 1);
            } else {
              message.reactions[existingIndex].emoji = emoji;
            }
          } else {
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

          const sId =
            populatedMessage.sender?._id?.toString() ||
            populatedMessage.sender?.toString();
          const rId =
            populatedMessage.receiver?._id?.toString() ||
            populatedMessage.receiver?.toString();

          if (sId) io.to(sId).emit("reaction_update", reactionPayload);
          if (rId) io.to(rId).emit("reaction_update", reactionPayload);
        } catch (error) {
          console.error("Error handling reaction:", error);
        }
      },
    );

    // 8. Disconnection Handler
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

        if (!onlineUsers.has(currentUserId)) {
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
