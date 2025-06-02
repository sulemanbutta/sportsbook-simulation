require("dotenv").config();
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../../config/config.json')[env];
const buildTimestamp = process.env.BUILD_TIMESTAMP || process.env.BUILD_ID || 'unknown';
const commitSha = process.env.COMMIT_SHA || 'unknown';
console.log(`▶️ [auth db.js] Auth DB Code Version: SECURE_DIRECT_IP_V7`);
console.log(`▶️ [auth db.js] Build: ${buildTimestamp}`);
console.log(`▶️ [auth db.js] Commit: ${commitSha}`);



const { Sequelize } = require("sequelize");
const { Connector } = require('@google-cloud/cloud-sql-connector');

const isCloudRun = !!process.env.K_SERVICE;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

let sequelize;

if (isCloudRun) {

  const connector = new Connector();
  const clientOpts = connector.getOptions({
    instanceConnectionName: 'sportsbook-simulation:us-central1:sportsbook-instance',
    ipType: 'PUBLIC',
  });

  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    dialect: 'postgres',
    logging: false, // Disable SQL logging for security
    dialectOptions: clientOpts,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    }
  });
  
  console.log(`▶️ [auth db.js] Using Cloud SQL Connector`);
  
} else {
  // Local development
  console.log(`▶️ [auth db.js] Local development`);
  if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
  } else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
  }
}

// Connection test
sequelize.authenticate()
  .then(() => {
    console.log("✅ Database connection successful!");
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log("✅ Models synchronized!");
  })
  .catch(err => {
    console.error("❌ Database connection failed:", err.message);
  });


module.exports = sequelize;