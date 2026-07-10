/* =========================================================
   AI Work - Core Router V3.1
   Enterprise Safe Navigation Bridge

   Features:
   - AIW.Router Unified Interface
   - AIW.App Integration
   - ATCRouter Legacy Compatibility
   - Route Validation
   - Route Aliases
   - Hash Navigation
   - Current Route Access
   - Back / Forward Navigation
   - Safe Fallback Navigation
   - No Duplicate Rendering
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};

  const Router = {
    id: "router",
    version: "3.1.0",
    defaultRoute: "dashboard",

    routes: [
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
       ROUTE RESOLUTION
    ========================================================= */

    normalize(route) {
      return String(route || "")
        .trim()
        .toLowerCase()
        .replace(/^#/, "")
        .replace(/^\/+/, "")
        .split("?")[0]
        .split("/")[0];
    },

    resolve(route) {
      let normalizedRoute = this.normalize(route);

      if (!normalizedRoute) {
        return this.defaultRoute;
      }

      if (this.aliases[normalizedRoute]) {
        normalizedRoute =
          this.aliases[normalizedRoute];
      }

      if (!this.routes.includes(normalizedRoute)) {
        return this.defaultRoute;
      }

      return normalizedRoute;
    },

    isValid(route) {
      const normalizedRoute =
        this.normalize(route);

      return Boolean(
        this.routes.includes(normalizedRoute) ||
        this.aliases[normalizedRoute]
      );
    },

    has(route) {
      return this.isValid(route);
    },

    /* =========================================================
       NAVIGATION
    ========================================================= */

    navigate(route, options = {}) {
      const resolvedRoute =
        this.resolve(route);

      const app =
        window.AIW?.App ||
        window.ATCApp;

      if (
        app &&
        typeof app.go === "function"
      ) {
        app.go(
          resolvedRoute,
          this.normalizeOptions(options)
        );

        return resolvedRoute;
      }

      this.updateHash(
        resolvedRoute,
        options
      );

      return resolvedRoute;
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
          replaceHash: false
        }
      );
    },

    replace(route, options = {}) {
      return this.navigate(
        route,
        {
          ...this.normalizeOptions(options),
          updateHash: true,
          replaceHash: true
        }
      );
    },

    render(route, options = {}) {
      const resolvedRoute =
        this.resolve(route);

      const app =
        window.AIW?.App ||
        window.ATCApp;

      if (
        app &&
        typeof app.renderModule ===
          "function"
      ) {
        app.renderModule(
          resolvedRoute,
          {
            force: true,
            source:
              options.source ||
              "router-render"
          }
        );

        return resolvedRoute;
      }

      return this.navigate(
        resolvedRoute,
        options
      );
    },

    refresh() {
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

      return this.render(
        this.getCurrentRoute()
      );
    },

    /* =========================================================
       HISTORY
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

    reload() {
      const currentRoute =
        this.getCurrentRoute();

      return this.render(
        currentRoute,
        {
          source: "router-reload"
        }
      );
    },

    /* =========================================================
       CURRENT ROUTE
    ========================================================= */

    getCurrentRoute() {
      const app =
        window.AIW?.App ||
        window.ATCApp;

      if (
        app &&
        typeof app.getCurrentRoute ===
          "function"
      ) {
        const currentRoute =
          app.getCurrentRoute();

        if (currentRoute) {
          return this.resolve(
            currentRoute
          );
        }
      }

      return this.resolve(
        window.location.hash
      );
    },

    getPreviousRoute() {
      const app =
        window.AIW?.App ||
        window.ATCApp;

      if (
        app &&
        typeof app.getPreviousRoute ===
          "function"
      ) {
        return app.getPreviousRoute();
      }

      return null;
    },

    getRouteInfo(route) {
      const resolvedRoute =
        this.resolve(route);

      const app =
        window.AIW?.App ||
        window.ATCApp;

      if (
        app &&
        typeof app.getRoute === "function"
      ) {
        return app.getRoute(
          resolvedRoute
        );
      }

      return {
        id: resolvedRoute,
        title: resolvedRoute
      };
    },

    /* =========================================================
       HASH FALLBACK
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
          window.history.replaceState(
            null,
            "",
            nextHash
          );

          return resolvedRoute;
        }

        window.location.hash =
          resolvedRoute;
      } catch (error) {
        window.location.hash =
          resolvedRoute;
      }

      return resolvedRoute;
    },

    normalizeOptions(options) {
      if (
        typeof options === "boolean"
      ) {
        return {
          updateHash: options,
          replaceHash: false,
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

    /* =========================================================
       EVENT NAVIGATION
    ========================================================= */

    emitNavigation(route, options = {}) {
      const resolvedRoute =
        this.resolve(route);

      window.dispatchEvent(
        new CustomEvent(
          "aiw:navigate",
          {
            detail: {
              route:
                resolvedRoute,
              ...this.normalizeOptions(
                options
              )
            }
          }
        )
      );

      return resolvedRoute;
    }
  };

  /* =========================================================
     GLOBAL REFERENCES
  ========================================================= */

  AIW.Router = Router;

  /*
   * Legacy compatibility:
   * Existing files may still call ATCRouter.navigate().
   */
  window.ATCRouter = Router;
})();