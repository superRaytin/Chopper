/**
 * model - user.
 * User: raytin
 * Date: 13-3-27
 * Time: 下午2:08
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    util = require('../util');

var userSchema = new Schema({
    name: {type: String, index: true},
    nickName: {type: String, default:'-'},
    pass: {type: String},
    email: {type: String},
    sign: {type: String, default: '-'},
    //pic: {type: String},
    lastLogin_time: {type: String, default: util.formatDate(new Date())},

    topic_count: {type: Number, default: 0},
    collecting: [String],
    followed: [String],
    follower: [String]

});

mongoose.model('User', userSchema);
