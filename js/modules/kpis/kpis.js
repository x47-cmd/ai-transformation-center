/* =========================================================
   AI Work - KPI Center V1.0 Final
   Enterprise Performance Measurement Engine
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.kpis = {
  id: "kpis",
  title: "المؤشرات",
  icon: "📈",

  kpis: [
    ["📁", "المشاريع المنفذة", "عدد المشاريع المنفذة سنوياً مقابل المخطط لها", 15, 4, "مشروع"],
    ["⏱️", "توفير الوقت", "نسبة توفير الوقت الناتجة عن الأتمتة والذكاء الاصطناعي", 30, 8, "%"],
    ["💰", "العائد المتوقع", "العائد المالي أو التشغيلي المتوقع من المبادرات", 42000000, 9000000, "AED"],
    ["😊", "رضا المستخدمين", "رضا الموظفين والمتعاملين عن الخدمات المطورة بالذكاء الاصطناعي", 90, 62, "%"],
    ["🏢", "مشاركة الإدارات", "عدد الإدارات المشاركة فعلياً في تبني حلول الذكاء الاصطناعي", 10, 6, "إدارات"],
    ["🧠", "نضج الذكاء الاصطناعي", "مستوى النضج المؤسسي في تبني الذكاء الاصطناعي", 100, 34, "%"]
  ],

  render(container) {
    if (!container) return;

    const totalTarget = this.kpis.length;
    const onTrack = this.kpis.filter(k => this.progress(k[4], k[3]) >= 60).length;
    const avgProgress = Math.round(
      this.kpis.reduce((sum, k) => sum + this.progress(k[4], k[3]), 0) / this.kpis.length
    );

    container.innerHTML = `
      <section class="module-page">

        <div class="module-hero">
          <span class="module-kicker">KPI Engine · Performance</span>
          <h1>مركز مؤشرات الأداء</h1>
          <p>
            محرك قياس تنفيذي يربط استراتيجية الذكاء الاصطناعي بالمخرجات الفعلية:
            المشاريع، التوفير، العائد، رضا المستخدمين، مشاركة الإدارات، والنضج المؤسسي.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">📈 KPI Engine</span>
            <span class="aiw-chip">🎯 ${this.kpis.length} مؤشرات رئيسية</span>
            <span class="aiw-chip">📊 ${avgProgress}% متوسط التقدم</span>
          </div>
        </div>

        <div class="module-grid">
          ${this.kpi("عدد المؤشرات", totalTarget, "Core KPIs")}
          ${this.kpi("على المسار", onTrack, "On Track")}
          ${this.kpi("متوسط التقدم", `${avgProgress}%`, "Average Progress")}
          ${this.kpi("دورة القياس", "ربع سنوي", "Review Cycle")}
          ${this.kpi("الحالة العامة", this.status(avgProgress), "Performance")}
          ${this.kpi("المالك", "اللجنة التوجيهية", "Owner")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>الخلاصة التنفيذية</h2>
              <p>قراءة سريعة لأداء برنامج الذكاء الاصطناعي.</p>
            </div>

            <div class="kpi-summary-card">
              <strong>القياس هو الفرق بين مبادرة أفكار وبرنامج تحول حقيقي</strong>
              <p>
                كل مشروع ذكاء اصطناعي يجب أن يرتبط بمؤشر واضح قبل الاعتماد:
                أثر تشغيلي، توفير وقت، رفع جودة، تحسين رضا، أو عائد مالي.
              </p>
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>نموذج القياس</h2>
              <p>كيف يتم تقييم كل مشروع؟</p>
            </div>

            <div class="kpi-model">
              <div><b>1</b><span>تحديد خط الأساس قبل المشروع</span></div>
              <div><b>2</b><span>تحديد المستهدف بعد التطبيق</span></div>
              <div><b>3</b><span>قياس الأثر بعد PoC</span></div>
              <div><b>4</b><span>مراجعة ربع سنوية للإدارة</span></div>
            </div>
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>مؤشرات الأداء الرئيسية</h2>
            <p>المؤشرات التي تربط الاستراتيجية بالأثر القابل للقياس.</p>
          </div>

          <div class="kpi-list">
            ${this.kpis.map(k => this.renderKpi(k)).join("")}
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>لوحة قياس الأثر</h2>
            <p>تحويل كل KPI إلى قرار تنفيذي واضح.</p>
          </div>

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

      </section>
    `;
  },

  renderKpi(kpi) {
    const [icon, title, desc, target, current, unit] = kpi;
    const progress = this.progress(current, target);

    return `
      <article class="kpi-card">
        <div class="kpi-card-head">
          <div class="kpi-icon">${icon}</div>
          <span class="aiw-status ${this.statusClass(progress)}">${this.status(progress)}</span>
        </div>

        <h3>${title}</h3>
        <p>${desc}</p>

        <div class="kpi-values">
          <div>
            <span>الحالي</span>
            <strong>${this.formatValue(current, unit)}</strong>
          </div>
          <div>
            <span>المستهدف</span>
            <strong>${this.formatValue(target, unit)}</strong>
          </div>
        </div>

        <div class="aiw-progress"><div style="width:${progress}%"></div></div>
        <small>${progress}% من المستهدف</small>
      </article>
    `;
  },

  progress(current, target) {
    const c = Number(current || 0);
    const t = Number(target || 1);
    return Math.min(Math.round((c / t) * 100), 100);
  },

  status(score) {
    if (score >= 75) return "متقدم";
    if (score >= 50) return "على المسار";
    if (score >= 25) return "قيد البناء";
    return "بداية";
  },

  statusClass(score) {
    if (score >= 75) return "green";
    if (score >= 50) return "orange";
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