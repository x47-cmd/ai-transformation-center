/* =========================================================
   AI Work - Decision Intelligence Center V1.0 Ultimate
   Executive Decision Support System
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.decision = {
  id: "decision",
  title: "القرار",
  icon: "🧭",

  scenarios: [
    { title: "البدء بـ Quick Wins", impact: 86, risk: 24, cost: 28, speed: 92, recommendation: "ابدأ فوراً" },
    { title: "إطلاق منصة الأفكار", impact: 78, risk: 32, cost: 42, speed: 76, recommendation: "مناسب للموجة الأولى" },
    { title: "المساعد المؤسسي الذكي", impact: 88, risk: 48, cost: 58, speed: 62, recommendation: "ابدأ بعد الحوكمة" },
    { title: "مركز الأمن السيبراني الذكي", impact: 92, risk: 64, cost: 72, speed: 48, recommendation: "قرار استراتيجي" },
    { title: "التوأم الرقمي للإدارة", impact: 96, risk: 78, cost: 86, speed: 36, recommendation: "يؤجل لما بعد نضج البيانات" }
  ],

  criteria: [
    ["الأثر الاستراتيجي", "مدى ارتباط القرار بالرؤية وخارطة التحول."],
    ["القيمة المالية", "العائد المتوقع مقابل التكلفة."],
    ["المخاطر", "الخصوصية، الأمن، التحيز، والتشغيل."],
    ["سرعة التنفيذ", "إمكانية تحقيق أثر خلال 90–180 يوم."],
    ["جاهزية البيانات", "توفر البيانات وجودتها وقابليتها للاستخدام."],
    ["التبني المؤسسي", "مدى قبول الإدارات والموظفين للتغيير."]
  ],

  render(container) {
    if (!container) return;

    const W = window.AIW?.Widgets;
    const AI = window.AIW?.AI;
    const D = window.AIW?.Decision;
    const R = window.AIW?.Recommendation;
    const A = window.AIW?.Analytics;

    const scores = A?.score ? A.score() : {};
    const aiReport = AI?.generateExecutiveReport ? AI.generateExecutiveReport() : {};
    const decision = D?.executiveDecision ? D.executiveDecision() : {};
    const topProjects = decision.topProjects || [];
    const nextActions = R?.nextActions ? R.nextActions() : [];
    const bestScenario = this.bestScenario();

    container.innerHTML = `
      <section class="module-page">

        ${W ? W.hero({
          kicker: "Decision Intelligence · DSS",
          title: "مركز القرار التنفيذي",
          description: "مركز ذكي لدعم القرار التنفيذي يربط الاستراتيجية، المشاريع، الجدوى، المخاطر، النضج، الحوكمة، والمؤشرات في توصيات قابلة للتنفيذ.",
          chips: [
            "🧭 Decision Support",
            `📊 Executive Score ${scores.executiveScore || 0}%`,
            `🚀 ${topProjects.length || 5} مشاريع مرشحة`,
            `✅ أفضل خيار: ${bestScenario.recommendation}`
          ]
        }) : this.fallbackHero()}

        <div class="module-grid">
          ${this.kpi("Executive Score", `${scores.executiveScore || 0}%`, "Overall Readiness")}
          ${this.kpi("Portfolio Health", `${scores.portfolioScore || 0}%`, "Portfolio")}
          ${this.kpi("Risk Score", `${scores.riskScore || 0}%`, "Risk Position")}
          ${this.kpi("Governance", `${scores.governanceScore || 0}%`, "Controls")}
          ${this.kpi("أفضل سيناريو", bestScenario.title, bestScenario.recommendation)}
          ${this.kpi("Decision Mode", "AI Assisted", "Human-in-the-Loop")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("الخلاصة التنفيذية للقرار", "التوصية الأعلى للإدارة بناءً على الأثر، المخاطر، التكلفة، والجاهزية.")}
            <div class="decision-summary-card">
              <strong>${aiReport.status || "ابدأ بالمشاريع السريعة ثم توسع تدريجياً"}</strong>
              <p>
                ${aiReport.message || "أفضل مسار حالي هو البدء بمشاريع Quick Wins لإثبات القيمة، مع تفعيل الحوكمة وKPI Engine قبل المشاريع الاستراتيجية الكبرى."}
              </p>
              <div class="decision-summary-strip">
                <div><span>Impact</span><b>${bestScenario.impact}%</b></div>
                <div><span>Risk</span><b>${bestScenario.risk}%</b></div>
                <div><span>Cost</span><b>${bestScenario.cost}%</b></div>
                <div><span>Speed</span><b>${bestScenario.speed}%</b></div>
              </div>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("Recommended Next Decision", "القرار المقترح الآن.")}
            <div class="decision-next-card">
              <strong>${bestScenario.title}</strong>
              <p>${bestScenario.recommendation}</p>
              <div class="aiw-progress"><div style="width:${this.decisionScore(bestScenario)}%"></div></div>
              <small>Decision Score: ${this.decisionScore(bestScenario)}%</small>
              <button class="module-btn secondary" data-module="business">فتح الجدوى</button>
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("Decision Priority Matrix", "مقارنة السيناريوهات حسب الأثر والمخاطر والتكلفة والسرعة.")}
          <div class="decision-scenario-grid">
            ${this.scenarios.map(s => this.scenarioCard(s)).join("")}
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("Top Recommended Projects", "أفضل المشاريع المقترحة من Decision Engine.")}
            <div class="decision-project-list">
              ${(topProjects.length ? topProjects : this.fallbackProjects()).map((p, i) => `
                <div class="decision-project-item">
                  <b>${String(i + 1).padStart(2, "0")}</b>
                  <div>
                    <strong>${p.title}</strong>
                    <span>${p.department || "Enterprise"} · ${p.priority || "عالية"}</span>
                  </div>
                  <em>${p.score || 80}%</em>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("Decision Criteria", "المعايير المستخدمة لدعم القرار.")}
            <div class="decision-criteria-list">
              ${this.criteria.map((c, i) => `
                <div>
                  <b>${String(i + 1).padStart(2, "0")}</b>
                  <strong>${c[0]}</strong>
                  <span>${c[1]}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("Scenario Analysis", "تحليل السيناريوهات المحتملة قبل الاعتماد.")}
          <div class="decision-analysis-grid">
            <div>
              <strong>🚀 سيناريو سريع</strong>
              <p>ابدأ بمشاريع منخفضة التكلفة لإثبات القيمة خلال أول 90 يوم.</p>
              <span class="aiw-status green">مفضل الآن</span>
            </div>
            <div>
              <strong>📈 سيناريو متوازن</strong>
              <p>Quick Wins مع مشروع متوسط واحد مثل مركز المعرفة أو المساعد المؤسسي.</p>
              <span class="aiw-status orange">مناسب بعد الحوكمة</span>
            </div>
            <div>
              <strong>🏛️ سيناريو استراتيجي</strong>
              <p>البدء بالمشاريع الكبرى مثل Digital Twin أو Decision Center.</p>
              <span class="aiw-status red">يحتاج نضج بيانات</span>
            </div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("Executive Actions", "الخطوات التنفيذية التالية.")}
            <div class="executive-list">
              ${nextActions.map((item, i) => `
                <div class="executive-item">
                  <strong>${String(i + 1).padStart(2, "0")}</strong>
                  <span>${item}</span>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("Decision Timeline", "تسلسل القرار المقترح.")}
            <div class="decision-timeline">
              <div><b>1</b><strong>اعتماد Quick Wins</strong><span>الأسبوع 1</span></div>
              <div><b>2</b><strong>تفعيل الحوكمة</strong><span>الأسبوع 2–4</span></div>
              <div><b>3</b><strong>ربط KPIs</strong><span>الشهر 2</span></div>
              <div><b>4</b><strong>قياس الأثر</strong><span>الشهر 3</span></div>
              <div><b>5</b><strong>قرار التوسع</strong><span>نهاية الربع</span></div>
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("AI Executive Briefing", "صياغة مختصرة قابلة للرفع للإدارة العليا.")}
          <div class="decision-briefing">
            <strong>التوصية: إطلاق موجة Quick Wins مع حوكمة ومؤشرات أداء واضحة</strong>
            <p>
              بناءً على جاهزية المؤسسة الحالية، أفضل قرار تنفيذي هو البدء بالمشاريع السريعة
              منخفضة التكلفة مثل تلخيص الاجتماعات والتقارير الذكية وأتمتة الدعم الفني،
              بالتوازي مع اعتماد الحوكمة وربط كل مشروع بمؤشر أداء وعائد متوقع.
            </p>
            <div class="aiw-chip-row">
              <span class="aiw-chip">قرار منخفض المخاطر</span>
              <span class="aiw-chip">أثر سريع</span>
              <span class="aiw-chip">جاهز للتنفيذ</span>
            </div>
          </div>
        </div>

      </section>
    `;
  },

  scenarioCard(s) {
    const score = this.decisionScore(s);

    return `
      <article class="decision-scenario-card ${score >= 75 ? "green" : score >= 55 ? "orange" : "red"}">
        <div class="decision-scenario-head">
          <strong>${s.title}</strong>
          <b>${score}%</b>
        </div>

        <p>${s.recommendation}</p>

        <div class="decision-metrics">
          <span>الأثر ${s.impact}%</span>
          <span>المخاطر ${s.risk}%</span>
          <span>التكلفة ${s.cost}%</span>
          <span>السرعة ${s.speed}%</span>
        </div>

        <div class="aiw-progress"><div style="width:${score}%"></div></div>
      </article>
    `;
  },

  decisionScore(s) {
    return Math.round((s.impact * 0.35) + ((100 - s.risk) * 0.25) + ((100 - s.cost) * 0.20) + (s.speed * 0.20));
  },

  bestScenario() {
    return [...this.scenarios].sort((a, b) => this.decisionScore(b) - this.decisionScore(a))[0];
  },

  fallbackProjects() {
    return [
      { title: "تلخيص الاجتماعات آلياً", department: "إدارة المشاريع", priority: "عالية", score: 91 },
      { title: "إنشاء التقارير الذكية", department: "إدارة المعرفة", priority: "عالية", score: 88 },
      { title: "أتمتة الدعم الفني", department: "تقنية المعلومات", priority: "عالية", score: 84 },
      { title: "المساعد الذكي لخدمة المتعاملين", department: "خدمة المتعاملين", priority: "عالية", score: 82 },
      { title: "لوحة القيادة المالية التنفيذية", department: "المالية", priority: "عالية", score: 80 }
    ];
  },

  kpi(label, value, note) {
    if (window.AIW?.Widgets?.kpi) {
      return AIW.Widgets.kpi({ label, value, note });
    }

    return `
      <div class="module-card">
        <span>${label}</span>
        <strong>${value}</strong>
        <small>${note}</small>
      </div>
    `;
  },

  sectionTitle(title, desc) {
    if (window.AIW?.Widgets?.sectionTitle) {
      return AIW.Widgets.sectionTitle(title, desc);
    }

    return `
      <div class="module-section-title compact">
        <h2>${title}</h2>
        <p>${desc}</p>
      </div>
    `;
  },

  fallbackHero() {
    return `
      <div class="module-hero">
        <span class="module-kicker">Decision Intelligence</span>
        <h1>مركز القرار التنفيذي</h1>
        <p>مركز ذكي لدعم القرار التنفيذي وربط الاستراتيجية بالمشاريع والنتائج.</p>
      </div>
    `;
  }
};