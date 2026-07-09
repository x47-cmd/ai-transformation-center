/* =========================================================
   AI Work - Business Case Center V2.0 Ultimate
   ROI + Feasibility + Investment Prioritization
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.business = {
  id: "business",
  title: "الجدوى",
  icon: "💰",

  cases: [
    { title: "تلخيص الاجتماعات آلياً", type: "Quick Win", cost: 180000, value: 520000, duration: "2-3 أشهر", risk: "منخفضة", readiness: 88 },
    { title: "إنشاء التقارير الذكية", type: "Quick Win", cost: 240000, value: 750000, duration: "3-4 أشهر", risk: "منخفضة", readiness: 84 },
    { title: "أتمتة الدعم الفني", type: "Quick Win", cost: 300000, value: 900000, duration: "3-4 أشهر", risk: "منخفضة", readiness: 80 },
    { title: "المساعد الذكي الموحد", type: "Strategic", cost: 1200000, value: 4200000, duration: "6-9 أشهر", risk: "متوسطة", readiness: 72 },
    { title: "مركز المعرفة المؤسسي", type: "Strategic", cost: 950000, value: 3100000, duration: "7-9 أشهر", risk: "متوسطة", readiness: 68 },
    { title: "مركز الأمن السيبراني الذكي", type: "Strategic", cost: 1800000, value: 6200000, duration: "9-12 شهر", risk: "عالية", readiness: 61 },
    { title: "منصة اتخاذ القرار", type: "Strategic", cost: 2200000, value: 8200000, duration: "9-12 شهر", risk: "عالية", readiness: 64 },
    { title: "التوأم الرقمي للإدارة", type: "Transformational", cost: 3500000, value: 12000000, duration: "10-12 شهر", risk: "عالية", readiness: 52 }
  ],

  render(container) {
    if (!container) return;

    const W = window.AIW?.Widgets;
    const AI = window.AIW?.AI;
    const R = window.AIW?.Recommendation;

    const totalCost = this.cases.reduce((sum, c) => sum + c.cost, 0);
    const totalValue = this.cases.reduce((sum, c) => sum + c.value, 0);
    const netValue = totalValue - totalCost;
    const roi = Math.round((netValue / totalCost) * 100);
    const quickWins = this.cases.filter(c => c.type === "Quick Win").length;
    const avgReadiness = this.average(this.cases.map(c => c.readiness));
    const aiReport = AI?.generateExecutiveReport ? AI.generateExecutiveReport() : {};
    const nextActions = R?.nextActions ? R.nextActions() : [];

    container.innerHTML = `
      <section class="module-page">

        ${W ? W.hero({
          kicker: "Business Case · ROI",
          title: "مركز الجدوى والعائد",
          description: "تحويل أفكار ومشاريع الذكاء الاصطناعي إلى قرارات استثمارية واضحة عبر التكلفة، القيمة، العائد، المخاطر، الجاهزية، وأولوية التنفيذ.",
          chips: [
            "💰 ROI Dashboard",
            `📊 ${roi}% عائد تقديري`,
            `🚀 ${quickWins} Quick Wins`,
            `✅ ${avgReadiness}% جاهزية`
          ]
        }) : this.fallbackHero()}

        <div class="module-grid">
          ${this.kpi("دراسات الجدوى", this.cases.length, "Business Cases")}
          ${this.kpi("التكلفة التقديرية", this.formatAED(totalCost), "Estimated Cost")}
          ${this.kpi("القيمة المتوقعة", this.formatAED(totalValue), "Expected Value")}
          ${this.kpi("صافي القيمة", this.formatAED(netValue), "Net Value")}
          ${this.kpi("العائد التقديري", `${roi}%`, "ROI")}
          ${this.kpi("متوسط الجاهزية", `${avgReadiness}%`, "Readiness")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("الخلاصة الاستثمارية", "قراءة تنفيذية للجدوى المالية والتشغيلية.")}
            <div class="business-ultimate-summary">
              <strong>أفضل عائد يبدأ من المشاريع السريعة منخفضة التكلفة</strong>
              <p>
                البدء بالمشاريع السريعة مثل تلخيص الاجتماعات، التقارير الذكية،
                وأتمتة الدعم الفني يثبت القيمة مبكراً قبل الاستثمار في المشاريع الكبرى.
              </p>

              <div class="business-summary-strip">
                <div><span>Cost</span><b>${this.formatAED(totalCost)}</b></div>
                <div><span>Value</span><b>${this.formatAED(totalValue)}</b></div>
                <div><span>Net</span><b>${this.formatAED(netValue)}</b></div>
                <div><span>ROI</span><b>${roi}%</b></div>
              </div>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("AI Investment Insight", "توصية ذكية مرتبطة بمحرك AI.")}
            <div class="business-ai-card">
              <strong>${aiReport.status || "استثمار مرحلي ذكي"}</strong>
              <p>${aiReport.message || "المرحلة التالية يجب أن تبدأ بمشاريع منخفضة التكلفة وسريعة الأثر قبل التوسع الكبير."}</p>
              <button class="module-btn secondary" data-module="kpis">فتح المؤشرات</button>
            </div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("ROI by Project", "مقارنة العائد التقديري حسب المشروع.")}
            <div class="business-chart-card">
              <canvas id="businessRoiChart"></canvas>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("Investment Mix", "توزيع المشاريع حسب نوع الاستثمار.")}
            <div class="business-chart-card">
              <canvas id="businessMixChart"></canvas>
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("محفظة دراسات الجدوى", "تقدير تنفيذي للتكلفة والقيمة والعائد حسب المشروع.")}
          <div class="business-grid">
            ${this.cases.map(item => this.caseCard(item)).join("")}
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("مصفوفة الأولوية الاستثمارية", "تقسيم المشاريع حسب سرعة القيمة وحجم الاستثمار.")}
          <div class="priority-matrix">
            <div>
              <strong>🚀 ابدأ فوراً</strong>
              <span>Quick Wins منخفضة التكلفة وسريعة القياس.</span>
            </div>
            <div>
              <strong>📈 جهّز للتوسع</strong>
              <span>مشاريع متوسطة تحتاج بيانات وتكامل.</span>
            </div>
            <div>
              <strong>🏛️ قرار استراتيجي</strong>
              <span>مشاريع كبرى تحتاج لجنة وميزانية وحوكمة.</span>
            </div>
            <div>
              <strong>⏸️ انتظر</strong>
              <span>أي مشروع لا يملك بيانات أو KPI واضح.</span>
            </div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("معيار الاعتماد", "كيف نقرر أي مشروع يبدأ أولاً؟")}
            <div class="business-criteria">
              <div><b>1</b><span>أثر عالي مقابل تكلفة منخفضة</span></div>
              <div><b>2</b><span>سهولة تنفيذ وبيانات متوفرة</span></div>
              <div><b>3</b><span>مخاطر قابلة للتحكم</span></div>
              <div><b>4</b><span>قابلية قياس ROI خلال 3–6 أشهر</span></div>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("Next Best Actions", "الخطوات العملية التالية للاستثمار.")}
            <div class="executive-list">
              ${nextActions.map((item, i) => `
                <div class="executive-item">
                  <strong>${String(i + 1).padStart(2, "0")}</strong>
                  <span>${item}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

      </section>
    `;

    this.renderCharts();
  },

  caseCard(item) {
    const net = item.value - item.cost;
    const roi = Math.round((net / item.cost) * 100);

    return `
      <article class="business-card">
        <div class="business-card-head">
          <span class="aiw-status ${this.typeClass(item.type)}">${item.type}</span>
          <b>${item.readiness}%</b>
        </div>

        <h3>${item.title}</h3>

        <div class="business-values">
          <div>
            <span>التكلفة</span>
            <strong>${this.formatAED(item.cost)}</strong>
          </div>
          <div>
            <span>القيمة</span>
            <strong>${this.formatAED(item.value)}</strong>
          </div>
          <div>
            <span>ROI</span>
            <strong>${roi}%</strong>
          </div>
        </div>

        <div class="business-meta">
          <span>⏱️ ${item.duration}</span>
          <span>⚠️ مخاطر ${item.risk}</span>
        </div>

        <div class="aiw-progress"><div style="width:${item.readiness}%"></div></div>
      </article>
    `;
  },

  renderCharts() {
    if (!window.AIW?.Charts) return;

    setTimeout(() => {
      const labels = this.cases.map(c => c.title);
      const roiValues = this.cases.map(c => Math.round(((c.value - c.cost) / c.cost) * 100));
      const quick = this.cases.filter(c => c.type === "Quick Win").length;
      const strategic = this.cases.filter(c => c.type === "Strategic").length;
      const transformational = this.cases.filter(c => c.type === "Transformational").length;

      if (AIW.Charts.bar) {
        AIW.Charts.bar("businessRoiChart", labels, roiValues, "ROI %");
      }

      if (AIW.Charts.doughnut) {
        AIW.Charts.doughnut(
          "businessMixChart",
          ["Quick Win", "Strategic", "Transformational"],
          [quick, strategic, transformational],
          "Investment Mix"
        );
      }
    }, 50);
  },

  typeClass(type) {
    if (type === "Quick Win") return "green";
    if (type === "Transformational") return "red";
    return "orange";
  },

  average(values) {
    if (!values.length) return 0;
    return Math.round(values.reduce((a, b) => a + Number(b || 0), 0) / values.length);
  },

  formatAED(value) {
    const n = Number(value || 0);
    if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 ? 1 : 0)}M AED`;
    return `${n.toLocaleString("ar-AE")} AED`;
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
        <span class="module-kicker">Business Case · ROI</span>
        <h1>مركز الجدوى والعائد</h1>
        <p>تحويل أفكار الذكاء الاصطناعي إلى قرارات استثمارية واضحة.</p>
      </div>
    `;
  }
};