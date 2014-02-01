var http = require("http"),
  connect = require("connect"),
  express = require("express"),
  path = require("path"),
  _ = require("underscore"),
  consolidate = require("consolidate"),
  share = require("share");


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


// Editor
app.get("/edit/:file", function(req, res){
  res.render("edit.html");
});


// Viewer
app.get("/:file", function(req, res){
  var file = req.params.file;

  app.model.getSnapshot(file, function(err, data){

    if((typeof data !== "undefined") && (typeof data.snapshot !== "undefined")){
      res.setHeader("Content-Type", "text/html");
      res.send(data.snapshot);
    }else{
      res.send(404);
    }

  });

});


var server = http.createServer(app);
server.listen(process.argv[2] || 80);