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

module.exports = router;