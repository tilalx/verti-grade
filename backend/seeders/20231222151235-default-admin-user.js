'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [{
      firstname: 'admin',
      lastname: 'admin',
      email: 'example@example.de',
      password: '$2a$12$Zw0AyApAKVuHhqR4nDItiOLXLmTV8ivX/b2uqx4Z9gOk5/2eN25MG', // Pre-hashed password
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { email: 'example@example.de' });
  }
};