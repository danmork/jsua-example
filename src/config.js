import "babel-polyfill";
import es6promise from "es6-promise";
es6promise.polyfill();
import "./array-polyfill";
import "./url-search-params-polyfill";
import "./fetch-polyfill";
import "./iterator-polyfill";
import "./matches-polyfill";

import * as jsua from "@lynx-json/jsua";
import * as lynx from "@lynx-json/jsua-lynx";

function getAppView() {
  return document.body.querySelector("#content");
}

function genericViewBuilder(content) {
  return new Promise(function (resolve, reject) {
    var view = document.createElement("object");
    view.innerHTML = `<p>Unable to display: <a href="${content.url}">${content.url}</a></p>`;
    view.data = content.url;
    view.type = content.blob.type;
    view.setAttribute("data-content-url", content.url);
    view.setAttribute("data-content-type", content.blob.type);
    resolve(view);
  });
}

function catchAllRootAttacher(result) {
  return {
    attach: function () {
      var appView = getAppView();
      var detachedViews = [];
      while (appView.firstChild) {
        detachedViews.push(appView.removeChild(appView.firstChild));
      }
      return detachedViews;
    }
  };
}

jsua.building.register("application/lynx+json", lynx.building.build);
jsua.building.register("*/*", genericViewBuilder);
jsua.attaching.register("lynx-scope-attacher", lynx.attaching.scopeRealmAttacher);
jsua.attaching.register("lynx-root-attacher", lynx.attaching.createRootAttacher(getAppView()));
jsua.attaching.register("catchall-root-attacher", catchAllRootAttacher);



function getCurrentLocation() {
  return document.location.hash.substr(1);
}

function getStartingLocation() {
  if (document.location.hash) {
    return getCurrentLocation();
  }

  return "/content-samples/";
}

window.addEventListener("hashchange", function () {
  jsua.fetch(document.location.origin + getCurrentLocation());
});

jsua.fetch(document.location.origin + getStartingLocation());
