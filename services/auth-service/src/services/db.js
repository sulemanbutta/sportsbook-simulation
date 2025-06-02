require("dotenv").config();
const fs = require('fs');

// Version tracking for deployment verification
const buildTimestamp = process.env.BUILD_TIMESTAMP || process.env.BUILD_ID || 'unknown';
const commitSha = process.env.COMMIT_SHA || 'unknown';
console.log(`▶️ [auth db.js] Auth DB Code Version: SOCKET_DEBUG_V1`);
console.log(`▶️ [auth db.js] Build: ${buildTimestamp}`);
console.log(`▶️ [auth db.js] Commit: ${commitSha}`);

// Environment detection
const isCloudRun = !!process.env.K_SERVICE;
console.log(`▶️ [auth db.js] Environment: ${isCloudRun ? 'Cloud Run' : 'Local Development'}`);

// Debug: Check if socket directory exists
if (isCloudRun) {
  const socketDir = '/cloudsql';
  console.log(`▶️ [auth db.js] Checking socket directory: ${socketDir}`);
  
  try {
    if (fs.existsSync(socketDir)) {
      console.log(`✅ [auth db.js] Socket directory exists: ${socketDir}`);
      const contents = fs.readdirSync(socketDir);
      console.log(`▶️ [auth db.js] Socket directory contents:`, contents);
    } else {
      console.log(`❌ [auth db.js] Socket directory does NOT exist: ${socketDir}`);
      console.log(`❌ [auth db.js] This indicates Cloud SQL instance is not properly attached`);
    }
  } catch (error) {
    console.error(`❌ [auth db.js] Error checking socket directory:`, error.message);
  }
}

// Database connection parameters
const instanceConnectionName = process.env.DB_INSTANCE_CONNECTION_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

console.log(`▶️ [auth db.js] DB_INSTANCE_CONNECTION_NAME: ${instanceConnectionName}`);
console.log(`▶️ [auth db.js] DB_NAME: ${dbName}`);
console.log(`▶️ [auth db.js] DB_USER: ${dbUser}`);
console.log(`▶️ [auth db.js] DB_PASSWORD: ${dbPassword ? '[SET]' : '[NOT SET]'}`);

// Check for conflicting environment variables
const conflictingVars = ['DB_HOST', 'DATABASE_URL', 'PGHOST', 'POSTGRES_HOST'];
conflictingVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`⚠️ [auth db.js] WARNING: ${varName} is set to: ${process.env[varName]}`);
    console.log(`⚠️ [auth db.js] This may interfere with socket connection`);
  }
});

const { Sequelize } = require("sequelize");

let sequelize;

if (isCloudRun && instanceConnectionName) {
  const socketPath = `/cloudsql/${instanceConnectionName}`;
  console.log(`▶️ [auth db.js] Using Cloud SQL Unix socket connection`);
  console.log(`▶️ [auth db.js] Socket path: ${socketPath}`);
  
  // Check if the specific socket file exists
  try {
    if (fs.existsSync(socketPath)) {
      console.log(`✅ [auth db.js] Socket path exists: ${socketPath}`);
      const stats = fs.statSync(socketPath);
      console.log(`▶️ [auth db.js] Socket is directory: ${stats.isDirectory()}`);
      if (stats.isDirectory()) {
        const socketContents = fs.readdirSync(socketPath);
        console.log(`▶️ [auth db.js] Socket directory contents:`, socketContents);
      }
    } else {
      console.log(`❌ [auth db.js] Socket path does NOT exist: ${socketPath}`);
    }
  } catch (error) {
    console.error(`❌ [auth db.js] Error checking socket path:`, error.message);
  }
  
  // Try multiple socket connection approaches
  console.log(`▶️ [auth db.js] Attempting socket connection with multiple approaches`);
  
  // Approach 1: Use socket path as host (PostgreSQL specific)
  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    dialect: "postgres",
    host: socketPath,  // Use socket path as host
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
  console.error(`❌ [auth db.js] CRITICAL ERROR: Running in Cloud Run but DB_INSTANCE_CONNECTION_NAME is missing!`);
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
        findOne: async () => null,
        findAll: async () => [],
        create: async (data) => ({ id: Math.floor(Math.random() * 1000), ...data }),
        findByPk: async () => null,
        update: async () => [1],
        destroy: async () => 1
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
  
  const connectWithRetry = async () => {
    try {
      console.log(`[auth db.js] 🔄 Attempting database connection (${retries} retries remaining)...`);
      console.log(`[auth db.js] 🔗 Connection approach: Socket path as host`);
      console.log(`[auth db.js] 🔗 Socket path: ${socketPath}`);
      
      await sequelize.authenticate();
      console.log("[auth db.js] ✅ Database authentication successful!");
      
      await sequelize.sync({ alter: true });
      console.log("[auth db.js] ✅ Database models synchronized successfully!");
      
    } catch (err) {
      console.error(`[auth db.js] ❌ Database connection failed (${retries} retries left)`);
      console.error(`[auth db.js] Error type: ${err.name}`);
      console.error(`[auth db.js] Error message: ${err.message}`);
      
      // If still getting TCP errors, try fallback approach
      if (err.message.includes('127.0.0.1') && retries === 2) {
        console.log(`[auth db.js] 🔄 Trying fallback: dialectOptions socketPath approach`);
        
        try {
          const fallbackSequelize = new Sequelize(dbName, dbUser, dbPassword, {
            dialect: "postgres",
            dialectOptions: {
              socketPath: `/cloudsql/${instanceConnectionName}`
            },
            logging: console.log
          });
          
          await fallbackSequelize.authenticate();
          console.log("[auth db.js] ✅ Fallback socket connection successful!");
          
          // Replace the main sequelize instance
          sequelize = fallbackSequelize;
          await sequelize.sync({ alter: true });
          console.log("[auth db.js] ✅ Fallback models synchronized!");
          return;
          
        } catch (fallbackErr) {
          console.error("[auth db.js] ❌ Fallback socket connection also failed:", fallbackErr.message);
        }
      }
      
      if (retries > 0) {
        retries--;
        const delay = 5000;
        console.log(`[auth db.js] ⏳ Retrying in ${delay/1000} seconds...`);
        setTimeout(connectWithRetry, delay);
      } else {
        console.error("[auth db.js] ❌ CRITICAL: All connection attempts failed");
        console.error("[auth db.js] ❌ Check Google Cloud Run Cloud SQL configuration");
      }
    }
  };
  
  connectWithRetry();
  
} else if (!isCloudRun) {
  setTimeout(() => {
    console.log("[auth db.js] 🚀 Starting local development mock connection...");
    sequelize.authenticate();
    sequelize.sync();
  }, 100);
}

module.exports = sequelize;