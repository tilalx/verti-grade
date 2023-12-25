'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Define the table 'routeratings'
    await queryInterface.createTable('routeratings', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      routeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'climbingroutes',  // This should match the table name for ClimbingRoute
          key: 'id'
        }
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      difficulty: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      difficultySign: {
        type: Sequelize.ENUM('+', '-'),
        allowNull: true,
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the table if we're rolling back
    await queryInterface.dropTable('routeratings');
  },
};
