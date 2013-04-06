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
    //pic: {type: String},
    lastLogin_time: {type: String, default: '0'},

    topic_count: {type: Number, default: 0},
    collecting: [String],
    followed: [String],
    follower: [String]
});

mongoose.model('User', userSchema);
