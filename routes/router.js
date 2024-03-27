const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// router.get('/home', function (req, res) {
//     res.sendFile(path.join(__dirname, '../public', 'home.html'));
// });

router.get('/login', function (req, res) {
    res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

router.get('/about', function (req, res) {
    res.sendFile(path.join(__dirname, '../public', 'about.html'));
});

module.exports = router;