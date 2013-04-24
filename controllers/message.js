/**
 * controller - message.
 * User: raytin
 * Date: 13-4-17
 */
var proxy = require('../proxy'),
    common = proxy.common,
    userProxy = proxy.User,
    config = require('../config').config,
    EventProxy = require('eventproxy'),
    util = require('../util');

// 消息中心
function page(req, res, next){
    if( !util.checkUserStatusAsync(res, '先登录啊亲 (╯_╰)') ) return;

    var current_user = res.locals.current_user,
        ep = new EventProxy();

    ep.all('sidebar', 'topbar', 'message', function(sidebar, topbar, current_user){
        var message = current_user.message;

        if(!message || !message.length){
            message = null;
        };

        res.render('user/message', {
            title: '消息中心 | ' + config.name,
            config: config,
            topInfo: topbar.topInfo,
            users: sidebar.users,
            userInfo: sidebar.userInfo,
            usersByCount: sidebar.usersByCount,
            message: message
        });


    }).fail(next);

    // 获取右侧资源
    common.getSidebarNeed(res, next, {fields: 'name nickName head fans followed gold topic_count sign lastLogin_time'}, function(need){
        ep.emit('sidebar', need);
    });

    // 获取顶部资源
    common.getTopbarNeed(res, next, function(need){
        ep.emit('topbar', need);
    });

    // 获取消息
    userProxy.getUserInfoByName(current_user, 'message newMessage', ep.done(function(user){
        var message = user.message, clone = JSON.parse(JSON.stringify(user));

        // 加上用户已读标记
        user.newMessage = 0;
        message.forEach(function(item){
            item.readed = true;
        });
        user.markModified('message');

        // 超过20条消息则删除旧的10条
        if(message.length > 20){
            message.splice(0, 10);
        };

        user.save(ep.done(function(){
            ep.emit('message', clone );
        }));
    }));
};

// 清空消息中心
function message_empty(req, res, next){
    if( !util.checkUserStatusAsync(res, '先登录啊亲 (╯_╰)') ) return;

    var current_user = res.locals.current_user,
        ep = new EventProxy();

    ep.fail(next);

    userProxy.getUserInfoByName(current_user, 'message', ep.done(function(user){
        user.message = [];
        user.save(ep.done(function(){
            res.json({
                success: true
            });
        }));
    }));
};

module.exports = {
    page: page,
    message_empty: message_empty
}