const express = require("express");
const app = express();
const studentRoutes = require("./routes/studentsRoutes");
const busRoutes = require("./routes/busRoutes")
const db = require("./utils/db-connection");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hi");
});

app.use("/students", studentRoutes);
app.use("/bus",busRoutes)

app.listen(3000, (req, res) => {
  console.log("Port is running on 3000");
});
