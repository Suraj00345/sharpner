const db = require("../utils/db-connection");

const addEntries = (req, res) => {
  const { name, email, age } = req.body;
  const insertQuery = "INSERT INTO students(name,email,age) VALUES (?,?,?)";

  db.execute(insertQuery, [name, email, age], (err) => {
    if (err) {
      console.log(err.message);
      res.status(500).send(err.message);
      db.end();
      return;
    }
    console.log("Values has been inserted");
    res.status(200).send(`Student with name ${name} successfully added`);
  });
};

const getStudentsById = (req, res) => {
  const { id } = req.params;

  const query = "select * from students where id = ?";

  db.execute(query, [id], (err, result) => {
    if (err) {
      console.log(err.message);
      res.status(500).send(err.message);
      db.end();
      return;
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: `Student with ID ${id} not found.` });
    }
    console.log(` Fetched Student ID ${id}`);
    return res.status(200).json(result);
  });
};

const updateEntry = (req, res) => {
  const { id } = req.params;
  const { name, email, age } = req.body;

  const updateQuery =
    "UPDATE students SET name = ?, email = ?, age = ? WHERE id = ?";

  // Pass id as the 4th argument in the array to match the 4 placeholders
  db.execute(updateQuery, [name, email, age, id], (err, result) => {
    if (err) {
      console.error("Database update error:", err.message);
      // Send a generic error message and DO NOT call db.end()
      return res.status(500).json({ error: "Internal server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json({ message: "Student updated successfully" });
  });
};

const deleteEntry = (req, res) => {
  const { id } = req.params;
  const deleteQuery = `DELETE from students where id= ?`;

  db.execute(deleteQuery, [id], (err, results) => {
    if (err) {
      console.log(err.message);
      res.status(500).send(err.message);
    }

    if (results.affectedRows === 0) {
      res.status(404).send("Student is not found");
      return;
    }
    res.status(200).send(`User with ${id} is deleted`);
  });
};

module.exports = {
  addEntries,
  updateEntry,
  deleteEntry,
  getStudentsById,
};
