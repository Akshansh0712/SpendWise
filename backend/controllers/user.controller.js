const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const User = require("../models/User");

function getValidationError(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });

    return true;
  }

  return false;
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    currency: user.currency,
  };
}

// GET /api/users/profile
async function getProfile(req, res) {
  return res.json({
    success: true,
    user: publicUser(req.user),
  });
}

// PUT /api/users/profile
async function updateProfile(req, res) {
  try {
    if (getValidationError(req, res)) {
      return;
    }

    const { name, email, currency } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        currency: currency.trim().toUpperCase(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Please check your profile details",
      });
    }

    console.error("Update profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
}

// PUT /api/users/change-password
async function changePassword(req, res) {
  try {
    if (getValidationError(req, res)) {
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your current password",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Include the old hash in the update so two simultaneous password
    // changes cannot both succeed using the same old password.
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        password: user.password,
      },
      {
        password: hashedPassword,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(409).json({
        success: false,
        message: "Password changed during this request. Please log in again.",
      });
    }

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to change password",
    });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};