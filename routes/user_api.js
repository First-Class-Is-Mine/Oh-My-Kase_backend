/* 유저 api */

const express = require('express');
const uuidAPIKey = require('uuid-apikey');
var db = require("../config/db.js");

const key = {
    apiKey: process.env.API_KEY,
    uuid: '3ed8e58c-3256-464f-bec4-63925ebfae75'        
}

const router = express.Router();

// 회원가입
router.post('/join/:apikey', async function (req, res) {
    try{
        const { apikey } = req.params;
        const { name, nickname, password, password_ck } = req.body;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        if (!name || !nickname || !password || !password_ck) {
            res.status(400).send({ error: 'name 또는 nickname 또는 password 또는 password_ck가 입력되지않았습니다.' });
        }
        if (password !== password_ck) {
            res.status(400).send({ error: 'password와 password_ck가 일지하지 않습니다.' });
        }
        
        await db.query('INSERT INTO user (user_name, user_nickname, user_password) VALUES (?, ?, ?)', [name, nickname, password]);
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
        const { nickname, password } = req.body;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        if(!nickname || !password) {
            return res.status(400).send({ err: 'nickname 또는 password가 입력되지 않았습니다.' });
        }
        const [user_check] = await db.query('SELECT id, user_nickname, user_password FROM user');

        const user = user_check.find(u => u.user_nickname === nickname);

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

// 로그아웃
router.post('/logout/:apikey', (req, res) => {
    const { apikey } = req.params;

    // API 키 검증
    if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
        return res.status(401).send('apikey is not valid.');
    }

    req.session.destroy(err => {
        if (err) {
            console.error('세션 삭제 중 에러:', err);
            return res.status(500).send({ error: "로그아웃 실패" });
        }
        res.clearCookie('connect.sid');
        return res.status(200).send({ message: '로그아웃 성공!' });
    });
});

// 회원 정보 조회
router.get('/info/:apikey', async (req, res) => {

    const user_id = req.session.user?.id;
    console.log(user_id);

    try {
        const [user] = await db.query('SELECT user_name, user_mail, user_allergy FROM user WHERE user.id = ?', [user_id]);

        if(!user){
            return res.status(404).send({ error: "사용자 정보를 찾을 수 없습니다." });
        }

        res.status(200).send(user[0]);

    } catch (err) {
        console.error(err);
        res.status(500).send({err: 'Database error'});
    }
});

// 회원 정보 수정
router.patch('/update/:apikey', async (req, res) => {
    try{
        const { apikey } = req.params;
        const user_id = req.session.user?.id;
        console.log(user_id);
        const { name, mail, allergy } = req.body;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        // 수정할 필드만 동적으로 구성
        const fields = [];
        const values = [];
        
        if(name) {
            fields.push('user_name = ?');
            values.push(name);
        }
        if(mail) {
            fields.push('user_mail = ?');
            values.push(mail);
        }
        if(allergy) {
            fields.push('user_allergy = ?');
            values.push(allergy);
        }

        if (fields.length === 0) {
            return res.status(400).send({ err: '수정할 정보가 없습니다.' });
        }

        values.push(user_id);

        const query = `UPDATE user SET ${fields.join(', ')} WHERE id = ?`;
        await db.query(query, values);
        return res.status(200).send({ message: '회원정보가 수정되었습니다!' });
    } catch (err) {
        console.error(err);
        res.status(500).send({err: 'Database error'});
    }
});

// 회원 탈퇴
router.delete('/delete/:apikey', async (req, res) => {
    try{
        const { apikey } = req.params;
        const user_id = req.session.user?.id;
        console.log(user_id);

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        await db.query('DELETE FROM user WHERE id = ?', [user_id]);
        res.status(200).send({ message: '회원 탈퇴 되었습니다!' });
        req.session.destroy;

    } catch (err) {
        console.error(err);
        res.status(500).send({err: 'Database error'});
    }
});

module.exports = router;