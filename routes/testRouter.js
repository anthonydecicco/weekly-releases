const express = require('express');
const testController = require('../controllers/testController');

const testRouter = express.Router();

testRouter.get('/', testController.testLogic)
testRouter.get('/sendemail', testController.sendEmailLogic)

module.exports = testRouter;