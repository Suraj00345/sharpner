const express = require("express");
const mysql = require("mysql2");
const app = express();

const port = 3000;

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Suraj123",
  database: "testdb",
});

connection.connect((err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log("Connection has been created");

  // Schema creation queries for Bus Booking System
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS Users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE
    )
  `;

  const createBusesTable = `
    CREATE TABLE IF NOT EXISTS Buses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      busNumber VARCHAR(50) NOT NULL UNIQUE,
      totalSeats INT NOT NULL,
      availableSeats INT NOT NULL
    )
  `;

  const createBookingsTable = `
    CREATE TABLE IF NOT EXISTS Bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      seatNumber INT NOT NULL
    )
  `;

  const createPaymentsTable = `
    CREATE TABLE IF NOT EXISTS Payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      amountPaid DECIMAL(10, 2) NOT NULL,
      paymentStatus VARCHAR(50) NOT NULL
    )
  `;
  const tables = [
    { name: "Users", query: createUsersTable },
    { name: "Buses", query: createBusesTable },
    { name: "Bookings", query: createBookingsTable },
    { name: "Payments", query: createPaymentsTable },
  ];

  // Execute queries
  tables.forEach((table) => {
    connection.execute(table.query, (err) => {
      if (err) {
        console.log(`Error creating ${table.name} table:`, err);
      } else {
        console.log(
          `${table.name} table created successfully (or already exists).`,
        );
      }
    });
  });
});

app.get("/", (req, res) => {
  res.send("Hi");
});

app.listen(port, (req, res) => {
  console.log("Port is running on 3000");
});
