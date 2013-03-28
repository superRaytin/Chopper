/**
 * 路由控制器
 * User: raytin
 * Date: 13-3-27
 */
var index = require('../controllers/index'),
    sign = require('../controllers/sign'),
    user = require('../controllers/user');

module.exports = function(app){
    app.get('/', index.index);

    app.get('/users', user.list);

    // 注册
    app.get('/reg', sign.reg);
    app.post('/reg', sign.doReg);

    // 登入、登出
    app.get('/login', sign.login);
    app.post('/login', sign.doLogin);
    app.get('/logout', sign.logout);
};