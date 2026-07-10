/* =========================================================
   AI Work - Business Case Center V5.1
   Enterprise Biometric AI Feasibility Center
   Store V2.2 Native Architecture

   File Path:
   js/modules/business/business.js

   Features:
   - AIW.Store V2.2 as Single Source of Truth
   - No internal default business-case seeding
   - Safe migration from legacy businessCenter.cases
   - Business cases created from real ideas or projects
   - Idea / project source traceability
   - Duplicate business-case prevention
   - Human-in-the-Loop approval workflow
   - Persistent cost, value, budget and benefit data
   - Dynamic feasibility, ROI and investment scores
   - Automatic idea-to-project link synchronization
   - Business-case details and create modals
   - Cross-page Store synchronization
   - Compatible only with Store V2.2 public methods
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.business = {
  id: "business",
  title: "الجدوى",
  icon: "💰",
  version: "5.1.0",

  _container: null,
  _unsubscribeStore: null,
  _refreshTimer: null,
  _eventsBound: false,
  _syncBound: false,
  _selectedCaseId: null,
  _activeModal: null,
  _isRendering: false,
  _isSaving: false,
  _migrationChecked: false,

  config: {
    actor: "الإدارة",
    refreshDelay: 90,
    styleId: "aiw-business-v51-styles",
    storagePath: "businessCases",
    legacyPath: "businessCenter.cases"
  },

  STATUS: {
    DRAFT: "draft",
    UNDER_REVIEW: "under-review",
    APPROVED: "approved",
    REJECTED: "rejected",
    ARCHIVED: "archived"
  },

  TYPE: {
    QUICK_WIN: "quick-win",
    STRATEGIC: "strategic",
    TRANSFORMATIONAL: "transformational"
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
        "AI Work Business V5.1: AIW.Store is unavailable."
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
        "AI Work Business V5.1: Unable to read Store state.",
        error
      );
    }

    return {};
  },

  getPath(path, fallback = null) {
    const store = this.getStore();

    try {
      if (typeof store?.get === "function") {
        return store.get(path, fallback);
      }
    } catch (error) {
      console.warn(
        "AI Work Business V5.1: Store.get failed.",
        error
      );
    }

    const keys = String(path || "")
      .split(".")
      .filter(Boolean);

    let current = this.getState();

    for (const key of keys) {
      if (
        current === null ||
        current === undefined ||
        typeof current !== "object" ||
        !(key in current)
      ) {
        return fallback;
      }

      current = current[key];
    }

    return current;
  },

  updatePath(path, value, eventName = "aiw:businessUpdated") {
    const store = this.getStore();

    if (!store || typeof store.update !== "function") {
      return {
        success: false,
        message: "Store V2.2 لا يدعم التحديث المطلوب."
      };
    }

    try {
      const result = store.update(
        path,
        value,
        {
          event: eventName
        }
      );

      if (result === false || result === null) {
        return {
          success: false,
          message: "تعذر حفظ بيانات دراسة الجدوى."
        };
      }

      return {
        success: true,
        result,
        value
      };
    } catch (error) {
      console.error(
        "AI Work Business V5.1: Store update failed.",
        error
      );

      return {
        success: false,
        message: "تعذر حفظ بيانات دراسة الجدوى.",
        error
      };
    }
  },

  /* =======================================================
     Legacy Migration
  ======================================================= */

  ensureBusinessCasesMigrated() {
    if (this._migrationChecked) return;

    this._migrationChecked = true;

    const current = this.getPath(
      this.config.storagePath,
      null
    );

    if (Array.isArray(current)) {
      return;
    }

    const legacyCases = this.getPath(
      this.config.legacyPath,
      []
    );

    const migrated = Array.isArray(legacyCases)
      ? legacyCases
          .map((item, index) =>
            this.normalizeCase(item, index)
          )
          .filter(Boolean)
      : [];

    this.updatePath(
      this.config.storagePath,
      migrated,
      "aiw:businessMigrated"
    );
  },

  /* =======================================================
     Data Readers
  ======================================================= */

  getRawCases() {
    this.ensureBusinessCasesMigrated();

    const cases = this.getPath(
      this.config.storagePath,
      []
    );

    return Array.isArray(cases)
      ? cases.filter(item => !item?.deletedAt)
      : [];
  },

  getIdeas() {
    const store = this.getStore();

    try {
      if (typeof store?.getIdeas === "function") {
        const ideas = store.getIdeas();
        if (Array.isArray(ideas)) {
          return ideas.filter(item => !item?.deletedAt);
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Business V5.1: getIdeas failed.",
        error
      );
    }

    const ideas = this.getPath("ideas", []);

    return Array.isArray(ideas)
      ? ideas.filter(item => !item?.deletedAt)
      : [];
  },

  getProjects() {
    const store = this.getStore();

    try {
      if (typeof store?.getProjects === "function") {
        const projects = store.getProjects();
        if (Array.isArray(projects)) {
          return projects.filter(item => !item?.deletedAt);
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Business V5.1: getProjects failed.",
        error
      );
    }

    const projects = this.getPath("projects", []);

    return Array.isArray(projects)
      ? projects.filter(item => !item?.deletedAt)
      : [];
  },

  getSettings() {
    const settings = this.getPath("settings", {});

    return {
      currency:
        settings?.currency ||
        settings?.businessCase?.currency ||
        "AED",

      requireApproval:
        settings?.businessCase?.requireApproval !== false,

      minimumReadiness:
        this.normalizePercent(
          settings?.businessCase?.minimumReadiness,
          60
        ),

      minimumScore:
        this.normalizePercent(
          settings?.businessCase?.minimumScore,
          60
        ),

      minimumROI:
        this.toSafeNumber(
          settings?.businessCase?.minimumROI,
          0
        )
    };
  },

  /* =======================================================
     Normalization
  ======================================================= */

  normalizeCase(item = {}, index = 0) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const now = new Date().toISOString();

    const sourceType =
      item.sourceType ||
      (
        item.projectId
          ? "project"
          : item.ideaId || item.sourceIdeaId
            ? "idea"
            : "manual"
      );

    const status = this.normalizeStatus(
      item.businessStatus ||
      item.status ||
      this.STATUS.DRAFT
    );

    return {
      ...item,

      id:
        item.id ||
        item.businessCaseId ||
        `business-case-${index + 1}`,

      sourceType,

      ideaId:
        item.ideaId ||
        item.sourceIdeaId ||
        null,

      projectId:
        item.projectId ||
        null,

      title:
        item.title ||
        item.name ||
        "دراسة جدوى جديدة",

      titleEn:
        item.titleEn ||
        item.englishTitle ||
        item.nameEn ||
        "",

      description:
        item.description ||
        item.desc ||
        "",

      objective:
        item.objective ||
        "",

      department:
        item.department ||
        "غير مصنف",

      owner:
        item.owner ||
        null,

      sponsor:
        item.sponsor ||
        null,

      type:
        this.normalizeType(
          item.type ||
          item.investmentType ||
          this.TYPE.STRATEGIC
        ),

      priority:
        item.priority ||
        "متوسطة",

      cost:
        Math.max(
          0,
          this.toSafeNumber(
            item.cost ??
            item.estimatedCost ??
            item.budget?.estimated,
            0
          )
        ),

      value:
        Math.max(
          0,
          this.toSafeNumber(
            item.value ??
            item.expectedValue ??
            item.expectedBenefit,
            0
          )
        ),

      duration:
        item.duration ||
        item.timeline ||
        "",

      readiness:
        this.normalizePercent(
          item.readiness ??
          item.deliveryReadiness ??
          item.score,
          0
        ),

      dataReadiness:
        this.normalizePercent(
          item.dataReadiness,
          item.readiness ?? 0
        ),

      technicalReadiness:
        this.normalizePercent(
          item.technicalReadiness,
          item.readiness ?? 0
        ),

      governanceReadiness:
        this.normalizePercent(
          item.governanceReadiness,
          item.readiness ?? 0
        ),

      operationalImpact:
        this.normalizePercent(
          item.operationalImpact ??
          item.impact,
          50
        ),

      riskLevel:
        item.riskLevel ||
        item.risk ||
        "متوسطة",

      benefits:
        this.toArray(item.benefits),

      expectedOutcomes:
        this.toArray(item.expectedOutcomes),

      assumptions:
        this.toArray(item.assumptions),

      dependencies:
        this.toArray(item.dependencies),

      risks:
        this.toArray(item.risks),

      kpis:
        this.toArray(item.kpis),

      status,
      businessStatus: status,

      approval: {
        required:
          item.approval?.required !== false,

        status:
          item.approval?.status ||
          (
            status === this.STATUS.APPROVED
              ? "approved"
              : status === this.STATUS.REJECTED
                ? "rejected"
                : status === this.STATUS.UNDER_REVIEW
                  ? "pending"
                  : "not-submitted"
          ),

        submittedAt:
          item.approval?.submittedAt ||
          null,

        submittedBy:
          item.approval?.submittedBy ||
          null,

        decidedAt:
          item.approval?.decidedAt ||
          null,

        decidedBy:
          item.approval?.decidedBy ||
          null,

        note:
          item.approval?.note ||
          ""
      },

      decisionHistory:
        this.toArray(
          item.decisionHistory ||
          item.history
        ),

      createdAt:
        item.createdAt ||
        now,

      updatedAt:
        item.updatedAt ||
        now,

      deletedAt:
        item.deletedAt ?? null
    };
  },

  getCases() {
    const ideas = this.getIdeas();
    const projects = this.getProjects();

    return this.getRawCases()
      .map((item, index) =>
        this.enrichCase(
          this.normalizeCase(item, index),
          ideas,
          projects
        )
      )
      .filter(Boolean)
      .filter(item => !item.deletedAt);
  },

  enrichCase(businessCase, ideas, projects) {
    const linkedIdea =
      businessCase.ideaId
        ? ideas.find(
            idea =>
              String(idea?.id) ===
              String(businessCase.ideaId)
          )
        : null;

    const linkedProject =
      businessCase.projectId
        ? projects.find(
            project =>
              String(project?.id) ===
              String(businessCase.projectId)
          )
        : (
            businessCase.ideaId
              ? projects.find(
                  project =>
                    String(
                      project?.sourceIdeaId ??
                      project?.ideaId ??
                      project?.origin?.ideaId
                    ) === String(businessCase.ideaId)
                )
              : null
          );

    const readinessValues = [
      businessCase.readiness,
      linkedIdea?.readiness,
      linkedIdea?.decisionScore,
      linkedProject?.readiness,
      linkedProject?.progress
    ]
      .map(value => Number(value))
      .filter(Number.isFinite);

    const linkedReadiness = readinessValues.length
      ? Math.round(
          readinessValues.reduce(
            (sum, value) => sum + value,
            0
          ) / readinessValues.length
        )
      : businessCase.readiness;

    return {
      ...businessCase,

      linkedIdea,
      linkedProject,

      ideaId:
        businessCase.ideaId ||
        linkedProject?.sourceIdeaId ||
        linkedProject?.ideaId ||
        linkedProject?.origin?.ideaId ||
        null,

      projectId:
        businessCase.projectId ||
        linkedProject?.id ||
        null,

      department:
        businessCase.department !== "غير مصنف"
          ? businessCase.department
          : (
              linkedProject?.department ||
              linkedIdea?.department ||
              "غير مصنف"
            ),

      priority:
        businessCase.priority !== "متوسطة"
          ? businessCase.priority
          : (
              linkedProject?.priority ||
              linkedIdea?.priority ||
              "متوسطة"
            ),

      duration:
        businessCase.duration ||
        linkedProject?.duration ||
        linkedIdea?.duration ||
        "",

      readiness:
        this.normalizePercent(
          linkedReadiness,
          businessCase.readiness
        )
    };
  },

  /* =======================================================
     Source Eligibility
  ======================================================= */

  getEligibleSources() {
    const cases = this.getCases();
    const ideas = this.getIdeas();
    const projects = this.getProjects();

    const usedIdeaIds = new Set(
      cases
        .map(item => item.ideaId)
        .filter(Boolean)
        .map(String)
    );

    const usedProjectIds = new Set(
      cases
        .map(item => item.projectId)
        .filter(Boolean)
        .map(String)
    );

    const eligibleIdeas = ideas.filter(idea => {
      if (usedIdeaIds.has(String(idea.id))) {
        return false;
      }

      return true;
    });

    const eligibleProjects = projects.filter(project => {
      if (usedProjectIds.has(String(project.id))) {
        return false;
      }

      const sourceIdeaId =
        project?.sourceIdeaId ??
        project?.ideaId ??
        project?.origin?.ideaId ??
        null;

      if (
        sourceIdeaId &&
        usedIdeaIds.has(String(sourceIdeaId))
      ) {
        return false;
      }

      return true;
    });

    return {
      ideas: eligibleIdeas,
      projects: eligibleProjects
    };
  },

  hasCaseForIdea(ideaId) {
    if (!ideaId) return false;

    return this.getCases().some(
      item =>
        String(item.ideaId) ===
        String(ideaId)
    );
  },

  hasCaseForProject(projectId) {
    if (!projectId) return false;

    return this.getCases().some(
      item =>
        String(item.projectId) ===
        String(projectId)
    );
  },

  /* =======================================================
     Persistence Helpers
  ======================================================= */

  persistCases(cases, eventName = "aiw:businessUpdated") {
    const cleanCases = Array.isArray(cases)
      ? cases.map((item, index) =>
          this.normalizeCase(item, index)
        )
      : [];

    return this.updatePath(
      this.config.storagePath,
      cleanCases,
      eventName
    );
  },

  /* =======================================================
     CRUD
  ======================================================= */

  createCase(payload = {}) {
    if (this._isSaving) {
      return {
        success: false,
        message: "يتم حفظ دراسة الجدوى حالياً."
      };
    }

    const sourceType =
      payload.sourceType ||
      (
        payload.projectId
          ? "project"
          : payload.ideaId
            ? "idea"
            : "manual"
      );

    if (
      payload.ideaId &&
      this.hasCaseForIdea(payload.ideaId)
    ) {
      return {
        success: false,
        reason: "duplicate-idea-case",
        message: "توجد دراسة جدوى مرتبطة بهذه الفكرة مسبقاً."
      };
    }

    if (
      payload.projectId &&
      this.hasCaseForProject(payload.projectId)
    ) {
      return {
        success: false,
        reason: "duplicate-project-case",
        message: "توجد دراسة جدوى مرتبطة بهذا المشروع مسبقاً."
      };
    }

    const ideas = this.getIdeas();
    const projects = this.getProjects();

    const idea = payload.ideaId
      ? ideas.find(
          item =>
            String(item.id) ===
            String(payload.ideaId)
        )
      : null;

    const project = payload.projectId
      ? projects.find(
          item =>
            String(item.id) ===
            String(payload.projectId)
        )
      : null;

    const sourceIdeaId =
      project?.sourceIdeaId ??
      project?.ideaId ??
      project?.origin?.ideaId ??
      null;

    const sourceIdea =
      idea ||
      (
        sourceIdeaId
          ? ideas.find(
              item =>
                String(item.id) ===
                String(sourceIdeaId)
            )
          : null
      );

    const now = new Date().toISOString();

    const record = this.normalizeCase({
      ...payload,

      id:
        payload.id ||
        this.generateId("business-case"),

      sourceType,

      ideaId:
        payload.ideaId ||
        sourceIdea?.id ||
        null,

      projectId:
        payload.projectId ||
        project?.id ||
        null,

      title:
        payload.title ||
        project?.title ||
        sourceIdea?.title ||
        "دراسة جدوى جديدة",

      titleEn:
        payload.titleEn ||
        project?.englishTitle ||
        sourceIdea?.englishTitle ||
        sourceIdea?.title ||
        "",

      description:
        payload.description ||
        project?.description ||
        sourceIdea?.solution ||
        sourceIdea?.description ||
        "",

      objective:
        payload.objective ||
        project?.objective ||
        sourceIdea?.challenge ||
        "",

      department:
        payload.department ||
        project?.department ||
        sourceIdea?.department ||
        "غير مصنف",

      priority:
        payload.priority ||
        project?.priority ||
        sourceIdea?.priority ||
        "متوسطة",

      duration:
        payload.duration ||
        project?.duration ||
        sourceIdea?.duration ||
        "",

      readiness:
        payload.readiness ??
        project?.readiness ??
        project?.progress ??
        sourceIdea?.readiness ??
        sourceIdea?.decisionScore ??
        0,

      riskLevel:
        payload.riskLevel ||
        project?.riskLevel ||
        sourceIdea?.riskLevel ||
        sourceIdea?.risk ||
        "متوسطة",

      benefits:
        payload.benefits?.length
          ? payload.benefits
          : (
              project?.benefits ||
              sourceIdea?.benefits ||
              []
            ),

      kpis:
        payload.kpis?.length
          ? payload.kpis
          : (
              project?.kpis ||
              sourceIdea?.kpis ||
              []
            ),

      status:
        this.STATUS.DRAFT,

      businessStatus:
        this.STATUS.DRAFT,

      approval: {
        required: true,
        status: "not-submitted",
        submittedAt: null,
        submittedBy: null,
        decidedAt: null,
        decidedBy: null,
        note: ""
      },

      decisionHistory: [
        {
          id: this.generateId("business-history"),
          action: "created",
          sourceType,
          ideaId:
            payload.ideaId ||
            sourceIdea?.id ||
            null,
          projectId:
            payload.projectId ||
            project?.id ||
            null,
          actor:
            payload.actor ||
            this.config.actor,
          createdAt: now
        }
      ],

      createdAt: now,
      updatedAt: now
    });

    this._isSaving = true;

    try {
      const cases = [
        record,
        ...this.getRawCases()
      ];

      const result = this.persistCases(
        cases,
        "aiw:businessCaseCreated"
      );

      if (!result.success) {
        return result;
      }

      this.emit("aiw:businessCaseCreated", {
        businessCase: record
      });

      return {
        success: true,
        businessCase: record
      };
    } finally {
      this._isSaving = false;
    }
  },

  updateCase(id, changes = {}) {
    const currentCases = this.getRawCases();
    const index = currentCases.findIndex(
      item =>
        String(item.id) === String(id)
    );

    if (index < 0) {
      return {
        success: false,
        reason: "case-not-found",
        message: "لم يتم العثور على دراسة الجدوى."
      };
    }

    const current = this.normalizeCase(
      currentCases[index],
      index
    );

    const updatedPayload = this.normalizeCase({
      ...current,
      ...changes,
      id: current.id,
      linkedIdea: undefined,
      linkedProject: undefined,
      updatedAt: new Date().toISOString()
    }, index);

    const cases = currentCases.map(
      (item, itemIndex) =>
        itemIndex === index
          ? updatedPayload
          : item
    );

    const result = this.persistCases(
      cases,
      "aiw:businessCaseUpdated"
    );

    if (!result.success) {
      return result;
    }

    this.emit("aiw:businessCaseUpdated", {
      businessCase: updatedPayload
    });

    return {
      success: true,
      businessCase: updatedPayload
    };
  },

  removeCase(id) {
    const currentCases = this.getRawCases();
    const current = currentCases.find(
      item =>
        String(item.id) === String(id)
    );

    if (!current) {
      return {
        success: false,
        reason: "case-not-found",
        message: "لم يتم العثور على دراسة الجدوى."
      };
    }

    const cases = currentCases.filter(
      item =>
        String(item.id) !== String(id)
    );

    const result = this.persistCases(
      cases,
      "aiw:businessCaseRemoved"
    );

    if (!result.success) {
      return result;
    }

    this.emit("aiw:businessCaseRemoved", {
      id,
      businessCase: current
    });

    return {
      success: true,
      businessCase: current
    };
  },

  /* =======================================================
     Approval Workflow
  ======================================================= */

  submitForApproval(id, options = {}) {
    const current = this.getCases().find(
      item =>
        String(item.id) === String(id)
    );

    if (!current) {
      return {
        success: false,
        message: "لم يتم العثور على دراسة الجدوى."
      };
    }

    if (current.status !== this.STATUS.DRAFT) {
      return {
        success: false,
        message: "يمكن رفع الدراسات الموجودة في حالة مسودة فقط."
      };
    }

    const now = new Date().toISOString();

    const history = [
      {
        id: this.generateId("business-history"),
        action: "submitted-for-approval",
        fromStatus: current.status,
        toStatus: this.STATUS.UNDER_REVIEW,
        actor:
          options.actor ||
          options.submittedBy ||
          this.config.actor,
        note:
          options.note ||
          "",
        createdAt: now
      },
      ...current.decisionHistory
    ];

    const result = this.updateCase(id, {
      status: this.STATUS.UNDER_REVIEW,
      businessStatus: this.STATUS.UNDER_REVIEW,

      approval: {
        ...current.approval,
        required: true,
        status: "pending",
        submittedAt: now,
        submittedBy:
          options.submittedBy ||
          options.actor ||
          this.config.actor,
        decidedAt: null,
        decidedBy: null,
        note:
          options.note ||
          ""
      },

      decisionHistory: history
    });

    if (result.success) {
      this.recordExecution({
        entityType: "business-case",
        entityId: id,
        ideaId: current.ideaId,
        projectId: current.projectId,
        action: "submitted-for-approval",
        status: "pending",
        actor:
          options.actor ||
          this.config.actor
      });

      this.emit("aiw:businessCaseSubmitted", {
        businessCase: result.businessCase
      });
    }

    return result;
  },

  approveCase(id, options = {}) {
    return this.decideCase(
      id,
      "approved",
      options
    );
  },

  rejectCase(id, options = {}) {
    return this.decideCase(
      id,
      "rejected",
      options
    );
  },

  decideCase(id, decision, options = {}) {
    const current = this.getCases().find(
      item =>
        String(item.id) === String(id)
    );

    if (!current) {
      return {
        success: false,
        message: "لم يتم العثور على دراسة الجدوى."
      };
    }

    if (current.status !== this.STATUS.UNDER_REVIEW) {
      return {
        success: false,
        message: "لا يمكن اتخاذ القرار إلا على دراسة قيد الاعتماد."
      };
    }

    const approved =
      decision === "approved";

    const nextStatus =
      approved
        ? this.STATUS.APPROVED
        : this.STATUS.REJECTED;

    const now = new Date().toISOString();

    const history = [
      {
        id: this.generateId("business-history"),
        action:
          approved
            ? "approved"
            : "rejected",
        fromStatus: current.status,
        toStatus: nextStatus,
        actor:
          options.actor ||
          options.decidedBy ||
          this.config.actor,
        note:
          options.note ||
          "",
        createdAt: now
      },
      ...current.decisionHistory
    ];

    const result = this.updateCase(id, {
      status: nextStatus,
      businessStatus: nextStatus,

      approval: {
        ...current.approval,
        required: true,
        status:
          approved
            ? "approved"
            : "rejected",
        decidedAt: now,
        decidedBy:
          options.decidedBy ||
          options.actor ||
          this.config.actor,
        note:
          options.note ||
          ""
      },

      decisionHistory: history
    });

    if (result.success) {
      this.recordExecution({
        entityType: "business-case",
        entityId: id,
        ideaId: current.ideaId,
        projectId: current.projectId,
        action:
          approved
            ? "approved"
            : "rejected",
        status: nextStatus,
        actor:
          options.actor ||
          this.config.actor
      });

      this.emit(
        approved
          ? "aiw:businessCaseApproved"
          : "aiw:businessCaseRejected",
        {
          businessCase: result.businessCase
        }
      );
    }

    return result;
  },

  recordExecution(entry = {}) {
    const automation = this.getPath(
      "automation",
      {}
    );

    const currentHistory = Array.isArray(
      automation?.executionHistory
    )
      ? automation.executionHistory
      : [];

    const record = {
      id: this.generateId("execution"),
      workflowTitle: "Business Case Approval Workflow",
      trigger: entry.action || "business-case",
      entityType: entry.entityType || "business-case",
      entityId: entry.entityId || null,
      ideaId: entry.ideaId || null,
      projectId: entry.projectId || null,
      action: entry.action || "",
      status: entry.status || "recorded",
      actor: entry.actor || this.config.actor,
      createdAt: new Date().toISOString()
    };

    return this.updatePath(
      "automation.executionHistory",
      [
        ...currentHistory,
        record
      ],
      "aiw:workflowExecuted"
    );
  },

  /* =======================================================
     Calculations
  ======================================================= */

  calculateCase(item) {
    const cost = Math.max(
      0,
      this.toSafeNumber(item?.cost, 0)
    );

    const value = Math.max(
      0,
      this.toSafeNumber(item?.value, 0)
    );

    const netValue = value - cost;

    const roi =
      cost > 0
        ? Math.round((netValue / cost) * 100)
        : value > 0
          ? 100
          : 0;

    const valueCostRatio =
      cost > 0
        ? Number((value / cost).toFixed(2))
        : 0;

    const readiness = this.average([
      item?.readiness,
      item?.dataReadiness,
      item?.technicalReadiness,
      item?.governanceReadiness
    ]);

    const riskScore = this.riskScore(
      item?.riskLevel
    );

    const roiScore = this.normalizePercent(
      Math.max(0, roi),
      0
    );

    const feasibilityScore =
      this.normalizePercent(
        readiness * 0.35 +
        roiScore * 0.2 +
        this.normalizePercent(
          item?.operationalImpact,
          50
        ) * 0.25 +
        riskScore * 0.2,
        0
      );

    return {
      cost,
      value,
      netValue,
      roi,
      valueCostRatio,
      readiness,
      riskScore,
      feasibilityScore
    };
  },

  calculateSummary(cases = []) {
    const totalCost = cases.reduce(
      (total, item) =>
        total +
        this.calculateCase(item).cost,
      0
    );

    const totalValue = cases.reduce(
      (total, item) =>
        total +
        this.calculateCase(item).value,
      0
    );

    const netValue = totalValue - totalCost;

    const roi =
      totalCost > 0
        ? Math.round(
            (netValue / totalCost) * 100
          )
        : 0;

    const averageReadiness =
      cases.length
        ? this.average(
            cases.map(
              item =>
                this.calculateCase(item)
                  .readiness
            )
          )
        : 0;

    const averageScore =
      cases.length
        ? this.average(
            cases.map(
              item =>
                this.calculateCase(item)
                  .feasibilityScore
            )
          )
        : 0;

    const approved = cases.filter(
      item =>
        item.status ===
        this.STATUS.APPROVED
    ).length;

    const pending = cases.filter(
      item =>
        item.status ===
        this.STATUS.UNDER_REVIEW
    ).length;

    const linkedProjects = cases.filter(
      item => Boolean(item.projectId)
    ).length;

    const quickWins = cases.filter(
      item =>
        item.type ===
        this.TYPE.QUICK_WIN
    ).length;

    return {
      totalCases: cases.length,
      totalCost,
      totalValue,
      netValue,
      roi,
      averageReadiness,
      averageScore,
      approved,
      pending,
      linkedProjects,
      quickWins
    };
  },

  riskScore(level) {
    const value = this.normalizeText(level);

    if (
      value.includes("عال") ||
      value === "high" ||
      value === "critical"
    ) {
      return 35;
    }

    if (
      value.includes("متوسط") ||
      value === "medium"
    ) {
      return 65;
    }

    return 90;
  },

  getRecommendations(cases, summary) {
    const recommendations = [];

    cases
      .slice()
      .sort(
        (first, second) =>
          this.calculateCase(second)
            .feasibilityScore -
          this.calculateCase(first)
            .feasibilityScore
      )
      .slice(0, 3)
      .forEach(item => {
        const score =
          this.calculateCase(item)
            .feasibilityScore;

        recommendations.push(
          `إعطاء أولوية لدراسة ${item.title} بدرجة جدوى ${score}%.`
        );
      });

    if (summary.pending > 0) {
      recommendations.push(
        `مراجعة ${summary.pending} دراسة جدوى بانتظار الاعتماد البشري.`
      );
    }

    if (
      summary.totalCases > 0 &&
      summary.approved === 0
    ) {
      recommendations.push(
        "اعتماد دراسة واحدة على الأقل قبل التوسع في المشاريع التنفيذية."
      );
    }

    if (!recommendations.length) {
      recommendations.push(
        "إنشاء أول دراسة جدوى من فكرة أو مشروع حقيقي."
      );
    }

    return recommendations.slice(0, 5);
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
      this.ensureBusinessCasesMigrated();
      this.injectStyles();

      const W = window.AIW?.Widgets;
      const cases = this.getCases();
      const summary = this.calculateSummary(cases);
      const sources = this.getEligibleSources();
      const recommendations =
        this.getRecommendations(
          cases,
          summary
        );

      container.innerHTML = `
        <section class="module-page">

          ${
            W?.hero
              ? W.hero({
                  kicker:
                    "Biometric Business Case · Feasibility",

                  title:
                    "مركز الجدوى الاستثمارية",

                  description:
                    "إنشاء واعتماد دراسات الجدوى من الأفكار والمشاريع الحقيقية، وربط التكلفة والقيمة والمخاطر والجاهزية بمسار التنفيذ المؤسسي.",

                  chips: [
                    `💰 ${summary.totalCases} دراسة`,
                    `⏳ ${summary.pending} بانتظار الاعتماد`,
                    `✅ ${summary.approved} معتمدة`,
                    `📁 ${summary.linkedProjects} مرتبطة بمشاريع`
                  ]
                })
              : this.fallbackHero(summary)
          }

          <div class="module-grid">
            ${this.kpi(
              "دراسات الجدوى",
              summary.totalCases,
              "Business Cases"
            )}

            ${this.kpi(
              "بانتظار الاعتماد",
              summary.pending,
              "Human Review"
            )}

            ${this.kpi(
              "دراسات معتمدة",
              summary.approved,
              "Approved"
            )}

            ${this.kpi(
              "التكلفة التقديرية",
              this.formatAED(summary.totalCost),
              "Estimated Cost"
            )}

            ${this.kpi(
              "القيمة المتوقعة",
              this.formatAED(summary.totalValue),
              "Expected Value"
            )}

            ${this.kpi(
              "متوسط الجدوى",
              `${summary.averageScore}%`,
              "Feasibility Score"
            )}
          </div>

          <div class="module-wide-grid">
            <div class="module-panel">
              ${this.sectionTitle(
                "إدارة دراسات الجدوى",
                "أنشئ دراسة من فكرة أو مشروع حقيقي، ثم ارفعها للاعتماد."
              )}

              <div class="business-action-card">
                <strong>
                  ${
                    cases.length
                      ? "أضف دراسة جدوى جديدة"
                      : "ابدأ بأول دراسة جدوى"
                  }
                </strong>

                <p>
                  الأفكار والمشاريع المرتبطة تحفظ مصدر الدراسة وتمنع تكرار إنشاء دراسة لنفس العنصر.
                </p>

                <button
                  type="button"
                  class="module-btn primary"
                  data-business-action="create"
                  ${
                    !sources.ideas.length &&
                    !sources.projects.length
                      ? "disabled"
                      : ""
                  }
                >
                  + إنشاء دراسة جدوى
                </button>
              </div>
            </div>

            <div class="module-panel">
              ${this.sectionTitle(
                "الخلاصة الاستثمارية",
                "قراءة مباشرة للمحفظة الحالية."
              )}

              <div class="business-ultimate-summary">
                <strong>
                  ${
                    summary.totalCases
                      ? `صافي القيمة التقديرية ${this.formatAED(summary.netValue)}`
                      : "لا توجد تقديرات استثمارية حتى الآن"
                  }
                </strong>

                <p>
                  ${
                    summary.totalCases
                      ? `العائد التقديري للمحفظة ${summary.roi}%، ومتوسط جاهزية التنفيذ ${summary.averageReadiness}%.`
                      : "أنشئ دراسة من فكرة أو مشروع لبدء احتساب التكلفة والقيمة والجاهزية."
                  }
                </p>

                <div class="business-summary-strip">
                  <div>
                    <span>Cost</span>
                    <b>${this.formatAED(summary.totalCost)}</b>
                  </div>

                  <div>
                    <span>Value</span>
                    <b>${this.formatAED(summary.totalValue)}</b>
                  </div>

                  <div>
                    <span>Net</span>
                    <b>${this.formatAED(summary.netValue)}</b>
                  </div>

                  <div>
                    <span>ROI</span>
                    <b>${summary.roi}%</b>
                  </div>
                </div>
              </div>
            </div>
          </div>

          ${
            cases.length
              ? `
                <div class="module-wide-grid">
                  <div class="module-panel">
                    ${this.sectionTitle(
                      "Return by Business Case",
                      "مقارنة العائد التقديري للدراسات الحالية."
                    )}

                    <div class="business-chart-card">
                      <canvas id="businessRoiChart"></canvas>
                    </div>
                  </div>

                  <div class="module-panel">
                    ${this.sectionTitle(
                      "Feasibility Health",
                      "توزيع الدراسات حسب درجة الجدوى."
                    )}

                    <div class="business-chart-card">
                      <canvas id="businessMixChart"></canvas>
                    </div>
                  </div>
                </div>
              `
              : ""
          }

          <div class="module-panel">
            ${this.sectionTitle(
              "محفظة دراسات الجدوى",
              "كل دراسة مرتبطة بمصدرها الحقيقي وتاريخ قرارها."
            )}

            ${
              cases.length
                ? `
                  <div class="business-grid">
                    ${cases
                      .map(item =>
                        this.caseCard(item)
                      )
                      .join("")}
                  </div>
                `
                : this.emptyPortfolio(sources)
            }
          </div>

          <div class="module-wide-grid">
            <div class="module-panel">
              ${this.sectionTitle(
                "معيار الاعتماد",
                "العناصر الأساسية قبل قبول الدراسة."
              )}

              <div class="business-criteria">
                <div>
                  <b>1</b>
                  <span>مشكلة وقيمة تشغيلية واضحتان</span>
                </div>

                <div>
                  <b>2</b>
                  <span>تكلفة وقيمة متوقعة قابلتان للتبرير</span>
                </div>

                <div>
                  <b>3</b>
                  <span>جاهزية بيانات وتقنية وحوكمة</span>
                </div>

                <div>
                  <b>4</b>
                  <span>مؤشرات قياس ومخاطر قابلة للإدارة</span>
                </div>
              </div>
            </div>

            <div class="module-panel">
              ${this.sectionTitle(
                "Next Best Actions",
                "الخطوات العملية التالية."
              )}

              ${this.renderExecutiveList(
                recommendations
              )}
            </div>
          </div>
        </section>
      `;

      this.bindEvents();
      this.bindAutomaticSync();
      this.renderCharts(cases);
    } finally {
      this._isRendering = false;
    }
  },

  caseCard(item) {
    const calculations =
      this.calculateCase(item);

    return `
      <article
        class="business-card"
        data-business-case-id="${this.escapeAttribute(item.id)}"
      >
        <div class="business-card-head">
          <span
            class="aiw-status ${this.statusClass(item.status)}"
          >
            ${this.statusLabel(item.status)}
          </span>

          <b>
            ${calculations.feasibilityScore}%
          </b>
        </div>

        <h3>
          ${this.escapeHtml(item.title)}
        </h3>

        ${
          item.titleEn
            ? `
              <small>
                ${this.escapeHtml(item.titleEn)}
              </small>
            `
            : ""
        }

        <div class="business-values">
          <div>
            <span>التكلفة</span>
            <strong>
              ${this.formatAED(calculations.cost)}
            </strong>
          </div>

          <div>
            <span>القيمة</span>
            <strong>
              ${this.formatAED(calculations.value)}
            </strong>
          </div>

          <div>
            <span>العائد</span>
            <strong>
              ${calculations.roi}%
            </strong>
          </div>
        </div>

        <div class="business-meta">
          <span>
            ${
              item.linkedProject
                ? "📁 مشروع"
                : item.linkedIdea
                  ? "💡 فكرة"
                  : "📝 يدوي"
            }
          </span>

          <span>
            ⚠️ ${this.escapeHtml(
              this.riskLabel(item.riskLevel)
            )}
          </span>
        </div>

        <div class="aiw-progress">
          <div
            style="width:${calculations.feasibilityScore}%"
          ></div>
        </div>

        <button
          type="button"
          class="module-btn secondary"
          data-business-action="details"
          data-business-case-id="${this.escapeAttribute(item.id)}"
        >
          فتح التفاصيل
        </button>
      </article>
    `;
  },

  emptyPortfolio(sources) {
    const sourceCount =
      sources.ideas.length +
      sources.projects.length;

    return `
      <div class="module-empty">
        <strong>
          لا توجد دراسات جدوى حالياً
        </strong>

        <p>
          ${
            sourceCount
              ? `يوجد ${sourceCount} مصدر متاح لإنشاء أول دراسة جدوى.`
              : "أضف فكرة أو مشروعاً أولاً، ثم أنشئ دراسة الجدوى من المصدر الحقيقي."
          }
        </p>

        ${
          sourceCount
            ? `
              <button
                type="button"
                class="module-btn primary"
                data-business-action="create"
              >
                إنشاء أول دراسة
              </button>
            `
            : ""
        }
      </div>
    `;
  },

  /* =======================================================
     Modals
  ======================================================= */

  openCreateModal() {
    const sources =
      this.getEligibleSources();

    if (
      !sources.ideas.length &&
      !sources.projects.length
    ) {
      this.notify(
        "لا توجد أفكار أو مشاريع متاحة لإنشاء دراسة جدوى.",
        "warning"
      );
      return;
    }

    const sourceOptions = [
      ...sources.ideas.map(idea => ({
        value: `idea:${idea.id}`,
        label: `💡 ${idea.title}`,
        department: idea.department || ""
      })),

      ...sources.projects.map(project => ({
        value: `project:${project.id}`,
        label: `📁 ${project.title}`,
        department: project.department || ""
      }))
    ];

    this.openModal(`
      <div class="aiw-modal-card business-modal-card">
        <div class="aiw-modal-head">
          <div>
            <h2>إنشاء دراسة جدوى</h2>
            <p>اختر الفكرة أو المشروع ثم أدخل التقديرات الأساسية.</p>
          </div>

          <button
            type="button"
            class="aiw-modal-close"
            data-business-action="close-modal"
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>

        <form
          class="business-form"
          data-business-form="create"
        >
          <label>
            <span>المصدر</span>

            <select
              name="source"
              required
            >
              <option value="">
                اختر فكرة أو مشروعاً
              </option>

              ${sourceOptions
                .map(option => `
                  <option value="${this.escapeAttribute(option.value)}">
                    ${this.escapeHtml(option.label)}
                    ${
                      option.department
                        ? ` — ${this.escapeHtml(option.department)}`
                        : ""
                    }
                  </option>
                `)
                .join("")}
            </select>
          </label>

          <div class="business-form-grid">
            <label>
              <span>التكلفة التقديرية</span>
              <input
                type="number"
                name="cost"
                min="0"
                step="1"
                value="0"
                required
              />
            </label>

            <label>
              <span>القيمة المتوقعة</span>
              <input
                type="number"
                name="value"
                min="0"
                step="1"
                value="0"
                required
              />
            </label>

            <label>
              <span>جاهزية البيانات %</span>
              <input
                type="number"
                name="dataReadiness"
                min="0"
                max="100"
                value="0"
              />
            </label>

            <label>
              <span>الجاهزية التقنية %</span>
              <input
                type="number"
                name="technicalReadiness"
                min="0"
                max="100"
                value="0"
              />
            </label>

            <label>
              <span>جاهزية الحوكمة %</span>
              <input
                type="number"
                name="governanceReadiness"
                min="0"
                max="100"
                value="0"
              />
            </label>

            <label>
              <span>الأثر التشغيلي %</span>
              <input
                type="number"
                name="operationalImpact"
                min="0"
                max="100"
                value="50"
              />
            </label>
          </div>

          <label>
            <span>نوع الاستثمار</span>

            <select name="type">
              <option value="quick-win">
                Quick Win
              </option>

              <option value="strategic" selected>
                Strategic
              </option>

              <option value="transformational">
                Transformational
              </option>
            </select>
          </label>

          <label>
            <span>ملاحظات الدراسة</span>

            <textarea
              name="description"
              rows="4"
              placeholder="أضف وصفاً أو ملاحظات إضافية..."
            ></textarea>
          </label>

          <div class="aiw-modal-actions">
            <button
              type="button"
              class="module-btn secondary"
              data-business-action="close-modal"
            >
              إلغاء
            </button>

            <button
              type="submit"
              class="module-btn primary"
            >
              حفظ دراسة الجدوى
            </button>
          </div>
        </form>
      </div>
    `);
  },

  openDetailsModal(id) {
    const item = this.getCases().find(
      businessCase =>
        String(businessCase.id) ===
        String(id)
    );

    if (!item) {
      this.notify(
        "لم يتم العثور على دراسة الجدوى.",
        "error"
      );
      return;
    }

    this._selectedCaseId = item.id;

    const calculations =
      this.calculateCase(item);

    this.openModal(`
      <div class="aiw-modal-card business-modal-card">
        <div class="aiw-modal-head">
          <div>
            <h2>
              ${this.escapeHtml(item.title)}
            </h2>

            <p>
              ${
                item.linkedProject
                  ? "مرتبطة بمشروع تنفيذي"
                  : item.linkedIdea
                    ? "مرتبطة بفكرة"
                    : "دراسة يدوية"
              }
            </p>
          </div>

          <button
            type="button"
            class="aiw-modal-close"
            data-business-action="close-modal"
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>

        <div class="business-detail-grid">
          ${this.detailMetric(
            "درجة الجدوى",
            `${calculations.feasibilityScore}%`
          )}

          ${this.detailMetric(
            "العائد",
            `${calculations.roi}%`
          )}

          ${this.detailMetric(
            "التكلفة",
            this.formatAED(calculations.cost)
          )}

          ${this.detailMetric(
            "القيمة",
            this.formatAED(calculations.value)
          )}

          ${this.detailMetric(
            "جاهزية التنفيذ",
            `${calculations.readiness}%`
          )}

          ${this.detailMetric(
            "الحالة",
            this.statusLabel(item.status)
          )}
        </div>

        <div class="business-detail-section">
          <strong>الوصف</strong>
          <p>
            ${this.escapeHtml(
              item.description ||
              "لا يوجد وصف إضافي."
            )}
          </p>
        </div>

        <div class="business-detail-section">
          <strong>المصدر</strong>

          <p>
            ${
              item.linkedProject
                ? `المشروع: ${this.escapeHtml(item.linkedProject.title)}`
                : item.linkedIdea
                  ? `الفكرة: ${this.escapeHtml(item.linkedIdea.title)}`
                  : "دراسة مستقلة"
            }
          </p>
        </div>

        <div class="business-detail-section">
          <strong>سجل القرار</strong>

          ${
            item.decisionHistory.length
              ? `
                <div class="business-history-list">
                  ${item.decisionHistory
                    .slice(0, 8)
                    .map(entry => `
                      <div>
                        <span>
                          ${this.escapeHtml(
                            this.actionLabel(entry.action)
                          )}
                        </span>

                        <small>
                          ${this.escapeHtml(
                            entry.actor || this.config.actor
                          )}
                          ·
                          ${this.escapeHtml(
                            this.formatDateTime(
                              entry.createdAt,
                              "غير محدد"
                            )
                          )}
                        </small>
                      </div>
                    `)
                    .join("")}
                </div>
              `
              : this.emptyState(
                  "لا يوجد سجل قرار لهذه الدراسة."
                )
          }
        </div>

        <div class="aiw-modal-actions business-detail-actions">
          ${
            item.status === this.STATUS.DRAFT
              ? `
                <button
                  type="button"
                  class="module-btn primary"
                  data-business-action="submit"
                  data-business-case-id="${this.escapeAttribute(item.id)}"
                >
                  رفع للاعتماد
                </button>
              `
              : ""
          }

          ${
            item.status === this.STATUS.UNDER_REVIEW
              ? `
                <button
                  type="button"
                  class="module-btn primary"
                  data-business-action="approve"
                  data-business-case-id="${this.escapeAttribute(item.id)}"
                >
                  اعتماد
                </button>

                <button
                  type="button"
                  class="module-btn secondary"
                  data-business-action="reject"
                  data-business-case-id="${this.escapeAttribute(item.id)}"
                >
                  رفض
                </button>
              `
              : ""
          }

          ${
            item.linkedProject
              ? `
                <button
                  type="button"
                  class="module-btn secondary"
                  data-business-action="open-project"
                  data-project-id="${this.escapeAttribute(item.linkedProject.id)}"
                >
                  فتح المشروع
                </button>
              `
              : item.linkedIdea
                ? `
                  <button
                    type="button"
                    class="module-btn secondary"
                    data-business-action="open-idea"
                    data-idea-id="${this.escapeAttribute(item.linkedIdea.id)}"
                  >
                    فتح الفكرة
                  </button>
                `
                : ""
          }

          <button
            type="button"
            class="module-btn secondary"
            data-business-action="delete"
            data-business-case-id="${this.escapeAttribute(item.id)}"
          >
            حذف
          </button>
        </div>
      </div>
    `);
  },

  detailMetric(label, value) {
    return `
      <div class="module-card">
        <span>${this.escapeHtml(label)}</span>
        <strong>${this.escapeHtml(value)}</strong>
      </div>
    `;
  },

  openModal(content) {
    this.closeModal();

    const root =
      document.getElementById("modalRoot") ||
      document.body;

    const modal = document.createElement("div");

    modal.className =
      "aiw-modal business-modal is-open";

    modal.setAttribute(
      "data-business-modal",
      "true"
    );

    modal.innerHTML = `
      <div
        class="aiw-modal-backdrop"
        data-business-action="close-modal"
      ></div>

      <div class="aiw-modal-dialog">
        ${content}
      </div>
    `;

    root.appendChild(modal);

    if (root.id === "modalRoot") {
      root.setAttribute(
        "aria-hidden",
        "false"
      );
    }

    document.body.classList.add(
      "aiw-modal-open"
    );

    this._activeModal = modal;
  },

  closeModal() {
    if (this._activeModal) {
      this._activeModal.remove();
      this._activeModal = null;
    }

    const root =
      document.getElementById("modalRoot");

    if (root) {
      root.setAttribute(
        "aria-hidden",
        "true"
      );
    }

    document.body.classList.remove(
      "aiw-modal-open"
    );

    this._selectedCaseId = null;
  },

  /* =======================================================
     Events
  ======================================================= */

  bindEvents() {
    if (this._eventsBound) return;

    this._eventsBound = true;

    document.addEventListener(
      "click",
      event => {
        const trigger =
          event.target.closest(
            "[data-business-action]"
          );

        if (!trigger) return;

        const action =
          trigger.getAttribute(
            "data-business-action"
          );

        if (!action) return;

        event.preventDefault();

        const id =
          trigger.getAttribute(
            "data-business-case-id"
          );

        if (action === "create") {
          this.openCreateModal();
          return;
        }

        if (action === "details") {
          this.openDetailsModal(id);
          return;
        }

        if (action === "close-modal") {
          this.closeModal();
          return;
        }

        if (action === "submit") {
          const note = window.prompt(
            "أدخل ملاحظة الرفع للاعتماد (اختياري):",
            ""
          ) || "";

          const result =
            this.submitForApproval(
              id,
              {
                actor: this.config.actor,
                note
              }
            );

          this.handleActionResult(
            result,
            "تم رفع دراسة الجدوى للاعتماد."
          );
          return;
        }

        if (action === "approve") {
          const note = window.prompt(
            "أدخل ملاحظة قرار الاعتماد (اختياري):",
            ""
          ) || "";

          const result =
            this.approveCase(
              id,
              {
                actor: this.config.actor,
                note
              }
            );

          this.handleActionResult(
            result,
            "تم اعتماد دراسة الجدوى."
          );
          return;
        }

        if (action === "reject") {
          const note = window.prompt(
            "أدخل سبب الرفض:",
            ""
          );

          if (!note?.trim()) {
            this.notify(
              "سبب الرفض مطلوب.",
              "warning"
            );
            return;
          }

          const result =
            this.rejectCase(
              id,
              {
                actor: this.config.actor,
                note
              }
            );

          this.handleActionResult(
            result,
            "تم رفض دراسة الجدوى."
          );
          return;
        }

        if (action === "delete") {
          const confirmed =
            window.confirm(
              "هل تريد حذف دراسة الجدوى؟"
            );

          if (!confirmed) return;

          const result =
            this.removeCase(id);

          this.handleActionResult(
            result,
            "تم حذف دراسة الجدوى."
          );
          return;
        }

        if (action === "open-project") {
          const projectId =
            trigger.getAttribute(
              "data-project-id"
            );

          this.closeModal();

          try {
            localStorage.setItem(
              "aiwSelectedProjectId",
              String(projectId)
            );
          } catch (error) {
            console.warn(
              "AI Work Business V5.1: Unable to save selected project.",
              error
            );
          }

          this.navigateTo("projects");
          return;
        }

        if (action === "open-idea") {
          const ideaId =
            trigger.getAttribute(
              "data-idea-id"
            );

          this.closeModal();

          try {
            localStorage.setItem(
              "aiwSelectedIdeaId",
              String(ideaId)
            );
          } catch (error) {
            console.warn(
              "AI Work Business V5.1: Unable to save selected idea.",
              error
            );
          }

          this.navigateTo("ideas");
        }
      }
    );

    document.addEventListener(
      "submit",
      event => {
        const form =
          event.target.closest(
            "[data-business-form='create']"
          );

        if (!form) return;

        event.preventDefault();

        const formData =
          new FormData(form);

        const source =
          String(
            formData.get("source") ||
            ""
          );

        const [
          sourceType,
          sourceId
        ] = source.split(":");

        const result =
          this.createCase({
            actor: this.config.actor,

            sourceType,

            ideaId:
              sourceType === "idea"
                ? sourceId
                : null,

            projectId:
              sourceType === "project"
                ? sourceId
                : null,

            cost:
              this.toSafeNumber(
                formData.get("cost"),
                0
              ),

            value:
              this.toSafeNumber(
                formData.get("value"),
                0
              ),

            dataReadiness:
              this.normalizePercent(
                formData.get("dataReadiness"),
                0
              ),

            technicalReadiness:
              this.normalizePercent(
                formData.get("technicalReadiness"),
                0
              ),

            governanceReadiness:
              this.normalizePercent(
                formData.get("governanceReadiness"),
                0
              ),

            operationalImpact:
              this.normalizePercent(
                formData.get("operationalImpact"),
                50
              ),

            type:
              formData.get("type") ||
              this.TYPE.STRATEGIC,

            description:
              String(
                formData.get("description") ||
                ""
              ).trim()
          });

        this.handleActionResult(
          result,
          "تم إنشاء دراسة الجدوى."
        );
      }
    );

    window.addEventListener(
      "aiw:ideaConvertedToProject",
      event => {
        const ideaId =
          event?.detail?.idea?.id ||
          event?.detail?.sourceIdeaId;

        const projectId =
          event?.detail?.project?.id ||
          event?.detail?.projectId;

        this.linkConvertedProject(
          ideaId,
          projectId
        );
      }
    );

    window.addEventListener(
      "aiw:projectCreatedFromIdea",
      event => {
        const ideaId =
          event?.detail?.idea?.id ||
          event?.detail?.sourceIdeaId;

        const projectId =
          event?.detail?.project?.id ||
          event?.detail?.projectId;

        this.linkConvertedProject(
          ideaId,
          projectId
        );
      }
    );
  },

  linkConvertedProject(ideaId, projectId) {
    if (!ideaId || !projectId) {
      return false;
    }

    const item = this.getCases().find(
      businessCase =>
        String(businessCase.ideaId) ===
          String(ideaId) &&
        !businessCase.projectId
    );

    if (!item) {
      return false;
    }

    return this.updateCase(
      item.id,
      {
        projectId,
        sourceType: "project"
      }
    );
  },

  handleActionResult(
    result,
    successMessage
  ) {
    if (result?.success) {
      this.closeModal();

      this.notify(
        successMessage,
        "success"
      );

      this.scheduleRefresh();
      return true;
    }

    this.notify(
      result?.message ||
      "تعذر إكمال العملية.",
      "error"
    );

    return false;
  },

  navigateTo(route) {
    if (
      typeof window.AIW?.App?.go ===
      "function"
    ) {
      window.AIW.App.go(route);
      return true;
    }

    if (
      typeof window.AIW?.Router?.go ===
      "function"
    ) {
      window.AIW.Router.go(route);
      return true;
    }

    window.location.hash = `#${route}`;
    return true;
  },

  /* =======================================================
     Synchronization
  ======================================================= */

  scheduleRefresh() {
    window.clearTimeout(
      this._refreshTimer
    );

    this._refreshTimer =
      window.setTimeout(() => {
        if (
          !this._container ||
          !this._container.isConnected
        ) {
          return;
        }

        this.render(
          this._container
        );
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

      "aiw:businessUpdated",
      "aiw:businessMigrated",
      "aiw:businessCaseCreated",
      "aiw:businessCaseUpdated",
      "aiw:businessCaseRemoved",
      "aiw:businessCaseSubmitted",
      "aiw:businessCaseApproved",
      "aiw:businessCaseRejected",

      "aiw:ideaUpdated",
      "aiw:ideaApproved",
      "aiw:ideaConvertedToProject",

      "aiw:projectCreated",
      "aiw:projectUpdated",
      "aiw:projectCreatedFromIdea"
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
          "aiwDataV1",
          "aiwData",
          "AIW_DATA"
        ];

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
    window.clearTimeout(
      this._refreshTimer
    );

    this.closeModal();

    if (
      typeof this._unsubscribeStore ===
      "function"
    ) {
      try {
        this._unsubscribeStore();
      } catch (error) {
        console.warn(
          "AI Work Business V5.1: Store unsubscribe failed.",
          error
        );
      }
    }

    this._unsubscribeStore = null;
    this._container = null;
    this._syncBound = false;
  },

  /* =======================================================
     Charts
  ======================================================= */

  renderCharts(cases) {
    if (
      !cases.length ||
      !window.AIW?.Charts
    ) {
      return;
    }

    setTimeout(() => {
      const labels =
        cases.map(item => item.title);

      const roiValues =
        cases.map(
          item =>
            this.calculateCase(item).roi
        );

      const strong = cases.filter(
        item =>
          this.calculateCase(item)
            .feasibilityScore >= 75
      ).length;

      const moderate = cases.filter(item => {
        const score =
          this.calculateCase(item)
            .feasibilityScore;

        return score >= 50 && score < 75;
      }).length;

      const weak = cases.filter(
        item =>
          this.calculateCase(item)
            .feasibilityScore < 50
      ).length;

      if (
        typeof window.AIW.Charts.bar ===
        "function"
      ) {
        window.AIW.Charts.bar(
          "businessRoiChart",
          labels,
          roiValues,
          "Return %"
        );
      }

      if (
        typeof window.AIW.Charts.doughnut ===
        "function"
      ) {
        window.AIW.Charts.doughnut(
          "businessMixChart",
          [
            "جدوى قوية",
            "جدوى متوسطة",
            "تحتاج تطوير"
          ],
          [
            strong,
            moderate,
            weak
          ],
          "Feasibility Health"
        );
      }
    }, 60);
  },

  /* =======================================================
     Shared UI
  ======================================================= */

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

  renderExecutiveList(items = []) {
    if (!items.length) {
      return this.emptyState(
        "لا توجد إجراءات مقترحة حالياً."
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

  fallbackHero(summary) {
    return `
      <div class="module-hero">
        <span class="module-kicker">
          Biometric Business Case · Feasibility
        </span>

        <h1>
          مركز الجدوى الاستثمارية
        </h1>

        <p>
          إنشاء واعتماد دراسات الجدوى من الأفكار والمشاريع الحقيقية.
        </p>

        <div class="aiw-chip-row">
          <span class="aiw-chip">
            💰 ${summary.totalCases} دراسة
          </span>

          <span class="aiw-chip">
            ⏳ ${summary.pending} بانتظار الاعتماد
          </span>

          <span class="aiw-chip">
            ✅ ${summary.approved} معتمدة
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

  notify(message, type = "info") {
    try {
      if (
        typeof window.AIW?.Notifications?.show ===
        "function"
      ) {
        window.AIW.Notifications.show({
          message,
          type
        });
        return;
      }

      if (
        typeof window.AIW?.Notifications?.notify ===
        "function"
      ) {
        window.AIW.Notifications.notify(
          message,
          type
        );
        return;
      }
    } catch (error) {
      console.warn(
        "AI Work Business V5.1: Notification engine failed.",
        error
      );
    }

    this.showToast(message, type);
  },

  showToast(message, type = "info") {
    document
      .querySelector(
        ".business-workflow-toast"
      )
      ?.remove();

    const toast =
      document.createElement("div");

    toast.className =
      `business-workflow-toast ${type}`;

    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("visible");
    });

    setTimeout(() => {
      toast.classList.remove("visible");

      setTimeout(() => {
        toast.remove();
      }, 180);
    }, 2800);
  },

  emit(name, detail = {}) {
    try {
      window.dispatchEvent(
        new CustomEvent(name, {
          detail
        })
      );
    } catch (error) {
      console.warn(
        `AI Work Business V5.1: Event ${name} failed.`,
        error
      );
    }
  },

  /* =======================================================
     Labels and Classification
  ======================================================= */

  normalizeStatus(status) {
    const value =
      this.normalizeText(status);

    const aliases = {
      proposed: this.STATUS.DRAFT,
      planned: this.STATUS.DRAFT,
      pending: this.STATUS.UNDER_REVIEW,
      "pending-approval": this.STATUS.UNDER_REVIEW,
      "under-review": this.STATUS.UNDER_REVIEW,
      approved: this.STATUS.APPROVED,
      rejected: this.STATUS.REJECTED,
      archived: this.STATUS.ARCHIVED
    };

    return aliases[value] || (
      Object.values(this.STATUS).includes(value)
        ? value
        : this.STATUS.DRAFT
    );
  },

  statusLabel(status) {
    const labels = {
      [this.STATUS.DRAFT]: "مسودة",
      [this.STATUS.UNDER_REVIEW]: "قيد الاعتماد",
      [this.STATUS.APPROVED]: "معتمدة",
      [this.STATUS.REJECTED]: "مرفوضة",
      [this.STATUS.ARCHIVED]: "مؤرشفة"
    };

    return labels[
      this.normalizeStatus(status)
    ] || "مسودة";
  },

  statusClass(status) {
    const value =
      this.normalizeStatus(status);

    if (
      value === this.STATUS.APPROVED
    ) {
      return "green";
    }

    if (
      value === this.STATUS.REJECTED
    ) {
      return "red";
    }

    return "orange";
  },

  normalizeType(type) {
    const value =
      this.normalizeText(type);

    if (
      value === "quick win" ||
      value === "quick-win"
    ) {
      return this.TYPE.QUICK_WIN;
    }

    if (
      value === "transformational"
    ) {
      return this.TYPE.TRANSFORMATIONAL;
    }

    return this.TYPE.STRATEGIC;
  },

  riskLabel(level) {
    const value =
      this.normalizeText(level);

    if (
      value.includes("عال") ||
      value === "high" ||
      value === "critical"
    ) {
      return "عالية";
    }

    if (
      value.includes("منخفض") ||
      value === "low"
    ) {
      return "منخفضة";
    }

    return "متوسطة";
  },

  actionLabel(action) {
    const labels = {
      created: "تم إنشاء الدراسة",
      "submitted-for-approval": "تم رفعها للاعتماد",
      approved: "تم اعتمادها",
      rejected: "تم رفضها"
    };

    return labels[action] || action || "تحديث";
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

    style.id = this.config.styleId;

    style.textContent = `
      .business-action-card {
        padding: 18px;
        border: 1px solid rgba(15, 23, 42, 0.07);
        border-radius: 18px;
        background: #f8fafc;
      }

      .business-action-card strong {
        display: block;
        margin-bottom: 8px;
        color: #101828;
        font-size: 17px;
      }

      .business-action-card p {
        margin: 0 0 15px;
        color: #667085;
        font-size: 13px;
        line-height: 1.8;
      }

      .business-form {
        display: grid;
        gap: 15px;
      }

      .business-form-grid {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .business-form label {
        display: grid;
        gap: 7px;
      }

      .business-form label > span {
        color: #344054;
        font-size: 12px;
        font-weight: 800;
      }

      .business-form input,
      .business-form select,
      .business-form textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 12px 13px;
        border: 1px solid #d0d5dd;
        border-radius: 13px;
        color: #101828;
        background: #ffffff;
        font: inherit;
        outline: none;
      }

      .business-detail-grid {
        display: grid;
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin-top: 18px;
      }

      .business-detail-section {
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid rgba(15, 23, 42, 0.08);
      }

      .business-detail-section > strong {
        display: block;
        margin-bottom: 8px;
        color: #101828;
        font-size: 14px;
      }

      .business-detail-section > p {
        margin: 0;
        color: #667085;
        font-size: 13px;
        line-height: 1.8;
      }

      .business-history-list {
        display: grid;
        gap: 8px;
      }

      .business-history-list > div {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 12px;
        background: #f9fafb;
      }

      .business-history-list span {
        color: #101828;
        font-size: 12px;
        font-weight: 800;
      }

      .business-history-list small {
        color: #667085;
        font-size: 10px;
      }

      .business-workflow-toast {
        position: fixed;
        right: 50%;
        bottom: calc(108px + env(safe-area-inset-bottom));
        z-index: 100000;
        width: min(calc(100% - 36px), 420px);
        box-sizing: border-box;
        padding: 14px 17px;
        border-radius: 16px;
        color: #ffffff;
        text-align: center;
        font-size: 14px;
        font-weight: 800;
        line-height: 1.6;
        background: #101b2f;
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.25);
        opacity: 0;
        transform: translateX(50%) translateY(14px);
        transition:
          opacity 0.2s ease,
          transform 0.2s ease;
      }

      .business-workflow-toast.visible {
        opacity: 1;
        transform: translateX(50%) translateY(0);
      }

      .business-workflow-toast.success {
        background: #087d3e;
      }

      .business-workflow-toast.error {
        background: #b42318;
      }

      .business-workflow-toast.warning {
        background: #b75c00;
      }

      @media (max-width: 760px) {
        .business-form-grid,
        .business-detail-grid {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  },

  /* =======================================================
     Utilities
  ======================================================= */

  average(values = []) {
    const numbers = values
      .map(value => Number(value))
      .filter(Number.isFinite);

    if (!numbers.length) {
      return 0;
    }

    return Math.round(
      numbers.reduce(
        (sum, value) => sum + value,
        0
      ) / numbers.length
    );
  },

  formatAED(value) {
    const number =
      this.toSafeNumber(value, 0);

    const absolute =
      Math.abs(number);

    const sign =
      number < 0 ? "-" : "";

    if (absolute >= 1000000000) {
      return `${sign}${(
        absolute / 1000000000
      ).toFixed(1)}B AED`;
    }

    if (absolute >= 1000000) {
      const millions =
        absolute / 1000000;

      return `${sign}${millions.toFixed(
        millions % 1 ? 1 : 0
      )}M AED`;
    }

    return `${sign}${absolute.toLocaleString(
      "ar-AE"
    )} AED`;
  },

  formatDateTime(value, fallback = "") {
    if (!value) return fallback;

    try {
      const date = new Date(value);

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

  toArray(value) {
    if (Array.isArray(value)) {
      return value;
    }

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return [];
    }

    return [value];
  },

  normalizeText(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/_/g, "-");
  },

  generateId(prefix = "business") {
    const random =
      Math.random()
        .toString(36)
        .slice(2, 9);

    return `${prefix}-${Date.now()}-${random}`;
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
