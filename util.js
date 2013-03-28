/**
 * util.
 * User: raytin
 * Date: 13-3-28
 */
exports.formatDate = function(now){
    return now.getFullYear() + '/' + now.getMonth() + '/' + now.getDate() + ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
};