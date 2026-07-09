/* =========================================================
   AI Work - Executive Reports Center V2.0 Ultimate
   Enterprise Analytics + AI Insights + Decision Reports
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.reports = {
  id: "reports",
  title: "التقارير",
  icon: "📊",

  render(container) {
    if (!container) return;

    const W = window.AIW?.Widgets;
    const A = window.AIW?.Analytics;
    const AI = window.AIW?.AI;
    const D = window.AIW?.Decision;
    const R = window.AIW?.Recommendation;

    const data = window.AIW?.Data || {};
    const summary = data.summary || {};
    const departments = data.departments || [];
    const ideas = data.ideas || [];
    const roadmap = data.roadmap || [];
    const risks = data.risks || [];

    const scores = A?.score ? A.score() : {};
    const executiveSummary = A?.executiveSummary ? A.executiveSummary() : {};
    const aiReport = AI?.generateExecutiveReport ? AI.generateExecutiveReport() : {};
    const decision = D?.executiveDecision ? D.executiveDecision() : {};
    const fullRecommendation = R?.fullReport ? R.fullReport() : {};

    const highIdeas = ideas.filter(i => i.priority === "عالية").length;
    const mediumIdeas = ideas.filter(i => i.priority === "متوسطة").length;
    const lowIdeas = ideas.filter(i => i.priority === "منخفضة").length;
    const quickWins = D?.quickWins ? D.quickWins() : ideas.filter(i => i.ease === "سهلة" && i.cost === "منخفضة");
    const avgMaturity = this.average(departments.map(d => d.maturity || 0));
    const expectedROI = summary.expectedROI || 42000000;
    const executiveScore = scores.executiveScore || 0;

    container.innerHTML = `
      <section class="module-page">

        ${W ? W.hero({
          kicker: "Executive Reports · Enterprise Analytics",
          title: "مركز التقارير والتحليلات التنفيذية",
          description: "لوحة تحليلية تربط الاستراتيجية، المشاريع، الأفكار، النضج، المخاطر، العائد، الحوكمة، والتوصيات الذكية في تقرير تنفيذي واحد.",
          chips: [
            "📊 Executive Analytics",
            `🧠 Executive Score ${executiveScore}%`,
            `💰 ${this.formatAED(expectedROI)} ROI`,
            `🚀 ${quickWins.length} Quick Wins`
          ]
        }) : this.fallbackHero()}

        <div class="module-grid">
          ${this.kpi("Executive Score", `${executiveScore}%`, executiveSummary.status || "Executive Health")}
          ${this.kpi("الأفكار", ideas.length, "Use Cases")}
          ${this.kpi("Quick Wins", quickWins.length, "Ready to Start")}
          ${this.kpi("متوسط النضج", `${avgMaturity}%`, "Department Maturity")}
          ${this.kpi("المخاطر", risks.length, "Risk Register")}
          ${this.kpi("العائد المتوقع", this.formatAED(expectedROI), "Expected ROI")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("الخلاصة التنفيذية", "قراءة موحدة لحالة برنامج التحول بالذكاء الاصطناعي.")}
            <div class="report-ultimate-summary">
              <strong>${executiveSummary.title || "الخلاصة التنفيذية للتحول"}</strong>
              <p>${executiveSummary.message || "البرنامج يملك أساس قوي، لكنه يحتاج إلى تشغيل مؤسسي أوضح عبر الحوكمة، KPIs، وQuick Wins."}</p>

              <div class="report-score-strip">
                <div><span>Executive</span><b>${scores.executiveScore || 0}%</b></div>
                <div><span>Ideas</span><b>${scores.ideaScore || 0}%</b></div>
                <div><span>Maturity</span><b>${scores.maturityScore || 0}%</b></div>
                <div><span>Risk</span><b>${scores.riskScore || 0}%</b></div>
                <div><span>Governance</span><b>${scores.governanceScore || 0}%</b></div>
              </div>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("AI Executive Insight", "تقرير ذكي مولد من AI Engine.")}
            <div class="report-ai-card">
              <strong>${aiReport.status || "مرحلة البناء المؤسسي"}</strong>
              <p>${aiReport.message || "المرحلة التالية يجب أن تركز على الحوكمة، KPIs، وQuick Wins."}</p>
              <button class="module-btn secondary" data-module="maturity">فتح النضج</button>
            </div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("توزيع الأولويات", "تصنيف الأفكار حسب درجة الأولوية.")}
            <div class="report-chart-card">
              <canvas id="reportsPriorityChart"></canvas>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("صحة التحول", "مؤشرات التحول الرئيسية في رسم واحد.")}
            <div class="report-chart-card">
              <canvas id="reportsHealthChart"></canvas>
            </div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("توزيع الأفكار حسب الإدارات", "يوضح اتساع نطاق المبادرة خارج الإدارات التقنية.")}
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
            ${this.sectionTitle("نضج الإدارات", "مقارنة تقديرية لجاهزية الإدارات.")}
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
          ${this.sectionTitle("Decision Intelligence", "أفضل المشاريع المقترحة للتنفيذ حسب Decision Engine.")}
          <div class="report-decision-grid">
            ${(decision.topProjects || []).slice(0, 5).map((p, i) => `
              <article class="report-decision-card">
                <b>${String(i + 1).padStart(2, "0")}</b>
                <strong>${p.title}</strong>
                <span>${p.department}</span>
                <div class="aiw-progress"><div style="width:${p.score}%"></div></div>
                <small>Decision Score: ${p.score}%</small>
              </article>
            `).join("")}
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("تحليل الأولويات", "تصنيف الأفكار حسب الأولوية وسهولة البدء.")}
          <div class="report-insight-grid">
            <div class="report-insight-card">
              <span>عالية الأولوية</span>
              <strong>${highIdeas}</strong>
              <p>تحتاج تقييم تنفيذي سريع وربطها بخطة مشاريع.</p>
            </div>

            <div class="report-insight-card">
              <span>متوسطة الأولوية</span>
              <strong>${mediumIdeas}</strong>
              <p>مناسبة للموجة الثانية بعد تجهيز الحوكمة والبيانات.</p>
            </div>

            <div class="report-insight-card">
              <span>منخفضة الأولوية</span>
              <strong>${lowIdeas}</strong>
              <p>يمكن استخدامها كأفكار دعم أو تحسين لاحق.</p>
            </div>

            <div class="report-insight-card">
              <span>Quick Wins</span>
              <strong>${quickWins.length}</strong>
              <p>أفضل نقطة بداية لإثبات القيمة خلال الأشهر الأولى.</p>
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("تقدم خارطة الطريق", "مراحل التحول من 2026 إلى 2030.")}
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

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("Executive Recommendations", "توصيات الإدارة العليا.")}
            <div class="executive-list">
              ${(fullRecommendation.ceo || []).map((item, i) => `
                <div class="executive-item">
                  <strong>${String(i + 1).padStart(2, "0")}</strong>
                  <span>${item}</span>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("Next Best Actions", "الخطوات العملية التالية.")}
            <div class="executive-list">
              ${(fullRecommendation.nextActions || []).map((item, i) => `
                <div class="executive-item">
                  <strong>${String(i + 1).padStart(2, "0")}</strong>
                  <span>${item}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("توصية التقرير", "الخطوة التي يجب رفعها للإدارة العليا.")}
          <div class="report-recommendation">
            <strong>اعتماد برنامج AI Transformation رسمي وربطه بمحفظة KPIs</strong>
            <p>
              التوصية الأساسية هي اعتماد البرنامج، تشكيل اللجنة التوجيهية، إطلاق Quick Wins،
              ثم بناء KPI Engine وROI Dashboard كمقياس رسمي للأثر المؤسسي.
            </p>
            <button class="module-btn secondary" data-module="kpis">فتح مركز المؤشرات</button>
          </div>
        </div>

      </section>
    `;

    this.renderCharts({
      highIdeas,
      mediumIdeas,
      lowIdeas,
      scores
    });
  },

  renderCharts({ highIdeas, mediumIdeas, lowIdeas, scores }) {
    if (!window.AIW?.Charts) return;

    setTimeout(() => {
      if (AIW.Charts.doughnut) {
        AIW.Charts.doughnut(
          "reportsPriorityChart",
          ["عالية", "متوسطة", "منخفضة"],
          [highIdeas, mediumIdeas, lowIdeas],
          "Priority Distribution"
        );
      }

      if (AIW.Charts.bar) {
        AIW.Charts.bar(
          "reportsHealthChart",
          ["Executive", "Ideas", "Maturity", "Risk", "Governance"],
          [
            scores.executiveScore || 0,
            scores.ideaScore || 0,
            scores.maturityScore || 0,
            scores.riskScore || 0,
            scores.governanceScore || 0
          ],
          "Transformation Health"
        );
      }
    }, 50);
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

  average(values) {
    if (!values.length) return 0;
    return Math.round(values.reduce((a, b) => a + Number(b || 0), 0) / values.length);
  },

  formatAED(value) {
    const n = Number(value || 0);
    if (n >= 1000000) return `${Math.round(n / 1000000)}M AED`;
    return `${n.toLocaleString("ar-AE")} AED`;
  },

  fallbackHero() {
    return `
      <div class="module-hero">
        <span class="module-kicker">Executive Reports · Analytics</span>
        <h1>مركز التقارير والتحليلات التنفيذية</h1>
        <p>لوحة تحليلية تنفيذية تعرض صحة التحول، الأفكار، النضج، المخاطر، والعائد المتوقع.</p>
      </div>
    `;
  }
};