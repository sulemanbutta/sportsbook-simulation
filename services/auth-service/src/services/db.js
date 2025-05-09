require("dotenv").config();
const buildTimestamp = process.env.BUILD_TIMESTAMP || 'unknown';
const commitSha = process.env.COMMIT_SHA || 'unknown';
console.log(`▶️ [auth db.js] Auth DB Code Version: MAY8_V2`);
console.log(`▶️ [auth db.js] Build: ${buildTimestamp}`);
console.log(`▶️ [auth db.js] Commit: ${commitSha}`);
console.log(`▶️ [auth db.js] K_SERVICE: ${process.env.K_SERVICE}`);
console.log(`▶️ [auth db.js] DB_INSTANCE_CONNECTION_NAME: ${process.env.DB_INSTANCE_CONNECTION_NAME}`);
console.log(`▶️ [auth db.js] DB_HOST from env: ${process.env.DB_HOST}`);
console.log(`▶️ [auth db.js] DB_USER from env: ${process.env.DB_USER}`);

const { Sequelize } = require("sequelize");

const instanceConnectionName = process.env.DB_INSTANCE_CONNECTION_NAME; // e.g., my-project:us-central1:my-instance
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbPort = process.env.DB_PORT || 5432;

console.log(`▶️ [auth db.js] Connecting to Cloud SQL instance via Unix socket: /cloudsql/${instanceConnectionName}`);
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    dialect: "postgres",
    host: `/cloudsql/${instanceConnectionName}`,
    dialectOptions: {
      socketPath: `/cloudsql/${instanceConnectionName}`
    },
    logging: console.log,
  });


sequelize
  .authenticate()
  .then(() => {
    console.log("[auth db.js] Database connection successful.");
    return sequelize.sync({ alter: true }); 
  })
  .then(() => {
    console.log("[auth db.js] All models were synchronized successfully.");
  })
  .catch((err) => {
    console.error("[auth db.js] Database connection failed:", err);
    // process.exit(1);
  });

module.exports = sequelize;