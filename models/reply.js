/**
 * model - reply.
 * User: raytin
 * Date: 13-5-7
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var replySchema = new Schema({
    create_time: {type: String},
    topic_id: {type: ObjectId},
    topic_user: {type: String},
    author_id: {type: ObjectId},
    author_name: {type: String},
    content: {type: String}
});

mongoose.model('Reply', replySchema);