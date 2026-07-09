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

    app.innerHTML = `
      <main class="atc-shell">
        <section class="atc-hero">
          <div class="atc-badge">V1.0 Foundation</div>
          <h1>مركز التحول المؤسسي بالذكاء الاصطناعي</h1>
          <p>AI Transformation Center</p>
        </section>
      </main>
    `;

    console.log("AI Transformation Center started successfully.");
  }

  ready(initApp);
})();