/* 지역별 식당 정보 api */

const express = require('express');
const uuidAPIKey = require('uuid-apikey');
var db = require("../config/db.js");

const key = {
    apiKey: process.env.API_KEY,
    uuid: '3ed8e58c-3256-464f-bec4-63925ebfae75'        
}
const router = express.Router();

router.get('/filter/:apikey/:search_area', async function(req, res, next) {
    try {
        const { apikey, search_area } = req.params;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }
        
        // 지역 및 상점 데이터 조회
        const [area] = await db.query('SELECT area_id, shop_name FROM shop');
        console.log("DB 데이터:", area); // 데이터 구조 확인
        console.log("요청한 지역:", search_area); // 찾는 데이터 확인

        if (!area || area.length === 0) {
            return res.status(404).json({ message: "No data found in database." });
        }

        // 검색한 지역과 일치하는 가게만 필터링
        const filteredShops = area
            .filter(item => item.area_id === Number(search_area))
            .map(item => item.shop_name);

        console.log("필터링된 결과:", filteredShops);
        res.json(filteredShops);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;