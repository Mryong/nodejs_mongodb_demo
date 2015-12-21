/**
 * Created by yong_pliang on 15/12/18.
 */

var express = require('express');
var router = express.Router();
var RestResult = require('../RestResult');
var myUtils = require('../util/myUtils');
var tokenUtils = require('../util/tokenUtils');

var UserEntity = require('../models/User').UserEntity;
var VerificationCodeEntity = require('../models/VerificationCode').VerificationCodeEntity;


/**
 * 注册接口
 */
router.post('/register', function (req, res, next) {
    var mobile = req.body.mobile;
    if (!/1\d{10}/.test(mobile)) {//手机号码格式校验
        res.error(RestResult.ILLEGAL_ARGUMENT_ERROR_CODE, "请填写真确的手机格式");
        return;
    }


    var registerToken = req.body.registerToken;
    //如果没有registerToken(注册token),则这个接口肯定为非法访问
    if (myUtils.StringUtils.isEmpty(registerToken)) {
        res.error(RestResult.ILLEGAL_ARGUMENT_ERROR_CODE, "参数安全异常");
        return;
    }
    //解析注册token得到verificationCodeToken(验证码token)
    var verificationCodeToken = tokenUtils.decrypt(registerToken);
    //解析验证码token
    var vResult = tokenUtils.parseVerificationCodeToken(verificationCodeToken);
    if (!vResult) { //验证码token解析失败,表明registerToken是伪造的
        res.error(RestResult.ILLEGAL_ARGUMENT_ERROR_CODE, "参数安全异常");
        return;
    }

    if (vResult.mobile != mobile) {//如果注册的手机号和token中的手机号不一致,说明token是拦截而取得的,不是正常流程而取得
        res.error(RestResult.ILLEGAL_ARGUMENT_ERROR_CODE, "参数安全异常");
        return;
    }

    var password = req.body.password;
    if (!password || password.length < 6) {//密码长度校验,此处只做最短校验,不做最长校验和其他复杂度校验
        res.error(RestResult.ILLEGAL_ARGUMENT_ERROR_CODE, "密码长度不能少于6位");
        return;
    }
    var nickname = req.body.nickname;
    if (myUtils.StringUtils.isEmpty(nickname)) {//用户名非空校验,此处只做非空校验,不错长度校验
        res.error(RestResult.ILLEGAL_ARGUMENT_ERROR_CODE, "用户昵称不能为空");
        return;
    }


    var portraitUri = req.body.portraitUri;
    //头像校验,头像为一个url字符串,请在客户端上传到七牛等云存储,获得此url


    //findOne方法,第一个参数数条件,第二个参数是字段投影,第三那个参数是回调函数
    UserEntity.findOne({mobile: mobile}, '_id', function (err, user) {
        if (err) {//查询异常
            res.error(RestResult.SERVER_EXCEPTION_ERROR_CODE, "服务器异常");
            return;
        }

        if (user) {//手机号已注册
            res.error(RestResult.BUSINESS_ERROR_CODE, "手机号已注册");
            return;
        }
        //密码加密方式,取决于不同应用需求,此处不做加密
        var registerUser = new UserEntity({
            mobile: mobile,
            password: password,
            nickname: nickname,
            portraitUri: portraitUri
        });
        //调用实体的实例的保存方法
        registerUser.save(function (err, row) {
            if (err) {//服务器保存异常
                res.error(RestResult.SERVER_EXCEPTION_ERROR_CODE, "服务器异常");
                return;
            }
            res.success();//返回成功结果
        });

    });

});


/**
 * 登陆接口
 */
router.post('/login', function (req, res, next) {
    var mobile = req.body.mobile;
    if (!/1\d{10}/.test(mobile)) {//手机号码格式校验
        res.error(RestResult.ILLEGAL_ARGUMENT_ERROR_CODE, "请填写真确的手机格式");
        return;
    }
    var password = req.body.password;
    if (!password) {
        res.error(RestResult.ILLEGAL_ARGUMENT_ERROR_CODE, "密码不能为空");
        return;
    }

    UserEntity.findOne({mobile: mobile, password: password}, {password: 0}, function (err, user) {
        if (err) {
            res.error(RestResult.SERVER_EXCEPTION_ERROR_CODE, "服务器异常");
            return;
        }

        if (!user) {
            res.error(RestResult.BUSINESS_ERROR_CODE, "用户名或密码错误");
            return;
        }

        var loginToken = tokenUtils.getLoginAutoToken(user.id, user.password);
        //返回登陆用户信息和loginToken
        res.success({user:user,loginToken:loginToken});

        //更新最后登陆时间
        UserEntity.update({_id: user._id}, {$set: {lastLoginTime: new Date()}}).exec();

    });
});

/**
 * 测试获得verificationCodeToken
 * 考虑到看这篇文章的朋友不是从事客服端开发或则通过其他方式获取verificationCodeToken比较麻烦,所以在这里写了一个
 * 接口用户获得verificationCodeToken,如果在实际项目中,请删除此接口!!!!!!!
 */
router.get("/verificationCodeToken", function (req, res, next) {
    var mobile = req.query.mobile;
    var type = req.query.type;
    var verificationCodeToken = tokenUtils.genVerificationCodeToken(mobile, type);
    res.success(verificationCodeToken);

});

/**
 * 发送验证码接口
 */
router.post('/send_verification_code', function (req, res, next) {
    var verificationCodeToken = req.body.verificationCodeToken;
    var result = tokenUtils.parseVerificationCodeToken(verificationCodeToken);
    if (!result) {
        res.error(RestResult.BUSINESS_ERROR_CODE, "无效的加密token");
        return;
    }

    var mobile = req.body.mobile;
    var type = req.body.type;
    //校验解密出来的mobile和type是否和参数中的mobile和type一致
    if (result.mobile != mobile || result.type != type) {
        res.error(RestResult.BUSINESS_ERROR_CODE, "无效的加密token");
        return;
    }

    VerificationCodeEntity.find({token: verificationCodeToken}, '_id', function (err, codes) {
        if (codes.length > 0) {//该token已存在,必然是以重复验证或拦截到token做恶意访问
            res.error(RestResult.BUSINESS_ERROR_CODE, "无效的加密token");
            return;
        }


        UserEntity.findOne({mobile: mobile}, '_id', function (err, user) {
            if (err) {
                res.error(RestResult.SERVER_EXCEPTION_ERROR_CODE, "服务器异常");
                return;
            }

            if (type == 0 && user) {
                res.error(RestResult.BUSINESS_ERROR_CODE, "当前手机已注册");
                return;
            }

            if (type != 0 && !user) {
                res.error(RestResult.BUSINESS_ERROR_CODE, "不存在该用户");
                return;
            }

            var code = myUtils.SecurityUtils.generateVerificationCode(6);
            console.log("===== " + mobile + "验证码为:" + code);
            var verificationCode = new VerificationCodeEntity({
                mobile: mobile,
                code: code,
                type: type,//0:注册 1:修改绑定手机 2:修改密码 3:忘记密码
                expirationTime: new Date(new Date().getTime() + 30 * 60 * 1000),
                token: verificationCodeToken
            });

            verificationCode.save(function (err) {
                if (err) {
                    res.error(RestResult.SERVER_EXCEPTION_ERROR_CODE, "服务器异常");
                } else {
                    res.success();
                }

            });

        });

    });
});


/**
 * 验证验证码接口
 */
router.post('/verify_verification_code', function (req, res, next) {
    var mobile = myUtils.StringUtils.trim(req.body.mobile);
    var code = myUtils.StringUtils.trim(req.body.code);
    var type = parseInt(req.body.type);
    VerificationCodeEntity.find({
        mobile: mobile,
        type: type,
    }, '_id code token used expirationTime').sort({createTime: 'desc'}).limit(1).exec(function (err, codes) {
        if (err) {
            res.error(RestResult.SERVER_EXCEPTION_ERROR_CODE, "服务器异常");
            return;
        }
        if (!codes.length) {
            res.error(RestResult.BUSINESS_ERROR_CODE, "验证码错误");
            return;
        }
        var vcode = codes[0];
        console.log(vcode);
        if (vcode.code != code || vcode.expirationTime.getTime() < Date.now() || vcode.used) {
            res.error(RestResult.BUSINESS_ERROR_CODE, "验证码错误");
            return;
        }
        VerificationCodeEntity.update({_id: vcode.id}, {$set: {used: true}}).exec();
        //将verificationCodeToken进行再次加密返回给客服端,进行下一步动作时的验证
        res.success({"registerToken": tokenUtils.encryptText(vcode.token)});
    });

});


module.exports = router;
