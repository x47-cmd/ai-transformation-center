/* =========================================================
   AI Work - Business Case Center V2.1
   Enterprise Biometric AI Feasibility Center

   Updates:
   - Enterprise Biometric Intelligence scope
   - Central AIW.Store integration
   - Persistent business cases
   - Automatic project and idea linking
   - Dynamic investment calculations
   - Cross-page synchronization
   - CRUD-ready business case management
   - No UI design changes
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.business = {
  id: "business",
  title: "الجدوى",
  icon: "💰",

  _container: null,
  _syncBound: false,
  _seedChecked: false,

  /* =======================================================
     Default Business Cases

     These cases are aligned with the Enterprise Biometric
     Intelligence Platform instead of general AI projects.
  ======================================================= */

  defaultCases: [
    {
      id: 1,
      projectId: 6,
      ideaTitle:
        "Biometric Registration Quality Monitor",

      title:
        "مراقبة جودة التسجيلات البيومترية",

      englishTitle:
        "Biometric Registration Quality Monitor",

      type: "Quick Win",
      cost: 240000,
      value: 780000,
      duration: "3-5 أشهر",
      risk: "منخفضة",
      readiness: 86,
      priority: "عالية",
      department: "الأنظمة البيومترية",
      status: "proposed",

      description:
        "إنشاء لوحة ذكية لمراقبة جودة التسجيلات الجديدة واكتشاف الحالات منخفضة الجودة قبل تأثيرها على المطابقة.",

      benefits: [
        "رفع جودة التسجيل من المصدر",
        "تقليل التصحيح اليدوي",
        "خفض حالات فشل المطابقة",
        "تحسين أداء الأجهزة والمواقع"
      ]
    },

    {
      id: 2,
      projectId: 8,
      ideaTitle:
        "Registration Error Intelligence Dashboard",

      title:
        "لوحة ذكاء أخطاء التسجيل",

      englishTitle:
        "Registration Error Intelligence Dashboard",

      type: "Quick Win",
      cost: 220000,
      value: 720000,
      duration: "3-4 أشهر",
      risk: "منخفضة",
      readiness: 90,
      priority: "عالية",
      department:
        "التحليلات والتقارير التنفيذية",
      status: "proposed",

      description:
        "لوحة تنفيذية لتحليل أخطاء التسجيل حسب الجهاز والموقع والمستخدم والفترة ونوع العملية.",

      benefits: [
        "تحديد أكثر الأخطاء تكرارًا",
        "تسريع معالجة الحالات",
        "دعم تحليل السبب الجذري",
        "رفع وضوح الأداء التشغيلي"
      ]
    },

    {
      id: 3,
      projectId: 9,
      ideaTitle:
        "Privilege Usage Analytics",

      title:
        "تحليل استخدام الصلاحيات",

      englishTitle:
        "Privilege Usage Analytics",

      type: "Quick Win",
      cost: 280000,
      value: 920000,
      duration: "3-5 أشهر",
      risk: "منخفضة",
      readiness: 84,
      priority: "عالية",
      department:
        "المستخدمون والصلاحيات",
      status: "proposed",

      description:
        "تحليل استخدام الصلاحيات الحساسة واكتشاف الصلاحيات غير المستخدمة أو الأعلى من الحاجة التشغيلية.",

      benefits: [
        "تقليل الصلاحيات غير الضرورية",
        "رفع الامتثال",
        "دعم مبدأ أقل صلاحية",
        "تسهيل المراجعة والتدقيق"
      ]
    },

    {
      id: 4,
      projectId: 10,
      ideaTitle:
        "Long Session Anomaly Detection",

      title:
        "كشف الجلسات الطويلة غير الطبيعية",

      englishTitle:
        "Long Session Anomaly Detection",

      type: "Quick Win",
      cost: 210000,
      value: 650000,
      duration: "3-4 أشهر",
      risk: "منخفضة",
      readiness: 82,
      priority: "عالية",
      department:
        "المستخدمون والصلاحيات",
      status: "proposed",

      description:
        "مراقبة مدة الجلسات واكتشاف الاستخدام غير المعتاد مقارنة بنمط المستخدم والموقع.",

      benefits: [
        "كشف مبكر للاستخدام غير الطبيعي",
        "تعزيز الرقابة على الحسابات",
        "تقليل احتمالية مشاركة الحساب",
        "تحسين إجراءات المراجعة"
      ]
    },

    {
      id: 5,
      projectId: 5,
      ideaTitle:
        "Airport Biometric Operations Dashboard",

      title:
        "لوحة العمليات البيومترية بالمطارات",

      englishTitle:
        "Airport Biometric Operations Dashboard",

      type: "Quick Win",
      cost: 360000,
      value: 1250000,
      duration: "3-4 أشهر",
      risk: "منخفضة",
      readiness: 88,
      priority: "عالية",
      department:
        "التحليلات والتقارير التنفيذية",
      status: "proposed",

      description:
        "لوحة موحدة لمقارنة جودة التسجيلات والأخطاء واستخدام الأنظمة والبوابات حسب المطار والموقع.",

      benefits: [
        "رؤية تشغيلية موحدة",
        "تسريع اتخاذ القرار",
        "مقارنة المواقع والمطارات",
        "رفع كفاءة توزيع الجهود"
      ]
    },

    {
      id: 6,
      projectId: 1,
      ideaTitle:
        "Biometric Data Integrity Engine",

      title:
        "محرك سلامة البيانات البيومترية",

      englishTitle:
        "Biometric Data Integrity Engine",

      type: "Strategic",
      cost: 1350000,
      value: 4600000,
      duration: "6-9 أشهر",
      risk: "متوسطة",
      readiness: 72,
      priority: "عالية",
      department: "الأنظمة البيومترية",
      status: "planned",

      description:
        "محرك ذكاء اصطناعي لاكتشاف السجلات المتعارضة والتسجيلات الخاطئة والحالات التي تحتاج مراجعة.",

      benefits: [
        "رفع سلامة قواعد البيانات",
        "كشف التعارضات مبكرًا",
        "تقليل الأخطاء التشغيلية",
        "منح درجة ثقة لكل سجل"
      ]
    },

    {
      id: 7,
      projectId: 2,
      ideaTitle:
        "Credential Misuse Detection Engine",

      title:
        "محرك كشف إساءة استخدام الحسابات",

      englishTitle:
        "Credential Misuse Detection Engine",

      type: "Strategic",
      cost: 1450000,
      value: 5100000,
      duration: "6-8 أشهر",
      risk: "متوسطة",
      readiness: 70,
      priority: "عالية",
      department:
        "المستخدمون والصلاحيات",
      status: "planned",

      description:
        "محرك يحلل أنماط استخدام الحسابات والأجهزة والمواقع والجلسات لاكتشاف الاستخدام غير الاعتيادي.",

      benefits: [
        "تعزيز الرقابة الأمنية",
        "كشف مشاركة الحسابات",
        "تقليل إساءة استخدام الصلاحيات",
        "تسريع التحقيق والمراجعة"
      ]
    },

    {
      id: 8,
      projectId: 4,
      ideaTitle:
        "Smart Gate Performance Intelligence",

      title:
        "تحليل أداء البوابات الذكية",

      englishTitle:
        "Smart Gate Performance Intelligence",

      type: "Strategic",
      cost: 1100000,
      value: 3800000,
      duration: "6-8 أشهر",
      risk: "متوسطة",
      readiness: 68,
      priority: "عالية",
      department: "البوابات الذكية",
      status: "planned",

      description:
        "منصة تحليل أداء البوابات حسب عدد العمليات وزمن العبور والأخطاء ونسبة النجاح والتوفر.",

      benefits: [
        "رفع جاهزية البوابات",
        "تحسين زمن عبور المسافر",
        "اكتشاف الانخفاض غير الطبيعي",
        "تحسين تخطيط التشغيل"
      ]
    },

    {
      id: 9,
      projectId: 14,
      ideaTitle:
        "Smart Gate Predictive Maintenance",

      title:
        "الصيانة التنبؤية للبوابات الذكية",

      englishTitle:
        "Smart Gate Predictive Maintenance",

      type: "Transformational",
      cost: 2400000,
      value: 7900000,
      duration: "8-10 أشهر",
      risk: "عالية",
      readiness: 52,
      priority: "عالية",
      department: "البوابات الذكية",
      status: "strategic",

      description:
        "استخدام البيانات التشغيلية والأعطال السابقة للتنبؤ باحتمالية تعطل البوابات قبل توقفها.",

      benefits: [
        "تقليل التوقف المفاجئ",
        "خفض تكاليف الأعطال",
        "تحسين جدولة الصيانة",
        "رفع استمرارية الخدمة"
      ]
    },

    {
      id: 10,
      projectId: 15,
      ideaTitle:
        "Executive Biometric Intelligence Dashboard",

      title:
        "لوحة القيادة التنفيذية للأنظمة البيومترية",

      englishTitle:
        "Executive Biometric Intelligence Dashboard",

      type: "Transformational",
      cost: 1850000,
      value: 6800000,
      duration: "5-7 أشهر",
      risk: "متوسطة",
      readiness: 74,
      priority: "عالية",
      department:
        "التحليلات والتقارير التنفيذية",
      status: "strategic",

      description:
        "لوحة تنفيذية موحدة لربط جودة التسجيلات والبوابات والمستخدمين والصلاحيات والمخاطر والحوكمة.",

      benefits: [
        "توحيد الرؤية التنفيذية",
        "رفع سرعة اتخاذ القرار",
        "ربط المؤشرات بالمخاطر",
        "تحويل البيانات إلى توصيات"
      ]
    }
  ],

  /* =======================================================
     Central Data Reader
  ======================================================= */

  getSharedData() {
    try {
      if (
        window.AIW?.Store &&
        typeof window.AIW.Store.getState ===
          "function"
      ) {
        return window.AIW.Store.getState() || {};
      }

      if (
        window.AIW?.Store &&
        typeof window.AIW.Store.getData ===
          "function"
      ) {
        return window.AIW.Store.getData() || {};
      }

      return window.AIW?.Data || {};
    } catch (error) {
      console.warn(
        "AI Work Business: Unable to read shared data.",
        error
      );

      return window.AIW?.Data || {};
    }
  },

  /* =======================================================
     Business Center Initialization
  ======================================================= */

  ensureBusinessSeeded() {
    if (this._seedChecked) return;

    this._seedChecked = true;

    const data = this.getSharedData();

    const hasBusinessCenter =
      data.businessCenter &&
      typeof data.businessCenter === "object" &&
      Array.isArray(data.businessCenter.cases);

    if (hasBusinessCenter) {
      return;
    }

    const now = new Date().toISOString();

    const businessCenter = {
      cases: this.clone(
        this.defaultCases
      ).map((item) => ({
        ...item,
        createdAt: now,
        updatedAt: now
      })),

      settings: {
        currency: "AED",
        reportingPeriod: "سنوي",
        minimumReadiness: 60,
        minimumROI: 100,
        quickWinDurationMonths: 5,
        includeInactiveCases: false
      },

      summary: {
        manualTotalCost: null,
        manualTotalValue: null
      },

      meta: {
        createdAt: now,
        updatedAt: now
      }
    };

    if (
      window.AIW?.Store &&
      typeof window.AIW.Store.update ===
        "function"
    ) {
      window.AIW.Store.update(
        "businessCenter",
        businessCenter,
        {
          event: "aiw:businessUpdated"
        }
      );

      return;
    }

    if (window.AIW?.Data) {
      window.AIW.Data.businessCenter =
        businessCenter;
    }
  },

  getBusinessCenter() {
    const data = this.getSharedData();

    const source =
      data.businessCenter &&
      typeof data.businessCenter === "object"
        ? data.businessCenter
        : {};

    return {
      cases: Array.isArray(source.cases)
        ? source.cases
            .map((item, index) =>
              this.normalizeCase(item, index)
            )
            .filter(Boolean)
        : this.clone(this.defaultCases),

      settings: {
        currency:
          source.settings?.currency ||
          "AED",

        reportingPeriod:
          source.settings?.reportingPeriod ||
          "سنوي",

        minimumReadiness:
          this.normalizePercent(
            source.settings?.minimumReadiness,
            60
          ),

        minimumROI:
          this.toSafeNumber(
            source.settings?.minimumROI,
            100
          ),

        quickWinDurationMonths:
          this.toSafeNumber(
            source.settings
              ?.quickWinDurationMonths,
            5
          ),

        includeInactiveCases:
          source.settings
            ?.includeInactiveCases === true
      },

      summary: {
        manualTotalCost:
          this.toNullableNumber(
            source.summary?.manualTotalCost
          ),

        manualTotalValue:
          this.toNullableNumber(
            source.summary?.manualTotalValue
          )
      },

      meta: {
        createdAt:
          source.meta?.createdAt || null,

        updatedAt:
          source.meta?.updatedAt || null
      }
    };
  },

  normalizeCase(item, index = 0) {
    if (
      !item ||
      typeof item !== "object"
    ) {
      return null;
    }

    return {
      ...item,

      id:
        item.id ??
        index + 1,

      projectId:
        item.projectId ?? null,

      ideaTitle:
        item.ideaTitle ||
        item.englishTitle ||
        "",

      title:
        item.title ||
        "دراسة جدوى غير مسماة",

      englishTitle:
        item.englishTitle ||
        item.english ||
        "",

      type:
        item.type ||
        "Strategic",

      cost:
        Math.max(
          0,
          this.toSafeNumber(
            item.cost,
            0
          )
        ),

      value:
        Math.max(
          0,
          this.toSafeNumber(
            item.value,
            0
          )
        ),

      duration:
        item.duration ||
        "غير محددة",

      risk:
        item.risk ||
        "متوسطة",

      readiness:
        this.normalizePercent(
          item.readiness,
          0
        ),

      priority:
        item.priority ||
        "متوسطة",

      department:
        item.department ||
        "غير مصنف",

      status:
        item.status ||
        "proposed",

      description:
        item.description ||
        item.desc ||
        "",

      benefits:
        Array.isArray(item.benefits)
          ? item.benefits
          : []
    };
  },

  /* =======================================================
     Business Center Updates
  ======================================================= */

  updateBusinessCenter(changes = {}) {
    if (
      !changes ||
      typeof changes !== "object"
    ) {
      return false;
    }

    const current =
      this.getBusinessCenter();

    const updated = {
      ...current,
      ...changes,

      settings: {
        ...current.settings,
        ...(changes.settings || {})
      },

      summary: {
        ...current.summary,
        ...(changes.summary || {})
      },

      meta: {
        ...current.meta,
        updatedAt:
          new Date().toISOString()
      }
    };

    if (
      window.AIW?.Store &&
      typeof window.AIW.Store.update ===
        "function"
    ) {
      return window.AIW.Store.update(
        "businessCenter",
        updated,
        {
          event: "aiw:businessUpdated"
        }
      );
    }

    if (window.AIW?.Data) {
      window.AIW.Data.businessCenter =
        updated;

      window.dispatchEvent(
        new CustomEvent(
          "aiw:businessUpdated",
          {
            detail: {
              businessCenter: updated
            }
          }
        )
      );

      return true;
    }

    return false;
  },

  addCase(item = {}) {
    const center =
      this.getBusinessCenter();

    const cases = [...center.cases];
    const now = new Date().toISOString();

    const newCase = this.normalizeCase(
      {
        id: this.getNextId(cases),
        projectId:
          item.projectId ?? null,

        ideaTitle:
          item.ideaTitle ||
          item.englishTitle ||
          "",

        title:
          item.title ||
          "دراسة جدوى جديدة",

        englishTitle:
          item.englishTitle ||
          "",

        type:
          item.type ||
          "Strategic",

        cost:
          item.cost ?? 0,

        value:
          item.value ?? 0,

        duration:
          item.duration ||
          "غير محددة",

        risk:
          item.risk ||
          "متوسطة",

        readiness:
          item.readiness ?? 0,

        priority:
          item.priority ||
          "متوسطة",

        department:
          item.department ||
          "غير مصنف",

        status:
          item.status ||
          "proposed",

        description:
          item.description ||
          "",

        benefits:
          Array.isArray(
            item.benefits
          )
            ? item.benefits
            : [],

        createdAt: now,
        updatedAt: now
      },
      cases.length
    );

    cases.push(newCase);

    this.updateBusinessCenter({
      cases
    });

    return newCase;
  },

  updateCase(id, changes = {}) {
    const center =
      this.getBusinessCenter();

    const caseIndex =
      center.cases.findIndex(
        (item) =>
          String(item.id) === String(id)
      );

    if (caseIndex === -1) {
      return false;
    }

    const cases =
      center.cases.map(
        (item, index) => {
          if (index !== caseIndex) {
            return item;
          }

          return this.normalizeCase(
            {
              ...item,
              ...changes,
              id: item.id,
              updatedAt:
                new Date().toISOString()
            },
            index
          );
        }
      );

    this.updateBusinessCenter({
      cases
    });

    return cases[caseIndex];
  },

  removeCase(id) {
    const center =
      this.getBusinessCenter();

    const removedCase =
      center.cases.find(
        (item) =>
          String(item.id) === String(id)
      );

    if (!removedCase) {
      return false;
    }

    const cases =
      center.cases.filter(
        (item) =>
          String(item.id) !== String(id)
      );

    this.updateBusinessCenter({
      cases
    });

    return removedCase;
  },

  /* =======================================================
     Project and Idea Synchronization
  ======================================================= */

  getCasesWithLinkedData(cases) {
    const data = this.getSharedData();

    const projects =
      Array.isArray(data.projects)
        ? data.projects
        : [];

    const ideas =
      Array.isArray(data.ideas)
        ? data.ideas
        : [];

    return cases.map((businessCase) => {
      const linkedProject =
        projects.find(
          (project) =>
            businessCase.projectId !== null &&
            String(project?.id) ===
              String(
                businessCase.projectId
              )
        ) ||
        projects.find(
          (project) =>
            project?.englishTitle ===
              businessCase.englishTitle ||
            project?.title ===
              businessCase.title
        );

      const linkedIdea =
        ideas.find(
          (idea) =>
            idea?.title ===
              businessCase.ideaTitle ||
            idea?.title ===
              businessCase.englishTitle
        );

      const linkedReadiness =
        linkedProject
          ? this.normalizePercent(
              linkedProject.progress ??
                linkedProject.readiness,
              businessCase.readiness
            )
          : businessCase.readiness;

      return {
        ...businessCase,

        readiness:
          businessCase.manualReadiness !==
          undefined &&
          businessCase.manualReadiness !==
            null
            ? this.normalizePercent(
                businessCase.manualReadiness,
                linkedReadiness
              )
            : linkedReadiness,

        priority:
          linkedProject?.priority ||
          linkedIdea?.priority ||
          businessCase.priority,

        department:
          linkedProject?.department ||
          linkedIdea?.department ||
          businessCase.department,

        duration:
          linkedProject?.duration ||
          linkedIdea?.duration ||
          businessCase.duration,

        risk:
          linkedIdea?.riskLevel ||
          businessCase.risk
      };
    });
  },

  /* =======================================================
     Financial Calculations
  ======================================================= */

  calculateCase(item) {
    const cost =
      Math.max(
        0,
        this.toSafeNumber(
          item?.cost,
          0
        )
      );

    const value =
      Math.max(
        0,
        this.toSafeNumber(
          item?.value,
          0
        )
      );

    const net = value - cost;

    const roi =
      cost > 0
        ? Math.round(
            (net / cost) * 100
          )
        : value > 0
          ? 100
          : 0;

    const valueCostRatio =
      cost > 0
        ? Number(
            (value / cost).toFixed(2)
          )
        : 0;

    return {
      cost,
      value,
      net,
      roi,
      valueCostRatio
    };
  },

  calculateSummary(
    cases,
    center
  ) {
    const calculatedCost =
      cases.reduce(
        (total, item) =>
          total +
          this.calculateCase(item).cost,
        0
      );

    const calculatedValue =
      cases.reduce(
        (total, item) =>
          total +
          this.calculateCase(item).value,
        0
      );

    const totalCost =
      center.summary.manualTotalCost !==
      null
        ? center.summary.manualTotalCost
        : calculatedCost;

    const totalValue =
      center.summary.manualTotalValue !==
      null
        ? center.summary.manualTotalValue
        : calculatedValue;

    const netValue =
      totalValue - totalCost;

    const roi =
      totalCost > 0
        ? Math.round(
            (netValue / totalCost) *
              100
          )
        : 0;

    const quickWins =
      cases.filter(
        (item) =>
          this.isQuickWin(item)
      ).length;

    const avgReadiness =
      cases.length
        ? this.average(
            cases.map(
              (item) =>
                item.readiness
            )
          )
        : 0;

    const approvedCases =
      cases.filter(
        (item) =>
          this.isApprovedStatus(
            item.status
          )
      ).length;

    const highValueCases =
      cases.filter(
        (item) =>
          this.calculateCase(item)
            .roi >=
          center.settings.minimumROI
      ).length;

    return {
      totalCost,
      totalValue,
      netValue,
      roi,
      quickWins,
      avgReadiness,
      approvedCases,
      highValueCases
    };
  },

  /* =======================================================
     AI and Recommendation Engines
  ======================================================= */

  getAiReport(context) {
    try {
      if (
        window.AIW?.AI &&
        typeof window.AIW.AI
          .generateExecutiveReport ===
          "function"
      ) {
        const report =
          window.AIW.AI
            .generateExecutiveReport(
              context
            );

        if (
          report &&
          typeof report === "object"
        ) {
          return report;
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Business: AI report unavailable.",
        error
      );
    }

    return {
      status:
        "استثمار مرحلي في الحلول البيومترية",

      message:
        "يوصى بالبدء بلوحات جودة التسجيلات وتحليل استخدام الصلاحيات ومراقبة أداء البوابات قبل الاستثمار في المحركات التنبؤية عالية التكلفة."
    };
  },

  getNextActions(
    cases,
    summary
  ) {
    try {
      if (
        window.AIW?.Recommendation &&
        typeof window.AIW
          .Recommendation
          .nextActions === "function"
      ) {
        const generated =
          window.AIW
            .Recommendation
            .nextActions({
              businessCases: cases,
              summary
            });

        if (
          Array.isArray(generated) &&
          generated.length
        ) {
          return generated;
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Business: Recommendation engine unavailable.",
        error
      );
    }

    const sortedCases =
      cases
        .slice()
        .sort(
          (first, second) => {
            const firstROI =
              this.calculateCase(
                first
              ).roi;

            const secondROI =
              this.calculateCase(
                second
              ).roi;

            return (
              secondROI -
              firstROI
            );
          }
        )
        .slice(0, 3);

    const actions =
      sortedCases.map(
        (item) =>
          `تجهيز دراسة تنفيذ تفصيلية لمشروع ${item.title} لارتفاع القيمة المتوقعة والجاهزية.`
      );

    if (actions.length < 4) {
      actions.push(
        "تحديد خط أساس لمؤشرات جودة التسجيلات والصلاحيات والبوابات قبل بدء التنفيذ."
      );
    }

    if (actions.length < 5) {
      actions.push(
        "إرفاق تقييم الحوكمة والمخاطر بكل دراسة جدوى قبل الاعتماد."
      );
    }

    return actions.slice(0, 5);
  },

  /* =======================================================
     Main Render
  ======================================================= */

  render(container) {
    if (!container) return;

    this._container = container;

    this.ensureBusinessSeeded();

    const W = window.AIW?.Widgets;

    const center =
      this.getBusinessCenter();

    const allCases =
      this.getCasesWithLinkedData(
        center.cases
      );

    const cases =
      center.settings
        .includeInactiveCases
        ? allCases
        : allCases.filter(
            (item) =>
              this.isActiveStatus(
                item.status
              )
          );

    const summary =
      this.calculateSummary(
        cases,
        center
      );

    const aiReport =
      this.getAiReport({
        cases,
        summary,
        settings:
          center.settings
      });

    const nextActions =
      this.getNextActions(
        cases,
        summary
      );

    container.innerHTML = `
      <section class="module-page">

        ${
          W?.hero
            ? W.hero({
                kicker:
                  "Biometric Business Case · Feasibility",

                title:
                  "مركز الجدوى الاستثمارية",

                description:
                  "تحويل مشاريع الأنظمة البيومترية والبوابات الذكية إلى قرارات تنفيذ واضحة عبر التكلفة، القيمة التشغيلية، المخاطر، الجاهزية، وأولوية الاستثمار.",

                chips: [
                  "💰 Investment Dashboard",
                  `📊 ${summary.roi}% عائد تقديري`,
                  `🚀 ${summary.quickWins} Quick Wins`,
                  `✅ ${summary.avgReadiness}% جاهزية`
                ]
              })
            : this.fallbackHero()
        }

        <div class="module-grid">
          ${this.kpi(
            "دراسات الجدوى",
            cases.length,
            "Business Cases"
          )}

          ${this.kpi(
            "التكلفة التقديرية",
            this.formatAED(
              summary.totalCost
            ),
            "Estimated Cost"
          )}

          ${this.kpi(
            "القيمة المتوقعة",
            this.formatAED(
              summary.totalValue
            ),
            "Expected Value"
          )}

          ${this.kpi(
            "صافي القيمة",
            this.formatAED(
              summary.netValue
            ),
            "Net Value"
          )}

          ${this.kpi(
            "العائد التقديري",
            `${summary.roi}%`,
            "Estimated Return"
          )}

          ${this.kpi(
            "متوسط الجاهزية",
            `${summary.avgReadiness}%`,
            "Readiness"
          )}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "الخلاصة الاستثمارية",
              "قراءة تنفيذية للجدوى المالية والتشغيلية."
            )}

            <div class="business-ultimate-summary">
              <strong>
                أفضل بداية هي المشاريع المتخصصة سريعة القياس ومنخفضة التعقيد
              </strong>

              <p>
                يوصى بالبدء بمراقبة جودة التسجيلات، لوحة أخطاء التسجيل،
                تحليل استخدام الصلاحيات، ولوحة العمليات البيومترية.
                هذه المشاريع تمنح الإدارة قيمة تشغيلية مبكرة قبل الانتقال
                إلى محركات الكشف والتنبؤ الأكثر تعقيداً.
              </p>

              <div class="business-summary-strip">
                <div>
                  <span>Cost</span>
                  <b>
                    ${this.formatAED(
                      summary.totalCost
                    )}
                  </b>
                </div>

                <div>
                  <span>Value</span>
                  <b>
                    ${this.formatAED(
                      summary.totalValue
                    )}
                  </b>
                </div>

                <div>
                  <span>Net</span>
                  <b>
                    ${this.formatAED(
                      summary.netValue
                    )}
                  </b>
                </div>

                <div>
                  <span>Return</span>
                  <b>
                    ${summary.roi}%
                  </b>
                </div>
              </div>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "AI Investment Insight",
              "توصية ذكية مرتبطة بمحرك AI."
            )}

            <div class="business-ai-card">
              <strong>
                ${this.escapeHtml(
                  aiReport.status ||
                  "استثمار مرحلي ذكي"
                )}
              </strong>

              <p>
                ${this.escapeHtml(
                  aiReport.message ||
                  "المرحلة التالية يجب أن تبدأ بالمشاريع منخفضة التكلفة وسريعة الأثر قبل التوسع الكبير."
                )}
              </p>

              <button
                class="module-btn secondary"
                data-module="kpis"
              >
                فتح المؤشرات
              </button>
            </div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "Return by Project",
              "مقارنة العائد التقديري حسب المشروع."
            )}

            <div class="business-chart-card">
              <canvas
                id="businessRoiChart"
              ></canvas>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Investment Mix",
              "توزيع المشاريع حسب نوع الاستثمار."
            )}

            <div class="business-chart-card">
              <canvas
                id="businessMixChart"
              ></canvas>
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "محفظة دراسات الجدوى",
            "تقدير تنفيذي للتكلفة والقيمة والعائد حسب المشروع."
          )}

          ${
            cases.length
              ? `
                <div class="business-grid">
                  ${cases
                    .map((item) =>
                      this.caseCard(item)
                    )
                    .join("")}
                </div>
              `
              : this.emptyState(
                  "لا توجد دراسات جدوى مسجلة حالياً."
                )
          }
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "مصفوفة الأولوية الاستثمارية",
            "تقسيم المشاريع حسب سرعة القيمة وحجم الاستثمار."
          )}

          <div class="priority-matrix">
            <div>
              <strong>
                🚀 ابدأ فوراً
              </strong>

              <span>
                Quick Wins منخفضة التكلفة وسريعة القياس.
              </span>
            </div>

            <div>
              <strong>
                📈 جهّز للتوسع
              </strong>

              <span>
                مشاريع متوسطة تحتاج بيانات وتكامل.
              </span>
            </div>

            <div>
              <strong>
                🏛️ قرار استراتيجي
              </strong>

              <span>
                مشاريع كبرى تحتاج لجنة وميزانية وحوكمة.
              </span>
            </div>

            <div>
              <strong>
                ⏸️ انتظر
              </strong>

              <span>
                أي مشروع لا يملك بيانات أو KPI واضح.
              </span>
            </div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "معيار الاعتماد",
              "كيف نقرر أي مشروع يبدأ أولاً؟"
            )}

            <div class="business-criteria">
              <div>
                <b>1</b>
                <span>
                  أثر تشغيلي واضح مقابل تكلفة مناسبة
                </span>
              </div>

              <div>
                <b>2</b>
                <span>
                  جاهزية بيانات ومؤشرات قياس
                </span>
              </div>

              <div>
                <b>3</b>
                <span>
                  مخاطر قابلة للمعالجة والحوكمة
                </span>
              </div>

              <div>
                <b>4</b>
                <span>
                  قابلية قياس القيمة خلال 3–6 أشهر
                </span>
              </div>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Next Best Actions",
              "الخطوات العملية التالية للاستثمار."
            )}

            ${this.renderExecutiveList(
              nextActions
            )}
          </div>
        </div>

      </section>
    `;

    this.renderCharts(cases);
    this.bindAutomaticSync();
  },

  /* =======================================================
     Business Case Card
  ======================================================= */

  caseCard(item) {
    const calculations =
      this.calculateCase(item);

    return `
      <article
        class="business-card"
        data-business-case-id="${this.escapeAttribute(
          item.id
        )}"
      >
        <div class="business-card-head">
          <span
            class="aiw-status ${this.typeClass(
              item.type
            )}"
          >
            ${this.escapeHtml(
              item.type
            )}
          </span>

          <b>
            ${item.readiness}%
          </b>
        </div>

        <h3>
          ${this.escapeHtml(
            item.title
          )}
        </h3>

        ${
          item.englishTitle
            ? `
              <small>
                ${this.escapeHtml(
                  item.englishTitle
                )}
              </small>
            `
            : ""
        }

        <div class="business-values">
          <div>
            <span>التكلفة</span>

            <strong>
              ${this.formatAED(
                calculations.cost
              )}
            </strong>
          </div>

          <div>
            <span>القيمة</span>

            <strong>
              ${this.formatAED(
                calculations.value
              )}
            </strong>
          </div>

          <div>
            <span>العائد</span>

            <strong>
              ${calculations.roi}%
            </strong>
          </div>
        </div>

        <div class="business-meta">
          <span>
            ⏱️
            ${this.escapeHtml(
              item.duration
            )}
          </span>

          <span>
            ⚠️ مخاطر
            ${this.escapeHtml(
              item.risk
            )}
          </span>
        </div>

        <div class="aiw-progress">
          <div
            style="width:${item.readiness}%"
          ></div>
        </div>
      </article>
    `;
  },

  /* =======================================================
     Charts
  ======================================================= */

  renderCharts(cases) {
    if (!window.AIW?.Charts) return;

    setTimeout(() => {
      const labels =
        cases.map(
          (item) =>
            item.title
        );

      const roiValues =
        cases.map(
          (item) =>
            this.calculateCase(item)
              .roi
        );

      const quick =
        cases.filter(
          (item) =>
            this.isQuickWin(item)
        ).length;

      const strategic =
        cases.filter(
          (item) =>
            this.normalizeType(
              item.type
            ) === "strategic"
        ).length;

      const transformational =
        cases.filter(
          (item) =>
            this.normalizeType(
              item.type
            ) ===
            "transformational"
        ).length;

      if (
        typeof window.AIW.Charts
          .bar === "function"
      ) {
        window.AIW.Charts.bar(
          "businessRoiChart",
          labels,
          roiValues,
          "Return %"
        );
      }

      if (
        typeof window.AIW.Charts
          .doughnut === "function"
      ) {
        window.AIW.Charts.doughnut(
          "businessMixChart",

          [
            "Quick Win",
            "Strategic",
            "Transformational"
          ],

          [
            quick,
            strategic,
            transformational
          ],

          "Investment Mix"
        );
      }
    }, 50);
  },

  /* =======================================================
     Classification Helpers
  ======================================================= */

  normalizeType(type) {
    return String(type || "")
      .trim()
      .toLowerCase();
  },

  isQuickWin(item) {
    const type =
      this.normalizeType(
        item?.type
      );

    return (
      type === "quick win" ||
      type === "quick-win" ||
      item?.quickWin === true
    );
  },

  typeClass(type) {
    const normalized =
      this.normalizeType(type);

    if (
      normalized === "quick win" ||
      normalized === "quick-win"
    ) {
      return "green";
    }

    if (
      normalized ===
      "transformational"
    ) {
      return "red";
    }

    return "orange";
  },

  isApprovedStatus(status) {
    const value = String(
      status || ""
    )
      .trim()
      .toLowerCase();

    return [
      "approved",
      "active",
      "in progress",
      "قيد التنفيذ",
      "معتمد",
      "مفعّل"
    ].includes(value);
  },

  isActiveStatus(status) {
    if (
      status === undefined ||
      status === null ||
      status === ""
    ) {
      return true;
    }

    const value = String(status)
      .trim()
      .toLowerCase();

    return ![
      "archived",
      "cancelled",
      "rejected",
      "inactive",
      "ملغي",
      "مرفوض",
      "مؤرشف"
    ].includes(value);
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
                    typeof item === "string"
                      ? item
                      : item?.title ||
                        item?.description ||
                        ""
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

  sectionTitle(title, desc) {
    if (
      window.AIW?.Widgets &&
      typeof window.AIW.Widgets
        .sectionTitle === "function"
    ) {
      return window.AIW.Widgets
        .sectionTitle(
          title,
          desc
        );
    }

    return `
      <div class="module-section-title compact">
        <h2>
          ${this.escapeHtml(title)}
        </h2>

        <p>
          ${this.escapeHtml(desc)}
        </p>
      </div>
    `;
  },

  fallbackHero() {
    return `
      <div class="module-hero">
        <span class="module-kicker">
          Biometric Business Case · Feasibility
        </span>

        <h1>
          مركز الجدوى الاستثمارية
        </h1>

        <p>
          تحويل مشاريع الأنظمة البيومترية والبوابات الذكية إلى قرارات تنفيذ واضحة.
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
     Automatic Synchronization
  ======================================================= */

  bindAutomaticSync() {
    if (this._syncBound) return;

    this._syncBound = true;

    const refreshBusiness = () => {
      if (
        !this._container ||
        !this._container.isConnected
      ) {
        return;
      }

      this.render(
        this._container
      );
    };

    const syncEvents = [
      "aiw:dataChanged",
      "aiw:dataUpdated",
      "aiw:dataImported",
      "aiw:dataRestored",
      "aiw:dataReset",
      "aiw:storeChanged",

      "aiw:businessChanged",
      "aiw:businessUpdated",

      "aiw:projectsChanged",
      "aiw:projectsUpdated",

      "aiw:ideasChanged",
      "aiw:ideasUpdated",

      "aiw:kpisChanged",
      "aiw:kpisUpdated",

      "aiw:governanceChanged",
      "aiw:governanceUpdated",

      "aiw:maturityChanged",
      "aiw:maturityUpdated",

      "aiw:risksChanged",
      "aiw:risksUpdated"
    ];

    syncEvents.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          refreshBusiness
        );
      }
    );

    window.addEventListener(
      "storage",
      (event) => {
        const supportedKeys = [
          "aiwDataV1",
          "aiwData",
          "AIW_DATA"
        ];

        if (
          !event.key ||
          supportedKeys.includes(
            event.key
          )
        ) {
          refreshBusiness();
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

    return Math.round(
      values.reduce(
        (total, value) =>
          total +
          this.toSafeNumber(
            value,
            0
          ),
        0
      ) / values.length
    );
  },

  formatAED(value) {
    const number =
      this.toSafeNumber(
        value,
        0
      );

    const absoluteNumber =
      Math.abs(number);

    const sign =
      number < 0 ? "-" : "";

    if (
      absoluteNumber >= 1000000000
    ) {
      return `${sign}${(
        absoluteNumber /
        1000000000
      ).toFixed(1)}B AED`;
    }

    if (
      absoluteNumber >= 1000000
    ) {
      const millions =
        absoluteNumber / 1000000;

      return `${sign}${millions.toFixed(
        millions % 1 ? 1 : 0
      )}M AED`;
    }

    return `${sign}${absoluteNumber.toLocaleString(
      "ar-AE"
    )} AED`;
  },

  getNextId(items = []) {
    if (!Array.isArray(items)) {
      return 1;
    }

    const ids = items
      .map((item) =>
        this.toSafeNumber(
          item?.id,
          0
        )
      )
      .filter((id) => id > 0);

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

  toNullableNumber(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : null;
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
      typeof structuredClone ===
      "function"
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