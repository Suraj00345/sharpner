const express = require("express");
const router = express.Router();

const students = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" }
];

// GET /students
router.get("/", (req, res) => {
  const names = students.map(student => student.name).join(", ");
  res.send(`Students: ${names}`);
});

// GET /students/:id
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);

  const student = students.find(student => student.id === id);

  if (!student) {
    return res.send("Student not found");
  }

  res.send(`Student: ${student.name}`);
});

module.exports = router;