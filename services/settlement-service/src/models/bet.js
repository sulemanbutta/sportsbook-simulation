module.exports = (sequlize, DataTypes) => {
  const Bet = sequlize.define(
    "Bet", 
    {
      bet_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      odds: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      stake: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      payout: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "PENDING"
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      event_id: {
        type:DataTypes.STRING,
        allowNull: false
      },
      home_team: {
        type:DataTypes.STRING,
        allowNull: false
      },
      away_team: {
        type:DataTypes.STRING,
        allowNull: false
      },
      selected_team: {
        type:DataTypes.STRING,
        allowNull: false
      },
      commence_time: {
        type:DataTypes.DATE,
        allowNull: false
      },
      sport: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "Bets",
      timestamps: false,
    }
  );

  return Bet;
};
