const express = require('express');
const apiController = require('../controllers/apiController');

const apiRouter = express.Router();

apiRouter.get('/followedartists', apiController.followedArtistsLogic);
apiRouter.get('/recommendedartists', apiController.recommendedArtistsLogic);
apiRouter.post('/updateemail', apiController.updateEmailLogic);
apiRouter.post('/deletedata', apiController.deleteUserDataLogic);

module.exports = apiRouter;