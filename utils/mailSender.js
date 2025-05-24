/* 인증 번호 전송 */

const nodemailer = require('nodemailer');
require('dotenv').config();

// 렌덤 code 생성하는 함수
const generateRandomNumber = (n) => {
    let code = "";
    for (let i = 0; i < n; i++) {
        code += Math.floor(Math.random() * 10);
     }
    return code;
};

async function sendAuthCodeEmail(toEmail, authCode) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.NODEMAILER_USER,
            pass: process.env.NODEMAILER_PASSWORD,
        },
    });

    const mailOptions = {
        from: `"Oh!MyKase" <${process.env.NODEMAILER_USER}>`,
        to: toEmail,
        subject: 'Oh!MyKase 회원가입 인증 번호',
        text: ` 인증 번호 : ${authCode}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.response}`);
}

module.exports = { generateRandomNumber, sendAuthCodeEmail };