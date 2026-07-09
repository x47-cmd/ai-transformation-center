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

    if (!window.ATCRouter) {
      console.error("ATC Error: ATCRouter not loaded.");
      return;
    }

    ATCRouter.render("dashboard");

    console.log("AI Transformation Center started successfully.");
  }

  ready(initApp);
})();

/* =========================================================
   AI Work - App Core V1
   Module Loader
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.App = {
  currentModule: "ideas",

  routes: {
    ideas: {
      id: "ideas",
      title: "الأفكار",
      container: "page-ideas"
    },
    projects: {
      id: "projects",
      title: "المشاريع",
      container: "page-projects"
    },
    strategy: {
      id: "strategy",
      title: "الاستراتيجية",
      container: "page-strategy"
    }
  },

  init() {
    this.prepareContainers();
    this.bindNavigation();

    const saved = localStorage.getItem("aiwCurrentModule") || "ideas";
    this.go(saved);
  },

  prepareContainers() {
    const main = document.getElementById("appMain") || document.querySelector("main");
    if (!main) return;

    Object.values(this.routes).forEach(route => {
      if (!document.getElementById(route.container)) {
        const section = document.createElement("section");
        section.id = route.container;
        section.className = "aiw-page";
        main.appendChild(section);
      }
    });
  },

  go(moduleId) {
    if (!this.routes[moduleId]) moduleId = "ideas";

    document.querySelectorAll(".aiw-page").forEach(page => {
      page.classList.remove("active");
    });

    const route = this.routes[moduleId];
    const container = document.getElementById(route.container);

    if (container) {
      container.classList.add("active");
      AIW.Modules[moduleId]?.render(container);
    }

    this.currentModule = moduleId;
    localStorage.setItem("aiwCurrentModule", moduleId);

    window.dispatchEvent(new CustomEvent("aiw:moduleChanged", {
      detail: { moduleId, route }
    }));
  },

  bindNavigation() {
    document.addEventListener("click", e => {
      const btn = e.target.closest("[data-module]");
      if (!btn) return;

      this.go(btn.dataset.module);
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  AIW.App.init();
});