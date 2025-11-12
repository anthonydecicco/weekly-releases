const email = require('../utils/email');

async function testLogic(req, res) {
    return res.render('test', {
        metaTitle: "Test",
        isAuth: req.session.isAuth,
    })
}

async function sendEmailLogic(req, res) {
    email.sendTestEmail();
    return res.redirect('/test');
}

module.exports = {
    testLogic,
    sendEmailLogic,
}