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
    replyProxy = proxy.Reply,
    config = require('../config').config,
    EventProxy = require("eventproxy"),
    util = require('../util');

var hash = {};

// 管理首页（默认是吐槽管理）
function index(req, res, next){
    console.log(hash);
    console.log(333);
    if( !util.checkAdmin(res, '无权限') ) return;

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
            layout: 'admin/admin_layout'
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

// 评论管理
function replyManage(req, res, next){
    if( !util.checkAdmin(res, '无权限') ) return;
    console.log(hash);
    console.log(444);
    var ep = new EventProxy(),
        page = parseInt(req.query.page) || 1,
        limit = config.limit,
        opt = {skip: (page - 1) * limit, limit: limit};

    ep.all('replyList', 'totalCount', 'totalNum', function(replyList, totalCount, totalNum){
        var pagination = util.pagination(page, totalCount);
        res.render('admin/replyManage', {
            title: '后台管理 - '+ config.name,
            config: config,
            replys: replyList,
            pagination: pagination,
            total: totalNum,
            layout: 'admin/admin_layout'
        });
    });
    ep.fail(next);

    replyProxy.getAllReplys(opt, ep.done(function(list){
        var len = list.length;

        // 如果用户设置了昵称，则优先显示昵称
        ep.after('toAll', len, function(){
            ep.emit('replyList', list);
        });

        ep.on('getTopic', function(reply, topicid, emitName){
            topicProxy.getOneTopicById(topicid, 'content', ep.done(function(topic){
                if(topic){
                    reply.topic = topic.content;
                }else{
                    console.log(topicid + ' 此吐槽已不存在');
                }
                ep.emit(emitName);
            }));
        });

        // 获取当前主题的作者昵称与头像
        list.forEach(function(cur){
            userProxy.getOneUserInfo({_id : cur.author_id}, 'name nickName', ep.done(function(user){
                var nickName = user.nickName, time = cur.create_time;

                cur.author_nickName = nickName ? nickName : user.name;
                //cur.head = user.head ? user.head : config.nopic;
                cur.create_time = new Date(time).format('MM月dd日 hh:mm');

                //ep.emit('toAll');
                ep.emit('getTopic', cur, cur.topic_id, 'toAll');
            }));
        });
    }));

    // 取得总页数
    replyProxy.getCount(ep.done(function(totalCount){
        ep.emit('totalCount', Math.ceil(totalCount / limit));
        ep.emit('totalNum', totalCount);
    }));
};

// 删除评论
function delReply(req, res, next){
    var replyid = req.body.id;
    if( !util.checkAdminAsyc(res, '无权限') || !replyid ) return;

    _delReplyById(replyid, function(){
        res.json({
            success: true
        });
    });
};

// 删除吐槽
function delTopic(req, res, next){
    var topicid = req.body.id;
    if( !util.checkAdminAsyc(res, '无权限') || !topicid ) return;

    var ep = new EventProxy();

    ep.on('final', function(){
        res.json({
            success: true,
            data: 'ok'
        });
    }).fail(next);

    topicProxy.delTopicById(topicid, ep.done(function(topic){
        _withDelTopic(topic, function(){
            ep.emit('final');
        });
    }));
};

// 删除评论
function _delReplyById(id, callback, fromDelTopic){
    var ep = new EventProxy();
    ep.fail(function(err){
        if(err){
            console.log(err);
            return;
        }
    });

    // 更新吐槽评论数
    ep.on('updateTopic', function(topicid){
        topicProxy.getOneTopicById(topicid, 'replyCount', ep.done(function(topic){
            topic.replyCount--;
            topic.save(ep.done(function(){
                callback();
            }));
        }));
    });

    replyProxy.delReplyById(id, ep.done(function(curReply){
        userProxy.getOneUserInfo({_id: curReply.author_id}, 'name reply_count', ep.done(function(user){
            var reply_count = user.reply_count,
                hashCount = hash[user.name + 'reply_count'];

            user.reply_count = (hashCount ? hashCount : reply_count) - 1;

            // 防止时间差导致数据更新不准确
            hash[user.name + 'reply_count'] = user.reply_count;

            user.save(ep.done(function(){
                // 直接删除吐槽时 不必再更新评论数了
                if(fromDelTopic){
                    callback();
                }else{
                    ep.emit('updateTopic', curReply.topic_id);
                }
            }));
        }));
    }));
};
function _withDelTopic(topic, callback, fromCate){
    var ep = new EventProxy();
    ep.fail(function(err){
        if(err){
            console.log(err);
            return;
        }
    });

    function delComment(topic){
        replyProxy.getReplysByTopicId(topic._id, ep.done(function(replys){
            var num = replys.length;

            // 更新各评论用户的评论数
            replys.forEach(function(reply){
                _delReplyById(reply._id, function(){
                    num--;
                    if(num == 0){
                        callback();
                    }
                }, true);
            });
        }));
    };

    // 同步更新话题
    function updateCate(topic){
        categoryProxy.getCategoryById(topic.category, ep.done(function(category){
            category.count--;
            category.topics.remove(topic._id);
            category.save(ep.done(function(){
                if(topic.replyCount && topic.replyCount > 0){
                    delComment(topic);
                }
                else{
                    callback();
                }
            }));
        }));
    };

    // 同步更新用户吐槽数
    userProxy.getOneUserInfo({_id: topic.author_id}, 'name topic_count', ep.done(function(user){
        var topic_count = user.topic_count,
            hashCount = hash[user.name + 'topic_count1'];

        user.topic_count = (hashCount ? hashCount : topic_count) - 1;
        // 防止时间差导致数据更新不准确
        hash[user.name + 'topic_count1'] = user.topic_count;

        user.save(ep.done(function(){
            if(topic.category && !fromCate){ // 删除话题时不用再更新主题
                updateCate(topic);
            }
            else if(topic.replyCount && topic.replyCount > 0){
                delComment(topic);
            }
            else{
                callback();
            }
        }));
    }));
}

// 分类管理
function categoryManage(req, res, next){
    if( !util.checkAdmin(res, '无权限') ) return;

    var ep = new EventProxy(),
        page = parseInt(req.query.page) || 1,
        limit = config.limit,
        opt = {skip: (page - 1) * limit, limit: limit, sort: [['_id', 'desc']]};

    ep.all('list', 'totalCount', 'totalNum', function(list, totalCount, totalNum){
        var pagination = util.pagination(page, totalCount);
        res.render('admin/categoryManage', {
            title: '话题管理 - '+ config.name,
            config: config,
            categories: list,
            pagination: pagination,
            total: totalNum,
            layout: 'admin/admin_layout'
        });
    });
    ep.fail(next);

    categoryProxy.getCategoryList({}, opt, ep.done('list'));

    // 取得总页数
    categoryProxy.getCount(ep.done(function(totalCount){
        ep.emit('totalCount', Math.ceil(totalCount / limit));
        ep.emit('totalNum', totalCount);
    }));
}

// 删除话题
function delCategory(req, res, next){
    var categoryid = req.body.id;
    if( !util.checkAdminAsyc(res, '无权限') || !categoryid ) return;

    var ep = new EventProxy();

    ep.on('final', function(){
        res.json({
            success: true,
            data: 'ok'
        });
    }).fail(next);

    categoryProxy.delCategoryById(categoryid, ep.done(function(category){
        if(category.count == 0){
            ep.emit('final');
        }else{
            var num = category.topics.length;
            category.topics.forEach(function(topicid){
                topicProxy.delTopicById(topicid, ep.done(function(topic){
                    _withDelTopic(topic, function(){
                        num--;
                        num == 0 && ep.emit('final');
                    }, true);
                }));
            });
        }
    }));
};

module.exports = {
    index: index,
    delTopic: delTopic,
    categoryManage: categoryManage,
    delCategory: delCategory,
    replyManage: replyManage,
    delReply: delReply
}