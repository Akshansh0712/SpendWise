const express = require("express");
const { body } = require("express-validator");
const { rateLimit } = require("express-rate-limit");

const {
  register,
  login,
  getMe,
} = require("../controllers/auth.controller");

const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

const emailValidation = body("email")
  .isString()
  .withMessage("Email is required")
  .bail()
  .trim()
  .isLength({ max: 254 })
  .withMessage("Email is too long")
  .bail()
  .isEmail()
  .withMessage("Please provide a valid email address");

const passwordValidation = body("password")
  .isString()
  .withMessage("Password is required")
  .bail()
  .custom((value) => {
    if (value.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    if (Buffer.byteLength(value, "utf8") > 72) {
      throw new Error("Password must be 72 UTF-8 bytes or fewer");
    }

    return true;
  });

router.post(
  "/register",
  authLimiter,
  [
    body("name")
      .isString()
      .withMessage("Name is required")
      .bail()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Name must be between 1 and 100 characters"),
    emailValidation,
    passwordValidation,
  ],
  register
);

router.post(
  "/login",
  authLimiter,
  [
    emailValidation,
    body("password")
      .isString()
      .withMessage("Password is required")
      .bail()
      .notEmpty()
      .withMessage("Password is required"),
  ],
  login
);

router.get("/me", protect, getMe);

module.exports = router;