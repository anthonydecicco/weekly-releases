const db = require('../utils/db');

const baseUrl = process.env.BASE_URL;

async function refreshAccessTokens(users) {
    for (const user of users) {
        try {
            const response = await fetch(baseUrl + "auth/refresh_token", {
                method: "POST",
                body: JSON.stringify({ refresh_token: user.userRefreshToken }),
                headers: {
                    "Content-Type": "application/json"
                },
            })
            if (response.ok) {
                const data = await response.json();

                user.userTempAccessToken = data.access_token;

                await db.addOrUpdateUserInfo(user);

            } else {
                console.log("Failed to refresh tokens for user:", user);
            }
        } catch (error) {
            console.log(error)
        }
    }
    return users;
}

exports.refreshAccessTokens = refreshAccessTokens;
