import React, { useState } from "react";
import useLayoutStore from "../../store/useLayoutStore";
import useThemeStore from "../../store/useThemeStore";
import useUserStore from "../../store/useUserStore";
import { FaPlus, FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import formatTimestamp from "../../utils/formatTime";

const ChatList = ({ contacts = [] }) => {
  const setSelectedContact = useLayoutStore(
    (state) => state.setSelectedContact,
  );
  const selectedContact = useLayoutStore((state) => state.selectedContact);

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const [searchTerms, setSearchTerms] = useState("");

  const filteredContacts = contacts?.filter((contact) =>
    (contact?.username || contact?.name || "")
      .toLowerCase()
      .includes(searchTerms.toLowerCase()),
  );

  return (
    <div
      className={`w-full border-r h-screen transition-colors duration-200 ${
        theme === "dark"
          ? "bg-gray-900 border-gray-800 text-gray-100"
          : "bg-white border-gray-200 text-gray-800"
      }`}
    >
      {/* Header */}
      <div className="p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Chats</h2>
        <button
          title="New Chat"
          className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-sm"
        >
          <FaPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="px-4 pb-2">
        <div className="relative">
          <FaSearch
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
              theme === "dark"
                ? "bg-gray-800 text-white border-gray-700 placeholder-gray-400"
                : "bg-gray-100 text-gray-900 border-gray-200 placeholder-gray-500"
            }`}
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="overflow-y-auto h-[calc(100vh-120px)] divide-y divide-transparent">
        {filteredContacts.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No contacts found
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const isSelected = selectedContact?._id === contact._id;
            const unreadCount =
              contact?.unreadCount || contact?.conversation?.unreadCount || 0;
            const lastMessageText = contact?.conversation?.lastMessage?.content;

            return (
              <motion.div
                key={contact._id}
                onClick={() => setSelectedContact(contact)}
                className={`p-3 flex items-center cursor-pointer transition-colors duration-150 ${
                  theme === "dark"
                    ? isSelected
                      ? "bg-gray-800 text-white"
                      : "hover:bg-gray-800/60 text-gray-300"
                    : isSelected
                      ? "bg-gray-200 text-gray-900"
                      : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {/* Contact Avatar */}
                <div className="relative w-12 h-12 mr-3 flex-shrink-0">
                  <img
                    src={contact.profilePicture || "/default-avatar.png"}
                    alt={contact.username || contact.name}
                    className="w-full h-full rounded-full object-cover border border-gray-300/20"
                  />
                  {contact.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                  )}
                </div>

                {/* Contact Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-semibold truncate">
                      {contact.username || contact.name}
                    </h3>
                    {contact.conversation?.lastMessage?.createdAt && (
                      <span
                        className={`text-xs ml-2 flex-shrink-0 ${
                          unreadCount > 0
                            ? "text-green-500 font-semibold"
                            : theme === "dark"
                              ? "text-gray-400"
                              : "text-gray-500"
                        }`}
                      >
                        {formatTimestamp(
                          contact?.conversation?.lastMessage?.createdAt,
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-0.5">
                    {/* Last Message Preview */}
                    <p
                      className={`text-xs truncate mr-2 ${
                        unreadCount > 0
                          ? theme === "dark"
                            ? "font-semibold text-gray-100"
                            : "font-semibold text-gray-900"
                          : theme === "dark"
                            ? "text-gray-400"
                            : "text-gray-500"
                      }`}
                    >
                      {lastMessageText || "No messages yet"}
                    </p>

                    {/* Unread Count Badge */}
                    {unreadCount > 0 &&
                      contact?.conversation?.lastMessage?.receiver ===
                        user?._id && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center flex-shrink-0 transition-colors ${
                            theme === "dark"
                              ? "bg-green-600 text-gray-100 shadow-sm"
                              : "bg-green-500 text-white shadow-sm"
                          }`}
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;
