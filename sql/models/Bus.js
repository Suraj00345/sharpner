const { DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection");

const Bus = sequelize.define(
  "Bus",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    busNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    totalSeats: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    availableSeats: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: false, // Prevents Sequelize from sending createdAt and updatedAt in queries
  },
);

module.exports = Bus;
