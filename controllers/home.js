/**
 * controller - home.
 * User: raytin
 * Date: 13-3-27
 * Time: 上午10:56
 */
var proxy = require("../proxy"),
    common = proxy.common,
    userProxy = proxy.User,
    topicProxy = proxy.Topic,
    config = require('../config').config,
    EventProxy = require("eventproxy"),
    util = require('../util');

var fs = require('fs');
var iconv = require('iconv-lite');
var request = require('request');
var sysutil = require('util');
//var crypto = require('crypto');
exports.test2 = function(req, res, next){
    var rand = Math.floor(Math.random()*100000000).toString();
    request(
        { method: 'PUT'
            , uri: 'http://mikeal.iriscouch.com/testjs/' + rand
            , multipart:
            [ { 'content-type': 'application/json'
                ,  body: JSON.stringify({foo: 'bar', _attachments: {'./message.txt': {follows: true, length: 18, 'content_type': 'text/plain' }}})
            }
                , { body: 'I am an attachment' }
            ]
        }
        , function (error, response, body) {
            if(response.statusCode == 201){
                console.log('document saved as: http://mikeal.iriscouch.com/testjs/'+ rand)
            } else {
                console.log('error: '+ response.statusCode)
                console.log(body)
            }
        }
    );
    res.send('just a test2@');
};
exports.test3 = function(req, res, next){
    //http://mikeal.iriscouch.com/testjs/88017401
    request({
        method: 'get',
        headers: {
            //'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:19.0) Gecko/20100101 Firefox/19.0'
        },
        uri: 'http://www.qiushibaike.com/'
    }, function(err, res, body){
        console.log(res.statusCode);
        if(!err && res.statusCode == 200){
            console.log(body);
        }else{
            console.log(11);
            console.log(body);
        }
    });
    request('http://localhost:3000/admin/category', function(err, res, body){
        console.log(res.statusCode);
        if(!err && res.statusCode == 200){
            console.log(body);
        }else{
            console.log(22);
            console.log(body);
        }
    });
    res.send('just a test3!');
};
exports.test = function(req, res, next){
    /*
     //console.log(req.params);
     //req.session.info = 'ubssss';
     //req.session.handa = 'dddyyy';
     //req.session.handa = null;
     fs.readdir('./public/csss', function(err, files){
     if(err) return console.log(999999999999999);
     console.log(files);
     });
     var user = null;
     if(req.session && req.session.user ){
     user = req.session.user;
     }
     console.log(res.locals);
     res.locals.user = user;
     res.locals.testfun = function(str){
     return '['+str+']';
     };
     console.log(req.query);

     var cipher = crypto.createCipher('aes-256-cbc', config.key);
     var cryptoed = cipher.update('xiao1989jie0106abcdefg', 'binary', 'hex');
     var encrypted = cryptoed + cipher.final('hex');
     var decipher = crypto.createDecipher('aes-256-cbc', config.key);
     var deciphered = decipher.update(encrypted, 'hex', 'utf8');
     console.log( deciphered + decipher.final('utf8') )
     */
    console.log(__filename);
    console.time('aaa');
    var arrr = [];
    for(var i = 0; i < 1000000; i++){
        arrr.push(i);
    };
    console.timeEnd('aaa');

    fs.readFile('./test4.txt', function(err, files){
        if(err){
            return console.log(err);
        }
        console.log(files);
        //console.log(files.toString());
        var de = iconv.decode(files);
        //console.log(de);
        //console.log(de.split(/\r\n/));
        /*fs.write('./test4.txt', 'hello world', function(err, data){
         if(err){
         return console.log(err);
         }
         console.log(222);
         console.log(data);
         });*/
    });
    request('http://www.baidu.com', function(err, res, body){
        console.log(res.statusCode);
        if(!err && res.statusCode == 200){
            console.log(body);
        }
    });
    fs.open('./test4.txt', 'a', 0644, function(err, fd){
        if(err) throw err;
        console.log(fd);
        fs.write(fd, '\r\nfive', null, 'utf8', function(e){
            if(e) throw e;
            fs.closeSync(fd);
        })
    });
    fs.watchFile('./test4.txt', function(cur, prev){
        console.log(555);
        //console.log(cur);
        //console.log(prev);
    });
    console.log(sysutil.log('haha!'));
    //var abc = request('https://www.google.com.hk/images/srpr/logo3w.png').pipe(fs.createWriteStream('./public/upload/jjyy2.png'));
    // 可读流|可写流
    var rOption = {
            flags: 'r',
            encoding: null,
            mode: 0666
        },
        wOption = {
            flags: 'a',
            encoding: null,
            mode: 0666
        },
        fileReadStream = fs.createReadStream('./test/verybig.jpg', rOption),
        fileWriteStream = fs.createWriteStream('./test/output/01.jpg', wOption);
    if(!fs.existsSync('./test/output/01.jpg')){
        fileReadStream.on('data', function(chunk){
            console.log(chunk.length);
            fileWriteStream.write(chunk);
        });
        fileReadStream.on('end', function(){
            console.log('finished');
            fileWriteStream.end();
        });
    }

    res.send('just a test page!');
};
exports.index = function(req, res, next){
    console.log(req.session);

    var ep = new EventProxy(),
        current_user = res.locals.current_user,
        page = parseInt(req.query.page) || 1,
        limit = config.limit,
        opt = {skip: (page - 1) * limit, limit: limit, sort: [['_id', 'desc']]};

    ep.all( 'goldCoins', 'topicList', 'sidebar', 'topbar', 'totalCount', function(goldCoins, topicList, sidebar, topbar, totalCount){
        var pagination = util.pagination(page, totalCount);
        res.render('index',
            {
                title: config.name,
                config: config,
                topics: topicList,
                topInfo: topbar.topInfo,
                users: sidebar.users,
                userInfo: sidebar.userInfo,
                usersByCount: sidebar.usersByCount,
                categories: sidebar.categories,
                pagination: pagination,
                gold: goldCoins
            }
        );
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
        arr.forEach(function(cur, i){
            //if(!cur.replyTo){
                userProxy.getOneUserInfo({_id : cur.author_id}, 'name nickName head', ep.done(function(user){
                    var nickName = user.nickName, time = cur.create_time;

                    cur.author_nickName = nickName ? nickName : user.name;
                    cur.head = user.head ? user.head : config.nopic;
                    cur.create_time = new Date(time).format('MM月dd日 hh:mm');

                    ep.emit('toAll');
                }));
            //}
        });
    }));

    // 获取右侧资源
    ep.on('afterGold', function(){
        common.getSidebarNeed(res, next, {fields: 'name nickName head fans followed gold topic_count sign lastLogin_time'}, function(need){
            ep.emit('sidebar', need);
        });
    });

    // 获取顶部资源
    common.getTopbarNeed(res, next, function(need){
        ep.emit('topbar', need);
    });

    // 取得总页数
    topicProxy.getTopicCount(ep.done(function(totalCount){
        ep.emit('totalCount', Math.ceil(totalCount / limit));
    }));

    // 随机送金币
    if(current_user){
        userProxy.getUserInfoByName(current_user, 'lastLogin_time lastGetGold fans followed gold topic_count', ep.done(function(user){
            var compare = user.lastGetGold ? user.lastGetGold : user.lastLogin_time;

            if(user.lastLogin_time != '0' && util.timeBucket(compare)){
                // 计算人品指数
                var add = user.fans.length + Math.ceil(user.followed.length/2) + Math.ceil(user.topic_count/5),
                    coins = util.random(5, 20 + add);

                if(user.gold){
                    user.gold += coins;
                }else{
                    user.gold = coins;
                }
                user.lastGetGold = new Date().format('yyyy-MM-dd hh:mm:ss');
                user.save(function(err){
                    if(err) return next(err);
                    ep.emit('goldCoins', coins);
                    ep.emit('afterGold');
                });
            }else{
                ep.emit('goldCoins', null);
                ep.emit('afterGold');
            }
        }));
    }else{
        ep.emit('goldCoins', null);
        ep.emit('afterGold');
    }
};