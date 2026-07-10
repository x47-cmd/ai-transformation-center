/* =========================================================
   AI Work - AI Maturity Center V2.2
   Enterprise Biometric Intelligence Maturity Assessment

   Updates:
   - Complete missing module functions
   - Central AIW.Store integration
   - Persistent maturity data
   - Dynamic cross-module maturity calculations
   - Automatic cross-page synchronization
   - Manual dimension override support
   - No UI design changes
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.maturity = {
  id: "maturity",
  title: "النضج",
  icon: "🧠",

  _container: null,
  _syncBound: false,
  _seedChecked: false,

  /* =======================================================
     Default Maturity Dimensions

     manualScore:
     - null = automatic calculation
     - number = manual override
  ======================================================= */

  defaultDimensions: [
    {
      id: "strategy",
      icon: "🎯",
      title: "الاستراتيجية المتخصصة",
      score: 46,
      manualScore: null,
      target: 85,
      status: "قيد البناء",
      desc:
        "وجود رؤية واضحة لتحويل تحديات الأنظمة البيومترية والبوابات الذكية إلى مشاريع ذكاء اصطناعي قابلة للقياس."
    },
    {
      id: "governance",
      icon: "🏛️",
      title: "الحوكمة والإشراف البشري",
      score: 42,
      manualScore: null,
      target: 92,
      status: "قيد البناء",
      desc:
        "ضوابط المراجعة البشرية، الخصوصية، السياسات، ومسؤولية التعامل مع التنبيهات الحساسة."
    },
    {
      id: "data",
      icon: "🗄️",
      title: "جودة البيانات البيومترية",
      score: 48,
      manualScore: null,
      target: 90,
      status: "متوسط",
      desc:
        "اكتمال البيانات، سلامة التسجيلات، كشف التعارضات، التكرار، وجودة مصادر البيانات."
    },
    {
      id: "technology",
      icon: "⚙️",
      title: "جاهزية الأنظمة والتكامل",
      score: 58,
      manualScore: null,
      target: 88,
      status: "جيد",
      desc:
        "جاهزية الأنظمة، سجلات التشغيل، الربط مع Power BI، وقابلية التكامل المرحلي."
    },
    {
      id: "users",
      icon: "👨🏻‍💻",
      title: "المستخدمون والصلاحيات",
      score: 44,
      manualScore: null,
      target: 86,
      status: "قيد البناء",
      desc:
        "قدرة المنظومة على تحليل سلوك المستخدمين، مدة الجلسات، استخدام الصلاحيات، والأنماط غير الاعتيادية."
    },
    {
      id: "operations",
      icon: "🛂",
      title: "تشغيل البوابات الذكية",
      score: 52,
      manualScore: null,
      target: 88,
      status: "متوسط",
      desc:
        "قياس جاهزية البوابات، زمن العبور، الأخطاء التشغيلية، ونسبة التوفر."
    },
    {
      id: "analytics",
      icon: "📊",
      title: "التحليلات والتقارير",
      score: 56,
      manualScore: null,
      target: 90,
      status: "جيد",
      desc:
        "لوحات Power BI، مؤشرات الأداء، التقارير التنفيذية، والتوصيات الذكية."
    },
    {
      id: "security",
      icon: "🛡️",
      title: "الأمن الرقمي",
      score: 62,
      manualScore: null,
      target: 94,
      status: "جيد",
      desc:
        "كشف الشذوذ، مراقبة الحسابات والصلاحيات، ترتيب التنبيهات، وسجل المخاطر."
    }
  ],

  defaultLevels: [
    {
      level: 1,
      title: "Initial",
      ar: "البداية",
      range: "0–20%",
      desc:
        "تحليلات محدودة بدون إطار واضح أو مؤشرات نضج."
    },
    {
      level: 2,
      title: "Emerging",
      ar: "ناشئ",
      range: "21–40%",
      desc:
        "بداية وعي بالمشاكل التشغيلية مع بعض الأفكار غير المترابطة."
    },
    {
      level: 3,
      title: "Developing",
      ar: "قيد التطوير",
      range: "41–60%",
      desc:
        "محفظة أفكار واضحة ولوحات قياس أولية ومشاريع قابلة للتنفيذ."
    },
    {
      level: 4,
      title: "Managed",
      ar: "مُدار",
      range: "61–80%",
      desc:
        "حوكمة ومؤشرات وتنبيهات وربط واضح بين البيانات والقرار."
    },
    {
      level: 5,
      title: "Optimized",
      ar: "محسّن",
      range: "81–95%",
      desc:
        "تحسين مستمر، نماذج كشف شذوذ، وPower BI تنفيذي متكامل."
    },
    {
      level: 6,
      title: "AI Driven Biometric Operations",
      ar: "تشغيل بيومتري مدعوم بالذكاء الاصطناعي",
      range: "96–100%",
      desc:
        "الذكاء الاصطناعي جزء أساسي من جودة التسجيلات، الصلاحيات، البوابات، والقرار التشغيلي."
    }
  ],

  defaultReadiness: [
    {
      id: "registration-data",
      title: "بيانات التسجيلات",
      score: 48,
      desc:
        "تحتاج قواعد جودة واضحة لكشف النقص، التعارض، والتكرار."
    },
    {
      id: "access-logs",
      title: "سجلات الدخول والصلاحيات",
      score: 46,
      desc:
        "تحتاج توحيد وربط لتحليل سلوك المستخدمين والجلسات الطويلة."
    },
    {
      id: "smart-gates",
      title: "أنظمة البوابات الذكية",
      score: 55,
      desc:
        "جاهزية تشغيلية جيدة تحتاج مؤشرات أداء وربط تحليلي مستمر."
    },
    {
      id: "analytics",
      title: "Power BI والتحليلات",
      score: 58,
      desc:
        "مناسبة للبدء بلوحات تنفيذية قبل نماذج الذكاء الاصطناعي المتقدمة."
    },
    {
      id: "governance",
      title: "الحوكمة والمراجعة",
      score: 42,
      desc:
        "تحتاج إطار Human-in-the-Loop وسياسات واضحة للتنبيهات الحساسة."
    },
    {
      id: "security",
      title: "الأمن الرقمي",
      score: 62,
      desc:
        "جاهزية جيدة يمكن تطويرها عبر كشف الشذوذ وترتيب التنبيهات."
    }
  ],

  defaultRoadmap: [
    {
      id: 1,
      year: "2026",
      title: "Foundation",
      desc:
        "حصر مصادر البيانات، تحديد المؤشرات، وبناء لوحات Power BI أولية.",
      progress: 35
    },
    {
      id: 2,
      year: "2027",
      title: "Quick Wins",
      desc:
        "تنفيذ لوحات أخطاء التسجيل، استخدام الصلاحيات، والجلسات الطويلة.",
      progress: 50
    },
    {
      id: 3,
      year: "2028",
      title: "AI Detection",
      desc:
        "تطبيق نماذج كشف الشذوذ للتسجيلات، الحسابات، والصلاحيات.",
      progress: 65
    },
    {
      id: 4,
      year: "2029",
      title: "Executive Platform",
      desc:
        "توحيد التقارير والتنبيهات والتوصيات داخل منصة تنفيذية.",
      progress: 82
    },
    {
      id: 5,
      year: "2030",
      title: "AI Driven",
      desc:
        "تشغيل ناضج ومستدام مع تحسين مستمر وقياس أثر شامل.",
      progress: 100
    }
  ],

  defaultGaps: [
    {
      id: 1,
      area: "جودة البيانات",
      current:
        "بيانات تشغيلية موجودة لكنها تحتاج تصنيف وتنظيف وربط",
      target:
        "بيانات جاهزة للتحليل والنماذج مع قواعد جودة واضحة",
      gap:
        "نقص في إطار جودة بيانات التسجيلات والتعارضات",
      action:
        "إطلاق Biometric Data Quality Framework"
    },
    {
      id: 2,
      area: "الصلاحيات",
      current:
        "سجلات استخدام متاحة لكن التحليل غالباً تقليدي",
      target:
        "تحليل ذكي لسلوك المستخدمين والصلاحيات والجلسات",
      gap:
        "ضعف في كشف الأنماط غير الاعتيادية",
      action:
        "إطلاق User Behaviour & Privilege Analytics"
    },
    {
      id: 3,
      area: "البوابات الذكية",
      current:
        "متابعة تشغيلية للأداء والأعطال",
      target:
        "قياس مستمر للجاهزية وزمن العبور والأنماط التشغيلية",
      gap:
        "الحاجة إلى Dashboard تنفيذي موحد",
      action:
        "بناء Smart Gate Performance Dashboard"
    },
    {
      id: 4,
      area: "الحوكمة",
      current:
        "مبادئ عامة ومراجعات يدوية",
      target:
        "حوكمة واضحة للتنبيهات الحساسة مع Human-in-the-Loop",
      gap:
        "الحاجة إلى آلية مراجعة وتوثيق لكل تنبيه",
      action:
        "اعتماد Biometric AI Governance Model"
    }
  ],

  defaultActions: [
    {
      id: 1,
      title: "رفع جودة التسجيلات",
      desc:
        "بناء Dashboard لمراقبة التسجيلات الخاطئة، التكرار، والتعارضات بين السجلات."
    },
    {
      id: 2,
      title: "تحليل استخدام الصلاحيات",
      desc:
        "مراقبة مدة استخدام الحسابات، المستخدمين غير الطبيعيين، والجلسات الطويلة."
    },
    {
      id: 3,
      title: "تشغيل لوحات Power BI",
      desc:
        "ربط جميع البيانات التشغيلية في لوحة تنفيذية واحدة."
    },
    {
      id: 4,
      title: "الانتقال إلى AI Detection",
      desc:
        "بعد اكتمال جودة البيانات يبدأ تشغيل نماذج كشف الشذوذ والتنبيهات الذكية."
    }
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
        "AI Work Maturity: Unable to read shared data.",
        error
      );

      return window.AIW?.Data || {};
    }
  },

  /* =======================================================
     Store Initialization
  ======================================================= */

  ensureMaturitySeeded() {
    if (this._seedChecked) return;

    this._seedChecked = true;

    const sharedData = this.getSharedData();

    const hasMaturityCenter =
      sharedData.maturityCenter &&
      typeof sharedData.maturityCenter === "object" &&
      Array.isArray(
        sharedData.maturityCenter.dimensions
      );

    if (hasMaturityCenter) {
      return;
    }

    const now = new Date().toISOString();

    const maturityCenter = {
      dimensions: this.clone(
        this.defaultDimensions
      ),

      levels: this.clone(
        this.defaultLevels
      ),

      readiness: this.clone(
        this.defaultReadiness
      ),

      roadmap: this.clone(
        this.defaultRoadmap
      ),

      gaps: this.clone(
        this.defaultGaps
      ),

      actions: this.clone(
        this.defaultActions
      ),

      settings: {
        targetScore: 100,
        targetYear: 2030,
        calculationMode: "automatic"
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
        "maturityCenter",
        maturityCenter,
        {
          event: "aiw:maturityUpdated"
        }
      );

      return;
    }

    if (window.AIW?.Data) {
      window.AIW.Data.maturityCenter =
        maturityCenter;
    }
  },

  getMaturityCenter() {
    const sharedData = this.getSharedData();

    const source =
      sharedData.maturityCenter &&
      typeof sharedData.maturityCenter === "object"
        ? sharedData.maturityCenter
        : {};

    return {
      dimensions: Array.isArray(
        source.dimensions
      )
        ? source.dimensions.map(
            (dimension, index) =>
              this.normalizeDimension(
                dimension,
                index
              )
          )
        : this.clone(
            this.defaultDimensions
          ),

      levels: Array.isArray(source.levels)
        ? source.levels
        : this.clone(
            this.defaultLevels
          ),

      readiness: Array.isArray(
        source.readiness
      )
        ? source.readiness.map(
            (item, index) =>
              this.normalizeReadiness(
                item,
                index
              )
          )
        : this.clone(
            this.defaultReadiness
          ),

      roadmap: Array.isArray(
        source.roadmap
      )
        ? source.roadmap.map(
            (item, index) =>
              this.normalizeRoadmap(
                item,
                index
              )
          )
        : this.clone(
            this.defaultRoadmap
          ),

      gaps: Array.isArray(source.gaps)
        ? source.gaps
        : this.clone(
            this.defaultGaps
          ),

      actions: Array.isArray(
        source.actions
      )
        ? source.actions
        : this.clone(
            this.defaultActions
          ),

      settings: {
        targetScore:
          this.normalizePercent(
            source.settings?.targetScore,
            100
          ),

        targetYear:
          this.toSafeNumber(
            source.settings?.targetYear,
            2030
          ),

        calculationMode:
          source.settings
            ?.calculationMode ||
          "automatic"
      },

      meta: {
        createdAt:
          source.meta?.createdAt ||
          null,

        updatedAt:
          source.meta?.updatedAt ||
          null
      }
    };
  },

  updateMaturityCenter(changes = {}) {
    if (
      !changes ||
      typeof changes !== "object"
    ) {
      return false;
    }

    const current =
      this.getMaturityCenter();

    const updated = {
      ...current,
      ...changes,

      settings: {
        ...current.settings,
        ...(changes.settings || {})
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
        "maturityCenter",
        updated,
        {
          event: "aiw:maturityUpdated"
        }
      );
    }

    if (window.AIW?.Data) {
      window.AIW.Data.maturityCenter =
        updated;

      window.dispatchEvent(
        new CustomEvent(
          "aiw:maturityUpdated",
          {
            detail: {
              maturityCenter: updated
            }
          }
        )
      );

      return true;
    }

    return false;
  },

  /* =======================================================
     Normalizers
  ======================================================= */

  normalizeDimension(
    dimension,
    index = 0
  ) {
    const fallback =
      this.defaultDimensions[index] ||
      {};

    return {
      ...fallback,
      ...dimension,

      id:
        dimension?.id ||
        fallback.id ||
        `dimension-${index + 1}`,

      icon:
        dimension?.icon ||
        fallback.icon ||
        "🧠",

      title:
        dimension?.title ||
        fallback.title ||
        "بُعد غير مسمى",

      score:
        this.normalizePercent(
          dimension?.score,
          fallback.score || 0
        ),

      manualScore:
        this.toNullableNumber(
          dimension?.manualScore
        ),

      target:
        this.normalizePercent(
          dimension?.target,
          fallback.target || 100
        ),

      status:
        dimension?.status ||
        fallback.status ||
        "قيد البناء",

      desc:
        dimension?.desc ||
        dimension?.description ||
        fallback.desc ||
        ""
    };
  },

  normalizeReadiness(
    item,
    index = 0
  ) {
    if (Array.isArray(item)) {
      return {
        id:
          `readiness-${index + 1}`,
        title:
          item[0] ||
          "جاهزية غير مسماة",
        score:
          this.normalizePercent(
            item[1],
            0
          ),
        desc:
          item[2] || ""
      };
    }

    return {
      id:
        item?.id ||
        `readiness-${index + 1}`,

      title:
        item?.title ||
        item?.name ||
        "جاهزية غير مسماة",

      score:
        this.normalizePercent(
          item?.score,
          0
        ),

      desc:
        item?.desc ||
        item?.description ||
        ""
    };
  },

  normalizeRoadmap(
    item,
    index = 0
  ) {
    if (Array.isArray(item)) {
      return {
        id: index + 1,
        year: item[0] || "",
        title: item[1] || "",
        desc: item[2] || "",
        progress:
          this.normalizePercent(
            item[3],
            0
          )
      };
    }

    return {
      id:
        item?.id ??
        index + 1,

      year:
        item?.year || "",

      title:
        item?.title ||
        item?.phase ||
        "",

      desc:
        item?.desc ||
        item?.description ||
        item?.activities ||
        "",

      progress:
        this.normalizePercent(
          item?.progress,
          0
        )
    };
  },

  /* =======================================================
     Automatic Dimension Calculations
  ======================================================= */

  getCalculatedDimensions(
    storedDimensions
  ) {
    const sharedData =
      this.getSharedData();

    const baseDimensions =
      storedDimensions.map(
        (dimension) => ({
          ...dimension
        })
      );

    const calculatedScores =
      this.calculateDimensionScores(
        sharedData,
        baseDimensions
      );

    return baseDimensions.map(
      (dimension) => {
        const automaticScore =
          calculatedScores[
            dimension.id
          ] ?? dimension.score;

        const finalScore =
          dimension.manualScore !== null
            ? this.normalizePercent(
                dimension.manualScore,
                automaticScore
              )
            : this.normalizePercent(
                automaticScore,
                dimension.score
              );

        return {
          ...dimension,
          score: finalScore,
          status:
            this.scoreStatus(
              finalScore
            )
        };
      }
    );
  },

  calculateDimensionScores(
    data,
    defaults
  ) {
    const getDefault = (
      dimensionId,
      fallback
    ) => {
      const dimension =
        defaults.find(
          (item) =>
            item.id === dimensionId
        );

      return this.normalizePercent(
        dimension?.score,
        fallback
      );
    };

    const strategyScore =
      this.calculateStrategyScore(
        data,
        getDefault("strategy", 46)
      );

    const governanceScore =
      this.calculateGovernanceScore(
        data,
        getDefault(
          "governance",
          42
        )
      );

    const dataScore =
      this.calculateDataScore(
        data,
        getDefault("data", 48)
      );

    const technologyScore =
      this.calculateTechnologyScore(
        data,
        getDefault(
          "technology",
          58
        )
      );

    const usersScore =
      this.calculateUsersScore(
        data,
        getDefault("users", 44)
      );

    const operationsScore =
      this.calculateOperationsScore(
        data,
        getDefault(
          "operations",
          52
        )
      );

    const analyticsScore =
      this.calculateAnalyticsScore(
        data,
        getDefault(
          "analytics",
          56
        )
      );

    const securityScore =
      this.calculateSecurityScore(
        data,
        getDefault(
          "security",
          62
        )
      );

    return {
      strategy: strategyScore,
      governance: governanceScore,
      data: dataScore,
      technology: technologyScore,
      users: usersScore,
      operations: operationsScore,
      analytics: analyticsScore,
      security: securityScore
    };
  },

  calculateStrategyScore(
    data,
    fallback
  ) {
    const strategy =
      data.strategy || {};

    const goals = Array.isArray(
      strategy.goals
    )
      ? strategy.goals.length
      : 0;

    const pillars = Array.isArray(
      strategy.pillars
    )
      ? strategy.pillars.length
      : 0;

    const roadmap = Array.isArray(
      data.roadmap
    )
      ? data.roadmap.length
      : 0;

    const hasVision =
      Boolean(
        data.summary?.vision
      );

    const hasMission =
      Boolean(
        data.summary?.mission
      );

    if (
      !goals &&
      !pillars &&
      !roadmap
    ) {
      return fallback;
    }

    return this.normalizePercent(
      20 +
        Math.min(goals * 7, 28) +
        Math.min(pillars * 4, 24) +
        Math.min(roadmap * 3, 18) +
        (hasVision ? 5 : 0) +
        (hasMission ? 5 : 0),
      fallback
    );
  },

  calculateGovernanceScore(
    data,
    fallback
  ) {
    try {
      if (
        window.AIW?.Modules
          ?.governance &&
        typeof window.AIW.Modules
          .governance.getMetrics ===
          "function" &&
        data.governanceCenter
      ) {
        const metrics =
          window.AIW.Modules
            .governance.getMetrics(
              data.governanceCenter
            );

        return this.normalizePercent(
          metrics?.governanceScore,
          fallback
        );
      }
    } catch (error) {
      console.warn(
        "AI Work Maturity: Governance score calculation failed.",
        error
      );
    }

    const controls =
      Array.isArray(data.governance)
        ? data.governance.length
        : 0;

    return controls
      ? this.normalizePercent(
          40 + controls * 7,
          fallback
        )
      : fallback;
  },

  calculateDataScore(
    data,
    fallback
  ) {
    const kpis =
      this.getKpis(data);

    const relatedTitles = [
      "جودة التسجيلات البيومترية",
      "التسجيلات التي تحتاج مراجعة",
      "السجلات المتعارضة أو المتكررة"
    ];

    const related =
      kpis.filter((kpi) =>
        relatedTitles.includes(
          kpi?.title
        )
      );

    if (!related.length) {
      return fallback;
    }

    return this.average(
      related.map((kpi) =>
        this.getKpiProgress(kpi)
      )
    );
  },

  calculateTechnologyScore(
    data,
    fallback
  ) {
    const systemHealth =
      this.normalizePercent(
        data.summary?.systemHealth ??
          data.summary
            ?.portfolioHealth,
        fallback
      );

    const projects =
      Array.isArray(data.projects)
        ? data.projects
        : [];

    const projectReadiness =
      projects.length
        ? this.average(
            projects.map(
              (project) =>
                this.normalizePercent(
                  project?.progress ??
                    project?.readiness,
                  0
                )
            )
          )
        : systemHealth;

    return this.average([
      systemHealth,
      projectReadiness
    ]);
  },

  calculateUsersScore(
    data,
    fallback
  ) {
    const kpis =
      this.getKpis(data);

    const relatedTitles = [
      "تنبيهات استخدام الصلاحيات",
      "الجلسات الطويلة غير الطبيعية"
    ];

    const related =
      kpis.filter((kpi) =>
        relatedTitles.includes(
          kpi?.title
        )
      );

    return related.length
      ? this.average(
          related.map((kpi) =>
            this.getKpiProgress(kpi)
          )
        )
      : fallback;
  },

  calculateOperationsScore(
    data,
    fallback
  ) {
    const kpis =
      this.getKpis(data);

    const relatedTitles = [
      "جاهزية البوابات الذكية",
      "زمن عبور المسافر"
    ];

    const related =
      kpis.filter((kpi) =>
        relatedTitles.includes(
          kpi?.title
        )
      );

    const operationsHealth =
      this.normalizePercent(
        data.summary
          ?.operationsHealth ??
          data.summary
            ?.operationalHealth,
        fallback
      );

    if (!related.length) {
      return operationsHealth;
    }

    return this.average([
      operationsHealth,
      ...related.map((kpi) =>
        this.getKpiProgress(kpi)
      )
    ]);
  },

  calculateAnalyticsScore(
    data,
    fallback
  ) {
    const kpis =
      this.getKpis(data);

    const kpiScore =
      kpis.length
        ? this.average(
            kpis.map((kpi) =>
              this.getKpiProgress(kpi)
            )
          )
        : fallback;

    const reportsReady =
      data.reportsCenter ? 100 : 40;

    const analyticsEngineReady =
      window.AIW?.Analytics
        ? 100
        : 40;

    return this.average([
      kpiScore,
      reportsReady,
      analyticsEngineReady
    ]);
  },

  calculateSecurityScore(
    data,
    fallback
  ) {
    const risks =
      data.governanceCenter &&
      Array.isArray(
        data.governanceCenter.risks
      )
        ? data.governanceCenter.risks
        : Array.isArray(data.risks)
          ? data.risks
          : [];

    const riskHealth =
      this.calculateRiskHealth(
        risks
      );

    const alerts =
      Array.isArray(data.alerts)
        ? data.alerts
        : [];

    const openCriticalAlerts =
      alerts.filter((alert) => {
        const severity = String(
          alert?.severity ||
            alert?.level ||
            ""
        )
          .trim()
          .toLowerCase();

        const status = String(
          alert?.status || ""
        )
          .trim()
          .toLowerCase();

        const isCritical =
          severity === "critical" ||
          severity === "high" ||
          severity === "حرج" ||
          severity === "عالية";

        const isClosed = [
          "resolved",
          "closed",
          "تم الحل",
          "مغلق"
        ].includes(status);

        return (
          isCritical &&
          !isClosed
        );
      }).length;

    const alertHealth =
      this.normalizePercent(
        100 -
          openCriticalAlerts * 10,
        fallback
      );

    return risks.length ||
      alerts.length
      ? this.average([
          riskHealth,
          alertHealth
        ])
      : fallback;
  },

  calculateRiskHealth(risks) {
    if (
      !Array.isArray(risks) ||
      !risks.length
    ) {
      return 100;
    }

    const penalty =
      risks.reduce(
        (total, risk) => {
          const level = String(
            risk?.level ??
              risk?.[1] ??
              ""
          )
            .trim()
            .toLowerCase();

          const status = String(
            risk?.status || ""
          )
            .trim()
            .toLowerCase();

          if (
            [
              "resolved",
              "closed",
              "تم الحل",
              "مغلق"
            ].includes(status)
          ) {
            return total;
          }

          if (
            level.includes("عال") ||
            level === "high" ||
            level === "critical"
          ) {
            return total + 12;
          }

          if (
            level.includes("متوسط") ||
            level === "medium"
          ) {
            return total + 6;
          }

          return total + 2;
        },
        0
      );

    return this.normalizePercent(
      100 - penalty,
      0
    );
  },

  /* =======================================================
     Readiness Calculations
  ======================================================= */

  getCalculatedReadiness(
    storedReadiness,
    dimensions
  ) {
    const dimensionMap =
      Object.fromEntries(
        dimensions.map(
          (dimension) => [
            dimension.id,
            dimension.score
          ]
        )
      );

    return storedReadiness.map(
      (item) => {
        let score = item.score;

        if (
          item.id ===
          "registration-data"
        ) {
          score =
            dimensionMap.data ??
            score;
        }

        if (
          item.id ===
          "access-logs"
        ) {
          score =
            dimensionMap.users ??
            score;
        }

        if (
          item.id ===
          "smart-gates"
        ) {
          score =
            dimensionMap.operations ??
            score;
        }

        if (
          item.id === "analytics"
        ) {
          score =
            dimensionMap.analytics ??
            score;
        }

        if (
          item.id === "governance"
        ) {
          score =
            dimensionMap.governance ??
            score;
        }

        if (
          item.id === "security"
        ) {
          score =
            dimensionMap.security ??
            score;
        }

        return {
          ...item,
          score:
            this.normalizePercent(
              score,
              item.score
            )
        };
      }
    );
  },

  /* =======================================================
     Dimension Management
  ======================================================= */

  updateDimension(
    id,
    changes = {}
  ) {
    const center =
      this.getMaturityCenter();

    const index =
      center.dimensions.findIndex(
        (dimension) =>
          String(dimension.id) ===
          String(id)
      );

    if (index === -1) {
      return false;
    }

    const dimensions =
      center.dimensions.map(
        (dimension, itemIndex) => {
          if (itemIndex !== index) {
            return dimension;
          }

          return this.normalizeDimension(
            {
              ...dimension,
              ...changes,
              id: dimension.id,
              updatedAt:
                new Date().toISOString()
            },
            itemIndex
          );
        }
      );

    this.updateMaturityCenter({
      dimensions
    });

    return dimensions[index];
  },

  setDimensionManualScore(
    id,
    score
  ) {
    return this.updateDimension(id, {
      manualScore:
        this.normalizePercent(
          score,
          0
        )
    });
  },

  clearDimensionManualScore(id) {
    return this.updateDimension(id, {
      manualScore: null
    });
  },

  updateTargetScore(score) {
    return this.updateMaturityCenter({
      settings: {
        targetScore:
          this.normalizePercent(
            score,
            100
          )
      }
    });
  },

  /* =======================================================
     Main Render
  ======================================================= */

  render(container) {
    if (!container) return;

    this._container = container;

    this.ensureMaturitySeeded();

    const W = window.AIW?.Widgets;

    const sharedData =
      this.getSharedData();

    const maturityCenter =
      this.getMaturityCenter();

    const dimensions =
      this.getCalculatedDimensions(
        maturityCenter.dimensions
      );

    const readiness =
      this.getCalculatedReadiness(
        maturityCenter.readiness,
        dimensions
      );

    const levels =
      maturityCenter.levels;

    const roadmap =
      maturityCenter.roadmap;

    const gaps =
      maturityCenter.gaps;

    const actions =
      maturityCenter.actions;

    const departments =
      this.getDepartments(
        sharedData
      );

    const calculatedOverall =
      this.average(
        dimensions.map(
          (dimension) =>
            dimension.score
        )
      );

    const analyticsOverall =
      this.getAnalyticsMaturityScore();

    const overall =
      analyticsOverall !== null
        ? this.normalizePercent(
            analyticsOverall,
            calculatedOverall
          )
        : calculatedOverall;

    const target =
      maturityCenter.settings
        .targetScore;

    const targetYear =
      maturityCenter.settings
        .targetYear;

    const gap = Math.max(
      0,
      target - overall
    );

    const level =
      this.getLevel(
        overall,
        levels
      );

    const sortedDimensions = [
      ...dimensions
    ].sort(
      (first, second) =>
        second.score -
        first.score
    );

    const strongest =
      sortedDimensions[0] ||
      {
        title: "غير محدد",
        score: 0
      };

    const weakest =
      sortedDimensions[
        sortedDimensions.length - 1
      ] || {
        title: "غير محدد",
        score: 0
      };

    const recommendations =
      this.getRecommendations(
        dimensions,
        overall
      );

    const aiInsight =
      this.getAiInsight(
        dimensions,
        overall
      );

    container.innerHTML = `
      <section class="module-page">

        ${
          W?.hero
            ? W.hero({
                kicker:
                  "Biometric AI Maturity · Readiness",

                title:
                  "مركز نضج الذكاء الاصطناعي",

                description:
                  "تقييم تنفيذي لجاهزية محفظة الأنظمة البيومترية والبوابات الذكية عبر جودة البيانات، الصلاحيات، البوابات، الأمن الرقمي، الحوكمة، والتحليلات.",

                chips: [
                  `🧠 النضج الحالي ${overall}%`,
                  `🎯 الهدف ${target}% بحلول ${targetYear}`,
                  `📊 ${dimensions.length} أبعاد تقييم`,
                  `📉 الفجوة ${gap}%`
                ]
              })
            : this.fallbackHero(
                overall
              )
        }

        <div class="module-grid">
          ${this.kpi(
            "النضج الحالي",
            `${overall}%`,
            "Current Maturity"
          )}

          ${this.kpi(
            "المستوى الحالي",
            level.title,
            level.ar
          )}

          ${this.kpi(
            "أقوى محور",
            strongest.title,
            `${strongest.score}%`
          )}

          ${this.kpi(
            "أكبر فجوة",
            weakest.title,
            `${weakest.score}%`
          )}

          ${this.kpi(
            "المحافظ المقاسة",
            departments.length,
            "Portfolios"
          )}

          ${this.kpi(
            "الفجوة للهدف",
            `${gap}%`,
            `To ${targetYear} Target`
          )}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "Executive Biometric AI Maturity Score",
              "قراءة تنفيذية لمستوى جاهزية المحفظة المتخصصة."
            )}

            <div class="maturity-ultimate-score">
              <div>
                <strong>
                  ${overall}%
                </strong>

                <span>
                  ${this.escapeHtml(
                    level.title
                  )}
                  ·
                  ${this.escapeHtml(
                    level.ar
                  )}
                </span>
              </div>

              <div class="aiw-progress">
                <div
                  style="width:${overall}%"
                ></div>
              </div>

              <p>
                المحفظة حالياً في مرحلة
                ${this.escapeHtml(level.ar)}.
                يوجد أساس جيد في الأمن الرقمي والتحليلات،
                لكن رفع النضج يتطلب تحسين جودة بيانات التسجيلات،
                حوكمة التنبيهات، وربط استخدام الصلاحيات
                بلوحات قياس ومراجعة بشرية واضحة.
              </p>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "AI Executive Insight",
              "تحليل ذكي مرتبط بمحركات Analytics وAI Engine."
            )}

            <div
              class="maturity-ai-insight ${this.escapeAttribute(
                aiInsight.color ||
                "orange"
              )}"
            >
              <strong>
                ${this.escapeHtml(
                  aiInsight.title ||
                  "مرحلة البناء المتخصص"
                )}
              </strong>

              <p>
                ${this.escapeHtml(
                  aiInsight.message ||
                  "يفضل البدء بلوحات Quick Wins وتفعيل الحوكمة قبل نماذج الكشف المتقدمة."
                )}
              </p>

              <button
                class="module-btn secondary"
                data-module="governance"
              >
                فتح الحوكمة
              </button>
            </div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "Radar View",
              "نظرة مقارنة على أبعاد نضج المحفظة المتخصصة."
            )}

            <div class="maturity-chart-card">
              <canvas
                id="maturityRadarChart"
              ></canvas>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Readiness Score",
              "جاهزية البيانات والأنظمة والصلاحيات والتحليلات."
            )}

            <div class="maturity-readiness-list">
              ${readiness
                .map(
                  (item) => `
                    <div class="maturity-readiness-item">
                      <div>
                        <strong>
                          ${this.escapeHtml(
                            item.title
                          )}
                        </strong>

                        <span>
                          ${this.escapeHtml(
                            item.desc
                          )}
                        </span>
                      </div>

                      <b>
                        ${item.score}%
                      </b>

                      <div class="aiw-progress">
                        <div
                          style="width:${item.score}%"
                        ></div>
                      </div>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "Biometric AI Maturity Dimensions",
            "تحليل مفصل للمحاور التي تحدد جاهزية المحفظة."
          )}

          <div class="maturity-heat-grid">
            ${dimensions
              .map(
                (dimension) => {
                  const dimensionGap =
                    Math.max(
                      0,
                      dimension.target -
                        dimension.score
                    );

                  return `
                    <article
                      class="maturity-heat-card ${this.heatClass(
                        dimension.score
                      )}"
                      data-dimension-id="${this.escapeAttribute(
                        dimension.id
                      )}"
                    >
                      <div class="maturity-heat-head">
                        <span>
                          ${this.escapeHtml(
                            dimension.icon
                          )}
                        </span>

                        <b>
                          ${dimension.score}%
                        </b>
                      </div>

                      <strong>
                        ${this.escapeHtml(
                          dimension.title
                        )}
                      </strong>

                      <p>
                        ${this.escapeHtml(
                          dimension.desc
                        )}
                      </p>

                      <small>
                        المستهدف:
                        ${dimension.target}%
                        ·
                        الفجوة:
                        ${dimensionGap}%
                      </small>
                    </article>
                  `;
                }
              )
              .join("")}
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "Portfolio Ranking",
              "ترتيب المحافظ حسب الجاهزية والنضج."
            )}

            ${
              departments.length
                ? `
                  <div class="maturity-department-ranking">
                    ${this.rankDepartments(
                      departments
                    )
                      .map(
                        (
                          department,
                          index
                        ) => `
                          <div class="maturity-rank-item">
                            <b>
                              ${String(
                                index + 1
                              ).padStart(
                                2,
                                "0"
                              )}
                            </b>

                            <div>
                              <strong>
                                ${this.escapeHtml(
                                  department.name
                                )}
                              </strong>

                              <span>
                                ${department.count ||
                                0}
                                أفكار
                                ·
                                ${this.escapeHtml(
                                  this.departmentAdvice(
                                    department.name
                                  )
                                )}
                              </span>
                            </div>

                            <em>
                              ${department.maturity ||
                              0}%
                            </em>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                `
                : this.emptyState(
                    "لا توجد محافظ تشغيلية مسجلة حالياً."
                  )
            }
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Maturity Levels",
              "النموذج المرجعي لتقييم تطور المحفظة."
            )}

            <div class="maturity-levels-ultimate">
              ${levels
                .map(
                  (item) => `
                    <div
                      class="maturity-level-ultimate ${
                        item.level ===
                        level.level
                          ? "active"
                          : ""
                      }"
                    >
                      <b>
                        ${item.level}
                      </b>

                      <div>
                        <strong>
                          ${this.escapeHtml(
                            item.title
                          )}
                          ·
                          ${this.escapeHtml(
                            item.ar
                          )}
                        </strong>

                        <span>
                          ${this.escapeHtml(
                            item.range
                          )}
                        </span>

                        <p>
                          ${this.escapeHtml(
                            item.desc
                          )}
                        </p>
                      </div>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "Gap Analysis",
            "الفجوة بين الوضع الحالي والمستهدف، مع التوصية التنفيذية."
          )}

          ${
            gaps.length
              ? `
                <div class="maturity-gap-table">
                  <div class="maturity-gap-row maturity-gap-head">
                    <strong>المجال</strong>
                    <strong>الوضع الحالي</strong>
                    <strong>المستهدف</strong>
                    <strong>الفجوة</strong>
                    <strong>الإجراء</strong>
                  </div>

                  ${gaps
                    .map(
                      (gapItem) => `
                        <div class="maturity-gap-row">
                          <span>
                            ${this.escapeHtml(
                              gapItem?.area ||
                              ""
                            )}
                          </span>

                          <span>
                            ${this.escapeHtml(
                              gapItem?.current ||
                              ""
                            )}
                          </span>

                          <span>
                            ${this.escapeHtml(
                              gapItem?.target ||
                              ""
                            )}
                          </span>

                          <span>
                            ${this.escapeHtml(
                              gapItem?.gap ||
                              ""
                            )}
                          </span>

                          <span>
                            ${this.escapeHtml(
                              gapItem?.action ||
                              ""
                            )}
                          </span>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              `
              : this.emptyState(
                  "لا توجد فجوات نضج مسجلة حالياً."
                )
          }
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            `Maturity Roadmap 2026–${targetYear}`,
            "خطة رفع النضج من لوحات القياس إلى التشغيل المدعوم بالذكاء الاصطناعي."
          )}

          <div class="maturity-roadmap-ultimate">
            ${roadmap
              .map(
                (roadmapItem) => `
                  <div>
                    <b>
                      ${this.escapeHtml(
                        roadmapItem.year
                      )}
                    </b>

                    <strong>
                      ${this.escapeHtml(
                        roadmapItem.title
                      )}
                    </strong>

                    <span>
                      ${this.escapeHtml(
                        roadmapItem.desc
                      )}
                    </span>

                    <div class="aiw-progress">
                      <div
                        style="width:${roadmapItem.progress}%"
                      ></div>
                    </div>

                    <small>
                      ${roadmapItem.progress}%
                    </small>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "Executive Recommendations",
              "أولويات تنفيذية لرفع مستوى النضج."
            )}

            ${this.renderExecutiveList(
              recommendations
            )}
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Next Best Actions",
              "الخطوات العملية التالية للإدارة."
            )}

            <div class="maturity-actions">
              ${actions
                .map(
                  (
                    action,
                    index
                  ) => `
                    <div>
                      <b>
                        ${index + 1}
                      </b>

                      <strong>
                        ${this.escapeHtml(
                          action?.title ||
                          ""
                        )}
                      </strong>

                      <span>
                        ${this.escapeHtml(
                          action?.desc ||
                          action?.description ||
                          ""
                        )}
                      </span>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "Executive Biometric Intelligence Summary",
            "الخلاصة النهائية التي يمكن رفعها للإدارة العليا."
          )}

          <div class="maturity-final-summary">
            <strong>
              أصبحت المحفظة جاهزة للانتقال من التحليل التقليدي
              إلى التحليل الذكي القائم على الذكاء الاصطناعي.
            </strong>

            <p>
              المرحلة الحالية تركز على جودة التسجيلات البيومترية،
              تحليل استخدام الصلاحيات، كشف التكرار والتعارض،
              مراقبة أداء البوابات الذكية، ثم الانتقال تدريجياً
              إلى نماذج AI للكشف المبكر عن السلوكيات غير الطبيعية
              ودعم القرار التنفيذي.
            </p>

            <div class="maturity-summary-grid">
              <div>
                <span>Current</span>
                <b>${overall}%</b>
              </div>

              <div>
                <span>Target</span>
                <b>${target}%</b>
              </div>

              <div>
                <span>Gap</span>
                <b>${gap}%</b>
              </div>

              <div>
                <span>Level</span>
                <b>
                  ${this.escapeHtml(
                    level.title
                  )}
                </b>
              </div>
            </div>
          </div>
        </div>

      </section>
    `;

    this.renderCharts(
      dimensions
    );

    this.bindAutomaticSync();
  },

  /* =======================================================
     Analytics and Recommendations
  ======================================================= */

  getAnalyticsMaturityScore() {
    try {
      if (
        window.AIW?.Analytics &&
        typeof window.AIW.Analytics
          .score === "function"
      ) {
        const scores =
          window.AIW.Analytics
            .score();

        const maturityScore =
          Number(
            scores?.maturityScore
          );

        if (
          Number.isFinite(
            maturityScore
          )
        ) {
          return maturityScore;
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Maturity: Analytics maturity score unavailable.",
        error
      );
    }

    return null;
  },

  getAiInsight(
    dimensions,
    overall
  ) {
    try {
      if (
        window.AIW?.AI &&
        typeof window.AIW.AI
          .executiveInsight ===
          "function"
      ) {
        const insight =
          window.AIW.AI
            .executiveInsight({
              dimensions,
              overall
            });

        if (
          insight &&
          typeof insight === "object"
        ) {
          return insight;
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Maturity: AI insight unavailable.",
        error
      );
    }

    const weakest = [
      ...dimensions
    ].sort(
      (first, second) =>
        first.score -
        second.score
    )[0];

    return {
      title:
        overall >= 80
          ? "مستوى نضج متقدم"
          : overall >= 60
            ? "مرحلة نضج مُدارة"
            : "مرحلة بناء النضج المتخصص",

      message:
        weakest
          ? `الأولوية الحالية هي رفع مستوى ${weakest.title} من ${weakest.score}% قبل التوسع في نماذج الذكاء الاصطناعي المتقدمة.`
          : "الأولوية الآن هي بناء خط أساس لجودة التسجيلات والصلاحيات والبوابات الذكية.",

      color:
        overall >= 75
          ? "green"
          : overall >= 40
            ? "orange"
            : "red"
    };
  },

  getRecommendations(
    dimensions,
    overall
  ) {
    try {
      if (
        window.AIW?.Recommendation &&
        typeof window.AIW
          .Recommendation
          .nextActions ===
          "function"
      ) {
        const recommendations =
          window.AIW
            .Recommendation
            .nextActions({
              dimensions,
              overall
            });

        if (
          Array.isArray(
            recommendations
          ) &&
          recommendations.length
        ) {
          return recommendations;
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Maturity: Recommendation engine unavailable.",
        error
      );
    }

    return this.defaultRecommendations(
      dimensions
    );
  },

  defaultRecommendations(
    dimensions = []
  ) {
    const weakest = [
      ...dimensions
    ]
      .sort(
        (first, second) =>
          first.score -
          second.score
      )
      .slice(0, 3);

    const recommendations =
      weakest.map(
        (dimension) =>
          `رفع جاهزية ${dimension.title} من ${dimension.score}% نحو المستهدف ${dimension.target}%.`
      );

    const fallback = [
      "بناء خط أساس واضح لجودة التسجيلات البيومترية والسجلات المتعارضة.",
      "ربط تنبيهات استخدام الصلاحيات والجلسات الطويلة بمراجعة بشرية موثقة.",
      "تشغيل لوحات Power BI للبوابات الذكية قبل تطبيق النماذج التنبؤية.",
      "استكمال السياسات وضوابط الحوكمة قبل أي تكامل تشغيلي متقدم.",
      "ربط كل مشروع بمؤشر أداء ومالك ودورة مراجعة واضحة."
    ];

    fallback.forEach((item) => {
      if (
        recommendations.length < 5
      ) {
        recommendations.push(item);
      }
    });

    return recommendations.slice(
      0,
      5
    );
  },

  /* =======================================================
     Charts
  ======================================================= */

  renderCharts(dimensions) {
    if (!window.AIW?.Charts) {
      return;
    }

    setTimeout(() => {
      const labels =
        dimensions.map(
          (dimension) =>
            dimension.title
        );

      const values =
        dimensions.map(
          (dimension) =>
            dimension.score
        );

      const targets =
        dimensions.map(
          (dimension) =>
            dimension.target
        );

      if (
        typeof window.AIW.Charts
          .radar === "function"
      ) {
        window.AIW.Charts.radar(
          "maturityRadarChart",
          labels,
          values,
          "Current Maturity",
          targets,
          "Target"
        );

        return;
      }

      if (
        typeof window.AIW.Charts
          .bar === "function"
      ) {
        window.AIW.Charts.bar(
          "maturityRadarChart",
          labels,
          values,
          "Maturity Dimensions"
        );
      }
    }, 50);
  },

  /* =======================================================
     Data Helpers
  ======================================================= */

  getDepartments(data) {
    const departments =
      Array.isArray(data.departments)
        ? data.departments
        : [];

    const ideas =
      Array.isArray(data.ideas)
        ? data.ideas
        : [];

    return departments.map(
      (department) => ({
        ...department,

        name:
          department?.name ||
          "محفظة غير مسماة",

        count:
          ideas.filter(
            (idea) =>
              idea?.department ===
              department?.name
          ).length ||
          this.toSafeNumber(
            department?.count,
            0
          ),

        maturity:
          this.normalizePercent(
            department?.maturity,
            0
          )
      })
    );
  },

  getKpis(data) {
    if (
      data.kpiCenter &&
      Array.isArray(
        data.kpiCenter.items
      )
    ) {
      return data.kpiCenter.items;
    }

    return [];
  },

  getKpiProgress(kpi) {
    try {
      if (
        window.AIW?.Modules?.kpis &&
        typeof window.AIW.Modules
          .kpis.progress ===
          "function"
      ) {
        return this.normalizePercent(
          window.AIW.Modules
            .kpis.progress(kpi),
          0
        );
      }
    } catch (error) {
      console.warn(
        "AI Work Maturity: KPI progress calculation failed.",
        error
      );
    }

    const current =
      this.toSafeNumber(
        kpi?.current,
        0
      );

    const target =
      this.toSafeNumber(
        kpi?.target,
        0
      );

    if (target <= 0) {
      return 0;
    }

    if (
      kpi?.direction === "lower"
    ) {
      if (current <= target) {
        return 100;
      }

      return this.normalizePercent(
        (target /
          Math.max(current, 1)) *
          100,
        0
      );
    }

    return this.normalizePercent(
      (current / target) * 100,
      0
    );
  },

  getLevel(
    score,
    levels = this.defaultLevels
  ) {
    const safeScore =
      this.normalizePercent(
        score,
        0
      );

    if (safeScore <= 20) {
      return (
        levels.find(
          (item) =>
            item.level === 1
        ) ||
        this.defaultLevels[0]
      );
    }

    if (safeScore <= 40) {
      return (
        levels.find(
          (item) =>
            item.level === 2
        ) ||
        this.defaultLevels[1]
      );
    }

    if (safeScore <= 60) {
      return (
        levels.find(
          (item) =>
            item.level === 3
        ) ||
        this.defaultLevels[2]
      );
    }

    if (safeScore <= 80) {
      return (
        levels.find(
          (item) =>
            item.level === 4
        ) ||
        this.defaultLevels[3]
      );
    }

    if (safeScore <= 95) {
      return (
        levels.find(
          (item) =>
            item.level === 5
        ) ||
        this.defaultLevels[4]
      );
    }

    return (
      levels.find(
        (item) =>
          item.level === 6
      ) ||
      this.defaultLevels[5]
    );
  },

  rankDepartments(
    departments
  ) {
    return [
      ...departments
    ].sort(
      (first, second) =>
        this.toSafeNumber(
          second?.maturity,
          0
        ) -
        this.toSafeNumber(
          first?.maturity,
          0
        )
    );
  },

  departmentAdvice(name) {
    const advice = {
      "الأنظمة البيومترية":
        "أولوية جودة البيانات",

      "البوابات الذكية":
        "رفع الجاهزية التشغيلية",

      "المستخدمون والصلاحيات":
        "تحليل السلوك والصلاحيات",

      "الأمن الرقمي":
        "توسيع كشف الشذوذ",

      "التحليلات والتقارير التنفيذية":
        "توحيد لوحات القياس"
    };

    return (
      advice[name] ||
      "استكمال القياس والتكامل"
    );
  },

  scoreStatus(score) {
    if (score >= 75) {
      return "متقدم";
    }

    if (score >= 60) {
      return "جيد";
    }

    if (score >= 40) {
      return "قيد البناء";
    }

    return "مبكر";
  },

  heatClass(score) {
    const safeScore =
      this.normalizePercent(
        score,
        0
      );

    if (safeScore >= 75) {
      return "high";
    }

    if (safeScore >= 55) {
      return "good";
    }

    if (safeScore >= 40) {
      return "medium";
    }

    return "low";
  },

  /* =======================================================
     Shared UI
  ======================================================= */

  renderExecutiveList(items) {
    if (
      !Array.isArray(items) ||
      !items.length
    ) {
      return this.emptyState(
        "لا توجد توصيات متاحة حالياً."
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
                    typeof item ===
                      "string"
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
      typeof window.AIW.Widgets
        .kpi === "function"
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
        .sectionTitle ===
        "function"
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

  fallbackHero(overall) {
    return `
      <div class="module-hero">
        <span class="module-kicker">
          Biometric AI Maturity · Readiness
        </span>

        <h1>
          مركز نضج الذكاء الاصطناعي
        </h1>

        <p>
          تقييم تنفيذي لجاهزية محفظة الأنظمة البيومترية والبوابات الذكية.
        </p>

        <div class="aiw-chip-row">
          <span class="aiw-chip">
            🧠 النضج الحالي
            ${overall}%
          </span>
        </div>
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

    const refreshMaturity = () => {
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

      "aiw:maturityChanged",
      "aiw:maturityUpdated",

      "aiw:strategyChanged",
      "aiw:strategyUpdated",

      "aiw:governanceChanged",
      "aiw:governanceUpdated",

      "aiw:kpisChanged",
      "aiw:kpisUpdated",

      "aiw:projectsChanged",
      "aiw:projectsUpdated",

      "aiw:ideasChanged",
      "aiw:ideasUpdated",

      "aiw:reportsChanged",
      "aiw:reportsUpdated",

      "aiw:operationsChanged",
      "aiw:operationsUpdated",

      "aiw:alertsChanged",
      "aiw:alertsUpdated"
    ];

    syncEvents.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          refreshMaturity
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
          refreshMaturity();
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

  toSafeNumber(
    value,
    fallback = 0
  ) {
    const number =
      Number(value);

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

    const number =
      Number(value);

    return Number.isFinite(number)
      ? number
      : null;
  },

  normalizePercent(
    value,
    fallback = 0
  ) {
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
        return structuredClone(
          value
        );
      } catch (error) {
        // JSON fallback below.
      }
    }

    return JSON.parse(
      JSON.stringify(value)
    );
  }
};