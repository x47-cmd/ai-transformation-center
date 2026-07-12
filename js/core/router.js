/* =========================================================
   AI Work - Core Router V5.1
   Enterprise Lightweight Navigation Bridge
   Store V2.3 Native Architecture

   File Path:
   js/core/router.js

   V5.1 Performance Stabilization:
   - AIW.App remains the single owner of module rendering
   - Router acts only as a lightweight navigation API
   - Removes independent hashchange listeners
   - Removes duplicate route persistence
   - Removes duplicate routeChanged emissions
   - Prevents Router → App → Router navigation loops
   - Uses AIW.App History API behavior
   - Preserves ATCRouter legacy compatibility
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};

  const Router = {
    id: "router",
    version: "5.1.0",

    _initialized: false,
    _navigating: false,
    _lastNavigationKey: null,
    _currentRoute: null,
    _previousRoute: null,

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

    getApp() {
      return (
        window.AIW?.App ||
        window.ATCApp ||
        null
      );
    },

    getDefaultRoute() {
      const configured =
        this.getConfig()?.navigation?.defaultModule;

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
        this.getConfig()?.navigation?.modules;

      if (Array.isArray(modules)) {
        const configuredRoutes =
          modules
            .filter(
              module =>
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

    /* =======================================================
       Route Resolution
    ======================================================= */

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
        !this.getRoutes().includes(normalizedRoute)
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
        this.getRoutes().includes(normalizedRoute) ||
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
        this.getConfig()?.navigation?.modules;

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

      const app = this.getApp();

      if (
        app &&
        typeof app.getRoute === "function"
      ) {
        try {
          const appRoute =
            app.getRoute(resolvedRoute);

          if (appRoute) return appRoute;
        } catch (error) {
          console.warn(
            "[AIW.Router V5.1] App route lookup failed:",
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

    /* =======================================================
       Navigation
    ======================================================= */

    navigate(route, options = {}) {
      const config =
        this.normalizeOptions(options);

      const resolvedRoute =
        this.resolve(route);

      const currentRoute =
        this.getCurrentRoute();

      const navigationKey =
        [
          resolvedRoute,
          config.updateHash,
          config.replaceHash,
          config.force
        ].join("|");

      if (
        !config.force &&
        currentRoute === resolvedRoute &&
        this._lastNavigationKey === navigationKey
      ) {
        return resolvedRoute;
      }

      if (this._navigating) {
        return resolvedRoute;
      }

      this._navigating = true;
      this._lastNavigationKey = navigationKey;

      try {
        if (
          currentRoute &&
          currentRoute !== resolvedRoute
        ) {
          this._previousRoute =
            currentRoute;
        }

        this._currentRoute =
          resolvedRoute;

        const app = this.getApp();

        if (
          app &&
          typeof app.go === "function"
        ) {
          app.go(
            resolvedRoute,
            {
              updateHash:
                config.updateHash,

              replaceHash:
                config.replaceHash,

              force:
                config.force,

              scrollToTop:
                config.scrollToTop,

              source:
                config.source ||
                "router"
            }
          );

          return resolvedRoute;
        }

        this.emitNavigationRequest(
          resolvedRoute,
          config
        );

        return resolvedRoute;
      } catch (error) {
        console.error(
          "[AIW.Router V5.1] Navigation failed:",
          error
        );

        return resolvedRoute;
      } finally {
        this._navigating = false;
      }
    },

    go(route, options = {}) {
      return this.navigate(route, options);
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

      const app = this.getApp();

      if (
        app &&
        typeof app.renderModule === "function"
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

          return resolvedRoute;
        } catch (error) {
          console.error(
            "[AIW.Router V5.1] renderModule failed:",
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
      const app = this.getApp();

      if (
        app &&
        typeof app.refresh === "function"
      ) {
        try {
          app.refresh();
          return true;
        } catch (error) {
          console.error(
            "[AIW.Router V5.1] App refresh failed:",
            error
          );
        }
      }

      return false;
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

    /* =======================================================
       History
    ======================================================= */

    back() {
      if (
        window.history &&
        typeof window.history.back === "function"
      ) {
        window.history.back();
        return true;
      }

      if (this._previousRoute) {
        this.replace(
          this._previousRoute,
          {
            source:
              "router-back-fallback"
          }
        );

        return true;
      }

      return false;
    },

    forward() {
      if (
        window.history &&
        typeof window.history.forward === "function"
      ) {
        window.history.forward();
        return true;
      }

      return false;
    },

    /* =======================================================
       Current Route
    ======================================================= */

    getCurrentRoute() {
      const app = this.getApp();

      if (
        app &&
        typeof app.getCurrentRoute === "function"
      ) {
        try {
          const route =
            app.getCurrentRoute();

          if (route) {
            return this.resolve(route);
          }
        } catch (error) {
          console.warn(
            "[AIW.Router V5.1] getCurrentRoute failed:",
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

      return this.getDefaultRoute();
    },

    getPreviousRoute() {
      const app = this.getApp();

      if (
        app &&
        typeof app.getPreviousRoute === "function"
      ) {
        try {
          const route =
            app.getPreviousRoute();

          if (route) {
            return this.resolve(route);
          }
        } catch (error) {
          console.warn(
            "[AIW.Router V5.1] getPreviousRoute failed:",
            error
          );
        }
      }

      return this._previousRoute
        ? this.resolve(this._previousRoute)
        : null;
    },

    /* =======================================================
       Lightweight Event Fallback
    ======================================================= */

    emitNavigationRequest(
      route,
      options = {}
    ) {
      const detail = {
        route:
          this.resolve(route),

        updateHash:
          options.updateHash !== false,

        replaceHash:
          options.replaceHash === true,

        force:
          options.force === true,

        scrollToTop:
          options.scrollToTop !== false,

        source:
          options.source ||
          "router",

        timestamp:
          new Date().toISOString()
      };

      try {
        window.dispatchEvent(
          new CustomEvent(
            "aiw:navigate",
            { detail }
          )
        );

        return true;
      } catch (error) {
        console.warn(
          "[AIW.Router V5.1] Navigation request event failed:",
          error
        );

        return false;
      }
    },

    /* =======================================================
       Options
    ======================================================= */

    normalizeOptions(options) {
      if (typeof options === "boolean") {
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

    /* =======================================================
       Initialization
    ======================================================= */

    init(options = {}) {
      if (this._initialized) {
        return this.getCurrentRoute();
      }

      this._initialized = true;

      const hashRoute =
        this.normalize(
          window.location.hash
        );

      const initialRoute =
        this.resolve(
          hashRoute ||
          this.getDefaultRoute()
        );

      this._currentRoute =
        initialRoute;

      if (options.navigate !== false) {
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
    },

    getStatus() {
      return {
        name: "Core Router",
        version: this.version,
        initialized:
          this._initialized,
        navigating:
          this._navigating,
        currentRoute:
          this.getCurrentRoute(),
        previousRoute:
          this.getPreviousRoute()
      };
    }
  };

  /* =======================================================
     Global References
  ======================================================= */

  AIW.Router = Router;
  window.ATCRouter = Router;
})();
