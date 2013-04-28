/**
 * controller - admin.
 * User: raytin
 * Date: 13-4-28
 */
var proxy = require("../proxy"),
    common = proxy.common,
    userProxy = proxy.User,
    topicProxy = proxy.Topic,
    config = require('../config').config,
    EventProxy = require("eventproxy"),
    util = require('../util');

exports.index = function(req, res, next){
    if( !util.checkUserStatus(res, '先登录啊亲') ) return;

    var current_user = res.locals.current_user;

    if( current_user !== 'admin' ){
        res.render('notice/normal', {
            title: '无权限',
            desc: '无权限',
            layout: null
        });
        return
    };

    res.render('admin/index', {
        title: config.name,
        config: config,
        layout: null
    });
};