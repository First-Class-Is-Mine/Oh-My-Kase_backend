const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.set('port', process.env.PORT || 3000);

const allowedOrigins = [
  'http://localhost:3001',
  'https://ohmykase.vercel.app',
  'https://ohmykase.mirim-it-show.site',
];

// 1. CORS 설정 (모든 API, OPTIONS에 대해)
app.use(cors({
  origin: function (origin, callback) {
    // 서버사이드, Postman, 혹은 origin 없는 경우(null)은 허용
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// 2. OPTIONS 프리플라이트 요청 미들웨어 (중복 허용 보장)
app.options('*', cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// 3. 기타 미들웨어
app.use(morgan('dev'));
app.use('/', express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// 4. 세션 미들웨어 (HTTPS/크로스도메인에 최적화)
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  name: 'connect.sid',
  cookie: {
    httpOnly: true,
    secure: true,       // 반드시 HTTPS에서만 동작 (로컬 개발시 false)
    sameSite: 'none',   // 크로스 도메인 쿠키 허용
    maxAge: 1000 * 60 * 60 * 24, // (선택) 1일 유지
  },
}));

// 5. 라우트 연결
const User = require('./routes/user_api');
const BookMark = require('./routes/boomark_api');
const Search = require('./routes/search_api');
const Shop = require('./routes/shop_api');
const Reservation = require('./routes/reservation_api');
const Review = require('./routes/review_api');

app.use('/api/user', User);
app.use('/api/bookmark', BookMark);
app.use('/api/search', Search);
app.use('/api/shop', Shop);
app.use('/api/reservation', Reservation);
app.use('/api/review', Review);

// 6. 리뷰 업로드 정적 폴더
const reviewPath = process.env.REVIEW_PATH || path.join(__dirname, 'uploads/reviews');
app.use('/uploads', express.static(reviewPath));

// 7. 기본 라우트
app.get('/', (req, res) => {
  res.send('Hello, Express');
});

// 8. 서버 실행
app.listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기 중');
});
