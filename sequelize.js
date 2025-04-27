const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',  // You can adjust this path as needed
});

module.exports = sequelize;
