/**
 * 控制器.
 * User: raytin
 * Date: 13-3-27
 */
var user = require("../controllers/user"),
    topic = require("../controllers/topic"),
    category = require("../controllers/category"),
    sign = require("../controllers/sign"),
    message = require("../controllers/message"),
    home = require("../controllers/home");

module.exports = {
    home: home,
    user: user,
    topic: topic,
    category: category,
    sign: sign,
    message: message
};