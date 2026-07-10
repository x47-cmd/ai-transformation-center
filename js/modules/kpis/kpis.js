/* =========================================================
   AI Work - KPI Center V5.1
   Enterprise Biometric Intelligence KPI Engine
   Store V2.2 Native Architecture

   File Path:
   js/modules/kpis/kpis.js

   Fixes in V5.1:
   - Full Store V2.2 alignment
   - Supports native KPI object and legacy KPI array
   - Persistent KPI items and history
   - Correct idea/project/approval derived KPIs
   - Correct mutually-exclusive KPI health counts
   - Correct higher/lower progress calculation
   - KPI value and target update workflows
   - Human-in-the-Loop notes for sensitive updates
   - Generic Store V2.2 event synchronization
   - No direct AIW.Data or localStorage fallback
   - Existing UI design preserved
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};
  AIW.Modules = AIW.Modules || {};

  AIW.Modules.kpis = {
    id: "kpis",
    title: "المؤشرات",
    icon: "📈",
    version: "5.1.0",

    _container: null,
    _unsubscribeStore: null,
    _refreshTimer: null,
    _confirmationModal: null,
    _detailsModal: null,
    _pendingAction: null,
    _eventsBound: false,
    _syncBound: false,
    _isRendering: false,
    _isSaving: false,

    config: {
      actor: "الإدارة",
      refreshDelay: 80,
      styleId: "aiw-kpis-v51-styles",
      maximumHistoryRows: 30,
      chartDelay: 100
    },

    direction: {
      HIGHER: "higher",
      LOWER: "lower"
    },

    status: {
      ACTIVE: "active",
      PAUSED: "paused",
      ARCHIVED: "archived",
      DRAFT: "draft"
    },

    health: {
      ADVANCED: "advanced",
      ON_TRACK: "on-track",
      BUILDING: "building",
      BEHIND: "behind"
    },

    ideaStatus: {
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
        console.error("AI Work KPIs V5.1: AIW.Store is unavailable.");
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
          "AI Work KPIs V5.1: Unable to read Store state.",
          error
        );
      }

      return {};
    },

    getCollection(name) {
      const value = this.getState()?.[name];
      return Array.isArray(value) ? value : [];
    },

    /* =======================================================
       KPI State
    ======================================================= */

    getKpiSource() {
      const state = this.getState();

      if (
        state.kpis &&
        typeof state.kpis === "object" &&
        !Array.isArray(state.kpis)
      ) {
        return state.kpis;
      }

      if (
        state.kpiCenter &&
        typeof state.kpiCenter === "object" &&
        !Array.isArray(state.kpiCenter)
      ) {
        return state.kpiCenter;
      }

      if (Array.isArray(state.kpis)) {
        return {
          items: state.kpis,
          history: Array.isArray(state.kpiHistory)
            ? state.kpiHistory
            : []
        };
      }

      return {};
    },

    getKpiCenter() {
      const source = this.getKpiSource();

      const items = Array.isArray(source.items)
        ? source.items
        : Array.isArray(source.kpis)
          ? source.kpis
          : [];

      const history = Array.isArray(source.history)
        ? source.history
        : Array.isArray(source.kpiHistory)
          ? source.kpiHistory
          : [];

      return {
        items: items
          .map((item, index) => this.normalizeKpi(item, index))
          .filter(Boolean),

        history: history
          .map((entry, index) =>
            this.normalizeHistoryEntry(entry, index)
          )
          .filter(Boolean),

        settings: {
          reviewCycle:
            source.settings?.reviewCycle ||
            "شهري",

          onTrackThreshold:
            this.normalizePercent(
              source.settings?.onTrackThreshold,
              60
            ),

          advancedThreshold:
            this.normalizePercent(
              source.settings?.advancedThreshold,
              75
            ),

          attentionThreshold:
            this.normalizePercent(
              source.settings?.attentionThreshold,
              40
            ),

          humanApprovalRequired:
            source.settings?.humanApprovalRequired !== false,

          autoDerivedKpis:
            source.settings?.autoDerivedKpis !== false
        },

        statistics: {
          active:
            this.toSafeNumber(
              source.statistics?.active,
              0
            ),

          onTrack:
            this.toSafeNumber(
              source.statistics?.onTrack,
              0
            ),

          behind:
            this.toSafeNumber(
              source.statistics?.behind,
              0
            ),

          averageProgress:
            this.toSafeNumber(
              source.statistics?.averageProgress,
              0
            ),

          lastUpdatedAt:
            source.statistics?.lastUpdatedAt ||
            null
        },

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

    updateKpiCenter(changes = {}) {
      if (!changes || typeof changes !== "object") {
        return {
          success: false,
          message: "بيانات التحديث غير صالحة."
        };
      }

      const store = this.getStore();

      if (!store) {
        return {
          success: false,
          message: "مخزن البيانات غير متاح."
        };
      }

      const current = this.getKpiCenter();
      const now = new Date().toISOString();

      const updated = {
        ...current,
        ...changes,

        settings: {
          ...current.settings,
          ...(changes.settings || {})
        },

        statistics: {
          ...current.statistics,
          ...(changes.statistics || {})
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
            "kpis",
            updated,
            { event: "aiw:kpisUpdated" }
          );
        } else if (typeof store.update === "function") {
          result = store.update(
            "kpis",
            updated,
            { event: "aiw:kpisUpdated" }
          );
        } else if (typeof store.patch === "function") {
          result = store.patch(
            "kpis",
            updated,
            { event: "aiw:kpisUpdated" }
          );
        } else {
          return {
            success: false,
            message: "Store V2.2 لا يدعم تحديث المؤشرات."
          };
        }

        if (
          result?.success === false ||
          result === false ||
          result === null
        ) {
          return {
            success: false,
            message: "تعذر حفظ بيانات المؤشرات.",
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
          "AI Work KPIs V5.1: updateKpiCenter failed.",
          error
        );

        return {
          success: false,
          message: "تعذر تحديث مركز المؤشرات.",
          error
        };
      }
    },

    /* =======================================================
       Readers
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
        console.warn("AI Work KPIs V5.1: Ideas reader failed.", error);
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
        console.warn("AI Work KPIs V5.1: Projects reader failed.", error);
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
        console.warn("AI Work KPIs V5.1: Pipeline reader failed.", error);
      }

      const state = this.getState();

      return state.pipeline &&
        typeof state.pipeline === "object"
        ? state.pipeline
        : {};
    },

    getAutomation() {
      const state = this.getState();

      if (
        state.automation &&
        typeof state.automation === "object"
      ) {
        return state.automation;
      }

      if (
        state.automationCenter &&
        typeof state.automationCenter === "object"
      ) {
        return state.automationCenter;
      }

      return {};
    },

    getDecision() {
      const state = this.getState();

      if (
        state.decision &&
        typeof state.decision === "object"
      ) {
        return state.decision;
      }

      if (
        state.decisionCenter &&
        typeof state.decisionCenter === "object"
      ) {
        return state.decisionCenter;
      }

      return {};
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
              ...(risk && typeof risk === "object"
                ? risk
                : { title: String(risk || "خطر") }),

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

      if (Array.isArray(state.governanceControls)) {
        return state.governanceControls;
      }

      if (Array.isArray(state.controls)) {
        return state.controls;
      }

      if (
        state.governanceCenter &&
        Array.isArray(state.governanceCenter.controls)
      ) {
        return state.governanceCenter.controls;
      }

      return [];
    },

    /* =======================================================
       Normalization
    ======================================================= */

    normalizeKpi(kpi, index = 0) {
      if (!kpi || typeof kpi !== "object") {
        return null;
      }

      const current =
        this.toSafeNumber(
          kpi.current ??
          kpi.value,
          0
        );

      return {
        ...kpi,

        id:
          kpi.id ??
          kpi.kpiId ??
          `kpi-${index + 1}`,

        icon:
          kpi.icon ||
          "📈",

        title:
          kpi.title ||
          kpi.name ||
          "مؤشر غير مسمى",

        desc:
          kpi.desc ||
          kpi.description ||
          "",

        target:
          this.toSafeNumber(
            kpi.target,
            0
          ),

        current,

        baseline:
          this.toSafeNumber(
            kpi.baseline,
            current
          ),

        unit:
          kpi.unit ||
          "",

        owner:
          kpi.owner ||
          kpi.team ||
          "غير محدد",

        frequency:
          kpi.frequency ||
          kpi.reviewCycle ||
          "شهري",

        direction:
          this.normalizeDirection(
            kpi.direction
          ),

        status:
          this.normalizeKpiStatus(
            kpi.status ??
            kpi.state ??
            this.status.ACTIVE
          ),

        sourceType:
          kpi.sourceType ||
          kpi.source ||
          "manual",

        sourceId:
          kpi.sourceId ??
          kpi.entityId ??
          null,

        sensitive:
          kpi.sensitive === true ||
          kpi.humanApprovalRequired === true,

        derived:
          kpi.derived === true,

        trend:
          Array.isArray(kpi.trend)
            ? kpi.trend
            : [],

        createdAt:
          kpi.createdAt ||
          null,

        updatedAt:
          kpi.updatedAt ||
          null
      };
    },

    normalizeHistoryEntry(entry, index = 0) {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      return {
        ...entry,

        id:
          entry.id ??
          entry.historyId ??
          `kpi-history-${index + 1}`,

        kpiId:
          entry.kpiId ??
          entry.metricId ??
          null,

        action:
          entry.action ||
          "value-update",

        value:
          this.toSafeNumber(
            entry.value ??
            entry.current,
            0
          ),

        target:
          this.toSafeNumber(
            entry.target,
            0
          ),

        baseline:
          this.toSafeNumber(
            entry.baseline,
            0
          ),

        actor:
          entry.actor ||
          entry.updatedBy ||
          this.config.actor,

        notes:
          entry.notes ||
          entry.reason ||
          "",

        createdAt:
          entry.createdAt ||
          entry.timestamp ||
          null
      };
    },

    normalizeDirection(value) {
      return this.normalizeStatus(value) ===
        this.direction.LOWER
        ? this.direction.LOWER
        : this.direction.HIGHER;
    },

    normalizeKpiStatus(value) {
      const status =
        this.normalizeStatus(value);

      if (
        [
          "paused",
          "inactive",
          "disabled",
          "متوقف",
          "موقوف"
        ].includes(status)
      ) {
        return this.status.PAUSED;
      }

      if (
        [
          "archived",
          "مؤرشف"
        ].includes(status)
      ) {
        return this.status.ARCHIVED;
      }

      if (
        [
          "draft",
          "مسودة"
        ].includes(status)
      ) {
        return this.status.DRAFT;
      }

      return this.status.ACTIVE;
    },

    getIdeaStatus(idea = {}) {
      if (
        idea.conversion?.converted === true ||
        idea.projectId ||
        idea.conversion?.projectId
      ) {
        return this.ideaStatus.CONVERTED;
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
        return this.ideaStatus.CONVERTED;
      }

      if (raw === "submitted") {
        return this.ideaStatus.SUBMITTED;
      }

      if (
        [
          "pending",
          "pending-approval"
        ].includes(raw)
      ) {
        return this.ideaStatus.PENDING;
      }

      if (raw === "approved") {
        return this.ideaStatus.APPROVED;
      }

      if (raw === "rejected") {
        return this.ideaStatus.REJECTED;
      }

      if (raw === "archived") {
        return this.ideaStatus.ARCHIVED;
      }

      return this.ideaStatus.DRAFT;
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

      return map[raw] ||
        this.projectStatus.PLANNING;
    },

    /* =======================================================
       Derived KPIs
    ======================================================= */

    getDerivedKpis() {
      const center = this.getKpiCenter();

      if (!center.settings.autoDerivedKpis) {
        return [];
      }

      const state = this.getState();
      const ideas = this.getIdeas();
      const projects = this.getProjects();
      const pipeline = this.getPipeline();
      const automation = this.getAutomation();
      const decision = this.getDecision();
      const risks = this.getRisks();
      const controls = this.getGovernanceControls();

      const pendingIdeas =
        this.numberOrFallback(
          pipeline.pendingIdeas,
          ideas.filter(
            idea => this.isPendingIdea(idea)
          ).length
        );

      const approvedIdeas =
        this.numberOrFallback(
          pipeline.approvedIdeas,
          ideas.filter(
            idea => this.isApprovedIdea(idea)
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

      const projectProgress = projects.length
        ? this.average(
            projects
              .filter(project =>
                ![
                  this.projectStatus.CANCELLED,
                  this.projectStatus.ARCHIVED
                ].includes(
                  this.getProjectStatus(project)
                )
              )
              .map(project =>
                this.normalizePercent(
                  project.progress ??
                  project.readiness ??
                  project.score,
                  0
                )
              )
          )
        : 0;

      const activeProjects =
        this.numberOrFallback(
          pipeline.activeProjects,
          projects.filter(
            project => this.isActiveProject(project)
          ).length
        );

      const targetProjects = Math.max(
        1,
        this.toSafeNumber(
          state.summary?.targetProjects,
          activeProjects || projects.length || 1
        )
      );

      const executionHistory =
        Array.isArray(automation.executionHistory)
          ? automation.executionHistory
          : [];

      const completedExecutions =
        executionHistory.filter(
          entry => this.isCompletedExecution(entry)
        ).length;

      const automationSuccessRate =
        executionHistory.length
          ? this.normalizePercent(
              (
                completedExecutions /
                executionHistory.length
              ) * 100
            )
          : 0;

      const decisionHistory =
        Array.isArray(decision.decisionHistory)
          ? decision.decisionHistory
          : [];

      const resolvedDecisions =
        decisionHistory.filter(item =>
          [
            "approved",
            "accepted",
            "rejected",
            "declined",
            "معتمد",
            "مرفوض"
          ].includes(
            this.normalizeStatus(
              item.status
            )
          )
        );

      const approvedDecisions =
        resolvedDecisions.filter(item =>
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

      const decisionApprovalRate =
        resolvedDecisions.length
          ? this.normalizePercent(
              (
                approvedDecisions /
                resolvedDecisions.length
              ) * 100
            )
          : 0;

      const governanceActive =
        controls.filter(
          control => this.isActiveControl(control)
        ).length;

      const governanceCompliance =
        controls.length
          ? this.normalizePercent(
              (
                governanceActive /
                controls.length
              ) * 100
            )
          : 0;

      const openHighRisks =
        risks.filter(
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

      const derived = [
        {
          id: "derived-ideas-pending",
          icon: "⏳",
          title: "الأفكار بانتظار الاعتماد",
          desc: "عدد الأفكار الموجودة حالياً في مسار الاعتماد.",
          target: 0,
          current: pendingIdeas,
          baseline: Math.max(pendingIdeas, 1),
          unit: "فكرة",
          owner: "الإدارة",
          frequency: "فوري",
          direction: this.direction.LOWER,
          status: this.status.ACTIVE,
          sourceType: "ideas",
          derived: true
        },

        {
          id: "derived-ideas-approved",
          icon: "✅",
          title: "الأفكار المعتمدة",
          desc: "عدد الأفكار المعتمدة والجاهزة للتحويل إلى مشاريع.",
          target: Math.max(
            1,
            approvedIdeas + convertedIdeas
          ),
          current: approvedIdeas,
          baseline: approvedIdeas,
          unit: "فكرة",
          owner: "الإدارة",
          frequency: "فوري",
          direction: this.direction.HIGHER,
          status: this.status.ACTIVE,
          sourceType: "ideas",
          derived: true
        },

        {
          id: "derived-ideas-conversion",
          icon: "🚀",
          title: "تحويل الأفكار إلى مشاريع",
          desc: "نسبة الأفكار التي تحولت فعلياً إلى مشاريع تنفيذية.",
          target: 100,
          current: conversionRate,
          baseline: 0,
          unit: "%",
          owner: "إدارة المحفظة",
          frequency: "شهري",
          direction: this.direction.HIGHER,
          status: this.status.ACTIVE,
          sourceType: "ideas-projects",
          derived: true
        },

        {
          id: "derived-project-readiness",
          icon: "📁",
          title: "متوسط جاهزية المشاريع",
          desc: "متوسط التقدم والجاهزية لمشاريع المحفظة الحالية.",
          target: 100,
          current: projectProgress,
          baseline: projectProgress,
          unit: "%",
          owner: "إدارة المشاريع",
          frequency: "أسبوعي",
          direction: this.direction.HIGHER,
          status: this.status.ACTIVE,
          sourceType: "projects",
          derived: true
        },

        {
          id: "derived-active-projects",
          icon: "🛠️",
          title: "المشاريع النشطة",
          desc: "عدد المشاريع الجاري تنفيذها أو تشغيلها حالياً.",
          target: targetProjects,
          current: activeProjects,
          baseline: 0,
          unit: "مشروع",
          owner: "إدارة المشاريع",
          frequency: "فوري",
          direction: this.direction.HIGHER,
          status: this.status.ACTIVE,
          sourceType: "projects",
          derived: true
        },

        {
          id: "derived-automation-success",
          icon: "⚙️",
          title: "نجاح عمليات الأتمتة",
          desc: "نسبة عمليات الأتمتة المكتملة بنجاح من إجمالي التنفيذات.",
          target: 95,
          current: automationSuccessRate,
          baseline: automationSuccessRate,
          unit: "%",
          owner: "فريق الأتمتة",
          frequency: "أسبوعي",
          direction: this.direction.HIGHER,
          status: this.status.ACTIVE,
          sourceType: "automation",
          derived: true
        },

        {
          id: "derived-decision-approval",
          icon: "🧭",
          title: "نسبة القرارات المعتمدة",
          desc: "نسبة القرارات المعتمدة من إجمالي القرارات المحسومة.",
          target: 100,
          current: decisionApprovalRate,
          baseline: decisionApprovalRate,
          unit: "%",
          owner: "الإدارة",
          frequency: "شهري",
          direction: this.direction.HIGHER,
          status: this.status.ACTIVE,
          sourceType: "decision",
          derived: true
        },

        {
          id: "derived-governance-compliance",
          icon: "🛡️",
          title: "الامتثال للحوكمة",
          desc: "نسبة الضوابط النشطة من إجمالي ضوابط الحوكمة.",
          target: 100,
          current: governanceCompliance,
          baseline: governanceCompliance,
          unit: "%",
          owner: "فريق الحوكمة",
          frequency: "شهري",
          direction: this.direction.HIGHER,
          status: this.status.ACTIVE,
          sourceType: "governance",
          derived: true,
          sensitive: true
        },

        {
          id: "derived-open-high-risks",
          icon: "🚨",
          title: "المخاطر العالية المفتوحة",
          desc: "عدد المخاطر العالية أو الحرجة التي لم يتم إغلاقها.",
          target: 0,
          current: openHighRisks,
          baseline: Math.max(openHighRisks, 1),
          unit: "مخاطرة",
          owner: "مالك المخاطر",
          frequency: "أسبوعي",
          direction: this.direction.LOWER,
          status: this.status.ACTIVE,
          sourceType: "risks",
          derived: true,
          sensitive: true
        }
      ];

      return derived
        .map((item, index) =>
          this.normalizeKpi(item, index)
        )
        .filter(Boolean);
    },

    getAllKpis() {
      const center = this.getKpiCenter();

      return this.uniqueBy(
        [
          ...center.items,
          ...this.getDerivedKpis()
        ],
        item => item.id
      );
    },

    /* =======================================================
       CRUD
    ======================================================= */

    addKpi(kpi = {}) {
      const center = this.getKpiCenter();
      const now = new Date().toISOString();

      const newKpi = this.normalizeKpi(
        {
          ...kpi,
          id:
            kpi.id ||
            this.createId("kpi"),
          createdAt:
            kpi.createdAt ||
            now,
          updatedAt: now
        },
        center.items.length
      );

      const items = [
        ...center.items,
        newKpi
      ];

      const result = this.updateKpiCenter({
        items,
        statistics:
          this.calculateStatistics(items)
      });

      return result.success
        ? {
            success: true,
            kpi: newKpi
          }
        : result;
    },

    updateKpi(kpiId, changes = {}) {
      const center = this.getKpiCenter();

      const index = center.items.findIndex(
        item =>
          String(item.id) === String(kpiId)
      );

      if (index < 0) {
        return {
          success: false,
          message: "لم يتم العثور على المؤشر."
        };
      }

      const items = center.items.map(
        (item, itemIndex) => {
          if (itemIndex !== index) {
            return item;
          }

          return this.normalizeKpi(
            {
              ...item,
              ...changes,
              id: item.id,
              updatedAt:
                new Date().toISOString()
            },
            itemIndex
          );
        }
      );

      const result = this.updateKpiCenter({
        items,
        statistics:
          this.calculateStatistics(items)
      });

      return result.success
        ? {
            success: true,
            kpi: items[index]
          }
        : result;
    },

    removeKpi(kpiId) {
      const center = this.getKpiCenter();

      const kpi = center.items.find(
        item =>
          String(item.id) === String(kpiId)
      );

      if (!kpi) {
        return {
          success: false,
          message: "لم يتم العثور على المؤشر."
        };
      }

      const items = center.items.filter(
        item =>
          String(item.id) !== String(kpiId)
      );

      const result = this.updateKpiCenter({
        items,
        statistics:
          this.calculateStatistics(items)
      });

      return result.success
        ? {
            success: true,
            kpi
          }
        : result;
    },

    updateKpiValue(kpiId, current, notes = "") {
      return this.applyKpiUpdate(
        kpiId,
        {
          action: "value-update",
          current
        },
        notes
      );
    },

    updateKpiTarget(kpiId, target, notes = "") {
      return this.applyKpiUpdate(
        kpiId,
        {
          action: "target-update",
          target
        },
        notes
      );
    },

    applyKpiUpdate(kpiId, change = {}, notes = "") {
      const center = this.getKpiCenter();

      const index = center.items.findIndex(
        item =>
          String(item.id) === String(kpiId)
      );

      if (index < 0) {
        return {
          success: false,
          message:
            "المؤشرات المشتقة تُحدّث تلقائياً ولا يمكن تعديلها يدوياً."
        };
      }

      const kpi = center.items[index];
      const action =
        change.action ||
        "value-update";

      const rawValue =
        action === "target-update"
          ? change.target
          : change.current;

      const numericValue =
        Number(rawValue);

      if (!Number.isFinite(numericValue)) {
        return {
          success: false,
          message:
            action === "target-update"
              ? "المستهدف المدخل غير صالح."
              : "القيمة المدخلة غير صالحة."
        };
      }

      const now = new Date().toISOString();

      const items = center.items.map(
        (item, itemIndex) => {
          if (itemIndex !== index) {
            return item;
          }

          const trend =
            action === "value-update"
              ? [
                  ...(Array.isArray(item.trend)
                    ? item.trend
                    : []),
                  {
                    value: numericValue,
                    date: now
                  }
                ].slice(-24)
              : item.trend;

          return this.normalizeKpi(
            {
              ...item,
              ...(action === "target-update"
                ? { target: numericValue }
                : { current: numericValue }),
              trend,
              updatedAt: now
            },
            itemIndex
          );
        }
      );

      const updatedKpi = items[index];

      const historyEntry =
        this.normalizeHistoryEntry(
          {
            id:
              this.createId("kpi-history"),
            kpiId:
              updatedKpi.id,
            action,
            value:
              updatedKpi.current,
            target:
              updatedKpi.target,
            baseline:
              updatedKpi.baseline,
            actor:
              this.config.actor,
            notes:
              notes ||
              (
                action === "target-update"
                  ? "تحديث مستهدف المؤشر."
                  : "تحديث قيمة المؤشر."
              ),
            createdAt: now
          },
          center.history.length
        );

      const history = [
        ...center.history,
        historyEntry
      ].slice(
        -this.config.maximumHistoryRows
      );

      const result = this.updateKpiCenter({
        items,
        history,
        statistics:
          this.calculateStatistics(items)
      });

      if (!result.success) {
        return result;
      }

      try {
        window.dispatchEvent(
          new CustomEvent(
            action === "target-update"
              ? "aiw:kpiTargetUpdated"
              : "aiw:kpiValueUpdated",
            {
              detail: {
                kpiId:
                  updatedKpi.id,
                kpi:
                  updatedKpi,
                historyEntry
              }
            }
          )
        );
      } catch (error) {
        console.warn(
          "AI Work KPIs V5.1: KPI update event failed.",
          error
        );
      }

      return {
        success: true,
        kpi: updatedKpi,
        historyEntry
      };
    },

    /* =======================================================
       Progress and Health
    ======================================================= */

    progress(kpiOrCurrent, target, direction = "higher") {
      let currentValue;
      let targetValue;
      let baselineValue;
      let progressDirection;

      if (
        kpiOrCurrent &&
        typeof kpiOrCurrent === "object"
      ) {
        currentValue =
          this.toSafeNumber(
            kpiOrCurrent.current,
            0
          );

        targetValue =
          this.toSafeNumber(
            kpiOrCurrent.target,
            0
          );

        baselineValue =
          this.toSafeNumber(
            kpiOrCurrent.baseline,
            currentValue
          );

        progressDirection =
          this.normalizeDirection(
            kpiOrCurrent.direction
          );
      } else {
        currentValue =
          this.toSafeNumber(
            kpiOrCurrent,
            0
          );

        targetValue =
          this.toSafeNumber(
            target,
            0
          );

        baselineValue =
          currentValue;

        progressDirection =
          this.normalizeDirection(
            direction
          );
      }

      if (
        progressDirection ===
        this.direction.LOWER
      ) {
        if (targetValue === 0) {
          if (currentValue <= 0) {
            return 100;
          }

          if (baselineValue > 0) {
            return this.normalizePercent(
              (
                (baselineValue - currentValue) /
                baselineValue
              ) * 100
            );
          }

          return 0;
        }

        if (currentValue <= targetValue) {
          return 100;
        }

        if (baselineValue > targetValue) {
          const achievedReduction =
            baselineValue - currentValue;

          const requiredReduction =
            baselineValue - targetValue;

          if (requiredReduction > 0) {
            return this.normalizePercent(
              (
                achievedReduction /
                requiredReduction
              ) * 100
            );
          }
        }

        return this.normalizePercent(
          (
            targetValue /
            Math.max(currentValue, 1)
          ) * 100
        );
      }

      if (targetValue <= 0) {
        return currentValue > 0
          ? 100
          : 0;
      }

      return this.normalizePercent(
        (
          currentValue /
          targetValue
        ) * 100
      );
    },

    trendDirection(kpi = {}) {
      const trend =
        Array.isArray(kpi.trend)
          ? kpi.trend
          : [];

      if (trend.length >= 2) {
        const previous =
          this.toSafeNumber(
            trend[trend.length - 2]?.value ??
            trend[trend.length - 2],
            kpi.baseline
          );

        const current =
          this.toSafeNumber(
            trend[trend.length - 1]?.value ??
            trend[trend.length - 1],
            kpi.current
          );

        if (current === previous) {
          return "stable";
        }

        const improved =
          kpi.direction === this.direction.LOWER
            ? current < previous
            : current > previous;

        return improved
          ? "up"
          : "down";
      }

      if (kpi.current === kpi.baseline) {
        return "stable";
      }

      const improved =
        kpi.direction === this.direction.LOWER
          ? kpi.current < kpi.baseline
          : kpi.current > kpi.baseline;

      return improved
        ? "up"
        : "down";
    },

    trendLabel(kpi) {
      const direction =
        this.trendDirection(kpi);

      if (direction === "up") {
        return "تحسن";
      }

      if (direction === "down") {
        return "تراجع";
      }

      return "مستقر";
    },

    trendIcon(kpi) {
      const direction =
        this.trendDirection(kpi);

      if (direction === "up") {
        return "↗️";
      }

      if (direction === "down") {
        return "↘️";
      }

      return "➡️";
    },

    getHealth(score, settings) {
      if (
        score >= settings.advancedThreshold
      ) {
        return this.health.ADVANCED;
      }

      if (
        score >= settings.onTrackThreshold
      ) {
        return this.health.ON_TRACK;
      }

      if (
        score >= settings.attentionThreshold
      ) {
        return this.health.BUILDING;
      }

      return this.health.BEHIND;
    },

    healthLabel(score, settings) {
      const labels = {
        [this.health.ADVANCED]:
          "متقدم",
        [this.health.ON_TRACK]:
          "على المسار",
        [this.health.BUILDING]:
          "قيد البناء",
        [this.health.BEHIND]:
          "متأخر"
      };

      return labels[
        this.getHealth(score, settings)
      ] || "قيد القياس";
    },

    healthClass(score, settings) {
      const health =
        this.getHealth(score, settings);

      if (
        [
          this.health.ADVANCED,
          this.health.ON_TRACK
        ].includes(health)
      ) {
        return "green";
      }

      if (
        health === this.health.BUILDING
      ) {
        return "orange";
      }

      return "red";
    },

    calculateMetrics(kpis, settings) {
      const progressValues =
        kpis.map(kpi =>
          this.progress(kpi)
        );

      const categories = progressValues.map(
        score =>
          this.getHealth(
            score,
            settings
          )
      );

      return {
        total:
          kpis.length,

        advanced:
          categories.filter(
            item =>
              item === this.health.ADVANCED
          ).length,

        onTrack:
          categories.filter(
            item =>
              item === this.health.ON_TRACK
          ).length,

        building:
          categories.filter(
            item =>
              item === this.health.BUILDING
          ).length,

        behind:
          categories.filter(
            item =>
              item === this.health.BEHIND
          ).length,

        averageProgress:
          this.average(progressValues),

        progressValues
      };
    },

    calculateStatistics(kpis = []) {
      const center =
        this.getKpiCenter();

      const activeKpis =
        kpis.filter(
          item =>
            item.status ===
            this.status.ACTIVE
        );

      const metrics =
        this.calculateMetrics(
          activeKpis,
          center.settings
        );

      return {
        active:
          metrics.total,

        onTrack:
          metrics.advanced +
          metrics.onTrack,

        behind:
          metrics.behind,

        averageProgress:
          metrics.averageProgress,

        lastUpdatedAt:
          new Date().toISOString()
      };
    },

    getExecutiveScore(metrics) {
      const state = this.getState();

      const summaryScore =
        this.firstFiniteNumber([
          state.summary?.executiveScore,
          state.summary?.portfolioHealth,
          state.summary?.systemHealth
        ]);

      if (summaryScore !== null) {
        return this.normalizePercent(
          this.average([
            metrics.averageProgress,
            summaryScore
          ])
        );
      }

      return metrics.averageProgress;
    },

    /* =======================================================
       Recommendations
    ======================================================= */

    getRecommendations(context = {}) {
      const recommendations = [];

      context.kpis
        .filter(kpi =>
          this.progress(kpi) <
          context.settings.attentionThreshold
        )
        .sort((a, b) =>
          this.progress(a) -
          this.progress(b)
        )
        .slice(0, 3)
        .forEach(kpi => {
          recommendations.push(
            `إعطاء أولوية لمؤشر «${kpi.title}» لأنه عند ${this.progress(kpi)}% من المستهدف.`
          );
        });

      const pendingIdeas =
        this.getIdeas().filter(
          idea => this.isPendingIdea(idea)
        ).length;

      if (pendingIdeas > 0) {
        recommendations.push(
          `مراجعة ${pendingIdeas} أفكار بانتظار الاعتماد لتقليل زمن الـPipeline.`
        );
      }

      const automation =
        this.getAutomation();

      const failedExecutions =
        Array.isArray(
          automation.executionHistory
        )
          ? automation.executionHistory.filter(
              entry =>
                [
                  "failed",
                  "error",
                  "فشل",
                  "فاشل"
                ].includes(
                  this.normalizeStatus(
                    entry.status
                  )
                )
            ).length
          : 0;

      if (failedExecutions > 0) {
        recommendations.push(
          `تحليل ${failedExecutions} عمليات أتمتة فاشلة وربط أسبابها بمؤشرات الأداء.`
        );
      }

      if (!recommendations.length) {
        recommendations.push(
          "مراجعة المؤشرات شهرياً وتحديث القيم وخط الأساس عند توفر بيانات تشغيلية جديدة."
        );
      }

      return recommendations.slice(0, 6);
    },

    getAiReport(context = {}) {
      try {
        if (
          typeof window.AIW?.AI?.generateExecutiveReport ===
          "function"
        ) {
          const report =
            window.AIW.AI.generateExecutiveReport(
              context
            );

          if (
            report &&
            typeof report === "object"
          ) {
            return report;
          }
        }
      } catch (error) {
        console.warn(
          "AI Work KPIs V5.1: AI report unavailable.",
          error
        );
      }

      if (context.metrics.behind > 0) {
        return {
          status:
            "توجد مؤشرات تحتاج تدخلاً تنفيذياً",

          message:
            `يوجد ${context.metrics.behind} مؤشرات دون حد الانتباه. ` +
            "ابدأ بالمؤشرات الأقل تقدماً واربط كل إجراء بمالك وموعد مراجعة."
        };
      }

      return {
        status:
          "محفظة المؤشرات مستقرة",

        message:
          "استمر في تحديث القيم وربط المؤشرات بالمشاريع والقرارات وسجل التنفيذ."
      };
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

        const center =
          this.getKpiCenter();

        const kpis =
          this.getAllKpis()
            .filter(
              kpi =>
                kpi.status !==
                this.status.ARCHIVED
            );

        const activeKpis =
          kpis.filter(
            kpi =>
              kpi.status ===
              this.status.ACTIVE
          );

        const metrics =
          this.calculateMetrics(
            activeKpis,
            center.settings
          );

        const onTrackTotal =
          metrics.advanced +
          metrics.onTrack;

        const executiveScore =
          this.getExecutiveScore(metrics);

        const recommendations =
          this.getRecommendations({
            kpis: activeKpis,
            metrics,
            settings:
              center.settings
          });

        const aiReport =
          this.getAiReport({
            kpis: activeKpis,
            metrics,
            executiveScore
          });

        container.innerHTML = `
          <section class="module-page">
            ${
              typeof widgets?.hero === "function"
                ? widgets.hero({
                    kicker:
                      "Biometric KPI Engine · Performance",

                    title:
                      "مركز مؤشرات الأداء",

                    description:
                      "محرك قياس فعلي يربط الأفكار والمشاريع والاعتمادات والأتمتة والقرارات بالمؤشرات التشغيلية ضمن Store V2.2.",

                    chips: [
                      "👁️ Biometric KPIs",
                      `🎯 ${activeKpis.length} مؤشرات`,
                      `📊 ${metrics.averageProgress}% متوسط التقدم`,
                      `🧠 Executive Score ${executiveScore}%`,
                      `📝 ${center.history.length} تحديثات`
                    ]
                  })
                : this.fallbackHero(
                    activeKpis.length,
                    metrics.averageProgress,
                    executiveScore,
                    center.history.length
                  )
            }

            <div class="module-grid">
              ${this.kpi(
                "عدد المؤشرات",
                activeKpis.length,
                "Core + Derived KPIs"
              )}

              ${this.kpi(
                "على المسار",
                onTrackTotal,
                "Advanced + On Track"
              )}

              ${this.kpi(
                "متقدمة",
                metrics.advanced,
                "Advanced"
              )}

              ${this.kpi(
                "متأخرة",
                metrics.behind,
                "Needs Attention"
              )}

              ${this.kpi(
                "متوسط التقدم",
                `${metrics.averageProgress}%`,
                "Average Progress"
              )}

              ${this.kpi(
                "Executive Score",
                `${executiveScore}%`,
                "Overall"
              )}
            </div>

            <div class="module-wide-grid">
              <div class="module-panel">
                ${this.sectionTitle(
                  "الخلاصة التنفيذية للمؤشرات",
                  "قراءة مباشرة لحالة المؤشرات الفعلية والمشتقة."
                )}

                <div class="kpi-ultimate-summary">
                  <strong>
                    المؤشرات تربط دورة الفكرة والمشروع والقرار بالأثر القابل للقياس
                  </strong>

                  <p>
                    تتم قراءة المؤشرات من Store V2.2، وتُضاف إليها مؤشرات مشتقة
                    من حالة الأفكار والمشاريع والأتمتة والحوكمة والمخاطر.
                  </p>

                  <div class="kpi-summary-strip">
                    <div>
                      <span>Progress</span>
                      <b>${metrics.averageProgress}%</b>
                    </div>

                    <div>
                      <span>On Track</span>
                      <b>${onTrackTotal}</b>
                    </div>

                    <div>
                      <span>Behind</span>
                      <b>${metrics.behind}</b>
                    </div>

                    <div>
                      <span>Score</span>
                      <b>${executiveScore}%</b>
                    </div>
                  </div>
                </div>
              </div>

              <div class="module-panel">
                ${this.sectionTitle(
                  "AI KPI Insight",
                  "توصية ذكية مبنية على حالة المؤشرات الحالية."
                )}

                <div class="kpi-ai-card">
                  <strong>
                    ${this.escapeHtml(aiReport.status)}
                  </strong>

                  <p>
                    ${this.escapeHtml(aiReport.message)}
                  </p>

                  <button
                    type="button"
                    class="module-btn secondary"
                    data-kpi-action="open-reports"
                  >
                    فتح التقارير
                  </button>
                </div>
              </div>
            </div>

            <div class="module-wide-grid">
              <div class="module-panel">
                ${this.sectionTitle(
                  "KPI Progress Chart",
                  "مقارنة التقدم الحالي لجميع المؤشرات."
                )}

                <div class="kpi-chart-card">
                  <canvas id="kpiProgressChart"></canvas>
                </div>
              </div>

              <div class="module-panel">
                ${this.sectionTitle(
                  "KPI Health",
                  "توزيع حالة المؤشرات بدون تكرار بين التصنيفات."
                )}

                <div class="kpi-chart-card">
                  <canvas id="kpiHealthChart"></canvas>
                </div>
              </div>
            </div>

            <div class="module-panel">
              ${this.sectionTitle(
                "مؤشرات الأداء الرئيسية",
                "المؤشرات اليدوية والمشتقة المرتبطة بالـPipeline الحقيقي."
              )}

              ${
                activeKpis.length
                  ? `
                    <div class="kpi-list">
                      ${activeKpis
                        .map(kpi =>
                          this.renderKpi(
                            kpi,
                            center.settings
                          )
                        )
                        .join("")}
                    </div>
                  `
                  : this.emptyState(
                      "لا توجد مؤشرات أداء مسجلة حالياً."
                    )
              }
            </div>

            <div class="module-panel">
              ${this.sectionTitle(
                "KPI Update History",
                "آخر تحديثات القيم والمستهدفات المسجلة."
              )}

              ${this.renderHistory(
                center.history,
                center.items
              )}
            </div>

            <div class="module-panel">
              ${this.sectionTitle(
                "KPI Governance Model",
                "آلية اعتماد وقياس المؤشرات."
              )}

              <div class="kpi-governance-grid">
                <div>
                  <b>1</b>
                  <strong>Baseline</strong>
                  <span>
                    تحديد خط الأساس للمؤشر من البيانات الحالية.
                  </span>
                </div>

                <div>
                  <b>2</b>
                  <strong>Target</strong>
                  <span>
                    اعتماد المستهدف والمالك ودورة القياس.
                  </span>
                </div>

                <div>
                  <b>3</b>
                  <strong>Measure</strong>
                  <span>
                    تحديث القيمة وربطها بالمشروع أو العملية.
                  </span>
                </div>

                <div>
                  <b>4</b>
                  <strong>Review</strong>
                  <span>
                    مراجعة الاتجاه والحالة والقرار المطلوب.
                  </span>
                </div>
              </div>
            </div>

            <div class="module-wide-grid">
              <div class="module-panel">
                ${this.sectionTitle(
                  "Executive Recommendations",
                  "الإجراءات المقترحة لرفع أداء المؤشرات."
                )}

                ${this.renderExecutiveList(
                  recommendations
                )}
              </div>

              <div class="module-panel">
                ${this.sectionTitle(
                  "KPI Ownership",
                  "توزيع ملكية المؤشرات."
                )}

                <div class="kpi-owner-list">
                  ${activeKpis
                    .map(kpi => `
                      <div>
                        <strong>
                          ${this.escapeHtml(kpi.title)}
                        </strong>

                        <span>
                          ${this.escapeHtml(kpi.owner)}
                        </span>

                        <small>
                          ${this.escapeHtml(kpi.frequency)}
                          ·
                          ${this.escapeHtml(
                            kpi.derived
                              ? "مشتق تلقائياً"
                              : "مؤشر محفوظ"
                          )}
                        </small>
                      </div>
                    `)
                    .join("")}
                </div>
              </div>
            </div>
          </section>
        `;

        this.renderCharts(
          activeKpis,
          metrics
        );

        this.bindActionEvents();
        this.bindAutomaticSync();
      } finally {
        this._isRendering = false;
      }
    },

    /* =======================================================
       KPI Card
    ======================================================= */

    renderKpi(kpi, settings) {
      const progress =
        this.progress(kpi);

      const editable =
        kpi.derived !== true;

      return `
        <article
          class="kpi-card"
          data-kpi-id="${this.escapeAttribute(kpi.id)}"
        >
          <div class="kpi-card-head">
            <div class="kpi-icon">
              ${this.escapeHtml(kpi.icon)}
            </div>

            <span
              class="aiw-status ${this.healthClass(
                progress,
                settings
              )}"
            >
              ${this.escapeHtml(
                this.healthLabel(
                  progress,
                  settings
                )
              )}
            </span>
          </div>

          <h3>
            ${this.escapeHtml(kpi.title)}
          </h3>

          <p>
            ${this.escapeHtml(kpi.desc)}
          </p>

          <div class="kpi-values">
            <div>
              <span>الحالي</span>
              <strong>
                ${this.formatValue(
                  kpi.current,
                  kpi.unit
                )}
              </strong>
            </div>

            <div>
              <span>المستهدف</span>
              <strong>
                ${this.formatValue(
                  kpi.target,
                  kpi.unit
                )}
              </strong>
            </div>
          </div>

          <div class="kpi-meta-row">
            <span>
              المالك:
              ${this.escapeHtml(kpi.owner)}
            </span>

            <span>
              ${this.trendIcon(kpi)}
              ${this.escapeHtml(
                this.trendLabel(kpi)
              )}
            </span>
          </div>

          <div class="aiw-progress">
            <div style="width:${progress}%"></div>
          </div>

          <small>
            ${progress}% من المستهدف
            ·
            ${this.escapeHtml(
              kpi.derived
                ? "مشتق تلقائياً"
                : kpi.frequency
            )}
          </small>

          <div class="kpi-card-actions">
            <button
              type="button"
              class="kpi-action-button secondary"
              data-kpi-action="details"
              data-kpi-id="${this.escapeAttribute(kpi.id)}"
            >
              عرض التفاصيل
            </button>

            ${
              editable
                ? `
                  <button
                    type="button"
                    class="kpi-action-button primary"
                    data-kpi-action="update-value"
                    data-kpi-id="${this.escapeAttribute(kpi.id)}"
                  >
                    تحديث القيمة
                  </button>

                  <button
                    type="button"
                    class="kpi-action-button target"
                    data-kpi-action="update-target"
                    data-kpi-id="${this.escapeAttribute(kpi.id)}"
                  >
                    تحديث المستهدف
                  </button>
                `
                : `
                  <button
                    type="button"
                    class="kpi-action-button derived"
                    disabled
                  >
                    تحديث تلقائي
                  </button>
                `
            }
          </div>
        </article>
      `;
    },

    /* =======================================================
       History
    ======================================================= */

    renderHistory(history = [], items = []) {
      if (!history.length) {
        return this.emptyState(
          "لا يوجد سجل تحديث للمؤشرات حالياً."
        );
      }

      const rows = [...history]
        .sort((a, b) => {
          const timeA =
            new Date(a.createdAt || 0).getTime();

          const timeB =
            new Date(b.createdAt || 0).getTime();

          return timeB - timeA;
        })
        .slice(
          0,
          this.config.maximumHistoryRows
        );

      return `
        <div class="kpi-history-list">
          ${rows
            .map(entry => {
              const kpi = items.find(
                item =>
                  String(item.id) ===
                  String(entry.kpiId)
              );

              const label =
                entry.action === "target-update"
                  ? "تحديث المستهدف"
                  : "تحديث القيمة";

              return `
                <div class="kpi-history-row">
                  <span>📈</span>

                  <div>
                    <strong>
                      ${this.escapeHtml(
                        kpi?.title ||
                        "مؤشر أداء"
                      )}
                    </strong>

                    <small>
                      ${this.escapeHtml(entry.actor)}
                      ·
                      ${this.escapeHtml(
                        entry.notes ||
                        label
                      )}
                    </small>
                  </div>

                  <div class="kpi-history-meta">
                    <b>
                      ${
                        entry.action === "target-update"
                          ? `Target: ${this.formatValue(
                              entry.target,
                              kpi?.unit || ""
                            )}`
                          : this.formatValue(
                              entry.value,
                              kpi?.unit || ""
                            )
                      }
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

    renderCharts(kpis, metrics) {
      if (!window.AIW?.Charts) {
        return;
      }

      setTimeout(() => {
        const labels =
          kpis.map(kpi =>
            kpi.title
          );

        const progressValues =
          kpis.map(kpi =>
            this.progress(kpi)
          );

        if (
          typeof window.AIW.Charts.bar ===
          "function"
        ) {
          window.AIW.Charts.bar(
            "kpiProgressChart",
            labels,
            progressValues,
            "KPI Progress"
          );
        }

        if (
          typeof window.AIW.Charts.doughnut ===
          "function"
        ) {
          window.AIW.Charts.doughnut(
            "kpiHealthChart",
            [
              "متقدمة",
              "على المسار",
              "قيد البناء",
              "متأخرة"
            ],
            [
              metrics.advanced,
              metrics.onTrack,
              metrics.building,
              metrics.behind
            ],
            "KPI Health"
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
              "[data-kpi-action]"
            );

          if (
            !button ||
            !this._container?.contains(button)
          ) {
            return;
          }

          const action =
            button.dataset.kpiAction;

          if (action === "open-reports") {
            this.openModule("reports");
            return;
          }

          if (action === "details") {
            this.openKpiDetails(
              button.dataset.kpiId
            );
            return;
          }

          if (action === "update-value") {
            this.openUpdateModal(
              button.dataset.kpiId,
              "value"
            );
            return;
          }

          if (action === "update-target") {
            this.openUpdateModal(
              button.dataset.kpiId,
              "target"
            );
          }
        }
      );
    },

    openUpdateModal(kpiId, mode = "value") {
      const kpi =
        this.getKpiCenter()
          .items
          .find(
            item =>
              String(item.id) ===
              String(kpiId)
          );

      if (!kpi) {
        this.showToast(
          "لم يتم العثور على المؤشر.",
          "error"
        );
        return;
      }

      const isTarget =
        mode === "target";

      this.openConfirmation({
        type:
          isTarget
            ? "update-target"
            : "update-value",

        kpi,
        icon:
          isTarget
            ? "🎯"
            : "📈",

        title:
          isTarget
            ? "تحديث مستهدف المؤشر"
            : "تحديث قيمة المؤشر",

        message:
          isTarget
            ? `المستهدف الحالي لمؤشر «${kpi.title}» هو ${this.formatValue(kpi.target, kpi.unit)}.`
            : `القيمة الحالية لمؤشر «${kpi.title}» هي ${this.formatValue(kpi.current, kpi.unit)}.`,

        confirmText:
          isTarget
            ? "حفظ المستهدف"
            : "حفظ القيمة",

        noteLabel:
          isTarget
            ? "سبب تحديث المستهدف"
            : "ملاحظات التحديث",

        inputLabel:
          isTarget
            ? "المستهدف الجديد"
            : "القيمة الجديدة",

        inputValue:
          isTarget
            ? kpi.target
            : kpi.current,

        inputType: "number",
        requiredValue: true,

        requiredNotes:
          (
            kpi.sensitive === true ||
            isTarget
          ) &&
          this.getKpiCenter()
            .settings
            .humanApprovalRequired
      });
    },

    executePendingAction(value, notes = "") {
      if (
        !this._pendingAction ||
        this._isSaving
      ) {
        return;
      }

      if (
        this._pendingAction.requiredValue &&
        String(value).trim() === ""
      ) {
        this.showToast(
          "يرجى إدخال القيمة الجديدة.",
          "error"
        );
        return;
      }

      if (
        this._pendingAction.requiredNotes &&
        !notes.trim()
      ) {
        this.showToast(
          "هذه العملية تتطلب ملاحظة اعتماد.",
          "error"
        );
        return;
      }

      this._isSaving = true;

      try {
        let result = null;

        if (
          this._pendingAction.type ===
          "update-value"
        ) {
          result =
            this.updateKpiValue(
              this._pendingAction.kpi.id,
              value,
              notes
            );
        }

        if (
          this._pendingAction.type ===
          "update-target"
        ) {
          result =
            this.updateKpiTarget(
              this._pendingAction.kpi.id,
              value,
              notes
            );
        }

        if (!result?.success) {
          this.showToast(
            result?.message ||
            "تعذر تحديث المؤشر.",
            "error"
          );
          return;
        }

        const message =
          this._pendingAction.type ===
          "update-target"
            ? "تم تحديث مستهدف المؤشر وتسجيله في السجل."
            : "تم تحديث قيمة المؤشر وتسجيلها في السجل.";

        this.closeConfirmation();

        this.showToast(
          message,
          "success"
        );

        this.scheduleRefresh();
      } finally {
        this._isSaving = false;
      }
    },

    /* =======================================================
       Details Modal
    ======================================================= */

    openKpiDetails(kpiId) {
      const kpi =
        this.getAllKpis()
          .find(
            item =>
              String(item.id) ===
              String(kpiId)
          );

      if (!kpi) {
        this.showToast(
          "لم يتم العثور على المؤشر.",
          "error"
        );
        return;
      }

      this.closeKpiDetails();

      const center =
        this.getKpiCenter();

      const progress =
        this.progress(kpi);

      const history =
        center.history
          .filter(
            entry =>
              String(entry.kpiId) ===
              String(kpi.id)
          )
          .slice(-6)
          .reverse();

      const modal =
        document.createElement("div");

      modal.className =
        "kpi-details-overlay";

      modal.innerHTML = `
        <div
          class="kpi-details-dialog"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            class="kpi-details-close"
            data-kpi-details-close
            aria-label="إغلاق"
          >
            ×
          </button>

          <div class="kpi-details-heading">
            <div>
              ${this.escapeHtml(kpi.icon)}
            </div>

            <span>
              ${
                kpi.derived
                  ? "Derived KPI"
                  : "Stored KPI"
              }
            </span>

            <h3>
              ${this.escapeHtml(kpi.title)}
            </h3>

            <p>
              ${this.escapeHtml(kpi.desc)}
            </p>
          </div>

          <div class="kpi-details-kpis">
            <div>
              <small>Current</small>
              <strong>
                ${this.formatValue(
                  kpi.current,
                  kpi.unit
                )}
              </strong>
            </div>

            <div>
              <small>Target</small>
              <strong>
                ${this.formatValue(
                  kpi.target,
                  kpi.unit
                )}
              </strong>
            </div>

            <div>
              <small>Progress</small>
              <strong>${progress}%</strong>
            </div>

            <div>
              <small>Trend</small>
              <strong>
                ${this.escapeHtml(
                  this.trendLabel(kpi)
                )}
              </strong>
            </div>
          </div>

          <div class="kpi-details-section">
            <strong>الملكية والقياس</strong>

            <p>
              المالك:
              ${this.escapeHtml(kpi.owner)}
            </p>

            <p>
              دورة القياس:
              ${this.escapeHtml(kpi.frequency)}
            </p>

            <p>
              الاتجاه:
              ${
                kpi.direction ===
                this.direction.LOWER
                  ? "الأقل أفضل"
                  : "الأعلى أفضل"
              }
            </p>
          </div>

          <div class="kpi-details-section">
            <strong>آخر التحديثات</strong>

            ${
              history.length
                ? `
                  <div class="kpi-details-history">
                    ${history
                      .map(entry => `
                        <div>
                          <b>
                            ${
                              entry.action === "target-update"
                                ? `Target: ${this.formatValue(
                                    entry.target,
                                    kpi.unit
                                  )}`
                                : this.formatValue(
                                    entry.value,
                                    kpi.unit
                                  )
                            }
                          </b>

                          <span>
                            ${this.escapeHtml(
                              this.formatDateTime(
                                entry.createdAt,
                                "غير محدد"
                              )
                            )}
                          </span>
                        </div>
                      `)
                      .join("")}
                  </div>
                `
                : this.emptyState(
                    "لا توجد تحديثات مسجلة لهذا المؤشر."
                  )
            }
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
              "[data-kpi-details-close]"
            )
          ) {
            this.closeKpiDetails();
          }
        }
      );

      modal.addEventListener(
        "keydown",
        event => {
          if (event.key === "Escape") {
            this.closeKpiDetails();
          }
        }
      );

      requestAnimationFrame(() => {
        modal.classList.add("visible");
      });
    },

    closeKpiDetails() {
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
       Confirmation Modal
    ======================================================= */

    openConfirmation(config = {}) {
      this.closeConfirmation();

      this._pendingAction = {
        ...config
      };

      const modal =
        document.createElement("div");

      modal.className =
        "kpi-confirmation-overlay";

      modal.innerHTML = `
        <div
          class="kpi-confirmation-dialog"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            class="kpi-confirmation-close"
            data-kpi-confirmation-close
            aria-label="إغلاق"
          >
            ×
          </button>

          <div class="kpi-confirmation-icon">
            ${this.escapeHtml(
              config.icon || "📈"
            )}
          </div>

          <h3>
            ${this.escapeHtml(
              config.title ||
              "تحديث المؤشر"
            )}
          </h3>

          <p>
            ${this.escapeHtml(
              config.message ||
              ""
            )}
          </p>

          <label class="kpi-confirmation-field">
            <span>
              ${this.escapeHtml(
                config.inputLabel ||
                "القيمة"
              )}
            </span>

            <input
              type="${this.escapeAttribute(
                config.inputType ||
                "number"
              )}"
              value="${this.escapeAttribute(
                config.inputValue ??
                ""
              )}"
              data-kpi-confirmation-value
            />
          </label>

          <label class="kpi-confirmation-field">
            <span>
              ${this.escapeHtml(
                config.noteLabel ||
                "ملاحظات"
              )}

              ${
                config.requiredNotes
                  ? "<em>مطلوب</em>"
                  : ""
              }
            </span>

            <textarea
              rows="3"
              data-kpi-confirmation-notes
              placeholder="${
                config.requiredNotes
                  ? "أدخل ملاحظة الاعتماد..."
                  : "إضافة ملاحظة اختيارية..."
              }"
            ></textarea>
          </label>

          <div class="kpi-confirmation-actions">
            <button
              type="button"
              class="kpi-action-button secondary"
              data-kpi-confirmation-close
            >
              إلغاء
            </button>

            <button
              type="button"
              class="kpi-action-button primary"
              data-kpi-confirmation-submit
            >
              ${this.escapeHtml(
                config.confirmText ||
                "حفظ"
              )}
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this._confirmationModal = modal;

      modal.addEventListener(
        "click",
        event => {
          if (
            event.target === modal ||
            event.target.closest(
              "[data-kpi-confirmation-close]"
            )
          ) {
            this.closeConfirmation();
            return;
          }

          if (
            event.target.closest(
              "[data-kpi-confirmation-submit]"
            )
          ) {
            const value =
              modal
                .querySelector(
                  "[data-kpi-confirmation-value]"
                )
                ?.value ??
              "";

            const notes =
              modal
                .querySelector(
                  "[data-kpi-confirmation-notes]"
                )
                ?.value?.trim() ||
              "";

            this.executePendingAction(
              value,
              notes
            );
          }
        }
      );

      modal.addEventListener(
        "keydown",
        event => {
          if (event.key === "Escape") {
            this.closeConfirmation();
          }

          if (
            event.key === "Enter" &&
            (event.ctrlKey || event.metaKey)
          ) {
            const value =
              modal
                .querySelector(
                  "[data-kpi-confirmation-value]"
                )
                ?.value ??
              "";

            const notes =
              modal
                .querySelector(
                  "[data-kpi-confirmation-notes]"
                )
                ?.value?.trim() ||
              "";

            this.executePendingAction(
              value,
              notes
            );
          }
        }
      );

      requestAnimationFrame(() => {
        modal.classList.add("visible");

        modal
          .querySelector(
            "[data-kpi-confirmation-value]"
          )
          ?.focus();
      });
    },

    closeConfirmation() {
      if (!this._confirmationModal) {
        this._pendingAction = null;
        return;
      }

      const modal =
        this._confirmationModal;

      modal.classList.remove("visible");

      setTimeout(() => {
        modal.remove();
      }, 180);

      this._confirmationModal = null;
      this._pendingAction = null;
    },

    /* =======================================================
       Shared UI
    ======================================================= */

    renderExecutiveList(items = []) {
      if (!items.length) {
        return this.emptyState(
          "لا توجد توصيات حالياً."
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

    fallbackHero(
      count,
      averageProgress,
      executiveScore,
      historyCount
    ) {
      return `
        <div class="module-hero">
          <span class="module-kicker">
            Biometric KPI Engine · Performance
          </span>

          <h1>
            مركز مؤشرات الأداء
          </h1>

          <p>
            مؤشرات فعلية ومشتقة تربط الأفكار والمشاريع والقرارات والأتمتة بالأثر القابل للقياس.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">
              🎯 ${count} مؤشرات
            </span>

            <span class="aiw-chip">
              📊 ${averageProgress}% متوسط التقدم
            </span>

            <span class="aiw-chip">
              🧠 ${executiveScore}% Executive Score
            </span>

            <span class="aiw-chip">
              📝 ${historyCount} تحديثات
            </span>
          </div>
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
        "aiw:kpisUpdated",
        "aiw:kpiValueUpdated",
        "aiw:kpiTargetUpdated",
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
        "aiw:workflowExecuted",
        "aiw:decisionUpdated",
        "aiw:reportsUpdated"
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

      this.closeConfirmation();
      this.closeKpiDetails();
    },

    /* =======================================================
       Helpers
    ======================================================= */

    isPendingIdea(idea = {}) {
      return [
        this.ideaStatus.SUBMITTED,
        this.ideaStatus.PENDING
      ].includes(
        this.getIdeaStatus(idea)
      );
    },

    isApprovedIdea(idea = {}) {
      return (
        this.getIdeaStatus(idea) ===
        this.ideaStatus.APPROVED
      );
    },

    isConvertedIdea(idea = {}) {
      return (
        this.getIdeaStatus(idea) ===
        this.ideaStatus.CONVERTED
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

    isClosedProject(project = {}) {
      return [
        this.projectStatus.COMPLETED,
        this.projectStatus.CANCELLED,
        this.projectStatus.ARCHIVED
      ].includes(
        this.getProjectStatus(project)
      );
    },

    isCompletedExecution(entry = {}) {
      return [
        "completed",
        "success",
        "successful",
        "مكتمل",
        "ناجح"
      ].includes(
        this.normalizeStatus(
          entry.status ??
          entry.state ??
          ""
        )
      );
    },

    isActiveControl(control = {}) {
      if (typeof control === "string") {
        return Boolean(control.trim());
      }

      if (
        control?.enabled === true ||
        control?.active === true
      ) {
        return true;
      }

      const status =
        this.normalizeStatus(
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
    },

    isHighRisk(level) {
      const value =
        this.normalizeStatus(level);

      return (
        value.includes("عال") ||
        [
          "high",
          "critical",
          "حرج"
        ].includes(value)
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

    /* =======================================================
       Toast
    ======================================================= */

    showToast(message, type = "success") {
      document
        .querySelector(
          ".kpi-workflow-toast"
        )
        ?.remove();

      const toast =
        document.createElement("div");

      toast.className =
        `kpi-workflow-toast ${type}`;

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
        .kpi-card-actions {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 9px;
          margin-top: 15px;
          padding-top: 14px;
          border-top:
            1px solid rgba(15, 23, 42, 0.08);
        }

        .kpi-action-button {
          appearance: none;
          min-height: 42px;
          padding: 10px 12px;
          border: 0;
          border-radius: 13px;
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .kpi-action-button.primary {
          color: #fff;
          background: #101b2f;
        }

        .kpi-action-button.secondary {
          color: #344054;
          background: #f2f4f7;
          border: 1px solid #e4e7ec;
        }

        .kpi-action-button.target {
          color: #3159bf;
          background: #edf3ff;
          border: 1px solid #dbe7ff;
        }

        .kpi-action-button.derived {
          grid-column: span 2;
          color: #667085;
          background: #f2f4f7;
          cursor: not-allowed;
        }

        .kpi-history-list {
          display: grid;
          gap: 10px;
        }

        .kpi-history-row {
          display: grid;
          grid-template-columns:
            auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          padding: 13px 14px;
          border:
            1px solid rgba(15, 23, 42, 0.07);
          border-radius: 16px;
          background: #f9fafb;
        }

        .kpi-history-row > span {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border-radius: 13px;
          background: #edf3ff;
        }

        .kpi-history-row strong,
        .kpi-history-row small {
          display: block;
        }

        .kpi-history-row strong {
          color: #101828;
          font-size: 13px;
        }

        .kpi-history-row small {
          margin-top: 4px;
          color: #667085;
          font-size: 10px;
        }

        .kpi-history-meta {
          text-align: left;
        }

        .kpi-history-meta b {
          display: block;
          color: #101828;
          font-size: 13px;
        }

        .kpi-details-overlay,
        .kpi-confirmation-overlay {
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

        .kpi-details-overlay.visible,
        .kpi-confirmation-overlay.visible {
          opacity: 1;
        }

        .kpi-details-dialog,
        .kpi-confirmation-dialog {
          position: relative;
          width: min(100%, 560px);
          max-height: min(86vh, 760px);
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

        .kpi-details-overlay.visible
        .kpi-details-dialog,
        .kpi-confirmation-overlay.visible
        .kpi-confirmation-dialog {
          transform:
            translateY(0)
            scale(1);
        }

        .kpi-details-close,
        .kpi-confirmation-close {
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
          line-height: 1;
          cursor: pointer;
        }

        .kpi-details-heading > div,
        .kpi-confirmation-icon {
          display: grid;
          place-items: center;
          width: 62px;
          height: 62px;
          margin-bottom: 16px;
          border-radius: 20px;
          font-size: 30px;
          background: #101b2f;
        }

        .kpi-details-heading > span {
          color: #667085;
          font-size: 11px;
          font-weight: 800;
        }

        .kpi-details-heading h3,
        .kpi-confirmation-dialog h3 {
          margin: 7px 0 8px;
          color: #101828;
          font-size: 22px;
          line-height: 1.5;
        }

        .kpi-details-heading p,
        .kpi-confirmation-dialog > p {
          margin: 0;
          color: #667085;
          font-size: 14px;
          line-height: 1.8;
        }

        .kpi-details-kpis {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 9px;
          margin-top: 20px;
        }

        .kpi-details-kpis > div {
          min-width: 0;
          padding: 12px 9px;
          border-radius: 14px;
          text-align: center;
          background: #f7f8fa;
        }

        .kpi-details-kpis small,
        .kpi-details-kpis strong {
          display: block;
        }

        .kpi-details-kpis small {
          margin-bottom: 5px;
          color: #667085;
          font-size: 10px;
        }

        .kpi-details-kpis strong {
          color: #101828;
          font-size: 13px;
        }

        .kpi-details-section {
          margin-top: 20px;
          padding-top: 17px;
          border-top:
            1px solid rgba(15, 23, 42, 0.08);
        }

        .kpi-details-section > strong {
          display: block;
          margin-bottom: 9px;
          color: #101828;
          font-size: 14px;
        }

        .kpi-details-section > p {
          margin: 6px 0;
          color: #667085;
          font-size: 13px;
          line-height: 1.7;
        }

        .kpi-details-history {
          display: grid;
          gap: 8px;
        }

        .kpi-details-history > div {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 11px;
          border-radius: 12px;
          background: #f9fafb;
        }

        .kpi-details-history b {
          color: #101828;
          font-size: 12px;
        }

        .kpi-details-history span {
          color: #667085;
          font-size: 10px;
        }

        .kpi-confirmation-field {
          display: block;
          margin-top: 18px;
        }

        .kpi-confirmation-field > span {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          color: #344054;
          font-size: 13px;
          font-weight: 800;
        }

        .kpi-confirmation-field em {
          padding: 3px 7px;
          border-radius: 999px;
          color: #b42318;
          background: #feeceb;
          font-size: 10px;
          font-style: normal;
        }

        .kpi-confirmation-field input,
        .kpi-confirmation-field textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 13px 14px;
          border: 1px solid #d0d5dd;
          border-radius: 15px;
          color: #101828;
          background: #fff;
          font: inherit;
          outline: none;
        }

        .kpi-confirmation-field textarea {
          min-height: 94px;
          resize: vertical;
        }

        .kpi-confirmation-actions {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 10px;
          margin-top: 22px;
        }

        .kpi-workflow-toast {
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

        .kpi-workflow-toast.visible {
          opacity: 1;
          transform:
            translateX(50%)
            translateY(0);
        }

        .kpi-workflow-toast.success {
          background: #087d3e;
        }

        .kpi-workflow-toast.error {
          background: #b42318;
        }

        @media (max-width: 760px) {
          .kpi-card-actions {
            grid-template-columns: 1fr;
          }

          .kpi-action-button.derived {
            grid-column: auto;
          }

          .kpi-details-kpis {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .kpi-confirmation-actions {
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

    formatValue(value, unit) {
      const number =
        this.toSafeNumber(
          value,
          0
        );

      return `${number} ${unit || ""}`.trim();
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

    firstFiniteNumber(values = []) {
      for (const value of values) {
        const number =
          Number(value);

        if (Number.isFinite(number)) {
          return number;
        }
      }

      return null;
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
