/**
 * common.
 * User: raytin
 * Date: 13-4-1
 */
define(['jquery', 'alertify'], function($, alertify){
    var _util = {
        doAsync : function(url, type, params, callback){
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

    var indexObj = {
        fabu: function(){
            var btn = $('#J-fabu'),
                con = $('#J-topic-content');

            btn.on('click', function(){
                if($.trim(con.val()) == ''){
                    alertify.alert('别闹了，随便写点吧~');
                    return;
                };

                _util.doAsync('/newTopic', 'POST', {content: con.val()}, function(data){
                    var topic = data,
                        topic_wrap = $('#J-topic-wrap'),
                        newTopic = $('#J-topicItemTemplate').clone(true),
                        $count = $('#J-userInfor-topicCount');

                    newTopic.find('.J-topic-time').text(topic.create_time);
                    newTopic.find('.J-topic-authorName').text(topic.author_name);
                    newTopic.find('.J-topic-content').text(topic.content);

                    newTopic.hide();
                    topic_wrap.prepend(newTopic);
                    newTopic.slideDown(1000);

                    // 清空吐槽框
                    con.val('');
                    con.focus();

                    // 个人信息区域同步吐槽数
                    $count.text(parseInt($count.text()) + 1);
                });
            });
        },
        init: function(){
            this.fabu();
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

    var exports = {
        indexObj: indexObj,
        account: account
    };

    return exports;
});