require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const sequelize = require("./config/database");

// routes
const expenseRoutes = require("./routes/expenseRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const premiumRoutes = require("./routes/premiumRoutes");
const aiRoutes = require("./routes/aiRoutes");
const reportRoutes = require("./routes/reportRoutes");

// models
const User = require("./models/User");
const Expense = require("./models/Expense");

const app = express();
const PORT = process.env.PORT || 3000;

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());
app.use(express.json());

// ======================================================
// FRONTEND
// ======================================================

app.use(express.static(path.join(__dirname, "public")));

// ======================================================
// API ROUTES
// ======================================================

app.use("/api", expenseRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/reports", reportRoutes);

// ======================================================
// USER - EXPENSE RELATION
// ======================================================

User.hasMany(Expense, {
  foreignKey: "userId",
});

Expense.belongsTo(User, {
  foreignKey: "userId",
});

// ======================================================
// CHECK CASHFREE ENVIRONMENT VARIABLES
// ======================================================

console.log("Cashfree App ID exists:", !!process.env.CASHFREE_APP_ID);

console.log("Cashfree Secret exists:", !!process.env.CASHFREE_SECRET_KEY);

// ======================================================
// DATABASE
// ======================================================

sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log("Server running on http://localhost:3000");
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });
