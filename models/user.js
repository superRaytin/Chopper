/**
 * model - user.
 * User: raytin
 * Date: 13-3-27
 * Time: 下午2:08
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var userSchema = new Schema({
    name: {type: String, index: true},
    nickName: {type: String},
    pass: {type: String},
    email: {type: String},
    sign: {type: String},
    head: {type: String},
    lastLogin_time: {type: String, default: '0'}, // 最后登录时间

    topic_count: {type: Number, default: 0}, // 吐槽数
    collecting: [String], // 收藏
    followed: [String], // 关注
    fans: [String] // 粉丝
});

mongoose.model('User', userSchema);
