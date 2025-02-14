const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password : process.env.MYSQL_PASSWORD,
    database : process.env.MYSQL_ID
});

connection.connect((err) => {
    if (err) {
        console.error('MySQL 연결 실패:', err);
        return;
    }
    console.log('MySQL 연결 성공!');
});
  
connection.end();