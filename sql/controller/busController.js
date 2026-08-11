const db = require("../utils/db-connection");

const addUser = (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "name and email are required." });
  }

  const insertQuery = "INSERT INTO users (name,email) VALUES (?,?)";
  db.execute(insertQuery, [name, email], (err, result) => {
    if (err) {
      console.log(err.message);
      res.status(500).send(err.message);
      db.end();
      return;
    }

    if (result.affectedRows === 0) {
      res.status(404).send("user not found");
      return;
    }
    res.status(200).send("user has been updated");
  });
};

const getUser = (req, res) => {
  const selectQuery = "SELECT * FROM users";
  db.execute(selectQuery, (err, result) => {
    // 1. Handle MySQL errors first
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // 2. Check if the returned array is empty
    if (result.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    // 3. Send the fetched data as JSON
    return res.status(200).json(result);
  });
};

const addBuses = (req, res) => {
  const { busNumber, totalSeats, availableSeats } = req.body;

  if (!busNumber || totalSeats === undefined || availableSeats === undefined) {
    return res.status(400).json({
      error: "busNumber, totalSeats, and availableSeats are required.",
    });
  }

  const insertQuery =
    "INSERT INTO Buses (busNumber,totalSeats,availableSeats) VALUES (?,?,?)";
  db.execute(
    insertQuery,
    [busNumber, totalSeats, availableSeats],
    (err, result) => {
      if (err) {
        console.log(err.message);
        res.status(500).send(err.message);
        db.end();
        return;
      }

      if (result.affectedRows === 0) {
        res.status(404).send("bus not added");
        return;
      }
      res.status(200).send("Bus is added successfully");
    },
  );
};

const getBuses = (req, res) => {
  const selectQuery = "SELECT * FROM buses";
  db.execute(selectQuery, (err, result) => {
    // 1. Handle MySQL errors first
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // 2. Check if the returned array is empty
    if (result.length === 0) {
      return res.status(404).json({ message: "No buses found" });
    }

    // 3. Send the fetched data as JSON
    return res.status(200).json(result);
  });
};

const getBusesBySeats = (req, res) => {
  // Extract min seats from route parameters e.g., /buses/available/10
  const minSeats = parseInt(req.params.seats, 10);

  // Validate parameter
  if (isNaN(minSeats)) {
    return res.status(400).json({ error: "Seat count must be a valid number" });
  }

  // Use ? parameter placeholder to prevent SQL injection
  const selectQuery = "SELECT * FROM Buses WHERE availableSeats > ?";

  db.execute(selectQuery, [minSeats], (err, results) => {
    // 1. Handle MySQL errors first
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // 2. Check if no matching buses were found
    if (results.length === 0) {
      return res
        .status(404)
        .json({
          message: `No buses found with more than ${minSeats} available seats.`,
        });
    }

    // 3. Send matching buses array
    return res.status(200).json(results);
  });
};

module.exports = { addUser, getUser, addBuses, getBuses, getBusesBySeats };
