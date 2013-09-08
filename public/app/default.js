'<input type=\"text\" id=\"file-id\" placeholder=\"file id\"><textarea id=\"file\" style=\"padding: 12px; border: 1px solid gray;\"></textarea>'

'function(){ db.get(\"base-html\", function(html){ $(document.body).append($(html)) }); require(\"input-listener\", function(listener){ listener(); }); require(\"textarea-listener\", function(listener){ listener(); }); }'

'function (){ var textarea = $(\"#file\"); $(\"#file-id\").on(\"input\", function(e){ textarea[0].value = \"\"; var id = this.value; db.get(id, function(value){ textarea[0].value = value; }); }); }'

'function(){ var textarea = $(\"#file\");  var input = $(\"#file-id\"); textarea.on(\"input\", function(){ var value = textarea[0].value; var filename = input[0].value; if(filename.length > 0){ db.set(filename, value) } })}'

function(){ 
  db.get("base-html", function(html){ 
    $(document.body).append($(html)) 
  });
  db.get("codemirror-css", function(css){ 
    $(document.body).append($(css))
  });
  
  run("codemirror", function(){
    run("codemirror-js", function(){
      // var editor = CodeMirror.fromTextArea($("#file")[0], {
      //   mode: "javascript"
      // });
    });
  });
  run("input-listener");
  run("textarea-listener");