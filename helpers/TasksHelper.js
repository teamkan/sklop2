const models = require('../models');

const Task = models.Task;
var sequelize = require('sequelize')


const TASK_INCLUDED_FIELDS = [
    {
        model: models.User,
        as: 'AssignedUser',
        attributes: ['name','id'],
    },
];

async function isValidName(task) {
    // Check if there is another task with same name, case insensitive
    let existing = await Task.findAll({
        where: {
            name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), task.name.toLowerCase())
        }
    });
    if (existing.length === 0){
        return true;
    } else {
        // If saving same object - it is ok.
        return existing[0].id === task.id;
    }
}

async function listTasks(storiesId) {
    return await Task.findAll( {
        include: TASK_INCLUDED_FIELDS,
        where: {
            stories_id: storiesId,
        }
    });
}

async function getTask(taskID) {
    return await Task.findOne( {
        include: TASK_INCLUDED_FIELDS,
        where: {
            id: taskID,
        }
    });
}

module.exports = {
    getTask,
    listTasks,
    isValidName
};