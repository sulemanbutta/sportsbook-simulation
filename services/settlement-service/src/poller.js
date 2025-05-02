const { gradeUnsettledBetsAndParlayLegs } = require("./services/gradeUnsettledBetsAndParlayLegs");

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
    setInterval(async () => {
      try {
        await gradeUnsettledBetsAndParlayLegs();
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

  module.exports = startPoller;