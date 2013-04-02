/**
 * controller - user.
 * User: raytin
 * Date: 13-3-27
 */
var proxy = require('../proxy'),
    userProxy = proxy.User,
    topicProxy = proxy.Topic,
    config = require('../config').config,
    EventProxy = require('eventproxy');

// 个人资料
function accountPage(req, res, next, setting){
    var currentUser = res.locals.current_user,
        desc;

    if(!currentUser){
        desc = '请先登录。';
        res.render('notice/normal', {
            title: '出错了',
            desc: desc,
            layout: null
        })
        return;
    };

    var ep = new EventProxy();

    ep.all('userList', 'current_user', 'userListByCount', function(userList, current_user, userListByCount){
        current_user = {
            name: current_user.name,
            followed: current_user.followed,
            follower: current_user.follower,
            topic_count: current_user.topic_count,
            sign: current_user.sign != '-' ? current_user.sign : '这家伙很懒，还没有签名'
        };
        res.render(setting.page,
            {
                title: setting.title,
                config: config,
                users: userList,
                userInfo: current_user,
                usersByCount: userListByCount
            }
        );
    });
    ep.fail(next);

    // 最新加入
    userProxy.getUserList('name', ep.done('userList'));

    // 用户信息
    userProxy.getUserInfoByName(res.locals.current_user, setting.fields, ep.done('current_user'));

    // 吐槽之星
    userProxy.getUserListBy({}, 'name topic_count', {limit: 10, sort: [['topic_count', 'desc']]}, ep.done('userListByCount'));
};
function account(req, res, next){
    accountPage(req, res, next, {page: 'user/account', title: '资料设置', fields: 'name follower followed topic_count sign email'});
};
function account_save(req, res, next){
    //
};

//修改密码
function pass(req, res, next){
    accountPage(req, res, next, {page: 'user/pass', title: '修改密码', fields: 'name follower followed topic_count sign email pass'});
};
function pass_save(req, res, next){
    //
};

function list(req, res, next){
    userProxy.getUserList(function(err, users){
        console.log(users);
        if(err){
            return next(err);
        };
        if(users){
            res.render('userList', {
                title: '用户列表',
                userNames: users
            });
            return;
        }else{
            res.render('userList', {
                title: '用户列表',
                userNames: null
            });
        };
    });
};

module.exports = {
    account: account,
    account_save: account_save,
    pass: pass,
    pass_save: pass_save,
    list: list
};