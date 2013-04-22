/**
 * controller - topic.
 * User: raytin
 * Date: 13-3-28
 */
var proxy = require('../proxy'),
    common = proxy.common,
    util = require('../util'),
    topicModel = require('../models').Topic,
    topicProxy = proxy.Topic,
    userProxy = proxy.User,
    config = require('../config').config,
    EventProxy = require("eventproxy");

// 发表话题（异步）
function newTopic(req, res, next){
    if( !util.checkUserStatusAsync(res, '先登录啊亲 (╯_╰)') ) return;

    //var session = req.session;
    var currentUser = res.locals.current_user,
        content = req.body['content'],
        desc;

    if(content == ''){
        desc = '话题内容不能为空。';
        res.json({
            success: false,
            data: desc
        })
        return;
    };

    var ep = new EventProxy(),
        newTopic = new topicModel();

    newTopic.content = content;
    newTopic.author_name = currentUser;
    newTopic.create_time = new Date().format('yyyy/MM/dd hh:mm:ss');

    ep.all('getUserId', function(user){
        newTopic.create_time = new Date(newTopic.create_time).format('MM月dd日 hh:mm');
        user.topic_count += 1;
        user.save();
        res.json({
            success: true,
            data: {
                topic: newTopic,
                user: user
            }
        });
    }).fail(next);

    userProxy.getOneUserInfo({name: currentUser}, '_id name nickName head topic_count', ep.done(function(user){
        newTopic.author_id = user._id;
        newTopic.save(ep.done(function(){
            ep.emit('getUserId', user);
        }));
    }));
}

// 我的吐槽
function myTopic(req, res, next){
    if( !util.checkUserStatus(res, '先登录啊亲 (╯_╰)') ) return;

    var current_user = res.locals.current_user,
        ep = new EventProxy(),
        page = parseInt(req.query.page) || 1,
        limit = config.limit,
        opt = {skip: (page - 1) * limit, limit: limit, sort: [['_id', 'desc']]};

    ep.all('topicList', 'sidebar', 'topbar', 'totalCount', function(topicList, sidebar, topbar, totalCount){
        var pagination = util.pagination(page, totalCount);
        res.render('user/myTopic', {
            title: config.name,
            config: config,
            topics: topicList,
            topInfo: topbar.topInfo,
            users: sidebar.users,
            userInfo: sidebar.userInfo,
            usersByCount: sidebar.usersByCount,
            pagination: pagination
        });
    }).fail(next);

    // 取得用户吐槽列表
    topicProxy.getTopicList({author_name: current_user}, opt, ep.done(function(topicList){
        // 获取当前主题的作者昵称与头像
        ep.after('toAll', topicList.length, function(){
            ep.emit('topicList', topicList);
        });

        topicList.forEach(function(cur){
            userProxy.getOneUserInfo({_id : cur.author_id}, 'name nickName head', ep.done(function(user){
                var nickName = user.nickName, time = cur.create_time;

                cur.author_nickName = nickName ? nickName : user.name;
                cur.head = user.head ? user.head : config.nopic;
                cur.create_time = new Date(time).format('MM月dd日 hh:mm');

                ep.emit('toAll');
            }));
        });
    }));

    // 获取右侧资源
    common.getSidebarNeed(res, next, {fields: 'name nickName head fans followed topic_count sign lastLogin_time'}, function(need){
        ep.emit('sidebar', need);
    });

    // 获取顶部资源
    common.getTopbarNeed(res, next, function(need){
        ep.emit('topbar', need);
    });

    // 取得总页数
    topicProxy.getTopicCount({author_name: current_user}, ep.done(function(totalCount){
        ep.emit('totalCount', Math.ceil(totalCount / limit));
    }));
};

// 获取评论
function getComments(req, res, next){
    var topicid = req.body.topicid;

    var ep = new EventProxy();

    ep.fail(next);

    topicProxy.getOneTopicById(topicid, 'replys', ep.done(function(list){
        if(list.replys){
            res.json({
                success: true,
                data: list.replys
            });
        }else{
            res.json({
                success: false,
                data: '获取错误。'
            });
        }
    }));
};

// 发布评论
function newComment(req, res, next){
    if( !util.checkUserStatusAsync(res, '先登录啊亲 (╯_╰)') ) return;

    var topicid = req.body.topicid,
        content = req.body.content,
        current_user = res.locals.current_user;

    var ep = new EventProxy();
    ep.fail(next);

    var newTopic = new topicModel({
            author_name: current_user,
            replyTo: topicid,
            content: content,
            create_time: new Date().format('yyyy/MM/dd hh:mm:ss')
        });

    ep.all('getUser', 'saveTopic', function(user, topic){
        console.log(999);
        var params = {
            head: user.head ? user.head : config.nopic,
            author_name: current_user,
            author_nickName: user.nickName ? user.nickName : user.name,
            content: content
        };
        topic.replys.push(params);
        topic.replyCount += 1;
        topic.markModified('replys');
        topic.save(ep.done(function(){
            res.json({
                success: true,
                data: params
            });
        }));

    });

    ep.after('getTopic', 1, function(reply){
        // 更新吐槽信息
        topicProxy.getOneTopicById(topicid, '', ep.done(function(topic){
            //topic.replys.push(reply[0]._id);
            /*topic.replys.push({
                a
            });
            console.log(222);
            console.log(topic);
            console.log(topic.replys);
            topic.replyCount += 1;
            topic.markModified('replys');
            topic.save(ep.done(function(topic){
                console.log(111111);
                console.log(topic);
                ep.emit('saveTopic', topic);
            }));*/
            ep.emit('saveTopic', topic);
        }));
    });

    // 更新用户信息与评论
    userProxy.getOneUserInfo({name: current_user}, '_id name nickName head topic_count', ep.done(function(user){
        newTopic.author_id = user._id;
        ep.emit('getUser', user);
        newTopic.save(ep.done(function(reply){
            console.log(reply);
            // 更新用户吐槽数
            user.topic_count += 1;
            user.save(function(err){
                if(err) return err;
                console.log(4444);
                ep.emit('getTopic', reply);
            });
        }));
    }));
};

/* 话题广场首页
function index(req, res, next){
    // 查询话题信息
    topicProxy.getTopicList(function(err, topics){
        if(err) return next(err);
        if(topics && topics.length != 0){
            console.log(topics);
            res.render('topic/index', {
                title: '话题广场',
                topics: topics
            });
        }
        // 无话题
        else{
            res.render('topic/index', {
                title: '话题广场',
                topics: null
            });
        };
    });
};

// 发表话题
function addTopic(req, res, next){
    //var session = req.session;
    var currentUser = res.locals.current_user,
        content = req.body['content'],
        desc;

    if(!currentUser || content == ''){
        desc = !currentUser ? '请先登录，才能发表话题。' : '话题内容不能为空。';
        res.render('notice/normal', {
            title: '出错了',
            desc: desc,
            layout: null
        })
        return;
    };

    var ep = new EventProxy(),
        newTopic = new topicModel();

    newTopic.content = content;
    newTopic.author_name = currentUser;
    newTopic.create_time = new Date().format('yyyy/MM/dd hh:mm:ss');

    ep.all('getUserId', function(user){
        user.topic_count += 1;
        user.save();
        res.redirect('/');
    }).fail(next);

    userProxy.getOneUserInfo({name: currentUser}, '_id topic_count', ep.done(function(user){
        newTopic.author_id = user._id;
        newTopic.save();
        ep.emit('getUserId', user);
    }));
};*/

module.exports = {
    //addTopic: addTopic,
    //index: index,
    myTopic: myTopic,
    newTopic: newTopic,
    getComments: getComments,
    newComment: newComment
};