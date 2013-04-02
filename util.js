/**
 * 公用方法.
 * User: raytin
 * Date: 13-3-28
 */

/**
 * 日期时间格式化
 * @param {Date} date 日期对象
 */
function formatDate(date){
    return date.getFullYear() + '/' + (parseInt(date.getMonth()) + 1) + '/' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
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