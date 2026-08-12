const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection");

const courses = sequelize.define("define", {
  id: {
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = courses;
