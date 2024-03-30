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
const date = require('./utils/date')

const app = express();
const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/', router);
app.use('/auth', auth);
app.use(express.static('public'));

app.get('/', async (req, res) => {
    const refreshTokenCookie = req.cookies.refresh_token;

    if (refreshTokenCookie) {
        const refreshToken = await db.checkForRefreshToken(refreshTokenCookie);

        if (refreshToken) {
            console.log("Refresh token validated, proceed to Home");
            res.sendFile(path.join(__dirname, 'public', 'home.html'));
            //Potential for using template engine here to inject html with data based on
            //refresh token
        } else {
            console.log("Invalid token, authentication needed");
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
            //Template engine here as well? It may help with scaling site and adding links 
            //and content that can be conditional based on presence of a valid token 
        }

    } else {
        console.log("Invalid token, authentication needed");
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
}) 

async function run() {

    const users = await db.getUsers();

    await authFunctions.refreshAccessTokens(users);

    for (const user of users) {
        const followedArtists = await functions.getFollowedArtists(user);
        let releases = await functions.getReleasesByArtist(user, followedArtists);

        const numberOfDays = 7;

        const filteredReleases = await functions.filterReleases(releases, numberOfDays);
        const sortedReleases = await functions.sortReleasesByMostRecent(filteredReleases);
        const formattedReleases = await functions.formatReleases(sortedReleases);

        // console.log(formattedReleases);

        const releasesOptions = {
            from: {
                name: 'Weekly Releases',
                address: 'anthony@weeklyreleases.com',
            },
            to: user.userEmail,
            subject: `\u{1F6A8}New Song Releases | ${date.todayDateString}\u{1F3A7}`,
            template: 'releases',
            context: {
                todayDate: date.todayDateString,
                userId: user.userId,
                releases: formattedReleases,
            }
        }

        await email.sendEmail(user, releasesOptions);
    }
}

// run().catch(console.error);

// schedule the run() function to occur every Friday at 9am, Central Standard Time
//For some reason this ran after 9am, and ran multiple times...
const scheduledRun = cron.schedule('* 9 * * Fri', () => {
    console.log("Starting the 9am request for new releases...\n")
    run();
}, {
    scheduled: false,
    timezone: "US/Central"
});

// scheduledRun.start();


