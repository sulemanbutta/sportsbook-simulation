module.exports = (sequelize, DataTypes) => {
    const Parlay = sequelize.define('Parlay', {
      parlay_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      odds: {
        type: DataTypes.FLOAT,
        allowNull: true // Can be calculated after all legs are added
      },
      stake: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      payout: {
        type: DataTypes.FLOAT,
        allowNull: true // To be calculated post-settlement
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'PENDING'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      tableName: 'Parlays',
      timestamps: false
    });
  
    Parlay.associate = (models) => {
      Parlay.hasMany(models.ParlayLeg, { foreignKey: 'parlay_id', as: 'legs' });
    };
  
    return Parlay;
  };