/* =========================================================
   AI Work - Executive Dashboard V5.3
   Enterprise Biometric Intelligence Platform
   Store V2.2 Native Architecture

   File Path:
   js/modules/dashboard/dashboard.js

   V5.3 Dashboard Refinement:
   - Preserves the premium blue hero section
   - Replaces unclear health/readiness indicators
   - Focuses on executive actions and operational value
   - Final layout: hero, executive KPIs, portfolio progress and priorities
   - Shows ideas, active projects, pending decisions and blockers
   - Keeps portfolio progress and current priorities only
   - Removes recent activity, duplicate support cards and repeated executive summary
   - Fully synchronized with AIW.Store V2.2
   - No direct localStorage or AIW.Data fallback
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};
  AIW.Modules = AIW.Modules || {};

  AIW.Modules.dashboard = {
    id: "dashboard",
    title: "الرئيسية",
    icon: "🏠",
    version: "5.3.0",

    _container: null,
    _unsubscribeStore: null,
    _refreshTimer: null,
    _syncBound: false,
    _isRendering: false,

    config: {
      refreshDelay: 90,
      targetIdeas: 100,
      defaultRoadmapPeriod: "2026–2030",
      styleId: "aiw-dashboard-v53-styles"
    },

    lifecycle: {
      DRAFT: "draft",
      SUBMITTED: "submitted",
      PENDING: "pending-approval",
      APPROVED: "approved",
      REJECTED: "rejected",
      CONVERTED: "converted",
      ARCHIVED: "archived"
    },

    projectStatus: {
      PLANNING: "planning",
      READY: "ready",
      IN_PROGRESS: "in-progress",
      PILOT: "pilot",
      PRODUCTION: "production",
      ON_HOLD: "on-hold",
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
        console.error("AI Work Dashboard V5.3: AIW.Store is unavailable.");
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
          "AI Work Dashboard V5.3: Unable to read Store state.",
          error
        );
      }

      return {};
    },

    getCollection(name) {
      const value = this.getState()?.[name];
      return Array.isArray(value) ? value : [];
    },

    getIdeas() {
      const store = this.getStore();

      try {
        if (typeof store?.getIdeas === "function") {
          const ideas = store.getIdeas();
          if (Array.isArray(ideas)) return ideas;
        }

        if (typeof store?.getCollection === "function") {
          const ideas = store.getCollection("ideas");
          if (Array.isArray(ideas)) return ideas;
        }
      } catch (error) {
        console.warn("AI Work Dashboard V5.3: Ideas reader failed.", error);
      }

      return this.getCollection("ideas").filter(item => !item?.deletedAt);
    },

    getProjects() {
      const store = this.getStore();

      try {
        if (typeof store?.getProjects === "function") {
          const projects = store.getProjects({ includeArchived: false });
          if (Array.isArray(projects)) return projects;
        }

        if (typeof store?.getCollection === "function") {
          const projects = store.getCollection("projects");
          if (Array.isArray(projects)) return projects;
        }
      } catch (error) {
        console.warn("AI Work Dashboard V5.3: Projects reader failed.", error);
      }

      return this.getCollection("projects").filter(item => !item?.deletedAt);
    },

    getPipeline() {
      const store = this.getStore();

      try {
        if (typeof store?.getPipelineStats === "function") {
          const pipeline = store.getPipelineStats();
          if (pipeline && typeof pipeline === "object") return pipeline;
        }
      } catch (error) {
        console.warn("AI Work Dashboard V5.3: Pipeline reader failed.", error);
      }

      const state = this.getState();
      return state.pipeline && typeof state.pipeline === "object"
        ? state.pipeline
        : {};
    },

    getGovernanceItems() {
      const state = this.getState();

      if (Array.isArray(state.governance)) return state.governance;
      if (state.governance && Array.isArray(state.governance.controls)) {
        return state.governance.controls;
      }
      if (Array.isArray(state.governanceControls)) {
        return state.governanceControls;
      }
      if (Array.isArray(state.controls)) return state.controls;

      return [];
    },

    getApprovalItems() {
      const state = this.getState();

      if (Array.isArray(state.automation?.approvals)) {
        return state.automation.approvals;
      }

      if (Array.isArray(state.approvals)) {
        return state.approvals;
      }

      return [];
    },

    getRisks() {
      const state = this.getState();
      const risks = [];

      [
        state.risks,
        state.riskRegister,
        state.governance?.risks
      ].forEach(source => {
        if (Array.isArray(source)) risks.push(...source);
      });

      this.getProjects().forEach(project => {
        if (Array.isArray(project?.risks)) {
          project.risks.forEach((risk, index) => {
            risks.push({
              ...(risk && typeof risk === "object"
                ? risk
                : { title: String(risk || "خطر") }),
              id: risk?.id || `project-risk-${project.id}-${index}`,
              sourceType: "project",
              sourceId: project.id,
              sourceTitle: project.title || "مشروع"
            });
          });
        }

        if (project?.riskLevel || project?.risk) {
          risks.push({
            id: `project-level-risk-${project.id}`,
            title: project.title || "مخاطر مشروع",
            level: project.riskLevel || project.risk,
            status: project.projectStatus || project.status || "open",
            sourceType: "project",
            sourceId: project.id,
            sourceTitle: project.title || "مشروع"
          });
        }
      });

      return this.uniqueBy(
        risks,
        item =>
          item?.id ||
          [
            item?.sourceType || "risk",
            item?.sourceId || "",
            item?.title || item?.name || item?.level || ""
          ].join("-")
      );
    },

    getAlerts() {
      const state = this.getState();
      const alerts = [];

      [
        state.notifications,
        state.alerts,
        state.executiveAlerts,
        state.operations?.alerts,
        state.monitoring?.alerts
      ].forEach(source => {
        if (Array.isArray(source)) alerts.push(...source);
      });

      this.getRisks()
        .filter(risk => this.isHighSeverity(risk))
        .forEach(risk => {
          alerts.push({
            id:
              `risk-alert-${
                risk.id ||
                risk.sourceId ||
                this.hashText(risk.title || risk.name || "risk")
              }`,
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
            sourceId: risk.sourceId || risk.id || null
          });
        });

      return this.uniqueBy(
        alerts,
        item =>
          item?.id ||
          [
            item?.title || item?.name || "alert",
            item?.sourceId || "",
            item?.severity || item?.level || ""
          ].join("-")
      );
    },

    /* =======================================================
       Idea Lifecycle
    ======================================================= */

    getIdeaStatus(idea = {}) {
      if (
        idea.conversion?.converted === true ||
        idea.projectId ||
        idea.conversion?.projectId
      ) {
        return this.lifecycle.CONVERTED;
      }

      const raw = this.normalizeStatus(
        idea.ideaStatus ??
        idea.lifecycleStatus ??
        idea.status ??
        idea.approval?.status ??
        ""
      );

      if (["converted", "converted-to-project"].includes(raw)) {
        return this.lifecycle.CONVERTED;
      }

      if (raw === "pending" || raw === "pending-approval") {
        return this.lifecycle.PENDING;
      }

      if (raw === "submitted") return this.lifecycle.SUBMITTED;
      if (raw === "approved") return this.lifecycle.APPROVED;
      if (raw === "rejected") return this.lifecycle.REJECTED;
      if (raw === "archived") return this.lifecycle.ARCHIVED;

      return this.lifecycle.DRAFT;
    },

    isHighPriorityIdea(idea = {}) {
      return [
        "عالية",
        "عالي",
        "high",
        "high-priority",
        "critical"
      ].includes(
        this.normalizeStatus(
          idea.priority ??
          idea.priorityLevel ??
          idea.level ??
          ""
        )
      );
    },

    /* =======================================================
       Project Status
    ======================================================= */

    getProjectStatus(project = {}) {
      const raw = this.normalizeStatus(
        project.projectStatus ??
        project.status ??
        project.lifecycleStatus ??
        project.deliveryStatus ??
        ""
      );

      const map = {
        planning: this.projectStatus.PLANNING,
        planned: this.projectStatus.PLANNING,
        study: this.projectStatus.PLANNING,
        draft: this.projectStatus.PLANNING,

        ready: this.projectStatus.READY,
        approved: this.projectStatus.READY,

        active: this.projectStatus.IN_PROGRESS,
        "in-progress": this.projectStatus.IN_PROGRESS,
        inprogress: this.projectStatus.IN_PROGRESS,
        execution: this.projectStatus.IN_PROGRESS,

        pilot: this.projectStatus.PILOT,

        production: this.projectStatus.PRODUCTION,
        operational: this.projectStatus.PRODUCTION,

        "on-hold": this.projectStatus.ON_HOLD,
        paused: this.projectStatus.ON_HOLD,
        blocked: this.projectStatus.ON_HOLD,

        completed: this.projectStatus.COMPLETED,

        cancelled: this.projectStatus.CANCELLED,
        canceled: this.projectStatus.CANCELLED,

        archived: this.projectStatus.ARCHIVED,

        "قيد-التخطيط": this.projectStatus.PLANNING,
        "قيد-الدراسة": this.projectStatus.PLANNING,
        معتمد: this.projectStatus.READY,
        جاهز: this.projectStatus.READY,
        "قيد-التنفيذ": this.projectStatus.IN_PROGRESS,
        "قيد-العمل": this.projectStatus.IN_PROGRESS,
        تجريبي: this.projectStatus.PILOT,
        "تجربة-أولية": this.projectStatus.PILOT,
        تشغيل: this.projectStatus.PRODUCTION,
        "قيد-التشغيل": this.projectStatus.PRODUCTION,
        "متوقف-مؤقتاً": this.projectStatus.ON_HOLD,
        "متوقف-موقتا": this.projectStatus.ON_HOLD,
        متعثر: this.projectStatus.ON_HOLD,
        مكتمل: this.projectStatus.COMPLETED,
        منجز: this.projectStatus.COMPLETED,
        ملغي: this.projectStatus.CANCELLED,
        مؤرشف: this.projectStatus.ARCHIVED
      };

      return map[raw] || this.projectStatus.PLANNING;
    },

    isActiveProject(project = {}) {
      return [
        this.projectStatus.IN_PROGRESS,
        this.projectStatus.PILOT,
        this.projectStatus.PRODUCTION
      ].includes(this.getProjectStatus(project));
    },

    isCompletedProject(project = {}) {
      return this.getProjectStatus(project) === this.projectStatus.COMPLETED;
    },

    isBlockedProject(project = {}) {
      return this.getProjectStatus(project) === this.projectStatus.ON_HOLD;
    },

    isHighRiskProject(project = {}) {
      return [
        "عالية",
        "عالي",
        "high",
        "critical",
        "حرج"
      ].includes(
        this.normalizeStatus(
          project.riskLevel ??
          project.risk ??
          ""
        )
      );
    },

    /* =======================================================
       Governance, Risks & Alerts
    ======================================================= */

    isActiveGovernanceControl(item) {
      if (typeof item === "string") return Boolean(item.trim());
      if (!item || typeof item !== "object") return false;

      if (item.enabled === true || item.active === true) return true;

      const status = this.normalizeStatus(item.status ?? item.state ?? "");

      if (!status) return true;

      return [
        "active",
        "enabled",
        "approved",
        "implemented",
        "مفعل",
        "مفعّل",
        "معتمد",
        "نشط",
        "مطبق",
        "مطبّق"
      ].includes(status);
    },

    isClosedItem(item = {}) {
      return [
        "closed",
        "resolved",
        "dismissed",
        "completed",
        "cancelled",
        "archived",
        "مغلق",
        "تم-الحل",
        "محلول",
        "مكتمل",
        "ملغي",
        "مؤرشف"
      ].includes(
        this.normalizeStatus(item.status ?? item.state ?? "")
      );
    },

    isPendingApproval(item = {}) {
      return [
        "pending",
        "pending-approval",
        "waiting",
        "submitted",
        "بانتظار-الاعتماد",
        "قيد-المراجعة",
        "معلق"
      ].includes(
        this.normalizeStatus(item.status ?? item.state ?? "")
      );
    },

    isHighSeverity(item = {}) {
      return [
        "critical",
        "high",
        "حرج",
        "عالي",
        "عالية"
      ].includes(
        this.normalizeStatus(
          item.severity ??
          item.level ??
          item.priority ??
          item.type ??
          item.riskLevel ??
          ""
        )
      );
    },

    /* =======================================================
       Metrics
    ======================================================= */

    calculateMetrics() {
      const state = this.getState();
      const dashboard =
        state.dashboard && typeof state.dashboard === "object"
          ? state.dashboard
          : {};

      const summary =
        state.summary && typeof state.summary === "object"
          ? state.summary
          : {};

      const pipeline = this.getPipeline();
      const ideas = this.getIdeas();
      const projects = this.getProjects();
      const departments = Array.isArray(state.departments)
        ? state.departments
        : [];
      const governance = this.getGovernanceItems();
      const approvals = this.getApprovalItems();
      const risks = this.getRisks();
      const alerts = this.getAlerts();

      const ideaMetrics = {
        total: this.numberOrFallback(pipeline.totalIdeas, ideas.length),

        highPriority: ideas.filter(idea =>
          this.isHighPriorityIdea(idea)
        ).length,

        draft: this.numberOrFallback(
          pipeline.draftIdeas,
          ideas.filter(
            idea => this.getIdeaStatus(idea) === this.lifecycle.DRAFT
          ).length
        ),

        submitted: this.numberOrFallback(
          pipeline.submittedIdeas,
          ideas.filter(
            idea => this.getIdeaStatus(idea) === this.lifecycle.SUBMITTED
          ).length
        ),

        pending: this.numberOrFallback(
          pipeline.pendingIdeas,
          ideas.filter(
            idea => this.getIdeaStatus(idea) === this.lifecycle.PENDING
          ).length
        ),

        approved: this.numberOrFallback(
          pipeline.approvedIdeas,
          ideas.filter(
            idea => this.getIdeaStatus(idea) === this.lifecycle.APPROVED
          ).length
        ),

        rejected: this.numberOrFallback(
          pipeline.rejectedIdeas,
          ideas.filter(
            idea => this.getIdeaStatus(idea) === this.lifecycle.REJECTED
          ).length
        ),

        converted: this.numberOrFallback(
          pipeline.convertedIdeas,
          ideas.filter(
            idea => this.getIdeaStatus(idea) === this.lifecycle.CONVERTED
          ).length
        )
      };

      const projectMetrics = {
        total: this.numberOrFallback(pipeline.totalProjects, projects.length),

        active: this.numberOrFallback(
          pipeline.activeProjects,
          projects.filter(project => this.isActiveProject(project)).length
        ),

        completed: this.numberOrFallback(
          pipeline.completedProjects,
          projects.filter(project => this.isCompletedProject(project)).length
        ),

        ready: projects.filter(
          project =>
            this.getProjectStatus(project) === this.projectStatus.READY
        ).length,

        pilot: projects.filter(
          project =>
            this.getProjectStatus(project) === this.projectStatus.PILOT
        ).length,

        production: projects.filter(
          project =>
            this.getProjectStatus(project) === this.projectStatus.PRODUCTION
        ).length,

        blocked: projects.filter(project =>
          this.isBlockedProject(project)
        ).length,

        highRisk: projects.filter(project =>
          this.isHighRiskProject(project)
        ).length
      };

      projectMetrics.averageProgress = this.numberOrFallback(
        pipeline.averageProjectProgress,
        projects.length
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
          : 0
      );

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

      const pendingApprovals = approvals.filter(
        approval =>
          !this.isClosedItem(approval) &&
          this.isPendingApproval(approval)
      ).length;

      const alertMetrics = {
        total: alerts.filter(item => !this.isClosedItem(item)).length,
        critical: alerts.filter(
          item =>
            this.isHighSeverity(item) &&
            !this.isClosedItem(item)
        ).length
      };

      const riskMetrics = {
        total: risks.filter(item => !this.isClosedItem(item)).length,
        high: risks.filter(
          item =>
            this.isHighSeverity(item) &&
            !this.isClosedItem(item)
        ).length
      };

      const targetIdeas = Math.max(
        1,
        this.toSafeNumber(
          summary.targetIdeas ?? dashboard.targetIdeas,
          this.config.targetIdeas
        )
      );

      const ideaProgress = this.normalizePercent(
        (ideaMetrics.total / targetIdeas) * 100
      );

      const conversionRate = this.numberOrFallback(
        pipeline.conversionRate,
        ideaMetrics.total
          ? this.normalizePercent(
              (ideaMetrics.converted / ideaMetrics.total) * 100
            )
          : 0
      );

      const decisionQueue =
        Math.max(ideaMetrics.pending, pendingApprovals) +
        projectMetrics.blocked +
        alertMetrics.critical;

      const executionReady =
        ideaMetrics.approved +
        projectMetrics.ready;

      const departmentsCount =
        departments.length ||
        this.countDistinctDepartments(ideas, projects);

      return {
        state,
        dashboard,
        summary,
        pipeline,
        ideas,
        projects,
        departments,
        governance,
        approvals,
        alerts,
        risks,
        ideaMetrics,
        projectMetrics,
        governanceMetrics,
        alertMetrics,
        riskMetrics,
        pendingApprovals,
        targetIdeas,
        ideaProgress,
        conversionRate,
        decisionQueue,
        executionReady,
        departmentsCount,
        roadmapPeriod:
          summary.period ??
          summary.roadmapPeriod ??
          state.strategyMeta?.roadmapPeriod ??
          this.config.defaultRoadmapPeriod
      };
    },

    /* =======================================================
       Executive Content
    ======================================================= */

    buildPriorities(metrics) {
      const priorities = [];

      if (metrics.alertMetrics.critical > 0) {
        priorities.push({
          icon: "🚨",
          title: "مراجعة التنبيهات الحرجة",
          text: `${metrics.alertMetrics.critical} تنبيه يحتاج معالجة`,
          tone: "critical",
          route: "settings"
        });
      }

      if (metrics.projectMetrics.blocked > 0) {
        priorities.push({
          icon: "⛔",
          title: "إعادة المشاريع المتوقفة للمسار",
          text: `${metrics.projectMetrics.blocked} مشروع متوقف مؤقتاً`,
          tone: "warning",
          route: "projects"
        });
      }

      const approvalCount = Math.max(
        metrics.pendingApprovals,
        metrics.ideaMetrics.pending
      );

      if (approvalCount > 0) {
        priorities.push({
          icon: "✅",
          title: "حسم الاعتمادات المعلقة",
          text: `${approvalCount} عناصر بانتظار القرار`,
          tone: "attention",
          route: "ideas"
        });
      }

      if (metrics.ideaMetrics.approved > 0) {
        priorities.push({
          icon: "🚀",
          title: "تحويل الأفكار الجاهزة",
          text: `${metrics.ideaMetrics.approved} أفكار معتمدة قابلة للتحويل`,
          tone: "success",
          route: "ideas"
        });
      }

      if (!priorities.length) {
        priorities.push(
          {
            icon: "💡",
            title: "إضافة فرص جديدة",
            text: "وسّع محفظة الأفكار المتخصصة",
            tone: "neutral",
            route: "ideas"
          },
          {
            icon: "📁",
            title: "بدء مشروع تنفيذي",
            text: "حوّل أفضل فكرة معتمدة إلى مشروع",
            tone: "neutral",
            route: "projects"
          }
        );
      }

      return priorities.slice(0, 4);
    },

    /* =======================================================
       Main Render
    ======================================================= */

    render(container) {
      if (!container || this._isRendering) return;

      this._isRendering = true;
      this._container = container;

      try {
        this.injectStyles();

        const metrics = this.calculateMetrics();
        const priorities = this.buildPriorities(metrics);

        const approvalCount = Math.max(
          metrics.ideaMetrics.pending,
          metrics.pendingApprovals
        );

        container.innerHTML = `
          <section class="module-page v52-dashboard-page">

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
                  مركز واحد يربط الأفكار والمشاريع والقرارات والحوكمة
                  ضمن مسار تنفيذي واضح وقابل للمتابعة.
                </p>
              </div>

              <div class="v3-ai-visual">
                <div class="v3-ai-orb">AI</div>
              </div>

              <div class="v3-hero-stats">
                <div>
                  <strong>${metrics.ideaMetrics.total}/${metrics.targetIdeas} 💡</strong>
                  <span>فكرة متخصصة</span>
                </div>

                <div>
                  <strong>${metrics.projectMetrics.total} 📁</strong>
                  <span>مشروع تنفيذي</span>
                </div>

                <div>
                  <strong>${metrics.departmentsCount} 🛂</strong>
                  <span>محافظ تشغيلية</span>
                </div>

                <div>
                  <strong>${this.escapeHtml(metrics.roadmapPeriod)} 🗓️</strong>
                  <span>خارطة زمنية</span>
                </div>
              </div>
            </section>

            <section class="v52-section-head">
              <div>
                <span>EXECUTIVE SNAPSHOT</span>
                <h2>نظرة تنفيذية سريعة</h2>
              </div>
              <p>أهم ما يحتاجه المسؤول لاتخاذ القرار والمتابعة.</p>
            </section>

            <section class="v52-kpi-grid">
              ${this.executiveCard({
                icon: "💡",
                label: "الأفكار الحالية",
                value: metrics.ideaMetrics.total,
                note: `${metrics.ideaProgress}% من هدف ${metrics.targetIdeas} فكرة`,
                meta: `${metrics.ideaMetrics.highPriority} عالية الأولوية`,
                tone: "blue",
                route: "ideas"
              })}

              ${this.executiveCard({
                icon: "📁",
                label: "المشاريع النشطة",
                value: metrics.projectMetrics.active,
                note: `${metrics.projectMetrics.onTrack} على المسار`,
                meta: `${metrics.projectMetrics.blocked} متوقفة`,
                tone: "green",
                route: "projects"
              })}

              ${this.executiveCard({
                icon: "✅",
                label: "بانتظار القرار",
                value: approvalCount,
                note: `${metrics.ideaMetrics.approved} أفكار معتمدة`,
                meta: `${metrics.executionReady} جاهزة للتنفيذ`,
                tone: "amber",
                route: "ideas"
              })}

              ${this.executiveCard({
                icon: "⚠️",
                label: "تحتاج متابعة",
                value:
                  metrics.projectMetrics.blocked +
                  metrics.alertMetrics.critical,
                note: `${metrics.projectMetrics.blocked} مشاريع متوقفة`,
                meta: `${metrics.alertMetrics.critical} تنبيهات حرجة`,
                tone: "red",
                route: "projects"
              })}
            </section>

            <section class="v52-portfolio-card">
              <div class="v52-portfolio-main">
                <div class="v52-card-title">
                  <span class="v52-status-dot"></span>
                  <div>
                    <small>PORTFOLIO DELIVERY</small>
                    <h3>تقدم المحفظة التنفيذية</h3>
                  </div>
                </div>

                <div class="v52-progress-row">
                  <strong>${metrics.projectMetrics.averageProgress}%</strong>

                  <div class="v52-progress-track" aria-label="متوسط تقدم المشاريع">
                    <span style="width:${metrics.projectMetrics.averageProgress}%"></span>
                  </div>
                </div>

                <p>
                  متوسط إنجاز المشاريع الحالية مع متابعة المشاريع النشطة
                  والمتوقفة والمكتملة.
                </p>
              </div>

              <div class="v52-delivery-metrics">
                <div>
                  <span>على المسار</span>
                  <strong>${metrics.projectMetrics.onTrack}</strong>
                </div>

                <div>
                  <span>في التجربة</span>
                  <strong>${metrics.projectMetrics.pilot}</strong>
                </div>

                <div>
                  <span>تشغيل فعلي</span>
                  <strong>${metrics.projectMetrics.production}</strong>
                </div>

                <div>
                  <span>مكتملة</span>
                  <strong>${metrics.projectMetrics.completed}</strong>
                </div>
              </div>
            </section>

            <section class="v52-priority-section">
              <article class="v52-panel">
                <div class="v52-panel-head">
                  <div>
                    <span>TODAY'S PRIORITIES</span>
                    <h3>الأولويات الحالية</h3>
                  </div>
                  <span class="v52-count-pill">${priorities.length}</span>
                </div>

                <div class="v52-priority-list">
                  ${priorities
                    .map((item, index) =>
                      this.priorityItem(item, index + 1)
                    )
                    .join("")}
                </div>
              </article>
            </section>

          </section>
        `;

        this.bindDashboardActions(container);
        this.bindAutomaticSync();
      } finally {
        this._isRendering = false;
      }
    },

    executiveCard({
      icon,
      label,
      value,
      note,
      meta,
      tone,
      route
    }) {
      return `
        <article
          class="v52-kpi-card ${this.escapeHtml(tone)}"
          data-aiw-route="${this.escapeHtml(route)}"
          role="button"
          tabindex="0"
        >
          <div class="v52-kpi-top">
            <div class="v52-kpi-icon">${this.escapeHtml(icon)}</div>
            <span class="v52-kpi-arrow">↗</span>
          </div>

          <div class="v52-kpi-body">
            <h3>${this.escapeHtml(label)}</h3>
            <strong>${this.escapeHtml(value)}</strong>
            <p>${this.escapeHtml(note)}</p>
          </div>

          <div class="v52-kpi-meta">
            ${this.escapeHtml(meta)}
          </div>
        </article>
      `;
    },

    priorityItem(item, number) {
      return `
        <button
          type="button"
          class="v52-priority-item ${this.escapeHtml(item.tone)}"
          data-aiw-route="${this.escapeHtml(item.route)}"
        >
          <span class="v52-priority-number">${number}</span>
          <span class="v52-priority-icon">${this.escapeHtml(item.icon)}</span>
          <span class="v52-priority-copy">
            <strong>${this.escapeHtml(item.title)}</strong>
            <small>${this.escapeHtml(item.text)}</small>
          </span>
          <span class="v52-row-arrow">‹</span>
        </button>
      `;
    },

    bindDashboardActions(container) {
      container.querySelectorAll("[data-aiw-route]").forEach(element => {
        const route = element.getAttribute("data-aiw-route");

        const openRoute = () => {
          if (!route) return;

          if (typeof window.AIW?.App?.go === "function") {
            window.AIW.App.go(route);
            return;
          }

          if (typeof window.AIW?.Router?.navigate === "function") {
            window.AIW.Router.navigate(route);
          }
        };

        element.addEventListener("click", openRoute);

        if (element.getAttribute("role") === "button") {
          element.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openRoute();
            }
          });
        }
      });
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

      [
        "aiw:dataChanged",
        "aiw:dataUpdated",
        "aiw:dataImported",
        "aiw:dataRestored",
        "aiw:dataReset",
        "aiw:storeChanged",
        "aiw:itemCreated",
        "aiw:itemUpdated",
        "aiw:itemDeleted",
        "aiw:itemRestored",
        "aiw:ideaStatusChanged",
        "aiw:ideaSubmitted",
        "aiw:ideaApproved",
        "aiw:ideaRejected",
        "aiw:ideaConvertedToProject",
        "aiw:projectCreatedFromIdea",
        "aiw:projectStatusChanged",
        "aiw:projectPhaseChanged",
        "aiw:projectTaskCreated",
        "aiw:projectTaskUpdated",
        "aiw:projectTaskDeleted",
        "aiw:projectRevertedToIdea",
        "aiw:approvalCreated",
        "aiw:approvalResolved"
      ].forEach(eventName => {
        window.addEventListener(eventName, refresh);
      });

      const store = this.getStore();

      if (typeof store?.subscribe === "function") {
        this._unsubscribeStore = store.subscribe(change => {
          const type = change?.type || "";

          if (
            type === "persist" ||
            type === "settingsPersisted" ||
            type === "aiw:metadataChanged"
          ) {
            return;
          }

          refresh();
        });
      }
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
       Styles
    ======================================================= */

    injectStyles() {
      if (document.getElementById(this.config.styleId)) return;

      const style = document.createElement("style");
      style.id = this.config.styleId;

      style.textContent = `
        .v52-dashboard-page {
          display: grid;
          gap: 20px;
        }

        .v52-section-head {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 16px;
          margin-top: 2px;
        }

        .v52-section-head span,
        .v52-panel-head span,
        .v52-card-title small {
          display: block;
          color: #7a8699;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .13em;
        }

        .v52-section-head h2,
        .v52-panel-head h3,
        .v52-card-title h3 {
          margin: 4px 0 0;
          color: #152238;
        }

        .v52-section-head h2 {
          font-size: 22px;
        }

        .v52-section-head p {
          margin: 0;
          color: #7a8699;
          font-size: 13px;
        }

        .v52-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .v52-kpi-card {
          position: relative;
          min-width: 0;
          padding: 18px;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, .07);
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 14px 34px rgba(15, 23, 42, .055);
          cursor: pointer;
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .v52-kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 42px rgba(15, 23, 42, .09);
        }

        .v52-kpi-card::after {
          content: "";
          position: absolute;
          inset-inline-end: -38px;
          top: -42px;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          opacity: .45;
        }

        .v52-kpi-card.blue::after { background: #dce8ff; }
        .v52-kpi-card.green::after { background: #dff7e9; }
        .v52-kpi-card.amber::after { background: #fff0cc; }
        .v52-kpi-card.red::after { background: #ffe1df; }

        .v52-kpi-top {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .v52-kpi-icon {
          display: grid;
          width: 48px;
          height: 48px;
          place-items: center;
          border-radius: 16px;
          background: rgba(248, 250, 252, .92);
          font-size: 24px;
        }

        .v52-kpi-arrow {
          color: #8290a5;
          font-size: 17px;
          font-weight: 800;
        }

        .v52-kpi-body {
          position: relative;
          z-index: 1;
          margin-top: 22px;
        }

        .v52-kpi-body h3 {
          margin: 0;
          color: #647089;
          font-size: 15px;
          line-height: 1.45;
        }

        .v52-kpi-body strong {
          display: block;
          margin-top: 7px;
          color: #0d172a;
          font-size: clamp(34px, 4vw, 48px);
          line-height: 1;
        }

        .v52-kpi-body p {
          margin: 10px 0 0;
          color: #1aa55b;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.55;
        }

        .v52-kpi-meta {
          position: relative;
          z-index: 1;
          margin-top: 15px;
          padding-top: 12px;
          border-top: 1px solid rgba(15, 23, 42, .06);
          color: #7a8699;
          font-size: 11px;
          font-weight: 700;
        }

        .v52-portfolio-card {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(280px, .7fr);
          gap: 20px;
          padding: 22px;
          border: 1px solid rgba(15, 23, 42, .07);
          border-radius: 28px;
          background:
            radial-gradient(circle at 15% 10%, rgba(225, 245, 235, .8), transparent 40%),
            #fff;
          box-shadow: 0 16px 40px rgba(15, 23, 42, .06);
        }

        .v52-card-title {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .v52-status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          box-shadow: 0 0 0 6px rgba(26, 165, 91, .1);
          background: #20bd66;
        }

        .v52-status-dot.critical {
          background: #e5484d;
          box-shadow: 0 0 0 6px rgba(229, 72, 77, .1);
        }

        .v52-status-dot.warning,
        .v52-status-dot.attention {
          background: #f59e0b;
          box-shadow: 0 0 0 6px rgba(245, 158, 11, .12);
        }

        .v52-progress-row {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 16px;
          align-items: center;
          margin-top: 24px;
        }

        .v52-progress-row > strong {
          color: #0d172a;
          font-size: 42px;
          line-height: 1;
        }

        .v52-progress-track {
          height: 12px;
          overflow: hidden;
          border-radius: 999px;
          background: #edf1f5;
        }

        .v52-progress-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #10a957, #34cf76);
        }

        .v52-portfolio-main > p {
          margin: 15px 0 0;
          color: #748096;
          font-size: 13px;
          line-height: 1.75;
        }

        .v52-delivery-metrics {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .v52-delivery-metrics > div {
          padding: 14px;
          border: 1px solid rgba(15, 23, 42, .06);
          border-radius: 18px;
          background: rgba(248, 250, 252, .88);
          text-align: center;
        }

        .v52-delivery-metrics span,
        .v52-delivery-metrics strong {
          display: block;
        }

        .v52-delivery-metrics span {
          color: #7a8699;
          font-size: 11px;
        }

        .v52-delivery-metrics strong {
          margin-top: 6px;
          color: #152238;
          font-size: 24px;
        }

        .v52-priority-section {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 16px;
        }

        .v52-panel {
          padding: 20px;
          border: 1px solid rgba(15, 23, 42, .07);
          border-radius: 26px;
          background: #fff;
          box-shadow: 0 14px 34px rgba(15, 23, 42, .05);
        }

        .v52-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 15px;
        }

        .v52-panel-head h3 {
          font-size: 18px;
        }

        .v52-count-pill,

        .v52-priority-list {
          display: grid;
          gap: 9px;
        }

        .v52-priority-item {
          display: grid;
          grid-template-columns: 28px 40px minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
          width: 100%;
          padding: 11px 12px;
          border: 1px solid rgba(15, 23, 42, .06);
          border-radius: 17px;
          background: #fbfcfe;
          color: inherit;
          text-align: start;
          cursor: pointer;
        }

        .v52-priority-number {
          display: grid;
          width: 26px;
          height: 26px;
          place-items: center;
          border-radius: 9px;
          background: #eef2f7;
          color: #68758c;
          font-size: 11px;
          font-weight: 900;
        }

        .v52-priority-icon {
          width: 38px;
          height: 38px;
        }

        .v52-priority-copy strong,
        .v52-priority-copy small {
          display: block;
        }

        .v52-priority-copy strong {
          color: #263247;
          font-size: 13px;
          line-height: 1.45;
        }

        .v52-priority-copy small {
          margin-top: 3px;
          color: #8893a5;
          font-size: 10px;
          line-height: 1.4;
        }

        .v52-row-arrow {
          color: #9aa5b6;
          font-size: 22px;
        }

        @media (max-width: 980px) {
          .v52-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .v52-portfolio-card,
        }

        @media (max-width: 720px) {
          .v52-section-head {
            align-items: start;
            flex-direction: column;
          }

          .v52-two-column,
        }

        @media (max-width: 520px) {
          .v52-dashboard-page {
            gap: 16px;
          }

          .v52-kpi-grid {
            gap: 11px;
          }

          .v52-kpi-card {
            padding: 15px;
            border-radius: 21px;
          }

          .v52-kpi-icon {
            width: 44px;
            height: 44px;
            border-radius: 14px;
            font-size: 21px;
          }

          .v52-kpi-body {
            margin-top: 18px;
          }

          .v52-kpi-body h3 {
            font-size: 13px;
          }

          .v52-kpi-body strong {
            font-size: 36px;
          }

          .v52-kpi-body p {
            font-size: 11px;
          }

          .v52-kpi-meta {
            font-size: 9px;
          }

          .v52-portfolio-card,
          .v52-panel,

          .v52-progress-row {
            grid-template-columns: 1fr;
          }

          .v52-progress-row > strong {
            font-size: 38px;
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
      const number = Number(value);
      return Number.isFinite(number) ? number : fallback;
    },

    numberOrFallback(value, fallback = 0) {
      const number = Number(value);
      return Number.isFinite(number) ? number : fallback;
    },

    normalizePercent(value, fallback = 0) {
      return Math.min(
        100,
        Math.max(
          0,
          Math.round(this.toSafeNumber(value, fallback))
        )
      );
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

    hashText(value) {
      const text = String(value || "");
      let hash = 0;

      for (let index = 0; index < text.length; index += 1) {
        hash = ((hash << 5) - hash) + text.charCodeAt(index);
        hash |= 0;
      }

      return Math.abs(hash);
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
})();
