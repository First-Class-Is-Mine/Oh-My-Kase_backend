/* 지역 선택 api */

const express = require('express');
const uuidAPIKey = require('uuid-apikey');
var db = require("../config/db.js");

const key = {
    apiKey: process.env.API_KEY,
    uuid: '3ed8e58c-3256-464f-bec4-63925ebfae75'        
}
const router = express.Router();

router.get('/chose', async function(req, res, next) {
    try {
        const [results] = await db.query('SELECT * FROM area');
        console.log(results);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;