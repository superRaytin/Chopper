/**
 * model - category.
 * User: raytin
 * Date: 13-3-28
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var categorySchema = new Schema({
    name: {type: String},
    topics: [],
    count: {type: Number, default: 0}
});

mongoose.model('Category', categorySchema);