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

/**
 * 获取所有分类
 * Callback:
 * - err, 数据库异常
 * - topics, 话题
 * @param {String} id 分类id
 * @param {Object} opt 过滤条件
 * @param {Function} callback 回调函数
 */
function getCategoryList(query, opt, callback){
    if(typeof opt == 'function'){
        callback = opt;
        opt = {};
    }
    !opt.sort && (opt.sort = [['_id', -1]]);
    modelCategory.find(query, '', opt, callback);
}

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
    modelCategory.count(condition, callback);
};

/**
 * 删除分类
 * Callback:
 * - err, 数据库异常
 * @param {String} id 分类id
 * @param {Function} callback 回调函数
 */
function delCategoryById(id, callback){
    modelCategory.findOneAndRemove({_id: id}, callback);
};

module.exports = {
    getCategoryById: getCategoryById,
    getCategoryByName: getCategoryByName,
    getCategoryList: getCategoryList,
    getCount: getCount,
    delCategoryById: delCategoryById
};