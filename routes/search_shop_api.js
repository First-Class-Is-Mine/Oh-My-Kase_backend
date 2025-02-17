/* 식당 검색 api */

const express = require('express');
const uuidAPIKey = require('uuid-apikey');
var db = require("../config/db.js");

const key = {
    apiKey: process.env.API_KEY,
    uuid: '3ed8e58c-3256-464f-bec4-63925ebfae75'        
}
const router = express.Router();

router.get('/search/:apikey/:search_shop', async function(req, res, next) {
    try {
        const { apikey, search_shop } = req.params;

        // API 키 검증
        if(!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        // 가게 이름 데이터 조회
        const [shop] = await db.query('SELECT shop_name FROM shop');
        console.log("DB 데이터:", shop); // 데이터 구조 확인
        console.log("사용자 검색어", search_shop); // 찾는 데이터 확인

        if (!shop || shop.length === 0) {
            return res.status(404).json({ message: "No data found in database." });
        }

        // 사용자가 입력한 검색어에 따라 가게를 필터링
        const filteredShops = shop
            .filter(item => item.shop_name.includes(search_shop))
            .map(item => item.shop_name);
        
        console.log("필터링된 결과:", filteredShops);
        res.json(filteredShops);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;