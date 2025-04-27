const { Sequelize } = require('sequelize');
const path = require('path');

// SQLite Database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'), // Define the SQLite file location
  logging: false, // Optional: Disable SQL query logging
});

module.exports = sequelize;
