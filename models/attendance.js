// models/attendance.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');  // Correct relative path

const Attendance = sequelize.define('Attendance', {
    employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    clockInTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    clockOutTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    totalHoursWorked: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
}, {});

module.exports = Attendance;
