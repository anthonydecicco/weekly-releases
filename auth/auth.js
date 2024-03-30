const express = require('express');
const auth = express.Router();
const crypto = require('crypto');
const queryString = require('querystring');
const request = require('request');
const db = require('../utils/db')
const email = require('../email/email');
const date = require('../utils/date');

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const baseUrl = process.env.BASE_URL;
const redirect_uri = baseUrl + "auth/callback";

function generateRandomString(length) {
    return crypto
    .randomBytes(60)
    .toString('hex')
    .slice(0, length);
}

auth.get('/login', async function (req, res) {
    const state = generateRandomString(16);
    const scope = 'user-read-private user-read-email user-follow-read user-follow-modify';

    res.redirect('https://accounts.spotify.com/authorize?' +
    queryString.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
})

auth.get('/callback', async function (req, res) {
    const code = req.query.code || null;
    const state = req.query.state || null;

    if (state === null) {
        res.redirect('/#' +
            queryString.stringify({
                error: 'state_mismatch'
            }));
    } else {
        const authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, async function (error, response, body) {
            if (!error && response.statusCode === 200) {
                const access_token = body.access_token;
                const refresh_token = body.refresh_token;

                res.cookie('refresh_token', refresh_token, { maxAge: 900000, httpOnly: true });

                const userOptions = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    json: true
                }

                request.get(userOptions, async function (error, response, body) {
                    const user = body;

                    const userInfo = {
                        userId: user.id,
                        userEmail: user.email,
                        userTempAccessToken: access_token,
                        userRefreshToken: refresh_token
                    }

                    console.log("User info:\n" + userInfo.userEmail + "\n" + userInfo.userId + "\n" + userInfo.userTempAccessToken + "\n" + userInfo.userRefreshToken);
                    
                    //create confirmation variable
                    let requiresConfirmation = null;

                    //if new user, requiresConfirmation set to true, otherwise false
                    await db.addOrUpdateUserInfo(userInfo, requiresConfirmation);

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

                    res.redirect('/home');
                })

            } else {
                res.redirect('/#' +
                    queryString.stringify({
                        error: 'invalid_token'
                    }));
            }
        });
    }
})

auth.post('/refresh_token', async function (req, res) {
    try {
        const refresh_token = req.body.refresh_token; 

        const authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
            },
            form: {
                grant_type: 'refresh_token',
                refresh_token: refresh_token
            },
            json: true
        };

        const response = await fetch(authOptions.url, {
            method: 'POST',
            body: new URLSearchParams(authOptions.form),
            headers: authOptions.headers
        });

        if (response.ok) {
            const data = await response.json();
            res.json(data);
        } else {
            res.status(response.status).json({ error: 'Failed to refresh token' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = auth;