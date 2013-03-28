/**
 * index.
 * User: raytin
 * Date: 13-3-27
 * Time: 上午10:56
 */
var config = require('../config').config;

exports.index = function(req, res){
    //console.log(req.user); //无效
    //console.log(req.params);
    //console.log(req.body);
    //var ab = 8;
    //req.flash('info', 'you have %s items in yours', ab);
    //req.session.info = 'ubssss';
    //req.session.handa = 'dddyyy';
    //var info = req.flash( 'info');
    //console.log(info);
    //req.session.handa = null;
    console.log(req.session);
    /*var user = null;
    if(req.session && req.session.user ){
        user = req.session.user;
    }
    console.log(res.local);*/
    res.locals.hhmm = 8;
    //res.locals.user = user;
    res.render('index',
        {
            title: 'nodejs',
            config: config
        }
    );
};