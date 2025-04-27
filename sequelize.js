// sequelize.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.NODE_ENV === 'production') {
  // Running on Render (Production) -> use PostgreSQL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  // Running locally -> use SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
  });
}

module.exports = sequelize;
