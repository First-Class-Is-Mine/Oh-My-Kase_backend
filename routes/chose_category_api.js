/* 카테고리 선택 api */

 const express = require('express');
 const uuidAPIKey = require('uuid-apikey');
 var db = require("../config/db.js");
 
 const key = {
     apiKey: process.env.API_KEY,
     uuid: '3ed8e58c-3256-464f-bec4-63925ebfae75'        
 }
 const router = express.Router();
 
 router.get('/chose/:apikey', async function(req, res, next) {
     try {
         const { apikey } = req.params;
 
         // API 키 검증
         if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
             return res.status(401).send('apikey is not valid.');
         }
         const [category] = await db.query('SELECT * FROM category');
         console.log(category);
         res.json(category);
         
     }catch (err) {
         console.error(err);
         res.status(500).json({ error: 'Database error' });
     }
 });
 
 module.exports = router;