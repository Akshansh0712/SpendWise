const express = require("express");
const { protect } = require("../middleware/auth.middleware");

const {
  createBudget,
  getBudgets,
  getBudget,
  updateBudget,
  getBudgetSummary,
  deleteBudget,
} = require("../controllers/budget.controller");

const router = express.Router();

router.post("/", protect, createBudget);
router.get("/", protect, getBudgets);

// Keep /summary before /:id so Express doesn't treat "summary" as an ID.
router.get("/summary", protect, getBudgetSummary);

router.get("/:id", protect, getBudget);
router.put("/:id", protect, updateBudget);
router.delete("/:id", protect, deleteBudget);

module.exports = router;