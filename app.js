
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var handlebars = require('express3-handlebars');

// Controllers
var homeScreen = require('./routes/home');
var landing = require('./routes/landing');
var house = require('./routes/house');
var mychores = require('./routes/mychores');
var verifychores = require('./routes/verifychores');
var allchores = require('./routes/allchores');
var settings = require('./routes/settings');
var store = require('./routes/store');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', handlebars());
app.set('view engine', 'handlebars');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('PUT THE KEY FOR THIS IN A HIDDEN DOTFILE!'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Add routes here
app.get('/', landing.view);
app.post('/', landing.view);
app.get('/A', landing.viewA);
app.get('/join', function(req,res) {
	return res.redirect('/');
})

app.get('/home', homeScreen.view);
app.get('/mychores', mychores.viewProject);
app.get('/verifychores', verifychores.view);
app.get('/allchores', allchores.viewProject);
app.get('/settings', settings.view);
app.get('/store', store.viewProject);

// Handle POSTS
app.post('/settings', settings.update); // TODO: Temporary hack around the store
app.post('/userdata', house.getUserData);

// POSTs for verifying chores
app.post('/chores/submit', verifychores.submitForVerification);
app.post('/chores/approve', verifychores.approve);
app.post('/chores/reject', verifychores.reject);

// POSTs for house creation/management
app.post('/create', house.create);
app.post('/join', house.join);
app.post('/deal', house.deal);
app.post('/reroll', house.reroll);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
