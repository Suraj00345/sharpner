import React from "react";
import { motion } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";

export default function Loader({ progress = 0 }) {
  const isDeterminate = progress > 0;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-400 to-blue-500 flex flex-col items-center justify-center z-50">
      {/* Animated App Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          duration: 0.5,
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-lg"
      >
        <FaWhatsapp className="w-16 h-16 text-green-500" />
      </motion.div>

      {/* Progress Bar Container */}
      <div className="w-64 bg-white/30 rounded-full h-2 mb-4 overflow-hidden backdrop-blur-sm">
        {isDeterminate ? (
          <motion.div
            className="bg-white h-full rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        ) : (
          /* Indeterminate loading bar when no progress value is provided */
          <motion.div
            className="bg-white h-full rounded-full w-1/3"
            animate={{ x: ["-100%", "300%"] }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              ease: "easeInOut",
            }}
          />
        )}
      </div>

      {/* Progress Text */}
      <p className="text-white text-lg font-semibold tracking-wide">
        {isDeterminate ? `Loading... ${progress}%` : "Loading..."}
      </p>
    </div>
  );
}
