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

    db.put(data.id, data.value);
    socket.broadcast.emit("watch", data);

  });

  socket.on("get", function(data, fn){

    db.get(data.id, function (err, value) {
      if(err){
        fn({err: "not found"});
      }else{
        fn({value: value});
      }
    });

  });

  socket.on("all", function(data, fn){
    var keys = [];

    db.createKeyStream()
      .on("data", function (data) {
        keys.push(data);
      })
      .on("end", function(){
        fn(keys);
      });

  });

  socket.on("remove", function(data){
    db.del(data.id);
  });

});

server.listen(process.argv[2] || 80);