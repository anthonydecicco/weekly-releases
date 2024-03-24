const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const date = require('../utils/date');
const path = require('path');

async function sendEmailToUser(user, releases) {
    const transporter = nodemailer.createTransport({
        pool: true,
        host: "smtp.forwardemail.net",
        port: 465,
        secure: true,
        tls: {
            rejectUnauthorized: false
        },
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
        },
        viewPath: path.resolve('./email'),
        extName: ".hbs",
    }
    
    transporter.use('compile', hbs(hbsOptions));
    
    const mailOptions = {
        from: {
            name: 'Weekly Releases',
            address: 'anthony@weeklyreleases.com',
        },
        to: user.userEmail,
        subject: `\u{1F6A8}New Song Releases | ${date.todayDateString}\u{1F3A7}`,
        template: 'email',
        context: {
            todayDate: date.todayDateString,
            userId: user.userId,
            releases: releases,
        }
    }
    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log("Email sent to " + user.userEmail + ". Response: " + info.response)
        }
    });
}

exports.sendEmailToUser = sendEmailToUser;