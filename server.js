//server.js

const http = require("http");
function keepServer(){
try {
http.createServer(function(req, res) {
  res.write("OK！");
  res.end();
}).listen(8080);
} catch(e){console.log('エラーが発生しました。\nエラー内容:'+e)}

  console.log("keepServer起動")
}

module.exports = {
  keepServer,
}