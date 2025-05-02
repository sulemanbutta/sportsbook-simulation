'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ParlayLegs', {
      leg_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        allowNull: false
      },
      parlay_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Parlays',
          key: 'parlay_id'
        },
        onDelete: 'CASCADE'
      },
      event_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      home_team: {
        type: Sequelize.STRING,
        allowNull: false
      },
      away_team: {
        type: Sequelize.STRING,
        allowNull: false
      },
      selected_team: {
        type: Sequelize.STRING,
        allowNull: false
      },
      odds: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'PENDING'
      },
      commence_time: {
        type:Sequelize.DATE,
        allowNull: false
      },
      sport: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('ParlayLegs');
  }
};