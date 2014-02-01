var http = require("http"),
  connect = require("connect"),
  express = require("express"),
  path = require("path"),
  _ = require("underscore"),
  consolidate = require("consolidate"),
  share = require("share");


//Share.js

var shareServer = connect();




// Main server

var app = express();

var options = {db:{type:"redis"}};
share.server.attach(app, options);

app.engine("html", consolidate.underscore);
app.set("view engine", "html");
app.set("views", path.join(__dirname, "templates"));


var oneDay = 86400000;
console.log(path.join(__dirname + "../public"));
app.use(
  connect.static(path.join(__dirname + "/../public"), { maxAge: oneDay })
);

app.get("/edit/:file", function(req, res){

  res.render("edit.html");

});

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