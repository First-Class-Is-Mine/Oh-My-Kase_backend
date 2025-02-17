/* 카테고리별 식당 정보 api */

const express = require('express');
const uuidAPIKey = require('uuid-apikey');
var db = require("../config/db.js");

const key = {
    apiKey: process.env.API_KEY,
    uuid: '3ed8e58c-3256-464f-bec4-63925ebfae75'        
}

const router = express.Router();

router.get('/filter/:apikey/:search_category', async function (req, res, next) {
    try {
        const { apikey, search_category } = req.params;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        // 카테고리 및, 식당 데이터 조회
        const [category] = await db.query('SELECT id, shop_category_id, shop_name FROM shop');
        console.log("DB 데이터:", category); // 데이터 구조 확인
        console.log("입력 받은 카테고리:", search_category); // 찾는 데이터 확인
        
        if (!category || category.length === 0) {
            return res.status(404).json({ message: "No data found in database." });
        } 

        // 선택한 카테고리와 일치하는 식당만 필터링
        const filteredShops = category
            .filter(item => item.shop_category_id === Number(search_category));

        console.log("필터링된 결과:", filteredShops);
        res.json(filteredShops);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;