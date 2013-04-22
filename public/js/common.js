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
        }
    };

    var public = {
        reply: {
            domEventInit: function(){
                var topicItem = $('.J-topic-item'),
                    showReply = $('.J-topic-showreply'),
                    replyRepeat = $('#J-replyRepeat'),
                    btn_replyFabu = $('.J-reply-fabu'),
                    replyWrap, that;

                // 点击评论
                showReply.on('click', function(){
                    that = $(this);
                    replyWrap = that.parent().parent().next('.J-reply-wrapper');

                    if(replyWrap.is(':visible')){
                        replyWrap.addClass('hide');
                        return;
                    }

                    // 发请求拿评论数据
                    _util.doAsync('/getComments.json', 'post', {
                        topicid: that.attr('data-topicid')
                    }, function(res){
                        replyWrap.find('.topic-reply').remove();
                        if(res.length){
                            $.each(res, function(i, replyItem){
                                var replyItemTemplate = replyRepeat.clone(true).removeAttr('id').removeClass('hide');
                                replyItemTemplate.find('.J-reply-head').attr('src', replyItem.head);
                                replyItemTemplate.find('.J-reply-user').attr('href', '/user/' + replyItem.author_name).text(replyItem.author_nickName);
                                replyItemTemplate.find('.J-reply-con').html(replyItem.content);
                                replyItemTemplate.find('.J-reply-at').attr('data-user', replyItem.author_nickName);
                                replyWrap.append(replyItemTemplate);
                            });
                        }

                        replyWrap.removeClass('hide');
                        replyWrap.find('textarea').val('').focus();
                    });
                });

                // 发表评论
                btn_replyFabu.on('click', function(){
                    var that = $(this),
                        content = that.parent().prev().get(0).value.toString().replace(/(\r)*\n/g,"<br/>").replace(/\s/g," "),
                        replyWrap = that.parents('.J-reply-wrapper'),
                        topicid = that.attr('data-topicid');

                    _util.doAsync('/newComment.json', 'post', {
                        topicid: topicid,
                        content: content
                    }, function(res){
                        var replyItemTemplate = replyRepeat.clone(true).removeAttr('id').removeClass('hide');
                        replyItemTemplate.find('.J-reply-head').attr('src', res.head);
                        replyItemTemplate.find('.J-reply-user').attr('href', '/user/' + res.author_name).text(res.author_nickName);
                        replyItemTemplate.find('.J-reply-con').html(res.content);
                        replyItemTemplate.find('.J-reply-at').attr('data-user', res.author_nickName);
                        replyWrap.append(replyItemTemplate);
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
        }
    };

    // 首页
    var indexObj = {
        fabu: function(){
            var btn = $('#J-fabu'),
                con = $('#J-topic-content');

            btn.on('click', function(){
                if($.trim(con.val()) == ''){
                    alertify.alert('别闹了，随便写点吧~');
                    return;
                };

                var content = con.val().toString().replace(/(\r)*\n/g,"<br/>").replace(/\s/g," ");

                _util.doAsync('/newTopic.json', 'POST', {content: content}, function(data){
                    var topic = data.topic,
                        user = data.user,
                        topic_wrap = $('#J-topic-wrap'),
                        $count = $('#J-userInfor-topicCount'),
                        template = $('#J-topicItemTemplate'),
                        newTopic,
                        content, authorName, time;

                    newTopic = template.clone(true);
                    content = newTopic.find('.J-topic-content');
                    authorName = newTopic.find('.J-topic-authorName');
                    time = newTopic.find('.J-topic-time');
                    img = newTopic.find('.J-topic-img');

                    authorName.text(user.nickName ? user.nickName : user.name);
                    img.attr('src', user.head);
                    content.text(topic.content);
                    time.text(topic.create_time);

                    topic_wrap.prepend(newTopic);
                    setTimeout(function(){
                        newTopic.slideDown(800, function(){
                            newTopic.removeClass('hide');
                            topic_wrap.find('.topic-item').last().remove();
                        });
                    },300);

                    // 清空吐槽框
                    con.val('');
                    con.focus();

                    // 个人信息区域同步吐槽数
                    $count.text(user.topic_count);
                });
            });
        },
        init: function(){
            this.fabu();
            public.reply.domEventInit();
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
                var nickVal = nickName.val(),
                    emailVal = email.val(),
                    signVal = sign.val();

                params.random = new Date().getTime();
                if($.trim(nickVal) != ''){
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
                if($.trim(signVal) != ''){
                    params.sign = signVal;
                    fill = true;
                }

                if(fill){
                    _util.doAsync('/account', 'post', params, function(data){
                        // 同步页面数据
                        if(data.nickName) $('.theCurrentName').text(data.nickName);
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
                    _util.doAsync('/pass', 'post', params, function(data){
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
            _util.doAsync('/message_empty', 'post', function(res){
                msgbody.empty();
                msgbody.append('<div class="message-item">没有新的消息。</div>');
                alertify.success('已清空消息中心。');
            });
        },
        init: function(){
            this.areYouSure();
        }
    };

    var exports = {
        indexObj: indexObj,
        account: account,
        myTopic: myTopic,
        message: message
    };

    return exports;
});