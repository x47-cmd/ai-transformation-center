/* =========================================================
   AI Work - Executive Dashboard V3.2
   Scope: Enterprise Biometric Intelligence Platform
   Content Refinement - No UI Design Changes
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.dashboard = {
  id: "dashboard",
  title: "الرئيسية",
  icon: "🏠",

  render(container) {
    if (!container) return;

    const data = window.AIW?.Data || {};
    const summary = data.summary || {};
    const governance = data.governance || [];

    const ideasCount = summary.ideasCount || (data.ideas || []).length || 30;
    const targetIdeas = summary.targetIdeas || 100;
    const ideaProgress = Math.round((ideasCount / targetIdeas) * 100);
    const readiness = summary.maturityScore || 34;
    const systemHealth = summary.portfolioHealth || 68;
    const highPriorityIdeas = (data.ideas || []).filter(x => x.priority === "عالية").length || 21;

    const operationsHealth = 92;

    container.innerHTML = `
      <section class="v3-dashboard-page">

        <section class="v3-hero-card">
          <div class="v3-hero-content">
            <span class="v3-hero-badge">Enterprise Biometric AI Platform</span>

            <h1>
              منصة تنفيذية لتطوير الأنظمة البيومترية
              والبوابات الذكية بالذكاء الاصطناعي
            </h1>

            <p>
              مركز واحد يربط جودة التسجيلات، استخدام الصلاحيات،
              أداء البوابات، الأمن الرقمي، المؤشرات، والتنبيهات الذكية.
            </p>
          </div>

          <div class="v3-ai-visual">
            <div class="v3-ai-orb">AI</div>
          </div>

          <div class="v3-hero-stats">
            <div>
              <strong>${ideasCount}/${targetIdeas} 💡</strong>
              <span>فكرة متخصصة</span>
            </div>

            <div>
              <strong>${summary.flagshipProjectsCount || 15} 📁</strong>
              <span>حل ذكي رئيسي</span>
            </div>

            <div>
              <strong>${summary.departmentsCount || 5} 🛂</strong>
              <span>محافظ تشغيلية</span>
            </div>

            <div>
              <strong>${summary.period || "2030–2026"} 🗓️</strong>
              <span>خارطة زمنية</span>
            </div>
          </div>
        </section>

        <section class="v3-kpi-grid">
          ${this.kpiCard("👁️", "الأفكار الحالية", ideasCount, `${ideaProgress}% من هدف 100 فكرة`, "blue")}
          ${this.kpiCard("🚀", "أولوية عالية", highPriorityIdeas, "جاهزة للتقييم التنفيذي", "green")}
          ${this.kpiCard("🛂", "جاهزية الذكاء الاصطناعي", `${readiness}%`, "AI Readiness", "purple")}
          ${this.kpiCard("📊", "صحة الأنظمة", `${systemHealth}%`, "System Health", "green")}
        </section>

        <section class="v3-roi-card">
          <div>
            <h3>🟢 حالة العمليات البيومترية</h3>
            <strong>${operationsHealth}%</strong>
            <p>Operational Health</p>
          </div>

          <div class="v3-mini-chart">
            <span style="height:82%"></span>
            <span style="height:76%"></span>
            <span style="height:88%"></span>
            <span style="height:70%"></span>
            <span style="height:92%"></span>
            <span style="height:84%"></span>
            <span style="height:96%"></span>
            <span style="height:90%"></span>
            <span style="height:94%"></span>
          </div>
        </section>

        <section class="v3-summary-grid">
          <article class="v3-small-panel">
            <h3>🛡️ الحوكمة</h3>
            <strong>${governance.length || 5}</strong>
            <p>Human-in-the-Loop Controls</p>
          </article>

          <article class="v3-small-panel">
            <h3>⚙️ المرحلة القادمة</h3>
            <strong>بدء المرحلة الأولى</strong>
            <p>تشغيل لوحات القياس والتنبيهات الأولية</p>
          </article>
        </section>

      </section>
    `;
  },

  kpiCard(icon, label, value, note, tone) {
    return `
      <article class="v3-kpi-card">
        <div class="v3-kpi-icon ${tone}">${icon}</div>
        <div class="v3-kpi-text">
          <h3>${label}</h3>
          <strong>${value}</strong>
          <p>${note}</p>
        </div>
      </article>
    `;
  }
};