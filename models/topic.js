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
    top: {type: Boolean, default: false},
    create_time: {type: String},
    author_id: {type: ObjectId},
    author_name: {type: String},

    reply_count: {type: Number, default: 0},
    support: {type: String, default: 0},
    down: {type: String, default: 0},
    topic_Type: {type: String}
});

mongoose.model('Topic', topicSchema);