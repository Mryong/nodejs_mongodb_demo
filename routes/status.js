/**
 * Created by yong_pliang on 15/12/21.
 */


var express = require('express');
var router = express.Router();

var RestResult = require('../RestResult');
var myUtils = require('../util/myUtils');
var Pageable = require('../Pageable');

var StatusEntity = require('../models/Status').StatusEntity;
var UserEntity = require('../models/User').UserEntity;

/**
 * 微博列表(无需登陆认证)
 */
router.get('/list_of_status', function (req, res, next) {
    var page = req.query.page || 0;
    var size = req.query.size || 10;
    var pageable = new Pageable(page, size, {createTime: 'desc'});
    myUtils.DBTools.page(StatusEntity, null, null, null, pageable, false, function (err, pageable) {
        if (err) {
            res.error(RestResult.SERVER_EXCEPTION_ERROR_CODE, "服务器异常");
        } else {
            res.success(pageable.list);
        }
    });
});


/**
 * 发布微博,需要token验证
 */
router.post('/compose_status', function (req, res, next) {
    var content = req.body.content;
    //pics必须是可转换为JSON数组的标准(键必须用双引号)字符串如:[{"url":"http://","width":230,"height":400}]
    var pics = JSON.parse(req.body.pics || "[]");
    var loginUserId = req.loginUserId;
    UserEntity.findById(loginUserId, '_id portraitUri nickname', function (err, loginUser) {
        if (err) {
            res.error(RestResult.SERVER_EXCEPTION_ERROR_CODE, "服务器异常");
            return;
        }
        var status = new StatusEntity({
            creatorId: loginUser._id,
            creatorPortraitUri: loginUser.portraitUri,
            creatorNickname: loginUser.nickname,
            content: content,
            pics: pics
        });

        status.save(function (err, raw) {
            if (err) {
                res.error(RestResult.SERVER_EXCEPTION_ERROR_CODE, "服务器异常");
                return;
            }
            res.success(status);
        });


    });

});

module.exports = router;
