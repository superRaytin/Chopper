/**
 * common.
 * User: raytin
 * Date: 13-4-1
 */
define(['jquery', 'alertify'], function($, alertify){
    var indexObj = {
        fabu: function(){
            var btn = $('#J-fabu'),
                con = $('#J-topic-content');

            btn.on('click', function(){
                if($.trim(con.val()) == ''){
                    alertify.alert('亲，总得说点什么吧~');
                    return;
                };

                $.ajax({
                    url: '/newTopic',
                    type: 'POST',
                    data: {
                        content: con.val()
                    },
                    success: function(data){
                        if(data.success){
                            var topic = data.data,
                                topic_wrap = $('#J-topic-wrap'),
                                newTopic = topic_wrap.find('.media').eq(0).clone(true),
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
                        }else{
                            alert(data.data);
                        }
                    },
                    error: function(err){
                        alert(err);
                    }
                });
            });
        },
        init: function(){
            this.fabu();
        }
    };

    var exports = {
        indexObj: indexObj
    };

    return exports;
});