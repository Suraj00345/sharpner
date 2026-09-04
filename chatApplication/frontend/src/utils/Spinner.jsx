import { motion } from "framer-motion";
import { FaSpinner } from "react-icons/fa";

export default function Spinner({
  size = "medium",
  color = "light",
  text = "Loading...",
  showText = true,
  className = "",
}) {
  const sizeClasses = {
    small: "text-sm",
    medium: "text-xl",
    large: "text-3xl",
  };

  const colorClasses = {
    light: "text-white",
    dark: "text-gray-800",
    primary: "text-blue-600",
  };

  const selectedSize = sizeClasses[size] || sizeClasses.medium;
  const selectedColor = colorClasses[color] || colorClasses.light;

  return (
    <div
      role="status"
      aria-label={text}
      className={`inline-flex items-center justify-center space-x-2 ${className}`}
    >
      <motion.div
        className={`${selectedSize} ${selectedColor} inline-flex`}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
      >
        <FaSpinner />
      </motion.div>

      {showText && text && (
        <span className={`${selectedColor} text-sm font-medium`}>{text}</span>
      )}

      {/* Screen reader fallback when text is hidden */}
      {!showText && <span className="sr-only">{text}</span>}
    </div>
  );
}