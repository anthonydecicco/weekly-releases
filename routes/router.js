const express = require('express');
const router = express.Router();
const db = require('../utils/db');

const client = db.client;
const collection = db.collection;

//get all users within the database
router.get('/users', async function (req, res) {
    try {
        await client.connect();
        const cursor = collection.find();
        const usersArray = await cursor.toArray();
        res.json(usersArray);
    } finally {
        await client.close();
    }
})

module.exports = router;