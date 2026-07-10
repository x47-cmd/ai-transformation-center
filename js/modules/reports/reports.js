/* =========================================================
   AI Work - Executive Reports Center V2.3
   Biometric Executive Analytics

   Updates:
   - Central AIW.Store Integration
   - Live Cross-Page Synchronization
   - Dynamic Ideas, Projects, KPI and Governance Data
   - Dynamic Portfolio Distribution
   - Persistent Report Settings
   - Safe Analytics Fallbacks
   - No UI Design Changes
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.reports = {
  id: "reports",
  title: "التقارير",
  icon: "📊",

  _container: null,
  _syncBound: false,
  _seedChecked: false,

  /* =======================================================
     Default Reports Configuration
  ======================================================= */

  defaultReportsCenter: {
    settings: {
      title: "مركز التقارير والتحليلات التنفيذية",
      reportingCycle: "شهري",
      topDecisionLimit: 5,
      showCharts: true
    },

    executiveSummary: {
      title:
        "المبادرة تمتلك أساساً جيداً للانتقال إلى القياس والتشغيل الذكي",

      description:
        "التركيز الحالي هو بناء خط أساس واضح لجودة التسجيلات، مراقبة استخدام الصلاحيات، متابعة أداء البوابات الذكية، ثم تفعيل التنبيهات والتحليلات المتقدمة بشكل تدريجي وتحت إشراف بشري."
    },

    executiveHighlight: {
      title: "الأولوية الحالية: قياس قبل التوسع",

      description:
        "أفضل مسار الآن هو تشغيل لوحات Power BI أولاً لقياس أخطاء التسجيل، الجلسات الطويلة، استخدام الصلاحيات، وجاهزية البوابات قبل تشغيل نماذج ذكاء اصطناعي متقدمة."
    },

    finalRecommendation: {
      title:
        "البدء بثلاث لوحات قياس تشغيلية قبل أي تكامل متقدم",

      description:
        "التوصية هي البدء بلوحة جودة التسجيلات، لوحة استخدام الصلاحيات والجلسات، ولوحة أداء البوابات الذكية. هذه الخطوة تعطي الإدارة رؤية واضحة وتوفر أساساً آمناً لبناء التنبيهات ونماذج كشف الشذوذ لاحقاً."
    },

    meta: {
      createdAt: null,
      updatedAt: null
    }
  },

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
        "AI Work Reports: Unable to read shared data.",
        error
      );

      return window.AIW?.Data || {};
    }
  },

  /* =======================================================
     Reports Center Initialization
  ======================================================= */

  ensureReportsCenterSeeded() {
    if (this._seedChecked) return;

    this._seedChecked = true;

    const sharedData = this.getSharedData();

    const hasReportsCenter =
      sharedData.reportsCenter &&
      typeof sharedData.reportsCenter === "object";

    if (hasReportsCenter) {
      return;
    }

    const reportsCenter = this.clone(
      this.defaultReportsCenter
    );

    const now = new Date().toISOString();

    reportsCenter.meta.createdAt = now;
    reportsCenter.meta.updatedAt = now;

    if (
      window.AIW?.Store &&
      typeof window.AIW.Store.update === "function"
    ) {
      window.AIW.Store.update(
        "reportsCenter",
        reportsCenter,
        {
          event: "aiw:reportsUpdated"
        }
      );

      return;
    }

    if (window.AIW?.Data) {
      window.AIW.Data.reportsCenter =
        reportsCenter;
    }
  },

  getReportsCenter() {
    const sharedData = this.getSharedData();

    const source =
      sharedData.reportsCenter &&
      typeof sharedData.reportsCenter === "object"
        ? sharedData.reportsCenter
        : this.defaultReportsCenter;

    return {
      settings: {
        ...this.defaultReportsCenter.settings,
        ...(source.settings || {})
      },

      executiveSummary: {
        ...this.defaultReportsCenter.executiveSummary,
        ...(source.executiveSummary || {})
      },

      executiveHighlight: {
        ...this.defaultReportsCenter.executiveHighlight,
        ...(source.executiveHighlight || {})
      },

      finalRecommendation: {
        ...this.defaultReportsCenter.finalRecommendation,
        ...(source.finalRecommendation || {})
      },

      meta: {
        ...this.defaultReportsCenter.meta,
        ...(source.meta || {})
      }
    };
  },

  updateReportsCenter(changes = {}) {
    if (
      !changes ||
      typeof changes !== "object"
    ) {
      return false;
    }

    const current = this.getReportsCenter();

    const updated = {
      ...current,
      ...changes,

      settings: {
        ...current.settings,
        ...(changes.settings || {})
      },

      executiveSummary: {
        ...current.executiveSummary,
        ...(changes.executiveSummary || {})
      },

      executiveHighlight: {
        ...current.executiveHighlight,
        ...(changes.executiveHighlight || {})
      },

      finalRecommendation: {
        ...current.finalRecommendation,
        ...(changes.finalRecommendation || {})
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
        "reportsCenter",
        updated,
        {
          event: "aiw:reportsUpdated"
        }
      );
    }

    if (window.AIW?.Data) {
      window.AIW.Data.reportsCenter = updated;

      window.dispatchEvent(
        new CustomEvent(
          "aiw:reportsUpdated",
          {
            detail: {
              reportsCenter: updated
            }
          }
        )
      );

      return true;
    }

    return false;
  },

  /* =======================================================
     Data Readers
  ======================================================= */

  getIdeas() {
    const data = this.getSharedData();

    const ideas = Array.isArray(data.ideas)
      ? data.ideas
      : [];

    try {
      if (
        window.AIW?.BiometricAnalytics &&
        typeof window.AIW.BiometricAnalytics
          .enrichIdeas === "function"
      ) {
        const enriched =
          window.AIW.BiometricAnalytics
            .enrichIdeas(ideas);

        if (Array.isArray(enriched)) {
          return enriched;
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Reports: Idea enrichment failed.",
        error
      );
    }

    return ideas;
  },

  getProjects() {
    const data = this.getSharedData();

    return Array.isArray(data.projects)
      ? data.projects
      : [];
  },

  getRoadmap() {
    const data = this.getSharedData();

    return Array.isArray(data.roadmap)
      ? data.roadmap
      : [];
  },

  getRisks() {
    const data = this.getSharedData();

    if (
      data.governanceCenter &&
      Array.isArray(
        data.governanceCenter.risks
      )
    ) {
      return data.governanceCenter.risks;
    }

    return Array.isArray(data.risks)
      ? data.risks
      : [];
  },

  getKpis() {
    const data = this.getSharedData();

    if (
      data.kpiCenter &&
      Array.isArray(data.kpiCenter.items)
    ) {
      return data.kpiCenter.items;
    }

    return [];
  },

  getDepartments(ideas = []) {
    const data = this.getSharedData();

    const configuredDepartments =
      Array.isArray(data.departments)
        ? data.departments
        : [];

    const names = new Set(
      configuredDepartments
        .map((department) =>
          department?.name
        )
        .filter(Boolean)
    );

    ideas.forEach((idea) => {
      if (idea?.department) {
        names.add(idea.department);
      }
    });

    return [...names].map((name) => {
      const configured =
        configuredDepartments.find(
          (department) =>
            department?.name === name
        ) || {};

      const count = ideas.filter(
        (idea) =>
          idea?.department === name
      ).length;

      return {
        ...configured,
        name,
        count,
        maturity:
          this.normalizePercent(
            configured.maturity,
            0
          )
      };
    });
  },

  /* =======================================================
     Classification
  ======================================================= */

  isHighPriority(idea) {
    const value = String(
      idea?.priority || ""
    )
      .trim()
      .toLowerCase();

    return (
      value === "عالية" ||
      value === "عالي" ||
      value === "high" ||
      value === "critical"
    );
  },

  isMediumPriority(idea) {
    const value = String(
      idea?.priority || ""
    )
      .trim()
      .toLowerCase();

    return (
      value === "متوسطة" ||
      value === "متوسط" ||
      value === "medium"
    );
  },

  isLowPriority(idea) {
    const value = String(
      idea?.priority || ""
    )
      .trim()
      .toLowerCase();

    return (
      value === "منخفضة" ||
      value === "منخفض" ||
      value === "low"
    );
  },

  isQuickWin(idea) {
    if (idea?.quickWin === true) {
      return true;
    }

    const ease = String(
      idea?.ease || ""
    )
      .trim()
      .toLowerCase();

    const cost = String(
      idea?.cost || ""
    )
      .trim()
      .toLowerCase();

    return (
      ["سهلة", "سهل", "easy"].includes(ease) &&
      ["منخفضة", "منخفض", "low"].includes(cost)
    );
  },

  getQuickWins(ideas) {
    try {
      if (
        window.AIW?.Decision &&
        typeof window.AIW.Decision.quickWins ===
          "function"
      ) {
        const result =
          window.AIW.Decision.quickWins(
            ideas
          );

        if (Array.isArray(result)) {
          return result;
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Reports: Quick Win engine failed.",
        error
      );
    }

    return ideas.filter(
      (idea) => this.isQuickWin(idea)
    );
  },

  /* =======================================================
     Scores
  ======================================================= */

  getScores(context) {
    let analyticsScores = {};

    try {
      if (
        window.AIW?.Analytics &&
        typeof window.AIW.Analytics.score ===
          "function"
      ) {
        analyticsScores =
          window.AIW.Analytics.score() || {};
      }
    } catch (error) {
      console.warn(
        "AI Work Reports: Analytics score unavailable.",
        error
      );
    }

    const ideaScore =
      context.ideas.length
        ? this.normalizePercent(
            this.average(
              context.ideas.map(
                (idea) =>
                  this.toSafeNumber(
                    idea?.decisionScore,
                    this.isHighPriority(idea)
                      ? 70
                      : 50
                  )
              )
            ),
            0
          )
        : 0;

    const maturityScore =
      context.departments.length
        ? this.average(
            context.departments.map(
              (department) =>
                this.normalizePercent(
                  department?.maturity,
                  0
                )
            )
          )
        : 0;

    const kpiScore =
      context.kpis.length
        ? this.average(
            context.kpis.map(
              (kpi) =>
                this.getKpiProgress(kpi)
            )
          )
        : 0;

    const riskScore =
      this.calculateRiskScore(
        context.risks
      );

    const governanceScore =
      this.calculateGovernanceScore(
        context
      );

    const fallbackExecutive =
      this.average([
        ideaScore,
        maturityScore,
        kpiScore,
        riskScore,
        governanceScore
      ]);

    return {
      executiveScore:
        this.normalizePercent(
          analyticsScores.executiveScore,
          fallbackExecutive
        ),

      ideaScore:
        this.normalizePercent(
          analyticsScores.ideaScore,
          ideaScore
        ),

      maturityScore:
        this.normalizePercent(
          analyticsScores.maturityScore,
          maturityScore
        ),

      riskScore:
        this.normalizePercent(
          analyticsScores.riskScore,
          riskScore
        ),

      governanceScore:
        this.normalizePercent(
          analyticsScores.governanceScore,
          governanceScore
        ),

      kpiScore
    };
  },

  getKpiProgress(kpi) {
    if (
      window.AIW?.Modules?.kpis &&
      typeof window.AIW.Modules.kpis
        .progress === "function"
    ) {
      return window.AIW.Modules.kpis
        .progress(kpi);
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
        (target / Math.max(current, 1)) *
          100,
        0
      );
    }

    return this.normalizePercent(
      (current / target) * 100,
      0
    );
  },

  calculateRiskScore(risks) {
    if (!risks.length) {
      return 100;
    }

    const penalty = risks.reduce(
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

  calculateGovernanceScore(context) {
    const governanceCenter =
      this.getSharedData()
        .governanceCenter;

    if (
      window.AIW?.Modules?.governance &&
      typeof window.AIW.Modules.governance
        .getMetrics === "function" &&
      governanceCenter
    ) {
      try {
        return this.normalizePercent(
          window.AIW.Modules.governance
            .getMetrics(governanceCenter)
            .governanceScore,
          0
        );
      } catch (error) {
        console.warn(
          "AI Work Reports: Governance score failed.",
          error
        );
      }
    }

    const controls =
      Array.isArray(
        this.getSharedData().governance
      )
        ? this.getSharedData().governance
        : [];

    return controls.length
      ? this.normalizePercent(
          60 + controls.length * 5,
          85
        )
      : 0;
  },

  /* =======================================================
     Recommendations
  ======================================================= */

  getRecommendations(context) {
    try {
      if (
        window.AIW?.Recommendation &&
        typeof window.AIW.Recommendation
          .fullReport === "function"
      ) {
        const generated =
          window.AIW.Recommendation
            .fullReport(context);

        if (
          generated &&
          typeof generated === "object"
        ) {
          return {
            ceo: Array.isArray(
              generated.ceo
            )
              ? generated.ceo
              : [],

            nextActions: Array.isArray(
              generated.nextActions
            )
              ? generated.nextActions
              : []
          };
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Reports: Recommendation engine failed.",
        error
      );
    }

    return {
      ceo: [
        "البدء بلوحات قياس جودة التسجيلات وأخطاء البيانات كمرحلة أولى.",
        "تفعيل مراجعة بشرية موثقة للتنبيهات المرتبطة بالصلاحيات والحسابات.",
        "إطلاق تحليل الجلسات الطويلة واستخدام الصلاحيات كـ Quick Win.",
        "بناء لوحة تنفيذية موحدة للبوابات الذكية والتسجيلات والتنبيهات."
      ],

      nextActions: [
        "حصر مصادر بيانات التسجيلات وسجلات الدخول والصلاحيات.",
        "تحديد خط أساس لجودة التسجيلات وزمن العبور وجاهزية البوابات.",
        "اختيار 3 مشاريع سريعة للبدء خلال المرحلة الأولى.",
        "ربط كل تنبيه بمؤشر ومالك وإجراء مراجعة واضح."
      ]
    };
  },

  /* =======================================================
     Main Render
  ======================================================= */

  render(container) {
    if (!container) return;

    this._container = container;

    this.ensureReportsCenterSeeded();

    const W = window.AIW?.Widgets;
    const reportsCenter =
      this.getReportsCenter();

    const ideas = this.getIdeas();
    const projects = this.getProjects();
    const roadmap = this.getRoadmap();
    const risks = this.getRisks();
    const kpis = this.getKpis();

    const departments =
      this.getDepartments(ideas);

    const quickWins =
      this.getQuickWins(ideas);

    const highIdeas = ideas.filter(
      (idea) =>
        this.isHighPriority(idea)
    ).length;

    const mediumIdeas = ideas.filter(
      (idea) =>
        this.isMediumPriority(idea)
    ).length;

    const lowIdeas = ideas.filter(
      (idea) =>
        this.isLowPriority(idea)
    ).length;

    const avgMaturity =
      departments.length
        ? this.average(
            departments.map(
              (department) =>
                department.maturity
            )
          )
        : 0;

    const context = {
      ideas,
      projects,
      roadmap,
      risks,
      kpis,
      departments,
      quickWins
    };

    const scores =
      this.getScores(context);

    const executiveScore =
      scores.executiveScore;

    const decisionLimit =
      Math.max(
        1,
        this.toSafeNumber(
          reportsCenter.settings
            .topDecisionLimit,
          5
        )
      );

    const decisionTop = ideas
      .slice()
      .sort(
        (first, second) =>
          this.toSafeNumber(
            second?.decisionScore,
            0
          ) -
          this.toSafeNumber(
            first?.decisionScore,
            0
          )
      )
      .slice(0, decisionLimit);

    const recommendations =
      this.getRecommendations({
        ...context,
        scores
      });

    const maximumDepartmentCount =
      Math.max(
        1,
        ...departments.map(
          (department) =>
            department.count
        )
      );

    container.innerHTML = `
      <section class="module-page">

        ${
          W?.hero
            ? W.hero({
                kicker:
                  "Executive Reports · Biometric Analytics",

                title:
                  reportsCenter.settings.title,

                description:
                  "تقرير تنفيذي يوضح حالة جودة التسجيلات، استخدام الصلاحيات، أداء البوابات الذكية، المخاطر التشغيلية، وأولويات التنفيذ القادمة.",

                chips: [
                  "👁️ Biometric Analytics",
                  `🧠 Executive Score ${executiveScore}%`,
                  `🚀 ${quickWins.length} Quick Wins`,
                  `🛡️ ${risks.length} مخاطر متابعة`
                ]
              })
            : this.fallbackHero()
        }

        <div class="module-grid">
          ${this.kpi(
            "Executive Score",
            `${executiveScore}%`,
            "Executive Health"
          )}

          ${this.kpi(
            "الفرص",
            ideas.length,
            "AI Opportunities"
          )}

          ${this.kpi(
            "Quick Wins",
            quickWins.length,
            "Ready to Start"
          )}

          ${this.kpi(
            "متوسط الجاهزية",
            `${avgMaturity}%`,
            "Portfolio Readiness"
          )}

          ${this.kpi(
            "المخاطر",
            risks.length,
            "Risk Register"
          )}

          ${this.kpi(
            "أولوية عالية",
            highIdeas,
            "High Priority"
          )}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "الخلاصة التنفيذية",
              "قراءة مختصرة لحالة المبادرة المتخصصة."
            )}

            <div class="report-ultimate-summary">
              <strong>
                ${this.escapeHtml(
                  reportsCenter
                    .executiveSummary.title
                )}
              </strong>

              <p>
                ${this.escapeHtml(
                  reportsCenter
                    .executiveSummary
                    .description
                )}
              </p>

              <div class="report-score-strip">
                <div>
                  <span>Executive</span>
                  <b>${scores.executiveScore}%</b>
                </div>

                <div>
                  <span>Ideas</span>
                  <b>${scores.ideaScore}%</b>
                </div>

                <div>
                  <span>Readiness</span>
                  <b>${scores.maturityScore}%</b>
                </div>

                <div>
                  <span>Risk</span>
                  <b>${scores.riskScore}%</b>
                </div>

                <div>
                  <span>Governance</span>
                  <b>${scores.governanceScore}%</b>
                </div>
              </div>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Executive Highlights",
              "أهم الرسائل التنفيذية من البيانات الحالية."
            )}

            <div class="report-ai-card">
              <strong>
                ${this.escapeHtml(
                  reportsCenter
                    .executiveHighlight.title
                )}
              </strong>

              <p>
                ${this.escapeHtml(
                  reportsCenter
                    .executiveHighlight
                    .description
                )}
              </p>

              <button
                class="module-btn secondary"
                data-module="kpis"
              >
                فتح مركز المؤشرات
              </button>
            </div>
          </div>
        </div>

        ${
          reportsCenter.settings.showCharts
            ? `
              <div class="module-wide-grid">
                <div class="module-panel">
                  ${this.sectionTitle(
                    "توزيع الأولويات",
                    "تصنيف الفرص حسب درجة الأولوية."
                  )}

                  <div class="report-chart-card">
                    <canvas
                      id="reportsPriorityChart"
                    ></canvas>
                  </div>
                </div>

                <div class="module-panel">
                  ${this.sectionTitle(
                    "صحة التشغيل",
                    "مؤشرات الجاهزية والمخاطر والحوكمة في رسم واحد."
                  )}

                  <div class="report-chart-card">
                    <canvas
                      id="reportsHealthChart"
                    ></canvas>
                  </div>
                </div>
              </div>
            `
            : ""
        }

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "توزيع الفرص حسب المحافظ",
              "توزيع الحلول على نطاقات العمل الرئيسية."
            )}

            <div class="report-bars">
              ${departments
                .map((department) => {
                  const width =
                    this.normalizePercent(
                      (
                        department.count /
                        maximumDepartmentCount
                      ) * 100,
                      0
                    );

                  return `
                    <div class="report-bar-item">
                      <div>
                        <strong>
                          ${this.escapeHtml(
                            department.name
                          )}
                        </strong>

                        <span>
                          ${department.count}
                          فرص
                        </span>
                      </div>

                      <div class="report-bar">
                        <i
                          style="width:${width}%"
                        ></i>
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "جاهزية المحافظ",
              "مقارنة تقديرية لجاهزية كل نطاق تشغيلي."
            )}

            <div class="report-bars">
              ${departments
                .map(
                  (department) => `
                    <div class="report-bar-item">
                      <div>
                        <strong>
                          ${this.escapeHtml(
                            department.name
                          )}
                        </strong>

                        <span>
                          ${department.maturity}%
                        </span>
                      </div>

                      <div class="report-bar">
                        <i
                          style="width:${department.maturity}%"
                        ></i>
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
            "Decision Intelligence",
            "أفضل الفرص المقترحة للبدء بناءً على Decision Score."
          )}

          ${
            decisionTop.length
              ? `
                <div class="report-decision-grid">
                  ${decisionTop
                    .map((idea, index) => {
                      const decisionScore =
                        this.normalizePercent(
                          idea?.decisionScore,
                          0
                        );

                      return `
                        <article class="report-decision-card">
                          <b>
                            ${String(
                              index + 1
                            ).padStart(2, "0")}
                          </b>

                          <strong>
                            ${this.escapeHtml(
                              idea?.title ||
                              "فكرة غير مسماة"
                            )}
                          </strong>

                          <span>
                            ${this.escapeHtml(
                              idea?.department ||
                              "غير مصنف"
                            )}
                          </span>

                          <div class="aiw-progress">
                            <div
                              style="width:${decisionScore}%"
                            ></div>
                          </div>

                          <small>
                            Decision Score:
                            ${decisionScore}%
                          </small>
                        </article>
                      `;
                    })
                    .join("")}
                </div>
              `
              : this.emptyState(
                  "لا توجد فرص مصنفة لاتخاذ القرار حالياً."
                )
          }
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "تحليل الأولويات",
            "قراءة تنفيذية لسهولة البدء ومستوى الأثر."
          )}

          <div class="report-insight-grid">
            <div class="report-insight-card">
              <span>عالية الأولوية</span>
              <strong>${highIdeas}</strong>

              <p>
                مرتبطة بجودة البيانات أو الصلاحيات أو الأمن وتحتاج متابعة مبكرة.
              </p>
            </div>

            <div class="report-insight-card">
              <span>متوسطة الأولوية</span>
              <strong>${mediumIdeas}</strong>

              <p>
                مناسبة للموجة الثانية بعد تجهيز مصادر البيانات والحوكمة.
              </p>
            </div>

            <div class="report-insight-card">
              <span>منخفضة الأولوية</span>
              <strong>${lowIdeas}</strong>

              <p>
                يمكن وضعها ضمن تحسينات لاحقة بعد تشغيل الحلول الأساسية.
              </p>
            </div>

            <div class="report-insight-card">
              <span>Quick Wins</span>
              <strong>${quickWins.length}</strong>

              <p>
                أنسب نقطة بداية لأنها تعتمد على القياس والتحليل قبل التكامل العميق.
              </p>
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "خارطة الطريق",
            "مراحل الانتقال من القياس إلى التنبيهات الذكية."
          )}

          ${
            roadmap.length
              ? `
                <div class="report-roadmap-grid">
                  ${roadmap
                    .map((roadmapItem) => {
                      const progress =
                        this.normalizePercent(
                          roadmapItem?.progress,
                          0
                        );

                      return `
                        <div class="report-roadmap-card">
                          <b>
                            ${this.escapeHtml(
                              roadmapItem?.year ||
                              ""
                            )}
                          </b>

                          <strong>
                            ${this.escapeHtml(
                              roadmapItem?.phase ||
                              ""
                            )}
                          </strong>

                          <span>
                            ${progress}%
                          </span>

                          <div class="aiw-progress">
                            <div
                              style="width:${progress}%"
                            ></div>
                          </div>

                          <p>
                            ${this.escapeHtml(
                              roadmapItem?.activities ||
                              ""
                            )}
                          </p>
                        </div>
                      `;
                    })
                    .join("")}
                </div>
              `
              : this.emptyState(
                  "لا توجد مراحل مسجلة في خارطة الطريق."
                )
          }
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "Top Executive Priorities",
              "أولويات مقترحة للمرحلة القادمة."
            )}

            ${this.renderExecutiveList(
              recommendations.ceo
            )}
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Next Best Actions",
              "خطوات عملية للبدء."
            )}

            ${this.renderExecutiveList(
              recommendations.nextActions
            )}
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "توصية التقرير",
            "الخطوة العملية المقترحة."
          )}

          <div class="report-recommendation">
            <strong>
              ${this.escapeHtml(
                reportsCenter
                  .finalRecommendation.title
              )}
            </strong>

            <p>
              ${this.escapeHtml(
                reportsCenter
                  .finalRecommendation
                  .description
              )}
            </p>

            <button
              class="module-btn secondary"
              data-module="kpis"
            >
              فتح مركز المؤشرات
            </button>
          </div>
        </div>

      </section>
    `;

    if (
      reportsCenter.settings.showCharts
    ) {
      this.renderCharts({
        highIdeas,
        mediumIdeas,
        lowIdeas,
        scores
      });
    }

    this.bindAutomaticSync();
  },

  /* =======================================================
     Charts
  ======================================================= */

  renderCharts({
    highIdeas,
    mediumIdeas,
    lowIdeas,
    scores
  }) {
    if (!window.AIW?.Charts) return;

    setTimeout(() => {
      if (
        window.AIW?.Charts &&
        typeof window.AIW.Charts
          .doughnut === "function"
      ) {
        window.AIW.Charts.doughnut(
          "reportsPriorityChart",

          [
            "عالية",
            "متوسطة",
            "منخفضة"
          ],

          [
            highIdeas,
            mediumIdeas,
            lowIdeas
          ],

          "Priority Distribution"
        );
      }

      if (
        window.AIW?.Charts &&
        typeof window.AIW.Charts.bar ===
          "function"
      ) {
        window.AIW.Charts.bar(
          "reportsHealthChart",

          [
            "Executive",
            "Ideas",
            "Readiness",
            "Risk",
            "Governance"
          ],

          [
            scores.executiveScore,
            scores.ideaScore,
            scores.maturityScore,
            scores.riskScore,
            scores.governanceScore
          ],

          "Operational Health"
        );
      }
    }, 50);
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

  emptyState(message) {
    return `
      <div class="module-empty">
        ${this.escapeHtml(message)}
      </div>
    `;
  },

  fallbackHero() {
    return `
      <div class="module-hero">
        <span class="module-kicker">
          Executive Reports · Biometric Analytics
        </span>

        <h1>
          مركز التقارير والتحليلات التنفيذية
        </h1>

        <p>
          تقرير تنفيذي يعرض جودة التسجيلات، الصلاحيات، البوابات، المخاطر، وأولويات التنفيذ.
        </p>
      </div>
    `;
  },

  /* =======================================================
     Automatic Synchronization
  ======================================================= */

  bindAutomaticSync() {
    if (this._syncBound) return;

    this._syncBound = true;

    const refreshReports = () => {
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

      "aiw:reportsChanged",
      "aiw:reportsUpdated",

      "aiw:ideasChanged",
      "aiw:ideasUpdated",

      "aiw:projectsChanged",
      "aiw:projectsUpdated",

      "aiw:kpisChanged",
      "aiw:kpisUpdated",

      "aiw:governanceChanged",
      "aiw:governanceUpdated",

      "aiw:roadmapChanged",
      "aiw:roadmapUpdated",

      "aiw:risksChanged",
      "aiw:risksUpdated"
    ];

    syncEvents.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          refreshReports
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
          refreshReports();
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
      .replace(/>/g, "&quot;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  clone(value) {
    if (
      typeof structuredClone === "function"
    ) {
      try {
        return structuredClone(value);
      } catch (error) {
        // JSON fallback.
      }
    }

    return JSON.parse(
      JSON.stringify(value)
    );
  }
};