const mysql = require('mysql2');
const dotenv = require('dotenv');


dotenv.config(); // .env 파일 로드


const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_ID,
    waitForConnections: true,
});


// MySQL 연결 확인
pool.getConnection((err, connection) => {
    if (err) {
        console.error('MySQL 연결 실패:', err);
    } else {
        console.log('MySQL 연결 성공!');
        connection.release(); // 연결 반환
    }
});


// 비동기 방식
module.exports = pool.promise();