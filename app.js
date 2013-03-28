
/**
 * Module dependencies.
 */

var express = require('express'),
    route = require('./routes/route'),
    http = require('http'),
    path = require('path'),
    flash = require('connect-flash'),
    MongoStore = require('connect-mongo')(express),
    config = require('./config').config;

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(flash());
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser(config.cookieSecret));
  app.use(express.session({
      secret: config.sessionSecret,
      store: new MongoStore({
          url: config.db
      })
  }));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

route(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
