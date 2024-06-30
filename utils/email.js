const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');
const logger = require('./logger');
const date = require("./date");
const dummyData = require("./dummyData");

const helpers = {
    compare(variableOne, comparator, variableTwo) {
        const numberOne = parseInt(variableOne);
        const numberTwo = parseInt(variableTwo);

        if (!isNaN(numberOne) && !isNaN(numberTwo)) {
            switch (comparator) {
                case '>':
                    return numberOne > numberTwo;
                case '<':
                    return numberOne < numberTwo;
                case '>=':
                    return numberOne >= numberTwo;
                case '<=':
                    return numberOne <= numberTwo;
                case '==':
                    return numberOne == numberTwo;
                case '===':
                    return numberOne === numberTwo;
                case '!=':
                    return numberOne !== numberTwo;
                default:
                    throw new Error('Invalid comparator');
            }
        } else {
            switch (comparator) {
                case '>':
                    return variableOne > variableTwo;
                case '<':
                    return variableOne < variableTwo;
                case '>=':
                    return variableOne >= variableTwo;
                case '<=':
                    return variableOne <= variableTwo;
                case '==':
                    return variableOne == variableTwo;
                case '===':
                    return variableOne === variableTwo;
                case '!=':
                    return variableOne !== variableTwo;
                default:
                    throw new Error('Invalid comparator');
            }
        }
    }
}

async function handleSubject(formattedReleases, today) {
    if (formattedReleases.length > 0) {
        return `\u{1F6A8}New Music For You | ${today}\u{1F3A7}`
    } else {
        return `No New Music, Follow More Artists | ${today}`
    }
}

async function sendEmail(options) {
    const transporter = nodemailer.createTransport({
        pool: true,
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: true,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
    
    const hbsOptions = {
        viewEngine: {
            extName: ".hbs",
            partialsDir: path.resolve('./email'),
            defaultLayout: false,
            helpers: helpers,
        },
        viewPath: path.resolve('./email'),
        extName: ".hbs",
    }
    
    transporter.use('compile', hbs(hbsOptions));

    transporter.sendMail(options, (error, info) => {
        if (error) {
            logger.error(`Error sending to ${options.to}. Erroer Message: ${error}`);
        } else {
            logger.info(`Email sent to ${options.to}. Response: ${info.response}`)
        }
    });
}

function sendTestEmail() {
    const now = new Date();

    const options = {
        from: {
            name: 'Test',
            address: process.env.EMAIL_USERNAME,
        },
        to: process.env.TESTING_EMAIL,
        subject: "Test Email",
        template: 'releases', //updated version
        context: {
            todayDate: date.getTodayDateString(now),
            releases: dummyData,
        }
    }

    sendEmail(options);
}

module.exports = {
    handleSubject,
    sendEmail,
    sendTestEmail,
}