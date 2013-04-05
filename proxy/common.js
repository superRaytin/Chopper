/**
 * common.
 * User: raytin
 * Date: 13-4-5
 */
var userProxy = require('../proxy').User,
    EventProxy = require('eventproxy');

exports.getSidebarNeed = function(res, next, callback){
    var ep = new EventProxy();
    ep.all('userList', 'current_user', 'userListByCount', function(userList, current_user, userListByCount){
        if(!current_user){
            current_user = null;
        }else{
            current_user.sign = current_user.sign != '' ? current_user.sign : '这家伙很懒，还没有签名';
        };

        callback({
            users: userList,
            userInfo: current_user,
            usersByCount: userListByCount
        });
    });
    ep.fail(next);

    // 最新加入
    userProxy.getUserList('name nickName', ep.done('userList'));

    // 用户信息
    userProxy.getUserInfoByName(res.locals.current_user, 'name nickName follower followed topic_count sign lastLogin_time', ep.done('current_user'));

    // 吐槽之星
    userProxy.getUserListBy({}, 'name nickName topic_count', {limit: 10, sort: [['topic_count', 'desc']]}, ep.done('userListByCount'))
};