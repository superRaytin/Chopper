/**
 * proxy - user.
 * User: raytin
 * Date: 13-3-27
 */
var models = require('../models');

var UserModel = models.User;

/**
 * 根据用户名查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} name 用户名
 * @param {Function} callback 回调函数
 */
exports.getUserByName = function(name, callback){
    UserModel.findOne({name : name}, callback);
};

/**
 * 查找所有用户
 * Callback:
 * - err, 数据库异常
 * - users, 用户
 * @param {Function} callback 回调函数
 */
exports.getUserList = function(callback){
    //UserModel.findOne({name : 'aaa'}, callback);
    UserModel.find({}, 'name pass', {limit: 5}, callback);
    //UserModel.find({ name: { $in: names } }, callback);
};