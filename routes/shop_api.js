/* 가게 api */

const express = require('express');
const uuidAPIKey = require('uuid-apikey');
var db = require("../config/db.js");

const key = {
    apiKey: process.env.API_KEY,
    uuid: '3ed8e58c-3256-464f-bec4-63925ebfae75'        
}

const router = express.Router();

// 모든 가게 정보
router.get('/shop_list/:apikey', async (req, res) => {
    try {
        const { apikey } = req.params;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        const [shop_list] = await db.query('SELECT shop.id, shop.area_id, shop.shop_category_id, shop.shop_name, shop.rating, area.area_name FROM shop JOIN area ON shop.area_id = area.id');
        res.status(200).send(shop_list);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 가게 정보 조회
router.get('/:apikey/:shop_id', async (req, res) => {
    try {
        const { apikey, shop_id } = req.params;
 
        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }
        if(!shop_id) {
            return res.status(400).send({ error: 'shop_id 값이 존재하지 않습니다.' });
        }

        const [shop] = await db.query('SELECT DISTINCT shop.*, GROUP_CONCAT(tag_list.tag_name) AS tag_names FROM shop JOIN tag ON shop.id = tag.shop_id JOIN tag_list ON tag.tag_id = tag_list.id WHERE shop.id = ?', [shop_id]);
        
        if (!shop) {
            return res.status(400).send({ error: '조건에 맞는 shop이 존재하지 않습니다.' });
        }
        return res.status(200).json(shop);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;