const express = require('express');
const dashController = require('../controllers/dashController');

const dashRouter = express.Router();

dashRouter.get('/followed', dashController.dashFollowedLogic);
// dashRouter.get('/recommended', dashController.dashRecommendedLogic);
dashRouter.get('/settings', dashController.dashSettingsLogic);

module.exports = dashRouter;