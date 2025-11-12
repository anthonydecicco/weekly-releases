const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const logger = require('./logger');

const second = 1000;
const minute = second * 60;
const hour = minute * 60;
const day = hour * 24;
const maxAge = day * 3;

const store = new MongoDBStore({
    uri: process.env.DATABASE_URL,
    databaseName: process.env.DATABASE_NAME,
    collection: process.env.DATABASE_COLLECTION_SESSIONS
},
    function (error) {
        if (error) {
            logger.error(error)
        }
    }
);

let sessionObject = {
    cookie: { maxAge: maxAge } ,
    name: process.env.SESSION_NAME,
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    store: store,
}

module.exports = sessionObject;