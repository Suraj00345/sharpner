const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./config/dbConnect");
const bodyParser = require("body-parser");
const authRoute = require("./routes/authRoute");
const chatRoute = require("./routes/chatRoute");
const statusRoute = require("./routes/statusRoute");
const initializeSocket = require("./services/socketService");
const http = require("http");

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// MongoDB connection
connectDB();

const corsOptions = {
  origin: process.env.FRONTEND_URL,
};

app.use(cors(corsOptions));

// Middleware
app.use(morgan("dev")); // HTTP request logger middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

//create server for socket.io
const server = http.createServer(app);
const io = initializeSocket(server);

//apply socket middleware before routes
app.use((req, res, next) => {
  req.io = io;
  req.socketUserMap = io.socketUserMap;
  next();
});

// Routes
app.use("/api/auth", authRoute);
app.use("/api/chat", chatRoute);
app.use("/api/status", statusRoute);

//Test API
app.get("/test", (req, res) => {
  res.send("test Server is running");
});

server.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
