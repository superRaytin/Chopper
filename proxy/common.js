/**
 * common.
 * User: raytin
 * Date: 13-4-5
 */
var userProxy = require('../proxy').User,
    EventProxy = require('eventproxy');

// 获取右侧资源
exports.getSidebarNeed = function(res, next, settings, callback){
    var ep = new EventProxy();
    ep.all('userList', 'current_user', 'userListByCount', function(userList, current_user, userListByCount){
        if(!current_user){
            current_user = null;
        }else{
            current_user.sign = current_user.sign && current_user.sign != '' ? current_user.sign : '这家伙很懒，还没有签名';
        };

        callback({
            users: userList,
            userInfo: current_user,
            usersByCount: userListByCount
        });
    }).fail(next);

    // 最新加入
    userProxy.getUserList('name nickName', ep.done('userList'));

    // 用户信息
    userProxy.getUserInfoByName(settings.current_user ? settings.current_user : res.locals.current_user, settings.fields, ep.done('current_user'));

    // 吐槽之星
    userProxy.getUserListBy({}, 'name nickName topic_count', {limit: 10, sort: [['topic_count', 'desc']]}, ep.done('userListByCount'))
};

// 获取顶部资源
exports.getTopbarNeed = function(res, next, callback){
    if(!res.locals.current_user){
        return callback({topInfo: null});
    };

    var ep = new EventProxy();

    ep.all('current_user', function(current_user){
        callback({
            topInfo: current_user
        });
    }).fail(next);

    userProxy.getUserInfoByName(res.locals.current_user, 'name nickName lastLogin_time', ep.done('current_user'));
};