require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const router = require('./routes/router');
const functions = require('./utils/functions');
const auth = require('./auth/auth');
const authFunctions = require('./auth/auth.helper.functions');
const cookieParser = require('cookie-parser');
const email = require('./email/email');
const db = require('./utils/db');
const path = require('path');
const date = require('./utils/date');
const helmet = require('helmet');
const logger = require('./utils/logger');

const app = express();
const port = process.env.PORT || 8080;

app.disable('x-powered-by');

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/', router);
app.use('/auth', auth);
app.use(express.static('public'));

//this doesn't seem to work as expected
app.get('/', async (req, res) => {
    const refreshTokenCookie = req.cookies.refresh_token;

    if (refreshTokenCookie) {
        const refreshToken = await db.checkForRefreshToken(refreshTokenCookie);

        if (refreshToken) {
            logger.info("Refresh token validated, proceed to Home");
            res.sendFile(path.join(__dirname, 'public', 'home.html'));
            //Potential for using template engine here to inject html with data based on
            //refresh token
        } else {
            logger.info("Invalid token, authentication needed");
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
            //Template engine here as well? It may help with scaling site and adding links 
            //and content that can be conditional based on presence of a valid token 
        }

    } else {
        logger.info("Invalid token, authentication needed");
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
}) 

async function run() {
    const users = await db.getUsers();

    await authFunctions.refreshAccessTokens(users);

    for (const user of users) {
        logger.info(`Fetching artists and releases for ${user.userEmail}...`);

        const followedArtists = await functions.getFollowedArtists(user);
        let releases = await functions.getReleasesByArtist(user, followedArtists);

        const numberOfDays = 7;

        const filteredReleases = await functions.filterReleases(releases, numberOfDays);
        const sortedReleases = await functions.sortReleasesByMostRecent(filteredReleases);
        const formattedReleases = await functions.formatReleases(sortedReleases);
        
        const now = new Date();
        const today = await date.getTodayDateString(now);
        const subject = await email.handleSubject(formattedReleases, today);

        const releasesOptions = {
            from: {
                name: 'Weekly Releases',
                address: 'anthony@weeklyreleases.com',
            },
            to: user.userEmail,
            subject: subject,
            template: 'releases',
            context: {
                todayDate: today,
                releases: formattedReleases,
            }
        }

        logger.info(`${user.userEmail} follows ${followedArtists.length} artists. They came out with ${formattedReleases.length} releases.`)
        await email.sendEmail(user.userEmail, releasesOptions);
    }
} 

// await run().catch(console.error);

// schedule the run() function to occur once, every Friday at 8am, Central Standard Time
const scheduledRun = cron.schedule('0 8 * * Fri', () => {
    logger.info("Starting the 8am request for new releases...\n")

    run().catch((error) => {
        logger.error(error);
    });
    
}, {
    scheduled: true,
    timezone: "US/Central"
});

scheduledRun.start();

app.use((req, res, next) => {
    res.status(404).send("Sorry can't find that!")
})

app.use((err, req, res, next) => {
    logger.error(err.stack)
    res.status(500).send('Something broke!')
})

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
})