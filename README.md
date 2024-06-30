# Weekly Releases

## Project Overview
### Summary
An application that uses the Spotify Web API to fetch a user's followed artists, and from there, fetch the releases from each of the artists and filter for releases that came out in the last 7 days. New releases are then emailed to the user on a weekly basis.

You can visit the site at this URL: https://www.weeklyreleases.com/

### Purpose
I love to listen to music, and I listen to a lot of different genres and artists. About a year ago I found it getting hard to keep track of new music that my favorite artists were releasing. I stopped using social media a few years ago, which was my main source of information for staying up-to-date on new releases. Sometimes I would find out weeks, months, or even a year later that a new album dropped from one of my favorite artists.

Spotify does address this through their Release Radar playlist, however, it only includes 1 song per artist per week, and there's no notification to let you know it's been updated. Additionally, only some artists' new albums or singles are advertised to the user through emails or push notifications. Thus, I sought to create a service that compiles a complete list of songs and albums from artists they follow that gets sent directly to the user's inbox on a regular basis.

### How It Works
1. A user navigates to the root domain and clicks the button to authenticate the application through their Spotify account. The button makes a GET request to the Spotify Web API to begin that process.
2. The authentication process involves using the [Spotify Web API Code Flow example](https://developer.spotify.com/documentation/web-api/tutorials/code-flow) to generate an access token and refresh token. The access token is then used to grab the user's Spotify user information.
3. The user's information, including the access and refresh tokens, is stored in a MongoDB cluster and a confirmation email is sent. The refresh token is also stored as a cookie.
4. The user is then redirected to the /home domain where they will see information about their account and followed artists (to be implemented); the refresh token stored as a cookie is used here to verify the user's account and show information specific to them.
5. At this point the user is in the database. Every Friday the application will use the stored refresh token to get a new access token (expire after a certain period of time) and use it to grab the user's followed artists from the Spotify Web API.
6. Each of the artists are then iterated over to grab their discography. All of their songs and albums are filtered for releases in the past 7 days.
7. These releases are then sent to the user's email that is associated with their Spotify account automatically on a weekly basis; users do not have to re-authenticate each time they want a refreshed list of new songs and albums.

### Languages and Technologies Used
- JavaScript
- HTML
- CSS
- handlebars.js
- Node.js
- Express.js
- MongoDB

### Features
- Authentication of app through a user's Spotify account
- Automated weekly emails sent via SMTP to prevent getting marked as spam
- A fresh list of new releases entirely based on the artists a user follows
- Automatic refresh of user's authentication tokens to improve UX

### Roadmap
- Continue building out the front-end. I'm currently working with a designer to develop a more processed look and feel for the site.
- ~Continue working on getting the application production ready.~
- ~Update deprecated packages used in Spotify's Code Flow example.~
- ~Deploy the application.~
- ~Apply for an increased API rate limit from Spotify.~
- Continue improving application.

### Long-Term Features
Ideally, these are the features I would love to be able to add at some point. I have done minimal research around some of these, so I'm still not 100% on feasibility.
- User accounts that are irrespective of Spotify accounts (this allows for some of the features listed below)
- Integration for SoundCloud
- Integration for Apple Music
- User settings that fine tune where music is sent to, how frequently music is sent, number of days to filter releases by, etc.

## Credits
### Spotify for Developers Web API Documentation
Spotify Web API enables the creation of applications that can interact with Spotify's streaming service, such as retrieving content metadata, getting recommendations, creating and managing playlists, or controlling playback.

https://developer.spotify.com/documentation/web-api

### Authorization Code Flow (Spotify Web API)
The authorization code flow is suitable for long-running applications (e.g. web and mobile apps) where the user grants permission only once.

https://developer.spotify.com/documentation/web-api/tutorials/code-flow 

### MondoDB Documentation
The MongoDB documentation provides information and knowledge needed to build applications on MongoDB and the Atlas developer data platform.

https://www.mongodb.com/docs/ 

## Dependencies
### connect-mongodb-session
MongoDB-backed session storage for connect and Express. Meant to be a well-maintained and fully-featured replacement for modules like connect-mongo

https://www.npmjs.com/package/connect-mongodb-session

### dotenv
Dotenv is a zero-dependency module that loads environment variables from a .env file into process.env. Storing configuration in the environment separate from code is based on The Twelve-Factor App methodology.

https://www.npmjs.com/package/dotenv 

### express
Fast, unopinionated, minimalist web framework for Node.js.

https://www.npmjs.com/package/express 

### express-handlebars
A Handlebars view engine for Express which doesn't suck.

https://www.npmjs.com/package/express-handlebars

### express-session
Express-session creates a session middleware that can connect to stores to store session cookies server-side.

https://www.npmjs.com/package/express-session 

### helmet
Helmet helps secure Express apps by setting HTTP response headers.

https://www.npmjs.com/package/helmet

### mongodb
The official MongoDB driver for Node.js.

https://www.npmjs.com/package/mongodb

### node-cron
The node-cron module is tiny task scheduler in pure JavaScript for node.js based on GNU crontab. This module allows you to schedule task in node.js using full crontab syntax.

https://www.npmjs.com/package/node-cron

### nodemailer
Send emails from Node.js – easy as cake! 🍰✉️

https://www.npmjs.com/package/nodemailer

### nodemailer-express-handlebars
This plugin works with nodemailer 6.x. And uses the express-handlebars view engine to generate html emails.

https://www.npmjs.com/package/nodemailer-express-handlebars

### nodemon
nodemon is a tool that helps develop Node.js based applications by automatically restarting the node application when file changes in the directory are detected.

https://www.npmjs.com/package/nodemon

### winston
winston is designed to be a simple and universal logging library with support for multiple transports. A transport is essentially a storage device for your logs. Each winston logger can have multiple transports configured at different levels. For example, one may want error logs to be stored in a persistent remote location (like a database), but all logs output to the console or a local file.

https://www.npmjs.com/package/winston