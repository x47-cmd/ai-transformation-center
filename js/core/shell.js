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

  function renderPrograms() {
    return `
      <section class="atc-section">
        <div class="atc-section-head">
          <div>
            <span class="atc-section-eyebrow">Strategic Programs</span>
            <h2>البرامج الاستراتيجية للتحول بالذكاء الاصطناعي</h2>
          </div>
          <p>محفظة أولية لأهم البرامج التي تشكل العمود الفقري للمنصة.</p>
        </div>

        <div class="atc-program-grid">
          <article class="atc-program-card">
            <div class="atc-program-icon">🤖</div>
            <h3>المساعد المؤسسي الذكي</h3>
            <p>مساعد موحد للموظفين والقيادات للوصول للمعرفة والخدمات بسرعة.</p>
          </article>
          <article class="atc-program-card">
            <div class="atc-program-icon">🛡️</div>
            <h3>مركز الأمن السيبراني الذكي</h3>
            <p>تحليل تنبؤي للتهديدات واكتشاف الشذوذ والاستجابة الاستباقية.</p>
          </article>
          <article class="atc-program-card">
            <div class="atc-program-icon">📊</div>
            <h3>مركز اتخاذ القرار</h3>
            <p>لوحة تنفيذية تجمع المؤشرات والتقارير والتحليلات لدعم القرار.</p>
          </article>
          <article class="atc-program-card">
            <div class="atc-program-icon">🧠</div>
            <h3>التوأم الرقمي للإدارة</h3>
            <p>محاكاة ذكية للعمليات والموارد لاختبار القرارات قبل تطبيقها.</p>
          </article>
        </div>
      </section>
    `;
  }

  function renderRoadmap() {
    const phases = [
      ["2026", "Foundation & Quick Wins", "تأسيس المنصة والمكاسب السريعة"],
      ["2027", "Institutional AI", "ربط الإدارات وإطلاق المشاريع المؤسسية"],
      ["2028", "Enterprise Intelligence", "توسيع التحليلات والتقارير الذكية"],
      ["2029", "Predictive Government", "التنبؤ والمساعدات التنفيذية"],
      ["2030", "AI Driven Organization", "مؤسسة مدعومة بالذكاء الاصطناعي"]
    ];

    return `
      <section class="atc-section">
        <div class="atc-section-head">
          <div>
            <span class="atc-section-eyebrow">Roadmap</span>
            <h2>خارطة الطريق 2026–2030</h2>
          </div>
          <p>مسار تدريجي يحول الأفكار إلى مشاريع، ثم إلى قدرات مؤسسية مستدامة.</p>
        </div>

        <div class="atc-roadmap">
          ${phases.map((phase, index) => `
            <article class="atc-roadmap-card">
              <div class="atc-roadmap-year">${phase[0]}</div>
              <div class="atc-roadmap-line">
                <span style="width:${35 + index * 15}%"></span>
              </div>
              <h3>${phase[1]}</h3>
              <p>${phase[2]}</p>
            </article>
          `).join("")}
        </div>
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
        ${renderPrograms()}
        ${renderRoadmap()}
      </main>
    `;
  }

  return { render };
})();