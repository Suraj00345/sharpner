import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useThemeStore from "../store/useThemeStore";
import SideBar from "./SideBar";
import { AnimatePresence, motion } from "framer-motion";
import ChatWindow from "../pages/chatSection/ChatWindow";
import useLayoutStore from "../store/useLayoutStore";

const Layout = ({
  children,
  isThemeDialogOpen,
  toggleThemeDialog,
  isStatusPreviewOpen,
  statusPreviewContent,
}) => {
  // Correct Zustand selectors
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);

  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`min-h-screen ${
        theme === "dark" ? "bg-[#111b21] text-white" : "bg-gray-100 text-black"
      } flex relative overflow-hidden`}
    >
      {/* Desktop Sidebar */}
      {!isMobile && <SideBar />}

      <div
        className={`flex-1 flex h-screen overflow-hidden ${
          isMobile ? "flex-col" : "flex-row"
        }`}
      >
        <AnimatePresence initial={false}>
          {/* Chat List Column */}
          {(!selectedContact || !isMobile) && (
            <motion.div
              key="chatList"
              initial={{ x: isMobile ? "-100%" : 0 }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween" }}
              className={`w-full md:w-2/5 lg:w-1/3 h-full border-r ${
                theme === "dark" ? "border-gray-800" : "border-gray-200"
              } ${isMobile ? "pb-16" : ""}`}
            >
              {children}
            </motion.div>
          )}

          {/* Chat Window Column */}
          {(selectedContact || !isMobile) && (
            <motion.div
              key="chatWindow"
              initial={{ x: isMobile ? "100%" : 0 }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween" }}
              className="w-full md:flex-1 h-full"
            >
              <ChatWindow
                selectedContact={selectedContact}
                setSelectedContact={setSelectedContact}
                isMobile={isMobile}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Bottom Sidebar Navigation */}
      {isMobile && <SideBar />}

      {/* Theme Dialog */}
      {isThemeDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div
            className={`p-6 rounded-lg shadow-lg max-w-sm w-full ${
              theme === "dark" ? "bg-[#202c33] text-white" : "bg-white text-black"
            }`}
          >
            <h2 className="text-2xl font-semibold mb-4">Choose a theme</h2>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={theme === "light"}
                  onChange={() => setTheme("light")}
                  className="form-radio text-emerald-500 h-4 w-4"
                />
                <span>Light</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={theme === "dark"}
                  onChange={() => setTheme("dark")}
                  className="form-radio text-emerald-500 h-4 w-4"
                />
                <span>Dark</span>
              </label>
            </div>
            <button
              onClick={toggleThemeDialog}
              className="mt-6 w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 transition duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Status Preview Modal */}
      {isStatusPreviewOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          {statusPreviewContent}
        </div>
      )}
    </div>
  );
};

export default Layout;