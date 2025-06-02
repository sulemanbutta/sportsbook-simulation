require("dotenv").config();
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../../config/config.json')[env];
const buildTimestamp = process.env.BUILD_TIMESTAMP || process.env.BUILD_ID || 'unknown';
const commitSha = process.env.COMMIT_SHA || 'unknown';
console.log(`▶️ [auth db.js] Auth DB Code Version: SECURE_DIRECT_IP_V6`);
console.log(`▶️ [auth db.js] Build: ${buildTimestamp}`);
console.log(`▶️ [auth db.js] Commit: ${commitSha}`);

const isCloudRun = !!process.env.K_SERVICE;
console.log(`▶️ [auth db.js] Environment: ${isCloudRun ? 'Cloud Run' : 'Local Development'}`);

const { Sequelize } = require("sequelize");

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbHost = process.env.DB_HOST || "34.172.127.125";

console.log(`▶️ [auth db.js] DB_HOST: ${dbHost}`);
console.log(`▶️ [auth db.js] DB_NAME: ${dbName}`);
console.log(`▶️ [auth db.js] DB_USER: ${dbUser}`);
console.log(`▶️ [auth db.js] Using SECURE direct IP connection with SSL`);

let sequelize;

if (isCloudRun) {
  // Fixed SSL configuration for Cloud SQL direct connection
  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    dialect: "postgres",
    host: dbHost,
    port: 5432,
    dialectOptions: {
      ssl: {
        require: true,              // Force SSL connection
        rejectUnauthorized: false   // Don't verify SSL certificates (required for Cloud SQL)
      },
      // Connection timeouts
      connectTimeout: 30000,
      requestTimeout: 30000,
    },
    logging: (sql) => {
      // Only log queries in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[SQL Query]: ${sql}`);
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
      evict: 10000
    },
    retry: {
      max: 3,
      timeout: 30000
    }
  });
  
} else {
  // Local development
  console.log(`▶️ [auth db.js] Local development`);
  if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
  } else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
  }
}

// Connection logic for Cloud Run
if (isCloudRun) {
  let retries = 3;
  
  const connectWithRetry = async () => {
    try {
      console.log(`[auth db.js] 🔐 Attempting SECURE SSL connection to ${dbHost}:5432...`);
      console.log(`[auth db.js] 🔐 SSL Required: Yes (rejectUnauthorized: false)`);
      console.log(`[auth db.js] 🔐 Connection Timeout: 30s`);
      
      await sequelize.authenticate();
      console.log("[auth db.js] ✅ SECURE database connection successful!");
      console.log("[auth db.js] 🔐 SSL encryption active");
      
      await sequelize.sync({ alter: true });
      console.log("[auth db.js] ✅ Models synchronized!");
      
    } catch (err) {
      console.error(`[auth db.js] ❌ Secure connection failed (${retries} retries left):`, err.message);
      
      // Try without SSL requirement as fallback
      if (err.message.includes('certificate') && retries === 2) {
        console.log(`[auth db.js] 🔄 Trying connection without SSL requirement as fallback...`);
        
        try {
          const fallbackSequelize = new Sequelize(dbName, dbUser, dbPassword, {
            dialect: "postgres",
            host: dbHost,
            port: 5432,
            dialectOptions: {
              ssl: false  // Disable SSL for fallback
            },
            logging: console.log
          });
          
          await fallbackSequelize.authenticate();
          console.log("[auth db.js] ✅ Fallback connection (without SSL) successful!");
          
          // Replace the main sequelize instance
          sequelize = fallbackSequelize;
          await sequelize.sync({ alter: true });
          console.log("[auth db.js] ✅ Fallback models synchronized!");
          return;
          
        } catch (fallbackErr) {
          console.error("[auth db.js] ❌ Fallback connection also failed:", fallbackErr.message);
        }
      }
      
      if (retries > 0) {
        retries--;
        const delay = 5000;
        console.log(`[auth db.js] ⏳ Retrying secure connection in ${delay/1000} seconds...`);
        setTimeout(connectWithRetry, delay);
      } else {
        console.error("[auth db.js] ❌ Max retries reached - secure connection failed");
      }
    }
  };
  
  connectWithRetry();
  
} else {
  setTimeout(() => {
    sequelize.authenticate();
    sequelize.sync();
  }, 100);
}

module.exports = sequelize;