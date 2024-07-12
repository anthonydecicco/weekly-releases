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
        try {
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

            let recipientEmail;

            if (user.userPreferredEmail === null || user.userPreferredEmail === undefined) {
                recipientEmail = user.userEmail;
            } else {
                recipientEmail = user.userPreferredEmail;
            }

            const releasesOptions = {
                from: {
                    name: 'Weekly Releases',
                    address: process.env.EMAIL_USERNAME,
                },
                to: recipientEmail,
                subject: subject,
                template: 'releases',
                context: {
                    todayDate: today,
                    releases: formattedReleases,
                }
            }

            logger.info(`${recipientEmail} follows ${followedArtists.length} artists. They came out with ${formattedReleases.length} releases.`);
            await email.sendEmail(releasesOptions);
            
        } catch (error) {
            logger.error(error);
        }
    }

    logger.info("Finished getting new releases.");
} 

module.exports = getWeeklyReleases;