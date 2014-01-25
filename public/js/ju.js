/**
 * ju.
 * User: raytin
 * Date: 13-7-5
 */
define(['jquery'], function($){
    var ju = {
        radio: {
            observer: function(){
                var tabLi = $('#J-radio-tab li');
                tabLi.click(function(){
                    var cur = $(this),
                        dataWid = cur.attr('data-wid'),
                        dataHei = cur.attr('data-hei'),
                        wid = dataWid ? 'width: '+ dataWid +'px;' : '',
                        hei = dataHei ? 'height: '+ dataHei +'px;' : '';

                    tabLi.removeClass('on');
                    cur.addClass('on');
                    $('#J-radio-frame').attr({
                        src: cur.attr('rel'),
                        style: wid +  hei
                    });
                });
            },
            init: function(){
                this.observer();
            }
        }
    };

    return ju;
});