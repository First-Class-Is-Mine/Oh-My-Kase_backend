/* 북마크 api */

const express = require('express');
const uuidAPIKey = require('uuid-apikey');
var db = require('../config/db.js');

const key = {
    apiKey: process.env.API_KEY,
    uuid: '3ed8e58c-3256-464f-bec4-63925ebfae75'        
}

const router = express.Router();

// 북마크 추가
router.post('/add/:apikey/:shop_id', async (req, res) => {
    try {
        const { apikey, shop_id } = req.params;
        const user_id = req.session.user?.id;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }
        if (!user_id) {
            return res.status(400).send({ error: 'user_id가 존재하지 않습니다.' });
        }

        await db.query('INSERT INTO bookmark (user_id, shop_id) VALUES (?, ?)', [user_id, shop_id]);
        return res.status(200).json({ message: '북마크에 식당이 추가되었습니다!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 북마크 삭제
router.delete('/delete/:apikey/:bookmark_id', async (req, res) => {
    try {
        const { apikey, bookmark_id } = req.params;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }
        if (!bookmark_id) {
            return res.status(400).send({ error: 'bookmark_id가 존재하지 않습니다.' });
        }

        await db.query('DELETE FROM bookmark WHERE id = ?', [bookmark_id]);
        return res.status(200).json({ message: '북마크에서 삭제되었습니다!' })

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// user 북마크 목록 확인
router.get('/user/:apikey', async (req, res) => {
    try {
        const { apikey } = req.params;
        const user_id = req.session.user?.id;

        //API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }
        if (!user_id) {
            return res.status(400).send({ error: 'user_id가 존재하지 않습니다.' });
        }

        const [row] = await db.query('SELECT * FROM shop WHERE id IN (SELECT shop_id FROM bookmark WHERE user_id = ?)', [user_id]);
        const bookmark_list = row[0];
        return res.status(200).json({ bookmark_list });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// shop의 bookmark 갯수
router.get('/shop/:apikey/:shop_id', async (req, res) => {
    try {
        const { apikey, shop_id } = req.params;

        //API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }
        if (!shop_id) {
            return res.status(400).send({ error: 'shop_id가 존재하지 않습니다.' });
        }

        const [row] = await db.query('SELECT COUNT(*) AS cnt FROM bookmark WHERE shop_id = ?', [shop_id]);
        const bookmark_sum = row[0].cnt;
        return res.status(200).json({ bookmark_sum });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;