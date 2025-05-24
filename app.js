const express = require('express');
const morgan = require('morgan');
const cookiParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.set('port', process.env.PORT || 3000)

// 라우터 설정
const ChoseArea = require('./routes/chose_area_api');
const AreaFilter = require('./routes/shop_area_filter_api');
const ChoseShop = require('./routes/chose_shop_api');
const Search = require('./routes/search_api');
const SearchShop = require('./routes/search_shop_api');
const ChoseCategory = require('./routes/chose_category_api');
const CategoryFilter = require('./routes/shop_category_fiter_api');
const User = require('./routes/user_api');

app.use(morgan('dev'));
app.use('/',express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false}));
app.use(cookiParser(process.env.COOKIE_SECRET));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
    name: 'session-cookie',
}));

// routes에서 만든 라우터 불러오기
app.use('/api/search', Search);
app.use('/api/area', ChoseArea);
app.use('/api/area', AreaFilter);
app.use('/api/shop', ChoseShop);
app.use('/api/shop', SearchShop);
app.use('/api/category', ChoseCategory);
app.use('/api/category', CategoryFilter);
app.use('/api/user', User)

// 기본 라우터
app.get('/',(req,res)=>{
    res.send('Hello, Express');
});

app.listen(app.get('port'),()=>{
    console.log(app.get('port'),'번 포트에서 대기 중');
});