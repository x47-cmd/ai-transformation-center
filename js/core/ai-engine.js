/* =========================================================
   AI Work - AI Engine V1.1
   Enterprise Intelligence Layer

   Scope:
   - AIW.Store Integration
   - AIW.Analytics Integration
   - Executive Intelligence
   - Next Best Actions
   - Department Advice
   - Risk and Maturity Commentary
   - Opportunity Intelligence
   - Project Intelligence
   - Executive Report Generation
   - Automatic Synchronization
   - AIW.AI / AIW.AIEngine Compatibility
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};

  const AIEngine = {
    id: "ai-engine",
    version: "1.1.0",

    _initialized: false,
    _storeUnsubscribe: null,
    _refreshTimer: null,
    _cache: null,
    _cacheTimestamp: null,

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
        "aiw:aiEngineReady",
        {
          version: this.version,
          generatedAt: this.now()
        }
      );

      return this;
    },

    /* =========================================================
       DATA ACCESS
    ========================================================= */

    getStore() {
      return window.AIW?.Store || null;
    },

    getAnalytics() {
      return (
        window.AIW?.Analytics ||
        null
      );
    },

    get data() {
      return this.getData();
    },

    get analytics() {
      return this.getAnalytics() || {};
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
          "[AIW.AIEngine] Unable to read Store data:",
          error
        );
      }

      return window.AIW?.Data || {};
    },

    getIdeas() {
      const analytics =
        this.getAnalytics();

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
      const analytics =
        this.getAnalytics();

      if (
        analytics &&
        typeof analytics.getProjects === "function"
      ) {
        return analytics.getProjects();
      }

      const data = this.getData();

      return this.activeItems(
        data.projects?.length
          ? data.projects
          : data.flagshipProjects
      );
    },

    getDepartments() {
      const analytics =
        this.getAnalytics();

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
      const analytics =
        this.getAnalytics();

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
      const analytics =
        this.getAnalytics();

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
      return String(value || "")
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

    /* =========================================================
       ANALYTICS ACCESS
    ========================================================= */

    getScores() {
      const analytics =
        this.getAnalytics();

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

    getAnalyticsSummary() {
      const analytics =
        this.getAnalytics();

      if (
        analytics &&
        typeof analytics.executiveSummary ===
          "function"
      ) {
        return analytics.executiveSummary();
      }

      const scores =
        this.getScores();

      return {
        score:
          scores.executiveScore || 0,

        status:
          this.status(
            scores.executiveScore
          ),

        message:
          this.executiveInsight().message,

        recommendations: []
      };
    },

    /* =========================================================
       EXECUTIVE OVERVIEW
    ========================================================= */

    overview() {
      const summary =
        this.getAnalyticsSummary();

      const scores =
        this.getScores();

      const insight =
        this.executiveInsight();

      const recommendations =
        this.recommendations();

      return {
        score:
          summary.score ??
          scores.executiveScore ??
          0,

        status:
          summary.status ||
          insight.title ||
          "غير محدد",

        level:
          insight.level,

        color:
          insight.color,

        message:
          summary.message ||
          insight.message ||
          "",

        recommendations,

        nextActions:
          this.nextBestActions(),

        generatedAt:
          this.now()
      };
    },

    /* =========================================================
       RECOMMENDATIONS
    ========================================================= */

    recommendations(options = {}) {
      const analytics =
        this.getAnalytics();

      let recommendations = [];

      if (
        analytics &&
        typeof analytics.recommendations ===
          "function"
      ) {
        recommendations =
          analytics.recommendations({
            limit:
              options.limit,
            asText:
              options.asText === true
          });
      }

      if (!recommendations.length) {
        recommendations =
          this.generateFallbackRecommendations();
      }

      const limit =
        options.limit === undefined
          ? recommendations.length
          : Math.max(
              0,
              Number(options.limit) || 0
            );

      const result =
        recommendations.slice(0, limit);

      if (options.asText === true) {
        return result.map(item =>
          typeof item === "string"
            ? item
            : item.text ||
              item.description ||
              item.title ||
              ""
        );
      }

      return result.map(
        (item, index) => {
          if (
            typeof item === "string"
          ) {
            return {
              id:
                `ai-rec-${index + 1}`,

              priority:
                index === 0
                  ? "عالية"
                  : "متوسطة",

              category:
                "تنفيذي",

              title:
                "توصية تنفيذية",

              text: item,

              route:
                "decision"
            };
          }

          return {
            id:
              item.id ||
              `ai-rec-${index + 1}`,

            priority:
              item.priority ||
              "متوسطة",

            category:
              item.category ||
              "تنفيذي",

            title:
              item.title ||
              "توصية تنفيذية",

            text:
              item.text ||
              item.description ||
              "",

            route:
              item.route ||
              item.module ||
              "decision",

            ...this.clone(item)
          };
        }
      );
    },

    recommendationTexts(limit = null) {
      return this.recommendations({
        asText: true,
        limit:
          limit === null
            ? undefined
            : limit
      });
    },

    generateFallbackRecommendations() {
      const scores =
        this.getScores();

      const output = [];

      if (
        scores.maturityScore < 60
      ) {
        output.push({
          priority: "عالية",
          category: "النضج",
          title:
            "رفع الجاهزية المؤسسية",
          text:
            "تحسين جاهزية البيانات والمهارات والحوكمة قبل التوسع في المبادرات المعقدة.",
          route: "maturity"
        });
      }

      if (
        scores.riskScore < 70
      ) {
        output.push({
          priority: "عالية",
          category: "المخاطر",
          title:
            "معالجة المخاطر المفتوحة",
          text:
            "اعتماد ملاك وخطط معالجة للمخاطر ذات الأولوية العالية.",
          route: "governance"
        });
      }

      output.push({
        priority: "متوسطة",
        category: "المؤشرات",
        title:
          "ربط المشاريع بالمؤشرات",
        text:
          "يجب ربط كل مشروع بمؤشر أداء وهدف رقمي ومالك مسؤول.",
        route: "kpis"
      });

      return output;
    },

    /* =========================================================
       EXECUTIVE INSIGHT
    ========================================================= */

    executiveInsight() {
      const scores =
        this.getScores();

      const executiveScore =
        this.clamp(
          scores.executiveScore
        );

      if (executiveScore >= 85) {
        return {
          level: "Excellent",
          color: "green",
          title: "جاهزية عالية",
          message:
            "المنصة جاهزة للتوسع المؤسسي المنظم في مبادرات الذكاء الاصطناعي، مع استمرار قياس الأثر والمخاطر."
        };
      }

      if (executiveScore >= 70) {
        return {
          level: "Good",
          color: "green",
          title: "جاهزية جيدة",
          message:
            "يمكن توسيع المشاريع الاستراتيجية تدريجياً مع استكمال الفجوات المتبقية في الحوكمة ومؤشرات الأداء."
        };
      }

      if (executiveScore >= 50) {
        return {
          level: "Medium",
          color: "orange",
          title: "مرحلة التطوير",
          message:
            "الأساس التشغيلي جيد، لكن يفضل زيادة المكاسب السريعة وتقوية الحوكمة وربط المبادرات بالمؤشرات قبل التوسع."
        };
      }

      if (executiveScore >= 30) {
        return {
          level: "Foundation",
          color: "orange",
          title: "مرحلة البناء",
          message:
            "المنصة تحتاج إلى استكمال البيانات والضوابط والجاهزية المؤسسية قبل اعتماد مبادرات واسعة النطاق."
        };
      }

      return {
        level: "Low",
        color: "red",
        title: "التأسيس أولاً",
        message:
          "الأولوية الحالية هي بناء الحوكمة والبيانات ومؤشرات الأداء وتحديد المبادرات منخفضة المخاطر."
      };
    },

    /* =========================================================
       NEXT BEST ACTIONS
    ========================================================= */

    nextBestActions(options = {}) {
      const scores =
        this.getScores();

      const analytics =
        this.getAnalytics();

      const quickWins =
        analytics &&
        typeof analytics.quickWins ===
          "function"
          ? analytics.quickWins()
          : this.findQuickWins();

      const risks =
        analytics &&
        typeof analytics.riskBreakdown ===
          "function"
          ? analytics.riskBreakdown()
          : this.riskBreakdown();

      const projects =
        analytics &&
        typeof analytics.projectStatusBreakdown ===
          "function"
          ? analytics.projectStatusBreakdown()
          : this.projectBreakdown();

      const actions = [];

      if (quickWins.length) {
        actions.push({
          id: "launch-quick-wins",
          priority: 1,
          level: "عالية",
          category: "الفرص",
          title:
            "إطلاق أفضل المكاسب السريعة",
          description:
            `اختيار أفضل ثلاث فرص من أصل ${quickWins.length} فرص سريعة لإثبات القيمة التشغيلية مبكراً.`,
          route: "ideas",
          action:
            "REVIEW_QUICK_WINS"
        });
      }

      if (
        scores.governanceScore < 70 ||
        scores.riskScore < 70 ||
        risks.high > 0 ||
        risks.critical > 0
      ) {
        actions.push({
          id: "activate-governance",
          priority: 2,
          level: "عالية",
          category: "الحوكمة",
          title:
            "تفعيل مراجعة الحوكمة والمخاطر",
          description:
            "مراجعة الخصوصية والإشراف البشري وخطط المعالجة قبل اعتماد الحالات الحساسة.",
          route: "governance",
          action:
            "REVIEW_GOVERNANCE"
        });
      }

      if (
        scores.kpiScore < 75
      ) {
        actions.push({
          id: "link-project-kpis",
          priority: 3,
          level: "متوسطة",
          category: "المؤشرات",
          title:
            "ربط جميع المشاريع بمؤشرات أداء",
          description:
            "تحديد مؤشر وهدف ومالك لكل مشروع قبل الانتقال إلى مرحلة الاعتماد أو التشغيل.",
          route: "kpis",
          action:
            "LINK_PROJECT_KPIS"
        });
      }

      if (
        projects.delayed > 0
      ) {
        actions.push({
          id: "recover-delayed-projects",
          priority: 4,
          level: "عالية",
          category: "المشاريع",
          title:
            "معالجة المشاريع المتأخرة",
          description:
            `توجد ${projects.delayed} مشاريع متأخرة أو متعثرة وتحتاج إلى قرار وخطة تصحيح.`,
          route: "projects",
          action:
            "REVIEW_DELAYED_PROJECTS"
        });
      }

      if (
        scores.maturityScore < 65
      ) {
        actions.push({
          id: "raise-maturity",
          priority: 5,
          level: "متوسطة",
          category: "النضج",
          title:
            "رفع نضج الإدارات الأقل جاهزية",
          description:
            "توجيه خطط تحسين محددة للإدارات ذات الجاهزية المنخفضة وربطها بمواعيد ومستهدفات.",
          route: "maturity",
          action:
            "IMPROVE_MATURITY"
        });
      }

      if (
        scores.dataScore < 70
      ) {
        actions.push({
          id: "complete-platform-data",
          priority: 6,
          level: "متوسطة",
          category: "البيانات",
          title:
            "استكمال بيانات المنصة",
          description:
            "إكمال بيانات المشاريع والمخاطر والحوكمة والمؤشرات لرفع دقة التحليلات والتوصيات.",
          route: "settings",
          action:
            "COMPLETE_PLATFORM_DATA"
        });
      }

      actions.push({
        id: "quarterly-value-review",
        priority: 7,
        level: "منخفضة",
        category: "القياس",
        title:
          "تنفيذ مراجعة دورية للقيمة",
        description:
          "مراجعة الأثر التشغيلي والمالي وجودة الخدمة بشكل دوري بدلاً من الاعتماد على التقديرات فقط.",
        route: "reports",
        action:
          "REVIEW_VALUE"
      });

      const sortedActions =
        actions.sort(
          (a, b) =>
            a.priority - b.priority
        );

      const limit =
        options.limit === undefined
          ? sortedActions.length
          : Math.max(
              0,
              Number(options.limit) || 0
            );

      return sortedActions.slice(
        0,
        limit
      );
    },

    findQuickWins() {
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
            idea.complexity;

          const cost =
            idea.cost ||
            idea.costLevel;

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

    /* =========================================================
       DEPARTMENT INTELLIGENCE
    ========================================================= */

    departmentAdvice(nameOrDepartment) {
      const department =
        typeof nameOrDepartment ===
        "object"
          ? nameOrDepartment
          : this.findDepartment(
              nameOrDepartment
            );

      const name =
        typeof nameOrDepartment ===
        "string"
          ? nameOrDepartment
          : department?.name ||
            department?.title ||
            "";

      const maturity =
        this.getDepartmentMaturity(
          department
        );

      const opportunityCount =
        this.getIdeas().filter(idea => {
          const ideaDepartment =
            idea.department ||
            idea.departmentName ||
            idea.portfolio ||
            "";

          return (
            this.normalizeArabic(
              ideaDepartment
            ) ===
            this.normalizeArabic(name)
          );
        }).length;

      const baseAdvice =
        this.getDepartmentBaseAdvice(name);

      let maturityAdvice = "";

      if (maturity >= 80) {
        maturityAdvice =
          "الإدارة جاهزة لبدء مبادرات متقدمة وربطها بالتحليلات التنبؤية.";
      } else if (maturity >= 65) {
        maturityAdvice =
          "يمكن البدء بمشروع تشغيلي واضح مع قياس الأثر قبل التوسع.";
      } else if (maturity >= 40) {
        maturityAdvice =
          "يفضل البدء بمشروع منخفض التعقيد مع تحسين البيانات والمهارات بالتوازي.";
      } else {
        maturityAdvice =
          "الأولوية هي تأسيس البيانات والعمليات والحوكمة قبل تنفيذ مشروع واسع.";
      }

      return {
        department:
          name ||
          "محفظة تشغيلية",

        maturity,

        maturityStatus:
          this.maturityStatus(
            maturity
          ),

        opportunityCount,

        title:
          `توجيه تنفيذي لـ ${
            name ||
            "الإدارة"
          }`,

        advice:
          `${baseAdvice} ${maturityAdvice}`,

        recommendedRoute:
          opportunityCount
            ? "ideas"
            : "maturity"
      };
    },

    getDepartmentBaseAdvice(name) {
      const normalizedName =
        this.normalizeArabic(name);

      const adviceMap = [
        {
          terms: [
            "تقنية المعلومات",
            "تقنيه المعلومات",
            "it",
            "technology"
          ],
          advice:
            "التركيز على تكامل الأنظمة، جودة البيانات، المراقبة الذكية، والمساعدات التشغيلية."
        },
        {
          terms: [
            "الأمن الرقمي",
            "الامن الرقمي",
            "الأمن السيبراني",
            "cybersecurity",
            "security"
          ],
          advice:
            "التركيز على اكتشاف الشذوذ، تحليل المخاطر، مراقبة الصلاحيات والاستجابة الاستباقية."
        },
        {
          terms: [
            "الموارد البشرية",
            "hr",
            "human resources"
          ],
          advice:
            "البدء بالمساعد الداخلي، إدارة المعرفة، وتحليل المهارات والاحتياجات التدريبية."
        },
        {
          terms: [
            "المالية",
            "finance",
            "financial"
          ],
          advice:
            "التركيز على التنبؤ المالي، كشف الحالات غير المعتادة، والتقارير التنفيذية الآلية."
        },
        {
          terms: [
            "خدمة المتعاملين",
            "المتعاملين",
            "customer service",
            "customers"
          ],
          advice:
            "البدء بالمساعد الذكي، تحليل رحلة المتعامل، وتحسين سرعة وجودة الخدمة."
        },
        {
          terms: [
            "القانونية",
            "الشؤون القانونية",
            "legal"
          ],
          advice:
            "التركيز على مراجعة السياسات والوثائق مع الإبقاء على الاعتماد البشري الكامل."
        },
        {
          terms: [
            "التسجيل",
            "البيومتري",
            "biometric",
            "enrollment"
          ],
          advice:
            "التركيز على جودة التسجيل، تحليل الأخطاء، كشف التكرار، ومساعدة الموظف في معالجة الحالات."
        },
        {
          terms: [
            "البوابات",
            "gates",
            "smart gates"
          ],
          advice:
            "التركيز على مراقبة الأداء، توقع الأعطال، وتحليل أسباب الرفض أو التباطؤ."
        },
        {
          terms: [
            "الصلاحيات",
            "permissions",
            "access"
          ],
          advice:
            "التركيز على تجهيز طلبات الصلاحيات، اكتشاف الاستخدام غير المعتاد، والمراجعة الدورية."
        }
      ];

      const matchedAdvice =
        adviceMap.find(item =>
          item.terms.some(term =>
            normalizedName.includes(
              this.normalizeArabic(term)
            )
          )
        );

      return (
        matchedAdvice?.advice ||
        "ابدأ بمشروع سريع منخفض المخاطر والتكلفة، مع تحديد مؤشر أداء واضح ومالك مسؤول."
      );
    },

    findDepartment(name) {
      const normalizedName =
        this.normalizeArabic(name);

      return (
        this.getDepartments().find(
          department =>
            this.normalizeArabic(
              department.name ||
              department.title
            ) === normalizedName
        ) ||
        null
      );
    },

    getDepartmentMaturity(department) {
      if (!department) {
        return 0;
      }

      const analytics =
        this.getAnalytics();

      if (
        analytics &&
        typeof analytics.getDepartmentMaturity ===
          "function"
      ) {
        return analytics.getDepartmentMaturity(
          department
        );
      }

      return this.clamp(
        department.maturity ??
        department.readiness ??
        department.score ??
        department.progress ??
        0
      );
    },

    maturityStatus(score) {
      const value =
        this.clamp(score);

      if (value >= 80) {
        return "متقدم";
      }

      if (value >= 65) {
        return "جاهز";
      }

      if (value >= 40) {
        return "قيد التطوير";
      }

      return "تأسيسي";
    },

    /* =========================================================
       RISK INTELLIGENCE
    ========================================================= */

    riskComment(score) {
      const value =
        this.clamp(score);

      if (value >= 85) {
        return "المخاطر تحت السيطرة مع وجود ضوابط ومعالجات مناسبة.";
      }

      if (value >= 70) {
        return "وضع المخاطر مستقر، مع ضرورة استمرار المراجعة الدورية للحالات الحساسة.";
      }

      if (value >= 50) {
        return "توجد مخاطر تحتاج إلى متابعة وخطط معالجة وملاك واضحين.";
      }

      return "الحوكمة ومعالجة المخاطر يجب أن تكونا أولوية قبل التوسع التشغيلي.";
    },

    riskInsight() {
      const scores =
        this.getScores();

      const analytics =
        this.getAnalytics();

      const breakdown =
        analytics &&
        typeof analytics.riskBreakdown ===
          "function"
          ? analytics.riskBreakdown()
          : this.riskBreakdown();

      const score =
        this.clamp(
          scores.riskScore
        );

      return {
        score,
        status:
          score >= 80
            ? "مستقر"
            : score >= 60
              ? "يحتاج متابعة"
              : "أولوية عالية",

        color:
          score >= 70
            ? "green"
            : score >= 50
              ? "orange"
              : "red",

        comment:
          this.riskComment(score),

        breakdown,

        action:
          breakdown.high > 0 ||
          breakdown.critical > 0
            ? "مراجعة المخاطر العالية قبل اعتماد المشاريع المرتبطة بها."
            : "الاستمرار في المراقبة الدورية وتحديث خطط المعالجة."
      };
    },

    riskBreakdown() {
      const output = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        unknown: 0,
        total: 0
      };

      const risks = this.getRisks();

      output.total = risks.length;

      risks.forEach(risk => {
        const level =
          risk.level ||
          risk.riskLevel ||
          risk.severity ||
          "";

        if (
          this.includesAny(level, [
            "حرج",
            "critical"
          ])
        ) {
          output.critical += 1;
        } else if (
          this.includesAny(level, [
            "عال",
            "عالية",
            "مرتفع",
            "high"
          ])
        ) {
          output.high += 1;
        } else if (
          this.includesAny(level, [
            "متوسط",
            "medium"
          ])
        ) {
          output.medium += 1;
        } else if (
          this.includesAny(level, [
            "منخفض",
            "low"
          ])
        ) {
          output.low += 1;
        } else {
          output.unknown += 1;
        }
      });

      return output;
    },

    /* =========================================================
       MATURITY INTELLIGENCE
    ========================================================= */

    maturityComment(score) {
      const value =
        this.clamp(score);

      if (value >= 85) {
        return "نضج مؤسسي مرتفع يدعم المبادرات المتقدمة والتحليلات التنبؤية.";
      }

      if (value >= 70) {
        return "نضج جيد يسمح بالتوسع التدريجي مع معالجة الفجوات المتبقية.";
      }

      if (value >= 50) {
        return "مرحلة تطوير تحتاج إلى تحسين البيانات والمهارات والحوكمة.";
      }

      if (value >= 30) {
        return "مرحلة انتقالية تركز على بناء القدرات والمكاسب السريعة.";
      }

      return "مرحلة تأسيس تتطلب وضع الأساس التشغيلي والتنظيمي أولاً.";
    },

    maturityInsight() {
      const scores =
        this.getScores();

      const score =
        this.clamp(
          scores.maturityScore
        );

      const analytics =
        this.getAnalytics();

      const ranking =
        analytics &&
        typeof analytics.departmentRanking ===
          "function"
          ? analytics.departmentRanking({
              limit: 3
            })
          : [];

      return {
        score,
        status:
          this.maturityStatus(score),

        color:
          score >= 70
            ? "green"
            : score >= 45
              ? "orange"
              : "red",

        comment:
          this.maturityComment(score),

        topDepartments:
          ranking.map(
            department => ({
              name:
                department.name ||
                department.title ||
                "محفظة تشغيلية",

              maturity:
                department.analyticsMaturity ??
                this.getDepartmentMaturity(
                  department
                )
            })
          )
      };
    },

    /* =========================================================
       OPPORTUNITY INTELLIGENCE
    ========================================================= */

    opportunityInsight(ideaOrId) {
      const idea =
        typeof ideaOrId === "object"
          ? ideaOrId
          : this.getIdeas().find(
              item =>
                String(item.id) ===
                String(ideaOrId)
            );

      if (!idea) {
        return null;
      }

      const analytics =
        this.getAnalytics();

      const score =
        analytics &&
        typeof analytics.calculateIdeaScore ===
          "function"
          ? analytics.calculateIdeaScore(
              idea
            )
          : this.calculateFallbackIdeaScore(
              idea
            );

      const riskLevel =
        idea.riskLevel ||
        idea.risk ||
        "غير محدد";

      const quickWin =
        idea.quickWin === true ||
        idea.isQuickWin === true ||
        this.findQuickWins().some(
          item =>
            String(item.id) ===
            String(idea.id)
        );

      let decision =
        "يحتاج مراجعة";

      let color =
        "orange";

      if (
        score >= 80 &&
        !this.includesAny(
          riskLevel,
          [
            "حرج",
            "عال",
            "high",
            "critical"
          ]
        )
      ) {
        decision =
          "مرشح للتنفيذ";
        color = "green";
      } else if (score < 50) {
        decision =
          "أولوية منخفضة";
        color = "red";
      }

      return {
        id: idea.id,
        title:
          idea.title ||
          idea.name ||
          "فرصة ذكاء اصطناعي",

        score:
          this.clamp(score),

        decision,

        color,

        quickWin,

        riskLevel,

        message:
          quickWin
            ? "الفرصة مناسبة للمكاسب السريعة بشرط استكمال المالك والمؤشر ومراجعة المخاطر."
            : score >= 70
              ? "الفرصة ذات قيمة جيدة وتحتاج إلى استكمال متطلبات التنفيذ والحوكمة."
              : "الفرصة تحتاج إلى إعادة تقييم الأثر والتكلفة والمخاطر قبل الاعتماد.",

        nextAction:
          this.includesAny(
            riskLevel,
            [
              "حرج",
              "عال",
              "high",
              "critical"
            ]
          )
            ? "إحالة الفرصة إلى الحوكمة ومراجعة المخاطر."
            : "استكمال دراسة الجدوى وربط الفرصة بمؤشر أداء."
      };
    },

    calculateFallbackIdeaScore(idea) {
      let score = 50;

      if (
        this.includesAny(
          idea.priority,
          [
            "عال",
            "عالية",
            "مرتفع",
            "high"
          ]
        )
      ) {
        score += 20;
      }

      if (
        idea.quickWin === true ||
        idea.isQuickWin === true
      ) {
        score += 15;
      }

      if (
        this.includesAny(
          idea.impact,
          [
            "عال",
            "عالية",
            "مرتفع",
            "high"
          ]
        )
      ) {
        score += 10;
      }

      if (
        this.includesAny(
          idea.riskLevel ||
          idea.risk,
          [
            "حرج",
            "عال",
            "high",
            "critical"
          ]
        )
      ) {
        score -= 20;
      }

      return this.clamp(score);
    },

    /* =========================================================
       PROJECT INTELLIGENCE
    ========================================================= */

    projectInsight(projectOrId) {
      const project =
        typeof projectOrId === "object"
          ? projectOrId
          : this.getProjects().find(
              item =>
                String(item.id) ===
                String(projectOrId)
            );

      if (!project) {
        return null;
      }

      const analytics =
        this.getAnalytics();

      const health =
        analytics &&
        typeof analytics.calculateProjectHealth ===
          "function"
          ? analytics.calculateProjectHealth(
              project
            )
          : this.clamp(
              project.health ||
              project.readiness ||
              project.progress ||
              0
            );

      const progress =
        this.clamp(
          project.progress ||
          project.completion ||
          project.completionRate ||
          0
        );

      const riskLevel =
        project.riskLevel ||
        project.risk ||
        "غير محدد";

      const delayed =
        this.includesAny(
          project.status,
          [
            "متأخر",
            "متعثر",
            "delayed",
            "blocked"
          ]
        );

      return {
        id: project.id,
        title:
          project.title ||
          project.name ||
          "مشروع",

        health,

        progress,

        riskLevel,

        status:
          project.status ||
          "غير محدد",

        color:
          health >= 75
            ? "green"
            : health >= 50
              ? "orange"
              : "red",

        message:
          delayed
            ? "المشروع يحتاج إلى خطة تصحيح وقرار لمعالجة أسباب التأخير."
            : health >= 75
              ? "المشروع في وضع جيد مع استمرار متابعة المؤشرات والمخاطر."
              : "المشروع يحتاج إلى تحسين الجاهزية والملكية وربط المخرجات بالمؤشرات.",

        nextAction:
          delayed
            ? "رفع المشروع إلى مركز القرار لمراجعة الجدول والمخاطر."
            : !project.kpi &&
                !project.kpiId &&
                !project.kpis
              ? "ربط المشروع بمؤشر أداء واضح."
              : "الاستمرار في المتابعة الدورية."
      };
    },

    projectBreakdown() {
      const output = {
        completed: 0,
        active: 0,
        planned: 0,
        delayed: 0,
        other: 0,
        total: 0
      };

      const projects =
        this.getProjects();

      output.total =
        projects.length;

      projects.forEach(project => {
        const status =
          project.status || "";

        if (
          this.includesAny(status, [
            "مكتمل",
            "منجز",
            "completed"
          ])
        ) {
          output.completed += 1;
        } else if (
          this.includesAny(status, [
            "نشط",
            "قيد التنفيذ",
            "active",
            "in progress"
          ])
        ) {
          output.active += 1;
        } else if (
          this.includesAny(status, [
            "مخطط",
            "جديد",
            "planned",
            "new"
          ])
        ) {
          output.planned += 1;
        } else if (
          this.includesAny(status, [
            "متأخر",
            "متعثر",
            "delayed",
            "blocked"
          ])
        ) {
          output.delayed += 1;
        } else {
          output.other += 1;
        }
      });

      return output;
    },

    /* =========================================================
       STATUS
    ========================================================= */

    status(score) {
      const value =
        this.clamp(score);

      if (value >= 85) {
        return "متقدم";
      }

      if (value >= 70) {
        return "مستقر";
      }

      if (value >= 50) {
        return "قيد التطوير";
      }

      if (value >= 30) {
        return "قيد البناء";
      }

      return "يحتاج تأسيس";
    },

    statusClass(score) {
      const value =
        this.clamp(score);

      if (value >= 70) {
        return "green";
      }

      if (value >= 45) {
        return "orange";
      }

      return "red";
    },

    /* =========================================================
       EXECUTIVE REPORT
    ========================================================= */

    generateExecutiveReport(options = {}) {
      const overview =
        this.overview();

      const insight =
        this.executiveInsight();

      const scores =
        this.getScores();

      const riskInsight =
        this.riskInsight();

      const maturityInsight =
        this.maturityInsight();

      const recommendations =
        this.recommendations({
          limit:
            options.recommendationLimit ??
            5
        });

      const nextActions =
        this.nextBestActions({
          limit:
            options.actionLimit ??
            5
        });

      const topOpportunities =
        this.getTopOpportunities(
          options.opportunityLimit ??
          5
        );

      const projectInsights =
        this.getProjects()
          .slice(
            0,
            options.projectLimit ??
            5
          )
          .map(project =>
            this.projectInsight(project)
          )
          .filter(Boolean);

      const report = {
        id:
          `ai-report-${Date.now()}`,

        type:
          "executive-ai-report",

        title:
          options.title ||
          "التقرير التنفيذي للذكاء الاصطناعي",

        generatedAt:
          this.now(),

        engineVersion:
          this.version,

        score:
          overview.score,

        status:
          insight.title,

        level:
          insight.level,

        color:
          insight.color,

        message:
          insight.message,

        scores,

        risk:
          riskInsight,

        maturity:
          maturityInsight,

        recommendations,

        nextActions,

        topOpportunities,

        projectInsights,

        summary: {
          ideas:
            this.getIdeas().length,

          projects:
            this.getProjects().length,

          departments:
            this.getDepartments().length,

          risks:
            this.getRisks().length,

          kpis:
            this.getKpis().length
        }
      };

      if (
        options.save === true
      ) {
        this.saveReport(report);
      }

      this.emit(
        "aiw:aiReportGenerated",
        report
      );

      return report;
    },

    getTopOpportunities(limit = 5) {
      const analytics =
        this.getAnalytics();

      if (
        analytics &&
        typeof analytics.opportunityRanking ===
          "function"
      ) {
        return analytics
          .opportunityRanking(limit)
          .map(idea => ({
            ...idea,
            insight:
              this.opportunityInsight(
                idea
              )
          }));
      }

      return this.getIdeas()
        .map(idea => ({
          ...idea,
          insight:
            this.opportunityInsight(
              idea
            )
        }))
        .sort(
          (a, b) =>
            (
              b.insight?.score ||
              0
            ) -
            (
              a.insight?.score ||
              0
            )
        )
        .slice(
          0,
          Math.max(
            0,
            Number(limit) || 5
          )
        );
    },

    saveReport(report) {
      const store =
        this.getStore();

      if (!store || !report) {
        return false;
      }

      try {
        if (
          typeof store.add === "function"
        ) {
          store.add(
            "reports",
            {
              ...report,
              source:
                "AI Engine",
              status:
                "generated"
            }
          );

          return true;
        }

        const data =
          this.getData();

        data.reports =
          this.toArray(
            data.reports
          );

        data.reports.unshift(
          report
        );

        if (
          typeof store.saveData ===
            "function"
        ) {
          store.saveData(
            data,
            "aiw:aiReportSaved"
          );

          return true;
        }
      } catch (error) {
        console.warn(
          "[AIW.AIEngine] Report save failed:",
          error
        );
      }

      return false;
    },

    /* =========================================================
       COMPLETE AI SNAPSHOT
    ========================================================= */

    snapshot() {
      const snapshot = {
        overview:
          this.overview(),

        insight:
          this.executiveInsight(),

        scores:
          this.getScores(),

        recommendations:
          this.recommendations(),

        nextActions:
          this.nextBestActions(),

        risk:
          this.riskInsight(),

        maturity:
          this.maturityInsight(),

        topOpportunities:
          this.getTopOpportunities(5),

        projects:
          this.getProjects()
            .slice(0, 5)
            .map(project =>
              this.projectInsight(project)
            )
            .filter(Boolean),

        generatedAt:
          this.now()
      };

      this._cache =
        snapshot;

      this._cacheTimestamp =
        snapshot.generatedAt;

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
        "aiw:aiInsightUpdated",
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
        !snapshot
      ) {
        return;
      }

      const aiSummary = {
        score:
          snapshot.overview.score,

        status:
          snapshot.insight.title,

        level:
          snapshot.insight.level,

        color:
          snapshot.insight.color,

        message:
          snapshot.insight.message,

        recommendations:
          snapshot.recommendations.slice(
            0,
            5
          ),

        nextActions:
          snapshot.nextActions.slice(
            0,
            5
          ),

        updatedAt:
          snapshot.generatedAt
      };

      try {
        const currentSummary =
          typeof store.get === "function"
            ? store.get(
                "dashboard.aiInsight",
                {}
              )
            : {};

        const changed =
          JSON.stringify(
            currentSummary
          ) !==
          JSON.stringify(
            aiSummary
          );

        if (!changed) {
          return;
        }

        if (
          typeof store.set === "function"
        ) {
          store.set(
            "dashboard.aiInsight",
            aiSummary,
            {
              eventName:
                "aiw:aiInsightSynchronized",

              backup: false,
              notify: false
            }
          );
        }
      } catch (error) {
        console.warn(
          "[AIW.AIEngine] Store synchronization skipped:",
          error
        );
      }
    },

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
                "aiw:aiInsightUpdated",
                "aiw:aiInsightSynchronized",
                "aiw:analyticsUpdated",
                "aiw:analyticsSynchronized",
                "aiw:metadataChanged",
                "persist",
                "settingsPersisted"
              ];

              if (
                ignoredEvents.includes(
                  type
                )
              ) {
                return;
              }

              this.scheduleRefresh();
            });
        }
      } catch (error) {
        console.warn(
          "[AIW.AIEngine] Store subscription failed:",
          error
        );
      }
    },

    bindEvents() {
      const events = [
        "aiw:analyticsUpdated",
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
              "aiw:aiInsightSynchronized"
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
        }, 150);
    },

    /* =========================================================
       METADATA AND EVENTS
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
          aiEngineVersion:
            this.version,

          aiEngine:
            "Enterprise Intelligence Layer",

          aiCapabilities: [
            "Executive Intelligence",
            "Recommendations",
            "Next Best Actions",
            "Department Advice",
            "Risk Intelligence",
            "Maturity Intelligence",
            "Opportunity Intelligence",
            "Project Intelligence",
            "Executive Reports"
          ],

          lastAIEngineInitialization:
            this.now()
        });
      } catch (error) {
        console.warn(
          "[AIW.AIEngine] Metadata registration skipped:",
          error
        );
      }
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
          `[AIW.AIEngine] Event "${name}" failed:`,
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
            "[AIW.AIEngine] Store unsubscribe failed:",
            error
          );
        }
      }

      this._storeUnsubscribe = null;
      this._cache = null;
      this._cacheTimestamp = null;
      this._initialized = false;
    }
  };

  /* =========================================================
     GLOBAL REFERENCES
  ========================================================= */

  AIW.AIEngine = AIEngine;

  /*
   * Legacy compatibility:
   * Existing modules may still use AIW.AI.
   */
  AIW.AI = AIEngine;

  /* =========================================================
     BOOTSTRAP
  ========================================================= */

  const bootstrap = () => {
    AIW.AIEngine.init();
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