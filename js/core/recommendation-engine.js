/* =========================================================
   AI Work - Recommendation Engine V2.1
   Enterprise Recommendation Intelligence

   Scope:
   - AIW.Store Integration
   - AIW.Analytics Integration
   - AIW.AIEngine Integration
   - AIW.DecisionEngine Integration
   - Context-Aware Recommendations
   - Executive Prioritization
   - Project Recommendations
   - Opportunity Recommendations
   - Risk and Governance Recommendations
   - Department Recommendations
   - Automatic Synchronization
   - Legacy ATCRecommendationEngine Compatibility
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};

  const RecommendationEngine = {
    id: "recommendation-engine",
    version: "2.1.0",

    _initialized: false,
    _storeUnsubscribe: null,
    _refreshTimer: null,
    _cache: null,
    _isSynchronizing: false,

    /* =========================================================
       INITIALIZATION
    ========================================================= */

    init() {
      if (this._initialized) {
        return this;
      }

      this._initialized = true;

      this.bindStore();
      this.bindEvents();
      this.registerMetadata();
      this.refresh();

      this.emit(
        "aiw:recommendationEngineReady",
        {
          version: this.version,
          generatedAt: this.now()
        }
      );

      return this;
    },

    /* =========================================================
       ENGINE ACCESS
    ========================================================= */

    getStore() {
      return window.AIW?.Store || null;
    },

    getAnalytics() {
      return window.AIW?.Analytics || null;
    },

    getAIEngine() {
      return (
        window.AIW?.AIEngine ||
        window.AIW?.AI ||
        null
      );
    },

    getDecisionEngine() {
      return (
        window.AIW?.DecisionEngine ||
        window.ATCDecisionEngine ||
        null
      );
    },

    getData() {
      const store = this.getStore();

      try {
        if (
          store &&
          typeof store.getState === "function"
        ) {
          return store.getState();
        }

        if (
          store &&
          typeof store.getData === "function"
        ) {
          return store.getData();
        }
      } catch (error) {
        console.warn(
          "[AIW.RecommendationEngine] Unable to read Store data:",
          error
        );
      }

      return window.AIW?.Data || {};
    },

    getIdeas() {
      const analytics = this.getAnalytics();

      if (
        analytics &&
        typeof analytics.getIdeas === "function"
      ) {
        return analytics.getIdeas();
      }

      return this.activeItems(
        this.getData().ideas
      );
    },

    getProjects() {
      const analytics = this.getAnalytics();

      if (
        analytics &&
        typeof analytics.getProjects === "function"
      ) {
        return analytics.getProjects();
      }

      const data = this.getData();

      const projects =
        this.activeItems(data.projects);

      return projects.length
        ? projects
        : this.activeItems(
            data.flagshipProjects
          );
    },

    getDepartments() {
      const analytics = this.getAnalytics();

      if (
        analytics &&
        typeof analytics.getDepartments === "function"
      ) {
        return analytics.getDepartments();
      }

      return this.activeItems(
        this.getData().departments
      );
    },

    getRisks() {
      const analytics = this.getAnalytics();

      if (
        analytics &&
        typeof analytics.getRisks === "function"
      ) {
        return analytics.getRisks();
      }

      return this.activeItems(
        this.getData().risks
      );
    },

    getKpis() {
      const analytics = this.getAnalytics();

      if (
        analytics &&
        typeof analytics.getKpis === "function"
      ) {
        return analytics.getKpis();
      }

      return this.activeItems(
        this.getData().kpis
      );
    },

    /* =========================================================
       GENERAL HELPERS
    ========================================================= */

    now() {
      return new Date().toISOString();
    },

    id(prefix = "recommendation") {
      return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
    },

    clone(value) {
      if (value === undefined) {
        return undefined;
      }

      try {
        return structuredClone(value);
      } catch (error) {
        try {
          return JSON.parse(
            JSON.stringify(value)
          );
        } catch (cloneError) {
          return value;
        }
      }
    },

    toArray(value) {
      if (Array.isArray(value)) {
        return value;
      }

      if (
        value &&
        typeof value === "object"
      ) {
        return Object.values(value);
      }

      return [];
    },

    activeItems(value) {
      return this.toArray(value).filter(
        item => !item?.deletedAt
      );
    },

    clamp(value, min = 0, max = 100) {
      const number = Number(value);

      if (!Number.isFinite(number)) {
        return min;
      }

      return Math.min(
        max,
        Math.max(min, Math.round(number))
      );
    },

    normalizeText(value) {
      return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
    },

    normalizeArabic(value) {
      return this.normalizeText(value)
        .replace(/أ/g, "ا")
        .replace(/إ/g, "ا")
        .replace(/آ/g, "ا")
        .replace(/ى/g, "ي");
    },

    includesAny(value, terms = []) {
      const normalized =
        this.normalizeArabic(value);

      return terms.some(term =>
        normalized.includes(
          this.normalizeArabic(term)
        )
      );
    },

    uniqueById(items = []) {
      const seen = new Set();

      return this.toArray(items).filter(item => {
        const key =
          item.id ||
          `${item.category}-${item.title}-${item.text}`;

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      });
    },

    /* =========================================================
       SCORE ACCESS
    ========================================================= */

    getScores() {
      const analytics = this.getAnalytics();

      if (
        analytics &&
        typeof analytics.score === "function"
      ) {
        return analytics.score();
      }

      return {
        executiveScore: 0,
        ideaScore: 0,
        maturityScore: 0,
        portfolioScore: 0,
        riskScore: 0,
        governanceScore: 0,
        kpiScore: 0,
        deliveryScore: 0,
        dataScore: 0
      };
    },

    getDecisionSnapshot() {
      const decisionEngine =
        this.getDecisionEngine();

      if (
        decisionEngine &&
        typeof decisionEngine.getSnapshot ===
          "function"
      ) {
        return decisionEngine.getSnapshot();
      }

      return null;
    },

    /* =========================================================
       CORE GENERATION
    ========================================================= */

    generate(context = {}, options = {}) {
      const normalizedContext =
        this.normalizeContext(context);

      const recommendations = [];

      recommendations.push(
        ...this.generateMaturityRecommendations(
          normalizedContext
        )
      );

      recommendations.push(
        ...this.generateRiskRecommendations(
          normalizedContext
        )
      );

      recommendations.push(
        ...this.generateGovernanceRecommendations(
          normalizedContext
        )
      );

      recommendations.push(
        ...this.generatePortfolioRecommendations(
          normalizedContext
        )
      );

      recommendations.push(
        ...this.generateKpiRecommendations(
          normalizedContext
        )
      );

      recommendations.push(
        ...this.generateOpportunityRecommendations(
          normalizedContext
        )
      );

      recommendations.push(
        ...this.generateDataRecommendations(
          normalizedContext
        )
      );

      recommendations.push(
        ...this.generateValueRecommendations(
          normalizedContext
        )
      );

      if (!recommendations.length) {
        recommendations.push(
          this.createRecommendation({
            id: "stable-execution",
            priority: 4,
            level: "منخفضة",
            category: "التنفيذ",
            title:
              "الاستمرار في التنفيذ المنظم",
            text:
              "الوضع الحالي مستقر ويمكن الاستمرار حسب الخطة مع مراجعة دورية للمؤشرات والمخاطر.",
            route: "strategy",
            action:
              "CONTINUE_EXECUTION"
          })
        );
      }

      const ordered =
        this.uniqueById(recommendations)
          .sort(this.sortRecommendations);

      const limit =
        options.limit === undefined
          ? ordered.length
          : Math.max(
              0,
              Number(options.limit) || 0
            );

      const result =
        ordered.slice(0, limit);

      if (
        options.asText === true ||
        options.format === "text"
      ) {
        return result.map(
          item => item.text
        );
      }

      return result;
    },

    normalizeContext(context = {}) {
      const scores = this.getScores();

      const decisionSnapshot =
        this.getDecisionSnapshot();

      const ideas = this.getIdeas();
      const projects = this.getProjects();
      const departments =
        this.getDepartments();
      const risks = this.getRisks();
      const kpis = this.getKpis();

      return {
        maturity:
          context.maturity ??
          context.maturityScore ??
          scores.maturityScore ??
          0,

        risk:
          context.risk ??
          context.riskScore ??
          this.convertSafetyToExposure(
            scores.riskScore
          ),

        riskSafety:
          context.riskSafety ??
          scores.riskScore ??
          0,

        governance:
          context.governance ??
          context.governanceScore ??
          scores.governanceScore ??
          0,

        roi:
          context.roi ??
          context.valueScore ??
          context.expectedValue ??
          0,

        portfolio:
          context.portfolio ??
          context.portfolioScore ??
          scores.portfolioScore ??
          0,

        kpi:
          context.kpi ??
          context.kpiScore ??
          scores.kpiScore ??
          0,

        delivery:
          context.delivery ??
          context.deliveryScore ??
          scores.deliveryScore ??
          0,

        data:
          context.data ??
          context.dataScore ??
          scores.dataScore ??
          0,

        executive:
          context.executive ??
          context.executiveScore ??
          scores.executiveScore ??
          0,

        ideas,
        projects,
        departments,
        risks,
        kpis,

        quickWins:
          context.quickWins ??
          this.getQuickWins(),

        highRisks:
          context.highRisks ??
          this.getHighRisks(),

        delayedProjects:
          context.delayedProjects ??
          this.getDelayedProjects(),

        projectsWithoutKpis:
          context.projectsWithoutKpis ??
          this.getProjectsWithoutKpis(),

        projectsWithoutOwners:
          context.projectsWithoutOwners ??
          this.getProjectsWithoutOwners(),

        decisionSnapshot,

        source:
          context.source ||
          "platform",

        target:
          context.target ||
          null,

        generatedAt:
          this.now()
      };
    },

    convertSafetyToExposure(score) {
      return this.clamp(
        100 - Number(score || 0)
      );
    },

    /* =========================================================
       MATURITY RECOMMENDATIONS
    ========================================================= */

    generateMaturityRecommendations(context) {
      const output = [];
      const maturity =
        this.clamp(context.maturity);

      if (maturity < 40) {
        output.push(
          this.createRecommendation({
            id: "maturity-foundation",
            priority: 1,
            level: "عالية",
            category: "النضج",
            title:
              "تأسيس الجاهزية قبل التوسع",
            text:
              "استكمال البيانات والمهارات والعمليات والحوكمة قبل إطلاق مشاريع كبيرة أو حساسة.",
            reason:
              `درجة النضج الحالية ${maturity}%.`,
            route: "maturity",
            action:
              "BUILD_MATURITY_FOUNDATION"
          })
        );

        return output;
      }

      if (maturity < 60) {
        output.push(
          this.createRecommendation({
            id: "maturity-improvement",
            priority: 2,
            level: "عالية",
            category: "النضج",
            title:
              "رفع مستوى النضج المؤسسي",
            text:
              "تنفيذ خطة تحسين للإدارات الأقل جاهزية وربطها بمستهدفات زمنية ومؤشرات قياس.",
            reason:
              `درجة النضج الحالية ${maturity}%.`,
            route: "maturity",
            action:
              "IMPROVE_MATURITY"
          })
        );
      } else if (maturity < 75) {
        output.push(
          this.createRecommendation({
            id: "maturity-controlled-scale",
            priority: 4,
            level: "متوسطة",
            category: "النضج",
            title:
              "التوسع التدريجي حسب الجاهزية",
            text:
              "ابدأ بالإدارات الأعلى نضجاً، ثم انقل الخبرة إلى الإدارات الأقل جاهزية.",
            route: "maturity",
            action:
              "SCALE_BY_READINESS"
          })
        );
      }

      return output;
    },

    /* =========================================================
       RISK RECOMMENDATIONS
    ========================================================= */

    generateRiskRecommendations(context) {
      const output = [];

      const exposure =
        this.clamp(context.risk);

      const highRiskCount =
        context.highRisks.length;

      if (
        exposure >= 70 ||
        highRiskCount > 0
      ) {
        output.push(
          this.createRecommendation({
            id: "risk-review",
            priority: 1,
            level: "عالية",
            category: "المخاطر",
            title:
              "مراجعة المخاطر قبل الاعتماد",
            text:
              "إيقاف الاعتماد النهائي للحالات الحساسة إلى حين استكمال خطة المعالجة وتحديد المالك والموعد.",
            reason:
              highRiskCount
                ? `توجد ${highRiskCount} مخاطر مرتفعة أو حرجة.`
                : `مستوى التعرض للمخاطر ${exposure}%.`,
            route: "governance",
            action:
              "REVIEW_HIGH_RISKS"
          })
        );
      } else if (exposure >= 45) {
        output.push(
          this.createRecommendation({
            id: "risk-monitoring",
            priority: 3,
            level: "متوسطة",
            category: "المخاطر",
            title:
              "تعزيز متابعة المخاطر",
            text:
              "تحديث سجل المخاطر وخطط المعالجة بشكل دوري وربط الحالات الحرجة بالتنبيهات.",
            route: "governance",
            action:
              "MONITOR_RISKS"
          })
        );
      }

      return output;
    },

    /* =========================================================
       GOVERNANCE RECOMMENDATIONS
    ========================================================= */

    generateGovernanceRecommendations(
      context
    ) {
      const output = [];

      const governance =
        this.clamp(context.governance);

      if (governance < 50) {
        output.push(
          this.createRecommendation({
            id: "governance-foundation",
            priority: 1,
            level: "عالية",
            category: "الحوكمة",
            title:
              "استكمال ضوابط الحوكمة الأساسية",
            text:
              "تفعيل مراجعة الخصوصية والإشراف البشري وتوثيق القرارات قبل تشغيل الحالات الحساسة.",
            reason:
              `جاهزية الحوكمة الحالية ${governance}%.`,
            route: "governance",
            action:
              "COMPLETE_GOVERNANCE"
          })
        );
      } else if (governance < 70) {
        output.push(
          this.createRecommendation({
            id: "governance-strengthen",
            priority: 2,
            level: "متوسطة",
            category: "الحوكمة",
            title:
              "تقوية جاهزية الحوكمة",
            text:
              "ربط جميع المشاريع بمراجعات الحوكمة والمخاطر والخصوصية قبل الانتقال إلى التشغيل.",
            route: "governance",
            action:
              "STRENGTHEN_GOVERNANCE"
          })
        );
      }

      return output;
    },

    /* =========================================================
       PORTFOLIO RECOMMENDATIONS
    ========================================================= */

    generatePortfolioRecommendations(
      context
    ) {
      const output = [];

      const portfolio =
        this.clamp(context.portfolio);

      const delayedCount =
        context.delayedProjects.length;

      const ownerGap =
        context.projectsWithoutOwners.length;

      if (delayedCount > 0) {
        output.push(
          this.createRecommendation({
            id: "delayed-projects",
            priority: 1,
            level: "عالية",
            category: "المشاريع",
            title:
              "معالجة المشاريع المتأخرة",
            text:
              "إعداد خطة تصحيح للمشاريع المتأخرة ومراجعة النطاق والجدول والمخاطر والموارد.",
            reason:
              `توجد ${delayedCount} مشاريع متأخرة أو متعثرة.`,
            route: "projects",
            action:
              "RECOVER_DELAYED_PROJECTS"
          })
        );
      }

      if (ownerGap > 0) {
        output.push(
          this.createRecommendation({
            id: "project-ownership",
            priority: 2,
            level: "عالية",
            category: "المشاريع",
            title:
              "تحديد ملاك المشاريع",
            text:
              "تعيين مالك تنفيذي ومسؤول تشغيلي لكل مشروع قبل الاعتماد أو التوسع.",
            reason:
              `توجد ${ownerGap} مشاريع بدون مالك واضح.`,
            route: "projects",
            action:
              "ASSIGN_PROJECT_OWNERS"
          })
        );
      }

      if (
        portfolio < 55 &&
        context.projects.length
      ) {
        output.push(
          this.createRecommendation({
            id: "portfolio-recovery",
            priority: 2,
            level: "عالية",
            category: "المحفظة",
            title:
              "إعادة ترتيب محفظة المشاريع",
            text:
              "خفض عدد المبادرات المتزامنة والتركيز على المشاريع الأعلى أثراً وجاهزية.",
            reason:
              `صحة المحفظة الحالية ${portfolio}%.`,
            route: "projects",
            action:
              "REPRIORITIZE_PORTFOLIO"
          })
        );
      } else if (portfolio >= 80) {
        output.push(
          this.createRecommendation({
            id: "portfolio-scale",
            priority: 6,
            level: "منخفضة",
            category: "المحفظة",
            title:
              "التوسع المنظم في المحفظة",
            text:
              "المحفظة في وضع جيد ويمكن إضافة مبادرات جديدة تدريجياً مع الحفاظ على القدرة التنفيذية.",
            route: "strategy",
            action:
              "CONTROLLED_PORTFOLIO_SCALE"
          })
        );
      }

      return output;
    },

    /* =========================================================
       KPI RECOMMENDATIONS
    ========================================================= */

    generateKpiRecommendations(context) {
      const output = [];

      const kpiScore =
        this.clamp(context.kpi);

      const missingKpis =
        context.projectsWithoutKpis.length;

      if (missingKpis > 0) {
        output.push(
          this.createRecommendation({
            id: "project-kpi-link",
            priority: 2,
            level: "عالية",
            category: "المؤشرات",
            title:
              "ربط المشاريع بمؤشرات أداء",
            text:
              "تحديد مؤشر وهدف وخط أساس ومالك قياس لكل مشروع قبل الاعتماد النهائي.",
            reason:
              `توجد ${missingKpis} مشاريع بدون مؤشرات قياس واضحة.`,
            route: "kpis",
            action:
              "LINK_PROJECT_KPIS"
          })
        );
      } else if (kpiScore < 65) {
        output.push(
          this.createRecommendation({
            id: "kpi-performance",
            priority: 3,
            level: "متوسطة",
            category: "المؤشرات",
            title:
              "تحسين أداء المؤشرات",
            text:
              "مراجعة المؤشرات المتأخرة وتحديث المستهدفات وخطط التحسين والمسؤوليات.",
            reason:
              `درجة أداء المؤشرات الحالية ${kpiScore}%.`,
            route: "kpis",
            action:
              "IMPROVE_KPI_PERFORMANCE"
          })
        );
      }

      return output;
    },

    /* =========================================================
       OPPORTUNITY RECOMMENDATIONS
    ========================================================= */

    generateOpportunityRecommendations(
      context
    ) {
      const output = [];

      const quickWins =
        context.quickWins;

      if (quickWins.length >= 3) {
        output.push(
          this.createRecommendation({
            id: "launch-quick-wins",
            priority: 2,
            level: "عالية",
            category: "الفرص",
            title:
              "إطلاق حزمة مكاسب سريعة",
            text:
              "اختيار أفضل ثلاث فرص منخفضة التعقيد وعالية الأثر وتحويلها إلى مبادرات قصيرة المدى.",
            reason:
              `توجد ${quickWins.length} فرص مصنفة كمكاسب سريعة.`,
            route: "ideas",
            action:
              "LAUNCH_QUICK_WINS",
            relatedIds:
              quickWins
                .slice(0, 3)
                .map(item => item.id)
                .filter(Boolean)
          })
        );
      } else if (
        context.ideas.length &&
        !quickWins.length
      ) {
        output.push(
          this.createRecommendation({
            id: "identify-quick-wins",
            priority: 4,
            level: "متوسطة",
            category: "الفرص",
            title:
              "تحديد المكاسب السريعة",
            text:
              "إعادة تقييم الفرص حسب الأثر وسهولة التنفيذ والتكلفة لتحديد مشاريع البداية.",
            route: "ideas",
            action:
              "IDENTIFY_QUICK_WINS"
          })
        );
      }

      const decisionSnapshot =
        context.decisionSnapshot;

      const readyOpportunities =
        decisionSnapshot
          ?.opportunityPortfolio
          ?.convertToProject || 0;

      if (readyOpportunities > 0) {
        output.push(
          this.createRecommendation({
            id: "convert-opportunities",
            priority: 3,
            level: "عالية",
            category: "الفرص",
            title:
              "تحويل الفرص الجاهزة إلى مشاريع",
            text:
              "رفع الفرص الأعلى تقييماً إلى مركز المشاريع بعد استكمال المالك والجدوى والحوكمة.",
            reason:
              `توجد ${readyOpportunities} فرص جاهزة للتحويل.`,
            route: "decision",
            action:
              "CONVERT_READY_OPPORTUNITIES"
          })
        );
      }

      return output;
    },

    /* =========================================================
       DATA RECOMMENDATIONS
    ========================================================= */

    generateDataRecommendations(context) {
      const output = [];
      const dataScore =
        this.clamp(context.data);

      if (dataScore < 50) {
        output.push(
          this.createRecommendation({
            id: "data-foundation",
            priority: 1,
            level: "عالية",
            category: "البيانات",
            title:
              "استكمال أساس البيانات",
            text:
              "تحديد مصادر البيانات وملاكها وجودتها وصلاحيات استخدامها قبل تشغيل التحليلات والذكاء الاصطناعي.",
            reason:
              `اكتمال بيانات المنصة ${dataScore}%.`,
            route: "settings",
            action:
              "BUILD_DATA_FOUNDATION"
          })
        );
      } else if (dataScore < 75) {
        output.push(
          this.createRecommendation({
            id: "data-completeness",
            priority: 4,
            level: "متوسطة",
            category: "البيانات",
            title:
              "رفع اكتمال بيانات المنصة",
            text:
              "استكمال بيانات المشاريع والمخاطر والمؤشرات لضمان دقة التحليلات والتوصيات.",
            route: "settings",
            action:
              "COMPLETE_PLATFORM_DATA"
          })
        );
      }

      return output;
    },

    /* =========================================================
       VALUE RECOMMENDATIONS
    ========================================================= */

    generateValueRecommendations(context) {
      const output = [];

      const roi =
        Number(context.roi || 0);

      if (roi >= 70 && roi <= 100) {
        output.push(
          this.createRecommendation({
            id: "high-value-priority",
            priority: 3,
            level: "عالية",
            category: "القيمة",
            title:
              "إعطاء أولوية للمبادرات الأعلى قيمة",
            text:
              "توجيه الموارد للمبادرات ذات القيمة التشغيلية المرتفعة والجاهزية المقبولة.",
            reason:
              `درجة القيمة أو العائد ${Math.round(
                roi
              )}%.`,
            route: "business",
            action:
              "PRIORITIZE_HIGH_VALUE"
          })
        );
      } else if (roi > 1000000) {
        output.push(
          this.createRecommendation({
            id: "high-financial-value",
            priority: 3,
            level: "عالية",
            category: "القيمة",
            title:
              "مراجعة المبادرات مرتفعة القيمة",
            text:
              "إعطاء الأولوية للمبادرات ذات الأثر المالي أو التشغيلي الأعلى مع التحقق من قابلية التنفيذ.",
            route: "business",
            action:
              "REVIEW_HIGH_VALUE_INITIATIVES"
          })
        );
      }

      output.push(
        this.createRecommendation({
          id: "quarterly-value-review",
          priority: 7,
          level: "منخفضة",
          category: "القيمة",
          title:
            "قياس القيمة بشكل دوري",
          text:
            "تنفيذ مراجعة دورية للأثر التشغيلي وجودة الخدمة والتكلفة والمخاطر لكل مبادرة.",
          route: "reports",
          action:
            "REVIEW_VALUE_PERIODICALLY"
        })
      );

      return output;
    },

    /* =========================================================
       PROJECT RECOMMENDATIONS
    ========================================================= */

    forProject(project = {}, options = {}) {
      const decisionEngine =
        this.getDecisionEngine();

      const evaluation =
        decisionEngine &&
        typeof decisionEngine.evaluateProject ===
          "function"
          ? decisionEngine.evaluateProject(
              project
            )
          : null;

      const output = [];

      if (evaluation) {
        evaluation.blockers.forEach(
          blocker => {
            output.push(
              this.createRecommendation({
                id:
                  `project-${project.id || "item"}-${blocker.code}`,

                priority: 1,
                level: "عالية",
                category: "المشروع",
                title:
                  blocker.title,
                text:
                  blocker.description,
                route:
                  blocker.code.includes(
                    "GOVERNANCE"
                  ) ||
                  blocker.code.includes(
                    "RISK"
                  )
                    ? "governance"
                    : "projects",
                sourceType:
                  "project",
                sourceId:
                  project.id,
                action:
                  blocker.code
              })
            );
          }
        );

        evaluation.warnings.forEach(
          warning => {
            output.push(
              this.createRecommendation({
                id:
                  `project-${project.id || "item"}-${warning.code}`,

                priority: 3,
                level: "متوسطة",
                category: "المشروع",
                title:
                  warning.title,
                text:
                  warning.description,
                route:
                  warning.code ===
                  "KPI_GAP"
                    ? "kpis"
                    : warning.code ===
                        "FEASIBILITY_GAP"
                      ? "business"
                      : "strategy",
                sourceType:
                  "project",
                sourceId:
                  project.id,
                action:
                  warning.code
              })
            );
          }
        );

        evaluation.nextActions.forEach(
          (action, index) => {
            output.push(
              this.createRecommendation({
                id:
                  `project-${project.id || "item"}-action-${index + 1}`,

                priority:
                  action.priority || 4,
                level:
                  action.priority <= 2
                    ? "عالية"
                    : "متوسطة",
                category: "المشروع",
                title:
                  action.title,
                text:
                  `الإجراء المقترح للمشروع: ${action.title}.`,
                route:
                  action.route ||
                  "projects",
                sourceType:
                  "project",
                sourceId:
                  project.id,
                action:
                  "PROJECT_NEXT_ACTION"
              })
            );
          }
        );
      }

      if (!output.length) {
        output.push(
          this.createRecommendation({
            id:
              `project-${project.id || "item"}-continue`,

            priority: 5,
            level: "منخفضة",
            category: "المشروع",
            title:
              "الاستمرار في متابعة المشروع",
            text:
              "وضع المشروع مستقر، مع استمرار متابعة التقدم والمؤشرات والمخاطر.",
            route: "projects",
            sourceType:
              "project",
            sourceId:
              project.id,
            action:
              "CONTINUE_PROJECT_MONITORING"
          })
        );
      }

      const result =
        this.uniqueById(output)
          .sort(this.sortRecommendations);

      const limit =
        options.limit === undefined
          ? result.length
          : Math.max(
              0,
              Number(options.limit) || 0
            );

      return result.slice(0, limit);
    },

    /* =========================================================
       OPPORTUNITY RECOMMENDATIONS
    ========================================================= */

    forOpportunity(idea = {}, options = {}) {
      const decisionEngine =
        this.getDecisionEngine();

      const evaluation =
        decisionEngine &&
        typeof decisionEngine.evaluateOpportunity ===
          "function"
          ? decisionEngine.evaluateOpportunity(
              idea
            )
          : null;

      const output = [];

      if (evaluation) {
        evaluation.blockers.forEach(
          blocker => {
            output.push(
              this.createRecommendation({
                id:
                  `idea-${idea.id || "item"}-${blocker.code}`,

                priority: 1,
                level: "عالية",
                category: "الفرصة",
                title:
                  blocker.title,
                text:
                  blocker.description,
                route:
                  blocker.code.includes(
                    "RISK"
                  ) ||
                  blocker.code.includes(
                    "SENSITIVE"
                  )
                    ? "governance"
                    : "ideas",
                sourceType:
                  "opportunity",
                sourceId:
                  idea.id,
                action:
                  blocker.code
              })
            );
          }
        );

        evaluation.nextActions.forEach(
          (action, index) => {
            output.push(
              this.createRecommendation({
                id:
                  `idea-${idea.id || "item"}-action-${index + 1}`,

                priority:
                  action.priority || 4,
                level:
                  action.priority <= 2
                    ? "عالية"
                    : "متوسطة",
                category: "الفرصة",
                title:
                  action.title,
                text:
                  `الإجراء المقترح للفرصة: ${action.title}.`,
                route:
                  action.route ||
                  "ideas",
                sourceType:
                  "opportunity",
                sourceId:
                  idea.id,
                action:
                  "OPPORTUNITY_NEXT_ACTION"
              })
            );
          }
        );

        if (
          evaluation.decision ===
          "CONVERT_TO_PROJECT"
        ) {
          output.push(
            this.createRecommendation({
              id:
                `idea-${idea.id || "item"}-convert`,

              priority: 1,
              level: "عالية",
              category: "الفرصة",
              title:
                "تحويل الفرصة إلى مشروع",
              text:
                "الفرصة حققت درجة مرتفعة وتستوفي متطلبات التحويل الأولية إلى مشروع.",
              route: "projects",
              sourceType:
                "opportunity",
              sourceId:
                idea.id,
              action:
                "CONVERT_TO_PROJECT"
            })
          );
        }
      }

      if (!output.length) {
        output.push(
          this.createRecommendation({
            id:
              `idea-${idea.id || "item"}-review`,

            priority: 4,
            level: "متوسطة",
            category: "الفرصة",
            title:
              "استكمال تقييم الفرصة",
            text:
              "استكمل بيانات الأثر والمالك والتكلفة والمخاطر قبل اعتماد الأولوية.",
            route: "ideas",
            sourceType:
              "opportunity",
            sourceId:
              idea.id,
            action:
              "COMPLETE_OPPORTUNITY_EVALUATION"
          })
        );
      }

      const result =
        this.uniqueById(output)
          .sort(this.sortRecommendations);

      const limit =
        options.limit === undefined
          ? result.length
          : Math.max(
              0,
              Number(options.limit) || 0
            );

      return result.slice(0, limit);
    },

    forIdea(idea = {}, options = {}) {
      return this.forOpportunity(
        idea,
        options
      );
    },

    /* =========================================================
       DEPARTMENT RECOMMENDATIONS
    ========================================================= */

    forDepartment(
      departmentOrName,
      options = {}
    ) {
      const aiEngine =
        this.getAIEngine();

      const department =
        typeof departmentOrName ===
        "object"
          ? departmentOrName
          : this.getDepartments().find(
              item =>
                this.normalizeArabic(
                  item.name ||
                  item.title
                ) ===
                this.normalizeArabic(
                  departmentOrName
                )
            );

      const name =
        typeof departmentOrName ===
        "string"
          ? departmentOrName
          : department?.name ||
            department?.title ||
            "الإدارة";

      const advice =
        aiEngine &&
        typeof aiEngine.departmentAdvice ===
          "function"
          ? aiEngine.departmentAdvice(
              department || name
            )
          : null;

      const maturity =
        advice?.maturity ??
        department?.maturity ??
        department?.readiness ??
        department?.score ??
        0;

      const output = [];

      if (Number(maturity) < 40) {
        output.push(
          this.createRecommendation({
            id:
              `department-${this.normalizeText(name)}-foundation`,

            priority: 1,
            level: "عالية",
            category: "الإدارات",
            title:
              `تأسيس جاهزية ${name}`,
            text:
              "التركيز على البيانات والعمليات والمهارات والحوكمة قبل تنفيذ مشروع واسع.",
            route: "maturity",
            sourceType:
              "department",
            sourceId:
              department?.id,
            action:
              "BUILD_DEPARTMENT_READINESS"
          })
        );
      } else if (Number(maturity) < 65) {
        output.push(
          this.createRecommendation({
            id:
              `department-${this.normalizeText(name)}-quick-win`,

            priority: 2,
            level: "متوسطة",
            category: "الإدارات",
            title:
              `إطلاق مشروع تجريبي في ${name}`,
            text:
              "اختيار مشروع منخفض التعقيد وقابل للقياس لتحسين الجاهزية وإثبات القيمة.",
            route: "ideas",
            sourceType:
              "department",
            sourceId:
              department?.id,
            action:
              "LAUNCH_DEPARTMENT_PILOT"
          })
        );
      } else {
        output.push(
          this.createRecommendation({
            id:
              `department-${this.normalizeText(name)}-scale`,

            priority: 4,
            level: "متوسطة",
            category: "الإدارات",
            title:
              `التوسع المنظم في ${name}`,
            text:
              advice?.advice ||
              "الإدارة جاهزة لتنفيذ مشروع تشغيلي وربطه بالمؤشرات والمخاطر.",
            route:
              advice?.recommendedRoute ||
              "ideas",
            sourceType:
              "department",
            sourceId:
              department?.id,
            action:
              "SCALE_DEPARTMENT_AI"
          })
        );
      }

      const limit =
        options.limit === undefined
          ? output.length
          : Math.max(
              0,
              Number(options.limit) || 0
            );

      return output.slice(0, limit);
    },

    /* =========================================================
       PORTFOLIO RECOMMENDATIONS
    ========================================================= */

    forPortfolio(options = {}) {
      const context =
        this.normalizeContext({
          source: "portfolio"
        });

      const recommendations = [
        ...this.generatePortfolioRecommendations(
          context
        ),
        ...this.generateRiskRecommendations(
          context
        ),
        ...this.generateKpiRecommendations(
          context
        ),
        ...this.generateGovernanceRecommendations(
          context
        )
      ];

      const result =
        this.uniqueById(recommendations)
          .sort(this.sortRecommendations);

      const limit =
        options.limit === undefined
          ? result.length
          : Math.max(
              0,
              Number(options.limit) || 0
            );

      return result.slice(0, limit);
    },

    /* =========================================================
       RECORD CREATION
    ========================================================= */

    createRecommendation({
      id = "",
      priority = 5,
      level = "متوسطة",
      category = "تنفيذي",
      title = "توصية تنفيذية",
      text = "",
      reason = "",
      route = "decision",
      action = "",
      sourceType = "platform",
      sourceId = null,
      relatedIds = [],
      status = "active"
    } = {}) {
      return {
        id:
          id ||
          this.id(),

        priority:
          Number(priority) || 5,

        level,

        category,

        title,

        text,

        reason,

        route,

        action,

        sourceType,

        sourceId,

        relatedIds:
          this.toArray(relatedIds),

        status,

        createdAt:
          this.now(),

        engineVersion:
          this.version
      };
    },

    sortRecommendations(a, b) {
      const priorityDifference =
        Number(a.priority || 99) -
        Number(b.priority || 99);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      const levelOrder = {
        عالية: 1,
        متوسطة: 2,
        منخفضة: 3
      };

      return (
        (levelOrder[a.level] || 9) -
        (levelOrder[b.level] || 9)
      );
    },

    /* =========================================================
       PLATFORM ANALYSIS HELPERS
    ========================================================= */

    getQuickWins() {
      const analytics =
        this.getAnalytics();

      if (
        analytics &&
        typeof analytics.quickWins ===
          "function"
      ) {
        return analytics.quickWins();
      }

      return this.getIdeas().filter(
        idea => {
          if (
            idea.quickWin === true ||
            idea.isQuickWin === true
          ) {
            return true;
          }

          const ease =
            idea.ease ||
            idea.difficulty ||
            idea.complexity ||
            "";

          const cost =
            idea.cost ||
            idea.costLevel ||
            "";

          return (
            this.includesAny(ease, [
              "سهلة",
              "سهل",
              "منخفض",
              "easy",
              "low"
            ]) &&
            this.includesAny(cost, [
              "منخفض",
              "منخفضة",
              "low"
            ])
          );
        }
      );
    },

    getHighRisks() {
      return this.getRisks().filter(
        risk =>
          this.includesAny(
            risk.level ||
            risk.riskLevel ||
            risk.severity,
            [
              "حرج",
              "حرجة",
              "عال",
              "عالية",
              "مرتفع",
              "critical",
              "high"
            ]
          )
      );
    },

    getDelayedProjects() {
      return this.getProjects().filter(
        project =>
          this.includesAny(
            project.status,
            [
              "متأخر",
              "متعثر",
              "delayed",
              "blocked",
              "at risk"
            ]
          )
      );
    },

    getProjectsWithoutKpis() {
      return this.getProjects().filter(
        project =>
          !project.kpi &&
          !project.kpiId &&
          !(
            Array.isArray(project.kpis) &&
            project.kpis.length
          )
      );
    },

    getProjectsWithoutOwners() {
      return this.getProjects().filter(
        project =>
          !project.owner &&
          !project.projectOwner &&
          !project.sponsor &&
          !project.executiveSponsor
      );
    },

    /* =========================================================
       SNAPSHOT
    ========================================================= */

    snapshot() {
      const context =
        this.normalizeContext();

      const recommendations =
        this.generate(
          context
        );

      const snapshot = {
        summary: {
          total:
            recommendations.length,

          high:
            recommendations.filter(
              item =>
                item.level === "عالية"
            ).length,

          medium:
            recommendations.filter(
              item =>
                item.level === "متوسطة"
            ).length,

          low:
            recommendations.filter(
              item =>
                item.level === "منخفضة"
            ).length,

          maturity:
            context.maturity,

          riskSafety:
            context.riskSafety,

          governance:
            context.governance,

          portfolio:
            context.portfolio,

          kpi:
            context.kpi,

          data:
            context.data
        },

        recommendations,

        portfolioRecommendations:
          this.forPortfolio(),

        generatedAt:
          this.now(),

        engineVersion:
          this.version
      };

      this._cache =
        snapshot;

      return this.clone(snapshot);
    },

    getSnapshot(options = {}) {
      if (
        options.fresh === true ||
        !this._cache
      ) {
        return this.snapshot();
      }

      return this.clone(
        this._cache
      );
    },

    refresh() {
      const snapshot =
        this.snapshot();

      this.syncToStore(snapshot);

      this.emit(
        "aiw:recommendationsUpdated",
        snapshot
      );

      return snapshot;
    },

    /* =========================================================
       STORE SYNCHRONIZATION
    ========================================================= */

    syncToStore(snapshot) {
      const store =
        this.getStore();

      if (
        !store ||
        !snapshot ||
        this._isSynchronizing
      ) {
        return;
      }

      const recommendationState = {
        total:
          snapshot.summary.total,

        high:
          snapshot.summary.high,

        medium:
          snapshot.summary.medium,

        low:
          snapshot.summary.low,

        items:
          snapshot.recommendations.slice(
            0,
            20
          ),

        updatedAt:
          snapshot.generatedAt
      };

      this._isSynchronizing = true;

      try {
        const currentState =
          typeof store.get === "function"
            ? store.get(
                "recommendationSummary",
                {}
              )
            : {};

        if (
          JSON.stringify(currentState) ===
          JSON.stringify(
            recommendationState
          )
        ) {
          return;
        }

        if (
          typeof store.set === "function"
        ) {
          store.set(
            "recommendationSummary",
            recommendationState,
            {
              eventName:
                "aiw:recommendationsSynchronized",

              backup: false,
              notify: false
            }
          );
        }
      } catch (error) {
        console.warn(
          "[AIW.RecommendationEngine] Store synchronization skipped:",
          error
        );
      } finally {
        this._isSynchronizing = false;
      }
    },

    saveRecommendation(
      recommendation,
      options = {}
    ) {
      if (!recommendation) {
        return null;
      }

      const store =
        this.getStore();

      const record = {
        ...this.clone(
          recommendation
        ),

        id:
          recommendation.id ||
          this.id(),

        status:
          options.status ||
          recommendation.status ||
          "active",

        savedAt:
          this.now()
      };

      try {
        if (
          store &&
          typeof store.add === "function"
        ) {
          const saved =
            store.add(
              "recommendations",
              record
            );

          this.emit(
            "aiw:recommendationCreated",
            {
              recommendation: saved
            }
          );

          return saved;
        }
      } catch (error) {
        console.warn(
          "[AIW.RecommendationEngine] Recommendation save failed:",
          error
        );
      }

      return record;
    },

    saveAll(
      recommendations = null
    ) {
      const items =
        recommendations ||
        this.generate();

      return this.toArray(items).map(
        item =>
          this.saveRecommendation(item)
      );
    },

    /* =========================================================
       EVENTS
    ========================================================= */

    bindStore() {
      const store =
        this.getStore();

      if (
        !store ||
        this._storeUnsubscribe
      ) {
        return;
      }

      try {
        if (
          typeof store.subscribe ===
            "function"
        ) {
          this._storeUnsubscribe =
            store.subscribe(change => {
              const type =
                change?.type || "";

              const ignoredEvents = [
                "aiw:recommendationsUpdated",
                "aiw:recommendationsSynchronized",
                "aiw:recommendationCreated",
                "aiw:metadataChanged",
                "persist",
                "settingsPersisted"
              ];

              if (
                ignoredEvents.includes(type)
              ) {
                return;
              }

              this.scheduleRefresh();
            });
        }
      } catch (error) {
        console.warn(
          "[AIW.RecommendationEngine] Store subscription failed:",
          error
        );
      }
    },

    bindEvents() {
      const events = [
        "aiw:analyticsUpdated",
        "aiw:aiInsightUpdated",
        "aiw:decisionUpdated",
        "aiw:itemCreated",
        "aiw:itemUpdated",
        "aiw:itemDeleted",
        "aiw:itemRestored",
        "aiw:collectionChanged",
        "aiw:dataImported",
        "aiw:dataRestored",
        "aiw:dataReset",
        "aiw:crossTabSync"
      ];

      events.forEach(eventName => {
        window.addEventListener(
          eventName,
          event => {
            const sourceEvent =
              event?.detail?.sourceEvent;

            if (
              sourceEvent ===
              "aiw:recommendationsSynchronized"
            ) {
              return;
            }

            this.scheduleRefresh();
          }
        );
      });
    },

    scheduleRefresh() {
      window.clearTimeout(
        this._refreshTimer
      );

      this._refreshTimer =
        window.setTimeout(() => {
          this.refresh();
        }, 190);
    },

    emit(name, detail = {}) {
      try {
        window.dispatchEvent(
          new CustomEvent(name, {
            detail:
              this.clone(detail)
          })
        );
      } catch (error) {
        console.warn(
          `[AIW.RecommendationEngine] Event "${name}" failed:`,
          error
        );
      }
    },

    /* =========================================================
       METADATA
    ========================================================= */

    registerMetadata() {
      const store =
        this.getStore();

      if (
        !store ||
        typeof store.setMetadata !==
          "function"
      ) {
        return;
      }

      try {
        store.setMetadata({
          recommendationEngineVersion:
            this.version,

          recommendationEngine:
            "Enterprise Recommendation Intelligence",

          recommendationCapabilities: [
            "Executive Recommendations",
            "Project Recommendations",
            "Opportunity Recommendations",
            "Portfolio Recommendations",
            "Department Recommendations",
            "Risk Recommendations",
            "Governance Recommendations",
            "KPI Recommendations"
          ],

          lastRecommendationInitialization:
            this.now()
        });
      } catch (error) {
        console.warn(
          "[AIW.RecommendationEngine] Metadata registration skipped:",
          error
        );
      }
    },

    /* =========================================================
       CLEANUP
    ========================================================= */

    destroy() {
      window.clearTimeout(
        this._refreshTimer
      );

      if (
        typeof this._storeUnsubscribe ===
          "function"
      ) {
        try {
          this._storeUnsubscribe();
        } catch (error) {
          console.warn(
            "[AIW.RecommendationEngine] Store unsubscribe failed:",
            error
          );
        }
      }

      this._storeUnsubscribe = null;
      this._cache = null;
      this._isSynchronizing = false;
      this._initialized = false;
    }
  };

  /* =========================================================
     GLOBAL REFERENCES
  ========================================================= */

  AIW.RecommendationEngine =
    RecommendationEngine;

  /*
   * Legacy compatibility:
   * Older files may still call ATCRecommendationEngine.
   */
  window.ATCRecommendationEngine =
    RecommendationEngine;

  /* =========================================================
     BOOTSTRAP
  ========================================================= */

  const bootstrap = () => {
    AIW.RecommendationEngine.init();
  };

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      bootstrap,
      {
        once: true
      }
    );
  } else {
    bootstrap();
  }
})();