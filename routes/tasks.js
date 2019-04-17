const express = require('express');
const router = express.Router();

const models = require('../models');
const middleware = require('./middleware.js');

// models
const User = models.User;
const Projects = models.Project;
const Stories = models.Stories;

// helpers
const StoriesHelper = require('../helpers/StoriesHelper');
const ProjectHelper = require('../helpers/ProjectHelper');
const TaskHelper = require('../helpers/TasksHelper');

router.get('/stories/:id', async function(req, res, next) {
    let taskStories = await TaskHelper.listTasks(req.params.id);
    console.log(taskStories);
    res.render('project', { errorMessages: 0, success: 0, tasks: taskStories, uid: req.task.name, description: req.task.description, time: req.task.time});
    
});

// ------------------ endpoint for creating new task ------------------
router.get('/task/:id/create', async function(req, res, next) {
    let story_id = req.params.id;
    let taskStories = await TaskHelper.listTasks(story_id);
    let selectedStory = await StoriesHelper.getStory(story_id);

    res.render('tasks', { errorMessages: 0, success: 0,
        storiesId: story_id, story: selectedStory, tasks: taskStories});
});

router.post('/task/:id/create', ProjectHelper.isSMorPM, async function(req, res, next) {
    let data = req.body;
    let stories_id = req.params.id;

    try {
        // Create new task
        const createdTask = Stories.build({
            name: data.name,
            description: data.description,
            time: data.time,
            stories_id: stories_id
        });

        // Validate story
        if (!await TaskHelper.isValidName(createdTask)){
            req.flash(req.flash('error', `Task Name: ${createdTask.name} already in use`));
            return res.render('tasks', { errorMessages: req.flash('error'), success: 0,
                stories_id: stories_id, uid: req.task.id, name: req.user.name});
        }

        await createdTask.save();

        req.flash('success', 'User story - ' + createdTask.name + ' has been successfully created');
        res.render('tasks', { errorMessages: req.flash('error'), success: 0,
                stories_id: stories_id, uid: req.task.id, name: req.user.name});

    } catch (e) {
        console.log(e);
        req.flash('error', 'Error!');
        res.render('tasks', { errorMessages: req.flash('error'), success: 0,
                stories_id: stories_id, uid: req.task.id, name: req.user.name});
    }

});


// ------------------ endpoint for editing existing story ------------------
router.get('/:id/edit/:taskId', ProjectHelper.isSMorPM, async function(req, res, next) {
    console.log("-------------------------------------------------------------------------");
    let tasks = await TaskHelper.getTask(req.params.taskId);
    console.log(tasks)
    return res.render('stories', { errorMessages: 0, success: 0, tasks: tasks,
        projectId: tasks.project_id, importance_values: importance_values, uid: req.user.id, username: req.user.username, isUser: req.user.is_user});

});

/*router.get('/:id/estimate/:taskId', ProjectHelper.isSMorPM, async function(req, res, next) {
    console.log("-------------------------------------------------------------------------");
    let tasks = await TaskHelper.getTask(req.params.storyId);
    console.log(tasks)
    return res.render('story_estimate', { errorMessages: 0, success: 0, tasks: tasks,
        projectId: tasks.project_id, importance_values: importance_values, uid: req.user.id, username: req.user.username, isUser: req.user.is_user});

});*/

router.post('/:id/edit/:taskId', ProjectHelper.isSMorPM, async function(req, res, next) {
    let data = req.body;
    let projectId = req.params.id;
    let task_id = req.params.taskId;

    let task = await Task.findOne({
        where: {
            id: task_id,
        }
    });

    // Set new attributes
    task.setAttributes({
        name: data.name,
        description: data.description,
        time: data.time,
        stories_id: task.stories_id
    });

    // validate task
    if (!await TaskHelper.isValidName(task)){
        let taskObject = await TaskHelper.getTask(task.id);
        req.flash('error', `Task Name: ${task.name} already in use`);
        return res.render('tasks', { errorMessages: req.flash('error'), success: 0, tasks: taskObject,
            projectId: story.project_id, importance_values: importance_values, uid: req.user.id, username: req.user.username, isUser: req.user.is_user});
    }

    await task.save();

    let task_updated = await Task.getTask(task);

    req.flash('success', 'Task - ' + task.name + ' has been successfully updated');
    return res.render('tasks', { errorMessages: 0, success: req.flash('success'), task: task_updated,
        projectId: story.project_id, importance_values: importance_values, uid: req.user.id, username: req.user.username, isUser: req.user.is_user});

});

/*router.post('/:id/delete/:storyId', ProjectHelper.isSMorPM, async function(req, res, next) {
    let data = req.body;
    let projectId = req.params.id;
    let story_id = req.params.storyId;

    await Stories.destroy({
        where: {
            id: story_id,
        }
    });

    res.redirect('/projects/' + projectId + '/view');

});*/


/*router.post('/:id/estimate/:storyId', ProjectHelper.isSMorPM, async function(req, res, next) {
    let data = req.body;
    let projectId = req.params.id;
    let story_id = req.params.storyId;

    let story = await Stories.findOne({
        where: {
            id: story_id,
        }
    });

    // Set new attributes
    story.setAttributes({
        timeComplexity: data.timeComplexity,
    });

    await story.save();

    res.redirect('/projects/' + projectId + '/view');

});*/


module.exports = router;