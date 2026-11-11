const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Read and validate the month/year query parameters.
// Defaults use the current UTC month and year.
function getPeriod(query) {
  const now = new Date();

  const yearText =
    query.year === undefined
      ? String(now.getUTCFullYear())
      : query.year;

  const monthText =
    query.month === undefined
      ? String(now.getUTCMonth() + 1)
      : query.month;

  if (
    typeof yearText !== "string" ||
    !/^\d{4}$/.test(yearText) ||
    typeof monthText !== "string" ||
    !/^\d{1,2}$/.test(monthText)
  ) {
    return {
      error: "Provide a valid month and year",
    };
  }

  const year = Number(yearText);
  const month = Number(monthText);

  if (year < 2000 || year > 2100 || month < 1 || month > 12) {
    return {
      error: "Month or year is outside the supported range",
    };
  }

  return {
    year,
    month,
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
    yearStart: new Date(Date.UTC(year, 0, 1)),
    yearEnd: new Date(Date.UTC(year + 1, 0, 1)),
  };
}

function sendPeriodError(res, period) {
  return res.status(400).json({
    success: false,
    message: period.error,
  });
}

function calculateStatus(spent, limit) {
  const percentage = (spent / limit) * 100;

  if (percentage > 100) return "exceeded";
  if (percentage > 90) return "critical";
  if (percentage >= 70) return "warning";

  return "normal";
}

function roundPercentage(value) {
  return Number(value.toFixed(2));
}

// Returns expense totals grouped by normalized category.
async function getCategoryTotals(userId, start, end) {
  return Transaction.aggregate([
    {
      $match: {
        userId,
        type: "expense",
        date: { $gte: start, $lt: end },
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
    {
      $sort: { spent: -1, _id: 1 },
    },
  ]);
}

// Returns 12 months, including months without transactions.
async function getYearlyData(userId, period) {
  const grouped = await Transaction.aggregate([
    {
      $match: {
        userId,
        date: {
          $gte: period.yearStart,
          $lt: period.yearEnd,
        },
      },
    },
    {
      $group: {
        _id: {
          month: {
            $month: {
              date: "$date",
              timezone: "UTC",
            },
          },
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    },
  ]);

  const months = MONTH_NAMES.map((name, index) => ({
    month: index + 1,
    name,
    income: 0,
    expenses: 0,
    savings: 0,
  }));

  for (const item of grouped) {
    const month = months[item._id.month - 1];

    if (item._id.type === "income") {
      month.income = item.total;
    }

    if (item._id.type === "expense") {
      month.expenses = item.total;
    }
  }

  for (const month of months) {
    month.savings = month.income - month.expenses;
  }

  return months;
}

// GET /api/analytics/overview?month=11&year=2026
async function getOverview(req, res) {
  try {
    const period = getPeriod(req.query);

    if (period.error) {
      return sendPeriodError(res, period);
    }

    const [totals, budget, categories] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            userId: req.user._id,
            date: {
              $gte: period.start,
              $lt: period.end,
            },
          },
        },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
          },
        },
      ]),
      Budget.findOne({
        userId: req.user._id,
        month: period.month,
        year: period.year,
      }).lean(),
      getCategoryTotals(req.user._id, period.start, period.end),
    ]);

    const income =
      totals.find((item) => item._id === "income")?.total || 0;

    const expenses =
      totals.find((item) => item._id === "expense")?.total || 0;

    return res.json({
      success: true,
      period: {
        month: period.month,
        year: period.year,
        timezone: "UTC",
      },
      summary: {
        income,
        expenses,
        savings: income - expenses,
        budgetLimit: budget ? budget.totalLimit : null,
        budgetRemaining: budget ? budget.totalLimit - expenses : null,
        highestSpendingCategory:
          categories.length > 0
            ? {
                category: categories[0]._id,
                spent: categories[0].spent,
              }
            : null,
      },
    });
  } catch (error) {
    console.error("Analytics overview error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to calculate analytics overview",
    });
  }
}

// GET /api/analytics/income-expense?year=2026
async function getIncomeExpense(req, res) {
  try {
    const period = getPeriod(req.query);

    if (period.error) {
      return sendPeriodError(res, period);
    }

    const months = await getYearlyData(req.user._id, period);

    return res.json({
      success: true,
      year: period.year,
      data: months.map((month) => ({
        month: month.month,
        name: month.name,
        income: month.income,
        expenses: month.expenses,
      })),
    });
  } catch (error) {
    console.error("Income and expense analytics error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to calculate income and expense analytics",
    });
  }
}

// GET /api/analytics/category-breakdown?month=11&year=2026
async function getCategoryBreakdown(req, res) {
  try {
    const period = getPeriod(req.query);

    if (period.error) {
      return sendPeriodError(res, period);
    }

    const categories = await getCategoryTotals(
      req.user._id,
      period.start,
      period.end
    );

    const totalExpenses = categories.reduce(
      (total, item) => total + item.spent,
      0
    );

    return res.json({
      success: true,
      period: {
        month: period.month,
        year: period.year,
      },
      totalExpenses,
      categories: categories.map((item) => ({
        category: item._id,
        spent: item.spent,
        percentage:
          totalExpenses > 0
            ? roundPercentage((item.spent / totalExpenses) * 100)
            : 0,
      })),
    });
  } catch (error) {
    console.error("Category breakdown error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to calculate category breakdown",
    });
  }
}

// GET /api/analytics/monthly-trends?year=2026
async function getMonthlyTrends(req, res) {
  try {
    const period = getPeriod(req.query);

    if (period.error) {
      return sendPeriodError(res, period);
    }

    const months = await getYearlyData(req.user._id, period);

    const totalExpenses = months.reduce(
      (total, month) => total + month.expenses,
      0
    );

    return res.json({
      success: true,
      year: period.year,
      totalExpenses,
      averageMonthlyExpenses: totalExpenses / 12,
      data: months.map((month) => ({
        month: month.month,
        name: month.name,
        expenses: month.expenses,
      })),
    });
  } catch (error) {
    console.error("Monthly trends error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to calculate monthly trends",
    });
  }
}

// GET /api/analytics/savings-trends?year=2026
async function getSavingsTrends(req, res) {
  try {
    const period = getPeriod(req.query);

    if (period.error) {
      return sendPeriodError(res, period);
    }

    const months = await getYearlyData(req.user._id, period);

    const totalSavings = months.reduce(
      (total, month) => total + month.savings,
      0
    );

    return res.json({
      success: true,
      year: period.year,
      totalSavings,
      data: months.map((month) => ({
        month: month.month,
        name: month.name,
        savings: month.savings,
      })),
    });
  } catch (error) {
    console.error("Savings trends error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to calculate savings trends",
    });
  }
}

// GET /api/analytics/budget-performance?month=11&year=2026
async function getBudgetPerformance(req, res) {
  try {
    const period = getPeriod(req.query);

    if (period.error) {
      return sendPeriodError(res, period);
    }

    const [budget, categoryTotals] = await Promise.all([
      Budget.findOne({
        userId: req.user._id,
        month: period.month,
        year: period.year,
      }).lean(),
      getCategoryTotals(req.user._id, period.start, period.end),
    ]);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "No budget found for this month and year",
      });
    }

    const totalSpent = categoryTotals.reduce(
      (total, item) => total + item.spent,
      0
    );

    const categories = budget.categoryLimits.map((item) => {
      const categoryKey = item.category.trim().toLowerCase();

      const match = categoryTotals.find(
        (entry) => entry._id === categoryKey
      );

      const spent = match ? match.spent : 0;

      return {
        category: item.category,
        limit: item.limit,
        spent,
        remaining: item.limit - spent,
        percentage: roundPercentage((spent / item.limit) * 100),
        status: calculateStatus(spent, item.limit),
      };
    });

    return res.json({
      success: true,
      period: {
        month: period.month,
        year: period.year,
      },
      overall: {
        limit: budget.totalLimit,
        spent: totalSpent,
        remaining: budget.totalLimit - totalSpent,
        percentage: roundPercentage(
          (totalSpent / budget.totalLimit) * 100
        ),
        status: calculateStatus(totalSpent, budget.totalLimit),
      },
      categories,
    });
  } catch (error) {
    console.error("Budget performance error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to calculate budget performance",
    });
  }
}

module.exports = {
  getOverview,
  getIncomeExpense,
  getCategoryBreakdown,
  getMonthlyTrends,
  getSavingsTrends,
  getBudgetPerformance,
};