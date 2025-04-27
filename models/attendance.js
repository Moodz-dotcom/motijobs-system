const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Attendance = sequelize.define('Attendance', {
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  checkIn: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  checkOut: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  // options for model
  timestamps: false,  // if you don't want to automatically track createdAt/updatedAt
});

module.exports = Attendance;
