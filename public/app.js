(function(){

  //////////// VAR ////////////////////////////////

  var db = {};
  var socket = io.connect(window.location.href);
  var connected = false;
  var watching = [];


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


  // From http://stackoverflow.com/a/1349462
  var randomString = function(len) {
      var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      var randomString = '';
      for (var i = 0; i < len; i++) {
        var randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz,randomPoz+1);
      }
      return randomString;
  };

  
  var changed = function(data){
    for(var i=0; i<watching.length; i++){
      var curr = watching[i];

      if(curr.id === data.id){
        curr.callback(data.value);
      }
    }
  };

  
  var bootstrap = function(){
    db.run("main");
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
    changed(data);
  };


  db.remove = function(){
    for(var i=0; i<arguments.length; i++){
      if(typeof arguments[i] === "string")
        socket.emit("remove", {id: arguments[i]});
    }
  };


  db.require = function(){
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


  db.run = function(){
    var split = splitArgs(arguments);

    if(window.debug)
      console.log("run: ", split.ids);

    var runCallback = function(){
      var args = Array.prototype.slice.call(arguments);
      for(var i=0; i<args.length; i++){
        args[i].apply(window, null);
      }

      if(typeof split.callback === "function"){
        split.callback.apply(null, args);
      }
    };
    
    split.ids.push(runCallback);
    db.require.apply(null, split.ids);
  };


  db.all = function(callback){
    if(window.debug)
      console.log("all");

    socket.emit("all", {}, function(data){
      if(typeof callback === "function"){
        callback(data);
      }
    });
  };


  db.watch = function(id, callback){
    if(typeof callback !== "function"){
      return;
    }

    var descriptor = randomString(14);

    watching.push({
      descriptor: descriptor,
      id: id,
      callback: callback
    });

    return descriptor;
  };


  db.unwatch = function(descriptor){
    var unwatched = false;

    for(var i=0; i<watching.length; i++){
      if(watching[i].descriptor === descriptor){
        watching.splice(i, 1);
        i--;
        unwatched = true;
      }
    }

    return unwatched;
  };


  //////////// INIT //////////////////////////////

  socket.on("watch", changed);


  socket.on("connect", function(){
    if(!connected){
      bootstrap();
      connected = true;
    }
  });


  window.db = db;
})();