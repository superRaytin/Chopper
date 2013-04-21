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

    top: {type: Boolean, default: false}, // 是否置顶
    replys: [String], // 吐槽的评论们
    replyTo: {type: String}, // 此为评论，指向评论发生的吐槽
    replyCount: {type: Number, default: 0}, // 评论数
    support: {type: Number, default: 0}, // 赞
    down: {type: Number, default: 0}, // 踩
    topic_Type: {type: String} // 所属话题
});

mongoose.model('Topic', topicSchema);