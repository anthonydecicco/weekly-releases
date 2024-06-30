const express = require('express');
const appController = require('../controllers/appController');

const appRouter = express.Router();

appRouter.get('/', appController.indexLogic);
appRouter.get('/register', appController.registerLogic);
appRouter.get('/about', appController.aboutLogic);
appRouter.get('/privacy-policy', appController.privacyLogic);

module.exports = appRouter;