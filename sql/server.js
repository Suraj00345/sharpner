const express = require("express");
const app = express();
const studentRoutes = require("./routes/studentsRoutes");
const db = require("./utils/db-connection");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hi");
});

app.use("/students", studentRoutes);

app.listen(3000, (req, res) => {
  console.log("Port is running on 3000");
});
