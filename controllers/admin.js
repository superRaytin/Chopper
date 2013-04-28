/**
 * controller - admin.
 * User: raytin
 * Date: 13-4-28
 */
var proxy = require("../proxy"),
    common = proxy.common,
    userProxy = proxy.User,
    topicProxy = proxy.Topic,
    categoryProxy = proxy.Category,
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
    var ep = new EventProxy(),
        page = parseInt(req.query.page) || 1,
        limit = config.limit,
        opt = {skip: (page - 1) * limit, limit: limit, sort: [['_id', 'desc']]};

    ep.all('topicList', 'totalCount', 'totalTopicNum', function(topicList, totalCount, totalTopicNum){
        var pagination = util.pagination(page, totalCount);
        res.render('admin/index', {
            title: '后台管理 - '+ config.name,
            config: config,
            topics: topicList,
            pagination: pagination,
            total: totalTopicNum,
            layout: null
        });
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
        arr.forEach(function(cur){
            userProxy.getOneUserInfo({_id : cur.author_id}, 'name nickName head', ep.done(function(user){
                var nickName = user.nickName, time = cur.create_time;

                cur.author_nickName = nickName ? nickName : user.name;
                cur.head = user.head ? user.head : config.nopic;
                cur.create_time = new Date(time).format('MM月dd日 hh:mm');

                ep.emit('toAll');
            }));
        });
    }));

    // 取得总页数
    topicProxy.getTopicCount(ep.done(function(totalCount){
        ep.emit('totalCount', Math.ceil(totalCount / limit));
        ep.emit('totalTopicNum', totalCount);
    }));
};

// 删除吐槽
exports.delTopic = function(req, res, next){
    if( !util.checkUserStatusAsync(res, '先登录啊亲') ) return;

    var current_user = res.locals.current_user,
        topicid = req.body.topicid,
        ep = new EventProxy();

    if( current_user !== 'admin' || !topicid ){
        res.json({
            success: false,
            data: '出错'
        });
        return
    };

    ep.on('final', function(){
        res.json({
            success: true,
            data: 'ok'
        });
    }).fail(next);

    // 同步更新分类
    ep.on('updateCate', function(topic){
        categoryProxy.getCategoryById(topic.category, ep.done(function(category){
            category.count--;
            category.topics.remove(topic._id);
            category.save(ep.done(function(){
                ep.emit('final');
            }));
        }));
    });

    // 同步更新用户吐槽数
    ep.on('updateUser', function(topic){
        userProxy.getOneUserInfo({_id: topic.author_id}, 'topic_count', ep.done(function(user){
            user.topic_count--;
            user.save(ep.done(function(){
                if(topic.category){
                    ep.emit('updateCate', topic);
                }else{
                    ep.emit('final');
                }
            }));
        }));
    });

    topicProxy.delTopicById(topicid, ep.done(function(topic){
        ep.emit('updateUser', topic);
    }));
};