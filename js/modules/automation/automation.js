/* =========================================================
   AI Work - Biometric Operations Automation Center V2.1
   Workflow + Triggers + Approvals + Monitoring

   Updates:
   - Central AIW.Store integration
   - Persistent workflow data
   - Dynamic workflow statistics
   - Governance and risk integration
   - KPI and decision synchronization
   - Approval queue management
   - CRUD-ready automation workflows
   - Human-in-the-Loop enforcement
   - No UI design changes
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.automation = {
  id: "automation",
  title: "الأتمتة",
  icon: "⚙️",

  _container: null,
  _syncBound: false,
  _seedChecked: false,

  /* =======================================================
     Default Workflows
  ======================================================= */

  defaultWorkflows: [
    {
      id: 1,
      icon: "🪪",
      title: "معالجة حالة تسجيل بيومتري",
      trigger: "عند إنشاء حالة تسجيل جديدة",
      triggerCode: "BIOMETRIC_CASE_CREATED",
      steps: [
        "استقبال الحالة",
        "فحص اكتمال البيانات",
        "تقييم جودة العينة",
        "تحديد سبب التعثر",
        "إحالة الحالة للمعالجة"
      ],
      owner: "فريق العمليات البيومترية",
      status: "نشط",
      automation: 82,
      humanApprovalRequired: true,
      riskLevel: "متوسط",
      linkedModules: [
        "kpis",
        "governance",
        "reports"
      ]
    },
    {
      id: 2,
      icon: "🔍",
      title: "مراجعة فشل المطابقة",
      trigger: "عند انخفاض نتيجة المطابقة عن الحد المعتمد",
      triggerCode: "MATCH_FAILURE_DETECTED",
      steps: [
        "تسجيل حالة الفشل",
        "تحليل درجة الثقة",
        "مقارنة العينات",
        "تحديد سبب الفشل",
        "رفع التوصية للمراجع"
      ],
      owner: "فريق المطابقة والتحقق",
      status: "نشط",
      automation: 76,
      humanApprovalRequired: true,
      riskLevel: "متوسط",
      linkedModules: [
        "governance",
        "decision",
        "reports"
      ]
    },
    {
      id: 3,
      icon: "📉",
      title: "معالجة انخفاض جودة العينة",
      trigger: "عند تجاوز نسبة العينات منخفضة الجودة الحد التشغيلي",
      triggerCode: "QUALITY_THRESHOLD_BREACHED",
      steps: [
        "قراءة مؤشر الجودة",
        "تحديد الجهاز أو الموقع",
        "تحليل نمط التكرار",
        "إرسال تنبيه تشغيلي",
        "متابعة الإجراء التصحيحي"
      ],
      owner: "فريق جودة البيانات البيومترية",
      status: "نشط",
      automation: 74,
      humanApprovalRequired: false,
      riskLevel: "متوسط",
      linkedModules: [
        "kpis",
        "projects",
        "reports"
      ]
    },
    {
      id: 4,
      icon: "🛡️",
      title: "مراجعة مخاطر البيانات البيومترية",
      trigger: "قبل استخدام بيانات حساسة أو إطلاق تحسين جديد",
      triggerCode: "PRIVACY_REVIEW_REQUIRED",
      steps: [
        "تصنيف البيانات",
        "تقييم الخصوصية",
        "مراجعة الصلاحيات",
        "تقييم الأمن",
        "اعتماد الاستخدام"
      ],
      owner: "حوكمة البيانات والخصوصية",
      status: "قيد التفعيل",
      automation: 66,
      humanApprovalRequired: true,
      riskLevel: "عالٍ",
      linkedModules: [
        "governance",
        "decision",
        "business"
      ]
    },
    {
      id: 5,
      icon: "🧠",
      title: "اعتماد تحسين خوارزمية المطابقة",
      trigger: "عند اقتراح تعديل الخوارزمية أو Threshold",
      triggerCode: "ALGORITHM_CHANGE_REQUESTED",
      steps: [
        "تسجيل طلب التغيير",
        "تحليل الأثر",
        "اختبار النتائج",
        "مراجعة الحوكمة",
        "اعتماد النشر"
      ],
      owner: "لجنة الأنظمة البيومترية",
      status: "قيد التفعيل",
      automation: 58,
      humanApprovalRequired: true,
      riskLevel: "عالٍ",
      linkedModules: [
        "governance",
        "decision",
        "maturity"
      ]
    },
    {
      id: 6,
      icon: "📡",
      title: "مراقبة صحة الأنظمة البيومترية",
      trigger: "عند تغير حالة النظام أو التكامل",
      triggerCode: "SYSTEM_HEALTH_CHANGED",
      steps: [
        "قراءة حالة الأنظمة",
        "تحديد مصدر الخلل",
        "تصنيف شدة التأثير",
        "إشعار فريق الدعم",
        "تحديث سجل الحالة"
      ],
      owner: "فريق المنصة والتكامل",
      status: "نشط",
      automation: 86,
      humanApprovalRequired: false,
      riskLevel: "متوسط",
      linkedModules: [
        "dashboard",
        "kpis",
        "notifications"
      ]
    },
    {
      id: 7,
      icon: "🚨",
      title: "تصعيد الحالات عالية الخطورة",
      trigger: "عند تسجيل حالة بيومترية عالية الخطورة",
      triggerCode: "HIGH_RISK_CASE",
      steps: [
        "تحديد الحالة",
        "تقييم الأثر",
        "إشعار مالك الحالة",
        "تصعيد للجنة المختصة",
        "متابعة الإغلاق"
      ],
      owner: "مالك المخاطر البيومترية",
      status: "نشط",
      automation: 84,
      humanApprovalRequired: true,
      riskLevel: "عالٍ",
      linkedModules: [
        "governance",
        "decision",
        "notifications"
      ]
    },
    {
      id: 8,
      icon: "📊",
      title: "إصدار تقرير العمليات البيومترية",
      trigger: "نهاية كل فترة تشغيلية",
      triggerCode: "BIOMETRIC_REPORTING_PERIOD_END",
      steps: [
        "جمع المؤشرات",
        "تحليل حالات الفشل",
        "تحليل جودة العينات",
        "توليد التوصيات",
        "إصدار التقرير التنفيذي"
      ],
      owner: "مكتب الذكاء البيومتري",
      status: "مخطط",
      automation: 48,
      humanApprovalRequired: false,
      riskLevel: "منخفض",
      linkedModules: [
        "reports",
        "kpis",
        "decision"
      ]
    }
  ],

  defaultTriggers: [
    {
      id: 1,
      code: "BIOMETRIC_CASE_CREATED",
      title: "إنشاء حالة بيومترية",
      action: "تشغيل Workflow فحص ومعالجة الحالة الجديدة",
      status: "active"
    },
    {
      id: 2,
      code: "MATCH_FAILURE_DETECTED",
      title: "اكتشاف فشل مطابقة",
      action: "تحليل درجة الثقة وإحالة الحالة للمراجعة",
      status: "active"
    },
    {
      id: 3,
      code: "QUALITY_THRESHOLD_BREACHED",
      title: "انخفاض جودة العينة",
      action: "تحديد مصدر المشكلة وإرسال تنبيه تشغيلي",
      status: "active"
    },
    {
      id: 4,
      code: "SYSTEM_HEALTH_CHANGED",
      title: "تغير صحة النظام",
      action: "تحديث مؤشرات صحة الأنظمة وفتح حالة دعم",
      status: "active"
    },
    {
      id: 5,
      code: "HIGH_RISK_CASE",
      title: "حالة عالية الخطورة",
      action: "تصعيد تلقائي لمالك الخطر واللجنة المختصة",
      status: "active"
    },
    {
      id: 6,
      code: "PRIVACY_REVIEW_REQUIRED",
      title: "طلب مراجعة خصوصية",
      action: "بدء مراجعة استخدام البيانات والصلاحيات",
      status: "active"
    },
    {
      id: 7,
      code: "ALGORITHM_CHANGE_REQUESTED",
      title: "طلب تغيير خوارزمية",
      action: "تشغيل مسار الاختبار والمراجعة والاعتماد",
      status: "active"
    },
    {
      id: 8,
      code: "BIOMETRIC_DATA_CHANGED",
      title: "تحديث بيانات العمليات",
      action: "تحديث المؤشرات والتقارير التنفيذية تلقائياً",
      status: "active"
    }
  ],

  defaultApprovals: [
    {
      id: 1,
      title: "حالة تسجيل بيومتري استثنائية",
      owner: "مشرف العمليات البيومترية",
      status: "قيد المراجعة",
      risk: "متوسط",
      source: "workflow",
      sourceId: 1
    },
    {
      id: 2,
      title: "نتيجة مطابقة منخفضة الثقة",
      owner: "فريق المطابقة والتحقق",
      status: "تتطلب تحققاً بشرياً",
      risk: "متوسط",
      source: "workflow",
      sourceId: 2
    },
    {
      id: 3,
      title: "تعديل Threshold المطابقة",
      owner: "لجنة الأنظمة البيومترية",
      status: "يتطلب قراراً",
      risk: "عالٍ",
      source: "workflow",
      sourceId: 5
    },
    {
      id: 4,
      title: "الوصول إلى بيانات بيومترية حساسة",
      owner: "فريق الخصوصية",
      status: "يتطلب مراجعة",
      risk: "عالٍ",
      source: "governance",
      sourceId: 2
    },
    {
      id: 5,
      title: "إطلاق تحسين في البيئة التشغيلية",
      owner: "مدير المنصة",
      status: "جاهز للاعتماد",
      risk: "متوسط",
      source: "project",
      sourceId: null
    },
    {
      id: 6,
      title: "إغلاق حالة عالية الخطورة",
      owner: "مالك المخاطر البيومترية",
      status: "بانتظار التحقق",
      risk: "عالٍ",
      source: "risk",
      sourceId: null
    }
  ],

  defaultRoadmap: [
    {
      id: 1,
      title: "Manual Review",
      desc: "توحيد خطوات مراجعة الحالات وتحديد المسؤوليات."
    },
    {
      id: 2,
      title: "Assisted Workflow",
      desc: "تنبيهات وتوجيه تلقائي للحالات حسب النوع."
    },
    {
      id: 3,
      title: "Rule-Based Operations",
      desc: "تشغيل الإجراءات حسب الجودة والمخاطر ودرجة الثقة."
    },
    {
      id: 4,
      title: "AI Assisted Review",
      desc: "تحليل الحالات وتقديم توصيات للمراجع البشري."
    },
    {
      id: 5,
      title: "Human-Governed Automation",
      desc: "تشغيل ذكي متقدم مع رقابة واعتماد بشري دائم."
    }
  ],

  fallbackActions: [
    "مراجعة الحالات البيومترية ذات درجات الثقة المنخفضة.",
    "تحليل المواقع التي تسجل أعلى نسبة عينات منخفضة الجودة.",
    "تفعيل التنبيه التلقائي عند تراجع صحة أي نظام بيومتري.",
    "إغلاق الحالات عالية الخطورة التي تجاوزت مدة المعالجة.",
    "مراجعة صلاحيات الوصول إلى البيانات البيومترية الحساسة."
  ],

  /* =======================================================
     Shared Data Reader
  ======================================================= */

  getSharedData() {
    try {
      if (
        window.AIW?.Store &&
        typeof window.AIW.Store.getState === "function"
      ) {
        return window.AIW.Store.getState() || {};
      }

      if (
        window.AIW?.Store &&
        typeof window.AIW.Store.getData === "function"
      ) {
        return window.AIW.Store.getData() || {};
      }

      return window.AIW?.Data || {};
    } catch (error) {
      console.warn(
        "AI Work Automation: Unable to read shared data.",
        error
      );

      return window.AIW?.Data || {};
    }
  },

  /* =======================================================
     Automation Center Initialization
  ======================================================= */

  ensureAutomationSeeded() {
    if (this._seedChecked) return;

    this._seedChecked = true;

    const data = this.getSharedData();

    const exists =
      data.automationCenter &&
      typeof data.automationCenter === "object" &&
      Array.isArray(data.automationCenter.workflows);

    if (exists) return;

    const now = new Date().toISOString();

    const automationCenter = {
      workflows: this.clone(this.defaultWorkflows),
      triggers: this.clone(this.defaultTriggers),
      approvals: this.clone(this.defaultApprovals),
      roadmap: this.clone(this.defaultRoadmap),

      settings: {
        engineEnabled: true,
        humanApprovalRequired: true,
        automaticEscalation: true,
        monitoringEnabled: true,
        reportingCycle: "شهري",
        minimumAutomationLevel: 60
      },

      statistics: {
        completed: 0,
        failed: 0,
        running: 0,
        lastRunAt: null
      },

      meta: {
        createdAt: now,
        updatedAt: now
      }
    };

    if (
      window.AIW?.Store &&
      typeof window.AIW.Store.update === "function"
    ) {
      window.AIW.Store.update(
        "automationCenter",
        automationCenter,
        {
          event: "aiw:automationUpdated"
        }
      );

      return;
    }

    if (window.AIW?.Data) {
      window.AIW.Data.automationCenter =
        automationCenter;
    }
  },

  getAutomationCenter() {
    const data = this.getSharedData();

    const source =
      data.automationCenter &&
      typeof data.automationCenter === "object"
        ? data.automationCenter
        : {};

    return {
      workflows: Array.isArray(source.workflows)
        ? source.workflows
            .map((workflow, index) =>
              this.normalizeWorkflow(workflow, index)
            )
            .filter(Boolean)
        : this.clone(this.defaultWorkflows),

      triggers: Array.isArray(source.triggers)
        ? source.triggers
            .map((trigger, index) =>
              this.normalizeTrigger(trigger, index)
            )
            .filter(Boolean)
        : this.clone(this.defaultTriggers),

      approvals: Array.isArray(source.approvals)
        ? source.approvals
            .map((approval, index) =>
              this.normalizeApproval(approval, index)
            )
            .filter(Boolean)
        : this.clone(this.defaultApprovals),

      roadmap: Array.isArray(source.roadmap)
        ? source.roadmap
        : this.clone(this.defaultRoadmap),

      settings: {
        engineEnabled:
          source.settings?.engineEnabled !== false,

        humanApprovalRequired:
          source.settings?.humanApprovalRequired !== false,

        automaticEscalation:
          source.settings?.automaticEscalation !== false,

        monitoringEnabled:
          source.settings?.monitoringEnabled !== false,

        reportingCycle:
          source.settings?.reportingCycle || "شهري",

        minimumAutomationLevel:
          this.normalizePercent(
            source.settings?.minimumAutomationLevel,
            60
          )
      },

      statistics: {
        completed: this.toSafeNumber(
          source.statistics?.completed,
          0
        ),

        failed: this.toSafeNumber(
          source.statistics?.failed,
          0
        ),

        running: this.toSafeNumber(
          source.statistics?.running,
          0
        ),

        lastRunAt:
          source.statistics?.lastRunAt || null
      },

      meta: {
        createdAt: source.meta?.createdAt || null,
        updatedAt: source.meta?.updatedAt || null
      }
    };
  },

  normalizeWorkflow(workflow, index = 0) {
    if (!workflow || typeof workflow !== "object") {
      return null;
    }

    return {
      ...workflow,

      id: workflow.id ?? index + 1,

      icon: workflow.icon || "⚙️",

      title:
        workflow.title ||
        "مسار عمل غير مسمى",

      trigger:
        workflow.trigger ||
        "لا يوجد Trigger محدد",

      triggerCode:
        workflow.triggerCode ||
        "",

      steps:
        Array.isArray(workflow.steps)
          ? workflow.steps
          : [],

      owner:
        workflow.owner ||
        "غير محدد",

      status:
        workflow.status ||
        "مخطط",

      automation:
        this.normalizePercent(
          workflow.automation,
          0
        ),

      humanApprovalRequired:
        workflow.humanApprovalRequired === true,

      riskLevel:
        workflow.riskLevel ||
        "متوسط",

      linkedModules:
        Array.isArray(workflow.linkedModules)
          ? workflow.linkedModules
          : []
    };
  },

  normalizeTrigger(trigger, index = 0) {
    if (Array.isArray(trigger)) {
      return {
        id: index + 1,
        code: trigger[0] || "",
        title: trigger[1] || "",
        action: trigger[2] || "",
        status: "active"
      };
    }

    if (!trigger || typeof trigger !== "object") {
      return null;
    }

    return {
      id: trigger.id ?? index + 1,
      code: trigger.code || "",
      title: trigger.title || "",
      action:
        trigger.action ||
        trigger.description ||
        "",
      status: trigger.status || "active"
    };
  },

  normalizeApproval(approval, index = 0) {
    if (Array.isArray(approval)) {
      return {
        id: index + 1,
        title: approval[0] || "",
        owner: approval[1] || "",
        status: approval[2] || "",
        risk: approval[3] || "متوسط",
        source: "manual",
        sourceId: null
      };
    }

    if (!approval || typeof approval !== "object") {
      return null;
    }

    return {
      id: approval.id ?? index + 1,
      title: approval.title || "",
      owner: approval.owner || "غير محدد",
      status: approval.status || "قيد المراجعة",
      risk: approval.risk || "متوسط",
      source: approval.source || "manual",
      sourceId: approval.sourceId ?? null
    };
  },

  /* =======================================================
     Store Updates
  ======================================================= */

  updateAutomationCenter(changes = {}) {
    if (!changes || typeof changes !== "object") {
      return false;
    }

    const current = this.getAutomationCenter();

    const updated = {
      ...current,
      ...changes,

      settings: {
        ...current.settings,
        ...(changes.settings || {})
      },

      statistics: {
        ...current.statistics,
        ...(changes.statistics || {})
      },

      meta: {
        ...current.meta,
        updatedAt: new Date().toISOString()
      }
    };

    if (
      window.AIW?.Store &&
      typeof window.AIW.Store.update === "function"
    ) {
      return window.AIW.Store.update(
        "automationCenter",
        updated,
        {
          event: "aiw:automationUpdated"
        }
      );
    }

    if (window.AIW?.Data) {
      window.AIW.Data.automationCenter = updated;

      window.dispatchEvent(
        new CustomEvent("aiw:automationUpdated", {
          detail: {
            automationCenter: updated
          }
        })
      );

      return true;
    }

    return false;
  },

  addWorkflow(workflow = {}) {
    const center = this.getAutomationCenter();
    const workflows = [...center.workflows];
    const now = new Date().toISOString();

    const newWorkflow = this.normalizeWorkflow(
      {
        id: this.getNextId(workflows),
        icon: workflow.icon || "⚙️",
        title:
          workflow.title ||
          "مسار عمل جديد",
        trigger:
          workflow.trigger ||
          "عند وقوع الحدث المحدد",
        triggerCode:
          workflow.triggerCode ||
          "",
        steps:
          Array.isArray(workflow.steps)
            ? workflow.steps
            : [],
        owner:
          workflow.owner ||
          "غير محدد",
        status:
          workflow.status ||
          "مخطط",
        automation:
          workflow.automation ?? 0,
        humanApprovalRequired:
          workflow.humanApprovalRequired === true,
        riskLevel:
          workflow.riskLevel ||
          "متوسط",
        linkedModules:
          Array.isArray(workflow.linkedModules)
            ? workflow.linkedModules
            : [],
        createdAt: now,
        updatedAt: now
      },
      workflows.length
    );

    workflows.push(newWorkflow);

    this.updateAutomationCenter({
      workflows
    });

    return newWorkflow;
  },

  updateWorkflow(id, changes = {}) {
    const center = this.getAutomationCenter();

    const workflowIndex =
      center.workflows.findIndex(
        workflow =>
          String(workflow.id) === String(id)
      );

    if (workflowIndex === -1) {
      return false;
    }

    const workflows =
      center.workflows.map(
        (workflow, index) => {
          if (index !== workflowIndex) {
            return workflow;
          }

          return this.normalizeWorkflow(
            {
              ...workflow,
              ...changes,
              id: workflow.id,
              updatedAt:
                new Date().toISOString()
            },
            index
          );
        }
      );

    this.updateAutomationCenter({
      workflows
    });

    return workflows[workflowIndex];
  },

  removeWorkflow(id) {
    const center = this.getAutomationCenter();

    const removedWorkflow =
      center.workflows.find(
        workflow =>
          String(workflow.id) === String(id)
      );

    if (!removedWorkflow) {
      return false;
    }

    const workflows =
      center.workflows.filter(
        workflow =>
          String(workflow.id) !== String(id)
      );

    this.updateAutomationCenter({
      workflows
    });

    return removedWorkflow;
  },

  addApproval(approval = {}) {
    const center = this.getAutomationCenter();
    const approvals = [...center.approvals];

    const newApproval = this.normalizeApproval(
      {
        id: this.getNextId(approvals),
        title:
          approval.title ||
          "طلب اعتماد جديد",
        owner:
          approval.owner ||
          "غير محدد",
        status:
          approval.status ||
          "قيد المراجعة",
        risk:
          approval.risk ||
          "متوسط",
        source:
          approval.source ||
          "manual",
        sourceId:
          approval.sourceId ?? null,
        createdAt:
          new Date().toISOString()
      },
      approvals.length
    );

    approvals.push(newApproval);

    this.updateAutomationCenter({
      approvals
    });

    return newApproval;
  },

  updateApproval(id, changes = {}) {
    const center = this.getAutomationCenter();

    const approvalIndex =
      center.approvals.findIndex(
        approval =>
          String(approval.id) === String(id)
      );

    if (approvalIndex === -1) {
      return false;
    }

    const approvals =
      center.approvals.map(
        (approval, index) => {
          if (index !== approvalIndex) {
            return approval;
          }

          return this.normalizeApproval(
            {
              ...approval,
              ...changes,
              id: approval.id,
              updatedAt:
                new Date().toISOString()
            },
            index
          );
        }
      );

    this.updateAutomationCenter({
      approvals
    });

    return approvals[approvalIndex];
  },

  removeApproval(id) {
    const center = this.getAutomationCenter();

    const removedApproval =
      center.approvals.find(
        approval =>
          String(approval.id) === String(id)
      );

    if (!removedApproval) {
      return false;
    }

    const approvals =
      center.approvals.filter(
        approval =>
          String(approval.id) !== String(id)
      );

    this.updateAutomationCenter({
      approvals
    });

    return removedApproval;
  },

  /* =======================================================
     Dynamic Data Integration
  ======================================================= */

  getDynamicApprovals(storedApprovals) {
    const data = this.getSharedData();
    const approvals = [...storedApprovals];

    const risks =
      data.governanceCenter &&
      Array.isArray(data.governanceCenter.risks)
        ? data.governanceCenter.risks
        : [];

    risks.forEach(risk => {
      if (
        !this.isHighRisk(risk?.level) ||
        this.isClosedStatus(risk?.status)
      ) {
        return;
      }

      const alreadyExists = approvals.some(
        approval =>
          approval.source === "risk" &&
          String(approval.sourceId) ===
            String(risk.id)
      );

      if (alreadyExists) return;

      approvals.push({
        id: `risk-${risk.id}`,
        title: `مراجعة مخاطرة: ${risk.title}`,
        owner:
          risk.owner ||
          "لجنة الحوكمة",
        status: "يتطلب مراجعة",
        risk: risk.level || "عالٍ",
        source: "risk",
        sourceId: risk.id
      });
    });

    return approvals;
  },

  getStatistics(workflows, approvals, center) {
    const localStats = {
      total: workflows.length,

      active: workflows.filter(
        workflow =>
          this.isActiveWorkflow(
            workflow.status
          )
      ).length,

      completed:
        center.statistics.completed,

      waiting:
        workflows.filter(
          workflow =>
            !this.isActiveWorkflow(
              workflow.status
            )
        ).length,

      running:
        center.statistics.running,

      failed:
        center.statistics.failed,

      pendingApprovals:
        approvals.filter(
          approval =>
            !this.isClosedStatus(
              approval.status
            )
        ).length
    };

    try {
      if (
        window.AIW?.Automation &&
        typeof window.AIW.Automation.statistics ===
          "function"
      ) {
        const engineStats =
          window.AIW.Automation.statistics();

        return {
          ...localStats,

          total: this.toSafeNumber(
            engineStats?.total,
            localStats.total
          ),

          active: this.toSafeNumber(
            engineStats?.active,
            localStats.active
          ),

          completed: this.toSafeNumber(
            engineStats?.completed,
            localStats.completed
          ),

          waiting: this.toSafeNumber(
            engineStats?.waiting,
            localStats.waiting
          ),

          running: this.toSafeNumber(
            engineStats?.running,
            localStats.running
          ),

          failed: this.toSafeNumber(
            engineStats?.failed,
            localStats.failed
          )
        };
      }
    } catch (error) {
      console.warn(
        "AI Work Automation: Engine statistics unavailable.",
        error
      );
    }

    return localStats;
  },

  getNextActions(context) {
    try {
      if (
        window.AIW?.Recommendation &&
        typeof window.AIW.Recommendation.nextActions ===
          "function"
      ) {
        const actions =
          window.AIW.Recommendation.nextActions(
            context
          );

        if (
          Array.isArray(actions) &&
          actions.length
        ) {
          return actions.filter(Boolean);
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Automation: Recommendation engine unavailable.",
        error
      );
    }

    const actions = [];

    if (context.highApprovals > 0) {
      actions.push(
        `مراجعة ${context.highApprovals} طلبات اعتماد عالية الخطورة قبل أي تنفيذ تلقائي.`
      );
    }

    if (
      context.avgAutomation <
      context.minimumAutomationLevel
    ) {
      actions.push(
        "رفع مستوى أتمتة المسارات المخططة وقيد التفعيل إلى الحد التشغيلي المطلوب."
      );
    }

    if (context.waitingWorkflows > 0) {
      actions.push(
        `تحديد متطلبات تفعيل ${context.waitingWorkflows} مسارات غير نشطة.`
      );
    }

    this.fallbackActions.forEach(action => {
      if (actions.length < 6) {
        actions.push(action);
      }
    });

    return actions.slice(0, 6);
  },

  /* =======================================================
     Main Render
  ======================================================= */

  render(container) {
    if (!container) return;

    this._container = container;

    this.ensureAutomationSeeded();

    const W = window.AIW?.Widgets;

    const center =
      this.getAutomationCenter();

    const workflows =
      center.workflows.filter(
        workflow =>
          this.isVisibleStatus(
            workflow.status
          )
      );

    const triggers =
      center.triggers.filter(
        trigger =>
          this.isEnabledStatus(
            trigger.status
          )
      );

    const approvals =
      this.getDynamicApprovals(
        center.approvals
      );

    const stats =
      this.getStatistics(
        workflows,
        approvals,
        center
      );

    const avgAutomation =
      this.average(
        workflows.map(
          workflow =>
            workflow.automation
        )
      );

    const activeWorkflows =
      workflows.filter(
        workflow =>
          this.isActiveWorkflow(
            workflow.status
          )
      ).length;

    const highApprovals =
      approvals.filter(
        approval =>
          this.isHighRisk(
            approval.risk
          ) &&
          !this.isClosedStatus(
            approval.status
          )
      ).length;

    const nextActions =
      this.getNextActions({
        workflows,
        approvals,
        stats,
        avgAutomation,
        highApprovals,
        waitingWorkflows:
          stats.waiting,
        minimumAutomationLevel:
          center.settings
            .minimumAutomationLevel
      });

    container.innerHTML = `
      <section class="module-page">

        ${
          W?.hero
            ? W.hero({
                kicker:
                  "Biometric Automation · Workflow Engine",

                title:
                  "مركز أتمتة العمليات البيومترية",

                description:
                  "إدارة سير العمل المؤسسي للحالات والأنظمة البيومترية من التسجيل والمطابقة إلى الحوكمة، المراجعة البشرية، التصعيد، ومراقبة الأداء التشغيلي.",

                chips: [
                  "⚙️ Workflow Engine",
                  `🔁 ${workflows.length} Workflows`,
                  `✅ ${activeWorkflows} نشطة`,
                  `📊 ${avgAutomation}% أتمتة`
                ]
              })
            : this.fallbackHero()
        }

        <div class="module-grid">
          ${this.kpi(
            "إجمالي Workflows",
            workflows.length,
            "Biometric Flows"
          )}

          ${this.kpi(
            "المسارات النشطة",
            activeWorkflows,
            "Active Workflows"
          )}

          ${this.kpi(
            "Event Triggers",
            triggers.length,
            "Operational Events"
          )}

          ${this.kpi(
            "طلبات الاعتماد",
            approvals.length,
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

          ${
            workflows.length
              ? `
                <div class="automation-workflow-grid">
                  ${workflows
                    .map(workflow =>
                      this.workflowCard(workflow)
                    )
                    .join("")}
                </div>
              `
              : this.emptyState(
                  "لا توجد مسارات أتمتة مسجلة حالياً."
                )
          }
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "Biometric Event Triggers",
              "الأحداث التشغيلية التي تشغل الأتمتة داخل المنصة."
            )}

            ${
              triggers.length
                ? `
                  <div class="automation-trigger-list">
                    ${triggers
                      .map(
                        (trigger, index) => `
                          <div>
                            <b>
                              ${String(
                                index + 1
                              ).padStart(2, "0")}
                            </b>

                            <strong>
                              ${this.escapeHtml(
                                trigger.code
                              )}
                            </strong>

                            <span>
                              ${this.escapeHtml(
                                trigger.title
                              )}
                            </span>

                            <p>
                              ${this.escapeHtml(
                                trigger.action
                              )}
                            </p>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                `
                : this.emptyState(
                    "لا توجد Event Triggers مفعلة حالياً."
                  )
            }
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Biometric Approval Queue",
              "الطلبات التي تحتاج مراجعة بشرية أو اعتماداً تنفيذياً."
            )}

            ${
              approvals.length
                ? `
                  <div class="automation-approval-list">
                    ${approvals
                      .map(
                        (approval, index) => `
                          <div
                            data-approval-id="${this.escapeAttribute(
                              approval.id
                            )}"
                          >
                            <b>
                              ${String(
                                index + 1
                              ).padStart(2, "0")}
                            </b>

                            <div>
                              <strong>
                                ${this.escapeHtml(
                                  approval.title
                                )}
                              </strong>

                              <span>
                                ${this.escapeHtml(
                                  approval.owner
                                )}
                              </span>

                              <small>
                                ${this.escapeHtml(
                                  approval.status
                                )}
                              </small>
                            </div>

                            <em
                              class="${this.riskClass(
                                approval.risk
                              )}"
                            >
                              ${this.escapeHtml(
                                approval.risk
                              )}
                            </em>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                `
                : this.emptyState(
                    "لا توجد طلبات اعتماد معلقة حالياً."
                  )
            }
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "Biometric Automation Roadmap",
            "تطوير التشغيل البيومتري من الإجراءات اليدوية إلى الأتمتة الذكية بإشراف بشري."
          )}

          <div class="automation-roadmap">
            ${center.roadmap
              .map(
                (item, index) => `
                  <div>
                    <b>
                      ${index + 1}
                    </b>

                    <strong>
                      ${this.escapeHtml(
                        item?.title || ""
                      )}
                    </strong>

                    <span>
                      ${this.escapeHtml(
                        item?.desc ||
                        item?.description ||
                        ""
                      )}
                    </span>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "Next Best Actions",
              "أهم الإجراءات التشغيلية المقترحة لتحسين أداء الأنظمة البيومترية."
            )}

            ${this.renderExecutiveList(
              nextActions
            )}
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Biometric Automation Engine Status",
              "الحالة التقنية لمحرك أتمتة العمليات البيومترية."
            )}

            <div class="automation-engine-status">
              <strong>
                AIW Biometric Automation Engine
              </strong>

              <p>
                المحرك
                ${
                  center.settings.engineEnabled
                    ? "مفعّل"
                    : "غير مفعّل"
                }
                لمراقبة أحداث التسجيل والمطابقة والجودة
                وصحة الأنظمة والمخاطر، مع دعم التنبيهات والتصعيد
                والمراجعة البشرية.
              </p>

              <div class="aiw-progress">
                <div
                  style="width:${this.clamp(
                    avgAutomation,
                    0,
                    100
                  )}%"
                ></div>
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

    this.bindAutomaticSync();
  },

  /* =======================================================
     Workflow Card
  ======================================================= */

  workflowCard(workflow) {
    const automationLevel =
      this.clamp(
        workflow.automation,
        0,
        100
      );

    return `
      <article
        class="automation-workflow-card"
        data-workflow-id="${this.escapeAttribute(
          workflow.id
        )}"
      >
        <div class="automation-workflow-head">
          <div>
            ${this.escapeHtml(
              workflow.icon
            )}
          </div>

          <span
            class="aiw-status ${this.statusClass(
              workflow.status
            )}"
          >
            ${this.escapeHtml(
              workflow.status
            )}
          </span>
        </div>

        <h3>
          ${this.escapeHtml(
            workflow.title
          )}
        </h3>

        <p>
          ${this.escapeHtml(
            workflow.trigger
          )}
        </p>

        <div class="automation-steps">
          ${workflow.steps
            .map(
              (step, index) => `
                <span>
                  ${index + 1}.
                  ${this.escapeHtml(step)}
                </span>
              `
            )
            .join("")}
        </div>

        <div class="automation-meta">
          <span>
            المالك:
            ${this.escapeHtml(
              workflow.owner
            )}
          </span>

          <span>
            ${automationLevel}%
            أتمتة
          </span>
        </div>

        <div class="aiw-progress">
          <div
            style="width:${automationLevel}%"
          ></div>
        </div>
      </article>
    `;
  },

  /* =======================================================
     Shared UI
  ======================================================= */

  renderExecutiveList(items = []) {
    if (
      !Array.isArray(items) ||
      !items.length
    ) {
      return this.emptyState(
        "لا توجد إجراءات مقترحة حالياً."
      );
    }

    return `
      <div class="executive-list">
        ${items
          .slice(0, 6)
          .map(
            (item, index) => `
              <div class="executive-item">
                <strong>
                  ${String(
                    index + 1
                  ).padStart(2, "0")}
                </strong>

                <span>
                  ${this.escapeHtml(
                    this.actionText(item)
                  )}
                </span>
              </div>
            `
          )
          .join("")}
      </div>
    `;
  },

  kpi(label, value, note) {
    if (
      window.AIW?.Widgets &&
      typeof window.AIW.Widgets.kpi ===
        "function"
    ) {
      return window.AIW.Widgets.kpi({
        label,
        value,
        note
      });
    }

    return `
      <div class="module-card">
        <span>
          ${this.escapeHtml(label)}
        </span>

        <strong>
          ${this.escapeHtml(value)}
        </strong>

        <small>
          ${this.escapeHtml(note)}
        </small>
      </div>
    `;
  },

  sectionTitle(title, description) {
    if (
      window.AIW?.Widgets &&
      typeof window.AIW.Widgets.sectionTitle ===
        "function"
    ) {
      return window.AIW.Widgets.sectionTitle(
        title,
        description
      );
    }

    return `
      <div class="module-section-title compact">
        <h2>
          ${this.escapeHtml(title)}
        </h2>

        <p>
          ${this.escapeHtml(description)}
        </p>
      </div>
    `;
  },

  fallbackHero() {
    return `
      <div class="module-hero">
        <span class="module-kicker">
          Biometric Automation · Workflow Engine
        </span>

        <h1>
          مركز أتمتة العمليات البيومترية
        </h1>

        <p>
          إدارة سير العمل للحالات والأنظمة البيومترية من التسجيل
          والمطابقة إلى المراجعة والتصعيد والمراقبة التشغيلية.
        </p>
      </div>
    `;
  },

  emptyState(message) {
    return `
      <div class="module-empty">
        ${this.escapeHtml(message)}
      </div>
    `;
  },

  /* =======================================================
     Status Helpers
  ======================================================= */

  statusClass(status) {
    const normalized =
      String(status || "").trim();

    if (normalized === "نشط") {
      return "green";
    }

    if (
      normalized === "قيد التفعيل" ||
      normalized === "قيد المراجعة"
    ) {
      return "orange";
    }

    if (
      normalized === "متوقف" ||
      normalized === "متعثر"
    ) {
      return "red";
    }

    return "blue";
  },

  riskClass(level) {
    if (this.isHighRisk(level)) {
      return "red";
    }

    const value =
      String(level || "")
        .trim()
        .toLowerCase();

    if (
      value.includes("متوسط") ||
      value === "medium"
    ) {
      return "orange";
    }

    return "green";
  },

  isHighRisk(level) {
    const value =
      String(level || "")
        .trim()
        .toLowerCase();

    return (
      value.includes("عال") ||
      value === "high" ||
      value === "critical" ||
      value === "حرج"
    );
  },

  isClosedStatus(status) {
    const value =
      String(status || "")
        .trim()
        .toLowerCase();

    return [
      "closed",
      "resolved",
      "completed",
      "approved",
      "مغلق",
      "تم الحل",
      "مكتمل",
      "معتمد"
    ].includes(value);
  },

  isActiveWorkflow(status) {
    const value =
      String(status || "")
        .trim()
        .toLowerCase();

    return (
      value === "نشط" ||
      value === "active" ||
      value === "running"
    );
  },

  isVisibleStatus(status) {
    const value =
      String(status || "")
        .trim()
        .toLowerCase();

    return ![
      "archived",
      "deleted",
      "مؤرشف",
      "محذوف"
    ].includes(value);
  },

  isEnabledStatus(status) {
    const value =
      String(status || "")
        .trim()
        .toLowerCase();

    return ![
      "inactive",
      "disabled",
      "archived",
      "موقوف",
      "غير مفعل",
      "مؤرشف"
    ].includes(value);
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

  /* =======================================================
     Automatic Synchronization
  ======================================================= */

  bindAutomaticSync() {
    if (this._syncBound) return;

    this._syncBound = true;

    const refreshAutomation = () => {
      if (
        !this._container ||
        !this._container.isConnected
      ) {
        return;
      }

      this.render(this._container);
    };

    const syncEvents = [
      "aiw:dataChanged",
      "aiw:dataUpdated",
      "aiw:dataImported",
      "aiw:dataRestored",
      "aiw:dataReset",
      "aiw:storeChanged",

      "aiw:automationChanged",
      "aiw:automationUpdated",

      "aiw:projectsChanged",
      "aiw:projectsUpdated",

      "aiw:kpisChanged",
      "aiw:kpisUpdated",

      "aiw:governanceChanged",
      "aiw:governanceUpdated",

      "aiw:decisionChanged",
      "aiw:decisionUpdated",

      "aiw:risksChanged",
      "aiw:risksUpdated",

      "aiw:alertsChanged",
      "aiw:alertsUpdated",

      "aiw:reportsChanged",
      "aiw:reportsUpdated"
    ];

    syncEvents.forEach(eventName => {
      window.addEventListener(
        eventName,
        refreshAutomation
      );
    });

    window.addEventListener(
      "storage",
      event => {
        const supportedKeys = [
          "aiwDataV1",
          "aiwData",
          "AIW_DATA"
        ];

        if (
          !event.key ||
          supportedKeys.includes(event.key)
        ) {
          refreshAutomation();
        }
      }
    );
  },

  /* =======================================================
     Utilities
  ======================================================= */

  average(values) {
    if (
      !Array.isArray(values) ||
      !values.length
    ) {
      return 0;
    }

    const validValues = values
      .map(value => Number(value))
      .filter(value =>
        Number.isFinite(value)
      );

    if (!validValues.length) {
      return 0;
    }

    return Math.round(
      validValues.reduce(
        (total, value) =>
          total + value,
        0
      ) / validValues.length
    );
  },

  clamp(value, min, max) {
    const numericValue =
      Number(value);

    if (!Number.isFinite(numericValue)) {
      return min;
    }

    return Math.min(
      max,
      Math.max(min, numericValue)
    );
  },

  getNextId(items = []) {
    if (!Array.isArray(items)) {
      return 1;
    }

    const ids = items
      .map(item =>
        this.toSafeNumber(
          item?.id,
          0
        )
      )
      .filter(id => id > 0);

    return ids.length
      ? Math.max(...ids) + 1
      : 1;
  },

  toSafeNumber(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;
  },

  normalizePercent(value, fallback = 0) {
    return Math.min(
      100,
      Math.max(
        0,
        Math.round(
          this.toSafeNumber(
            value,
            fallback
          )
        )
      )
    );
  },

  escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  escapeAttribute(value) {
    return this.escapeHtml(value);
  },

  clone(value) {
    if (
      typeof structuredClone === "function"
    ) {
      try {
        return structuredClone(value);
      } catch (error) {
        // JSON fallback below.
      }
    }

    return JSON.parse(
      JSON.stringify(value)
    );
  }
};