
var http = require('http'),
	connect = require('connect'),
	express = require('express'),
	sio = require('socket.io'),
  levelup = require('levelup'),
  path = require("path");

var app = express();
var db = levelup(path.join(__dirname, 'db'));

var oneDay = 86400000;

app.use(
  connect.static(__dirname + '/../public', { maxAge: oneDay })
);

var server = http.createServer(app);

var io = sio.listen(server, {log: false});

io.sockets.on("connection", function(socket){

  socket.on("set", function(data){

    db.put(data.id, data.value, function (err) {
      if(err){
        console.log("error: PUT ", data.id);
      }
    });

  });

  socket.on("get", function(data, fn){

    db.get(data.id, function (err, value) {
      if(err){
        console.log("error: GET ", data.id);
        fn({err: "not found"});
      }else{
        fn({value: value});
      }
    });

  });

});

server.listen(80);