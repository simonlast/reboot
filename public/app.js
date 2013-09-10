(function(){

  // Setup db interface
  var db = {};
  var socket = io.connect(window.location.href);


  //////////// UTIL //////////////////////////////

  var Getter = function(ids, callback){
    this.ids = ids;
    this.callback = callback;
    this.returned = 0;

    for(var i=0; i<this.ids.length; i++){
      this.get(i, this.ids[i], callback);
    }
  };


  Getter.prototype.get = function(index, id, callback){
    this.ids[index] = undefined;
    var getter = this;
    get(id, function(value, err){
      if(typeof err === "string"){
        getter.ids.push(err);
        callback.apply(null, getter.ids);
        return;
      }

      getter.returned++;
      getter.ids[index] = value;

      if(getter.returned == getter.ids.length && typeof callback === "function"){
        callback.apply(null, getter.ids);
      }
    });
  };


  var splitArgs = function(argumentsObject){
    var args = Array.prototype.slice.call(argumentsObject);
    if(args.length === 0){
      return;
    }

    var ids = [];
    var callback = null;

    var lastArgument = args[args.length-1];
    if(typeof lastArgument === "function"){
      callback = lastArgument;
      ids = args.splice(0, args.length-1);
    }else{
      ids = args;
    }

    return {
      ids: ids,
      callback: callback
    };

  };


  // Low-level get function
  get = function(id, callback){
    if(window.debug)
      console.log("get: ", id);
    socket.emit("get", {id: id}, function(value){
      callback(value.value, value.err);
    });
  };


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


  //////////// API //////////////////////////////

  db.get = function(){
    var split = splitArgs(arguments);
    new Getter(split.ids, split.callback);
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
  var require = function(){
    var split = splitArgs(arguments);

    if(window.debug)
      console.log("require: ", split.ids);

    var requireCallback = function(){
      var args = Array.prototype.slice.call(arguments);
      for(var i=0; i<args.length; i++){
        args[i] = tryEval(args[i]);
      }

      if(typeof split.callback === "function"){
        split.callback.apply(null, args);
      }
    };
    
    new Getter(split.ids, requireCallback);
  };


  var run = function(){
    var split = splitArgs(arguments);

    if(window.debug)
      console.log("run: ", split.ids);

    var runCallback = function(){
      var args = Array.prototype.slice.call(arguments);
      for(var i=0; i<args.length; i++){
        args[i]();
      }

      if(typeof split.callback === "function"){
        split.callback.apply(null, args);
      }
    };
    
    split.ids.push(runCallback);
    require.apply(null, split.ids);
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