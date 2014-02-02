var http      = require("http"),
  fs          = require("fs"),
  path        = require("path"),
  _           = require("underscore"),
  connect     = require("connect"),
  express     = require("express"),
  consolidate = require("consolidate"),
  share       = require("share");


var app = express();


// Setup ShareJS
var options = {db:{type:"redis"}};
share.server.attach(app, options);


// Templates
app.engine("html", consolidate.underscore);
app.set("view engine", "html");
app.set("views", path.join(__dirname, "templates"));


// Static
var oneDay = 86400000;
app.use(
  connect.static(path.join(__dirname + "/../public"), { maxAge: oneDay })
);


// Backup
var backupFolder = path.join(__dirname, "/backup");

saveSnapshot = function(docName, snapshot){
  var docFolder = path.join(backupFolder, "/" + docName);

  fs.mkdir(docFolder, function(err){
    var backupFile = "/" + new Date().toString();

    fs.writeFile(path.join(docFolder, backupFile), snapshot, "utf8", function(err){
      if(err){
        console.log("Backup err: ", err);
      }
    });

  });

};

var backup = function(docName){
  getSnapshot(docName, function(err, snapshot){

    if(snapshot){
      saveSnapshot(docName, snapshot);
    }

  });
};


var getSnapshot = function(docName, callback){
  app.model.getSnapshot(docName, function(err, data){

    if(err){
      return callback(err);
    }

    if(data && data.snapshot){
      return callback(undefined, data.snapshot);
    }

    return callback(undefined);

  });
};


app.get("/", function(req, res){
  res.redirect("/index.html");
});


// Editor
app.get("/edit/:docName", function(req, res){
  res.render("edit.html");

  backup(req.params.docName);
});


var contentTypes = {
  "html": "text/html",
  "js"  : "text/javascript",
  "css" : "text/css"
};

var getContentType = function(docName){
  var dots = docName.split(".");
  var type = dots[dots.length-1];

  return contentTypes[type] || "text/html";
};


// Viewer
app.get("/:docName", function(req, res){
  var docName = req.params.docName;

  getSnapshot(docName, function(err, snapshot){

    if(snapshot){
      var contentType = getContentType(docName);
      res.setHeader("Content-Type", contentType);
      res.send(snapshot);
    }else{
      res.send(404);
    }

  });

});


var server = http.createServer(app);
server.listen(process.argv[2] || 80);