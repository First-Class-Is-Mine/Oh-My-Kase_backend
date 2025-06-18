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

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

const User = require('./routes/user_api');
const BookMark = require('./routes/boomark_api');
const Search = require('./routes/search_api');
const Shop = require('./routes/shop_api');
const Reservation = require('./routes/reservation_api');
const Review = require('./routes/review_api');

app.use(morgan('dev'));
app.use('/', express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
  secret: process.env.COOKIE_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60
  }
}));

app.use('/api/user', User);
app.use('/api/bookmark', BookMark);
app.use('/api/search', Search);
app.use('/api/shop', Shop);
app.use('/api/reservation', Reservation);
app.use('/api/review', Review);

const reviewPath = process.env.REVIEW_PATH || path.join(__dirname, 'uploads/reviews');
app.use('/uploads', express.static(reviewPath));

app.get('/', (req, res) => {
  res.send('Hello, Express');
});

app.listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기 중');
});
