const Student = require("../models/students");
const { IdentityCard } = require("../models");

// 1. Add Entry (POST /students)
const addEntries = async (req, res) => {
  try {
    const { name, email, age } = req.body;
    const newStudent = await Student.create({ name, email, age });
    return res.status(201).json({
      message: `Student with name ${name} successfully added`,
      student: newStudent,
    });
  } catch (error) {
    console.error("Error adding student:", error.message);
    return res.status(500).send(error.message);
  }
};

// 2. Get Student by ID (GET /students/:id)
const getStudentsById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);
    if (!student) {
      return res
        .status(404)
        .json({ message: `Student with ID ${id} not found.` });
    }
    console.log(`Fetched Student ID ${id}`);
    return res.status(200).json(student);
  } catch (error) {
    console.error("Error fetching student:", error.message);
    return res.status(500).send(error.message);
  }
};

// 3. Update Entry (PUT /students/:id)
const updateEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, age } = req.body;
    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).send("User is not found");
    }
    // Update fields if provided in request body
    if (name) student.name = name;
    if (email) student.email = email;
    if (age) student.age = age;

    // Persist changes to database
    await student.save();

    return res.status(200).send("User has been updated!");
  } catch (error) {
    console.error("Error updating student:", error.message);
    return res.status(500).send("User cannot be updated");
  }
};

// 4. Delete Entry (DELETE /students/:id)
const deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await Student.destroy({
      where: { id: id },
    });
    if (!deletedCount) {
      return res.status(404).send("User is not found");
    }
    return res.status(200).send("User is deleted");
  } catch (error) {
    console.error("Error deleting student:", error);
    return res.status(500).send("Error encountered while deleting");
  }
};

const addingValuesToStudentAndIdentityTable = async (req, res) => {
  try {
    const student = Student.create(req.body.students);
    const idCard = IdentityCard.create({
      ...req.body.IdentityCard,
      StudentId: student.id,
    });
    res.status(201).json({ student, idCard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addEntries,
  updateEntry,
  deleteEntry,
  getStudentsById,
  addingValuesToStudentAndIdentityTable
};
