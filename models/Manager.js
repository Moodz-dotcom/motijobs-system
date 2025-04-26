const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Manager = sequelize.define('Manager', {
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  email: {
    type: DataTypes.STRING,
    unique: true
  },
  phone: DataTypes.STRING,
  department: DataTypes.STRING,
  profilePic: DataTypes.STRING,
  password: DataTypes.STRING // <-- Add this line
});

module.exports = Manager;
