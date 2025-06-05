const dotenv = require('dotenv');
const path = require('path');

// Only load .env files in non-production environments
if (process.env.NODE_ENV !== 'production') {
  const envFile = process.env.NODE_ENV === 'development' 
    ? '.env.development' 
    : '.env.local';
  
  dotenv.config({ path: path.join(__dirname, '../../', envFile) });
}

const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 8080,
  debug: process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development',
  
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'sportsbook_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.NODE_ENV === 'production'
  },
  
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  
  // Cloud Run detection
  isCloudRun: !!process.env.K_SERVICE,
};

// Validation for production
if (config.nodeEnv === 'production') {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is required in production');
  }
  if (!config.database.password) {
    throw new Error('DB_PASSWORD is required in production');
  }
}

if (config.debug) {
  console.log('🔧 Backend Config:', {
    ...config,
    database: { ...config.database, password: '***' },
    jwtSecret: config.jwtSecret ? '***' : 'NOT SET'
  });
}

module.exports = config;