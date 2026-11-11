const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization token is required",
    });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authorization token is required",
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  if (
    typeof decoded !== "object" ||
    typeof decoded.userId !== "string" ||
    !mongoose.isValidObjectId(decoded.userId) ||
    !Number.isInteger(decoded.tokenVersion)
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  try {
    const user = await User.findById(decoded.userId)
      .select("+tokenVersion");

    if (
      !user ||
      decoded.tokenVersion !== (user.tokenVersion ?? 0)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error("Authentication lookup error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify authentication",
    });
  }
}

module.exports = { protect };