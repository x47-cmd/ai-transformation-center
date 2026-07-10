/* =========================================================
   AI Work - Decision Intelligence Center V1.1
   Enterprise Biometric Executive Decision Support

   Updates:
   - Central AIW.Store integration
   - Persistent decision scenarios and criteria
   - Biometric and Smart Gate specialization
   - Dynamic project and business-case ranking
   - Governance, KPI, maturity and risk integration
   - Automatic cross-page synchronization
   - Human-in-the-Loop decision model
   - No UI design changes
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.decision = {
  id: "decision",
  title: "القرار",
  icon: "🧭",

  _container: null,
  _syncBound: false,
  _seedChecked: false,

  /* =======================================================
     Default Decision Scenarios
  ======================================================= */

  defaultScenarios: [
    {
      id: 1,
      title: "البدء بلوحات القياس التشغيلية",
      impact: 88,
      risk: 18,
      cost: 24,
      speed: 94,
      readiness: 90,
      governance: 92,
      recommendation: "ابدأ فوراً",
      status: "recommended",
      linkedModules: [
        "kpis",
        "reports",
        "projects"
      ]
    },
    {
      id: 2,
      title: "إطلاق Quick Wins البيومترية",
      impact: 90,
      risk: 26,
      cost: 32,
      speed: 88,
      readiness: 86,
      governance: 84,
      recommendation: "مناسب للموجة الأولى",
      status: "recommended",
      linkedModules: [
        "projects",
        "business",
        "governance"
      ]
    },
    {
      id: 3,
      title: "تفعيل تحليل الصلاحيات والجلسات",
      impact: 86,
      risk: 38,
      cost: 40,
      speed: 78,
      readiness: 76,
      governance: 82,
      recommendation: "ابدأ بعد اعتماد الضوابط",
      status: "conditional",
      linkedModules: [
        "governance",
        "kpis",
        "automation"
      ]
    },
    {
      id: 4,
      title: "تشغيل محرك سلامة البيانات البيومترية",
      impact: 94,
      risk: 52,
      cost: 62,
      speed: 58,
      readiness: 72,
      governance: 78,
      recommendation: "قرار استراتيجي مرحلي",
      status: "strategic",
      linkedModules: [
        "projects",
        "business",
        "maturity"
      ]
    },
    {
      id: 5,
      title: "إطلاق الصيانة التنبؤية للبوابات",
      impact: 92,
      risk: 64,
      cost: 74,
      speed: 44,
      readiness: 52,
      governance: 74,
      recommendation: "يؤجل حتى اكتمال البيانات",
      status: "deferred",
      linkedModules: [
        "projects",
        "business",
        "maturity"
      ]
    }
  ],

  defaultCriteria: [
    {
      id: 1,
      title: "الأثر التشغيلي والاستراتيجي",
      desc: "مدى تأثير القرار على جودة التسجيلات، البوابات الذكية، الصلاحيات، والأمن الرقمي.",
      weight: 25
    },
    {
      id: 2,
      title: "القيمة التشغيلية والاستثمارية",
      desc: "القيمة المتوقعة مقارنة بالتكلفة والموارد المطلوبة.",
      weight: 20
    },
    {
      id: 3,
      title: "المخاطر والحوكمة",
      desc: "الخصوصية، الأمن، جودة البيانات، الإشراف البشري، وقابلية التحكم بالمخاطر.",
      weight: 20
    },
    {
      id: 4,
      title: "سرعة التنفيذ",
      desc: "إمكانية تحقيق أثر قابل للقياس خلال 90–180 يوماً.",
      weight: 15
    },
    {
      id: 5,
      title: "جاهزية البيانات والأنظمة",
      desc: "توفر البيانات، جودتها، قابلية الربط، وجاهزية البنية التقنية.",
      weight: 10
    },
    {
      id: 6,
      title: "الجاهزية المؤسسية",
      desc: "توفر المالك، الحوكمة، المؤشرات، القدرة التشغيلية، وقبول التغيير.",
      weight: 10
    }
  ],

  defaultAnalysisScenarios: [
    {
      id: 1,
      icon: "🚀",
      title: "سيناريو سريع",
      desc: "البدء بلوحات القياس والمشاريع منخفضة التكلفة لإثبات القيمة خلال أول 90 يوماً.",
      status: "مفضل الآن",
      tone: "green"
    },
    {
      id: 2,
      icon: "📈",
      title: "سيناريو متوازن",
      desc: "Quick Wins مع مشروع استراتيجي واحد مثل سلامة البيانات أو تحليل الصلاحيات.",
      status: "مناسب بعد الحوكمة",
      tone: "orange"
    },
    {
      id: 3,
      icon: "🏛️",
      title: "سيناريو استراتيجي",
      desc: "البدء بالمحركات المتقدمة والصيانة التنبؤية والمنصة التنفيذية الموحدة.",
      status: "يحتاج نضج بيانات",
      tone: "red"
    }
  ],

  defaultTimeline: [
    {
      id: 1,
      title: "اعتماد Quick Wins",
      period: "الأسبوع 1"
    },
    {
      id: 2,
      title: "اعتماد الحوكمة والمالكين",
      period: "الأسبوع 2–4"
    },
    {
      id: 3,
      title: "ربط المؤشرات وخط الأساس",
      period: "الشهر 2"
    },
    {
      id: 4,
      title: "قياس الأثر التشغيلي",
      period: "الشهر 3"
    },
    {
      id: 5,
      title: "قرار التوسع أو التعديل",
      period: "نهاية الربع"
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
        "AI Work Decision: Unable to read shared data.",
        error
      );

      return window.AIW?.Data || {};
    }
  },

  /* =======================================================
     Decision Center Initialization
  ======================================================= */

  ensureDecisionSeeded() {
    if (this._seedChecked) return;

    this._seedChecked = true;

    const data = this.getSharedData();

    const hasDecisionCenter =
      data.decisionCenter &&
      typeof data.decisionCenter === "object" &&
      Array.isArray(data.decisionCenter.scenarios);

    if (hasDecisionCenter) {
      return;
    }

    const now = new Date().toISOString();

    const decisionCenter = {
      scenarios: this.clone(
        this.defaultScenarios
      ),

      criteria: this.clone(
        this.defaultCriteria
      ),

      analysisScenarios: this.clone(
        this.defaultAnalysisScenarios
      ),

      timeline: this.clone(
        this.defaultTimeline
      ),

      settings: {
        decisionMode: "AI Assisted",
        humanApprovalRequired: true,
        topProjectsLimit: 5,
        minimumDecisionScore: 60,
        reviewCycle: "ربع سنوي"
      },

      briefing: {
        title:
          "إطلاق موجة Quick Wins البيومترية مع حوكمة ومؤشرات أداء واضحة",

        description:
          "أفضل قرار تنفيذي في المرحلة الحالية هو البدء بلوحات جودة التسجيلات، أخطاء التسجيل، استخدام الصلاحيات، والجلسات الطويلة، بالتوازي مع اعتماد الحوكمة وربط كل مشروع بمؤشر أداء وقيمة تشغيلية متوقعة."
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
        "decisionCenter",
        decisionCenter,
        {
          event: "aiw:decisionUpdated"
        }
      );

      return;
    }

    if (window.AIW?.Data) {
      window.AIW.Data.decisionCenter =
        decisionCenter;
    }
  },

  getDecisionCenter() {
    const data = this.getSharedData();

    const source =
      data.decisionCenter &&
      typeof data.decisionCenter === "object"
        ? data.decisionCenter
        : {};

    return {
      scenarios: Array.isArray(source.scenarios)
        ? source.scenarios
            .map((scenario, index) =>
              this.normalizeScenario(
                scenario,
                index
              )
            )
            .filter(Boolean)
        : this.clone(this.defaultScenarios),

      criteria: Array.isArray(source.criteria)
        ? source.criteria
            .map((criterion, index) =>
              this.normalizeCriterion(
                criterion,
                index
              )
            )
            .filter(Boolean)
        : this.clone(this.defaultCriteria),

      analysisScenarios: Array.isArray(
        source.analysisScenarios
      )
        ? source.analysisScenarios
        : this.clone(
            this.defaultAnalysisScenarios
          ),

      timeline: Array.isArray(source.timeline)
        ? source.timeline
        : this.clone(this.defaultTimeline),

      settings: {
        decisionMode:
          source.settings?.decisionMode ||
          "AI Assisted",

        humanApprovalRequired:
          source.settings?.humanApprovalRequired !==
          false,

        topProjectsLimit:
          Math.max(
            1,
            this.toSafeNumber(
              source.settings?.topProjectsLimit,
              5
            )
          ),

        minimumDecisionScore:
          this.normalizePercent(
            source.settings?.minimumDecisionScore,
            60
          ),

        reviewCycle:
          source.settings?.reviewCycle ||
          "ربع سنوي"
      },

      briefing: {
        title:
          source.briefing?.title ||
          "إطلاق موجة Quick Wins البيومترية مع حوكمة ومؤشرات أداء واضحة",

        description:
          source.briefing?.description ||
          "أفضل قرار تنفيذي هو البدء بالمشاريع سريعة القياس بالتوازي مع اعتماد الحوكمة والمؤشرات."
      },

      meta: {
        createdAt:
          source.meta?.createdAt || null,

        updatedAt:
          source.meta?.updatedAt || null
      }
    };
  },

  normalizeScenario(scenario, index = 0) {
    if (
      !scenario ||
      typeof scenario !== "object"
    ) {
      return null;
    }

    return {
      ...scenario,

      id:
        scenario.id ??
        index + 1,

      title:
        scenario.title ||
        "سيناريو غير مسمى",

      impact:
        this.normalizePercent(
          scenario.impact,
          0
        ),

      risk:
        this.normalizePercent(
          scenario.risk,
          0
        ),

      cost:
        this.normalizePercent(
          scenario.cost,
          0
        ),

      speed:
        this.normalizePercent(
          scenario.speed,
          0
        ),

      readiness:
        this.normalizePercent(
          scenario.readiness,
          50
        ),

      governance:
        this.normalizePercent(
          scenario.governance,
          50
        ),

      recommendation:
        scenario.recommendation ||
        "قيد التقييم",

      status:
        scenario.status ||
        "proposed",

      linkedModules:
        Array.isArray(
          scenario.linkedModules
        )
          ? scenario.linkedModules
          : []
    };
  },

  normalizeCriterion(criterion, index = 0) {
    if (Array.isArray(criterion)) {
      return {
        id: index + 1,
        title:
          criterion[0] ||
          "معيار غير مسمى",
        desc: criterion[1] || "",
        weight: 0
      };
    }

    if (
      !criterion ||
      typeof criterion !== "object"
    ) {
      return null;
    }

    return {
      id:
        criterion.id ??
        index + 1,

      title:
        criterion.title ||
        "معيار غير مسمى",

      desc:
        criterion.desc ||
        criterion.description ||
        "",

      weight:
        this.normalizePercent(
          criterion.weight,
          0
        )
    };
  },

  /* =======================================================
     Decision Center Updates
  ======================================================= */

  updateDecisionCenter(changes = {}) {
    if (
      !changes ||
      typeof changes !== "object"
    ) {
      return false;
    }

    const current =
      this.getDecisionCenter();

    const updated = {
      ...current,
      ...changes,

      settings: {
        ...current.settings,
        ...(changes.settings || {})
      },

      briefing: {
        ...current.briefing,
        ...(changes.briefing || {})
      },

      meta: {
        ...current.meta,
        updatedAt:
          new Date().toISOString()
      }
    };

    if (
      window.AIW?.Store &&
      typeof window.AIW.Store.update === "function"
    ) {
      return window.AIW.Store.update(
        "decisionCenter",
        updated,
        {
          event: "aiw:decisionUpdated"
        }
      );
    }

    if (window.AIW?.Data) {
      window.AIW.Data.decisionCenter =
        updated;

      window.dispatchEvent(
        new CustomEvent(
          "aiw:decisionUpdated",
          {
            detail: {
              decisionCenter: updated
            }
          }
        )
      );

      return true;
    }

    return false;
  },

  addScenario(scenario = {}) {
    const center =
      this.getDecisionCenter();

    const scenarios = [
      ...center.scenarios
    ];

    const now =
      new Date().toISOString();

    const newScenario =
      this.normalizeScenario(
        {
          id:
            this.getNextId(
              scenarios
            ),

          title:
            scenario.title ||
            "سيناريو قرار جديد",

          impact:
            scenario.impact ?? 50,

          risk:
            scenario.risk ?? 50,

          cost:
            scenario.cost ?? 50,

          speed:
            scenario.speed ?? 50,

          readiness:
            scenario.readiness ?? 50,

          governance:
            scenario.governance ?? 50,

          recommendation:
            scenario.recommendation ||
            "قيد التقييم",

          status:
            scenario.status ||
            "proposed",

          linkedModules:
            Array.isArray(
              scenario.linkedModules
            )
              ? scenario.linkedModules
              : [],

          createdAt: now,
          updatedAt: now
        },
        scenarios.length
      );

    scenarios.push(newScenario);

    this.updateDecisionCenter({
      scenarios
    });

    return newScenario;
  },

  updateScenario(id, changes = {}) {
    const center =
      this.getDecisionCenter();

    const scenarioIndex =
      center.scenarios.findIndex(
        (scenario) =>
          String(scenario.id) ===
          String(id)
      );

    if (scenarioIndex === -1) {
      return false;
    }

    const scenarios =
      center.scenarios.map(
        (scenario, index) => {
          if (
            index !== scenarioIndex
          ) {
            return scenario;
          }

          return this.normalizeScenario(
            {
              ...scenario,
              ...changes,
              id: scenario.id,
              updatedAt:
                new Date().toISOString()
            },
            index
          );
        }
      );

    this.updateDecisionCenter({
      scenarios
    });

    return scenarios[
      scenarioIndex
    ];
  },

  removeScenario(id) {
    const center =
      this.getDecisionCenter();

    const removedScenario =
      center.scenarios.find(
        (scenario) =>
          String(scenario.id) ===
          String(id)
      );

    if (!removedScenario) {
      return false;
    }

    const scenarios =
      center.scenarios.filter(
        (scenario) =>
          String(scenario.id) !==
          String(id)
      );

    this.updateDecisionCenter({
      scenarios
    });

    return removedScenario;
  },

  /* =======================================================
     Decision Calculations
  ======================================================= */

  decisionScore(scenario) {
    const impact =
      this.normalizePercent(
        scenario?.impact,
        0
      );

    const risk =
      this.normalizePercent(
        scenario?.risk,
        0
      );

    const cost =
      this.normalizePercent(
        scenario?.cost,
        0
      );

    const speed =
      this.normalizePercent(
        scenario?.speed,
        0
      );

    const readiness =
      this.normalizePercent(
        scenario?.readiness,
        50
      );

    const governance =
      this.normalizePercent(
        scenario?.governance,
        50
      );

    return this.normalizePercent(
      impact * 0.28 +
      (100 - risk) * 0.18 +
      (100 - cost) * 0.14 +
      speed * 0.16 +
      readiness * 0.12 +
      governance * 0.12,
      0
    );
  },

  bestScenario(scenarios = []) {
    if (
      !Array.isArray(scenarios) ||
      !scenarios.length
    ) {
      return {
        title: "لا يوجد سيناريو",
        impact: 0,
        risk: 0,
        cost: 0,
        speed: 0,
        readiness: 0,
        governance: 0,
        recommendation: "قيد التقييم"
      };
    }

    return scenarios
      .slice()
      .sort(
        (first, second) =>
          this.decisionScore(second) -
          this.decisionScore(first)
      )[0];
  },

  /* =======================================================
     Shared Module Scores
  ======================================================= */

  getScores() {
    const data =
      this.getSharedData();

    let analyticsScores = {};

    try {
      if (
        window.AIW?.Analytics &&
        typeof window.AIW.Analytics
          .score === "function"
      ) {
        analyticsScores =
          window.AIW.Analytics.score() ||
          {};
      }
    } catch (error) {
      console.warn(
        "AI Work Decision: Analytics score unavailable.",
        error
      );
    }

    const projectScore =
      this.calculateProjectScore(
        data
      );

    const riskScore =
      this.calculateRiskScore(
        data
      );

    const governanceScore =
      this.calculateGovernanceScore(
        data
      );

    const maturityScore =
      this.calculateMaturityScore(
        data
      );

    const kpiScore =
      this.calculateKpiScore(
        data
      );

    const fallbackExecutive =
      this.average([
        projectScore,
        riskScore,
        governanceScore,
        maturityScore,
        kpiScore
      ]);

    return {
      executiveScore:
        this.normalizePercent(
          analyticsScores
            .executiveScore,
          fallbackExecutive
        ),

      portfolioScore:
        this.normalizePercent(
          analyticsScores
            .portfolioScore,
          projectScore
        ),

      riskScore:
        this.normalizePercent(
          analyticsScores.riskScore,
          riskScore
        ),

      governanceScore:
        this.normalizePercent(
          analyticsScores
            .governanceScore,
          governanceScore
        ),

      maturityScore:
        this.normalizePercent(
          analyticsScores
            .maturityScore,
          maturityScore
        ),

      kpiScore
    };
  },

  calculateProjectScore(data) {
    const projects =
      Array.isArray(data.projects)
        ? data.projects
        : [];

    if (!projects.length) {
      return this.normalizePercent(
        data.summary
          ?.portfolioHealth,
        68
      );
    }

    return this.average(
      projects.map((project) =>
        this.normalizePercent(
          project?.progress ??
          project?.readiness ??
          project?.score,
          0
        )
      )
    );
  },

  calculateRiskScore(data) {
    const risks =
      data.governanceCenter &&
      Array.isArray(
        data.governanceCenter.risks
      )
        ? data.governanceCenter.risks
        : Array.isArray(data.risks)
          ? data.risks
          : [];

    if (!risks.length) {
      return 100;
    }

    const penalty =
      risks.reduce(
        (total, risk) => {
          const level =
            String(
              risk?.level ??
              risk?.[1] ??
              ""
            )
              .trim()
              .toLowerCase();

          const status =
            String(
              risk?.status || ""
            )
              .trim()
              .toLowerCase();

          if (
            [
              "resolved",
              "closed",
              "مغلق",
              "تم الحل"
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

  calculateGovernanceScore(data) {
    try {
      if (
        window.AIW?.Modules
          ?.governance &&
        typeof window.AIW.Modules
          .governance.getMetrics ===
          "function" &&
        data.governanceCenter
      ) {
        return this.normalizePercent(
          window.AIW.Modules
            .governance.getMetrics(
              data.governanceCenter
            ).governanceScore,
          0
        );
      }
    } catch (error) {
      console.warn(
        "AI Work Decision: Governance score failed.",
        error
      );
    }

    const controls =
      Array.isArray(data.governance)
        ? data.governance.length
        : 0;

    return controls
      ? this.normalizePercent(
          55 + controls * 5,
          85
        )
      : 0;
  },

  calculateMaturityScore(data) {
    try {
      if (
        window.AIW?.Modules
          ?.maturity &&
        typeof window.AIW.Modules
          .maturity
          .getAnalyticsMaturityScore ===
          "function"
      ) {
        const score =
          window.AIW.Modules
            .maturity
            .getAnalyticsMaturityScore();

        if (score !== null) {
          return this.normalizePercent(
            score,
            0
          );
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Decision: Maturity score failed.",
        error
      );
    }

    return this.normalizePercent(
      data.summary?.maturityScore,
      34
    );
  },

  calculateKpiScore(data) {
    const kpis =
      data.kpiCenter &&
      Array.isArray(
        data.kpiCenter.items
      )
        ? data.kpiCenter.items
        : [];

    if (!kpis.length) {
      return 0;
    }

    return this.average(
      kpis.map((kpi) =>
        this.getKpiProgress(kpi)
      )
    );
  },

  getKpiProgress(kpi) {
    try {
      if (
        window.AIW?.Modules?.kpis &&
        typeof window.AIW.Modules
          .kpis.progress === "function"
      ) {
        return this.normalizePercent(
          window.AIW.Modules
            .kpis.progress(kpi),
          0
        );
      }
    } catch (error) {
      console.warn(
        "AI Work Decision: KPI progress failed.",
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

    if (kpi?.direction === "lower") {
      if (current <= target) {
        return 100;
      }

      return this.normalizePercent(
        (
          target /
          Math.max(current, 1)
        ) * 100,
        0
      );
    }

    return this.normalizePercent(
      (
        current /
        target
      ) * 100,
      0
    );
  },

  /* =======================================================
     Recommended Projects
  ======================================================= */

  getTopProjects(limit = 5) {
    const data =
      this.getSharedData();

    const projects =
      Array.isArray(data.projects)
        ? data.projects
        : [];

    const ideas =
      Array.isArray(data.ideas)
        ? data.ideas
        : [];

    const businessCases =
      data.businessCenter &&
      Array.isArray(
        data.businessCenter.cases
      )
        ? data.businessCenter.cases
        : [];

    const candidates =
      projects.map(
        (project, index) => {
          const linkedIdea =
            ideas.find(
              (idea) =>
                idea?.title ===
                  project?.englishTitle ||
                idea?.title ===
                  project?.title
            );

          const linkedCase =
            businessCases.find(
              (businessCase) =>
                String(
                  businessCase
                    ?.projectId
                ) ===
                  String(
                    project?.id
                  ) ||
                businessCase
                  ?.englishTitle ===
                  project?.englishTitle
            );

          const projectScore =
            this.normalizePercent(
              project?.progress ??
              project?.readiness,
              0
            );

          const ideaScore =
            this.normalizePercent(
              linkedIdea
                ?.decisionScore,
              this.priorityScore(
                linkedIdea
                  ?.priority ||
                project?.priority
              )
            );

          const caseScore =
            linkedCase
              ? this.businessCaseScore(
                  linkedCase
                )
              : projectScore;

          const finalScore =
            this.average([
              projectScore,
              ideaScore,
              caseScore
            ]);

          return {
            id:
              project?.id ??
              index + 1,

            title:
              project?.title ||
              project?.englishTitle ||
              "مشروع غير مسمى",

            department:
              project?.department ||
              linkedIdea
                ?.department ||
              "غير مصنف",

            priority:
              project?.priority ||
              linkedIdea
                ?.priority ||
              "متوسطة",

            score: finalScore
          };
        }
      );

    if (!candidates.length) {
      return this.fallbackProjects();
    }

    return candidates
      .sort(
        (first, second) =>
          second.score -
          first.score
      )
      .slice(0, limit);
  },

  businessCaseScore(item) {
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

    const readiness =
      this.normalizePercent(
        item?.readiness,
        0
      );

    const roi =
      cost > 0
        ? this.normalizePercent(
            (
              (value - cost) /
              cost
            ) * 100,
            0
          )
        : 0;

    return this.average([
      readiness,
      roi
    ]);
  },

  priorityScore(priority) {
    const value =
      String(priority || "")
        .trim()
        .toLowerCase();

    if (
      value === "عالية" ||
      value === "عالي" ||
      value === "high" ||
      value === "critical"
    ) {
      return 85;
    }

    if (
      value === "متوسطة" ||
      value === "متوسط" ||
      value === "medium"
    ) {
      return 65;
    }

    return 45;
  },

  fallbackProjects() {
    return [
      {
        title:
          "لوحة ذكاء أخطاء التسجيل",
        department:
          "التحليلات والتقارير التنفيذية",
        priority: "عالية",
        score: 92
      },
      {
        title:
          "مراقبة جودة التسجيلات البيومترية",
        department:
          "الأنظمة البيومترية",
        priority: "عالية",
        score: 89
      },
      {
        title:
          "تحليل استخدام الصلاحيات",
        department:
          "المستخدمون والصلاحيات",
        priority: "عالية",
        score: 86
      },
      {
        title:
          "لوحة العمليات البيومترية بالمطارات",
        department:
          "التحليلات والتقارير التنفيذية",
        priority: "عالية",
        score: 84
      },
      {
        title:
          "كشف الجلسات الطويلة غير الطبيعية",
        department:
          "المستخدمون والصلاحيات",
        priority: "عالية",
        score: 82
      }
    ];
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
        "AI Work Decision: AI report unavailable.",
        error
      );
    }

    return {
      status:
        "ابدأ بالمشاريع سريعة القياس ثم توسع تدريجياً",

      message:
        "أفضل مسار حالي هو تشغيل لوحات جودة التسجيلات والصلاحيات والبوابات، مع تفعيل الحوكمة وربط كل مشروع بمؤشر أداء قبل المحركات التنبؤية الكبرى."
    };
  },

  getExternalDecision() {
    try {
      if (
        window.AIW?.Decision &&
        typeof window.AIW.Decision
          .executiveDecision ===
          "function"
      ) {
        const decision =
          window.AIW.Decision
            .executiveDecision();

        if (
          decision &&
          typeof decision === "object"
        ) {
          return decision;
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Decision: Decision engine unavailable.",
        error
      );
    }

    return {};
  },

  getNextActions(context) {
    try {
      if (
        window.AIW?.Recommendation &&
        typeof window.AIW
          .Recommendation
          .nextActions ===
          "function"
      ) {
        const actions =
          window.AIW
            .Recommendation
            .nextActions(context);

        if (
          Array.isArray(actions) &&
          actions.length
        ) {
          return actions;
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Decision: Recommendation engine unavailable.",
        error
      );
    }

    return [
      "اعتماد ثلاث مبادرات Quick Wins للبدء ضمن الموجة الأولى.",
      "تحديد المالك التنفيذي ومؤشر الأداء وخط الأساس لكل مشروع.",
      "اعتماد ضوابط المراجعة البشرية والخصوصية قبل تشغيل التنبيهات.",
      "ربط المشاريع السريعة بلوحات Power BI وتقارير شهرية.",
      "إعادة تقييم قرار التوسع بعد أول دورة قياس تشغيلية."
    ];
  },

  /* =======================================================
     Main Render
  ======================================================= */

  render(container) {
    if (!container) return;

    this._container = container;

    this.ensureDecisionSeeded();

    const W =
      window.AIW?.Widgets;

    const center =
      this.getDecisionCenter();

    const scenarios =
      center.scenarios.filter(
        (scenario) =>
          this.isActiveStatus(
            scenario.status
          )
      );

    const criteria =
      center.criteria;

    const scores =
      this.getScores();

    const bestScenario =
      this.bestScenario(
        scenarios
      );

    const bestScenarioScore =
      this.decisionScore(
        bestScenario
      );

    const externalDecision =
      this.getExternalDecision();

    const generatedProjects =
      this.getTopProjects(
        center.settings
          .topProjectsLimit
      );

    const externalProjects =
      Array.isArray(
        externalDecision
          ?.topProjects
      )
        ? externalDecision
            .topProjects
        : [];

    const topProjects =
      externalProjects.length
        ? externalProjects
        : generatedProjects;

    const aiReport =
      this.getAiReport({
        scores,
        scenarios,
        bestScenario,
        topProjects
      });

    const nextActions =
      this.getNextActions({
        scores,
        scenarios,
        bestScenario,
        topProjects
      });

    container.innerHTML = `
      <section class="module-page">

        ${
          W?.hero
            ? W.hero({
                kicker:
                  "Decision Intelligence · DSS",

                title:
                  "مركز القرار التنفيذي",

                description:
                  "مركز ذكي لدعم القرار التنفيذي يربط الاستراتيجية، المشاريع، الجدوى، المخاطر، النضج، الحوكمة، والمؤشرات في توصيات قابلة للتنفيذ.",

                chips: [
                  "🧭 Decision Support",
                  `📊 Executive Score ${scores.executiveScore}%`,
                  `🚀 ${topProjects.length} مشاريع مرشحة`,
                  `✅ أفضل خيار: ${bestScenario.recommendation}`
                ]
              })
            : this.fallbackHero()
        }

        <div class="module-grid">
          ${this.kpi(
            "Executive Score",
            `${scores.executiveScore}%`,
            "Overall Readiness"
          )}

          ${this.kpi(
            "Portfolio Health",
            `${scores.portfolioScore}%`,
            "Portfolio"
          )}

          ${this.kpi(
            "Risk Score",
            `${scores.riskScore}%`,
            "Risk Position"
          )}

          ${this.kpi(
            "Governance",
            `${scores.governanceScore}%`,
            "Controls"
          )}

          ${this.kpi(
            "أفضل سيناريو",
            bestScenario.title,
            bestScenario.recommendation
          )}

          ${this.kpi(
            "Decision Mode",
            center.settings
              .decisionMode,
            center.settings
              .humanApprovalRequired
              ? "Human-in-the-Loop"
              : "Advisory"
          )}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "الخلاصة التنفيذية للقرار",
              "التوصية الأعلى للإدارة بناءً على الأثر، المخاطر، التكلفة، والجاهزية."
            )}

            <div class="decision-summary-card">
              <strong>
                ${this.escapeHtml(
                  aiReport.status ||
                  "ابدأ بالمشاريع السريعة ثم توسع تدريجياً"
                )}
              </strong>

              <p>
                ${this.escapeHtml(
                  aiReport.message ||
                  "أفضل مسار حالي هو البدء بمشاريع Quick Wins لإثبات القيمة، مع تفعيل الحوكمة والمؤشرات قبل المشاريع الاستراتيجية الكبرى."
                )}
              </p>

              <div class="decision-summary-strip">
                <div>
                  <span>Impact</span>
                  <b>
                    ${bestScenario.impact}%
                  </b>
                </div>

                <div>
                  <span>Risk</span>
                  <b>
                    ${bestScenario.risk}%
                  </b>
                </div>

                <div>
                  <span>Cost</span>
                  <b>
                    ${bestScenario.cost}%
                  </b>
                </div>

                <div>
                  <span>Speed</span>
                  <b>
                    ${bestScenario.speed}%
                  </b>
                </div>
              </div>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Recommended Next Decision",
              "القرار المقترح الآن."
            )}

            <div class="decision-next-card">
              <strong>
                ${this.escapeHtml(
                  bestScenario.title
                )}
              </strong>

              <p>
                ${this.escapeHtml(
                  bestScenario
                    .recommendation
                )}
              </p>

              <div class="aiw-progress">
                <div
                  style="width:${bestScenarioScore}%"
                ></div>
              </div>

              <small>
                Decision Score:
                ${bestScenarioScore}%
              </small>

              <button
                class="module-btn secondary"
                data-module="business"
              >
                فتح الجدوى
              </button>
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "Decision Priority Matrix",
            "مقارنة السيناريوهات حسب الأثر والمخاطر والتكلفة والسرعة."
          )}

          ${
            scenarios.length
              ? `
                <div class="decision-scenario-grid">
                  ${scenarios
                    .map((scenario) =>
                      this.scenarioCard(
                        scenario
                      )
                    )
                    .join("")}
                </div>
              `
              : this.emptyState(
                  "لا توجد سيناريوهات قرار مسجلة حالياً."
                )
          }
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "Top Recommended Projects",
              "أفضل المشاريع المقترحة من محرك القرار."
            )}

            ${
              topProjects.length
                ? `
                  <div class="decision-project-list">
                    ${topProjects
                      .map(
                        (
                          project,
                          index
                        ) => `
                          <div class="decision-project-item">
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
                                  project
                                    ?.title ||
                                  "مشروع غير مسمى"
                                )}
                              </strong>

                              <span>
                                ${this.escapeHtml(
                                  project
                                    ?.department ||
                                  "غير مصنف"
                                )}
                                ·
                                ${this.escapeHtml(
                                  project
                                    ?.priority ||
                                  "متوسطة"
                                )}
                              </span>
                            </div>

                            <em>
                              ${this.normalizePercent(
                                project?.score,
                                80
                              )}%
                            </em>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                `
                : this.emptyState(
                    "لا توجد مشاريع مرشحة حالياً."
                  )
            }
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Decision Criteria",
              "المعايير المستخدمة لدعم القرار."
            )}

            <div class="decision-criteria-list">
              ${criteria
                .map(
                  (
                    criterion,
                    index
                  ) => `
                    <div>
                      <b>
                        ${String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </b>

                      <strong>
                        ${this.escapeHtml(
                          criterion.title
                        )}
                      </strong>

                      <span>
                        ${this.escapeHtml(
                          criterion.desc
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
            "Scenario Analysis",
            "تحليل السيناريوهات المحتملة قبل الاعتماد."
          )}

          <div class="decision-analysis-grid">
            ${center.analysisScenarios
              .map(
                (scenario) => `
                  <div>
                    <strong>
                      ${this.escapeHtml(
                        scenario.icon ||
                        "🧭"
                      )}
                      ${this.escapeHtml(
                        scenario.title ||
                        ""
                      )}
                    </strong>

                    <p>
                      ${this.escapeHtml(
                        scenario.desc ||
                        scenario.description ||
                        ""
                      )}
                    </p>

                    <span
                      class="aiw-status ${this.escapeAttribute(
                        scenario.tone ||
                        "orange"
                      )}"
                    >
                      ${this.escapeHtml(
                        scenario.status ||
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
              "Executive Actions",
              "الخطوات التنفيذية التالية."
            )}

            ${this.renderExecutiveList(
              nextActions
            )}
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Decision Timeline",
              "تسلسل القرار المقترح."
            )}

            <div class="decision-timeline">
              ${center.timeline
                .map(
                  (
                    timelineItem,
                    index
                  ) => `
                    <div>
                      <b>
                        ${index + 1}
                      </b>

                      <strong>
                        ${this.escapeHtml(
                          timelineItem
                            ?.title ||
                          ""
                        )}
                      </strong>

                      <span>
                        ${this.escapeHtml(
                          timelineItem
                            ?.period ||
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
            "AI Executive Briefing",
            "صياغة مختصرة قابلة للرفع للإدارة العليا."
          )}

          <div class="decision-briefing">
            <strong>
              التوصية:
              ${this.escapeHtml(
                center.briefing.title
              )}
            </strong>

            <p>
              ${this.escapeHtml(
                center.briefing
                  .description
              )}
            </p>

            <div class="aiw-chip-row">
              <span class="aiw-chip">
                قرار منخفض المخاطر
              </span>

              <span class="aiw-chip">
                أثر سريع
              </span>

              <span class="aiw-chip">
                إشراف بشري
              </span>
            </div>
          </div>
        </div>

      </section>
    `;

    this.bindAutomaticSync();
  },

  /* =======================================================
     Scenario Card
  ======================================================= */

  scenarioCard(scenario) {
    const score =
      this.decisionScore(
        scenario
      );

    return `
      <article
        class="decision-scenario-card ${
          score >= 75
            ? "green"
            : score >= 55
              ? "orange"
              : "red"
        }"
        data-scenario-id="${this.escapeAttribute(
          scenario.id
        )}"
      >
        <div class="decision-scenario-head">
          <strong>
            ${this.escapeHtml(
              scenario.title
            )}
          </strong>

          <b>
            ${score}%
          </b>
        </div>

        <p>
          ${this.escapeHtml(
            scenario.recommendation
          )}
        </p>

        <div class="decision-metrics">
          <span>
            الأثر
            ${scenario.impact}%
          </span>

          <span>
            المخاطر
            ${scenario.risk}%
          </span>

          <span>
            التكلفة
            ${scenario.cost}%
          </span>

          <span>
            السرعة
            ${scenario.speed}%
          </span>
        </div>

        <div class="aiw-progress">
          <div
            style="width:${score}%"
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
        "لا توجد إجراءات تنفيذية متاحة حالياً."
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
          Decision Intelligence · DSS
        </span>

        <h1>
          مركز القرار التنفيذي
        </h1>

        <p>
          مركز ذكي لدعم القرار التنفيذي وربط الاستراتيجية بالمشاريع والمخاطر والنتائج.
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

  isActiveStatus(status) {
    if (
      status === undefined ||
      status === null ||
      status === ""
    ) {
      return true;
    }

    const value =
      String(status)
        .trim()
        .toLowerCase();

    return ![
      "inactive",
      "archived",
      "cancelled",
      "rejected",
      "مؤرشف",
      "ملغي",
      "مرفوض"
    ].includes(value);
  },

  /* =======================================================
     Automatic Synchronization
  ======================================================= */

  bindAutomaticSync() {
    if (this._syncBound) return;

    this._syncBound = true;

    const refreshDecision = () => {
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

      "aiw:decisionChanged",
      "aiw:decisionUpdated",

      "aiw:ideasChanged",
      "aiw:ideasUpdated",

      "aiw:projectsChanged",
      "aiw:projectsUpdated",

      "aiw:businessChanged",
      "aiw:businessUpdated",

      "aiw:kpisChanged",
      "aiw:kpisUpdated",

      "aiw:governanceChanged",
      "aiw:governanceUpdated",

      "aiw:maturityChanged",
      "aiw:maturityUpdated",

      "aiw:reportsChanged",
      "aiw:reportsUpdated",

      "aiw:risksChanged",
      "aiw:risksUpdated",

      "aiw:alertsChanged",
      "aiw:alertsUpdated"
    ];

    syncEvents.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          refreshDecision
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
          refreshDecision();
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

  getNextId(items = []) {
    if (!Array.isArray(items)) {
      return 1;
    }

    const ids =
      items
        .map((item) =>
          this.toSafeNumber(
            item?.id,
            0
          )
        )
        .filter(
          (id) => id > 0
        );

    return ids.length
      ? Math.max(...ids) + 1
      : 1;
  },

  toSafeNumber(value, fallback = 0) {
    const number =
      Number(value);

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