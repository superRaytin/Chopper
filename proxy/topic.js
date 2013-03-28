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
exports.getTopicList = function(callback){
    modelTopic.find({}, '', {limit: 20}, callback);
};