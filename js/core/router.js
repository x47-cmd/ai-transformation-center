/* =========================================================
   AI Transformation Center
   Core Router V3 Safe Bridge
========================================================= */

(function () {
  "use strict";

  window.ATCRouter = {
    navigate(route) {
      if (window.ATCApp && typeof window.ATCApp.go === "function") {
        window.ATCApp.go(route);
        return;
      }

      location.hash = route || "dashboard";
    },

    render(route) {
      this.navigate(route);
    },

    getCurrentRoute() {
      return location.hash.replace("#", "") || "dashboard";
    }
  };
})();