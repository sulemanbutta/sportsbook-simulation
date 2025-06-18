const { Sequelize } = require("sequelize");
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../../config/config.json')[env];
const isCloudRun = !!process.env.K_SERVICE;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbHost = process.env.DB_HOST;

console.log(`▶️ [settlement db.js] Environment: ${isCloudRun ? 'Cloud Run' : 'Development'}`);

let sequelize;

async function initializeDatabase() {
  if (sequelize) {
    return sequelize;
  }

  if (isCloudRun) {
    console.log(`▶️ [settlement db.js] Connecting to Cloud SQL via direct IP...`);
    sequelize = new Sequelize(dbName, dbUser, dbPassword, {
      dialect: "postgres",
      host: dbHost,
      port: 5432,
      logging: false, // Security: no SQL queries in logs
      dialectOptions: {
        ssl: {
          require: false,
          rejectUnauthorized: false
        }
      },
      pool: {
        max: 10,        // Increase max connections (was 5)
        min: 2,         // Keep some connections ready (was 1)
        acquire: 120000, // 2 minutes instead of 30 seconds
        idle: 60000,    // Shorter idle time (was 5 minutes)
        evict: 30000,   // Check for idle connections more frequently
      },
      retry: {
        max: 3,
        backoffBase: 1000,
        backoffExponent: 1.1,
      }
    });
    
  } else {
    // Local development
    if (config.use_env_variable) {
      sequelize = new Sequelize(process.env[config.use_env_variable], config);
    } else {
      sequelize = new Sequelize(config.database, config.username, config.password, config);
    }
  }

  console.log(`▶️ [settlement db.js] Testing connection...`);
  await sequelize.authenticate();
  console.log("✅ [settlement db.js] Database connection successful!");
  
  await sequelize.sync({ alter: true });
  console.log("✅ [settlement db.js] Models synchronized!");

  return sequelize;
}

module.exports = { initializeDatabase };