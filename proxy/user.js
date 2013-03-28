/**
 * user.
 * User: raytin
 * Date: 13-3-27
 * Time: 下午6:20
 */
var models = require('../models');

var User = models.User;

/**
 * 根据用户名查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} name 用户名
 * @param {Function} callback 回调函数
 */
exports.getUserByName = function(name, callback){
    User.findOne({name : name}, callback);
};