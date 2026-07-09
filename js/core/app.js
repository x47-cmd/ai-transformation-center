/* =========================================================
   AI Transformation Center
   Core App Bootstrap
   Version 1.0 Foundation
========================================================= */

(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function initApp() {
    const app = document.getElementById("app");

    if (!app) {
      console.error("ATC Error: #app container not found.");
      return;
    }

    if (!window.ATCShell) {
      console.error("ATC Error: ATCShell not loaded.");
      return;
    }

    app.innerHTML = ATCShell.render();

    console.log("AI Transformation Center started successfully.");
  }

  ready(initApp);
})();