/**
 * index.
 * User: raytin
 * Date: 13-3-27
 * Time: 下午6:05
 */
var mongoose = require('mongoose'),
    config = require('../config').config;

mongoose.connect(config.db, function(err){
    if(err){
        console.log('connect to %s error:', config.db, err.message);
        process.exit(1);
    }
});

require('./user');

exports.User = mongoose.model('User');