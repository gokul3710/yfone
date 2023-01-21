var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var hbs = require('express-handlebars');
var app = express();
var fileUpload = require('express-fileupload')
var db = require('./config/connection');
const e = require('express');
var session = require('express-session');
const { Store } = require('express-session');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine ({extname: 'hbs',defaultLayout: 'layout', layoutsDir:__dirname + '/views/layout/', partialsDir:__dirname + '/views/partials/'}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());



//-momery unleaked---------
app.set('trust proxy', 1);

app.use(session({
cookie:{
    secure: true,
    maxAge:60000000
       },
store: new RedisStore(),
secret: 'secret',
saveUninitialized: true,
resave: false
}));

app.use(function(req,res,next){
if(!req.session){
    return next(new Error('Oh no')) //handle error
}
next() //otherwise continue
});

app.use((req,res,next)=>{
  res.header('Cache-Control','no-cache,private,no-Store,must-revalidate,max-scale=0,post-check=0,pre-check=0');
  next();
})


db.connect((err)=>{
  if(err)
  console.log('Error'+err)
  else
  console.log('Database Connected')
})

app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
