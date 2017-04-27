'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var client = require('../db');

module.exports = router;

function selectTweetsFromDatabase(selectStatement, username, res){

  client.query(selectStatement, function (err, result) {
    if (err) return next(err); // pass errors to Express
    var tweets = result.rows;
    // console.log(tweets);
    res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true, username: username });
  });
}


// a reusable function
function respondWithAllTweets (req, res, next){
  selectTweetsFromDatabase(
    'SELECT * FROM users INNER JOIN tweets ON users.id=tweets.user_id', null, res);

  //var allTheTweets = tweetBank.list();

  // client.query('SELECT * FROM tweets', function (err, result) {
  //   if (err) return next(err); // pass errors to Express
  //   var tweets = result.rows;
  //   res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
  // });

  // res.render('index', {
  //   title: 'Twitter.js',
  //   tweets: allTheTweets,
  //   showForm: true
  // });
}

// here we basically treat the root view and tweets view as identical
router.get('/', respondWithAllTweets);
router.get('/tweets', respondWithAllTweets);

// single-user page
router.get('/users/:username', function(req, res, next){
  // console.log(req.params.username);
  selectTweetsFromDatabase(
    `SELECT *
    FROM users
    INNER JOIN tweets
    ON users.id=tweets.user_id
    WHERE users.name = '${req.params.username}'`, req.params.username, res);

  //var tweetsForName = tweetBank.find({ name: req.params.username });
  // res.render('index', {
  //   title: 'Twitter.js',
  //   tweets: tweetsForName,
  //   showForm: true,
  //   username: req.params.username
  // });
});

// single-tweet page
router.get('/tweets/:id', function(req, res, next){
  selectTweetsFromDatabase(
    `SELECT *
    FROM users
    INNER JOIN tweets
    ON users.id=tweets.user_id
    WHERE tweets.id = '${req.params.id}'`, null, res);

  // var tweetsWithThatId = tweetBank.find({ id: Number(req.params.id) });
  // res.render('index', {
  //   title: 'Twitter.js',
  //   tweets: tweetsWithThatId // an array of only one element ;-)
  // });
});

// create a new tweet
router.post('/tweets', function(req, res, next){
  function insertTweet(user_id, content){
    client.query('INSERT INTO tweets (user_id, content) VALUES ($1, $2)',[user_id, content], function (err, data) {
      res.redirect('/');
    });
  }

  client.query(`SELECT * FROM users
    WHERE users.name = '${req.body.name}'`, function (err, result) {
      if (err) return next(err); // pass errors to Express
      var users = result.rows;
      if (users.length) {
        var id = users[0].id;
        insertTweet(id, req.body.content);
      }
      else {
        client.query('INSERT INTO users (name, picture_url) VALUES ($1, $2) RETURNING *',
        [req.body.name, `http://lorempixel.com/48/48?name=${req.body.name}`], function(err, data) {
          if (err) return next(err);
          console.log(data);
          var newUser = data.rows;
          if(newUser.length) {
            var id = newUser[0].id;
            insertTweet(id, req.body.content);
          }
          else throw new Error('problem inserting new user.');
        });
      }
    });
  });

      //else { client.query('INSERT INTO tweets (userId, content) VALUES ($1, $2)', [10, 'I love SQL!'], function (err, data) {/** ... */}); }
    //var tweets = result.rows;



  //var newTweet = tweetBank.add(req.body.name, req.body.content);


// // replaced this hard-coded route with general static routing in app.js
// router.get('/stylesheets/style.css', function(req, res, next){
//   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
// });
