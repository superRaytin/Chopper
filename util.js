/**
 * 公用方法.
 * User: raytin
 * Date: 13-3-28
 */

/**
 * 日期时间格式化
 * @date {Date} date 日期对象
 */
function formatDate(date){
    return date.getFullYear() + '/' + (parseInt(date.getMonth()) + 1) + '/' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
};

module.exports = {
    formatDate: formatDate
};