const Transaction = require("../models/Transaction");
const { transactionsToCsv } = require("../utils/csvExport");

function parseDate(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
}

async function exportTransactions(req, res) {
  try {
    const { type, category, search, startDate, endDate } = req.query;

    // Reject repeated or non-text query parameters.
    for (const value of [type, category, search, startDate, endDate]) {
      if (value !== undefined && typeof value !== "string") {
        return res.status(400).json({
          success: false,
          message: "Filter values must be text",
        });
      }
    }

    if (type && !["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be income or expense",
      });
    }

    if (search && search.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search text must be 100 characters or fewer",
      });
    }

    if (category && category.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Category must be 50 characters or fewer",
      });
    }

    const start = startDate ? parseDate(startDate) : null;
    const end = endDate ? parseDate(endDate) : null;

    if ((startDate && !start) || (endDate && !end)) {
      return res.status(400).json({
        success: false,
        message: "Dates must be valid and use YYYY-MM-DD",
      });
    }

    if (start && end && start > end) {
      return res.status(400).json({
        success: false,
        message: "Start date must not be after end date",
      });
    }

    // The user ID comes from the verified token, never from the request.
    const filter = {
      userId: req.user._id,
    };

    if (type) {
      filter.type = type;
    }

    if (category) {
      filter.category = category.trim();
    }

    if (search) {
      // Escape regex characters so search is treated as ordinary text.
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.title = {
        $regex: escapedSearch,
        $options: "i",
      };
    }

    if (start || end) {
      filter.date = {};

      if (start) {
        filter.date.$gte = start;
      }

      if (end) {
        // Include the full end date using UTC.
        filter.date.$lt = new Date(
          end.getTime() + 24 * 60 * 60 * 1000
        );
      }
    }

    const transactions = await Transaction.find(filter)
      .select("title amount type category paymentMethod description date")
      .sort({ date: -1, _id: -1 })
      .lean();

    const csv = transactionsToCsv(transactions);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="spendwise-transactions.csv"'
    );
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.status(200).send(csv);
  } catch (error) {
    console.error("CSV export error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to export transactions",
    });
  }
}

module.exports = { exportTransactions };