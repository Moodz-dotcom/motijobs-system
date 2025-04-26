// config/database.js
const { Sequelize } = require('sequelize');

// Initialize Sequelize with your database settings (example with SQLite)
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',  // Path to the SQLite database file
    logging: false  // Set to true if you want to see SQL queries in the console
});

// Export the Sequelize instance for use in other files
module.exports = sequelize;
