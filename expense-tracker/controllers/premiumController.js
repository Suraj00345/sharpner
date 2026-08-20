const { fn, col, literal } = require("sequelize");
const Expense = require("../models/Expense");
const User = require("../models/User");

// ======================================================
// GET LEADERBOARD
// ======================================================

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Expense.findAll({
      attributes: [
        // User ID
        "userId",
        // SUM(amount)
        [fn("SUM", col("amount")), "totalExpense"],
      ],

      include: [
        {
          model: User,
          attributes: ["id", "name"],
        },
      ],
      group: ["userId", "User.id", "User.name"],
      order: [[literal("totalExpense"), "DESC"]],
    });

    res.status(200).json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch leaderboard",
      error: error.message,
    });
  }
};

module.exports = {
  getLeaderboard,
};
