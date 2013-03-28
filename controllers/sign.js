/**
 * 注册登录处理模块
 * User: raytin
 * Date: 13-3-27
 * Time: 上午10:45
 */
var proxy = require('../proxy'),
    User = proxy.User,
    models = require('../models'),
    config = require('../config').config;

// 注册
exports.reg = function(req, res){
    res.render('reg', {title: '用户注册', error: false});
};

// 处理用户注册信息
exports.goReg = function(req, res, next){
    //console.log(req.body);
    var error = [],
        userName = req.body['email'],
        passWord = req.body['password'],
        confirmPassWord = req.body['confirmPassword'];

    if(userName === ''){
        error.push('邮箱不能为空');
    };
    if(passWord === ''){
        error.push('密码不能为空');
    };
    if(passWord != confirmPassWord){
        error.push('两次输入密码不一样');
    };

    if(error.length){
        console.log(error);
        return res.render('reg',
            {
                title: '用户注册',
                error: error
            }
        );
    }
    // 处理用户信息
    else{
        console.log('success!!!!!!!!!!!');
        User.getUserByName(userName, function(err, user){
            if(err){
                return next(err);
            };
            // 用户名已存在
            if(user){
                res.render('reg', {
                    title: '用户注册',
                    error: [userName +'已被注册，换一个呗~']
                })
            }
            // 保存用户信息
            else{
                var userModel = new models.User();
                userModel.name = userName;
                userModel.pass = passWord;
                userModel.save(function(err){
                    if(err){
                        return next(err);
                    }
                    req.session.user = userName;
                    res.locals.currentUser = userName;
                    res.render('reg',
                        {
                            title: '用户注册',
                            error: 0
                        }
                    );
                    return;
                })
            }
        });
    };
};

// 登录
exports.login = function(req, res){
    res.render('login', {title: '用户登录'});
};
