const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/home', async function (req, res) {
    res.sendFile(path.join(__dirname, '../public', 'home.html'));
});

router.get('/about', async function (req, res) {
    res.sendFile(path.join(__dirname, '../public', 'about.html'));
});

router.get('/privacy-policy', async function (req, res) {
    res.sendFile(path.join(__dirname, '../public', 'privacy-policy.html'));
});

module.exports = router;