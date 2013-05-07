/**
 * proxy - reply.
 * User: raytin
 * Date: 13-5-7
 */
var models = require('../models'),
    modelReply = models.Reply;

/**
 * 获取指定吐槽下所有评论
 * Callback:
 * - err, 数据库异常
 * - topics, 话题
 * @param {String} id 吐槽id
 * @param {Object} opt 过滤条件
 * @param {Function} callback 回调函数
 */
function getReplysByTopicId(id, opt, callback){
    if(typeof opt == 'function'){
        callback = opt;
        opt = {};
    }
    modelReply.find({topic_id: id}, '', opt, callback);
};

/**
 * 获取指定用户评论
 * Callback:
 * - err, 数据库异常
 * - topics, 话题
 * @param {String} name 用户名
 * @param {Object} opt 过滤条件
 * @param {Function} callback 回调函数
 */
function getReplysByUserName(name, opt, callback){
    if(typeof opt == 'function'){
        callback = opt;
        opt = {};
    }
    modelReply.findOne({author_name: name}, '', opt, callback);
};

/**
 * 获取分类数
 * Callback:
 * - err, 数据库异常
 * - count, 分类数
 * @param {Object} condition 条件
 * @param {Function} callback 回调函数
 */
function getCount(condition, callback){
    if(typeof condition == 'function'){
        callback = condition;
        condition = {};
    }
    modelReply.count(condition, callback);
};

/**
 * 删除分类
 * Callback:
 * - err, 数据库异常
 * @param {String} id 分类id
 * @param {Function} callback 回调函数
 */
function delReplyById(id, callback){
    modelReply.findOneAndRemove({_id: id}, callback);
};

module.exports = {
    getReplysByTopicId: getReplysByTopicId,
    getReplysByUserName: getReplysByUserName,
    getCount: getCount,
    delReplyById: delReplyById
};