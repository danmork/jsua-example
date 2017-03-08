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

function nearestUp(view, selector) {
  var contentContainer = document.querySelector("#content");
  var currentView = view;

  while (currentView !== contentContainer) {
    if (currentView.matches(selector)) return currentView;
    currentView = currentView.parentElement;
  }

  return null;
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

      var formAction = submitView.formAction;
      var formMethod = submitView.formMethod && submitView.formMethod.toUpperCase() || "GET";
      var formEnctype = submitView.formEnctype || "application/x-www-form-urlencoded";
      var options = {
        method: formMethod
      };

      var form = nearestUp(submitView, "[data-lynx-hints~=form]");

      if (form) {
        var formData;

        if (formEnctype === "multipart/form-data") {
          formData = new FormData();
        } else {
          formData = new URLSearchParams();
        }

        selectDown(form, "[data-lynx-input=true]").forEach(function (inputView) {
          // TODO: container inputs
          if (inputView.matches("[data-lynx-hints~=text]")) {
            formData.append(inputView.name, inputView.value);
          } else if (inputView.matches("[data-lynx-hints~=content]")) {
            formData.append(inputView.name, inputView.getValue());
          }
        });

        if (formMethod === "POST" || formMethod === "PUT") {
          options.body = formData;
        } else {
          var temp = document.createElement("a");
          temp.href = formAction;
          temp.search = formData.toString();
          formAction = temp.href;
        }
      }

      jsua.fetch(formAction, options);
    });
  });
}

views.attaching.setIsAttached(isAttached);
views.attaching.register("root-attacher", rootAttacher);
views.building.register("application/lynx+json", lynx.building.build);
views.building.register("image/*", imageViewBuilder);
views.building.register("text/*", textViewBuilder);
views.building.register("*/*", genericViewBuilder);
views.finishing.register("lynx.link.behavior", lynxLinkClickBehavior);
views.finishing.register("lynx.submit.behavior", lynxSubmitClickBehavior);
