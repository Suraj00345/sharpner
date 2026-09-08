import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useThemeStore from "../store/useThemeStore";
import useLayoutStore from "../store/useLayoutStore";
import useUserStore from "../store/useUserStore";
import { FaWhatsapp, FaCircleNotch, FaUser, FaCog } from "react-icons/fa";
import { motion } from "framer-motion";

const SideBar = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { activeTab, setActiveTab, selectedContact } = useLayoutStore();

  // Listen to window resizes efficiently
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync active tab state with current router path
  useEffect(() => {
    const pathMap = {
      "/": "chats",
      "/status": "status",
      "/user-profile": "profile",
      "/setting": "setting",
    };
    if (pathMap[location.pathname]) {
      setActiveTab(pathMap[location.pathname]);
    }
  }, [location.pathname, setActiveTab]);

  // Hide sidebar on mobile when a chat contact is selected
  if (isMobile && selectedContact) {
    return null;
  }

  const navItems = [
    { id: "chats", path: "/", icon: FaWhatsapp, label: "Chats" },
    { id: "status", path: "/status", icon: FaCircleNotch, label: "Status" },
    { id: "setting", path: "/setting", icon: FaCog, label: "Settings" },
    { id: "profile", path: "/user-profile", icon: FaUser, label: "Profile" },
  ];

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`flex ${
        isMobile
          ? "fixed bottom-0 left-0 right-0 h-16 flex-row justify-around items-center border-t z-40"
          : "w-16 flex-col items-center py-6 h-screen border-r"
      } ${
        theme === "dark"
          ? "bg-gray-900 border-gray-800 text-gray-300"
          : "bg-gray-100 border-gray-200 text-gray-600"
      }`}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <Link
            key={item.id}
            to={item.path}
            title={item.label}
            className={`p-3 rounded-full transition-all duration-200 ${
              isMobile ? "" : "mb-4"
            } ${
              isActive
                ? theme === "dark"
                  ? "bg-gray-800 text-green-400 shadow-sm"
                  : "bg-white text-green-600 shadow-sm"
                : theme === "dark"
                  ? "hover:bg-gray-800 hover:text-gray-100"
                  : "hover:bg-gray-200 hover:text-gray-900"
            }`}
          >
            <Icon className="h-6 w-6" />
          </Link>
        );
      })}
    </motion.aside>
  );
};

export default SideBar;
