const express = require("express");

const router = express.Router();

const {
  categorizeExpense,
} = require("../controllers/aiController");

router.post("/categorize", categorizeExpense);

module.exports = router;