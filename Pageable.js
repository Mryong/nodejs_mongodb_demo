/**
 * Created by yong_pliang on 15/7/23.
 */

var Pageable = function (page, size, sort) {
    this.page = page || 0;
    this.size = size || 10;
    this.total = 0;
    this.sort = sort || null;
    this.list = [];

};
module.exports = Pageable;
