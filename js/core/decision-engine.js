/* =========================================================
   AI Work - Decision Engine V2.1
   Enterprise Decision Intelligence Foundation

   Scope:
   - AIW.Store Integration
   - AIW.Analytics Integration
   - AIW.AIEngine Integration
   - Project Evaluation
   - Opportunity Evaluation
   - Portfolio Evaluation
   - Risk-Aware Decisions
   - Governance Readiness
   - KPI and Ownership Validation
   - Explainable Decision Factors
   - Automatic Decision Synchronization
   - Legacy ATCDecisionEngine Compatibility
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};

  const DecisionEngine = {
    id: "decision-engine",
    version: "2.1.0",

    _initialized: false,
    _storeUnsubscribe: null,
    _refreshTimer: null,
    _cache: null,
    _isSynchronizing: false,

    weights: {
      project: {
        impact: 22,
        readiness: 16,
        maturity: 12,
        strategicAlignment: 12,
        governance: 10,
        kpiReadiness: 8,
        ownership: 7,
        feasibility: 7,
        risk: 6
      },

      opportunity: {
        impact: 24,
        priority: 14,
        feasibility: 14,
        quickWin: 12,
        strategicAlignment: 12,
        governance: 8,
        ownership: 6,
        dataReadiness: 5,
        risk: 5
      }
    },

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
        "aiw:decisionEngineReady",
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
      return window.AIW?.Analytics || null;
    },

    getAIEngine() {
      return (
        window.AIW?.AIEngine ||
        window.AIW?.AI ||
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
          "[AIW.DecisionEngine] Unable to read Store data:",
          error
        );
      }

      return window.AIW?.Data || {};
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

      if (projects.length) {
        return projects;
      }

      return this.activeItems(
        data.flagshipProjects
      );
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

    getGovernance() {
      const analytics = this.getAnalytics();

      if (
        analytics &&
        typeof analytics.getGovernance === "function"
      ) {
        return analytics.getGovernance();
      }

      return this.activeItems(
        this.getData().governance
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

    isPlainObject(value) {
      return Boolean(
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
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

    number(value, fallback = 0) {
      const number = Number(value);

      return Number.isFinite(number)
        ? number
        : fallback;
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

    getFirstNumber(
      source,
      fields = [],
      fallback = 0
    ) {
      for (const field of fields) {
        const value = source?.[field];
        const number = Number(value);

        if (Number.isFinite(number)) {
          return number;
        }
      }

      return fallback;
    },

    average(values = []) {
      const validValues =
        this.toArray(values)
          .map(Number)
          .filter(Number.isFinite);

      if (!validValues.length) {
        return 0;
      }

      return this.clamp(
        validValues.reduce(
          (total, value) => total + value,
          0
        ) / validValues.length
      );
    },

    weightedScore(factors = []) {
      const validFactors =
        this.toArray(factors).filter(
          factor =>
            Number.isFinite(
              Number(factor?.score)
            ) &&
            Number.isFinite(
              Number(factor?.weight)
            ) &&
            Number(factor.weight) > 0
        );

      if (!validFactors.length) {
        return 0;
      }

      const totalWeight =
        validFactors.reduce(
          (total, factor) =>
            total + Number(factor.weight),
          0
        );

      const weightedTotal =
        validFactors.reduce(
          (total, factor) =>
            total +
            Number(factor.score) *
              Number(factor.weight),
          0
        );

      return this.clamp(
        weightedTotal / totalWeight
      );
    },

    /* =========================================================
       PROJECT EVALUATION
    ========================================================= */

    evaluateProject(project = {}) {
      const factors =
        this.getProjectFactors(project);

      const score =
        this.weightedScore(factors);

      const blockers =
        this.getProjectBlockers(
          project,
          factors
        );

      const warnings =
        this.getProjectWarnings(
          project,
          factors
        );

      const decision =
        this.getDecision(
          score,
          blockers
        );

      const priority =
        this.getPriority(score);

      const result = {
        id:
          project.id ||
          null,

        title:
          project.title ||
          project.name ||
          "مشروع",

        type: "project",

        score,

        priority,

        priorityAr:
          this.getPriorityArabic(
            priority
          ),

        recommendation:
          decision.code,

        recommendationAr:
          decision.label,

        decision:
          decision.code,

        decisionLabel:
          decision.label,

        decisionColor:
          decision.color,

        confidence:
          this.calculateConfidence(
            project,
            factors
          ),

        factors,

        strengths:
          this.getStrengths(factors),

        weaknesses:
          this.getWeaknesses(factors),

        blockers,

        warnings,

        rationale:
          this.buildProjectRationale(
            project,
            score,
            factors,
            blockers
          ),

        nextActions:
          this.getProjectNextActions(
            project,
            score,
            factors,
            blockers
          ),

        evaluatedAt:
          this.now(),

        engineVersion:
          this.version
      };

      return result;
    },

    getProjectFactors(project = {}) {
      const weights =
        this.weights.project;

      const impact =
        this.getImpactScore(project);

      const readiness =
        this.getProjectReadinessScore(
          project
        );

      const maturity =
        this.getMaturityScore(project);

      const strategicAlignment =
        this.getStrategicAlignmentScore(
          project
        );

      const governance =
        this.getGovernanceReadinessScore(
          project
        );

      const kpiReadiness =
        this.getKpiReadinessScore(
          project
        );

      const ownership =
        this.getOwnershipScore(project);

      const feasibility =
        this.getFeasibilityScore(
          project
        );

      const risk =
        this.getRiskSafetyScore(project);

      return [
        this.factor(
          "impact",
          "الأثر المتوقع",
          impact,
          weights.impact
        ),

        this.factor(
          "readiness",
          "الجاهزية التنفيذية",
          readiness,
          weights.readiness
        ),

        this.factor(
          "maturity",
          "النضج",
          maturity,
          weights.maturity
        ),

        this.factor(
          "strategicAlignment",
          "المواءمة الاستراتيجية",
          strategicAlignment,
          weights.strategicAlignment
        ),

        this.factor(
          "governance",
          "جاهزية الحوكمة",
          governance,
          weights.governance
        ),

        this.factor(
          "kpiReadiness",
          "جاهزية مؤشرات الأداء",
          kpiReadiness,
          weights.kpiReadiness
        ),

        this.factor(
          "ownership",
          "الملكية والمسؤولية",
          ownership,
          weights.ownership
        ),

        this.factor(
          "feasibility",
          "قابلية التنفيذ",
          feasibility,
          weights.feasibility
        ),

        this.factor(
          "risk",
          "سلامة المخاطر",
          risk,
          weights.risk
        )
      ];
    },

    getProjectBlockers(
      project,
      factors
    ) {
      const blockers = [];

      const governance =
        this.getFactorScore(
          factors,
          "governance"
        );

      const ownership =
        this.getFactorScore(
          factors,
          "ownership"
        );

      const risk =
        this.getFactorScore(
          factors,
          "risk"
        );

      const readiness =
        this.getFactorScore(
          factors,
          "readiness"
        );

      if (
        risk < 35 ||
        this.isCriticalRisk(project)
      ) {
        blockers.push({
          code: "CRITICAL_RISK",
          title:
            "مخاطر مرتفعة أو حرجة",
          description:
            "لا يوصى بالتنفيذ قبل اعتماد خطة معالجة ومراجعة الحوكمة."
        });
      }

      if (
        governance < 35 &&
        this.isSensitiveItem(project)
      ) {
        blockers.push({
          code:
            "GOVERNANCE_NOT_READY",
          title:
            "الحوكمة غير مكتملة",
          description:
            "المشروع حساس ويتطلب مراجعة الخصوصية والإشراف البشري قبل الاعتماد."
        });
      }

      if (ownership < 30) {
        blockers.push({
          code: "NO_OWNER",
          title:
            "لا يوجد مالك واضح",
          description:
            "يجب تحديد مالك للمشروع ومسؤول عن النتائج قبل بدء التنفيذ."
        });
      }

      if (
        readiness < 25 &&
        this.includesAny(
          project.status,
          [
            "ready",
            "جاهز",
            "approved",
            "معتمد"
          ]
        )
      ) {
        blockers.push({
          code: "LOW_READINESS",
          title:
            "الجاهزية منخفضة",
          description:
            "حالة المشروع لا تتوافق مع مستوى الجاهزية الفعلي."
        });
      }

      return blockers;
    },

    getProjectWarnings(
      project,
      factors
    ) {
      const warnings = [];

      const kpiScore =
        this.getFactorScore(
          factors,
          "kpiReadiness"
        );

      const feasibility =
        this.getFactorScore(
          factors,
          "feasibility"
        );

      const strategicAlignment =
        this.getFactorScore(
          factors,
          "strategicAlignment"
        );

      if (kpiScore < 60) {
        warnings.push({
          code: "KPI_GAP",
          title:
            "مؤشرات الأداء غير مكتملة",
          description:
            "اربط المشروع بمؤشر وهدف رقمي ومالك قياس."
        });
      }

      if (feasibility < 55) {
        warnings.push({
          code: "FEASIBILITY_GAP",
          title:
            "قابلية التنفيذ تحتاج مراجعة",
          description:
            "راجع التكلفة والمدة والتكامل والموارد المطلوبة."
        });
      }

      if (
        strategicAlignment < 55
      ) {
        warnings.push({
          code:
            "STRATEGIC_ALIGNMENT_GAP",
          title:
            "المواءمة الاستراتيجية غير واضحة",
          description:
            "حدد الهدف الاستراتيجي الذي يخدمه المشروع."
        });
      }

      return warnings;
    },

    buildProjectRationale(
      project,
      score,
      factors,
      blockers
    ) {
      if (blockers.length) {
        return `حصل المشروع على ${score}%، لكن توجد ${blockers.length} عوائق أساسية تمنع الاعتماد المباشر.`;
      }

      const strengths =
        this.getStrengths(factors)
          .slice(0, 2)
          .map(item => item.label);

      const weaknesses =
        this.getWeaknesses(factors)
          .slice(0, 2)
          .map(item => item.label);

      if (score >= 80) {
        return `المشروع مرشح قوي للتنفيذ بسبب ارتفاع ${strengths.join(
          " و"
        ) || "الأثر والجاهزية"}.`;
      }

      if (score >= 60) {
        return `المشروع قابل للتقدم المشروط، مع ضرورة تحسين ${
          weaknesses.join(" و") ||
          "بعض متطلبات التنفيذ"
        }.`;
      }

      return `المشروع يحتاج إلى إعادة تجهيز قبل الاعتماد، خاصة في ${
        weaknesses.join(" و") ||
        "الجاهزية والحوكمة"
      }.`;
    },

    getProjectNextActions(
      project,
      score,
      factors,
      blockers
    ) {
      const actions = [];

      blockers.forEach(blocker => {
        if (
          blocker.code ===
          "CRITICAL_RISK"
        ) {
          actions.push({
            priority: 1,
            title:
              "اعتماد خطة معالجة المخاطر",
            route: "governance"
          });
        }

        if (
          blocker.code ===
          "GOVERNANCE_NOT_READY"
        ) {
          actions.push({
            priority: 1,
            title:
              "تنفيذ مراجعة الحوكمة والخصوصية",
            route: "governance"
          });
        }

        if (
          blocker.code === "NO_OWNER"
        ) {
          actions.push({
            priority: 1,
            title:
              "تحديد مالك المشروع",
            route: "projects"
          });
        }
      });

      if (
        this.getFactorScore(
          factors,
          "kpiReadiness"
        ) < 70
      ) {
        actions.push({
          priority: 2,
          title:
            "ربط المشروع بمؤشر أداء",
          route: "kpis"
        });
      }

      if (
        this.getFactorScore(
          factors,
          "feasibility"
        ) < 65
      ) {
        actions.push({
          priority: 3,
          title:
            "تحديث دراسة الجدوى وخطة التنفيذ",
          route: "business"
        });
      }

      if (
        score >= 80 &&
        !blockers.length
      ) {
        actions.push({
          priority: 1,
          title:
            "رفع المشروع للاعتماد التنفيذي",
          route: "decision"
        });
      }

      return actions
        .sort(
          (a, b) =>
            a.priority - b.priority
        )
        .slice(0, 5);
    },

    /* =========================================================
       OPPORTUNITY EVALUATION
    ========================================================= */

    evaluateOpportunity(idea = {}) {
      const factors =
        this.getOpportunityFactors(
          idea
        );

      const score =
        this.weightedScore(factors);

      const blockers =
        this.getOpportunityBlockers(
          idea,
          factors
        );

      const decision =
        this.getOpportunityDecision(
          score,
          blockers
        );

      const priority =
        this.getPriority(score);

      const result = {
        id:
          idea.id ||
          null,

        title:
          idea.title ||
          idea.name ||
          "فرصة ذكاء اصطناعي",

        type: "opportunity",

        score,

        priority,

        priorityAr:
          this.getPriorityArabic(
            priority
          ),

        recommendation:
          decision.code,

        recommendationAr:
          decision.label,

        decision:
          decision.code,

        decisionLabel:
          decision.label,

        decisionColor:
          decision.color,

        confidence:
          this.calculateConfidence(
            idea,
            factors
          ),

        quickWin:
          this.isQuickWin(idea),

        factors,

        strengths:
          this.getStrengths(factors),

        weaknesses:
          this.getWeaknesses(factors),

        blockers,

        rationale:
          this.buildOpportunityRationale(
            idea,
            score,
            factors,
            blockers
          ),

        nextActions:
          this.getOpportunityNextActions(
            idea,
            score,
            factors,
            blockers
          ),

        evaluatedAt:
          this.now(),

        engineVersion:
          this.version
      };

      return result;
    },

    evaluateIdea(idea = {}) {
      return this.evaluateOpportunity(
        idea
      );
    },

    getOpportunityFactors(idea = {}) {
      const weights =
        this.weights.opportunity;

      return [
        this.factor(
          "impact",
          "الأثر المتوقع",
          this.getImpactScore(idea),
          weights.impact
        ),

        this.factor(
          "priority",
          "الأولوية",
          this.getPriorityScore(idea),
          weights.priority
        ),

        this.factor(
          "feasibility",
          "قابلية التنفيذ",
          this.getFeasibilityScore(idea),
          weights.feasibility
        ),

        this.factor(
          "quickWin",
          "قابلية المكاسب السريعة",
          this.isQuickWin(idea)
            ? 100
            : 45,
          weights.quickWin
        ),

        this.factor(
          "strategicAlignment",
          "المواءمة الاستراتيجية",
          this.getStrategicAlignmentScore(
            idea
          ),
          weights.strategicAlignment
        ),

        this.factor(
          "governance",
          "جاهزية الحوكمة",
          this.getGovernanceReadinessScore(
            idea
          ),
          weights.governance
        ),

        this.factor(
          "ownership",
          "تحديد المالك",
          this.getOwnershipScore(idea),
          weights.ownership
        ),

        this.factor(
          "dataReadiness",
          "جاهزية البيانات",
          this.getDataReadinessScore(
            idea
          ),
          weights.dataReadiness
        ),

        this.factor(
          "risk",
          "سلامة المخاطر",
          this.getRiskSafetyScore(idea),
          weights.risk
        )
      ];
    },

    getOpportunityBlockers(
      idea,
      factors
    ) {
      const blockers = [];

      if (
        this.isCriticalRisk(idea)
      ) {
        blockers.push({
          code: "CRITICAL_RISK",
          title:
            "مخاطر مرتفعة",
          description:
            "تحتاج الفرصة إلى مراجعة حوكمة ومخاطر قبل تحويلها إلى مشروع."
        });
      }

      if (
        this.isSensitiveItem(idea) &&
        this.getFactorScore(
          factors,
          "governance"
        ) < 35
      ) {
        blockers.push({
          code:
            "SENSITIVE_USE_CASE",
          title:
            "حالة استخدام حساسة",
          description:
            "تتطلب مراجعة الخصوصية والإشراف البشري قبل التقدم."
        });
      }

      if (
        this.getFactorScore(
          factors,
          "impact"
        ) < 30
      ) {
        blockers.push({
          code: "LOW_IMPACT",
          title:
            "الأثر المتوقع منخفض",
          description:
            "لا توجد قيمة تشغيلية كافية لتبرير التحويل إلى مشروع حالياً."
        });
      }

      return blockers;
    },

    getOpportunityDecision(
      score,
      blockers = []
    ) {
      if (blockers.length) {
        return {
          code: "REVIEW",
          label:
            "مراجعة قبل التحويل",
          color: "orange"
        };
      }

      if (score >= 82) {
        return {
          code:
            "CONVERT_TO_PROJECT",
          label:
            "تحويل إلى مشروع",
          color: "green"
        };
      }

      if (score >= 65) {
        return {
          code: "VALIDATE",
          label:
            "استكمال التحقق",
          color: "orange"
        };
      }

      if (score >= 45) {
        return {
          code: "BACKLOG",
          label:
            "إدراج في قائمة الانتظار",
          color: "orange"
        };
      }

      return {
        code: "HOLD",
        label: "تأجيل",
        color: "red"
      };
    },

    buildOpportunityRationale(
      idea,
      score,
      factors,
      blockers
    ) {
      if (blockers.length) {
        return `حصلت الفرصة على ${score}%، لكنها تحتاج إلى معالجة ${blockers
          .map(item => item.title)
          .join(" و")} قبل تحويلها إلى مشروع.`;
      }

      if (
        score >= 82 &&
        this.isQuickWin(idea)
      ) {
        return `الفرصة حصلت على ${score}% وتجمع بين الأثر وقابلية التنفيذ السريع، لذلك تعد مرشحاً مناسباً للتحويل إلى مشروع.`;
      }

      if (score >= 65) {
        return `الفرصة واعدة بدرجة ${score}%، لكنها تحتاج إلى استكمال المالك والبيانات ودراسة الجدوى قبل التحويل.`;
      }

      return `الفرصة حصلت على ${score}% وتحتاج إلى إعادة تقييم الأثر والتكلفة والمخاطر قبل منحها أولوية أعلى.`;
    },

    getOpportunityNextActions(
      idea,
      score,
      factors,
      blockers
    ) {
      const actions = [];

      if (
        blockers.some(
          item =>
            item.code ===
            "CRITICAL_RISK"
        )
      ) {
        actions.push({
          priority: 1,
          title:
            "تنفيذ مراجعة المخاطر",
          route: "governance"
        });
      }

      if (
        this.getFactorScore(
          factors,
          "ownership"
        ) < 60
      ) {
        actions.push({
          priority: 2,
          title:
            "تحديد الإدارة والمالك",
          route: "ideas"
        });
      }

      if (
        this.getFactorScore(
          factors,
          "dataReadiness"
        ) < 60
      ) {
        actions.push({
          priority: 3,
          title:
            "تقييم توفر وجودة البيانات",
          route: "ideas"
        });
      }

      if (score >= 65) {
        actions.push({
          priority: 4,
          title:
            "إعداد دراسة الجدوى",
          route: "business"
        });
      }

      if (
        score >= 82 &&
        !blockers.length
      ) {
        actions.push({
          priority: 1,
          title:
            "تحويل الفرصة إلى مشروع",
          route: "projects"
        });
      }

      return actions
        .sort(
          (a, b) =>
            a.priority - b.priority
        )
        .slice(0, 5);
    },

    /* =========================================================
       FACTOR CALCULATIONS
    ========================================================= */

    factor(
      key,
      label,
      score,
      weight
    ) {
      const normalizedScore =
        this.clamp(score);

      return {
        key,
        label,
        score: normalizedScore,
        weight,
        contribution:
          Math.round(
            (
              normalizedScore *
              Number(weight)
            ) / 100
          ),
        status:
          this.getFactorStatus(
            normalizedScore
          )
      };
    },

    getFactorScore(
      factors,
      key
    ) {
      return (
        factors.find(
          factor =>
            factor.key === key
        )?.score || 0
      );
    },

    getFactorStatus(score) {
      const value =
        this.clamp(score);

      if (value >= 80) {
        return "قوي";
      }

      if (value >= 60) {
        return "جيد";
      }

      if (value >= 40) {
        return "يحتاج تحسين";
      }

      return "ضعيف";
    },

    getImpactScore(item = {}) {
      const directScore =
        this.getFirstNumber(
          item,
          [
            "impactScore",
            "impact",
            "valueScore",
            "benefitScore",
            "roiScore"
          ],
          NaN
        );

      if (
        Number.isFinite(directScore)
      ) {
        if (directScore <= 10) {
          return this.clamp(
            directScore * 10
          );
        }

        return this.clamp(
          directScore
        );
      }

      const roi =
        this.getFirstNumber(
          item,
          [
            "roi",
            "expectedROI",
            "expectedValue",
            "financialImpact"
          ],
          NaN
        );

      if (Number.isFinite(roi)) {
        if (roi >= 10000000) {
          return 100;
        }

        if (roi >= 5000000) {
          return 90;
        }

        if (roi >= 1000000) {
          return 80;
        }

        if (roi >= 250000) {
          return 70;
        }

        if (roi > 0) {
          return 55;
        }
      }

      const impact =
        item.impactLevel ||
        item.impact ||
        item.value ||
        "";

      if (
        this.includesAny(impact, [
          "تحويلي",
          "استراتيجي",
          "مرتفع جدا",
          "very high",
          "transformational"
        ])
      ) {
        return 95;
      }

      if (
        this.includesAny(impact, [
          "عال",
          "عالية",
          "مرتفع",
          "high"
        ])
      ) {
        return 85;
      }

      if (
        this.includesAny(impact, [
          "متوسط",
          "متوسطة",
          "medium"
        ])
      ) {
        return 65;
      }

      if (
        this.includesAny(impact, [
          "منخفض",
          "منخفضة",
          "low"
        ])
      ) {
        return 35;
      }

      return 55;
    },

    getProjectReadinessScore(
      project = {}
    ) {
      const directScore =
        this.getFirstNumber(
          project,
          [
            "readiness",
            "readinessScore",
            "implementationReadiness",
            "projectReadiness"
          ],
          NaN
        );

      if (
        Number.isFinite(directScore)
      ) {
        return this.clamp(
          directScore
        );
      }

      const progress =
        this.getFirstNumber(
          project,
          [
            "progress",
            "completion",
            "completionRate"
          ],
          0
        );

      const status =
        project.status || "";

      let statusScore = 50;

      if (
        this.includesAny(status, [
          "مكتمل",
          "completed",
          "done"
        ])
      ) {
        statusScore = 100;
      } else if (
        this.includesAny(status, [
          "قيد التنفيذ",
          "نشط",
          "active",
          "in progress"
        ])
      ) {
        statusScore = 78;
      } else if (
        this.includesAny(status, [
          "جاهز",
          "معتمد",
          "ready",
          "approved"
        ])
      ) {
        statusScore = 85;
      } else if (
        this.includesAny(status, [
          "مخطط",
          "planned",
          "new"
        ])
      ) {
        statusScore = 55;
      } else if (
        this.includesAny(status, [
          "متعثر",
          "متأخر",
          "blocked",
          "delayed"
        ])
      ) {
        statusScore = 25;
      }

      return this.average([
        statusScore,
        progress
      ]);
    },

    getMaturityScore(item = {}) {
      const directScore =
        this.getFirstNumber(
          item,
          [
            "maturity",
            "maturityScore",
            "departmentMaturity"
          ],
          NaN
        );

      if (
        Number.isFinite(directScore)
      ) {
        return this.clamp(
          directScore
        );
      }

      const analytics =
        this.getAnalytics();

      if (
        analytics &&
        typeof analytics.maturityScore ===
          "function"
      ) {
        return analytics.maturityScore();
      }

      return 50;
    },

    getStrategicAlignmentScore(
      item = {}
    ) {
      const directScore =
        this.getFirstNumber(
          item,
          [
            "strategicAlignment",
            "alignmentScore",
            "strategyScore"
          ],
          NaN
        );

      if (
        Number.isFinite(directScore)
      ) {
        return this.clamp(
          directScore
        );
      }

      let score = 35;

      if (
        item.strategicObjective ||
        item.strategy ||
        item.objective ||
        item.pillar
      ) {
        score += 30;
      }

      if (
        item.department ||
        item.portfolio ||
        item.owner
      ) {
        score += 15;
      }

      if (
        item.targetYear ||
        item.roadmap ||
        item.phase
      ) {
        score += 10;
      }

      if (
        this.includesAny(
          item.priority,
          [
            "عالية",
            "عال",
            "high"
          ]
        )
      ) {
        score += 10;
      }

      return this.clamp(score);
    },

    getGovernanceReadinessScore(
      item = {}
    ) {
      const directScore =
        this.getFirstNumber(
          item,
          [
            "governanceScore",
            "governanceReadiness",
            "complianceScore"
          ],
          NaN
        );

      if (
        Number.isFinite(directScore)
      ) {
        return this.clamp(
          directScore
        );
      }

      let score = 20;

      if (
        item.governance ||
        item.governanceStatus
      ) {
        score += 25;
      }

      if (
        item.riskLevel ||
        item.risk
      ) {
        score += 15;
      }

      if (
        item.privacyReview ||
        item.privacyStatus
      ) {
        score += 15;
      }

      if (
        item.humanOversight ||
        item.humanInTheLoop
      ) {
        score += 15;
      }

      if (
        item.approved === true ||
        this.includesAny(
          item.status,
          [
            "معتمد",
            "approved"
          ]
        )
      ) {
        score += 10;
      }

      return this.clamp(score);
    },

    getKpiReadinessScore(
      item = {}
    ) {
      const directScore =
        this.getFirstNumber(
          item,
          [
            "kpiScore",
            "measurementReadiness",
            "performanceScore"
          ],
          NaN
        );

      if (
        Number.isFinite(directScore)
      ) {
        return this.clamp(
          directScore
        );
      }

      let score = 20;

      if (
        item.kpi ||
        item.kpiId ||
        item.kpis
      ) {
        score += 40;
      }

      if (
        item.target ||
        item.targetValue
      ) {
        score += 20;
      }

      if (
        item.baseline ||
        item.currentValue
      ) {
        score += 10;
      }

      if (
        item.measurementFrequency ||
        item.frequency
      ) {
        score += 10;
      }

      return this.clamp(score);
    },

    getOwnershipScore(item = {}) {
      const directScore =
        this.getFirstNumber(
          item,
          [
            "ownershipScore",
            "ownerScore"
          ],
          NaN
        );

      if (
        Number.isFinite(directScore)
      ) {
        return this.clamp(
          directScore
        );
      }

      let score = 15;

      if (
        item.owner ||
        item.projectOwner
      ) {
        score += 45;
      }

      if (
        item.sponsor ||
        item.executiveSponsor
      ) {
        score += 20;
      }

      if (
        item.department ||
        item.portfolio
      ) {
        score += 20;
      }

      return this.clamp(score);
    },

    getFeasibilityScore(item = {}) {
      const directScore =
        this.getFirstNumber(
          item,
          [
            "feasibility",
            "feasibilityScore",
            "implementationScore",
            "easeScore"
          ],
          NaN
        );

      if (
        Number.isFinite(directScore)
      ) {
        return this.clamp(
          directScore
        );
      }

      let score = 55;

      const ease =
        item.ease ||
        item.difficulty ||
        item.complexity ||
        "";

      const cost =
        item.cost ||
        item.costLevel ||
        "";

      const duration =
        item.duration ||
        item.timeline ||
        "";

      if (
        this.includesAny(ease, [
          "سهلة",
          "سهل",
          "منخفض",
          "easy",
          "low"
        ])
      ) {
        score += 25;
      } else if (
        this.includesAny(ease, [
          "صعبة",
          "عال",
          "عالية",
          "complex",
          "hard",
          "high"
        ])
      ) {
        score -= 20;
      }

      if (
        this.includesAny(cost, [
          "منخفض",
          "منخفضة",
          "low"
        ])
      ) {
        score += 15;
      } else if (
        this.includesAny(cost, [
          "مرتفع",
          "عالية",
          "high"
        ])
      ) {
        score -= 15;
      }

      if (
        this.includesAny(duration, [
          "قصير",
          "3 أشهر",
          "90 يوم",
          "short"
        ])
      ) {
        score += 10;
      }

      return this.clamp(score);
    },

    getRiskSafetyScore(item = {}) {
      const directRisk =
        this.getFirstNumber(
          item,
          [
            "riskScore",
            "risk",
            "riskValue"
          ],
          NaN
        );

      if (
        Number.isFinite(directRisk)
      ) {
        /*
         * If the value is a risk level where 100 is dangerous,
         * invert it into a safety score.
         */
        if (
          item.riskScore !== undefined ||
          item.riskValue !== undefined
        ) {
          return this.clamp(
            100 - directRisk
          );
        }

        return this.clamp(
          100 - directRisk
        );
      }

      const level =
        item.riskLevel ||
        item.risk ||
        item.severity ||
        "";

      if (
        this.includesAny(level, [
          "حرج",
          "critical"
        ])
      ) {
        return 10;
      }

      if (
        this.includesAny(level, [
          "عال",
          "عالية",
          "مرتفع",
          "high"
        ])
      ) {
        return 30;
      }

      if (
        this.includesAny(level, [
          "متوسط",
          "متوسطة",
          "medium"
        ])
      ) {
        return 60;
      }

      if (
        this.includesAny(level, [
          "منخفض",
          "منخفضة",
          "low"
        ])
      ) {
        return 90;
      }

      return 65;
    },

    getPriorityScore(item = {}) {
      const directScore =
        this.getFirstNumber(
          item,
          [
            "priorityScore",
            "decisionScore"
          ],
          NaN
        );

      if (
        Number.isFinite(directScore)
      ) {
        return this.clamp(
          directScore
        );
      }

      const priority =
        item.priority ||
        item.priorityLevel ||
        "";

      if (
        this.includesAny(priority, [
          "حرج",
          "critical"
        ])
      ) {
        return 100;
      }

      if (
        this.includesAny(priority, [
          "عال",
          "عالية",
          "مرتفع",
          "high"
        ])
      ) {
        return 85;
      }

      if (
        this.includesAny(priority, [
          "متوسط",
          "متوسطة",
          "medium"
        ])
      ) {
        return 65;
      }

      if (
        this.includesAny(priority, [
          "منخفض",
          "منخفضة",
          "low"
        ])
      ) {
        return 35;
      }

      return 55;
    },

    getDataReadinessScore(
      item = {}
    ) {
      const directScore =
        this.getFirstNumber(
          item,
          [
            "dataReadiness",
            "dataScore",
            "dataQuality"
          ],
          NaN
        );

      if (
        Number.isFinite(directScore)
      ) {
        return this.clamp(
          directScore
        );
      }

      let score = 25;

      if (
        item.dataSource ||
        item.dataSources
      ) {
        score += 25;
      }

      if (
        item.dataOwner ||
        item.owner
      ) {
        score += 15;
      }

      if (
        item.dataQuality ||
        item.qualityScore
      ) {
        score += 20;
      }

      if (
        item.integration ||
        item.integrationReady
      ) {
        score += 15;
      }

      return this.clamp(score);
    },

    /* =========================================================
       DECISION LOGIC
    ========================================================= */

    getDecision(
      score,
      blockers = []
    ) {
      if (blockers.length) {
        return {
          code: "HOLD",
          label:
            "تعليق لحين المعالجة",
          color: "red"
        };
      }

      if (score >= 85) {
        return {
          code: "PROCEED",
          label:
            "المضي في التنفيذ",
          color: "green"
        };
      }

      if (score >= 70) {
        return {
          code:
            "PROCEED_WITH_CONDITIONS",
          label:
            "المضي بشروط",
          color: "green"
        };
      }

      if (score >= 55) {
        return {
          code: "REVIEW",
          label:
            "مراجعة وتحسين",
          color: "orange"
        };
      }

      if (score >= 40) {
        return {
          code: "HOLD",
          label:
            "تعليق مؤقت",
          color: "orange"
        };
      }

      return {
        code: "STOP",
        label:
          "عدم التقدم حالياً",
        color: "red"
      };
    },

    getPriority(score) {
      const value =
        this.clamp(score);

      if (value >= 80) {
        return "High";
      }

      if (value >= 55) {
        return "Medium";
      }

      return "Low";
    },

    getPriorityArabic(priority) {
      if (priority === "High") {
        return "عالية";
      }

      if (priority === "Medium") {
        return "متوسطة";
      }

      return "منخفضة";
    },

    calculateConfidence(
      item,
      factors
    ) {
      const populatedFields =
        Object.values(item || {}).filter(
          value =>
            value !== undefined &&
            value !== null &&
            value !== ""
        ).length;

      const factorQuality =
        factors.filter(
          factor =>
            factor.score !== 55 &&
            factor.score !== 50
        ).length;

      const dataDepth =
        this.clamp(
          populatedFields * 7
        );

      const factorDepth =
        this.clamp(
          (
            factorQuality /
            Math.max(
              factors.length,
              1
            )
          ) * 100
        );

      return this.weightedScore([
        {
          score: dataDepth,
          weight: 55
        },
        {
          score: factorDepth,
          weight: 45
        }
      ]);
    },

    getStrengths(factors) {
      return factors
        .filter(
          factor =>
            factor.score >= 75
        )
        .sort(
          (a, b) =>
            b.score - a.score
        )
        .map(factor => ({
          key: factor.key,
          label: factor.label,
          score: factor.score
        }));
    },

    getWeaknesses(factors) {
      return factors
        .filter(
          factor =>
            factor.score < 60
        )
        .sort(
          (a, b) =>
            a.score - b.score
        )
        .map(factor => ({
          key: factor.key,
          label: factor.label,
          score: factor.score
        }));
    },

    isQuickWin(item = {}) {
      if (
        item.quickWin === true ||
        item.isQuickWin === true
      ) {
        return true;
      }

      const ease =
        item.ease ||
        item.difficulty ||
        item.complexity ||
        "";

      const cost =
        item.cost ||
        item.costLevel ||
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
    },

    isCriticalRisk(item = {}) {
      const risk =
        item.riskLevel ||
        item.risk ||
        item.severity ||
        "";

      return this.includesAny(risk, [
        "حرج",
        "حرجة",
        "critical",
        "عال جدا",
        "very high"
      ]);
    },

    isSensitiveItem(item = {}) {
      const text = [
        item.title,
        item.name,
        item.description,
        item.category,
        item.department,
        item.domain,
        item.scope
      ].join(" ");

      return this.includesAny(text, [
        "بيومتري",
        "biometric",
        "وجه",
        "بصمة",
        "هوية",
        "صلاحيات",
        "access",
        "permissions",
        "خصوصية",
        "privacy",
        "أمن",
        "security",
        "مراقبة",
        "surveillance"
      ]);
    },

    /* =========================================================
       PORTFOLIO EVALUATION
    ========================================================= */

    evaluatePortfolio(projects = null) {
      const portfolioProjects =
        projects === null
          ? this.getProjects()
          : this.activeItems(projects);

      if (!portfolioProjects.length) {
        return {
          averageScore: 0,
          score: 0,
          health: "No Data",
          healthAr:
            "لا توجد بيانات",
          status: "No Data",
          total: 0,
          proceed: 0,
          conditional: 0,
          review: 0,
          hold: 0,
          stop: 0,
          decisions: [],
          recommendations: [],
          generatedAt:
            this.now()
        };
      }

      const decisions =
        portfolioProjects.map(project =>
          this.evaluateProject(project)
        );

      const averageScore =
        this.average(
          decisions.map(
            decision =>
              decision.score
          )
        );

      const breakdown = {
        proceed:
          decisions.filter(
            decision =>
              decision.decision ===
              "PROCEED"
          ).length,

        conditional:
          decisions.filter(
            decision =>
              decision.decision ===
              "PROCEED_WITH_CONDITIONS"
          ).length,

        review:
          decisions.filter(
            decision =>
              decision.decision ===
              "REVIEW"
          ).length,

        hold:
          decisions.filter(
            decision =>
              decision.decision ===
              "HOLD"
          ).length,

        stop:
          decisions.filter(
            decision =>
              decision.decision ===
              "STOP"
          ).length
      };

      const health =
        averageScore >= 80
          ? "Strong"
          : averageScore >= 60
            ? "Moderate"
            : "Needs Attention";

      const healthAr =
        averageScore >= 80
          ? "قوية"
          : averageScore >= 60
            ? "متوسطة"
            : "تحتاج اهتمام";

      return {
        averageScore,
        score: averageScore,
        health,
        healthAr,
        status: health,
        total:
          decisions.length,
        ...breakdown,
        decisions:
          decisions.sort(
            (a, b) =>
              b.score - a.score
          ),
        topProjects:
          decisions
            .filter(
              decision =>
                decision.decision ===
                  "PROCEED" ||
                decision.decision ===
                  "PROCEED_WITH_CONDITIONS"
            )
            .slice(0, 5),
        attentionProjects:
          decisions
            .filter(
              decision =>
                decision.decision ===
                  "HOLD" ||
                decision.decision ===
                  "STOP" ||
                decision.blockers.length
            )
            .slice(0, 5),
        recommendations:
          this.getPortfolioRecommendations(
            decisions,
            averageScore
          ),
        generatedAt:
          this.now()
      };
    },

    evaluateOpportunityPortfolio(
      ideas = null
    ) {
      const opportunities =
        ideas === null
          ? this.getIdeas()
          : this.activeItems(ideas);

      if (!opportunities.length) {
        return {
          averageScore: 0,
          total: 0,
          convertToProject: 0,
          validate: 0,
          backlog: 0,
          hold: 0,
          decisions: [],
          generatedAt:
            this.now()
        };
      }

      const decisions =
        opportunities.map(idea =>
          this.evaluateOpportunity(idea)
        );

      return {
        averageScore:
          this.average(
            decisions.map(
              decision =>
                decision.score
            )
          ),

        total:
          decisions.length,

        convertToProject:
          decisions.filter(
            decision =>
              decision.decision ===
              "CONVERT_TO_PROJECT"
          ).length,

        validate:
          decisions.filter(
            decision =>
              decision.decision ===
              "VALIDATE"
          ).length,

        backlog:
          decisions.filter(
            decision =>
              decision.decision ===
              "BACKLOG"
          ).length,

        hold:
          decisions.filter(
            decision =>
              decision.decision ===
              "HOLD"
          ).length,

        quickWins:
          decisions.filter(
            decision =>
              decision.quickWin
          ).length,

        decisions:
          decisions.sort(
            (a, b) =>
              b.score - a.score
          ),

        topOpportunities:
          decisions
            .filter(
              decision =>
                decision.decision ===
                  "CONVERT_TO_PROJECT" ||
                decision.decision ===
                  "VALIDATE"
            )
            .slice(0, 10),

        generatedAt:
          this.now()
      };
    },

    getPortfolioRecommendations(
      decisions,
      averageScore
    ) {
      const recommendations = [];

      const blocked =
        decisions.filter(
          decision =>
            decision.blockers.length
        );

      const missingKpis =
        decisions.filter(
          decision =>
            this.getFactorScore(
              decision.factors,
              "kpiReadiness"
            ) < 60
        );

      const lowGovernance =
        decisions.filter(
          decision =>
            this.getFactorScore(
              decision.factors,
              "governance"
            ) < 50
        );

      if (blocked.length) {
        recommendations.push({
          priority: "عالية",
          title:
            "معالجة المشاريع المحجوبة",
          text:
            `توجد ${blocked.length} مشاريع لديها عوائق تمنع الاعتماد المباشر.`,
          route: "governance"
        });
      }

      if (missingKpis.length) {
        recommendations.push({
          priority: "عالية",
          title:
            "استكمال مؤشرات الأداء",
          text:
            `توجد ${missingKpis.length} مشاريع لا تملك جاهزية قياس كافية.`,
          route: "kpis"
        });
      }

      if (lowGovernance.length) {
        recommendations.push({
          priority: "متوسطة",
          title:
            "رفع جاهزية الحوكمة",
          text:
            `تحتاج ${lowGovernance.length} مشاريع إلى استكمال مراجعات الحوكمة والخصوصية.`,
          route: "governance"
        });
      }

      if (averageScore >= 80) {
        recommendations.push({
          priority: "متوسطة",
          title:
            "التوسع المنظم",
          text:
            "المحفظة في وضع جيد ويمكن التوسع تدريجياً مع استمرار مراقبة الأثر والمخاطر.",
          route: "strategy"
        });
      }

      return recommendations;
    },

    /* =========================================================
       DECISION CENTER SNAPSHOT
    ========================================================= */

    snapshot() {
      const projectPortfolio =
        this.evaluatePortfolio();

      const opportunityPortfolio =
        this.evaluateOpportunityPortfolio();

      const snapshot = {
        projectPortfolio,
        opportunityPortfolio,

        summary: {
          projectScore:
            projectPortfolio.averageScore,

          opportunityScore:
            opportunityPortfolio.averageScore,

          overallScore:
            this.average([
              projectPortfolio.averageScore,
              opportunityPortfolio.averageScore
            ]),

          approvedCandidates:
            projectPortfolio.proceed +
            projectPortfolio.conditional,

          opportunitiesReady:
            opportunityPortfolio.convertToProject,

          blockedProjects:
            projectPortfolio.decisions.filter(
              decision =>
                decision.blockers.length
            ).length
        },

        recommendations: [
          ...projectPortfolio.recommendations
        ],

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
        "aiw:decisionUpdated",
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

      const decisionSummary = {
        executiveScore:
          snapshot.summary.overallScore,

        projectScore:
          snapshot.summary.projectScore,

        opportunityScore:
          snapshot.summary.opportunityScore,

        approvedCandidates:
          snapshot.summary.approvedCandidates,

        opportunitiesReady:
          snapshot.summary.opportunitiesReady,

        blockedProjects:
          snapshot.summary.blockedProjects,

        projectPortfolio: {
          total:
            snapshot.projectPortfolio.total,

          proceed:
            snapshot.projectPortfolio.proceed,

          conditional:
            snapshot.projectPortfolio.conditional,

          review:
            snapshot.projectPortfolio.review,

          hold:
            snapshot.projectPortfolio.hold,

          stop:
            snapshot.projectPortfolio.stop,

          health:
            snapshot.projectPortfolio.healthAr
        },

        opportunityPortfolio: {
          total:
            snapshot.opportunityPortfolio.total,

          convertToProject:
            snapshot.opportunityPortfolio.convertToProject,

          validate:
            snapshot.opportunityPortfolio.validate,

          backlog:
            snapshot.opportunityPortfolio.backlog,

          hold:
            snapshot.opportunityPortfolio.hold,

          quickWins:
            snapshot.opportunityPortfolio.quickWins
        },

        recommendations:
          snapshot.recommendations.slice(
            0,
            5
          ),

        updatedAt:
          snapshot.generatedAt
      };

      this._isSynchronizing = true;

      try {
        const currentSummary =
          typeof store.get === "function"
            ? store.get(
                "decisionSummary",
                {}
              )
            : {};

        if (
          JSON.stringify(
            currentSummary
          ) ===
          JSON.stringify(
            decisionSummary
          )
        ) {
          return;
        }

        if (
          typeof store.set === "function"
        ) {
          store.set(
            "decisionSummary",
            decisionSummary,
            {
              eventName:
                "aiw:decisionSynchronized",

              backup: false,
              notify: false
            }
          );
        }
      } catch (error) {
        console.warn(
          "[AIW.DecisionEngine] Store synchronization skipped:",
          error
        );
      } finally {
        this._isSynchronizing = false;
      }
    },

    saveDecision(
      evaluation,
      options = {}
    ) {
      if (!evaluation) {
        return null;
      }

      const store =
        this.getStore();

      const record = {
        id:
          options.id ||
          `decision-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        title:
          options.title ||
          evaluation.title ||
          "قرار تنفيذي",

        sourceType:
          evaluation.type ||
          options.sourceType ||
          "unknown",

        sourceId:
          evaluation.id ||
          options.sourceId ||
          null,

        score:
          evaluation.score,

        decision:
          evaluation.decision,

        decisionLabel:
          evaluation.decisionLabel,

        priority:
          evaluation.priorityAr ||
          evaluation.priority,

        confidence:
          evaluation.confidence,

        rationale:
          evaluation.rationale,

        blockers:
          this.clone(
            evaluation.blockers || []
          ),

        nextActions:
          this.clone(
            evaluation.nextActions || []
          ),

        status:
          options.status ||
          "generated",

        generatedAt:
          evaluation.evaluatedAt ||
          this.now(),

        createdAt:
          this.now(),

        engineVersion:
          this.version
      };

      try {
        if (
          store &&
          typeof store.add === "function"
        ) {
          const saved =
            store.add(
              "decisionCenter",
              record
            );

          this.emit(
            "aiw:decisionCreated",
            {
              decision: saved
            }
          );

          return saved;
        }
      } catch (error) {
        console.warn(
          "[AIW.DecisionEngine] Decision save failed:",
          error
        );
      }

      return record;
    },

    evaluateAndSaveProject(
      project,
      options = {}
    ) {
      const evaluation =
        this.evaluateProject(project);

      return {
        evaluation,
        record:
          this.saveDecision(
            evaluation,
            options
          )
      };
    },

    evaluateAndSaveOpportunity(
      idea,
      options = {}
    ) {
      const evaluation =
        this.evaluateOpportunity(idea);

      return {
        evaluation,
        record:
          this.saveDecision(
            evaluation,
            options
          )
      };
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
                "aiw:decisionUpdated",
                "aiw:decisionSynchronized",
                "aiw:decisionCreated",
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
          "[AIW.DecisionEngine] Store subscription failed:",
          error
        );
      }
    },

    bindEvents() {
      const events = [
        "aiw:analyticsUpdated",
        "aiw:aiInsightUpdated",
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
              "aiw:decisionSynchronized"
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
        }, 170);
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
          `[AIW.DecisionEngine] Event "${name}" failed:`,
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
          decisionEngineVersion:
            this.version,

          decisionEngine:
            "Enterprise Decision Intelligence",

          decisionCapabilities: [
            "Project Evaluation",
            "Opportunity Evaluation",
            "Portfolio Evaluation",
            "Explainable Factors",
            "Risk-Aware Decisions",
            "Governance Validation",
            "Decision Records"
          ],

          lastDecisionInitialization:
            this.now()
        });
      } catch (error) {
        console.warn(
          "[AIW.DecisionEngine] Metadata registration skipped:",
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
            "[AIW.DecisionEngine] Store unsubscribe failed:",
            error
          );
        }
      }

      this._storeUnsubscribe = null;
      this._cache = null;
      this._initialized = false;
      this._isSynchronizing = false;
    }
  };

  /* =========================================================
     GLOBAL REFERENCES
  ========================================================= */

  AIW.DecisionEngine =
    DecisionEngine;

  /*
   * Legacy compatibility:
   * Older files may still use ATCDecisionEngine.
   */
  window.ATCDecisionEngine =
    DecisionEngine;

  /* =========================================================
     BOOTSTRAP
  ========================================================= */

  const bootstrap = () => {
    AIW.DecisionEngine.init();
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