const express = require('express');
const authController = require('../controllers/authController');

const authRouter = express.Router();

authRouter.get('/login', authController.loginLogic);
authRouter.get('/callback', authController.callbackLogic);
authRouter.post('/refresh_token', authController.refreshTokenLogic);

module.exports = authRouter;