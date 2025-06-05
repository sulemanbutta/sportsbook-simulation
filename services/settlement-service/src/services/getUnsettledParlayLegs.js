const { Op } = require('sequelize');
const { ParlayLeg, Parlay } = require('../models');

async function getUnsettledParlayLegs(req) {
  try {
    const { Parlay } = req.db;
    const { ParlayLeg } = req.db;
    const now = new Date();
    const unsettledLegs = await ParlayLeg.findAll({
      where: {
        status: 'PENDING',
        commence_time: {
          [Op.lt]: now
        }
      },
      include: [
        {
          model: Parlay,
          as: 'parlay',
          attributes: ['parlay_id', 'user_id']
        }
      ],
      raw: true,
    });
    //console.log("unsettledLegs:", unsettledLegs)
    return unsettledLegs;
  } catch (err) {
    console.error('Error fetching unsettled parlay legs:', err);
    throw err;
  }
};

module.exports = { getUnsettledParlayLegs };