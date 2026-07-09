/* =========================================================
   AI Work - Automation Center V1.0 Ultimate
   Workflow + Triggers + Approvals + Monitoring
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.automation = {
  id: "automation",
  title: "الأتمتة",
  icon: "⚙️",

  workflows: [
    {
      icon: "💡",
      title: "تقييم فكرة ذكاء اصطناعي",
      trigger: "عند إضافة فكرة جديدة",
      steps: ["استقبال الفكرة", "تقييم الأولوية", "تقييم المخاطر", "تحديد المالك", "رفع القرار"],
      owner: "فريق المبادرة",
      status: "نشط",
      automation: 72
    },
    {
      icon: "📁",
      title: "اعتماد مشروع جديد",
      trigger: "عند تحويل فكرة إلى مشروع",
      steps: ["دراسة الجدوى", "مراجعة الحوكمة", "اعتماد الميزانية", "تحديد KPI", "بدء التنفيذ"],
      owner: "اللجنة التوجيهية",
      status: "قيد التفعيل",
      automation: 58
    },
    {
      icon: "🛡️",
      title: "مراجعة مخاطر الذكاء الاصطناعي",
      trigger: "قبل إطلاق PoC",
      steps: ["تصنيف البيانات", "تقييم الخصوصية", "تقييم الأمن", "مراجعة التحيز", "اعتماد Sandbox"],
      owner: "حوكمة الذكاء الاصطناعي",
      status: "نشط",
      automation: 64
    },
    {
      icon: "📊",
      title: "إصدار تقرير تنفيذي",
      trigger: "نهاية كل ربع سنة",
      steps: ["جمع المؤشرات", "تحليل الأداء", "توليد التوصيات", "مراجعة الإدارة", "إصدار التقرير"],
      owner: "مكتب البرنامج",
      status: "مخطط",
      automation: 46
    },
    {
      icon: "📈",
      title: "تحديث مؤشرات الأداء",
      trigger: "عند تحديث بيانات المشروع",
      steps: ["قراءة البيانات", "حساب KPI", "تحديث Dashboard", "إرسال تنبيه", "حفظ السجل"],
      owner: "KPI Owner",
      status: "قيد التفعيل",
      automation: 62
    },
    {
      icon: "🔔",
      title: "تنبيه المخاطر العالية",
      trigger: "عند تسجيل خطر عالي",
      steps: ["تحديد الخطر", "تقييم الأثر", "إشعار المالك", "تصعيد للجنة", "متابعة الإغلاق"],
      owner: "Risk Owner",
      status: "نشط",
      automation: 78
    }
  ],

  triggers: [
    ["DATA_CHANGED", "عند تغيير البيانات", "تحديث المؤشرات والتقارير تلقائياً"],
    ["IDEA_CREATED", "عند إضافة فكرة", "تشغيل تقييم الفكرة"],
    ["PROJECT_APPROVED", "عند اعتماد مشروع", "إنشاء KPI وخطة متابعة"],
    ["RISK_HIGH", "عند وجود خطر عالي", "تصعيد تلقائي للمالك واللجنة"],
    ["QUARTER_END", "نهاية الربع", "إصدار تقرير تنفيذي"],
    ["MATURITY_UPDATED", "تحديث النضج", "تحديث لوحة النضج والتوصيات"]
  ],

  approvals: [
    ["فكرة جديدة", "فريق المبادرة", "قيد المراجعة", "متوسط"],
    ["مشروع Quick Win", "مدير البرنامج", "جاهز للاعتماد", "منخفض"],
    ["مشروع استراتيجي", "اللجنة التوجيهية", "يتطلب قرار", "عالٍ"],
    ["استخدام بيانات حساسة", "فريق الخصوصية", "يتطلب مراجعة", "عالٍ"],
    ["إطلاق PoC", "حوكمة الذكاء الاصطناعي", "قيد التقييم", "متوسط"]
  ],

  render(container) {
    if (!container) return;

    const W = window.AIW?.Widgets;
    const AUTO = window.AIW?.Automation;
    const R = window.AIW?.Recommendation;

    const stats = AUTO?.statistics ? AUTO.statistics() : {
      total: this.workflows.length,
      active: this.workflows.filter(w => w.status === "نشط").length,
      completed: 0,
      waiting: this.workflows.filter(w => w.status !== "نشط").length
    };

    const avgAutomation = this.average(this.workflows.map(w => w.automation));
    const activeWorkflows = this.workflows.filter(w => w.status === "نشط").length;
    const highApprovals = this.approvals.filter(a => String(a[3]).includes("عال")).length;
    const nextActions = R?.nextActions ? R.nextActions() : [];

    container.innerHTML = `
      <section class="module-page">

        ${W ? W.hero({
          kicker: "Automation · Workflow Engine",
          title: "مركز الأتمتة وسير العمل",
          description: "إدارة سير العمل المؤسسي لمبادرات الذكاء الاصطناعي من استقبال الفكرة إلى الاعتماد، الحوكمة، المؤشرات، التقارير، والتنبيهات.",
          chips: [
            "⚙️ Workflow Engine",
            `🔁 ${this.workflows.length} Workflows`,
            `✅ ${activeWorkflows} نشطة`,
            `📊 ${avgAutomation}% أتمتة`
          ]
        }) : this.fallbackHero()}

        <div class="module-grid">
          ${this.kpi("إجمالي Workflows", this.workflows.length, "Automation Flows")}
          ${this.kpi("نشطة", activeWorkflows, "Active")}
          ${this.kpi("Triggers", this.triggers.length, "Event Rules")}
          ${this.kpi("طلبات اعتماد", this.approvals.length, "Approvals")}
          ${this.kpi("اعتمادات عالية الخطورة", highApprovals, "High Risk")}
          ${this.kpi("متوسط الأتمتة", `${avgAutomation}%`, "Automation Level")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("الخلاصة التشغيلية", "كيف تساعد الأتمتة في تحويل الاستراتيجية إلى تشغيل يومي.")}
            <div class="automation-summary-card">
              <strong>الأتمتة تربط الأفكار بالحوكمة والمشاريع والمؤشرات</strong>
              <p>
                كل فكرة أو مشروع أو خطر أو تقرير يجب أن يملك Workflow واضح:
                من يراجع؟ من يعتمد؟ متى يتم التصعيد؟ وما المؤشر الذي يقيس الأثر؟
              </p>

              <div class="automation-summary-strip">
                <div><span>Total</span><b>${stats.total}</b></div>
                <div><span>Active</span><b>${stats.active}</b></div>
                <div><span>Waiting</span><b>${stats.waiting}</b></div>
                <div><span>Level</span><b>${avgAutomation}%</b></div>
              </div>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("Automation Operating Model", "نموذج التشغيل الآلي في المنصة.")}
            <div class="automation-model">
              <div><b>1</b><span>Event Trigger</span></div>
              <div><b>2</b><span>Business Rule</span></div>
              <div><b>3</b><span>Approval / Action</span></div>
              <div><b>4</b><span>Notification</span></div>
              <div><b>5</b><span>Report Update</span></div>
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("Workflow Portfolio", "سير العمل الرئيسي داخل منصة التحول المؤسسي.")}
          <div class="automation-workflow-grid">
            ${this.workflows.map(w => this.workflowCard(w)).join("")}
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("Event Triggers", "الأحداث التي تشغل الأتمتة داخل النظام.")}
            <div class="automation-trigger-list">
              ${this.triggers.map((t, i) => `
                <div>
                  <b>${String(i + 1).padStart(2, "0")}</b>
                  <strong>${t[0]}</strong>
                  <span>${t[1]}</span>
                  <p>${t[2]}</p>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("Approval Queue", "طلبات الاعتماد التي تحتاج متابعة تنفيذية.")}
            <div class="automation-approval-list">
              ${this.approvals.map((a, i) => `
                <div>
                  <b>${String(i + 1).padStart(2, "0")}</b>
                  <div>
                    <strong>${a[0]}</strong>
                    <span>${a[1]}</span>
                    <small>${a[2]}</small>
                  </div>
                  <em class="${this.riskClass(a[3])}">${a[3]}</em>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("Automation Roadmap", "خطة تطوير الأتمتة من Workflow بسيط إلى تشغيل ذكي.")}
          <div class="automation-roadmap">
            <div><b>1</b><strong>Manual Workflow</strong><span>تحديد المسؤوليات والخطوات.</span></div>
            <div><b>2</b><strong>Semi-Automated</strong><span>تنبيهات وتحديثات تلقائية.</span></div>
            <div><b>3</b><strong>Rule-Based</strong><span>قواعد عمل وتشغيل تلقائي حسب الحالة.</span></div>
            <div><b>4</b><strong>AI Assisted</strong><span>توصيات ذكية للقرارات والتصعيد.</span></div>
            <div><b>5</b><strong>Autonomous Ops</strong><span>تشغيل مؤسسي متقدم مع إشراف بشري.</span></div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("Next Best Actions", "توصيات تشغيلية من Recommendation Engine.")}
            <div class="executive-list">
              ${nextActions.map((item, i) => `
                <div class="executive-item">
                  <strong>${String(i + 1).padStart(2, "0")}</strong>
                  <span>${item}</span>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("Automation Engine Status", "حالة المحرك التقني للأتمتة.")}
            <div class="automation-engine-status">
              <strong>AIW.Automation Engine</strong>
              <p>المحرك مفعل ويستمع لأحداث البيانات والتنقل والتحديثات المستقبلية.</p>
              <div class="aiw-progress"><div style="width:${avgAutomation}%"></div></div>
              <small>Current automation capability: ${avgAutomation}%</small>
            </div>
          </div>
        </div>

      </section>
    `;
  },

  workflowCard(w) {
    return `
      <article class="automation-workflow-card">
        <div class="automation-workflow-head">
          <div>${w.icon}</div>
          <span class="aiw-status ${w.status === "نشط" ? "green" : "orange"}">${w.status}</span>
        </div>

        <h3>${w.title}</h3>
        <p>${w.trigger}</p>

        <div class="automation-steps">
          ${w.steps.map((s, i) => `<span>${i + 1}. ${s}</span>`).join("")}
        </div>

        <div class="automation-meta">
          <span>المالك: ${w.owner}</span>
          <span>${w.automation}% أتمتة</span>
        </div>

        <div class="aiw-progress"><div style="width:${w.automation}%"></div></div>
      </article>
    `;
  },

  average(values) {
    if (!values.length) return 0;
    return Math.round(values.reduce((a, b) => a + Number(b || 0), 0) / values.length);
  },

  riskClass(level) {
    if (String(level).includes("عال")) return "red";
    if (String(level).includes("متوسط")) return "orange";
    return "green";
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
        <span class="module-kicker">Automation · Workflow Engine</span>
        <h1>مركز الأتمتة وسير العمل</h1>
        <p>إدارة سير العمل المؤسسي لمبادرات الذكاء الاصطناعي.</p>
      </div>
    `;
  }
};