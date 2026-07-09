/* =========================================================
   AI Work - Projects Module V2.1
   Enterprise Biometric Intelligence Portfolio
   No UI Design Changes
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.projects = {
  id: "projects",
  title: "المشاريع",
  icon: "📁",

  projects: [
    ["👁️", "محرك سلامة البيانات البيومترية", "Biometric Data Integrity Engine", "عالية", "6-9 أشهر", "متوسطة", 72, "قيد التخطيط"],
    ["🔐", "محرك كشف إساءة استخدام الحسابات", "Credential Misuse Detection Engine", "عالية", "6-8 أشهر", "متوسطة", 70, "قيد التخطيط"],
    ["👨🏻‍💻", "منصة تحليل سلوك المستخدمين", "User Behaviour Intelligence Platform", "عالية", "6-9 أشهر", "متوسطة", 66, "قيد التخطيط"],
    ["🛂", "تحليل أداء البوابات الذكية", "Smart Gate Performance Intelligence", "عالية", "6-8 أشهر", "متوسطة", 68, "قيد الدراسة"],
    ["📊", "لوحة العمليات البيومترية بالمطارات", "Airport Biometric Operations Dashboard", "عالية", "3-4 أشهر", "منخفضة", 88, "Quick Win"],

    ["✅", "مراقبة جودة التسجيلات البيومترية", "Biometric Registration Quality Monitor", "عالية", "3-5 أشهر", "منخفضة", 86, "Quick Win"],
    ["🧬", "كشف الهويات المتكررة والمتعارضة", "Duplicate Identity Detection Engine", "عالية", "6-8 أشهر", "متوسطة", 62, "قيد الدراسة"],
    ["⚠️", "لوحة ذكاء أخطاء التسجيل", "Registration Error Intelligence Dashboard", "عالية", "3-4 أشهر", "منخفضة", 90, "Quick Win"],
    ["🧾", "تحليل استخدام الصلاحيات", "Privilege Usage Analytics", "عالية", "3-5 أشهر", "منخفضة", 84, "Quick Win"],
    ["⏱️", "كشف الجلسات الطويلة غير الطبيعية", "Long Session Anomaly Detection", "عالية", "3-4 أشهر", "منخفضة", 82, "Quick Win"],

    ["📷", "ذكاء جودة التقاط البصمة والصورة", "Biometric Capture Quality AI", "متوسطة", "3-4 أشهر", "منخفضة", 78, "Quick Win"],
    ["🛡️", "كشف الشذوذ في سجلات الدخول", "Access Log Anomaly Detection", "عالية", "5-7 أشهر", "متوسطة", 64, "قيد التخطيط"],
    ["🚦", "ترتيب التنبيهات الأمنية بالذكاء الاصطناعي", "AI Security Alert Prioritization", "عالية", "3-4 أشهر", "منخفضة", 80, "Quick Win"],
    ["🛠️", "الصيانة التنبؤية للبوابات الذكية", "Smart Gate Predictive Maintenance", "عالية", "8-10 أشهر", "عالية", 52, "استراتيجي"],
    ["📈", "لوحة القيادة التنفيذية للأنظمة البيومترية", "Executive Biometric Intelligence Dashboard", "عالية", "5-7 أشهر", "متوسطة", 74, "قيد التخطيط"]
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
          <span class="module-kicker">Execution Center · Biometric Portfolio</span>
          <h1>محفظة مشاريع الأنظمة البيومترية والبوابات الذكية</h1>
          <p>
            تحويل أفكار الذكاء الاصطناعي المتخصصة إلى مشاريع تنفيذية في جودة التسجيلات،
            استخدام الصلاحيات، البوابات الذكية، الأمن الرقمي، والتحليلات التنفيذية.
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
              <p>قراءة سريعة لحالة محفظة مشاريع الذكاء الاصطناعي المتخصصة.</p>
            </div>

            <div class="portfolio-summary-box">
              <strong>المحفظة جاهزة للبدء بمشاريع قياس وتحليل قبل التكامل العميق</strong>
              <p>
                أفضل بداية تنفيذية هي إطلاق المشاريع السريعة منخفضة التكلفة مثل لوحة أخطاء التسجيل،
                تحليل استخدام الصلاحيات، مراقبة مدة الجلسات، ولوحة العمليات البيومترية، ثم الانتقال
                إلى محركات الكشف المتقدمة بعد نضج البيانات والحوكمة.
              </p>
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>أولوية التنفيذ</h2>
              <p>الترتيب المقترح للانطلاق العملي.</p>
            </div>

            <div class="execution-order">
              <div><b>1</b><span>لوحات تحليل وPower BI لقياس الوضع الحالي</span></div>
              <div><b>2</b><span>نماذج كشف الشذوذ في التسجيلات والصلاحيات</span></div>
              <div><b>3</b><span>منصة تنفيذية موحدة مع تنبيهات وتوصيات ذكية</span></div>
            </div>
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>قائمة المشاريع</h2>
            <p>15 مشروعاً متخصصاً قابلاً للتحويل إلى خطة تنفيذية ضمن اختصاص الأنظمة البيومترية والبوابات الذكية.</p>
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