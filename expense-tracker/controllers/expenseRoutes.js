const Expense = require("../models/Expense");

//create Expence(POST)
const addExpense = async (req, res) => {
  try {
    const { amount, description, category } = req.body;
    const newExpense = await Expense.create({
      amount,
      description,
      category,
    });
    res.status(201).json({ success: true, expense: newExpense });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

//get All expence (GET)
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.findAll();
    res.status(200).json({ success: true, expenses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

//update all expense
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, category } = req.body;

    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    expense.amount = amount;
    expense.description = description;
    expense.category = category;
    await expense.save();

    res.status(200).json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

//delete expense
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteCount = await Expense.destroy({ where: { id } });

    if (!deleteCount) {
      return res
        .status(404)
        .json({ success: false, message: "Expense deleted successfully" });
    }

    res
      .status(200)
      .json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  addExpense,
  updateExpense,
  getExpenses,
  deleteExpense,
};
