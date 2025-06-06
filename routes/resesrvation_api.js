/* 가게 예약 api */

const express = require('express');
const uuidAPIKey = require('uuid-apikey');
var db = require("../config/db.js");

const key = {
    apiKey: process.env.API_KEY,
    uuid: '3ed8e58c-3256-464f-bec4-63925ebfae75'        
}

const router = express.Router();

// 예약 일시, 인원, 시간 데이터 저장 
router.post('/step1/:apikey/:shop_id', async (req, res) => {
    try {
        const { apikey, shop_id } = req.params;
        const { date, people_num, time } = req.body;
        const user_id = req.session.user?.id;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        if(!date || !people_num || !time) {
            return res.satus(400).send('date 또는 people_num 또는 time이 비어있습니다.')
        }

        const [reservation] = await db.query('INSERT INTO reservation (user_id, shop_id, date, people_num, time) VALUES (?, ?, ?, ?, ?)', [user_id, shop_id, date, people_num, time]);
        const reservation_id = reservation.insertId;
        console.log("날짜, 인원수, 시간 저장 완료!");
        return res.status(200).json({ reservation_id });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 예약자명, 이메일, 음식 가격대 저장
router.post('/step2/:apikey/:reservation_id', async (req, res) => {
    try {
        const { apikey, reservation_id } = req.params;
        const { name, mail, max_price, min_price, food_amount } = req.body;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        if(!name || !mail || !max_price ||!min_price || !food_amount) {
            return res.status(400).send('name 또는 mail 또는 max_price 또는 min_price가 비어있습니다.')
        }

        const [reservation] = await db.query('UPDATE reservation SET user_name = ?, user_mail = ?, H_price = ?, L_price = ?, food_amount = ? WHERE id = ?', [name, mail, max_price, min_price, food_amount, reservation_id]);
        const peopel_num = reservation.peopel_num;
        console.log("예약자명, 이메일, 음식 가격대, 음식양 저장 완료!");
        return res.status(200).json({ reservation_id, peopel_num });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 알레르기 및 불호음식 정보 저장
router.post('/step3/:apikey/:reservation_id', async (req, res) => {
    try {
        const { apikey, reservation_id } = req.params;
        const { input_allergy } = req.body;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        await db.query('UPDATE reservation SET allergy= ? WHERE id = ?', [ input_allergy, reservation_id]);
        console.log("알레르기 정보 저장 완료!");
        return res.status(200).json({ message: '예약이 완료되었습니다!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;