/**
 * Created by yong_pliang on 15/12/18.
 */
var mongodb = require('../config/config');
var mongoose = mongodb.mongoose;
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var AutoIncrementIdScheme = new Schema({
    nextId: {type: Number, default: 1},
    collectionName: String
});

var AutoIncrementIdEntity = mongoose.model('AutoIncrementIdEntity', AutoIncrementIdScheme, 'autoIncrementId');


exports.mongodb = mongodb;
exports.mongoose = mongoose;
exports.Schema = Schema;
exports.ObjectId = ObjectId;
exports.Mixed = Schema.Types.Mixed;

/**
 * 自增长工具
 * @param collection  记录哪一个集合的自增长值
 * @param callback 回调函数
 * @param start 开始值
 * @param step 增长步长
 */

exports.nextId = function (collection, callback, start, step) {
    AutoIncrementIdEntity.findOne({collectionName: collection}, function (err, adventure) {
        if (adventure) {
            var nextId = parseInt(adventure.nextId);
            AutoIncrementIdEntity.update({_id: adventure.id}, {$set: {nextId: nextId + (step || 1)}}, function () {
                callback(nextId);
            });
        } else {
            adventure = new AutoIncrementIdEntity({nextId: (start || 1), collectionName: collection});
            adventure.save(function () {
                callback(1);
            });
        }
    });
};


