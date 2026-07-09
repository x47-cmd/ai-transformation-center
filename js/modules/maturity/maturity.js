/* =========================================================
   AI Work - AI Maturity Center V1.0 Final
   Enterprise Readiness + Department Assessment
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.maturity = {
  id: "maturity",
  title: "النضج",
  icon: "🧠",

  dimensions: [
    ["الاستراتيجية", 38, "وجود رؤية وخارطة طريق واضحة للتحول بالذكاء الاصطناعي."],
    ["البيانات", 42, "جودة البيانات، تصنيفها، وتوفرها لدعم حالات الاستخدام."],
    ["التقنية", 55, "جاهزية الأنظمة، التكامل، البنية التحتية، والأدوات."],
    ["الحوكمة", 36, "وجود سياسات، ضوابط، مراجعة بشرية، وإدارة مخاطر."],
    ["المهارات", 44, "وعي الموظفين، التدريب، وسفراء الذكاء الاصطناعي."],
    ["التنفيذ", 32, "تحويل الأفكار إلى مشاريع وتجارب قابلة للقياس."]
  ],

  levels: [
    ["1", "Initial", "تجارب فردية محدودة بدون إطار موحد."],
    ["2", "Emerging", "مبادرات واعدة لكن غير مرتبطة بمنظومة قياس وحوكمة كاملة."],
    ["3", "Defined", "استراتيجية واضحة، محفظة مشاريع، وحوكمة أساسية."],
    ["4", "Managed", "قياس مستمر، تكامل بيانات، ومتابعة أداء مؤسسية."],
    ["5", "Optimized", "ذكاء اصطناعي مؤسسي مستدام، تنبؤي، ومتكامل مع القرار."]
  ],

  render(container) {
    if (!container) return;

    const data = window.AIW?.Data || {};
    const departments = data.departments || [];
    const summary = data.summary || {};

    const overall = summary.maturityScore || this.average(this.dimensions.map(d => d[1]));
    const strongest = [...this.dimensions].sort((a, b) => b[1] - a[1])[0];
    const weakest = [...this.dimensions].sort((a, b) => a[1] - b[1])[0];

    container.innerHTML = `
      <section class="module-page">

        <div class="module-hero">
          <span class="module-kicker">AI Maturity · Enterprise Readiness</span>
          <h1>مركز نضج الذكاء الاصطناعي</h1>
          <p>
            قياس جاهزية المؤسسة لتبني الذكاء الاصطناعي عبر الاستراتيجية، البيانات،
            التقنية، الحوكمة، المهارات، والتنفيذ، مع تحديد الفجوات وخطة التحسين.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">🧠 النضج الحالي ${overall}%</span>
            <span class="aiw-chip">🎯 الهدف 100% بحلول 2030</span>
            <span class="aiw-chip">📊 ${this.dimensions.length} أبعاد تقييم</span>
          </div>
        </div>

        <div class="module-grid">
          ${this.kpi("النضج الحالي", `${overall}%`, "Current Maturity")}
          ${this.kpi("المستوى الحالي", this.getLevel(overall), "Maturity Level")}
          ${this.kpi("أقوى بُعد", strongest[0], `${strongest[1]}%`)}
          ${this.kpi("أكبر فجوة", weakest[0], `${weakest[1]}%`)}
          ${this.kpi("الإدارات المقاسة", departments.length || 10, "Departments")}
          ${this.kpi("دورة القياس", "ربع سنوي", "Assessment Cycle")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>مؤشر النضج العام</h2>
              <p>قراءة تنفيذية لمستوى جاهزية المؤسسة.</p>
            </div>

            <div class="maturity-hero-score">
              <strong>${overall}%</strong>
              <span>${this.getLevel(overall)}</span>
              <div class="aiw-progress"><div style="width:${overall}%"></div></div>
              <p>
                المؤسسة حالياً في مرحلة بناء الأساس المؤسسي. الأولوية التالية هي
                تحويل الوثيقة والاستراتيجية إلى حوكمة، مشاريع قابلة للقياس، وبرنامج تدريب وتبني.
              </p>
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>الخلاصة التنفيذية</h2>
              <p>ماذا يعني هذا الرقم للإدارة؟</p>
            </div>

            <div class="maturity-insight">
              <strong>الجاهزية جيدة كبداية، لكنها تحتاج تشغيل مؤسسي</strong>
              <p>
                وجود 42 فكرة و15 مشروعاً استراتيجياً يعطي أساس قوي، لكن رفع النضج يتطلب:
                حوكمة، KPIs، مالكي مشاريع، Sandbox، وتقييم دوري لكل إدارة.
              </p>
              <button class="module-btn secondary" data-module="governance">فتح الحوكمة</button>
            </div>
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>أبعاد النضج المؤسسي</h2>
            <p>تحليل الفجوات حسب المحاور الرئيسية.</p>
          </div>

          <div class="maturity-dimensions">
            ${this.dimensions.map(d => `
              <div class="maturity-dimension-card">
                <div>
                  <strong>${d[0]}</strong>
                  <p>${d[2]}</p>
                </div>
                <div class="maturity-dimension-score">
                  <b>${d[1]}%</b>
                  <div class="aiw-progress"><div style="width:${d[1]}%"></div></div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>نضج الإدارات</h2>
              <p>تقييم تقديري لجاهزية كل إدارة للمشاركة في البرنامج.</p>
            </div>

            <div class="maturity-list">
              ${departments.map(d => `
                <div class="maturity-item">
                  <div>
                    <strong>${d.name}</strong>
                    <span>${d.count} أفكار مقترحة</span>
                  </div>
                  <div class="maturity-score">
                    <b>${d.maturity || 0}%</b>
                    <div class="aiw-progress"><div style="width:${d.maturity || 0}%"></div></div>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>مستويات النضج</h2>
              <p>النموذج المرجعي لتقييم تطور المؤسسة.</p>
            </div>

            <div class="maturity-levels">
              ${this.levels.map(level => `
                <div class="maturity-level-card ${this.levelActive(level[0], overall) ? "active" : ""}">
                  <b>${level[0]}</b>
                  <div>
                    <strong>${level[1]}</strong>
                    <span>${level[2]}</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>خطة رفع النضج</h2>
            <p>الأعمال التي ترفع المؤسسة من Emerging إلى Managed ثم Optimized.</p>
          </div>

          <div class="maturity-roadmap">
            <div>
              <b>2026</b>
              <strong>Foundation</strong>
              <span>اعتماد الاستراتيجية، الحوكمة، منصة الأفكار، وتحديد الأولويات.</span>
            </div>
            <div>
              <b>2027</b>
              <strong>Quick Wins</strong>
              <span>تنفيذ PoC، قياس نتائج، وتدريب سفراء الذكاء الاصطناعي.</span>
            </div>
            <div>
              <b>2028</b>
              <strong>Scale</strong>
              <span>توسيع المشاريع المتوسطة وربطها بمركز المعرفة وKPIs.</span>
            </div>
            <div>
              <b>2029</b>
              <strong>Enterprise</strong>
              <span>تشغيل المشاريع الكبرى مثل Digital Twin وDecision Center.</span>
            </div>
            <div>
              <b>2030</b>
              <strong>Optimized</strong>
              <span>نضج واستدامة وقياس ROI وتحسين مستمر.</span>
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
  },

  average(values) {
    if (!values.length) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  },

  getLevel(score) {
    if (score >= 85) return "Optimized";
    if (score >= 65) return "Managed";
    if (score >= 45) return "Defined";
    if (score >= 25) return "Emerging";
    return "Initial";
  },

  levelActive(level, score) {
    const map = {
      "1": score < 25,
      "2": score >= 25 && score < 45,
      "3": score >= 45 && score < 65,
      "4": score >= 65 && score < 85,
      "5": score >= 85
    };

    return !!map[level];
  }
};