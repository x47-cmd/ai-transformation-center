/* =========================================================
   AI Work - Biometric Operations Automation Center V2.0
   Workflow + Triggers + Approvals + Monitoring
   Enterprise Biometric Intelligence Platform
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.automation = {
  id: "automation",
  title: "الأتمتة",
  icon: "⚙️",

  workflows: [
    {
      icon: "🪪",
      title: "معالجة حالة تسجيل بيومتري",
      trigger: "عند إنشاء حالة تسجيل جديدة",
      steps: [
        "استقبال الحالة",
        "فحص اكتمال البيانات",
        "تقييم جودة العينة",
        "تحديد سبب التعثر",
        "إحالة الحالة للمعالجة"
      ],
      owner: "فريق العمليات البيومترية",
      status: "نشط",
      automation: 82
    },
    {
      icon: "🔍",
      title: "مراجعة فشل المطابقة",
      trigger: "عند انخفاض نتيجة المطابقة عن الحد المعتمد",
      steps: [
        "تسجيل حالة الفشل",
        "تحليل درجة الثقة",
        "مقارنة العينات",
        "تحديد سبب الفشل",
        "رفع التوصية للمراجع"
      ],
      owner: "فريق المطابقة والتحقق",
      status: "نشط",
      automation: 76
    },
    {
      icon: "📉",
      title: "معالجة انخفاض جودة العينة",
      trigger: "عند تجاوز نسبة العينات منخفضة الجودة الحد التشغيلي",
      steps: [
        "قراءة مؤشر الجودة",
        "تحديد الجهاز أو الموقع",
        "تحليل نمط التكرار",
        "إرسال تنبيه تشغيلي",
        "متابعة الإجراء التصحيحي"
      ],
      owner: "فريق جودة البيانات البيومترية",
      status: "نشط",
      automation: 74
    },
    {
      icon: "🛡️",
      title: "مراجعة مخاطر البيانات البيومترية",
      trigger: "قبل استخدام بيانات حساسة أو إطلاق تحسين جديد",
      steps: [
        "تصنيف البيانات",
        "تقييم الخصوصية",
        "مراجعة الصلاحيات",
        "تقييم الأمن",
        "اعتماد الاستخدام"
      ],
      owner: "حوكمة البيانات والخصوصية",
      status: "قيد التفعيل",
      automation: 66
    },
    {
      icon: "🧠",
      title: "اعتماد تحسين خوارزمية المطابقة",
      trigger: "عند اقتراح تعديل الخوارزمية أو Threshold",
      steps: [
        "تسجيل طلب التغيير",
        "تحليل الأثر",
        "اختبار النتائج",
        "مراجعة الحوكمة",
        "اعتماد النشر"
      ],
      owner: "لجنة الأنظمة البيومترية",
      status: "قيد التفعيل",
      automation: 58
    },
    {
      icon: "📡",
      title: "مراقبة صحة الأنظمة البيومترية",
      trigger: "عند تغير حالة النظام أو التكامل",
      steps: [
        "قراءة حالة الأنظمة",
        "تحديد مصدر الخلل",
        "تصنيف شدة التأثير",
        "إشعار فريق الدعم",
        "تحديث سجل الحالة"
      ],
      owner: "فريق المنصة والتكامل",
      status: "نشط",
      automation: 86
    },
    {
      icon: "🚨",
      title: "تصعيد الحالات عالية الخطورة",
      trigger: "عند تسجيل حالة بيومترية عالية الخطورة",
      steps: [
        "تحديد الحالة",
        "تقييم الأثر",
        "إشعار مالك الحالة",
        "تصعيد للجنة المختصة",
        "متابعة الإغلاق"
      ],
      owner: "مالك المخاطر البيومترية",
      status: "نشط",
      automation: 84
    },
    {
      icon: "📊",
      title: "إصدار تقرير العمليات البيومترية",
      trigger: "نهاية كل فترة تشغيلية",
      steps: [
        "جمع المؤشرات",
        "تحليل حالات الفشل",
        "تحليل جودة العينات",
        "توليد التوصيات",
        "إصدار التقرير التنفيذي"
      ],
      owner: "مكتب الذكاء البيومتري",
      status: "مخطط",
      automation: 48
    }
  ],

  triggers: [
    [
      "BIOMETRIC_CASE_CREATED",
      "إنشاء حالة بيومترية",
      "تشغيل Workflow فحص ومعالجة الحالة الجديدة"
    ],
    [
      "MATCH_FAILURE_DETECTED",
      "اكتشاف فشل مطابقة",
      "تحليل درجة الثقة وإحالة الحالة للمراجعة"
    ],
    [
      "QUALITY_THRESHOLD_BREACHED",
      "انخفاض جودة العينة",
      "تحديد مصدر المشكلة وإرسال تنبيه تشغيلي"
    ],
    [
      "SYSTEM_HEALTH_CHANGED",
      "تغير صحة النظام",
      "تحديث مؤشرات صحة الأنظمة وفتح حالة دعم"
    ],
    [
      "HIGH_RISK_CASE",
      "حالة عالية الخطورة",
      "تصعيد تلقائي لمالك الخطر واللجنة المختصة"
    ],
    [
      "PRIVACY_REVIEW_REQUIRED",
      "طلب مراجعة خصوصية",
      "بدء مراجعة استخدام البيانات والصلاحيات"
    ],
    [
      "ALGORITHM_CHANGE_REQUESTED",
      "طلب تغيير خوارزمية",
      "تشغيل مسار الاختبار والمراجعة والاعتماد"
    ],
    [
      "BIOMETRIC_DATA_CHANGED",
      "تحديث بيانات العمليات",
      "تحديث المؤشرات والتقارير التنفيذية تلقائياً"
    ]
  ],

  approvals: [
    [
      "حالة تسجيل بيومتري استثنائية",
      "مشرف العمليات البيومترية",
      "قيد المراجعة",
      "متوسط"
    ],
    [
      "نتيجة مطابقة منخفضة الثقة",
      "فريق المطابقة والتحقق",
      "تتطلب تحققاً بشرياً",
      "متوسط"
    ],
    [
      "تعديل Threshold المطابقة",
      "لجنة الأنظمة البيومترية",
      "يتطلب قراراً",
      "عالٍ"
    ],
    [
      "الوصول إلى بيانات بيومترية حساسة",
      "فريق الخصوصية",
      "يتطلب مراجعة",
      "عالٍ"
    ],
    [
      "إطلاق تحسين في البيئة التشغيلية",
      "مدير المنصة",
      "جاهز للاعتماد",
      "متوسط"
    ],
    [
      "إغلاق حالة عالية الخطورة",
      "مالك المخاطر البيومترية",
      "بانتظار التحقق",
      "عالٍ"
    ]
  ],

  fallbackActions: [
    "مراجعة الحالات البيومترية ذات درجات الثقة المنخفضة.",
    "تحليل المواقع التي تسجل أعلى نسبة عينات منخفضة الجودة.",
    "تفعيل التنبيه التلقائي عند تراجع صحة أي نظام بيومتري.",
    "إغلاق الحالات عالية الخطورة التي تجاوزت مدة المعالجة.",
    "مراجعة صلاحيات الوصول إلى البيانات البيومترية الحساسة."
  ],

  render(container) {
    if (!container) return;

    const W = window.AIW?.Widgets;
    const AUTO = window.AIW?.Automation;
    const R = window.AIW?.Recommendation;

    const localStats = {
      total: this.workflows.length,
      active: this.workflows.filter(
        workflow => workflow.status === "نشط"
      ).length,
      completed: 0,
      waiting: this.workflows.filter(
        workflow => workflow.status !== "نشط"
      ).length
    };

    let stats = localStats;

    try {
      if (AUTO?.statistics) {
        const engineStats = AUTO.statistics();

        stats = {
          total: Number(engineStats?.total ?? localStats.total),
          active: Number(engineStats?.active ?? localStats.active),
          completed: Number(
            engineStats?.completed ?? localStats.completed
          ),
          waiting: Number(engineStats?.waiting ?? localStats.waiting)
        };
      }
    } catch (error) {
      console.warn(
        "AIW Automation statistics fallback activated:",
        error
      );
    }

    const avgAutomation = this.average(
      this.workflows.map(workflow => workflow.automation)
    );

    const activeWorkflows = this.workflows.filter(
      workflow => workflow.status === "نشط"
    ).length;

    const highApprovals = this.approvals.filter(approval =>
      String(approval[3]).includes("عال")
    ).length;

    let nextActions = [];

    try {
      if (R?.nextActions) {
        const engineActions = R.nextActions();

        if (Array.isArray(engineActions)) {
          nextActions = engineActions.filter(Boolean);
        }
      }
    } catch (error) {
      console.warn(
        "AIW Recommendation Engine fallback activated:",
        error
      );
    }

    if (!nextActions.length) {
      nextActions = [...this.fallbackActions];
    }

    container.innerHTML = `
      <section class="module-page">

        ${
          W
            ? W.hero({
                kicker: "Biometric Automation · Workflow Engine",
                title: "مركز أتمتة العمليات البيومترية",
                description:
                  "إدارة سير العمل المؤسسي للحالات والأنظمة البيومترية من التسجيل والمطابقة إلى الحوكمة، المراجعة البشرية، التصعيد، ومراقبة الأداء التشغيلي.",
                chips: [
                  "⚙️ Workflow Engine",
                  `🔁 ${this.workflows.length} Workflows`,
                  `✅ ${activeWorkflows} نشطة`,
                  `📊 ${avgAutomation}% أتمتة`
                ]
              })
            : this.fallbackHero()
        }

        <div class="module-grid">
          ${this.kpi(
            "إجمالي Workflows",
            this.workflows.length,
            "Biometric Flows"
          )}

          ${this.kpi(
            "المسارات النشطة",
            activeWorkflows,
            "Active Workflows"
          )}

          ${this.kpi(
            "Event Triggers",
            this.triggers.length,
            "Operational Events"
          )}

          ${this.kpi(
            "طلبات الاعتماد",
            this.approvals.length,
            "Approval Queue"
          )}

          ${this.kpi(
            "اعتمادات عالية الخطورة",
            highApprovals,
            "High Risk"
          )}

          ${this.kpi(
            "متوسط الأتمتة",
            `${avgAutomation}%`,
            "Automation Level"
          )}
        </div>

        <div class="module-wide-grid">

          <div class="module-panel">
            ${this.sectionTitle(
              "الخلاصة التشغيلية",
              "كيف تربط الأتمتة الحالات البيومترية بالأنظمة والحوكمة والقرارات التشغيلية."
            )}

            <div class="automation-summary-card">
              <strong>
                الأتمتة تربط التسجيل والمطابقة والجودة والمخاطر ضمن مسار تشغيلي موحد
              </strong>

              <p>
                كل حالة بيومترية يجب أن تمر عبر Workflow واضح يحدد
                المسؤول عن المراجعة، مستوى الخطورة، الإجراء المطلوب،
                وقت التصعيد، وحالة الإغلاق، مع الحفاظ على المراجعة
                البشرية للقرارات الحساسة.
              </p>

              <div class="automation-summary-strip">
                <div>
                  <span>Total</span>
                  <b>${stats.total}</b>
                </div>

                <div>
                  <span>Active</span>
                  <b>${stats.active}</b>
                </div>

                <div>
                  <span>Waiting</span>
                  <b>${stats.waiting}</b>
                </div>

                <div>
                  <span>Level</span>
                  <b>${avgAutomation}%</b>
                </div>
              </div>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Biometric Automation Model",
              "نموذج تشغيل الأتمتة داخل منصة الذكاء البيومتري."
            )}

            <div class="automation-model">
              <div>
                <b>1</b>
                <span>Biometric Event</span>
              </div>

              <div>
                <b>2</b>
                <span>Quality & Risk Rule</span>
              </div>

              <div>
                <b>3</b>
                <span>Human Review</span>
              </div>

              <div>
                <b>4</b>
                <span>Action & Escalation</span>
              </div>

              <div>
                <b>5</b>
                <span>Monitoring Update</span>
              </div>
            </div>
          </div>

        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "Biometric Workflow Portfolio",
            "مسارات العمل الرئيسية لإدارة العمليات والحالات البيومترية."
          )}

          <div class="automation-workflow-grid">
            ${this.workflows
              .map(workflow => this.workflowCard(workflow))
              .join("")}
          </div>
        </div>

        <div class="module-wide-grid">

          <div class="module-panel">
            ${this.sectionTitle(
              "Biometric Event Triggers",
              "الأحداث التشغيلية التي تشغل الأتمتة داخل المنصة."
            )}

            <div class="automation-trigger-list">
              ${this.triggers
                .map(
                  (trigger, index) => `
                    <div>
                      <b>${String(index + 1).padStart(2, "0")}</b>

                      <strong>${trigger[0]}</strong>

                      <span>${trigger[1]}</span>

                      <p>${trigger[2]}</p>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Biometric Approval Queue",
              "الطلبات التي تحتاج مراجعة بشرية أو اعتماداً تنفيذياً."
            )}

            <div class="automation-approval-list">
              ${this.approvals
                .map(
                  (approval, index) => `
                    <div>
                      <b>${String(index + 1).padStart(2, "0")}</b>

                      <div>
                        <strong>${approval[0]}</strong>
                        <span>${approval[1]}</span>
                        <small>${approval[2]}</small>
                      </div>

                      <em class="${this.riskClass(approval[3])}">
                        ${approval[3]}
                      </em>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>

        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "Biometric Automation Roadmap",
            "تطوير التشغيل البيومتري من الإجراءات اليدوية إلى الأتمتة الذكية بإشراف بشري."
          )}

          <div class="automation-roadmap">
            <div>
              <b>1</b>
              <strong>Manual Review</strong>
              <span>
                توحيد خطوات مراجعة الحالات وتحديد المسؤوليات.
              </span>
            </div>

            <div>
              <b>2</b>
              <strong>Assisted Workflow</strong>
              <span>
                تنبيهات وتوجيه تلقائي للحالات حسب النوع.
              </span>
            </div>

            <div>
              <b>3</b>
              <strong>Rule-Based Operations</strong>
              <span>
                تشغيل الإجراءات حسب الجودة والمخاطر ودرجة الثقة.
              </span>
            </div>

            <div>
              <b>4</b>
              <strong>AI Assisted Review</strong>
              <span>
                تحليل الحالات وتقديم توصيات للمراجع البشري.
              </span>
            </div>

            <div>
              <b>5</b>
              <strong>Human-Governed Automation</strong>
              <span>
                تشغيل ذكي متقدم مع رقابة واعتماد بشري دائم.
              </span>
            </div>
          </div>
        </div>

        <div class="module-wide-grid">

          <div class="module-panel">
            ${this.sectionTitle(
              "Next Best Actions",
              "أهم الإجراءات التشغيلية المقترحة لتحسين أداء الأنظمة البيومترية."
            )}

            <div class="executive-list">
              ${nextActions
                .slice(0, 6)
                .map(
                  (item, index) => `
                    <div class="executive-item">
                      <strong>
                        ${String(index + 1).padStart(2, "0")}
                      </strong>

                      <span>${this.actionText(item)}</span>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Biometric Automation Engine Status",
              "الحالة التقنية لمحرك أتمتة العمليات البيومترية."
            )}

            <div class="automation-engine-status">
              <strong>AIW Biometric Automation Engine</strong>

              <p>
                المحرك مفعّل لمراقبة أحداث التسجيل والمطابقة والجودة
                وصحة الأنظمة والمخاطر، مع دعم التنبيهات والتصعيد
                والمراجعة البشرية.
              </p>

              <div class="aiw-progress">
                <div style="width:${this.clamp(avgAutomation, 0, 100)}%">
                </div>
              </div>

              <small>
                Current biometric automation capability:
                ${avgAutomation}%
              </small>
            </div>
          </div>

        </div>

      </section>
    `;
  },

  workflowCard(workflow) {
    const automationLevel = this.clamp(
      Number(workflow.automation || 0),
      0,
      100
    );

    return `
      <article class="automation-workflow-card">

        <div class="automation-workflow-head">
          <div>${workflow.icon}</div>

          <span class="aiw-status ${this.statusClass(workflow.status)}">
            ${workflow.status}
          </span>
        </div>

        <h3>${workflow.title}</h3>

        <p>${workflow.trigger}</p>

        <div class="automation-steps">
          ${workflow.steps
            .map(
              (step, index) => `
                <span>${index + 1}. ${step}</span>
              `
            )
            .join("")}
        </div>

        <div class="automation-meta">
          <span>المالك: ${workflow.owner}</span>
          <span>${automationLevel}% أتمتة</span>
        </div>

        <div class="aiw-progress">
          <div style="width:${automationLevel}%"></div>
        </div>

      </article>
    `;
  },

  average(values) {
    if (!Array.isArray(values) || !values.length) return 0;

    const validValues = values
      .map(value => Number(value))
      .filter(value => Number.isFinite(value));

    if (!validValues.length) return 0;

    const total = validValues.reduce(
      (sum, value) => sum + value,
      0
    );

    return Math.round(total / validValues.length);
  },

  clamp(value, min, max) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) return min;

    return Math.min(max, Math.max(min, numericValue));
  },

  statusClass(status) {
    const normalizedStatus = String(status || "").trim();

    if (normalizedStatus === "نشط") {
      return "green";
    }

    if (
      normalizedStatus === "قيد التفعيل" ||
      normalizedStatus === "قيد المراجعة"
    ) {
      return "orange";
    }

    if (
      normalizedStatus === "مخطط" ||
      normalizedStatus === "مسودة"
    ) {
      return "blue";
    }

    if (
      normalizedStatus === "متوقف" ||
      normalizedStatus === "متعثر"
    ) {
      return "red";
    }

    return "blue";
  },

  riskClass(level) {
    const normalizedLevel = String(level || "").trim();

    if (normalizedLevel.includes("عال")) {
      return "red";
    }

    if (normalizedLevel.includes("متوسط")) {
      return "orange";
    }

    return "green";
  },

  actionText(item) {
    if (typeof item === "string") {
      return item;
    }

    if (item && typeof item === "object") {
      return (
        item.title ||
        item.action ||
        item.text ||
        item.recommendation ||
        "مراجعة الإجراء التشغيلي المقترح."
      );
    }

    return "مراجعة الإجراء التشغيلي المقترح.";
  },

  kpi(label, value, note) {
    if (window.AIW?.Widgets?.kpi) {
      return AIW.Widgets.kpi({
        label,
        value,
        note
      });
    }

    return `
      <div class="module-card">
        <span>${label}</span>
        <strong>${value}</strong>
        <small>${note}</small>
      </div>
    `;
  },

  sectionTitle(title, description) {
    if (window.AIW?.Widgets?.sectionTitle) {
      return AIW.Widgets.sectionTitle(
        title,
        description
      );
    }

    return `
      <div class="module-section-title compact">
        <h2>${title}</h2>
        <p>${description}</p>
      </div>
    `;
  },

  fallbackHero() {
    return `
      <div class="module-hero">
        <span class="module-kicker">
          Biometric Automation · Workflow Engine
        </span>

        <h1>مركز أتمتة العمليات البيومترية</h1>

        <p>
          إدارة سير العمل للحالات والأنظمة البيومترية من التسجيل
          والمطابقة إلى المراجعة والتصعيد والمراقبة التشغيلية.
        </p>
      </div>
    `;
  }
};