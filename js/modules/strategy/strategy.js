/* =========================================================
   AI Transformation Center
   Strategy Center Module
   Version 1.0 Foundation
========================================================= */

const ATCStrategy = (function () {
  "use strict";

  const pillars = [
    ["⚙️", "أتمتة العمليات", "Operational Automation", "تقليل الجهد اليدوي وتسريع إنجاز المعاملات والإجراءات."],
    ["📊", "القرار المدعوم بالبيانات", "Data Driven Decisions", "تمكين القيادات من اتخاذ قرارات أسرع وأكثر دقة."],
    ["🛡️", "الأمن الرقمي الذكي", "AI Cyber Resilience", "اكتشاف التهديدات والاستجابة لها بشكل استباقي."],
    ["💡", "ثقافة الابتكار", "Innovation Culture", "تحويل خبرات الموظفين إلى أفكار ومشاريع تنفيذية."],
    ["🤖", "الموظف الرقمي", "Digital Workforce", "توفير مساعدات ذكية تنفذ المهام الروتينية وتدعم الموظفين."],
    ["🏛️", "الحوكمة المسؤولة", "Responsible AI", "ضمان الخصوصية، الشفافية، والإشراف البشري على القرارات الحرجة."]
  ];

  const principles = [
    "الإنسان أولاً",
    "الخصوصية والأمن أولاً",
    "البيانات مصدر القرار",
    "الشفافية وقابلية التفسير",
    "قابلية التوسع والاستدامة",
    "الابتكار المسؤول"
  ];

  function renderPillars() {
    return `
      <section class="atc-section">
        <div class="atc-section-head">
          <div>
            <span class="atc-section-eyebrow">Strategic Pillars</span>
            <h2>الركائز الاستراتيجية</h2>
          </div>
          <p>الركائز التي توجه جميع مشاريع ومبادرات الذكاء الاصطناعي داخل المنصة.</p>
        </div>

        <div class="atc-program-grid">
          ${pillars.map(pillar => `
            <article class="atc-program-card">
              <div class="atc-program-icon">${pillar[0]}</div>
              <h3>${pillar[1]}</h3>
              <strong>${pillar[2]}</strong>
              <p>${pillar[3]}</p>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderPrinciples() {
    return `
      <section class="atc-section">
        <div class="atc-section-head">
          <div>
            <span class="atc-section-eyebrow">Guiding Principles</span>
            <h2>مبادئ التحول</h2>
          </div>
          <p>قواعد ثابتة تضمن أن يكون الذكاء الاصطناعي آمنًا، مسؤولًا، وموجّهًا للأثر.</p>
        </div>

        <div class="atc-dept-grid">
          ${principles.map((item, index) => `
            <article class="atc-dept-card">
              <h3>${String(index + 1).padStart(2, "0")}</h3>
              <p>${item}</p>
              <div class="atc-mini-line"><span style="width:${55 + index * 7}%"></span></div>
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
              <strong>Strategy Center</strong>
              <span>AI Transformation Strategy</span>
            </div>
          </div>

          <div class="atc-top-actions">
            <button class="atc-icon-btn" type="button">عربي / EN</button>
            <button class="atc-icon-btn" type="button">☀︎</button>
          </div>
        </header>

        <section class="atc-hero">
          <div class="atc-badge">AI Strategy · 2026–2030</div>
          <h1>استراتيجية التحول المؤسسي بالذكاء الاصطناعي</h1>
          <p>
            رؤية تنفيذية لتحويل الذكاء الاصطناعي من أفكار ومبادرات منفصلة
            إلى برنامج مؤسسي متكامل يقود الأداء والابتكار واتخاذ القرار.
          </p>

          <div class="atc-hero-actions">
            <button class="atc-primary-btn" type="button" onclick="ATCRouter.navigate('dashboard')">
  العودة للرئيسية
</button>

<button class="atc-secondary-btn" type="button">
  الرؤية 2030
</button>
          </div>
        </section>

        <section class="atc-two-col">
          <article class="atc-panel">
            <span class="atc-section-eyebrow">Vision</span>
            <h2>الرؤية</h2>
            <p>
              بناء مؤسسة حكومية مدعومة بالذكاء الاصطناعي، قادرة على التنبؤ،
              الأتمتة، إدارة المعرفة، وتحسين الخدمات بصورة مستمرة.
            </p>
          </article>

          <article class="atc-panel">
            <span class="atc-section-eyebrow">Mission</span>
            <h2>الرسالة</h2>
            <p>
              تمكين الإدارات من تحويل تحدياتها التشغيلية إلى مشاريع ذكاء اصطناعي
              قابلة للتنفيذ والقياس والحوكمة.
            </p>
          </article>
        </section>

        ${renderPillars()}
        ${renderPrinciples()}
      </main>
    `;
  }

  return {
    render
  };
})();