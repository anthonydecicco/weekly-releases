require('dotenv').config();

const express = require('express');
const cron = require('node-cron');
const helmet = require('helmet');
const handlebars = require('express-handlebars');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const functions = require('./utils/functions');
const auth = require('./auth/auth');
const authFunctions = require('./auth/auth.helper.functions');
const email = require('./email/email');
const db = require('./utils/db');
const path = require('path');
const date = require('./utils/date');
const logger = require('./utils/logger');

const app = express();
const port = process.env.PORT;

app.disable('x-powered-by');

app.set('trust proxy', 1);

const hbs = handlebars.create({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: __dirname + '/public/views/layouts/'
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, './public', 'views'));

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

const second = 1000;
const minute = second * 60;
const hour = minute * 60;
const day = hour * 24;
const maxAge = day * 3;

let sessionObject = {
    cookie: { maxAge: maxAge } ,
    name: process.env.SESSION_NAME,
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    store: store,
}

//if production, set cookies to secure
if (app.get('env') === 'production') {
    app.set('trust proxy', 1); 
    sessionObject.cookie.secure = true; 
}

app.use(session(sessionObject));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/auth', auth);
app.use(express.static('public'));

app.get('/', async (req, res) => {
    return res.render('index', {
        metaTitle: "New Music Every Friday",
        isAuth: req.session.isAuth, //if isAuth = null/false, do not show certain site elements
        leftAlign: true
    });
});

app.get('/register', async function (req, res) {
    let metaTitle = "Sign Me Up →";

    if (req.session.isAuth) {
        metaTitle = "You're In."
    }
    
    return res.render('register', {
        metaTitle: metaTitle,
        isAuth: req.session.isAuth,
    });
});


//dashboard path is work in progress
app.get('/dashboard', async function (req, res) {
    if (req.session.isAuth) {
        return res.render('dashboard', {
            metaTitle: "Dashboard",
            isAuth: req.session.isAuth,
            userId: req.session.userId
        });
    } else {
        res.redirect('/register');
    }
});

app.get('/about', async function (req, res) {
    return res.render('about', {
        metaTitle: "Learn More",
        isAuth: req.session.isAuth,
        leftAlign: true,
    });
});

app.get('/privacy-policy', async function (req, res) {
    return res.render('privacy-policy', {
        metaTitle: "Privacy Policy",
        isAuth: req.session.isAuth,
        leftAlign: true,
    });
});

//create an accessible route for easy testing of email templates
if (app.get('env') !== 'production') {
    const test = require('./testing/test');
    app.get('/test', async function (req, res) {
        return res.render('test', {
            metaTitle: "Test",
            isAuth: req.session.isAuth,
        })
    })

    app.get('/sendemail', async function (req, res) {
        test.sendTest();
        return res.redirect('/test');
    })
}

async function run() {
    const users = await db.getUsers();

    await authFunctions.refreshAccessTokens(users);

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

        const releasesOptions = {
            from: {
                name: 'Weekly Releases',
                address: 'anthony@weeklyreleases.com',
            },
            to: user.userEmail,
            subject: subject,
            template: 'releases',
            context: {
                todayDate: today,
                releases: formattedReleases,
            }
        }

        logger.info(`${user.userEmail} follows ${followedArtists.length} artists. They came out with ${formattedReleases.length} releases.`)
        await email.sendEmail(user.userEmail, releasesOptions);
    }
} 

// await run().catch(console.error);

// schedule the run() function to occur once, every Friday at 8am, Central Standard Time
const scheduledRun = cron.schedule('0 8 * * Fri', () => {
    logger.info("Starting the 8am request for new releases...\n")

    run().catch((error) => {
        logger.error(error);
    });
    
}, {
    scheduled: true,
    timezone: "US/Central"
});

scheduledRun.start();

app.use((req, res, next) => {
    res.status(404).send("Sorry can't find that!")
});

app.use((err, req, res, next) => {
    logger.error(err.stack)
    res.status(500).send('Something broke!')
});

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});