const db = require('./db');
const functions = require('./functions');
const logger = require('./logger');

const baseUrl = process.env.BASE_URL || 'http://localhost:10000/';
const refreshUrl = baseUrl + 'auth/refresh_token';

async function refreshAccessToken(user) {
    try {
        const refreshOptions = {
            url: refreshUrl,
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ refresh_token: user.userRefreshToken }),
            errorMessage: `unable to get a new refresh token for user: ${user.userId}`
        }

        const response = await functions.handleRequest(
            refreshOptions.url,
            refreshOptions.method,
            refreshOptions.headers,
            refreshOptions.body,
            refreshOptions.errorMessage,
        );

        user.userTempAccessToken = response.access_token;
        await db.addOrUpdateUserInfo(user);
    } catch (error) {
        logger.error(error)
    }
}

module.exports = refreshAccessToken;
