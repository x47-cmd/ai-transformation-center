/* =========================================================
   AI Work - Executive Dashboard V2
   Command Center + Strategy Snapshot
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
    const departments = data.departments || [];
    const roadmap = data.roadmap || [];
    const risks = data.risks || [];
    const flagship = data.flagshipProjects || [];
    const kpis = data.kpis || [];
    const governance = data.governance || [];

    const ideasCount = summary.ideasCount || 42;
    const targetIdeas = summary.targetIdeas || 100;
    const ideaProgress = Math.round((ideasCount / targetIdeas) * 100);
    const maturity = summary.maturityScore || 34;
    const health = summary.portfolioHealth || 68;
    const roi = summary.expectedROI || 42000000;

    const highPriorityIdeas = (data.ideas || []).filter(x => x.priority === "عالية").length;
    const quickWins = (data.ideas || []).filter(x => x.ease === "سهلة" && x.cost === "منخفضة").slice(0, 4);

    container.innerHTML = `
      <section class="module-page">

        <div class="module-hero executive-hero">
          <span class="module-kicker">Executive Operating System</span>
          <h1>AI Transformation Center</h1>
          <p>
            منصة تنفيذية لتحويل استراتيجية الذكاء الاصطناعي من وثيقة ثابتة
            إلى نظام تشغيلي يربط الرؤية، المشاريع، الأفكار، مؤشرات الأداء، المخاطر، الحوكمة، والعائد المتوقع.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">📅 ${summary.period || "2026–2030"}</span>
            <span class="aiw-chip">💡 ${ideasCount}/${targetIdeas} فكرة</span>
            <span class="aiw-chip">📁 ${summary.flagshipProjectsCount || 15} مشروع استراتيجي</span>
            <span class="aiw-chip">🏛️ ${summary.departmentsCount || 10} إدارات</span>
          </div>
        </div>

        <div class="module-grid executive-kpi-grid">
          ${this.kpiCard("💡", "الأفكار الحالية", ideasCount, `${ideaProgress}% من هدف 100 فكرة`)}
          ${this.kpiCard("🚀", "أفكار عالية الأولوية", highPriorityIdeas, "جاهزة للتقييم التنفيذي")}
          ${this.kpiCard("🧠", "نضج الذكاء الاصطناعي", `${maturity}%`, "AI Maturity Score")}
          ${this.kpiCard("📊", "صحة المحفظة", `${health}%`, "Portfolio Health")}
          ${this.kpiCard("💰", "العائد المتوقع", this.formatAED(roi), "Expected ROI")}
          ${this.kpiCard("🛡️", "عناصر الحوكمة", governance.length, "Governance Controls")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>الرؤية التنفيذية</h2>
              <p>الاتجاه الاستراتيجي العام للتحول المؤسسي بالذكاء الاصطناعي.</p>
            </div>

            <div class="executive-vision-box">
              <h3>الرؤية</h3>
              <p>${summary.vision || ""}</p>

              <h3>الرسالة</h3>
              <p>${summary.mission || ""}</p>
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>قرار الإدارة القادم</h2>
              <p>أقرب خطوة مطلوبة لتحويل الاستراتيجية إلى تنفيذ.</p>
            </div>

            <div class="decision-card">
              <strong>اعتماد البرنامج رسمياً</strong>
              <span>
                تحويل المبادرة من مجموعة أفكار إلى برنامج تحول مؤسسي مع لجنة توجيهية،
                إطار حوكمة، ومشاريع Quick Wins خلال المرحلة الأولى.
              </span>
              <button class="module-btn secondary" data-module="strategy">فتح الاستراتيجية</button>
            </div>
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>Quick Wins المقترحة</h2>
            <p>مشاريع سهلة ومنخفضة التكلفة وتحقق أثر سريع.</p>
          </div>

          <div class="quickwin-grid">
            ${quickWins.map(item => `
              <div class="quickwin-card">
                <span>${item.department}</span>
                <strong>${item.title}</strong>
                <small>${item.duration} • ${item.cost}</small>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>خارطة التحول 2026–2030</h2>
            <p>من التحضير إلى النضج والاستدامة.</p>
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
              <h2>نضج الإدارات</h2>
              <p>مؤشر تقديري يوضح جاهزية الإدارات للتبني.</p>
            </div>

            <div class="maturity-list">
              ${departments.map(d => `
                <div class="maturity-item">
                  <div>
                    <strong>${d.name}</strong>
                    <span>${d.count} أفكار</span>
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
              <h2>المخاطر الرئيسية</h2>
              <p>أبرز المخاطر التي تحتاج متابعة قبل التوسع.</p>
            </div>

            <div class="risk-list">
              ${risks.map(r => `
                <div class="risk-card">
                  <div>
                    <strong>${r.title}</strong>
                    <p>${r.mitigation}</p>
                  </div>
                  <span class="aiw-status ${this.riskClass(r.level)}">${r.level}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>المشاريع الاستراتيجية الرئيسية</h2>
            <p>15 مشروعاً يشكلون العمود الفقري للاستراتيجية.</p>
          </div>

          <div class="executive-list">
            ${flagship.map((p, i) => `
              <div class="executive-item">
                <strong>${String(i + 1).padStart(2, "0")}</strong>
                <span>${p}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>مؤشرات الأداء الرئيسية</h2>
            <p>المؤشرات التي تقيس نجاح البرنامج والأثر المؤسسي.</p>
          </div>

          <div class="executive-list">
            ${kpis.map(k => `
              <div class="executive-item">
                <strong>KPI</strong>
                <span>${k}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-panel admin-note">
          <h2>⚙️ Admin Mode لاحقاً</h2>
          <p>
            الإضافة والتعديل والحذف ستكون في لوحة إدارة مخفية، أما هذه الواجهة فهي للعرض التنفيذي والتحليل.
          </p>
        </div>

      </section>
    `;
  },

  kpiCard(icon, label, value, note) {
    return `
      <div class="module-card executive-kpi-card">
        <span>${icon} ${label}</span>
        <strong>${value}</strong>
        <small>${note}</small>
      </div>
    `;
  },

  formatAED(value) {
    const n = Number(value || 0);
    if (n >= 1000000) return `${Math.round(n / 1000000)}M AED`;
    return `${n.toLocaleString("ar-AE")} AED`;
  },

  riskClass(level) {
    if (String(level).includes("عال")) return "red";
    if (String(level).includes("متوسط")) return "orange";
    return "green";
  }
};