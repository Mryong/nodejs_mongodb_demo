var express = require('express');//加载express
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');//加载morgan,主要功能是在控制台中，显示req请求的信息
var cookieParser = require('cookie-parser');//支持cookie
var bodyParser = require('body-parser');

var util = require('util');
var myUtils = require('./util/myUtils');
var tokenUtils = require('./util/tokenUtils');
var RestResult = require('./RestResult');
var config = require('./config/config');

var userRouter = require('./routes/user');//引入自定义的user路由中间件
var statusRouter = require('./routes/status');

var UserEntity = require('./models/User').UserEntity;

var app = express();//创建app

// view engine setup
app.set('views', path.join(__dirname, 'views'));//设置模板文件路径
app.set('view engine', 'ejs');//使用ejs模板引擎

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


//app访问预处理中间件
app.use(function (req, res, next) {

    res.error = function (errorCode, errorReason) {
        var restResult = new RestResult();
        restResult.errorCode = errorCode;
        restResult.errorReason = errorReason;
        res.send(restResult);
    };


    res.success = function (returnValue) {
        var restResult = new RestResult();
        restResult.errorCode = RestResult.NO_ERROR;
        restResult.returnValue = returnValue || {};
        res.send(restResult);
    };


    var ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress; //设置ip
    req.ip = ip;//将解析后的ip放入req中,一遍方便使用

    var needLogin = false;
    var requestUrl = req.url;
    myUtils.ArrayUtils.each(config.needLoginUrlRegs, function (urlReg) {//片段请求路径是否为安全路径
        if (urlReg.test(requestUrl)) {
            needLogin = true;
            return false;//返回false表示结束数组的遍历
        }
    });

    if (needLogin) {
        var token = req.headers.token;
        var result;
        if (myUtils.StringUtils.isNotEmpty(token) && (result = tokenUtils.parseLoginAutoToken(token))) {

            var timestamp = result.timestamp;
            //todo 如果对token的时间有限制,可以在这里做处理

            var userId = result.userId;
            UserEntity.findById(userId, '_id', function (err, user) {
                if (!user) {
                    res.error(RestResult.AUTH_ERROR_CODE, "用户不存在");
                } else {
                    //跟新最后活动时间和ip地址
                    UserEntity.update({_id: userId}, {$set: {lastActionTime: new Date()}, ip: ip}).exec();
                    //将当前登陆的用户id设置到req中
                    req.loginUserId = userId;
                    //进入路由中间件
                    next();
                }
            })

        } else {
            res.error(RestResult.AUTH_ERROR_CODE, "无效的token");
        }
    } else {
        next();
    }


});


app.use('/app/user', userRouter);//挂载user模块路由中间件
app.use('/app/status',statusRouter);//挂载微博模块路由中间件

// catch 404 and forward to error handler
app.use(function (req, res, next) {//404中间件
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {//异常中间件
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
