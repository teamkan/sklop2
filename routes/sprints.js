var express = require('express');
var router = express.Router();
var models = require('../models/');

const User = models.User;
const Sprint = models.Sprint;
const Stories = models.Stories;

var middleware = require('./middleware.js');

var ProjectHelper = require('../helpers/ProjectHelper');
var SprintsHelper = require('../helpers/SprintsHelper');
var StoriesHelper = require('../helpers/StoriesHelper');
const TaskHelper = require('../helpers/TasksHelper');
var moment = require('moment')

var myProjects;
var ad_sm_projects;

router.get('/', middleware.ensureAuthenticated, async function(req, res, next) {
    let user = req.user;
    myProjects              = await ProjectHelper.getAllowedProjects(user.id);
    let assignedProjectsIds = myProjects.map( (row) => {return row.id});
    let sprints             = await SprintsHelper.sprintsInProjects(assignedProjectsIds);
    var is_sm = false;
    for(let project of myProjects){
        if(project.scrum_master === user.id ){
            is_sm = true;
            ad_sm_projects = await ProjectHelper.getSMProjects(user.id);
            break
        }
    }

    res.render('sprints',{
        projects:myProjects,
        sprints: sprints,
        errorMessages: 0,
        title: 'AC scrum vol2',
        pageName: 'sprints',
        username: req.user.username,
        isUser: req.user.is_user,
        is_sm:is_sm,
        success: 0
    });
});

//--------
router.get('/:id/addstories/:idsprint', async function(req, res, next) {
    //preverjanje za casovno ocenjenost in realiziranost je implementirano v pugu
    let projectStories = await StoriesHelper.listStoriesForSprint(req.params.id);
    let currentSprint = await SprintsHelper.getSprint(req.params.idsprint);
    let currentProject = await ProjectHelper.getProject(currentSprint.Project.id);

    let sprintStories = await StoriesHelper.listSprintStories(req.params.idsprint);

    let remVel = currentSprint.velocity;

    for(let i = 0; i < sprintStories.length; i++) {
        remVel -= sprintStories[i].timeComplexity;
    }

    res.render('sprints_addstories', { errorMessages: 0, success: 0, stories: projectStories, remVel: remVel, project: currentProject, sprint: currentSprint, idsprint: req.params.idsprint, uid: req.user.id, username: req.user.username, isUser: req.user.is_user});
});

//--------
router.get('/:id/backlog/:idsprint', async function(req, res, next) {
    //preverjanje za casovno ocenjenost in realiziranost je implementirano v pugu
    let projectStories = await StoriesHelper.listStoriesForSprint(req.params.id);
    let currentSprint = await SprintsHelper.getSprint(req.params.idsprint);
    let currentProject = await ProjectHelper.getProject(currentSprint.Project.id);

    let sprintStories = await StoriesHelper.listSprintStories(req.params.idsprint);

    let tasks = [];
    for(let i = 0; i < sprintStories.length; i++) {
        let taskStories = await TaskHelper.listTasks(sprintStories[i].id);
        for(let j = 0; j < taskStories.length; j++)
            tasks.push(taskStories[j]);
    }

    console.log(tasks);

    res.render('sprint_backlog', { errorMessages: 0, success: 0, stories: sprintStories, tasks: tasks, project: currentProject, sprint: currentSprint, idsprint: req.params.idsprint, uid: req.user.id, username: req.user.username, isUser: req.user.is_user});
});

router.post('/:id/addstories/:idsprint', async function(req, res, next) {
    let data = req.body;
    let sprint_id = req.params.idsprint;

    let stories = data.Stories;

    for(let i = 0; i < stories.length; i++) {
        let story = await Stories.findOne({
            where: {
                id: stories[i],
            }
        });

        story.setAttributes({
            sprint_id: sprint_id
        });
    
        await story.save();
    }

    res.redirect('/sprints');
});

router.post('/', ProjectHelper.isSMorAdmin, async function(req, res, next) {
    let data = req.body;

    try {
        var selected_date_array = data.selected_date.split(" to ");
        var s_date = selected_date_array[0];
        var e_date = selected_date_array[1];


        var s_formated = moment(s_date,'DD.MM.YYYY').format("YYYY-MM-DD")
        var e_formatted = moment(e_date, 'DD.MM.YYYY').format("YYYY-MM-DD")


        var Date_s_date = new Date(s_formated);
        var Date_e_date = new Date(e_formatted);

        var existing_sprints = await models.Sprint.findAll({
            where: {
                project_id: data.sprint_project
            }
        });

        for(let s of existing_sprints){
            var Date_es_start = new Date(s.startDate);
            var Date_es_end   = new Date(s.endDate);
            console.log(s.toString());
            if((Date_s_date >= Date_es_start && Date_s_date <= Date_es_end) ||
                (Date_e_date >= Date_es_start && Date_e_date <= Date_es_end)){
                req.flash('error', 'Sprint dates overlapping!');
                res.render('sprint', { errorMessages: req.flash('error'), success: 0,
                    title: 'AC scrum vol2', pageName: 'add_sprint',projects:ad_sm_projects,
                    username: req.user.username, isUser: req.user.is_user });
                return;
            }
        }


        var expected_velocity = 31;
        if (expected_velocity  <= data.velocity || data.velocity <= 0){
            req.flash('error', 'Irregular sprint velocity!')
            res.render('sprint', { errorMessages: req.flash('error'), success: 0,
                    title: 'AC scrum vol2', pageName: 'add_sprint',projects:ad_sm_projects,
                    username: req.user.username, isUser: req.user.is_user });
            return;
        }

        // Create new sprint
        const createdSprint = await Sprint.create({
            startDate: s_formated,
            endDate: e_formatted,
            velocity: data.velocity,
            project_id:data.sprint_project
        });

        req.flash('success');
        res.render("sprint", {
            projects: ad_sm_projects,
            pageName: "sprints",
            errorMessages: 0,
            title: 'AC scrum vol2',
            // pageName: 'add_sprint',
            username: req.user.username,
            isUser: req.user.is_user,
            success: req.flash('success')});
    } catch (e){
        console.log("New sprint  error: " + e.toString());
        req.flash('error', 'Error!');
        res.render("sprint", {
            projects: ad_sm_projects,
            pageName: "sprints",
            errorMessages: req.flash('error'),
            title: 'AC scrum vol2',
            // pageName: 'add_sprint',
            username: req.user.username,
            isUser: req.user.is_user,
            success: 0});

    }

});

router.get('/create/', middleware.ensureAuthenticated, async function(req, res, next) {
    let users = await User.findAllUsers();
    res.render('sprint', { errorMessages: 0, title: 'AC scrum vol2', users: users,
        projects: ad_sm_projects, pageName: 'sprints', username: req.user.username,
        isUser: req.user.is_user, success: 0 });
});


module.exports = router;
