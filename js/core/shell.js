/* =========================================================
   AI Work - Enterprise Application Shell V2.1
   Scope: Enterprise Biometric Intelligence Platform

   Responsibilities:
   - Stable Application Layout
   - Global Header
   - Desktop Navigation
   - Main Module Container
   - Platform Status
   - Language Toggle
   - Store Synchronization
   - Route Synchronization
   - Global Footer Credit
   - Legacy ATCShell Compatibility
   - No Dashboard Content Duplication
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};

  const Shell = {
    id: "shell",
    version: "2.1.0",

    _initialized: false,
    _eventsBound: false,
    _storeUnsubscribe: null,
    _refreshTimer: null,

    root: null,
    main: null,

    navigationItems: [
      {
        id: "dashboard",
        label: "الرئيسية",
        labelEn: "Dashboard",
        icon: "⌂"
      },
      {
        id: "strategy",
        label: "الاستراتيجية",
        labelEn: "Strategy",
        icon: "◎"
      },
      {
        id: "projects",
        label: "المشاريع",
        labelEn: "Projects",
        icon: "▣"
      },
      {
        id: "ideas",
        label: "الفرص",
        labelEn: "Opportunities",
        icon: "✦"
      },
      {
        id: "governance",
        label: "الحوكمة",
        labelEn: "Governance",
        icon: "◇"
      },
      {
        id: "maturity",
        label: "النضج",
        labelEn: "Maturity",
        icon: "◫"
      },
      {
        id: "reports",
        label: "التقارير",
        labelEn: "Reports",
        icon: "▤"
      },
      {
        id: "kpis",
        label: "المؤشرات",
        labelEn: "KPIs",
        icon: "◈"
      },
      {
        id: "business",
        label: "الجدوى",
        labelEn: "Business Case",
        icon: "◉"
      },
      {
        id: "automation",
        label: "الأتمتة",
        labelEn: "Automation",
        icon: "⚙"
      },
      {
        id: "decision",
        label: "القرار",
        labelEn: "Decision",
        icon: "⌘"
      },
      {
        id: "settings",
        label: "المزيد",
        labelEn: "More",
        icon: "•••"
      }
    ],

    /* =========================================================
       INITIALIZATION
    ========================================================= */

    init(root = null) {
      if (this._initialized) {
        this.cacheElements();
        return this;
      }

      this._initialized = true;

      this.root =
        root ||
        document.getElementById("app") ||
        document.getElementById("appRoot") ||
        document.querySelector("[data-aiw-shell]") ||
        document.body;

      this.cacheElements();
      this.bindEvents();
      this.bindStore();
      this.applySettings();
      this.updateRouteState();
      this.updatePlatformStatus();
      this.registerMetadata();

      return this;
    },

    cacheElements() {
      this.main =
        document.getElementById("appMain") ||
        document.querySelector("[data-app-main]") ||
        null;

      if (!this.root) {
        this.root =
          document.getElementById("app") ||
          document.getElementById("appRoot") ||
          document.body;
      }
    },

    /* =========================================================
       DATA ACCESS
    ========================================================= */

    getStore() {
      return window.AIW?.Store || null;
    },

    getData() {
      const store = this.getStore();

      try {
        if (
          store &&
          typeof store.getState === "function"
        ) {
          return store.getState();
        }

        if (
          store &&
          typeof store.getData === "function"
        ) {
          return store.getData();
        }
      } catch (error) {
        console.warn(
          "[AIW.Shell] Unable to read Store data:",
          error
        );
      }

      return window.AIW?.Data || {};
    },

    getSettings() {
      const store = this.getStore();

      try {
        if (
          store &&
          typeof store.getSettings === "function"
        ) {
          return store.getSettings();
        }
      } catch (error) {
        console.warn(
          "[AIW.Shell] Unable to read settings:",
          error
        );
      }

      return {
        language: "ar",
        locale: "ar-AE",
        direction: "rtl",
        theme: "light",
        compactMode: false
      };
    },

    /* =========================================================
       PLATFORM STATUS
    ========================================================= */

    getPlatformStatus() {
      const data = this.getData();
      const modules = window.AIW?.Modules || {};

      const totalModules =
        Object.keys(modules).length;

      const readyModules =
        Object.values(modules).filter(
          module =>
            module &&
            typeof module.render === "function"
        ).length;

      const engines = {
  Store:
    Boolean(window.AIW?.Store),

  Router:
    Boolean(
      window.AIW?.Router ||
      window.ATCRouter
    ),

  App:
    Boolean(
      window.AIW?.App ||
      window.ATCApp
    ),

  Widgets:
    Boolean(window.AIW?.Widgets),

  Analytics:
    Boolean(window.AIW?.Analytics),

  BiometricAnalytics:
    Boolean(
      window.AIW?.BiometricAnalytics
    ),

  Automation:
    Boolean(window.AIW?.Automation),

  AIEngine:
    Boolean(
      window.AIW?.AIEngine ||
      window.AIW?.AI
    ),

  DecisionEngine:
    Boolean(
      window.AIW?.DecisionEngine ||
      window.ATCDecisionEngine
    ),

  RecommendationEngine:
    Boolean(
      window.AIW?.RecommendationEngine ||
      window.ATCRecommendationEngine
    ),

  Notifications:
    Boolean(
      window.AIW?.Notifications ||
      window.ATCNotifications
    ),

  Permissions:
    Boolean(
      window.AIW?.Permissions ||
      window.ATCPermissions
    ),

  Export:
    Boolean(
      window.AIW?.Export ||
      window.ATCExport
    ),

  Charts:
    Boolean(window.AIW?.Charts)
};

const engineEntries =
  Object.entries(engines);

const activeEngines =
  engineEntries.filter(
    ([, active]) => active
  ).length;

const totalEngines =
  engineEntries.length;

const coreReady =
  engines.Store &&
  engines.Router &&
  engines.App;

      const collections = [
        data.ideas,
        data.projects,
        data.flagshipProjects,
        data.departments,
        data.kpis,
        data.governance,
        data.risks,
        data.reports,
        data.maturity
      ];

      const availableCollections =
        collections.filter(value => {
          if (Array.isArray(value)) {
            return value.length > 0;
          }

          return Boolean(
            value &&
            typeof value === "object" &&
            Object.keys(value).length
          );
        }).length;

      const moduleScore =
        totalModules
          ? (
              readyModules /
              totalModules
            ) * 100
          : 0;

      const engineScore =
  totalEngines
    ? (
        activeEngines /
        totalEngines
      ) * 100
    : 0;

      const dataScore =
        collections.length
          ? (
              availableCollections /
              collections.length
            ) * 100
          : 0;

      const health = Math.round(
        moduleScore * 0.4 +
        engineScore * 0.35 +
        dataScore * 0.25
      );

      let label = "يحتاج مراجعة";
      let className = "orange";

      if (health >= 90) {
        label = "ممتاز";
        className = "green";
      } else if (health >= 75) {
        label = "مستقر";
        className = "green";
      } else if (health >= 55) {
        label = "قيد التطوير";
        className = "orange";
      }

      if (!coreReady) {
        label = "Core غير مكتمل";
        className = "orange";
      }

      return {
        health,
        label,
        className,
        totalModules,
        readyModules,
        activeEngines,
        totalEngines,
        coreReady
      };
    },

    updatePlatformStatus() {
      const status =
        this.getPlatformStatus();

      const valueElement =
        document.querySelector(
          "[data-platform-health-value]"
        );

      const labelElement =
        document.querySelector(
          "[data-platform-health-label]"
        );

      const indicatorElement =
        document.querySelector(
          "[data-platform-status]"
        );

      if (valueElement) {
        valueElement.textContent =
          `${status.health}%`;
      }

      if (labelElement) {
        labelElement.textContent =
          status.label;
      }

      if (indicatorElement) {
        indicatorElement.classList.remove(
          "green",
          "orange"
        );

        indicatorElement.classList.add(
          status.className
        );

        indicatorElement.setAttribute(
          "title",
          `Platform Health ${status.health}% · ${status.readyModules}/${status.totalModules} Modules · ${status.activeEngines}/${status.totalEngines} Engines`
        );
      }

      return status;
    },

    /* =========================================================
       LANGUAGE AND SETTINGS
    ========================================================= */

    applySettings() {
      const settings =
        this.getSettings();

      const language =
        settings.language === "en"
          ? "en"
          : "ar";

      const direction =
        language === "en"
          ? "ltr"
          : "rtl";

      document.documentElement.lang =
        language;

      document.documentElement.dir =
        settings.direction ||
        direction;

      document.body.classList.toggle(
        "aiw-compact-mode",
        Boolean(settings.compactMode)
      );

      document.body.classList.toggle(
        "aiw-dark-mode",
        settings.theme === "dark"
      );

      this.updateLanguageLabels(
        language
      );

      return settings;
    },

    toggleLanguage() {
      const store =
        this.getStore();

      const currentSettings =
        this.getSettings();

      const nextLanguage =
        currentSettings.language === "en"
          ? "ar"
          : "en";

      const nextDirection =
        nextLanguage === "en"
          ? "ltr"
          : "rtl";

      const updatedSettings = {
        ...currentSettings,
        language: nextLanguage,
        locale:
          nextLanguage === "en"
            ? "en-US"
            : "ar-AE",
        direction:
          nextDirection
      };

      if (
        store &&
        typeof store.saveSettings === "function"
      ) {
        store.saveSettings(
          updatedSettings
        );
      } else {
        document.documentElement.lang =
          nextLanguage;

        document.documentElement.dir =
          nextDirection;
      }

      this.applySettings();

      window.dispatchEvent(
        new CustomEvent(
          "aiw:languageChanged",
          {
            detail: {
              language:
                nextLanguage,
              direction:
                nextDirection
            }
          }
        )
      );

      this.refreshCurrentModule();

      return nextLanguage;
    },

    updateLanguageLabels(language) {
      document
        .querySelectorAll(
          "[data-route-label]"
        )
        .forEach(element => {
          const route =
            element.getAttribute(
              "data-route-label"
            );

          const navigationItem =
            this.navigationItems.find(
              item =>
                item.id === route
            );

          if (!navigationItem) {
            return;
          }

          element.textContent =
            language === "en"
              ? navigationItem.labelEn
              : navigationItem.label;
        });

      const languageButton =
        document.getElementById(
          "atcLangBtn"
        ) ||
        document.querySelector(
          "[data-language-toggle]"
        );

      if (languageButton) {
        languageButton.textContent =
          language === "en"
            ? "العربية"
            : "EN";
      }
    },

    /* =========================================================
       NAVIGATION
    ========================================================= */

    navigate(route) {
      const router =
        window.AIW?.Router ||
        window.ATCRouter;

      const app =
        window.AIW?.App ||
        window.ATCApp;

      if (
        router &&
        typeof router.navigate === "function"
      ) {
        return router.navigate(route);
      }

      if (
        app &&
        typeof app.go === "function"
      ) {
        return app.go(route);
      }

      window.location.hash =
        route || "dashboard";

      return route;
    },

    getCurrentRoute() {
      const router =
        window.AIW?.Router ||
        window.ATCRouter;

      if (
        router &&
        typeof router.getCurrentRoute ===
          "function"
      ) {
        return router.getCurrentRoute();
      }

      return (
        window.location.hash
          .replace(/^#/, "") ||
        "dashboard"
      );
    },

    updateRouteState(route = null) {
      const currentRoute =
        route ||
        this.getCurrentRoute();

      document
        .querySelectorAll(
          "[data-route]"
        )
        .forEach(element => {
          const elementRoute =
            element.getAttribute(
              "data-route"
            );

          const active =
            elementRoute ===
            currentRoute;

          element.classList.toggle(
            "active",
            active
          );

          element.classList.toggle(
            "is-active",
            active
          );

          if (active) {
            element.setAttribute(
              "aria-current",
              "page"
            );
          } else {
            element.removeAttribute(
              "aria-current"
            );
          }
        });

      const pageLabel =
        document.querySelector(
          "[data-current-page-label]"
        );

      if (pageLabel) {
        const navigationItem =
          this.navigationItems.find(
            item =>
              item.id === currentRoute
          );

        const language =
          this.getSettings().language;

        pageLabel.textContent =
          navigationItem
            ? language === "en"
              ? navigationItem.labelEn
              : navigationItem.label
            : currentRoute;
      }

      return currentRoute;
    },

    refreshCurrentModule() {
      const app =
        window.AIW?.App ||
        window.ATCApp;

      if (
        app &&
        typeof app.refresh === "function"
      ) {
        app.refresh();
        return true;
      }

      return false;
    },

    /* =========================================================
       EVENTS
    ========================================================= */

    bindEvents() {
      if (this._eventsBound) {
        return;
      }

      this._eventsBound = true;

      document.addEventListener(
        "click",
        event => {
          const languageButton =
            event.target.closest(
              "#atcLangBtn, [data-language-toggle]"
            );

          if (languageButton) {
            event.preventDefault();
            this.toggleLanguage();
            return;
          }

          const menuButton =
            event.target.closest(
              "[data-shell-menu-toggle]"
            );

          if (menuButton) {
            event.preventDefault();
            this.toggleNavigation();
          }
        }
      );

      window.addEventListener(
        "aiw:routeChanged",
        event => {
          this.updateRouteState(
            event?.detail?.route
          );

          this.closeNavigation();
        }
      );

      window.addEventListener(
        "atc:routeChanged",
        event => {
          this.updateRouteState(
            event?.detail?.route
          );
        }
      );

      window.addEventListener(
        "aiw:settingsChanged",
        () => {
          this.applySettings();
        }
      );

      window.addEventListener(
        "aiw:settingsUpdated",
        () => {
          this.applySettings();
        }
      );

      window.addEventListener(
        "aiw:dataChanged",
        () => {
          this.scheduleStatusRefresh();
        }
      );

      window.addEventListener(
        "aiw:storeChanged",
        () => {
          this.scheduleStatusRefresh();
        }
      );

      window.addEventListener(
        "resize",
        () => {
          if (window.innerWidth > 1024) {
            this.closeNavigation();
          }
        }
      );
    },

    bindStore() {
      const store =
        this.getStore();

      if (
        !store ||
        this._storeUnsubscribe
      ) {
        return;
      }

      try {
        if (
          typeof store.subscribe ===
            "function"
        ) {
          this._storeUnsubscribe =
            store.subscribe(change => {
              const type =
                change?.type || "";

              if (
                type.includes("settings")
              ) {
                this.applySettings();
              }

              this.scheduleStatusRefresh();
            });
        }
      } catch (error) {
        console.warn(
          "[AIW.Shell] Store subscription failed:",
          error
        );
      }
    },

    scheduleStatusRefresh() {
      window.clearTimeout(
        this._refreshTimer
      );

      this._refreshTimer =
        window.setTimeout(() => {
          this.updatePlatformStatus();
        }, 100);
    },

    /* =========================================================
       MOBILE NAVIGATION
    ========================================================= */

    toggleNavigation() {
      const shell =
        document.querySelector(
          ".atc-shell"
        );

      if (!shell) {
        return false;
      }

      const opened =
        shell.classList.toggle(
          "navigation-open"
        );

      document.body.classList.toggle(
        "aiw-navigation-open",
        opened
      );

      return opened;
    },

    closeNavigation() {
      const shell =
        document.querySelector(
          ".atc-shell"
        );

      shell?.classList.remove(
        "navigation-open"
      );

      document.body.classList.remove(
        "aiw-navigation-open"
      );
    },

    /* =========================================================
       METADATA
    ========================================================= */

    registerMetadata() {
      const store =
        this.getStore();

      if (!store) {
        return;
      }

      try {
        if (
          typeof store.setMetadata ===
            "function"
        ) {
          store.setMetadata({
            shellVersion:
              this.version,
            shellArchitecture:
              "Enterprise Application Shell",
            lastShellInitialization:
              new Date().toISOString()
          });
        }
      } catch (error) {
        console.warn(
          "[AIW.Shell] Metadata registration skipped:",
          error
        );
      }
    },

    /* =========================================================
       RENDER HELPERS
    ========================================================= */

    renderNavigation() {
      const settings =
        this.getSettings();

      const language =
        settings.language === "en"
          ? "en"
          : "ar";

      return this.navigationItems
        .map(item => `
          <button
            class="atc-icon-btn"
            type="button"
            data-route="${item.id}"
            aria-label="${
              language === "en"
                ? this.escapeHTML(item.labelEn)
                : this.escapeHTML(item.label)
            }"
          >
            <span class="atc-nav-icon">
              ${item.icon}
            </span>

            <span data-route-label="${item.id}">
              ${
                language === "en"
                  ? this.escapeHTML(item.labelEn)
                  : this.escapeHTML(item.label)
              }
            </span>
          </button>
        `)
        .join("");
    },

    render() {
      const settings =
        this.getSettings();

      const language =
        settings.language === "en"
          ? "en"
          : "ar";

      const status =
        this.getPlatformStatus();

      return `
        <div
          class="atc-shell"
          data-aiw-shell
          data-shell-version="${this.version}"
        >
          <header class="atc-topbar">
            <div class="atc-brand">
              <div class="atc-logo">
                AI
              </div>

              <div>
                <strong>
                  AI Work
                </strong>

                <span>
                  Enterprise Biometric Intelligence Platform
                </span>
              </div>
            </div>

            <div class="atc-topbar-center">
              <div
                class="atc-platform-status ${status.className}"
                data-platform-status
                title="Platform Health ${status.health}%"
              >
                <span class="atc-status-dot"></span>

                <span data-platform-health-label>
                  ${status.label}
                </span>

                <strong data-platform-health-value>
                  ${status.health}%
                </strong>
              </div>
            </div>

            <div class="atc-top-actions">
              <button
                class="atc-icon-btn"
                type="button"
                data-shell-menu-toggle
                aria-label="فتح قائمة التنقل"
              >
                ☰
              </button>

              <button
                class="atc-icon-btn"
                id="atcLangBtn"
                type="button"
                data-language-toggle
              >
                ${
                  language === "en"
                    ? "العربية"
                    : "EN"
                }
              </button>
            </div>
          </header>

          <nav
            class="atc-shell-navigation"
            aria-label="التنقل الرئيسي"
          >
            <div class="atc-shell-navigation-inner">
              ${this.renderNavigation()}
            </div>
          </nav>

          <div class="atc-shell-context">
            <span>
              Executive Operating System
            </span>

            <strong data-current-page-label>
              ${
                language === "en"
                  ? "Dashboard"
                  : "الرئيسية"
              }
            </strong>
          </div>

          <main
            id="appMain"
            class="atc-app-main"
            data-app-main
            tabindex="-1"
          ></main>

          <footer class="atc-footer">
            <div>
              <strong>
                Enterprise Biometric Intelligence Platform
              </strong>

              <span>
                AI Work · Version ${this.version}
              </span>
            </div>

            <div class="aiw-global-credit">
              <span>Designed &amp; Developed by</span>
              <strong>يوسف الحوسني</strong>
            </div>
          </footer>
        </div>
      `;
    },

    mount(container = null) {
      const target =
        container ||
        document.getElementById("app") ||
        document.getElementById("appRoot") ||
        document.body;

      if (!target) {
        return false;
      }

      target.innerHTML =
        this.render();

      this.root = target;
      this.cacheElements();
      this.init(target);
      this.updateRouteState();
      this.updatePlatformStatus();

      window.dispatchEvent(
        new CustomEvent(
          "aiw:shellMounted",
          {
            detail: {
              version:
                this.version
            }
          }
        )
      );

      return true;
    },

    escapeHTML(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },

    /* =========================================================
       CLEANUP
    ========================================================= */

    destroy() {
      window.clearTimeout(
        this._refreshTimer
      );

      if (
        typeof this._storeUnsubscribe ===
          "function"
      ) {
        try {
          this._storeUnsubscribe();
        } catch (error) {
          console.warn(
            "[AIW.Shell] Store unsubscribe failed:",
            error
          );
        }
      }

      this._storeUnsubscribe = null;
      this._initialized = false;
      this.root = null;
      this.main = null;
    }
  };

  /* =========================================================
     GLOBAL REFERENCES
  ========================================================= */

  AIW.Shell = Shell;

  /*
   * Legacy compatibility.
   * Existing index files may still call:
   * ATCShell.render()
   * ATCShell.mount()
   */
  window.ATCShell = Shell;
})();