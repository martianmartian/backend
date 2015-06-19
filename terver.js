var express = require('express');
var app = express();





app.get('/', function (req, res) {
  res.send('Hello World!');
});

//Chainable route handlers for a route path
app.use('/book', function (req, res, next) {
  if(req.method=="GET"){console.log('Request Type:', req.method);}
  next();
});

app.get("/book",function(req, res,next) {res.send('Get a random book');next()},
    function(){console.log("this is second function")}
  )
app.post("/book",function(req, res) {
    res.send('Add a book');
  })







var server = app.listen(4000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});