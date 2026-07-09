/* =========================================================
   AI Transformation Center
   Core App Bootstrap V3
========================================================= */

(function () {
  "use strict";

  const ATCApp = {
    version: "3.0.0",

    routes: {
      dashboard: "dashboard",
      strategy: "strategy",
      projects: "projects",
      ideas: "ideas",
      governance: "governance",
      maturity: "maturity",
      reports: "reports",
      kpis: "kpis",
      business: "business",
      automation: "automation",
      decision: "decision",
      settings: "settings"
    },

    init() {
      this.main = document.getElementById("appMain");
      this.bindNavigation();
      this.loadInitialRoute();
      console.log("ATC Core App V3 initialized");
    },

    bindNavigation() {
      document.querySelectorAll("[data-route]").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          this.go(item.getAttribute("data-route"));
        });
      });
    },

    loadInitialRoute() {
      const route = location.hash.replace("#", "") || "dashboard";
      this.go(route, false);
    },

    go(route, updateHash = true) {
      if (!this.routes[route]) route = "dashboard";

      document.querySelectorAll("[data-route]").forEach((item) => {
        item.classList.toggle("active", item.getAttribute("data-route") === route);
      });

      if (updateHash) location.hash = route;

      this.renderModule(route);

      document.dispatchEvent(new CustomEvent("atc:routeChanged", {
        detail: { route }
      }));
    },

    renderModule(route) {
      if (!this.main) return;

      const module = window.AIW?.Modules?.[route];

      if (module && typeof module.render === "function") {
        module.render(this.main);
        return;
      }

      this.main.innerHTML = `
        <section class="v3-dashboard-page">
          <article class="v3-small-panel">
            <h3>قيد التطوير</h3>
            <strong>${route}</strong>
            <p>هذه الصفحة سيتم تحديثها بتصميم V3 لاحقاً.</p>
          </article>
        </section>
      `;
    }
  };

  window.ATCApp = ATCApp;

  document.addEventListener("DOMContentLoaded", () => {
    ATCApp.init();
  });
})();