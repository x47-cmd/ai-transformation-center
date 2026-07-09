/* =========================================================
   Personal Wealth Center - Navigation V2
========================================================= */

window.PWC = window.PWC || {};

PWC.Navigation = {
  init() {
    this.render();

    PWC.Events.on("pwc:routeChanged", ({ current }) => {
      this.setActive(current);
    });
  },

  render() {
    const nav = document.getElementById("bottomNav");
    if (!nav) return;

    const routes = Object.values(PWC.Router.routes);

    nav.innerHTML = routes.map(route => `
      <button class="pwc-nav-item" data-route="${route.id}">
        <span class="pwc-nav-icon">${route.icon}</span>
        <span class="pwc-nav-label">${route.title}</span>
      </button>
    `).join("");

    nav.querySelectorAll(".pwc-nav-item").forEach(btn => {
      btn.addEventListener("click", () => {
        PWC.Router.go(btn.dataset.route);
      });
    });

    this.setActive(PWC.Router.current);
  },

  setActive(id) {
    document.querySelectorAll(".pwc-nav-item").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.route === id);
    });
  }
};