/**
 * controller - topic.
 * User: raytin
 * Date: 13-3-28
 */
var proxy = require('../proxy'),
    util = require('../util'),
    topicModel = require('../models').Topic,
    userModel = require('../models').User,
    topicProxy = proxy.Topic,
    userProxy = proxy.User,
    EventProxy = require("eventproxy");

// 话题广场首页
exports.index = function(req, res, next){
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
exports.addTopic = function(req, res, next){
    //var session = req.session;
    var currentUser = res.locals.current_user,
        content = req.body['content'],
        desc;

    if(!currentUser || content == ''){
        desc = !currentUser ? '请先登录，才能发表话题。' : '话题内容不能为空。';
        res.render('notice/normal', {
            title: '出错了',
            desc: desc
        })
        return;
    };

    var ep = new EventProxy(),
        newTopic = new topicModel();

    newTopic.content = content;
    newTopic.author_name = currentUser;
    newTopic.create_time = util.formatDate(new Date());

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
};