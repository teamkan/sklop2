'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.bulkInsert('Tasks', [
      {
        name: 'Task 1',
        description: 'This is Task description 1',
        time: 1,
        stories_id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Task 2',
        description: 'This is Task description 2',
        time: 1,
        stories_id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Task 3',
        description: 'This is sk description 3',
        time: 1,
        stories_id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

    ], {});
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
  }
};
