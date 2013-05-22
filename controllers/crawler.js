/**
 * controller - home.
 * User: raytin
 * Date: 13-3-27
 * Time: 上午10:56
 */
var EventProxy = require("eventproxy"),
    util = require('../util');

var fs = require('fs');
var iconv = require('iconv-lite');
var request = require('request');
var sysutil = require('util');
var cheerio = require('cheerio');
var url = require('url');
var http = require('http');
var log = console.log;
var hash = {};
var pub = {
    joinStr: function(out, xmlEls, targetEls){
        var arr = ['\t<block>\n'],
            spe = /::/;
        xmlEls.forEach(function(item, i){
            var tarel = targetEls[i], val, splits;
            if(spe.test(tarel)){
                splits = tarel.split(spe);
                val = out.find(splits[0]).attr(splits[1]);
            }else{
                if(item == 'thumb'){
                    val = out.find(tarel).attr('src');
                }else{
                    val = out.find(tarel).text();
                }
            }
            arr.push('\t\t<'+ item +'>'+ (val ? val.trim() : null) +'</'+ item +'>\n');
        });
        arr.push('\t</block>\n\n');

        return arr.join('');
    },
    // 爬虫配置文件路径
    configPath: './test/output/config.xml',
    // 配置爬虫目标
    targets: {
        'qiushi' : {
            name: '糗事百科',
            uri: 'http://www.qiushibaike.com/',
            sendUserAgent: true, // 发送客户端标识（糗事百科默认返回手机端页面）
            xmlPath: './test/output/', // 数据输出路径
            xmlPrefix: 'qiu-', // XML数据文件头
            speed: 1 * 60 * 60 * 1000, // 抓取频率
            maxTime: 20, // 最多抓取的次数，默认20次，可选
            rule: {
                blockSelect: '.block', // 目标 区块选择器
                xmlDataItem: ['content', 'time', 'author', 'thumb'], // XML存储构成
                targetClassForXmlData: ['.content', '.content::title', '.author', '.thumb img'] // 目标 区块内各目标元素
            }
        }
    },
    request: function(flag, callback){
        var ep = new EventProxy(),
            opt = {},
            target = pub.targets[flag],
            name = target.name,
            rule = target.rule,
            xmlPath = target.xmlPath,
            xmlPrefix = target.xmlPrefix,
            speed = target.speed,
            blockSelect = rule.blockSelect,
            xmlDataItem = rule.xmlDataItem,
            targetClassForXmlData = rule.targetClassForXmlData,
            configPath = pub.configPath;

        opt.uri = target.uri;
        opt.method = 'get';
        if(target.sendUserAgent){
            opt.headers = {
                //'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:19.0) Gecko/20100101 Firefox/19.0'
            };
        }

        request(opt, function(err, resp, body){
            if(!err && resp.statusCode == 200){
                console.log('从 %s 取得数据。。。', name);
                var $ = cheerio.load(body),
                    con = $(blockSelect),
                    xml = ['<blocks>\n'];

                for(var i = 0, len = con.length; i < len; i++){
                    var cur = con.eq(i);

                    var joinedStr = pub.joinStr(cur, xmlDataItem, targetClassForXmlData);
                    xml.push(joinedStr);

                    /*xml.push('\t<block>\n' +
                        '\t\t<content>'+ content.text().trim() +'</content>\n' +
                        '\t\t<time>'+ content.attr("title") +'</time>\n' +
                        '\t\t<author>'+ (author.length ? author.find("a").text().trim() : null) +'</author>\n' +
                        '\t\t<thumb>'+ (thumb.length ? thumb.find("img").attr("src") : null) +'</thumb>\n' +
                        '\t</block>\n\n');*/
                };
                xml.push('</blocks>');

                // 先渲染再说, 跟进储存数据
                if(callback){
                    var $block = cheerio.load(xml.join(''));
                    log('已取得最新数据，对 %s '+ ' 渲染 ...', name);
                    callback($block('block'));
                }

                var date = new Date(),
                    now = date.format('yyyy/MM/dd hh:mm:ss'),
                    lastOne = date.format('yyyy-MM-dd-hhmmss');

                var configString = '<'+ flag +'>\n' +
                    '\t<lastTime>'+ now +'</lastTime>\n' +
                    '\t<lastOne>'+ lastOne +'</lastOne>\n' +
                    '\t<interVal>'+ speed +'</interVal>\n' +
                    '</'+ flag +'>\n\n';

                ep.on('createXML', function(){
                    fs.createWriteStream(xmlPath + xmlPrefix + lastOne +'.xml').write(xml.join(''));
                });

                // 往配置文件里新增信息
                fs.readFile(configPath, function(err, file){
                    log('读取 %s '+ ' 配置 ...', name);
                    if(err) throw err;
                    var $ = cheerio.load(file),
                        $dataWrap = $(flag);

                    // 检查是否已配置糗事
                    if($dataWrap.length){
                        log('已取得最新数据，更新 %s '+ ' 配置', name);
                        $dataWrap.find('lastTime').text(now);
                        $dataWrap.find('lastOne').text(lastOne);
                        //$dataWrap.find('interVal').text(speed);
                        fs.writeFile(configPath, $.html(), function(e){
                            if(e) throw e;
                            ep.emit('createXML');
                        });
                    }
                    else{
                        log('未对 %s '+ ' 进行配置，添加进配置文件', name);
                        fs.writeFile(configPath, $.html() + configString, function(e){
                            if(e) throw e;
                            ep.emit('createXML');
                        });
                    }
                });
            }else{
                console.log('出错了！');
                console.log(err);
            }
        });
    }
}
exports.test2 = function(req, res, next){
    /*var rand = Math.floor(Math.random()*100000000).toString();
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
    );*/
    var ex = 'http://username:password@abcd.com.cn:8080/p/a/t/h?query=string#hash';
    var par = url.parse(ex);
    console.log(url.parse(ex));
    console.log(22);
    /*console.log(url.format(par));
    //console.log(fs.stat('./test/output/c.xml'));
    //console.log(' sdfsdf '.trim());
    fs.stat('./test/output/c.xml', function(err, stat){
        if(err) return console.log(err);
        console.log(55);
        console.log(stat);
    });
    fs.readFile('./test/output/abc.txt', function(err, file){
        console.log(77);
        console.log(file);
        console.log(file.length);
    })*/
    fs.open('./test/output/config.xml', 'a', 0644, function(err, fd){
        if(err) throw err;
        // 检查是否已配置糗事
        console.log(fs.readFileSync('./test/output/config.xml').length - 10);

         fs.write(fd, '<interVal>3600000</interVal>', fs.readFileSync('./test/output/config.xml').length - 10, 'utf8', function(e){
             if(e) throw e;
             fs.closeSync(fd);
         });
    });
    res.send('just a test2@');
    return;
    request('http://mikeal.iriscouch.com/testjs/88017401', function(err, res, body){
        if(err) return console.log(err);
        console.log(res);
        console.log(333);
        console.log(body);
        //res.pipe(fs.createWriteStream('./test/output/abc.txt'));
    });
    http.get({
            host: 'mikeal.iriscouch.com',
            path: '/testjs/88017401',
            port: 80
        }, function(res){
            console.log(res);
            res.pipe(fs.createWriteStream('./test/output/abc.txt'));
    }).on('error', function(e) {
        console.log("Got error " + e.message);
    });
    res.send('just a test2@');
};

exports.qiushi = function(req, res, next){
    !hash.qiushi && (hash.qiushi = {});
    var cache = hash.qiushi;

    var target = pub.targets['qiushi'],
        xmlPath = target.xmlPath,
        xmlPrefix = target.xmlPrefix,
        maxTime = target.maxTime,
        ep = new EventProxy(),
        space = target.speed, // 1小时爬一次
        timerNum = cache.timerNum || (cache.timerNum = maxTime ? maxTime : 20),
        configPath = pub.configPath;

    // 检查配置文件
    if(fs.existsSync(configPath)){
        fs.readFile(configPath, function(err, data){
            var $ = cheerio.load(data),
                outEl = $('qiushi'),
                lastOnePath = xmlPath + xmlPrefix + outEl.find('lastOne').text() +'.xml',
                lastTime = outEl.find('lastTime').text(),
                interVal = outEl.find('interVal').text(),
                outOfTime = ( new Date().getTime() - new Date(lastTime).getTime() ) > interVal;

            space = interVal;

            // 检查配置中最后一次的数据文件是否存在
            if(fs.existsSync(lastOnePath)){
                if(!outOfTime){
                    fs.readFile(lastOnePath, function(err, file){
                        if(err) return console.log(err);
                        var $lastFile = cheerio.load(file);
                        return ep.emit('rend', $lastFile('block'));
                    });
                }else{
                    log(interVal + ' 时间范围已过，重新取数据~');
                    getData();
                }
            }else{
                log('配置中标注的最后一次数据文件不存在，重新取~');
                getData();
            }
        });
    }else{
        log('新建配置文件');
        fs.writeFile(configPath, '', function(err){
            if(err) throw err;
            getData();
        });
    }

    function be(){
        pub.request('qiushi', function(){
            if(timerNum--){
                log('还剩' + timerNum + '次');
                cache.timer = setTimeout(function(){
                    be();
                }, space);
            }else{
                clearTimeout(cache.timer);
                log('计时次数完了，结束');
            }
        });
    }

    ep.on('rend', function(con){
        res.render('crawler/joke',{
            title: '糗事',
            data: con,
            layout: null
        });

        if(!cache.timer){
            log('创建计时器');
            cache.timer = setTimeout(function(){
                log('计时start');
                be();
            }, space);
        };
    }).fail(next);

    /*ep.on('getData', function(callback){
        request({
            method: 'get',
            headers: {
                //'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:19.0) Gecko/20100101 Firefox/19.0'
            },
            uri: 'http://www.qiushibaike.com/'
        }, function(err, resp, body){
            if(!err && resp.statusCode == 200){
                console.log('从糗百取得数据。。。');
                var $ = cheerio.load(body),
                    con = $('.block'),
                    xml = ['<blocks>\n'];

                for(var i = 0, len = con.length; i < len; i++){
                    var cur = con.eq(i),
                        content = cur.find('.content'),
                        author = cur.find('.author'),
                        thumb = cur.find('.thumb');

                    xml.push('\t<block>\n' +
                        '\t\t<content>'+ content.text().trim() +'</content>\n' +
                        '\t\t<time>'+ content.attr("title") +'</time>\n' +
                        '\t\t<author>'+ (author.length ? author.find("a").text().trim() : null) +'</author>\n' +
                        '\t\t<thumb>'+ (thumb.length ? thumb.find("img").attr("src") : null) +'</thumb>\n' +
                        '\t</block>\n\n');
                };
                xml.push('</blocks>');

                if(callback){
                    var $block = cheerio.load(xml);
                    callback($block('block'));
                }

                var date = new Date(),
                    now = date.format('yyyy/MM/dd hh:mm:ss'),
                    lastOne = date.format('yyyy-MM-dd-hhmmss');

                var configString = '<qiushi>\n' +
                    '\t<lastTime>'+ now +'</lastTime>\n' +
                    '\t<lastOne>'+ lastOne +'</lastOne>\n' +
                    '\t<interVal>'+ space +'</interVal>\n' +
                    '</qiushi>\n\n';

                ep.on('createXML', function(){
                    fs.createWriteStream('./test/output/qiu-'+ lastOne +'.xml').write(xml.join(''));
                });

                // 往配置文件里新增信息
                fs.open(configPath, 'a', 0644, function(err, fd){
                    if(err) throw err;
                    var $ = cheerio.load(fd),
                        $qiu = $('qiushi');
                    // 检查是否已配置糗事
                    if($qiu.length){
                        $qiu.find('lastTime').text(now);
                        $qiu.find('lastOne').text(lastOne);
                        $qiu.find('interVal').text(space);
                        fs.closeSync(fd);
                        ep.emit('createXML');
                    }else{
                        fs.write(fd, configString, null, 'utf8', function(e){
                            if(e) throw e;
                            fs.closeSync(fd);
                            ep.emit('createXML');
                        });
                    }
                });
            }else{
                console.log('出错了！');
                console.log(err);
            }
        });
    });*/
    // 不存在数据 或者 时间已超出范围
    function getData(){
        pub.request('qiushi', function(source){
            ep.emit('rend', source);
        });
    }
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