/* =========================================================
   AI Work - Core App Bootstrap V3.1
   Enterprise Biometric Intelligence Platform

   Features:
   - Unified AIW.App Bootstrap
   - ATCApp Legacy Compatibility
   - AIW.Store Integration
   - Route Validation
   - Hash Navigation
   - Current Module Persistence
   - Module Lifecycle Management
   - Automatic Module Refresh
   - Dynamic Navigation Binding
   - Global Platform Events
   - Safe Error Handling
   - No UI Design Changes
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};
  AIW.Modules = AIW.Modules || {};

  const App = {
    id: "app",
    version: "3.1.0",

    defaultRoute: "dashboard",
    currentRoute: null,
    previousRoute: null,

    main: null,

    _initialized: false,
    _navigationBound: false,
    _globalEventsBound: false,
    _storeUnsubscribe: null,
    _refreshTimer: null,
    _isRendering: false,
    _pendingRoute: null,

    routes: {
      dashboard: {
        id: "dashboard",
        title: "الرئيسية"
      },

      strategy: {
        id: "strategy",
        title: "الاستراتيجية"
      },

      projects: {
        id: "projects",
        title: "المشاريع"
      },

      ideas: {
        id: "ideas",
        title: "الأفكار"
      },

      governance: {
        id: "governance",
        title: "الحوكمة"
      },

      maturity: {
        id: "maturity",
        title: "النضج"
      },

      reports: {
        id: "reports",
        title: "التقارير"
      },

      kpis: {
        id: "kpis",
        title: "المؤشرات"
      },

      business: {
        id: "business",
        title: "الجدوى"
      },

      automation: {
        id: "automation",
        title: "الأتمتة"
      },

      decision: {
        id: "decision",
        title: "القرار"
      },

      settings: {
        id: "settings",
        title: "المزيد"
      }
    },

    routeAliases: {
      home: "dashboard",
      index: "dashboard",
      overview: "dashboard",

      project: "projects",
      initiatives: "projects",

      idea: "ideas",
      opportunities: "ideas",

      risk: "governance",
      risks: "governance",

      performance: "kpis",
      indicators: "kpis",

      businesscase: "business",
      "business-case": "business",
      businesscases: "business",

      decisions: "decision",
      decisioncenter: "decision",
      "decision-center": "decision",

      more: "settings"
    },

    /* =========================================================
       INITIALIZATION
    ========================================================= */

    init() {
      if (this._initialized) {
        return this;
      }

      this._initialized = true;

      this.main =
        document.getElementById("appMain") ||
        document.querySelector("[data-app-main]") ||
        document.querySelector("main");

      this.initializeStore();
      this.bindNavigation();
      this.bindGlobalEvents();
      this.bindStore();
      this.registerPlatformMetadata();
      this.loadInitialRoute();

      this.emit("aiw:appReady", {
        version: this.version,
        route: this.currentRoute
      });

      console.info(
        `[AIW.App] Core App V${this.version} initialized`
      );

      return this;
    },

    initializeStore() {
      try {
        if (
          window.AIW?.Store &&
          typeof AIW.Store.init === "function"
        ) {
          AIW.Store.init();
        }
      } catch (error) {
        console.error(
          "[AIW.App] Store initialization failed:",
          error
        );
      }
    },

    registerPlatformMetadata() {
      const store = window.AIW?.Store;

      if (!store) {
        return;
      }

      const metadata = {
        appVersion: this.version,
        bootstrapVersion: this.version,
        currentModule:
          this.currentRoute || this.defaultRoute,
        lastApplicationStart:
          new Date().toISOString()
      };

      try {
        if (
          typeof store.setMetadata === "function"
        ) {
          store.setMetadata(metadata);
          return;
        }

        if (
          typeof store.updateMetadata === "function"
        ) {
          store.updateMetadata(metadata);
        }
      } catch (error) {
        console.warn(
          "[AIW.App] Metadata registration skipped:",
          error
        );
      }
    },

    /* =========================================================
       ROUTING
    ========================================================= */

    loadInitialRoute() {
      const hashRoute =
        this.getRouteFromHash();

      const savedRoute =
        this.getSavedRoute();

      const initialRoute =
        hashRoute ||
        savedRoute ||
        this.defaultRoute;

      this.go(initialRoute, {
        updateHash: !hashRoute,
        replaceHash: !hashRoute,
        source: "initial"
      });
    },

    go(route, options = {}) {
      const normalizedOptions =
        this.normalizeNavigationOptions(options);

      const resolvedRoute =
        this.resolveRoute(route);

      if (
        this._isRendering &&
        resolvedRoute === this.currentRoute
      ) {
        return false;
      }

      const routeChanged =
        resolvedRoute !== this.currentRoute;

      if (routeChanged) {
        this.previousRoute =
          this.currentRoute;

        this.destroyModule(
          this.currentRoute
        );

        this.currentRoute =
          resolvedRoute;
      }

      this.updateNavigationState(
        resolvedRoute
      );

      if (normalizedOptions.updateHash) {
        this.updateHash(
          resolvedRoute,
          normalizedOptions.replaceHash
        );
      }

      this.saveCurrentRoute(
        resolvedRoute
      );

      this.renderModule(
        resolvedRoute,
        {
          force:
            normalizedOptions.force ||
            !routeChanged,

          source:
            normalizedOptions.source
        }
      );

      this.updateDocumentTitle(
        resolvedRoute
      );

      if (normalizedOptions.scrollToTop) {
        this.scrollToTop();
      }

      const detail = {
        route: resolvedRoute,
        previousRoute:
          this.previousRoute,
        source:
          normalizedOptions.source,
        timestamp:
          new Date().toISOString()
      };

      this.emit(
        "aiw:routeChanged",
        detail
      );

      this.emit(
        "atc:routeChanged",
        detail
      );

      document.dispatchEvent(
        new CustomEvent(
          "aiw:routeChanged",
          {
            detail
          }
        )
      );

      document.dispatchEvent(
        new CustomEvent(
          "atc:routeChanged",
          {
            detail
          }
        )
      );

      return true;
    },

    navigate(route, options = {}) {
      return this.go(route, options);
    },

    refresh(route = this.currentRoute) {
      const resolvedRoute =
        this.resolveRoute(
          route || this.defaultRoute
        );

      return this.renderModule(
        resolvedRoute,
        {
          force: true,
          source: "refresh"
        }
      );
    },

    resolveRoute(route) {
      let value = String(
        route || ""
      )
        .trim()
        .toLowerCase();

      value = value
        .replace(/^#/, "")
        .replace(/^\/+/, "")
        .split("?")[0]
        .split("/")[0];

      if (this.routeAliases[value]) {
        value =
          this.routeAliases[value];
      }

      if (!this.routes[value]) {
        return this.defaultRoute;
      }

      return value;
    },

    hasRoute(route) {
      const value = String(
        route || ""
      )
        .trim()
        .toLowerCase()
        .replace(/^#/, "");

      return Boolean(
        this.routes[value] ||
        this.routeAliases[value]
      );
    },

    getRoute(route) {
      const resolved =
        this.resolveRoute(route);

      return this.routes[resolved] || null;
    },

    getCurrentRoute() {
      return this.currentRoute;
    },

    getPreviousRoute() {
      return this.previousRoute;
    },

    getRouteFromHash() {
      const hash = String(
        window.location.hash || ""
      )
        .replace(/^#/, "")
        .trim();

      if (!hash) {
        return null;
      }

      return this.resolveRoute(hash);
    },

    normalizeNavigationOptions(options) {
      if (
        typeof options === "boolean"
      ) {
        return {
          updateHash: options,
          replaceHash: false,
          force: false,
          scrollToTop: true,
          source: "navigation"
        };
      }

      const config =
        options &&
        typeof options === "object"
          ? options
          : {};

      return {
        updateHash:
          config.updateHash !== false,

        replaceHash:
          config.replaceHash === true,

        force:
          config.force === true,

        scrollToTop:
          config.scrollToTop !== false,

        source:
          config.source ||
          "navigation"
      };
    },

    updateHash(route, replace = false) {
      const nextHash =
        `#${route}`;

      if (
        window.location.hash === nextHash
      ) {
        return;
      }

      try {
        if (
          replace &&
          window.history &&
          typeof history.replaceState ===
            "function"
        ) {
          history.replaceState(
            null,
            "",
            nextHash
          );

          return;
        }

        window.location.hash =
          route;
      } catch (error) {
        window.location.hash =
          route;
      }
    },

    /* =========================================================
       NAVIGATION
    ========================================================= */

    bindNavigation() {
      if (this._navigationBound) {
        return;
      }

      this._navigationBound = true;

      document.addEventListener(
        "click",
        event => {
          const routeElement =
            event.target.closest(
              "[data-route]"
            );

          if (!routeElement) {
            return;
          }

          const route =
            routeElement.getAttribute(
              "data-route"
            );

          if (!route) {
            return;
          }

          event.preventDefault();

          this.go(route, {
            updateHash: true,
            source: "navigation-click"
          });
        }
      );

      document.addEventListener(
        "keydown",
        event => {
          const routeElement =
            event.target.closest?.(
              "[data-route]"
            );

          if (!routeElement) {
            return;
          }

          if (
            event.key !== "Enter" &&
            event.key !== " "
          ) {
            return;
          }

          event.preventDefault();

          this.go(
            routeElement.getAttribute(
              "data-route"
            ),
            {
              updateHash: true,
              source:
                "navigation-keyboard"
            }
          );
        }
      );
    },

    updateNavigationState(route) {
      document
        .querySelectorAll(
          "[data-route]"
        )
        .forEach(item => {
          const itemRoute =
            this.resolveRoute(
              item.getAttribute(
                "data-route"
              )
            );

          const isActive =
            itemRoute === route;

          item.classList.toggle(
            "active",
            isActive
          );

          item.classList.toggle(
            "is-active",
            isActive
          );

          if (isActive) {
            item.setAttribute(
              "aria-current",
              "page"
            );
          } else {
            item.removeAttribute(
              "aria-current"
            );
          }
        });
    },

    /* =========================================================
       MODULE RENDERING
    ========================================================= */

    renderModule(route, options = {}) {
      if (!this.main) {
        this.main =
          document.getElementById(
            "appMain"
          ) ||
          document.querySelector(
            "[data-app-main]"
          ) ||
          document.querySelector(
            "main"
          );
      }

      if (!this.main) {
        console.error(
          "[AIW.App] Main application container was not found."
        );

        return false;
      }

      const resolvedRoute =
        this.resolveRoute(route);

      const module =
        window.AIW?.Modules?.[
          resolvedRoute
        ];

      this._isRendering = true;

      this.main.setAttribute(
        "data-current-module",
        resolvedRoute
      );

      this.main.setAttribute(
        "aria-busy",
        "true"
      );

      try {
        if (
          module &&
          typeof module.render ===
            "function"
        ) {
          module.render(
            this.main,
            {
              route: resolvedRoute,
              app: this,
              store:
                window.AIW?.Store ||
                null,
              data:
                this.getPlatformData(),
              force:
                options.force === true,
              source:
                options.source ||
                "route"
            }
          );

          this.emit(
            "aiw:moduleRendered",
            {
              route:
                resolvedRoute,
              moduleId:
                module.id ||
                resolvedRoute,
              timestamp:
                new Date().toISOString()
            }
          );

          return true;
        }

        this.renderMissingModule(
          resolvedRoute
        );

        return false;
      } catch (error) {
        console.error(
          `[AIW.App] Failed to render module "${resolvedRoute}":`,
          error
        );

        this.renderModuleError(
          resolvedRoute,
          error
        );

        this.emit(
          "aiw:moduleError",
          {
            route:
              resolvedRoute,
            message:
              error?.message ||
              String(error),
            timestamp:
              new Date().toISOString()
          }
        );

        return false;
      } finally {
        this._isRendering = false;

        this.main.removeAttribute(
          "aria-busy"
        );
      }
    },

    destroyModule(route) {
      if (!route) {
        return;
      }

      const module =
        window.AIW?.Modules?.[route];

      if (
        !module ||
        typeof module.destroy !==
          "function"
      ) {
        return;
      }

      try {
        module.destroy();
      } catch (error) {
        console.warn(
          `[AIW.App] Module cleanup failed for "${route}":`,
          error
        );
      }
    },

    renderMissingModule(route) {
      const routeInfo =
        this.routes[route] || {};

      this.main.innerHTML = `
        <section class="module-page">
          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>قيد التطوير</h2>
              <p>
                وحدة ${
                  this.escapeHTML(
                    routeInfo.title ||
                    route
                  )
                } غير متاحة حالياً.
              </p>
            </div>

            <div class="settings-action-card executive-about-card">
              <strong>
                ${
                  this.escapeHTML(
                    routeInfo.title ||
                    route
                  )
                }
              </strong>

              <p>
                لم يتم العثور على دالة العرض الخاصة بهذه الوحدة داخل
                <code>AIW.Modules.${this.escapeHTML(
                  route
                )}</code>.
              </p>
            </div>
          </div>
        </section>
      `;
    },

    renderModuleError(route, error) {
      const routeInfo =
        this.routes[route] || {};

      this.main.innerHTML = `
        <section class="module-page">
          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>تعذر فتح الصفحة</h2>

              <p>
                حدث خطأ أثناء تحميل وحدة
                ${
                  this.escapeHTML(
                    routeInfo.title ||
                    route
                  )
                }.
              </p>
            </div>

            <div class="settings-action-card executive-about-card">
              <strong>
                خطأ في تشغيل الوحدة
              </strong>

              <p>
                ${
                  this.escapeHTML(
                    error?.message ||
                    "تعذر إكمال عملية العرض."
                  )
                }
              </p>
            </div>
          </div>
        </section>
      `;
    },

    scheduleRefresh(
      source = "store"
    ) {
      window.clearTimeout(
        this._refreshTimer
      );

      this._refreshTimer =
        window.setTimeout(() => {
          if (
            !this.currentRoute ||
            this._isRendering
          ) {
            return;
          }

          this.renderModule(
            this.currentRoute,
            {
              force: true,
              source
            }
          );
        }, 100);
    },

    /* =========================================================
       STORE CONNECTION
    ========================================================= */

    bindStore() {
      const store =
        window.AIW?.Store;

      if (
        !store ||
        this._storeUnsubscribe
      ) {
        return;
      }

      const onStoreChange =
        change => {
          const type =
            change?.type || "";

          const ignoredEvents = [
            "aiw:metadataChanged",
            "persist",
            "settingsPersisted"
          ];

          if (
            ignoredEvents.includes(type)
          ) {
            return;
          }

          this.scheduleRefresh(
            type || "store-change"
          );
        };

      try {
        if (
          typeof store.subscribe ===
            "function"
        ) {
          this._storeUnsubscribe =
            store.subscribe(
              onStoreChange
            );

          return;
        }

        if (
          typeof store.onChange ===
            "function"
        ) {
          this._storeUnsubscribe =
            store.onChange(
              onStoreChange
            );
        }
      } catch (error) {
        console.warn(
          "[AIW.App] Store subscription failed:",
          error
        );
      }
    },

    getPlatformData() {
      const store =
        window.AIW?.Store;

      try {
        if (
          store &&
          typeof store.getState ===
            "function"
        ) {
          return store.getState();
        }

        if (
          store &&
          typeof store.getData ===
            "function"
        ) {
          return store.getData();
        }
      } catch (error) {
        console.warn(
          "[AIW.App] Unable to read Store data:",
          error
        );
      }

      return window.AIW?.Data || {};
    },

    saveCurrentRoute(route) {
      const resolvedRoute =
        this.resolveRoute(route);

      try {
        window.localStorage.setItem(
          AIW.KEYS?.CURRENT_MODULE ||
            "aiwCurrentModule",
          resolvedRoute
        );
      } catch (error) {
        console.warn(
          "[AIW.App] Unable to save current module:",
          error
        );
      }

      const store =
        window.AIW?.Store;

      try {
        if (
          store &&
          typeof store.setMetadata ===
            "function"
        ) {
          store.setMetadata({
            currentModule:
              resolvedRoute,
            lastRouteChange:
              new Date().toISOString()
          });
        }
      } catch (error) {
        console.warn(
          "[AIW.App] Route metadata update skipped:",
          error
        );
      }
    },

    getSavedRoute() {
      try {
        const savedRoute =
          window.localStorage.getItem(
            AIW.KEYS?.CURRENT_MODULE ||
              "aiwCurrentModule"
          );

        if (!savedRoute) {
          return null;
        }

        return this.resolveRoute(
          savedRoute
        );
      } catch (error) {
        return null;
      }
    },

    /* =========================================================
       GLOBAL EVENTS
    ========================================================= */

    bindGlobalEvents() {
      if (this._globalEventsBound) {
        return;
      }

      this._globalEventsBound = true;

      window.addEventListener(
        "hashchange",
        () => {
          const route =
            this.getRouteFromHash() ||
            this.defaultRoute;

          if (
            route === this.currentRoute
          ) {
            return;
          }

          this.go(route, {
            updateHash: false,
            source: "hashchange"
          });
        }
      );

      window.addEventListener(
        "popstate",
        () => {
          const route =
            this.getRouteFromHash() ||
            this.defaultRoute;

          if (
            route === this.currentRoute
          ) {
            return;
          }

          this.go(route, {
            updateHash: false,
            source: "history"
          });
        }
      );

      window.addEventListener(
        "aiw:navigate",
        event => {
          const route =
            event?.detail?.route;

          if (!route) {
            return;
          }

          this.go(route, {
            updateHash:
              event.detail
                .updateHash !== false,
            source:
              event.detail.source ||
              "custom-event"
          });
        }
      );

      window.addEventListener(
        "aiw:refreshCurrentModule",
        () => {
          this.scheduleRefresh(
            "manual-refresh"
          );
        }
      );

      window.addEventListener(
        "aiw:moduleRegistered",
        event => {
          const route =
            event?.detail?.route ||
            event?.detail?.id;

          if (
            route &&
            this.resolveRoute(route) ===
              this.currentRoute
          ) {
            this.scheduleRefresh(
              "module-registered"
            );
          }
        }
      );

      document.addEventListener(
        "visibilitychange",
        () => {
          if (
            document.visibilityState ===
              "visible" &&
            this.currentRoute
          ) {
            this.scheduleRefresh(
              "visibility"
            );
          }
        }
      );
    },

    /* =========================================================
       PAGE HELPERS
    ========================================================= */

    updateDocumentTitle(route) {
      const routeInfo =
        this.routes[route];

      const platformName =
        window.ATC_CONFIG?.app?.name ||
        window.AIW?.Config?.app?.name ||
        window.AIW?.CONFIG?.app?.name ||
        "AI Work";

      const pageTitle =
        routeInfo?.title ||
        route;

      document.title =
        `${pageTitle} | ${platformName}`;
    },

    scrollToTop() {
      try {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "smooth"
        });
      } catch (error) {
        window.scrollTo(0, 0);
      }

      if (
        this.main &&
        typeof this.main.scrollTo ===
          "function"
      ) {
        try {
          this.main.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        } catch (error) {
          this.main.scrollTop = 0;
        }
      }
    },

    emit(name, detail = {}) {
      if (!name) {
        return;
      }

      try {
        window.dispatchEvent(
          new CustomEvent(name, {
            detail
          })
        );
      } catch (error) {
        console.warn(
          `[AIW.App] Event "${name}" failed:`,
          error
        );
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

    /* =========================================================
       APPLICATION CLEANUP
    ========================================================= */

    destroy() {
      window.clearTimeout(
        this._refreshTimer
      );

      this.destroyModule(
        this.currentRoute
      );

      if (
        typeof this._storeUnsubscribe ===
          "function"
      ) {
        try {
          this._storeUnsubscribe();
        } catch (error) {
          console.warn(
            "[AIW.App] Store unsubscribe failed:",
            error
          );
        }
      }

      this._storeUnsubscribe = null;
      this._initialized = false;
      this.currentRoute = null;
      this.previousRoute = null;
    }
  };

  /* =========================================================
     GLOBAL REFERENCES
  ========================================================= */

  AIW.App = App;

  /*
   * Legacy compatibility:
   * Existing modules may still call ATCApp.go().
   */
  window.ATCApp = App;

  /* =========================================================
     BOOTSTRAP
  ========================================================= */

  const bootstrap = () => {
    AIW.App.init();
  };

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      bootstrap,
      {
        once: true
      }
    );
  } else {
    bootstrap();
  }
})();