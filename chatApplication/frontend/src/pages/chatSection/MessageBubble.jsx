import React, { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { RxCross2 } from "react-icons/rx";
import {
  FaCheck,
  FaCheckDouble,
  FaSmile,
  FaTrash,
  FaPlus,
  FaCopy,
} from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import { useChatStore } from "../../store/useChatStore";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const MessageBubble = ({ message, theme, currentUser, deleteMessage }) => {
  const [showReactions, setShowReaction] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [copied, setCopied] = useState(false);

  const messageRef = useRef(null);
  const optionsRef = useRef(null);
  const reactionContainerRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Directly consume addReaction from useChatStore
  const { addReaction } = useChatStore();

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setShowOptions(false);
      }

      const inReactionContainer =
        reactionContainerRef.current &&
        reactionContainerRef.current.contains(e.target);
      const inEmojiPicker =
        emojiPickerRef.current && emojiPickerRef.current.contains(e.target);

      if (!inReactionContainer && !inEmojiPicker) {
        setShowReaction(false);
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!message) return null;

  const senderId = message.sender?._id || message.sender;
  const isUserMessage = senderId === currentUser?._id;
  const bubbleClass = isUserMessage ? "chat-end" : "chat-start";

  const bubbleContentClass = isUserMessage
    ? `chat-bubble md:max-w-[50%] min-w-[130px] ${
        theme === "dark" ? "bg-[#144d38] text-white" : "bg-[#d9fdd3] text-black"
      }`
    : `chat-bubble md:max-w-[50%] min-w-[130px] ${
        theme === "dark"
          ? "bg-[#202c33] text-white"
          : "bg-white text-black border border-gray-200"
      }`;

  // Copy message content or media URL to clipboard
  const handleCopyMessage = async () => {
    const textToCopy =
      message.content ||
      message.imageOrVideoURL ||
      message.imageOrVideoUrl ||
      "";

    if (textToCopy) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
          setShowOptions(false);
        }, 1200);
      } catch (error) {
        console.error("Failed to copy message:", error);
      }
    }
  };

  // Core reaction handler
  const handleReact = (emoji) => {
    if (!message._id) return;
    addReaction(message._id, emoji);
    setShowReaction(false);
    setShowEmojiPicker(false);
  };

  // Group existing reactions to show counts
  const rawReactions = Array.isArray(message.reactions)
    ? message.reactions
    : [];
  const groupedReactions = rawReactions.reduce((acc, r) => {
    const emojiChar = typeof r === "string" ? r : r?.emoji;
    const userId =
      typeof r === "object" ? r?.userId || r?.user?._id || r?.user : null;

    if (!emojiChar) return acc;

    if (!acc[emojiChar]) {
      acc[emojiChar] = { count: 0, hasReacted: false };
    }
    acc[emojiChar].count += 1;
    if (userId && currentUser?._id && userId === currentUser._id) {
      acc[emojiChar].hasReacted = true;
    }
    return acc;
  }, {});

  const formattedTime =
    message?.createdAt && !isNaN(new Date(message.createdAt).getTime())
      ? format(new Date(message.createdAt), "HH:mm")
      : format(new Date(), "HH:mm");

  const mediaSource = message.imageOrVideoURL || message.imageOrVideoUrl;

  return (
    <div className={`chat ${bubbleClass} relative my-1`}>
      <div
        className={`${bubbleContentClass} relative group p-2.5`}
        ref={messageRef}
      >
        <div className="flex flex-col gap-1">
          {/* Text Message */}
          {message.contentType === "text" && (
            <p className="mr-6 text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Media / Image Message */}
          {message.contentType === "image" && mediaSource && (
            <div>
              <img
                src={mediaSource}
                alt="attachment"
                className="rounded-lg max-w-xs object-cover mb-1"
              />
              {message.content && (
                <p className="text-sm mt-1">{message.content}</p>
              )}
            </div>
          )}

          {/* Timestamp & Delivery Status Ticks */}
          <div className="self-end flex items-center justify-end gap-1 text-[11px] opacity-65 mt-1">
            <span>{formattedTime}</span>
            {isUserMessage && (
              <span className="flex items-center">
                {(message.messageStatus === "sending" ||
                  message.messageStatus === "send") && <FaCheck size={11} />}
                {message.messageStatus === "delivered" && (
                  <FaCheckDouble size={11} className="text-gray-400" />
                )}
                {message.messageStatus === "read" && (
                  <FaCheckDouble size={11} className="text-[#53bdeb]" />
                )}
              </span>
            )}
          </div>

          {/* Context Options Button */}
          <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowOptions((prev) => !prev);
              }}
              className={`p-1 rounded-full hover:bg-black/10 transition-colors ${
                theme === "dark"
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              <HiDotsVertical size={16} />
            </button>
          </div>

          {/* Options Dropdown Menu */}
          {showOptions && (
            <div
              ref={optionsRef}
              className={`absolute top-7 right-2 py-1 w-28 rounded-lg shadow-xl border z-50 ${
                theme === "dark"
                  ? "bg-[#233138] border-gray-700 text-gray-200"
                  : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              {/* Delete Option (for sender only) */}
              {isUserMessage && (
                <button
                  type="button"
                  onClick={() => {
                    deleteMessage(message?._id);
                    setShowOptions(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <FaTrash size={12} />
                  Delete
                </button>
              )}

              {/* Copy Message Option (Available for both user and receiver) */}
              <button
                type="button"
                onClick={handleCopyMessage}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                {copied ? (
                  <>
                    <FaCheck size={12} className="text-green-500" />
                    <span className="text-green-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <FaCopy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Reaction Wrapper (Hover Button + Quick Bar) */}
          <div
            ref={reactionContainerRef}
            className={`absolute ${
              isUserMessage ? "-left-10" : "-right-10"
            } top-1/2 transform -translate-y-1/2 z-30`}
          >
            {/* Hover Trigger */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowReaction((prev) => !prev);
                setShowEmojiPicker(false);
              }}
              className={`p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity ${
                theme === "dark"
                  ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                  : "bg-white hover:bg-gray-100 text-gray-600"
              }`}
            >
              <FaSmile size={14} />
            </button>

            {/* Quick Reactions Bar */}
            {showReactions && (
              <div
                className={`absolute -top-12 ${
                  isUserMessage ? "right-0" : "left-0"
                } flex items-center rounded-full px-2.5 py-1 gap-1 shadow-xl border z-50 ${
                  theme === "dark"
                    ? "bg-[#233138] border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                {QUICK_REACTIONS.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleReact(emoji)}
                    className="hover:scale-125 transition-transform p-1 text-base leading-none"
                  >
                    {emoji}
                  </button>
                ))}

                <div
                  className={`w-[1px] h-4 mx-1 ${
                    theme === "dark" ? "bg-gray-600" : "bg-gray-300"
                  }`}
                />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEmojiPicker((prev) => !prev);
                  }}
                  className={`p-1.5 rounded-full hover:scale-110 transition-transform ${
                    theme === "dark"
                      ? "text-gray-300 hover:bg-gray-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <FaPlus size={11} />
                </button>
              </div>
            )}
          </div>

          {/* Full Emoji Picker Modal */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className={`absolute bottom-full mb-3 ${
                isUserMessage ? "right-0" : "left-0"
              } z-50 shadow-2xl rounded-2xl overflow-hidden`}
            >
              <button
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10 p-1"
              >
                <RxCross2 size={16} />
              </button>
              <EmojiPicker
                onEmojiClick={(emojiData) => handleReact(emojiData.emoji)}
                theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                lazyLoadEmojis={true}
                searchPlaceHolder="Search emoji..."
                width={300}
                height={380}
              />
            </div>
          )}

          {/* Render Active Reactions Under Bubble */}
          {Object.keys(groupedReactions).length > 0 && (
            <div
              className={`absolute -bottom-3 ${
                isUserMessage ? "right-2" : "left-2"
              } flex flex-wrap items-center gap-1 z-10`}
            >
              {Object.entries(groupedReactions).map(([emoji, data]) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleReact(emoji)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs shadow-sm border transition-all ${
                    data.hasReacted
                      ? theme === "dark"
                        ? "bg-[#1f3c32] border-green-500 text-white font-semibold"
                        : "bg-[#d9fdd3] border-green-600 text-black font-semibold"
                      : theme === "dark"
                        ? "bg-[#202c33] border-gray-700 text-white"
                        : "bg-white border-gray-200 text-black"
                  }`}
                >
                  <span>{emoji}</span>
                  {data.count > 1 && (
                    <span className="text-[10px] opacity-75">{data.count}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
