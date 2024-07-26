const functions = require('../utils/functions');
const refreshAccessToken = require('../utils/refreshAccessToken');
const deleteSession = require('../utils/deleteSession');
const db = require('../utils/db');
const logger = require('../utils/logger');

async function followedArtistsLogic(req, res) {
    const userId = req.session.userId;
    const user = await db.getUserInfo(userId);

    await refreshAccessToken(user);
    const artists = await functions.getFollowedArtists(user);
    
    res.json(artists);
}

async function recommendedArtistsLogic(req, res) {
    const userId = req.session.userId;
    const user = await db.getUserInfo(userId);

    await refreshAccessToken(user);
    const recommendedArtists = await functions.getRecommendedArtists(user);
    
    res.json(recommendedArtists);
}

async function updateEmailLogic(req, res) {
    const userId = req.session.userId;
    const user = await db.getUserInfo(userId);

    // Extract email from the request body
    const email = req.body['preferred-email'];
    
    await refreshAccessToken(user);

    if (email === user.userPreferredEmail) {
        res.redirect("/dashboard/settings");
        return;
    } 

    req.session.userPreferredEmail = email;
    await db.addOrUpdatePreferredEmail(userId, email);

    res.redirect("/dashboard/settings");
    return;
}

async function deleteUserDataLogic(req, res) {
    const userId = req.session.userId;
    const user = await db.getUserInfo(userId);

    const userEmail = user.userEmail;
    const submittedEmail = req.body['delete-email'];
    logger.info(`User submitted ${submittedEmail} to delete account information.`);

    if (userEmail !== submittedEmail) {
        res.redirect("/dashboard/settings");
        return;
        //TODO: send message back that deletion failed
    }

    logger.info("Emails match, deleting user information");

    const deletedCountUser = await db.deleteUser(userId);

    if (deletedCountUser > 0) {
        const deletedCountSession = await deleteSession.deleteSession(userId)

        if (deletedCountSession > 0) {   
            res.redirect("/");
            return;
        }
    }

    res.redirect("/dashboard/settings");
    return;
}

module.exports = {
    followedArtistsLogic,
    recommendedArtistsLogic,
    updateEmailLogic,
    deleteUserDataLogic,
};