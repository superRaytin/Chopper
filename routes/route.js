
/*
 * route
 */

var index = require('../controllers/index'),
    sign = require('../controllers/sign'),
    user = require('../controllers/user');

module.exports = function(app){
    app.get('/', index.index);
    app.get('/users', user.list);
    app.get('/reg', sign.reg);
    app.post('/reg', sign.goReg);
    app.get('/login', sign.login);
};