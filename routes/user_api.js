/* 유저 회원가입, 로그인, 로그아웃 api */

const express = require('express');
const uuidAPIKey = require('uuid-apikey');
var db = require("../config/db.js");

const key = {
    apiKey: process.env.API_KEY,
    uuid: '3ed8e58c-3256-464f-bec4-63925ebfae75'        
}

const router = express.Router();

// 회원가입
router.post('/join/:apikey', async function (req, res, next) {
    try {
        const { apikey } = req.params;
        const { user_name, user_birth, user_mail, user_password } = req.body;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        // 필요한 내용이 입력되었는지 확인
        if (!user_name || !user_birth || !user_mail || !user_password) {
            return res.status(400).json({ error: 'name, birth, Email and password are required.' });
        }

        // TODO : 비밀번호 해싱 구현하기

        // 유저 정보 저장
        const sql = 'INSERT INTO user (user_name, user_birth, user_mail, user_password) VALUES (?, ?, ?, ?)';
        await db.query(sql, [user_name, user_birth, user_mail, user_password]);

        console.log("결과:", '회원가입 성공!');
       
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 로그인
router.post('/login/:apikey', async function (req, res, next) {
    try {
        const { apikey } = req.params;
        const { user_mail, user_password } = req.body;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        // 필요한 내용이 입력되었는지 확인
        if (!user_mail || !user_password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // DB 사용자 조회
        const sql = 'SELECT id, user_name, user_password FROM user WHERE user_mail = ?';
        const [rows] = await db.query(sql, [user_mail]);

        if(rows.length === 0) {
            console.log('회원가입 되지 않은 사용자입니다.')
            return res.status(404).json({ error: 'User not found.' });
        }

        const user = rows[0];

        // 비밀번호 검증
        if(user.user_password != user_password){
            return res.status(404).json({ error: 'Invalid password'})
        }

        // 로그인 성공
        res.json({
            user_id: user.id,
            user_name: user.user_name
        });
       
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;