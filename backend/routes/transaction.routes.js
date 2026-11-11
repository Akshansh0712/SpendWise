const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transaction.controller");

const router = express.Router();

router.post("/", protect, createTransaction);
router.get("/", protect, getTransactions);
router.put("/:id", protect, updateTransaction);
router.delete("/:id", protect, deleteTransaction);

module.exports = router;