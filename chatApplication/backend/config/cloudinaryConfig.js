const multer = require("multer");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const fs = require("fs");
const path = require("path");

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Ensure temp directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 3. Configure Multer instance
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB to support videos
  },
});

// 4. Upload helper for both images & videos
const uploadFileToCloudinary = (file) => {
  if (!file || !file.path) {
    return Promise.reject(new Error("No file provided for upload"));
  }

  const isVideo = file.mimetype?.startsWith("video");
  const options = {
    resource_type: isVideo ? "video" : "auto",
    folder: "chat_media",
  };

  return new Promise((resolve, reject) => {
    const uploader = isVideo
      ? cloudinary.uploader.upload_large
      : cloudinary.uploader.upload;

    uploader(file.path, options, (error, result) => {
      // Clean up local temp file safely
      fs.unlink(file.path, (unlinkErr) => {
        if (unlinkErr) console.error("Error removing temp file:", unlinkErr);
      });

      if (error) {
        return reject(error);
      }
      resolve(result);
    });
  });
};

// 5. Export single middlewares
const multerMiddleware = upload.single("profilePicture");
const uploadMedia = upload.single("media");

module.exports = {
  uploadFileToCloudinary,
  multerMiddleware,
  uploadMedia,
};