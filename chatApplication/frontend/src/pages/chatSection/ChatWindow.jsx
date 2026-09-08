import React, { useEffect, useRef, useState } from "react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useChatStore } from "../../store/useChatStore";
import useThemeStore from "../../store/useThemeStore";
import useUserStore from "../../store/useUserStore";
import { isToday, isYesterday, format } from "date-fns";

import {
  FaArrowLeft,
  FaLock,
  FaEllipsisH,
  FaVideo,
  FaPaperclip,
  FaPaperPlane,
  FaSmile,
  FaTimes,
} from "react-icons/fa";
import WhatsappImage from "../../images/whatsapp_image.png";
import MessageBubble from "./MessageBubble";

const isValidate = (date) => {
  return date instanceof Date && !isNaN(date.getTime());
};

const ChatWindow = ({ selectedContact, setSelectedContact }) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const typingTimeOutRef = useRef(null);
  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const {
    messages,
    loading,
    sendMessage,
    fetchMessages,
    fetchConversations,
    conversations,
    isUserTyping,
    startTyping,
    stopTyping,
    getUserLastSeen,
    isUserOnline,
    deleteMessage,
    initiSocketListners,
  } = useChatStore();

  const online = isUserOnline(selectedContact?._id);
  const lastSeen = getUserLastSeen(selectedContact?._id);
  const isTyping = isUserTyping(selectedContact?._id);

  // 1. Ensure socket listeners are active on mount
  useEffect(() => {
    initiSocketListners();
  }, [initiSocketListners]);

  const normalizedMessages = Array.isArray(messages)
    ? messages
    : Array.isArray(messages?.data)
      ? messages.data
      : Array.isArray(messages?.messages)
        ? messages.messages
        : [];

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // 2. Select conversation & fetch messages
  useEffect(() => {
    if (!selectedContact?._id) return;

    const conversationList = Array.isArray(conversations?.data)
      ? conversations.data
      : Array.isArray(conversations)
        ? conversations
        : [];

    const conversation = conversationList.find((conv) =>
      conv.participants?.some((p) => (p._id || p) === selectedContact._id),
    );

    if (conversation?._id) {
      fetchMessages(conversation._id);
    } else {
      useChatStore.setState({ messages: [], currentConversation: null });
    }
  }, [selectedContact, conversations, fetchMessages]);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [normalizedMessages]);

  // Typing debounce
  useEffect(() => {
    if (message && selectedContact) {
      startTyping(selectedContact._id);

      if (typingTimeOutRef.current) {
        clearTimeout(typingTimeOutRef.current);
      }
      typingTimeOutRef.current = setTimeout(() => {
        stopTyping(selectedContact._id);
      }, 2000);
    }
    return () => {
      if (typingTimeOutRef.current) {
        clearTimeout(typingTimeOutRef.current);
      }
    };
  }, [message, selectedContact, startTyping, stopTyping]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const clearSelectedFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!selectedContact) return;
    if (!message.trim() && !selectedFile) return;

    try {
      const formData = new FormData();
      formData.append("receiverId", selectedContact._id);

      const status = online ? "delivered" : "sending";
      formData.append("messageStatus", status);

      if (message.trim()) {
        formData.append("content", message.trim());
      }
      if (selectedFile) {
        formData.append("media", selectedFile, selectedFile.name);
      }

      setMessage("");
      clearSelectedFile();
      setShowEmojiPicker(false);

      await sendMessage(formData);
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const renderDateSeparator = (dateObj) => {
    if (!isValidate(dateObj)) return null;

    let dateString;
    if (isToday(dateObj)) {
      dateString = "Today";
    } else if (isYesterday(dateObj)) {
      dateString = "Yesterday";
    } else {
      dateString = format(dateObj, "EEEE, MMMM d");
    }

    return (
      <div className="flex justify-center my-4">
        <span
          className={`px-4 py-1 rounded-full text-xs font-medium ${
            theme === "dark"
              ? "bg-gray-700 text-gray-300"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {dateString}
        </span>
      </div>
    );
  };

  // 1. Sort all messages chronologically
  const sortedMessages = [...normalizedMessages].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
    const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
    return timeA - timeB;
  });

  // 2. Group the sorted messages by date
  const groupedMessages = sortedMessages.reduce((acc, msg) => {
    const rawDate =
      msg.createdAt || msg.timestamp || msg.updatedAt || new Date();
    const date = new Date(rawDate);

    const validDate = isValidate(date) ? date : new Date();
    const dateString = format(validDate, "yyyy-MM-dd");

    if (!acc[dateString]) {
      acc[dateString] = [];
    }
    acc[dateString].push(msg);

    return acc;
  }, {});

  // 3. Sort date sections chronologically (earliest to latest)
  const sortedDateKeys = Object.keys(groupedMessages).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  if (!selectedContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center mx-auto h-screen text-center p-4">
        <div className="max-w-md">
          <img
            src={WhatsappImage}
            alt="chat-app"
            className="w-64 h-auto mx-auto mb-6"
          />
          <h2
            className={`text-2xl font-semibold mb-2 ${
              theme === "dark" ? "text-white" : "text-black"
            }`}
          >
            Select a Conversation to start chatting
          </h2>
          <p
            className={`${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            } mb-6 text-sm`}
          >
            Choose a contact from the list on the left to begin messaging
          </p>
          <p
            className={`${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            } text-xs flex items-center justify-center gap-2`}
          >
            <FaLock className="h-3 w-3" />
            Your personal messages are end-to-end encrypted
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen w-full flex flex-col relative overflow-hidden">
      {/* Header */}
      <div
        className={`p-3 ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700 text-white"
            : "bg-gray-100 border-gray-200 text-gray-800"
        } flex items-center border-b shadow-sm z-10`}
      >
        <button
          className="mr-2 focus:outline-none"
          onClick={() => setSelectedContact(null)}
        >
          <FaArrowLeft className="h-5 w-5" />
        </button>
        <img
          src={selectedContact?.profilePicture}
          alt={selectedContact?.username}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="ml-3 flex-grow">
          <h2 className="font-semibold text-start">
            {selectedContact?.username}
          </h2>
          {isTyping ? (
            <div className="text-xs text-green-500">Typing...</div>
          ) : (
            <p
              className={`text-xs ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {online
                ? "Online"
                : lastSeen
                  ? `Last seen ${format(new Date(lastSeen), "HH:mm")}`
                  : "Offline"}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <button className="focus:outline-none hover:opacity-80">
            <FaVideo className="h-5 w-5" />
          </button>
          <button className="focus:outline-none hover:opacity-80">
            <FaEllipsisH className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className={`flex-1 p-4 overflow-y-auto ${
          theme === "dark" ? "bg-[#191a1a]" : "bg-[#f3ecdb]"
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : sortedDateKeys.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-800"
              }`}
            >
              No messages yet. Start a conversation!
            </p>
          </div>
        ) : (
          sortedDateKeys.map((date) => (
            <React.Fragment key={date}>
              {renderDateSeparator(new Date(date))}
              {groupedMessages[date].map((msg) => (
                <MessageBubble
                  key={msg._id || msg.tempId || `${date}-${msg.content}`}
                  message={msg}
                  theme={theme}
                  currentUser={user}
                  deleteMessage={deleteMessage}
                />
              ))}
            </React.Fragment>
          ))
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Media Attachment Preview */}
      {filePreview && selectedFile && (
        <div
          className={`p-2 px-4 flex items-center gap-3 border-t ${
            theme === "dark"
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-300"
          }`}
        >
          <div className="relative">
            {selectedFile.type?.startsWith("video") ? (
              <video
                src={filePreview}
                className="w-16 h-16 object-cover rounded-md bg-black"
                muted
              />
            ) : (
              <img
                src={filePreview}
                alt="preview"
                className="w-16 h-16 object-cover rounded-md"
              />
            )}
            <button
              type="button"
              onClick={clearSelectedFile}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 text-xs"
            >
              <FaTimes className="w-2.5 h-2.5" />
            </button>
          </div>
          <span className="text-xs text-gray-500 truncate max-w-xs">
            {selectedFile.name}
          </span>
        </div>
      )}

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-16 left-3 z-50 shadow-2xl rounded-2xl overflow-hidden"
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
            lazyLoadEmojis={true}
            searchPlaceHolder="Search emoji..."
            width={340}
            height={420}
          />
        </div>
      )}

      {/* Message Input Footer */}
      <form
        onSubmit={handleSendMessage}
        className={`p-3 border-t flex items-center gap-2 relative ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-gray-100 border-gray-300"
        }`}
      >
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`hover:text-gray-700 dark:hover:text-gray-300 transition-colors ${
            showEmojiPicker ? "text-green-500" : "text-gray-500"
          }`}
        >
          <FaSmile className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <FaPaperclip className="w-5 h-5" />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*"
          className="hidden"
        />

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Type a message..."
          className={`flex-1 px-4 py-2 text-sm rounded-full outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
            theme === "dark"
              ? "bg-gray-700 text-white placeholder-gray-400 focus:bg-gray-600"
              : "bg-white text-black placeholder-gray-500 focus:bg-gray-50 border border-gray-300"
          }`}
        />

        <button
          type="submit"
          disabled={!message.trim() && !selectedFile}
          className={`p-2 rounded-full text-white transition-opacity ${
            !message.trim() && !selectedFile
              ? "opacity-40 cursor-not-allowed bg-green-600"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          <FaPaperPlane className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
