const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    paymentMethod: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);