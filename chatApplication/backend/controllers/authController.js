const User = require("../models/User");
const otpGenerate = require("../utils/otpGenerator");
const response = require("../utils/responseHandler");
const generateToken = require("../utils/generateTokens");
const sendOtpToEmail = require("../services/emailService");
const { uplaodFileToCloudinary } = require("../config/cloudinaryConfig");
const Conversation = require("../models/Conversation");

// Send OTP (Email or Phone)
const sendOTP = async (req, res) => {
  const { phoneNumber, phoneSuffix, email } = req.body;

  try {
    const otp = otpGenerate();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // =========================
    // EMAIL OTP FLOW
    // =========================
    if (email) {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail) {
        return response(res, 400, "Email is required");
      }

      let user = await User.findOne({ email: cleanEmail });

      if (!user) {
        user = new User({ email: cleanEmail });
      }

      user.emailOtp = otp;
      user.emailOtpExpiry = expiry;
      await user.save();

      await sendOtpToEmail(cleanEmail, otp);

      return response(res, 200, "OTP sent to your email", {
        email: cleanEmail,
      });
    }

    // =========================
    // PHONE OTP FLOW (INTERNAL)
    // =========================
    if (!phoneNumber || !phoneSuffix) {
      return response(res, 400, "Phone number and phone suffix are required");
    }

    const cleanNumber = phoneNumber.trim();
    const cleanSuffix = phoneSuffix.trim();

    if (!cleanNumber || !cleanSuffix) {
      return response(res, 400, "Phone number and phone suffix are required");
    }

    let user = await User.findOne({
      phoneNumber: cleanNumber,
      phoneSuffix: cleanSuffix,
    });

    if (!user) {
      user = new User({
        phoneNumber: cleanNumber,
        phoneSuffix: cleanSuffix,
      });
    }

    // Save custom generated OTP & expiry to user model
    user.phoneOtp = otp;
    user.phoneOtpExpiry = expiry;
    await user.save();

    // Log OTP for development (replace with your custom SMS gateway if needed)
    console.log(`[DEV OTP] Phone: ${cleanSuffix}${cleanNumber} | Code: ${otp}`);

    return response(res, 200, "OTP sent successfully", {
      phoneNumber: cleanNumber,
      phoneSuffix: cleanSuffix,
    });
  } catch (error) {
    console.error("sendOTP Error:", error);
    return response(res, 500, error.message || "Internal server error");
  }
};

// Verify OTP (Email or Phone)
const verifyOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email, otp } = req.body;

  try {
    if (!otp) {
      return response(res, 400, "OTP is required");
    }

    const cleanOtp = String(otp).trim();
    const now = new Date();
    let user;

    // =========================
    // EMAIL OTP VERIFICATION
    // =========================
    if (email) {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail) {
        return response(res, 400, "Email is required");
      }

      user = await User.findOne({ email: cleanEmail });

      if (!user) {
        return response(res, 404, "User not found");
      }

      if (!user.emailOtp || String(user.emailOtp) !== cleanOtp) {
        return response(res, 400, "Invalid OTP");
      }

      if (!user.emailOtpExpiry || now > new Date(user.emailOtpExpiry)) {
        return response(res, 400, "OTP has expired");
      }

      user.isVerified = true;
      user.emailOtp = null;
      user.emailOtpExpiry = null;
      await user.save();
    }

    // =========================
    // PHONE OTP VERIFICATION
    // =========================
    else {
      if (!phoneNumber || !phoneSuffix) {
        return response(res, 400, "Phone number and phone suffix are required");
      }

      const cleanNumber = phoneNumber.trim();
      const cleanSuffix = phoneSuffix.trim();

      if (!cleanNumber || !cleanSuffix) {
        return response(res, 400, "Phone number and phone suffix are required");
      }

      user = await User.findOne({
        phoneNumber: cleanNumber,
        phoneSuffix: cleanSuffix,
      });

      if (!user) {
        return response(res, 404, "User not found");
      }

      if (!user.phoneOtp || String(user.phoneOtp) !== cleanOtp) {
        return response(res, 400, "Invalid OTP");
      }

      if (!user.phoneOtpExpiry || now > new Date(user.phoneOtpExpiry)) {
        return response(res, 400, "OTP has expired");
      }

      user.isVerified = true;
      user.phoneOtp = null;
      user.phoneOtpExpiry = null;
      await user.save();
    }

    // =========================
    // GENERATE JWT & COOKIE
    // =========================
    const token = generateToken(user._id);

    res.cookie("Auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    const userResponse = {
      id: user._id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      phoneSuffix: user.phoneSuffix,
      isVerified: user.isVerified,
    };

    return response(res, 200, "OTP verified successfully", {
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("verifyOtp Error:", error);
    return response(res, 500, error.message || "Internal server error");
  }
};

// Update Profile
const updateProfile = async (req, res) => {
  const { username, agreed, about } = req.body;
  const userId = req.user.userID;
  console.log(userId);
  try {
    const user = await User.findById(userId);
    if (!user) {
      return response(res, 404, "User not found");
    }
    if (req.file) {
      const uploadResult = await uplaodFileToCloudinary(req.file);
      user.ProfilePicture = uploadResult?.secure_url;
    } else if (req.body.profilePicture) {
      user.ProfilePicture = req.body.profilePicture;
    }
    if (username) user.username = username.trim();
    if (about) user.about = about.trim();
    if (agreed) user.agreed = agreed;
    await user.save();
    return response(res, 200, "User profile updated successfully", user);
  } catch (error) {
    console.error("updateProfile Error:", error);
    return response(res, 500, error.message || "Internal server error");
  }
};

//check auth
const checkAuthenticated = async (req, res) => {
  try {
    const userId = req.user.userID;

    if (!userId) {
      return response(
        res,
        404,
        "unauthorization! please login before access our app",
      );
    }
    const user = await User.findById(userId);
    if (!user) {
      return response(res, 404, "User not found");
    }
    return response(
      res,
      200,
      "User retrived and allow to use whatsapp!!",
      user,
    );
  } catch (error) {
    console.error("updateProfile Error:", error);
    return response(res, 500, error.message || "Internal server error");
  }
};

//get all user except You
const getAllUsers = async (req, res) => {
  const loggedInUser = req.user.userID;
  try {
    const users = await User.find({ _id: { $ne: loggedInUser } })
      .select("username profilePicture lastSeen isOnline about phoneNumber")
      .lean();

    const usersWithConversation = await Promise.all(
      users.map(async (user) => {
        const conversation = await Conversation.findOne({
          participants: { $all: [loggedInUser, user?._id] },
        })
          .populate({
            path: "lastMessage",
            select: "content createdAt sender receiver",
          })
          .lean();
        return {
          ...user,
          conversation: conversation || null,
        };
      }),
    );
    return response(
      res,
      200,
      "users retrived successfully",
      usersWithConversation,
    );
  } catch (error) {
     console.error("updateProfile Error:", error);
    return response(res, 500, error.message || "Internal server error");
  }
};

//logout
const logout = async (req, res) => {
  try {
    res.cookie("Auth_token", "", { expires: new Date(0) });
    return response(res, 200, "user logout successfully");
  } catch (error) {
    console.error("verifyOtp Error:", error);
    return response(res, 500, error.message || "Internal server error");
  }
};

module.exports = {
  verifyOtp,
  sendOTP,
  updateProfile,
  logout,
  checkAuthenticated,
  getAllUsers
};
