const models = require('../models');
const Sprint = models.Sprint;

const SPRINT_INCLUDED_FIELDS = [
    {
        model: models.Project,
        as: 'Project',
        attributes: ['name', 'id'],
    }

];

async function currentActiveSprint(project_id){
    let sprint = await Sprint.findAll({
        include: [
            {
                model: models.Project,
                as: 'Project',
                attributes: ['name','id'],

            },
        ],
        where: {
            startDate: {
                [models.Sequelize.Op.lte]: new Date()
            },
            endDate: {
                [models.Sequelize.Op.gte]: new Date()
            },
            project_id: project_id,
        }
    });

    if (sprint.length > 0){
        return sprint[0].id;
    }

    return null
}

async function getSprint(sid) {
    // Solved with selection of assigned projects and then use those ids in query
    return await Sprint.findOne({
        include: SPRINT_INCLUDED_FIELDS,
        where: {
            [models.Sequelize.Op.or]: [
                {id: sid}
            ]
        },
    });
}

async function sprintsInProjects(project_ids){
    console.log("sprint query");
    let sprints = await models.Sprint.findAll({
        include: [
            {
                model: models.Project,
                as: 'Project',
                attributes: ['name','id'],

            },
        ],
        where: {
            [models.Sequelize.Op.or]: [{project_id: project_ids}]
        }
    });
    return sprints
}

module.exports = {
    currentActiveSprint,
    sprintsInProjects,
    getSprint
};