/* =========================================================
   AI Work - Core App Bootstrap V5.0
   Enterprise Biometric Intelligence Platform
   Store V2.2 Native Architecture

   File Path:
   js/core/app.js

   Features:
   - Unified AIW.App bootstrap
   - Dynamic route registry from AIW.Config
   - AIW.Router integration without navigation loops
   - ATCApp legacy compatibility
   - AIW.Store V2.2 initialization and subscription
   - Current and previous route persistence
   - Safe module lifecycle management
   - Duplicate render prevention
   - Deferred refresh queue
   - Dynamic navigation binding
   - Global platform events
   - Platform metadata registration
   - Safe error and missing-module states
   - No UI design changes
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};
  AIW.Modules = AIW.Modules || {};

  const App = {
    id: "app",
    version: "5.0.0",

    currentRoute: null,
    previousRoute: null,
    main: null,

    _initialized: false,
    _navigationBound: false,
    _globalEventsBound: false,
    _storeUnsubscribe: null,
    _refreshTimer: null,
    _isRendering: false,
    _isNavigating: false,
    _pendingRender: null,
    _lastRenderKey: null,
    _lastStoreRevision: null,

    fallbackRoutes: {
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
      main: "dashboard",

      project: "projects",
      initiative: "projects",
      initiatives: "projects",
      portfolio: "projects",

      idea: "ideas",
      opportunity: "ideas",
      opportunities: "ideas",

      risk: "governance",
      risks: "governance",
      controls: "governance",

      performance: "kpis",
      indicator: "kpis",
      indicators: "kpis",
      metrics: "kpis",

      report: "reports",
      analytics: "reports",

      businesscase: "business",
      "business-case": "business",
      businesscases: "business",
      feasibility: "business",

      workflow: "automation",
      workflows: "automation",

      decisions: "decision",
      decisioncenter: "decision",
      "decision-center": "decision",

      more: "settings",
      tools: "settings",
      preferences: "settings"
    },

    /* =========================================================
       Configuration and Route Registry
    ========================================================= */

    getConfig() {
      return (
        window.AIW?.Config ||
        window.AIW_CONFIG ||
        window.ATC_CONFIG ||
        {}
      );
    },

    getRouter() {
      return window.AIW?.Router || window.ATCRouter || null;
    },

    getRoutes() {
      const configured =
        this.getConfig()
          ?.navigation
          ?.modules;

      if (Array.isArray(configured)) {
        const routes = {};

        configured
          .filter(item =>
            item &&
            item.id &&
            item.enabled !== false
          )
          .sort(
            (first, second) =>
              Number(first.order || 0) -
              Number(second.order || 0)
          )
          .forEach(item => {
            const id =
              this.normalizeRoute(item.id);

            if (!id) return;

            routes[id] = {
              ...item,
              id
            };
          });

        if (Object.keys(routes).length) {
          return routes;
        }
      }

      return {
        ...this.fallbackRoutes
      };
    },

    get routes() {
      return this.getRoutes();
    },

    getDefaultRoute() {
      const configured =
        this.getConfig()
          ?.navigation
          ?.defaultModule;

      const resolved =
        this.resolveRoute(configured);

      return resolved || "dashboard";
    },

    get defaultRoute() {
      return this.getDefaultRoute();
    },

    getCurrentModuleKey() {
      return (
        this.getConfig()
          ?.storage
          ?.currentModule ||
        window.AIW?.KEYS?.currentModule ||
        "aiwCurrentModule"
      );
    },

    /* =========================================================
       Initialization
    ========================================================= */

    init(options = {}) {
      if (this._initialized) {
        return this;
      }

      this._initialized = true;

      this.resolveMainContainer();
      this.initializeStore();
      this.bindNavigation();
      this.bindGlobalEvents();
      this.bindStore();
      this.registerPlatformMetadata();

      const router =
        this.getRouter();

      if (
        router &&
        typeof router.init === "function"
      ) {
        try {
          router.init({
            navigate: false
          });
        } catch (error) {
          console.warn(
            "[AIW.App V5.0] Router initialization skipped:",
            error
          );
        }
      }

      if (options.navigate !== false) {
        this.loadInitialRoute();
      }

      this.emit("aiw:appReady", {
        version: this.version,
        route: this.currentRoute,
        timestamp: new Date().toISOString()
      });

      console.info(
        `[AIW.App] Core App V${this.version} initialized`
      );

      return this;
    },

    resolveMainContainer() {
      this.main =
        document.getElementById("appMain") ||
        document.querySelector("[data-app-main]") ||
        document.querySelector("main") ||
        null;

      return this.main;
    },

    initializeStore() {
      const store =
        window.AIW?.Store;

      if (!store) {
        console.warn(
          "[AIW.App V5.0] AIW.Store is not available during bootstrap."
        );

        return false;
      }

      try {
        if (
          typeof store.init === "function"
        ) {
          store.init();
        }

        return true;
      } catch (error) {
        console.error(
          "[AIW.App V5.0] Store initialization failed:",
          error
        );

        return false;
      }
    },

    registerPlatformMetadata() {
      const store =
        window.AIW?.Store;

      if (!store) return false;

      const config =
        this.getConfig();

      const metadata = {
        appVersion:
          config?.app?.version ||
          this.version,

        bootstrapVersion:
          this.version,

        architectureVersion:
          config?.app?.architectureVersion ||
          "2.2",

        currentModule:
          this.currentRoute ||
          this.getDefaultRoute(),

        lastApplicationStart:
          new Date().toISOString()
      };

      try {
        if (
          typeof store.setMetadata === "function"
        ) {
          store.setMetadata(metadata);
          return true;
        }

        if (
          typeof store.updateMetadata === "function"
        ) {
          store.updateMetadata(metadata);
          return true;
        }
      } catch (error) {
        console.warn(
          "[AIW.App V5.0] Metadata registration skipped:",
          error
        );
      }

      return false;
    },

    /* =========================================================
       Route Resolution
    ========================================================= */

    normalizeRoute(route) {
      return String(route ?? "")
        .trim()
        .toLowerCase()
        .replace(/^#+/, "")
        .replace(/^\/+/, "")
        .split("?")[0]
        .split("&")[0]
        .split("/")[0]
        .trim();
    },

    resolveRoute(route) {
      const router =
        this.getRouter();

      if (
        router &&
        typeof router.resolve === "function"
      ) {
        try {
          return router.resolve(route);
        } catch (error) {
          console.warn(
            "[AIW.App V5.0] Router resolution failed:",
            error
          );
        }
      }

      let value =
        this.normalizeRoute(route);

      if (!value) {
        value =
          this.normalizeRoute(
            this.getConfig()
              ?.navigation
              ?.defaultModule
          ) || "dashboard";
      }

      if (this.routeAliases[value]) {
        value =
          this.routeAliases[value];
      }

      const routes =
        this.getRoutes();

      return routes[value]
        ? value
        : (
            this.normalizeRoute(
              this.getConfig()
                ?.navigation
                ?.defaultModule
            ) || "dashboard"
          );
    },

    hasRoute(route) {
      const router =
        this.getRouter();

      if (
        router &&
        typeof router.has === "function"
      ) {
        try {
          return router.has(route);
        } catch (error) {
          // Local validation below.
        }
      }

      const value =
        this.normalizeRoute(route);

      return Boolean(
        this.getRoutes()[value] ||
        this.routeAliases[value]
      );
    },

    getRoute(route) {
      const resolved =
        this.resolveRoute(route);

      return (
        this.getRoutes()[resolved] ||
        null
      );
    },

    getCurrentRoute() {
      return (
        this.currentRoute ||
        this.getDefaultRoute()
      );
    },

    getPreviousRoute() {
      return this.previousRoute;
    },

    getRouteFromHash() {
      const hash =
        this.normalizeRoute(
          window.location.hash
        );

      if (!hash) return null;

      return this.resolveRoute(hash);
    },

    /* =========================================================
       Initial Route
    ========================================================= */

    loadInitialRoute() {
      const hashRoute =
        this.getRouteFromHash();

      const savedRoute =
        this.getSavedRoute();

      const initialRoute =
        this.resolveRoute(
          hashRoute ||
          savedRoute ||
          this.getDefaultRoute()
        );

      return this.go(
        initialRoute,
        {
          updateHash: true,
          replaceHash: true,
          force: true,
          scrollToTop: false,
          source: "app-initial"
        }
      );
    },

    /* =========================================================
       Navigation
    ========================================================= */

    go(route, options = {}) {
      const config =
        this.normalizeNavigationOptions(
          options
        );

      const resolvedRoute =
        this.resolveRoute(route);

      if (this._isNavigating) {
        return false;
      }

      const routeChanged =
        resolvedRoute !==
        this.currentRoute;

      if (
        !routeChanged &&
        !config.force &&
        this._lastRenderKey ===
          resolvedRoute
      ) {
        this.updateNavigationState(
          resolvedRoute
        );

        return true;
      }

      this._isNavigating = true;

      try {
        if (routeChanged) {
          this.previousRoute =
            this.currentRoute;

          this.destroyModule(
            this.currentRoute
          );

          this.currentRoute =
            resolvedRoute;
        } else if (!this.currentRoute) {
          this.currentRoute =
            resolvedRoute;
        }

        this.updateNavigationState(
          resolvedRoute
        );

        this.saveCurrentRoute(
          resolvedRoute
        );

        const rendered =
          this.renderModule(
            resolvedRoute,
            {
              force:
                config.force ||
                routeChanged,
              source:
                config.source
            }
          );

        if (config.updateHash) {
          this.updateHash(
            resolvedRoute,
            config.replaceHash
          );
        }

        this.updateDocumentTitle(
          resolvedRoute
        );

        if (config.scrollToTop) {
          this.scrollToTop();
        }

        const detail = {
          route: resolvedRoute,
          previousRoute:
            this.previousRoute,
          routeInfo:
            this.getRoute(
              resolvedRoute
            ),
          rendered,
          source:
            config.source,
          timestamp:
            new Date().toISOString()
        };

        this.emit(
          "aiw:routeChanged",
          detail
        );

        this.emit(
          "aiw:navigationCompleted",
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

        return rendered;
      } finally {
        this._isNavigating = false;
      }
    },

    navigate(route, options = {}) {
      return this.go(
        route,
        options
      );
    },

    refresh(route = this.currentRoute) {
      const resolvedRoute =
        this.resolveRoute(
          route ||
          this.getDefaultRoute()
        );

      return this.renderModule(
        resolvedRoute,
        {
          force: true,
          source: "app-refresh"
        }
      );
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
          source: "app-navigation"
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
          "app-navigation"
      };
    },

    updateHash(route, replace = false) {
      const resolvedRoute =
        this.resolveRoute(route);

      const nextHash =
        `#${resolvedRoute}`;

      if (
        window.location.hash === nextHash
      ) {
        return resolvedRoute;
      }

      try {
        if (
          replace &&
          window.history &&
          typeof window.history.replaceState ===
            "function"
        ) {
          const nextUrl =
            `${window.location.pathname}${window.location.search}${nextHash}`;

          window.history.replaceState(
            {
              route:
                resolvedRoute
            },
            "",
            nextUrl
          );

          return resolvedRoute;
        }

        window.location.hash =
          resolvedRoute;
      } catch (error) {
        console.warn(
          "[AIW.App V5.0] Hash update failed:",
          error
        );

        window.location.hash =
          resolvedRoute;
      }

      return resolvedRoute;
    },

    /* =========================================================
       Navigation Binding
    ========================================================= */

    bindNavigation() {
      if (this._navigationBound) {
        return;
      }

      this._navigationBound = true;

      document.addEventListener(
        "click",
        event => {
          const element =
            event.target.closest?.(
              "[data-route], [data-module]"
            );

          if (!element) return;

          const route =
            element.getAttribute(
              "data-route"
            ) ||
            element.getAttribute(
              "data-module"
            );

          if (!route) return;

          event.preventDefault();

          this.go(route, {
            updateHash: true,
            source:
              element.hasAttribute(
                "data-module"
              )
                ? "module-link-click"
                : "navigation-click"
          });
        }
      );

      document.addEventListener(
        "keydown",
        event => {
          if (
            event.key !== "Enter" &&
            event.key !== " "
          ) {
            return;
          }

          const element =
            event.target.closest?.(
              "[data-route], [data-module]"
            );

          if (!element) return;

          const route =
            element.getAttribute(
              "data-route"
            ) ||
            element.getAttribute(
              "data-module"
            );

          if (!route) return;

          event.preventDefault();

          this.go(route, {
            updateHash: true,
            source:
              "navigation-keyboard"
          });
        }
      );
    },

    updateNavigationState(route) {
      document
        .querySelectorAll(
          "[data-route], [data-module]"
        )
        .forEach(item => {
          const rawRoute =
            item.getAttribute(
              "data-route"
            ) ||
            item.getAttribute(
              "data-module"
            );

          const itemRoute =
            this.resolveRoute(
              rawRoute
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
       Module Rendering
    ========================================================= */

    renderModule(route, options = {}) {
      if (!this.main) {
        this.resolveMainContainer();
      }

      if (!this.main) {
        console.error(
          "[AIW.App V5.0] Main application container was not found."
        );

        return false;
      }

      const resolvedRoute =
        this.resolveRoute(route);

      const module =
        window.AIW?.Modules?.[
          resolvedRoute
        ];

      const renderKey =
        `${resolvedRoute}|${options.force === true}`;

      if (
        this._isRendering
      ) {
        this._pendingRender = {
          route:
            resolvedRoute,
          options:
            {
              ...options,
              force: true
            }
        };

        return false;
      }

      if (
        options.force !== true &&
        this._lastRenderKey ===
          resolvedRoute
      ) {
        return true;
      }

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
              route:
                resolvedRoute,

              app:
                this,

              router:
                this.getRouter(),

              store:
                window.AIW?.Store ||
                null,

              data:
                this.getPlatformData(),

              force:
                options.force === true,

              source:
                options.source ||
                "app-render"
            }
          );

          this._lastRenderKey =
            resolvedRoute;

          this.emit(
            "aiw:moduleRendered",
            {
              route:
                resolvedRoute,

              moduleId:
                module.id ||
                resolvedRoute,

              moduleVersion:
                module.version ||
                null,

              renderKey,

              timestamp:
                new Date().toISOString()
            }
          );

          return true;
        }

        this._lastRenderKey =
          null;

        this.renderMissingModule(
          resolvedRoute
        );

        return false;
      } catch (error) {
        this._lastRenderKey =
          null;

        console.error(
          `[AIW.App V5.0] Failed to render module "${resolvedRoute}":`,
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

        if (this._pendingRender) {
          const pending =
            this._pendingRender;

          this._pendingRender =
            null;

          window.setTimeout(
            () => {
              this.renderModule(
                pending.route,
                pending.options
              );
            },
            0
          );
        }
      }
    },

    destroyModule(route) {
      if (!route) return;

      const module =
        window.AIW?.Modules?.[
          route
        ];

      if (
        !module ||
        typeof module.destroy !==
          "function"
      ) {
        return;
      }

      try {
        module.destroy({
          route,
          app: this
        });
      } catch (error) {
        console.warn(
          `[AIW.App V5.0] Module cleanup failed for "${route}":`,
          error
        );
      }
    },

    renderMissingModule(route) {
      const routeInfo =
        this.getRoute(route) || {};

      this.main.innerHTML = `
        <section class="module-page">
          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>قيد التطوير</h2>
              <p>
                وحدة
                ${this.escapeHTML(
                  routeInfo.title ||
                  route
                )}
                غير متاحة حالياً.
              </p>
            </div>

            <div class="settings-action-card executive-about-card">
              <strong>
                ${this.escapeHTML(
                  routeInfo.title ||
                  route
                )}
              </strong>

              <p>
                لم يتم العثور على دالة العرض داخل
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
        this.getRoute(route) || {};

      this.main.innerHTML = `
        <section class="module-page">
          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>تعذر فتح الصفحة</h2>
              <p>
                حدث خطأ أثناء تحميل وحدة
                ${this.escapeHTML(
                  routeInfo.title ||
                  route
                )}.
              </p>
            </div>

            <div class="settings-action-card executive-about-card">
              <strong>
                خطأ في تشغيل الوحدة
              </strong>

              <p>
                ${this.escapeHTML(
                  error?.message ||
                  "تعذر إكمال عملية العرض."
                )}
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
        window.setTimeout(
          () => {
            if (
              !this.currentRoute
            ) {
              return;
            }

            if (this._isRendering) {
              this._pendingRender = {
                route:
                  this.currentRoute,

                options: {
                  force: true,
                  source
                }
              };

              return;
            }

            this.renderModule(
              this.currentRoute,
              {
                force: true,
                source
              }
            );
          },
          100
        );
    },

    /* =========================================================
       Store Connection
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
            String(
              change?.type ||
              change?.event ||
              change?.action ||
              ""
            );

          const revision =
            change?.revision ??
            change?.meta?.revision ??
            null;

          if (
            revision !== null &&
            revision ===
              this._lastStoreRevision
          ) {
            return;
          }

          if (revision !== null) {
            this._lastStoreRevision =
              revision;
          }

          const ignoredTypes = [
            "aiw:metadataChanged",
            "metadata",
            "persist",
            "settingsPersisted",
            "routeChanged"
          ];

          if (
            ignoredTypes.includes(type)
          ) {
            return;
          }

          this.scheduleRefresh(
            type ||
            "store-change"
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
          "[AIW.App V5.0] Store subscription failed:",
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
          return (
            store.getState() ||
            {}
          );
        }

        if (
          store &&
          typeof store.getData ===
            "function"
        ) {
          return (
            store.getData() ||
            {}
          );
        }
      } catch (error) {
        console.warn(
          "[AIW.App V5.0] Unable to read Store data:",
          error
        );
      }

      return {};
    },

    /* =========================================================
       Route Persistence
    ========================================================= */

    saveCurrentRoute(route) {
      const resolvedRoute =
        this.resolveRoute(route);

      try {
        window.localStorage.setItem(
          this.getCurrentModuleKey(),
          resolvedRoute
        );
      } catch (error) {
        console.warn(
          "[AIW.App V5.0] Unable to save current module:",
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

            previousModule:
              this.previousRoute,

            lastRouteChange:
              new Date().toISOString()
          });
        }
      } catch (error) {
        console.warn(
          "[AIW.App V5.0] Route metadata update skipped:",
          error
        );
      }

      return resolvedRoute;
    },

    getSavedRoute() {
      try {
        const savedRoute =
          window.localStorage.getItem(
            this.getCurrentModuleKey()
          );

        return savedRoute
          ? this.resolveRoute(
              savedRoute
            )
          : null;
      } catch (error) {
        return null;
      }
    },

    /* =========================================================
       Global Events
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
            this.getDefaultRoute();

          if (
            route ===
            this.currentRoute
          ) {
            return;
          }

          this.go(route, {
            updateHash: false,
            source:
              "app-hashchange"
          });
        }
      );

      window.addEventListener(
        "popstate",
        () => {
          const route =
            this.getRouteFromHash() ||
            this.getDefaultRoute();

          if (
            route ===
            this.currentRoute
          ) {
            return;
          }

          this.go(route, {
            updateHash: false,
            source:
              "app-history"
          });
        }
      );

      window.addEventListener(
        "aiw:navigate",
        event => {
          const route =
            event?.detail?.route;

          if (!route) return;

          if (
            event.detail?.source ===
              "router" ||
            event.detail?.source ===
              "router-push" ||
            event.detail?.source ===
              "router-replace"
          ) {
            return;
          }

          this.go(route, {
            updateHash:
              event.detail
                .updateHash !== false,

            replaceHash:
              event.detail
                .replaceHash === true,

            force:
              event.detail
                .force === true,

            source:
              event.detail
                .source ||
              "app-custom-event"
          });
        }
      );

      window.addEventListener(
        "aiw:refreshCurrentModule",
        event => {
          this.scheduleRefresh(
            event?.detail?.source ||
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
       Page Helpers
    ========================================================= */

    updateDocumentTitle(route) {
      const routeInfo =
        this.getRoute(route);

      const platformName =
        this.getConfig()
          ?.app
          ?.shortName ||
        this.getConfig()
          ?.app
          ?.name ||
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
          behavior: "auto"
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
            left: 0,
            behavior: "auto"
          });
        } catch (error) {
          this.main.scrollTop = 0;
        }
      }
    },

    emit(name, detail = {}) {
      if (!name) return false;

      try {
        window.dispatchEvent(
          new CustomEvent(
            name,
            {
              detail
            }
          )
        );

        return true;
      } catch (error) {
        console.warn(
          `[AIW.App V5.0] Event "${name}" failed:`,
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

    /* =========================================================
       Cleanup
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
            "[AIW.App V5.0] Store unsubscribe failed:",
            error
          );
        }
      }

      this._storeUnsubscribe = null;
      this._refreshTimer = null;
      this._pendingRender = null;
      this._lastRenderKey = null;
      this._lastStoreRevision = null;
      this._initialized = false;
      this._isRendering = false;
      this._isNavigating = false;
      this.currentRoute = null;
      this.previousRoute = null;
      this.main = null;
    }
  };

  /* =========================================================
     Global References
  ========================================================= */

  AIW.App = App;
  window.ATCApp = App;

  /* =========================================================
     Bootstrap
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
