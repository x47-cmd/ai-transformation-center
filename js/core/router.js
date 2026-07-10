/* =========================================================
   AI Work - Core Router V5.0
   Enterprise Safe Navigation Bridge
   Store V2.2 Native Architecture

   File Path:
   js/core/router.js

   Features:
   - Dynamic routes from AIW.Config navigation registry
   - AIW.Router unified interface
   - AIW.App and ATCApp compatibility
   - Legacy ATCRouter compatibility
   - Route validation and aliases
   - Hash navigation and history support
   - Current and previous route persistence
   - Invalid route fallback
   - Duplicate navigation prevention
   - Safe navigation event emission
   - No operational data inside the router
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};

  const Router = {
    id: "router",
    version: "5.0.0",

    _initialized: false,
    _hashBound: false,
    _navigating: false,
    _lastNavigationKey: null,
    _previousRoute: null,
    _currentRoute: null,

    fallbackRoutes: [
      "dashboard",
      "strategy",
      "projects",
      "ideas",
      "governance",
      "maturity",
      "reports",
      "kpis",
      "business",
      "automation",
      "decision",
      "settings"
    ],

    aliases: {
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
       Configuration
    ========================================================= */

    getConfig() {
      return (
        window.AIW?.Config ||
        window.AIW_CONFIG ||
        window.ATC_CONFIG ||
        {}
      );
    },

    getDefaultRoute() {
      const configured =
        this.getConfig()
          ?.navigation
          ?.defaultModule;

      const normalized =
        this.normalize(configured);

      if (
        normalized &&
        this.getRoutes().includes(normalized)
      ) {
        return normalized;
      }

      return "dashboard";
    },

    getRoutes() {
      const modules =
        this.getConfig()
          ?.navigation
          ?.modules;

      if (Array.isArray(modules)) {
        const configuredRoutes =
          modules
            .filter(module =>
              module &&
              module.enabled !== false &&
              module.id
            )
            .sort(
              (first, second) =>
                Number(first.order || 0) -
                Number(second.order || 0)
            )
            .map(module =>
              this.normalize(module.id)
            )
            .filter(Boolean);

        if (configuredRoutes.length) {
          return configuredRoutes;
        }
      }

      return [...this.fallbackRoutes];
    },

    get routes() {
      return this.getRoutes();
    },

    get defaultRoute() {
      return this.getDefaultRoute();
    },

    getStorageKey() {
      return (
        this.getConfig()
          ?.storage
          ?.currentModule ||
        window.AIW?.KEYS?.currentModule ||
        "aiwCurrentModule"
      );
    },

    /* =========================================================
       Route Resolution
    ========================================================= */

    normalize(route) {
      const raw =
        String(route ?? "")
          .trim()
          .toLowerCase();

      if (!raw) return "";

      return raw
        .replace(/^#+/, "")
        .replace(/^\/+/, "")
        .split("?")[0]
        .split("&")[0]
        .split("/")[0]
        .trim();
    },

    resolve(route) {
      let normalizedRoute =
        this.normalize(route);

      if (!normalizedRoute) {
        return this.getDefaultRoute();
      }

      if (this.aliases[normalizedRoute]) {
        normalizedRoute =
          this.aliases[normalizedRoute];
      }

      if (
        !this.getRoutes()
          .includes(normalizedRoute)
      ) {
        return this.getDefaultRoute();
      }

      return normalizedRoute;
    },

    isValid(route) {
      const normalizedRoute =
        this.normalize(route);

      if (!normalizedRoute) {
        return false;
      }

      return Boolean(
        this.getRoutes()
          .includes(normalizedRoute) ||
        this.aliases[normalizedRoute]
      );
    },

    has(route) {
      return this.isValid(route);
    },

    getRouteInfo(route) {
      const resolvedRoute =
        this.resolve(route);

      const modules =
        this.getConfig()
          ?.navigation
          ?.modules;

      if (Array.isArray(modules)) {
        const moduleInfo =
          modules.find(
            module =>
              this.normalize(module?.id) ===
              resolvedRoute
          );

        if (moduleInfo) {
          return {
            ...moduleInfo,
            id: resolvedRoute
          };
        }
      }

      const app =
        this.getApp();

      if (
        app &&
        typeof app.getRoute === "function"
      ) {
        try {
          const appRoute =
            app.getRoute(resolvedRoute);

          if (appRoute) {
            return appRoute;
          }
        } catch (error) {
          console.warn(
            "AI Work Router V5.0: App route lookup failed.",
            error
          );
        }
      }

      return {
        id: resolvedRoute,
        title: resolvedRoute,
        enabled: true
      };
    },

    /* =========================================================
       App Access
    ========================================================= */

    getApp() {
      return (
        window.AIW?.App ||
        window.ATCApp ||
        null
      );
    },

    /* =========================================================
       Navigation
    ========================================================= */

    navigate(route, options = {}) {
      const normalizedOptions =
        this.normalizeOptions(options);

      const resolvedRoute =
        this.resolve(route);

      const navigationKey =
        [
          resolvedRoute,
          normalizedOptions.updateHash,
          normalizedOptions.replaceHash,
          normalizedOptions.force,
          normalizedOptions.source
        ].join("|");

      if (
        !normalizedOptions.force &&
        this._lastNavigationKey ===
          navigationKey &&
        this.getCurrentRoute() ===
          resolvedRoute
      ) {
        return resolvedRoute;
      }

      this._lastNavigationKey =
        navigationKey;

      if (this._navigating) {
        if (normalizedOptions.updateHash) {
          this.updateHash(
            resolvedRoute,
            normalizedOptions
          );
        }

        return resolvedRoute;
      }

      this._navigating = true;

      try {
        const currentRoute =
          this.getCurrentRoute();

        if (
          currentRoute &&
          currentRoute !== resolvedRoute
        ) {
          this._previousRoute =
            currentRoute;
        }

        this._currentRoute =
          resolvedRoute;

        this.persistRoute(
          resolvedRoute
        );

        const app =
          this.getApp();

        let handledByApp = false;

        if (
          app &&
          typeof app.go === "function" &&
          app !== this
        ) {
          try {
            app.go(
              resolvedRoute,
              {
                ...normalizedOptions,
                source:
                  normalizedOptions.source ||
                  "router"
              }
            );

            handledByApp = true;
          } catch (error) {
            console.error(
              "AI Work Router V5.0: App navigation failed.",
              error
            );
          }
        }

        if (
          !handledByApp &&
          app &&
          typeof app.renderModule ===
            "function"
        ) {
          try {
            app.renderModule(
              resolvedRoute,
              {
                force:
                  normalizedOptions.force,
                source:
                  normalizedOptions.source ||
                  "router"
              }
            );

            handledByApp = true;
          } catch (error) {
            console.error(
              "AI Work Router V5.0: App render failed.",
              error
            );
          }
        }

        if (
          normalizedOptions.updateHash
        ) {
          this.updateHash(
            resolvedRoute,
            normalizedOptions
          );
        }

        if (
          normalizedOptions.scrollToTop
        ) {
          this.scrollToTop();
        }

        this.emitNavigation(
          resolvedRoute,
          {
            ...normalizedOptions,
            handledByApp
          }
        );

        return resolvedRoute;
      } finally {
        this._navigating = false;
      }
    },

    go(route, options = {}) {
      return this.navigate(
        route,
        options
      );
    },

    push(route, options = {}) {
      return this.navigate(
        route,
        {
          ...this.normalizeOptions(options),
          updateHash: true,
          replaceHash: false,
          source:
            options?.source ||
            "router-push"
        }
      );
    },

    replace(route, options = {}) {
      return this.navigate(
        route,
        {
          ...this.normalizeOptions(options),
          updateHash: true,
          replaceHash: true,
          source:
            options?.source ||
            "router-replace"
        }
      );
    },

    render(route, options = {}) {
      const resolvedRoute =
        this.resolve(route);

      const app =
        this.getApp();

      if (
        app &&
        typeof app.renderModule ===
          "function"
      ) {
        try {
          app.renderModule(
            resolvedRoute,
            {
              force: true,
              source:
                options.source ||
                "router-render"
            }
          );

          this._currentRoute =
            resolvedRoute;

          this.persistRoute(
            resolvedRoute
          );

          this.emitNavigation(
            resolvedRoute,
            {
              ...this.normalizeOptions(options),
              force: true,
              source:
                options.source ||
                "router-render"
            }
          );

          return resolvedRoute;
        } catch (error) {
          console.error(
            "AI Work Router V5.0: renderModule failed.",
            error
          );
        }
      }

      return this.navigate(
        resolvedRoute,
        {
          ...options,
          force: true,
          source:
            options.source ||
            "router-render-fallback"
        }
      );
    },

    refresh() {
      const app =
        this.getApp();

      if (
        app &&
        typeof app.refresh ===
          "function"
      ) {
        try {
          app.refresh();
          return true;
        } catch (error) {
          console.error(
            "AI Work Router V5.0: App refresh failed.",
            error
          );
        }
      }

      this.render(
        this.getCurrentRoute(),
        {
          force: true,
          updateHash: false,
          source: "router-refresh"
        }
      );

      return true;
    },

    reload() {
      return this.render(
        this.getCurrentRoute(),
        {
          force: true,
          updateHash: false,
          source: "router-reload"
        }
      );
    },

    /* =========================================================
       History
    ========================================================= */

    back() {
      if (
        window.history &&
        typeof window.history.back ===
          "function"
      ) {
        window.history.back();
        return true;
      }

      if (this._previousRoute) {
        this.navigate(
          this._previousRoute,
          {
            replaceHash: true,
            source: "router-back-fallback"
          }
        );

        return true;
      }

      return false;
    },

    forward() {
      if (
        window.history &&
        typeof window.history.forward ===
          "function"
      ) {
        window.history.forward();
        return true;
      }

      return false;
    },

    /* =========================================================
       Current Route
    ========================================================= */

    getCurrentRoute() {
      const app =
        this.getApp();

      if (
        app &&
        typeof app.getCurrentRoute ===
          "function"
      ) {
        try {
          const route =
            app.getCurrentRoute();

          if (route) {
            return this.resolve(route);
          }
        } catch (error) {
          console.warn(
            "AI Work Router V5.0: getCurrentRoute failed.",
            error
          );
        }
      }

      if (this._currentRoute) {
        return this.resolve(
          this._currentRoute
        );
      }

      const hashRoute =
        this.normalize(
          window.location.hash
        );

      if (hashRoute) {
        return this.resolve(hashRoute);
      }

      const storedRoute =
        this.readPersistedRoute();

      if (storedRoute) {
        return this.resolve(storedRoute);
      }

      return this.getDefaultRoute();
    },

    getPreviousRoute() {
      const app =
        this.getApp();

      if (
        app &&
        typeof app.getPreviousRoute ===
          "function"
      ) {
        try {
          const route =
            app.getPreviousRoute();

          if (route) {
            return this.resolve(route);
          }
        } catch (error) {
          console.warn(
            "AI Work Router V5.0: getPreviousRoute failed.",
            error
          );
        }
      }

      return this._previousRoute
        ? this.resolve(
            this._previousRoute
          )
        : null;
    },

    /* =========================================================
       Hash Navigation
    ========================================================= */

    updateHash(route, options = {}) {
      const resolvedRoute =
        this.resolve(route);

      const normalizedOptions =
        this.normalizeOptions(options);

      const nextHash =
        `#${resolvedRoute}`;

      if (
        window.location.hash === nextHash
      ) {
        return resolvedRoute;
      }

      try {
        if (
          normalizedOptions.replaceHash &&
          window.history &&
          typeof window.history.replaceState ===
            "function"
        ) {
          const nextUrl =
            `${window.location.pathname}${window.location.search}${nextHash}`;

          window.history.replaceState(
            {
              route: resolvedRoute
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
          "AI Work Router V5.0: Hash update failed.",
          error
        );

        window.location.hash =
          resolvedRoute;
      }

      return resolvedRoute;
    },

    handleHashChange() {
      if (this._navigating) {
        return;
      }

      const rawRoute =
        this.normalize(
          window.location.hash
        );

      const resolvedRoute =
        this.resolve(rawRoute);

      if (
        rawRoute &&
        rawRoute !== resolvedRoute
      ) {
        this.updateHash(
          resolvedRoute,
          {
            replaceHash: true,
            source:
              "router-invalid-hash"
          }
        );
      }

      this.navigate(
        resolvedRoute,
        {
          updateHash: false,
          replaceHash: false,
          scrollToTop: true,
          source: "router-hashchange"
        }
      );
    },

    bindHashNavigation() {
      if (this._hashBound) {
        return;
      }

      this._hashBound = true;

      window.addEventListener(
        "hashchange",
        () => this.handleHashChange()
      );
    },

    /* =========================================================
       Persistence
    ========================================================= */

    persistRoute(route) {
      try {
        window.localStorage.setItem(
          this.getStorageKey(),
          this.resolve(route)
        );
      } catch (error) {
        console.warn(
          "AI Work Router V5.0: Route persistence failed.",
          error
        );
      }
    },

    readPersistedRoute() {
      try {
        const stored =
          window.localStorage.getItem(
            this.getStorageKey()
          );

        return stored || null;
      } catch (error) {
        return null;
      }
    },

    /* =========================================================
       Events
    ========================================================= */

    emitNavigation(route, options = {}) {
      const resolvedRoute =
        this.resolve(route);

      const detail = {
        route: resolvedRoute,
        previousRoute:
          this.getPreviousRoute(),
        routeInfo:
          this.getRouteInfo(
            resolvedRoute
          ),
        timestamp:
          new Date().toISOString(),
        ...this.normalizeOptions(options)
      };

      try {
        window.dispatchEvent(
          new CustomEvent(
            "aiw:navigate",
            {
              detail
            }
          )
        );

        window.dispatchEvent(
          new CustomEvent(
            "aiw:routeChanged",
            {
              detail
            }
          )
        );

        const configuredEvent =
          this.getConfig()
            ?.events
            ?.ROUTE_CHANGED;

        if (
          configuredEvent &&
          ![
            "aiw:navigate",
            "aiw:routeChanged"
          ].includes(configuredEvent)
        ) {
          window.dispatchEvent(
            new CustomEvent(
              configuredEvent,
              {
                detail
              }
            )
          );
        }
      } catch (error) {
        console.warn(
          "AI Work Router V5.0: Navigation event failed.",
          error
        );
      }

      return resolvedRoute;
    },

    /* =========================================================
       Options
    ========================================================= */

    normalizeOptions(options) {
      if (
        typeof options === "boolean"
      ) {
        return {
          updateHash: options,
          replaceHash: false,
          force: false,
          scrollToTop: true,
          source: "router"
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
          "router"
      };
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
    },

    /* =========================================================
       Initialization
    ========================================================= */

    init(options = {}) {
      if (this._initialized) {
        return this.getCurrentRoute();
      }

      this._initialized = true;

      this.bindHashNavigation();

      const hashRoute =
        this.normalize(
          window.location.hash
        );

      const storedRoute =
        this.readPersistedRoute();

      const initialRoute =
        this.resolve(
          hashRoute ||
          storedRoute ||
          this.getDefaultRoute()
        );

      this._currentRoute =
        initialRoute;

      this.persistRoute(
        initialRoute
      );

      if (
        options.navigate !== false
      ) {
        this.navigate(
          initialRoute,
          {
            updateHash:
              options.updateHash !== false,
            replaceHash: true,
            force:
              options.force === true,
            scrollToTop: false,
            source:
              options.source ||
              "router-init"
          }
        );
      }

      return initialRoute;
    }
  };

  /* =========================================================
     Global References
  ========================================================= */

  AIW.Router = Router;
  window.ATCRouter = Router;

  /*
   * The router does not auto-render modules before AIW.App is ready.
   * App bootstrap may call AIW.Router.init() after registering routes.
   */
})();
