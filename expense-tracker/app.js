const express = require("express");
const cors = require("cors");
const path = require("path");
const sequelize = require("./config/database");

const expenseRoutes = require("./routes/expenseRoutes");
const userRoutes = require("./routes/userRoutes");
const User = require("./models/User");
const Expense = require("./models/Expense");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api", expenseRoutes);
app.use("/api/auth", userRoutes);

User.hasMany(Expense);
Expense.belongsTo(User);

sequelize
  .sync()
  .then(() => {
    app.listen(3000, () => {
      console.log("Server running on http://localhost:3000");
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });