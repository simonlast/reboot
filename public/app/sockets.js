(function(){
  var db = {};
  var socket = io.connect(window.location.href);

  db.get = function(id, callback){
    console.log("get: ", id);
    socket.emit("get", {id: id}, function(value){
      callback(value.value, value.err);
    });
  };

  db.set = function(id, value){
    console.log("set: ", id);
    var data = {
      id: id,
      value: value
    };
    socket.emit("set", data);
  };


  window.db = db;
})();