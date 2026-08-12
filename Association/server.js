const express = require("express");
const studentRoutes = require("./routes/studentsRoutes");
const courseRoutes = require("./routes/courseRoutes");
const db = require("./utils/db-connection");

require("./models");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hi");
});

app.use("/students", studentRoutes);
app.use("/courses", courseRoutes);

app.listen(3000, (req, res) => {
  console.log("Port is running on 3000");
});
