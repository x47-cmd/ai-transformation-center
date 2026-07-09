/* =========================================================
   AI Work - App Core V1.2
   Stable Module Loader + Executive Header + Safe Navigation
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.App = {
  currentModule: "strategy",

  routes: {
    strategy: {
      id: "strategy",
      title: "الاستراتيجية",
      subtitle: "Executive Strategy Center",
      container: "page-strategy",
      icon: "🎯"
    },
    projects: {
      id: "projects",
      title: "المشاريع",
      subtitle: "AI Projects Portfolio",
      container: "page-projects",
      icon: "📁"
    },
    ideas: {
      id: "ideas",
      title: "الأفكار",
      subtitle: "AI Innovation Pipeline",
      container: "page-ideas",
      icon: "💡"
    }
  },

  init() {
    this.prepareContainers();
    this.bindNavigation();

    const saved = localStorage.getItem("aiwCurrentModule");
    const startModule = this.routes[saved] ? saved : "strategy";

    this.go(startModule);
  },

  prepareContainers() {
    const main = document.getElementById("appMain");
    if (!main) return;

    Object.values(this.routes).forEach(route => {
      let section = document.getElementById(route.container);

      if (!section) {
        section = document.createElement("section");
        section.id = route.container;
        section.className = "aiw-page";
        main.appendChild(section);
      }
    });
  },

  go(moduleId) {
    if (!this.routes[moduleId]) moduleId = "strategy";

    const route = this.routes[moduleId];

    document.querySelectorAll(".aiw-page").forEach(page => {
      page.classList.remove("active");
    });

    const container = document.getElementById(route.container);

    if (container) {
      container.classList.add("active");

      if (AIW.Modules[moduleId] && typeof AIW.Modules[moduleId].render === "function") {
        AIW.Modules[moduleId].render(container);
      } else {
        this.renderMissingModule(container, route);
      }
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
        <div>
          <span class="aiw-eyebrow">${route.subtitle}</span>
          <h1>${route.icon} ${route.title}</h1>
          <p>مركز تنفيذي لإدارة التحول المؤسسي بالذكاء الاصطناعي</p>
        </div>

        <div class="aiw-header-badge">
          <strong>AI Work</strong>
          <small>V1.2</small>
        </div>
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
  },

  renderMissingModule(container, route) {
    container.innerHTML = `
      <div class="aiw-card aiw-empty">
        <div class="aiw-empty-icon">${route.icon}</div>
        <h2>${route.title}</h2>
        <p>هذا القسم موجود في التنقل، لكن ملف الموديول غير جاهز أو غير محمل.</p>
      </div>
    `;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  AIW.App.init();
});