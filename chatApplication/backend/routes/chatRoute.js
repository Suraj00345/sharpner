const express = require("express");
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");
const { uploadMedia } = require("../config/cloudinaryConfig");

const router = express.Router();

// Multer error handling wrapper
const handleUpload = (req, res, next) => {
  uploadMedia(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload error",
      });
    }
    next();
  });
};

// Conversations
router.get("/conversations", authMiddleware, chatController.getConversation);
router.get("/conversations/:conversationId/messages", authMiddleware, chatController.getMessages);

// Messages
router.post("/send-message", authMiddleware, handleUpload, chatController.sendMessage);
router.put("/messages/read", authMiddleware, chatController.markAsRead);
router.delete("/messages/:messageId", authMiddleware, chatController.deleteMessage);

module.exports = router;