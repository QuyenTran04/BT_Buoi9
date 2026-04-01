var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let mongoose = require('mongoose')



var app = express();

// Pure REST API — no view engine needed

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/roles', require('./routes/roles'));
app.use('/api/v1/products', require('./routes/products'));
app.use('/api/v1/categories', require('./routes/categories'));
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/inventories', require('./routes/inventories'));
app.use('/api/v1/messages', require('./routes/messages'));

//connect
mongoose.connect("mongodb://localhost:27017/BT6SangT4");
mongoose.connection.on('connected', function () {
  console.log("connected");
})
mongoose.connection.on('disconnected', function () {
  console.log("disconnected");
})


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler — trả về JSON thay vì render view
app.use(function (err, req, res, next) {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
});

module.exports = app;
