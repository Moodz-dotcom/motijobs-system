const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Guest = sequelize.define('Guest', {
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  email: {
    type: DataTypes.STRING,
    unique: true
  },
  phone: DataTypes.STRING
});

module.exports = Guest;
