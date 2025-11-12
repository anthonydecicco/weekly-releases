async function indexLogic(req, res) {
    return res.render('index', {
        metaTitle: "New Music Every Friday",
        isAuth: req.session.isAuth, //if isAuth = null/false, do not show certain site elements
        leftAlign: true
    });
}

async function registerLogic(req, res) {
    if (req.session.isAuth) {
        metaTitle = "You're In."
    }

    return res.render('register', {
        metaTitle: "Sign Me Up →",
        isAuth: req.session.isAuth,
        leftAlign: true,
        additionalScript: "register.js",
    });
}

async function aboutLogic(req, res) {
    return res.render('about', {
        metaTitle: "Learn More",
        isAuth: req.session.isAuth,
        leftAlign: true,
    });
}

async function privacyLogic(req, res) {
    return res.render('privacy-policy', {
        metaTitle: "Privacy Policy",
        isAuth: req.session.isAuth,
        leftAlign: true,
    });
}

module.exports = {
    indexLogic,
    registerLogic,
    aboutLogic,
    privacyLogic,
}