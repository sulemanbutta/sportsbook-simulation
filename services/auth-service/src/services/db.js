const { Sequelize } = require("sequelize");
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../../config/config.json')[env];
const isCloudRun = !!process.env.K_SERVICE;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbHost = process.env.DB_HOST;

console.log(`▶️ [auth db.js] Environment: ${isCloudRun ? 'Cloud Run' : 'Development'}`);

let sequelize;

async function initializeDatabase() {
  if (sequelize) {
    return sequelize;
  }

  if (isCloudRun) {
    console.log(`▶️ [auth db.js] Connecting to Cloud SQL via direct IP...`);
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
        max: 5,
        min: 1,
        acquire: 30000,
        idle: 300000,
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

  console.log(`▶️ [auth db.js] Testing connection...`);
  await sequelize.authenticate();
  console.log("✅ [auth db.js] Database connection successful!");
  
  await sequelize.sync({ alter: true });
  console.log("✅ [auth db.js] Models synchronized!");

  return sequelize;
}

module.exports = { initializeDatabase };