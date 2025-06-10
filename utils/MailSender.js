/* 예약 확인 메일 */

const nodemailer = require('nodemailer');
var db = require("../config/db.js");
require('dotenv').config();

// 손님에게 전송하는 예약 확인 메일
async function sendReservationEmail(toEmail) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.NODEMAILER_USER,
            pass: process.env.NODEMAILER_PASSWORD
        },
    });

    const mailOptions = {
        from: `"Oh!MyKase" <${process.env.NODEMAILER_USER}>`,
        to: toEmail,
        subject: 'Oh!MyKase 예약 확인 메일 보내드립니다.',
        text: ` 조금 전 가게에서 고객님의 예약이 확정되었습니다.\n예약 시간에 맞춰 식당에 방문해주세요!\n예약 확정 후 방문 하지 않을 시 서비스 사용이 제한됩니다.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.response}`);

    // 예약 상태 바꿔주는 쿼리 작성하기
    await db.query(`UPDATE reservation SET status = ?`, "예약 확정");
}

module.exports = { sendReservationEmail };
