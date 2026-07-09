/* =========================================================
   AI Transformation Center
   AI Ideas Center Module
   Version 1.0 Foundation
========================================================= */

const ATCIdeas = (function () {
  "use strict";

  const ideas = [
    ["💡", "المساعد الذكي للموظفين", "IT / HR", "عالي", "منخفض", 92],
    ["🛡️", "كشف التصيد الاحتيالي", "Cybersecurity", "عالي", "متوسط", 88],
    ["📊", "التقارير التنفيذية الذكية", "PMO / Strategy", "عالي", "منخفض", 91],
    ["⚖️", "مراجعة العقود بالذكاء الاصطناعي", "Legal", "متوسط", "متوسط", 76],
    ["💰", "تحليل الهدر المالي", "Finance", "عالي", "متوسط", 84],
    ["🎓", "التدريب الذكي للموظفين", "HR", "متوسط", "منخفض", 72],
    ["📞", "مساعد خدمة المتعاملين", "Customer Service", "عالي", "منخفض", 89],
    ["🏗️", "التنبؤ بسعة البنية التحتية", "IT", "متوسط", "متوسط", 78]
  ];

  function renderIdeas() {
    return `
      <section class="atc-section">
        <div class="atc-section-head">
          <div>
            <span class="atc-section-eyebrow">Ideas Catalog</span>
            <h2>كتالوج أفكار الذكاء الاصطناعي</h2>
          </div>
          <p>أفكار قابلة للتقييم والتحويل إلى مشاريع تنفيذية حسب الأثر والجهد والأولوية.</p>
        </div>

        <div class="atc-program-grid">
          ${ideas.map(idea => `
            <article class="atc-program-card">
              <div class="atc-program-icon">${idea[0]}</div>
              <h3>${idea[1]}</h3>
              <strong>${idea[2]}</strong>
              <p>الأثر: ${idea[3]} · الجهد: ${idea[4]}</p>
              <div class="atc-mini-line"><span style="width:${idea[5]}%"></span></div>
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
              <strong>AI Ideas Center</strong>
              <span>Innovation Pipeline</span>
            </div>
          </div>

          <div class="atc-top-actions">
            <button class="atc-icon-btn" onclick="ATCRouter.navigate('dashboard')" type="button">الرئيسية</button>
            <button class="atc-icon-btn" onclick="ATCRouter.navigate('projects')" type="button">المشاريع</button>
          </div>
        </header>

        <section class="atc-hero">
          <div class="atc-badge">AI Ideas · Catalog</div>
          <h1>مركز أفكار الذكاء الاصطناعي</h1>
          <p>
            منصة لتجميع الأفكار، تقييمها، ترتيب أولوياتها، وتحويل أفضلها إلى مشاريع تنفيذية.
          </p>

          <div class="atc-hero-actions">
            <button class="atc-primary-btn" type="button">إضافة فكرة</button>
            <button class="atc-secondary-btn" onclick="ATCRouter.navigate('dashboard')" type="button">العودة للرئيسية</button>
          </div>
        </section>

        <section class="atc-kpi-grid">
          <article class="atc-kpi-card">
            <span>إجمالي الأفكار</span>
            <strong>100</strong>
            <small>Total Ideas</small>
            <em>Catalog target</em>
          </article>

          <article class="atc-kpi-card">
            <span>أفكار عالية الأثر</span>
            <strong>32</strong>
            <small>High Impact</small>
            <em>Priority group</em>
          </article>

          <article class="atc-kpi-card">
            <span>قابلة للتنفيذ السريع</span>
            <strong>18</strong>
            <small>Quick Wins</small>
            <em>0–90 days</em>
          </article>

          <article class="atc-kpi-card">
            <span>متوسط التقييم</span>
            <strong>84%</strong>
            <small>Average Score</small>
            <em>AI evaluation</em>
          </article>
        </section>

        ${renderIdeas()}
      </main>
    `;
  }

  return {
    render
  };
})();


/* =========================================================
   AI Work - Ideas Module V1
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.ideas = {
  id: "ideas",
  title: "الأفكار",
  icon: "💡",

  render(container) {
    if (!container) return;

    container.innerHTML = `
      <section class="module-page">
        <div class="module-hero">
          <span class="module-kicker">Innovation Pipeline</span>
          <h1>مركز الأفكار</h1>
          <p>اجمع، صنّف، وقيّم أفكار التحول بالذكاء الاصطناعي قبل تحويلها إلى مشاريع.</p>
        </div>

        <div class="module-grid">
          <div class="module-card">
            <span>الأفكار النشطة</span>
            <strong>0</strong>
          </div>

          <div class="module-card">
            <span>قيد الدراسة</span>
            <strong>0</strong>
          </div>

          <div class="module-card">
            <span>جاهزة كمشروع</span>
            <strong>0</strong>
          </div>
        </div>

        <div class="module-panel">
          <h2>إضافة فكرة جديدة</h2>
          <input class="module-input" placeholder="اسم الفكرة">
          <textarea class="module-textarea" placeholder="وصف مختصر للفكرة"></textarea>
          <button class="module-btn">حفظ الفكرة</button>
        </div>
      </section>
    `;
  }
};