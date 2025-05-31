/* 검색 api */

const express = require('express');
const uuidAPIKey = require('uuid-apikey');
var db = require("../config/db.js");

const key = {
    apiKey: process.env.API_KEY,
    uuid: '3ed8e58c-3256-464f-bec4-63925ebfae75'        
}

const router = express.Router();

// 지역별 식당 검색
router.get('/areafiliter/:apikey/:area_id', async (req, res) => {
    try {
        const { apikey, area_id } = req.params;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }
    
        if (!area_id) {
            return res.status(400).send({ error: 'area_id가 존재하지 않습니다.' });
        }   

        const [area] = await db.query('SELECT * FROM shop WHERE area_id = ?', [area_id]);
        if (!area || area.length === 0) {
            return res.status(400).send({ error: '조건에 맞는 shop이 존재하지 않습니다.' });
        }
        res.status(200).json(area);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 카테고리별 식당 검색
router.get('/categoryfiliter/:apikey/:category_id', async (req, res) => {
    try {
        const { apikey, category_id } = req.params;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }
    
        if (!category_id) {
            return res.status(400).send({ error: 'category_id가 존재하지 않습니다.' });
        }   

        const [category] = await db.query('SELECT * FROM shop WHERE shop_category_id = ?', [category_id]);
        if (!category || category.length === 0) {
            return res.status(400).send({ error: '조건에 맞는 shop이 존재하지 않습니다.' });
        }
        res.status(200).json(category);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 해시태그별 식당 검색
router.get('/tagfilliter/:apikey/:tag_id', async (req, res) => {
    try {
        const { apikey, tag_id } = req.params;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }
        if (!tag_id) {
            return res.status(400).send({ error: 'tag_id가 존재하지 않습니다.' });
        }
        const [shop_list] = await db.query('SELECT DISTINCT s.id, s.area_id, s.shop_category_id, s.shop_name, s.shop_imgae, s.rating, s.open_time, s.close_time, s.shop_word FROM tag t JOIN shop s ON t.shop_id = s.id JOIN tag_list tl ON t.tag_id = tl.id WHERE t.tag_id = ?;', [tag_id]);
        if (!shop_list || shop_list.length === 0) {
            return res.status(400).send({ error: '조건에 맞는 shop이 존재하지 않습니다.' });
        }
        res.status(200).json(shop_list);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 랜덤으로 해시태그 5개 추천
router.get('/random_tag/:apikey', async (req, res) =>{
    try {
        const { apikey } = req.params;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        const [tag_list] = await db.query('SELECT * FROM tag_list');

        if (!tag_list || tag_list.length === 0) {
            return res.status(400).json({ erro : "tag_list가 비어있습니다"})
        }
        
        const randomTagList = [];
        while (randomTagList.length < 5) {
            const randomIndex = Math.floor(Math.random() * tag_list.length);
            const randomTag = tag_list[randomIndex];

            if (!randomTagList.some(tag => tag.id === randomTag.id)) {
                randomTagList.push(randomTag);
            }
        }
        
        res.status(200).json(randomTagList);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 검색 창을 통한 검색 + 유저 검색 기록 저장
router.post('/user_search/:apikey', async (req, res) => {
    try {
        const { apikey } = req.params;
        const { user_insert } = req.body;
        const user_id = req.session.user?.id;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }
        if (!user_insert) {
            return res.status(400).send({ error: '검색내역이 없습니다.' });
        }
        if (!user_id) {
            return res.status(400).send({ error: 'user_id 값이 없습니다.' });
        }

        const [shop] = await db.query('SELECT * FROM shop');

        if (!shop || shop.length === 0) {
            return res.status(404).json({ message: "No data found in database." });
        }

        const filteredShops = shop.filter(item => item.shop_name.includes(user_insert));
        res.status(200).json(filteredShops);

        // 검색했던 리스트의 길이가 5 초과이면 가장 오래전에 검색했던 내용을 삭제하기
        const [search_list] = await db.query('SELECT * FROM user_search WHERE user_id = ?', [user_id]);

        if(search_list) {
            if(search_list.length >= 5) {
                await db.query('DELETE FROM user_search WHERE user_id = ? AND searched_date = (SELECT searched_date FROM (SELECT searched_date FROM user_search WHERE user_id = ? ORDER BY searched_date ASC LIMIT 1) AS temp)', [user_id, user_id]);
            }
        }   
        await db.query('INSERT INTO user_search (user_id, user_searched) VALUES(?, ?)', [user_id, user_insert]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 유저 검색기록 반환
router.get('/user_search_history/:apikey', async (req, res) => {
    try {
        const {apikey} = req.params;
        const user_id = req.session.user?.id;

         // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }
        if (!user_id) {
            return res.status(400).send({ error: 'user_id 값이 없습니다.' });
        }

        const [search_list] = await db.query('SELECT * FROM user_search WHERE user_id = ? ORDER BY searched_date DESC', [user_id]);
        if (!search_list) {
            return res.status(400).send({ error: '검색 내역이 없습니다.' });
        }
        return res.status(200).json(search_list);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;