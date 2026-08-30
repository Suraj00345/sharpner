const jwt = require("jsonwebtoken");
const response = require("../utils/responseHandler");

const authMiddleware = (req, res, next) => {
  // Read token from cookies (checking both casings) or Authorization header fallback
  const authToken =
    req.cookies?.Auth_token ||
    req.cookies?.auth_token ||
    req.headers.authorization?.split(" ")[1];

  if (!authToken) {
    return response(
      res,
      401,
      "Authorization token missing. Please log in or provide a token.",
    );
  }

  try {
    // Verify token against secret
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    // Attach payload to req.user (normalized so req.user.userId works everywhere)
    req.user = decoded
    console.log(req.user.userID);
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return response(res, 401, "Invalid or expired token. Please log in again.");
  }
};

module.exports = authMiddleware;
