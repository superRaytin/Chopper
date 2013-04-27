/**
 * proxy - category.
 * User: raytin
 * Date: 13-3-28
 */
var models = require('../models'),
    modelCategory = models.Category;

/**
 * 获取指定分类下所有话题
 * Callback:
 * - err, 数据库异常
 * - topics, 话题
 * @param {String} id 分类id
 * @param {Object} opt 过滤条件
 * @param {Function} callback 回调函数
 */
function getCategoryById(id, opt, callback){
    if(typeof opt == 'function'){
        callback = opt;
        opt = {};
    }
    modelCategory.findOne({_id: id}, '', opt, callback);
};
function getCategoryByName(name, opt, callback){
    if(typeof opt == 'function'){
        callback = opt;
        opt = {};
    }
    modelCategory.findOne({name: name}, '', opt, callback);
};

module.exports = {
    getCategoryById: getCategoryById,
    getCategoryByName: getCategoryByName
};