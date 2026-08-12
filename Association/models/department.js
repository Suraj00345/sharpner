const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection");

const department = sequelize.define("department", {
  id: {
    primaryKey: true,
    type: DataTypes.INTEGER,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
  },
});

module.exports = department;
