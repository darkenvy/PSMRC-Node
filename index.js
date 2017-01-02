var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var cookieParser = require('cookie-parser');
var psmrc = require('./psmrc');
var cleanup = require('./cleanup');
var fs = require('fs');


// Cookie creation middleware
app.use(cookieParser());
app.use(function(req, res, next) {
  var cookie = req.cookies ? req.cookies.cookieName : undefined;
  if (cookie === undefined) {
    var randomNumber=Math.random().toString();
    randomNumber=randomNumber.substring(2,randomNumber.length);
    res.cookie('cookieName',randomNumber, { maxAge: 900000, httpOnly: true });
    req.cookies.cookieName = randomNumber;
    console.log('cookie created successfully', randomNumber);
  } else {
    console.log('cookie exists', cookie);
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// ––––––––––– Paths ––––––––––– //

app.get('/', function(req, res){
  console.log('app get / cookie', req.cookies.cookieName);
  // psmrc(res, req.cookies.cookieName);
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

// app.get('/test', function(req, res) {
//   fixNested(req.cookies.cookieName)
//     .then( () => {
//       res.send('done')
//     })
//     .catch( () => 
//       res.send('empty zip file :(') 
//     )
// })

app.get('/download', function(req, res) {
  console.log('initiating PSMRC. Will reply with download link');
  psmrc(res, req.cookies.cookieName);
});

app.post('/upload', function(req, res){
  console.log('Attempting CleanupByExpiration');
  cleanup.cleanByExpiration();

  console.log('UPLOAD COOKIE ', req.cookies);
  var form = new formidable.IncomingForm(); // create an incoming form object
  form.multiples = true; // specify that we want to allow the user to upload multiple files in a single request
  form.uploadDir = path.join(__dirname, '/uploads'); // store all uploads in the /uploads directory

  form.on('file', function(field, file) { 
    fs.rename(file.path, path.join(form.uploadDir, req.cookies.cookieName));
  });

  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  form.on('end', function() { // once all the files have been uploaded, send a response to the client
    res.end('success');
  });

  form.parse(req); // parse the incoming request containing the form data
});

var server = app.listen(8080, function(){
  console.log('Server listening on port 8080');
});