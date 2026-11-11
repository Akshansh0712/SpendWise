const Transaction = require("../models/Transaction");

async function createTransaction(req, res) {
  try {
    const {
      title,
      amount,
      type,
      category,
      paymentMethod,
      description,
      date,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !["income", "expense"].includes(type) ||
      typeof category !== "string" ||
      !category.trim() ||
      typeof paymentMethod !== "string" ||
      !paymentMethod.trim() ||
      typeof date !== "string" ||
      Number.isNaN(Date.parse(date))
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid transaction details",
      });
    }

    const transaction = await Transaction.create({
      userId: req.user._id,
      title,
      amount,
      type,
      category,
      paymentMethod,
      description,
      date,
    });

    return res.status(201).json({
      success: true,
      message: "Transaction added successfully",
      transaction,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Please check your transaction details",
      });
    }

    console.error("Create transaction error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to add transaction",
    });
  }
}
async function getTransactions(req, res) {
  try {
    const transactions = await Transaction.find({
      userId: req.user._id,
    }).sort({ date: -1, createdAt: -1 });

    return res.json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Get transactions error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve transactions",
    });
  }
}
async function updateTransaction(req, res) {
  try {
    const { title, amount, type, category, paymentMethod, description, date } =
      req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !["income", "expense"].includes(type) ||
      typeof category !== "string" ||
      !category.trim() ||
      typeof paymentMethod !== "string" ||
      !paymentMethod.trim() ||
      typeof date !== "string" ||
      Number.isNaN(Date.parse(date))
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid transaction details",
      });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title, amount, type, category, paymentMethod, description, date },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.json({
      success: true,
      message: "Transaction updated successfully",
      transaction,
    });
  } catch (error) {
    if (error.name === "CastError" || error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID or details",
      });
    }

    console.error("Update transaction error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update transaction",
    });
  }
}

async function deleteTransaction(req, res) {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    console.error("Delete transaction error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to delete transaction",
    });
  }
}

module.exports = {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
};