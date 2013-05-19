/**
 * 路由控制器
 * User: raytin
 * Date: 13-3-27
 */
var controllers = require('../controllers'),
    sign = controllers.sign,
    user = controllers.user,
    topic = controllers.topic,
    category = controllers.category,
    message = controllers.message,
    home = controllers.home,
    admin = controllers.admin;

module.exports = function(app){
    app.get('/', home.index);
    app.get('/test', home.test);
    app.get('/test2', home.test2);
    app.get('/test3', home.test3);

    // 注册
    app.get('/reg', sign.reg);
    app.post('/reg', sign.doReg);

    // 登入、登出
    app.get('/login', sign.login);
    app.post('/login', sign.doLogin);
    app.get('/logout', sign.logout);

    // 发表话题 | 我的吐槽 | 获取评论 | 赞踩
    app.post('/newTopic.json', topic.newTopic);
    app.get('/mine', topic.myTopic);
    app.post('/getComments.json', topic.getComments);
    app.post('/newComment.json', topic.newComment);
    app.post('/supportdown.json', topic.supportdown);

    // 话题分类
    app.get('/category/:cateid', category.index);

    // 个人中心
    app.get('/account', user.account);
    app.post('/accountSave.json', user.account_save);
    app.get('/pass', user.pass);
    app.post('/passSave.json', user.pass_save);
    app.get('/user/:name', user.user_center);
    app.get('/avatar', user.avatar);
    app.post('/avatar', user.avatar_save);
    app.post('/follow.json', user.follow);
    app.post('/getNickName.json', user.getNickName);

    // 消息中心
    app.get('/message', message.page);
    app.post('/emptyMessage.json', message.message_empty);

    // 后台管理
    app.get('/admin', admin.index);
    app.post('/admin/delTopic.json', admin.delTopic);
    app.get('/admin/category', admin.categoryManage);
    app.post('/admin/delCategory.json', admin.delCategory);
    app.get('/admin/reply', admin.replyManage);
    app.post('/admin/delReply.json', admin.delReply);
    app.get('/admin/user', admin.userManage);
    app.post('/admin/delUser.json', admin.delUser);
};