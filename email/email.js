const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');
const logger = require('../utils/logger');

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

async function sendEmail(userEmail, options) {
    const transporter = nodemailer.createTransport({
        pool: true,
        host: "smtp.forwardemail.net",
        port: 2465,
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
            logger.error(`Error sending to ${userEmail}. Erroer Message: ${error}`);
        } else {
            logger.info(`Email sent to ${userEmail}. Response: ${info.response}`)
        }
    });
}

exports.sendEmail = sendEmail;
exports.handleSubject = handleSubject;