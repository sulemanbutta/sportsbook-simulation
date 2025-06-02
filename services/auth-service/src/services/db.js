const { Sequelize } = require("sequelize");
const { Connector } = require('@google-cloud/cloud-sql-connector');

const isCloudRun = !!process.env.K_SERVICE;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

console.log(`▶️ [auth db.js] Environment: ${isCloudRun ? 'Cloud Run' : 'Local'}`);

let sequelize;

async function initializeDatabase() {
  if (isCloudRun) {
    console.log(`▶️ [auth db.js] Initializing Cloud SQL Connector...`);
    
    try {
      const connector = new Connector();
      
      console.log(`▶️ [auth db.js] Getting connection options...`);
      const clientOpts = await connector.getOptions({
        instanceConnectionName: 'sportsbook-simulation:us-central1:sportsbook-instance',
        ipType: 'PUBLIC',
      });
      
      console.log(`▶️ [auth db.js] Client options received:`, Object.keys(clientOpts));
      
      sequelize = new Sequelize(dbName, dbUser, dbPassword, {
        dialect: 'postgres',
        logging: false, // Disable SQL logging for security
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
    if (config.use_env_variable) {
      sequelize = new Sequelize(process.env[config.use_env_variable], config);
    } else {
      sequelize = new Sequelize(config.database, config.username, config.password, config);
    }
    
    console.log(`▶️ [auth db.js] Using local connection`);
  }

  // Test connection
  console.log(`▶️ [auth db.js] Testing connection...`);
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection successful!");
    
    await sequelize.sync({ alter: true });
    console.log("✅ Models synchronized!");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    throw err;
  }
}

// Initialize the database connection
initializeDatabase().catch(console.error);

module.exports = sequelize;