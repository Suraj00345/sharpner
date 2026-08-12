const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection");

const studentCourses = sequelize.define("studentCourses", {
  id: {
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.INTEGER,
  },
  
});

module.exports = studentCourses;
