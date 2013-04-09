/**
 * 路由控制器
 * User: raytin
 * Date: 13-3-27
 */
var controllers = require('../controllers'),
    sign = controllers.sign,
    user = controllers.user,
    topic = controllers.topic,
    home = controllers.home;

module.exports = function(app){
    app.get('/', home.index);

    // 注册
    app.get('/reg', sign.reg);
    app.post('/reg', sign.doReg);

    // 登入、登出
    app.get('/login', sign.login);
    app.post('/login', sign.doLogin);
    app.get('/logout', sign.logout);

    // 话题首页、发表话题
    app.get('/topic', topic.index);
    app.post('/topic', topic.addTopic);
    app.post('/newTopic', topic.newTopic);

    // 个人中心
    app.get('/account', user.account);
    app.post('/account', user.account_save);
    app.get('/pass', user.pass);
    app.post('/pass', user.pass_save);
    app.get('/user/:name', user.myTopic);
    app.get('/avatar', user.avatar);

    // test
    app.get('/test', home.test);
    app.get('/getUserList.json', home.ajaxTest);
};