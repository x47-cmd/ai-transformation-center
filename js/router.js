/* =========================================================
   Personal Wealth Center - Router V2
========================================================= */

window.PWC = window.PWC || {};

PWC.Modules = {};

PWC.Router = {
  current: "home",

  routes: {
    home: {
      id: "home",
      title: "الرئيسية",
      icon: "⌂",
      el: "page-home"
    },
    portfolio: {
      id: "portfolio",
      title: "المحفظة",
      icon: "◈",
      el: "page-portfolio"
    },
    spending: {
      id: "spending",
      title: "الصرف",
      icon: "◍",
      el: "page-spending"
    },
    assets: {
      id: "assets",
      title: "الثروة",
      icon: "◆",
      el: "page-assets"
    },
    reports: {
      id: "reports",
      title: "التحليل",
      icon: "◎",
      el: "page-reports"
    },
    settings: {
      id: "settings",
      title: "الإعدادات",
      icon: "⚙",
      el: "page-settings"
    }
  },

  register(id, module) {
    PWC.Modules[id] = module;
  },

  init() {
    const saved = localStorage.getItem("pwcCurrentRoute") || "home";
    this.go(saved, false);

    window.addEventListener("hashchange", () => {
      const page = location.hash.replace("#", "") || "home";
      this.go(page);
    });
  },

  go(id, push = true) {
    if (!this.routes[id]) id = "home";

    document.querySelectorAll(".pwc-page").forEach(page => {
      page.classList.remove("active");
    });

    const route = this.routes[id];
    const el = document.getElementById(route.el);
    if (el) el.classList.add("active");

    this.current = id;
    localStorage.setItem("pwcCurrentRoute", id);

    if (push) location.hash = id;

    if (PWC.Modules[id]?.render) {
      PWC.Modules[id].render();
    }

    PWC.Events?.emit("pwc:routeChanged", {
      current: id,
      route
    });
  }
};