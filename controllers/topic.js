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

    // 取得用户吐槽列表
    topicProxy.getTopicList({author_name: current_user}, opt, ep.done(function(topicList){
        // 获取当前主题的作者昵称与头像
        ep.after('toAll', topicList.length, function(){
            ep.emit('topicList', topicList);
        });

        topicList.forEach(function(cur){
            ep.emit('getEveryTopicInfo', cur);
        });
    }));

    // 获取右侧资源
    common.getSidebarNeed(res, next, {fields: 'name nickName head fans followed gold topic_count sign lastLogin_time'}, function(need){
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

    topicProxy.getOneTopicById(topicid, 'replys', {limit: 10}, ep.done(function(list){
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
        topicuser = req.body.topicuser,
        topicCon = req.body.topicCon,
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

    ep.all('getUser', 'saveTopic', 'msgPushed', function(user, topic){
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
            ep.emit('saveTopic', topic);
        }));
    });

    // 更新用户信息与评论 || 推送消息
    //userProxy.getOneUserInfo({name: current_user}, '_id name nickName head topic_count', ep.done(function(user){
    userProxy.getUserListBy({name: {$in: [topicuser, current_user]}}, '_id name nickName head topic_count message newMessage', ep.done(function(user){
        var curUser = user[0],
            tarUser = user[1];

        // 检查校正返回用户顺序
        if(curUser.name != current_user){
            curUser = user[1];
            tarUser = user[0];
        }

        // 向目标用户推送消息
        var msgBody = {
            msgType: 'comment',
            topic: topicCon,
            time: new Date().format('MM月dd日 hh:mm'),
            name: current_user,
            nickName: curUser.nickName ? curUser.nickName : current_user,
            readed: false
        };
        util.pushMessage(tarUser, msgBody, function(){
            ep.emit('msgPushed');
        });

        // 保存评论
        newTopic.author_id = curUser._id;
        ep.emit('getUser', curUser);
        newTopic.save(ep.done(function(reply){
            console.log(reply);
            // 更新用户吐槽数
            curUser.topic_count += 1;
            curUser.save(function(err){
                if(err) return err;
                ep.emit('getTopic', reply);
            });
        }));
    }));
};

// 赞 & 踩
function supportdown(req, res, next){
    if( !util.checkUserStatusAsync(res, '先登录啊亲 (╯_╰)') ) return;

    var type = req.body.type,
        zan = type === 'support',
        topicid = req.body.topicid,
        topicuser = req.body.topicuser,
        topicCon = req.body.topicCon,
        current_user = res.locals.current_user,
        ep = new EventProxy();

    ep.on('wrong', function(msg){
        res.json({
            success: false,
            data: msg
        });
    }).fail(next);

    // 不能对自己发表的主题操作
    if(topicuser === current_user){
        var msg = zan ? '喂，节操掉了 (╯_╰)' : '你这是要自踩么亲，算你狠...';
        ep.emit('wrong', msg);
        return;
    }

    ep.all('topicsave', 'msgPushed', function(topic){
        res.json({
            success: true,
            data: topic[type]
        });
    });

    // 更新赞&踩数据
    topicProxy.getOneTopicById(topicid, 'support down supporter downer', ep.done(function(topic){
        topic[type]++;
        var arr = topic[type+'er'];

        if(arr){
            // 检查当前用户是否已操作过
            if(arr.contains(current_user)){
                ep.emit('wrong', zan ? '赞了又赞，会怀孕的 (╯_╰)' : '出来混，总是要还的 →_→');
                return;
            }
            arr.push(current_user);
        }else{
            topic[type+'er'] = [current_user];
        }

        topic.save(ep.done(function(topic){
            ep.emit('topicsave', topic);
            ep.emit('goPush');
        }));
    }));

    // 推送消息
    ep.on('goPush', function(){
        userProxy.getUserListBy({name: {$in: [topicuser, current_user]}}, 'name nickName message newMessage', ep.done(function(user){
            var curUser = user[0],
                tarUser = user[1];

            // 检查校正返回用户顺序
            if(curUser.name != current_user){
                curUser = user[1];
                tarUser = user[0];
            }

            // 向目标用户推送消息
            var msgBody = {
                msgType: type,
                topic: topicCon,
                time: new Date().format('MM月dd日 hh:mm'),
                name: current_user,
                nickName: curUser.nickName ? curUser.nickName : current_user,
                readed: false
            };
            util.pushMessage(tarUser, msgBody, function(){
                ep.emit('msgPushed');
            });
        }));
    });
};

module.exports = {
    myTopic: myTopic,
    newTopic: newTopic,
    getComments: getComments,
    newComment: newComment,
    supportdown: supportdown
};