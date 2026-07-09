/* =========================================================
   AI Work - App Core V1.1
   Module Loader + Header + Navigation State
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.App = {
  currentModule: "ideas",

  routes: {
    ideas: {
      id: "ideas",
      title: "الأفكار",
      subtitle: "Innovation Pipeline",
      container: "page-ideas"
    },
    projects: {
      id: "projects",
      title: "المشاريع",
      subtitle: "Execution Center",
      container: "page-projects"
    },
    strategy: {
      id: "strategy",
      title: "الاستراتيجية",
      subtitle: "Executive Strategy",
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
    const main = document.getElementById("appMain");
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

    const route = this.routes[moduleId];

    document.querySelectorAll(".aiw-page").forEach(page => {
      page.classList.remove("active");
    });

    const container = document.getElementById(route.container);

    if (container) {
      container.classList.add("active");
      AIW.Modules[moduleId]?.render(container);
    }

    this.currentModule = moduleId;
    localStorage.setItem("aiwCurrentModule", moduleId);

    this.updateHeader(route);
    this.updateNav(moduleId);
  },

  updateHeader(route) {
    const header = document.getElementById("appHeader");
    if (!header) return;

    header.innerHTML = `
      <div class="aiw-header-inner">
        <span>${route.subtitle}</span>
        <h1>${route.title}</h1>
      </div>
    `;
  },

  updateNav(moduleId) {
    document.querySelectorAll("[data-module]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.module === moduleId);
    });
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