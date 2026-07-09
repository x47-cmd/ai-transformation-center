/* =========================================================
   AI Work - Executive Dashboard V3
   Clean Mobile Executive UI
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

    const ideasCount = summary.ideasCount || 42;
    const targetIdeas = summary.targetIdeas || 100;
    const ideaProgress = Math.round((ideasCount / targetIdeas) * 100);
    const maturity = summary.maturityScore || 34;
    const health = summary.portfolioHealth || 68;
    const roi = summary.expectedROI || 42000000;
    const highPriorityIdeas = (data.ideas || []).filter(x => x.priority === "عالية").length || 17;

    container.innerHTML = `
      <section class="v3-dashboard-page">

        <section class="v3-hero-card">
          <div class="v3-hero-content">
            <span class="v3-hero-badge">Executive Operating System</span>

            <h1>
              منصة تنفيذية لتحويل استراتيجية الذكاء الاصطناعي
              إلى نتائج مؤسسية قابلة للقياس
            </h1>

            <p>
              وثيقة واحدة تربط الرؤية، المشاريع، المؤشرات،
              المخاطر، الحوكمة، والعائد المتوقع.
            </p>
          </div>

          <div class="v3-ai-visual">
            <div class="v3-ai-orb">AI</div>
          </div>

          <div class="v3-hero-stats">
            <div>
              <strong>${ideasCount}/${targetIdeas} 💡</strong>
              <span>فكرة جاهزة</span>
            </div>

            <div>
              <strong>${summary.flagshipProjectsCount || 15} 📁</strong>
              <span>مشروع استراتيجي</span>
            </div>

            <div>
              <strong>${summary.departmentsCount || 10} 🏛️</strong>
              <span>إدارات</span>
            </div>

            <div>
              <strong>${summary.period || "2030–2026"} 🗓️</strong>
              <span>المدة الزمنية</span>
            </div>
          </div>
        </section>

        <section class="v3-kpi-grid">
          ${this.kpiCard("💡", "الأفكار الحالية", ideasCount, `${ideaProgress}% من هدف 100 فكرة`, "blue")}
          ${this.kpiCard("🚀", "أفكار جاهزة للتنفيذ", highPriorityIdeas, "جاهزة للتقييم التنفيذي", "green")}
          ${this.kpiCard("🧠", "نضج الذكاء الاصطناعي", `${maturity}%`, "AI Maturity Score", "purple")}
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
            <strong>${governance.length || 10}</strong>
            <p>Governance Controls</p>
          </article>

          <article class="v3-small-panel">
            <h3>⚙️ القرار القادم</h3>
            <strong>اعتماد البرنامج</strong>
            <p>تحويل المبادرة إلى برنامج مؤسسي</p>
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