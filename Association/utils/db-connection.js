const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  "assocation",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "Suraj123",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false, // Set to console.log to see raw generated SQL queries
  },
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection to the database has been created");
  } catch (err) {
    console.log(err);
  }
})();

module.exports = sequelize;