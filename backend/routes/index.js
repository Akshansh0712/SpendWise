const express = require("express");
const authRoutes = require("./auth.routes");
const transactionRoutes = require("./transaction.routes");
const budgetRoutes = require("./budget.routes");
const analyticsRoutes = require("./analytics.routes");
const userRoutes = require("./user.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "SpendWise API is running",
  });
});

router.use("/auth", authRoutes);
router.use("/transactions", transactionRoutes);
router.use("/budgets", budgetRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/users", userRoutes);

module.exports = router;