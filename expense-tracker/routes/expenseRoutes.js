const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");
const userAuth = require("../middleware/userAuth");

router.post("/expenses", expenseController.addExpense);
router.get("/expenses", userAuth, expenseController.getExpenses);
router.put("/expenses/:id", expenseController.updateExpense);
router.delete("/expenses/:id", expenseController.deleteExpense);

module.exports = router;
