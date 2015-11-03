var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');

// var sessions
// app.use(sessions())
var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

var checkUser = function(req, res, next){
  //... do somethingh

  // if it passes
    // invoke next()
  // else
    // do something else with response object
    // *redirect*
  next();
};

app.get('/sd', function(req, res, next){
  // check if cookie is a valid cookie === true
    // go onto the next middleware
    next();
  // else
    // res.send('your cookie is bad, sending you back to index.html')
}, function(req, res, next){
  // check it see if cookie is an admin
    // if admin, go to next
    next();
  // else if not admin
    // res.send('you are not admin, sending you back to index.html')
}, function(req, res, next){
  // 
  res.send('You are admin');
});

app.get('/', checkUser, 
function(req, res) {
  res.render('index');
});

app.get('/create', checkUser,
function(req, res) {
  res.render('index');
});

/////// Creating a new user
app.post('/signup',
function(req, res) {
    console.log('INSIDE MAKING A NEW USER ROUTER');
    console.log(req.body.username);
    // hash the password
    var newUser = new User({
      'username': req.body.username,
      'password': req.body.password
    });

    newUser.save().then(function(body) {
      res.writeHeader(302)
      res.send(body);    
    });

  });

app.post('/login',
  function(req, res) {
    res.end(); //retrieve user from username
  }
);

app.get('/links', checkUser,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', checkUser,
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          base_url: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits')+1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
