/* =========================================================
   Personal Wealth Center - Layout V2
========================================================= */

window.PWC = window.PWC || {};

PWC.Layout = {
  init() {
    this.renderHeader();

    PWC.Events.on("pwc:routeChanged", ({ route }) => {
      this.updateHeader(route);
    });

    PWC.Events.on("pwc:dataChanged", () => {
      this.renderHeader();
    });
  },

  renderHeader() {
    const header = document.getElementById("appHeader");
    if (!header) return;

    const calc = PWC.Store.calculate();
    const route = PWC.Router.routes[PWC.Router.current] || PWC.Router.routes.home;

    header.innerHTML = `
      <div class="pwc-header">
        <div>
          <div class="pwc-header-kicker">مركز إدارة الثروة الشخصية</div>
          <h1 id="headerTitle">${route.title}</h1>
        </div>

        <div class="pwc-header-networth">
          <span>صافي الثروة</span>
          <strong>${this.money(calc.netWorth)}</strong>
        </div>
      </div>
    `;
  },

  updateHeader(route) {
    const title = document.getElementById("headerTitle");
    if (title) title.textContent = route.title;
  },

  money(value) {
    return `${Math.round(Number(value || 0)).toLocaleString("en-US")} AED`;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  PWC.Layout.init();
  PWC.Navigation.init();
  PWC.Router.init();
});