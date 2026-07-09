/* =========================================================
   AI Transformation Center
   Projects Portfolio Module
   Version 1.0 Foundation
========================================================= */

const ATCProjects = (function () {
  "use strict";

  const projects = [
    ["🤖", "المساعد المؤسسي الذكي", "Enterprise AI Assistant", "عالية", "6 أشهر", "متوسط", 72],
    ["🛡️", "مركز الأمن السيبراني الذكي", "AI Cyber Shield", "عالية", "9 أشهر", "مرتفع", 58],
    ["📊", "مركز اتخاذ القرار", "AI Decision Center", "عالية", "8 أشهر", "مرتفع", 64],
    ["🧠", "التوأم الرقمي للإدارة", "Digital Twin", "استراتيجية", "12 شهر", "مرتفع", 38],
    ["💡", "منصة الأفكار الذكية", "AI Ideas Platform", "عالية", "4 أشهر", "متوسط", 82],
    ["📑", "التقارير الذكية", "AI Reports", "عالية", "3 أشهر", "منخفض", 88]
  ];

  function renderProjects() {
    return `
      <section class="atc-section">
        <div class="atc-section-head">
          <div>
            <span class="atc-section-eyebrow">Projects Portfolio</span>
            <h2>محفظة مشاريع الذكاء الاصطناعي</h2>
          </div>
          <p>عرض تنفيذي للمشاريع ذات الأولوية مع الحالة، الجهد، والجاهزية.</p>
        </div>

        <div class="atc-program-grid">
          ${projects.map(project => `
            <article class="atc-program-card">
              <div class="atc-program-icon">${project[0]}</div>
              <h3>${project[1]}</h3>
              <strong>${project[2]}</strong>
              <p>الأولوية: ${project[3]} · المدة: ${project[4]} · الجهد: ${project[5]}</p>
              <div class="atc-mini-line"><span style="width:${project[6]}%"></span></div>
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
          <div class="atc-brand">
            <div class="atc-logo">AI</div>
            <div>
              <strong>Projects Portfolio</strong>
              <span>AI Transformation Projects</span>
            </div>
          </div>

          <div class="atc-top-actions">
            <button class="atc-icon-btn" onclick="ATCRouter.navigate('dashboard')" type="button">الرئيسية</button>
            <button class="atc-icon-btn" type="button">عربي / EN</button>
          </div>
        </header>

        <section class="atc-hero">
          <div class="atc-badge">AI Projects · Portfolio</div>
          <h1>محفظة مشاريع الذكاء الاصطناعي</h1>
          <p>
            تحويل المبادرات والأفكار إلى مشاريع تنفيذية واضحة الأولوية،
            قابلة للقياس، ومرتبطة بخارطة التحول المؤسسي.
          </p>

          <div class="atc-hero-actions">
            <button class="atc-primary-btn" type="button">إضافة مشروع</button>
            <button class="atc-secondary-btn" onclick="ATCRouter.navigate('dashboard')" type="button">العودة للرئيسية</button>
          </div>
        </section>

        <section class="atc-kpi-grid">
          <article class="atc-kpi-card">
            <span>إجمالي المشاريع</span>
            <strong>15</strong>
            <small>Total Projects</small>
            <em>Portfolio scope</em>
          </article>

          <article class="atc-kpi-card">
            <span>مشاريع عاجلة</span>
            <strong>6</strong>
            <small>Quick Wins</small>
            <em>0–6 months</em>
          </article>

          <article class="atc-kpi-card">
            <span>صحة المحفظة</span>
            <strong>68%</strong>
            <small>Portfolio Health</small>
            <em>Healthy</em>
          </article>

          <article class="atc-kpi-card">
            <span>العائد المتوقع</span>
            <strong>42M</strong>
            <small>Expected ROI</small>
            <em>AED forecast</em>
          </article>
        </section>

        ${renderProjects()}
      </main>
    `;
  }

  return {
    render
  };
})();