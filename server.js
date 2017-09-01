var express = require("express");
var app = express();
var echoResponseBody = {
  spec: {
    hints: [ "container" ],
    children: [
      { name: "heading", hints: [ "text" ] },
      { name: "request", hints: [ "text" ] },
      { name: "return", hints: [ "link" ], children: [ { name: "label", hints: [ "label", "text" ] } ] }
    ]
  },
  value: {
    heading: "ECHO Handler",
    request: "",
    return: {
      label: "Return",
      href: "/content-samples/",
      type: "application/lynx+json"
    }
  }
};

express.static.mime.define({
  "application/lynx+json": ["lnx"],
  "application/lynx-spec+json": ["lnxs"]
});

function echo(req, res) {
  res.writeHead(200, { "content-type": "application/lynx+json" });
  
  var requestContent = req.method + " " + req.url + " " + req.httpVersion + "\n";
  
  for (var h in req.headers) {
    requestContent += h + ": " + req.headers[h] + "\n";
  }
  
  requestContent += "\n";
  
  req.on("end", function () {
    echoResponseBody.value.request = requestContent;
    res.end(JSON.stringify(echoResponseBody));
  });
  
  req.on("data", function (chunk) {
    requestContent += chunk;
  });
}

app.get("/echo", echo);
app.post("/echo", echo);
app.put("/echo", echo);
app.delete("/echo", echo);

app.use(express.static("out", { index: [ "index.html", "index.lnx" ] }));

app.listen(3000, function () {
  console.log("JSUA Example app is listening on port 3000...");
});
