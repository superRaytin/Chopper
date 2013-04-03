/**
 * controller - index.
 * User: raytin
 * Date: 13-3-27
 * Time: 上午10:56
 */
var proxy = require("../proxy"),
    userProxy = proxy.User,
    topicProxy = proxy.Topic,
    config = require('../config').config,
    EventProxy = require("eventproxy");

exports.index = function(req, res, next){
    //console.log(req.user); //无效
    //console.log(req.params);
    //console.log(req.body);
    //var ab = 8;
    //req.flash('info', 'you have %s items in yours', ab);
    //req.session.info = 'ubssss';
    //req.session.handa = 'dddyyy';
    //var info = req.flash( 'info');
    //console.log(info);
    //req.session.handa = null;
    console.log(req.session);
    /*var user = null;
    if(req.session && req.session.user ){
        user = req.session.user;
    }*/
    //console.log(res.locals);
    //res.locals.user = user;
    /*res.locals.testfun = function(str){
        return '['+str+']';
    };*/
    var ep = new EventProxy();
    ep.all('userList', 'topicList', 'current_user', 'userListByCount', function(userList, topicList, current_user, userListByCount){
        if(!current_user){
            current_user = null;
        }else{
            //current_user.nickName && ( current_user.name = current_user.nickName );
            current_user.sign = current_user.sign != '-' ? current_user.sign : '这家伙很懒，还没有签名';
        };

        /*var user_nickName = {}, curTopic;
        for(var i = 0, len = topics.length; i < len; i++){
            curTopic = topics[i];

        };*/

        console.log(current_user);
        res.render('index',
            {
                title: config.name,
                config: config,
                users: userList,
                topics: topicList,
                userInfo: current_user,
                usersByCount: userListByCount
            }
        );
    });
    ep.fail(next);
    userProxy.getUserList('name', ep.done('userList'));
    topicProxy.getTopicList(ep.done('topicList'));
    userProxy.getUserInfoByName(res.locals.current_user, 'name nickName follower followed topic_count sign lastLogin_time', ep.done('current_user'));
    userProxy.getUserListBy({}, 'name topic_count', {limit: 10, sort: [['topic_count', 'desc']]}, ep.done('userListByCount'))

};

// 以下代码仅为测试之用
exports.test = function(req, res, next){
    res.render('test', {
        title: 'test'
    });
};

exports.ajaxTest = function(req, res, next){
    userProxy.getUserList(function(err, users){
        if(err) return next(err);
        //console.log(JSON.stringify(users));
        if(users && users.length){
            res.json(users)
        }
    });
};