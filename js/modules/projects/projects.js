/* =========================================================
   AI Work - Projects Module V2.0
   Executive Projects Portfolio
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.projects = {
  id: "projects",
  title: "المشاريع",
  icon: "📁",

  projects: [
    ["🤖", "المساعد الذكي الموحد للإدارة", "Enterprise AI Assistant", "عالية", "6-9 أشهر", "متوسطة", 72, "قيد التخطيط"],
    ["📊", "منصة اتخاذ القرار بالذكاء الاصطناعي", "AI Decision Center", "عالية", "9-12 شهر", "عالية", 64, "استراتيجي"],
    ["🧠", "مركز المعرفة المؤسسي", "AI Knowledge Center", "عالية", "7-9 أشهر", "متوسطة", 66, "قيد التخطيط"],
    ["📈", "منصة تحليل البيانات التنبؤية", "Predictive Analytics", "عالية", "6-8 أشهر", "متوسطة", 58, "قيد الدراسة"],
    ["🌐", "التوأم الرقمي للإدارة", "Digital Twin", "استراتيجية", "10-12 شهر", "عالية", 38, "استراتيجي"],
    ["🛡️", "مركز الأمن السيبراني الذكي", "AI SOC", "عالية", "9-12 شهر", "عالية", 58, "قيد الدراسة"],
    ["📁", "المساعد الذكي لإدارة المشاريع", "AI PM Assistant", "عالية", "6-8 أشهر", "متوسطة", 62, "قيد التخطيط"],
    ["📑", "إنشاء التقارير الذكية", "AI Reports", "عالية", "3-4 أشهر", "منخفضة", 88, "Quick Win"],
    ["🎙️", "تلخيص الاجتماعات آلياً", "AI Meeting Summary", "عالية", "2-3 أشهر", "منخفضة", 91, "Quick Win"],
    ["⚖️", "تقييم الأفكار والمشاريع", "AI Evaluation Engine", "متوسطة", "4-6 أشهر", "متوسطة", 70, "قيد التخطيط"],
    ["💡", "منصة الابتكار المؤسسي", "Innovation Hub", "متوسطة", "6-8 أشهر", "متوسطة", 54, "قيد الدراسة"],
    ["🧪", "مختبر الذكاء الاصطناعي", "AI Sandbox", "متوسطة", "6-8 أشهر", "متوسطة", 50, "قيد الدراسة"],
    ["🎓", "برنامج سفراء الذكاء الاصطناعي", "AI Champions", "منخفضة", "3-4 أشهر", "منخفضة", 76, "Quick Win"],
    ["🛒", "السوق الداخلي للحلول الذكية", "AI Marketplace", "متوسطة", "6-8 أشهر", "متوسطة", 52, "قيد التخطيط"],
    ["👤", "الموظف الرقمي", "AI Digital Employee", "عالية", "6-8 أشهر", "متوسطة", 60, "قيد الدراسة"]
  ],

  render(container) {
    if (!container) return;

    const data = window.AIW?.Data || {};
    const summary = data.summary || {};
    const projects = this.projects;

    const quickWins = projects.filter(p => p[7] === "Quick Win").length;
    const highPriority = projects.filter(p => p[3] === "عالية" || p[3] === "استراتيجية").length;
    const avgProgress = Math.round(projects.reduce((sum, p) => sum + Number(p[6] || 0), 0) / projects.length);
    const lowCost = projects.filter(p => p[5] === "منخفضة").length;

    container.innerHTML = `
      <section class="module-page">

        <div class="module-hero">
          <span class="module-kicker">Execution Center · Portfolio</span>
          <h1>محفظة مشاريع الذكاء الاصطناعي</h1>
          <p>
            تحويل الأفكار المعتمدة إلى مشاريع تنفيذية واضحة الأولوية، المدة، التكلفة،
            الحالة، ومستوى الجاهزية ضمن خارطة التحول المؤسسي.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">📁 ${projects.length} مشروع</span>
            <span class="aiw-chip">🚀 ${quickWins} Quick Wins</span>
            <span class="aiw-chip">💰 ${summary.expectedROI ? this.formatAED(summary.expectedROI) : "42M AED"} عائد متوقع</span>
          </div>
        </div>

        <div class="module-grid">
          ${this.kpi("إجمالي المشاريع", projects.length, "Portfolio Scope")}
          ${this.kpi("عالية الأولوية", highPriority, "Priority Projects")}
          ${this.kpi("Quick Wins", quickWins, "0–6 Months")}
          ${this.kpi("جاهزية المحفظة", `${avgProgress}%`, "Average Readiness")}
          ${this.kpi("منخفضة التكلفة", lowCost, "Low Cost Projects")}
          ${this.kpi("صحة المحفظة", `${summary.portfolioHealth || 68}%`, "Portfolio Health")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>ملخص تنفيذي</h2>
              <p>قراءة سريعة لحالة محفظة مشاريع الذكاء الاصطناعي.</p>
            </div>

            <div class="portfolio-summary-box">
              <strong>المحفظة جاهزة للانتقال من التخطيط إلى التجارب السريعة</strong>
              <p>
                أفضل بداية تنفيذية هي إطلاق المشاريع السريعة منخفضة التكلفة مثل تلخيص الاجتماعات،
                التقارير الذكية، وبرنامج سفراء الذكاء الاصطناعي، بالتوازي مع تجهيز حوكمة المشاريع الكبرى.
              </p>
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>أولوية التنفيذ</h2>
              <p>الترتيب المقترح للانطلاق العملي.</p>
            </div>

            <div class="execution-order">
              <div><b>1</b><span>Quick Wins لإثبات القيمة خلال أشهر</span></div>
              <div><b>2</b><span>مشاريع متوسطة مرتبطة بالمعرفة والتقارير</span></div>
              <div><b>3</b><span>مشاريع استراتيجية كبرى بعد نضج البيانات والحوكمة</span></div>
            </div>
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>قائمة المشاريع</h2>
            <p>15 مشروعاً استراتيجياً قابلاً للتحويل إلى خطة تنفيذية.</p>
          </div>

          <div class="projects-grid">
            ${projects.map(project => this.projectCard(project)).join("")}
          </div>
        </div>

      </section>
    `;
  },

  projectCard(project) {
    const [icon, title, english, priority, duration, cost, progress, status] = project;

    return `
      <article class="project-card">
        <div class="project-card-head">
          <div class="project-icon">${icon}</div>
          <span class="aiw-status ${this.statusClass(status)}">${status}</span>
        </div>

        <h3>${title}</h3>
        <strong>${english}</strong>

        <div class="project-meta">
          <span>الأولوية: ${priority}</span>
          <span>المدة: ${duration}</span>
          <span>التكلفة: ${cost}</span>
        </div>

        <div class="project-progress">
          <div>
            <small>الجاهزية</small>
            <b>${progress}%</b>
          </div>
          <div class="aiw-progress"><div style="width:${progress}%"></div></div>
        </div>
      </article>
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

  statusClass(status) {
    if (status === "Quick Win") return "green";
    if (status === "استراتيجي") return "red";
    return "orange";
  },

  formatAED(value) {
    const n = Number(value || 0);
    if (n >= 1000000) return `${Math.round(n / 1000000)}M AED`;
    return `${n.toLocaleString("ar-AE")} AED`;
  }
};