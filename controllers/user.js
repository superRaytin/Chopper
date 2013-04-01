/**
 * controller - user.
 * User: raytin
 * Date: 13-3-27
 */
var proxy = require('../proxy'),
    UserProxy = proxy.User;

// 个人资料
function account(req, res, next){
    //
};
function account_save(req, res, next){
    //
};

//修改密码
function pass(req, res, next){
    //
};
function pass_save(req, res, next){
    //
};

function list(req, res, next){
    UserProxy.getUserList(function(err, users){
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