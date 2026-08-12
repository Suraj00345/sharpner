const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('bus_booking_db', 'root', 'Suraj123', {
  host: 'localhost',
  dialect: 'mysql', // or 'postgres', 'sqlite'
  logging: false
});

module.exports = sequelize;