/* =========================================================
   AI Work - KPI Center V2.0 Ultimate
   Enterprise Performance Measurement Engine
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.kpis = {
  id: "kpis",
  title: "المؤشرات",
  icon: "📈",

  kpis: [
    {
      icon: "📁",
      title: "المشاريع المنفذة",
      desc: "عدد المشاريع المنفذة سنوياً مقابل المخطط لها.",
      target: 15,
      current: 4,
      unit: "مشروع",
      owner: "مكتب البرنامج",
      frequency: "ربع سنوي"
    },
    {
      icon: "⏱️",
      title: "توفير الوقت",
      desc: "نسبة توفير الوقت الناتجة عن الأتمتة والذكاء الاصطناعي.",
      target: 30,
      current: 8,
      unit: "%",
      owner: "الإدارات المالكة",
      frequency: "ربع سنوي"
    },
    {
      icon: "💰",
      title: "العائد المتوقع",
      desc: "العائد المالي أو التشغيلي المتوقع من المبادرات.",
      target: 42000000,
      current: 9000000,
      unit: "AED",
      owner: "المالية",
      frequency: "ربع سنوي"
    },
    {
      icon: "😊",
      title: "رضا المستخدمين",
      desc: "رضا الموظفين والمتعاملين عن الخدمات المطورة بالذكاء الاصطناعي.",
      target: 90,
      current: 62,
      unit: "%",
      owner: "خدمة المتعاملين / الموارد البشرية",
      frequency: "نصف سنوي"
    },
    {
      icon: "🏢",
      title: "مشاركة الإدارات",
      desc: "عدد الإدارات المشاركة فعلياً في تبني حلول الذكاء الاصطناعي.",
      target: 10,
      current: 6,
      unit: "إدارات",
      owner: "فريق المبادرة",
      frequency: "شهري"
    },
    {
      icon: "🧠",
      title: "نضج الذكاء الاصطناعي",
      desc: "مستوى النضج المؤسسي في تبني الذكاء الاصطناعي.",
      target: 100,
      current: 34,
      unit: "%",
      owner: "اللجنة التوجيهية",
      frequency: "ربع سنوي"
    },
    {
      icon: "🛡️",
      title: "الامتثال للحوكمة",
      desc: "نسبة المشاريع التي مرت بتقييم الحوكمة والمخاطر قبل الإطلاق.",
      target: 100,
      current: 55,
      unit: "%",
      owner: "حوكمة الذكاء الاصطناعي",
      frequency: "ربع سنوي"
    },
    {
      icon: "🚀",
      title: "Quick Wins المنفذة",
      desc: "عدد المشاريع السريعة التي تم تنفيذها لإثبات القيمة.",
      target: 6,
      current: 2,
      unit: "مشروع",
      owner: "مكتب البرنامج",
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
    const recommendations = R?.nextActions ? R.nextActions() : [];
    const avgProgress = this.average(this.kpis.map(k => this.progress(k.current, k.target)));
    const onTrack = this.kpis.filter(k => this.progress(k.current, k.target) >= 60).length;
    const behind = this.kpis.filter(k => this.progress(k.current, k.target) < 40).length;
    const aiReport = AI?.generateExecutiveReport ? AI.generateExecutiveReport() : {};

    container.innerHTML = `
      <section class="module-page">

        ${W ? W.hero({
          kicker: "KPI Engine · Performance",
          title: "مركز مؤشرات الأداء",
          description: "محرك قياس تنفيذي يربط استراتيجية الذكاء الاصطناعي بالمخرجات الفعلية: المشاريع، التوفير، العائد، رضا المستخدمين، مشاركة الإدارات، الحوكمة، والنضج المؤسسي.",
          chips: [
            "📈 KPI Engine",
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
          ${this.kpi("دورة القياس", "ربع سنوي", "Review Cycle")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("الخلاصة التنفيذية للمؤشرات", "قراءة سريعة لأداء برنامج الذكاء الاصطناعي.")}
            <div class="kpi-ultimate-summary">
              <strong>القياس هو الفرق بين مبادرة أفكار وبرنامج تحول حقيقي</strong>
              <p>
                كل مشروع ذكاء اصطناعي يجب أن يرتبط بمؤشر واضح قبل الاعتماد:
                أثر تشغيلي، توفير وقت، رفع جودة، تحسين رضا، امتثال، أو عائد مالي.
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
              <span>تحديد خط الأساس قبل تنفيذ المشروع.</span>
            </div>
            <div>
              <b>2</b>
              <strong>Target</strong>
              <span>تحديد المستهدف والمالك ودورة القياس.</span>
            </div>
            <div>
              <b>3</b>
              <strong>Measure</strong>
              <span>قياس الأثر بعد PoC أو الإطلاق المرحلي.</span>
            </div>
            <div>
              <b>4</b>
              <strong>Review</strong>
              <span>مراجعة ربع سنوية للإدارة العليا.</span>
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("Decision Rules", "قواعد اتخاذ القرار بناءً على المؤشرات.")}
          <div class="kpi-impact-grid">
            <div>
              <strong>متى نعتبر المشروع ناجح؟</strong>
              <p>عندما يحقق وفراً أو تحسناً واضحاً مقابل خط الأساس، وليس فقط عند اكتمال التنفيذ التقني.</p>
            </div>
            <div>
              <strong>متى نوقف المشروع؟</strong>
              <p>إذا لم يثبت قيمة في PoC، أو ظهرت مخاطر خصوصية أو أمنية غير قابلة للسيطرة.</p>
            </div>
            <div>
              <strong>متى نتوسع؟</strong>
              <p>بعد تحقق KPI، قبول المستخدمين، سلامة البيانات، واعتماد لجنة الحوكمة.</p>
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
    if (unit === "AED") {
      const n = Number(value || 0);
      if (n >= 1000000) return `${Math.round(n / 1000000)}M AED`;
      return `${n.toLocaleString("ar-AE")} AED`;
    }

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
        <span class="module-kicker">KPI Engine · Performance</span>
        <h1>مركز مؤشرات الأداء</h1>
        <p>محرك قياس تنفيذي يربط الاستراتيجية بالأثر القابل للقياس.</p>
      </div>
    `;
  }
};