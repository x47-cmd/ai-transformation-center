/* =========================================================
   AI Work - Business Case Center V1.0 Final
   ROI + Feasibility + Prioritization
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.business = {
  id: "business",
  title: "الجدوى",
  icon: "💰",

  cases: [
    ["تلخيص الاجتماعات آلياً", "Quick Win", 180000, 520000, "2-3 أشهر", "منخفضة", 88],
    ["إنشاء التقارير الذكية", "Quick Win", 240000, 750000, "3-4 أشهر", "منخفضة", 84],
    ["أتمتة الدعم الفني", "Quick Win", 300000, 900000, "3-4 أشهر", "منخفضة", 80],
    ["المساعد الذكي الموحد", "Strategic", 1200000, 4200000, "6-9 أشهر", "متوسطة", 72],
    ["مركز المعرفة المؤسسي", "Strategic", 950000, 3100000, "7-9 أشهر", "متوسطة", 68],
    ["مركز الأمن السيبراني الذكي", "Strategic", 1800000, 6200000, "9-12 شهر", "عالية", 61],
    ["منصة اتخاذ القرار", "Strategic", 2200000, 8200000, "9-12 شهر", "عالية", 64],
    ["التوأم الرقمي للإدارة", "Transformational", 3500000, 12000000, "10-12 شهر", "عالية", 52]
  ],

  render(container) {
    if (!container) return;

    const totalCost = this.cases.reduce((sum, c) => sum + c[2], 0);
    const totalValue = this.cases.reduce((sum, c) => sum + c[3], 0);
    const netValue = totalValue - totalCost;
    const roi = Math.round((netValue / totalCost) * 100);
    const quickWins = this.cases.filter(c => c[1] === "Quick Win").length;

    container.innerHTML = `
      <section class="module-page">

        <div class="module-hero">
          <span class="module-kicker">Business Case · ROI</span>
          <h1>مركز الجدوى والعائد</h1>
          <p>
            تحويل أفكار الذكاء الاصطناعي إلى قرارات استثمارية واضحة عبر تقدير التكلفة،
            القيمة المتوقعة، العائد، الأولوية، وسهولة التنفيذ.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">💰 ROI Dashboard</span>
            <span class="aiw-chip">📊 ${roi}% عائد تقديري</span>
            <span class="aiw-chip">🚀 ${quickWins} Quick Wins</span>
          </div>
        </div>

        <div class="module-grid">
          ${this.kpi("عدد دراسات الجدوى", this.cases.length, "Business Cases")}
          ${this.kpi("التكلفة التقديرية", this.formatAED(totalCost), "Estimated Cost")}
          ${this.kpi("القيمة المتوقعة", this.formatAED(totalValue), "Expected Value")}
          ${this.kpi("صافي القيمة", this.formatAED(netValue), "Net Value")}
          ${this.kpi("العائد التقديري", `${roi}%`, "ROI")}
          ${this.kpi("Quick Wins", quickWins, "Fast Value")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>الخلاصة الاستثمارية</h2>
              <p>قراءة تنفيذية للجدوى المالية والتشغيلية.</p>
            </div>

            <div class="business-summary-card">
              <strong>أفضل عائد يبدأ من المشاريع السريعة منخفضة التكلفة</strong>
              <p>
                البدء بالمشاريع السريعة مثل تلخيص الاجتماعات، التقارير الذكية،
                وأتمتة الدعم الفني يثبت القيمة مبكراً قبل الاستثمار في المشاريع الكبرى.
              </p>
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>معيار الاعتماد</h2>
              <p>كيف نقرر أي مشروع يبدأ أولاً؟</p>
            </div>

            <div class="business-criteria">
              <div><b>1</b><span>أثر عالي مقابل تكلفة منخفضة</span></div>
              <div><b>2</b><span>سهولة تنفيذ وبيانات متوفرة</span></div>
              <div><b>3</b><span>مخاطر قابلة للتحكم</span></div>
              <div><b>4</b><span>قابلية قياس ROI خلال 3–6 أشهر</span></div>
            </div>
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>محفظة دراسات الجدوى</h2>
            <p>تقدير تنفيذي للتكلفة والقيمة والعائد حسب المشروع.</p>
          </div>

          <div class="business-grid">
            ${this.cases.map(item => this.caseCard(item)).join("")}
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>مصفوفة الأولوية</h2>
            <p>تقسيم المشاريع حسب سرعة القيمة وحجم الاستثمار.</p>
          </div>

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

      </section>
    `;
  },

  caseCard(item) {
    const [title, type, cost, value, duration, risk, readiness] = item;
    const net = value - cost;
    const roi = Math.round((net / cost) * 100);

    return `
      <article class="business-card">
        <div class="business-card-head">
          <span class="aiw-status ${this.typeClass(type)}">${type}</span>
          <b>${readiness}%</b>
        </div>

        <h3>${title}</h3>

        <div class="business-values">
          <div>
            <span>التكلفة</span>
            <strong>${this.formatAED(cost)}</strong>
          </div>
          <div>
            <span>القيمة</span>
            <strong>${this.formatAED(value)}</strong>
          </div>
          <div>
            <span>ROI</span>
            <strong>${roi}%</strong>
          </div>
        </div>

        <div class="business-meta">
          <span>⏱️ ${duration}</span>
          <span>⚠️ مخاطر ${risk}</span>
        </div>

        <div class="aiw-progress"><div style="width:${readiness}%"></div></div>
      </article>
    `;
  },

  typeClass(type) {
    if (type === "Quick Win") return "green";
    if (type === "Transformational") return "red";
    return "orange";
  },

  formatAED(value) {
    const n = Number(value || 0);
    if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 ? 1 : 0)}M AED`;
    return `${n.toLocaleString("ar-AE")} AED`;
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