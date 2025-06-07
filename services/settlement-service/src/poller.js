const { gradeUnsettledBetsAndParlayLegs } = require("./services/gradeUnsettledBetsAndParlayLegs");
const { initializeDatabase } = require('./services/db');
const { loadModels } = require('./models');

let db = null;

async function initializePoller() {
  try {
    // Initialize database and models
    const sequelize = await initializeDatabase();
    db = loadModels(sequelize);
    console.log('✅ Poller database initialized');
  } catch (error) {
    console.error('❌ Failed to initialize poller database:', error);
    throw error;
  }
}

function formatedTime() {
    const date = new Date()
    return (
      date.toLocaleDateString('en-US', {
        year: '2-digit',
        month: '2-digit',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Chicago',
        hour12: true,
      }) + ' CT'
    )
  }

function startPoller() {

  if (!db) {
    console.error('❌ Database not initialized. Call initializePoller() first.');
    return;
  }  

  setInterval(async () => {
    try {
      await gradeUnsettledBetsAndParlayLegs(db);
      const now = new Date()
      const currentTime = now.toLocaleTimeString('en-US', {
          timeZone: 'America/Chicago', 
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      console.log('Grading complete at', currentTime);
    } catch (err) {
      console.error('Error grading bets:', err);
    }
  }, 7 * 60 * 1000); // every 3 minutes
}

module.exports = { startPoller, initializePoller };