/**
 * controller - home.
 * User: raytin
 * Date: 13-3-27
 * Time: 上午10:56
 */
var proxy = require("../proxy"),
    common = proxy.common,
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
    //ep.all('userList', 'topicList', 'current_user', 'userListByCount', function(userList, topicList, current_user, userListByCount){
    ep.all( 'topicList', 'sidebar', function(topicList, sidebar){
        res.render('index',
            {
                title: config.name,
                config: config,
                topics: topicList,
                users: sidebar.users,
                userInfo: sidebar.userInfo,
                usersByCount: sidebar.usersByCount
            }
        );
    });
    ep.fail(next);

    topicProxy.getTopicList(ep.done(function(topicList){
        var topicLen = topicList.length, hash = {};

        // 如果用户设置了昵称，则优先显示昵称
        ep.after('toAll', topicLen, function(){
            topicList.forEach(function(cur, i){
                hash[cur.author_id] && ( cur.author_name = hash[cur.author_id] );
            });
            ep.emit('topicList', topicList);
        });

        topicList.forEach(function(cur, i){
            userProxy.getNickNameById(cur.author_id, ep.done(function(user){
                hash[user._id] = user.nickName;
                ep.emit('toAll');
            }));
        });
    }));

    // 获取右侧资源
    common.getSidebarNeed(res, next, function(need){
        ep.emit('sidebar', need);
    });

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