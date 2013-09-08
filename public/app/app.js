(function(){

  var tryEval = function(str){
    var error = null;
    var fn = null;

    try{
      fn = window.eval("(" + str + ")");
    }catch(e){
      fn = function(){};

      console.log("eval failed: ", e);
    }
    return fn;
  };

  var require = function(id, callback){

    console.log("require ", id);

    db.get(id, function(value){
      var fn = tryEval(value);
      if(typeof callback === "function"){
        callback(fn);
      }
    });
  };

  var run = function(id, callback){
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

  bootstrap();
  window.require = require;
  window.run = run;
})();