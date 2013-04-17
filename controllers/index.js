/**
 * 控制器.
 * User: raytin
 * Date: 13-3-27
 */
var user = require("../controllers/user"),
    topic = require("../controllers/topic"),
    sign = require("../controllers/sign"),
    message = require("../controllers/message"),
    home = require("../controllers/home");

module.exports = {
    home: home,
    user: user,
    topic: topic,
    sign: sign,
    message: message
};