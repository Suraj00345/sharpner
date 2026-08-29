const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please fill a valid email address",
      ],
    },
    emailOtp: {
      type: String,
    },
    emailOtpExpiry: {
      type: Date,
    },
    ProfilePicture: {
      type: String,
    },
    about: {
      type: String,
    },
    lastseen: {
      type: Date,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    agreed: {
      type: Boolean,
      default: false,
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple users to have no phone number
      trim: true,
    },
    phoneSuffix: {
      type: String,
      unique: false,
      trim: true,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
