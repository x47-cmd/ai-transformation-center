/* =========================================================
   AI Work - Executive Dashboard V3.1
   Scope: Enterprise Biometric Intelligence Platform
   No UI Design Changes
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
    const maturity = summary.maturityScore || 34;
    const health = summary.portfolioHealth || 68;
    const roi = summary.expectedROI || 42000000;
    const highPriorityIdeas = (data.ideas || []).filter(x => x.priority === "عالية").length || 16;

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
              <span>محافظ تخصصية</span>
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
          ${this.kpiCard("🛂", "نضج المنظومة", `${maturity}%`, "Biometric AI Maturity", "purple")}
          ${this.kpiCard("📊", "صحة المحفظة", `${health}%`, "Portfolio Health", "green")}
        </section>

        <section class="v3-roi-card">
          <div>
            <h3>💰 العائد المتوقع على الاستثمار</h3>
            <strong>${this.formatAED(roi)}</strong>
            <p>Expected ROI</p>
          </div>

          <div class="v3-mini-chart">
            <span style="height:22%"></span>
            <span style="height:30%"></span>
            <span style="height:48%"></span>
            <span style="height:38%"></span>
            <span style="height:60%"></span>
            <span style="height:52%"></span>
            <span style="height:78%"></span>
            <span style="height:72%"></span>
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
            <h3>⚙️ القرار القادم</h3>
            <strong>اعتماد المحفظة</strong>
            <p>تحويل الأفكار المتخصصة إلى مشاريع تنفيذية</p>
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
  },

  formatAED(value) {
    const n = Number(value || 0);
    if (n >= 1000000) return `${Math.round(n / 1000000)}M AED`;
    return `${n.toLocaleString("ar-AE")} AED`;
  }
};