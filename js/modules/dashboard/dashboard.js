/* =========================================================
   AI Work - Executive Dashboard V5.1
   Enterprise Biometric Intelligence Platform
   Store V2.2 Native Architecture

   File Path:
   js/modules/dashboard/dashboard.js

   Fixes in V5.1:
   - Full alignment with Store V2.2 project statuses
   - Reads dashboard + pipeline as native Store V2.2 sources
   - Uses projectStatus before legacy project status fields
   - Correct support for planning / ready / in-progress /
     pilot / production / on-hold / completed / cancelled /
     archived
   - Real idea lifecycle and project delivery indicators
   - Real governance, risk and approval metrics
   - Stable cross-page synchronization without render loops
   - No direct localStorage or AIW.Data data fallback
   - Existing blue hero design preserved
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};
  AIW.Modules = AIW.Modules || {};

  AIW.Modules.dashboard = {
    id: "dashboard",
    title: "الرئيسية",
    icon: "🏠",
    version: "5.1.0",

    _container: null,
    _unsubscribeStore: null,
    _refreshTimer: null,
    _syncBound: false,
    _isRendering: false,

    config: {
      refreshDelay: 90,
      targetIdeas: 100,
      defaultRoadmapPeriod: "2026–2030",
      maxTrendPoints: 9,
      styleId: "aiw-dashboard-v51-styles"
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
        console.error(
          "AI Work Dashboard V5.1: AIW.Store is unavailable."
        );
        return {};
      }

      try {
        if (typeof store.getState === "function") {
          const state = store.getState();

          return state &&
            typeof state === "object"
            ? state
            : {};
        }

        if (typeof store.getData === "function") {
          const state = store.getData();

          return state &&
            typeof state === "object"
            ? state
            : {};
        }
      } catch (error) {
        console.error(
          "AI Work Dashboard V5.1: Unable to read Store state.",
          error
        );
      }

      return {};
    },

    getCollection(name) {
      const value = this.getState()?.[name];
      return Array.isArray(value)
        ? value
        : [];
    },

    getIdeas() {
      const store = this.getStore();

      try {
        if (typeof store?.getIdeas === "function") {
          const ideas = store.getIdeas();

          if (Array.isArray(ideas)) {
            return ideas;
          }
        }

        if (typeof store?.getCollection === "function") {
          const ideas =
            store.getCollection("ideas");

          if (Array.isArray(ideas)) {
            return ideas;
          }
        }
      } catch (error) {
        console.warn(
          "AI Work Dashboard V5.1: Ideas reader failed.",
          error
        );
      }

      return this.getCollection("ideas")
        .filter(item => !item?.deletedAt);
    },

    getProjects() {
      const store = this.getStore();

      try {
        if (typeof store?.getProjects === "function") {
          const projects = store.getProjects({
            includeArchived: false
          });

          if (Array.isArray(projects)) {
            return projects;
          }
        }

        if (typeof store?.getCollection === "function") {
          const projects =
            store.getCollection("projects");

          if (Array.isArray(projects)) {
            return projects;
          }
        }
      } catch (error) {
        console.warn(
          "AI Work Dashboard V5.1: Projects reader failed.",
          error
        );
      }

      return this.getCollection("projects")
        .filter(item => !item?.deletedAt);
    },

    getPipeline() {
      const store = this.getStore();

      try {
        if (
          typeof store?.getPipelineStats ===
          "function"
        ) {
          const pipeline =
            store.getPipelineStats();

          if (
            pipeline &&
            typeof pipeline === "object"
          ) {
            return pipeline;
          }
        }
      } catch (error) {
        console.warn(
          "AI Work Dashboard V5.1: Pipeline reader failed.",
          error
        );
      }

      const state = this.getState();

      return state.pipeline &&
        typeof state.pipeline === "object"
        ? state.pipeline
        : {};
    },

    getGovernanceItems() {
      const state = this.getState();

      if (Array.isArray(state.governance)) {
        return state.governance;
      }

      if (
        state.governance &&
        Array.isArray(
          state.governance.controls
        )
      ) {
        return state.governance.controls;
      }

      if (
        Array.isArray(
          state.governanceControls
        )
      ) {
        return state.governanceControls;
      }

      if (Array.isArray(state.controls)) {
        return state.controls;
      }

      return [];
    },

    getApprovalItems() {
      const state = this.getState();

      if (
        Array.isArray(
          state.automation?.approvals
        )
      ) {
        return state.automation.approvals;
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
        if (Array.isArray(source)) {
          risks.push(...source);
        }
      });

      this.getProjects().forEach(project => {
        if (Array.isArray(project?.risks)) {
          project.risks.forEach(
            (risk, index) => {
              risks.push({
                ...(
                  risk &&
                  typeof risk === "object"
                    ? risk
                    : {
                        title:
                          String(risk || "خطر")
                      }
                ),

                id:
                  risk?.id ||
                  `project-risk-${project.id}-${index}`,

                sourceType: "project",
                sourceId: project.id,
                sourceTitle:
                  project.title ||
                  "مشروع"
              });
            }
          );
        }

        if (
          project?.riskLevel ||
          project?.risk
        ) {
          risks.push({
            id:
              `project-level-risk-${project.id}`,

            title:
              project.title ||
              "مخاطر مشروع",

            level:
              project.riskLevel ||
              project.risk,

            status:
              project.projectStatus ||
              project.status ||
              "open",

            sourceType: "project",
            sourceId: project.id,
            sourceTitle:
              project.title ||
              "مشروع"
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
            item?.title ||
              item?.name ||
              item?.level ||
              ""
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
        if (Array.isArray(source)) {
          alerts.push(...source);
        }
      });

      this.getRisks()
        .filter(risk =>
          this.isHighSeverity(risk)
        )
        .forEach(risk => {
          alerts.push({
            id:
              `risk-alert-${
                risk.id ||
                risk.sourceId ||
                this.hashText(
                  risk.title ||
                  risk.name ||
                  "risk"
                )
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

            status:
              risk.status ||
              "open",

            sourceType:
              risk.sourceType ||
              "risk",

            sourceId:
              risk.sourceId ||
              risk.id ||
              null
          });
        });

      return this.uniqueBy(
        alerts,
        item =>
          item?.id ||
          [
            item?.title ||
              item?.name ||
              "alert",
            item?.sourceId || "",
            item?.severity ||
              item?.level ||
              ""
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

      const raw =
        this.normalizeStatus(
          idea.ideaStatus ??
          idea.lifecycleStatus ??
          idea.status ??
          idea.approval?.status ??
          ""
        );

      if (
        [
          "converted",
          "converted-to-project"
        ].includes(raw)
      ) {
        return this.lifecycle.CONVERTED;
      }

      if (
        raw === "pending" ||
        raw === "pending-approval"
      ) {
        return this.lifecycle.PENDING;
      }

      if (raw === "submitted") {
        return this.lifecycle.SUBMITTED;
      }

      if (raw === "approved") {
        return this.lifecycle.APPROVED;
      }

      if (raw === "rejected") {
        return this.lifecycle.REJECTED;
      }

      if (raw === "archived") {
        return this.lifecycle.ARCHIVED;
      }

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
      const raw =
        this.normalizeStatus(
          project.projectStatus ??
          project.status ??
          project.lifecycleStatus ??
          project.deliveryStatus ??
          ""
        );

      const map = {
        planning:
          this.projectStatus.PLANNING,
        planned:
          this.projectStatus.PLANNING,
        study:
          this.projectStatus.PLANNING,
        draft:
          this.projectStatus.PLANNING,

        ready:
          this.projectStatus.READY,
        approved:
          this.projectStatus.READY,

        active:
          this.projectStatus.IN_PROGRESS,
        "in-progress":
          this.projectStatus.IN_PROGRESS,
        inprogress:
          this.projectStatus.IN_PROGRESS,
        execution:
          this.projectStatus.IN_PROGRESS,

        pilot:
          this.projectStatus.PILOT,

        production:
          this.projectStatus.PRODUCTION,
        operational:
          this.projectStatus.PRODUCTION,

        "on-hold":
          this.projectStatus.ON_HOLD,
        paused:
          this.projectStatus.ON_HOLD,
        blocked:
          this.projectStatus.ON_HOLD,

        completed:
          this.projectStatus.COMPLETED,

        cancelled:
          this.projectStatus.CANCELLED,
        canceled:
          this.projectStatus.CANCELLED,

        archived:
          this.projectStatus.ARCHIVED,

        "قيد-التخطيط":
          this.projectStatus.PLANNING,
        "قيد-الدراسة":
          this.projectStatus.PLANNING,
        معتمد:
          this.projectStatus.READY,
        جاهز:
          this.projectStatus.READY,
        "قيد-التنفيذ":
          this.projectStatus.IN_PROGRESS,
        "قيد-العمل":
          this.projectStatus.IN_PROGRESS,
        تجريبي:
          this.projectStatus.PILOT,
        "تجربة-أولية":
          this.projectStatus.PILOT,
        تشغيل:
          this.projectStatus.PRODUCTION,
        "قيد-التشغيل":
          this.projectStatus.PRODUCTION,
        "متوقف-مؤقتاً":
          this.projectStatus.ON_HOLD,
        "متوقف-موقتا":
          this.projectStatus.ON_HOLD,
        متعثر:
          this.projectStatus.ON_HOLD,
        مكتمل:
          this.projectStatus.COMPLETED,
        منجز:
          this.projectStatus.COMPLETED,
        ملغي:
          this.projectStatus.CANCELLED,
        مؤرشف:
          this.projectStatus.ARCHIVED
      };

      return (
        map[raw] ||
        this.projectStatus.PLANNING
      );
    },

    isActiveProject(project = {}) {
      return [
        this.projectStatus.IN_PROGRESS,
        this.projectStatus.PILOT,
        this.projectStatus.PRODUCTION
      ].includes(
        this.getProjectStatus(project)
      );
    },

    isCompletedProject(project = {}) {
      return (
        this.getProjectStatus(project) ===
        this.projectStatus.COMPLETED
      );
    },

    isBlockedProject(project = {}) {
      return (
        this.getProjectStatus(project) ===
        this.projectStatus.ON_HOLD
      );
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
      if (
        typeof item === "string"
      ) {
        return Boolean(item.trim());
      }

      if (
        !item ||
        typeof item !== "object"
      ) {
        return false;
      }

      if (
        item.enabled === true ||
        item.active === true
      ) {
        return true;
      }

      const status =
        this.normalizeStatus(
          item.status ??
          item.state ??
          ""
        );

      if (!status) {
        return true;
      }

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
        this.normalizeStatus(
          item.status ??
          item.state ??
          ""
        )
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

    isMediumSeverity(item = {}) {
      return [
        "medium",
        "متوسط",
        "متوسطة"
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
        state.dashboard &&
        typeof state.dashboard === "object"
          ? state.dashboard
          : {};

      const summary =
        state.summary &&
        typeof state.summary === "object"
          ? state.summary
          : {};

      const pipeline =
        this.getPipeline();

      const ideas =
        this.getIdeas();

      const projects =
        this.getProjects();

      const departments =
        Array.isArray(
          state.departments
        )
          ? state.departments
          : [];

      const governance =
        this.getGovernanceItems();

      const approvals =
        this.getApprovalItems();

      const risks =
        this.getRisks();

      const alerts =
        this.getAlerts();

      const ideaMetrics = {
        total:
          this.numberOrFallback(
            pipeline.totalIdeas,
            ideas.length
          ),

        highPriority:
          ideas.filter(idea =>
            this.isHighPriorityIdea(
              idea
            )
          ).length,

        draft:
          this.numberOrFallback(
            pipeline.draftIdeas,
            ideas.filter(
              idea =>
                this.getIdeaStatus(
                  idea
                ) ===
                this.lifecycle.DRAFT
            ).length
          ),

        submitted:
          this.numberOrFallback(
            pipeline.submittedIdeas,
            ideas.filter(
              idea =>
                this.getIdeaStatus(
                  idea
                ) ===
                this.lifecycle.SUBMITTED
            ).length
          ),

        pending:
          this.numberOrFallback(
            pipeline.pendingIdeas,
            ideas.filter(
              idea =>
                this.getIdeaStatus(
                  idea
                ) ===
                this.lifecycle.PENDING
            ).length
          ),

        approved:
          this.numberOrFallback(
            pipeline.approvedIdeas,
            ideas.filter(
              idea =>
                this.getIdeaStatus(
                  idea
                ) ===
                this.lifecycle.APPROVED
            ).length
          ),

        rejected:
          this.numberOrFallback(
            pipeline.rejectedIdeas,
            ideas.filter(
              idea =>
                this.getIdeaStatus(
                  idea
                ) ===
                this.lifecycle.REJECTED
            ).length
          ),

        converted:
          this.numberOrFallback(
            pipeline.convertedIdeas,
            ideas.filter(
              idea =>
                this.getIdeaStatus(
                  idea
                ) ===
                this.lifecycle.CONVERTED
            ).length
          )
      };

      const projectMetrics = {
        total:
          this.numberOrFallback(
            pipeline.totalProjects,
            projects.length
          ),

        active:
          this.numberOrFallback(
            pipeline.activeProjects,
            projects.filter(project =>
              this.isActiveProject(
                project
              )
            ).length
          ),

        completed:
          this.numberOrFallback(
            pipeline.completedProjects,
            projects.filter(project =>
              this.isCompletedProject(
                project
              )
            ).length
          ),

        archived:
          this.numberOrFallback(
            pipeline.archivedProjects,
            projects.filter(
              project =>
                this.getProjectStatus(
                  project
                ) ===
                this.projectStatus.ARCHIVED
            ).length
          ),

        ready:
          projects.filter(
            project =>
              this.getProjectStatus(
                project
              ) ===
              this.projectStatus.READY
          ).length,

        pilot:
          projects.filter(
            project =>
              this.getProjectStatus(
                project
              ) ===
              this.projectStatus.PILOT
          ).length,

        production:
          projects.filter(
            project =>
              this.getProjectStatus(
                project
              ) ===
              this.projectStatus.PRODUCTION
          ).length,

        blocked:
          projects.filter(project =>
            this.isBlockedProject(
              project
            )
          ).length,

        highRisk:
          projects.filter(project =>
            this.isHighRiskProject(
              project
            )
          ).length,

        linkedToIdeas:
          projects.filter(project =>
            Boolean(
              project.sourceIdeaId ??
              project.ideaId ??
              project.origin?.ideaId
            )
          ).length
      };

      projectMetrics.averageProgress =
        this.numberOrFallback(
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
                ) /
                projects.length
              )
            : 0
        );

      projectMetrics.onTrack =
        projects.filter(project =>
          !this.isHighRiskProject(
            project
          ) &&
          !this.isBlockedProject(
            project
          ) &&
          ![
            this.projectStatus.CANCELLED,
            this.projectStatus.ARCHIVED
          ].includes(
            this.getProjectStatus(
              project
            )
          )
        ).length;

      projectMetrics.onTrackRate =
        projects.length
          ? this.normalizePercent(
              (
                projectMetrics.onTrack /
                projects.length
              ) * 100
            )
          : 0;

      const governanceMetrics = {
        total:
          governance.length,

        active:
          governance.filter(item =>
            this.isActiveGovernanceControl(
              item
            )
          ).length
      };

      const pendingApprovals =
        approvals.filter(
          approval =>
            !this.isClosedItem(
              approval
            ) &&
            this.normalizeStatus(
              approval.status
            ) === "pending"
        ).length;

      const alertMetrics = {
        total:
          alerts.filter(
            item =>
              !this.isClosedItem(
                item
              )
          ).length,

        critical:
          alerts.filter(
            item =>
              this.isHighSeverity(
                item
              ) &&
              !this.isClosedItem(
                item
              )
          ).length,

        medium:
          alerts.filter(
            item =>
              this.isMediumSeverity(
                item
              ) &&
              !this.isClosedItem(
                item
              )
          ).length
      };

      const riskMetrics = {
        total:
          risks.length,

        critical:
          risks.filter(
            item =>
              this.isHighSeverity(
                item
              ) &&
              !this.isClosedItem(
                item
              )
          ).length
      };

      const targetIdeas =
        Math.max(
          1,
          this.toSafeNumber(
            summary.targetIdeas ??
            dashboard.targetIdeas,
            this.config.targetIdeas
          )
        );

      const ideaProgress =
        this.normalizePercent(
          (
            ideaMetrics.total /
            targetIdeas
          ) * 100
        );

      const readiness =
        this.calculateReadiness({
          state,
          dashboard,
          summary,
          ideas,
          projects,
          governance,
          projectMetrics
        });

      const systemHealth =
        this.calculateSystemHealth({
          state,
          dashboard,
          summary,
          projects,
          governance,
          alerts,
          risks,
          projectMetrics,
          governanceMetrics,
          alertMetrics,
          riskMetrics
        });

      const operationsHealth =
        this.calculateOperationsHealth({
          state,
          dashboard,
          summary,
          projects,
          projectMetrics,
          alertMetrics
        });

      const conversionRate =
        this.numberOrFallback(
          pipeline.conversionRate,
          ideaMetrics.total
            ? this.normalizePercent(
                (
                  ideaMetrics.converted /
                  ideaMetrics.total
                ) * 100
              )
            : 0
        );

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
        readiness,
        systemHealth,
        operationsHealth,

        roadmapPeriod:
          summary.period ??
          summary.roadmapPeriod ??
          state.strategyMeta
            ?.roadmapPeriod ??
          this.config
            .defaultRoadmapPeriod
      };
    },

    calculateReadiness(context = {}) {
      const explicit =
        this.firstFiniteNumber([
          context.dashboard
            ?.readinessScore,
          context.dashboard
            ?.maturityScore,
          context.summary
            ?.aiReadiness,
          context.summary
            ?.readiness,
          context.summary
            ?.maturityScore
        ]);

      if (
        explicit !== null &&
        explicit > 0
      ) {
        return this.normalizePercent(
          explicit
        );
      }

      const ideaScore =
        context.ideas?.length
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
              ) /
              context.ideas.length
            )
          : 0;

      const projectScore =
        context.projects?.length
          ? this.normalizePercent(
              context.projects.reduce(
                (sum, project) =>
                  sum +
                  this.toSafeNumber(
                    project.readiness ??
                    project.decisionScore ??
                    project.progress ??
                    0
                  ),
                0
              ) /
              context.projects.length
            )
          : 0;

      const governanceScore =
        context.governance?.length
          ? this.normalizePercent(
              (
                context.governance.filter(
                  item =>
                    this.isActiveGovernanceControl(
                      item
                    )
                ).length /
                context.governance.length
              ) * 100
            )
          : 0;

      const scores =
        [
          ideaScore,
          projectScore,
          governanceScore
        ].filter(
          score => score > 0
        );

      return scores.length
        ? Math.round(
            scores.reduce(
              (sum, score) =>
                sum + score,
              0
            ) /
            scores.length
          )
        : 0;
    },

    calculateSystemHealth(
      context = {}
    ) {
      const explicit =
        this.firstFiniteNumber([
          context.dashboard
            ?.platformHealth,
          context.dashboard
            ?.portfolioHealth,
          context.summary
            ?.systemHealth,
          context.summary
            ?.portfolioHealth,
          context.state
            ?.health?.overall
        ]);

      if (
        explicit !== null &&
        explicit > 0
      ) {
        return this.normalizePercent(
          explicit
        );
      }

      const projectHealth =
        context.projects?.length
          ? context.projectMetrics
              ?.onTrackRate || 0
          : 100;

      const governanceHealth =
        context.governance?.length
          ? this.normalizePercent(
              (
                context.governanceMetrics
                  .active /
                context.governance.length
              ) * 100
            )
          : 100;

      const alertPenalty =
        Math.min(
          45,
          (
            context.alertMetrics
              ?.critical || 0
          ) * 12 +
          (
            context.alertMetrics
              ?.medium || 0
          ) * 4
        );

      const riskPenalty =
        Math.min(
          30,
          (
            context.riskMetrics
              ?.critical || 0
          ) * 7
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

    calculateOperationsHealth(
      context = {}
    ) {
      const explicit =
        this.firstFiniteNumber([
          context.summary
            ?.operationsHealth,
          context.summary
            ?.operationalHealth,
          context.state
            ?.operations?.health,
          context.state
            ?.monitoring
            ?.operationsHealth
        ]);

      if (
        explicit !== null &&
        explicit > 0
      ) {
        return this.normalizePercent(
          explicit
        );
      }

      if (
        !context.projects?.length
      ) {
        return context.alertMetrics
          ?.critical
          ? Math.max(
              0,
              100 -
              context.alertMetrics
                .critical *
                15
            )
          : 100;
      }

      const progress =
        context.projectMetrics
          .averageProgress || 0;

      const onTrack =
        context.projectMetrics
          .onTrackRate || 0;

      const blockedPenalty =
        Math.min(
          35,
          context.projectMetrics
            .blocked * 10
        );

      const alertPenalty =
        Math.min(
          35,
          context.alertMetrics
            .critical * 12
        );

      return this.normalizePercent(
        progress * 0.45 +
        onTrack * 0.55 -
        blockedPenalty -
        alertPenalty
      );
    },

    /* =======================================================
       Trend
    ======================================================= */

    getOperationsTrend(metrics) {
      const state =
        metrics.state || {};

      const sources = [
        metrics.summary
          ?.operationsTrend,
        metrics.summary
          ?.operationalTrend,
        state.operationsTrend,
        state.operations?.trend,
        state.monitoring
          ?.operationsTrend,
        state.analytics
          ?.operationsTrend
      ];

      for (const source of sources) {
        const cleaned =
          this.cleanTrend(source);

        if (cleaned.length) {
          return cleaned.slice(
            -this.config
              .maxTrendPoints
          );
        }
      }

      return this.buildDerivedTrend(
        metrics
      );
    },

    cleanTrend(trend) {
      if (!Array.isArray(trend)) {
        return [];
      }

      return trend
        .map(item => {
          if (
            item &&
            typeof item === "object"
          ) {
            return this.normalizePercent(
              item.value ??
              item.health ??
              item.score ??
              item.percentage ??
              0
            );
          }

          return this.normalizePercent(
            item,
            0
          );
        })
        .filter(
          value =>
            Number.isFinite(value)
        );
    },

    buildDerivedTrend(metrics) {
      const current =
        this.normalizePercent(
          metrics.operationsHealth,
          0
        );

      const progress =
        metrics.projectMetrics
          ?.averageProgress || 0;

      const onTrack =
        metrics.projectMetrics
          ?.onTrackRate || 0;

      const readiness =
        metrics.readiness || 0;

      const health =
        metrics.systemHealth || 0;

      return [
        Math.max(0, current - 14),
        Math.max(0, progress - 8),
        Math.max(0, readiness - 6),
        Math.max(0, onTrack - 4),
        Math.max(0, health - 2),
        current,
        Math.min(100, current + 2),
        Math.min(100, current + 1),
        current
      ].map(value =>
        this.normalizePercent(value)
      );
    },

    renderMiniChart(values = []) {
      return values
        .map(value => {
          const height =
            Math.max(
              12,
              Math.min(
                100,
                this.normalizePercent(
                  value
                )
              )
            );

          return `
            <span
              style="height:${height}%"
              title="${height}%"
            ></span>
          `;
        })
        .join("");
    },

    /* =======================================================
       Executive Narrative
    ======================================================= */

    getExecutiveStatus(metrics) {
      const {
        alertMetrics,
        projectMetrics,
        ideaMetrics,
        pendingApprovals,
        operationsHealth,
        systemHealth
      } = metrics;

      if (
        alertMetrics.critical > 0
      ) {
        return {
          tone: "critical",

          title:
            "توجد مؤشرات حرجة تحتاج مراجعة تنفيذية",

          text:
            `يوجد ${alertMetrics.critical} تنبيه حرج مفتوح. ` +
            "الأولوية الحالية هي معالجة المخاطر المرتبطة بالعمليات والمشاريع."
        };
      }

      if (
        projectMetrics.blocked > 0
      ) {
        return {
          tone: "warning",

          title:
            "بعض المشاريع تحتاج تدخلاً لإعادة المسار",

          text:
            `يوجد ${projectMetrics.blocked} مشروع متوقف مؤقتاً. ` +
            `متوسط التقدم الحالي ${projectMetrics.averageProgress}%.`
        };
      }

      if (
        pendingApprovals > 0 ||
        ideaMetrics.pending > 0
      ) {
        return {
          tone: "attention",

          title:
            "مسار الاعتماد يحتاج قراراً إدارياً",

          text:
            `توجد ${Math.max(
              pendingApprovals,
              ideaMetrics.pending
            )} فكرة بانتظار الاعتماد، ` +
            `و${ideaMetrics.converted} فكرة تحولت إلى مشاريع تنفيذية.`
        };
      }

      if (
        operationsHealth >= 80 &&
        systemHealth >= 80
      ) {
        return {
          tone: "stable",

          title:
            "حالة المنصة مستقرة وجاهزة للتوسع المنضبط",

          text:
            `صحة الأنظمة ${systemHealth}% وحالة العمليات ${operationsHealth}%. ` +
            "يمكن التركيز على تسريع المشاريع الأعلى جاهزية."
        };
      }

      return {
        tone: "neutral",

        title:
          "المحفظة في مرحلة بناء الجاهزية التنفيذية",

        text:
          `تم تسجيل ${ideaMetrics.total} فكرة و${projectMetrics.total} مشروع. ` +
          "الأولوية هي رفع الجاهزية وتحسين الربط بين الفرص والتنفيذ."
      };
    },

    /* =======================================================
       Main Render
    ======================================================= */

    render(container) {
      if (
        !container ||
        this._isRendering
      ) {
        return;
      }

      this._isRendering = true;
      this._container = container;

      try {
        this.injectStyles();

        const metrics =
          this.calculateMetrics();

        const {
          ideaMetrics,
          projectMetrics,
          governanceMetrics,
          alertMetrics,
          pendingApprovals,
          departments,
          targetIdeas,
          ideaProgress,
          conversionRate,
          readiness,
          systemHealth,
          operationsHealth,
          roadmapPeriod
        } = metrics;

        const trend =
          this.getOperationsTrend(
            metrics
          );

        const executiveStatus =
          this.getExecutiveStatus(
            metrics
          );

        const departmentsCount =
          departments.length ||
          this.countDistinctDepartments(
            metrics.ideas,
            metrics.projects
          );

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
                <div class="v3-ai-orb">
                  AI
                </div>
              </div>

              <div class="v3-hero-stats">
                <div>
                  <strong>
                    ${ideaMetrics.total}/${targetIdeas}
                    💡
                  </strong>

                  <span>
                    فكرة متخصصة
                  </span>
                </div>

                <div>
                  <strong>
                    ${projectMetrics.total}
                    📁
                  </strong>

                  <span>
                    مشروع تنفيذي
                  </span>
                </div>

                <div>
                  <strong>
                    ${departmentsCount}
                    🛂
                  </strong>

                  <span>
                    محافظ تشغيلية
                  </span>
                </div>

                <div>
                  <strong>
                    ${this.escapeHtml(
                      roadmapPeriod
                    )}
                    🗓️
                  </strong>

                  <span>
                    خارطة زمنية
                  </span>
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
                `${Math.max(
                  ideaMetrics.pending,
                  pendingApprovals
                )} بانتظار الاعتماد`,
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
                <h3>
                  🟢 حالة العمليات البيومترية
                </h3>

                <strong>
                  ${operationsHealth}%
                </strong>

                <p>
                  ${projectMetrics.active}
                  مشاريع نشطة
                  ·
                  ${projectMetrics.onTrackRate}%
                  على المسار
                </p>
              </div>

              <div
                class="v3-mini-chart"
                aria-label="مؤشر حالة العمليات البيومترية"
              >
                ${this.renderMiniChart(
                  trend
                )}
              </div>
            </section>

            <section class="v3-summary-grid">
              <article class="v3-small-panel">
                <h3>
                  🛡️ الحوكمة
                </h3>

                <strong>
                  ${governanceMetrics.active}
                </strong>

                <p>
                  من أصل
                  ${governanceMetrics.total}
                  ضابط رقابي
                </p>
              </article>

              <article class="v3-small-panel">
                <h3>
                  🔔 التنبيهات التنفيذية
                </h3>

                <strong>
                  ${executiveAlertValue}
                </strong>

                <p>
                  ${executiveAlertNote}
                </p>
              </article>
            </section>

            <section class="v3-summary-grid">
              <article class="v3-small-panel">
                <h3>
                  ⏳ مسار الاعتماد
                </h3>

                <strong>
                  ${Math.max(
                    ideaMetrics.pending,
                    pendingApprovals
                  )}
                </strong>

                <p>
                  ${ideaMetrics.approved}
                  معتمدة
                  ·
                  ${ideaMetrics.converted}
                  تحولت إلى مشاريع
                </p>
              </article>

              <article class="v3-small-panel">
                <h3>
                  📁 تسليم المشاريع
                </h3>

                <strong>
                  ${projectMetrics.averageProgress}%
                </strong>

                <p>
                  ${projectMetrics.completed}
                  مكتملة
                  ·
                  ${projectMetrics.blocked}
                  متوقفة
                </p>
              </article>
            </section>

            <section class="v3-summary-grid">
              <article class="v3-small-panel">
                <h3>
                  🔄 معدل التحويل
                </h3>

                <strong>
                  ${conversionRate}%
                </strong>

                <p>
                  من فكرة إلى مشروع تنفيذي
                </p>
              </article>

              <article class="v3-small-panel">
                <h3>
                  🧪 مراحل التشغيل
                </h3>

                <strong>
                  ${projectMetrics.pilot +
                  projectMetrics.production}
                </strong>

                <p>
                  ${projectMetrics.pilot}
                  تجريبية
                  ·
                  ${projectMetrics.production}
                  تشغيل فعلي
                </p>
              </article>
            </section>

            <section class="v3-executive-status ${executiveStatus.tone}">
              <div>
                <span>
                  Executive Status
                </span>

                <h3>
                  ${this.escapeHtml(
                    executiveStatus.title
                  )}
                </h3>

                <p>
                  ${this.escapeHtml(
                    executiveStatus.text
                  )}
                </p>
              </div>

              <div class="v3-executive-status-metrics">
                <div>
                  <small>
                    الأفكار المحولة
                  </small>

                  <strong>
                    ${ideaMetrics.converted}
                  </strong>
                </div>

                <div>
                  <small>
                    المشاريع النشطة
                  </small>

                  <strong>
                    ${projectMetrics.active}
                  </strong>
                </div>

                <div>
                  <small>
                    المخاطر العالية
                  </small>

                  <strong>
                    ${projectMetrics.highRisk}
                  </strong>
                </div>
              </div>
            </section>
          </section>
        `;

        this.bindAutomaticSync();
      } finally {
        this._isRendering = false;
      }
    },

    kpiCard(
      icon,
      label,
      value,
      note,
      tone
    ) {
      return `
        <article class="v3-kpi-card">
          <div class="v3-kpi-icon ${this.escapeHtml(
            tone
          )}">
            ${this.escapeHtml(
              icon
            )}
          </div>

          <div class="v3-kpi-text">
            <h3>
              ${this.escapeHtml(
                label
              )}
            </h3>

            <strong>
              ${this.escapeHtml(
                value
              )}
            </strong>

            <p>
              ${this.escapeHtml(
                note
              )}
            </p>
          </div>
        </article>
      `;
    },

    /* =======================================================
       Synchronization
    ======================================================= */

    scheduleRefresh() {
      window.clearTimeout(
        this._refreshTimer
      );

      this._refreshTimer =
        window.setTimeout(
          () => {
            if (
              !this._container
                ?.isConnected
            ) {
              return;
            }

            this.render(
              this._container
            );
          },
          this.config
            .refreshDelay
        );
    },

    bindAutomaticSync() {
      if (this._syncBound) {
        return;
      }

      this._syncBound = true;

      const refresh =
        () => this.scheduleRefresh();

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
        window.addEventListener(
          eventName,
          refresh
        );
      });

      const store =
        this.getStore();

      if (
        typeof store?.subscribe ===
        "function"
      ) {
        this._unsubscribeStore =
          store.subscribe(
            change => {
              const type =
                change?.type ||
                "";

              if (
                type === "persist" ||
                type ===
                  "settingsPersisted" ||
                type ===
                  "aiw:metadataChanged"
              ) {
                return;
              }

              refresh();
            }
          );
      }
    },

    destroy() {
      window.clearTimeout(
        this._refreshTimer
      );

      if (
        typeof this
          ._unsubscribeStore ===
        "function"
      ) {
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
      if (
        document.getElementById(
          this.config.styleId
        )
      ) {
        return;
      }

      const style =
        document.createElement(
          "style"
        );

      style.id =
        this.config.styleId;

      style.textContent = `
        .v3-executive-status {
          display: grid;
          grid-template-columns:
            minmax(0,1.6fr)
            minmax(240px,.8fr);
          gap: 22px;
          align-items: center;
          margin-top: 18px;
          padding: 22px;
          border:
            1px solid
            rgba(15,23,42,.08);
          border-radius: 24px;
          background: #fff;
          box-shadow:
            0 14px 34px
            rgba(15,23,42,.06);
        }

        .v3-executive-status
        > div:first-child > span {
          display: block;
          margin-bottom: 7px;
          color: #667085;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .08em;
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
          border-color:
            rgba(8,125,62,.2);
          background:
            linear-gradient(
              135deg,
              rgba(226,247,234,.8),
              #fff
            );
        }

        .v3-executive-status.critical {
          border-color:
            rgba(180,35,24,.2);
          background:
            linear-gradient(
              135deg,
              rgba(254,236,235,.85),
              #fff
            );
        }

        .v3-executive-status.warning,
        .v3-executive-status.attention {
          border-color:
            rgba(183,92,0,.2);
          background:
            linear-gradient(
              135deg,
              rgba(255,243,217,.85),
              #fff
            );
        }

        .v3-executive-status-metrics {
          display: grid;
          grid-template-columns:
            repeat(3,minmax(0,1fr));
          gap: 10px;
        }

        .v3-executive-status-metrics
        > div {
          min-width: 0;
          padding: 13px 10px;
          border:
            1px solid
            rgba(15,23,42,.05);
          border-radius: 16px;
          text-align: center;
          background:
            rgba(248,250,252,.92);
        }

        .v3-executive-status-metrics
        small,
        .v3-executive-status-metrics
        strong {
          display: block;
        }

        .v3-executive-status-metrics
        small {
          margin-bottom: 5px;
          color: #667085;
          font-size: 10px;
          line-height: 1.4;
        }

        .v3-executive-status-metrics
        strong {
          color: #101828;
          font-size: 21px;
        }

        @media (max-width:760px) {
          .v3-executive-status {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width:430px) {
          .v3-executive-status-metrics {
            grid-template-columns: 1fr;
          }
        }
      `;

      document.head
        .appendChild(style);
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

    numberOrFallback(
      value,
      fallback = 0
    ) {
      const number =
        Number(value);

      return Number.isFinite(number)
        ? number
        : fallback;
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

    firstFiniteNumber(
      values = []
    ) {
      for (const value of values) {
        const number =
          Number(value);

        if (
          Number.isFinite(number)
        ) {
          return number;
        }
      }

      return null;
    },

    countDistinctDepartments(
      ideas = [],
      projects = []
    ) {
      const departments =
        new Set();

      [
        ...ideas,
        ...projects
      ].forEach(item => {
        const department =
          String(
            item?.department ??
            item?.businessUnit ??
            item?.portfolio ??
            ""
          ).trim();

        if (department) {
          departments.add(
            department
          );
        }
      });

      return departments.size;
    },

    uniqueBy(
      items = [],
      selector
    ) {
      const seen =
        new Set();

      return items.filter(item => {
        const key =
          String(selector(item));

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      });
    },

    hashText(value) {
      const text =
        String(value || "");

      let hash = 0;

      for (
        let index = 0;
        index < text.length;
        index += 1
      ) {
        hash =
          (
            (
              hash << 5
            ) -
            hash
          ) +
          text.charCodeAt(index);

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
