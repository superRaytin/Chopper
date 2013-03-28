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
    userProxy = proxy.User;

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
        content = req.body['content'];

    if(!currentUser || content == '') return;

    var newTopic = new topicModel();

    newTopic.content = content;
    newTopic.author_name = currentUser;
    newTopic.create_time = util.formatDate(new Date());
    userProxy.getUserIdByName(currentUser, function(err, user){
        if(err) return next(err);
        newTopic.author_id = user._id;
        newTopic.save(function(err){
            if(err) return next(err);
            console.log('INFO: 话题保存成功');

            // 更新用户话题数 topic_count
            //userModel.update({_id: user._id}, {topic_count: });

            res.redirect('/topic');
        });
    });

};