/**
 * common.
 * User: raytin
 * Date: 13-4-5
 */
var userProxy = require('../proxy').User,
    EventProxy = require('eventproxy');

// 获取右侧资源
exports.getSidebarNeed = function(res, next, settings, callback){
    var ep = new EventProxy(),
        target_user = settings.current_user ? settings.current_user : res.locals.current_user;

    ep.all('userList', 'current_user', 'userListByCount', function(userList, current_user, userListByCount){
        if(current_user){
            current_user.sign = current_user.sign && current_user.sign != '' ? current_user.sign : '这家伙很懒，还没有签名';
        };

        callback({
            users: userList,
            userInfo: current_user,
            usersByCount: userListByCount
        });
    }).fail(next);

    // 用户信息
    if(target_user){
        userProxy.getUserInfoByName(target_user, settings.fields, ep.done(function(info){
            userProxy.getUserListBy({name: {$in: info.followed}}, 'name nickName head', {limit: 20, sort: [['topic_count', 'desc']]}, ep.done(function(followedInfo){
                info.followedInfo = followedInfo;
                ep.emit('current_user', info);
            }));
        }));
    }else{
        ep.emit('current_user', null);
    }

    // 吐槽之星
    userProxy.getUserListBy({}, 'name nickName head topic_count', {limit: 8, sort: [['topic_count', 'desc']]}, ep.done('userListByCount'));

    // 最新加入
    userProxy.getUserList('name nickName head', ep.done('userList'));
};

// 获取顶部资源
exports.getTopbarNeed = function(res, next, callback){
    if(!res.locals.current_user){
        return callback({topInfo: null});
    };

    var ep = new EventProxy();

    ep.all('current_user', function(current_user){
        var msg = current_user.newMessage,
            nickName = current_user.nickName;
        current_user.msgCount = msg ? msg : 0;
        current_user.nickName = nickName ? nickName : current_user.name;
        callback({
            topInfo: current_user
        });
    }).fail(next);

    userProxy.getUserInfoByName(res.locals.current_user, 'name nickName lastLogin_time message newMessage', ep.done('current_user'));
};