const { Sequelize } = require("sequelize");
const { Connector } = require('@google-cloud/cloud-sql-connector');

const isCloudRun = !!process.env.K_SERVICE;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

console.log(`▶️ [auth db.js] Environment: ${isCloudRun ? 'Cloud Run' : 'Local'}`);

let sequelize;

// Async initialization function
async function initializeDatabase() {
  if (sequelize) {
    console.log(`▶️ [auth db.js] Database already initialized`);
    return sequelize;
  }

  if (isCloudRun) {
    console.log(`▶️ [auth db.js] Initializing Cloud SQL Connector...`);
    
    const connector = new Connector();
    const clientOpts = await connector.getOptions({
      instanceConnectionName: 'sportsbook-simulation:us-central1:sportsbook-instance',
      ipType: 'PUBLIC',
    });
    
    console.log(`▶️ [auth db.js] Connection options ready`);
    
    sequelize = new Sequelize(dbName, dbUser, dbPassword, {
      dialect: 'postgres',
      logging: false, // Security fix: no SQL in logs
      dialectOptions: clientOpts,
      pool: {
        max: 3,        // Reduced from 5
        min: 1,        // Increased from 0 - keep connection alive
        acquire: 15000, // Reduced from 30000
        idle: 300000,   // 5 minutes
        evict: 1000,
      },
      retry: {
        max: 2,        // Reduced retries
        timeout: 10000 // Faster timeout
      }
    });
    
  } else {
    // Local development
    console.log(`▶️ [auth db.js] Initializing local connection`);
    sequelize = new Sequelize(dbName, dbUser, dbPassword, {
      dialect: "postgres",
      host: "localhost",
      port: 5432,
      logging: console.log,
    });
  }

  // Test connection
  console.log(`▶️ [auth db.js] Testing connection...`);
  await sequelize.authenticate();
  console.log("✅ Database connection successful!");
  
  await sequelize.sync({ alter: true });
  console.log("✅ Models synchronized!");

  return sequelize;
}

module.exports = { initializeDatabase };