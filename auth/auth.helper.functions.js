const db = require('../utils/db');
const functions = require('../utils/functions');
const logger = require('../utils/logger');

const baseUrl = process.env.BASE_URL || 'http://localhost:8080/';
const refreshUrl = baseUrl + 'auth/refresh_token';

async function refreshAccessTokens(users) {
    try {
        for (const user of users) {

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
        }
    } catch (error) {
        logger.error(error)
    }
    return users;
}

exports.refreshAccessTokens = refreshAccessTokens;
