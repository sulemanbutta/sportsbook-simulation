'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Bets", {
      bet_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()")
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      odds: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      stake: {
        type: Sequelize.FLOAT,
        alloNull: false,
      },
      payout: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "PENDING"
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      event_id: {
        type:Sequelize.STRING,
        allowNull: false
      },
      home_team: {
        type:Sequelize.STRING,
        allowNull: false
      },
      away_team: {
        type:Sequelize.STRING,
        allowNull: false
      },
      selected_team: {
        type:Sequelize.STRING,
        allowNull: false
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
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Bets');
  }
};
