const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getSummary,
} = require("../controllers/transaction.controller");
const {
  exportTransactions,
} = require("../controllers/export.controller");

const router = express.Router();

router.get("/summary", protect, getSummary);
router.get("/export", protect, exportTransactions);

router.post("/", protect, createTransaction);
router.get("/", protect, getTransactions);
router.put("/:id", protect, updateTransaction);
router.delete("/:id", protect, deleteTransaction);

module.exports = router;