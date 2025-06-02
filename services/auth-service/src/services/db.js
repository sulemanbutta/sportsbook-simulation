require("dotenv").config();
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../../config/config.json')[env];
const buildTimestamp = process.env.BUILD_TIMESTAMP || process.env.BUILD_ID || 'unknown';
const commitSha = process.env.COMMIT_SHA || 'unknown';
console.log(`▶️ [auth db.js] Auth DB Code Version: SECURE_DIRECT_IP_V2`);
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

let sequelize;

if (isCloudRun) {
  console.log(`▶️ [auth db.js] Using SECURE direct IP connection with SSL`);
  // Enhanced secure configuration for direct IP connection
  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    dialect: "postgres",
    host: dbHost,
    port: 5432,
    dialectOptions: {
      ssl: {
        require: true,              // Force SSL connection
        rejectUnauthorized: false   // Required for Cloud SQL certificates
      },
      // Additional security options
      connectTimeout: 30000,        // 30 second connection timeout
      requestTimeout: 30000,        // 30 second query timeout
    },
    logging: (sql) => {
      // Only log queries in development, not passwords/sensitive data
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[SQL Query]: ${sql}`);
      }
    },
    pool: {
      max: 5,                       // Limit concurrent connections
      min: 0,
      acquire: 30000,
      idle: 10000,
      evict: 10000                  // Remove idle connections
    },
    // Security: Don't retry failed connections too aggressively
    retry: {
      max: 3,
      timeout: 30000
    }
  });
  
} else {
  // Local development
  console.log(`▶️ [auth db.js] Local development`);
  sequelize = new Sequelize(process.env[config.use_env_variable], config);

}

// Secure connection logic for Cloud Run
if (isCloudRun) {
  let retries = 3;
  
  const connectWithRetry = async () => {
    try {
      console.log(`[auth db.js] 🔐 Attempting SECURE SSL connection to ${dbHost}:5432...`);
      console.log(`[auth db.js] 🔐 SSL Required: Yes`);
      console.log(`[auth db.js] 🔐 Connection Timeout: 30s`);
      
      await sequelize.authenticate();
      console.log("[auth db.js] ✅ SECURE database connection successful!");
      console.log("[auth db.js] 🔐 SSL encryption active");
      
      await sequelize.sync({ alter: true });
      console.log("[auth db.js] ✅ Models synchronized!");
      
    } catch (err) {
      console.error(`[auth db.js] ❌ Secure connection failed (${retries} retries left):`, err.message);
      
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
  // Local development
  setTimeout(() => {
    sequelize.authenticate();
    sequelize.sync();
  }, 100);
}

module.exports = sequelize;