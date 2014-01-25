/**
 * common.
 * User: raytin
 * Date: 13-4-1
 */
define(['jquery', 'alertify'], function($, alertify){
    var _util = {
        doAsync : function(url, type, params, callback){
            if(typeof params == 'function'){
                callback = params;
                params = {};
            }
            $.ajax({
                url: url,
                data: params,
                type: type,
                success: function(res){
                    if(res.success){
                        callback(res.data);
                    }else{
                        alertify.alert(res.data)
                    }
                },
                error: function(err){
                    alertify.alert(err);
                }
            });
        },
        // 话题显示前处理
        // @aaa => <a rel="xxx(@aaa)" href="/user/aaa">xxx</a>
        BeforeShow: function(content, callback){
            //var reg = /@([a-zA-Z0-9]{3,})?!=\)/g,
            var reg = /[^\(]@([a-zA-Z0-9]{3,})/g,
                mat = content.match(reg),
                len, num, con = content;

            if(mat){
                num = len = mat.length;
                for(var i = 0; i < len; i++){
                    var userName = mat[i].substr(2);

                    (function(userName){
                        _util.doAsync('/getNickName.json', 'post', {
                            userName: userName
                        }, function(res){
                            if(res){
                                //con = con.replace('@'+userName, '<a rel="'+res+'(@'+userName+')" href="/user/'+userName+'">'+res+'</a>');
                                con = con.replace(new RegExp('([^\\(])@('+userName + ')', 'g'), function(a, prefix){
                                    return prefix + '<a rel="'+res+'(@'+userName+')" href="/user/'+userName+'" class="J-userLink">'+res+'</a>';
                                });
                            }

                            num--;
                            if(num == 0){
                                callback(con);
                            }
                        });
                    })(userName);
                }
            }else{
                callback(content);
            };
        },
        // @回复前处理
        // <a rel="xxx(@aaa)" href="/user/aaa">xxx</a> => @aaa
        beforeAt: function(content){
            content = this.filter(content);

            var reg = /<a rel=\"[^\(]*\(([^\)]*)\)\"[^>]*>[^<]*<\/a>/g,
                regForCate = /<a[^>]*>(#[^#]*#)<\/a>/g;

            return content.replace(reg, function(str, atUser){
                return atUser;
            }).replace(regForCate, function(str, cate){
                return cate;
            });
        },
        // 过滤恶意代码
        filter: function(con){
            var reg1 = /<style[^>]*>.*<\/style>/g,
                reg2 = /<script[^>]*>.*<\/script>/g;

            return con.replace(reg1, '').replace(reg2, '');
        }
    };

    var public = {
        topic: {
            fabu: function(type){
                var btn = $('#J-fabu'),
                    join = $('#J-joinCategory'),
                    con = $('#J-topic-content'),
                    reg = /#([^#]+)#/,
                    conVal, mat, category;

                join.on('click', function(){
                    con.val('#' + $(this).attr('data-category') + '# ').focus();
                    return false;
                });

                btn.on('click', function(){
                    var topic_wrap = $('#J-topic-wrap'),
                        $count = $('#J-userInfor-topicCount'),
                        template = $('#J-topicItemTemplate'),
                        param = {};

                    conVal = con.val();
                    mat = conVal.match(reg);

                    if($.trim(con.val()) == ''){
                        alertify.alert('别闹了，随便写点吧~');
                        return;
                    };

                    // 匹配是否有话题分类 # #
                    if(mat){
                        category = mat[1];
                        // 话题最大长度20个字
                        if(category.length > 20){
                            alertify.alert('#话题#最大长度为20个字，精减一下吧~');
                            return;
                        }
                        // 只能是汉字与英文数字
                        else if(!/^[\u2E80-\uFE4F\w-]*$/g.test(category)){
                            alertify.alert('#话题#不能有特殊字符的啊~');
                            return;
                        }
                        param.category = category;
                    }

                    //var content = con.val().toString().replace(/(\r)*\n/g,"<br>").replace(/\s/g," ");

                    param.content = _util.filter(con.val());
                    _util.doAsync('/newTopic.json', 'POST', param, function(data){
                        var topic = data.topic,
                            user = data.user,
                            newTopic, content, authorName, time,
                            img, topicbtn;

                        newTopic = template.clone(true);
                        newTopic.removeAttr('id');

                        content = newTopic.find('.J-topic-content');
                        authorName = newTopic.find('.J-topic-authorName');
                        time = newTopic.find('.J-topic-time');
                        img = newTopic.find('.J-topic-img');
                        topicbtn = newTopic.find('.J-topic-showreply, .J-topic-up, .J-topic-down, .J-reply-fabu');

                        authorName.text(user.nickName ? user.nickName : user.name);
                        img.attr('src', user.head);
                        topicbtn.attr({'data-topicid': topic._id, 'data-user': user.name});
                        mat && newTopic.attr('data-cateid', data.cateid);
                        content.html(mat ? public.replaceToCate(topic.content, data.cateid) : topic.content);
                        time.text(topic.create_time);

                        topic_wrap.prepend(newTopic);
                        setTimeout(function(){
                            var noneInfor = $('#J-no-infor');
                            if(noneInfor.length){
                                noneInfor.remove();
                            }

                            newTopic.slideDown(800, function(){
                                newTopic.removeClass('hide');
                                // 有分页的情况，在发布成功时移除当页最后一条记录
                                if($('.pagination').length){
                                    topic_wrap.find('.topic-item').last().remove();
                                }
                            });
                        },300);

                        // 清空输入框
                        if(type === undefined){
                            con.val('');
                        }
                        con.focus();

                        // 个人信息区域同步吐槽数
                        $count.text(user.topic_count);
                    });
                });
            },
            domEventInit: function(){
                var topicItem = $('.J-topic-item'),
                    showReply = $('.J-topic-showreply'),
                    replyRepeat = $('#J-replyRepeat'),
                    btn_replyFabu = $('.J-reply-fabu'),
                    btn_supportdown = $('.J-topic-up, .J-topic-down'),
                    btn_replyAt = $('.J-reply-at'),
                    replyWrap, pushArea, that;

                // #xxx# => <a href="/category/xxx">#xxx#</a>
                topicItem.each(function(){
                    var that = $(this),
                        content = that.find('.J-topic-content'),
                        cateid = that.attr('data-cateid');

                    if(cateid){
                        content.html(public.replaceToCate(content.text(), cateid));
                    }
                });

                // 点击评论
                showReply.on('click', function(){
                    that = $(this);
                    replyWrap = that.parent().parent().next('.J-reply-wrapper');
                    pushArea = replyWrap.find('textarea');

                    if(replyWrap.is(':visible')){
                        replyWrap.addClass('hide');
                        return;
                    }

                    // 发请求拿评论数据
                    _util.doAsync('/getComments.json', 'post', {
                        topicid: that.attr('data-topicid')
                    }, function(res){
                        var replys = res.replys,
                            user = res.user;

                        // 先清空之前数据
                        replyWrap.find('.topic-reply').remove();

                        if(replys.length){
                            $.each(replys, function(i, replyItem){
                                var replyItemTemplate = replyRepeat.clone(true).removeAttr('id').removeClass('hide'),
                                    userInfo = user[replyItem.author_name];

                                replyItemTemplate.find('.J-reply-head').attr('src', userInfo.head);
                                replyItemTemplate.find('.J-reply-user').attr({'href': '/user/' + replyItem.author_name,'rel' : replyItem.author_name}).text(userInfo.nickName);
                                replyItemTemplate.find('.J-reply-at').attr('data-user', userInfo.nickName);

                                (function(replyItem, replyItemTemplate){
                                    _util.BeforeShow(replyItem.content, function(con){
                                        replyItemTemplate.find('.J-reply-con').html(con ? con : replyItem.content);
                                        replyWrap.append(replyItemTemplate);

                                        if(i == replys.length - 1){
                                            replyWrap.removeClass('hide');
                                            pushArea.val('').focus();
                                        }
                                    });
                                })(replyItem, replyItemTemplate);
                            });
                        }else{
                            replyWrap.removeClass('hide');
                            pushArea.val('').focus();
                        }
                    });
                });

                // 发表评论
                btn_replyFabu.on('click', function(){
                    var that = $(this),
                        //content = that.parent().prev().get(0).value.toString().replace(/(\r)*\n/g,"<br/>").replace(/\s/g," "),
                        pushArea = that.parent().prev(),
                        content = pushArea.val(),
                        replyWrap = that.parents('.J-reply-wrapper'),
                        replyNumArea = replyWrap.prev().find('.J-topic-replyNum'),
                        topicid = that.attr('data-topicid'),
                        topicuser = that.attr('data-user'),
                        topicCon = that.parents('.topic-body').find('.J-topic-content'),
                        replyAuthorTopic = $('#J-userInfor-topicCount');

                    if($.trim(content) == ''){
                        alertify.alert('别闹了，随便写点吧~');
                        return;
                    }

                    _util.doAsync('/newComment.json', 'post', {
                        topicid: topicid,
                        topicuser: topicuser,
                        topicCon: _util.beforeAt(topicCon.html()),
                        content: content
                    }, function(res){
                        var replyItemTemplate = replyRepeat.clone(true).removeAttr('id').removeClass('hide');
                        replyItemTemplate.find('.J-reply-head').attr('src', res.head);
                        replyItemTemplate.find('.J-reply-user').attr({'href': '/user/' + res.author_name, 'rel' : res.author_name}).text(res.author_nickName);
                        replyItemTemplate.find('.J-reply-at').attr('data-user', res.author_nickName);

                        _util.BeforeShow(res.content, function(con){
                            replyItemTemplate.find('.J-reply-con').html(con);
                            replyWrap.append(replyItemTemplate);
                            pushArea.val('');

                            // 同步页面数据
                            var originNum = replyNumArea.text();
                                num = originNum == '' ? 1 : (parseInt(originNum.replace(/[\(\)]/g, '')) + 1);
                            replyNumArea.text(' ('+ num +')');
                            //replyAuthorTopic.text( parseInt(replyAuthorTopic.text()) + 1 );
                        });
                    });
                });

                // 回复给某人
                btn_replyAt.on('click', function(){
                    var that = $(this),
                        area = that.parents('.J-reply-wrapper').find('.reply-push textarea'),
                        //atUserNick = that.attr('data-user'),
                        par = that.parent().prev(),
                        atUserName = par.find('.J-reply-user').attr('rel'),
                        atCon = _util.beforeAt(par.find('.J-reply-con').html());

                    area.val(' || @' + atUserName + ': ' + atCon);
                    area.get(0).setSelectionRange(0, 0);
                    area.focus();
                });

                // 赞 & 踩
                btn_supportdown.on('click', function(){
                    var that = $(this),
                        type = that.attr('data-type'),
                        numWrap = type === 'support' ? '.J-topic-upNum' : '.J-topic-downNum',
                        topicid = that.attr('data-topicid'),
                        topicuser = that.attr('data-user'),
                        topicCon = that.parents('.topic-body').find('.J-topic-content');

                    _util.doAsync('/supportdown.json', 'post', {
                        type: type,
                        topicid: topicid,
                        topicuser: topicuser,
                        topicCon: _util.beforeAt(topicCon.html())
                    }, function(res){
                        that.find(numWrap).text('('+ res +')');
                    });
                });

                // hover
                /*topicItem.on('mouseover', function(){
                    $(this).find('.J-topic-updown').removeClass('hide');
                });
                topicItem.on('mouseout', function(){
                    $(this).find('.J-topic-updown').addClass('hide');
                });*/
            }
        },
        // 处理吐槽内容
        replaceContent: function(){
            var wrap = $('.J-topic-content');
            wrap.each(function(){
                var that = $(this);
                _util.BeforeShow(that.html(), function(con){
                    that.html(con);
                });
            });
        },
        // 附加话题分类
        replaceToCate: function(content, cateid){
            return content.replace(/#[^#]+#/, function(str){
                return '<a href="/category/'+ cateid +'">'+ str +'</a>';
            });
        }
    };

    // 首页
    var indexObj = {
        init: function(){
            public.topic.fabu();
            public.topic.domEventInit();
        }
    };

    // 个人中心
    var account = {
        saveData: function(){
            var account_btn = $('#J-save-account'),
                nickName = $('#J-nickName'),
                email = $('#J-email'),
                emailWrap = email.parents('.control-group'),
                sign = $('#J-sign'),
                params = {},
                fill = false;

            account_btn.on('click', function(){
                var nick = nickName,
                    nickVal = nick.val(),
                    emailVal = email.val(),
                    signVal = sign.val();

                params.random = new Date().getTime();
                if($.trim(nickVal) != '' && nick.attr('disabled') != 'disabled'){
                    params.nickName = nickVal;
                    fill = true;
                }
                if($.trim(emailVal) != ''){
                    if(!/^[a-zA-Z0-9_]+[\w-]*@[a-zA-Z0-9]+(\.[a-zA-Z]+)+$/.test(emailVal)){
                        emailWrap.addClass('error');
                        return;
                    }else{
                        emailWrap.removeClass('error');
                        params.email = emailVal;
                        fill = true;
                    }
                }
                if($.trim(signVal) != '' && signVal != '这家伙很懒，还没有签名'){
                    params.sign = signVal;
                    fill = true;
                }

                if(fill){
                    _util.doAsync('/accountSave.json', 'post', params, function(data){
                        // 同步页面数据
                        if(data.nickName){
                            $('.theCurrentName').text(data.nickName);
                            nickName.attr('disabled', 'disabled');
                        }
                        if(data.sign) $('.theCurrentSign').text(data.sign);

                        emailWrap.removeClass('error');
                        alertify.alert('设置成功 \\^o^/');
                    });
                }else{
                    alertify.log('你是故意的。')
                }
            });
        },
        savePass: function(){
            var pass_btn = $('#J-save-pass'),
                pass = $('#J-pass'),
                newPass = $('#J-newPass'),
                newPassOnce = $('#J-newPassOnce'),
                passWrap = $('#J-pass-wrap'),
                newPassOnceWrap = $('#J-newPassOnce-wrap'),
                params = {};

            pass_btn.on('click', function(){
                var passVal = pass.val(),
                    newPassVal = newPass.val(),
                    newPassOnceVal = newPassOnce.val(),
                    error = 0;

                params.random = new Date().getTime();
                if($.trim(passVal) == ''){
                    passWrap.find('.hide').text('输入原密码');
                    passWrap.addClass('error');
                    error++;
                }else{
                    passWrap.removeClass('error');
                    params.pass = passVal;
                };

                if(newPassVal !== newPassOnceVal || $.trim(newPassVal) === ''){
                    newPassOnceWrap.find('.hide').text('两次密码输入不一样');
                    newPassOnceWrap.addClass('error');
                    error++;
                }else{
                    newPassOnceWrap.removeClass('error');
                    params.newPass = newPassVal;
                }

                if(error == 0){
                    _util.doAsync('/passSave.json', 'post', params, function(data){
                        if(data == 'ok'){
                            alertify.alert('密码什么的已经成功被你篡改 \\^o^/');
                            passWrap.removeClass('error');
                        }else{
                            passWrap.find('.hide').text('原密码不对啊亲，再好好想想');
                            passWrap.addClass('error');
                        }
                    });
                }else{
                    alertify.alert('你看，或者不看，红框框就在那里，不多，不少 →_→')
                }
            });
        },
        init: function(){
            this.saveData();
            this.savePass();
            public.topic.domEventInit();
            public.replaceContent();
        }
    };

    // 我的吐槽
    var myTopic = {
        follow: function(){
            var btn = $('#J-follow'),
                fans = $('#J-personInfor-fans'),
                target = btn.attr('data-user'),
                followIn = btn.val() == '取消关注' ? true : false,
                status, msg, btntext;

            btn.on('click', function(){
                // 取消关注
                if(followIn){
                    status = false;
                    msg = '<(￣︶￣)> 取消关注成功。';
                    btntext = '@ 关注';
                }
                // 关注
                else{
                    status = true;
                    msg = '<(￣︶￣)> 关注成功。';
                    btntext = '取消关注';
                }

                _util.doAsync('/follow.json', 'post', {follow: status, user: target}, function(ret){
                    alertify.alert(msg);
                    btn.val(btntext);
                    followIn = status;
                    fans.text(ret.length);
                });
            });
        },
        init: function(){
            this.follow();
            public.topic.domEventInit();
            public.replaceContent();
        }
    };

    // 分类
    var category = {
        // 将光标移至最后
        moveEndfocus: function(){
            var con = $('#J-topic-content'),
                len = con.val().length;

            con.get(0).setSelectionRange(len, len);
            con.focus();
        },
        init: function(){
            public.topic.domEventInit();
            public.replaceContent();
            public.topic.fabu('cate');
            this.moveEndfocus();
        }
    };

    // 消息中心
    var message = {
        areYouSure: function(){
            var btn = $('#J-doThisEmpty');

            btn.on('click', function(){
                alertify.confirm('消息超过20条时，系统将自动删除最早的10条，还是确定要清空吗？', function(e){
                    if(e){
                        message.empty();
                    }
                });
            });
        },
        empty: function(){
            var msgbody = $('#J-message-body');
            _util.doAsync('/emptyMessage.json', 'post', function(res){
                msgbody.empty();
                msgbody.append('<div class="message-item">没有新的消息。</div>');
                alertify.success('已清空消息中心。');
            });
        },
        init: function(){
            this.areYouSure();
        }
    };

    // 后台管理
    var admin = {
        domEventInit: function(){
            var btn_remove = $('.J-remove'),
                btn_update = $('.J-update'),
                tr = $('#J-tableData tr');

            var delMap = {
                topic: 'delTopic.json',
                category: 'delCategory.json',
                reply: 'delReply.json',
                user: 'delUser.json'
            };
            btn_remove.on('click', function(e){
                if(!confirm('确定删除？')) return;

                var that = $(this),
                    tr = that.parent().parent(),
                    replyCount = tr.find('.J-replyCount').text(),
                    id = that.attr('data-id'),
                    type = that.attr('data-type');

                if(replyCount != 0){
                    if(!confirm('该吐槽拥有评论，评论将会一同被删除')) return;
                }

                _util.doAsync('/admin/' + delMap[type], 'post', {id: id}, function(res){
                    tr.fadeOut(600, function(){
                        tr.remove();
                    });
                });
                e.stopPropagation();
            });

            tr.click(function(){
                tr.removeClass('on');
                $(this).addClass('on');
            });
        },
        init: function(){
            this.domEventInit();
        }
    }

    var exports = {
        indexObj: indexObj,
        account: account,
        myTopic: myTopic,
        category: category,
        message: message,
        admin: admin
    };

    return exports;
});