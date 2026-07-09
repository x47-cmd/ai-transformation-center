/* =========================================================
   AI Transformation Center
   Core Router
   Version 1.0 Foundation
========================================================= */

const ATCRouter = (function () {
  "use strict";

  const routes = {
    dashboard: function () {
      return ATCShell.render();
    },

    strategy: function () {
      return ATCStrategy.render();
    }
  };

  let currentRoute = "dashboard";

  function render(routeName) {
    const app = document.getElementById("app");

    if (!app) {
      console.error("ATC Router Error: #app container not found.");
      return;
    }

    const route = routes[routeName] || routes.dashboard;

    currentRoute = routes[routeName] ? routeName : "dashboard";

    app.innerHTML = route();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function navigate(routeName) {
    render(routeName);
  }

  function getCurrentRoute() {
    return currentRoute;
  }

  return {
    render,
    navigate,
    getCurrentRoute
  };
})();