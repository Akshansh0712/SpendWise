const express = require("express");
const { body } = require("express-validator");
const { rateLimit } = require("express-rate-limit");

const { protect } = require("../middleware/auth.middleware");

const {
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/user.controller");

const router = express.Router();

// Limit repeated password-change attempts.
const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password-change attempts. Please try again later.",
  },
});

// All user routes require a valid login token.
router.use(protect);

router.get("/profile", getProfile);

router.put(
  "/profile",
  [
    body("name")
      .isString()
      .withMessage("Name is required")
      .bail()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Name must be between 1 and 100 characters"),

    body("email")
      .isString()
      .withMessage("Email is required")
      .bail()
      .trim()
      .isLength({ max: 254 })
      .withMessage("Email is too long")
      .bail()
      .isEmail()
      .withMessage("Please provide a valid email address"),

    body("currency")
      .isString()
      .withMessage("Currency is required")
      .bail()
      .trim()
      .matches(/^[A-Za-z]{3}$/)
      .withMessage("Currency must be a three-letter code, such as INR"),
  ],
  updateProfile
);

router.put(
  "/change-password",
  passwordChangeLimiter,
  [
    body("currentPassword")
      .isString()
      .withMessage("Current password is required")
      .bail()
      .notEmpty()
      .withMessage("Current password is required"),

    body("newPassword")
      .isString()
      .withMessage("New password is required")
      .bail()
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters")
      .bail()
      .custom((value) => {
        // bcrypt only processes the first 72 UTF-8 bytes.
        if (Buffer.byteLength(value, "utf8") > 72) {
          throw new Error("New password must be 72 UTF-8 bytes or fewer");
        }

        return true;
      }),
  ],
  changePassword
);

module.exports = router;
