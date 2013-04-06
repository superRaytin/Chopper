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
 * @param {Function} callback 回调函数
 */
function getTopicList(query, callback){
    modelTopic.find(query !== '' ? query : {}, '', {limit: 20, sort: [['_id', 'desc']]}, callback);
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

module.exports = {
    getTopicList: getTopicList,
    getTopicListByName: getTopicListByName
};