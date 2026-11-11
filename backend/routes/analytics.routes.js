const express = require("express");
const { protect } = require("../middleware/auth.middleware");

const {
  getOverview,
  getIncomeExpense,
  getCategoryBreakdown,
  getMonthlyTrends,
  getSavingsTrends,
  getBudgetPerformance,
} = require("../controllers/analytics.controller");

const router = express.Router();

// Every analytics route requires a valid login token.
router.use(protect);

router.get("/overview", getOverview);
router.get("/income-expense", getIncomeExpense);
router.get("/category-breakdown", getCategoryBreakdown);
router.get("/monthly-trends", getMonthlyTrends);
router.get("/savings-trends", getSavingsTrends);
router.get("/budget-performance", getBudgetPerformance);

module.exports = router;