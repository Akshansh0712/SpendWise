const express = require("express");
const authRoutes = require("./auth.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "SpendWise API is running",
  });
});

router.use("/auth", authRoutes);

module.exports = router;