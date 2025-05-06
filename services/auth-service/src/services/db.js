require("dotenv").config();
const { Sequelize } = require("sequelize");

// Decide host: GCP - socket path; Local - hostname
const host = process.env.DB_HOST;      // e.g. '/cloudsql/...' or 'db'
const port = process.env.DB_PORT || 5432;
const isSocket = host.startsWith("/cloudsql/");

console.log("▶️ [db.js] Connecting with host:", host, "port:", port);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    dialect: "postgres",
    // Do NOT set host/port when using socket. Let pg use socketPath only.
    ...(isSocket
      ? {
          dialectOptions: {
            socketPath: host,
            // Fully disable SSL/TLS
            ssl: {
              require: false,
              rejectUnauthorized: false
            }
          }
        }
      : {
          host,
          port: process.env.DB_PORT || 5432
        }),
  }
);

/*
// Detect whether you're running in GCP (socket path) or locally (hostname)
const isSocket = process.env.DB_HOST?.startsWith("/cloudsql/");
console.log("▶️ [db.js] Sequelize init - DB_HOST:", process.env.DB_HOST);
console.log("▶️ [db.js] Sequelize init - isSocket:", isSocket);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    dialect: "postgres",
    // If socket mode, leave host/port undefined (driver will use socketPath)
    host: isSocket ? undefined : process.env.DB_HOST,
    port: isSocket ? undefined : process.env.DB_PORT,
    dialectOptions: isSocket
      ? { socketPath: process.env.DB_HOST }
      : {}
  }
);

console.log("▶️ [db.js] Sequelize options:", {
  host: isSocket ? undefined : process.env.DB_HOST,
  port: isSocket ? undefined : process.env.DB_PORT,
  socketPath: isSocket ? process.env.DB_HOST : null
});
*/
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection successful")
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    //process.exit(1);
  })
/*
async function init() {
  await sequelize.authenticate();
  console.log("✅ Auth DB connected");
  // await sequelize.sync({ alter: true });

}
*/
module.exports = sequelize;