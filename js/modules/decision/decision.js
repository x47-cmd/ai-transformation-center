/* =========================================================
   AI Work - Decision Intelligence Center V5.0
   Enterprise Biometric Executive Decision Support
   Store V2.2 Native Architecture

   File Path:
   js/modules/decision/decision.js

   Features:
   - AIW.Store V2.2 as Single Source of Truth
   - No internal default scenario seeding
   - Native decision object integration
   - Real decisionHistory integration
   - Idea approval and conversion decisions
   - Project, governance and risk decisions
   - Automation approval queue synchronization
   - Human-in-the-Loop enforcement
   - Dynamic project and scenario ranking
   - Decision confirmation and audit trail
   - Cross-page Store synchronization
   - Existing core UI design preserved
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.decision = {
  id: "decision",
  title: "القرار",
  icon: "🧭",
  version: "5.0.0",

  _container: null,
  _unsubscribeStore: null,
  _refreshTimer: null,
  _confirmationModal: null,
  _detailsModal: null,
  _pendingAction: null,
  _eventsBound: false,
  _syncBound: false,
  _isRendering: false,
  _isExecuting: false,

  config: {
    actor: "الإدارة",
    refreshDelay: 80,
    styleId: "aiw-decision-v50-styles",
    defaultTopProjectsLimit: 5,
    minimumDecisionScore: 60,
    maximumHistoryRows: 30,
    selectedProjectKey: "aiwSelectedProjectId",
    selectedIdeaKey: "aiwSelectedIdeaId"
  },

  decisionStatus: {
    PROPOSED: "proposed",
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    DEFERRED: "deferred",
    IMPLEMENTED: "implemented",
    ARCHIVED: "archived"
  },

  sourceType: {
    IDEA: "idea",
    PROJECT: "project",
    RISK: "risk",
    GOVERNANCE: "governance",
    AUTOMATION: "automation",
    SCENARIO: "scenario",
    MANUAL: "manual"
  },

  lifecycle: {
    IDEA: "idea",
    PENDING: "pending-approval",
    APPROVED: "approved",
    REJECTED: "rejected",
    CONVERTED: "converted-to-project"
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
      console.error("AI Work Decision V5.0: AIW.Store is unavailable.");
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
        "AI Work Decision V5.0: Unable to read Store state.",
        error
      );
    }

    return {};
  },

  getCollection(name) {
    const collection = this.getState()?.[name];
    return Array.isArray(collection) ? collection : [];
  },

  /* =======================================================
     Native Decision Reader
  ======================================================= */

  getDecisionSource() {
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

  getDecisionCenter() {
    const source = this.getDecisionSource();

    return {
      scenarios: Array.isArray(source.scenarios)
        ? source.scenarios
            .map((scenario, index) =>
              this.normalizeScenario(scenario, index)
            )
            .filter(Boolean)
        : [],

      criteria: Array.isArray(source.criteria)
        ? source.criteria
            .map((criterion, index) =>
              this.normalizeCriterion(criterion, index)
            )
            .filter(Boolean)
        : [],

      analysisScenarios: Array.isArray(source.analysisScenarios)
        ? source.analysisScenarios
        : [],

      timeline: Array.isArray(source.timeline)
        ? source.timeline
        : [],

      decisionHistory: Array.isArray(source.decisionHistory)
        ? source.decisionHistory
            .map((decision, index) =>
              this.normalizeDecisionRecord(decision, index)
            )
            .filter(Boolean)
        : [],

      settings: {
        decisionMode:
          source.settings?.decisionMode ||
          "AI Assisted",

        humanApprovalRequired:
          source.settings?.humanApprovalRequired !== false,

        topProjectsLimit:
          Math.max(
            1,
            this.toSafeNumber(
              source.settings?.topProjectsLimit,
              this.config.defaultTopProjectsLimit
            )
          ),

        minimumDecisionScore:
          this.normalizePercent(
            source.settings?.minimumDecisionScore,
            this.config.minimumDecisionScore
          ),

        reviewCycle:
          source.settings?.reviewCycle ||
          "ربع سنوي",

        autoCreateProject:
          source.settings?.autoCreateProject === true
      },

      briefing: {
        title:
          source.briefing?.title || "",

        description:
          source.briefing?.description || ""
      },

      statistics: {
        approved:
          this.toSafeNumber(
            source.statistics?.approved,
            0
          ),

        rejected:
          this.toSafeNumber(
            source.statistics?.rejected,
            0
          ),

        deferred:
          this.toSafeNumber(
            source.statistics?.deferred,
            0
          ),

        pending:
          this.toSafeNumber(
            source.statistics?.pending,
            0
          ),

        lastDecisionAt:
          source.statistics?.lastDecisionAt || null
      },

      meta: {
        createdAt:
          source.meta?.createdAt || null,

        updatedAt:
          source.meta?.updatedAt || null
      }
    };
  },

  getIdeas() {
    const store = this.getStore();

    try {
      if (typeof store?.getIdeas === "function") {
        const ideas = store.getIdeas();
        if (Array.isArray(ideas)) return ideas;
      }
    } catch (error) {
      console.warn("AI Work Decision V5.0: getIdeas failed.", error);
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
      console.warn("AI Work Decision V5.0: getProjects failed.", error);
    }

    return this.getCollection("projects");
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
      if (Array.isArray(source)) risks.push(...source);
    });

    return this.uniqueBy(
      risks,
      risk =>
        risk?.id ??
        `${risk?.title || risk?.name || "risk"}-${risk?.level || risk?.riskLevel || ""}`
    );
  },

  getGovernanceControls() {
    const state = this.getState();

    const sources = [
      state.governance,
      state.governanceControls,
      state.controls,
      state.governance?.controls,
      state.governanceCenter?.controls
    ];

    for (const source of sources) {
      if (Array.isArray(source)) return source;
    }

    return [];
  },

  getAutomationApprovals() {
    const state = this.getState();

    const source =
      state.automation &&
      typeof state.automation === "object"
        ? state.automation
        : state.automationCenter &&
          typeof state.automationCenter === "object"
          ? state.automationCenter
          : {};

    return Array.isArray(source.approvals)
      ? source.approvals
      : [];
  },

  /* =======================================================
     Normalization
  ======================================================= */

  normalizeScenario(scenario, index = 0) {
    if (!scenario || typeof scenario !== "object") {
      return null;
    }

    return {
      ...scenario,

      id:
        scenario.id ??
        scenario.scenarioId ??
        `scenario-${index + 1}`,

      title:
        scenario.title ||
        scenario.name ||
        "سيناريو غير مسمى",

      description:
        scenario.description ||
        scenario.desc ||
        "",

      impact:
        this.normalizePercent(
          scenario.impact,
          0
        ),

      risk:
        this.normalizePercent(
          scenario.risk,
          0
        ),

      cost:
        this.normalizePercent(
          scenario.cost,
          0
        ),

      speed:
        this.normalizePercent(
          scenario.speed,
          0
        ),

      readiness:
        this.normalizePercent(
          scenario.readiness,
          0
        ),

      governance:
        this.normalizePercent(
          scenario.governance,
          0
        ),

      recommendation:
        scenario.recommendation ||
        "قيد التقييم",

      status:
        this.normalizeDecisionStatus(
          scenario.status ??
          scenario.state ??
          this.decisionStatus.PROPOSED
        ),

      linkedModules:
        Array.isArray(scenario.linkedModules)
          ? scenario.linkedModules
          : [],

      sourceType:
        scenario.sourceType ||
        this.sourceType.SCENARIO,

      sourceId:
        scenario.sourceId ??
        scenario.id ??
        null,

      createdAt:
        scenario.createdAt || null,

      updatedAt:
        scenario.updatedAt || null
    };
  },

  normalizeCriterion(criterion, index = 0) {
    if (Array.isArray(criterion)) {
      criterion = {
        title: criterion[0],
        desc: criterion[1],
        weight: criterion[2]
      };
    }

    if (!criterion || typeof criterion !== "object") {
      return null;
    }

    return {
      ...criterion,

      id:
        criterion.id ??
        `criterion-${index + 1}`,

      title:
        criterion.title ||
        criterion.name ||
        "معيار غير مسمى",

      desc:
        criterion.desc ||
        criterion.description ||
        "",

      weight:
        this.normalizePercent(
          criterion.weight,
          0
        ),

      key:
        criterion.key ||
        criterion.code ||
        ""
    };
  },

  normalizeDecisionRecord(decision, index = 0) {
    if (!decision || typeof decision !== "object") {
      return null;
    }

    return {
      ...decision,

      id:
        decision.id ??
        decision.decisionId ??
        `decision-${index + 1}`,

      title:
        decision.title ||
        decision.name ||
        "قرار غير مسمى",

      description:
        decision.description ||
        decision.notes ||
        "",

      sourceType:
        decision.sourceType ||
        decision.source ||
        this.sourceType.MANUAL,

      sourceId:
        decision.sourceId ??
        decision.entityId ??
        null,

      status:
        this.normalizeDecisionStatus(
          decision.status ??
          decision.state ??
          this.decisionStatus.PROPOSED
        ),

      score:
        this.normalizePercent(
          decision.score ??
          decision.decisionScore,
          0
        ),

      actor:
        decision.actor ||
        decision.decidedBy ||
        this.config.actor,

      reason:
        decision.reason ||
        decision.notes ||
        "",

      createdAt:
        decision.createdAt ||
        decision.decidedAt ||
        null,

      updatedAt:
        decision.updatedAt || null,

      implementedAt:
        decision.implementedAt || null,

      linkedProjectId:
        decision.linkedProjectId ??
        decision.projectId ??
        null,

      metadata:
        decision.metadata &&
        typeof decision.metadata === "object"
          ? decision.metadata
          : {}
    };
  },

  normalizeDecisionStatus(value) {
    const status = this.normalizeStatus(value);

    if (
      [
        "approved",
        "recommended",
        "معتمد",
        "مقبول"
      ].includes(status)
    ) {
      return this.decisionStatus.APPROVED;
    }

    if (
      [
        "rejected",
        "مرفوض",
        "غير-معتمد"
      ].includes(status)
    ) {
      return this.decisionStatus.REJECTED;
    }

    if (
      [
        "deferred",
        "conditional",
        "مؤجل",
        "معلق"
      ].includes(status)
    ) {
      return this.decisionStatus.DEFERRED;
    }

    if (
      [
        "implemented",
        "completed",
        "منفذ",
        "تم-التنفيذ"
      ].includes(status)
    ) {
      return this.decisionStatus.IMPLEMENTED;
    }

    if (
      [
        "archived",
        "مؤرشف"
      ].includes(status)
    ) {
      return this.decisionStatus.ARCHIVED;
    }

    if (
      [
        "pending",
        "submitted",
        "pending-approval",
        "قيد-المراجعة",
        "بانتظار-الاعتماد"
      ].includes(status)
    ) {
      return this.decisionStatus.PENDING;
    }

    return this.decisionStatus.PROPOSED;
  },

  /* =======================================================
     Decision Store Updates
  ======================================================= */

  updateDecisionCenter(changes = {}) {
    if (!changes || typeof changes !== "object") {
      return {
        success: false,
        message: "بيانات التحديث غير صالحة."
      };
    }

    const store = this.getStore();
    const current = this.getDecisionCenter();

    if (!store) {
      return {
        success: false,
        message: "مخزن البيانات غير متاح."
      };
    }

    const updated = {
      ...current,
      ...changes,

      settings: {
        ...current.settings,
        ...(changes.settings || {})
      },

      briefing: {
        ...current.briefing,
        ...(changes.briefing || {})
      },

      statistics: {
        ...current.statistics,
        ...(changes.statistics || {})
      },

      meta: {
        ...current.meta,
        updatedAt: new Date().toISOString()
      }
    };

    try {
      if (typeof store.set === "function") {
        const result = store.set(
          "decision",
          updated,
          {
            event: "aiw:decisionUpdated"
          }
        );

        return this.normalizeStoreResult(result, updated);
      }

      if (typeof store.update === "function") {
        const result = store.update(
          "decision",
          updated,
          {
            event: "aiw:decisionUpdated"
          }
        );

        return this.normalizeStoreResult(result, updated);
      }

      if (typeof store.patch === "function") {
        const result = store.patch(
          "decision",
          updated,
          {
            event: "aiw:decisionUpdated"
          }
        );

        return this.normalizeStoreResult(result, updated);
      }
    } catch (error) {
      console.error(
        "AI Work Decision V5.0: updateDecisionCenter failed.",
        error
      );

      return {
        success: false,
        message: "تعذر تحديث مركز القرار.",
        error
      };
    }

    return {
      success: false,
      message: "Store V2.2 لا يدعم تحديث مركز القرار."
    };
  },

  normalizeStoreResult(result, data = null) {
    if (result?.success === false) return result;

    if (result === false || result === null) {
      return {
        success: false,
        message: "تعذر حفظ البيانات."
      };
    }

    return {
      success: true,
      result,
      data
    };
  },

  /* =======================================================
     Scenario CRUD
  ======================================================= */

  addScenario(scenario = {}) {
    const center = this.getDecisionCenter();
    const now = new Date().toISOString();

    const newScenario = this.normalizeScenario(
      {
        ...scenario,

        id:
          scenario.id ??
          this.createId("scenario"),

        createdAt:
          scenario.createdAt ||
          now,

        updatedAt:
          now
      },
      center.scenarios.length
    );

    const scenarios = [
      ...center.scenarios,
      newScenario
    ];

    const result = this.updateDecisionCenter({
      scenarios
    });

    return result.success
      ? {
          success: true,
          scenario: newScenario
        }
      : result;
  },

  updateScenario(scenarioId, changes = {}) {
    const center = this.getDecisionCenter();

    const index = center.scenarios.findIndex(
      scenario =>
        String(scenario.id) === String(scenarioId)
    );

    if (index < 0) {
      return {
        success: false,
        message: "لم يتم العثور على السيناريو."
      };
    }

    const scenarios = center.scenarios.map(
      (scenario, scenarioIndex) => {
        if (scenarioIndex !== index) return scenario;

        return this.normalizeScenario(
          {
            ...scenario,
            ...changes,
            id: scenario.id,
            updatedAt: new Date().toISOString()
          },
          scenarioIndex
        );
      }
    );

    const result = this.updateDecisionCenter({
      scenarios
    });

    return result.success
      ? {
          success: true,
          scenario: scenarios[index]
        }
      : result;
  },

  removeScenario(scenarioId) {
    const center = this.getDecisionCenter();

    const scenario = center.scenarios.find(
      item =>
        String(item.id) === String(scenarioId)
    );

    if (!scenario) {
      return {
        success: false,
        message: "لم يتم العثور على السيناريو."
      };
    }

    const scenarios = center.scenarios.filter(
      item =>
        String(item.id) !== String(scenarioId)
    );

    const result = this.updateDecisionCenter({
      scenarios
    });

    return result.success
      ? {
          success: true,
          scenario
        }
      : result;
  },

  /* =======================================================
     Decision History
  ======================================================= */

  addDecisionRecord(record = {}) {
    const center = this.getDecisionCenter();

    const decision = this.normalizeDecisionRecord(
      {
        ...record,

        id:
          record.id ??
          this.createId("decision"),

        createdAt:
          record.createdAt ||
          new Date().toISOString()
      },
      center.decisionHistory.length
    );

    const decisionHistory = [
      ...center.decisionHistory,
      decision
    ];

    const statistics = this.calculateDecisionStatistics(
      decisionHistory
    );

    const result = this.updateDecisionCenter({
      decisionHistory,
      statistics
    });

    return result.success
      ? {
          success: true,
          decision
        }
      : result;
  },

  calculateDecisionStatistics(history = []) {
    return {
      approved: history.filter(
        item =>
          item.status === this.decisionStatus.APPROVED
      ).length,

      rejected: history.filter(
        item =>
          item.status === this.decisionStatus.REJECTED
      ).length,

      deferred: history.filter(
        item =>
          item.status === this.decisionStatus.DEFERRED
      ).length,

      pending: history.filter(
        item =>
          [
            this.decisionStatus.PENDING,
            this.decisionStatus.PROPOSED
          ].includes(item.status)
      ).length,

      lastDecisionAt:
        history.length
          ? history[history.length - 1].createdAt
          : null
    };
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
      ""
    );

    if (
      ["converted", "converted-to-project"].includes(raw)
    ) {
      return this.lifecycle.CONVERTED;
    }

    if (
      ["pending", "submitted", "pending-approval"].includes(raw)
    ) {
      return this.lifecycle.PENDING;
    }

    if (raw === "approved") {
      return this.lifecycle.APPROVED;
    }

    if (raw === "rejected") {
      return this.lifecycle.REJECTED;
    }

    return this.lifecycle.IDEA;
  },

  getPendingIdeaDecisions() {
    return this.getIdeas()
      .filter(
        idea =>
          this.getIdeaStatus(idea) === this.lifecycle.PENDING
      )
      .map(idea => ({
        id: `idea-decision-${idea.id}`,
        title:
          idea.title ||
          "فكرة بانتظار القرار",

        sourceType:
          this.sourceType.IDEA,

        sourceId:
          idea.id,

        score:
          this.normalizePercent(
            idea.decisionScore,
            this.priorityScore(idea.priority)
          ),

        risk:
          idea.riskLevel ||
          idea.risk ||
          "متوسط",

        recommendation:
          idea.decisionLevel ||
          "بانتظار القرار الإداري",

        status:
          this.decisionStatus.PENDING,

        department:
          idea.department ||
          "غير مصنف",

        createdAt:
          idea.approval?.submittedAt ||
          idea.updatedAt ||
          idea.createdAt ||
          null
      }));
  },

  getPendingAutomationDecisions() {
    return this.getAutomationApprovals()
      .filter(approval => {
        const status = this.normalizeStatus(
          approval.status ??
          approval.state ??
          ""
        );

        return ![
          "approved",
          "rejected",
          "cancelled",
          "معتمد",
          "مرفوض",
          "ملغي"
        ].includes(status);
      })
      .map(approval => ({
        id: `automation-decision-${approval.id}`,
        title:
          approval.title ||
          "طلب اعتماد تشغيلي",

        sourceType:
          this.sourceType.AUTOMATION,

        sourceId:
          approval.id,

        score:
          this.priorityScore(
            approval.risk
          ),

        risk:
          approval.risk ||
          approval.riskLevel ||
          "متوسط",

        recommendation:
          approval.statusLabel ||
          approval.status ||
          "بانتظار الاعتماد",

        status:
          this.decisionStatus.PENDING,

        department:
          approval.owner ||
          "الأتمتة",

        createdAt:
          approval.createdAt ||
          null
      }));
  },

  getPendingRiskDecisions() {
    return this.getRisks()
      .filter(risk => {
        return (
          this.isHighRisk(
            risk.level ??
            risk.riskLevel ??
            risk.severity
          ) &&
          !this.isClosedStatus(risk.status)
        );
      })
      .map(risk => ({
        id: `risk-decision-${risk.id}`,
        title:
          risk.title ||
          risk.name ||
          "مخاطرة عالية",

        sourceType:
          this.sourceType.RISK,

        sourceId:
          risk.id,

        score:
          this.normalizePercent(
            100 -
            this.riskPenaltyScore(
              risk.level ??
              risk.riskLevel ??
              risk.severity
            )
          ),

        risk:
          risk.level ||
          risk.riskLevel ||
          risk.severity ||
          "عالٍ",

        recommendation:
          "يتطلب قرار معالجة أو قبول مخاطر",

        status:
          this.decisionStatus.PENDING,

        department:
          risk.owner ||
          "الحوكمة",

        createdAt:
          risk.createdAt ||
          risk.updatedAt ||
          null
      }));
  },

  getDecisionQueue() {
    return this.uniqueBy(
      [
        ...this.getPendingIdeaDecisions(),
        ...this.getPendingAutomationDecisions(),
        ...this.getPendingRiskDecisions()
      ],
      item =>
        `${item.sourceType}-${item.sourceId}`
    );
  },

  /* =======================================================
     Decision Actions
  ======================================================= */

  approveIdeaDecision(item, notes = "", createProject = false) {
    const store = this.getStore();

    if (!store) {
      return {
        success: false,
        message: "مخزن البيانات غير متاح."
      };
    }

    try {
      let result;

      if (
        createProject &&
        typeof store.approveAndCreateProject === "function"
      ) {
        result = store.approveAndCreateProject(
          item.sourceId,
          {
            actor: this.config.actor,
            approvedBy: this.config.actor,
            convertedBy: this.config.actor,
            notes,
            approvalNotes: notes
          }
        );
      } else if (
        typeof store.approveIdea === "function"
      ) {
        result = store.approveIdea(
          item.sourceId,
          {
            actor: this.config.actor,
            notes
          }
        );
      } else {
        return {
          success: false,
          message: "خدمة اعتماد الأفكار غير متاحة."
        };
      }

      const normalized = this.normalizeStoreResult(result);

      if (!normalized.success) return normalized;

      const record = this.addDecisionRecord({
        title: item.title,
        sourceType: this.sourceType.IDEA,
        sourceId: item.sourceId,
        status: this.decisionStatus.APPROVED,
        score: item.score,
        actor: this.config.actor,
        reason: notes,
        linkedProjectId:
          result?.project?.id ??
          result?.linkedProjectId ??
          null,
        metadata: {
          createProject
        }
      });

      return record.success
        ? {
            success: true,
            result,
            decision: record.decision
          }
        : record;
    } catch (error) {
      console.error(
        "AI Work Decision V5.0: approveIdeaDecision failed.",
        error
      );

      return {
        success: false,
        message: "تعذر اعتماد الفكرة.",
        error
      };
    }
  },

  rejectIdeaDecision(item, notes = "") {
    if (!notes.trim()) {
      return {
        success: false,
        message: "يجب إدخال سبب الرفض."
      };
    }

    const store = this.getStore();

    if (typeof store?.rejectIdea !== "function") {
      return {
        success: false,
        message: "خدمة رفض الأفكار غير متاحة."
      };
    }

    try {
      const result = store.rejectIdea(
        item.sourceId,
        {
          actor: this.config.actor,
          reason: notes,
          notes
        }
      );

      const normalized = this.normalizeStoreResult(result);

      if (!normalized.success) return normalized;

      const record = this.addDecisionRecord({
        title: item.title,
        sourceType: this.sourceType.IDEA,
        sourceId: item.sourceId,
        status: this.decisionStatus.REJECTED,
        score: item.score,
        actor: this.config.actor,
        reason: notes
      });

      return record.success
        ? {
            success: true,
            result,
            decision: record.decision
          }
        : record;
    } catch (error) {
      return {
        success: false,
        message: "تعذر رفض الفكرة.",
        error
      };
    }
  },

  approveGenericDecision(item, notes = "") {
    return this.addDecisionRecord({
      title: item.title,
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      status: this.decisionStatus.APPROVED,
      score: item.score,
      actor: this.config.actor,
      reason: notes
    });
  },

  rejectGenericDecision(item, notes = "") {
    if (!notes.trim()) {
      return {
        success: false,
        message: "يجب إدخال سبب الرفض."
      };
    }

    return this.addDecisionRecord({
      title: item.title,
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      status: this.decisionStatus.REJECTED,
      score: item.score,
      actor: this.config.actor,
      reason: notes
    });
  },

  deferGenericDecision(item, notes = "") {
    return this.addDecisionRecord({
      title: item.title,
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      status: this.decisionStatus.DEFERRED,
      score: item.score,
      actor: this.config.actor,
      reason: notes
    });
  },

  /* =======================================================
     Scoring
  ======================================================= */

  decisionScore(scenario = {}) {
    const impact =
      this.normalizePercent(
        scenario.impact,
        0
      );

    const risk =
      this.normalizePercent(
        scenario.risk,
        0
      );

    const cost =
      this.normalizePercent(
        scenario.cost,
        0
      );

    const speed =
      this.normalizePercent(
        scenario.speed,
        0
      );

    const readiness =
      this.normalizePercent(
        scenario.readiness,
        0
      );

    const governance =
      this.normalizePercent(
        scenario.governance,
        0
      );

    return this.normalizePercent(
      impact * 0.28 +
      (100 - risk) * 0.18 +
      (100 - cost) * 0.14 +
      speed * 0.16 +
      readiness * 0.12 +
      governance * 0.12
    );
  },

  bestScenario(scenarios = []) {
    if (!scenarios.length) return null;

    return [...scenarios]
      .sort(
        (a, b) =>
          this.decisionScore(b) -
          this.decisionScore(a)
      )[0];
  },

  getScores() {
    const state = this.getState();
    const projects = this.getProjects();
    const controls = this.getGovernanceControls();
    const risks = this.getRisks();

    const portfolioScore = projects.length
      ? this.average(
          projects.map(project =>
            this.normalizePercent(
              project.progress ??
              project.readiness ??
              project.score,
              0
            )
          )
        )
      : 0;

    const riskScore = risks.length
      ? this.normalizePercent(
          100 -
          risks.reduce(
            (sum, risk) =>
              sum +
              this.riskPenaltyScore(
                risk.level ??
                risk.riskLevel ??
                risk.severity
              ),
            0
          )
        )
      : 100;

    const governanceScore = controls.length
      ? this.normalizePercent(
          (
            controls.filter(control =>
              this.isActiveControl(control)
            ).length /
            controls.length
          ) * 100
        )
      : 0;

    const maturityScore =
      this.normalizePercent(
        state.summary?.maturityScore ??
        state.maturity?.overallScore ??
        state.maturity?.score,
        0
      );

    const kpiScore = this.calculateKpiScore(state);

    const executiveScore = this.average(
      [
        portfolioScore,
        riskScore,
        governanceScore,
        maturityScore,
        kpiScore
      ].filter(score => score > 0)
    );

    return {
      executiveScore,
      portfolioScore,
      riskScore,
      governanceScore,
      maturityScore,
      kpiScore
    };
  },

  calculateKpiScore(state = {}) {
    const sources = [
      state.kpis,
      state.kpiCenter?.items,
      state.kpiCenter?.kpis
    ];

    let kpis = [];

    for (const source of sources) {
      if (Array.isArray(source)) {
        kpis = source;
        break;
      }
    }

    if (!kpis.length) return 0;

    return this.average(
      kpis.map(kpi => {
        const current =
          this.toSafeNumber(
            kpi.current ??
            kpi.value,
            0
          );

        const target =
          this.toSafeNumber(
            kpi.target,
            0
          );

        if (target <= 0) return 0;

        if (
          this.normalizeStatus(kpi.direction) ===
          "lower"
        ) {
          return current <= target
            ? 100
            : this.normalizePercent(
                (target / Math.max(current, 1)) * 100
              );
        }

        return this.normalizePercent(
          (current / target) * 100
        );
      })
    );
  },

  getTopProjects(limit = 5) {
    const projects = this.getProjects();
    const ideas = this.getIdeas();

    return projects
      .map((project, index) => {
        const sourceIdeaId =
          project.sourceIdeaId ??
          project.ideaId ??
          project.origin?.ideaId ??
          null;

        const linkedIdea = ideas.find(
          idea =>
            sourceIdeaId &&
            String(idea.id) === String(sourceIdeaId)
        );

        const progress =
          this.normalizePercent(
            project.progress ??
            project.readiness,
            0
          );

        const ideaScore =
          linkedIdea
            ? this.normalizePercent(
                linkedIdea.decisionScore,
                this.priorityScore(
                  linkedIdea.priority
                )
              )
            : this.priorityScore(
                project.priority
              );

        const riskScore =
          100 -
          this.riskPenaltyScore(
            project.riskLevel ??
            project.risk
          );

        const score = this.average(
          [progress, ideaScore, riskScore]
        );

        return {
          id:
            project.id ??
            `project-${index + 1}`,

          title:
            project.title ||
            project.name ||
            "مشروع غير مسمى",

          department:
            project.department ||
            linkedIdea?.department ||
            "غير مصنف",

          priority:
            project.priority ||
            linkedIdea?.priority ||
            "متوسطة",

          score,

          sourceIdeaId
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },

  /* =======================================================
     Executive Narrative
  ======================================================= */

  getAiReport(context = {}) {
    try {
      if (
        typeof window.AIW?.AI?.generateExecutiveReport ===
        "function"
      ) {
        const report =
          window.AIW.AI.generateExecutiveReport(context);

        if (report && typeof report === "object") {
          return report;
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Decision V5.0: AI report unavailable.",
        error
      );
    }

    const queueCount =
      context.decisionQueue?.length || 0;

    if (queueCount > 0) {
      return {
        status:
          "الأولوية الحالية هي معالجة القرارات المعلقة",

        message:
          `يوجد ${queueCount} قراراً يحتاج اعتماداً أو معالجة. ` +
          "ابدأ بالقرارات الأعلى أثراً والأقل مخاطرة، مع توثيق السبب والنتيجة."
      };
    }

    if (context.bestScenario) {
      return {
        status:
          context.bestScenario.recommendation ||
          "السيناريو الأعلى جاهزية هو الأنسب للمرحلة الحالية",

        message:
          `السيناريو «${context.bestScenario.title}» يحقق Decision Score ` +
          `${this.decisionScore(context.bestScenario)}% ويوازن بين الأثر والسرعة والمخاطر.`
      };
    }

    return {
      status:
        "مركز القرار جاهز لاستقبال أول قرار تنفيذي",

      message:
        "لا توجد سيناريوهات أو قرارات معلقة حالياً. يتم إنشاء القرارات من الأفكار والمشاريع والمخاطر والأتمتة."
    };
  },

  getNextActions(context = {}) {
    const actions = [];

    if (context.queueStats.idea > 0) {
      actions.push(
        `مراجعة ${context.queueStats.idea} أفكار بانتظار القرار الإداري.`
      );
    }

    if (context.queueStats.risk > 0) {
      actions.push(
        `معالجة ${context.queueStats.risk} قرارات مخاطر عالية قبل التوسع.`
      );
    }

    if (context.queueStats.automation > 0) {
      actions.push(
        `إكمال ${context.queueStats.automation} اعتمادات تشغيلية قادمة من الأتمتة.`
      );
    }

    if (context.scores.governanceScore < 70) {
      actions.push(
        "رفع مستوى الحوكمة قبل اعتماد المشاريع عالية الحساسية."
      );
    }

    if (context.scores.portfolioScore < 60) {
      actions.push(
        "إعادة ترتيب المشاريع حسب الجاهزية والأثر التنفيذي."
      );
    }

    if (context.bestScenario) {
      actions.push(
        `اعتماد أو تحديث السيناريو «${context.bestScenario.title}».`
      );
    }

    if (!actions.length) {
      actions.push(
        "مراجعة Decision History وتحديد القرار التنفيذي التالي."
      );
    }

    return actions.slice(0, 6);
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

      const widgets =
        window.AIW?.Widgets;

      const center =
        this.getDecisionCenter();

      const scenarios =
        center.scenarios.filter(
          scenario =>
            scenario.status !==
            this.decisionStatus.ARCHIVED
        );

      const decisionQueue =
        this.getDecisionQueue();

      const scores =
        this.getScores();

      const bestScenario =
        this.bestScenario(scenarios);

      const bestScenarioScore =
        bestScenario
          ? this.decisionScore(bestScenario)
          : 0;

      const topProjects =
        this.getTopProjects(
          center.settings.topProjectsLimit
        );

      const queueStats = {
        total: decisionQueue.length,

        idea:
          decisionQueue.filter(
            item =>
              item.sourceType ===
              this.sourceType.IDEA
          ).length,

        risk:
          decisionQueue.filter(
            item =>
              item.sourceType ===
              this.sourceType.RISK
          ).length,

        automation:
          decisionQueue.filter(
            item =>
              item.sourceType ===
              this.sourceType.AUTOMATION
          ).length
      };

      const aiReport =
        this.getAiReport({
          center,
          scenarios,
          bestScenario,
          topProjects,
          scores,
          decisionQueue
        });

      const nextActions =
        this.getNextActions({
          center,
          scenarios,
          bestScenario,
          topProjects,
          scores,
          decisionQueue,
          queueStats
        });

      container.innerHTML = `
        <section class="module-page">
          ${
            typeof widgets?.hero === "function"
              ? widgets.hero({
                  kicker:
                    "Decision Intelligence · DSS",

                  title:
                    "مركز القرار التنفيذي",

                  description:
                    "مركز قرار فعلي يربط الأفكار والمشاريع والمخاطر والحوكمة والأتمتة ضمن Store V2.2، مع Decision History ومراجعة بشرية كاملة.",

                  chips: [
                    "🧭 Decision Support",
                    `📊 Executive Score ${scores.executiveScore}%`,
                    `⏳ ${queueStats.total} قرارات معلقة`,
                    `📚 ${center.decisionHistory.length} قرارات مسجلة`,
                    `🚀 ${topProjects.length} مشاريع مرشحة`
                  ]
                })
              : this.fallbackHero(
                  scores.executiveScore,
                  queueStats.total,
                  center.decisionHistory.length
                )
          }

          <div class="module-grid">
            ${this.kpi(
              "Executive Score",
              `${scores.executiveScore}%`,
              "Overall Readiness"
            )}

            ${this.kpi(
              "Portfolio Health",
              `${scores.portfolioScore}%`,
              "Portfolio"
            )}

            ${this.kpi(
              "Risk Score",
              `${scores.riskScore}%`,
              "Risk Position"
            )}

            ${this.kpi(
              "Governance",
              `${scores.governanceScore}%`,
              "Controls"
            )}

            ${this.kpi(
              "قرارات معلقة",
              queueStats.total,
              "Decision Queue"
            )}

            ${this.kpi(
              "Decision Mode",
              center.settings.decisionMode,
              center.settings.humanApprovalRequired
                ? "Human-in-the-Loop"
                : "Advisory"
            )}
          </div>

          <div class="module-wide-grid">
            <div class="module-panel">
              ${this.sectionTitle(
                "الخلاصة التنفيذية للقرار",
                "التوصية الحالية بناءً على البيانات والقرارات المعلقة."
              )}

              <div class="decision-summary-card">
                <strong>
                  ${this.escapeHtml(aiReport.status)}
                </strong>

                <p>
                  ${this.escapeHtml(aiReport.message)}
                </p>

                <div class="decision-summary-strip">
                  <div>
                    <span>Pending</span>
                    <b>${queueStats.total}</b>
                  </div>

                  <div>
                    <span>Approved</span>
                    <b>${center.statistics.approved}</b>
                  </div>

                  <div>
                    <span>Rejected</span>
                    <b>${center.statistics.rejected}</b>
                  </div>

                  <div>
                    <span>History</span>
                    <b>${center.decisionHistory.length}</b>
                  </div>
                </div>
              </div>
            </div>

            <div class="module-panel">
              ${this.sectionTitle(
                "Recommended Next Decision",
                "أفضل سيناريو قرار متاح حالياً."
              )}

              ${
                bestScenario
                  ? `
                    <div class="decision-next-card">
                      <strong>
                        ${this.escapeHtml(
                          bestScenario.title
                        )}
                      </strong>

                      <p>
                        ${this.escapeHtml(
                          bestScenario.recommendation
                        )}
                      </p>

                      <div class="aiw-progress">
                        <div
                          style="width:${bestScenarioScore}%"
                        ></div>
                      </div>

                      <small>
                        Decision Score:
                        ${bestScenarioScore}%
                      </small>

                      <button
                        type="button"
                        class="module-btn secondary"
                        data-decision-action="scenario-details"
                        data-scenario-id="${this.escapeAttribute(
                          bestScenario.id
                        )}"
                      >
                        عرض السيناريو
                      </button>
                    </div>
                  `
                  : this.emptyState(
                      "لا توجد سيناريوهات قرار مسجلة حالياً."
                    )
              }
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Decision Queue",
              "القرارات المعلقة القادمة من الأفكار والمخاطر والأتمتة."
            )}

            ${
              decisionQueue.length
                ? `
                  <div class="decision-queue-list">
                    ${decisionQueue
                      .map((item, index) =>
                        this.decisionQueueRow(
                          item,
                          index
                        )
                      )
                      .join("")}
                  </div>
                `
                : this.emptyState(
                    "لا توجد قرارات معلقة حالياً."
                  )
            }
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Decision Priority Matrix",
              "مقارنة السيناريوهات حسب الأثر والمخاطر والتكلفة والسرعة."
            )}

            ${
              scenarios.length
                ? `
                  <div class="decision-scenario-grid">
                    ${scenarios
                      .map(scenario =>
                        this.scenarioCard(scenario)
                      )
                      .join("")}
                  </div>
                `
                : this.emptyState(
                    "لا توجد سيناريوهات قرار مسجلة حالياً."
                  )
            }
          </div>

          <div class="module-wide-grid">
            <div class="module-panel">
              ${this.sectionTitle(
                "Top Recommended Projects",
                "أفضل المشاريع المرشحة من البيانات الفعلية."
              )}

              ${
                topProjects.length
                  ? `
                    <div class="decision-project-list">
                      ${topProjects
                        .map((project, index) =>
                          this.projectRow(
                            project,
                            index
                          )
                        )
                        .join("")}
                    </div>
                  `
                  : this.emptyState(
                      "لا توجد مشاريع مرشحة حالياً."
                    )
              }
            </div>

            <div class="module-panel">
              ${this.sectionTitle(
                "Decision Criteria",
                "المعايير الفعلية المستخدمة لدعم القرار."
              )}

              ${
                center.criteria.length
                  ? `
                    <div class="decision-criteria-list">
                      ${center.criteria
                        .map((criterion, index) => `
                          <div>
                            <b>
                              ${String(index + 1).padStart(2, "0")}
                            </b>

                            <strong>
                              ${this.escapeHtml(
                                criterion.title
                              )}
                            </strong>

                            <span>
                              ${this.escapeHtml(
                                criterion.desc
                              )}
                              ${
                                criterion.weight
                                  ? ` · وزن ${criterion.weight}%`
                                  : ""
                              }
                            </span>
                          </div>
                        `)
                        .join("")}
                    </div>
                  `
                  : this.emptyState(
                      "لا توجد معايير قرار مسجلة حالياً."
                    )
              }
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Decision History",
              "السجل الكامل للقرارات التي تم اعتمادها أو رفضها أو تأجيلها."
            )}

            ${this.renderDecisionHistory(
              center.decisionHistory
            )}
          </div>

          <div class="module-wide-grid">
            <div class="module-panel">
              ${this.sectionTitle(
                "Executive Actions",
                "الخطوات التنفيذية التالية."
              )}

              ${this.renderExecutiveList(
                nextActions
              )}
            </div>

            <div class="module-panel">
              ${this.sectionTitle(
                "Decision Timeline",
                "تسلسل القرار المقترح."
              )}

              ${
                center.timeline.length
                  ? `
                    <div class="decision-timeline">
                      ${center.timeline
                        .map((item, index) => `
                          <div>
                            <b>${index + 1}</b>

                            <strong>
                              ${this.escapeHtml(
                                item?.title ||
                                item?.name ||
                                ""
                              )}
                            </strong>

                            <span>
                              ${this.escapeHtml(
                                item?.period ||
                                item?.date ||
                                ""
                              )}
                            </span>
                          </div>
                        `)
                        .join("")}
                    </div>
                  `
                  : this.emptyState(
                      "لا يوجد Timeline مسجل حالياً."
                    )
              }
            </div>
          </div>

          ${
            center.briefing.title ||
            center.briefing.description
              ? `
                <div class="module-panel">
                  ${this.sectionTitle(
                    "AI Executive Briefing",
                    "صياغة مختصرة قابلة للرفع للإدارة العليا."
                  )}

                  <div class="decision-briefing">
                    ${
                      center.briefing.title
                        ? `
                          <strong>
                            التوصية:
                            ${this.escapeHtml(
                              center.briefing.title
                            )}
                          </strong>
                        `
                        : ""
                    }

                    ${
                      center.briefing.description
                        ? `
                          <p>
                            ${this.escapeHtml(
                              center.briefing.description
                            )}
                          </p>
                        `
                        : ""
                    }

                    <div class="aiw-chip-row">
                      <span class="aiw-chip">
                        قرار موثق
                      </span>

                      <span class="aiw-chip">
                        Human-in-the-Loop
                      </span>

                      <span class="aiw-chip">
                        Audit Trail
                      </span>
                    </div>
                  </div>
                </div>
              `
              : ""
          }
        </section>
      `;

      this.bindActionEvents();
      this.bindAutomaticSync();
    } finally {
      this._isRendering = false;
    }
  },

  /* =======================================================
     Queue and Cards
  ======================================================= */

  decisionQueueRow(item, index) {
    return `
      <div
        class="decision-queue-row"
        data-decision-source="${this.escapeAttribute(
          item.sourceType
        )}"
        data-decision-source-id="${this.escapeAttribute(
          item.sourceId
        )}"
      >
        <b>
          ${String(index + 1).padStart(2, "0")}
        </b>

        <div>
          <strong>
            ${this.escapeHtml(item.title)}
          </strong>

          <span>
            ${this.escapeHtml(item.department)}
            · ${this.escapeHtml(item.recommendation)}
          </span>

          <small>
            المصدر:
            ${this.escapeHtml(
              this.sourceLabel(item.sourceType)
            )}
          </small>
        </div>

        <em class="${this.riskClass(item.risk)}">
          ${this.escapeHtml(item.risk)}
        </em>

        <div class="decision-queue-actions">
          ${
            item.sourceType === this.sourceType.IDEA
              ? `
                <button
                  type="button"
                  class="decision-mini-action convert"
                  data-decision-action="approve-convert"
                  data-source-type="${this.escapeAttribute(
                    item.sourceType
                  )}"
                  data-source-id="${this.escapeAttribute(
                    item.sourceId
                  )}"
                >
                  اعتماد وتحويل
                </button>
              `
              : ""
          }

          <button
            type="button"
            class="decision-mini-action approve"
            data-decision-action="approve"
            data-source-type="${this.escapeAttribute(
              item.sourceType
            )}"
            data-source-id="${this.escapeAttribute(
              item.sourceId
            )}"
          >
            اعتماد
          </button>

          <button
            type="button"
            class="decision-mini-action defer"
            data-decision-action="defer"
            data-source-type="${this.escapeAttribute(
              item.sourceType
            )}"
            data-source-id="${this.escapeAttribute(
              item.sourceId
            )}"
          >
            تأجيل
          </button>

          <button
            type="button"
            class="decision-mini-action reject"
            data-decision-action="reject"
            data-source-type="${this.escapeAttribute(
              item.sourceType
            )}"
            data-source-id="${this.escapeAttribute(
              item.sourceId
            )}"
          >
            رفض
          </button>
        </div>
      </div>
    `;
  },

  scenarioCard(scenario) {
    const score = this.decisionScore(scenario);

    return `
      <article
        class="decision-scenario-card ${
          score >= 75
            ? "green"
            : score >= 55
              ? "orange"
              : "red"
        }"
        data-scenario-id="${this.escapeAttribute(
          scenario.id
        )}"
      >
        <div class="decision-scenario-head">
          <strong>
            ${this.escapeHtml(scenario.title)}
          </strong>

          <b>${score}%</b>
        </div>

        <p>
          ${this.escapeHtml(
            scenario.recommendation
          )}
        </p>

        <div class="decision-metrics">
          <span>الأثر ${scenario.impact}%</span>
          <span>المخاطر ${scenario.risk}%</span>
          <span>التكلفة ${scenario.cost}%</span>
          <span>السرعة ${scenario.speed}%</span>
        </div>

        <div class="aiw-progress">
          <div style="width:${score}%"></div>
        </div>

        <div class="decision-scenario-actions">
          <button
            type="button"
            class="decision-action-button secondary"
            data-decision-action="scenario-details"
            data-scenario-id="${this.escapeAttribute(
              scenario.id
            )}"
          >
            عرض التفاصيل
          </button>
        </div>
      </article>
    `;
  },

  projectRow(project, index) {
    return `
      <div class="decision-project-item">
        <b>
          ${String(index + 1).padStart(2, "0")}
        </b>

        <div>
          <strong>
            ${this.escapeHtml(project.title)}
          </strong>

          <span>
            ${this.escapeHtml(project.department)}
            · ${this.escapeHtml(project.priority)}
          </span>
        </div>

        <em>${project.score}%</em>

        <button
          type="button"
          class="decision-project-open"
          data-decision-action="open-project"
          data-project-id="${this.escapeAttribute(
            project.id
          )}"
        >
          فتح
        </button>
      </div>
    `;
  },

  renderDecisionHistory(history = []) {
    if (!history.length) {
      return this.emptyState(
        "لا يوجد Decision History حالياً."
      );
    }

    const rows = [...history]
      .sort((a, b) => {
        const timeA =
          new Date(
            a.createdAt ||
            a.updatedAt ||
            0
          ).getTime();

        const timeB =
          new Date(
            b.createdAt ||
            b.updatedAt ||
            0
          ).getTime();

        return timeB - timeA;
      })
      .slice(0, this.config.maximumHistoryRows);

    return `
      <div class="decision-history-list">
        ${rows
          .map(item => `
            <div class="decision-history-row">
              <span
                class="decision-history-status ${this.decisionStatusClass(
                  item.status
                )}"
              >
                ${this.decisionStatusIcon(
                  item.status
                )}
              </span>

              <div>
                <strong>
                  ${this.escapeHtml(item.title)}
                </strong>

                <small>
                  ${this.escapeHtml(
                    this.sourceLabel(
                      item.sourceType
                    )
                  )}
                  · ${this.escapeHtml(item.actor)}
                </small>
              </div>

              <div class="decision-history-meta">
                <span>
                  ${this.escapeHtml(
                    this.decisionStatusLabel(
                      item.status
                    )
                  )}
                </span>

                <small>
                  ${this.escapeHtml(
                    this.formatDateTime(
                      item.createdAt,
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

  /* =======================================================
     Events
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
            "[data-decision-action]"
          );

        if (
          !button ||
          !this._container?.contains(button)
        ) {
          return;
        }

        const action =
          button.dataset.decisionAction;

        if (
          action === "approve" ||
          action === "approve-convert" ||
          action === "reject" ||
          action === "defer"
        ) {
          const item =
            this.findDecisionQueueItem(
              button.dataset.sourceType,
              button.dataset.sourceId
            );

          if (!item) {
            this.showToast(
              "لم يتم العثور على القرار.",
              "error"
            );
            return;
          }

          this.confirmDecisionAction(
            action,
            item
          );
          return;
        }

        if (
          action === "scenario-details"
        ) {
          this.openScenarioDetails(
            button.dataset.scenarioId
          );
          return;
        }

        if (
          action === "open-project"
        ) {
          this.openProject(
            button.dataset.projectId
          );
        }
      }
    );
  },

  findDecisionQueueItem(
    sourceType,
    sourceId
  ) {
    return (
      this.getDecisionQueue().find(
        item =>
          String(item.sourceType) ===
            String(sourceType) &&
          String(item.sourceId) ===
            String(sourceId)
      ) ||
      null
    );
  },

  confirmDecisionAction(action, item) {
    const labels = {
      approve: {
        icon: "✅",
        title: "اعتماد القرار",
        confirmText: "تأكيد الاعتماد",
        noteLabel: "ملاحظات الاعتماد"
      },

      "approve-convert": {
        icon: "🚀",
        title: "اعتماد وتحويل إلى مشروع",
        confirmText: "اعتماد وإنشاء المشروع",
        noteLabel: "ملاحظات القرار"
      },

      reject: {
        icon: "⛔",
        title: "رفض القرار",
        confirmText: "تأكيد الرفض",
        noteLabel: "سبب الرفض",
        requiredNotes: true,
        danger: true
      },

      defer: {
        icon: "⏸️",
        title: "تأجيل القرار",
        confirmText: "تأكيد التأجيل",
        noteLabel: "سبب التأجيل"
      }
    };

    const config = labels[action];

    if (!config) return;

    this.openConfirmation({
      type: action,
      item,
      ...config,
      message:
        `سيتم ${this.actionLabel(action)} «${item.title}».`
    });
  },

  executePendingAction(notes = "") {
    if (
      !this._pendingAction ||
      this._isExecuting
    ) {
      return;
    }

    if (
      this._pendingAction.requiredNotes &&
      !notes.trim()
    ) {
      this.showToast(
        "يرجى إدخال السبب قبل المتابعة.",
        "error"
      );
      return;
    }

    this._isExecuting = true;

    try {
      const {
        type,
        item
      } = this._pendingAction;

      let result = null;

      if (
        item.sourceType ===
        this.sourceType.IDEA
      ) {
        if (type === "approve") {
          result =
            this.approveIdeaDecision(
              item,
              notes,
              false
            );
        }

        if (
          type === "approve-convert"
        ) {
          result =
            this.approveIdeaDecision(
              item,
              notes,
              true
            );
        }

        if (type === "reject") {
          result =
            this.rejectIdeaDecision(
              item,
              notes
            );
        }

        if (type === "defer") {
          result =
            this.deferGenericDecision(
              item,
              notes
            );
        }
      } else {
        if (type === "approve") {
          result =
            this.approveGenericDecision(
              item,
              notes
            );
        }

        if (type === "reject") {
          result =
            this.rejectGenericDecision(
              item,
              notes
            );
        }

        if (type === "defer") {
          result =
            this.deferGenericDecision(
              item,
              notes
            );
        }
      }

      if (!result?.success) {
        this.showToast(
          result?.message ||
          "تعذر تنفيذ القرار.",
          "error"
        );
        return;
      }

      const actionType = type;

      this.closeConfirmation();

      if (
        actionType ===
        "approve-convert"
      ) {
        this.showToast(
          "تم اعتماد الفكرة وإنشاء المشروع وتسجيل القرار.",
          "success"
        );
      } else if (
        actionType === "approve"
      ) {
        this.showToast(
          "تم اعتماد القرار وتسجيله.",
          "success"
        );
      } else if (
        actionType === "reject"
      ) {
        this.showToast(
          "تم رفض القرار وتسجيل السبب.",
          "success"
        );
      } else {
        this.showToast(
          "تم تأجيل القرار وتسجيل الملاحظة.",
          "success"
        );
      }

      this.scheduleRefresh();
    } finally {
      this._isExecuting = false;
    }
  },

  /* =======================================================
     Scenario Details
  ======================================================= */

  openScenarioDetails(scenarioId) {
    const scenario =
      this.getDecisionCenter()
        .scenarios
        .find(
          item =>
            String(item.id) ===
            String(scenarioId)
        );

    if (!scenario) {
      this.showToast(
        "لم يتم العثور على السيناريو.",
        "error"
      );
      return;
    }

    this.closeScenarioDetails();

    const score =
      this.decisionScore(scenario);

    const modal =
      document.createElement("div");

    modal.className =
      "decision-details-overlay";

    modal.innerHTML = `
      <div
        class="decision-details-dialog"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          class="decision-details-close"
          data-decision-details-close
        >
          ×
        </button>

        <div class="decision-details-heading">
          <div>🧭</div>

          <span>
            Decision Scenario
          </span>

          <h3>
            ${this.escapeHtml(
              scenario.title
            )}
          </h3>

          <p>
            ${this.escapeHtml(
              scenario.description ||
              scenario.recommendation
            )}
          </p>
        </div>

        <div class="decision-details-kpis">
          <div>
            <small>Decision Score</small>
            <strong>${score}%</strong>
          </div>

          <div>
            <small>Impact</small>
            <strong>${scenario.impact}%</strong>
          </div>

          <div>
            <small>Risk</small>
            <strong>${scenario.risk}%</strong>
          </div>

          <div>
            <small>Readiness</small>
            <strong>${scenario.readiness}%</strong>
          </div>
        </div>

        <div class="decision-details-section">
          <strong>المؤشرات</strong>

          <div class="decision-details-list">
            <span>التكلفة: ${scenario.cost}%</span>
            <span>السرعة: ${scenario.speed}%</span>
            <span>الحوكمة: ${scenario.governance}%</span>
            <span>
              الحالة:
              ${this.escapeHtml(
                this.decisionStatusLabel(
                  scenario.status
                )
              )}
            </span>
          </div>
        </div>

        <div class="decision-details-section">
          <strong>التوصية</strong>

          <p>
            ${this.escapeHtml(
              scenario.recommendation
            )}
          </p>
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
            "[data-decision-details-close]"
          )
        ) {
          this.closeScenarioDetails();
        }
      }
    );

    requestAnimationFrame(() => {
      modal.classList.add("visible");
    });
  },

  closeScenarioDetails() {
    if (!this._detailsModal) return;

    const modal = this._detailsModal;

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
      "decision-confirmation-overlay";

    modal.innerHTML = `
      <div
        class="decision-confirmation-dialog"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          class="decision-confirmation-close"
          data-decision-confirmation-close
        >
          ×
        </button>

        <div class="decision-confirmation-icon">
          ${this.escapeHtml(
            config.icon || "🧭"
          )}
        </div>

        <h3>
          ${this.escapeHtml(
            config.title ||
            "تأكيد القرار"
          )}
        </h3>

        <p>
          ${this.escapeHtml(
            config.message ||
            "هل تريد متابعة القرار؟"
          )}
        </p>

        <label class="decision-confirmation-field">
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
            data-decision-confirmation-notes
            placeholder="${
              config.requiredNotes
                ? "أدخل السبب قبل المتابعة..."
                : "إضافة ملاحظة اختيارية..."
            }"
          ></textarea>
        </label>

        <div class="decision-confirmation-actions">
          <button
            type="button"
            class="decision-action-button secondary"
            data-decision-confirmation-close
          >
            إلغاء
          </button>

          <button
            type="button"
            class="decision-action-button ${
              config.danger
                ? "danger"
                : "primary"
            }"
            data-decision-confirmation-submit
          >
            ${this.escapeHtml(
              config.confirmText ||
              "تأكيد"
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
            "[data-decision-confirmation-close]"
          )
        ) {
          this.closeConfirmation();
          return;
        }

        if (
          event.target.closest(
            "[data-decision-confirmation-submit]"
          )
        ) {
          const notes =
            modal
              .querySelector(
                "[data-decision-confirmation-notes]"
              )
              ?.value?.trim() ||
            "";

          this.executePendingAction(notes);
        }
      }
    );

    requestAnimationFrame(() => {
      modal.classList.add("visible");

      modal
        .querySelector(
          "[data-decision-confirmation-notes]"
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
     Navigation
  ======================================================= */

  openProject(projectId) {
    if (!projectId) return;

    try {
      localStorage.setItem(
        this.config.selectedProjectKey,
        String(projectId)
      );

      sessionStorage.setItem(
        this.config.selectedProjectKey,
        String(projectId)
      );
    } catch (error) {
      console.warn(
        "AI Work Decision V5.0: Unable to save project selection.",
        error
      );
    }

    if (
      typeof window.AIW?.App?.go ===
      "function"
    ) {
      window.AIW.App.go("projects");
      return;
    }

    if (
      typeof window.AIW?.Router?.go ===
      "function"
    ) {
      window.AIW.Router.go("projects");
      return;
    }

    window.location.hash = "#projects";
  },

  /* =======================================================
     Shared UI
  ======================================================= */

  renderExecutiveList(items = []) {
    if (!items.length) {
      return this.emptyState(
        "لا توجد إجراءات تنفيذية حالياً."
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
    executiveScore,
    pendingCount,
    historyCount
  ) {
    return `
      <div class="module-hero">
        <span class="module-kicker">
          Decision Intelligence · DSS
        </span>

        <h1>
          مركز القرار التنفيذي
        </h1>

        <p>
          إدارة القرارات التنفيذية وربطها بالأفكار والمشاريع والمخاطر وسجل القرار.
        </p>

        <div class="aiw-chip-row">
          <span class="aiw-chip">
            📊 Executive Score ${executiveScore}%
          </span>

          <span class="aiw-chip">
            ⏳ ${pendingCount} قرارات معلقة
          </span>

          <span class="aiw-chip">
            📚 ${historyCount} قرارات مسجلة
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

  /* =======================================================
     Status Presentation
  ======================================================= */

  sourceLabel(source) {
    const labels = {
      [this.sourceType.IDEA]: "فكرة",
      [this.sourceType.PROJECT]: "مشروع",
      [this.sourceType.RISK]: "مخاطر",
      [this.sourceType.GOVERNANCE]: "حوكمة",
      [this.sourceType.AUTOMATION]: "أتمتة",
      [this.sourceType.SCENARIO]: "سيناريو",
      [this.sourceType.MANUAL]: "قرار يدوي"
    };

    return labels[source] || "قرار";
  },

  actionLabel(action) {
    const labels = {
      approve: "اعتماد",
      "approve-convert": "اعتماد وتحويل إلى مشروع",
      reject: "رفض",
      defer: "تأجيل"
    };

    return labels[action] || "تنفيذ قرار على";
  },

  decisionStatusLabel(status) {
    const labels = {
      [this.decisionStatus.PROPOSED]: "مقترح",
      [this.decisionStatus.PENDING]: "قيد المراجعة",
      [this.decisionStatus.APPROVED]: "معتمد",
      [this.decisionStatus.REJECTED]: "مرفوض",
      [this.decisionStatus.DEFERRED]: "مؤجل",
      [this.decisionStatus.IMPLEMENTED]: "تم التنفيذ",
      [this.decisionStatus.ARCHIVED]: "مؤرشف"
    };

    return labels[status] || "مقترح";
  },

  decisionStatusIcon(status) {
    const icons = {
      [this.decisionStatus.PROPOSED]: "💡",
      [this.decisionStatus.PENDING]: "⏳",
      [this.decisionStatus.APPROVED]: "✅",
      [this.decisionStatus.REJECTED]: "⛔",
      [this.decisionStatus.DEFERRED]: "⏸️",
      [this.decisionStatus.IMPLEMENTED]: "🚀",
      [this.decisionStatus.ARCHIVED]: "🗄️"
    };

    return icons[status] || "🧭";
  },

  decisionStatusClass(status) {
    if (
      status === this.decisionStatus.APPROVED
    ) {
      return "approved";
    }

    if (
      status === this.decisionStatus.REJECTED
    ) {
      return "rejected";
    }

    if (
      status === this.decisionStatus.DEFERRED
    ) {
      return "deferred";
    }

    if (
      status === this.decisionStatus.IMPLEMENTED
    ) {
      return "implemented";
    }

    if (
      status === this.decisionStatus.ARCHIVED
    ) {
      return "archived";
    }

    return "pending";
  },

  riskClass(level) {
    if (this.isHighRisk(level)) {
      return "red";
    }

    const value =
      this.normalizeStatus(level);

    if (
      [
        "متوسط",
        "متوسطة",
        "medium"
      ].includes(value)
    ) {
      return "orange";
    }

    return "green";
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
    const value =
      this.normalizeStatus(status);

    return [
      "closed",
      "resolved",
      "completed",
      "approved",
      "مغلق",
      "تم-الحل",
      "مكتمل",
      "معتمد"
    ].includes(value);
  },

  isActiveControl(control = {}) {
    if (
      control.enabled === true ||
      control.active === true
    ) {
      return true;
    }

    const status =
      this.normalizeStatus(
        control.status ??
        control.state ??
        ""
      );

    return [
      "active",
      "enabled",
      "approved",
      "نشط",
      "مفعل",
      "مفعّل",
      "معتمد"
    ].includes(status);
  },

  priorityScore(priority) {
    const value =
      this.normalizeStatus(priority);

    if (
      [
        "عالية",
        "عالي",
        "high",
        "critical"
      ].includes(value)
    ) {
      return 85;
    }

    if (
      [
        "متوسطة",
        "متوسط",
        "medium"
      ].includes(value)
    ) {
      return 65;
    }

    return 45;
  },

  riskPenaltyScore(level) {
    const value =
      this.normalizeStatus(level);

    if (
      value.includes("عال") ||
      [
        "high",
        "critical",
        "حرج"
      ].includes(value)
    ) {
      return 18;
    }

    if (
      value.includes("متوسط") ||
      value === "medium"
    ) {
      return 8;
    }

    return 3;
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
    if (this._syncBound) return;

    this._syncBound = true;

    const refresh =
      () => this.scheduleRefresh();

    const events = [
      "aiw:dataChanged",
      "aiw:dataUpdated",
      "aiw:dataImported",
      "aiw:dataRestored",
      "aiw:dataReset",
      "aiw:storeChanged",

      "aiw:decisionChanged",
      "aiw:decisionUpdated",
      "aiw:decisionCreated",
      "aiw:decisionApproved",
      "aiw:decisionRejected",
      "aiw:decisionDeferred",

      "aiw:ideaSubmittedForApproval",
      "aiw:ideaApproved",
      "aiw:ideaRejected",
      "aiw:ideaConvertedToProject",

      "aiw:projectCreated",
      "aiw:projectUpdated",
      "aiw:projectCreatedFromIdea",

      "aiw:automationUpdated",
      "aiw:workflowExecuted",

      "aiw:governanceUpdated",
      "aiw:risksUpdated",

      "aiw:kpisUpdated",
      "aiw:maturityUpdated",
      "aiw:reportsUpdated"
    ];

    events.forEach(eventName => {
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
        store.subscribe(refresh);
    }

    window.addEventListener(
      "storage",
      event => {
        const supportedKeys = [
          window.AIW?.KEYS?.DATA,
          "atcDataV1",
          "aiwDataV1",
          "aiwData",
          "AIW_DATA"
        ].filter(Boolean);

        if (
          !event.key ||
          supportedKeys.includes(event.key)
        ) {
          refresh();
        }
      }
    );
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
    this.closeScenarioDetails();
  },

  /* =======================================================
     Toast
  ======================================================= */

  showToast(message, type = "success") {
    document
      .querySelector(
        ".decision-workflow-toast"
      )
      ?.remove();

    const toast =
      document.createElement("div");

    toast.className =
      `decision-workflow-toast ${type}`;

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
      .decision-queue-list {
        display: grid;
        gap: 10px;
      }

      .decision-queue-row {
        display: grid;
        grid-template-columns:
          auto minmax(0, 1fr) auto auto;
        align-items: center;
        gap: 12px;
        padding: 14px;
        border: 1px solid rgba(15, 23, 42, 0.07);
        border-radius: 17px;
        background: #f9fafb;
      }

      .decision-queue-row > b {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 12px;
        color: #ffffff;
        background: #101b2f;
        font-size: 11px;
      }

      .decision-queue-row strong,
      .decision-queue-row span,
      .decision-queue-row small {
        display: block;
      }

      .decision-queue-row strong {
        color: #101828;
        font-size: 13px;
      }

      .decision-queue-row span {
        margin-top: 4px;
        color: #475467;
        font-size: 11px;
      }

      .decision-queue-row small {
        margin-top: 4px;
        color: #667085;
        font-size: 10px;
      }

      .decision-queue-row > em {
        padding: 6px 9px;
        border-radius: 999px;
        font-size: 10px;
        font-style: normal;
        font-weight: 800;
      }

      .decision-queue-row > em.red {
        color: #b42318;
        background: #feeceb;
      }

      .decision-queue-row > em.orange {
        color: #b75c00;
        background: #fff3d9;
      }

      .decision-queue-row > em.green {
        color: #087d3e;
        background: #e2f7ea;
      }

      .decision-queue-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
        min-width: 150px;
      }

      .decision-mini-action {
        appearance: none;
        min-height: 30px;
        padding: 6px 8px;
        border: 0;
        border-radius: 9px;
        font: inherit;
        font-size: 10px;
        font-weight: 800;
        cursor: pointer;
      }

      .decision-mini-action.approve {
        color: #087d3e;
        background: #e2f7ea;
      }

      .decision-mini-action.convert {
        color: #3159bf;
        background: #edf3ff;
      }

      .decision-mini-action.defer {
        color: #b75c00;
        background: #fff3d9;
      }

      .decision-mini-action.reject {
        color: #b42318;
        background: #feeceb;
      }

      .decision-scenario-actions {
        display: grid;
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid rgba(15, 23, 42, 0.08);
      }

      .decision-action-button {
        appearance: none;
        min-height: 42px;
        padding: 10px 13px;
        border: 0;
        border-radius: 13px;
        font: inherit;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
      }

      .decision-action-button.primary {
        color: #ffffff;
        background: #101b2f;
      }

      .decision-action-button.secondary {
        color: #344054;
        background: #f2f4f7;
        border: 1px solid #e4e7ec;
      }

      .decision-action-button.danger {
        color: #b42318;
        background: #feeceb;
        border: 1px solid #fbd3d0;
      }

      .decision-project-item {
        grid-template-columns:
          auto minmax(0, 1fr) auto auto !important;
      }

      .decision-project-open {
        appearance: none;
        min-height: 32px;
        padding: 7px 10px;
        border: 1px solid #dbe7ff;
        border-radius: 10px;
        color: #3159bf;
        background: #ffffff;
        font: inherit;
        font-size: 10px;
        font-weight: 800;
        cursor: pointer;
      }

      .decision-history-list {
        display: grid;
        gap: 10px;
      }

      .decision-history-row {
        display: grid;
        grid-template-columns:
          auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        padding: 13px 14px;
        border: 1px solid rgba(15, 23, 42, 0.07);
        border-radius: 16px;
        background: #f9fafb;
      }

      .decision-history-status {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 13px;
        background: #edf3ff;
      }

      .decision-history-status.approved {
        background: #e2f7ea;
      }

      .decision-history-status.rejected {
        background: #feeceb;
      }

      .decision-history-status.deferred {
        background: #fff3d9;
      }

      .decision-history-status.implemented {
        color: #ffffff;
        background: #101b2f;
      }

      .decision-history-row strong,
      .decision-history-row small {
        display: block;
      }

      .decision-history-row strong {
        color: #101828;
        font-size: 13px;
      }

      .decision-history-row small {
        margin-top: 4px;
        color: #667085;
        font-size: 10px;
      }

      .decision-history-meta {
        text-align: left;
      }

      .decision-history-meta span {
        display: block;
        color: #344054;
        font-size: 11px;
        font-weight: 800;
      }

      .decision-details-overlay,
      .decision-confirmation-overlay {
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

      .decision-details-overlay.visible,
      .decision-confirmation-overlay.visible {
        opacity: 1;
      }

      .decision-details-dialog,
      .decision-confirmation-dialog {
        position: relative;
        width: min(100%, 570px);
        max-height: min(86vh, 760px);
        overflow-y: auto;
        padding: 28px 22px 22px;
        border-radius: 28px;
        background: #ffffff;
        box-shadow:
          0 28px 80px rgba(15, 23, 42, 0.28);
        transform:
          translateY(12px)
          scale(0.98);
        transition: transform 0.18s ease;
      }

      .decision-details-overlay.visible
      .decision-details-dialog,
      .decision-confirmation-overlay.visible
      .decision-confirmation-dialog {
        transform:
          translateY(0)
          scale(1);
      }

      .decision-details-close,
      .decision-confirmation-close {
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

      .decision-details-heading > div,
      .decision-confirmation-icon {
        display: grid;
        place-items: center;
        width: 62px;
        height: 62px;
        margin-bottom: 16px;
        border-radius: 20px;
        font-size: 30px;
        background: #101b2f;
      }

      .decision-details-heading > span {
        color: #667085;
        font-size: 11px;
        font-weight: 800;
      }

      .decision-details-heading h3,
      .decision-confirmation-dialog h3 {
        margin: 7px 0 8px;
        color: #101828;
        font-size: 22px;
        line-height: 1.5;
      }

      .decision-details-heading p,
      .decision-confirmation-dialog > p {
        margin: 0;
        color: #667085;
        font-size: 14px;
        line-height: 1.8;
      }

      .decision-details-kpis {
        display: grid;
        grid-template-columns:
          repeat(4, minmax(0, 1fr));
        gap: 9px;
        margin-top: 20px;
      }

      .decision-details-kpis > div {
        min-width: 0;
        padding: 12px 9px;
        border-radius: 14px;
        text-align: center;
        background: #f7f8fa;
      }

      .decision-details-kpis small,
      .decision-details-kpis strong {
        display: block;
      }

      .decision-details-kpis small {
        margin-bottom: 5px;
        color: #667085;
        font-size: 10px;
      }

      .decision-details-kpis strong {
        color: #101828;
        font-size: 13px;
      }

      .decision-details-section {
        margin-top: 20px;
        padding-top: 17px;
        border-top:
          1px solid rgba(15, 23, 42, 0.08);
      }

      .decision-details-section > strong {
        display: block;
        margin-bottom: 9px;
        color: #101828;
        font-size: 14px;
      }

      .decision-details-section > p {
        margin: 0;
        color: #667085;
        font-size: 13px;
        line-height: 1.8;
      }

      .decision-details-list {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .decision-details-list span {
        padding: 10px 11px;
        border-radius: 12px;
        color: #475467;
        background: #f9fafb;
        font-size: 11px;
      }

      .decision-confirmation-field {
        display: block;
        margin-top: 20px;
      }

      .decision-confirmation-field > span {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        color: #344054;
        font-size: 13px;
        font-weight: 800;
      }

      .decision-confirmation-field em {
        padding: 3px 7px;
        border-radius: 999px;
        color: #b42318;
        background: #feeceb;
        font-size: 10px;
        font-style: normal;
      }

      .decision-confirmation-field textarea {
        width: 100%;
        min-height: 94px;
        resize: vertical;
        box-sizing: border-box;
        padding: 13px 14px;
        border: 1px solid #d0d5dd;
        border-radius: 15px;
        color: #101828;
        background: #ffffff;
        font: inherit;
        outline: none;
      }

      .decision-confirmation-actions {
        display: grid;
        grid-template-columns: 1fr 1.3fr;
        gap: 10px;
        margin-top: 22px;
      }

      .decision-workflow-toast {
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
        color: #ffffff;
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

      .decision-workflow-toast.visible {
        opacity: 1;
        transform:
          translateX(50%)
          translateY(0);
      }

      .decision-workflow-toast.success {
        background: #087d3e;
      }

      .decision-workflow-toast.error {
        background: #b42318;
      }

      @media (max-width: 760px) {
        .decision-queue-row {
          grid-template-columns:
            auto minmax(0, 1fr) auto;
        }

        .decision-queue-actions {
          grid-column: 2 / -1;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          width: 100%;
        }

        .decision-project-item {
          grid-template-columns:
            auto minmax(0, 1fr) auto !important;
        }

        .decision-project-open {
          grid-column: 2 / -1;
          width: 100%;
        }

        .decision-details-kpis,
        .decision-details-list {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .decision-confirmation-actions {
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

  average(values = []) {
    const validValues =
      values
        .map(value => Number(value))
        .filter(value =>
          Number.isFinite(value)
        );

    if (!validValues.length) return 0;

    return Math.round(
      validValues.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / validValues.length
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

  createId(prefix = "item") {
    return (
      `${prefix}-${Date.now()}-` +
      Math.random()
        .toString(36)
        .slice(2, 8)
    );
  },

  formatDateTime(value, fallback = "") {
    if (!value) return fallback;

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return String(value);
      }

      return date.toLocaleString("ar-AE", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      return String(value);
    }
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
  },

  escapeAttribute(value) {
    return this.escapeHtml(value);
  }
};
