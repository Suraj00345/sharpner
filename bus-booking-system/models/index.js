const sequelize = require('../config/database');
const User = require('./User');
const Bus = require('./Bus');
const Booking = require('./Booking');

// --- Associations ---

// 1. User <-> Booking (One-to-Many)
User.hasMany(Booking, { foreignKey: 'userId', onDelete: 'CASCADE' });
Booking.belongsTo(User, { foreignKey: 'userId' });

// 2. Bus <-> Booking (One-to-Many)
Bus.hasMany(Booking, { foreignKey: 'busId', onDelete: 'CASCADE' });
Booking.belongsTo(Bus, { foreignKey: 'busId' });

module.exports = {
  sequelize,
  User,
  Bus,
  Booking
};