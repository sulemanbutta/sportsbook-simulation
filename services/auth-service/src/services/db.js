const { Sequelize } = require("sequelize");
const { Connector } = require('@google-cloud/cloud-sql-connector');

const isCloudRun = !!process.env.K_SERVICE;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

console.log(`▶️ [auth db.js] Environment: ${isCloudRun ? 'Cloud Run' : 'Local'}`);
console.log(`▶️ [auth db.js] DB_USER: ${dbUser}`);
console.log(`▶️ [auth db.js] DB_NAME: ${dbName}`);

let sequelize;

if (isCloudRun) {
  console.log(`▶️ [auth db.js] Initializing Cloud SQL Connector...`);
  
  try {
    const connector = new Connector();
    
    console.log(`▶️ [auth db.js] Getting connection options...`);
    const clientOpts = connector.getOptions({
      instanceConnectionName: 'sportsbook-simulation:us-central1:sportsbook-instance',
      ipType: 'PUBLIC',
    });
    
    console.log(`▶️ [auth db.js] Client options:`, clientOpts);
    
    sequelize = new Sequelize(dbName, dbUser, dbPassword, {
      dialect: 'postgres',
      logging: console.log, // Enable logging temporarily to debug
      dialectOptions: clientOpts,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      }
    });
    
    console.log(`▶️ [auth db.js] Sequelize instance created with Cloud SQL Connector`);
    
  } catch (error) {
    console.error(`❌ [auth db.js] Error setting up Cloud SQL Connector:`, error);
    throw error;
  }
  
} else {
  // Local development
  console.log(`▶️ [auth db.js] Local development`);
  if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
  } else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
  }
}

// Connection test with detailed error info
console.log(`▶️ [auth db.js] Testing connection...`);
sequelize.authenticate()
  .then(() => {
    console.log("✅ Database connection successful!");
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log("✅ Models synchronized!");
  })
  .catch(err => {
    console.error("❌ Database connection failed:");
    console.error("Error message:", err.message);
    console.error("Error code:", err.code);
    console.error("Error syscall:", err.syscall);
    console.error("Full error:", err);
  });

module.exports = sequelize;