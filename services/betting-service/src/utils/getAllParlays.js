const { ParlayLeg, Parlay } = require('../models');

async function getAllParlays(req) {
  try {
    const { Parlay } = req.db;
    const { ParlayLeg } = req.db;
    const parlays = await Parlay.findAll({
      where: {
        user_id: req.user.sub,
      },
      include: [
        {
          model: ParlayLeg,
          as: 'legs',
          //attributes: ['home_team', 'away_team', 'selected_team', 'status', 'odds', 'commence_time']
        }
      ],
      //raw: true,
    });
    //console.log("parlays:", parlays)
    //return parlays;
    const plainParlays = parlays.map(parlay => parlay.toJSON());
    return plainParlays;
  } catch (err) {
    console.error('Error fetching unsettled parlay legs:', err);
    throw err;
  }
};

module.exports = { getAllParlays };