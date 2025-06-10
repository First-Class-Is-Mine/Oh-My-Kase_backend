/* 리뷰 api */

const express = require('express');
const uuidAPIKey = require('uuid-apikey');
var db = require("../config/db.js");

const key = {
    apiKey: process.env.API_KEY,
    uuid: '3ed8e58c-3256-464f-bec4-63925ebfae75'        
}

const router = express.Router();

// 작성 할 수 있는 리뷰 정보
router.get('/can_write/:apikey', async (req, res) => {
    try {
        const { apikey } = req.params;
        const user_id = req.session.user?.id;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        const [can_write] = await db.query(
            `SELECT r.id, s.shop_name, r.date, r.time, r.people_num, r.review_written
            FROM reservation r JOIN shop s ON r.shop_id = s.id
            WHERE r.status = '완료' AND r.review_written = 'no' AND r.user_id = ?
            ORDER BY r.date DESC LIMIT 1;`, [user_id]
        );
        const can_write_review = can_write[0];

        //모듈 폴더 따로 만들어서 함수 넣기
        const date = new Date(can_write_review.date);
        const day_list = ["(일)", "(월)", "(화)", "(수)", "(목)", "(금)", "(토)"];
            
        // 날짜 형식 변환
        const reserve_date = can_write_review.date.replace(/-/g, ".");

        // 오전, 오후 판단
        const [hourStr, minuteStr] = can_write_review.time.split(":");
        const hour = parseInt(hourStr, 10);

        let period = '';
        let displayHour = hour;

        if (hour < 12) {
            period = '오전';
            if (hour === 0) displayHour = 12;
        } else {
            period = '오후';
            if (hour > 12) displayHour = hour - 12;
        }
            
        const reservation_date = reserve_date.concat(" ", day_list[date.getDay()]);
        const time = period.concat(" ", displayHour, "시");
        const people_num = can_write_review.people_num + "명";

        const info = reservation_date.concat(" / ", time, " / ", people_num);

        res.status(200).json({
            reservation_id : can_write_review.id,
            shop_name : can_write_review.shop_name,
            reservation_info : info
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 리뷰 작성 할 리뷰 정보
router.get('/chose_write/:apikey/:reservation_id', async (req, res) => {
    try {
        const { apikey, reservation_id } = req.params;
        const user_id = req.session.user?.id;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        const [chose_reservation] = await db.query(
            `SELECT r.id, s.shop_name, r.date, r.time, r.people_num, r.review_written, r.L_price, r.H_price
            FROM reservation r JOIN shop s ON r.shop_id = s.id
            WHERE r.id = ? AND r.user_id = ?`, [reservation_id, user_id]
        );
        const chose_reservation_info = chose_reservation[0];

        const date = new Date(chose_reservation_info.date);
        const day_list = ["(일)", "(월)", "(화)", "(수)", "(목)", "(금)", "(토)"];
            
        // 날짜 형식 변환
        const reserve_date = chose_reservation_info.date.replace(/-/g, ".");

        // 오전, 오후 판단
        const [hourStr, minuteStr] = chose_reservation_info.time.split(":");
        const hour = parseInt(hourStr, 10);

        let period = '';
        let displayHour = hour;

        if (hour < 12) {
            period = '오전';
            if (hour === 0) displayHour = 12;
        } else {
            period = '오후';
            if (hour > 12) displayHour = hour - 12;
        }
            
        const reservation_date = reserve_date.concat(" ", day_list[date.getDay()]);
        const time = period.concat(" ", displayHour, "시");
        const people_num = chose_reservation_info.people_num + "명";

        const info = reservation_date.concat(", ", time, ", ", people_num);

        res.status(200).json({
            shop_name: chose_reservation_info.shop_name,
            info: info,
            price: "¥".concat("", chose_reservation_info.L_price, " ~ ¥", chose_reservation_info.H_price)
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 리뷰 작성
router.post('/write/:apikey/:reservation_id', async (req, res) => {
    try {
        const { apikey, reservation_id } = req.params;
        const { rating, image, writing } = req.body;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        await db.query(
            `INSERT INTO review (reservation_id, review_rating, review_image, review_writing) VALUES (?, ?, ?, ?)`, [reservation_id, rating, image, writing]
        );

        res.status(200).json({ message: "리뷰가 저장 되었습니다." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 전체 리뷰

// 나의 리뷰

module.exports = router;