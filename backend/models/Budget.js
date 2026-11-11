const mongoose = require("mongoose");

const categoryLimitSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    limit: {
      type: Number,
      required: true,
      min: 0.01,
    },
  },
  {
    _id: false,
  }
);

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      validate: Number.isInteger,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
      validate: Number.isInteger,
    },
    totalLimit: {
      type: Number,
      required: true,
      min: 0.01,
    },
    categoryLimits: {
      type: [categoryLimitSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// A user can have only one budget for a particular month and year.
budgetSchema.index(
  { userId: 1, month: 1, year: 1 },
  { unique: true }
);

module.exports = mongoose.model("Budget", budgetSchema);