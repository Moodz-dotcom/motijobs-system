const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Employee = sequelize.define('Employee', {
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  phone: { type: DataTypes.STRING, allowNull: false },
  position: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING, allowNull: false },
  salary: { type: DataTypes.FLOAT, allowNull: false },
  dateOfJoining: { type: DataTypes.DATE, allowNull: false },
  cv: { type: DataTypes.STRING },
  profilePic: { type: DataTypes.STRING }, // ✅ Add this line
  password: DataTypes.STRING // <-- Add this line
});

module.exports = Employee;
