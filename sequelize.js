const { Sequelize } = require('sequelize');

// Reading the DATABASE_URL from the environment variables
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DATABASE_URL || './db/hr_system.db',  // Default to './db/hr_system.db' if not set
});

module.exports = sequelize;
