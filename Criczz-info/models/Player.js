const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Player = sequelize.define("Player", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  photo_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  birth_place: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  career: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  matches: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  fifties: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  centuries: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  wickets: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  average: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.0,
  },
});

module.exports = Player;
