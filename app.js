require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const router = require('./routes/router');
const routerFunctions = require('./routes/router.helper.functions');
const functions = require('./utils/functions');
const auth = require('./auth/auth');
const authFunctions = require('./auth/auth.helper.functions');
const cookieParser = require('cookie-parser');
const email = require('./email/email')

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api', router);
app.use('/auth', auth)
app.use(express.static('public'));

//build in logic for showing user front-end based on cookie

// app.use((req, res, next) => {
//     // Access the refresh token from the cookie
//     const refreshToken = req.cookies.refresh_token;
//     console.log("Refresh Token:", refreshToken);
//     // "next()" tells express to jump to the next middleware function in the app, load before routes
//     next();
// })

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

async function run() {

    const users = await routerFunctions.getUsers();

    await authFunctions.refreshAccessTokens(users);

    for (const user of users) {
        const followedArtists = await functions.getFollowedArtists(user);
        let releases = await functions.getReleasesByArtist(user, followedArtists);

        const numberOfDays = 7;

        const filteredReleases = await functions.filterReleases(releases, numberOfDays);
        const sortedReleases = await functions.sortReleasesByMostRecent(filteredReleases);
        const formattedReleases = await functions.formatReleases(sortedReleases);

        // console.log(formattedReleases);

        await email.sendEmailToUser(user, formattedReleases);
    }
}

// run().catch(console.error);

// schedule the run() function to occur every Friday at 9am, Central Standard Time
const scheduledRun = cron.schedule('* 9 * * Fri', () => {
    console.log("Starting the 9am request for new releases...\n")
    run();
}, {
    scheduled: false,
    timezone: "US/Central"
});

scheduledRun.start();


