const express = require('express');
const router = express.Router();

const models = require('../models');
const middleware = require('./middleware.js');

// models
const User = models.User;
const Projects = models.Project;
const Stories = models.Stories;
const Tasks = models.Task;

// helpers
const StoriesHelper = require('../helpers/StoriesHelper');
const ProjectHelper = require('../helpers/ProjectHelper');
const TaskHelper = require('../helpers/TasksHelper');

router.get('/stories/:id', async function(req, res, next) {
    let story_id = req.params.id;
    let taskStories = await TaskHelper.listTasks(story_id);
    let selectedStory = await StoriesHelper.getStory(story_id);
    let currentProject = await ProjectHelper.getProject(selectedStory.Project.id);

    res.render('tasks', { errorMessages: 0, success: 0,
        storiesId: story_id, story: selectedStory, project: currentProject, tasks: taskStories});
});

// ------------------ endpoint for creating new task ------------------
router.get('/stories/:id/create', async function(req, res, next) {
    let story_id = req.params.id;
    let selectedStory = await StoriesHelper.getStory(story_id);

    let projectMembers = (await ProjectHelper.getProject(selectedStory.Project.id)).ProjectMembers

    res.render('add_edit_task', { errorMessages: 0, title: 'AC scrum vol2', 
        pageName: 'tasks', username: req.user.username,
        isUser: req.user.is_user, success: 0, story: selectedStory, users: projectMembers });
});

router.post('/stories/:id/create', async function(req, res, next) {
    let data = req.body;
    let storyId = req.params.id;
    let selectedStory = await StoriesHelper.getStory(storyId);
    let projectMembers = (await ProjectHelper.getProject(selectedStory.Project.id)).ProjectMembers

    try {
        let users = await User.findAllUsers();

        // Create new project
        const createdTask = Tasks.build({
            name: data.name,
            description: data.description,
            time: data.timeEstimate,
            stories_id: storyId,
            assigned_user: data.assignedUser ? data.assignedUser : null,
        });
        
        /*
        // Validate project
        if (!await ProjectHelper.isValidProject(createdProject)){
            req.flash(req.flash('error', `Project Name: ${createdProject.name} already in use!`));
            return res.render('add_edit_project', { errorMessages: req.flash('error'),users:users, success: 0,
                title: 'AC scrum vol2', pageName: 'projects',
                username: req.user.username, isUser: req.user.is_user });
        }
        */
        await createdTask.save();

        res.redirect('/tasks/stories/' + storyId);
    } catch (e) {
        console.log(e);
        req.flash('error', 'Error!');
        res.render('add_edit_task', { errorMessages: req.flash('error'), success: 0,
            title: 'AC scrum vol2', pageName: 'tasks',
            username: req.user.username, isUser: req.user.is_user, story: selectedStory, users: projectMembers});

    }
});


// ------------------ endpoint for editing existing story ------------------
router.get('/stories/:id/edit/:taskId', async function(req, res, next) {
    let story_id = req.params.id;
    let task_id = req.params.taskId;
    let selectedStory = await StoriesHelper.getStory(story_id);
    let selectedTask = await TaskHelper.getTask(task_id);

    let projectMembers = (await ProjectHelper.getProject(selectedStory.Project.id)).ProjectMembers

    res.render('add_edit_task', { errorMessages: 0, title: 'AC scrum vol2', 
        pageName: 'tasks', username: req.user.username,
        isUser: req.user.is_user, success: 0, story: selectedStory, toEditTask: selectedTask, users: projectMembers });
});

router.post('/stories/:id/edit/:taskId', async function(req, res, next) {
    let data = req.body;
    let task_id = req.params.taskId;
    let story_id = req.params.id

    let task = await TaskHelper.getTask(task_id);

    // Set new attributes
    task.setAttributes({
        name: data.name,
        description: data.description,
        time: data.timeEstimate,
        assigned_user: data.assignedUser,
    });

    /*
    // validate task
    if (!await TaskHelper.isValidName(task)){
        let taskObject = await TaskHelper.getTask(task.id);
        req.flash('error', `Task Name: ${task.name} already in use`);
        return res.render('tasks', { errorMessages: req.flash('error'), success: 0, tasks: taskObject,
            projectId: story.project_id, importance_values: importance_values, uid: req.user.id, username: req.user.username, isUser: req.user.is_user});
    }
    */
    await task.save();

    res.redirect('/tasks/stories/' + story_id);
});

router.post('/stories/:id/delete/:taskId', async function(req, res, next) {
    let data = req.body;
    let task_id = req.params.taskId;
    let story_id = req.params.id

    await Tasks.destroy({
        where: {
            id: task_id,
        }
    });

    res.redirect('/tasks/stories/' + story_id);
});

module.exports = router;