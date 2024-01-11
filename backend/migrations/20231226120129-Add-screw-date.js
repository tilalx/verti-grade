'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add column 'screwDate' to 'climbingroutes'
    await queryInterface.addColumn('climbingroutes', 'screwDate', {
      type: Sequelize.DATE,  // TIMESTAMP in SQL
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove column 'screwDate' from 'climbingroutes'
    await queryInterface.removeColumn('climbingroutes', 'screwDate');
  }
};
