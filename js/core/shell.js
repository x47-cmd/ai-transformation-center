/* =========================================================
   AI Transformation Center
   Executive Dashboard Shell
   Version 1.0 Foundation
========================================================= */

const ATCShell = (function () {
  "use strict";

  const kpis = [
    ["15", "المشاريع الاستراتيجية", "Strategic Projects", "+6 Quick Wins"],
    ["100", "أفكار الذكاء الاصطناعي", "AI Ideas", "Across 11 departments"],
    ["11", "الإدارات المشاركة", "Departments", "Enterprise coverage"],
    ["34%", "نضج الذكاء الاصطناعي", "AI Maturity", "Current baseline"],
    ["42M", "العائد المتوقع", "Expected ROI", "AED forecast"],
    ["68%", "صحة المحفظة", "Portfolio Health", "Healthy"],
    ["24/7", "رصد ذكي", "AI Monitoring", "Always on"],
    ["2030", "الرؤية المستهدفة", "Target Vision", "AI Driven Organization"]
  ];

  const programs = [
    ["🤖", "المساعد المؤسسي الذكي", "Enterprise AI Assistant", "مساعد موحد للموظفين والقيادات للوصول للمعرفة والخدمات بسرعة."],
    ["🛡️", "مركز الأمن السيبراني الذكي", "AI Cyber Shield", "تحليل تنبؤي للتهديدات واكتشاف الشذوذ والاستجابة الاستباقية."],
    ["📊", "مركز اتخاذ القرار", "AI Decision Center", "لوحة تنفيذية تجمع المؤشرات والتقارير والتحليلات لدعم القرار."],
    ["🧠", "التوأم الرقمي للإدارة", "Digital Twin", "محاكاة ذكية للعمليات والموارد لاختبار القرارات قبل تطبيقها."],
    ["💡", "منصة الأفكار الذكية", "AI Ideas Platform", "استقبال وتقييم وترتيب وتحويل الأفكار إلى مشاريع قابلة للتنفيذ."],
    ["🏛️", "حوكمة الذكاء الاصطناعي", "Responsible AI Governance", "سياسات، خصوصية، أمن، إشراف بشري، ومراجعة أخلاقية للمشاريع."]
  ];

  const roadmap = [
    ["2026", "Foundation & Quick Wins", "تأسيس المنصة والمكاسب السريعة", 35],
    ["2027", "Institutional AI", "ربط الإدارات وإطلاق المشاريع المؤسسية", 50],
    ["2028", "Enterprise Intelligence", "توسيع التحليلات والتقارير الذكية", 65],
    ["2029", "Predictive Government", "التنبؤ والمساعدات التنفيذية", 82],
    ["2030", "AI Driven Organization", "مؤسسة مدعومة بالذكاء الاصطناعي", 100]
  ];

  const departments = [
    ["تقنية المعلومات", "IT", 82],
    ["الأمن الرقمي", "Cybersecurity", 78],
    ["الموارد البشرية", "HR", 52],
    ["المالية", "Finance", 48],
    ["الشؤون القانونية", "Legal", 38],
    ["خدمة المتعاملين", "Customer Service", 58]
  ];

  const risks = [
    ["جودة البيانات", "متوسط", "Data Quality"],
    ["الخصوصية والامتثال", "مرتفع", "Privacy"],
    ["تبني الموظفين", "متوسط", "Adoption"],
    ["تكامل الأنظمة", "متوسط", "Integration"]
  ];

  const activities = [
    "تم إنشاء الهيكل المعماري للمنصة",
    "تم اعتماد نموذج البيانات المركزي",
    "تم اعتماد دعم العربية والإنجليزية من البداية",
    "تم بناء Dashboard تنفيذي أولي"
  ];

  function renderKpis() {
    return `
      <section class="atc-kpi-grid">
        ${kpis.map(item => `
          <article class="atc-kpi-card">
            <span>${item[1]}</span>
            <strong>${item[0]}</strong>
            <small>${item[2]}</small>
            <em>${item[3]}</em>
          </article>
        `).join("")}
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
          <p>محفظة تنفيذية لأهم البرامج التي تشكل العمود الفقري للتحول المؤسسي.</p>
        </div>

        <div class="atc-program-grid">
          ${programs.map(program => `
            <article class="atc-program-card">
              <div class="atc-program-icon">${program[0]}</div>
              <h3>${program[1]}</h3>
              <strong>${program[2]}</strong>
              <p>${program[3]}</p>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderRoadmap() {
    return `
      <section class="atc-section">
        <div class="atc-section-head">
          <div>
            <span class="atc-section-eyebrow">Roadmap</span>
            <h2>خارطة الطريق 2026–2030</h2>
          </div>
          <p>مسار تدريجي يحول الأفكار إلى مشاريع ثم إلى قدرات مؤسسية مستدامة.</p>
        </div>

        <div class="atc-roadmap">
          ${roadmap.map(phase => `
            <article class="atc-roadmap-card">
              <div class="atc-roadmap-year">${phase[0]}</div>
              <div class="atc-roadmap-line"><span style="width:${phase[3]}%"></span></div>
              <h3>${phase[1]}</h3>
              <p>${phase[2]}</p>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderDepartments() {
    return `
      <section class="atc-section">
        <div class="atc-section-head">
          <div>
            <span class="atc-section-eyebrow">AI Maturity</span>
            <h2>نضج الإدارات وجاهزيتها</h2>
          </div>
          <p>قراءة أولية لمدى جاهزية الإدارات لتبني مشاريع الذكاء الاصطناعي.</p>
        </div>

        <div class="atc-dept-grid">
          ${departments.map(dep => `
            <article class="atc-dept-card">
              <div>
                <h3>${dep[0]}</h3>
                <p>${dep[1]}</p>
              </div>
              <strong>${dep[2]}%</strong>
              <div class="atc-mini-line"><span style="width:${dep[2]}%"></span></div>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderExecutivePanel() {
    return `
      <section class="atc-two-col">
        <article class="atc-panel">
          <span class="atc-section-eyebrow">Executive Decision Center</span>
          <h2>ماذا نبدأ الآن؟</h2>
          <p>
            التوصية التنفيذية للمرحلة الأولى هي البدء بثلاثة مشاريع سريعة الأثر:
            المساعد الذكي، التقارير الذكية، ومنصة تقييم الأفكار.
          </p>

          <div class="atc-action-list">
            <div>✅ اعتماد المرحلة الأولى</div>
            <div>✅ تشكيل مكتب التحول بالذكاء الاصطناعي</div>
            <div>✅ إطلاق 3 مشاريع PoC خلال 90 يوم</div>
          </div>
        </article>

        <article class="atc-panel">
          <span class="atc-section-eyebrow">Risk Matrix</span>
          <h2>ملخص المخاطر</h2>
          <div class="atc-risk-list">
            ${risks.map(risk => `
              <div class="atc-risk-item">
                <span>${risk[0]}</span>
                <strong>${risk[1]}</strong>
                <small>${risk[2]}</small>
              </div>
            `).join("")}
          </div>
        </article>
      </section>
    `;
  }

  function renderInsights() {
    return `
      <section class="atc-two-col">
        <article class="atc-panel atc-ai-panel">
          <span class="atc-section-eyebrow">AI Insights</span>
          <h2>رؤية الذكاء الاصطناعي</h2>
          <p>
            المنصة تشير إلى أن أعلى قيمة تنفيذية ستتحقق عند البدء بالمشاريع منخفضة الجهد
            وعالية الأثر، ثم التوسع تدريجيًا نحو التحليلات التنبؤية والتوأم الرقمي.
          </p>
        </article>

        <article class="atc-panel">
          <span class="atc-section-eyebrow">Recent Activities</span>
          <h2>آخر التحديثات</h2>
          <div class="atc-activity-list">
            ${activities.map(activity => `<div>${activity}</div>`).join("")}
          </div>
        </article>
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
              <strong>AI Transformation Center</strong>
              <span>Executive Operating System</span>
            </div>
          </div>

          <div class="atc-top-actions">
            <button class="atc-icon-btn" id="atcLangBtn" type="button">عربي / EN</button>
            <button class="atc-icon-btn" id="atcThemeBtn" type="button">☀︎</button>
          </div>
        </header>

        <section class="atc-hero">
          <div class="atc-badge">V1.0 Foundation · 2026–2030</div>
          <h1>مركز التحول المؤسسي بالذكاء الاصطناعي</h1>
          <p>AI Transformation Center — Building the AI-Driven Government</p>

          <div class="atc-hero-actions">
            <button class="atc-primary-btn" type="button">استعراض المنصة</button>
            <button class="atc-secondary-btn" type="button">Executive Dashboard</button>
          </div>
        </section>

        ${renderKpis()}
        ${renderExecutivePanel()}
        ${renderPrograms()}
        ${renderRoadmap()}
        ${renderDepartments()}
        ${renderInsights()}

        <footer class="atc-footer">
          <strong>AI Transformation Center</strong>
          <span>Version 1.0 Foundation · Enterprise AI Transformation Platform</span>
        </footer>
      </main>
    `;
  }

  return { render };
})();