/* =========================================================
   AI Work - Enterprise Application Shell V5.2
   Enterprise Biometric Intelligence Platform
   Store V2.3 Native Architecture

   File Path:
   js/core/shell.js

   V5.2 Final Navigation Stabilization:
   - Preserves the existing index.html application layout
   - Never replaces the static bottom navigation
   - Permanently restores the Dashboard/Home SVG icon
   - Removes conflicting generated navigation pseudo-icons
   - Re-applies icon protection after route and DOM changes
   - Keeps App as the single route-state owner
   - Filters background integration Store events
   - Debounces platform-health refreshes
   - Preserves language, appearance, footer, and ATCShell compatibility
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};

  const HOME_ICON_SVG = `
    <svg
      viewBox="0 0 24 24"
      focusable="false"
      aria-hidden="true"
    >
      <path d="M3 11.5L12 4l9 7.5"></path>
      <path d="M5.5 10v10h13V10"></path>
      <path d="M9.5 20v-6h5v6"></path>
    </svg>
  `;

  const Shell = {
    id: "shell",
    version: "5.2.0",

    _initialized: false,
    _eventsBound: false,
    _storeUnsubscribe: null,
    _refreshTimer: null,
    _navigationRepairTimer: null,
    _navigationObserver: null,
    _mountedByShell: false,
    _lastRoute: null,
    _lastStatusSignature: null,

    root: null,
    main: null,

    fallbackNavigationItems: [
      {
        id: "dashboard",
        title: "الرئيسية",
        titleEn: "Dashboard",
        icon: "🏠",
        enabled: true,
        order: 1
      },
      {
        id: "strategy",
        title: "الاستراتيجية",
        titleEn: "Strategy",
        icon: "🎯",
        enabled: true,
        order: 2
      },
      {
        id: "projects",
        title: "المشاريع",
        titleEn: "Projects",
        icon: "📁",
        enabled: true,
        order: 3
      },
      {
        id: "ideas",
        title: "الأفكار",
        titleEn: "Ideas",
        icon: "💡",
        enabled: true,
        order: 4
      },
      {
        id: "governance",
        title: "الحوكمة",
        titleEn: "Governance",
        icon: "🛡️",
        enabled: true,
        order: 5
      },
      {
        id: "maturity",
        title: "النضج",
        titleEn: "Maturity",
        icon: "📈",
        enabled: true,
        order: 6
      },
      {
        id: "reports",
        title: "التقارير",
        titleEn: "Reports",
        icon: "📊",
        enabled: true,
        order: 7
      },
      {
        id: "kpis",
        title: "المؤشرات",
        titleEn: "KPIs",
        icon: "📌",
        enabled: true,
        order: 8
      },
      {
        id: "business",
        title: "الجدوى",
        titleEn: "Business Case",
        icon: "💼",
        enabled: true,
        order: 9
      },
      {
        id: "automation",
        title: "الأتمتة",
        titleEn: "Automation",
        icon: "⚙️",
        enabled: true,
        order: 10
      },
      {
        id: "decision",
        title: "القرار",
        titleEn: "Decision",
        icon: "🧠",
        enabled: true,
        order: 11
      },
      {
        id: "settings",
        title: "المزيد",
        titleEn: "More",
        icon: "⋮",
        enabled: true,
        order: 12
      }
    ],

    /* =======================================================
       Configuration
    ======================================================= */

    getConfig() {
      return (
        window.AIW?.Config ||
        window.AIW_CONFIG ||
        window.ATC_CONFIG ||
        {}
      );
    },

    getAppConfig() {
      return this.getConfig().app || {};
    },

    getNavigationItems() {
      const configured =
        this.getConfig()?.navigation?.modules;

      const source =
        Array.isArray(configured) &&
        configured.length
          ? configured
          : this.fallbackNavigationItems;

      return source
        .filter(
          item =>
            item &&
            item.id &&
            item.enabled !== false
        )
        .map((item, index) => ({
          ...item,

          id:
            String(item.id)
              .trim()
              .toLowerCase(),

          title:
            item.title ||
            item.label ||
            item.name ||
            item.id,

          titleEn:
            item.titleEn ||
            item.labelEn ||
            item.subtitle ||
            item.englishTitle ||
            item.title ||
            item.id,

          icon:
            item.icon ||
            "•",

          order:
            Number.isFinite(
              Number(item.order)
            )
              ? Number(item.order)
              : index + 1
        }))
        .sort(
          (first, second) =>
            first.order -
            second.order
        );
    },

    get navigationItems() {
      return this.getNavigationItems();
    },

    getDefaultRoute() {
      return (
        this.getConfig()?.navigation?.defaultModule ||
        "dashboard"
      );
    },

    /* =======================================================
       Initialization
    ======================================================= */

    init(root = null) {
      if (this._initialized) {
        if (root) {
          this.root = root;
        }

        this.cacheElements();
        this.installNavigationProtection();
        this.ensureBottomNavigationIntegrity();
        this.applySettings();
        this.updateRouteState();
        this.scheduleStatusRefresh("shell-reinit");

        return this;
      }

      this._initialized = true;

      this.root =
        root ||
        document.getElementById("app") ||
        document.getElementById("appRoot") ||
        document.querySelector("[data-aiw-root]") ||
        document.body;

      this.cacheElements();
      this.installNavigationProtection();
      this.ensureBottomNavigationIntegrity();
      this.observeBottomNavigation();
      this.bindEvents();
      this.bindStore();
      this.applySettings();
      this.updateRouteState();
      this.updatePlatformStatus();

      this.emit("aiw:shellReady", {
        version: this.version,
        mounted: Boolean(this.root),
        timestamp: new Date().toISOString()
      });

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
          document.querySelector("[data-aiw-root]") ||
          document.body;
      }

      return {
        root: this.root,
        main: this.main
      };
    },

    /* =======================================================
       Permanent Bottom Navigation Protection
    ======================================================= */

    installNavigationProtection() {
      const styleId =
        "aiw-shell-navigation-protection";

      if (document.getElementById(styleId)) {
        return true;
      }

      const style =
        document.createElement("style");

      style.id = styleId;

      style.textContent = `
        #bottomNav [data-aiw-home-button]::before,
        #bottomNav [data-aiw-home-button]::after,
        #bottomNav [data-aiw-home-button] .nav-icon::before,
        #bottomNav [data-aiw-home-button] .nav-icon::after {
          content: none !important;
          display: none !important;
        }

        #bottomNav [data-aiw-home-button] {
          text-indent: 0 !important;
          font-size: inherit !important;
        }

        #bottomNav [data-aiw-home-button] > .aiw-home-icon {
          position: static !important;
          inset: auto !important;
          display: grid !important;
          width: 28px !important;
          height: 28px !important;
          min-width: 28px !important;
          max-width: 28px !important;
          flex: 0 0 28px !important;
          place-items: center !important;
          overflow: visible !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          color: currentColor !important;
          font-size: 0 !important;
          line-height: 1 !important;
          letter-spacing: 0 !important;
          text-indent: 0 !important;
          transform: none !important;
          box-shadow: none !important;
          filter: none !important;
          opacity: 1 !important;
        }

        #bottomNav [data-aiw-home-button] > .aiw-home-icon svg {
          display: block !important;
          width: 23px !important;
          height: 23px !important;
          max-width: none !important;
          overflow: visible !important;
          fill: none !important;
          stroke: currentColor !important;
          stroke-width: 2 !important;
          stroke-linecap: round !important;
          stroke-linejoin: round !important;
          pointer-events: none !important;
          transform: none !important;
          filter: none !important;
          opacity: 1 !important;
        }

        #bottomNav [data-aiw-home-button].active > .aiw-home-icon,
        #bottomNav [data-aiw-home-button][aria-current="page"] > .aiw-home-icon {
          color: #ffffff !important;
        }
      `;

      document.head.appendChild(style);

      return true;
    },

    ensureBottomNavigationIntegrity() {
      const bottomNav =
        document.getElementById("bottomNav");

      if (!bottomNav) {
        return false;
      }

      const homeButton =
        bottomNav.querySelector(
          '[data-route="dashboard"], [data-module="dashboard"]'
        );

      if (!homeButton) {
        return false;
      }

      homeButton.setAttribute(
        "data-aiw-home-button",
        ""
      );

      let icon =
        homeButton.querySelector(
          ":scope > .nav-icon"
        );

      if (!icon) {
        icon = document.createElement("span");
        icon.className =
          "nav-icon aiw-home-icon";
        icon.setAttribute(
          "aria-hidden",
          "true"
        );

        homeButton.prepend(icon);
      }

      icon.classList.add(
        "nav-icon",
        "aiw-home-icon"
      );

      const currentMarkup =
        icon.innerHTML
          .replace(/\s+/g, "")
          .toLowerCase();

      const expectedMarker =
        'viewbox="002424"';

      if (
        !currentMarkup.includes("<svg") ||
        !currentMarkup.includes(expectedMarker)
      ) {
        icon.innerHTML =
          HOME_ICON_SVG;
      }

      Array
        .from(homeButton.childNodes)
        .filter(node =>
          node.nodeType === Node.TEXT_NODE &&
          node.textContent.trim()
        )
        .forEach(node => node.remove());

      return true;
    },

    scheduleNavigationRepair() {
      window.clearTimeout(
        this._navigationRepairTimer
      );

      this._navigationRepairTimer =
        window.setTimeout(
          () => {
            this.installNavigationProtection();
            this.ensureBottomNavigationIntegrity();
          },
          0
        );
    },

    observeBottomNavigation() {
      if (this._navigationObserver) {
        return;
      }

      const bottomNav =
        document.getElementById("bottomNav");

      if (!bottomNav) {
        return;
      }

      this._navigationObserver =
        new MutationObserver(() => {
          this.scheduleNavigationRepair();
        });

      this._navigationObserver.observe(
        bottomNav,
        {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: [
            "class",
            "aria-current"
          ]
        }
      );
    },

    /* =======================================================
       Store and Data Access
    ======================================================= */

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
          return store.getState() || {};
        }

        if (
          store &&
          typeof store.getData === "function"
        ) {
          return store.getData() || {};
        }
      } catch (error) {
        console.warn(
          "[AIW.Shell V5.2] Unable to read Store data:",
          error
        );
      }

      return {};
    },

    getSettings() {
      const store = this.getStore();

      try {
        if (
          store &&
          typeof store.getSettings === "function"
        ) {
          const settings = store.getSettings();

          if (
            settings &&
            typeof settings === "object"
          ) {
            return settings;
          }
        }

        const state = this.getData();

        if (
          state.settings &&
          typeof state.settings === "object"
        ) {
          return state.settings;
        }
      } catch (error) {
        console.warn(
          "[AIW.Shell V5.2] Unable to read settings:",
          error
        );
      }

      return {
        language:
          this.getConfig()?.language?.default ||
          "ar",

        locale:
          this.getAppConfig().locale ||
          "ar-AE",

        direction:
          this.getAppConfig().direction ||
          "rtl",

        theme:
          this.getConfig()?.theme?.default ||
          "light",

        compactMode: false
      };
    },

    updateSettings(changes = {}) {
      const store = this.getStore();

      if (
        !changes ||
        typeof changes !== "object"
      ) {
        return false;
      }

      try {
        if (
          store &&
          typeof store.saveSettings === "function"
        ) {
          return store.saveSettings({
            ...this.getSettings(),
            ...changes
          });
        }

        if (
          store &&
          typeof store.setSettings === "function"
        ) {
          return store.setSettings({
            ...this.getSettings(),
            ...changes
          });
        }

        if (
          store &&
          typeof store.patch === "function"
        ) {
          return store.patch(
            "settings",
            {
              ...this.getSettings(),
              ...changes
            }
          );
        }
      } catch (error) {
        console.warn(
          "[AIW.Shell V5.2] Settings update failed:",
          error
        );
      }

      return false;
    },

    /* =======================================================
       Platform Status
    ======================================================= */

    getPlatformStatus() {
      const data = this.getData();

      const configuredModules =
        this.getNavigationItems();

      const registeredModules =
        window.AIW?.Modules || {};

      const totalModules =
        configuredModules.length;

      const readyModules =
        configuredModules.filter(item => {
          const module =
            registeredModules[item.id];

          return Boolean(
            module &&
            typeof module.render === "function"
          );
        }).length;

      const engines = {
        Store: Boolean(window.AIW?.Store),
        Router: Boolean(
          window.AIW?.Router ||
          window.ATCRouter
        ),
        App: Boolean(
          window.AIW?.App ||
          window.ATCApp
        ),
        Shell: true,
        Widgets: Boolean(window.AIW?.Widgets),
        Charts: Boolean(window.AIW?.Charts),
        Analytics: Boolean(window.AIW?.Analytics),
        BiometricAnalytics: Boolean(
          window.AIW?.BiometricAnalytics
        ),
        Automation: Boolean(
          window.AIW?.Automation
        ),
        AI: Boolean(
          window.AIW?.AI ||
          window.AIW?.AIEngine
        ),
        Decision: Boolean(
          window.AIW?.Decision ||
          window.AIW?.DecisionEngine ||
          window.ATCDecisionEngine
        ),
        Recommendation: Boolean(
          window.AIW?.Recommendation ||
          window.AIW?.RecommendationEngine ||
          window.ATCRecommendationEngine
        ),
        Notifications: Boolean(
          window.AIW?.Notifications ||
          window.ATCNotifications
        ),
        Permissions: Boolean(
          window.AIW?.Permissions ||
          window.ATCPermissions
        ),
        Export: Boolean(
          window.AIW?.Export ||
          window.ATCExport
        )
      };

      const engineEntries =
        Object.entries(engines);

      const totalEngines =
        engineEntries.length;

      const activeEngines =
        engineEntries.filter(
          ([, active]) => active
        ).length;

      const coreReady =
        engines.Store &&
        engines.Router &&
        engines.App &&
        engines.Shell;

      const collections = [
        data.ideas,
        data.projects,
        data.departments,
        data.governance,
        data.risks,
        data.roadmap,
        data.automation,
        data.kpis,
        data.reports,
        data.decisionHistory,
        data.kpiHistory,
        data.executionHistory
      ];

      const availableCollections =
        collections.filter(value => {
          if (Array.isArray(value)) {
            return value.length > 0;
          }

          return Boolean(
            value &&
            typeof value === "object" &&
            Object.keys(value).length > 0
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

      let health =
        Math.round(
          moduleScore * 0.42 +
          engineScore * 0.38 +
          dataScore * 0.2
        );

      if (!coreReady) {
        health = Math.min(health, 54);
      }

      let label = "يحتاج مراجعة";
      let labelEn = "Needs Review";
      let className = "orange";

      if (
        coreReady &&
        health >= 90
      ) {
        label = "ممتاز";
        labelEn = "Excellent";
        className = "green";
      } else if (
        coreReady &&
        health >= 75
      ) {
        label = "مستقر";
        labelEn = "Stable";
        className = "green";
      } else if (health >= 55) {
        label = "قيد التطوير";
        labelEn = "In Development";
        className = "orange";
      }

      if (!coreReady) {
        label = "Core غير مكتمل";
        labelEn = "Core Incomplete";
        className = "orange";
      }

      return {
        health,
        label,
        labelEn,
        className,
        totalModules,
        readyModules,
        activeEngines,
        totalEngines,
        availableCollections,
        totalCollections:
          collections.length,
        coreReady,
        engines
      };
    },

    updatePlatformStatus() {
      const status =
        this.getPlatformStatus();

      const signature = [
        status.health,
        status.label,
        status.className,
        status.readyModules,
        status.activeEngines,
        status.availableCollections
      ].join("|");

      if (
        signature ===
        this._lastStatusSignature
      ) {
        return status;
      }

      this._lastStatusSignature =
        signature;

      const language =
        this.getLanguage();

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
          language === "en"
            ? status.labelEn
            : status.label;
      }

      if (indicatorElement) {
        indicatorElement.classList.remove(
          "green",
          "orange",
          "red"
        );

        indicatorElement.classList.add(
          status.className
        );

        indicatorElement.setAttribute(
          "title",
          [
            `Platform Health ${status.health}%`,
            `${status.readyModules}/${status.totalModules} Modules`,
            `${status.activeEngines}/${status.totalEngines} Engines`,
            `${status.availableCollections}/${status.totalCollections} Data Collections`
          ].join(" · ")
        );

        indicatorElement.dataset.health =
          String(status.health);

        indicatorElement.dataset.coreReady =
          String(status.coreReady);
      }

      return status;
    },

    /* =======================================================
       Language and Appearance
    ======================================================= */

    getLanguage() {
      return (
        this.getSettings().language === "en"
          ? "en"
          : "ar"
      );
    },

    applySettings() {
      const settings =
        this.getSettings();

      const language =
        settings.language === "en"
          ? "en"
          : "ar";

      const direction =
        settings.direction ||
        (
          language === "en"
            ? "ltr"
            : "rtl"
        );

      const theme =
        settings.theme === "dark"
          ? "dark"
          : "light";

      document.documentElement.lang =
        language;

      document.documentElement.dir =
        direction;

      document.documentElement.dataset.theme =
        theme;

      document.body.classList.toggle(
        "aiw-compact-mode",
        Boolean(settings.compactMode)
      );

      document.body.classList.toggle(
        "aiw-dark-mode",
        theme === "dark"
      );

      document.body.classList.toggle(
        "aiw-light-mode",
        theme !== "dark"
      );

      this.updateLanguageLabels(language);
      this.scheduleStatusRefresh("settings");

      return settings;
    },

    toggleLanguage() {
      const current =
        this.getSettings();

      const nextLanguage =
        current.language === "en"
          ? "ar"
          : "en";

      const nextDirection =
        nextLanguage === "en"
          ? "ltr"
          : "rtl";

      const nextLocale =
        nextLanguage === "en"
          ? "en-US"
          : "ar-AE";

      const updated =
        this.updateSettings({
          language: nextLanguage,
          direction: nextDirection,
          locale: nextLocale
        });

      document.documentElement.lang =
        nextLanguage;

      document.documentElement.dir =
        nextDirection;

      this.updateLanguageLabels(
        nextLanguage
      );

      this.emit(
        "aiw:languageChanged",
        {
          language: nextLanguage,
          direction: nextDirection,
          locale: nextLocale,
          persisted: Boolean(updated),
          timestamp:
            new Date().toISOString()
        }
      );

      this.refreshCurrentModule();

      return nextLanguage;
    },

    updateLanguageLabels(
      language = this.getLanguage()
    ) {
      document
        .querySelectorAll(
          "[data-route-label]"
        )
        .forEach(element => {
          const route =
            element.getAttribute(
              "data-route-label"
            );

          const item =
            this.getNavigationItems()
              .find(
                candidate =>
                  candidate.id === route
              );

          if (!item) return;

          element.textContent =
            language === "en"
              ? item.titleEn
              : item.title;
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

      const nav =
        document.querySelector(
          ".atc-shell-navigation"
        );

      if (nav) {
        nav.setAttribute(
          "aria-label",
          language === "en"
            ? "Main navigation"
            : "التنقل الرئيسي"
        );
      }

      this.updateCurrentPageLabel();
    },

    /* =======================================================
       Navigation
    ======================================================= */

    getRouter() {
      return (
        window.AIW?.Router ||
        window.ATCRouter ||
        null
      );
    },

    getApp() {
      return (
        window.AIW?.App ||
        window.ATCApp ||
        null
      );
    },

    navigate(route, options = {}) {
      const app = this.getApp();

      if (
        app &&
        typeof app.go === "function"
      ) {
        return app.go(
          route,
          {
            source:
              options.source ||
              "shell",
            ...options
          }
        );
      }

      const router =
        this.getRouter();

      if (
        router &&
        typeof router.navigate === "function"
      ) {
        return router.navigate(
          route,
          {
            source:
              options.source ||
              "shell",
            ...options
          }
        );
      }

      window.location.hash =
        route ||
        this.getDefaultRoute();

      return route;
    },

    getCurrentRoute() {
      const app = this.getApp();

      if (
        app &&
        typeof app.getCurrentRoute === "function"
      ) {
        try {
          return (
            app.getCurrentRoute() ||
            this.getDefaultRoute()
          );
        } catch (error) {
          // Router fallback below.
        }
      }

      const router =
        this.getRouter();

      if (
        router &&
        typeof router.getCurrentRoute === "function"
      ) {
        try {
          return (
            router.getCurrentRoute() ||
            this.getDefaultRoute()
          );
        } catch (error) {
          // Hash fallback below.
        }
      }

      return (
        window.location.hash
          .replace(/^#/, "") ||
        this.getDefaultRoute()
      );
    },

    updateRouteState(route = null) {
      const currentRoute =
        route ||
        this.getCurrentRoute();

      this.ensureBottomNavigationIntegrity();

      if (
        currentRoute === this._lastRoute
      ) {
        this.updateCurrentPageLabel(
          currentRoute
        );

        return currentRoute;
      }

      this._lastRoute =
        currentRoute;

      document
        .querySelectorAll("[data-route]")
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

      this.ensureBottomNavigationIntegrity();

      this.updateCurrentPageLabel(
        currentRoute
      );

      return currentRoute;
    },

    updateCurrentPageLabel(route = null) {
      const currentRoute =
        route ||
        this.getCurrentRoute();

      const pageLabel =
        document.querySelector(
          "[data-current-page-label]"
        );

      if (!pageLabel) {
        return currentRoute;
      }

      const item =
        this.getNavigationItems()
          .find(
            candidate =>
              candidate.id ===
              currentRoute
          );

      const language =
        this.getLanguage();

      pageLabel.textContent =
        item
          ? (
              language === "en"
                ? item.titleEn
                : item.title
            )
          : currentRoute;

      return currentRoute;
    },

    refreshCurrentModule() {
      const app = this.getApp();

      if (
        app &&
        typeof app.refresh === "function"
      ) {
        app.refresh();
        return true;
      }

      this.emit(
        "aiw:refreshCurrentModule",
        {
          source: "shell"
        }
      );

      return false;
    },

    /* =======================================================
       Events
    ======================================================= */

    bindEvents() {
      if (this._eventsBound) return;

      this._eventsBound = true;

      document.addEventListener(
        "click",
        event => {
          const languageButton =
            event.target.closest?.(
              "#atcLangBtn, [data-language-toggle]"
            );

          if (languageButton) {
            event.preventDefault();
            this.toggleLanguage();
            return;
          }

          const menuButton =
            event.target.closest?.(
              "[data-shell-menu-toggle]"
            );

          if (menuButton) {
            event.preventDefault();
            this.toggleNavigation();
            return;
          }

          const overlay =
            event.target.closest?.(
              "[data-shell-navigation-overlay]"
            );

          if (overlay) {
            event.preventDefault();
            this.closeNavigation();
          }
        }
      );

      window.addEventListener(
        "aiw:routeChanged",
        event => {
          this.updateRouteState(
            event?.detail?.route
          );

          this.scheduleNavigationRepair();
          this.closeNavigation();
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

      [
        "aiw:dataChanged",
        "aiw:dataUpdated",
        "aiw:storeChanged",
        "aiw:moduleRegistered",
        "aiw:moduleRendered",
        "aiw:appReady"
      ].forEach(eventName => {
        window.addEventListener(
          eventName,
          () => {
            this.scheduleStatusRefresh(
              eventName
            );

            this.scheduleNavigationRepair();
          }
        );
      });

      window.addEventListener(
        "pageshow",
        () => {
          this.scheduleNavigationRepair();
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

      document.addEventListener(
        "visibilitychange",
        () => {
          if (
            document.visibilityState === "visible"
          ) {
            this.scheduleNavigationRepair();
          }
        }
      );

      document.addEventListener(
        "keydown",
        event => {
          if (event.key === "Escape") {
            this.closeNavigation();
          }
        }
      );
    },

    bindStore() {
      const store = this.getStore();

      if (
        !store ||
        this._storeUnsubscribe
      ) {
        return;
      }

      const ignoredTypes = new Set([
        "aiw:metadataChanged",
        "metadata",
        "persist",
        "routeChanged",
        "integration:updated",
        "integration:sync",
        "dashboard:sync",
        "dashboard:updated",
        "kpi:recalculated",
        "kpi:updated",
        "reports:rebuilt",
        "reports:updated",
        "recommendations:updated",
        "health:updated",
        "timeline:updated",
        "notification:updated",
        "ai-analysis-updated",
        "aiw:ai-ui:updated"
      ]);

      try {
        if (
          typeof store.subscribe === "function"
        ) {
          this._storeUnsubscribe =
            store.subscribe(change => {
              const type =
                String(
                  change?.type ||
                  change?.event ||
                  change?.action ||
                  ""
                );

              if (ignoredTypes.has(type)) {
                return;
              }

              if (
                type
                  .toLowerCase()
                  .includes("settings")
              ) {
                this.applySettings();
                return;
              }

              this.scheduleStatusRefresh(
                type ||
                "store-change"
              );
            });
        }
      } catch (error) {
        console.warn(
          "[AIW.Shell V5.2] Store subscription failed:",
          error
        );
      }
    },

    scheduleStatusRefresh(
      source = "shell"
    ) {
      window.clearTimeout(
        this._refreshTimer
      );

      this._refreshTimer =
        window.setTimeout(
          () => {
            this.updatePlatformStatus();

            if (
              source === "aiw:appReady" ||
              source === "aiw:moduleRegistered"
            ) {
              this.updateRouteState();
            }
          },
          240
        );
    },

    /* =======================================================
       Mobile Navigation
    ======================================================= */

    toggleNavigation() {
      const shell =
        document.querySelector(
          ".atc-shell"
        );

      if (!shell) return false;

      const opened =
        shell.classList.toggle(
          "navigation-open"
        );

      document.body.classList.toggle(
        "aiw-navigation-open",
        opened
      );

      const button =
        document.querySelector(
          "[data-shell-menu-toggle]"
        );

      if (button) {
        button.setAttribute(
          "aria-expanded",
          String(opened)
        );
      }

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

      const button =
        document.querySelector(
          "[data-shell-menu-toggle]"
        );

      if (button) {
        button.setAttribute(
          "aria-expanded",
          "false"
        );
      }
    },

    /* =======================================================
       Legacy Render Helpers
       These remain for compatibility only.
       They are never used to replace the current index layout.
    ======================================================= */

    renderNavigation() {
      const language =
        this.getLanguage();

      return this
        .getNavigationItems()
        .map(item => `
          <button
            class="atc-icon-btn"
            type="button"
            data-route="${this.escapeHTML(item.id)}"
            aria-label="${this.escapeHTML(
              language === "en"
                ? item.titleEn
                : item.title
            )}"
          >
            <span
              class="atc-nav-icon"
              aria-hidden="true"
            >
              ${this.escapeHTML(item.icon)}
            </span>

            <span
              data-route-label="${this.escapeHTML(item.id)}"
            >
              ${this.escapeHTML(
                language === "en"
                  ? item.titleEn
                  : item.title
              )}
            </span>
          </button>
        `)
        .join("");
    },

    render() {
      return "";
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

      /*
       * The live application layout is already provided by index.html.
       * Shell V5.2 deliberately does not replace target.innerHTML.
       */
      this.root = target;
      this.cacheElements();
      this.init(target);
      this.ensureBottomNavigationIntegrity();

      const app = this.getApp();

      if (
        app &&
        !app.main
      ) {
        app.main = this.main;
      }

      this.emit(
        "aiw:shellMounted",
        {
          version: this.version,
          preservedStaticLayout: true,
          mainFound: Boolean(this.main),
          timestamp: new Date().toISOString()
        }
      );

      return true;
    },

    emit(name, detail = {}) {
      if (!name) return false;

      try {
        window.dispatchEvent(
          new CustomEvent(
            name,
            { detail }
          )
        );

        return true;
      } catch (error) {
        console.warn(
          `[AIW.Shell V5.2] Event "${name}" failed:`,
          error
        );

        return false;
      }
    },

    escapeHTML(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },

    /* =======================================================
       Cleanup
    ======================================================= */

    destroy(options = {}) {
      window.clearTimeout(
        this._refreshTimer
      );

      window.clearTimeout(
        this._navigationRepairTimer
      );

      this._navigationObserver?.disconnect();

      if (
        typeof this._storeUnsubscribe === "function"
      ) {
        try {
          this._storeUnsubscribe();
        } catch (error) {
          console.warn(
            "[AIW.Shell V5.2] Store unsubscribe failed:",
            error
          );
        }
      }

      if (
        options.removeProtection === true
      ) {
        document
          .getElementById(
            "aiw-shell-navigation-protection"
          )
          ?.remove();
      }

      this._storeUnsubscribe = null;
      this._refreshTimer = null;
      this._navigationRepairTimer = null;
      this._navigationObserver = null;
      this._initialized = false;
      this._mountedByShell = false;
      this._lastRoute = null;
      this._lastStatusSignature = null;
      this.root = null;
      this.main = null;
    }
  };

  /* =======================================================
     Global References
  ======================================================= */

  AIW.Shell = Shell;
  window.ATCShell = Shell;
})();
