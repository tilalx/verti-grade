'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;
    await queryInterface.addColumn('climbingroutes', 'color', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "#000000",
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('climbingroutes', 'color');
  }
};