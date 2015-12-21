/**
 * Created by yong_pliang on 15/12/18.
 */

var mongoose = require('mongoose');//引入mongoose库
mongoose.connect('mongodb://localhost:27017/demo');//mongodb连接地址,demo为数据库名称,默认mongodb连接不需要密码
exports.mongoose = mongoose;//导出mongoose对象



//配置需要登陆认证的访问路径
exports.needLoginUrlRegs = [
    /^(\/)+app(\/)+status(\/)+compose_status/,
];
