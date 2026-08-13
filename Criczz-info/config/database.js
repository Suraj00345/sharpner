const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("cricket_db", "root", "Suraj123", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
});

module.exports = sequelize;
