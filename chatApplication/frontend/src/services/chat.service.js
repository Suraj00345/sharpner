import { io } from "socket.io-client";
import useUserStore from "../store/useUserStore";

let socket = null;

// Normalize URL: Strip trailing '/api' or '/' so socket connects to host root
const getSocketServerUrl = () => {
  const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  return rawUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
};

export const initializeSocket = () => {
  if (socket?.connected) return socket;

  const user = useUserStore.getState().user;
  if (!user?._id) return null; // Don't initiate until user is authenticated

  const SERVER_URL = getSocketServerUrl();

  socket = io(SERVER_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    autoConnect: true,
    auth: {
      userId: user._id,
    },
  });

  // Connection events
  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    const currentUser = useUserStore.getState().user;
    if (currentUser?._id) {
      socket.emit("user_connected", currentUser._id);
    }
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};