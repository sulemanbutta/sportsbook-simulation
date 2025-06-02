require("dotenv").config();

// Version tracking for deployment verification
const buildTimestamp = process.env.BUILD_TIMESTAMP || process.env.BUILD_ID || 'unknown';
const commitSha = process.env.COMMIT_SHA || 'unknown';
console.log(`▶️ [auth db.js] Auth DB Code Version: SOCKET_STEP_BY_STEP_V1`);
console.log(`▶️ [auth db.js] Build: ${buildTimestamp}`);
console.log(`▶️ [auth db.js] Commit: ${commitSha}`);

// Environment detection
const isCloudRun = !!process.env.K_SERVICE;
console.log(`▶️ [auth db.js] Environment: ${isCloudRun ? 'Cloud Run' : 'Local Development'}`);
console.log(`▶️ [auth db.js] K_SERVICE: ${process.env.K_SERVICE}`);

// Database connection parameters
const instanceConnectionName = process.env.DB_INSTANCE_CONNECTION_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

console.log(`▶️ [auth db.js] DB_INSTANCE_CONNECTION_NAME: ${instanceConnectionName}`);
console.log(`▶️ [auth db.js] DB_NAME: ${dbName}`);
console.log(`▶️ [auth db.js] DB_USER: ${dbUser}`);
console.log(`▶️ [auth db.js] DB_PASSWORD: ${dbPassword ? '[SET]' : '[NOT SET]'}`);

const { Sequelize } = require("sequelize");

let sequelize;

if (isCloudRun && instanceConnectionName) {
  // Cloud Run with socket path connection
  const socketPath = `/cloudsql/${instanceConnectionName}`;
  console.log(`▶️ [auth db.js] Using Cloud SQL Unix socket connection`);
  console.log(`▶️ [auth db.js] Socket path: ${socketPath}`);
  
  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    dialect: "postgres",
    dialectOptions: {
      socketPath: socketPath
    },
    logging: (sql) => {
      console.log(`[SQL Query]: ${sql}`);
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
  
} else if (isCloudRun && !instanceConnectionName) {
  // Error case: Cloud Run without instance connection name
  console.error(`❌ [auth db.js] CRITICAL ERROR: Running in Cloud Run but DB_INSTANCE_CONNECTION_NAME is missing!`);
  console.error(`❌ [auth db.js] Required environment variable: DB_INSTANCE_CONNECTION_NAME`);
  console.error(`❌ [auth db.js] Expected format: project:region:instance`);
  process.exit(1);
  
} else {
  // Local development - mock database
  console.log(`▶️ [auth db.js] Local development mode - using mock database`);
  
  sequelize = {
    authenticate: async () => {
      console.log("[auth db.js] ✅ Mock database connection (local development)");
      return Promise.resolve();
    },
    sync: async () => {
      console.log("[auth db.js] ✅ Mock model sync (local development)");
      return Promise.resolve();
    },
    define: (modelName, attributes, options = {}) => {
      console.log(`[auth db.js] 📝 Mock model defined: ${modelName}`);
      return {
        name: modelName,
        // Mock CRUD operations
        findOne: async (options) => {
          console.log(`[${modelName}] Mock findOne called`);
          return null;
        },
        findAll: async (options) => {
          console.log(`[${modelName}] Mock findAll called`);
          return [];
        },
        create: async (data) => {
          console.log(`[${modelName}] Mock create called with:`, Object.keys(data));
          return { id: Math.floor(Math.random() * 1000), ...data };
        },
        findByPk: async (id) => {
          console.log(`[${modelName}] Mock findByPk called with ID:`, id);
          return null;
        },
        update: async (data, options) => {
          console.log(`[${modelName}] Mock update called`);
          return [1];
        },
        destroy: async (options) => {
          console.log(`[${modelName}] Mock destroy called`);
          return 1;
        }
      };
    },
    query: async (sql, options) => {
      console.log("[auth db.js] 📝 Mock query:", sql);
      return [[], {}];
    }
  };
}

// Connection logic for Cloud Run only
if (isCloudRun && instanceConnectionName) {
  let retries = 3;
  let isConnected = false;
  
  const connectWithRetry = async () => {
    try {
      console.log(`[auth db.js] 🔄 Attempting database connection (${retries} retries remaining)...`);
      console.log(`[auth db.js] 🔗 Connection details:`);
      console.log(`[auth db.js]    Database: ${dbName}`);
      console.log(`[auth db.js]    User: ${dbUser}`);
      console.log(`[auth db.js]    Socket: /cloudsql/${instanceConnectionName}`);
      
      await sequelize.authenticate();
      console.log("[auth db.js] ✅ Database authentication successful!");
      isConnected = true;
      
      console.log("[auth db.js] 🔄 Synchronizing database models...");
      await sequelize.sync({ alter: true });
      console.log("[auth db.js] ✅ Database models synchronized successfully!");
      
      console.log("[auth db.js] 🎉 Database setup complete and ready!");
      
    } catch (err) {
      console.error(`[auth db.js] ❌ Database connection failed (${retries} retries left)`);
      console.error(`[auth db.js] Error type: ${err.name}`);
      console.error(`[auth db.js] Error message: ${err.message}`);
      
      // Detailed error analysis
      if (err.message.includes('ENOENT') || err.message.includes('No such file')) {
        console.error("[auth db.js] 🔍 DIAGNOSIS: Socket file not found");
        console.error("[auth db.js] 🔍 CAUSES:");
        console.error("[auth db.js] 🔍   1. Cloud SQL instance not attached to Cloud Run service");
        console.error("[auth db.js] 🔍   2. Incorrect instance connection name");
        console.error("[auth db.js] 🔍   3. Cloud SQL proxy not started");
      } else if (err.message.includes('ECONNREFUSED')) {
        console.error("[auth db.js] 🔍 DIAGNOSIS: Connection refused by database");
        console.error("[auth db.js] 🔍 CAUSES:");
        console.error("[auth db.js] 🔍   1. Database credentials incorrect");
        console.error("[auth db.js] 🔍   2. Database user doesn't exist");
        console.error("[auth db.js] 🔍   3. Database user lacks permissions");
      } else if (err.message.includes('authentication failed')) {
        console.error("[auth db.js] 🔍 DIAGNOSIS: Authentication failed");
        console.error("[auth db.js] 🔍 CAUSES:");
        console.error("[auth db.js] 🔍   1. Incorrect password");
        console.error("[auth db.js] 🔍   2. User doesn't exist");
      } else if (err.message.includes('does not exist')) {
        console.error("[auth db.js] 🔍 DIAGNOSIS: Database does not exist");
        console.error("[auth db.js] 🔍 SOLUTION: Create database 'sportsbook_db'");
      }
      
      if (retries > 0) {
        retries--;
        const delay = 5000;
        console.log(`[auth db.js] ⏳ Retrying in ${delay/1000} seconds...`);
        setTimeout(connectWithRetry, delay);
      } else {
        console.error("[auth db.js] ❌ CRITICAL: Max retries reached - database connection failed");
        console.error("[auth db.js] ❌ Application will continue but database operations will fail");
        console.error("[auth db.js] ❌ Check Cloud Run service configuration and try redeploying");
      }
    }
  };
  
  // Start connection attempt
  connectWithRetry();
  
} else if (!isCloudRun) {
  // Local development - immediate mock connection
  setTimeout(() => {
    console.log("[auth db.js] 🚀 Starting local development mock connection...");
    sequelize.authenticate();
    sequelize.sync();
  }, 100);
}

module.exports = sequelize;