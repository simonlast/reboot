(function(){

  // Setup db interface
  var db = {};
  var socket = io.connect(window.location.href);

  db.get = function(id, callback){
    if(window.debug)
      console.log("get: ", id);
    socket.emit("get", {id: id}, function(value){
      callback(value.value, value.err);
    });
  };

  db.set = function(id, value){
    if(window.debug)
      console.log("set: ", id);
    var data = {
      id: id,
      value: value
    };
    socket.emit("set", data);
  };


  // Setup require interface.

  var tryEval = function(str){
    var error = null;
    var fn = null;

    try{
      fn = window.eval("(function(){" + str + "})");
    }catch(e){
      fn = function(){};

      if(window.debug)
        console.log("eval failed: ", e);
    }
    return fn;
  };

  var require = function(id, callback){
    if(window.debug)
      console.log("require: ", id);

    db.get(id, function(value){
      var fn = tryEval(value);
      if(typeof callback === "function"){
        callback(fn);
      }
    });
  };

  var run = function(id, callback){
    if(window.debug)
      console.log("run: ", id);

    require(id, function(fn){
      fn();
      if(typeof callback === "function"){
        callback(fn);
      }
    });
  };

  var bootstrap = function(){
    run("main");
  };

  socket.on("connect", function(){
    bootstrap();
  });
  
  window.db = db;
  window.require = require;
  window.run = run;
})();