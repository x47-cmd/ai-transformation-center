/* =========================================================
   AI Transformation Center
   App Shell
   Version 1.0 Foundation
========================================================= */

const ATCShell = (function () {
  "use strict";

  function renderKpis() {
    return `
      <section class="atc-kpi-grid">
        <article class="atc-kpi-card">
          <span>المشاريع الاستراتيجية</span>
          <strong>15</strong>
          <small>Strategic Projects</small>
        </article>

        <article class="atc-kpi-card">
          <span>أفكار الذكاء الاصطناعي</span>
          <strong>100</strong>
          <small>AI Ideas</small>
        </article>

        <article class="atc-kpi-card">
          <span>الإدارات المشاركة</span>
          <strong>11</strong>
          <small>Departments</small>
        </article>

        <article class="atc-kpi-card">
          <span>نضج الذكاء الاصطناعي</span>
          <strong>34%</strong>
          <small>AI Maturity</small>
        </article>
      </section>
    `;
  }

  function render() {
    return `
      <main class="atc-shell">
        <header class="atc-topbar">
          <div class="atc-logo">AI</div>

          <div class="atc-top-actions">
            <button class="atc-icon-btn" id="atcLangBtn" type="button">عربي / EN</button>
            <button class="atc-icon-btn" id="atcThemeBtn" type="button">☀︎</button>
          </div>
        </header>

        <section class="atc-hero">
          <div class="atc-badge">V1.0 Foundation</div>

          <h1>مركز التحول المؤسسي بالذكاء الاصطناعي</h1>

          <p>AI Transformation Center</p>

          <div class="atc-hero-actions">
            <button class="atc-primary-btn" type="button">استعراض المنصة</button>
            <button class="atc-secondary-btn" type="button">Executive Dashboard</button>
          </div>
        </section>

        ${renderKpis()}
      </main>
    `;
  }

  return {
    render
  };
})();