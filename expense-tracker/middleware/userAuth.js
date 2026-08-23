const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authentication token missing or malformed" });
    }

    // Extract the token (format: "Bearer <token>")
    const token = authHeader.split(" ")[1];

    // Verify the token using your secret key
    // (Make sure JWT_SECRET matches what you use when logging in)
    const secretKey = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secretKey);

    // Find the user in the database to ensure they still exist
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res
        .status(401)
        .json({ message: "User not found or session expired" });
    }

    // Attach the user object to the request so controllers can use req.user
    req.user = user;

    console.log(user);

    // Proceed to the next middleware or controller
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authenticate;
