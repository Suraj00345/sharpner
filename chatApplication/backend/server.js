const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./config/dbConnect");
const bodyParser = require("body-parser");
const authRoute = require("./routes/authRoute");
const chatRoute = require("./routes/chatRoute");

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// MongoDB connection
connectDB();

// Middleware
app.use(morgan("dev")); // HTTP request logger middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoute);
app.use("/api/chat", chatRoute);

//Test API
app.get("/test", (req, res) => {
  res.send("test Server is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
