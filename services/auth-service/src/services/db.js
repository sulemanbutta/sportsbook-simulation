const { Sequelize } = require("sequelize");
const { Connector } = require('@google-cloud/cloud-sql-connector');

const isCloudRun = !!process.env.K_SERVICE;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

console.log(`▶️ [auth db.js] Environment: ${isCloudRun ? 'Cloud Run' : 'Local'}`);

let sequelize;

async function initializeDatabase() {
  if (sequelize) {
    console.log(`▶️ [auth db.js] Database already initialized`);
    return sequelize;
  }

  if (isCloudRun) {
    console.log(`▶️ [auth db.js] Starting Cloud SQL Connector initialization...`);
    
    try {
      // Step 1: Create connector
      console.log(`▶️ [auth db.js] Creating Connector instance...`);
      const connector = new Connector();
      
      // Step 2: Get connection options with 90-second timeout
      console.log(`▶️ [auth db.js] Getting connection options (may take 30-60 seconds)...`);
      const optionsStartTime = Date.now();
      
      const clientOpts = await Promise.race([
        connector.getOptions({
          instanceConnectionName: 'sportsbook-simulation:us-central1:sportsbook-instance',
          ipType: 'PUBLIC',
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getOptions() timeout after 90s')), 90000) // Increased timeout
        )
      ]);
      
      console.log(`✅ [auth db.js] Connection options received in ${Date.now() - optionsStartTime}ms`);
      
      // Step 3: Create Sequelize with optimized settings
      console.log(`▶️ [auth db.js] Creating optimized Sequelize instance...`);
      
      sequelize = new Sequelize(dbName, dbUser, dbPassword, {
        dialect: 'postgres',
        logging: false, // Turn off debug logging for performance
        dialectOptions: clientOpts,
        pool: {
          max: 3,         // Reduced max connections
          min: 1,         // Keep 1 connection alive
          acquire: 45000, // 45 seconds to get connection
          idle: 600000,   // 10 minutes idle timeout
          evict: 5000,    // Check every 5 seconds
        },
        retry: {
          max: 2,         // Fewer retries
          timeout: 30000  // 30 second retry timeout
        }
      });
      
      // Step 4: Test authentication with timeout
      console.log(`▶️ [auth db.js] Testing authentication...`);
      const authStartTime = Date.now();
      
      await Promise.race([
        sequelize.authenticate(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('authenticate() timeout after 30s')), 30000)
        )
      ]);
      
      console.log(`✅ [auth db.js] Authentication successful in ${Date.now() - authStartTime}ms`);
      
      // Step 5: Sync models
      console.log(`▶️ [auth db.js] Syncing models...`);
      await sequelize.sync({ alter: true });
      
      console.log(`✅ [auth db.js] Cloud SQL Connector initialization complete!`);
      
    } catch (error) {
      console.error(`❌ [auth db.js] Cloud SQL Connector failed:`, error.message);
      console.log(`▶️ [auth db.js] Falling back to direct IP connection...`);
      
      // Fallback to direct IP (your working solution)
      sequelize = new Sequelize(dbName, dbUser, dbPassword, {
        dialect: "postgres",
        host: "34.172.127.125",
        port: 5432,
        logging: false, // Still secure - no SQL in logs
        dialectOptions: {
          ssl: {
            require: false, // Your instance allows unencrypted
            rejectUnauthorized: false
          }
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        }
      });
      
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      console.log("✅ Direct IP connection successful!");
    }
    
  } else {
    // Local development
    console.log(`▶️ [auth db.js] Initializing local connection`);
    sequelize = new Sequelize(dbName, dbUser, dbPassword, {
      dialect: "postgres",
      host: "localhost",
      port: 5432,
      logging: console.log,
    });
    
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
  }

  return sequelize;
}

module.exports = { initializeDatabase };


