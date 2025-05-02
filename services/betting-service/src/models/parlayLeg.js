module.exports = (sequelize, DataTypes) => {
    const ParlayLeg = sequelize.define('ParlayLeg', {
      leg_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      parlay_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      event_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      home_team: {
        type: DataTypes.STRING,
        allowNull: false
      },
      away_team: {
        type: DataTypes.STRING,
        allowNull: false
      },
      selected_team: {
        type: DataTypes.STRING,
        allowNull: false
      },
      odds: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'PENDING'
      },
      commence_time: {
        type:DataTypes.DATE,
        allowNull: false
      },
      sport: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    }, {
      tableName: 'ParlayLegs',
      timestamps: false
    });
  
    ParlayLeg.associate = (models) => {
      ParlayLeg.belongsTo(models.Parlay, { foreignKey: 'parlay_id', as: 'parlay' });
    };
  
    return ParlayLeg;
  };