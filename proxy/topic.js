/**
 * proxy - topic.
 * User: raytin
 * Date: 13-3-28
 */
var models = require('../models'),
    modelTopic = models.Topic;

/**
 * 获取所有最新话题
 * Callback:
 * - err, 数据库异常
 * - topics, 话题
 * @param {Object} opt 过滤条件
 * @param {Function} callback 回调函数
 */
function getTopicList(query, opt, callback){
    modelTopic.find(query, '', opt, callback);
};

/**
 * 根据用户名获取话题
 * Callback:
 * - err, 数据库异常
 * - topics, 话题
 * @param {Function} callback 回调函数
 */
function getTopicListByName(name, callback){
    modelTopic.find({author_name: name}, '', {limit: 20, sort: [['_id', 'desc']]}, callback);
};

/**
 * 获取话题数
 * Callback:
 * - err, 数据库异常
 * - count, 话题数
 * @param {Object} condition 条件
 * @param {Function} callback 回调函数
 */
function getTopicCount(condition, callback){
    if(typeof condition == 'function'){
        callback = condition;
        condition = {};
    }
    condition['$where'] = 'this.replyTo === undefined';
    modelTopic.count(condition, callback);
};

/**
 * 获取所有最新话题
 * Callback:
 * - err, 数据库异常
 * - topics, 话题
 * @param {String} id 话题id
 * @param {String} condi 字段
 * @param {Object} opt 筛选条件
 * @param {Function} callback 回调函数
 */
function getOneTopicById(id, condi, opt, callback){
    if(typeof opt == 'function'){
        callback = opt;
        opt = {};
    }
    modelTopic.findOne({_id: id}, condi, opt, callback);
};

/**
 * 更新话题
 * Callback:
 * - err, 数据库异常
 * - topics, 话题
 * @param {String} id 话题id
 * @param {Object} opt 筛选条件
 * @param {Function} callback 回调函数
 */
function updateTopicById(id, opt, callback){
    modelTopic.update({_id: id}, {$set: opt}, callback);
};

/**
 * 获取所有不是评论的话题
 * Callback:
 * - err, 数据库异常
 * - topics, 话题
 * @param {Object} opt 筛选条件
 * @param {Object} fields 字段
 * @param {Function} callback 回调函数
 */
function getMainTopic(fields, opt, callback){
    modelTopic.find({$where: 'this.replyTo === undefined'}, fields, opt, callback);
};

module.exports = {
    getTopicList: getTopicList,
    getTopicListByName: getTopicListByName,
    getTopicCount: getTopicCount,
    getOneTopicById: getOneTopicById,
    updateTopicById: updateTopicById,
    getMainTopic: getMainTopic
};