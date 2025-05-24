/* 유저 api */

const express = require('express');
const uuidAPIKey = require('uuid-apikey');
const mailSender = require('../utils/mailSender.js');
var db = require("../config/db.js");

const key = {
    apiKey: process.env.API_KEY,
    uuid: '3ed8e58c-3256-464f-bec4-63925ebfae75'        
}

const router = express.Router();

// 이메일 중복 확인 + 인증 번호 생성 및 발송
router.post('/join/request-authcode/:apikey', async function (req, res) {
    try {
        const { apikey } = req.params;
        const { name, mail } = req.body;

        const [users] = await db.query('SELECT user_name, user_mail FROM user');
        const [authRows] = await db.query('SELECT * FROM email_auth WHERE email = ?', [mail]);

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        if (!name || !mail) {
            return res.status(400).json({ error: 'name, mail 중 입력되지 않은 값이 있습니다다.' });
        }
        if(users.find(u => u.user_mail === mail)) {
            return res.status(400).send({ err: '이미 회원가입 된 mail 입니다.' });
        }
        if (authRows.length > 0) {
            await db.query('DELETE FROM email_auth WHERE email = ?', [mail]);
        }

        const authCode = mailSender.generateRandomNumber(5);
        await mailSender.sendAuthCodeEmail(mail, authCode);
        
        await db.query('INSERT INTO email_auth (email, name, auth_code, created_at) VALUES (?, ?, ?, NOW())', [mail, name, authCode]);
        return res.status(200).json({ message: '인증 코드가 이메일로 발송되었습니다.' });
       
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 인증 번호 확인
router.post('/join/verify-authcode/:apikey', async function (req, res) {
    try {
        const { apikey } = req.params;
        const { email, authCode } = req.body;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        const [result] = await db.query('SELECT * FROM email_auth WHERE email = ?', [email]);

        if (!result || result.length === 0) {
                return res.status(404).json({ error: '인증 기록이 없습니다.' });
        }

        const authData = result[0];

        // 인증 번호 만료 시간 확인
        const now = new Date();
        const createdAt = new Date(authData.created_at);
        const diff = now - createdAt;

        if (diff > 5 * 60 * 1000) {    // 5분 이상
            return res.status(410).json({ error: '인증 코드가 만료되었습니다.' });
        }

        if (authData.auth_code !== authCode) {
            return res.status(400).json({ error: '인증 코드가 올바르지 않습니다.' });
        }

        req.session.verifiedUser = {
            name: authData.name,
            mail: authData.email
        };
        return res.status(200).json({ message: '인증이 완료되었습니다.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 회원가입 정보 입력
router.post('/join/complete/:apikey', async function (req, res) {
    try{
        const { apikey } = req.params;
        const { name, mail } = req.session.verifiedUser;
        const { password, password_ck } = req.body;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        if (!name || !mail) {
            res.status(400).send({ error: 'name과 mail 데이터가 없습니다.' });
        }
        if (!password || !password_ck) {
            res.status(400).send({ error: 'password 또는 password_ck가 입력되지않았습니다.' });
        }
        if (password !== password_ck) {
            res.status(400).send({ error: 'password와 password_ck가 일지하지 않습니다.' });
        }
        
        await db.query('INSERT INTO user (user_name, user_password, user_mail) VALUES (?, ?, ?)', [name, password, mail]);
        return res.status(200).json({ message: '회원가입 성공!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 로그인
router.post('/login/:apikey', async (req, res) => {
    try {
        const { apikey } = req.params;
        const { mail, password } = req.body;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        if(!mail || !password) {
            return res.status(400).send({ err: 'mail 또는 password가 입력되지 않았습니다.' });
        }
        const [user_check] = await db.query('SELECT id, user_mail, user_password FROM user');

        const user = user_check.find(u => u.user_mail === mail);

        if (user) {
            if (password === user.user_password) {
                req.session.user = {id : user.id};
                return res.status(200).json({ message: '로그인 성공!' });
            } else {
                 return res.status(400).send({ error: 'password를 잘못 입력하셨습니다.' });
            }  
        } else {
            return res.status(500).send({ err: '사용자를 찾을 수 없습니다.' });
        }

    } catch (err) {
        console.error(err);
        res.status(500).send({err: 'Database error'});
    }
});

module.exports = router;