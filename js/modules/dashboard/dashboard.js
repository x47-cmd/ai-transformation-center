/* =========================================================
   AI Work - Executive Dashboard V5.0
   Enterprise Biometric Intelligence Platform
   Store V2.2 Native Architecture

   File Path:
   js/modules/dashboard/dashboard.js

   Features:
   - AIW.Store V2.2 as Single Source of Truth
   - Preserve existing blue hero design
   - Real idea lifecycle indicators
   - Real project delivery indicators
   - Dynamic governance and risk metrics
   - Executive alerts from live platform data
   - Operational health derived from actual portfolio state
   - Dynamic pipeline and trend calculations
   - Cross-page synchronization
   - No direct AIW.Data or localStorage data fallback
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.dashboard = {
  id: "dashboard",
  title: "الرئيسية",
  icon: "🏠",
  version: "5.0.0",

  _container: null,
  _unsubscribeStore: null,
  _refreshTimer: null,
  _syncBound: false,
  _isRendering: false,

  config: {
    refreshDelay: 80,
    targetIdeas: 100,
    defaultRoadmapPeriod: "2026–2030",
    maxTrendPoints: 9
  },

  lifecycle: {
    IDEA: "idea",
    DRAFT: "draft",
    PENDING: "pending-approval",
    APPROVED: "approved",
    REJECTED: "rejected",
    CONVERTED: "converted-to-project",
    ARCHIVED: "archived"
  },

  projectStatus: {
    PLANNED: "planned",
    STUDY: "study",
    APPROVED: "approved",
    ACTIVE: "active",
    IN_PROGRESS: "in-progress",
    PAUSED: "paused",
    BLOCKED: "blocked",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    ARCHIVED: "archived"
  },

  /* =======================================================
     Store Access
  ======================================================= */

  getStore() {
    return window.AIW?.Store || null;
  },

  getState() {
    const store = this.getStore();

    if (!store) {
      console.error("AI Work Dashboard V5.0: AIW.Store is unavailable.");
      return {};
    }

    try {
      if (typeof store.getState === "function") {
        const state = store.getState();
        return state && typeof state === "object" ? state : {};
      }

      if (typeof store.getData === "function") {
        const state = store.getData();
        return state && typeof state === "object" ? state : {};
      }
    } catch (error) {
      console.error(
        "AI Work Dashboard V5.0: Unable to read Store state.",
        error
      );
    }

    return {};
  },

  getCollection(name) {
    const collection = this.getState()?.[name];
    return Array.isArray(collection) ? collection : [];
  },

  getIdeas() {
    const store = this.getStore();

    try {
      if (typeof store?.getIdeas === "function") {
        const ideas = store.getIdeas();
        if (Array.isArray(ideas)) return ideas;
      }
    } catch (error) {
      console.warn("AI Work Dashboard V5.0: getIdeas failed.", error);
    }

    return this.getCollection("ideas");
  },

  getProjects() {
    const store = this.getStore();

    try {
      if (typeof store?.getProjects === "function") {
        const projects = store.getProjects();
        if (Array.isArray(projects)) return projects;
      }
    } catch (error) {
      console.warn("AI Work Dashboard V5.0: getProjects failed.", error);
    }

    return this.getCollection("projects");
  },

  getGovernanceItems() {
    const state = this.getState();

    const sources = [
      state.governance,
      state.governanceControls,
      state.controls,
      state.governance?.controls
    ];

    for (const source of sources) {
      if (Array.isArray(source)) return source;
    }

    return [];
  },

  getRisks() {
    const state = this.getState();

    const risks = [];

    const directSources = [
      state.risks,
      state.governance?.risks,
      state.riskRegister
    ];

    directSources.forEach(source => {
      if (Array.isArray(source)) risks.push(...source);
    });

    this.getProjects().forEach(project => {
      if (Array.isArray(project?.risks)) {
        project.risks.forEach(risk => {
          risks.push({
            ...risk,
            sourceType: "project",
            sourceId: project.id,
            sourceTitle: project.title
          });
        });
      }

      if (project?.riskLevel || project?.risk) {
        risks.push({
          id: `project-risk-${project.id}`,
          level: project.riskLevel || project.risk,
          status: project.status,
          sourceType: "project",
          sourceId: project.id,
          sourceTitle: project.title
        });
      }
    });

    return this.uniqueBy(
      risks,
      item =>
        item?.id ??
        `${item?.sourceType || "risk"}-${item?.sourceId || ""}-${item?.title || item?.name || item?.level || ""}`
    );
  },

  getAlerts() {
    const state = this.getState();
    const alerts = [];

    const sources = [
      state.alerts,
      state.notifications,
      state.executiveAlerts,
      state.operations?.alerts,
      state.monitoring?.alerts
    ];

    sources.forEach(source => {
      if (Array.isArray(source)) alerts.push(...source);
    });

    this.getRisks()
      .filter(risk => this.isHighSeverity(risk))
      .forEach(risk => {
        alerts.push({
          id: `risk-alert-${risk.id || risk.sourceId || Math.random()}`,
          title:
            risk.title ||
            risk.name ||
            risk.sourceTitle ||
            "مخاطر تشغيلية عالية",
          severity:
            risk.severity ||
            risk.level ||
            risk.riskLevel ||
            "high",
          status: risk.status || "open",
          sourceType: risk.sourceType || "risk",
          sourceId: risk.sourceId || risk.id
        });
      });

    return this.uniqueBy(
      alerts,
      item =>
        item?.id ??
        `${item?.title || item?.name || "alert"}-${item?.sourceId || ""}-${item?.severity || item?.level || ""}`
    );
  },

  /* =======================================================
     Idea Lifecycle
  ======================================================= */

  getIdeaStatus(idea = {}) {
    if (
      idea.convertedToProject === true ||
      idea.conversion?.converted === true ||
      idea.projectId
    ) {
      return this.lifecycle.CONVERTED;
    }

    const raw = this.normalizeStatus(
      idea.lifecycleStatus ??
      idea.ideaStatus ??
      idea.approval?.status ??
      idea.status ??
      ""
    );

    if (["converted", "converted-to-project"].includes(raw)) {
      return this.lifecycle.CONVERTED;
    }

    if (["pending", "submitted", "pending-approval"].includes(raw)) {
      return this.lifecycle.PENDING;
    }

    if (raw === "approved") return this.lifecycle.APPROVED;
    if (raw === "rejected") return this.lifecycle.REJECTED;
    if (raw === "archived") return this.lifecycle.ARCHIVED;
    if (raw === "draft") return this.lifecycle.DRAFT;

    return this.lifecycle.IDEA;
  },

  isHighPriorityIdea(idea = {}) {
    const priority = this.normalizeStatus(
      idea.priority ??
      idea.priorityLevel ??
      idea.level ??
      ""
    );

    return [
      "عالية",
      "عالي",
      "high",
      "high-priority",
      "critical"
    ].includes(priority);
  },

  /* =======================================================
     Project Status
  ======================================================= */

  getProjectStatus(project = {}) {
    const raw = this.normalizeStatus(
      project.status ??
      project.lifecycleStatus ??
      project.deliveryStatus ??
      ""
    );

    const map = {
      "planned": this.projectStatus.PLANNED,
      "قيد-التخطيط": this.projectStatus.PLANNED,

      "study": this.projectStatus.STUDY,
      "قيد-الدراسة": this.projectStatus.STUDY,

      "approved": this.projectStatus.APPROVED,
      "معتمد": this.projectStatus.APPROVED,

      "active": this.projectStatus.ACTIVE,
      "قيد-التشغيل": this.projectStatus.ACTIVE,
      "تشغيل": this.projectStatus.ACTIVE,

      "in-progress": this.projectStatus.IN_PROGRESS,
      "قيد-التنفيذ": this.projectStatus.IN_PROGRESS,

      "paused": this.projectStatus.PAUSED,
      "متوقف-مؤقتاً": this.projectStatus.PAUSED,
      "متوقف-موقتا": this.projectStatus.PAUSED,

      "blocked": this.projectStatus.BLOCKED,
      "متعثر": this.projectStatus.BLOCKED,

      "completed": this.projectStatus.COMPLETED,
      "مكتمل": this.projectStatus.COMPLETED,

      "cancelled": this.projectStatus.CANCELLED,
      "canceled": this.projectStatus.CANCELLED,
      "ملغي": this.projectStatus.CANCELLED,

      "archived": this.projectStatus.ARCHIVED,
      "مؤرشف": this.projectStatus.ARCHIVED
    };

    return map[raw] || this.projectStatus.PLANNED;
  },

  isActiveProject(project = {}) {
    return [
      this.projectStatus.ACTIVE,
      this.projectStatus.IN_PROGRESS
    ].includes(this.getProjectStatus(project));
  },

  isCompletedProject(project = {}) {
    return this.getProjectStatus(project) === this.projectStatus.COMPLETED;
  },

  isBlockedProject(project = {}) {
    return [
      this.projectStatus.PAUSED,
      this.projectStatus.BLOCKED
    ].includes(this.getProjectStatus(project));
  },

  isHighRiskProject(project = {}) {
    return [
      "عالية",
      "عالي",
      "high",
      "critical",
      "حرج"
    ].includes(
      this.normalizeStatus(project.riskLevel ?? project.risk ?? "")
    );
  },

  /* =======================================================
     Governance
  ======================================================= */

  isActiveGovernanceControl(item = {}) {
    const status = this.normalizeStatus(
      item.status ??
      item.state ??
      item.enabled ??
      ""
    );

    if (item.enabled === true || item.active === true) return true;

    if (!status) return true;

    return [
      "active",
      "enabled",
      "approved",
      "مفعل",
      "مفعّل",
      "معتمد",
      "نشط"
    ].includes(status);
  },

  /* =======================================================
     Alerts
  ======================================================= */

  isClosedItem(item = {}) {
    const status = this.normalizeStatus(
      item.status ??
      item.state ??
      ""
    );

    return [
      "closed",
      "resolved",
      "dismissed",
      "completed",
      "مغلق",
      "تم-الحل",
      "محلول"
    ].includes(status);
  },

  isHighSeverity(item = {}) {
    const severity = this.normalizeStatus(
      item.severity ??
      item.level ??
      item.priority ??
      item.type ??
      item.riskLevel ??
      ""
    );

    return [
      "critical",
      "high",
      "حرج",
      "عالي",
      "عالية"
    ].includes(severity);
  },

  isMediumSeverity(item = {}) {
    const severity = this.normalizeStatus(
      item.severity ??
      item.level ??
      item.priority ??
      item.type ??
      item.riskLevel ??
      ""
    );

    return [
      "medium",
      "متوسط",
      "متوسطة"
    ].includes(severity);
  },

  /* =======================================================
     Metrics
  ======================================================= */

  calculateMetrics() {
    const state = this.getState();
    const summary = state.summary || {};

    const ideas = this.getIdeas();
    const projects = this.getProjects();
    const departments = Array.isArray(state.departments)
      ? state.departments
      : [];
    const governance = this.getGovernanceItems();
    const alerts = this.getAlerts();
    const risks = this.getRisks();

    const ideaMetrics = {
      total: ideas.length,
      highPriority: ideas.filter(idea => this.isHighPriorityIdea(idea)).length,
      pending: ideas.filter(
        idea => this.getIdeaStatus(idea) === this.lifecycle.PENDING
      ).length,
      approved: ideas.filter(
        idea => this.getIdeaStatus(idea) === this.lifecycle.APPROVED
      ).length,
      rejected: ideas.filter(
        idea => this.getIdeaStatus(idea) === this.lifecycle.REJECTED
      ).length,
      converted: ideas.filter(
        idea => this.getIdeaStatus(idea) === this.lifecycle.CONVERTED
      ).length
    };

    const projectMetrics = {
      total: projects.length,
      active: projects.filter(project => this.isActiveProject(project)).length,
      completed: projects.filter(project => this.isCompletedProject(project)).length,
      blocked: projects.filter(project => this.isBlockedProject(project)).length,
      highRisk: projects.filter(project => this.isHighRiskProject(project)).length,
      linkedToIdeas: projects.filter(project =>
        Boolean(
          project.sourceIdeaId ??
          project.ideaId ??
          project.origin?.ideaId
        )
      ).length
    };

    projectMetrics.averageProgress = projects.length
      ? Math.round(
          projects.reduce(
            (sum, project) =>
              sum +
              this.normalizePercent(
                project.progress ??
                project.completion ??
                0
              ),
            0
          ) / projects.length
        )
      : 0;

    projectMetrics.onTrack = projects.filter(project =>
      !this.isHighRiskProject(project) &&
      !this.isBlockedProject(project) &&
      ![
        this.projectStatus.CANCELLED,
        this.projectStatus.ARCHIVED
      ].includes(this.getProjectStatus(project))
    ).length;

    projectMetrics.onTrackRate = projects.length
      ? this.normalizePercent(
          (projectMetrics.onTrack / projects.length) * 100
        )
      : 0;

    const governanceMetrics = {
      total: governance.length,
      active: governance.filter(item =>
        this.isActiveGovernanceControl(item)
      ).length
    };

    const alertMetrics = {
      total: alerts.filter(item => !this.isClosedItem(item)).length,
      critical: alerts.filter(
        item => this.isHighSeverity(item) && !this.isClosedItem(item)
      ).length,
      medium: alerts.filter(
        item => this.isMediumSeverity(item) && !this.isClosedItem(item)
      ).length
    };

    const riskMetrics = {
      total: risks.length,
      critical: risks.filter(
        item => this.isHighSeverity(item) && !this.isClosedItem(item)
      ).length
    };

    const targetIdeas = Math.max(
      1,
      this.toSafeNumber(
        summary.targetIdeas,
        this.config.targetIdeas
      )
    );

    const ideaProgress = this.normalizePercent(
      (ideaMetrics.total / targetIdeas) * 100
    );

    const readiness = this.calculateReadiness({
      state,
      ideas,
      projects,
      governance,
      ideaMetrics,
      projectMetrics
    });

    const systemHealth = this.calculateSystemHealth({
      state,
      projects,
      governance,
      alerts,
      risks,
      projectMetrics,
      governanceMetrics,
      alertMetrics,
      riskMetrics
    });

    const operationsHealth = this.calculateOperationsHealth({
      state,
      projects,
      alerts,
      projectMetrics,
      alertMetrics
    });

    return {
      state,
      summary,
      ideas,
      projects,
      departments,
      governance,
      alerts,
      risks,
      ideaMetrics,
      projectMetrics,
      governanceMetrics,
      alertMetrics,
      riskMetrics,
      targetIdeas,
      ideaProgress,
      readiness,
      systemHealth,
      operationsHealth,
      roadmapPeriod:
        summary.period ??
        summary.roadmapPeriod ??
        state.strategy?.roadmapPeriod ??
        this.config.defaultRoadmapPeriod
    };
  },

  calculateReadiness(context = {}) {
    const explicit = this.firstFiniteNumber([
      context.state?.summary?.aiReadiness,
      context.state?.summary?.readiness,
      context.state?.summary?.maturityScore,
      context.state?.maturity?.overallScore,
      context.state?.maturity?.score
    ]);

    if (explicit !== null) {
      return this.normalizePercent(explicit);
    }

    const ideaScore = context.ideas?.length
      ? this.normalizePercent(
          context.ideas.reduce(
            (sum, idea) =>
              sum +
              this.toSafeNumber(
                idea.decisionScore ??
                idea.readiness ??
                0
              ),
            0
          ) / context.ideas.length
        )
      : 0;

    const projectScore = context.projectMetrics?.averageProgress || 0;

    const governanceScore = context.governance?.length
      ? this.normalizePercent(
          (
            context.governance.filter(item =>
              this.isActiveGovernanceControl(item)
            ).length /
            context.governance.length
          ) * 100
        )
      : 0;

    const availableScores = [
      ideaScore,
      projectScore,
      governanceScore
    ].filter(score => score > 0);

    return availableScores.length
      ? Math.round(
          availableScores.reduce((sum, score) => sum + score, 0) /
          availableScores.length
        )
      : 0;
  },

  calculateSystemHealth(context = {}) {
    const explicit = this.firstFiniteNumber([
      context.state?.summary?.systemHealth,
      context.state?.summary?.portfolioHealth,
      context.state?.health?.overall,
      context.state?.monitoring?.systemHealth
    ]);

    if (explicit !== null) {
      return this.normalizePercent(explicit);
    }

    const projectHealth = context.projects?.length
      ? context.projectMetrics?.onTrackRate || 0
      : 100;

    const governanceHealth = context.governance?.length
      ? this.normalizePercent(
          (
            context.governanceMetrics.active /
            context.governance.length
          ) * 100
        )
      : 100;

    const alertPenalty = Math.min(
      45,
      (context.alertMetrics?.critical || 0) * 12 +
      (context.alertMetrics?.medium || 0) * 4
    );

    const riskPenalty = Math.min(
      30,
      (context.riskMetrics?.critical || 0) * 7
    );

    return this.normalizePercent(
      (
        projectHealth * 0.55 +
        governanceHealth * 0.45
      ) -
      alertPenalty -
      riskPenalty
    );
  },

  calculateOperationsHealth(context = {}) {
    const explicit = this.firstFiniteNumber([
      context.state?.summary?.operationsHealth,
      context.state?.summary?.operationalHealth,
      context.state?.operations?.health,
      context.state?.monitoring?.operationsHealth
    ]);

    if (explicit !== null) {
      return this.normalizePercent(explicit);
    }

    if (!context.projects?.length) {
      return context.alertMetrics?.critical
        ? Math.max(0, 100 - context.alertMetrics.critical * 15)
        : 100;
    }

    const progress = context.projectMetrics.averageProgress || 0;
    const onTrack = context.projectMetrics.onTrackRate || 0;
    const blockedPenalty = Math.min(
      35,
      context.projectMetrics.blocked * 10
    );
    const alertPenalty = Math.min(
      35,
      context.alertMetrics.critical * 12
    );

    return this.normalizePercent(
      progress * 0.45 +
      onTrack * 0.55 -
      blockedPenalty -
      alertPenalty
    );
  },

  /* =======================================================
     Operations Trend
  ======================================================= */

  getOperationsTrend(metrics = {}) {
    const state = metrics.state || {};

    const sources = [
      state.summary?.operationsTrend,
      state.summary?.operationalTrend,
      state.operationsTrend,
      state.operations?.trend,
      state.monitoring?.operationsTrend,
      state.analytics?.operationsTrend
    ];

    for (const source of sources) {
      const cleaned = this.cleanTrend(source);

      if (cleaned.length) {
        return cleaned.slice(-this.config.maxTrendPoints);
      }
    }

    return this.buildDerivedTrend(metrics);
  },

  cleanTrend(trend) {
    if (!Array.isArray(trend)) return [];

    return trend
      .map(item => {
        if (item && typeof item === "object") {
          return this.normalizePercent(
            item.value ??
            item.health ??
            item.score ??
            item.percentage ??
            0
          );
        }

        return this.normalizePercent(item, 0);
      })
      .filter(value => Number.isFinite(value));
  },

  buildDerivedTrend(metrics = {}) {
    const current = this.normalizePercent(
      metrics.operationsHealth,
      0
    );

    const progress = metrics.projectMetrics?.averageProgress || 0;
    const onTrack = metrics.projectMetrics?.onTrackRate || 0;
    const readiness = metrics.readiness || 0;
    const health = metrics.systemHealth || 0;

    const anchors = [
      Math.max(0, current - 14),
      Math.max(0, progress - 8),
      Math.max(0, readiness - 6),
      Math.max(0, onTrack - 4),
      Math.max(0, health - 2),
      current,
      Math.min(100, current + 2),
      Math.min(100, current + 1),
      current
    ];

    return anchors.map(value => this.normalizePercent(value));
  },

  renderMiniChart(values = []) {
    return values
      .map(value => {
        const safeHeight = Math.max(
          12,
          Math.min(100, this.normalizePercent(value))
        );

        return `
          <span
            style="height:${safeHeight}%"
            title="${safeHeight}%"
          ></span>
        `;
      })
      .join("");
  },

  /* =======================================================
     Executive Narrative
  ======================================================= */

  getExecutiveStatus(metrics = {}) {
    const {
      alertMetrics,
      projectMetrics,
      ideaMetrics,
      operationsHealth,
      systemHealth
    } = metrics;

    if (alertMetrics.critical > 0) {
      return {
        tone: "critical",
        title: "توجد مؤشرات حرجة تحتاج مراجعة تنفيذية",
        text:
          `يوجد ${alertMetrics.critical} تنبيه حرج مفتوح. ` +
          `الأولوية الحالية هي معالجة المخاطر المرتبطة بالعمليات والمشاريع.`
      };
    }

    if (projectMetrics.blocked > 0) {
      return {
        tone: "warning",
        title: "بعض المشاريع تحتاج تدخلًا لإعادة المسار",
        text:
          `يوجد ${projectMetrics.blocked} مشروع متوقف أو متعثر. ` +
          `متوسط التقدم الحالي ${projectMetrics.averageProgress}%.`
      };
    }

    if (ideaMetrics.pending > 0) {
      return {
        tone: "attention",
        title: "Pipeline الاعتماد يحتاج قرارًا إداريًا",
        text:
          `توجد ${ideaMetrics.pending} فكرة بانتظار الاعتماد، ` +
          `و${ideaMetrics.converted} فكرة تحولت إلى مشاريع تنفيذية.`
      };
    }

    if (operationsHealth >= 80 && systemHealth >= 80) {
      return {
        tone: "stable",
        title: "حالة المنصة مستقرة وجاهزة للتوسع المنضبط",
        text:
          `صحة الأنظمة ${systemHealth}% وحالة العمليات ${operationsHealth}%. ` +
          `يمكن التركيز على تسريع المشاريع الأعلى جاهزية.`
      };
    }

    return {
      tone: "neutral",
      title: "المحفظة في مرحلة بناء الجاهزية التنفيذية",
      text:
        `تم تسجيل ${ideaMetrics.total} فكرة و${projectMetrics.total} مشروع. ` +
        `الأولوية هي رفع الجاهزية وتحسين الربط بين الفرص والتنفيذ.`
    };
  },

  /* =======================================================
     Main Render
  ======================================================= */

  render(container) {
    if (!container || this._isRendering) return;

    this._isRendering = true;
    this._container = container;

    try {
      const metrics = this.calculateMetrics();

      const {
        ideaMetrics,
        projectMetrics,
        governanceMetrics,
        alertMetrics,
        departments,
        targetIdeas,
        ideaProgress,
        readiness,
        systemHealth,
        operationsHealth,
        roadmapPeriod
      } = metrics;

      const trend = this.getOperationsTrend(metrics);
      const executiveStatus = this.getExecutiveStatus(metrics);

      const departmentsCount = departments.length ||
        this.countDistinctDepartments(metrics.ideas, metrics.projects);

      const executiveAlertValue =
        alertMetrics.critical > 0
          ? `${alertMetrics.critical} حرجة`
          : "0 حرجة";

      const executiveAlertNote =
        alertMetrics.critical > 0
          ? "تحتاج مراجعة تنفيذية"
          : alertMetrics.total > 0
            ? `${alertMetrics.total} تنبيهات مفتوحة`
            : "جميع المؤشرات مستقرة";

      container.innerHTML = `
        <section class="module-page v3-dashboard-page">
          <section class="v3-hero-card">
            <div class="v3-hero-content">
              <span class="v3-hero-badge">
                Enterprise Biometric AI Platform
              </span>

              <h1>
                منصة تنفيذية لتطوير الأنظمة البيومترية
                والبوابات الذكية بالذكاء الاصطناعي
              </h1>

              <p>
                مركز واحد يربط جودة التسجيلات، استخدام الصلاحيات،
                أداء البوابات، الأمن الرقمي، المؤشرات، والتنبيهات الذكية.
              </p>
            </div>

            <div class="v3-ai-visual">
              <div class="v3-ai-orb">AI</div>
            </div>

            <div class="v3-hero-stats">
              <div>
                <strong>${ideaMetrics.total}/${targetIdeas} 💡</strong>
                <span>فكرة متخصصة</span>
              </div>

              <div>
                <strong>${projectMetrics.total} 📁</strong>
                <span>مشروع تنفيذي</span>
              </div>

              <div>
                <strong>${departmentsCount} 🛂</strong>
                <span>محافظ تشغيلية</span>
              </div>

              <div>
                <strong>${this.escapeHtml(roadmapPeriod)} 🗓️</strong>
                <span>خارطة زمنية</span>
              </div>
            </div>
          </section>

          <section class="v3-kpi-grid">
            ${this.kpiCard(
              "👁️",
              "الأفكار الحالية",
              ideaMetrics.total,
              `${ideaProgress}% من هدف ${targetIdeas} فكرة`,
              "blue"
            )}

            ${this.kpiCard(
              "🚀",
              "أولوية عالية",
              ideaMetrics.highPriority,
              `${ideaMetrics.pending} بانتظار الاعتماد`,
              "green"
            )}

            ${this.kpiCard(
              "🛂",
              "جاهزية الذكاء الاصطناعي",
              `${readiness}%`,
              "AI Readiness",
              "purple"
            )}

            ${this.kpiCard(
              "📊",
              "صحة الأنظمة",
              `${systemHealth}%`,
              "System Health",
              "green"
            )}
          </section>

          <section class="v3-roi-card">
            <div>
              <h3>🟢 حالة العمليات البيومترية</h3>
              <strong>${operationsHealth}%</strong>
              <p>
                ${projectMetrics.active} مشاريع نشطة
                · ${projectMetrics.onTrackRate}% على المسار
              </p>
            </div>

            <div
              class="v3-mini-chart"
              aria-label="مؤشر حالة العمليات البيومترية"
            >
              ${this.renderMiniChart(trend)}
            </div>
          </section>

          <section class="v3-summary-grid">
            <article class="v3-small-panel">
              <h3>🛡️ الحوكمة</h3>
              <strong>${governanceMetrics.active}</strong>
              <p>
                من أصل ${governanceMetrics.total} ضابط رقابي
              </p>
            </article>

            <article class="v3-small-panel">
              <h3>🔔 التنبيهات التنفيذية</h3>
              <strong>${executiveAlertValue}</strong>
              <p>${executiveAlertNote}</p>
            </article>
          </section>

          <section class="v3-summary-grid">
            <article class="v3-small-panel">
              <h3>⏳ Pipeline الاعتماد</h3>
              <strong>${ideaMetrics.pending}</strong>
              <p>
                ${ideaMetrics.approved} معتمدة
                · ${ideaMetrics.converted} تحولت إلى مشاريع
              </p>
            </article>

            <article class="v3-small-panel">
              <h3>📁 تسليم المشاريع</h3>
              <strong>${projectMetrics.averageProgress}%</strong>
              <p>
                ${projectMetrics.completed} مكتملة
                · ${projectMetrics.blocked} متعثرة
              </p>
            </article>
          </section>

          <section class="v3-executive-status ${executiveStatus.tone}">
            <div>
              <span>Executive Status</span>
              <h3>${this.escapeHtml(executiveStatus.title)}</h3>
              <p>${this.escapeHtml(executiveStatus.text)}</p>
            </div>

            <div class="v3-executive-status-metrics">
              <div>
                <small>الأفكار المحولة</small>
                <strong>${ideaMetrics.converted}</strong>
              </div>

              <div>
                <small>المشاريع النشطة</small>
                <strong>${projectMetrics.active}</strong>
              </div>

              <div>
                <small>المخاطر العالية</small>
                <strong>${projectMetrics.highRisk}</strong>
              </div>
            </div>
          </section>
        </section>
      `;

      this.injectStyles();
      this.bindAutomaticSync();
    } finally {
      this._isRendering = false;
    }
  },

  /* =======================================================
     KPI Card
  ======================================================= */

  kpiCard(icon, label, value, note, tone) {
    return `
      <article class="v3-kpi-card">
        <div class="v3-kpi-icon ${this.escapeHtml(tone)}">
          ${this.escapeHtml(icon)}
        </div>

        <div class="v3-kpi-text">
          <h3>${this.escapeHtml(label)}</h3>
          <strong>${this.escapeHtml(value)}</strong>
          <p>${this.escapeHtml(note)}</p>
        </div>
      </article>
    `;
  },

  /* =======================================================
     Synchronization
  ======================================================= */

  scheduleRefresh() {
    window.clearTimeout(this._refreshTimer);

    this._refreshTimer = window.setTimeout(() => {
      if (!this._container?.isConnected) return;
      this.render(this._container);
    }, this.config.refreshDelay);
  },

  bindAutomaticSync() {
    if (this._syncBound) return;

    this._syncBound = true;

    const refresh = () => this.scheduleRefresh();

    const events = [
      "aiw:dataChanged",
      "aiw:dataUpdated",
      "aiw:dataImported",
      "aiw:dataRestored",
      "aiw:dataReset",
      "aiw:storeChanged",

      "aiw:ideasChanged",
      "aiw:ideasUpdated",
      "aiw:ideaCreated",
      "aiw:ideaUpdated",
      "aiw:ideaSubmittedForApproval",
      "aiw:ideaApproved",
      "aiw:ideaRejected",
      "aiw:ideaReopened",
      "aiw:ideaConvertedToProject",

      "aiw:projectsChanged",
      "aiw:projectsUpdated",
      "aiw:projectCreated",
      "aiw:projectUpdated",
      "aiw:projectArchived",
      "aiw:projectCreatedFromIdea",

      "aiw:governanceChanged",
      "aiw:governanceUpdated",

      "aiw:alertsChanged",
      "aiw:alertsUpdated",

      "aiw:operationsChanged",
      "aiw:operationsUpdated",

      "aiw:maturityChanged",
      "aiw:maturityUpdated"
    ];

    events.forEach(eventName => {
      window.addEventListener(eventName, refresh);
    });

    const store = this.getStore();

    if (typeof store?.subscribe === "function") {
      this._unsubscribeStore = store.subscribe(refresh);
    }

    window.addEventListener("storage", event => {
      const supportedKeys = [
        window.AIW?.KEYS?.DATA,
        "atcDataV1",
        "aiwDataV1",
        "aiwData",
        "AIW_DATA"
      ].filter(Boolean);

      if (!event.key || supportedKeys.includes(event.key)) {
        refresh();
      }
    });
  },

  destroy() {
    window.clearTimeout(this._refreshTimer);

    if (typeof this._unsubscribeStore === "function") {
      this._unsubscribeStore();
    }

    this._unsubscribeStore = null;
    this._container = null;
    this._syncBound = false;
  },

  /* =======================================================
     Additional Dashboard Styles
  ======================================================= */

  injectStyles() {
    const styleId = "aiw-dashboard-v50-styles";

    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;

    style.textContent = `
      .v3-executive-status {
        display: grid;
        grid-template-columns: minmax(0, 1.6fr) minmax(240px, 0.8fr);
        gap: 22px;
        align-items: center;
        margin-top: 18px;
        padding: 22px;
        border: 1px solid rgba(15, 23, 42, 0.08);
        border-radius: 24px;
        background: #ffffff;
        box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
      }

      .v3-executive-status > div:first-child > span {
        display: block;
        margin-bottom: 7px;
        color: #667085;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .v3-executive-status h3 {
        margin: 0;
        color: #101828;
        font-size: 20px;
        line-height: 1.5;
      }

      .v3-executive-status p {
        margin: 8px 0 0;
        color: #667085;
        font-size: 14px;
        line-height: 1.8;
      }

      .v3-executive-status.stable {
        border-color: rgba(8, 125, 62, 0.2);
        background: linear-gradient(
          135deg,
          rgba(226, 247, 234, 0.8),
          #ffffff
        );
      }

      .v3-executive-status.critical {
        border-color: rgba(180, 35, 24, 0.2);
        background: linear-gradient(
          135deg,
          rgba(254, 236, 235, 0.85),
          #ffffff
        );
      }

      .v3-executive-status.warning,
      .v3-executive-status.attention {
        border-color: rgba(183, 92, 0, 0.2);
        background: linear-gradient(
          135deg,
          rgba(255, 243, 217, 0.85),
          #ffffff
        );
      }

      .v3-executive-status-metrics {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .v3-executive-status-metrics > div {
        min-width: 0;
        padding: 13px 10px;
        border-radius: 16px;
        text-align: center;
        background: rgba(248, 250, 252, 0.92);
        border: 1px solid rgba(15, 23, 42, 0.05);
      }

      .v3-executive-status-metrics small,
      .v3-executive-status-metrics strong {
        display: block;
      }

      .v3-executive-status-metrics small {
        margin-bottom: 5px;
        color: #667085;
        font-size: 10px;
        line-height: 1.4;
      }

      .v3-executive-status-metrics strong {
        color: #101828;
        font-size: 21px;
      }

      @media (max-width: 760px) {
        .v3-executive-status {
          grid-template-columns: 1fr;
        }

        .v3-executive-status-metrics {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      @media (max-width: 430px) {
        .v3-executive-status-metrics {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  },

  /* =======================================================
     Utilities
  ======================================================= */

  normalizeStatus(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/_/g, "-");
  },

  toSafeNumber(value, fallback = 0) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
  },

  normalizePercent(value, fallback = 0) {
    return Math.min(
      100,
      Math.max(
        0,
        Math.round(
          this.toSafeNumber(value, fallback)
        )
      )
    );
  },

  firstFiniteNumber(values = []) {
    for (const value of values) {
      const number = Number(value);

      if (Number.isFinite(number)) {
        return number;
      }
    }

    return null;
  },

  countDistinctDepartments(ideas = [], projects = []) {
    const departments = new Set();

    [...ideas, ...projects].forEach(item => {
      const department = String(
        item?.department ??
        item?.businessUnit ??
        item?.portfolio ??
        ""
      ).trim();

      if (department) departments.add(department);
    });

    return departments.size;
  },

  uniqueBy(items = [], selector) {
    const seen = new Set();

    return items.filter(item => {
      const key = String(selector(item));

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
  },

  escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
};
