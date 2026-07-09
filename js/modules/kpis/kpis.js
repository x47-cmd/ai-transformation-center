/* =========================================================
   AI Work - KPI Center V2.1
   Enterprise Biometric Intelligence KPI Engine
   No UI Design Changes
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.kpis = {
  id: "kpis",
  title: "المؤشرات",
  icon: "📈",

  kpis: [
    {
      icon: "👁️",
      title: "جودة التسجيلات البيومترية",
      desc: "نسبة التسجيلات المكتملة والسليمة مقابل التسجيلات التي تحتاج مراجعة.",
      target: 98,
      current: 84,
      unit: "%",
      owner: "فريق الأنظمة البيومترية",
      frequency: "شهري"
    },
    {
      icon: "⚠️",
      title: "التسجيلات التي تحتاج مراجعة",
      desc: "عدد الحالات التي اكتشفها النظام كمحتملة الخطأ أو التعارض.",
      target: 20,
      current: 65,
      unit: "حالة",
      owner: "فريق المراجعة",
      frequency: "أسبوعي"
    },
    {
      icon: "🧬",
      title: "السجلات المتعارضة أو المتكررة",
      desc: "عدد السجلات التي تحتوي على تشابه أو تعارض يستدعي المراجعة.",
      target: 10,
      current: 38,
      unit: "سجل",
      owner: "فريق جودة البيانات",
      frequency: "شهري"
    },
    {
      icon: "🔐",
      title: "تنبيهات استخدام الصلاحيات",
      desc: "عدد التنبيهات الناتجة عن استخدام غير اعتيادي للحسابات أو الصلاحيات.",
      target: 15,
      current: 42,
      unit: "تنبيه",
      owner: "الأمن الرقمي",
      frequency: "أسبوعي"
    },
    {
      icon: "⏱️",
      title: "الجلسات الطويلة غير الطبيعية",
      desc: "عدد جلسات الاستخدام التي تجاوزت النمط المعتاد للمستخدم أو الموقع.",
      target: 10,
      current: 31,
      unit: "جلسة",
      owner: "فريق الصلاحيات",
      frequency: "أسبوعي"
    },
    {
      icon: "🛂",
      title: "جاهزية البوابات الذكية",
      desc: "نسبة توفر البوابات الذكية وجاهزيتها التشغيلية.",
      target: 99,
      current: 91,
      unit: "%",
      owner: "فريق البوابات الذكية",
      frequency: "يومي"
    },
    {
      icon: "📊",
      title: "زمن عبور المسافر",
      desc: "متوسط زمن إكمال العملية عبر البوابة الذكية.",
      target: 15,
      current: 24,
      unit: "ثانية",
      owner: "فريق العمليات",
      frequency: "يومي"
    },
    {
      icon: "🛡️",
      title: "الامتثال للحوكمة",
      desc: "نسبة التنبيهات والمشاريع الحساسة التي مرت بمراجعة بشرية موثقة.",
      target: 100,
      current: 72,
      unit: "%",
      owner: "فريق الحوكمة",
      frequency: "شهري"
    }
  ],

  render(container) {
    if (!container) return;

    const W = window.AIW?.Widgets;
    const A = window.AIW?.Analytics;
    const AI = window.AIW?.AI;
    const R = window.AIW?.Recommendation;

    const scores = A?.score ? A.score() : {};
    const recommendations = R?.nextActions ? R.nextActions() : [
      "البدء بقياس جودة التسجيلات البيومترية كخط أساس قبل تشغيل نماذج الكشف المتقدمة.",
      "إطلاق لوحة Power BI للتسجيلات التي تحتاج مراجعة والسجلات المتعارضة.",
      "تحديد عتبة واضحة للجلسات الطويلة غير الطبيعية حسب طبيعة كل موقع ومستخدم.",
      "ربط تنبيهات استخدام الصلاحيات بإجراء مراجعة بشرية موثق.",
      "مراجعة مؤشرات جاهزية البوابات وزمن العبور بشكل يومي لتحسين التشغيل."
    ];

    const avgProgress = this.average(this.kpis.map(k => this.progress(k.current, k.target)));
    const onTrack = this.kpis.filter(k => this.progress(k.current, k.target) >= 60).length;
    const behind = this.kpis.filter(k => this.progress(k.current, k.target) < 40).length;

    const aiReport = AI?.generateExecutiveReport ? AI.generateExecutiveReport() : {
      status: "مرحلة بناء المؤشرات",
      message: "المرحلة التالية يجب أن تركز على ربط جودة التسجيلات، استخدام الصلاحيات، وأداء البوابات بلوحات قياس تنفيذية."
    };

    container.innerHTML = `
      <section class="module-page">

        ${W ? W.hero({
          kicker: "Biometric KPI Engine · Performance",
          title: "مركز مؤشرات الأداء",
          description: "محرك قياس تنفيذي يربط مشاريع الأنظمة البيومترية والبوابات الذكية بالمخرجات الفعلية: جودة التسجيلات، أخطاء البيانات، استخدام الصلاحيات، جاهزية البوابات، زمن العبور، والحوكمة.",
          chips: [
            "👁️ Biometric KPIs",
            `🎯 ${this.kpis.length} مؤشرات رئيسية`,
            `📊 ${avgProgress}% متوسط التقدم`,
            `🧠 Executive Score ${scores.executiveScore || 0}%`
          ]
        }) : this.fallbackHero()}

        <div class="module-grid">
          ${this.kpi("عدد المؤشرات", this.kpis.length, "Core KPIs")}
          ${this.kpi("على المسار", onTrack, "On Track")}
          ${this.kpi("متأخرة", behind, "Needs Attention")}
          ${this.kpi("متوسط التقدم", `${avgProgress}%`, "Average Progress")}
          ${this.kpi("Executive Score", `${scores.executiveScore || 0}%`, "Overall")}
          ${this.kpi("دورة القياس", "شهري", "Review Cycle")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("الخلاصة التنفيذية للمؤشرات", "قراءة سريعة لأداء محفظة الأنظمة البيومترية والبوابات الذكية.")}
            <div class="kpi-ultimate-summary">
              <strong>القياس هو الأساس لتحويل التحديات التشغيلية إلى قرارات ذكية</strong>
              <p>
                كل فكرة ذكاء اصطناعي في نطاق الأنظمة البيومترية يجب أن ترتبط بمؤشر واضح:
                جودة تسجيل، انخفاض أخطاء، تنبيهات صلاحيات، جاهزية بوابات، زمن عبور، أو امتثال حوكمي.
              </p>
              <div class="kpi-summary-strip">
                <div><span>Progress</span><b>${avgProgress}%</b></div>
                <div><span>On Track</span><b>${onTrack}</b></div>
                <div><span>Behind</span><b>${behind}</b></div>
                <div><span>Score</span><b>${scores.executiveScore || 0}%</b></div>
              </div>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("AI KPI Insight", "توصية ذكية مرتبطة بمحرك AI.")}
            <div class="kpi-ai-card">
              <strong>${aiReport.status || "مرحلة البناء"}</strong>
              <p>${aiReport.message || "المرحلة التالية يجب أن تركز على تحويل المشاريع إلى KPIs قابلة للقياس."}</p>
              <button class="module-btn secondary" data-module="reports">فتح التقارير</button>
            </div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("KPI Progress Chart", "مقارنة التقدم الحالي مقابل المستهدف.")}
            <div class="kpi-chart-card">
              <canvas id="kpiProgressChart"></canvas>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("KPI Health", "توزيع حالة المؤشرات.")}
            <div class="kpi-chart-card">
              <canvas id="kpiHealthChart"></canvas>
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("مؤشرات الأداء الرئيسية", "المؤشرات التي تربط الاستراتيجية بالأثر القابل للقياس.")}
          <div class="kpi-list">
            ${this.kpis.map(k => this.renderKpi(k)).join("")}
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("KPI Governance Model", "كيف يتم اعتماد وقياس كل مؤشر؟")}
          <div class="kpi-governance-grid">
            <div>
              <b>1</b>
              <strong>Baseline</strong>
              <span>تحديد خط الأساس الحالي للتسجيلات، الصلاحيات، والبوابات.</span>
            </div>
            <div>
              <b>2</b>
              <strong>Target</strong>
              <span>تحديد المستهدف والمالك ودورة القياس لكل مؤشر.</span>
            </div>
            <div>
              <b>3</b>
              <strong>Measure</strong>
              <span>قياس الأثر بعد لوحة التحليل أو PoC أو الإطلاق المرحلي.</span>
            </div>
            <div>
              <b>4</b>
              <strong>Review</strong>
              <span>مراجعة شهرية أو ربع سنوية للنتائج والتنبيهات.</span>
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("Decision Rules", "قواعد اتخاذ القرار بناءً على المؤشرات.")}
          <div class="kpi-impact-grid">
            <div>
              <strong>متى نعتبر المشروع ناجح؟</strong>
              <p>عندما يثبت انخفاضاً واضحاً في الأخطاء أو تحسناً في الجودة أو الجاهزية مقارنة بخط الأساس.</p>
            </div>
            <div>
              <strong>متى نوقف المشروع؟</strong>
              <p>إذا زادت الإنذارات الخاطئة، أو ظهرت مخاطر خصوصية، أو لم تثبت البيانات قيمة تشغيلية واضحة.</p>
            </div>
            <div>
              <strong>متى نتوسع؟</strong>
              <p>بعد تحقق المؤشرات، توثيق المراجعة البشرية، واعتماد الحوكمة والأمن الرقمي.</p>
            </div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("Executive Recommendations", "خطوات رفع أداء المؤشرات.")}
            <div class="executive-list">
              ${recommendations.map((item, i) => `
                <div class="executive-item">
                  <strong>${String(i + 1).padStart(2, "0")}</strong>
                  <span>${item}</span>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("KPI Ownership", "توزيع ملكية المؤشرات.")}
            <div class="kpi-owner-list">
              ${this.kpis.map(k => `
                <div>
                  <strong>${k.title}</strong>
                  <span>${k.owner}</span>
                  <small>${k.frequency}</small>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

      </section>
    `;

    this.renderCharts();
  },

  renderKpi(kpi) {
    const progress = this.progress(kpi.current, kpi.target);

    return `
      <article class="kpi-card">
        <div class="kpi-card-head">
          <div class="kpi-icon">${kpi.icon}</div>
          <span class="aiw-status ${this.statusClass(progress)}">${this.status(progress)}</span>
        </div>

        <h3>${kpi.title}</h3>
        <p>${kpi.desc}</p>

        <div class="kpi-values">
          <div>
            <span>الحالي</span>
            <strong>${this.formatValue(kpi.current, kpi.unit)}</strong>
          </div>
          <div>
            <span>المستهدف</span>
            <strong>${this.formatValue(kpi.target, kpi.unit)}</strong>
          </div>
        </div>

        <div class="kpi-meta-row">
          <span>المالك: ${kpi.owner}</span>
          <span>${kpi.frequency}</span>
        </div>

        <div class="aiw-progress"><div style="width:${progress}%"></div></div>
        <small>${progress}% من المستهدف</small>
      </article>
    `;
  },

  renderCharts() {
    if (!window.AIW?.Charts) return;

    setTimeout(() => {
      const labels = this.kpis.map(k => k.title);
      const progressValues = this.kpis.map(k => this.progress(k.current, k.target));
      const onTrack = this.kpis.filter(k => this.progress(k.current, k.target) >= 60).length;
      const building = this.kpis.filter(k => {
        const p = this.progress(k.current, k.target);
        return p >= 40 && p < 60;
      }).length;
      const behind = this.kpis.filter(k => this.progress(k.current, k.target) < 40).length;

      if (AIW.Charts.bar) {
        AIW.Charts.bar("kpiProgressChart", labels, progressValues, "KPI Progress");
      }

      if (AIW.Charts.doughnut) {
        AIW.Charts.doughnut(
          "kpiHealthChart",
          ["على المسار", "قيد البناء", "متأخرة"],
          [onTrack, building, behind],
          "KPI Health"
        );
      }
    }, 50);
  },

  progress(current, target) {
    const c = Number(current || 0);
    const t = Number(target || 1);

    if (
      [
        "التسجيلات التي تحتاج مراجعة",
        "السجلات المتعارضة أو المتكررة",
        "تنبيهات استخدام الصلاحيات",
        "الجلسات الطويلة غير الطبيعية",
        "زمن عبور المسافر"
      ].includes(this.currentKpiTitle)
    ) {
      return Math.max(0, Math.min(Math.round((1 - c / t) * 100), 100));
    }

    return Math.min(Math.round((c / t) * 100), 100);
  },

  status(score) {
    if (score >= 75) return "متقدم";
    if (score >= 60) return "على المسار";
    if (score >= 40) return "قيد البناء";
    return "متأخر";
  },

  statusClass(score) {
    if (score >= 75) return "green";
    if (score >= 40) return "orange";
    return "red";
  },

  formatValue(value, unit) {
    return `${value} ${unit}`;
  },

  average(values) {
    if (!values.length) return 0;
    return Math.round(values.reduce((a, b) => a + Number(b || 0), 0) / values.length);
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
        <span class="module-kicker">Biometric KPI Engine · Performance</span>
        <h1>مركز مؤشرات الأداء</h1>
        <p>محرك قياس تنفيذي يربط الأنظمة البيومترية والبوابات الذكية بالأثر القابل للقياس.</p>
      </div>
    `;
  }
};