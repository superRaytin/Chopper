/**
 * model - topic.
 * User: raytin
 * Date: 13-3-28
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var topicSchema = new Schema({
    content: {type: String},
    create_time: {type: String},
    author_id: {type: ObjectId},
    author_name: {type: String},

    top: {type: Boolean, default: false},
    reply_count: {type: Number, default: 0},
    support: {type: Number, default: 0},
    down: {type: Number, default: 0},
    topic_Type: {type: String, default: '0'}
});

mongoose.model('Topic', topicSchema);