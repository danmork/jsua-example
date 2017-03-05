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

function selectDown(view, selector) {
  var matches = view.querySelectorAll(selector);
  matches = Array.prototype.slice.call(matches);
  if (view.matches(selector)) matches.push(view);
  return matches;
}

function selectUp(view, selector) {
  var contentContainer = document.querySelector("#content");
  var currentView = view;
  var matches = [];
  
  while (currentView !== contentContainer) {
    if (currentView.matches(selector)) matches.push(currentView);
    currentView = currentView.parentElement;
  }
  
  return matches;
}

function lynxLinkClickBehavior(result) {
  if (result.content.blob.type.indexOf("application/lynx+json") === -1) return;
  
  var linkViews = selectDown(result.view, "[data-lynx-hints~=link]");
  
  linkViews.forEach(function (linkView) {
    linkView.addEventListener("click", function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      jsua.fetch(linkView.href);
    });
  });
}

function lynxSubmitClickBehavior(result) {
  if (result.content.blob.type.indexOf("application/lynx+json") === -1) return;
  
  var submitViews = selectDown(result.view, "[data-lynx-hints~=submit]");
  
  submitViews.forEach(function (submitView) {
    submitView.addEventListener("click", function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      var options = {};
      // TODO: build FormData object
      if (submitView.formMethod) options.method = submitView.formMethod;
      if (submitView.formEnctype) options.enctype = submitView.formEnctype;
      jsua.fetch(submitView.formAction, options);
    });
  });
}

views.attaching.setIsAttached(isAttached);
views.attaching.register("root-attacher", rootAttacher);
views.building.register("application/lynx+json", lynx.building.build);
views.building.register("*/*", genericViewBuilder);
views.finishing.register("lynx.link.behavior", lynxLinkClickBehavior);
views.finishing.register("lynx.submit.behavior", lynxSubmitClickBehavior);
