const { Op } = require("sequelize");
const User = require("../models/User");
const Bus = require("../models/Bus");

// POST /users
const addUser = async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }

  try {
    const newUser = await User.create({ name, email });

    return res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (err) {
    console.error("Error creating user:", err);
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Email already exists." });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /users
const getUser = async (req, res) => {
  try {
    const users = await User.findAll();

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    return res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /buses
const addBuses = async (req, res) => {
  const { busNumber, totalSeats, availableSeats } = req.body;

  if (!busNumber || totalSeats === undefined || availableSeats === undefined) {
    return res.status(400).json({
      error: "busNumber, totalSeats, and availableSeats are required.",
    });
  }

  try {
    const newBus = await Bus.create({
      busNumber,
      totalSeats,
      availableSeats,
    });

    return res.status(201).json({
      message: "Bus added successfully",
      bus: newBus,
    });
  } catch (err) {
    console.error("Error creating bus:", err);
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "Bus number already exists." });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /buses
const getBuses = async (req, res) => {
  try {
    const buses = await Bus.findAll();

    if (buses.length === 0) {
      return res.status(404).json({ message: "No buses found" });
    }

    return res.status(200).json(buses);
  } catch (err) {
    console.error("Error fetching buses:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /buses/available/:seats
const getBusesBySeats = async (req, res) => {
  const minSeats = parseInt(req.params.seats, 10);

  if (isNaN(minSeats)) {
    return res
      .status(400)
      .json({ error: "Seat count must be a valid number." });
  }

  try {
    const buses = await Bus.findAll({
      where: {
        availableSeats: {
          [Op.gt]: minSeats, // Equivalent to WHERE availableSeats > minSeats
        },
      },
    });

    if (buses.length === 0) {
      return res.status(404).json({
        message: `No buses found with more than ${minSeats} available seats.`,
      });
    }

    return res.status(200).json(buses);
  } catch (err) {
    console.error("Error filtering buses:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { addUser, getUser, addBuses, getBuses, getBusesBySeats };
