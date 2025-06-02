require("dotenv").config();
console.log("▶️ [index.js] Starting Auth Service");
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const { initializeDatabase } = require('./config/db'); // Updated path
const { loadModels } = require('./models'); 

async function startServer() {
  console.log('▶️ [index.js] Starting Auth Service');
  
  try {
    // Step 1: Initialize database connection
    console.log('▶️ [index.js] Initializing database...');
    const sequelize = await initializeDatabase();
    console.log('✅ [index.js] Database initialized');
    
    // Step 2: Load models using your existing logic
    console.log('▶️ [index.js] Loading models...');
    const db = loadModels(sequelize); // Pass sequelize to your existing function
    console.log('✅ [index.js] Models loaded');
    
    // Step 3: Set up Express app
    console.log('▶️ [index.js] Setting up Express app...');
    const app = express();
    const allowed = [ 'https://sportsbook-simulation.web.app', 'https://sportsbook-simulation.firebaseapp.com' ];
    // Middleware
    app.use(express.json());
    app.use(cors({
      origin: allowed,
      methods: ['GET','POST','PUT','DELETE'],
      allowedHeaders: ['Content-Type','Authorization']
    }));
    
    // Make db available to routes (if you use this pattern)
    app.locals.db = db;
    
    // Routes
    const authRoutes = require('./routes/auth');
    app.use('/auth', authRoutes);
    
    // Health check
    app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
    
    // Start server
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`✅ Auth Service running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('❌ [index.js] Failed to start server:', error);
    process.exit(1);
  }
}