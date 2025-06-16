/* 가게 예약 api */

const express = require('express');
const uuidAPIKey = require('uuid-apikey');
const mailSender = require('../utils/mailSender.js');
var db = require("../config/db.js");

const key = {
    apiKey: process.env.API_KEY,
    uuid: '3ed8e58c-3256-464f-bec4-63925ebfae75'        
}

const router = express.Router();

// 예약 일시, 시간, 인원 데이터 반환
router.get('/info/:apikey/:reservation_id', async (req, res) => {
    try {
        const { apikey, reservation_id } = req.params;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        const [info] = await db.query('SELECT date, time, people_num FROM reservation WHERE id = ?', [reservation_id]);        
        const reserve_info = info[0];

        if(!reserve_info) {
            return res.status(400).json({ error: '예약 정보가 없습니다.' });
        }

        const date = new Date(reserve_info.date);
        const day_list = ["(일)", "(월)", "(화)", "(수)", "(목)", "(금)", "(토)"];
        
        // 날짜 형식 변환
        const reserve_date = reserve_info.date.replace(/-/g, ".");

        // 오전, 오후 판단
        const [hourStr, minuteStr] = reserve_info.time.split(":");
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

        const result = {
            date: reserve_date.concat(" ", day_list[date.getDay()]),
            time: period.concat(" ", displayHour, "시"),
            people_num: reserve_info.people_num + "명"
        };
        res.status(200).json(result);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

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

        await db.query('UPDATE reservation SET user_name = ?, user_mail = ?, H_price = ?, L_price = ?, food_amount = ? WHERE id = ?', [name, mail, max_price, min_price, food_amount, reservation_id]);
        const [reservation] = await db.query('SELECT * FROM reservation WHERE id = ?', [reservation_id]);
        const reservation_info = reservation[0];
        console.log(reservation_info);
        const user_id = reservation_info.user_id;
        const people_num = reservation_info.people_num;
        console.log("예약자명, 이메일, 음식 가격대, 음식양 저장 완료!");
        return res.status(200).json({ user_id : user_id, reservation_id : reservation_id, people_num : people_num });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 유저 알레르기 정보 반환
router.get('/user_info/:apikey/:user_id', async (req, res) => {
    try {
        const { apikey, user_id } = req.params;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        const[user_allergy] = await db.query('SELECT user_allergy FROM user WHERE id = ?', [user_id]);
        const allergy = user_allergy[0].user_allergy;
        res.status(200).send(allergy);

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

        const [user_info] = await db.query('SELECT user_mail FROM reservation WHERE id = ?', [reservation_id]);

        // 예약 메일 보내기
        setTimeout(function() { 
            mailSender.sendReservationEmail(user_info[0].user_mail, reservation_id);
        }, 30000);

        return res.status(200).json({ message: '예약이 완료되었습니다!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 예약 정보 반환 (진행 중)
router.get('/status/wating/:apikey', async (req, res) => {
    try {
        const { apikey } = req.params;
        const user_id = req.session.user?.id;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        const [info] = await db.query(
            `SELECT status, shop.shop_name, date, time, people_num, L_price, H_price
            FROM reservation JOIN shop ON reservation.shop_id = shop.id
            WHERE status = '진행 중' AND user_id = ?`, [user_id]
        );

        const reserve_info_list = info.map(reserve_info => {

        if(!reserve_info) {
            return res.status(400).json({ error: '예약 정보가 없습니다.' });
        }

        const date = new Date(reserve_info.date);
        const day_list = ["(일)", "(월)", "(화)", "(수)", "(목)", "(금)", "(토)"];
        
        // 날짜 형식 변환
        const reserve_date = reserve_info.date.replace(/-/g, ".");

        // 오전, 오후 판단
        const [hourStr, minuteStr] = reserve_info.time.split(":");
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
        const people_num = reserve_info.people_num + "명";

        return {
        status: reserve_info.status,
        shop_name: reserve_info.shop_name,
        info: reservation_date.concat(" / ", time, " / ", people_num),
        price: "¥".concat("", reserve_info.L_price, " ~ ¥", reserve_info.H_price)
        }
    });

    res.status(200).json(reserve_info_list);
    
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 예약 정보 반환 (예약 확정)
router.get('/status/ok/:apikey', async (req, res) => {
    try {
        const { apikey } = req.params;
        const user_id = req.session.user?.id;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        const [info] = await db.query(
            `SELECT status, shop.shop_name, date, time, people_num, L_price, H_price
            FROM reservation JOIN shop ON reservation.shop_id = shop.id
            WHERE status = '예약 확정' AND user_id = ?`, [user_id]
        );

        const reserve_info_list = info.map(reserve_info => {

        if(!reserve_info) {
            return res.status(400).json({ error: '예약 정보가 없습니다.' });
        }

        const date = new Date(reserve_info.date);
        const day_list = ["(일)", "(월)", "(화)", "(수)", "(목)", "(금)", "(토)"];
        
        // 날짜 형식 변환
        const reserve_date = reserve_info.date.replace(/-/g, ".");

        // 오전, 오후 판단
        const [hourStr, minuteStr] = reserve_info.time.split(":");
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
        const people_num = reserve_info.people_num + "명";

        return {
        status: reserve_info.status,
        shop_name: reserve_info.shop_name,
        info: reservation_date.concat(" / ", time, " / ", people_num),
        price: "¥".concat("", reserve_info.L_price, " ~ ¥", reserve_info.H_price)
        }
    });

    res.status(200).json(reserve_info_list);
    
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 예약 정보 반환 (완료)
router.get('/status/finished/:apikey', async (req, res) => {
    try {
        const { apikey } = req.params;
        const user_id = req.session.user?.id;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        const [info] = await db.query(
            `SELECT status, shop.shop_name, date, time, people_num, L_price, H_price
            FROM reservation JOIN shop ON reservation.shop_id = shop.id
            WHERE status = '완료' AND user_id = ?`, [user_id]
        );

        const reserve_info_list = info.map(reserve_info => {

        if(!reserve_info) {
            return res.status(400).json({ error: '예약 정보가 없습니다.' });
        }

        const date = new Date(reserve_info.date);
        const day_list = ["(일)", "(월)", "(화)", "(수)", "(목)", "(금)", "(토)"];
        
        // 날짜 형식 변환
        const reserve_date = reserve_info.date.replace(/-/g, ".");

        // 오전, 오후 판단
        const [hourStr, minuteStr] = reserve_info.time.split(":");
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
        const people_num = reserve_info.people_num + "명";

        return {
        status: reserve_info.status,
        shop_name: reserve_info.shop_name,
        info: reservation_date.concat(" / ", time, " / ", people_num),
        price: "¥".concat("", reserve_info.L_price, " ~ ¥", reserve_info.H_price)
        }
    });

    res.status(200).json(reserve_info_list);
    
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 예약 정보 반환 (취소)
router.get('/status/cancle/:apikey', async (req, res) => {
    try {
        const { apikey } = req.params;
        const user_id = req.session.user?.id;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        const [info] = await db.query(
            `SELECT status, shop.shop_name, date, time, people_num, L_price, H_price
            FROM reservation JOIN shop ON reservation.shop_id = shop.id
            WHERE status = '취소' AND user_id = ?`, [user_id]
        );

        const reserve_info_list = info.map(reserve_info => {

        if(!reserve_info) {
            return res.status(400).json({ error: '예약 정보가 없습니다.' });
        }

        const date = new Date(reserve_info.date);
        const day_list = ["(일)", "(월)", "(화)", "(수)", "(목)", "(금)", "(토)"];
        
        // 날짜 형식 변환
        const reserve_date = reserve_info.date.replace(/-/g, ".");

        // 오전, 오후 판단
        const [hourStr, minuteStr] = reserve_info.time.split(":");
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
        const people_num = reserve_info.people_num + "명";

        return {
        status: reserve_info.status,
        shop_name: reserve_info.shop_name,
        info: reservation_date.concat(" / ", time, " / ", people_num),
        price: "¥".concat("", reserve_info.L_price, " ~ ¥", reserve_info.H_price)
        }
    });

    res.status(200).json(reserve_info_list);
    
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;