/* =========================================================
   Personal Wealth Center - Events V2
========================================================= */

window.PWC = window.PWC || {};

PWC.Events = {
  events: {},

  on(name, callback) {
    if (!this.events[name]) this.events[name] = [];
    this.events[name].push(callback);
  },

  off(name, callback) {
    if (!this.events[name]) return;
    this.events[name] = this.events[name].filter(cb => cb !== callback);
  },

  emit(name, payload) {
    if (!this.events[name]) return;
    this.events[name].forEach(callback => {
      try {
        callback(payload);
      } catch (e) {
        console.error("PWC Event Error:", name, e);
      }
    });
  }
};

PWC.EVENT_NAMES = {
  DATA_CHANGED: "pwc:dataChanged",
  SETTINGS_CHANGED: "pwc:settingsChanged",
  ROUTE_CHANGED: "pwc:routeChanged",
  PORTFOLIO_CHANGED: "pwc:portfolioChanged",
  SPENDING_CHANGED: "pwc:spendingChanged",
  ASSETS_CHANGED: "pwc:assetsChanged",
  LIABILITIES_CHANGED: "pwc:liabilitiesChanged",
  GOALS_CHANGED: "pwc:goalsChanged"
};