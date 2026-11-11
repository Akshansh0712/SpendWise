const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

// Budget warning thresholds.
const WARNING_PERCENT = 70;
const CRITICAL_PERCENT = 90;

function getBudgetStatus(spent, limit) {
  const percentage = (spent / limit) * 100;

  if (percentage > 100) return "exceeded";
  if (percentage > CRITICAL_PERCENT) return "critical";
  if (percentage >= WARNING_PERCENT) return "warning";

  return "normal";
}

function validateBudgetInput(body) {
  const { month, year, totalLimit, categoryLimits = [] } = body;

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return "Month must be an integer between 1 and 12";
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return "Year must be an integer between 2000 and 2100";
  }

  if (
    typeof totalLimit !== "number" ||
    !Number.isFinite(totalLimit) ||
    totalLimit < 0.01
  ) {
    return "Total limit must be a number greater than or equal to 0.01";
  }

  if (!Array.isArray(categoryLimits)) {
    return "Category limits must be an array";
  }

  const seenCategories = new Set();

  for (const item of categoryLimits) {
    if (
      !item ||
      typeof item.category !== "string" ||
      !item.category.trim() ||
      item.category.trim().length > 50
    ) {
      return "Each category must be a non-empty string of at most 50 characters";
    }

    if (
      typeof item.limit !== "number" ||
      !Number.isFinite(item.limit) ||
      item.limit < 0.01
    ) {
      return "Each category limit must be a number greater than or equal to 0.01";
    }

    const normalizedCategory = item.category.trim().toLowerCase();

    if (seenCategories.has(normalizedCategory)) {
      return "A category can only appear once in a budget";
    }

    seenCategories.add(normalizedCategory);
  }

  return null;
}

function normalizeCategoryLimits(categoryLimits = []) {
  return categoryLimits.map((item) => ({
    category: item.category.trim(),
    limit: item.limit,
  }));
}

// POST /api/budgets
async function createBudget(req, res) {
  try {
    const validationError = validateBudgetInput(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const { month, year, totalLimit, categoryLimits = [] } = req.body;

    const budget = await Budget.create({
      userId: req.user._id,
      month,
      year,
      totalLimit,
      categoryLimits: normalizeCategoryLimits(categoryLimits),
    });

    return res.status(201).json({
      success: true,
      message: "Budget created successfully",
      budget,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A budget already exists for this month and year",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Please check your budget details",
      });
    }

    console.error("Create budget error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create budget",
    });
  }
}

// GET /api/budgets
async function getBudgets(req, res) {
  try {
    const budgets = await Budget.find({
      userId: req.user._id,
    }).sort({ year: -1, month: -1 });

    return res.json({
      success: true,
      count: budgets.length,
      budgets,
    });
  } catch (error) {
    console.error("Get budgets error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve budgets",
    });
  }
}

// GET /api/budgets/:id
async function getBudget(req, res) {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    return res.json({
      success: true,
      budget,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid budget ID",
      });
    }

    console.error("Get budget error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve budget",
    });
  }
}

// PUT /api/budgets/:id
// Send the complete budget, including month and year, when editing.
async function updateBudget(req, res) {
  try {
    const validationError = validateBudgetInput(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const { month, year, totalLimit, categoryLimits = [] } = req.body;

    const budget = await Budget.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      {
        month,
        year,
        totalLimit,
        categoryLimits: normalizeCategoryLimits(categoryLimits),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    return res.json({
      success: true,
      message: "Budget updated successfully",
      budget,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A budget already exists for this month and year",
      });
    }

    if (error.name === "CastError" || error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid budget ID or details",
      });
    }

    console.error("Update budget error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update budget",
    });
  }
}

// GET /api/budgets/summary?month=11&year=2026
async function getBudgetSummary(req, res) {
  try {
    const { month: monthValue, year: yearValue } = req.query;

    if (
      typeof monthValue !== "string" ||
      !/^\d{1,2}$/.test(monthValue) ||
      typeof yearValue !== "string" ||
      !/^\d{4}$/.test(yearValue)
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide month and year, for example: month=11&year=2026",
      });
    }

    const month = Number(monthValue);
    const year = Number(yearValue);

    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: "Month or year is outside the supported range",
      });
    }

    const budget = await Budget.findOne({
      userId: req.user._id,
      month,
      year,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "No budget found for this month and year",
      });
    }

    // Month boundaries use UTC, matching the date-only transaction tests.
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const spendingByCategory = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: "expense",
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            $toLower: {
              $trim: { input: "$category" },
            },
          },
          spent: { $sum: "$amount" },
        },
      },
    ]);

    const totalSpent = spendingByCategory.reduce(
      (total, item) => total + item.spent,
      0
    );

    const categorySummary = budget.categoryLimits.map((item) => {
      const normalizedCategory = item.category.trim().toLowerCase();

      const matchingSpending = spendingByCategory.find(
        (entry) => entry._id === normalizedCategory
      );

      const spent = matchingSpending ? matchingSpending.spent : 0;

      return {
        category: item.category,
        limit: item.limit,
        spent,
        remaining: item.limit - spent,
        percentage: Number(((spent / item.limit) * 100).toFixed(2)),
        status: getBudgetStatus(spent, item.limit),
      };
    });

    return res.json({
      success: true,
      summary: {
        budgetId: budget._id,
        month: budget.month,
        year: budget.year,
        totalLimit: budget.totalLimit,
        totalSpent,
        remaining: budget.totalLimit - totalSpent,
        percentage: Number(((totalSpent / budget.totalLimit) * 100).toFixed(2)),
        status: getBudgetStatus(totalSpent, budget.totalLimit),
        categories: categorySummary,
      },
    });
  } catch (error) {
    console.error("Budget summary error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to calculate budget summary",
    });
  }
}

// DELETE /api/budgets/:id
async function deleteBudget(req, res) {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    return res.json({
      success: true,
      message: "Budget deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid budget ID",
      });
    }

    console.error("Delete budget error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete budget",
    });
  }
}

module.exports = {
  createBudget,
  getBudgets,
  getBudget,
  updateBudget,
  getBudgetSummary,
  deleteBudget,
};