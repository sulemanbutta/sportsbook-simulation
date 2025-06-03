const { Sequelize } = require("sequelize");

const isCloudRun = !!process.env.K_SERVICE;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

console.log(`▶️ [auth db.js] Environment: ${isCloudRun ? 'Cloud Run' : 'Local'}`);

let sequelize;

async function initializeDatabase() {
  if (sequelize) {
    return sequelize;
  }

  if (isCloudRun) {
    // Try Cloud SQL Proxy first
    try {
      console.log(`▶️ [auth db.js] Attempting Cloud SQL Proxy connection...`);
      
      sequelize = new Sequelize(dbName, dbUser, dbPassword, {
        dialect: 'postgres',
        host: 'localhost',
        port: 5432,
        logging: false,
        pool: {
          max: 5,
          min: 1,
          acquire: 30000,
          idle: 300000,
        }
      });
      
      await sequelize.authenticate();
      console.log(`✅ [auth db.js] Cloud SQL Proxy connection successful!`);
      
    } catch (proxyError) {
      console.log(`⚠️ [auth db.js] Proxy failed: ${proxyError}`);
      console.log(`▶️ [auth db.js] Falling back to direct IP...`);
      
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
      console.log("✅ [auth db.js] Direct IP connection successful!");
    }
    
  } else {
    // Local development
    sequelize = new Sequelize(dbName, dbUser, dbPassword, {
      dialect: "postgres",
      host: "localhost",
      port: 5432,
      logging: console.log,
    });
    
    await sequelize.authenticate();
  }

  await sequelize.sync({ alter: true });
  console.log("✅ Models synchronized!");

  return sequelize;
}

module.exports = { initializeDatabase };