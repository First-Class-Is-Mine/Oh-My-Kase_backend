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

        const [shop_list] = await db.query('SELECT shop.id, shop.area_id, shop.shop_category_id, shop.shop_name, shop.rating, area.area_name, GROUP_CONCAT(DISTINCT shop_images.image) AS shop_images FROM shop JOIN area ON shop.area_id = area.id LEFT JOIN shop_images ON shop.id = shop_images.shop_id GROUP BY shop.id, shop.area_id, shop.shop_category_id, shop.shop_name, shop.rating, area.area_name;');
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

        // 리뷰를 통한 별점 개산
        await db.query(
            `UPDATE shop SET rating = (
                SELECT FLOOR(AVG(review.review_rating))
                FROM review
                JOIN reservation r ON review.reservation_id = r.id
                WHERE r.shop_id = shop.id)
            WHERE shop.id = ?`, [shop_id]
        );
        console.log("별점이 반영 되었습니다.");

        const [shop_info] = await db.query(
            `SELECT DISTINCT shop.*, GROUP_CONCAT(DISTINCT tag_list.tag_name) AS tag_names, GROUP_CONCAT(DISTINCT shop_images.image) AS shop_images, area.area_name
            FROM shop
            JOIN area ON shop.area_id = area.id
            JOIN tag ON shop.id = tag.shop_id
            JOIN tag_list ON tag.tag_id = tag_list.id
            LEFT JOIN shop_images ON shop.id = shop_images.shop_id
            WHERE shop.id = ? GROUP BY shop.id`, [shop_id]);

        // 별점이 null이면 0으로 하기
        const shop = shop_info.map(item => {
            if(item.rating === null) item.rating = 0;
            return item;
        });
        
        if (!shop) {
            return res.status(400).send({ error: '조건에 맞는 shop이 존재하지 않습니다.' });
        }
        return res.status(200).json(shop);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 가게 리뷰 조회
router.get('/reviews/:apikey/:shop_id', async (req, res) => {
    try {
        const { apikey, shop_id} = req.params;

        // API 키 검증
        if (!uuidAPIKey.isAPIKey(apikey) || !uuidAPIKey.check(apikey, key.uuid)) {
            return res.status(401).send('apikey is not valid.');
        }

        const [reviews] = await db.query(
            `SELECT r.id, u.user_nickname, r.shop_id, s.shop_name, r.date, r.people_num, r.L_price, r.H_price,
            review_rating, review_image, review_writing
            FROM review, reservation r JOIN shop s ON r.shop_id = s.id JOIN user u ON r.user_id = u.id
            WHERE r.review_written = 'yes' AND review.reservation_id = r.id AND r.shop_id = ?`, [shop_id]
        );

        const review_list = reviews.map(review => {

            if(!review) {
                return res.status(400).json({ error: '예약 정보가 없습니다.' });
            }

            // 리뷰 작성 후 지난 시간 구하기
            const date = new Date(review.date);
            const now_date = new Date();

            const diffTime = now_date - date;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let written_Date = "";
            if (diffDays >= 30) {
                const diffMonths = Math.floor(diffDays / 30);
                written_Date = `${diffMonths}달 전`;
            } else {
                written_Date = `${diffDays}일 전`;
            }
                    
            const people_num = review.people_num + "명";

            return {
                shop_id: review.shop_id,
                user: review.user_nickname,
                shop_name: review.shop_name,
                date: written_Date,
                people_num: people_num,
                price: "¥".concat("", review.L_price, " ~ ¥", review.H_price),
                rating: review.review_rating,
                images: review.review_image,
                writing: review.review_writing
            }
        });
        res.status(200).json(review_list);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;