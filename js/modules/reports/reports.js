/* =========================================================
   AI Work - Reports Center V1.0 Final
   Executive Analytics + ROI + Portfolio Insights
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.reports = {
  id: "reports",
  title: "التقارير",
  icon: "📊",

  render(container) {
    if (!container) return;

    const data = window.AIW?.Data || {};
    const summary = data.summary || {};
    const departments = data.departments || [];
    const ideas = data.ideas || [];
    const roadmap = data.roadmap || [];
    const risks = data.risks || [];

    const highIdeas = ideas.filter(i => i.priority === "عالية").length;
    const quickWins = ideas.filter(i => i.ease === "سهلة" && i.cost === "منخفضة").length;
    const avgMaturity = this.average(departments.map(d => d.maturity || 0));
    const expectedROI = summary.expectedROI || 42000000;

    container.innerHTML = `
      <section class="module-page">

        <div class="module-hero">
          <span class="module-kicker">Executive Reports · Analytics</span>
          <h1>مركز التقارير والتحليلات</h1>
          <p>
            لوحة تحليلية تنفيذية تعرض صحة التحول، توزيع الأفكار، نضج الإدارات،
            المخاطر، العائد المتوقع، وخارطة الطريق بشكل قابل للعرض للإدارة العليا.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">📊 Executive Analytics</span>
            <span class="aiw-chip">💰 ${this.formatAED(expectedROI)} ROI</span>
            <span class="aiw-chip">🧠 ${avgMaturity}% متوسط النضج</span>
          </div>
        </div>

        <div class="module-grid">
          ${this.kpi("إجمالي الأفكار", ideas.length, "Use Cases")}
          ${this.kpi("أولوية عالية", highIdeas, "High Priority")}
          ${this.kpi("Quick Wins", quickWins, "Easy + Low Cost")}
          ${this.kpi("متوسط النضج", `${avgMaturity}%`, "Departments")}
          ${this.kpi("المخاطر", risks.length, "Risk Register")}
          ${this.kpi("العائد المتوقع", this.formatAED(expectedROI), "Expected ROI")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>الخلاصة التنفيذية</h2>
              <p>قراءة مختصرة لحالة البرنامج.</p>
            </div>

            <div class="report-executive-summary">
              <strong>البرنامج جاهز للانتقال إلى مرحلة التنفيذ المنظم</strong>
              <p>
                توجد قاعدة قوية من الأفكار والمشاريع، لكن القيمة الفعلية ستظهر عند
                ربط المشاريع بمؤشرات أداء، مالكي مبادرات، حوكمة، وتجارب Quick Wins قابلة للقياس.
              </p>
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>مؤشر صحة التحول</h2>
              <p>مؤشر مركب مبني على الأفكار، النضج، المخاطر، والجاهزية.</p>
            </div>

            <div class="transformation-health">
              <strong>${summary.portfolioHealth || 68}%</strong>
              <span>Portfolio Health</span>
              <div class="aiw-progress"><div style="width:${summary.portfolioHealth || 68}%"></div></div>
              <p>الحالة جيدة، والأولوية الآن بناء KPI Engine وربط المشاريع بالتنفيذ.</p>
            </div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>توزيع الأفكار حسب الإدارات</h2>
              <p>يوضح اتساع نطاق المبادرة خارج الإدارات التقنية.</p>
            </div>

            <div class="report-bars">
              ${departments.map(d => `
                <div class="report-bar-item">
                  <div>
                    <strong>${d.name}</strong>
                    <span>${d.count} أفكار</span>
                  </div>
                  <div class="report-bar">
                    <i style="width:${Math.min((d.count / 5) * 100, 100)}%"></i>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>نضج الإدارات</h2>
              <p>مقارنة تقديرية لجاهزية الإدارات.</p>
            </div>

            <div class="report-bars">
              ${departments.map(d => `
                <div class="report-bar-item">
                  <div>
                    <strong>${d.name}</strong>
                    <span>${d.maturity || 0}%</span>
                  </div>
                  <div class="report-bar">
                    <i style="width:${d.maturity || 0}%"></i>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>تحليل الأولويات</h2>
            <p>تصنيف الأفكار حسب درجة الأولوية وسهولة البدء.</p>
          </div>

          <div class="report-insight-grid">
            <div class="report-insight-card">
              <span>عالية الأولوية</span>
              <strong>${highIdeas}</strong>
              <p>هذه الأفكار تحتاج تقييم تنفيذي سريع وربطها بخطة مشاريع.</p>
            </div>

            <div class="report-insight-card">
              <span>Quick Wins</span>
              <strong>${quickWins}</strong>
              <p>أفضل نقطة بداية لإثبات القيمة خلال الأشهر الأولى.</p>
            </div>

            <div class="report-insight-card">
              <span>مشاريع استراتيجية</span>
              <strong>4</strong>
              <p>تحتاج حوكمة وبيانات وبنية تشغيلية قبل التوسع الكامل.</p>
            </div>
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>تقدم خارطة الطريق</h2>
            <p>مراحل التحول من 2026 إلى 2030.</p>
          </div>

          <div class="report-roadmap-grid">
            ${roadmap.map(r => `
              <div class="report-roadmap-card">
                <b>${r.year}</b>
                <strong>${r.phase}</strong>
                <span>${r.progress}%</span>
                <div class="aiw-progress"><div style="width:${r.progress}%"></div></div>
                <p>${r.activities}</p>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>توصية التقرير</h2>
            <p>الخطوة التي يجب رفعها للإدارة العليا.</p>
          </div>

          <div class="report-recommendation">
            <strong>اعتماد برنامج AI Transformation رسمي وربطه بمحفظة KPIs</strong>
            <p>
              التوصية الأساسية هي اعتماد البرنامج، تشكيل اللجنة التوجيهية،
              إطلاق Quick Wins، ثم بناء KPI Engine وROI Dashboard كمقياس رسمي للأثر.
            </p>
            <button class="module-btn secondary" data-module="governance">مراجعة الحوكمة</button>
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

  formatAED(value) {
    const n = Number(value || 0);
    if (n >= 1000000) return `${Math.round(n / 1000000)}M AED`;
    return `${n.toLocaleString("ar-AE")} AED`;
  }
};