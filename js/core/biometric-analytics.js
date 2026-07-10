/* =========================================================
   AI Work - Biometric Analytics Engine V1.1
   Enterprise Biometric Intelligence Layer

   Scope:
   - AIW.Store Integration
   - Biometric Opportunity Scoring
   - Decision Score
   - Risk Classification
   - Quick Win Detection
   - KPI Recommendations
   - Operational Alerts
   - Portfolio Analytics
   - Domain Classification
   - Executive Insights
   - Automatic Synchronization
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};

  const BiometricAnalytics = {
    id: "biometric-analytics",
    version: "1.1.0",

    _initialized: false,
    _eventsBound: false,
    _refreshTimer: null,
    _storeUnsubscribe: null,
    _cache: null,
    _isSynchronizing: false,

    weights: {
      priority: 25,
      impact: 25,
      feasibility: 15,
      cost: 10,
      speed: 10,
      dataReadiness: 5,
      governance: 5,
      strategicAlignment: 5
    },

    domains: {
      registration: {
        id: "registration",
        title: "التسجيلات البيومترية",
        titleEn: "Biometric Registration"
      },

      identity: {
        id: "identity",
        title: "الهوية والتحقق",
        titleEn: "Identity Verification"
      },

      gates: {
        id: "gates",
        title: "البوابات الذكية",
        titleEn: "Smart Gates"
      },

      permissions: {
        id: "permissions",
        title: "المستخدمون والصلاحيات",
        titleEn: "Users & Permissions"
      },

      security: {
        id: "security",
        title: "الأمن الرقمي",
        titleEn: "Digital Security"
      },

      operations: {
        id: "operations",
        title: "العمليات التشغيلية",
        titleEn: "Operations"
      },

      analytics: {
        id: "analytics",
        title: "التحليلات التنفيذية",
        titleEn: "Executive Analytics"
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

      this.bindEvents();
      this.bindStore();
      this.refresh();
      this.registerMetadata();

      this.emit(
        "aiw:biometricAnalyticsReady",
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
          "[AIW.BiometricAnalytics] Unable to read Store data:",
          error
        );
      }

      return window.AIW?.Data || {};
    },

    getIdeas() {
      const data = this.getData();

      return this.toArray(
        data.ideas
      ).filter(
        idea => !idea?.deletedAt
      );
    },

    getProjects() {
      const data = this.getData();

      const projects = this.toArray(
        data.projects
      ).filter(
        project => !project?.deletedAt
      );

      if (projects.length) {
        return projects;
      }

      return this.toArray(
        data.flagshipProjects
      ).filter(
        project => !project?.deletedAt
      );
    },

    getRisks() {
      return this.toArray(
        this.getData().risks
      ).filter(
        risk => !risk?.deletedAt
      );
    },

    getGovernance() {
      return this.toArray(
        this.getData().governance
      ).filter(
        control => !control?.deletedAt
      );
    },

    getKpis() {
      return this.toArray(
        this.getData().kpis
      ).filter(
        kpi => !kpi?.deletedAt
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

    average(values = []) {
      const validValues = this.toArray(values)
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
      const normalizedValue =
        this.normalizeArabic(value);

      return terms.some(term =>
        normalizedValue.includes(
          this.normalizeArabic(term)
        )
      );
    },

    getIdeaText(idea = {}) {
      return [
        idea.title,
        idea.name,
        idea.challenge,
        idea.problem,
        idea.solution,
        idea.description,
        idea.aiRole,
        idea.benefits,
        idea.department,
        idea.category,
        idea.scope,
        idea.domain,
        idea.notes
      ]
        .filter(Boolean)
        .join(" ");
    },

    getFirstNumber(
      source,
      fields = [],
      fallback = 0
    ) {
      for (const field of fields) {
        const value = Number(
          source?.[field]
        );

        if (Number.isFinite(value)) {
          return value;
        }
      }

      return fallback;
    },

    /* =========================================================
       DOMAIN CLASSIFICATION
    ========================================================= */

    classifyDomain(idea = {}) {
      const text =
        this.getIdeaText(idea);

      const domainScores = {
        registration: 0,
        identity: 0,
        gates: 0,
        permissions: 0,
        security: 0,
        operations: 0,
        analytics: 0
      };

      if (
        this.includesAny(text, [
          "تسجيل",
          "التسجيلات",
          "registration",
          "enrollment",
          "capture",
          "جودة الصورة",
          "جودة التسجيل"
        ])
      ) {
        domainScores.registration += 5;
      }

      if (
        this.includesAny(text, [
          "هوية",
          "identity",
          "verification",
          "matching",
          "مطابقة",
          "تحقق",
          "بصمة",
          "وجه",
          "biometric"
        ])
      ) {
        domainScores.identity += 5;
      }

      if (
        this.includesAny(text, [
          "بوابة",
          "بوابات",
          "gate",
          "gates",
          "عبور",
          "passage"
        ])
      ) {
        domainScores.gates += 6;
      }

      if (
        this.includesAny(text, [
          "صلاحية",
          "صلاحيات",
          "permission",
          "permissions",
          "privilege",
          "credential",
          "access",
          "مستخدم",
          "user",
          "جلسة",
          "session"
        ])
      ) {
        domainScores.permissions += 6;
      }

      if (
        this.includesAny(text, [
          "أمن",
          "امن",
          "security",
          "risk",
          "مخاطر",
          "شذوذ",
          "anomaly",
          "تهديد",
          "threat",
          "احتيال",
          "fraud"
        ])
      ) {
        domainScores.security += 5;
      }

      if (
        this.includesAny(text, [
          "تشغيل",
          "تشغيلي",
          "operations",
          "workflow",
          "process",
          "معالجة",
          "زمن",
          "performance",
          "أداء"
        ])
      ) {
        domainScores.operations += 4;
      }

      if (
        this.includesAny(text, [
          "تحليل",
          "تحليلات",
          "analytics",
          "dashboard",
          "لوحة",
          "تقرير",
          "report",
          "تنبؤ",
          "prediction",
          "trend"
        ])
      ) {
        domainScores.analytics += 5;
      }

      const sortedDomains =
        Object.entries(domainScores)
          .sort(
            (a, b) =>
              b[1] - a[1]
          );

      const primaryDomain =
        sortedDomains[0]?.[1] > 0
          ? sortedDomains[0][0]
          : "operations";

      const secondaryDomains =
        sortedDomains
          .filter(
            ([domain, score]) =>
              domain !== primaryDomain &&
              score > 0
          )
          .slice(0, 2)
          .map(([domain]) => domain);

      return {
        id: primaryDomain,

        title:
          this.domains[
            primaryDomain
          ]?.title ||
          "العمليات التشغيلية",

        titleEn:
          this.domains[
            primaryDomain
          ]?.titleEn ||
          "Operations",

        secondaryDomains,

        scores: domainScores
      };
    },

    /* =========================================================
       SCORING
    ========================================================= */

    priorityScore(priority) {
      if (
        this.includesAny(priority, [
          "حرجة",
          "حرج",
          "critical"
        ])
      ) {
        return 100;
      }

      if (
        this.includesAny(priority, [
          "عالية",
          "عال",
          "مرتفع",
          "high"
        ])
      ) {
        return 90;
      }

      if (
        this.includesAny(priority, [
          "متوسطة",
          "متوسط",
          "medium"
        ])
      ) {
        return 70;
      }

      if (
        this.includesAny(priority, [
          "منخفضة",
          "منخفض",
          "low"
        ])
      ) {
        return 40;
      }

      return 55;
    },

    easeScore(ease) {
      if (
        this.includesAny(ease, [
          "سهلة",
          "سهل",
          "easy",
          "منخفضة",
          "منخفض"
        ])
      ) {
        return 100;
      }

      if (
        this.includesAny(ease, [
          "متوسطة",
          "متوسط",
          "medium"
        ])
      ) {
        return 70;
      }

      if (
        this.includesAny(ease, [
          "صعبة",
          "صعب",
          "معقد",
          "عالية",
          "hard",
          "complex"
        ])
      ) {
        return 40;
      }

      return 60;
    },

    costScore(cost) {
      if (
        this.includesAny(cost, [
          "منخفضة",
          "منخفض",
          "قليلة",
          "قليل",
          "low"
        ])
      ) {
        return 100;
      }

      if (
        this.includesAny(cost, [
          "متوسطة",
          "متوسط",
          "medium"
        ])
      ) {
        return 70;
      }

      if (
        this.includesAny(cost, [
          "عالية",
          "عال",
          "مرتفعة",
          "مرتفع",
          "high"
        ])
      ) {
        return 40;
      }

      return 60;
    },

    durationScore(duration) {
      const text =
        this.normalizeText(duration);

      const numericMonths =
        this.extractDurationMonths(
          text
        );

      if (
        Number.isFinite(
          numericMonths
        )
      ) {
        if (numericMonths <= 3) {
          return 100;
        }

        if (numericMonths <= 5) {
          return 85;
        }

        if (numericMonths <= 7) {
          return 70;
        }

        if (numericMonths <= 9) {
          return 55;
        }

        return 40;
      }

      if (
        this.includesAny(text, [
          "قصير",
          "سريع",
          "short",
          "quick",
          "90 يوم"
        ])
      ) {
        return 100;
      }

      if (
        this.includesAny(text, [
          "متوسط",
          "medium"
        ])
      ) {
        return 70;
      }

      if (
        this.includesAny(text, [
          "طويل",
          "long"
        ])
      ) {
        return 40;
      }

      return 60;
    },

    extractDurationMonths(text) {
      const matches =
        String(text || "")
          .match(/\d+/g);

      if (!matches?.length) {
        return NaN;
      }

      const values =
        matches
          .map(Number)
          .filter(Number.isFinite);

      if (!values.length) {
        return NaN;
      }

      const average =
        values.reduce(
          (total, value) =>
            total + value,
          0
        ) / values.length;

      if (
        this.includesAny(text, [
          "يوم",
          "day"
        ])
      ) {
        return average / 30;
      }

      if (
        this.includesAny(text, [
          "اسبوع",
          "أسبوع",
          "week"
        ])
      ) {
        return average / 4;
      }

      if (
        this.includesAny(text, [
          "سنة",
          "عام",
          "year"
        ])
      ) {
        return average * 12;
      }

      return average;
    },

    impactScore(idea = {}) {
      const directScore =
        this.getFirstNumber(
          idea,
          [
            "impactScore",
            "businessImpact",
            "valueScore"
          ],
          NaN
        );

      if (
        Number.isFinite(
          directScore
        )
      ) {
        return this.clamp(
          directScore
        );
      }

      const text =
        this.getIdeaText(idea);

      let score = 45;

      if (
        this.includesAny(text, [
          "تسجيل",
          "registration",
          "enrollment"
        ])
      ) {
        score += 12;
      }

      if (
        this.includesAny(text, [
          "صلاحيات",
          "permission",
          "privilege",
          "credential",
          "access"
        ])
      ) {
        score += 14;
      }

      if (
        this.includesAny(text, [
          "بوابات",
          "بوابة",
          "gate"
        ])
      ) {
        score += 10;
      }

      if (
        this.includesAny(text, [
          "أمن",
          "امن",
          "security",
          "risk",
          "مخاطر"
        ])
      ) {
        score += 12;
      }

      if (
        this.includesAny(text, [
          "تنبيه",
          "alert",
          "إنذار"
        ])
      ) {
        score += 6;
      }

      if (
        this.includesAny(text, [
          "تعارض",
          "duplicate",
          "conflict",
          "تكرار"
        ])
      ) {
        score += 10;
      }

      if (
        this.includesAny(text, [
          "جودة",
          "quality"
        ])
      ) {
        score += 8;
      }

      if (
        this.includesAny(text, [
          "خفض الوقت",
          "تسريع",
          "زمن المعالجة",
          "automation",
          "أتمتة"
        ])
      ) {
        score += 6;
      }

      if (
        this.includesAny(text, [
          "تنفيذي",
          "executive",
          "قرار",
          "decision"
        ])
      ) {
        score += 5;
      }

      return this.clamp(score);
    },

    dataReadinessScore(idea = {}) {
      const directScore =
        this.getFirstNumber(
          idea,
          [
            "dataReadiness",
            "dataScore",
            "dataQualityScore"
          ],
          NaN
        );

      if (
        Number.isFinite(
          directScore
        )
      ) {
        return this.clamp(
          directScore
        );
      }

      let score = 35;

      if (
        idea.dataSource ||
        idea.dataSources
      ) {
        score += 20;
      }

      if (
        idea.dataOwner ||
        idea.owner
      ) {
        score += 15;
      }

      if (
        idea.dataQuality ||
        idea.qualityScore
      ) {
        score += 15;
      }

      if (
        idea.integration ||
        idea.integrationReady
      ) {
        score += 15;
      }

      return this.clamp(score);
    },

    governanceScore(idea = {}) {
      const directScore =
        this.getFirstNumber(
          idea,
          [
            "governanceScore",
            "governanceReadiness",
            "complianceScore"
          ],
          NaN
        );

      if (
        Number.isFinite(
          directScore
        )
      ) {
        return this.clamp(
          directScore
        );
      }

      let score = 30;

      if (
        idea.riskLevel ||
        idea.risk
      ) {
        score += 15;
      }

      if (
        idea.privacyReview ||
        idea.privacyStatus
      ) {
        score += 15;
      }

      if (
        idea.humanOversight ||
        idea.humanInTheLoop
      ) {
        score += 20;
      }

      if (
        idea.governance ||
        idea.governanceStatus
      ) {
        score += 20;
      }

      return this.clamp(score);
    },

    strategicAlignmentScore(
      idea = {}
    ) {
      const directScore =
        this.getFirstNumber(
          idea,
          [
            "strategicAlignment",
            "alignmentScore",
            "strategyScore"
          ],
          NaN
        );

      if (
        Number.isFinite(
          directScore
        )
      ) {
        return this.clamp(
          directScore
        );
      }

      let score = 40;

      if (
        idea.strategicObjective ||
        idea.strategy ||
        idea.objective ||
        idea.pillar
      ) {
        score += 25;
      }

      if (
        idea.department ||
        idea.portfolio
      ) {
        score += 15;
      }

      if (
        idea.owner
      ) {
        score += 10;
      }

      if (
        this.includesAny(
          idea.priority,
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

    decisionScore(idea = {}) {
      const priority =
        this.priorityScore(
          idea.priority
        );

      const impact =
        this.impactScore(idea);

      const feasibility =
        this.easeScore(
          idea.ease ||
          idea.difficulty ||
          idea.complexity
        );

      const cost =
        this.costScore(
          idea.cost ||
          idea.costLevel
        );

      const speed =
        this.durationScore(
          idea.duration ||
          idea.timeline
        );

      const dataReadiness =
        this.dataReadinessScore(
          idea
        );

      const governance =
        this.governanceScore(
          idea
        );

      const strategicAlignment =
        this.strategicAlignmentScore(
          idea
        );

      const weightedScore =
        (
          priority *
            this.weights.priority +

          impact *
            this.weights.impact +

          feasibility *
            this.weights.feasibility +

          cost *
            this.weights.cost +

          speed *
            this.weights.speed +

          dataReadiness *
            this.weights.dataReadiness +

          governance *
            this.weights.governance +

          strategicAlignment *
            this.weights.strategicAlignment
        ) / 100;

      return this.clamp(
        weightedScore
      );
    },

    getScoreBreakdown(idea = {}) {
      return {
        priority:
          this.priorityScore(
            idea.priority
          ),

        impact:
          this.impactScore(
            idea
          ),

        feasibility:
          this.easeScore(
            idea.ease ||
            idea.difficulty ||
            idea.complexity
          ),

        cost:
          this.costScore(
            idea.cost ||
            idea.costLevel
          ),

        speed:
          this.durationScore(
            idea.duration ||
            idea.timeline
          ),

        dataReadiness:
          this.dataReadinessScore(
            idea
          ),

        governance:
          this.governanceScore(
            idea
          ),

        strategicAlignment:
          this.strategicAlignmentScore(
            idea
          )
      };
    },

    decisionLevel(score) {
      const value =
        this.clamp(score);

      if (value >= 85) {
        return "اعتماد فوري";
      }

      if (value >= 75) {
        return "أولوية تنفيذ";
      }

      if (value >= 60) {
        return "قيد الدراسة";
      }

      if (value >= 45) {
        return "قائمة الانتظار";
      }

      return "لاحقاً";
    },

    decisionCode(score) {
      const value =
        this.clamp(score);

      if (value >= 85) {
        return "IMMEDIATE_APPROVAL";
      }

      if (value >= 75) {
        return "EXECUTION_PRIORITY";
      }

      if (value >= 60) {
        return "REVIEW";
      }

      if (value >= 45) {
        return "BACKLOG";
      }

      return "HOLD";
    },

    decisionColor(score) {
      const value =
        this.clamp(score);

      if (value >= 75) {
        return "green";
      }

      if (value >= 45) {
        return "orange";
      }

      return "red";
    },

    /* =========================================================
       RISK INTELLIGENCE
    ========================================================= */

    riskLevel(idea = {}) {
      const directRisk =
        idea.riskLevel ||
        idea.risk ||
        idea.severity;

      if (directRisk) {
        if (
          this.includesAny(
            directRisk,
            [
              "حرج",
              "critical"
            ]
          )
        ) {
          return "حرج";
        }

        if (
          this.includesAny(
            directRisk,
            [
              "عال",
              "عالية",
              "مرتفع",
              "high"
            ]
          )
        ) {
          return "عالٍ";
        }

        if (
          this.includesAny(
            directRisk,
            [
              "متوسط",
              "متوسطة",
              "medium"
            ]
          )
        ) {
          return "متوسط";
        }

        if (
          this.includesAny(
            directRisk,
            [
              "منخفض",
              "منخفضة",
              "low"
            ]
          )
        ) {
          return "منخفض";
        }
      }

      const text =
        this.getIdeaText(idea);

      let riskPoints = 0;

      if (
        this.includesAny(text, [
          "صلاحيات",
          "permission",
          "privilege",
          "credential",
          "access"
        ])
      ) {
        riskPoints += 35;
      }

      if (
        this.includesAny(text, [
          "سلوك",
          "behavior",
          "session",
          "جلسة",
          "security",
          "أمن",
          "امن"
        ])
      ) {
        riskPoints += 25;
      }

      if (
        this.includesAny(text, [
          "بيومتري",
          "biometric",
          "هوية",
          "identity",
          "بصمة",
          "وجه"
        ])
      ) {
        riskPoints += 25;
      }

      if (
        this.includesAny(text, [
          "خصوصية",
          "privacy",
          "مراقبة",
          "surveillance"
        ])
      ) {
        riskPoints += 30;
      }

      if (
        this.includesAny(text, [
          "قرار آلي",
          "رفض آلي",
          "automatic rejection",
          "automated decision"
        ])
      ) {
        riskPoints += 25;
      }

      if (
        idea.humanOversight === true ||
        idea.humanInTheLoop === true
      ) {
        riskPoints -= 15;
      }

      if (
        riskPoints >= 70
      ) {
        return "حرج";
      }

      if (
        riskPoints >= 45
      ) {
        return "عالٍ";
      }

      if (
        riskPoints >= 20
      ) {
        return "متوسط";
      }

      return "منخفض";
    },

    riskScore(idea = {}) {
      const level =
        this.riskLevel(idea);

      if (level === "حرج") {
        return 100;
      }

      if (level === "عالٍ") {
        return 80;
      }

      if (level === "متوسط") {
        return 55;
      }

      return 25;
    },

    riskColor(idea = {}) {
      const level =
        typeof idea === "string"
          ? idea
          : this.riskLevel(idea);

      if (
        level === "حرج" ||
        level === "عالٍ"
      ) {
        return "red";
      }

      if (level === "متوسط") {
        return "orange";
      }

      return "green";
    },

    requiresHumanOversight(
      idea = {}
    ) {
      const domain =
        this.classifyDomain(idea);

      const risk =
        this.riskLevel(idea);

      return (
        risk === "حرج" ||
        risk === "عالٍ" ||
        [
          "permissions",
          "identity",
          "security"
        ].includes(domain.id)
      );
    },

    /* =========================================================
       QUICK WINS
    ========================================================= */

    isQuickWin(idea = {}) {
      if (
        idea.quickWin === true ||
        idea.isQuickWin === true
      ) {
        return true;
      }

      const ease =
        this.easeScore(
          idea.ease ||
          idea.difficulty ||
          idea.complexity
        );

      const cost =
        this.costScore(
          idea.cost ||
          idea.costLevel
        );

      const speed =
        this.durationScore(
          idea.duration ||
          idea.timeline
        );

      const impact =
        this.impactScore(idea);

      const risk =
        this.riskScore(idea);

      return (
        ease >= 80 &&
        cost >= 80 &&
        speed >= 70 &&
        impact >= 60 &&
        risk < 80
      );
    },

    /* =========================================================
       IDEA ENRICHMENT
    ========================================================= */

    enrichIdea(idea = {}) {
      const score =
        this.decisionScore(
          idea
        );

      const domain =
        this.classifyDomain(
          idea
        );

      const riskLevel =
        this.riskLevel(
          idea
        );

      const quickWin =
        this.isQuickWin(
          idea
        );

      const scoreBreakdown =
        this.getScoreBreakdown(
          idea
        );

      return {
        ...this.clone(idea),

        biometricDomain:
          domain.id,

        biometricDomainTitle:
          domain.title,

        biometricDomainTitleEn:
          domain.titleEn,

        secondaryDomains:
          domain.secondaryDomains,

        decisionScore:
          score,

        decisionLevel:
          this.decisionLevel(
            score
          ),

        decisionCode:
          this.decisionCode(
            score
          ),

        decisionColor:
          this.decisionColor(
            score
          ),

        scoreBreakdown,

        riskLevel,

        riskScore:
          this.riskScore(
            idea
          ),

        riskColor:
          this.riskColor(
            riskLevel
          ),

        quickWin,

        requiresHumanOversight:
          this.requiresHumanOversight(
            idea
          ),

        kpis:
          idea.kpis?.length
            ? idea.kpis
            : this.ideaKpis(
                idea
              ),

        alerts:
          idea.alerts?.length
            ? idea.alerts
            : this.ideaAlerts(
                idea
              ),

        powerBiViews:
          idea.powerBiViews?.length
            ? idea.powerBiViews
            : this.powerBiViews(
                idea
              ),

        recommendations:
          this.ideaRecommendations(
            idea,
            {
              score,
              riskLevel,
              quickWin,
              domain
            }
          ),

        analyticsUpdatedAt:
          this.now(),

        analyticsVersion:
          this.version
      };
    },

    enrichIdeas(ideas = null) {
      const sourceIdeas =
        ideas === null
          ? this.getIdeas()
          : this.toArray(ideas);

      return sourceIdeas.map(
        idea =>
          this.enrichIdea(
            idea
          )
      );
    },

    /* =========================================================
       KPI RECOMMENDATIONS
    ========================================================= */

    ideaKpis(idea = {}) {
      const domain =
        this.classifyDomain(
          idea
        ).id;

      const kpiMap = {
        permissions: [
          "عدد تنبيهات الصلاحيات",
          "نسبة الصلاحيات غير المستخدمة",
          "عدد محاولات الاستخدام غير المعتاد",
          "متوسط مدة الجلسة",
          "زمن مراجعة التنبيه",
          "نسبة إغلاق الحالات ضمن المدة المستهدفة"
        ],

        gates: [
          "نسبة جاهزية البوابات",
          "متوسط زمن العبور",
          "عدد أخطاء البوابات",
          "نسبة التوفر التشغيلي",
          "عدد الأعطال المتكررة",
          "متوسط زمن استعادة الخدمة"
        ],

        registration: [
          "نسبة جودة التسجيلات",
          "عدد التسجيلات التي تحتاج مراجعة",
          "عدد السجلات المتعارضة",
          "نسبة انخفاض أخطاء التسجيل",
          "متوسط زمن اكتشاف الخطأ",
          "نسبة المعالجة من أول مرة"
        ],

        identity: [
          "نسبة نجاح المطابقة",
          "نسبة الحالات غير الحاسمة",
          "متوسط زمن التحقق",
          "عدد الحالات المحالة للمراجعة",
          "نسبة الأخطاء الإيجابية",
          "نسبة الأخطاء السلبية"
        ],

        security: [
          "عدد الحالات غير المعتادة",
          "زمن اكتشاف الحالة",
          "زمن الاستجابة",
          "نسبة الإنذارات الصحيحة",
          "عدد المخاطر المفتوحة",
          "نسبة إغلاق المخاطر"
        ],

        analytics: [
          "زمن إعداد التقرير",
          "عدد المؤشرات المحدثة تلقائياً",
          "نسبة اكتمال البيانات",
          "عدد القرارات المدعومة بالتحليل",
          "دقة التوقعات",
          "نسبة استخدام التقارير"
        ],

        operations: [
          "عدد الحالات المكتشفة",
          "متوسط زمن المعالجة",
          "نسبة التحسن التشغيلي",
          "عدد التنبيهات",
          "نسبة إغلاق الحالات",
          "مستوى الامتثال"
        ]
      };

      return this.clone(
        kpiMap[domain] ||
        kpiMap.operations
      );
    },

    /* =========================================================
       ALERT RECOMMENDATIONS
    ========================================================= */

    ideaAlerts(idea = {}) {
      const domain =
        this.classifyDomain(
          idea
        ).id;

      const alertMap = {
        permissions: [
          "استخدام صلاحية خارج النمط المعتاد",
          "صلاحية حساسة غير مستخدمة لفترة طويلة",
          "جلسة طويلة بشكل غير طبيعي",
          "ارتفاع مفاجئ في عدد العمليات",
          "استخدام حساب من موقع أو وقت غير معتاد"
        ],

        registration: [
          "تسجيل يحتاج مراجعة",
          "احتمال تعارض بين سجلين",
          "جودة تسجيل أقل من المستوى المستهدف",
          "تكرار محاولات التسجيل",
          "بيانات ناقصة أو غير متطابقة"
        ],

        identity: [
          "انخفاض درجة المطابقة",
          "تعدد محاولات التحقق الفاشلة",
          "حالة هوية تحتاج مراجعة بشرية",
          "احتمال تشابه أو تكرار هوية",
          "نتيجة تحقق غير حاسمة"
        ],

        gates: [
          "انخفاض جاهزية بوابة",
          "ارتفاع زمن العبور",
          "تكرار أخطاء تشغيلية",
          "انخفاض معدل النجاح",
          "توقف أو تذبذب متكرر"
        ],

        security: [
          "سلوك غير معتاد",
          "ارتفاع مستوى المخاطر",
          "تكرار محاولة غير مصرح بها",
          "انحراف عن النمط الأمني",
          "حالة تحتاج تصعيداً فورياً"
        ],

        analytics: [
          "مؤشر يحتاج مراجعة",
          "انحراف عن المتوسط",
          "تغير في الاتجاه التشغيلي",
          "انخفاض اكتمال البيانات",
          "تأخر تحديث البيانات"
        ],

        operations: [
          "مؤشر يحتاج مراجعة",
          "انحراف عن المتوسط",
          "ارتفاع زمن المعالجة",
          "زيادة الحالات المفتوحة",
          "انخفاض الأداء التشغيلي"
        ]
      };

      return this.clone(
        alertMap[domain] ||
        alertMap.operations
      );
    },

    /* =========================================================
       ANALYTICS VIEWS
    ========================================================= */

    powerBiViews(idea = {}) {
      const domain =
        this.classifyDomain(
          idea
        );

      return [
        "Executive Overview",
        `${domain.titleEn} Overview`,
        "Trend Analysis",
        "Risk & Alerts",
        "KPI Performance",
        "Operational Performance",
        "Root Cause Analysis",
        "Human Review Queue"
      ];
    },

    /* =========================================================
       IDEA RECOMMENDATIONS
    ========================================================= */

    ideaRecommendations(
      idea = {},
      analysis = {}
    ) {
      const score =
        analysis.score ??
        this.decisionScore(
          idea
        );

      const riskLevel =
        analysis.riskLevel ||
        this.riskLevel(
          idea
        );

      const quickWin =
        analysis.quickWin ??
        this.isQuickWin(
          idea
        );

      const output = [];

      if (
        riskLevel === "حرج" ||
        riskLevel === "عالٍ"
      ) {
        output.push({
          priority: "عالية",
          title:
            "مراجعة الحوكمة والخصوصية",
          text:
            "استكمال الإشراف البشري ومراجعة الخصوصية والمخاطر قبل الاعتماد.",
          route: "governance"
        });
      }

      if (
        !idea.owner &&
        !idea.department
      ) {
        output.push({
          priority: "عالية",
          title:
            "تحديد مالك للفرصة",
          text:
            "تحديد الإدارة والمالك المسؤول قبل تحويل الفرصة إلى مشروع.",
          route: "ideas"
        });
      }

      if (
        quickWin &&
        score >= 75
      ) {
        output.push({
          priority: "عالية",
          title:
            "الترشيح للتنفيذ السريع",
          text:
            "الفرصة مناسبة للمكاسب السريعة ويمكن رفعها إلى مرحلة دراسة الجدوى.",
          route: "business"
        });
      }

      if (
        score >= 85 &&
        riskLevel !== "حرج"
      ) {
        output.push({
          priority: "عالية",
          title:
            "رفع الفرصة للاعتماد",
          text:
            "الفرصة حققت درجة مرتفعة ويمكن رفعها إلى مركز القرار بعد استكمال المتطلبات.",
          route: "decision"
        });
      } else if (
        score < 60
      ) {
        output.push({
          priority: "متوسطة",
          title:
            "استكمال بيانات التقييم",
          text:
            "مراجعة الأثر والتكلفة والمدة والبيانات قبل رفع أولوية الفرصة.",
          route: "ideas"
        });
      }

      if (
        !idea.kpi &&
        !idea.kpiId &&
        !idea.kpis?.length
      ) {
        output.push({
          priority: "متوسطة",
          title:
            "تحديد مؤشرات النجاح",
          text:
            "ربط الفرصة بمؤشرات أداء واضحة لقياس الأثر التشغيلي.",
          route: "kpis"
        });
      }

      return output;
    },

    /* =========================================================
       PORTFOLIO ANALYTICS
    ========================================================= */

    portfolioSummary() {
      const ideas =
        this.enrichIdeas();

      const highPriority =
        ideas.filter(
          idea =>
            this.includesAny(
              idea.priority,
              [
                "عالية",
                "عال",
                "مرتفع",
                "high"
              ]
            )
        ).length;

      const quickWins =
        ideas.filter(
          idea => idea.quickWin
        ).length;

      const highRisk =
        ideas.filter(
          idea =>
            idea.riskLevel ===
              "عالٍ" ||
            idea.riskLevel ===
              "حرج"
        ).length;

      const immediateApproval =
        ideas.filter(
          idea =>
            idea.decisionCode ===
            "IMMEDIATE_APPROVAL"
        ).length;

      const executionPriority =
        ideas.filter(
          idea =>
            idea.decisionCode ===
            "EXECUTION_PRIORITY"
        ).length;

      const averageDecisionScore =
        ideas.length
          ? this.average(
              ideas.map(
                idea =>
                  idea.decisionScore
              )
            )
          : 0;

      const averageRiskScore =
        ideas.length
          ? this.average(
              ideas.map(
                idea =>
                  idea.riskScore
              )
            )
          : 0;

      const domainBreakdown = {};

      Object.keys(
        this.domains
      ).forEach(domain => {
        domainBreakdown[domain] =
          ideas.filter(
            idea =>
              idea.biometricDomain ===
              domain
          ).length;
      });

      const decisionBreakdown = {
        immediateApproval:
          immediateApproval,

        executionPriority:
          executionPriority,

        review:
          ideas.filter(
            idea =>
              idea.decisionCode ===
              "REVIEW"
          ).length,

        backlog:
          ideas.filter(
            idea =>
              idea.decisionCode ===
              "BACKLOG"
          ).length,

        hold:
          ideas.filter(
            idea =>
              idea.decisionCode ===
              "HOLD"
          ).length
      };

      return {
        totalIdeas:
          ideas.length,

        highPriority,

        quickWins,

        highRisk,

        immediateApproval,

        executionPriority,

        avgDecisionScore:
          averageDecisionScore,

        avgRiskScore:
          averageRiskScore,

        decisionBreakdown,

        domainBreakdown,

        topIdeas:
          [...ideas]
            .sort(
              (a, b) =>
                b.decisionScore -
                a.decisionScore
            )
            .slice(0, 5),

        attentionIdeas:
          [...ideas]
            .filter(
              idea =>
                idea.riskLevel ===
                  "حرج" ||
                idea.riskLevel ===
                  "عالٍ" ||
                idea.decisionScore < 50
            )
            .sort(
              (a, b) =>
                b.riskScore -
                a.riskScore
            )
            .slice(0, 5),

        generatedAt:
          this.now()
      };
    },

    domainSummary() {
      const ideas =
        this.enrichIdeas();

      return Object.values(
        this.domains
      ).map(domain => {
        const domainIdeas =
          ideas.filter(
            idea =>
              idea.biometricDomain ===
              domain.id
          );

        return {
          ...domain,

          ideas:
            domainIdeas.length,

          quickWins:
            domainIdeas.filter(
              idea =>
                idea.quickWin
            ).length,

          highRisk:
            domainIdeas.filter(
              idea =>
                idea.riskLevel ===
                  "حرج" ||
                idea.riskLevel ===
                  "عالٍ"
            ).length,

          averageScore:
            domainIdeas.length
              ? this.average(
                  domainIdeas.map(
                    idea =>
                      idea.decisionScore
                  )
                )
              : 0,

          topIdea:
            [...domainIdeas]
              .sort(
                (a, b) =>
                  b.decisionScore -
                  a.decisionScore
              )[0] || null
        };
      });
    },

    departmentSummary() {
      const ideas =
        this.enrichIdeas();

      const departments =
        this.toArray(
          this.getData().departments
        );

      return departments.map(
        department => {
          const departmentName =
            department.name ||
            department.title ||
            "";

          const departmentIdeas =
            ideas.filter(
              idea =>
                this.normalizeArabic(
                  idea.department
                ) ===
                this.normalizeArabic(
                  departmentName
                )
            );

          return {
            ...this.clone(
              department
            ),

            ideaCount:
              departmentIdeas.length,

            quickWins:
              departmentIdeas.filter(
                idea =>
                  idea.quickWin
              ).length,

            highRisk:
              departmentIdeas.filter(
                idea =>
                  idea.riskLevel ===
                    "حرج" ||
                  idea.riskLevel ===
                    "عالٍ"
              ).length,

            averageDecisionScore:
              departmentIdeas.length
                ? this.average(
                    departmentIdeas.map(
                      idea =>
                        idea.decisionScore
                    )
                  )
                : 0,

            topIdea:
              [...departmentIdeas]
                .sort(
                  (a, b) =>
                    b.decisionScore -
                    a.decisionScore
                )[0] || null
          };
        }
      );
    },

    /* =========================================================
       EXECUTIVE ALERTS
    ========================================================= */

    alerts() {
      const summary =
        this.portfolioSummary();

      const alerts = [];

      if (
        summary.highRisk > 0
      ) {
        alerts.push({
          id:
            "biometric-high-risk",

          level: "high",
          type: "error",

          title:
            "مخاطر بيومترية تحتاج حوكمة",

          message:
            `${summary.highRisk} فرص مرتبطة بالهوية أو الصلاحيات أو الأمن تحتاج مراجعة Human-in-the-Loop.`,

          route:
            "governance",

          priority:
            "high"
        });
      }

      if (
        summary.quickWins >= 3
      ) {
        alerts.push({
          id:
            "biometric-quick-wins",

          level: "medium",
          type: "warning",

          title:
            "حزمة مكاسب سريعة متاحة",

          message:
            `توجد ${summary.quickWins} فرص منخفضة التعقيد ومناسبة للبدء السريع.`,

          route:
            "ideas",

          priority:
            "medium"
        });
      }

      if (
        summary.immediateApproval > 0
      ) {
        alerts.push({
          id:
            "biometric-immediate-approval",

          level: "success",
          type: "success",

          title:
            "فرص جاهزة للاعتماد",

          message:
            `توجد ${summary.immediateApproval} فرص حصلت على درجة اعتماد فوري.`,

          route:
            "decision",

          priority:
            "high"
        });
      }

      if (
        summary.avgDecisionScore >= 75
      ) {
        alerts.push({
          id:
            "biometric-strong-portfolio",

          level: "success",
          type: "success",

          title:
            "محفظة فرص قوية",

          message:
            `متوسط Decision Score هو ${summary.avgDecisionScore}% ويشير إلى جاهزية جيدة للتحويل إلى مشاريع.`,

          route:
            "projects",

          priority:
            "medium"
        });
      }

      if (
        summary.avgDecisionScore < 55 &&
        summary.totalIdeas > 0
      ) {
        alerts.push({
          id:
            "biometric-low-score",

          level: "medium",
          type: "warning",

          title:
            "المحفظة تحتاج استكمال بيانات",

          message:
            `متوسط Decision Score هو ${summary.avgDecisionScore}% ويحتاج إلى تحسين بيانات الأثر والجدوى والحوكمة.`,

          route:
            "ideas",

          priority:
            "medium"
        });
      }

      const top =
        summary.topIdeas[0];

      if (top) {
        alerts.push({
          id:
            `biometric-top-${top.id || "idea"}`,

          level: "info",
          type: "info",

          title:
            "أفضل فرصة للتنفيذ",

          message:
            `${top.title || top.name} حصلت على Decision Score ${top.decisionScore}%.`,

          route:
            "ideas",

          sourceId:
            top.id || null,

          priority:
            "low"
        });
      }

      return alerts;
    },

    syncAlertsToNotifications() {
      const notifications =
        window.AIW?.Notifications;

      if (
        !notifications ||
        typeof notifications.alert !==
          "function"
      ) {
        return [];
      }

      return this.alerts()
        .filter(
          alert =>
            alert.type === "error" ||
            alert.type === "warning"
        )
        .map(alert =>
          notifications.alert({
            title:
              alert.title,

            message:
              alert.message,

            type:
              alert.type,

            priority:
              alert.priority,

            route:
              alert.route,

            source:
              "biometric-analytics",

            sourceId:
              alert.sourceId ||
              alert.id,

            actionLabel:
              "فتح المركز"
          })
        )
        .filter(Boolean);
    },

    /* =========================================================
       EXECUTIVE INSIGHT
    ========================================================= */

    executiveInsight() {
      const summary =
        this.portfolioSummary();

      let status =
        "يحتاج تأسيس";

      let color =
        "red";

      let message =
        "تحتاج محفظة الفرص إلى استكمال بيانات التقييم والحوكمة قبل التوسع.";

      if (
        summary.avgDecisionScore >= 80 &&
        summary.highRisk <=
          Math.max(
            1,
            Math.round(
              summary.totalIdeas * 0.2
            )
          )
      ) {
        status =
          "جاهزية مرتفعة";

        color =
          "green";

        message =
          "محفظة الفرص تتمتع بجاهزية مرتفعة، ويمكن تحويل أفضل الفرص إلى مشاريع مع استمرار مراجعة المخاطر.";
      } else if (
        summary.avgDecisionScore >= 65
      ) {
        status =
          "جاهزية جيدة";

        color =
          "green";

        message =
          "المحفظة في وضع جيد للبدء بالمكاسب السريعة واستكمال دراسة الفرص الأعلى تقييماً.";
      } else if (
        summary.avgDecisionScore >= 50
      ) {
        status =
          "قيد التطوير";

        color =
          "orange";

        message =
          "المحفظة تحتاج إلى تحسين بيانات الجدوى والملكية والحوكمة قبل التوسع.";
      }

      return {
        score:
          summary.avgDecisionScore,

        status,

        color,

        message,

        quickWins:
          summary.quickWins,

        highRisk:
          summary.highRisk,

        readyForApproval:
          summary.immediateApproval,

        topIdea:
          summary.topIdeas[0] ||
          null,

        generatedAt:
          this.now()
      };
    },

    /* =========================================================
       COMPLETE SNAPSHOT
    ========================================================= */

    snapshot() {
      const snapshot = {
        portfolio:
          this.portfolioSummary(),

        domains:
          this.domainSummary(),

        departments:
          this.departmentSummary(),

        alerts:
          this.alerts(),

        insight:
          this.executiveInsight(),

        ideas:
          this.enrichIdeas(),

        generatedAt:
          this.now(),

        engineVersion:
          this.version
      };

      this._cache =
        snapshot;

      return this.clone(
        snapshot
      );
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

      this.syncToStore(
        snapshot
      );

      this.emit(
        "aiw:biometricAnalyticsUpdated",
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

      const summary = {
        totalIdeas:
          snapshot.portfolio.totalIdeas,

        highPriority:
          snapshot.portfolio.highPriority,

        quickWins:
          snapshot.portfolio.quickWins,

        highRisk:
          snapshot.portfolio.highRisk,

        avgDecisionScore:
          snapshot.portfolio.avgDecisionScore,

        immediateApproval:
          snapshot.portfolio.immediateApproval,

        executionPriority:
          snapshot.portfolio.executionPriority,

        decisionBreakdown:
          snapshot.portfolio.decisionBreakdown,

        domainBreakdown:
          snapshot.portfolio.domainBreakdown,

        insight:
          snapshot.insight,

        updatedAt:
          snapshot.generatedAt,

        engineVersion:
          this.version
      };

      this._isSynchronizing = true;

      try {
        if (
          typeof store.get === "function" &&
          typeof store.set === "function"
        ) {
          const current =
            store.get(
              "biometricAnalytics",
              {}
            );

          if (
            JSON.stringify(current) !==
            JSON.stringify(summary)
          ) {
            store.set(
              "biometricAnalytics",
              summary,
              {
                eventName:
                  "aiw:biometricAnalyticsSynchronized",

                backup: false,
                notify: false
              }
            );
          }

          return;
        }

        if (
          typeof store.getData === "function" &&
          typeof store.saveData === "function"
        ) {
          const data =
            store.getData();

          const current =
            data.biometricAnalytics ||
            {};

          if (
            JSON.stringify(current) ===
            JSON.stringify(summary)
          ) {
            return;
          }

          data.biometricAnalytics =
            summary;

          store.saveData(
            data,
            "aiw:biometricAnalyticsSynchronized"
          );
        }
      } catch (error) {
        console.warn(
          "[AIW.BiometricAnalytics] Store synchronization skipped:",
          error
        );
      } finally {
        this._isSynchronizing = false;
      }
    },

    enrichAndSaveIdeas() {
      const store =
        this.getStore();

      const enrichedIdeas =
        this.enrichIdeas();

      if (!store) {
        return enrichedIdeas;
      }

      try {
        if (
          typeof store.setCollection ===
            "function"
        ) {
          store.setCollection(
            "ideas",
            enrichedIdeas
          );

          return enrichedIdeas;
        }

        if (
          typeof store.getData ===
            "function" &&
          typeof store.saveData ===
            "function"
        ) {
          const data =
            store.getData();

          data.ideas =
            enrichedIdeas;

          store.saveData(
            data,
            "aiw:biometricIdeasEnriched"
          );

          return enrichedIdeas;
        }
      } catch (error) {
        console.warn(
          "[AIW.BiometricAnalytics] Unable to save enriched ideas:",
          error
        );
      }

      return enrichedIdeas;
    },

    /* =========================================================
       EVENTS
    ========================================================= */

    bindEvents() {
      if (this._eventsBound) {
        return;
      }

      this._eventsBound = true;

      const events = [
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

      events.forEach(
        eventName => {
          window.addEventListener(
            eventName,
            event => {
              const detail =
                event?.detail ||
                {};

              const collection =
                detail.collection ||
                detail.sourceCollection;

              if (
                collection &&
                ![
                  "ideas",
                  "projects",
                  "risks",
                  "governance",
                  "kpis",
                  "departments"
                ].includes(collection)
              ) {
                return;
              }

              this.scheduleRefresh();
            }
          );
        }
      );

      window.addEventListener(
        "aiw:requestBiometricAnalytics",
        () => {
          this.refresh();
        }
      );
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
            store.subscribe(
              change => {
                const type =
                  change?.type || "";

                const ignoredEvents = [
                  "aiw:biometricAnalyticsUpdated",
                  "aiw:biometricAnalyticsSynchronized",
                  "aiw:biometricIdeasEnriched",
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
              }
            );
        }
      } catch (error) {
        console.warn(
          "[AIW.BiometricAnalytics] Store subscription failed:",
          error
        );
      }
    },

    scheduleRefresh() {
      window.clearTimeout(
        this._refreshTimer
      );

      this._refreshTimer =
        window.setTimeout(
          () => {
            this.refresh();
          },
          140
        );
    },

    emit(name, detail = {}) {
      try {
        window.dispatchEvent(
          new CustomEvent(
            name,
            {
              detail:
                this.clone(
                  detail
                )
            }
          )
        );
      } catch (error) {
        console.warn(
          `[AIW.BiometricAnalytics] Event "${name}" failed:`,
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

      if (!store) {
        return;
      }

      const metadata = {
        biometricAnalyticsVersion:
          this.version,

        biometricAnalyticsEngine:
          "Enterprise Biometric Intelligence Layer",

        biometricAnalyticsCapabilities: [
          "Opportunity Scoring",
          "Risk Classification",
          "Quick Win Detection",
          "Domain Classification",
          "KPI Recommendations",
          "Operational Alerts",
          "Portfolio Analytics",
          "Executive Insights"
        ],

        lastBiometricAnalyticsInitialization:
          this.now()
      };

      try {
        if (
          typeof store.setMetadata ===
            "function"
        ) {
          store.setMetadata(
            metadata
          );

          return;
        }

        if (
          typeof store.getData ===
            "function" &&
          typeof store.saveData ===
            "function"
        ) {
          const data =
            store.getData();

          data.meta =
            data.meta || {};

          Object.assign(
            data.meta,
            metadata
          );

          store.saveData(
            data,
            "aiw:biometricAnalyticsMetadataUpdated"
          );
        }
      } catch (error) {
        console.warn(
          "[AIW.BiometricAnalytics] Metadata registration skipped:",
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
            "[AIW.BiometricAnalytics] Store unsubscribe failed:",
            error
          );
        }
      }

      this._storeUnsubscribe = null;
      this._cache = null;
      this._initialized = false;
      this._eventsBound = false;
      this._isSynchronizing = false;
    }
  };

  /* =========================================================
     GLOBAL REFERENCE
  ========================================================= */

  AIW.BiometricAnalytics =
    BiometricAnalytics;

  /* =========================================================
     BOOTSTRAP
  ========================================================= */

  const bootstrap = () => {
    AIW.BiometricAnalytics.init();
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