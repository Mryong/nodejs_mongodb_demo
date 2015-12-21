/**
 * 简化版的微博
 * Created by yong_pliang on 15/12/21.
 */


var base = require('./Base');
var ObjectId = base.ObjectId;
var StatusScheme = new base.Schema({
    creatorId: ObjectId,//创建人id
    creatorPortraitUri: String,//创建人头像
    creatorNickname: String,//创建人昵称
    content: String,//微博内容
    pics:[{url: String, width: Number, height: Number, _id: false}],//微博图片
    createTime: {type: Date, default: Date.now}//创建时间
});
var StatusEntity = base.mongoose.model('StatusEntity', StatusScheme, 'status');
exports.StatusEntity = StatusEntity;