const { Sequelize } = require("sequelize");

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
    console.log(`▶️ [auth db.js] Initializing Cloud SQL Proxy connection...`);
    
    try {
      // Cloud SQL Proxy approach - connect to localhost
      sequelize = new Sequelize(dbName, dbUser, dbPassword, {
        dialect: 'postgres',
        host: 'localhost', // Cloud SQL Proxy listens on localhost
        port: 5432,
        logging: false, // Security: no SQL in logs
        pool: {
          max: 5,
          min: 1,        // Keep connection alive
          acquire: 30000,
          idle: 300000,  // 5 minutes
          evict: 10000,
        },
        retry: {
          max: 3,
          timeout: 30000
        }
      });
      
      console.log(`▶️ [auth db.js] Testing Cloud SQL Proxy connection...`);
      const startTime = Date.now();
      
      await sequelize.authenticate();
      console.log(`✅ [auth db.js] Cloud SQL Proxy connection successful in ${Date.now() - startTime}ms`);
      
    } catch (proxyError) {
      console.error(`❌ [auth db.js] Cloud SQL Proxy failed: ${proxyError.message}`);
      console.log(`▶️ [auth db.js] Falling back to direct IP connection...`);
      
      // Fallback to direct IP
      sequelize = new Sequelize(dbName, dbUser, dbPassword, {
        dialect: "postgres",
        host: "34.172.127.125",
        port: 5432,
        logging: false,
        dialectOptions: {
          ssl: {
            require: false,
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
  }

  // Sync models
  console.log(`▶️ [auth db.js] Syncing models...`);
  await sequelize.sync({ alter: true });
  console.log("✅ Models synchronized!");

  return sequelize;
}

module.exports = { initializeDatabase };