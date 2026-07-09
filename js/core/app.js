/* =========================================================
   AI Work - App Core V1.5
   Enterprise Router + 7 Modules
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.App = {
  version: "1.5",
  currentModule: "dashboard",

  routes: {
    dashboard: {
      id: "dashboard",
      title: "الرئيسية",
      subtitle: "Executive Dashboard",
      container: "page-dashboard",
      icon: "🏠"
    },
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
      subtitle: "AI Use Case Catalog",
      container: "page-ideas",
      icon: "💡"
    },
    governance: {
      id: "governance",
      title: "الحوكمة",
      subtitle: "Responsible AI Governance",
      container: "page-governance",
      icon: "🏛️"
    },
    maturity: {
      id: "maturity",
      title: "النضج",
      subtitle: "AI Maturity Center",
      container: "page-maturity",
      icon: "🧠"
    },
    reports: {
      id: "reports",
      title: "التقارير",
      subtitle: "Executive Reports & Analytics",
      container: "page-reports",
      icon: "📊"
    }
  },

  init() {
    this.prepareContainers();
    this.bindNavigation();
    this.bindHashRouting();

    const fromHash = this.getRouteFromHash();
    const saved = localStorage.getItem("aiwCurrentModule");
    const startModule = this.routes[fromHash] ? fromHash : this.routes[saved] ? saved : "dashboard";

    this.go(startModule, { silent: true });
    this.hideLoading();
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
        section.setAttribute("role", "region");
        section.setAttribute("aria-label", route.title);
        section.setAttribute("aria-hidden", "true");
        main.appendChild(section);
      }
    });
  },

  go(moduleId, options = {}) {
    if (!this.routes[moduleId]) moduleId = "dashboard";

    const route = this.routes[moduleId];

    document.querySelectorAll(".aiw-page").forEach(page => {
      page.classList.remove("active");
      page.setAttribute("aria-hidden", "true");
    });

    const container = document.getElementById(route.container);

    if (container) {
      container.classList.add("active");
      container.setAttribute("aria-hidden", "false");

      if (AIW.Modules[moduleId] && typeof AIW.Modules[moduleId].render === "function") {
        try {
          AIW.Modules[moduleId].render(container);
        } catch (error) {
          console.error("AIW Module Render Error:", moduleId, error);
          this.renderErrorModule(container, route, error);
        }
      } else {
        this.renderMissingModule(container, route);
      }
    }

    this.currentModule = moduleId;
    localStorage.setItem("aiwCurrentModule", moduleId);

    if (!options.skipHash) {
      history.replaceState(null, "", `#${moduleId}`);
    }

    this.updateHeader(route);
    this.updateNav(moduleId);

    if (!options.silent) {
      this.toast(`تم فتح ${route.title}`);
    }

    window.dispatchEvent(
      new CustomEvent("aiw:routeChanged", {
        detail: { moduleId, route }
      })
    );

    window.dispatchEvent(
      new CustomEvent("atc:routeChanged", {
        detail: { moduleId, route }
      })
    );
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
          <small>V${this.version}</small>
        </div>
      </div>
    `;
  },

  updateNav(moduleId) {
    document.querySelectorAll("[data-module]").forEach(btn => {
      const isActive = btn.dataset.module === moduleId;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-current", isActive ? "page" : "false");
    });
  },

  bindNavigation() {
    document.addEventListener("click", e => {
      const btn = e.target.closest("[data-module]");
      if (!btn) return;

      e.preventDefault();
      this.go(btn.dataset.module);
    });
  },

  bindHashRouting() {
    window.addEventListener("hashchange", () => {
      const route = this.getRouteFromHash();

      if (route && route !== this.currentModule) {
        this.go(route, { skipHash: true });
      }
    });
  },

  getRouteFromHash() {
    return String(location.hash || "").replace("#", "").trim();
  },

  toast(message) {
    const root = document.getElementById("toastContainer");
    if (!root || !message) return;

    const el = document.createElement("div");
    el.className = "aiw-toast";
    el.textContent = message;

    root.appendChild(el);

    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
    }, 1800);

    setTimeout(() => {
      el.remove();
    }, 2300);
  },

  hideLoading() {
    const loading = document.getElementById("loadingScreen");
    if (!loading) return;

    loading.classList.remove("active");
    loading.setAttribute("aria-hidden", "true");
  },

  showLoading() {
    const loading = document.getElementById("loadingScreen");
    if (!loading) return;

    loading.classList.add("active");
    loading.setAttribute("aria-hidden", "false");
  },

  renderMissingModule(container, route) {
    container.innerHTML = `
      <section class="module-page">
        <div class="aiw-card aiw-empty">
          <div class="aiw-empty-icon">${route.icon}</div>
          <h2>${route.title}</h2>
          <p>هذا القسم موجود في التنقل، لكن ملف الموديول غير جاهز أو غير محمل.</p>
        </div>
      </section>
    `;
  },

  renderErrorModule(container, route, error) {
    container.innerHTML = `
      <section class="module-page">
        <div class="aiw-card aiw-empty">
          <div class="aiw-empty-icon">⚠️</div>
          <h2>تعذر تحميل ${route.title}</h2>
          <p>حدث خطأ أثناء تحميل هذا القسم. راجع Console لمعرفة التفاصيل.</p>
          <small>${error && error.message ? error.message : "Unknown error"}</small>
        </div>
      </section>
    `;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  AIW.App.init();
});