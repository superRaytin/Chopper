/**
 * proxy - user.
 * User: raytin
 * Date: 13-3-27
 */
var models = require('../models');

var UserModel = models.User,
    util = require('../util');

/**
 * 根据查询条件查询单个用户信息
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {Object} query 查询条件
 * @param {Object} fields 返回字段
 * @param {Function} callback 回调函数
 */
function getOneUserInfo(query, fields, callback){
    if(!fields) fields = '';
    UserModel.findOne(query, fields, callback);
};

/**
 * 根据用户名查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} name 用户名
 * @param {Function} callback 回调函数
 */
function getUserInfoByName(name, fields, callback){
    getOneUserInfo({name : name}, fields, callback);
};

/**
 * 根据查询条件查找所有用户
 * Callback:
 * - err, 数据库异常
 * - users, 用户
 * @param {Object} query 查询条件
 * @param {String} fields 查询字段
 * @param {Object} opt 过滤参数
 * @param {Function} callback 回调函数
 */
function getUserListBy(query, fields, opt, callback){
    UserModel.find(query, fields, opt, callback);
};

/**
 * 查找所有用户
 * Callback:
 * - err, 数据库异常
 * - users, 用户
 * @param {Function} callback 回调函数
 */
function getUserList(fields, callback){
    getUserListBy({}, fields, {limit: 10, sort: [['_id', -1]]}, callback);
    //UserModel.findOne({name : 'aaa'}, callback);
    //UserModel.find({}, 'name pass', {limit: 5}, callback);
    //UserModel.find({}, fields, {limit: 10, sort: [['_id', -1]]}, callback);
    //UserModel.find({ name: { $in: names } }, callback);
};

/**
 * 根据用户名查找用户ID
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} name 用户名
 * @param {Function} callback 回调函数
 */
function getUserIdByName(name, callback){
    getOneUserInfo({name : name}, '_id', callback);
};

/**
 * 根据查询条件更新用户信息
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {Object} query 查询条件
 * @param {Object} opt 更新字段
 * @param {Function} callback 回调函数
 */
function updateUserInfo(query, opt, callback){
    UserModel.update(query, opt, callback);
};

/**
 * 更新最后登录状态
 * Callback:
 * - err, 数据库异常
 * @param {Object} userName 用户名
 * @param {Object} time 登出时间
 * @param {Function} callback 回调函数
 */
function updateLastLogin(userName, time, callback){
    UserModel.update({name: userName}, {$set: {lastLogin_time: util.formatDate(time)}}, callback);
};

module.exports = {
    getOneUserInfo: getOneUserInfo,
    getUserInfoByName: getUserInfoByName,
    getUserIdByName: getUserIdByName,
    getUserListBy: getUserListBy,
    getUserList: getUserList,
    updateUserInfo: updateUserInfo,
    updateLastLogin: updateLastLogin
};