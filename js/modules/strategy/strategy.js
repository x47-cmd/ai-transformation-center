/* =========================================================
   AI Work - Strategy Module V3.1
   Enterprise Biometric Intelligence Strategy
   No UI Design Changes
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.strategy = {
  id: "strategy",
  title: "الاستراتيجية",
  icon: "🎯",

  goals: [
    {
      title: "رفع جودة وسلامة البيانات البيومترية",
      desc: "استخدام الذكاء الاصطناعي لاكتشاف التسجيلات الخاطئة، السجلات المتعارضة، والبيانات التي تحتاج مراجعة قبل تأثيرها على التشغيل.",
      priority: "عالية"
    },
    {
      title: "تعزيز الرقابة الذكية على المستخدمين والصلاحيات",
      desc: "تحليل سلوك استخدام الحسابات والصلاحيات لاكتشاف الأنماط غير الاعتيادية، الجلسات الطويلة، واحتمالات إساءة استخدام الصلاحيات.",
      priority: "عالية"
    },
    {
      title: "تحسين أداء البوابات الذكية في المطارات",
      desc: "قياس أداء البوابات، زمن العبور، الأعطال، ونسب النجاح لتحسين الجاهزية والانسيابية التشغيلية.",
      priority: "عالية"
    },
    {
      title: "بناء حوكمة مسؤولة للذكاء الاصطناعي",
      desc: "اعتماد الإشراف البشري، الخصوصية، التدرج في التنبيهات، وتوثيق المراجعات في جميع الحالات الحساسة.",
      priority: "عالية"
    }
  ],

  pillars: [
    ["👁️", "سلامة البيانات البيومترية", "كشف الأخطاء والتعارضات ورفع جودة التسجيلات."],
    ["🛂", "ذكاء البوابات الذكية", "تحليل الأداء والجاهزية وزمن العبور والأعطال."],
    ["👨🏻‍💻", "سلوك المستخدمين والصلاحيات", "مراقبة الاستخدام واكتشاف الأنماط غير الطبيعية."],
    ["🔐", "الأمن الرقمي والامتثال", "تعزيز الرقابة والتنبيهات الذكية وحوكمة الوصول."],
    ["📊", "التحليلات التنفيذية", "لوحات Power BI ومؤشرات قياس وتوصيات للإدارة."],
    ["🏛️", "الحوكمة المسؤولة", "إشراف بشري وخصوصية وتوثيق ومراجعة مستمرة."]
  ],

  render(container) {
    if (!container) return;

    const data = window.AIW?.Data || {};
    const summary = data.summary || {};
    const roadmap = data.roadmap || [];
    const horizons = data.projectHorizons || [];
    const governance = data.governance || [];
    const recommendations = data.recommendations || [];

    container.innerHTML = `
      <section class="module-page">

<div class="page-credit">
  <span>Designed &amp; Developed by:</span>
  <strong>يوسف الحوسني</strong>
</div>

        <div class="module-hero">
          <span class="module-kicker">Biometric AI Strategy · ${summary.period || "2026–2030"}</span>
          <h1>مركز الاستراتيجية</h1>
          <p>
            استراتيجية متخصصة لتحويل تحديات الأنظمة البيومترية والبوابات الذكية
            إلى مشاريع ذكاء اصطناعي قابلة للتنفيذ والقياس والحوكمة.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">👁️ Biometric Intelligence</span>
            <span class="aiw-chip">🛂 Smart Gates</span>
            <span class="aiw-chip">🔐 Digital Security</span>
            <span class="aiw-chip">📅 ${summary.period || "2026–2030"}</span>
          </div>
        </div>

        <div class="module-grid">
          ${this.kpi("الأهداف الاستراتيجية", this.goals.length, "Strategic Goals")}
          ${this.kpi("الركائز", this.pillars.length, "Transformation Pillars")}
          ${this.kpi("مراحل الطريق", roadmap.length, "Roadmap Phases")}
          ${this.kpi("الأفكار المستهدفة", summary.targetIdeas || 100, "Target Ideas")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>الرؤية والرسالة</h2>
              <p>الأساس التنفيذي الذي يوجه جميع مبادرات الذكاء الاصطناعي المتخصصة.</p>
            </div>

            <div class="strategy-statement">
              <span>الرؤية</span>
              <strong>${summary.vision || ""}</strong>
            </div>

            <div class="strategy-statement">
              <span>الرسالة</span>
              <strong>${summary.mission || ""}</strong>
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>القرار الاستراتيجي</h2>
              <p>النقلة المطلوبة في طريقة عرض المبادرة.</p>
            </div>

            <div class="strategy-decision">
              <strong>من أفكار تشغيلية إلى محفظة حلول متخصصة</strong>
              <p>
                لا يتم تقديم المبادرة كأفكار عامة، بل كمحفظة متخصصة في الأنظمة البيومترية،
                البوابات الذكية، الصلاحيات، والأمن الرقمي، مع مؤشرات قياس وحوكمة واضحة.
              </p>
              <button class="module-btn secondary" data-module="ideas">استعراض دليل الأفكار</button>
            </div>
          </div>
        </div>

        <div class="module-section-title">
          <h2>الأهداف الاستراتيجية</h2>
          <p>الأهداف التي تقود المحفظة المتخصصة خلال فترة التحول.</p>
        </div>

        <div class="strategy-goals-grid">
          ${this.goals.map((g, index) => `
            <div class="strategy-goal-card">
              <b>${String(index + 1).padStart(2, "0")}</b>
              <span>${g.priority}</span>
              <strong>${g.title}</strong>
              <p>${g.desc}</p>
            </div>
          `).join("")}
        </div>

        <div class="module-section-title">
          <h2>الركائز الاستراتيجية</h2>
          <p>المحاور التي توجه جميع حلول الذكاء الاصطناعي في نطاق الاختصاص.</p>
        </div>

        <div class="module-grid">
          ${this.pillars.map(p => `
            <div class="module-card strategy-pillar-card">
              <span>${p[0]} ${p[1]}</span>
              <strong>${p[2]}</strong>
            </div>
          `).join("")}
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>تصنيف المشاريع حسب الأفق الزمني</h2>
            <p>طريقة ترتيب محفظة المشاريع من الأسرع تنفيذاً إلى الأكثر استراتيجية.</p>
          </div>

          <div class="horizon-grid">
            ${horizons.map(h => `
              <div class="horizon-card">
                <span>${h.type}</span>
                <strong>${h.title}</strong>
                <p>${h.examples}</p>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>خارطة التحول 2026–2030</h2>
            <p>تسلسل التنفيذ من حصر البيانات إلى التنبيهات الذكية والنضج.</p>
          </div>

          <div class="roadmap-list">
            ${roadmap.map(r => `
              <div class="roadmap-item">
                <div>
                  <strong>${r.phase}</strong>
                  <span>${r.year}</span>
                  <p>${r.activities}</p>
                  <div class="aiw-progress"><div style="width:${r.progress}%"></div></div>
                </div>
                <b>${r.progress}%</b>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>إطار الحوكمة</h2>
              <p>الضوابط المطلوبة لضمان تنفيذ مسؤول وآمن في الحالات الحساسة.</p>
            </div>

            <div class="executive-list">
              ${governance.map((g, i) => `
                <div class="executive-item">
                  <strong>${String(i + 1).padStart(2, "0")}</strong>
                  <span>${g}</span>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>التوصيات النهائية</h2>
              <p>ما يجب رفعه للإدارة لاعتماد الانطلاق.</p>
            </div>

            <div class="executive-list">
              ${recommendations.map((r, i) => `
                <div class="executive-item">
                  <strong>${String(i + 1).padStart(2, "0")}</strong>
                  <span>${r}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

      </section>
    `;
  },

  kpi(label, value, note) {
    return `
      <div class="module-card">
        <span>${label}</span>
        <strong>${value}</strong>
        <small>${note}</small>
      </div>
    `;
  }
};