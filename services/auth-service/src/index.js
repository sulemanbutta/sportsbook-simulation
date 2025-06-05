const express = require('express');
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const { initializeDatabase } = require('./services/db');
const { loadModels } = require('./models');

// Global state
let db = null;
let dbReady = false;
let dbError = null;

async function initializeDatabaseAsync() {
  try {
    console.log('▶️ [index.js] Initializing database in background...');
    const sequelize = await initializeDatabase();
    console.log('✅ [index.js] Database initialized');
    
    console.log('▶️ [index.js] Loading models...');
    db = loadModels(sequelize);
    console.log('✅ [index.js] Models loaded');
    
    dbReady = true;
  } catch (error) {
    console.error('❌ [index.js] Database initialization failed:', error);
    dbError = error;
  }
}

function startServer() {
  console.log('▶️ [index.js] Starting Auth Service');
  
  // Set up Express app immediately
  const app = express();
  const allowed = [ 'https://sportsbook-simulation.web.app', 'https://sportsbook-simulation.firebaseapp.com', 'http://localhost:5173'];

  
  // Middleware
  app.use(express.json());
  app.use(cors({
    origin: allowed,
    methods: ['GET','POST','PUT','DELETE'],
    allowedHeaders: ['Content-Type','Authorization']
  }));
  
  // Health check - responds immediately
  app.get('/health', (req, res) => {
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbReady ? 'ready' : 'initializing'
    };
    
    if (dbError) {
      status.database = 'error';
      status.error = dbError.message;
    }
    
    res.json(status);
  });
  
  // Database-dependent routes with readiness check
  app.use('/auth', (req, res, next) => {
    if (!dbReady) {
      if (dbError) {
        return res.status(503).json({ 
          error: 'Database connection failed',
          message: 'Service temporarily unavailable'
        });
      }
      return res.status(503).json({ 
        error: 'Database initializing',
        message: 'Service starting up, please try again in a moment'
      });
    }
    
    // Make db available to routes
    req.db = db;
    next();
  });
  
  // Auth routes
  app.use('/auth', authRoutes);
  
  // Start server immediately
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`✅ Auth Service HTTP server running on port ${PORT}`);
  });
  
  // Initialize database in background
  initializeDatabaseAsync();
}

startServer();