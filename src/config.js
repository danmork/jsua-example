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

function textViewBuilder(content) {
  return new Promise(function (resolve, reject) {
    var view = document.createElement("pre");
    view.setAttribute("data-content-url", content.url);
    view.setAttribute("data-content-type", content.blob.type);

    var reader = new FileReader();

    reader.onloadend = function (evt) {
      view.textContent = evt.target.result;
    };

    reader.readAsText(content.blob);

    resolve(view);
  });
}

function imageViewBuilder(content) {
  return new Promise(function (resolve, reject) {
    var view = document.createElement("img");
    view.setAttribute("data-content-url", content.url);
    view.setAttribute("data-content-type", content.blob.type);

    if ("URL" in window && "createObjectURL" in URL && "revokeObjectURL" in URL) {
      var src = URL.createObjectURL(content.blob);

      view.addEventListener("load", function () {
        URL.revokeObjectURL(src);
      });

      view.src = src;
    } else {
      var reader = new FileReader();

      reader.onloadend = function (evt) {
        view.src = evt.target.result;
      };

      reader.readAsDataURL(content.blob);
    }

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
jsua.building.register("image/*", imageViewBuilder);
jsua.building.register("text/*", textViewBuilder);
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



jsua.finishing.register("app-history", result => {
  if (!result.view.matches("[data-jsua-context~=app] > [data-content-url]")) return;
  if (result.content.options.history) return;

  var options = {
    method: result.content.options.method || "GET"
  };

  if (result.content.options.body) {
    options.body = serializeBody(result.content.options.body);
  }

  history.pushState(options, null, result.view.getAttribute("data-content-url"));
});

function serializeBody(formdata) {
  var body = [];

  var iterator = formdata.entries();
  var iteration = iterator.next();

  while (!iteration.done) {
    body.push(iteration.value);
    iteration = iterator.next();
  }

  body.push(formdata instanceof FormData);

  return body;
}

function deserializeBody(body) {
  var formdata;

  if (body.pop()) {
    formdata = new FormData();
  } else {
    formdata = new URLSearchParams();
  }

  body.forEach(entry => formdata.append(entry[0], entry[1]));

  return formdata;
}

window.addEventListener("popstate", function (evt) {
  var url = document.location.href;
  var options = evt.state || {};

  options.origin = getAppView();
  options.history = true;

  if (options.body) {
    options.body = deserializeBody(options.body);
  }

  if (options.method && options.method !== "GET") {
    if (confirm("Would you like to resubmit the form?") === false) {
      url = "data:text/plain,Form resubmission was canceled.";
      options = { origin: getAppView() };
    }
  }

  jsua.fetch(url, options);
});

jsua.fetch(document.location.origin + getStartingLocation(), { origin: getAppView() });
