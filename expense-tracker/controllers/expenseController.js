const Expense = require("../models/Expense");

//create Expence(POST)
const addExpense = async (req, res) => {
  try {
    console.log("Request body:", req.body);

    const { amount, description, category } = req.body;

    // console.log("userId:", userId);
    const userId = req.user.id;

    const newExpense = await Expense.create({
      amount,
      description,
      category,
      userId,
    });

    res.status(201).json({
      success: true,
      expense: newExpense,
    });
  } catch (error) {
    console.error("Add expense error:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//get All expence (GET)
const getExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5; // Fixed 5 items per page
    const offset = (page - 1) * limit;

    // findAndCountAll gets both total count and items for the current page
    const { count, rows: expenses } = await Expense.findAndCountAll({
      where: { userId: req.user.id },
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]], // Show newest first
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      expenses,
      currentPage: page,
      totalPages: totalPages,
      totalExpenses: count,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  } catch (error) {
    console.error("Pagination Error:", error);
    return res.status(500).json({ message: "Failed to fetch expenses" });
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
