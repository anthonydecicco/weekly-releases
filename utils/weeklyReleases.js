const functions = require('./functions')
const refreshAccessToken = require('./refreshAccessToken');
const email = require('./email');
const db = require('./db');
const date = require('./date');
const logger = require('./logger');

async function getWeeklyReleases() {
    const users = await db.getUsers();

    for (const user of users) {
        await refreshAccessToken(user);
    }

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

        let email;

        if (user.userPreferredEmail === null || user.userPreferredEmail === undefined) {
            email = user.userEmail;
        } else {
            email = user.userPreferredEmail;
        }

        const releasesOptions = {
            from: {
                name: 'Weekly Releases',
                address: process.env.EMAIL_USERNAME,
            },
            to: email,
            subject: subject,
            template: 'releases',
            context: {
                todayDate: today,
                releases: formattedReleases,
            }
        }

        logger.info(`${email} follows ${followedArtists.length} artists. They came out with ${formattedReleases.length} releases.`)
        await email.sendEmail(releasesOptions);
    }
} 

module.exports = getWeeklyReleases;