const express = require('express');
const auth = express.Router();
const crypto = require('crypto');
const db = require('../utils/db');
const email = require('../email/email');
const date = require('../utils/date');
const functions = require('../utils/functions');
const logger = require('../utils/logger');
const util = require('util');
const randomBytesAsync = util.promisify(crypto.randomBytes);

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const baseUrl = process.env.BASE_URL || 'http://localhost:8080/';
const redirect_uri = baseUrl + "auth/callback";

function generateRandomString(length) {  
    return randomBytesAsync(60).toString('hex').slice(0, length);
}

auth.get('/login', async function (req, res) {
    const state = generateRandomString(16);
    const scope = 'user-read-private user-read-email user-follow-read user-follow-modify';
    
    const queryParams = `response_type=code&client_id=${client_id}&scope=${scope}&redirect_uri=${redirect_uri}&state=${state}`
    res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
})

auth.get('/callback', async function (req, res) {
    try {
        const code = req.query.code || null;
        const state = req.query.state || null;

        if (state === null) {
            res.redirect('/#error=state_mismatch');
        } else {
            const authOptions = {
                url: 'https://accounts.spotify.com/api/token',
                method: 'POST',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
                },
                body: new URLSearchParams({
                    code: code,
                    redirect_uri: redirect_uri,
                    grant_type: 'authorization_code'
                }).toString(),
                errorMessage: 'unable to complete /callback to Spotify',
            };

            const authResponse = await functions.handleRequest(
                authOptions.url,
                authOptions.method,
                authOptions.headers,
                authOptions.body,
                authOptions.errorMessage,
            )

            const access_token = authResponse.access_token;
            const refresh_token = authResponse.refresh_token;

            res.cookie('refresh_token', refresh_token, { maxAge: 900000, httpOnly: true });

            const userOptions = {
                url: 'https://api.spotify.com/v1/me',
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + access_token },
                errorMessage: 'unable to get user account information within /callback'
            }

            const userDetailResponse = await functions.handleRequest(
                userOptions.url,
                userOptions.method,
                userOptions.headers,
                null,
                userOptions.errorMessage,
            );

            const userInfo = {
                userId: userDetailResponse.id,
                userEmail: userDetailResponse.email,
                userTempAccessToken: access_token,
                userRefreshToken: refresh_token
            }
            
            //create requiresConfirmation and redirectCheck variables
            const { requiresConfirmation, redirectCheck } = await db.addOrUpdateUserInfo(userInfo);

            //if requiresConfirmation set to true, send confirmation email
            if (requiresConfirmation === true) {
                const confirmationOptions = {
                    from: {
                        name: 'Weekly Releases',
                        address: 'anthony@weeklyreleases.com',
                    },
                    to: userInfo.userEmail,
                    subject: `Thank you for signing up for Weekly Releases`,
                    template: 'confirmation',
                    context: {
                        todayDate: date.todayDateString,
                        userId: userInfo.userId,
                        userEmail: userInfo.userEmail,
                    }
                }

                await email.sendEmail(userInfo.userEmail, confirmationOptions);
            }

            //if the addOrUpdateUserInfo function failed, redirect
            if (redirectCheck === true) {
                res.redirect('/database-failure');
            }

            res.redirect('/home');
        }
    } catch (error) {
        logger.error(error);
        res.redirect('/spotify-callback-failure');
    }
})

auth.post('/refresh_token', async function (req, res) {
    try {
        const refresh_token = req.body.refresh_token; 

        const refreshOptions = {
            url: 'https://accounts.spotify.com/api/token',
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refresh_token,
            }).toString(),
            errorMessage: 'unable to get a new refresh token from Spotify '
        };

        const refreshTokenResponse = await functions.handleRequest(
            refreshOptions.url,
            refreshOptions.method,
            refreshOptions.headers,
            refreshOptions.body,
            refreshOptions.errorMessage,
        )

        res.json(refreshTokenResponse);

    } catch (error) {
        logger.error(error);
    }
});

module.exports = auth;
