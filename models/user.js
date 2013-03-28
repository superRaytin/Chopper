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
    pass: {type: String},

    topic_count: {type: Number, default: 0}
});

mongoose.model('User', userSchema);
