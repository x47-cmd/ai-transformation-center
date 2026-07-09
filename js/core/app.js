/* =========================================================
   AI Transformation Center
   Core App Bootstrap
   Enterprise Foundation V2
========================================================= */

(function () {
  "use strict";

  const ATCApp = {
    version: "2.0.0",

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
      this.bindNavigation();
      this.loadInitialRoute();
      window.ATCNotifications?.success?.("Enterprise Foundation V2 جاهزة");
      console.log("ATC Enterprise Foundation V2 initialized");
    },

    bindNavigation() {
      document.querySelectorAll("[data-route]").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const route = item.getAttribute("data-route");
          this.go(route);
        });
      });
    },

    loadInitialRoute() {
      const hash = location.hash.replace("#", "");
      const route = hash || "dashboard";
      this.go(route, false);
    },

    go(route, updateHash = true) {
      if (!this.routes[route]) {
        route = "dashboard";
      }

      document.querySelectorAll("[data-page]").forEach((page) => {
        page.classList.remove("active");
        page.hidden = true;
      });

      const target = document.querySelector(`[data-page="${route}"]`);

      if (target) {
        target.classList.add("active");
        target.hidden = false;
      }

      document.querySelectorAll("[data-route]").forEach((item) => {
        item.classList.toggle(
          "active",
          item.getAttribute("data-route") === route
        );
      });

      if (updateHash) {
        location.hash = route;
      }

      document.dispatchEvent(new CustomEvent("atc:routeChanged", {
        detail: { route }
      }));
    }
  };

  window.ATCApp = ATCApp;

  document.addEventListener("DOMContentLoaded", () => {
    ATCApp.init();
  });
})();