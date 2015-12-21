/**
 * Created by yong_pliang on 15/12/18.
 */
var base = require('./Base');
var ObjectId = base.ObjectId;
var UserScheme =new base.Schema({
    portraitUri:{type:String,default :""},//头像
    password:String,//密码
    nickname:String,//昵称
    motto:{type:String,default:"无个性,不签名!"},//个性签名
    mobile:String,//手机(登陆用户名)
    sex:{type:String,default:0},//0:女 1:男
    ip:{type:String,default:'0.0.0.0'},//ip
    lastLoginTime:Date,//最后登陆时间
    lastActionTime:{type:Date,default:Date.now},//最后活动时间
    createTime:{type:Date,default:Date.now}//创建时间



});
UserScheme.index({mobile:1},{"background" : true});//设置索引
var UserEntity = base.mongoose.model('UserEntity',UserScheme,'user');//指定在数据库中的collection名称为user
exports.UserEntity  = UserEntity;//导出UserEntity实体