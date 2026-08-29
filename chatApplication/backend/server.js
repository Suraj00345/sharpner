const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/dbConnect");
const bodyParser = require("body-parser");
const authRoute = require("./routes/authRoute");

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

//Mongo DB connection
connectDB();

//middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

//routes
app.use("/api/auth", authRoute);

app.get("/test", (req, res) => {
  res.send("test Server is running");
});

app.listen(PORT, () => {
  console.log("server is listen on PORT 3000");
});
