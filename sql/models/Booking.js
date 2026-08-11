const { DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection");

const Booking = sequelize.define(
  "Booking",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    seatNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: false, // Prevents Sequelize from sending createdAt and updatedAt in queries
  },
);

module.exports = Booking;
