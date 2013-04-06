/**
 * 公用方法.
 * User: raytin
 * Date: 13-3-28
 */

/**
 * 日期时间格式化
 */
Date.prototype.format = function(format){
    var o = {
        "M+" : this.getMonth() + 1, //month
        "d+" : this.getDate(),    //day
        "h+" : this.getHours(),   //hour
        "m+" : this.getMinutes(), //minute
        "s+" : this.getSeconds(), //second
        "q+" : Math.floor((this.getMonth() + 3) / 3), //quarter
        "S" : this.getMilliseconds() //millisecond
    };

    if(/(y+)/.test(format)){
        format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    };

    for(var k in o){
        if(new RegExp("(" + k + ")").test(format))
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
    };
    return format;
};

/**
 * 检查用户状态
 * @param {String} msg 未登录提示信息
 */
function checkUserStatus(res, msg){
    var currentUser = res.locals.current_user;

    if(!currentUser){
        desc = '先登录啊亲 (╯_╰)';
        res.render('notice/normal', {
            title: '出错了',
            desc: msg,
            layout: null
        })
        return false;
    };

    return true;
};
function checkUserStatusAsync(res, msg){
    var currentUser = res.locals.current_user;

    if(!currentUser){
        res.json({
            success: false,
            data: msg
        })
        return false;
    };

    return true;
};

module.exports = {
    formatDate: formatDate,
    checkUserStatus: checkUserStatus,
    checkUserStatusAsync: checkUserStatusAsync
};