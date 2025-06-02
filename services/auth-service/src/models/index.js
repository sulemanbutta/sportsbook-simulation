'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
//const env = process.env.NODE_ENV || 'development';
//const config = require(__dirname + '/../../config/config.json')[env];
const db = {};

const sequelize = require("../services/db"); 

console.log("▶️ [models/index.js] Using existing database connection");
console.log("▶️ [models/index.js] Loading models...");

/*
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}
*/

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    console.log(`▶️ [models/index.js] Loading model file: ${file}`);
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
    console.log(`▶️ [models/index.js] ✅ Model loaded: ${model.name}`);
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    console.log(`▶️ [models/index.js] Setting up associations for: ${modelName}`);
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

const modelNames = Object.keys(db).filter(k => k !== 'sequelize' && k !== 'Sequelize');
console.log(`▶️ [models/index.js] ✅ All models loaded: ${modelNames.join(', ')}`);

module.exports = db;
