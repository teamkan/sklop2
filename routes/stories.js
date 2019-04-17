const express = require('express');
const router = express.Router();

const models = require('../models/');
const middleware = require('./middleware.js');

// models
const User = models.User;
const Projects = models.Project;
const Stories = models.Stories;

// helpers
const StoriesHelper = require('../helpers/StoriesHelper');
const ProjectHelper = require('../helpers/ProjectHelper');

//constants
const importance_values = ['must have', 'could have', 'should have', 'won\'t have this time'];

router.get('/project/:id', async function(req, res, next) {
    let projectStories = await StoriesHelper.listStories(req.params.id);
    console.log(projectStories);
    res.render('project', { errorMessages: 0, success: 0, stories: projectStories, uid: req.user.id, username: req.user.username, isUser: req.user.is_user});
});

// ------------------ endpoint for creating new story ------------------
router.get('/project/:id/create', ProjectHelper.isSMorPM, async function(req, res, next) {
    let project_id = req.params.id;

    res.render('stories', { errorMessages: 0, success: 0,
        projectId: project_id, importance_values: importance_values, uid: req.user.id, username: req.user.username, isUser: req.user.is_user});
});

router.post('/project/:id/create', ProjectHelper.isSMorPM, async function(req, res, next) {
    let data = req.body;
    let project_id = req.params.id;

    try {
        // Create new user story
        const createdUserStory = Stories.build({
            name: data.name,
            description: data.description,
            acceptanceCriteria: data.acceptanceCriteria,
            importance: data.importance,
            businessValue: data.businessValue,
            project_id: project_id
        });

        // Validate story
        if (!await StoriesHelper.isValidName(createdUserStory)){
            req.flash(req.flash('error', `Story Name: ${createdUserStory.name} already in use`));
            return res.render('stories', { errorMessages: req.flash('error'), success: 0,
                projectId: project_id, importance_values: importance_values, uid: req.user.id, username: req.user.username, isUser: req.user.is_user});
        }

        await createdUserStory.save();

        req.flash('success', 'User story - ' + createdUserStory.name + ' has been successfully created');
        res.render('stories', { errorMessages: 0, success: req.flash('success'),
            projectId: project_id, importance_values: importance_values, uid: req.user.id, username: req.user.username, isUser: req.user.is_user});

    } catch (e) {
        console.log(e);
        req.flash('error', 'Error!');
        res.render('stories', { errorMessages: req.flash('error'), success: 0,
            projectId: project_id, importance_values: importance_values, uid: req.user.id, username: req.user.username, isUser: req.user.is_user});

    }

});


// ------------------ endpoint for editing existing story ------------------
router.get('/:id/edit/:storyId', ProjectHelper.isSMorPM, async function(req, res, next) {
    console.log("-------------------------------------------------------------------------");
    let userStory = await StoriesHelper.getStory(req.params.storyId);
    console.log(userStory)
    return res.render('stories', { errorMessages: 0, success: 0, userStory: userStory,
        projectId: userStory.project_id, importance_values: importance_values, uid: req.user.id, username: req.user.username, isUser: req.user.is_user});

});

router.get('/:id/estimate/:storyId', ProjectHelper.isSMorPM, async function(req, res, next) {
    console.log("-------------------------------------------------------------------------");
    let userStory = await StoriesHelper.getStory(req.params.storyId);
    console.log(userStory)
    return res.render('story_estimate', { errorMessages: 0, success: 0, userStory: userStory,
        projectId: userStory.project_id, importance_values: importance_values, uid: req.user.id, username: req.user.username, isUser: req.user.is_user});

});

router.post('/:id/edit/:storyId', ProjectHelper.isSMorPM, async function(req, res, next) {
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
        name: data.name,
        description: data.description,
        acceptanceCriteria: data.acceptanceCriteria,
        importance: data.importance,
        businessValue: data.businessValue ? data.businessValue : null,
        project_id: story.project_id
    });

    // validate story
    if (!await StoriesHelper.isValidName(story)){
        let storyObject = await StoriesHelper.getStory(story.id);
        req.flash('error', `Project Name: ${story.name} already in use`);
        return res.render('stories', { errorMessages: req.flash('error'), success: 0, userStory: storyObject,
            projectId: story.project_id, importance_values: importance_values, uid: req.user.id, username: req.user.username, isUser: req.user.is_user});
    }

    await story.save();

    let story_updated = await StoriesHelper.getStory(story_id);

    req.flash('success', 'User story - ' + story.name + ' has been successfully updated');
    return res.render('stories', { errorMessages: 0, success: req.flash('success'), userStory: story_updated,
        projectId: story.project_id, importance_values: importance_values, uid: req.user.id, username: req.user.username, isUser: req.user.is_user});

});

router.post('/:id/delete/:storyId', ProjectHelper.isSMorPM, async function(req, res, next) {
    let data = req.body;
    let projectId = req.params.id;
    let story_id = req.params.storyId;

    await Stories.destroy({
        where: {
            id: story_id,
        }
    });

    res.redirect('/projects/' + projectId + '/view');

});


router.post('/:id/estimate/:storyId', ProjectHelper.isSMorPM, async function(req, res, next) {
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

});

module.exports = router;