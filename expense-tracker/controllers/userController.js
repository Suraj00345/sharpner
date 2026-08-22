const bcrypt = require("bcrypt");
const User = require("../models/User");
const crypto = require("crypto");
const { Op } = require("sequelize");
const { sendResetEmail } = require("../services/nodeMailService");

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        email: email,
      },
    });
    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user
    const user = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }
    // Find user by email
    const user = await User.findOne({
      where: {
        email: email,
      },
    });
    // User not found
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Wrong password
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Login successful
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(200)
        .json({ message: "If that email exists, a reset link was sent." });
    }

    //Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    //save token and expiration to the user's database record
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();
    //send the email
    await sendResetEmail(user.email, resetToken);
    res
      .status(200)
      .json({ message: "If that email exists, a reset link was sent." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // 1. Find user with this token AND ensure it hasn't expired
    // The exact query syntax depends on if you use Sequelize (Op.gt) or Mongoose ($gt)
    const user = await User.findOne({
      where: {
        resetToken: token,
        // Sequelize syntax for expiry > Date.now()
        // resetTokenExpiry: { [Op.gt]: Date.now() }
      },
    });

    if (!user || user.resetTokenExpiry < Date.now()) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // 2. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Update user and clear the token fields
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.status(200).json({ message: "Password has been successfully reset" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { signup, login, forgotPassword, resetPassword };
