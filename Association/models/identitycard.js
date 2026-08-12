const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../utils/db-connection");

const IndentityCard = sequelize.define('indentitycard', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  cardNo: {
    type: DataTypes.INTEGER,
    unique: true,
    allowNull: false,
  },
});

module.exports = IndentityCard;
