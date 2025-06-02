'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const db = {};

// Function to load models (will be called after database is initialized)
function loadModels(sequelize) {
  console.log("▶️ [models/index.js] Using provided database connection");
  console.log("▶️ [models/index.js] Loading models...");

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

  return db;
}

module.exports = { loadModels };