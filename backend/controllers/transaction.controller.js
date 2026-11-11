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
    const {
      search,
      type,
      category,
      startDate,
      endDate,
      sortBy = "date",
      order = "desc",
      page = "1",
      limit = "10",
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(limitNumber) ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100",
      });
    }

    if (type && !["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be income or expense",
      });
    }

    if (!["date", "amount"].includes(sortBy) ||
        !["asc", "desc"].includes(order)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort field or order",
      });
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    function parseDate(value) {
      if (typeof value !== "string" || !datePattern.test(value)) {
        return null;
      }

      const parsed = new Date(`${value}T00:00:00.000Z`);

      if (
        Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== value
      ) {
        return null;
      }

      return parsed;
    }

    const start = startDate ? parseDate(startDate) : null;
    const end = endDate ? parseDate(endDate) : null;

    if ((startDate && !start) || (endDate && !end)) {
      return res.status(400).json({
        success: false,
        message: "Dates must use the YYYY-MM-DD format",
      });
    }

    if (start && end && start > end) {
      return res.status(400).json({
        success: false,
        message: "Start date must not be after end date",
      });
    }

    const filter = { userId: req.user._id };

    if (type) filter.type = type;
    if (category) filter.category = category;

    if (search) {
      // Treat the search text as text, not a regular-expression pattern.
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: escapedSearch, $options: "i" };
    }

    if (start || end) {
      filter.date = {};

      if (start) filter.date.$gte = start;

      if (end) {
        // Include the entire selected end date, in UTC.
        filter.date.$lt = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    const sortDirection = order === "asc" ? 1 : -1;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ [sortBy]: sortDirection, _id: sortDirection })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber),
      Transaction.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      count: transactions.length,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
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