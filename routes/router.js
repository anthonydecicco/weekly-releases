const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/home', async function (req, res) {
    res.sendFile(path.join(__dirname, '../public', 'home.html'));
});

module.exports = router;