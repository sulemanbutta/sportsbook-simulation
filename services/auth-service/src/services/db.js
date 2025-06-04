const { Sequelize } = require("sequelize");

const isCloudRun = !!process.env.K_SERVICE;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbHost = "34.172.127.125"; // Your Cloud SQL IP

console.log(`▶️ [auth db.js] Environment: ${isCloudRun ? 'Cloud Run' : 'Local'}`);

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
    sequelize = new Sequelize(dbName, dbUser, dbPassword, {
      dialect: "postgres",
      host: "localhost",
      port: 5432,
      logging: console.log,
    });
  }

  console.log(`▶️ [auth db.js] Testing connection...`);
  await sequelize.authenticate();
  console.log("✅ [auth db.js] Database connection successful!");
  
  await sequelize.sync({ alter: true });
  console.log("✅ [auth db.js] Models synchronized!");

  return sequelize;
}

module.exports = { initializeDatabase };