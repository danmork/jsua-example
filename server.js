var express = require("express");
var app = express();

express.static.mime.define({"application/lynx+json": ["lnx"]});
express.static.mime.define({"application/lynx-spec+json": ["lnxs"]});

app.use(express.static("out", { index: [ "index.html", "index.lnx" ] }));

app.listen(3000, function () {
  console.log("JSUA Example app is listening on port 3000...");
});
