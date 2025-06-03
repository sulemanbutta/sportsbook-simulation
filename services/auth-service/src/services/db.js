const { Sequelize } = require("sequelize");
const { Connector } = require('@google-cloud/cloud-sql-connector');

const isCloudRun = !!process.env.K_SERVICE;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

console.log(`▶️ [auth db.js] Environment: ${isCloudRun ? 'Cloud Run' : 'Local'}`);
console.log(`▶️ [auth db.js] Debug info:`);
console.log(`   - DB_USER: ${dbUser}`);
console.log(`   - DB_NAME: ${dbName}`);
console.log(`   - NODE_VERSION: ${process.version}`);

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
      console.log(`▶️ [auth db.js] Step 1: Creating Connector instance...`);
      const startTime = Date.now();
      const connector = new Connector();
      console.log(`✅ [auth db.js] Connector created in ${Date.now() - startTime}ms`);
      
      // Step 2: Get connection options with timeout
      console.log(`▶️ [auth db.js] Step 2: Getting connection options...`);
      const optionsStartTime = Date.now();
      
      const clientOpts = await Promise.race([
        connector.getOptions({
          instanceConnectionName: 'sportsbook-simulation:us-central1:sportsbook-instance',
          ipType: 'PUBLIC',
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getOptions() timeout after 45s')), 45000)
        )
      ]);
      
      console.log(`✅ [auth db.js] Connection options received in ${Date.now() - optionsStartTime}ms`);
      console.log(`▶️ [auth db.js] Client options keys:`, Object.keys(clientOpts));
      
      // Step 3: Create Sequelize instance
      console.log(`▶️ [auth db.js] Step 3: Creating Sequelize instance...`);
      const sequelizeStartTime = Date.now();
      
      sequelize = new Sequelize(dbName, dbUser, dbPassword, {
        dialect: 'postgres',
        logging: (sql) => console.log(`[SQL DEBUG]: ${sql.substring(0, 100)}...`), // Temporary debug logging
        dialectOptions: clientOpts,
        pool: {
          max: 5,
          min: 0,
          acquire: 60000,  // 60 seconds
          idle: 300000,    // 5 minutes
          evict: 10000,
        },
        retry: {
          max: 3,
          timeout: 60000   // 60 seconds
        }
      });
      
      console.log(`✅ [auth db.js] Sequelize instance created in ${Date.now() - sequelizeStartTime}ms`);
      
      // Step 4: Test authentication
      console.log(`▶️ [auth db.js] Step 4: Testing authentication...`);
      const authStartTime = Date.now();
      
      await Promise.race([
        sequelize.authenticate(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('authenticate() timeout after 45s')), 45000)
        )
      ]);
      
      console.log(`✅ [auth db.js] Authentication successful in ${Date.now() - authStartTime}ms`);
      
      // Step 5: Sync models
      console.log(`▶️ [auth db.js] Step 5: Syncing models...`);
      const syncStartTime = Date.now();
      
      await Promise.race([
        sequelize.sync({ alter: true }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('sync() timeout after 30s')), 30000)
        )
      ]);
      
      console.log(`✅ [auth db.js] Models synced in ${Date.now() - syncStartTime}ms`);
      console.log(`✅ [auth db.js] Total initialization time: ${Date.now() - startTime}ms`);
      
    } catch (error) {
      console.error(`❌ [auth db.js] Initialization failed:`, error);
      console.error(`❌ [auth db.js] Error details:`, {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500)
      });
      throw error;
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


