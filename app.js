require('dotenv').config();

//import node modules
const express = require('express');
const cron = require('node-cron');
const helmet = require('helmet');
const path = require('path');
const session = require('express-session');

//import routers
const appRouter = require('./routes/appRouter');
const testRouter = require('./routes/testRouter');
const authRouter = require('./routes/authRouter');
const apiRouter = require('./routes/apiRouter');
const dashRouter = require('./routes/dashRouter');

//import utils
const logger = require('./utils/logger');
const hbs = require('./utils/hbsEngine');
const sessionObject = require('./utils/sessionObject');
const getWeeklyReleases = require('./utils/weeklyReleases');

const app = express();
const port = process.env.PORT;

//set view engine
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname,'.', 'public', 'views'));

//if production, set cookies to secure
if (app.get('env') === 'production') {
    app.disable('x-powered-by');
    app.set('trust proxy', 1); 
    sessionObject.cookie.secure = true; 
}

//set middleware
app.use(session(sessionObject));
app.use(
    helmet.contentSecurityPolicy({
      useDefaults: true,
      directives: {
        "img-src": ["'self'", "https: data:"]
      }
    })
  )
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//set routers
app.use('/', appRouter);
app.use('/dashboard', dashRouter);
app.use('/auth', authRouter);
app.use('/api', apiRouter);
app.use(express.static('public'));
if (app.get('env') !== 'production') {
    app.use('/test', testRouter);
}

app.use(function (req, res, next) {
    res.status(404);
    res.json("Status: 404, Page not found");
    next();
});

// getWeeklyReleases().catch((error) => {
//     logger.error(error);
// });

//fetch weekly releases every Friday at 7am, Central Standard Time
const scheduledRun = cron.schedule('0 7 * * Fri', () => {
    logger.info("Starting the 7am request for new releases...\n")

    getWeeklyReleases().catch((error) => {
        logger.error(error);
    });

}, {
    scheduled: true,
    timezone: "US/Central"
});

scheduledRun.start();

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});
