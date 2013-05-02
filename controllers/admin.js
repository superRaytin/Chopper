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

var hash = {};

// 管理首页（默认是吐槽管理）
function index(req, res, next){
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
        _withDelTopic(ep, function(){
            ep.emit('final');
        });
        ep.emit('updateUser', topic);
    }));
};
function _withDelTopic(ep, callback){
    // 如果此主题下有评论则删除之
    ep.on('delComment', function(topic){
        topicProxy.getTopicList({replyTo: topic._id}, {}, ep.done(function(topics){
            var num = topics.length;

            // 更新各评论用户的吐槽数
            topics.forEach(function(topic){
                topicProxy.delTopicById(topic._id, ep.done(function(topicd){
                    userProxy.getOneUserInfo({_id: topicd.author_id}, 'topic_count', ep.done(function(user){
                        var topic_count = user.topic_count,
                            hashCount = hash['topic_count'];

                        user.topic_count = (hashCount ? hashCount : topic_count) - 1;

                        // 防止时间差导致数据更新不准确
                        hash['topic_count'] = user.topic_count;

                        user.save(ep.done(function(){
                            console.log(333)
                            num--;
                            if(num == 0){
                                callback();
                                //ep.emit('final');
                            }
                        }));
                    }));
                }));
            });
        }));
    });

    // 同步更新话题
    ep.on('updateCate', function(topic){
        categoryProxy.getCategoryById(topic.category, ep.done(function(category){
            category.count--;
            category.topics.remove(topic._id);
            category.save(ep.done(function(){
                console.log(222)
                if(topic.replys && topic.replys.length){
                    ep.emit('delComment', topic);
                }
                else{
                    callback();
                    //ep.emit('final');
                }
            }));
        }));
    });

    // 同步更新用户吐槽数
    ep.on('updateUser', function(topic, fromCate){
        userProxy.getOneUserInfo({_id: topic.author_id}, 'topic_count', ep.done(function(user){
            user.topic_count--;
            user.save(ep.done(function(){
                console.log(111)
                if(topic.category && !fromCate){ // 删除话题时不用再更新主题
                    ep.emit('updateCate', topic);
                }
                else if(topic.replys && topic.replys.length){
                    console.log(999);
                    ep.emit('delComment', topic);
                }
                else{
                    callback();
                    //ep.emit('final');
                }
            }));
        }));
    });
}
function errHandler(err){
    if(err){
        console.log(err);
        return;
    }
}
function _withDelTopic_(topic, callback, fromCate){
    var ep = new EventProxy();
    ep.fail(errHandler);

    // 如果此主题下有评论则删除之
    function delComment(topic){
        topicProxy.getTopicList({replyTo: topic._id}, {}, ep.done(function(topics){
            var num = topics.length;

            // 更新各评论用户的吐槽数
            topics.forEach(function(topic){
                topicProxy.delTopicById(topic._id, ep.done(function(topicd){
                    userProxy.getOneUserInfo({_id: topicd.author_id}, 'topic_count', ep.done(function(user){
                        var topic_count = user.topic_count,
                            hashCount = hash['topic_count'];

                        user.topic_count = (hashCount ? hashCount : topic_count) - 1;

                        // 防止时间差导致数据更新不准确
                        hash['topic_count'] = user.topic_count;

                        user.save(ep.done(function(){
                            console.log(333)
                            num--;
                            if(num == 0){
                                callback();
                                //ep.emit('final');
                            }
                        }));
                    }));
                }));
            });
        }));
    };

    // 同步更新话题
    function updateCate(topic){
        categoryProxy.getCategoryById(topic.category, ep.done(function(category){
            category.count--;
            category.topics.remove(topic._id);
            category.save(ep.done(function(){
                console.log(222)
                if(topic.replys && topic.replys.length){
                    //ep.emit('delComment', topic);
                    delComment(topic);
                }
                else{
                    callback();
                    //ep.emit('final');
                }
            }));
        }));
    };

    // 同步更新用户吐槽数
    //ep.on('updateUser', function(topic, fromCate){
        userProxy.getOneUserInfo({_id: topic.author_id}, 'topic_count', ep.done(function(user){
            var topic_count = user.topic_count,
                hashCount = hash['topic_count1'];

            user.topic_count = (hashCount ? hashCount : topic_count) - 1;
            // 防止时间差导致数据更新不准确
            hash['topic_count1'] = user.topic_count;

            user.save(ep.done(function(){
                console.log(111)
                if(topic.category && !fromCate){ // 删除话题时不用再更新主题
                    updateCate(topic);
                }
                else if(topic.replys && topic.replys.length){
                    console.log(999);
                    delComment(topic);
                }
                else{
                    callback();
                    //ep.emit('final');
                }
            }));
        }));
    //});
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

// 删除分类
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
                    _withDelTopic_(topic, function(){
                        num--;
                        num == 0 && ep.emit('final');
                    }, true);
                    //ep.emit('updateUser', topic, true);
                }));
            });
        }
    }));
};

module.exports = {
    index: index,
    delTopic: delTopic,
    categoryManage: categoryManage,
    delCategory: delCategory
}