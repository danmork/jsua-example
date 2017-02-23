require("babel-polyfill");
var jsua = require("jsua");
var views = require("jsua/lib/views");
var lynx = require("jsua-lynx");

function isAttached(view) {
  if (!view) throw new Error("'view' param is required.");
  return view.parentElement !== null;
}

function rootAttacher(result) {
  var contentContainer = document.querySelector("#content");
  if (!contentContainer) return;
  
  while (contentContainer.firstElementChild) {
    contentContainer.removeChild(contentContainer.firstElementChild);
  }
  
  contentContainer.appendChild(result.view);
}

function genericViewBuilder(content) {
  return new Promise(function (resolve, reject) {
    var view = document.createElement("object");
    view.data = content.url;
    view.type = content.blob.type;
    resolve(view);
  });
}

views.attaching.setIsAttached(isAttached);
views.attaching.register("root-attacher", rootAttacher);
views.building.register("application/lynx+json", lynx.building.build);
views.building.register("*/*", genericViewBuilder);
