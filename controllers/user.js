/**
 * controller - user.
 * User: raytin
 * Date: 13-3-27
 */
var proxy = require('../proxy'),
    userProxy = proxy.User,
    topicProxy = proxy.Topic,
    config = require('../config').config,
    EventProxy = require('eventproxy'),
    util = require('../util');

// 个人资料
function accountPage(req, res, next, setting){
    if( !util.checkUserStatus(res, '请先登录。') ) return;

    var ep = new EventProxy();

    ep.all('userList', 'current_user', 'userListByCount', function(userList, current_user, userListByCount){
        current_user.sign = current_user.sign != '-' ? current_user.sign : '这家伙很懒，还没有签名';

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
    accountPage(req, res, next, {page: 'user/account', title: '资料设置', fields: 'name nickName follower followed topic_count sign lastLogin_time email'});
};

// 保存资料
function account_save(req, res, next){
    if( !util.checkUserStatusAsync(res, '先登录啊亲 (╯_╰)') ) return;

    var username = res.locals.current_user,
        ep = new EventProxy();

    // 删除时间戳
    delete req.body.random;

    ep.all('updateUserInfo', 'getUserInfo', function(update, user){
        res.json({
            success: true,
            data: user
        });
    }).fail(next);

    userProxy.updateUserInfoByName(username, req.body, ep.done('updateUserInfo'));
    userProxy.getUserInfoByName(username, 'sign nickName', ep.done('getUserInfo'));

};

//修改密码
function pass(req, res, next){
    accountPage(req, res, next, {page: 'user/pass', title: '修改密码', fields: 'name nickName follower followed topic_count sign lastLogin_time email pass'});
};
function pass_save(req, res, next){
    if( !util.checkUserStatusAsync(res, '先登录啊亲 (╯_╰)') ) return;

    var username = res.locals.current_user,
        ep = new EventProxy();

    ep.fail(next);

    userProxy.getUserInfoByName(username, 'pass', ep.done(function(user){
        var param = {
            success: true,
            data: 'ok'
        };
        if(req.body.pass !== user.pass){
            param.data = 'no';
            res.json(param);
        }else{
            userProxy.updateUserInfoByName(username, {pass: req.body.newPass}, ep.done(function(){
                res.json(param);
            }));
        }
    }));

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