/**
 * controller - category.
 * User: raytin
 * Date: 13-3-28
 */
var proxy = require('../proxy'),
    common = proxy.common,
    util = require('../util'),
    topicProxy = proxy.Topic,
    categoryProxy = proxy.Category,
    userProxy = proxy.User,
    config = require('../config').config,
    EventProxy = require("eventproxy");

function index(req, res, next){
    var cateid = req.params.cateid;

    var ep = new EventProxy(),
        page = parseInt(req.query.page) || 1,
        limit = config.limit,
        opt = {skip: (page - 1) * limit, limit: limit, sort: [['_id', 'desc']]};

    ep.all('topicList', 'cate', 'sidebar', 'topbar', 'totalCount', function(topicList, cate, sidebar, topbar, totalCount){
        var pagination = util.pagination(page, totalCount);
        res.render('topic/category', {
            title: config.name,
            config: config,
            topics: topicList,
            topInfo: topbar.topInfo,
            users: sidebar.users,
            userInfo: sidebar.userInfo,
            usersByCount: sidebar.usersByCount,
            pagination: pagination,
            cate: cate
        });
    }).fail(next);

    // 当前为评论时，获取吐槽主体用户信息
    ep.on('getReplyTopicInfo', function(topic, cur, emitName){
        userProxy.getOneUserInfo({_id: topic.author_id}, 'name nickName head', function(err, replyToUser){
            var nickName = replyToUser.nickName, time = topic.create_time;

            topic.author_nickName = nickName ? nickName : replyToUser.name;
            topic.head = replyToUser.head ? replyToUser.head : config.nopic;
            topic.create_time = new Date(time).format('MM月dd日 hh:mm');

            cur.replyTopic = topic;
            ep.emit(emitName);
        });
    });

    // 取得每个吐槽的用户信息
    ep.on('getEveryTopicInfo', function(cur){
        userProxy.getOneUserInfo({_id : cur.author_id}, 'name nickName head', ep.done(function(user){
            var nickName = user.nickName, time = cur.create_time;

            cur.author_nickName = nickName ? nickName : user.name;
            cur.head = user.head ? user.head : config.nopic;
            cur.create_time = new Date(time).format('MM月dd日 hh:mm');

            if(cur.replyTo){
                topicProxy.getOneTopicById(cur.replyTo, '', function(err, topic){
                    if(err) return next(err);
                    ep.emit('getReplyTopicInfo', topic, cur, 'toAll');
                });
            }else{
                ep.emit('toAll');
            };
        }));
    });

    categoryProxy.getCategoryById(cateid, opt, ep.done(function(category){
        console.log(category);
        // 分类存在, 取得分类下所有话题
        if(category){
            topicProxy.getTopicList({_id: {$in: category.topics}}, {}, ep.done(function(topicList){
                // 获取当前主题的作者昵称与头像
                ep.after('toAll', topicList.length, function(){
                    ep.emit('topicList', topicList);
                    ep.emit('cate', category);
                });

                topicList.forEach(function(cur){
                    ep.emit('getEveryTopicInfo', cur);
                });
            }));

            // 取得总页数
            ep.emit('totalCount', Math.ceil(category.count / limit));
        }else{
            res.render('notice/normal', {
                title: '话题不存在',
                desc: cateid + ' 介个话题不存在啊亲 (╯_╰)',
                layout: null
            });
        }
    }));

    // 获取右侧资源
    common.getSidebarNeed(res, next, {fields: 'name nickName head fans followed gold topic_count sign lastLogin_time'}, function(need){
        ep.emit('sidebar', need);
    });

    // 获取顶部资源
    common.getTopbarNeed(res, next, function(need){
        ep.emit('topbar', need);
    });


};

module.exports = {
    index: index
};