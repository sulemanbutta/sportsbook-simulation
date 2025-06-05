const { Op } = require('sequelize');
const { Bet } = require('../models');

async function getUnsettledBets(req) {
  try {
    const { Bet } = req.db;
    const now = new Date();
    const unsettledBets = await Bet.findAll({
      where: {
        status: 'PENDING',
        commence_time: {
          [Op.lt]: now
        }
      },
      raw: true,
      /*
      include: [
        {
          model: User,
          attributes: ['id', 'email'] // Add any user fields you want
        },
        {
          model: Parlay, // if the bet is part of a parlay
          include: [
            {
              model: ParlayLeg // include the legs for each parlay
            }
          ]
        }
      ]*/
    });
    //console.log("unsettledBets:", unsettledBets)
    return unsettledBets;
  } catch (err) {
    console.error('Error fetching unsettled bets:', err);
    throw err;
  }
};

module.exports = { getUnsettledBets };
