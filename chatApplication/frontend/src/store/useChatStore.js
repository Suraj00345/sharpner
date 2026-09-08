import { create } from "zustand";
import { getSocket } from "../services/chat.service";
import axiosInstance from "../services/url.service";

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  currentUser: null,
  messages: [],
  loading: false,
  error: null,
  onlineUsers: new Map(),
  typingUsers: new Map(),

  setCurrentUser: (user) => set({ currentUser: user }),

  initiSocketListners: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off("receive_message");
    socket.off("user_typing");
    socket.off("user_status");
    socket.off("message_send");
    socket.off("message_status_update");
    socket.off("reaction_update");
    socket.off("message_error");
    socket.off("message_deleted");

    socket.on("receive_message", (message) => {
      get().receiveMessage(message);
    });

    socket.on("message_send", (message) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === message._id || msg._id === message.tempId
            ? { ...message }
            : msg,
        ),
      }));
    });

    socket.on("message_status_update", ({ messageId, messageStatus }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, messageStatus } : msg,
        ),
      }));
    });

    socket.on("reaction_update", ({ messageId, reactions }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg,
        ),
      }));
    });

    socket.on("message_deleted", ({ deletedMessageId }) => {
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== deletedMessageId),
      }));
    });

    socket.on("message_error", (error) => {
      console.error("Message error:", error);
    });

    socket.on("user_typing", ({ userId, conversationId, isTyping }) => {
      set((state) => {
        const newTypingUsers = new Map(state.typingUsers);
        if (!newTypingUsers.has(conversationId)) {
          newTypingUsers.set(conversationId, new Set());
        }
        const typingSet = newTypingUsers.get(conversationId);
        if (isTyping) {
          typingSet.add(userId);
        } else {
          typingSet.delete(userId);
        }
        return { typingUsers: newTypingUsers };
      });
    });

    socket.on("user_status", ({ userId, isOnline, lastseen }) => {
      set((state) => {
        const newOnlineUsers = new Map(state.onlineUsers);
        newOnlineUsers.set(userId, { isOnline, lastseen });
        return { onlineUsers: newOnlineUsers };
      });
    });

    const { conversations, currentUser } = get();
    const list = Array.isArray(conversations?.data)
      ? conversations.data
      : Array.isArray(conversations)
        ? conversations
        : [];

    if (list.length > 0 && currentUser?._id) {
      list.forEach((conv) => {
        const otherUser = conv.participants?.find(
          (p) => (p._id || p) !== currentUser._id,
        );
        const targetId = otherUser?._id || otherUser;
        if (targetId) {
          socket.emit("get_user_status", targetId, (status) => {
            if (status) {
              set((state) => {
                const newOnlineUsers = new Map(state.onlineUsers);
                newOnlineUsers.set(targetId, status);
                return { onlineUsers: newOnlineUsers };
              });
            }
          });
        }
      });
    }
  },

  fetchConversations: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/chat/conversations");
      set({ conversations: data, loading: false });
      get().initiSocketListners();
      return data;
    } catch (error) {
      set({
        error:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch conversations",
        loading: false,
      });
      return null;
    }
  },

  fetchMessages: async (conversationId) => {
    if (!conversationId) return [];

    set({ loading: true, error: null });

    try {
      const response = await axiosInstance.get(
        `/chat/conversations/${conversationId}/messages`,
      );

      const messageArray = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];

      set({
        messages: messageArray,
        currentConversation: conversationId,
        loading: false,
      });

      get().markMessagesAsRead();
      return messageArray;
    } catch (error) {
      set({
        error:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch messages",
        loading: false,
      });
      return [];
    }
  },

  sendMessage: async (formData) => {
    const { currentUser, conversations, currentConversation } = get();

    const senderId = formData.get("senderId") || currentUser?._id;
    const receiverId = formData.get("receiverId");
    const media = formData.get("media");
    const content = formData.get("content");

    if (!formData.has("senderId") && senderId) {
      formData.append("senderId", senderId);
    }

    const list = Array.isArray(conversations?.data)
      ? conversations.data
      : Array.isArray(conversations)
        ? conversations
        : [];

    let conversationId = currentConversation;
    if (!conversationId && list.length > 0) {
      const conversation = list.find((conv) =>
        conv.participants?.some((p) => (p._id || p) === receiverId),
      );
      if (conversation) {
        conversationId = conversation._id;
        set({ currentConversation: conversationId });
      }
    }

    // Determine content type accurately for image or video
    let contentType = "text";
    let previewUrl = null;

    if (media && typeof media !== "string") {
      previewUrl = URL.createObjectURL(media);
      contentType = media.type?.startsWith("video") ? "video" : "image";
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      sender: { _id: senderId },
      receiverId: { _id: receiverId },
      conversation: conversationId,
      imageOrVideoUrl: previewUrl,
      imageOrVideoURL: previewUrl,
      content: content || "",
      contentType,
      createdAt: new Date().toISOString(),
      messageStatus: "sending",
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    try {
      // Allow browser to calculate boundary headers automatically for multipart FormData
      const { data } = await axiosInstance.post("/chat/send-message", formData);

      const messageData = data?.data || data;

      // Revoke local blob to prevent memory leaks once real Cloudinary URL returns
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId
            ? {
                ...messageData,
                imageOrVideoUrl:
                  messageData.imageOrVideoUrl || messageData.imageOrVideoURL,
                imageOrVideoURL:
                  messageData.imageOrVideoURL || messageData.imageOrVideoUrl,
              }
            : msg,
        ),
      }));
      return messageData;
    } catch (error) {
      console.error("Error sending message:", error);
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? { ...msg, messageStatus: "failed" } : msg,
        ),
        error: error?.response?.data?.message || error?.message,
      }));
      throw error;
    }
  },

  receiveMessage: async (message) => {
    if (!message) return;

    const { currentConversation, currentUser, messages } = get();

    const messageExists = messages.some((msg) => msg._id === message._id);
    if (messageExists) return;

    const incomingConvId = String(
      message.conversation?._id || message.conversation || "",
    );
    const activeConvId = String(
      currentConversation?._id || currentConversation || "",
    );

    const formattedMessage = {
      ...message,
      imageOrVideoUrl: message.imageOrVideoUrl || message.imageOrVideoURL,
      imageOrVideoURL: message.imageOrVideoURL || message.imageOrVideoUrl,
    };

    if (incomingConvId && incomingConvId === activeConvId) {
      set((state) => ({
        messages: [...state.messages, formattedMessage],
      }));

      const receiverId =
        message.receiver?._id || message.receiverId?._id || message.receiverId;
      if (receiverId === currentUser?._id) {
        get().markMessagesAsRead();
      }
    }

    set((state) => {
      const isDataObj = Boolean(state.conversations?.data);
      const list = isDataObj
        ? state.conversations.data
        : state.conversations || [];

      const updatedConversations = list.map((conv) => {
        if (String(conv._id) === incomingConvId) {
          const receiverId =
            message.receiver?._id ||
            message.receiverId?._id ||
            message.receiverId;
          return {
            ...conv,
            lastMessage: formattedMessage,
            unreadCount:
              receiverId === currentUser?._id && incomingConvId !== activeConvId
                ? (conv.unreadCount || 0) + 1
                : conv.unreadCount || 0,
          };
        }
        return conv;
      });

      return {
        conversations: isDataObj
          ? { ...state.conversations, data: updatedConversations }
          : updatedConversations,
      };
    });
  },

  markMessagesAsRead: async () => {
    const { messages, currentUser } = get();
    if (!messages.length || !currentUser) return;

    const unreadIds = messages
      .filter((msg) => {
        const receiverId =
          msg.receiver?._id || msg.receiverId?._id || msg.receiverId;
        return msg.messageStatus !== "read" && receiverId === currentUser._id;
      })
      .map((msg) => msg._id)
      .filter((id) => id && !String(id).startsWith("temp-"));

    if (unreadIds.length === 0) return;

    try {
      await axiosInstance.put("/chat/messages/read", {
        messageIds: unreadIds,
      });

      set((state) => ({
        messages: state.messages.map((msg) =>
          unreadIds.includes(msg._id) ? { ...msg, messageStatus: "read" } : msg,
        ),
      }));

      const socket = getSocket();
      if (socket) {
        const firstSender = messages[0]?.sender?._id || messages[0]?.sender;
        socket.emit("message_read", {
          messageIds: unreadIds,
          senderId: firstSender,
        });
      }
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/chat/messages/${messageId}`);
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
      }));
      return true;
    } catch (error) {
      console.error("Error deleting message:", error);
      set({ error: error.response?.data?.message || error.message });
      return false;
    }
  },

  addReaction: async (messageId, emoji) => {
    const socket = getSocket();
    const { currentUser } = get();
    if (socket && currentUser) {
      socket.emit("add_reaction", {
        messageId,
        emoji,
        userId: currentUser._id,
      });
    }
  },

  startTyping: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();
    if (socket && currentConversation && receiverId) {
      socket.emit("typing_start", {
        conversationId: currentConversation,
        receiverId,
      });
    }
  },

  stopTyping: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();
    if (socket && currentConversation && receiverId) {
      socket.emit("typing_stop", {
        conversationId: currentConversation,
        receiverId,
      });
    }
  },

  isUserTyping: (userId) => {
    const { typingUsers, currentConversation } = get();
    if (
      !currentConversation ||
      !typingUsers.has(currentConversation) ||
      !userId
    ) {
      return false;
    }
    return typingUsers.get(currentConversation).has(userId);
  },

  isUserOnline: (userId) => {
    if (!userId) return false;
    const { onlineUsers } = get();
    return onlineUsers.get(userId)?.isOnline || false;
  },

  getUserLastSeen: (userId) => {
    if (!userId) return null;
    const { onlineUsers } = get();
    return onlineUsers.get(userId)?.lastseen || null;
  },

  cleanup: () => {
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      onlineUsers: new Map(),
      typingUsers: new Map(),
    });
  },
}));
