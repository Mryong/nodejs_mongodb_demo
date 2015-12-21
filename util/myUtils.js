/**
 * Created by yong_pliang on 15/7/22.
 */
//Array 工具 start
var ArrayUtils = {};
ArrayUtils.each = function (arr, fn) {
    if (!arr || !arr.length) {
        return;
    }
    var count = arr.length;
    for (var i = 0; i < count; i++) {
        var b = fn(arr[i], i);
        if (b === false) {//返回false表示接受数组的遍历
            return;
        }
    }
};

ArrayUtils.contains = function (arr, e) {
    var retVal = false;
    ArrayUtils.each(arr, function (e1) {
        if (e1 == e) {
            retVal = true;
            return false;
        }
    });
    return retVal;
};

exports.ArrayUtils = ArrayUtils;
//Array 工具 end

//String 工具 start
var StringUtils = {};


StringUtils.isNotEmpty = function (str) {
    if (str) {
        return str.length ? true : false;
    }
    return false;
};

StringUtils.isEmpty = function (str) {
    return !StringUtils.isNotEmpty(str);
};

StringUtils.trim = function (str) {
    return str ? str.trim() : str;

};

exports.StringUtils = StringUtils;
//String 工具 end


//ObjectIdUtils start
var ObjectIdUtils = {};

ObjectIdUtils.contains = function (objectIds, id) {
    if (id === undefined || id === null) {
        return false;
    }
    id = typeof id === 'string' ? id : id.toString();
    var retVal = false;
    ArrayUtils.each(objectIds, function (objectId) {
        objectId = objectId.toString();
        if (objectId == id) {
            retVal = true;
            return false;
        }
    });
    return retVal;
};

ObjectIdUtils.equal = function (id1, id2) {
    return id1.toString() == id2.toString();
};

exports.ObjectIdUtils = ObjectIdUtils;
//ObjectIdUtils end


//PageTools start
var DBTools = {};
/**
 * 分页工具
 * @param entityType 实体
 * @param conditions 条件
 * @param projection 投影
 * @param options
 * @param pageable 分页对象
 * @param total 是否查询出总数量,此处未实现查询总数量
 * @param callback 回调
 */
DBTools.page = function (entityType, conditions, projection, options, pageable, total, callback) {
    var page = pageable.page || 0;
    var size = pageable.size || 10;
    options = options || {};
    options.skip = page * size;
    var query;
    var sort = pageable.sort;
    if (sort) {
        query = entityType.find(conditions, projection, options).sort(sort).limit(size);
    } else {
        query = entityType.find(conditions, projection, options).limit(size);
    }
    query.exec(function (err, docs) {
        if (err) {
            callback(err, pageable);
        } else {
            pageable.list = docs;
            callback(err, pageable);
        }

    });
};

exports.DBTools = DBTools;
//PageTools end


var UrlTools = {};

UrlTools.addPrefix = function (src, prefix) {
    if (!src) {
        return src;
    }

    if (typeof src === 'string') {
        if (src.trim().length == 0) {
            return src;
        }
        return prefix + src;
    }

    if (src instanceof Array) {
        var retVal = [];
        var count = src.length;
        for (var i = 0; i < count; i++) {
            retVal.push(prefix + src[i]);
        }
        return retVal;
    }
    return src;
};

exports.UrlTools = UrlTools;


var SecurityUtils = {};
/**
 * 生成数字随机码
 * @param length 随机码长度
 * @returns {string}
 */
SecurityUtils.generateVerificationCode = function (length) {
    if (length <= 0) {
        return '';
    }
    var code = '';
    for (var i = 0; i < length; i++) {
        var c = parseInt(Math.random() * 10);
        code += c;
    }
    return code;

};
exports.SecurityUtils = SecurityUtils;