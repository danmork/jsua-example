require("babel-polyfill");
var jsua = require("jsua");
var lynx = require("jsua-lynx");

function rootAttacher(result) {
  var contentContainer = document.querySelector("#content");
  if (!contentContainer) return;

  function attachViewToRoot() {
    var detachedViews = [];
    
    while (contentContainer.firstElementChild) {
      detachedViews.push(contentContainer.removeChild(contentContainer.firstElementChild));
    }

    contentContainer.appendChild(result.view);
    
    return detachedViews;
  }
  
  return {
    attach: attachViewToRoot
  };
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

function select(selector) {
  return function (result) {
    var results = [];
    if (result.view.matches(selector)) results.push(result.view);
    return results.concat(Array.from(result.view.querySelectorAll(selector)));
  };
}


jsua.attaching.register("root-attacher", rootAttacher);
jsua.building.register("application/lynx+json", lynx.building.build);
jsua.building.register("image/*", imageViewBuilder);
jsua.building.register("text/*", textViewBuilder);
jsua.building.register("*/*", genericViewBuilder);
