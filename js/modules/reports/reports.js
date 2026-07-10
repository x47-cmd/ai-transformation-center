/* =========================================================
   AI Work - Executive Reports Center V5.1
   Enterprise Biometric Executive Analytics
   Store V2.2 Native Architecture

   File Path:
   js/modules/reports/reports.js

   Fixes in V5.1:
   - Full Store V2.2 alignment
   - Supports native reports object and legacy reportsCenter
   - Correct support for KPI arrays and KPI center objects
   - Correct idea lifecycle and project status analytics
   - Real conversion, approval, project and portfolio metrics
   - Persistent report generation history
   - Governance, risk, decision and automation integration
   - Stable Store subscriptions without unnecessary render loops
   - No direct AIW.Data or localStorage data fallback
   - Existing UI design preserved
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};
  AIW.Modules = AIW.Modules || {};

  AIW.Modules.reports = {
    id: "reports",
    title: "التقارير",
    icon: "📊",
    version: "5.1.0",

    _container: null,
    _unsubscribeStore: null,
    _refreshTimer: null,
    _eventsBound: false,
    _syncBound: false,
    _isRendering: false,
    _isGenerating: false,
    _detailsModal: null,
    _lastContext: null,
    _lastScores: null,

    config: {
      refreshDelay: 90,
      chartDelay: 100,
      maximumHistoryRows: 20,
      styleId: "aiw-reports-v51-styles",
      defaultTitle: "مركز التقارير والتحليلات التنفيذية",
      defaultCycle: "شهري",
      defaultTopDecisionLimit: 5
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
          "AI Work Reports V5.1: AIW.Store is unavailable."
        );
        return {};
      }

      try {
        if (typeof store.getState === "function") {
          const state = store.getState();

          return state && typeof state === "object"
            ? state
            : {};
        }

        if (typeof store.getData === "function") {
          const state = store.getData();

          return state && typeof state === "object"
            ? state
            : {};
        }
      } catch (error) {
        console.error(
          "AI Work Reports V5.1: Unable to read Store state.",
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

    /* =======================================================
       Reports State
    ======================================================= */

    getReportsSource() {
      const state = this.getState();

      if (
        state.reports &&
        typeof state.reports === "object" &&
        !Array.isArray(state.reports)
      ) {
        return state.reports;
      }

      if (
        state.reportsCenter &&
        typeof state.reportsCenter === "object" &&
        !Array.isArray(state.reportsCenter)
      ) {
        return state.reportsCenter;
      }

      return {};
    },

    getReportsCenter() {
      const source = this.getReportsSource();

      return {
        settings: {
          title:
            source.settings?.title ||
            this.config.defaultTitle,

          reportingCycle:
            source.settings?.reportingCycle ||
            this.config.defaultCycle,

          topDecisionLimit:
            Math.max(
              1,
              Math.round(
                this.toSafeNumber(
                  source.settings?.topDecisionLimit,
                  this.config.defaultTopDecisionLimit
                )
              )
            ),

          showCharts:
            source.settings?.showCharts !== false,

          includeAutomation:
            source.settings?.includeAutomation !== false,

          includeDecisionHistory:
            source.settings?.includeDecisionHistory !== false,

          includeKpiHistory:
            source.settings?.includeKpiHistory !== false
        },

        history:
          Array.isArray(source.history)
            ? source.history
                .map((entry, index) =>
                  this.normalizeReportHistory(entry, index)
                )
                .filter(Boolean)
            : [],

        executiveSummary:
          source.executiveSummary &&
          typeof source.executiveSummary === "object"
            ? source.executiveSummary
            : {},

        executiveHighlight:
          source.executiveHighlight &&
          typeof source.executiveHighlight === "object"
            ? source.executiveHighlight
            : {},

        finalRecommendation:
          source.finalRecommendation &&
          typeof source.finalRecommendation === "object"
            ? source.finalRecommendation
            : {},

        meta: {
          createdAt:
            source.meta?.createdAt ||
            null,

          updatedAt:
            source.meta?.updatedAt ||
            null
        }
      };
    },

    normalizeReportHistory(entry, index = 0) {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      return {
        ...entry,

        id:
          entry.id ??
          entry.reportId ??
          `report-${index + 1}`,

        title:
          entry.title ||
          entry.name ||
          "تقرير تنفيذي",

        cycle:
          entry.cycle ||
          entry.reportingCycle ||
          this.config.defaultCycle,

        executiveScore:
          this.normalizePercent(
            entry.executiveScore,
            0
          ),

        ideasCount:
          Math.max(
            0,
            this.toSafeNumber(
              entry.ideasCount,
              0
            )
          ),

        projectsCount:
          Math.max(
            0,
            this.toSafeNumber(
              entry.projectsCount,
              0
            )
          ),

        kpisCount:
          Math.max(
            0,
            this.toSafeNumber(
              entry.kpisCount,
              0
            )
          ),

        risksCount:
          Math.max(
            0,
            this.toSafeNumber(
              entry.risksCount,
              0
            )
          ),

        pendingApprovals:
          Math.max(
            0,
            this.toSafeNumber(
              entry.pendingApprovals,
              0
            )
          ),

        conversionRate:
          this.normalizePercent(
            entry.conversionRate,
            0
          ),

        generatedBy:
          entry.generatedBy ||
          entry.actor ||
          "الإدارة",

        createdAt:
          entry.createdAt ||
          entry.generatedAt ||
          null
      };
    },

    updateReportsCenter(changes = {}) {
      if (!changes || typeof changes !== "object") {
        return {
          success: false,
          message: "بيانات تحديث التقارير غير صالحة."
        };
      }

      const store = this.getStore();

      if (!store) {
        return {
          success: false,
          message: "مخزن البيانات غير متاح."
        };
      }

      const current = this.getReportsCenter();
      const now = new Date().toISOString();

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
          ...(changes.meta || {}),
          createdAt:
            current.meta.createdAt ||
            changes.meta?.createdAt ||
            now,
          updatedAt: now
        }
      };

      try {
        let result = null;

        if (typeof store.set === "function") {
          result = store.set(
            "reports",
            updated,
            {
              event: "aiw:reportsUpdated"
            }
          );
        } else if (typeof store.update === "function") {
          result = store.update(
            "reports",
            updated,
            {
              event: "aiw:reportsUpdated"
            }
          );
        } else if (typeof store.patch === "function") {
          result = store.patch(
            "reports",
            updated,
            {
              event: "aiw:reportsUpdated"
            }
          );
        } else {
          return {
            success: false,
            message: "Store V2.2 لا يدعم تحديث التقارير."
          };
        }

        if (
          result?.success === false ||
          result === false ||
          result === null
        ) {
          return {
            success: false,
            message: "تعذر حفظ بيانات التقرير.",
            result
          };
        }

        return {
          success: true,
          data: updated,
          result
        };
      } catch (error) {
        console.error(
          "AI Work Reports V5.1: updateReportsCenter failed.",
          error
        );

        return {
          success: false,
          message: "تعذر تحديث مركز التقارير.",
          error
        };
      }
    },

    /* =======================================================
       Data Readers
    ======================================================= */

    getIdeas() {
      const store = this.getStore();

      try {
        if (typeof store?.getIdeas === "function") {
          const ideas = store.getIdeas();

          if (Array.isArray(ideas)) {
            return ideas.filter(item => !item?.deletedAt);
          }
        }

        if (typeof store?.getCollection === "function") {
          const ideas = store.getCollection("ideas");

          if (Array.isArray(ideas)) {
            return ideas.filter(item => !item?.deletedAt);
          }
        }
      } catch (error) {
        console.warn(
          "AI Work Reports V5.1: Ideas reader failed.",
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
            return projects.filter(item => !item?.deletedAt);
          }
        }

        if (typeof store?.getCollection === "function") {
          const projects = store.getCollection("projects");

          if (Array.isArray(projects)) {
            return projects.filter(item => !item?.deletedAt);
          }
        }
      } catch (error) {
        console.warn(
          "AI Work Reports V5.1: Projects reader failed.",
          error
        );
      }

      return this.getCollection("projects")
        .filter(item => !item?.deletedAt);
    },

    getPipeline() {
      const store = this.getStore();

      try {
        if (typeof store?.getPipelineStats === "function") {
          const pipeline = store.getPipelineStats();

          if (
            pipeline &&
            typeof pipeline === "object"
          ) {
            return pipeline;
          }
        }
      } catch (error) {
        console.warn(
          "AI Work Reports V5.1: Pipeline reader failed.",
          error
        );
      }

      const state = this.getState();

      return state.pipeline &&
        typeof state.pipeline === "object"
        ? state.pipeline
        : {};
    },

    getRoadmap() {
      const state = this.getState();

      if (Array.isArray(state.roadmap)) {
        return state.roadmap;
      }

      if (Array.isArray(state.strategy?.roadmap)) {
        return state.strategy.roadmap;
      }

      return [];
    },

    getRisks() {
      const state = this.getState();
      const risks = [];

      [
        state.risks,
        state.riskRegister,
        state.governance?.risks,
        state.governanceCenter?.risks
      ].forEach(source => {
        if (Array.isArray(source)) {
          risks.push(...source);
        }
      });

      this.getProjects().forEach(project => {
        if (Array.isArray(project?.risks)) {
          project.risks.forEach((risk, index) => {
            risks.push({
              ...(
                risk && typeof risk === "object"
                  ? risk
                  : {
                      title: String(risk || "خطر")
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
          });
        }

        if (project?.riskLevel || project?.risk) {
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
            sourceId: project.id
          });
        }
      });

      return this.uniqueBy(
        risks,
        risk =>
          risk?.id ||
          [
            risk?.sourceType || "risk",
            risk?.sourceId || "",
            risk?.title ||
              risk?.name ||
              "risk",
            risk?.level || ""
          ].join("-")
      );
    },

    getGovernanceControls() {
      const state = this.getState();

      if (Array.isArray(state.governance)) {
        return state.governance;
      }

      if (
        state.governance &&
        Array.isArray(state.governance.controls)
      ) {
        return state.governance.controls;
      }

      if (Array.isArray(state.controls)) {
        return state.controls;
      }

      if (Array.isArray(state.governanceControls)) {
        return state.governanceControls;
      }

      if (
        state.governanceCenter &&
        Array.isArray(state.governanceCenter.controls)
      ) {
        return state.governanceCenter.controls;
      }

      return [];
    },

    getKpiCenter() {
      const state = this.getState();

      if (Array.isArray(state.kpis)) {
        return {
          items: state.kpis,
          history:
            Array.isArray(state.kpiHistory)
              ? state.kpiHistory
              : []
        };
      }

      const source =
        state.kpis &&
        typeof state.kpis === "object"
          ? state.kpis
          : state.kpiCenter &&
            typeof state.kpiCenter === "object"
            ? state.kpiCenter
            : {};

      return {
        items:
          Array.isArray(source.items)
            ? source.items
            : Array.isArray(source.kpis)
              ? source.kpis
              : [],

        history:
          Array.isArray(source.history)
            ? source.history
            : Array.isArray(source.kpiHistory)
              ? source.kpiHistory
              : Array.isArray(state.kpiHistory)
                ? state.kpiHistory
                : []
      };
    },

    getDecisionCenter() {
      const state = this.getState();

      const source =
        state.decision &&
        typeof state.decision === "object"
          ? state.decision
          : state.decisionCenter &&
            typeof state.decisionCenter === "object"
            ? state.decisionCenter
            : {};

      return {
        scenarios:
          Array.isArray(source.scenarios)
            ? source.scenarios
            : [],

        decisionHistory:
          Array.isArray(source.decisionHistory)
            ? source.decisionHistory
            : Array.isArray(state.decisionHistory)
              ? state.decisionHistory
              : []
      };
    },

    getAutomationCenter() {
      const state = this.getState();

      const source =
        state.automation &&
        typeof state.automation === "object"
          ? state.automation
          : state.automationCenter &&
            typeof state.automationCenter === "object"
            ? state.automationCenter
            : {};

      return {
        workflows:
          Array.isArray(source.workflows)
            ? source.workflows
            : [],

        approvals:
          Array.isArray(source.approvals)
            ? source.approvals
            : [],

        executionHistory:
          Array.isArray(source.executionHistory)
            ? source.executionHistory
            : []
      };
    },

    getDepartments(ideas = [], projects = []) {
      const state = this.getState();

      const configuredDepartments =
        Array.isArray(state.departments)
          ? state.departments
          : [];

      const names = new Set(
        configuredDepartments
          .map(item => item?.name)
          .filter(Boolean)
      );

      ideas.forEach(idea => {
        if (idea?.department) {
          names.add(idea.department);
        }
      });

      projects.forEach(project => {
        if (project?.department) {
          names.add(project.department);
        }
      });

      return [...names].map(name => {
        const configured =
          configuredDepartments.find(
            item => item?.name === name
          ) || {};

        const ideaCount =
          ideas.filter(
            item => item?.department === name
          ).length;

        const projectCount =
          projects.filter(
            item => item?.department === name
          ).length;

        return {
          ...configured,
          name,
          ideaCount,
          projectCount,
          totalCount:
            ideaCount +
            projectCount,
          maturity:
            this.normalizePercent(
              configured.maturity ??
              configured.readiness,
              0
            )
        };
      });
    },

    /* =======================================================
       Lifecycle and Status
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

      if (
        [
          "converted",
          "converted-to-project"
        ].includes(raw)
      ) {
        return this.lifecycle.CONVERTED;
      }

      if (
        [
          "pending",
          "pending-approval"
        ].includes(raw)
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
        تجريبي: this.projectStatus.PILOT,
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

    isHighPriority(item = {}) {
      const value = this.normalizeStatus(
        item.priority ??
        item.priorityLevel ??
        item.level ??
        ""
      );

      return (
        value.includes("عال") ||
        [
          "high",
          "critical",
          "strategic",
          "استراتيجي"
        ].includes(value)
      );
    },

    isMediumPriority(item = {}) {
      const value = this.normalizeStatus(
        item.priority ??
        item.priorityLevel ??
        item.level ??
        ""
      );

      return (
        value.includes("متوسط") ||
        value === "medium"
      );
    },

    isLowPriority(item = {}) {
      const value = this.normalizeStatus(
        item.priority ??
        item.priorityLevel ??
        item.level ??
        ""
      );

      return (
        value.includes("منخفض") ||
        value === "low"
      );
    },

    isQuickWin(item = {}) {
      if (
        item.quickWin === true ||
        item.isQuickWin === true
      ) {
        return true;
      }

      const rawType = this.normalizeStatus(
        item.type ??
        item.category ??
        item.status ??
        ""
      );

      if (
        [
          "quick-win",
          "quickwin"
        ].includes(rawType)
      ) {
        return true;
      }

      const ease = this.normalizeStatus(
        item.ease ??
        item.difficulty ??
        item.complexity ??
        ""
      );

      const cost = this.normalizeStatus(
        item.cost ??
        item.costLevel ??
        ""
      );

      return (
        [
          "easy",
          "low",
          "سهلة",
          "سهل",
          "منخفضة",
          "منخفض"
        ].includes(ease) &&
        [
          "low",
          "منخفضة",
          "منخفض"
        ].includes(cost)
      );
    },

    isPendingIdea(idea = {}) {
      return [
        this.lifecycle.SUBMITTED,
        this.lifecycle.PENDING
      ].includes(
        this.getIdeaStatus(idea)
      );
    },

    isConvertedIdea(idea = {}) {
      return (
        this.getIdeaStatus(idea) ===
        this.lifecycle.CONVERTED
      );
    },

    isClosedStatus(status) {
      return [
        "closed",
        "resolved",
        "completed",
        "approved",
        "cancelled",
        "archived",
        "مغلق",
        "تم-الحل",
        "مكتمل",
        "معتمد",
        "ملغي",
        "مؤرشف"
      ].includes(
        this.normalizeStatus(status)
      );
    },

    isHighRisk(level) {
      const value = this.normalizeStatus(level);

      return (
        value.includes("عال") ||
        [
          "high",
          "critical",
          "حرج"
        ].includes(value)
      );
    },

    /* =======================================================
       KPI and Scores
    ======================================================= */

    getKpiProgress(kpi) {
      if (typeof kpi === "string") {
        return 0;
      }

      try {
        if (
          typeof window.AIW?.Modules?.kpis?.progress ===
          "function"
        ) {
          return this.normalizePercent(
            window.AIW.Modules.kpis.progress(kpi),
            0
          );
        }
      } catch (error) {
        console.warn(
          "AI Work Reports V5.1: KPI progress failed.",
          error
        );
      }

      const current = this.toSafeNumber(
        kpi?.current ??
        kpi?.value,
        0
      );

      const target = this.toSafeNumber(
        kpi?.target,
        0
      );

      const baseline = this.toSafeNumber(
        kpi?.baseline,
        current
      );

      if (
        this.normalizeStatus(kpi?.direction) ===
        "lower"
      ) {
        if (target === 0) {
          if (current <= 0) {
            return 100;
          }

          if (baseline > 0) {
            return this.normalizePercent(
              (
                (baseline - current) /
                baseline
              ) * 100
            );
          }

          return 0;
        }

        if (current <= target) {
          return 100;
        }

        if (baseline > target) {
          const required =
            baseline - target;

          if (required > 0) {
            return this.normalizePercent(
              (
                (baseline - current) /
                required
              ) * 100
            );
          }
        }

        return this.normalizePercent(
          (
            target /
            Math.max(current, 1)
          ) * 100
        );
      }

      if (target <= 0) {
        return current > 0
          ? 100
          : 0;
      }

      return this.normalizePercent(
        (
          current /
          target
        ) * 100
      );
    },

    calculateRiskScore(risks = []) {
      if (!risks.length) {
        return 100;
      }

      const penalty = risks.reduce(
        (total, risk) => {
          if (
            this.isClosedStatus(
              risk?.status
            )
          ) {
            return total;
          }

          const level =
            risk?.level ??
            risk?.riskLevel ??
            risk?.severity ??
            "";

          if (this.isHighRisk(level)) {
            return total + 12;
          }

          const normalized =
            this.normalizeStatus(level);

          if (
            normalized.includes("متوسط") ||
            normalized === "medium"
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

    calculateGovernanceScore(controls = []) {
      if (!controls.length) {
        return 0;
      }

      const active = controls.filter(control => {
        if (typeof control === "string") {
          return Boolean(control.trim());
        }

        if (
          control?.enabled === true ||
          control?.active === true
        ) {
          return true;
        }

        const status = this.normalizeStatus(
          control?.status ??
          control?.state ??
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
          "نشط",
          "مفعل",
          "مفعّل",
          "معتمد",
          "مطبق",
          "مطبّق"
        ].includes(status);
      }).length;

      return this.normalizePercent(
        (
          active /
          controls.length
        ) * 100
      );
    },

    calculateProjectScore(projects = []) {
      const activeProjects = projects.filter(
        project =>
          ![
            this.projectStatus.CANCELLED,
            this.projectStatus.ARCHIVED
          ].includes(
            this.getProjectStatus(project)
          )
      );

      if (!activeProjects.length) {
        return 0;
      }

      return this.average(
        activeProjects.map(project =>
          this.normalizePercent(
            project.progress ??
            project.readiness ??
            project.score,
            0
          )
        )
      );
    },

    calculateDecisionScore(decisionCenter) {
      const history =
        decisionCenter.decisionHistory;

      if (history.length) {
        const resolved = history.filter(item =>
          [
            "approved",
            "rejected",
            "accepted",
            "declined",
            "معتمد",
            "مرفوض"
          ].includes(
            this.normalizeStatus(
              item.status
            )
          )
        );

        if (!resolved.length) {
          return 0;
        }

        const approved = resolved.filter(item =>
          [
            "approved",
            "accepted",
            "معتمد"
          ].includes(
            this.normalizeStatus(
              item.status
            )
          )
        ).length;

        return this.normalizePercent(
          (
            approved /
            resolved.length
          ) * 100
        );
      }

      if (decisionCenter.scenarios.length) {
        return this.average(
          decisionCenter.scenarios.map(item =>
            this.normalizePercent(
              item.score ??
              item.decisionScore ??
              0,
              0
            )
          )
        );
      }

      return 0;
    },

    calculateAutomationScore(automationCenter) {
      const history =
        automationCenter.executionHistory;

      if (history.length) {
        const completed = history.filter(entry =>
          [
            "completed",
            "success",
            "successful",
            "مكتمل",
            "ناجح"
          ].includes(
            this.normalizeStatus(
              entry.status
            )
          )
        ).length;

        return this.normalizePercent(
          (
            completed /
            history.length
          ) * 100
        );
      }

      if (automationCenter.workflows.length) {
        return this.average(
          automationCenter.workflows.map(item =>
            this.normalizePercent(
              item.automation ??
              item.progress ??
              0,
              0
            )
          )
        );
      }

      return 0;
    },

    getScores(context) {
      const ideaScore = context.ideas.length
        ? this.average(
            context.ideas.map(idea =>
              this.normalizePercent(
                idea.decisionScore,
                this.isHighPriority(idea)
                  ? 75
                  : this.isMediumPriority(idea)
                    ? 60
                    : 45
              )
            )
          )
        : 0;

      const projectScore =
        this.calculateProjectScore(
          context.projects
        );

      const maturityScore =
        context.departments.length
          ? this.average(
              context.departments.map(
                item => item.maturity
              )
            )
          : 0;

      const kpiScore =
        context.kpis.length
          ? this.average(
              context.kpis.map(kpi =>
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
          context.controls
        );

      const decisionScore =
        this.calculateDecisionScore(
          context.decisionCenter
        );

      const automationScore =
        this.calculateAutomationScore(
          context.automationCenter
        );

      const availableScores = [
        ideaScore,
        projectScore,
        maturityScore,
        kpiScore,
        riskScore,
        governanceScore,
        decisionScore,
        automationScore
      ].filter(score => score > 0);

      return {
        executiveScore:
          availableScores.length
            ? this.average(availableScores)
            : 0,

        ideaScore,
        projectScore,
        maturityScore,
        kpiScore,
        riskScore,
        governanceScore,
        decisionScore,
        automationScore
      };
    },

    /* =======================================================
       Narrative
    ======================================================= */

    buildExecutiveSummary(context, scores) {
      const pendingIdeas =
        context.ideas.filter(
          idea => this.isPendingIdea(idea)
        ).length;

      const convertedIdeas =
        context.ideas.filter(
          idea => this.isConvertedIdea(idea)
        ).length;

      const openHighRisks =
        context.risks.filter(
          risk =>
            this.isHighRisk(
              risk.level ??
              risk.riskLevel ??
              risk.severity
            ) &&
            !this.isClosedStatus(
              risk.status
            )
        ).length;

      let title =
        "المحفظة تحتاج إلى استكمال القياس والحوكمة قبل التوسع.";

      if (
        scores.executiveScore >= 75 &&
        openHighRisks === 0
      ) {
        title =
          "المحفظة جاهزة للانتقال إلى موجة تنفيذ وتوسع مدروسة.";
      } else if (
        scores.executiveScore >= 55
      ) {
        title =
          "المحفظة تمتلك أساساً مناسباً للتنفيذ المرحلي مع متابعة المخاطر.";
      }

      return {
        title,

        description:
          `تضم المنصة ${context.ideas.length} فكرة و${context.projects.length} مشروعاً، ` +
          `منها ${pendingIdeas} أفكار بانتظار الاعتماد و${convertedIdeas} أفكار تحولت إلى مشاريع. ` +
          `بلغ متوسط مؤشرات الأداء ${scores.kpiScore}%، بينما توجد ${openHighRisks} مخاطر عالية مفتوحة.`
      };
    },

    buildExecutiveHighlight(context, scores) {
      if (scores.kpiScore < 50) {
        return {
          title:
            "الأولوية الحالية: رفع جودة القياس",

          description:
            "يجب تحديث قيم المؤشرات وربطها بخطوط أساس ومستهدفات قبل اتخاذ قرارات توسع جديدة."
        };
      }

      if (scores.riskScore < 60) {
        return {
          title:
            "الأولوية الحالية: إغلاق المخاطر العالية",

          description:
            "تحتاج المحفظة إلى معالجة المخاطر المفتوحة وتوثيق القرارات البشرية قبل التوسع التشغيلي."
        };
      }

      if (scores.projectScore < 60) {
        return {
          title:
            "الأولوية الحالية: تسريع جاهزية المشاريع",

          description:
            "المشاريع المعتمدة تحتاج إلى خطط تنفيذ ومالكين ومؤشرات واضحة لرفع الجاهزية."
        };
      }

      return {
        title:
          "الأولوية الحالية: التوسع المنضبط",

        description:
          "المؤشرات والمخاطر في وضع مناسب للانتقال إلى توسع مرحلي مع استمرار المراقبة."
      };
    },

    buildFinalRecommendation(context, scores) {
      const quickWins = context.ideas.filter(
        idea => this.isQuickWin(idea)
      );

      if (quickWins.length) {
        return {
          title:
            `البدء بأفضل ${Math.min(3, quickWins.length)} فرص Quick Wins`,

          description:
            "ابدأ بالمبادرات الأسرع والأقل تعقيداً، واربط كل مبادرة بمؤشر ومالك وقرار مراجعة واضح."
        };
      }

      if (scores.kpiScore < 50) {
        return {
          title:
            "تحديث مؤشرات الأداء قبل إطلاق مبادرات جديدة",

          description:
            "التوصية هي استكمال بيانات المؤشرات وخطوط الأساس حتى تصبح القرارات مبنية على بيانات قابلة للقياس."
        };
      }

      return {
        title:
          "الانتقال إلى موجة تنفيذ مرحلية",

        description:
          "اختيار المشاريع الأعلى جاهزية والأقل مخاطرة، ثم مراجعة النتائج بعد أول دورة قياس."
      };
    },

    getRecommendations(context, scores) {
      const executive = [];
      const actions = [];

      const pendingIdeas =
        context.ideas.filter(
          idea => this.isPendingIdea(idea)
        ).length;

      const highRisks =
        context.risks.filter(
          risk =>
            this.isHighRisk(
              risk.level ??
              risk.riskLevel ??
              risk.severity
            ) &&
            !this.isClosedStatus(
              risk.status
            )
        ).length;

      if (pendingIdeas > 0) {
        executive.push(
          `حسم ${pendingIdeas} أفكار بانتظار الاعتماد لتسريع دورة المحفظة.`
        );
      }

      if (highRisks > 0) {
        executive.push(
          `إغلاق أو معالجة ${highRisks} مخاطر عالية قبل التوسع.`
        );
      }

      if (scores.kpiScore < 60) {
        executive.push(
          "رفع جودة تحديث مؤشرات الأداء وربطها بالمشاريع والقرارات."
        );
      }

      if (scores.automationScore < 60) {
        actions.push(
          "تحليل سجل تنفيذ الأتمتة ورفع نسبة العمليات الناجحة."
        );
      }

      if (scores.projectScore < 60) {
        actions.push(
          "تحديد خطة تنفيذ ومالك ومؤشر لكل مشروع منخفض الجاهزية."
        );
      }

      if (scores.governanceScore < 70) {
        actions.push(
          "تفعيل الضوابط غير النشطة وتوثيق المراجعات البشرية."
        );
      }

      actions.push(
        "تحديث التقرير بعد كل دورة قياس أو قرار تنفيذي جوهري."
      );

      if (!executive.length) {
        executive.push(
          "المحفظة في وضع مستقر ويمكن الانتقال إلى التوسع المرحلي."
        );
      }

      return {
        ceo: executive.slice(0, 6),
        nextActions: actions.slice(0, 6)
      };
    },

    /* =======================================================
       Report Generation
    ======================================================= */

    generateReportSnapshot(context, scores) {
      if (this._isGenerating) {
        return {
          success: false,
          message: "يتم إنشاء التقرير حالياً."
        };
      }

      if (!context || !scores) {
        return {
          success: false,
          message: "بيانات التقرير غير جاهزة."
        };
      }

      this._isGenerating = true;

      try {
        const center =
          this.getReportsCenter();

        const now =
          new Date().toISOString();

        const entry =
          this.normalizeReportHistory(
            {
              id: this.createId("report"),
              title: center.settings.title,
              cycle: center.settings.reportingCycle,
              executiveScore: scores.executiveScore,
              ideasCount: context.ideas.length,
              projectsCount: context.projects.length,
              kpisCount: context.kpis.length,
              risksCount: context.risks.length,
              pendingApprovals:
                context.pendingApprovals,
              conversionRate:
                context.conversionRate,
              generatedBy: "الإدارة",
              createdAt: now
            },
            center.history.length
          );

        const history = [
          ...center.history,
          entry
        ].slice(
          -this.config.maximumHistoryRows
        );

        const result =
          this.updateReportsCenter({
            history
          });

        return result.success
          ? {
              success: true,
              report: entry
            }
          : result;
      } finally {
        this._isGenerating = false;
      }
    },

    /* =======================================================
       Main Render
    ======================================================= */

    render(container) {
      if (!container || this._isRendering) {
        return;
      }

      this._isRendering = true;
      this._container = container;

      try {
        this.injectStyles();

        const widgets =
          window.AIW?.Widgets;

        const reportsCenter =
          this.getReportsCenter();

        const ideas =
          this.getIdeas();

        const projects =
          this.getProjects();

        const pipeline =
          this.getPipeline();

        const roadmap =
          this.getRoadmap();

        const risks =
          this.getRisks();

        const controls =
          this.getGovernanceControls();

        const kpiCenter =
          this.getKpiCenter();

        const decisionCenter =
          this.getDecisionCenter();

        const automationCenter =
          this.getAutomationCenter();

        const departments =
          this.getDepartments(
            ideas,
            projects
          );

        const quickWins =
          ideas.filter(
            idea => this.isQuickWin(idea)
          );

        const highIdeas =
          ideas.filter(
            idea => this.isHighPriority(idea)
          ).length;

        const mediumIdeas =
          ideas.filter(
            idea => this.isMediumPriority(idea)
          ).length;

        const lowIdeas =
          ideas.filter(
            idea => this.isLowPriority(idea)
          ).length;

        const pendingApprovals =
          this.numberOrFallback(
            pipeline.pendingIdeas,
            ideas.filter(
              idea => this.isPendingIdea(idea)
            ).length
          );

        const convertedIdeas =
          this.numberOrFallback(
            pipeline.convertedIdeas,
            ideas.filter(
              idea => this.isConvertedIdea(idea)
            ).length
          );

        const conversionRate =
          this.numberOrFallback(
            pipeline.conversionRate,
            ideas.length
              ? this.normalizePercent(
                  (
                    convertedIdeas /
                    ideas.length
                  ) * 100
                )
              : 0
          );

        const activeProjects =
          this.numberOrFallback(
            pipeline.activeProjects,
            projects.filter(
              project =>
                this.isActiveProject(project)
            ).length
          );

        const completedProjects =
          this.numberOrFallback(
            pipeline.completedProjects,
            projects.filter(
              project =>
                this.isCompletedProject(project)
            ).length
          );

        const context = {
          ideas,
          projects,
          pipeline,
          roadmap,
          risks,
          controls,
          kpis: kpiCenter.items,
          kpiHistory: kpiCenter.history,
          departments,
          quickWins,
          decisionCenter,
          automationCenter,
          pendingApprovals,
          convertedIdeas,
          conversionRate,
          activeProjects,
          completedProjects
        };

        const scores =
          this.getScores(context);

        const executiveSummary =
          this.buildExecutiveSummary(
            context,
            scores
          );

        const executiveHighlight =
          this.buildExecutiveHighlight(
            context,
            scores
          );

        const finalRecommendation =
          this.buildFinalRecommendation(
            context,
            scores
          );

        const recommendations =
          this.getRecommendations(
            context,
            scores
          );

        const topDecisions =
          this.getTopDecisions(
            context,
            reportsCenter.settings.topDecisionLimit
          );

        const maximumDepartmentCount =
          Math.max(
            1,
            ...departments.map(
              item => item.totalCount
            )
          );

        const avgMaturity =
          departments.length
            ? this.average(
                departments.map(
                  item => item.maturity
                )
              )
            : 0;

        container.innerHTML = `
          <section class="module-page">
            ${
              typeof widgets?.hero === "function"
                ? widgets.hero({
                    kicker:
                      "Executive Reports · Biometric Analytics",

                    title:
                      reportsCenter.settings.title,

                    description:
                      "تقرير تنفيذي حي يعتمد على الأفكار والمشاريع والمؤشرات والقرارات والأتمتة والحوكمة والمخاطر داخل Store V2.2.",

                    chips: [
                      "👁️ Biometric Analytics",
                      `🧠 Executive Score ${scores.executiveScore}%`,
                      `🔄 Conversion ${conversionRate}%`,
                      `🚀 ${quickWins.length} Quick Wins`,
                      `📝 ${reportsCenter.history.length} تقارير محفوظة`
                    ]
                  })
                : this.fallbackHero(
                    scores.executiveScore,
                    quickWins.length,
                    risks.length,
                    reportsCenter.history.length,
                    conversionRate
                  )
            }

            <div class="module-grid">
              ${this.kpi(
                "Executive Score",
                `${scores.executiveScore}%`,
                "Executive Health"
              )}

              ${this.kpi(
                "الأفكار",
                ideas.length,
                `${pendingApprovals} بانتظار الاعتماد`
              )}

              ${this.kpi(
                "المشاريع",
                projects.length,
                `${activeProjects} نشطة`
              )}

              ${this.kpi(
                "معدل التحويل",
                `${conversionRate}%`,
                `${convertedIdeas} أفكار محولة`
              )}

              ${this.kpi(
                "KPI Score",
                `${scores.kpiScore}%`,
                "Performance"
              )}

              ${this.kpi(
                "المخاطر",
                risks.length,
                "Risk Register"
              )}
            </div>

            <div class="reports-action-bar">
              <button
                type="button"
                class="report-action-button primary"
                data-report-action="generate"
              >
                📝 حفظ نسخة التقرير
              </button>

              <button
                type="button"
                class="report-action-button secondary"
                data-report-action="open-kpis"
              >
                📈 فتح المؤشرات
              </button>

              <button
                type="button"
                class="report-action-button secondary"
                data-report-action="open-decision"
              >
                🧭 فتح القرار
              </button>
            </div>

            <div class="module-wide-grid">
              <div class="module-panel">
                ${this.sectionTitle(
                  "الخلاصة التنفيذية",
                  "قراءة ديناميكية لحالة المنصة الحالية."
                )}

                <div class="report-ultimate-summary">
                  <strong>
                    ${this.escapeHtml(
                      executiveSummary.title
                    )}
                  </strong>

                  <p>
                    ${this.escapeHtml(
                      executiveSummary.description
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
                      <span>Projects</span>
                      <b>${scores.projectScore}%</b>
                    </div>

                    <div>
                      <span>KPI</span>
                      <b>${scores.kpiScore}%</b>
                    </div>

                    <div>
                      <span>Risk</span>
                      <b>${scores.riskScore}%</b>
                    </div>
                  </div>
                </div>
              </div>

              <div class="module-panel">
                ${this.sectionTitle(
                  "Executive Highlights",
                  "أهم رسالة تنفيذية من البيانات الحالية."
                )}

                <div class="report-ai-card">
                  <strong>
                    ${this.escapeHtml(
                      executiveHighlight.title
                    )}
                  </strong>

                  <p>
                    ${this.escapeHtml(
                      executiveHighlight.description
                    )}
                  </p>

                  <div class="report-highlight-metrics">
                    <span>
                      Governance ${scores.governanceScore}%
                    </span>

                    <span>
                      Decision ${scores.decisionScore}%
                    </span>

                    <span>
                      Automation ${scores.automationScore}%
                    </span>
                  </div>
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
                        "تصنيف الأفكار حسب الأولوية."
                      )}

                      <div class="report-chart-card">
                        <canvas id="reportsPriorityChart"></canvas>
                      </div>
                    </div>

                    <div class="module-panel">
                      ${this.sectionTitle(
                        "صحة المنصة",
                        "المؤشرات التنفيذية الرئيسية."
                      )}

                      <div class="report-chart-card">
                        <canvas id="reportsHealthChart"></canvas>
                      </div>
                    </div>
                  </div>
                `
                : ""
            }

            <div class="module-wide-grid">
              <div class="module-panel">
                ${this.sectionTitle(
                  "توزيع المحفظة",
                  "توزيع الأفكار والمشاريع على المحافظ."
                )}

                ${
                  departments.length
                    ? `
                      <div class="report-bars">
                        ${departments
                          .map(department => {
                            const width =
                              this.normalizePercent(
                                (
                                  department.totalCount /
                                  maximumDepartmentCount
                                ) * 100
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
                                    ${department.ideaCount} أفكار
                                    ·
                                    ${department.projectCount} مشاريع
                                  </span>
                                </div>

                                <div class="report-bar">
                                  <i style="width:${width}%"></i>
                                </div>
                              </div>
                            `;
                          })
                          .join("")}
                      </div>
                    `
                    : this.emptyState(
                        "لا توجد محافظ تشغيلية مسجلة."
                      )
                }
              </div>

              <div class="module-panel">
                ${this.sectionTitle(
                  "جاهزية المحافظ",
                  "مقارنة جاهزية النطاقات التشغيلية."
                )}

                ${
                  departments.length
                    ? `
                      <div class="report-bars">
                        ${departments
                          .map(department => `
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
                                <i style="width:${department.maturity}%"></i>
                              </div>
                            </div>
                          `)
                          .join("")}
                      </div>
                    `
                    : this.emptyState(
                        "لا توجد بيانات جاهزية للمحافظ."
                      )
                }
              </div>
            </div>

            <div class="module-panel">
              ${this.sectionTitle(
                "Decision Intelligence",
                "أعلى الفرص والمشاريع والقرارات حسب التقييم."
              )}

              ${this.renderTopDecisions(
                topDecisions
              )}
            </div>

            <div class="module-panel">
              ${this.sectionTitle(
                "تحليل الأولويات",
                "قراءة سريعة لتوزيع محفظة الأفكار."
              )}

              <div class="report-insight-grid">
                <div class="report-insight-card">
                  <span>عالية الأولوية</span>
                  <strong>${highIdeas}</strong>
                  <p>تحتاج مراجعة وتنفيذاً مبكراً.</p>
                </div>

                <div class="report-insight-card">
                  <span>متوسطة الأولوية</span>
                  <strong>${mediumIdeas}</strong>
                  <p>مناسبة للموجة الثانية.</p>
                </div>

                <div class="report-insight-card">
                  <span>منخفضة الأولوية</span>
                  <strong>${lowIdeas}</strong>
                  <p>يمكن جدولتها ضمن تحسينات لاحقة.</p>
                </div>

                <div class="report-insight-card">
                  <span>Quick Wins</span>
                  <strong>${quickWins.length}</strong>
                  <p>أفضل فرص للبدء السريع.</p>
                </div>
              </div>
            </div>

            <div class="module-wide-grid">
              <div class="module-panel">
                ${this.sectionTitle(
                  "Decision History",
                  "آخر القرارات التنفيذية المسجلة."
                )}

                ${this.renderDecisionHistory(
                  decisionCenter.decisionHistory
                )}
              </div>

              <div class="module-panel">
                ${this.sectionTitle(
                  "KPI History",
                  "آخر تحديثات مؤشرات الأداء."
                )}

                ${this.renderKpiHistory(
                  kpiCenter.history,
                  kpiCenter.items
                )}
              </div>
            </div>

            ${
              reportsCenter.settings.includeAutomation
                ? `
                  <div class="module-panel">
                    ${this.sectionTitle(
                      "Automation Execution Summary",
                      "ملخص سجل تنفيذ الأتمتة."
                    )}

                    ${this.renderAutomationHistory(
                      automationCenter.executionHistory
                    )}
                  </div>
                `
                : ""
            }

            <div class="module-panel">
              ${this.sectionTitle(
                "خارطة الطريق",
                "مراحل التنفيذ والتقدم."
              )}

              ${this.renderRoadmap(roadmap)}
            </div>

            <div class="module-wide-grid">
              <div class="module-panel">
                ${this.sectionTitle(
                  "Top Executive Priorities",
                  "أهم أولويات الإدارة."
                )}

                ${this.renderExecutiveList(
                  recommendations.ceo
                )}
              </div>

              <div class="module-panel">
                ${this.sectionTitle(
                  "Next Best Actions",
                  "الإجراءات العملية التالية."
                )}

                ${this.renderExecutiveList(
                  recommendations.nextActions
                )}
              </div>
            </div>

            <div class="module-panel">
              ${this.sectionTitle(
                "توصية التقرير",
                "القرار العملي المقترح."
              )}

              <div class="report-recommendation">
                <strong>
                  ${this.escapeHtml(
                    finalRecommendation.title
                  )}
                </strong>

                <p>
                  ${this.escapeHtml(
                    finalRecommendation.description
                  )}
                </p>

                <div class="aiw-chip-row">
                  <span class="aiw-chip">
                    جاهزية المحافظ ${avgMaturity}%
                  </span>

                  <span class="aiw-chip">
                    مشاريع مكتملة ${completedProjects}
                  </span>

                  <span class="aiw-chip">
                    دورة التقرير ${this.escapeHtml(
                      reportsCenter.settings.reportingCycle
                    )}
                  </span>

                  <span class="aiw-chip">
                    ${reportsCenter.history.length} نسخ محفوظة
                  </span>
                </div>
              </div>
            </div>

            <div class="module-panel">
              ${this.sectionTitle(
                "Report Generation History",
                "النسخ التنفيذية المحفوظة."
              )}

              ${this.renderReportHistory(
                reportsCenter.history
              )}
            </div>
          </section>
        `;

        if (reportsCenter.settings.showCharts) {
          this.renderCharts({
            highIdeas,
            mediumIdeas,
            lowIdeas,
            scores
          });
        }

        this._lastContext = context;
        this._lastScores = scores;

        this.bindActionEvents();
        this.bindAutomaticSync();
      } finally {
        this._isRendering = false;
      }
    },

    /* =======================================================
       Decision Intelligence
    ======================================================= */

    getTopDecisions(context, limit) {
      const ideaItems =
        context.ideas.map(idea => ({
          id: `idea-${idea.id}`,
          type: "فكرة",
          title:
            idea.title ||
            "فكرة غير مسماة",
          subtitle:
            idea.department ||
            "غير مصنف",
          score:
            this.normalizePercent(
              idea.decisionScore,
              this.isHighPriority(idea)
                ? 75
                : 55
            )
        }));

      const projectItems =
        context.projects.map(project => ({
          id: `project-${project.id}`,
          type: "مشروع",
          title:
            project.title ||
            "مشروع غير مسمى",
          subtitle:
            project.department ||
            "غير مصنف",
          score:
            this.normalizePercent(
              project.progress ??
              project.readiness ??
              project.score,
              0
            )
        }));

      const decisionItems =
        context.decisionCenter
          .decisionHistory
          .map(decision => ({
            id:
              `decision-${decision.id || this.createId("history")}`,
            type: "قرار",
            title:
              decision.title ||
              decision.subject ||
              "قرار تنفيذي",
            subtitle:
              decision.status ||
              "مسجل",
            score:
              this.normalizePercent(
                decision.score ??
                decision.decisionScore,
                [
                  "approved",
                  "accepted",
                  "معتمد"
                ].includes(
                  this.normalizeStatus(
                    decision.status
                  )
                )
                  ? 100
                  : 50
              )
          }));

      return [
        ...ideaItems,
        ...projectItems,
        ...decisionItems
      ]
        .sort((a, b) =>
          b.score - a.score
        )
        .slice(0, limit);
    },

    renderTopDecisions(items = []) {
      if (!items.length) {
        return this.emptyState(
          "لا توجد عناصر مصنفة لاتخاذ القرار."
        );
      }

      return `
        <div class="report-decision-grid">
          ${items
            .map((item, index) => `
              <article class="report-decision-card">
                <b>
                  ${String(index + 1).padStart(2, "0")}
                </b>

                <span class="report-decision-type">
                  ${this.escapeHtml(item.type)}
                </span>

                <strong>
                  ${this.escapeHtml(item.title)}
                </strong>

                <span>
                  ${this.escapeHtml(item.subtitle)}
                </span>

                <div class="aiw-progress">
                  <div style="width:${item.score}%"></div>
                </div>

                <small>
                  Score: ${item.score}%
                </small>
              </article>
            `)
            .join("")}
        </div>
      `;
    },

    /* =======================================================
       Histories
    ======================================================= */

    renderDecisionHistory(history = []) {
      if (!history.length) {
        return this.emptyState(
          "لا يوجد سجل قرارات حالياً."
        );
      }

      return `
        <div class="report-history-list">
          ${[...history]
            .reverse()
            .slice(0, 8)
            .map(item => `
              <div class="report-history-row">
                <span>🧭</span>

                <div>
                  <strong>
                    ${this.escapeHtml(
                      item.title ||
                      item.subject ||
                      "قرار تنفيذي"
                    )}
                  </strong>

                  <small>
                    ${this.escapeHtml(
                      item.actor ||
                      item.decidedBy ||
                      "الإدارة"
                    )}
                  </small>
                </div>

                <div>
                  <b>
                    ${this.escapeHtml(
                      item.status ||
                      "مسجل"
                    )}
                  </b>

                  <small>
                    ${this.escapeHtml(
                      this.formatDateTime(
                        item.createdAt ??
                        item.decidedAt,
                        "غير محدد"
                      )
                    )}
                  </small>
                </div>
              </div>
            `)
            .join("")}
        </div>
      `;
    },

    renderKpiHistory(history = [], items = []) {
      if (!history.length) {
        return this.emptyState(
          "لا يوجد سجل تحديث للمؤشرات."
        );
      }

      return `
        <div class="report-history-list">
          ${[...history]
            .reverse()
            .slice(0, 8)
            .map(entry => {
              const kpi = items.find(
                item =>
                  String(item?.id) ===
                  String(entry?.kpiId)
              );

              return `
                <div class="report-history-row">
                  <span>📈</span>

                  <div>
                    <strong>
                      ${this.escapeHtml(
                        kpi?.title ||
                        kpi?.name ||
                        entry?.title ||
                        "مؤشر أداء"
                      )}
                    </strong>

                    <small>
                      ${this.escapeHtml(
                        entry?.actor ||
                        "الإدارة"
                      )}
                    </small>
                  </div>

                  <div>
                    <b>
                      ${this.escapeHtml(
                        `${entry?.value ?? 0} ${kpi?.unit || entry?.unit || ""}`.trim()
                      )}
                    </b>

                    <small>
                      ${this.escapeHtml(
                        this.formatDateTime(
                          entry?.createdAt,
                          "غير محدد"
                        )
                      )}
                    </small>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    },

    renderAutomationHistory(history = []) {
      if (!history.length) {
        return this.emptyState(
          "لا يوجد سجل تنفيذ للأتمتة."
        );
      }

      return `
        <div class="report-history-list automation">
          ${[...history]
            .reverse()
            .slice(0, 10)
            .map(entry => `
              <div class="report-history-row">
                <span>⚙️</span>

                <div>
                  <strong>
                    ${this.escapeHtml(
                      entry.workflowTitle ||
                      entry.title ||
                      "تنفيذ Workflow"
                    )}
                  </strong>

                  <small>
                    ${this.escapeHtml(
                      entry.trigger ||
                      entry.event ||
                      entry.action ||
                      "تشغيل آلي"
                    )}
                  </small>
                </div>

                <div>
                  <b>
                    ${this.escapeHtml(
                      entry.status ||
                      "مسجل"
                    )}
                  </b>

                  <small>
                    ${this.escapeHtml(
                      this.formatDateTime(
                        entry.createdAt ??
                        entry.startedAt ??
                        entry.completedAt,
                        "غير محدد"
                      )
                    )}
                  </small>
                </div>
              </div>
            `)
            .join("")}
        </div>
      `;
    },

    renderReportHistory(history = []) {
      if (!history.length) {
        return this.emptyState(
          "لم يتم حفظ أي نسخة تقرير حتى الآن."
        );
      }

      return `
        <div class="report-history-list saved">
          ${[...history]
            .reverse()
            .slice(0, this.config.maximumHistoryRows)
            .map(entry => `
              <button
                type="button"
                class="report-history-row report-history-button"
                data-report-action="details"
                data-report-id="${this.escapeAttribute(
                  entry.id
                )}"
              >
                <span>📝</span>

                <div>
                  <strong>
                    ${this.escapeHtml(entry.title)}
                  </strong>

                  <small>
                    ${this.escapeHtml(entry.generatedBy)}
                    ·
                    ${this.escapeHtml(entry.cycle)}
                  </small>
                </div>

                <div>
                  <b>
                    ${entry.executiveScore}%
                  </b>

                  <small>
                    ${this.escapeHtml(
                      this.formatDateTime(
                        entry.createdAt,
                        "غير محدد"
                      )
                    )}
                  </small>
                </div>
              </button>
            `)
            .join("")}
        </div>
      `;
    },

    renderRoadmap(roadmap = []) {
      if (!roadmap.length) {
        return this.emptyState(
          "لا توجد مراحل مسجلة في خارطة الطريق."
        );
      }

      return `
        <div class="report-roadmap-grid">
          ${roadmap
            .map(item => {
              const progress =
                this.normalizePercent(
                  item.progress,
                  0
                );

              return `
                <div class="report-roadmap-card">
                  <b>
                    ${this.escapeHtml(
                      item.year ||
                      item.period ||
                      ""
                    )}
                  </b>

                  <strong>
                    ${this.escapeHtml(
                      item.phase ||
                      item.title ||
                      ""
                    )}
                  </strong>

                  <span>${progress}%</span>

                  <div class="aiw-progress">
                    <div style="width:${progress}%"></div>
                  </div>

                  <p>
                    ${this.escapeHtml(
                      this.valueToText(
                        item.activities ??
                        item.description ??
                        ""
                      )
                    )}
                  </p>
                </div>
              `;
            })
            .join("")}
        </div>
      `;
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
      if (!window.AIW?.Charts) {
        return;
      }

      setTimeout(() => {
        if (
          typeof window.AIW.Charts.doughnut ===
          "function"
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
          typeof window.AIW.Charts.bar ===
          "function"
        ) {
          window.AIW.Charts.bar(
            "reportsHealthChart",
            [
              "Executive",
              "Ideas",
              "Projects",
              "KPI",
              "Risk",
              "Governance",
              "Decision",
              "Automation"
            ],
            [
              scores.executiveScore,
              scores.ideaScore,
              scores.projectScore,
              scores.kpiScore,
              scores.riskScore,
              scores.governanceScore,
              scores.decisionScore,
              scores.automationScore
            ],
            "Platform Health"
          );
        }
      }, this.config.chartDelay);
    },

    /* =======================================================
       UI Events
    ======================================================= */

    bindActionEvents() {
      if (
        this._eventsBound ||
        !this._container
      ) {
        return;
      }

      this._eventsBound = true;

      this._container.addEventListener(
        "click",
        event => {
          const button =
            event.target.closest(
              "[data-report-action]"
            );

          if (
            !button ||
            !this._container?.contains(button)
          ) {
            return;
          }

          const action =
            button.dataset.reportAction;

          if (action === "generate") {
            const result =
              this.generateReportSnapshot(
                this._lastContext,
                this._lastScores
              );

            if (!result.success) {
              this.showToast(
                result.message ||
                "تعذر حفظ التقرير.",
                "error"
              );
              return;
            }

            this.showToast(
              "تم حفظ نسخة التقرير التنفيذي.",
              "success"
            );

            this.scheduleRefresh();
            return;
          }

          if (action === "open-kpis") {
            this.openModule("kpis");
            return;
          }

          if (action === "open-decision") {
            this.openModule("decision");
            return;
          }

          if (action === "details") {
            this.openReportDetails(
              button.dataset.reportId
            );
          }
        }
      );
    },

    openReportDetails(reportId) {
      const report =
        this.getReportsCenter()
          .history
          .find(
            entry =>
              String(entry.id) ===
              String(reportId)
          );

      if (!report) {
        this.showToast(
          "تعذر العثور على نسخة التقرير.",
          "error"
        );
        return;
      }

      this.closeReportDetails();

      const modal =
        document.createElement("div");

      modal.className =
        "report-details-overlay";

      modal.innerHTML = `
        <div
          class="report-details-dialog"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            class="report-details-close"
            data-report-details-close
            aria-label="إغلاق"
          >
            ×
          </button>

          <div class="report-details-icon">
            📝
          </div>

          <h3>
            ${this.escapeHtml(report.title)}
          </h3>

          <p>
            نسخة تنفيذية محفوظة ضمن دورة
            ${this.escapeHtml(report.cycle)}.
          </p>

          <div class="report-details-grid">
            <div>
              <small>Executive Score</small>
              <strong>${report.executiveScore}%</strong>
            </div>

            <div>
              <small>Ideas</small>
              <strong>${report.ideasCount}</strong>
            </div>

            <div>
              <small>Projects</small>
              <strong>${report.projectsCount}</strong>
            </div>

            <div>
              <small>Conversion</small>
              <strong>${report.conversionRate}%</strong>
            </div>

            <div>
              <small>KPIs</small>
              <strong>${report.kpisCount}</strong>
            </div>

            <div>
              <small>Risks</small>
              <strong>${report.risksCount}</strong>
            </div>
          </div>

          <div class="report-details-date">
            أنشئ بواسطة
            ${this.escapeHtml(report.generatedBy)}
            ·
            ${this.escapeHtml(
              this.formatDateTime(
                report.createdAt,
                "غير محدد"
              )
            )}
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this._detailsModal = modal;

      modal.addEventListener(
        "click",
        event => {
          if (
            event.target === modal ||
            event.target.closest(
              "[data-report-details-close]"
            )
          ) {
            this.closeReportDetails();
          }
        }
      );

      modal.addEventListener(
        "keydown",
        event => {
          if (event.key === "Escape") {
            this.closeReportDetails();
          }
        }
      );

      requestAnimationFrame(() => {
        modal.classList.add("visible");
      });
    },

    closeReportDetails() {
      if (!this._detailsModal) {
        return;
      }

      const modal =
        this._detailsModal;

      modal.classList.remove("visible");

      setTimeout(() => {
        modal.remove();
      }, 180);

      this._detailsModal = null;
    },

    /* =======================================================
       Shared UI
    ======================================================= */

    renderExecutiveList(items = []) {
      if (!items.length) {
        return this.emptyState(
          "لا توجد توصيات متاحة حالياً."
        );
      }

      return `
        <div class="executive-list">
          ${items
            .map((item, index) => `
              <div class="executive-item">
                <strong>
                  ${String(index + 1).padStart(2, "0")}
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
            `)
            .join("")}
        </div>
      `;
    },

    kpi(label, value, note) {
      if (
        typeof window.AIW?.Widgets?.kpi ===
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
          <span>${this.escapeHtml(label)}</span>
          <strong>${this.escapeHtml(value)}</strong>
          <small>${this.escapeHtml(note)}</small>
        </div>
      `;
    },

    sectionTitle(title, description) {
      if (
        typeof window.AIW?.Widgets?.sectionTitle ===
        "function"
      ) {
        return window.AIW.Widgets.sectionTitle(
          title,
          description
        );
      }

      return `
        <div class="module-section-title compact">
          <h2>${this.escapeHtml(title)}</h2>
          <p>${this.escapeHtml(description)}</p>
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

    fallbackHero(
      executiveScore,
      quickWins,
      risks,
      historyCount,
      conversionRate
    ) {
      return `
        <div class="module-hero">
          <span class="module-kicker">
            Executive Reports · Biometric Analytics
          </span>

          <h1>
            مركز التقارير والتحليلات التنفيذية
          </h1>

          <p>
            تقرير تنفيذي حي يربط الأفكار والمشاريع والمؤشرات والقرارات والأتمتة والمخاطر.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">
              🧠 Executive Score ${executiveScore}%
            </span>

            <span class="aiw-chip">
              🔄 Conversion ${conversionRate}%
            </span>

            <span class="aiw-chip">
              🚀 ${quickWins} Quick Wins
            </span>

            <span class="aiw-chip">
              🛡️ ${risks} مخاطر
            </span>

            <span class="aiw-chip">
              📝 ${historyCount} تقارير محفوظة
            </span>
          </div>
        </div>
      `;
    },

    openModule(moduleId) {
      if (
        typeof window.AIW?.App?.go ===
        "function"
      ) {
        window.AIW.App.go(moduleId);
        return;
      }

      if (
        typeof window.AIW?.Router?.go ===
        "function"
      ) {
        window.AIW.Router.go(moduleId);
        return;
      }

      window.location.hash =
        `#${moduleId}`;
    },

    /* =======================================================
       Synchronization
    ======================================================= */

    scheduleRefresh() {
      clearTimeout(this._refreshTimer);

      this._refreshTimer =
        setTimeout(() => {
          if (!this._container?.isConnected) {
            return;
          }

          this.render(this._container);
        }, this.config.refreshDelay);
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
        "aiw:reportsUpdated",
        "aiw:reportGenerated",
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
        "aiw:approvalCreated",
        "aiw:approvalResolved",
        "aiw:kpiValueUpdated",
        "aiw:decisionUpdated",
        "aiw:workflowExecuted"
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
          store.subscribe(change => {
            const type =
              change?.type ||
              "";

            if (
              [
                "persist",
                "settingsPersisted",
                "aiw:metadataChanged"
              ].includes(type)
            ) {
              return;
            }

            refresh();
          });
      }
    },

    destroy() {
      clearTimeout(this._refreshTimer);

      if (
        typeof this._unsubscribeStore ===
        "function"
      ) {
        this._unsubscribeStore();
      }

      this._unsubscribeStore = null;
      this._container = null;
      this._eventsBound = false;
      this._syncBound = false;
      this._lastContext = null;
      this._lastScores = null;

      this.closeReportDetails();
    },

    /* =======================================================
       Toast
    ======================================================= */

    showToast(message, type = "success") {
      document
        .querySelector(".report-workflow-toast")
        ?.remove();

      const toast =
        document.createElement("div");

      toast.className =
        `report-workflow-toast ${type}`;

      toast.textContent = message;

      document.body.appendChild(toast);

      requestAnimationFrame(() => {
        toast.classList.add("visible");
      });

      setTimeout(() => {
        toast.classList.remove("visible");

        setTimeout(() => {
          toast.remove();
        }, 200);
      }, 2800);
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
        document.createElement("style");

      style.id =
        this.config.styleId;

      style.textContent = `
        .reports-action-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 18px;
        }

        .report-action-button {
          appearance: none;
          min-height: 44px;
          padding: 11px 16px;
          border: 0;
          border-radius: 14px;
          font: inherit;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .report-action-button.primary {
          color: #fff;
          background: #101b2f;
        }

        .report-action-button.secondary {
          color: #344054;
          background: #f2f4f7;
          border: 1px solid #e4e7ec;
        }

        .report-highlight-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
        }

        .report-highlight-metrics span,
        .report-decision-type {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 6px 10px;
          border-radius: 999px;
          color: #344054;
          background: #f2f4f7;
          font-size: 11px;
          font-weight: 800;
        }

        .report-history-list {
          display: grid;
          gap: 10px;
        }

        .report-history-row {
          display: grid;
          grid-template-columns:
            auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          padding: 13px 14px;
          border: 1px solid rgba(15, 23, 42, 0.07);
          border-radius: 16px;
          text-align: right;
          background: #f9fafb;
        }

        .report-history-button {
          width: 100%;
          font: inherit;
          cursor: pointer;
        }

        .report-history-row > span {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border-radius: 13px;
          background: #edf3ff;
        }

        .report-history-row strong,
        .report-history-row small,
        .report-history-row b {
          display: block;
        }

        .report-history-row strong {
          color: #101828;
          font-size: 13px;
        }

        .report-history-row b {
          color: #101828;
          font-size: 12px;
        }

        .report-history-row small {
          margin-top: 4px;
          color: #667085;
          font-size: 10px;
        }

        .report-details-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding:
            24px
            18px
            calc(24px + env(safe-area-inset-bottom));
          direction: rtl;
          background: rgba(15, 23, 42, 0.48);
          backdrop-filter: blur(10px);
          opacity: 0;
          transition: opacity 0.18s ease;
        }

        .report-details-overlay.visible {
          opacity: 1;
        }

        .report-details-dialog {
          position: relative;
          width: min(100%, 520px);
          max-height: min(86vh, 720px);
          overflow-y: auto;
          padding: 28px 22px 22px;
          border-radius: 28px;
          background: #fff;
          box-shadow:
            0 28px 80px rgba(15, 23, 42, 0.28);
          transform:
            translateY(12px)
            scale(0.98);
          transition: transform 0.18s ease;
        }

        .report-details-overlay.visible
        .report-details-dialog {
          transform:
            translateY(0)
            scale(1);
        }

        .report-details-close {
          position: absolute;
          top: 14px;
          left: 15px;
          width: 36px;
          height: 36px;
          border: 0;
          border-radius: 50%;
          color: #475467;
          background: #f2f4f7;
          font-size: 24px;
          cursor: pointer;
        }

        .report-details-icon {
          display: grid;
          place-items: center;
          width: 62px;
          height: 62px;
          margin-bottom: 16px;
          border-radius: 20px;
          font-size: 30px;
          background: #101b2f;
        }

        .report-details-dialog h3 {
          margin: 0 0 8px;
          color: #101828;
          font-size: 22px;
        }

        .report-details-dialog > p {
          margin: 0;
          color: #667085;
          font-size: 14px;
          line-height: 1.8;
        }

        .report-details-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 9px;
          margin-top: 20px;
        }

        .report-details-grid > div {
          padding: 12px 9px;
          border-radius: 14px;
          text-align: center;
          background: #f7f8fa;
        }

        .report-details-grid small,
        .report-details-grid strong {
          display: block;
        }

        .report-details-grid small {
          margin-bottom: 5px;
          color: #667085;
          font-size: 10px;
        }

        .report-details-grid strong {
          color: #101828;
          font-size: 13px;
        }

        .report-details-date {
          margin-top: 18px;
          padding-top: 15px;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          color: #667085;
          font-size: 12px;
        }

        .report-workflow-toast {
          position: fixed;
          right: 50%;
          bottom:
            calc(
              108px +
              env(safe-area-inset-bottom)
            );
          z-index: 100000;
          width: min(
            calc(100% - 36px),
            420px
          );
          box-sizing: border-box;
          padding: 14px 17px;
          border-radius: 16px;
          color: #fff;
          text-align: center;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.6;
          background: #101b2f;
          box-shadow:
            0 18px 45px rgba(15, 23, 42, 0.25);
          opacity: 0;
          transform:
            translateX(50%)
            translateY(14px);
          transition:
            opacity 0.2s ease,
            transform 0.2s ease;
        }

        .report-workflow-toast.visible {
          opacity: 1;
          transform:
            translateX(50%)
            translateY(0);
        }

        .report-workflow-toast.success {
          background: #087d3e;
        }

        .report-workflow-toast.error {
          background: #b42318;
        }

        @media (max-width: 720px) {
          .reports-action-bar {
            display: grid;
            grid-template-columns: 1fr;
          }

          .report-details-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
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

    valueToText(value, fallback = "") {
      if (Array.isArray(value)) {
        const values = value
          .map(item =>
            typeof item === "object"
              ? item.title ||
                item.name ||
                item.description ||
                ""
              : String(item || "")
          )
          .filter(Boolean);

        return values.length
          ? values.join("، ")
          : fallback;
      }

      if (
        value &&
        typeof value === "object"
      ) {
        return (
          value.title ||
          value.name ||
          value.description ||
          fallback
        );
      }

      const text =
        String(value ?? "").trim();

      return text || fallback;
    },

    formatDateTime(value, fallback = "") {
      if (!value) {
        return fallback;
      }

      try {
        const date =
          new Date(value);

        if (Number.isNaN(date.getTime())) {
          return String(value);
        }

        return date.toLocaleString(
          "ar-AE",
          {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }
        );
      } catch (error) {
        return String(value);
      }
    },

    average(values = []) {
      const validValues = values
        .map(value => Number(value))
        .filter(value =>
          Number.isFinite(value)
        );

      if (!validValues.length) {
        return 0;
      }

      return Math.round(
        validValues.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / validValues.length
      );
    },

    toSafeNumber(value, fallback = 0) {
      const number =
        Number(value);

      return Number.isFinite(number)
        ? number
        : fallback;
    },

    numberOrFallback(value, fallback = 0) {
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

    createId(prefix = "item") {
      return (
        `${prefix}-${Date.now()}-` +
        Math.random()
          .toString(36)
          .slice(2, 8)
      );
    },

    uniqueBy(items = [], selector) {
      const seen = new Set();

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
    }
  };
})();
