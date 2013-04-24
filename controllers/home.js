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
    EventProxy = require("eventproxy"),
    util = require('../util');

//var fs = require('fs');
//var crypto = require('crypto');

exports.index = function(req, res, next){
    /*
    //console.log(req.params);
    //req.session.info = 'ubssss';
    //req.session.handa = 'dddyyy';
    //req.session.handa = null;
    fs.readdir('./public/csss', function(err, files){
        if(err) return console.log(999999999999999);
        console.log(files);
    });
    var user = null;
    if(req.session && req.session.user ){
        user = req.session.user;
    }
    console.log(res.locals);
    res.locals.user = user;
    res.locals.testfun = function(str){
        return '['+str+']';
    };
     console.log(req.query);

    var cipher = crypto.createCipher('aes-256-cbc', config.key);
    var cryptoed = cipher.update('xiao1989jie0106abcdefg', 'binary', 'hex');
    var encrypted = cryptoed + cipher.final('hex');
    var decipher = crypto.createDecipher('aes-256-cbc', config.key);
    var deciphered = decipher.update(encrypted, 'hex', 'utf8');
    console.log( deciphered + decipher.final('utf8') )
     */
    console.log(req.session);

    var ep = new EventProxy(),
        page = parseInt(req.query.page) || 1,
        limit = config.limit,
        opt = {skip: (page - 1) * limit, limit: limit, sort: [['_id', 'desc']]};

    ep.all( 'topicList', 'sidebar', 'topbar', 'totalCount', function(topicList, sidebar, topbar, totalCount){
        var pagination = util.pagination(page, totalCount);
        res.render('index',
            {
                title: config.name,
                config: config,
                topics: topicList,
                topInfo: topbar.topInfo,
                users: sidebar.users,
                userInfo: sidebar.userInfo,
                usersByCount: sidebar.usersByCount,
                pagination: pagination
            }
        );
    });
    ep.fail(next);

    topicProxy.getMainTopic('', opt, ep.done(function(topicList){
        var topicLen = topicList.length, arr = [];
        for(var i = 0; i < topicLen; i++){
            if(!topicList[i].replyTo){
                arr.push(topicList[i]);
            }
        };

        // 如果用户设置了昵称，则优先显示昵称
        // 将昵称与头像附加到主题对象
        ep.after('toAll', arr.length, function(){
            ep.emit('topicList', arr);
        });

        // 获取当前主题的作者昵称与头像
        arr.forEach(function(cur, i){
            //if(!cur.replyTo){
                userProxy.getOneUserInfo({_id : cur.author_id}, 'name nickName head', ep.done(function(user){
                    var nickName = user.nickName, time = cur.create_time;

                    cur.author_nickName = nickName ? nickName : user.name;
                    cur.head = user.head ? user.head : config.nopic;
                    cur.create_time = new Date(time).format('MM月dd日 hh:mm');

                    ep.emit('toAll');
                }));
            //}
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
    topicProxy.getTopicCount(ep.done(function(totalCount){
        ep.emit('totalCount', Math.ceil(totalCount / limit));
    }));
};

// 以下代码仅为测试之用
exports.test = function(req, res, next){
    res.render('test', {
        title: 'test'
    });
};