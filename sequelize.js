// sequelize.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: false // Optional: silence SQL logs
});

module.exports = sequelize;
