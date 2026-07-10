/* =========================================================
   AI Work - Analytics Engine V1.1
   Enterprise Executive Intelligence Engine

   Scope:
   - AIW.Store Integration
   - Executive Score
   - Portfolio Health
   - Maturity Analytics
   - Governance Readiness
   - Risk Exposure
   - Project Delivery Health
   - KPI Performance
   - Opportunity Prioritization
   - Department Ranking
   - Executive Recommendations
   - Automatic Store Synchronization
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};

  const Analytics = {
    id: "analytics",
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

        if (
          store &&
          typeof store.get === "function"
        ) {
          const state = store.get();

          if (
            state &&
            typeof state === "object"
          ) {
            return state;
          }
        }
      } catch (error) {
        console.warn(
          "[AIW.Analytics] Unable to read Store data:",
          error
        );
      }

      return window.AIW?.Data || {};
    },

    getIdeas() {
      const data = this.getData();

      try {
        if (
          window.AIW?.BiometricAnalytics &&
          typeof AIW.BiometricAnalytics.enrichIdeas === "function"
        ) {
          const enrichedIdeas =
            AIW.BiometricAnalytics.enrichIdeas();

          if (Array.isArray(enrichedIdeas)) {
            return enrichedIdeas.filter(
              item => !item?.deletedAt
            );
          }
        }
      } catch (error) {
        console.warn(
          "[AIW.Analytics] Idea enrichment failed:",
          error
        );
      }

      return this.activeItems(data.ideas);
    },

    getProjects() {
      const data = this.getData();

      const primaryProjects =
        this.activeItems(data.projects);

      if (primaryProjects.length) {
        return primaryProjects;
      }

      return this.activeItems(
        data.flagshipProjects
      );
    },

    getDepartments() {
      const data = this.getData();

      return this.activeItems(
        data.departments
      );
    },

    getRisks() {
      return this.activeItems(
        this.getData().risks
      );
    },

    getGovernance() {
      return this.activeItems(
        this.getData().governance
      );
    },

    getKpis() {
      return this.activeItems(
        this.getData().kpis
      );
    },

    getMaturityRecords() {
      return this.activeItems(
        this.getData().maturity
      );
    },

    getBusinessCases() {
      const data = this.getData();

      return this.activeItems(
        data.businessCases ||
        data.business ||
        data.businessCase
      );
    },

    getWorkflows() {
      const data = this.getData();

      return this.activeItems(
        data.automation?.workflows ||
        data.workflows
      );
    },

    /* =========================================================
       GENERAL HELPERS
    ========================================================= */

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

    number(value, fallback = 0) {
      const number = Number(value);

      return Number.isFinite(number)
        ? number
        : fallback;
    },

    average(values = [], options = {}) {
      const validValues =
        this.toArray(values)
          .map(value => Number(value))
          .filter(Number.isFinite);

      if (!validValues.length) {
        return options.fallback ?? 0;
      }

      const result =
        validValues.reduce(
          (total, value) => total + value,
          0
        ) / validValues.length;

      return options.clamp === false
        ? result
        : this.clamp(result);
    },

    weightedAverage(items = []) {
      const validItems =
        this.toArray(items).filter(item => {
          return (
            Number.isFinite(
              Number(item?.value)
            ) &&
            Number.isFinite(
              Number(item?.weight)
            ) &&
            Number(item.weight) > 0
          );
        });

      if (!validItems.length) {
        return 0;
      }

      const totalWeight =
        validItems.reduce(
          (total, item) =>
            total + Number(item.weight),
          0
        );

      if (!totalWeight) {
        return 0;
      }

      const weightedTotal =
        validItems.reduce(
          (total, item) =>
            total +
            Number(item.value) *
              Number(item.weight),
          0
        );

      return this.clamp(
        weightedTotal / totalWeight
      );
    },

    normalizeText(value) {
      return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
    },

    normalizeStatus(value) {
      return this.normalizeText(value)
        .replace(/أ/g, "ا")
        .replace(/إ/g, "ا")
        .replace(/آ/g, "ا")
        .replace(/ى/g, "ي");
    },

    includesAny(value, terms = []) {
      const normalizedValue =
        this.normalizeStatus(value);

      return terms.some(term =>
        normalizedValue.includes(
          this.normalizeStatus(term)
        )
      );
    },

    getFirstNumber(object, fields = [], fallback = 0) {
      for (const field of fields) {
        const value = object?.[field];
        const number = Number(value);

        if (Number.isFinite(number)) {
          return number;
        }
      }

      return fallback;
    },

    getSummary() {
      const data = this.getData();

      return (
        data.summary ||
        data.dashboard ||
        {}
      );
    },

    /* =========================================================
       EXECUTIVE SCORE
    ========================================================= */

    score() {
      const ideaScore =
        this.ideaPortfolioScore();

      const maturityScore =
        this.maturityScore();

      const portfolioScore =
        this.portfolioHealthScore();

      const riskScore =
        this.riskScore();

      const governanceScore =
        this.governanceScore();

      const kpiScore =
        this.kpiPerformanceScore();

      const deliveryScore =
        this.projectDeliveryScore();

      const dataScore =
        this.dataCompletenessScore();

      const executiveScore =
        this.weightedAverage([
          {
            value: ideaScore,
            weight: 12
          },
          {
            value: maturityScore,
            weight: 16
          },
          {
            value: portfolioScore,
            weight: 18
          },
          {
            value: riskScore,
            weight: 15
          },
          {
            value: governanceScore,
            weight: 15
          },
          {
            value: kpiScore,
            weight: 10
          },
          {
            value: deliveryScore,
            weight: 9
          },
          {
            value: dataScore,
            weight: 5
          }
        ]);

      return {
        executiveScore,
        ideaScore,
        maturityScore,
        portfolioScore,
        riskScore,
        governanceScore,
        kpiScore,
        deliveryScore,
        dataScore,
        status:
          this.status(executiveScore),
        generatedAt:
          new Date().toISOString()
      };
    },

    /* =========================================================
       IDEA AND OPPORTUNITY ANALYTICS
    ========================================================= */

    ideaPortfolioScore() {
      const ideas = this.getIdeas();
      const summary = this.getSummary();

      const targetIdeas =
        this.number(
          summary.targetIdeas ||
          summary.ideasTarget,
          100
        );

      if (!ideas.length) {
        return 0;
      }

      const volumeScore =
        this.clamp(
          (
            ideas.length /
            Math.max(targetIdeas, 1)
          ) * 100
        );

      const evaluatedIdeas =
        ideas.filter(idea =>
          this.isIdeaEvaluated(idea)
        ).length;

      const evaluationScore =
        this.clamp(
          (
            evaluatedIdeas /
            ideas.length
          ) * 100
        );

      const ownerAssigned =
        ideas.filter(idea =>
          Boolean(
            idea.owner ||
            idea.department ||
            idea.portfolio
          )
        ).length;

      const ownershipScore =
        this.clamp(
          (
            ownerAssigned /
            ideas.length
          ) * 100
        );

      return this.weightedAverage([
        {
          value: volumeScore,
          weight: 35
        },
        {
          value: evaluationScore,
          weight: 40
        },
        {
          value: ownershipScore,
          weight: 25
        }
      ]);
    },

    isIdeaEvaluated(idea) {
      return Boolean(
        idea?.score !== undefined ||
        idea?.decisionScore !== undefined ||
        idea?.priority ||
        idea?.impact ||
        idea?.riskLevel ||
        idea?.status
      );
    },

    priorityBreakdown() {
      const ideas = this.getIdeas();

      const output = {
        high: 0,
        medium: 0,
        low: 0,
        unknown: 0,
        total: ideas.length
      };

      ideas.forEach(idea => {
        const priority =
          idea.priority ||
          idea.priorityLevel ||
          idea.level ||
          "";

        if (this.isHighPriority(priority)) {
          output.high += 1;
          return;
        }

        if (this.isMediumPriority(priority)) {
          output.medium += 1;
          return;
        }

        if (this.isLowPriority(priority)) {
          output.low += 1;
          return;
        }

        output.unknown += 1;
      });

      return output;
    },

    isHighPriority(value) {
      return this.includesAny(value, [
        "عالية",
        "عال",
        "عالٍ",
        "مرتفع",
        "مرتفعة",
        "high",
        "critical"
      ]);
    },

    isMediumPriority(value) {
      return this.includesAny(value, [
        "متوسطة",
        "متوسط",
        "medium",
        "moderate"
      ]);
    },

    isLowPriority(value) {
      return this.includesAny(value, [
        "منخفضة",
        "منخفض",
        "low"
      ]);
    },

    quickWins() {
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

          const impact =
            idea.impact ||
            idea.impactLevel ||
            "";

          const easy =
            this.includesAny(ease, [
              "سهلة",
              "سهل",
              "منخفضة",
              "منخفض",
              "easy",
              "low"
            ]);

          const lowCost =
            this.includesAny(cost, [
              "منخفضة",
              "منخفض",
              "قليلة",
              "قليل",
              "low"
            ]);

          const highImpact =
            this.includesAny(impact, [
              "عالية",
              "عال",
              "مرتفع",
              "مرتفعة",
              "high"
            ]);

          return (
            easy &&
            (
              lowCost ||
              highImpact
            )
          );
        }
      );
    },

    opportunityRanking(limit = 10) {
      const ideas = this.getIdeas();

      return ideas
        .map(idea => ({
          ...idea,
          analyticsScore:
            this.calculateIdeaScore(idea)
        }))
        .sort(
          (a, b) =>
            b.analyticsScore -
            a.analyticsScore
        )
        .slice(
          0,
          Math.max(0, Number(limit) || 10)
        );
    },

    calculateIdeaScore(idea = {}) {
      const directScore =
        this.getFirstNumber(
          idea,
          [
            "decisionScore",
            "score",
            "priorityScore",
            "analyticsScore"
          ],
          NaN
        );

      if (Number.isFinite(directScore)) {
        return this.clamp(directScore);
      }

      let score = 50;

      if (
        this.isHighPriority(
          idea.priority
        )
      ) {
        score += 20;
      } else if (
        this.isMediumPriority(
          idea.priority
        )
      ) {
        score += 10;
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
            "عال",
            "عالية",
            "مرتفع",
            "critical",
            "high"
          ]
        )
      ) {
        score -= 15;
      }

      if (
        this.includesAny(
          idea.cost,
          [
            "منخفض",
            "منخفضة",
            "low"
          ]
        )
      ) {
        score += 5;
      }

      return this.clamp(score);
    },

    /* =========================================================
       MATURITY ANALYTICS
    ========================================================= */

    maturityScore() {
      const summary = this.getSummary();
      const departments =
        this.getDepartments();

      const maturityRecords =
        this.getMaturityRecords();

      const directScore =
        this.getFirstNumber(
          summary,
          [
            "maturityScore",
            "aiMaturity",
            "maturity"
          ],
          NaN
        );

      const departmentScores =
        departments
          .map(department =>
            this.getDepartmentMaturity(
              department
            )
          )
          .filter(Number.isFinite);

      const maturityScores =
        maturityRecords
          .map(record =>
            this.getFirstNumber(
              record,
              [
                "score",
                "value",
                "maturity",
                "percentage",
                "readiness"
              ],
              NaN
            )
          )
          .filter(Number.isFinite);

      const calculatedScore =
        this.average(
          [
            ...departmentScores,
            ...maturityScores
          ],
          {
            fallback: NaN
          }
        );

      if (
        Number.isFinite(directScore) &&
        Number.isFinite(calculatedScore)
      ) {
        return this.weightedAverage([
          {
            value: directScore,
            weight: 45
          },
          {
            value: calculatedScore,
            weight: 55
          }
        ]);
      }

      if (Number.isFinite(calculatedScore)) {
        return this.clamp(calculatedScore);
      }

      if (Number.isFinite(directScore)) {
        return this.clamp(directScore);
      }

      return 0;
    },

    getDepartmentMaturity(department = {}) {
      return this.clamp(
        this.getFirstNumber(
          department,
          [
            "maturity",
            "readiness",
            "score",
            "percentage",
            "progress"
          ],
          0
        )
      );
    },

    departmentRanking(options = {}) {
      const limit =
        options.limit === undefined
          ? null
          : Math.max(
              0,
              Number(options.limit) || 0
            );

      const ranked =
        this.getDepartments()
          .map(department => ({
            ...department,
            analyticsMaturity:
              this.getDepartmentMaturity(
                department
              )
          }))
          .sort(
            (a, b) =>
              b.analyticsMaturity -
              a.analyticsMaturity
          );

      return limit === null
        ? ranked
        : ranked.slice(0, limit);
    },

    maturityBreakdown() {
      const departments =
        this.departmentRanking();

      return {
        advanced:
          departments.filter(
            item =>
              item.analyticsMaturity >= 80
          ).length,

        ready:
          departments.filter(
            item =>
              item.analyticsMaturity >= 65 &&
              item.analyticsMaturity < 80
          ).length,

        developing:
          departments.filter(
            item =>
              item.analyticsMaturity >= 40 &&
              item.analyticsMaturity < 65
          ).length,

        foundation:
          departments.filter(
            item =>
              item.analyticsMaturity < 40
          ).length,

        total: departments.length
      };
    },

    /* =========================================================
       RISK ANALYTICS
    ========================================================= */

    riskScore(risks = null) {
      const riskItems =
        risks === null
          ? this.getRisks()
          : this.activeItems(risks);

      if (!riskItems.length) {
        return 70;
      }

      const maximumPenalty =
        riskItems.length * 24;

      const totalPenalty =
        riskItems.reduce(
          (total, risk) =>
            total +
            this.getRiskPenalty(risk),
          0
        );

      const exposurePercentage =
        maximumPenalty
          ? (
              totalPenalty /
              maximumPenalty
            ) * 100
          : 0;

      return this.clamp(
        100 - exposurePercentage
      );
    },

    getRiskPenalty(risk = {}) {
      const level =
        risk.level ||
        risk.riskLevel ||
        risk.severity ||
        risk.priority ||
        "";

      let penalty = 6;

      if (
        this.includesAny(level, [
          "حرج",
          "حرجة",
          "critical"
        ])
      ) {
        penalty = 24;
      } else if (
        this.includesAny(level, [
          "عال",
          "عالٍ",
          "عالية",
          "مرتفع",
          "مرتفعة",
          "high"
        ])
      ) {
        penalty = 19;
      } else if (
        this.includesAny(level, [
          "متوسط",
          "متوسطة",
          "medium",
          "moderate"
        ])
      ) {
        penalty = 12;
      }

      const status =
        risk.status || "";

      if (
        this.includesAny(status, [
          "مغلق",
          "معالج",
          "مكتمل",
          "closed",
          "resolved",
          "completed"
        ])
      ) {
        penalty *= 0.25;
      } else if (
        this.includesAny(status, [
          "قيد المعالجة",
          "جاري",
          "in progress",
          "mitigating"
        ])
      ) {
        penalty *= 0.65;
      }

      if (
        risk.mitigation ||
        risk.action ||
        risk.owner
      ) {
        penalty *= 0.85;
      }

      return penalty;
    },

    riskBreakdown() {
      const risks = this.getRisks();

      const output = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        unknown: 0,
        total: risks.length
      };

      risks.forEach(risk => {
        const level =
          risk.level ||
          risk.riskLevel ||
          risk.severity ||
          "";

        if (
          this.includesAny(level, [
            "حرج",
            "حرجة",
            "critical"
          ])
        ) {
          output.critical += 1;
          return;
        }

        if (
          this.includesAny(level, [
            "عال",
            "عالية",
            "مرتفع",
            "high"
          ])
        ) {
          output.high += 1;
          return;
        }

        if (
          this.includesAny(level, [
            "متوسط",
            "متوسطة",
            "medium"
          ])
        ) {
          output.medium += 1;
          return;
        }

        if (
          this.includesAny(level, [
            "منخفض",
            "منخفضة",
            "low"
          ])
        ) {
          output.low += 1;
          return;
        }

        output.unknown += 1;
      });

      return output;
    },

    /* =========================================================
       GOVERNANCE ANALYTICS
    ========================================================= */

    governanceScore() {
      const governance =
        this.getGovernance();

      const risks =
        this.getRisks();

      const kpis =
        this.getKpis();

      const projects =
        this.getProjects();

      const governanceCoverage =
        this.collectionCoverageScore(
          governance,
          6
        );

      const riskCoverage =
        this.collectionCoverageScore(
          risks,
          4
        );

      const kpiCoverage =
        this.collectionCoverageScore(
          kpis,
          5
        );

      const projectGovernanceCoverage =
        projects.length
          ? this.clamp(
              (
                projects.filter(
                  project =>
                    project.governance ||
                    project.governanceStatus ||
                    project.riskLevel ||
                    project.owner
                ).length /
                projects.length
              ) * 100
            )
          : 0;

      const approvedControls =
        governance.length
          ? this.clamp(
              (
                governance.filter(
                  control =>
                    this.includesAny(
                      control.status,
                      [
                        "معتمد",
                        "الزامي",
                        "مكتمل",
                        "نشط",
                        "approved",
                        "active",
                        "completed"
                      ]
                    )
                ).length /
                governance.length
              ) * 100
            )
          : 0;

      return this.weightedAverage([
        {
          value: governanceCoverage,
          weight: 30
        },
        {
          value: approvedControls,
          weight: 25
        },
        {
          value: riskCoverage,
          weight: 15
        },
        {
          value: kpiCoverage,
          weight: 15
        },
        {
          value:
            projectGovernanceCoverage,
          weight: 15
        }
      ]);
    },

    collectionCoverageScore(
      collection,
      target
    ) {
      const count =
        this.toArray(collection).length;

      return this.clamp(
        (
          count /
          Math.max(target, 1)
        ) * 100
      );
    },

    /* =========================================================
       PROJECT AND PORTFOLIO ANALYTICS
    ========================================================= */

    portfolioHealthScore() {
      const summary = this.getSummary();
      const projects = this.getProjects();

      const directPortfolioHealth =
        this.getFirstNumber(
          summary,
          [
            "portfolioHealth",
            "healthScore",
            "projectHealth"
          ],
          NaN
        );

      const calculatedProjectHealth =
        this.calculateProjectPortfolioHealth(
          projects
        );

      if (
        Number.isFinite(
          directPortfolioHealth
        ) &&
        projects.length
      ) {
        return this.weightedAverage([
          {
            value:
              directPortfolioHealth,
            weight: 35
          },
          {
            value:
              calculatedProjectHealth,
            weight: 65
          }
        ]);
      }

      if (projects.length) {
        return calculatedProjectHealth;
      }

      if (
        Number.isFinite(
          directPortfolioHealth
        )
      ) {
        return this.clamp(
          directPortfolioHealth
        );
      }

      return 0;
    },

    calculateProjectPortfolioHealth(
      projects = []
    ) {
      const activeProjects =
        this.activeItems(projects);

      if (!activeProjects.length) {
        return 0;
      }

      const projectScores =
        activeProjects.map(project =>
          this.calculateProjectHealth(
            project
          )
        );

      return this.average(projectScores);
    },

    calculateProjectHealth(project = {}) {
      const directHealth =
        this.getFirstNumber(
          project,
          [
            "health",
            "healthScore",
            "readiness",
            "score"
          ],
          NaN
        );

      const progress =
        this.clamp(
          this.getFirstNumber(
            project,
            [
              "progress",
              "completion",
              "completionRate",
              "percentage"
            ],
            0
          )
        );

      const status =
        project.status || "";

      let statusScore = 55;

      if (
        this.includesAny(status, [
          "مكتمل",
          "مكتملة",
          "منجز",
          "completed",
          "done"
        ])
      ) {
        statusScore = 100;
      } else if (
        this.includesAny(status, [
          "نشط",
          "قيد التنفيذ",
          "جاري",
          "active",
          "in progress"
        ])
      ) {
        statusScore = 78;
      } else if (
        this.includesAny(status, [
          "مخطط",
          "جديد",
          "planned",
          "new"
        ])
      ) {
        statusScore = 55;
      } else if (
        this.includesAny(status, [
          "متأخر",
          "متعثر",
          "خطر",
          "delayed",
          "blocked",
          "at risk"
        ])
      ) {
        statusScore = 30;
      }

      let riskScore = 80;

      if (
        this.includesAny(
          project.riskLevel ||
          project.risk,
          [
            "حرج",
            "عال",
            "عالية",
            "مرتفع",
            "critical",
            "high"
          ]
        )
      ) {
        riskScore = 35;
      } else if (
        this.includesAny(
          project.riskLevel ||
          project.risk,
          [
            "متوسط",
            "متوسطة",
            "medium"
          ]
        )
      ) {
        riskScore = 62;
      } else if (
        this.includesAny(
          project.riskLevel ||
          project.risk,
          [
            "منخفض",
            "منخفضة",
            "low"
          ]
        )
      ) {
        riskScore = 90;
      }

      const ownershipScore =
        project.owner ||
        project.sponsor
          ? 100
          : 35;

      const kpiLinkScore =
        project.kpi ||
        project.kpiId ||
        project.kpis
          ? 100
          : 40;

      const scores = [
        {
          value: progress,
          weight: 25
        },
        {
          value: statusScore,
          weight: 25
        },
        {
          value: riskScore,
          weight: 20
        },
        {
          value: ownershipScore,
          weight: 15
        },
        {
          value: kpiLinkScore,
          weight: 15
        }
      ];

      if (Number.isFinite(directHealth)) {
        scores.push({
          value: directHealth,
          weight: 25
        });
      }

      return this.weightedAverage(scores);
    },

    projectDeliveryScore() {
      const projects = this.getProjects();

      if (!projects.length) {
        return 0;
      }

      const scores =
        projects.map(project => {
          const progress =
            this.getFirstNumber(
              project,
              [
                "progress",
                "completion",
                "completionRate",
                "percentage"
              ],
              0
            );

          const schedule =
            this.getFirstNumber(
              project,
              [
                "scheduleScore",
                "timelineScore",
                "onTimeScore"
              ],
              NaN
            );

          const status =
            project.status || "";

          let statusScore = 60;

          if (
            this.includesAny(status, [
              "مكتمل",
              "منجز",
              "completed"
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
            statusScore = 80;
          } else if (
            this.includesAny(status, [
              "متأخر",
              "متعثر",
              "delayed",
              "blocked"
            ])
          ) {
            statusScore = 30;
          }

          return this.weightedAverage([
            {
              value: progress,
              weight: 50
            },
            {
              value: statusScore,
              weight: 30
            },
            {
              value:
                Number.isFinite(schedule)
                  ? schedule
                  : statusScore,
              weight: 20
            }
          ]);
        });

      return this.average(scores);
    },

    projectStatusBreakdown() {
      const projects = this.getProjects();

      const output = {
        completed: 0,
        active: 0,
        planned: 0,
        delayed: 0,
        other: 0,
        total: projects.length
      };

      projects.forEach(project => {
        const status =
          project.status || "";

        if (
          this.includesAny(status, [
            "مكتمل",
            "منجز",
            "completed",
            "done"
          ])
        ) {
          output.completed += 1;
          return;
        }

        if (
          this.includesAny(status, [
            "قيد التنفيذ",
            "نشط",
            "جاري",
            "active",
            "in progress"
          ])
        ) {
          output.active += 1;
          return;
        }

        if (
          this.includesAny(status, [
            "مخطط",
            "جديد",
            "planned",
            "new"
          ])
        ) {
          output.planned += 1;
          return;
        }

        if (
          this.includesAny(status, [
            "متأخر",
            "متعثر",
            "delayed",
            "blocked"
          ])
        ) {
          output.delayed += 1;
          return;
        }

        output.other += 1;
      });

      return output;
    },

    /* =========================================================
       KPI ANALYTICS
    ========================================================= */

    kpiPerformanceScore() {
      const kpis = this.getKpis();

      if (!kpis.length) {
        return 0;
      }

      const kpiScores =
        kpis.map(kpi => {
          const directScore =
            this.getFirstNumber(
              kpi,
              [
                "score",
                "performance",
                "achievement",
                "percentage",
                "progress"
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

          const actual =
            this.getFirstNumber(
              kpi,
              [
                "actual",
                "current",
                "value"
              ],
              NaN
            );

          const target =
            this.getFirstNumber(
              kpi,
              [
                "target",
                "goal",
                "targetValue"
              ],
              NaN
            );

          if (
            Number.isFinite(actual) &&
            Number.isFinite(target) &&
            target !== 0
          ) {
            return this.clamp(
              (
                actual /
                target
              ) * 100
            );
          }

          const status =
            kpi.status || "";

          if (
            this.includesAny(status, [
              "محقق",
              "مكتمل",
              "اخضر",
              "green",
              "achieved",
              "completed"
            ])
          ) {
            return 100;
          }

          if (
            this.includesAny(status, [
              "قيد المتابعة",
              "متوسط",
              "برتقالي",
              "medium",
              "warning"
            ])
          ) {
            return 65;
          }

          if (
            this.includesAny(status, [
              "متاخر",
              "احمر",
              "red",
              "delayed",
              "failed"
            ])
          ) {
            return 30;
          }

          return 50;
        });

      return this.average(kpiScores);
    },

    kpiBreakdown() {
      const kpis = this.getKpis();

      const output = {
        achieved: 0,
        onTrack: 0,
        attention: 0,
        critical: 0,
        total: kpis.length
      };

      kpis.forEach(kpi => {
        const score =
          this.getFirstNumber(
            kpi,
            [
              "score",
              "performance",
              "achievement",
              "percentage",
              "progress"
            ],
            NaN
          );

        if (Number.isFinite(score)) {
          if (score >= 100) {
            output.achieved += 1;
          } else if (score >= 75) {
            output.onTrack += 1;
          } else if (score >= 50) {
            output.attention += 1;
          } else {
            output.critical += 1;
          }

          return;
        }

        const status =
          kpi.status || "";

        if (
          this.includesAny(status, [
            "محقق",
            "مكتمل",
            "achieved",
            "completed"
          ])
        ) {
          output.achieved += 1;
        } else if (
          this.includesAny(status, [
            "جيد",
            "المسار",
            "on track",
            "green"
          ])
        ) {
          output.onTrack += 1;
        } else if (
          this.includesAny(status, [
            "تحذير",
            "متوسط",
            "attention",
            "warning"
          ])
        ) {
          output.attention += 1;
        } else {
          output.critical += 1;
        }
      });

      return output;
    },

    /* =========================================================
       DATA COMPLETENESS
    ========================================================= */

    dataCompletenessScore() {
      const collections = [
        this.getIdeas(),
        this.getProjects(),
        this.getDepartments(),
        this.getRisks(),
        this.getGovernance(),
        this.getKpis(),
        this.getMaturityRecords(),
        this.getBusinessCases(),
        this.getWorkflows()
      ];

      const populated =
        collections.filter(
          collection =>
            Array.isArray(collection) &&
            collection.length > 0
        ).length;

      const availabilityScore =
        this.clamp(
          (
            populated /
            collections.length
          ) * 100
        );

      const data = this.getData();

      const metadataFields = [
        data.meta?.version,
        data.meta?.createdAt,
        data.meta?.updatedAt,
        data.meta?.schemaVersion
      ];

      const metadataScore =
        this.clamp(
          (
            metadataFields.filter(Boolean)
              .length /
            metadataFields.length
          ) * 100
        );

      return this.weightedAverage([
        {
          value: availabilityScore,
          weight: 80
        },
        {
          value: metadataScore,
          weight: 20
        }
      ]);
    },

    /* =========================================================
       RECOMMENDATIONS
    ========================================================= */

    recommendations(options = {}) {
      const scores = this.score();
      const quickWins = this.quickWins();
      const ranking =
        this.departmentRanking({
          limit: 3
        });

      const riskBreakdown =
        this.riskBreakdown();

      const projectBreakdown =
        this.projectStatusBreakdown();

      const kpiBreakdown =
        this.kpiBreakdown();

      const output = [];

      if (scores.maturityScore < 50) {
        output.push({
          id: "maturity-foundation",
          priority: "عالية",
          category: "النضج",
          title:
            "رفع الجاهزية المؤسسية",
          text:
            "استكمال متطلبات البيانات والمهارات والحوكمة قبل التوسع في المبادرات المعقدة.",
          route: "maturity"
        });
      } else if (
        scores.maturityScore < 70
      ) {
        output.push({
          id: "maturity-improvement",
          priority: "متوسطة",
          category: "النضج",
          title:
            "تسريع خطة النضج",
          text:
            "التركيز على الإدارات الأقل جاهزية وربط خطط التحسين بمؤشرات زمنية واضحة.",
          route: "maturity"
        });
      }

      if (quickWins.length >= 3) {
        output.push({
          id: "quick-wins",
          priority: "عالية",
          category: "الفرص",
          title:
            "إطلاق حزمة مكاسب سريعة",
          text:
            `اعتماد أفضل ثلاث فرص سريعة من أصل ${quickWins.length} فرص لإثبات القيمة التشغيلية مبكراً.`,
          route: "ideas"
        });
      } else if (!quickWins.length) {
        output.push({
          id: "identify-quick-wins",
          priority: "متوسطة",
          category: "الفرص",
          title:
            "تحديد المكاسب السريعة",
          text:
            "إعادة تقييم الفرص حسب سهولة التنفيذ والتكلفة والأثر لتحديد مبادرات قصيرة المدى.",
          route: "ideas"
        });
      }

      if (
        scores.riskScore < 70 ||
        riskBreakdown.high > 0 ||
        riskBreakdown.critical > 0
      ) {
        output.push({
          id: "risk-treatment",
          priority: "عالية",
          category: "المخاطر",
          title:
            "تسريع معالجة المخاطر",
          text:
            "اعتماد ملاك للمخاطر وخطط معالجة ومواعيد مراجعة قبل الانتقال إلى التشغيل الفعلي.",
          route: "governance"
        });
      }

      if (
        scores.governanceScore < 70
      ) {
        output.push({
          id: "governance-controls",
          priority: "عالية",
          category: "الحوكمة",
          title:
            "استكمال ضوابط الحوكمة",
          text:
            "ربط كل مبادرة بمراجعة الخصوصية والإشراف البشري وتوثيق القرار قبل الاعتماد.",
          route: "governance"
        });
      }

      if (
        projectBreakdown.delayed > 0
      ) {
        output.push({
          id: "delayed-projects",
          priority: "عالية",
          category: "المشاريع",
          title:
            "معالجة المشاريع المتأخرة",
          text:
            `توجد ${projectBreakdown.delayed} مشاريع متأخرة أو متعثرة وتتطلب قراراً تنفيذياً وخطة تصحيح.`,
          route: "projects"
        });
      }

      if (
        scores.kpiScore < 65 ||
        kpiBreakdown.critical > 0
      ) {
        output.push({
          id: "kpi-alignment",
          priority: "متوسطة",
          category: "المؤشرات",
          title:
            "تقوية قياس الأداء",
          text:
            "ربط كل مشروع بمؤشر أداء وهدف رقمي ومالك مسؤول قبل الاعتماد النهائي.",
          route: "kpis"
        });
      }

      if (ranking.length) {
        const names =
          ranking
            .slice(0, 2)
            .map(
              department =>
                department.name ||
                department.title
            )
            .filter(Boolean);

        if (names.length) {
          output.push({
            id: "department-readiness",
            priority: "متوسطة",
            category: "التنفيذ",
            title:
              "البدء بالإدارات الأعلى جاهزية",
            text:
              `توجيه المرحلة الأولى إلى ${names.join(
                " و"
              )} لرفع فرص النجاح وتسريع تحقيق الأثر.`,
            route: "strategy"
          });
        }
      }

      if (
        scores.dataScore < 70
      ) {
        output.push({
          id: "data-completeness",
          priority: "متوسطة",
          category: "البيانات",
          title:
            "استكمال بيانات المنصة",
          text:
            "استكمال بيانات المشاريع والحوكمة والمخاطر والمؤشرات لضمان دقة التحليلات التنفيذية.",
          route: "settings"
        });
      }

      if (!output.length) {
        output.push({
          id: "controlled-scale",
          priority: "منخفضة",
          category: "التوسع",
          title:
            "التوسع المنظم",
          text:
            "المؤشرات الحالية تدعم التوسع التدريجي مع استمرار مراقبة الأثر والمخاطر والحوكمة.",
          route: "strategy"
        });
      }

      const limit =
        options.limit === undefined
          ? output.length
          : Math.max(
              0,
              Number(options.limit) || 0
            );

      if (options.asText === true) {
        return output
          .slice(0, limit)
          .map(item => item.text);
      }

      return output.slice(0, limit);
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

    /* =========================================================
       EXECUTIVE SUMMARY
    ========================================================= */

    executiveSummary() {
      const scores = this.score();
      const priority =
        this.priorityBreakdown();

      const quickWins =
        this.quickWins();

      const risks =
        this.riskBreakdown();

      const projects =
        this.projectStatusBreakdown();

      const departments =
        this.departmentRanking({
          limit: 3
        });

      return {
        title:
          "الخلاصة التنفيذية للمنصة",

        score:
          scores.executiveScore,

        status:
          this.status(
            scores.executiveScore
          ),

        message:
          this.executiveMessage(scores),

        priority,
        quickWins:
          quickWins.length,
        risks,
        projects,
        topDepartments:
          departments.map(
            department => ({
              name:
                department.name ||
                department.title ||
                "محفظة تشغيلية",
              maturity:
                department.analyticsMaturity
            })
          ),

        recommendations:
          this.recommendations({
            limit: 5
          }),

        generatedAt:
          new Date().toISOString()
      };
    },

    executiveMessage(scores) {
      if (
        scores.executiveScore >= 85
      ) {
        return "المنصة تتمتع بجاهزية تنفيذية مرتفعة وتدعم التوسع المنظم، مع استمرار مراقبة المخاطر وقياس الأثر.";
      }

      if (
        scores.executiveScore >= 70
      ) {
        return "المنصة في وضع مستقر للانتقال إلى مراحل تنفيذ أوسع، مع ضرورة إغلاق الفجوات المتبقية في الحوكمة والمؤشرات.";
      }

      if (
        scores.executiveScore >= 50
      ) {
        return "المنصة تملك أساساً تشغيلياً جيداً، لكنها تحتاج إلى تحسين الجاهزية وربط المشاريع بالمخاطر والمؤشرات قبل التوسع.";
      }

      return "المنصة ما زالت في مرحلة التأسيس وتحتاج إلى استكمال البيانات والحوكمة والجاهزية قبل اعتماد مبادرات تشغيلية واسعة.";
    },

    status(score) {
      const value = this.clamp(score);

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
      const value = this.clamp(score);

      if (value >= 70) {
        return "green";
      }

      if (value >= 45) {
        return "orange";
      }

      return "red";
    },

    /* =========================================================
       FULL ANALYTICS SNAPSHOT
    ========================================================= */

    snapshot() {
      const result = {
        scores: this.score(),

        opportunities: {
          total:
            this.getIdeas().length,
          priority:
            this.priorityBreakdown(),
          quickWins:
            this.quickWins().length,
          ranking:
            this.opportunityRanking(10)
        },

        projects: {
          total:
            this.getProjects().length,
          status:
            this.projectStatusBreakdown(),
          deliveryScore:
            this.projectDeliveryScore(),
          portfolioHealth:
            this.portfolioHealthScore()
        },

        maturity: {
          score:
            this.maturityScore(),
          breakdown:
            this.maturityBreakdown(),
          departments:
            this.departmentRanking()
        },

        risks: {
          score:
            this.riskScore(),
          breakdown:
            this.riskBreakdown()
        },

        governance: {
          score:
            this.governanceScore(),
          controls:
            this.getGovernance().length
        },

        kpis: {
          score:
            this.kpiPerformanceScore(),
          breakdown:
            this.kpiBreakdown(),
          total:
            this.getKpis().length
        },

        data: {
          completenessScore:
            this.dataCompletenessScore()
        },

        recommendations:
          this.recommendations(),

        executiveSummary:
          this.executiveSummary(),

        generatedAt:
          new Date().toISOString()
      };

      this._cache = result;
      this._cacheTimestamp =
        result.generatedAt;

      return result;
    },

    getSnapshot(options = {}) {
      if (
        options.fresh === true ||
        !this._cache
      ) {
        return this.snapshot();
      }

      return this.clone(this._cache);
    },

    refresh() {
      const result = this.snapshot();

      this.syncSummaryToStore(result);

      this.emit(
        "aiw:analyticsUpdated",
        result
      );

      return result;
    },

    clone(value) {
      try {
        return structuredClone(value);
      } catch (error) {
        return JSON.parse(
          JSON.stringify(value)
        );
      }
    },

    /* =========================================================
       STORE SYNCHRONIZATION
    ========================================================= */

    syncSummaryToStore(snapshot) {
      const store = this.getStore();

      if (!store || !snapshot) {
        return;
      }

      const dashboardPatch = {
        executiveScore:
          snapshot.scores.executiveScore,

        maturityScore:
          snapshot.scores.maturityScore,

        portfolioHealth:
          snapshot.scores.portfolioScore,

        riskScore:
          snapshot.scores.riskScore,

        governanceScore:
          snapshot.scores.governanceScore,

        kpiScore:
          snapshot.scores.kpiScore,

        deliveryScore:
          snapshot.scores.deliveryScore,

        dataCompleteness:
          snapshot.scores.dataScore,

        analyticsUpdatedAt:
          snapshot.generatedAt
      };

      try {
        const currentDashboard =
          typeof store.get === "function"
            ? store.get("dashboard", {})
            : this.getData().dashboard || {};

        const hasChanges =
          Object.keys(dashboardPatch).some(
            key =>
              currentDashboard?.[key] !==
              dashboardPatch[key]
          );

        if (!hasChanges) {
          return;
        }

        if (
          typeof store.set === "function"
        ) {
          store.set(
            "dashboard",
            {
              ...currentDashboard,
              ...dashboardPatch
            },
            {
              eventName:
                "aiw:analyticsSynchronized",
              backup: false,
              notify: false
            }
          );

          return;
        }

        if (
          typeof store.patch === "function"
        ) {
          store.patch(
            {
              dashboard:
                dashboardPatch
            },
            {
              eventName:
                "aiw:analyticsSynchronized",
              backup: false,
              notify: false
            }
          );
        }
      } catch (error) {
        console.warn(
          "[AIW.Analytics] Dashboard synchronization skipped:",
          error
        );
      }
    },

    bindStore() {
      const store = this.getStore();

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
                "aiw:analyticsUpdated",
                "aiw:analyticsSynchronized",
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

          return;
        }

        if (
          typeof store.onChange ===
            "function"
        ) {
          this._storeUnsubscribe =
            store.onChange(() => {
              this.scheduleRefresh();
            });
        }
      } catch (error) {
        console.warn(
          "[AIW.Analytics] Store subscription failed:",
          error
        );
      }
    },

    bindEvents() {
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

      events.forEach(eventName => {
        window.addEventListener(
          eventName,
          () => this.scheduleRefresh()
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
        }, 120);
    },

    /* =========================================================
       METADATA AND EVENTS
    ========================================================= */

    registerMetadata() {
      const store = this.getStore();

      if (
        !store ||
        typeof store.setMetadata !==
          "function"
      ) {
        return;
      }

      try {
        store.setMetadata({
          analyticsVersion:
            this.version,

          analyticsEngine:
            "Enterprise Executive Intelligence",

          analyticsFeatures: [
            "Executive Score",
            "Portfolio Health",
            "Risk Analytics",
            "Governance Readiness",
            "Maturity Analytics",
            "KPI Performance",
            "Recommendations"
          ],

          lastAnalyticsInitialization:
            new Date().toISOString()
        });
      } catch (error) {
        console.warn(
          "[AIW.Analytics] Metadata registration skipped:",
          error
        );
      }
    },

    emit(name, detail = {}) {
      try {
        window.dispatchEvent(
          new CustomEvent(name, {
            detail: this.clone(detail)
          })
        );
      } catch (error) {
        console.warn(
          `[AIW.Analytics] Event "${name}" failed:`,
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
            "[AIW.Analytics] Store unsubscribe failed:",
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
     GLOBAL REFERENCE
  ========================================================= */

  AIW.Analytics = Analytics;

  /* =========================================================
     BOOTSTRAP
  ========================================================= */

  const bootstrap = () => {
    AIW.Analytics.init();
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