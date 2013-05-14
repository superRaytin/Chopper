/**
 * 公用方法.
 * User: raytin
 * Date: 13-3-28
 */
var crypto = require('crypto'),
    config = require('./config').config;

// 日期时间格式化
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

// 判断数组中是否包含某一项
Array.prototype.contains = function(item){
    var i = this.length;
    while(i--){
        if(this[i] == item) return true;
    }
    return false;
};

// 删除数组中某一项
Array.prototype.remove = function(item){
    var i = this.length;
    while(i--){
        if(this[i] == item){
            this.splice(i, 1);
        };
    }
    return this;
};

/**
 * 产生指定范围的随机数
 * @param {String} min 最小数
 * @param {String} max 最大数
 */
function random(min, max){
    return Math.min(max, Math.floor(Math.random() * max + min));
};

/**
 * 计算时间段（是否当天）
 * @param {String} date 要计算的日期
 */
function timeBucket(date){
    var now = new Date(),
        date = new Date(date),
        nowMonth = now.getMonth() + 1,
        dateMonth = date.getMonth() + 1,
        nowDate = now.getDate(),
        dateDate = date.getDate();

    nowMonth = nowMonth > 12 ? nowMonth - 12 : nowMonth;
    dateMonth = dateMonth > 12 ? dateMonth - 12 : dateMonth;

    nowMonth = nowMonth < 10 ? '0' + nowMonth : nowMonth;
    dateMonth = dateMonth < 10 ? '0' + dateMonth : dateMonth;

    var nowed = [now.getFullYear(), nowMonth, nowDate < 10 ? '0' + nowDate : nowDate].join(''),
        dated = [date.getFullYear(), dateMonth, dateDate < 10 ? '0' + dateDate : dateDate].join('');

    return nowed - dated > 0
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

/**
 * 检查用户状态（异步）
 * @param {String} msg 未登录提示信息
 */
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

/**
 * 检查管理用户状态
 * @param {String} msg 未登录提示信息
 */
function checkAdminAsyc(res, msg){
    if( !checkUserStatusAsync(res, '先登录啊亲') ) return;

    var current_user = res.locals.current_user;

    if( current_user !== 'admin' ){
        res.json({
            success: false,
            data: msg
        });
        return
    };

    return true;
}
function checkAdmin(res, msg){
    if( !checkUserStatus(res, '先登录啊亲') ) return;

    var current_user = res.locals.current_user;

    if( current_user !== 'admin' ){
        res.render('notice/normal', {
            title: '出错了',
            desc: msg,
            layout: null
        })
        return false;
    };

    return true;
};

/**
 * 加密解密
 * @param {String} will 待加密或解密的字符串
 */
function encrypt(will){
    var cipher = crypto.createCipher('aes-256-cbc', config.key),
        ciphered = cipher.update(will, 'binary', 'hex'),
        encrypted = ciphered + cipher.final('hex');

    return encrypted;
}
function decrypt(will){
    var decipher = crypto.createDecipher('aes-256-cbc', config.key),
        deciphered = decipher.update(will, 'hex', 'utf8'),
        decrypted = deciphered + decipher.final('utf8');

    return decrypted;
}

/**
 * 收集分页所需数据
 * @param {Number} page 当前请求的页码
 * @param {Number} totalCount 总页数
 */
function pagination(page, totalCount){
    var pageRange = config.pageRange;
        showNum = pageRange * 2 + 1, // 页码显示个数
        currentRange = Math.ceil(page / showNum); // 当前区间，从1开始

    //var pageStartNum = (currentRange - 1) * showNum; // 开始

    return {
        totalPage: totalCount,
        currentPage: page,
        pageRange: pageRange,
        last: Math.min(currentRange * showNum, totalCount)
    };
}

/**
 * 消息推送
 * @param {String} user 推送目标用户
 * @param {Object} params 推送消息主体
 * @param {Function} callback 回调
 */
function pushMessage(user, params, callback){
    user.message.push(params);
    user.newMessage += 1;
    user.save(function(err){
        if(err) return err;
        if(callback) callback();
    });
}

/**
 * 返回错误（异步）
 * @param {Object} res 响应
 * @param {String} msg 错误信息
 */
function showErrAsyc(res, msg){
    res.json({
        success: false,
        data: msg
    });
}

module.exports = {
    checkUserStatus: checkUserStatus,
    checkUserStatusAsync: checkUserStatusAsync,
    checkAdmin: checkAdmin,
    checkAdminAsyc: checkAdminAsyc,
    encrypt: encrypt,
    decrypt: decrypt,
    pagination: pagination,
    pushMessage: pushMessage,
    random: random,
    timeBucket: timeBucket,
    showErrAsyc: showErrAsyc
};