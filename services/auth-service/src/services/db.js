require("dotenv").config();
const fs = require('fs');

// Version tracking for deployment verification
const buildTimestamp = process.env.BUILD_TIMESTAMP || process.env.BUILD_ID || 'unknown';
const commitSha = process.env.COMMIT_SHA || 'unknown';
console.log(`▶️ [auth db.js] Auth DB Code Version: SOCKET_FIXED_DEBUG_V2`);
console.log(`▶️ [auth db.js] Build: ${buildTimestamp}`);
console.log(`▶️ [auth db.js] Commit: ${commitSha}`);

// Environment detection
const isCloudRun = !!process.env.K_SERVICE;
console.log(`▶️ [auth db.js] Environment: ${isCloudRun ? 'Cloud Run' : 'Local Development'}`);

// Database connection parameters
const instanceConnectionName = process.env.DB_INSTANCE_CONNECTION_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

console.log(`▶️ [auth db.js] DB_INSTANCE_CONNECTION_NAME: ${instanceConnectionName}`);
console.log(`▶️ [auth db.js] DB_NAME: ${dbName}`);
console.log(`▶️ [auth db.js] DB_USER: ${dbUser}`);
console.log(`▶️ [auth db.js] DB_PASSWORD: ${dbPassword ? '[SET]' : '[NOT SET]'}`);

// Debug: Check socket directory
if (isCloudRun) {
  const socketDir = '/cloudsql';
  console.log(`▶️ [auth db.js] Checking socket directory: ${socketDir}`);
  
  try {
    if (fs.existsSync(socketDir)) {
      console.log(`✅ [auth db.js] Socket directory exists: ${socketDir}`);
      const contents = fs.readdirSync(socketDir);
      console.log(`▶️ [auth db.js] Socket directory contents:`, contents);
      
      // Check for the specific instance directory
      const instanceDir = `${socketDir}/${instanceConnectionName}`;
      if (fs.existsSync(instanceDir)) {
        console.log(`✅ [auth db.js] Instance directory exists: ${instanceDir}`);
        const instanceContents = fs.readdirSync(instanceDir);
        console.log(`▶️ [auth db.js] Instance directory contents:`, instanceContents);
      } else {
        console.log(`❌ [auth db.js] Instance directory does NOT exist: ${instanceDir}`);
      }
      
    } else {
      console.log(`❌ [auth db.js] Socket directory does NOT exist: ${socketDir}`);
    }
  } catch (error) {
    console.error(`❌ [auth db.js] Error checking socket directory:`, error.message);
  }
}

const { Sequelize } = require("sequelize");

let sequelize;
// Define socketPath in the outer scope
const socketPath = `/cloudsql/${instanceConnectionName}`;

if (isCloudRun && instanceConnectionName) {
  console.log(`▶️ [auth db.js] Using Cloud SQL Unix socket connection`);
  console.log(`▶️ [auth db.js] Socket path: ${socketPath}`);
  
  // Try the PostgreSQL socket connection approach
  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    dialect: "postgres",
    host: socketPath,  // Use socket path as host for PostgreSQL
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
      
      // Try alternative socket connection methods
      if (retries === 2) {
        console.log(`[auth db.js] 🔄 Trying dialectOptions socketPath approach`);
        
        try {
          const altSequelize = new Sequelize(dbName, dbUser, dbPassword, {
            dialect: "postgres",
            dialectOptions: {
              socketPath: socketPath
            },
            logging: console.log
          });
          
          await altSequelize.authenticate();
          console.log("[auth db.js] ✅ Alternative socketPath connection successful!");
          
          // Replace the main sequelize instance
          sequelize = altSequelize;
          await sequelize.sync({ alter: true });
          console.log("[auth db.js] ✅ Alternative models synchronized!");
          return;
          
        } catch (altErr) {
          console.error("[auth db.js] ❌ Alternative socketPath connection failed:", altErr.message);
        }
      }
      
      // Try a different socket format
      if (retries === 1) {
        console.log(`[auth db.js] 🔄 Trying .s.PGSQL.5432 socket format`);
        
        try {
          const pgSocketPath = `${socketPath}/.s.PGSQL.5432`;
          console.log(`[auth db.js] 🔗 Trying PostgreSQL socket: ${pgSocketPath}`);
          
          const pgSequelize = new Sequelize(dbName, dbUser, dbPassword, {
            dialect: "postgres",
            dialectOptions: {
              socketPath: pgSocketPath
            },
            logging: console.log
          });
          
          await pgSequelize.authenticate();
          console.log("[auth db.js] ✅ PostgreSQL socket format connection successful!");
          
          sequelize = pgSequelize;
          await sequelize.sync({ alter: true });
          console.log("[auth db.js] ✅ PostgreSQL socket models synchronized!");
          return;
          
        } catch (pgErr) {
          console.error("[auth db.js] ❌ PostgreSQL socket format failed:", pgErr.message);
        }
      }
      
      if (retries > 0) {
        retries--;
        const delay = 5000;
        console.log(`[auth db.js] ⏳ Retrying in ${delay/1000} seconds...`);
        setTimeout(connectWithRetry, delay);
      } else {
        console.error("[auth db.js] ❌ CRITICAL: All socket connection methods failed");
        console.error("[auth db.js] ❌ The Cloud SQL Auth Proxy may not be running properly");
        console.error("[auth db.js] ❌ Consider switching to direct IP connection");
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