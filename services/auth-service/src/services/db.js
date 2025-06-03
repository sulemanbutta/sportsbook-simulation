const { Sequelize } = require("sequelize");
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const isCloudRun = !!process.env.K_SERVICE;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

console.log(`▶️ [auth db.js] Environment: ${isCloudRun ? 'Cloud Run' : 'Local'}`);

let sequelize;

async function debugCloudSQLProxy() {
  if (!isCloudRun) return;
  
  try {
    console.log(`🔍 [auth db.js] Debugging Cloud SQL Proxy setup...`);
    
    // Check if proxy process is running
    const { stdout: processes } = await execAsync('ps aux | grep -i cloud || echo "No cloud processes found"');
    console.log(`🔍 [auth db.js] Running processes:`, processes);
    
    // Check what's listening on port 5432
    const { stdout: netstat } = await execAsync('netstat -tuln | grep 5432 || echo "Nothing on port 5432"');
    console.log(`🔍 [auth db.js] Port 5432 status:`, netstat);
    
    // Check environment variables
    console.log(`🔍 [auth db.js] Environment variables:`);
    console.log(`   - GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || 'not set'}`);
    console.log(`   - CLOUDSQL_INSTANCES: ${process.env.CLOUDSQL_INSTANCES || 'not set'}`);
    
    // Check if Unix socket exists
    const { stdout: sockets } = await execAsync('ls -la /cloudsql/ 2>/dev/null || echo "No /cloudsql directory"');
    console.log(`🔍 [auth db.js] Unix sockets:`, sockets);
    
  } catch (error) {
    console.log(`🔍 [auth db.js] Debug error: ${error.message}`);
  }
}

async function initializeDatabase() {
  if (sequelize) {
    console.log(`▶️ [auth db.js] Database already initialized`);
    return sequelize;
  }

  if (isCloudRun) {
    // Debug first
    await debugCloudSQLProxy();
    
    // Try Cloud SQL Proxy approaches
    try {
      console.log(`▶️ [auth db.js] Trying Cloud SQL Proxy (TCP localhost)...`);
      
      // Wait a bit for proxy to potentially start up
      console.log(`▶️ [auth db.js] Waiting 5 seconds for proxy startup...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      
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
      
      console.log(`▶️ [auth db.js] Testing Cloud SQL Proxy connection...`);
      await sequelize.authenticate();
      console.log(`✅ [auth db.js] Cloud SQL Proxy (TCP) connection successful!`);
      
    } catch (tcpError) {
      console.log(`⚠️ [auth db.js] TCP localhost failed: ${tcpError.message}`);
      
      // Try Unix socket approach
      try {
        console.log(`▶️ [auth db.js] Trying Cloud SQL Proxy (Unix socket)...`);
        
        sequelize = new Sequelize(dbName, dbUser, dbPassword, {
          dialect: 'postgres',
          host: '/cloudsql/sportsbook-simulation:us-central1:sportsbook-instance',
          logging: false,
          dialectOptions: {
            socketPath: '/cloudsql/sportsbook-simulation:us-central1:sportsbook-instance/.s.PGSQL.5432'
          },
          pool: {
            max: 5,
            min: 1,
            acquire: 30000,
            idle: 300000,
          }
        });
        
        await sequelize.authenticate();
        console.log(`✅ [auth db.js] Cloud SQL Proxy (Unix socket) connection successful!`);
        
      } catch (socketError) {
        console.log(`⚠️ [auth db.js] Unix socket failed: ${socketError.message}`);
        
        // Direct IP fallback
        console.log(`▶️ [auth db.js] Falling back to direct IP connection...`);
        
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
        console.log("✅ Direct IP connection successful!");
      }
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