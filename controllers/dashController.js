async function dashFollowedLogic(req, res) {
    if (req.session.isAuth) {
        return res.render('dash-followed', {
            metaTitle: "Dashboard - Who you follow",
            isAuth: req.session.isAuth,
            userImage: req.session.userImage,
            userDisplayName: req.session.userDisplayName,
            userEmail: req.session.userEmail,
            userId: req.session.userId,
            userUrl: req.session.userUrl,
            dashSubTitle: "Who you follow",
            followedActive: "sidebar-nav-button-current", //highlight nav option if this page
            additionalScript: "dash-followed.js",
            layout: "dashboard",
        });
    } else {
        res.redirect('/register');
    }
}

async function dashRecommendedLogic(req, res) {
    if (req.session.isAuth) {
        return res.render('dash-recommended', {
            metaTitle: "Dashboard - Recommended",
            isAuth: req.session.isAuth,
            userImage: req.session.userImage,
            userDisplayName: req.session.userDisplayName,
            userEmail: req.session.userEmail,
            userId: req.session.userId,
            userUrl: req.session.userUrl,
            dashSubTitle: "Recommended artists",
            recommendedActive: "sidebar-nav-button-current",
            additionalScript: "dash-recommended.js",
            layout: "dashboard",
        });
    } else {
        res.redirect('/register');
    }
}

async function dashSettingsLogic(req, res) {
    if (req.session.isAuth) {
        return res.render('dash-settings', {
            metaTitle: "Dashboard - Settings",
            isAuth: req.session.isAuth,
            userImage: req.session.userImage,
            userDisplayName: req.session.userDisplayName,
            userEmail: req.session.userEmail,
            userPreferredEmail: req.session.userPreferredEmail,
            userId: req.session.userId,
            userUrl: req.session.userUrl,
            dashSubTitle: "Settings",
            settingsActive: "sidebar-nav-button-current",
            layout: "dashboard",
        });
    } else {
        res.redirect('/register');
    }
}

module.exports = {
    dashFollowedLogic,
    dashRecommendedLogic,
    dashSettingsLogic
}