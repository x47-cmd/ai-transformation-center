/* =========================================================
   AI Work - Store V2.2
   Enterprise Single Source of Truth

   Scope:
   - Centralized State Management
   - Ideas to Projects Lifecycle
   - Approval and Conversion Workflow
   - Project Blueprint Support
   - Deep Data Merge
   - Legacy Data Compatibility
   - Automatic Persistence
   - Automatic Backup
   - Metadata Management
   - State Subscription
   - Cross-Tab Synchronization
   - Activity Logging
   - Soft Delete
   - Import / Export / Restore
   - Safe Recovery
========================================================= */

window.AIW = window.AIW || {};

/* =========================================================
   STORAGE KEYS
========================================================= */

AIW.KEYS = {
  DATA:
    (
      window.ATC_CONFIG &&
      ATC_CONFIG.storage &&
      ATC_CONFIG.storage.data
    ) ||
    "atcDataV1",

  SETTINGS:
    (
      window.ATC_CONFIG &&
      ATC_CONFIG.storage &&
      ATC_CONFIG.storage.settings
    ) ||
    "atcSettingsV1",

  BACKUP:
    (
      window.ATC_CONFIG &&
      ATC_CONFIG.storage &&
      ATC_CONFIG.storage.backup
    ) ||
    "atcBackupV1",

  CURRENT_MODULE:
    (
      window.ATC_CONFIG &&
      ATC_CONFIG.storage &&
      ATC_CONFIG.storage.currentModule
    ) ||
    "aiwCurrentModule"
};

/* =========================================================
   DEFAULT PLATFORM DATA
========================================================= */

AIW.DEFAULT_DATA = {
  meta: {
    app: "Enterprise Biometric Intelligence Platform",
    shortName: "AI Work",
    version: "2.2.0",
    schemaVersion: "2.2",
    environment: "Enterprise",
    architecture: "Modular Single Page Application",
    dataModel: "Single Source of Truth",
    synchronization: "Automatic",
    createdAt: null,
    updatedAt: null,
    lastSync: null,
    lastBackupAt: null,
    lastImportedAt: null,
    lastRestoredAt: null,
    lastMigrationAt: null
  },

  dashboard: {
    maturityScore: 34,
    portfolioHealth: 68,
    platformHealth: 0,
    readinessScore: 0,
    expectedROI: 42000000,
    targetYear: 2030
  },

  pipeline: {
    totalIdeas: 0,
    draftIdeas: 0,
    submittedIdeas: 0,
    pendingIdeas: 0,
    approvedIdeas: 0,
    rejectedIdeas: 0,
    convertedIdeas: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    archivedProjects: 0,
    conversionRate: 0,
    averageProjectProgress: 0,
    updatedAt: null
  },

  strategy: [],
  projects: [],
  flagshipProjects: [],
  ideas: [],
  departments: [],
  kpis: [],
  maturity: [],
  governance: [],
  reports: [],
  businessCases: [],
  decisionCenter: [],
  risks: [],

  automation: {
    workflows: [],
    triggers: [],
    approvals: [],
    roadmap: [],
    settings: {},
    statistics: {},
    executionHistory: []
  },

  notifications: [],
  recommendations: [],
  diagnostics: [],
  activity: []
};

/* =========================================================
   DEFAULT PLATFORM SETTINGS
========================================================= */

AIW.DEFAULT_SETTINGS = {
  language: "ar",
  locale: "ar-AE",
  direction: "rtl",
  theme: "light",
  compactMode: false,
  autoBackup: true,
  backupLimit: 1,
  notifications: true,
  autoSync: true,
  activityLogging: true,
  softDelete: true,

  ideaProjectWorkflow: {
    requireApproval: true,
    allowDirectConversion: false,
    calculateProgressFromTasks: true,
    preserveProjectHistory: true
  }
};

/* =========================================================
   LIFECYCLE CONSTANTS
========================================================= */

AIW.LIFECYCLE = {
  IDEA_STATUS: {
    DRAFT: "draft",
    SUBMITTED: "submitted",
    PENDING_APPROVAL: "pending-approval",
    APPROVED: "approved",
    REJECTED: "rejected",
    CONVERTED: "converted",
    ARCHIVED: "archived"
  },

  PROJECT_STATUS: {
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

  PROJECT_PHASES: [
    {
      id: "discovery",
      title: "التحليل",
      titleEn: "Discovery",
      order: 1
    },
    {
      id: "planning",
      title: "التخطيط",
      titleEn: "Planning",
      order: 2
    },
    {
      id: "design",
      title: "التصميم",
      titleEn: "Design",
      order: 3
    },
    {
      id: "development",
      title: "التطوير",
      titleEn: "Development",
      order: 4
    },
    {
      id: "testing",
      title: "الاختبار",
      titleEn: "Testing",
      order: 5
    },
    {
      id: "pilot",
      title: "التجربة الأولية",
      titleEn: "Pilot",
      order: 6
    },
    {
      id: "production",
      title: "التشغيل",
      titleEn: "Production",
      order: 7
    },
    {
      id: "measurement",
      title: "قياس النتائج",
      titleEn: "Measurement",
      order: 8
    }
  ]
};

/* =========================================================
   CENTRAL STORE
========================================================= */

AIW.Store = {
  version: "2.2.0",
  storageKey: AIW.KEYS.DATA,

  _state: null,
  _settings: null,
  _subscribers: new Set(),
  _initialized: false,
  _storageListenerAttached: false,
  _writeLock: false,

  /* =========================================================
     INITIALIZATION
  ========================================================= */

  init() {
    if (this._initialized) {
      return this.getState();
    }

    this._initialized = true;

    const storedData = this.read(
      AIW.KEYS.DATA,
      null
    );

    const legacyData =
      window.AIW?.Data &&
      typeof window.AIW.Data === "object"
        ? window.AIW.Data
        : null;

    let sourceData = storedData;

    if (!sourceData && legacyData) {
      sourceData = legacyData;
    }

    this._state = this.normalizeData(
      this.mergeDefaults(
        AIW.DEFAULT_DATA,
        sourceData || {}
      )
    );

    this._settings = this.mergeDefaults(
      AIW.DEFAULT_SETTINGS,
      this.read(
        AIW.KEYS.SETTINGS,
        null
      )
    );

    this.ensureMetadata(this._state);
    this.refreshPipelineStats(this._state);

    this.persistState({
      emit: false,
      backup: false,
      notify: false
    });

    this.persistSettings({
      emit: false,
      notify: false
    });

    this.attachStorageListener();
    this.syncGlobalDataReference();

    return this.getState();
  },

  /* =========================================================
     CORE HELPERS
  ========================================================= */

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
        console.error(
          "[AIW.Store] Clone failed:",
          cloneError
        );

        return value;
      }
    }
  },

  now() {
    return new Date().toISOString();
  },

  id(prefix = "aiw") {
    const randomPart = Math.random()
      .toString(36)
      .slice(2, 10);

    return `${prefix}-${Date.now()}-${randomPart}`;
  },

  isPlainObject(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  },

  toArray(value) {
    if (Array.isArray(value)) {
      return value;
    }

    if (this.isPlainObject(value)) {
      return Object.values(value);
    }

    return [];
  },

  normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  },

  toNumber(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;
  },

  clamp(value, min = 0, max = 100) {
    return Math.min(
      max,
      Math.max(
        min,
        this.toNumber(value, min)
      )
    );
  },

  uniqueArray(values = []) {
    return [
      ...new Set(
        this.toArray(values)
          .filter(
            value =>
              value !== undefined &&
              value !== null &&
              value !== ""
          )
          .map(value => String(value))
      )
    ];
  },

  /* =========================================================
     STORAGE
  ========================================================= */

  read(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key);

      if (!raw) {
        return this.clone(fallback);
      }

      return JSON.parse(raw);
    } catch (error) {
      console.warn(
        `[AIW.Store] Unable to read ${key}:`,
        error
      );

      return this.clone(fallback);
    }
  },

  write(key, value) {
    try {
      this._writeLock = true;

      window.localStorage.setItem(
        key,
        JSON.stringify(value)
      );

      return true;
    } catch (error) {
      console.error(
        `[AIW.Store] Unable to write ${key}:`,
        error
      );

      return false;
    } finally {
      this._writeLock = false;
    }
  },

  removeStorageKey(key) {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(
        `[AIW.Store] Unable to remove ${key}:`,
        error
      );

      return false;
    }
  },

  /* =========================================================
     DEEP MERGE
  ========================================================= */

  mergeDefaults(defaults, saved) {
    if (
      saved === undefined ||
      saved === null
    ) {
      return this.clone(defaults);
    }

    if (Array.isArray(defaults)) {
      return Array.isArray(saved)
        ? this.clone(saved)
        : this.clone(defaults);
    }

    if (!this.isPlainObject(defaults)) {
      return this.clone(saved);
    }

    if (!this.isPlainObject(saved)) {
      return this.clone(defaults);
    }

    const output = this.clone(defaults);

    Object.keys(saved).forEach(key => {
      const defaultValue = defaults[key];
      const savedValue = saved[key];

      if (
        this.isPlainObject(defaultValue) &&
        this.isPlainObject(savedValue)
      ) {
        output[key] = this.mergeDefaults(
          defaultValue,
          savedValue
        );

        return;
      }

      output[key] = this.clone(savedValue);
    });

    return output;
  },

  deepMerge(target, patch) {
    const output = this.isPlainObject(target)
      ? this.clone(target)
      : {};

    if (!this.isPlainObject(patch)) {
      return output;
    }

    Object.keys(patch).forEach(key => {
      const patchValue = patch[key];
      const targetValue = output[key];

      if (
        this.isPlainObject(targetValue) &&
        this.isPlainObject(patchValue)
      ) {
        output[key] = this.deepMerge(
          targetValue,
          patchValue
        );

        return;
      }

      output[key] = this.clone(patchValue);
    });

    return output;
  },

  /* =========================================================
     IDEA DEFAULT MODEL
  ========================================================= */

  getDefaultProjectBlueprint(idea = {}) {
    return {
      title:
        idea.projectTitle ||
        idea.title ||
        idea.name ||
        "مشروع جديد",

      titleEn:
        idea.projectTitleEn ||
        idea.titleEn ||
        idea.nameEn ||
        "",

      description:
        idea.projectDescription ||
        idea.solution ||
        idea.description ||
        "",

      objective:
        idea.objective ||
        idea.challenge ||
        "",

      category:
        idea.category ||
        idea.portfolio ||
        "general",

      department:
        idea.department ||
        idea.ownerDepartment ||
        "",

      owner:
        idea.owner ||
        null,

      sponsor:
        idea.sponsor ||
        null,

      priority:
        idea.priority ||
        "medium",

      cost:
        idea.cost ||
        idea.costLevel ||
        "medium",

      duration:
        idea.duration ||
        idea.timeline ||
        "",

      readiness:
        this.clamp(
          idea.readiness ??
          idea.score ??
          idea.decisionScore ??
          0
        ),

      decisionScore:
        this.clamp(
          idea.decisionScore ??
          idea.score ??
          0
        ),

      riskLevel:
        idea.riskLevel ||
        idea.risk ||
        "medium",

      benefits: this.toArray(
        idea.benefits
      ),

      expectedOutcomes: this.toArray(
        idea.expectedOutcomes
      ),

      kpis: this.toArray(
        idea.kpis
      ),

      risks: this.toArray(
        idea.risks
      ),

      dependencies: this.toArray(
        idea.dependencies
      ),

      milestones: [],

      tasks: [],

      phases: this.clone(
        AIW.LIFECYCLE.PROJECT_PHASES
      ).map(phase => ({
        ...phase,
        status:
          phase.id === "discovery"
            ? "current"
            : "pending",
        progress: 0,
        startedAt: null,
        completedAt: null
      })),

      budget: {
        estimated: null,
        approved: null,
        spent: 0,
        currency: "AED"
      },

      schedule: {
        plannedStart: null,
        plannedEnd: null,
        actualStart: null,
        actualEnd: null
      }
    };
  },

  normalizeIdea(item = {}, index = 0) {
    const currentTime = this.now();

    const rawStatus =
      item.ideaStatus ||
      item.lifecycleStatus ||
      item.status ||
      AIW.LIFECYCLE.IDEA_STATUS.DRAFT;

    const validStatuses = Object.values(
      AIW.LIFECYCLE.IDEA_STATUS
    );

    const status = validStatuses.includes(rawStatus)
      ? rawStatus
      : AIW.LIFECYCLE.IDEA_STATUS.DRAFT;

    const projectBlueprint =
      this.deepMerge(
        this.getDefaultProjectBlueprint(item),
        this.isPlainObject(item.projectBlueprint)
          ? item.projectBlueprint
          : (
              this.isPlainObject(item.project)
                ? item.project
                : {}
            )
      );

    return {
      id:
        item.id ||
        `idea-${index + 1}`,

      title:
        item.title ||
        item.name ||
        "فكرة جديدة",

      titleEn:
        item.titleEn ||
        item.nameEn ||
        "",

      description:
        item.description ||
        "",

      challenge:
        item.challenge ||
        "",

      solution:
        item.solution ||
        "",

      aiRole:
        item.aiRole ||
        item.role ||
        "",

      benefits: this.toArray(
        item.benefits
      ),

      category:
        item.category ||
        item.portfolio ||
        "general",

      department:
        item.department ||
        item.ownerDepartment ||
        "",

      priority:
        item.priority ||
        "medium",

      cost:
        item.cost ||
        item.costLevel ||
        "medium",

      duration:
        item.duration ||
        item.timeline ||
        "",

      difficulty:
        item.difficulty ||
        "medium",

      readiness: this.clamp(
        item.readiness ??
        item.score ??
        item.decisionScore ??
        0
      ),

      decisionScore: this.clamp(
        item.decisionScore ??
        item.score ??
        item.readiness ??
        0
      ),

      riskLevel:
        item.riskLevel ||
        item.risk ||
        "medium",

      quickWin:
        Boolean(
          item.quickWin ||
          item.isQuickWin ||
          String(item.badge || "")
            .toLowerCase()
            .includes("quick")
        ),

      status,
      ideaStatus: status,
      lifecycleStatus: status,

      approval: {
        required:
          item.approval?.required !== false,

        status:
          item.approval?.status ||
          (
            status === AIW.LIFECYCLE.IDEA_STATUS.APPROVED ||
            status === AIW.LIFECYCLE.IDEA_STATUS.CONVERTED
              ? "approved"
              : status === AIW.LIFECYCLE.IDEA_STATUS.REJECTED
                ? "rejected"
                : "not-submitted"
          ),

        submittedAt:
          item.approval?.submittedAt ||
          item.submittedAt ||
          null,

        submittedBy:
          item.approval?.submittedBy ||
          item.submittedBy ||
          null,

        decidedAt:
          item.approval?.decidedAt ||
          item.approvedAt ||
          item.rejectedAt ||
          null,

        decidedBy:
          item.approval?.decidedBy ||
          item.approvedBy ||
          item.rejectedBy ||
          null,

        decision:
          item.approval?.decision ||
          null,

        note:
          item.approval?.note ||
          item.approvalNote ||
          ""
      },

      conversion: {
        converted:
          Boolean(
            item.conversion?.converted ||
            item.projectId ||
            status === AIW.LIFECYCLE.IDEA_STATUS.CONVERTED
          ),

        projectId:
          item.conversion?.projectId ||
          item.projectId ||
          null,

        convertedAt:
          item.conversion?.convertedAt ||
          item.convertedAt ||
          null,

        convertedBy:
          item.conversion?.convertedBy ||
          item.convertedBy ||
          null,

        revertedAt:
          item.conversion?.revertedAt ||
          null,

        revertedBy:
          item.conversion?.revertedBy ||
          null
      },

      projectBlueprint,

      lifecycleHistory: this.toArray(
        item.lifecycleHistory ||
        item.history
      ),

      createdAt:
        item.createdAt ||
        currentTime,

      updatedAt:
        item.updatedAt ||
        currentTime,

      deletedAt:
        item.deletedAt ?? null,

      ...this.clone(item),

      id:
        item.id ||
        `idea-${index + 1}`,

      status,
      ideaStatus: status,
      lifecycleStatus: status,

      projectBlueprint,

      approval: {
        required:
          item.approval?.required !== false,

        status:
          item.approval?.status ||
          (
            status === AIW.LIFECYCLE.IDEA_STATUS.APPROVED ||
            status === AIW.LIFECYCLE.IDEA_STATUS.CONVERTED
              ? "approved"
              : status === AIW.LIFECYCLE.IDEA_STATUS.REJECTED
                ? "rejected"
                : "not-submitted"
          ),

        submittedAt:
          item.approval?.submittedAt ||
          item.submittedAt ||
          null,

        submittedBy:
          item.approval?.submittedBy ||
          item.submittedBy ||
          null,

        decidedAt:
          item.approval?.decidedAt ||
          item.approvedAt ||
          item.rejectedAt ||
          null,

        decidedBy:
          item.approval?.decidedBy ||
          item.approvedBy ||
          item.rejectedBy ||
          null,

        decision:
          item.approval?.decision ||
          null,

        note:
          item.approval?.note ||
          item.approvalNote ||
          ""
      },

      conversion: {
        converted:
          Boolean(
            item.conversion?.converted ||
            item.projectId ||
            status === AIW.LIFECYCLE.IDEA_STATUS.CONVERTED
          ),

        projectId:
          item.conversion?.projectId ||
          item.projectId ||
          null,

        convertedAt:
          item.conversion?.convertedAt ||
          item.convertedAt ||
          null,

        convertedBy:
          item.conversion?.convertedBy ||
          item.convertedBy ||
          null,

        revertedAt:
          item.conversion?.revertedAt ||
          null,

        revertedBy:
          item.conversion?.revertedBy ||
          null
      },

      lifecycleHistory: this.toArray(
        item.lifecycleHistory ||
        item.history
      ),

      createdAt:
        item.createdAt ||
        currentTime,

      updatedAt:
        item.updatedAt ||
        currentTime,

      deletedAt:
        item.deletedAt ?? null
    };
  },

  /* =========================================================
     PROJECT DEFAULT MODEL
  ========================================================= */

  normalizeProject(item = {}, index = 0) {
    const currentTime = this.now();

    const validStatuses = Object.values(
      AIW.LIFECYCLE.PROJECT_STATUS
    );

    const rawStatus =
      item.projectStatus ||
      item.status ||
      AIW.LIFECYCLE.PROJECT_STATUS.PLANNING;

    const status = validStatuses.includes(rawStatus)
      ? rawStatus
      : AIW.LIFECYCLE.PROJECT_STATUS.PLANNING;

    const tasks = this.toArray(
      item.tasks
    ).map((task, taskIndex) => ({
      id:
        task.id ||
        this.id(`task-${taskIndex + 1}`),

      title:
        task.title ||
        task.name ||
        "مهمة جديدة",

      description:
        task.description ||
        "",

      status:
        task.status ||
        "pending",

      priority:
        task.priority ||
        "medium",

      owner:
        task.owner ||
        null,

      weight: Math.max(
        1,
        this.toNumber(
          task.weight,
          1
        )
      ),

      progress: this.clamp(
        task.progress ??
        (
          task.status === "completed"
            ? 100
            : 0
        )
      ),

      dueDate:
        task.dueDate ||
        null,

      completedAt:
        task.completedAt ||
        null,

      createdAt:
        task.createdAt ||
        currentTime,

      updatedAt:
        task.updatedAt ||
        currentTime
    }));

    const phasesSource =
      this.toArray(item.phases).length
        ? this.toArray(item.phases)
        : AIW.LIFECYCLE.PROJECT_PHASES;

    const phases = phasesSource.map(
      (phase, phaseIndex) => ({
        id:
          phase.id ||
          AIW.LIFECYCLE.PROJECT_PHASES[phaseIndex]?.id ||
          `phase-${phaseIndex + 1}`,

        title:
          phase.title ||
          AIW.LIFECYCLE.PROJECT_PHASES[phaseIndex]?.title ||
          "مرحلة",

        titleEn:
          phase.titleEn ||
          AIW.LIFECYCLE.PROJECT_PHASES[phaseIndex]?.titleEn ||
          "",

        order:
          phase.order ||
          phaseIndex + 1,

        status:
          phase.status ||
          (
            phaseIndex === 0
              ? "current"
              : "pending"
          ),

        progress: this.clamp(
          phase.progress || 0
        ),

        startedAt:
          phase.startedAt ||
          null,

        completedAt:
          phase.completedAt ||
          null
      })
    );

    const calculatedProgress =
      tasks.length
        ? this.calculateTasksProgress(tasks)
        : this.clamp(
            item.progress ??
            item.completion ??
            0
          );

    return {
      id:
        item.id ||
        `project-${index + 1}`,

      sourceIdeaId:
        item.sourceIdeaId ||
        item.ideaId ||
        null,

      origin:
        item.origin ||
        (
          item.sourceIdeaId ||
          item.ideaId
            ? "idea-conversion"
            : "manual"
        ),

      title:
        item.title ||
        item.name ||
        "مشروع جديد",

      titleEn:
        item.titleEn ||
        item.nameEn ||
        "",

      description:
        item.description ||
        "",

      objective:
        item.objective ||
        "",

      category:
        item.category ||
        item.portfolio ||
        "general",

      department:
        item.department ||
        "",

      owner:
        item.owner ||
        null,

      sponsor:
        item.sponsor ||
        null,

      priority:
        item.priority ||
        "medium",

      cost:
        item.cost ||
        item.costLevel ||
        "medium",

      duration:
        item.duration ||
        item.timeline ||
        "",

      readiness: this.clamp(
        item.readiness || 0
      ),

      decisionScore: this.clamp(
        item.decisionScore || 0
      ),

      riskLevel:
        item.riskLevel ||
        item.risk ||
        "medium",

      status,
      projectStatus: status,

      progress: calculatedProgress,

      currentPhase:
        item.currentPhase ||
        phases.find(
          phase =>
            phase.status === "current"
        )?.id ||
        phases[0]?.id ||
        "discovery",

      benefits: this.toArray(
        item.benefits
      ),

      expectedOutcomes: this.toArray(
        item.expectedOutcomes
      ),

      kpis: this.toArray(
        item.kpis
      ),

      risks: this.toArray(
        item.risks
      ),

      dependencies: this.toArray(
        item.dependencies
      ),

      milestones: this.toArray(
        item.milestones
      ),

      tasks,
      phases,

      budget: this.deepMerge(
        {
          estimated: null,
          approved: null,
          spent: 0,
          currency: "AED"
        },
        this.isPlainObject(item.budget)
          ? item.budget
          : {}
      ),

      schedule: this.deepMerge(
        {
          plannedStart: null,
          plannedEnd: null,
          actualStart: null,
          actualEnd: null
        },
        this.isPlainObject(item.schedule)
          ? item.schedule
          : {}
      ),

      approvalSnapshot:
        this.isPlainObject(
          item.approvalSnapshot
        )
          ? item.approvalSnapshot
          : {},

      lifecycleHistory: this.toArray(
        item.lifecycleHistory ||
        item.history
      ),

      createdAt:
        item.createdAt ||
        currentTime,

      updatedAt:
        item.updatedAt ||
        currentTime,

      startedAt:
        item.startedAt ||
        null,

      completedAt:
        item.completedAt ||
        null,

      archivedAt:
        item.archivedAt ||
        null,

      deletedAt:
        item.deletedAt ?? null,

      ...this.clone(item),

      id:
        item.id ||
        `project-${index + 1}`,

      sourceIdeaId:
        item.sourceIdeaId ||
        item.ideaId ||
        null,

      status,
      projectStatus: status,

      progress: calculatedProgress,
      tasks,
      phases,

      currentPhase:
        item.currentPhase ||
        phases.find(
          phase =>
            phase.status === "current"
        )?.id ||
        phases[0]?.id ||
        "discovery",

      lifecycleHistory: this.toArray(
        item.lifecycleHistory ||
        item.history
      ),

      createdAt:
        item.createdAt ||
        currentTime,

      updatedAt:
        item.updatedAt ||
        currentTime,

      deletedAt:
        item.deletedAt ?? null
    };
  },

  calculateTasksProgress(tasks = []) {
    const normalizedTasks =
      this.toArray(tasks);

    if (!normalizedTasks.length) {
      return 0;
    }

    let totalWeight = 0;
    let weightedProgress = 0;

    normalizedTasks.forEach(task => {
      const weight = Math.max(
        1,
        this.toNumber(
          task?.weight,
          1
        )
      );

      const progress = this.clamp(
        task?.progress ??
        (
          task?.status === "completed"
            ? 100
            : 0
        )
      );

      totalWeight += weight;
      weightedProgress +=
        progress * weight;
    });

    if (!totalWeight) {
      return 0;
    }

    return Math.round(
      weightedProgress / totalWeight
    );
  },

  /* =========================================================
     DATA NORMALIZATION
  ========================================================= */

  normalizeData(input) {
    const data = this.isPlainObject(input)
      ? this.clone(input)
      : this.clone(AIW.DEFAULT_DATA);

    data.meta = this.isPlainObject(data.meta)
      ? data.meta
      : {};

    data.dashboard = this.isPlainObject(
      data.dashboard
    )
      ? data.dashboard
      : {};

    data.pipeline = this.isPlainObject(
      data.pipeline
    )
      ? data.pipeline
      : {};

    const simpleArrayCollections = [
      "strategy",
      "flagshipProjects",
      "departments",
      "kpis",
      "maturity",
      "governance",
      "reports",
      "businessCases",
      "decisionCenter",
      "risks",
      "notifications",
      "recommendations",
      "diagnostics",
      "activity"
    ];

    simpleArrayCollections.forEach(
      collection => {
        data[collection] = this.toArray(
          data[collection]
        );
      }
    );

    data.ideas = this.toArray(
      data.ideas
    ).map(
      (item, index) =>
        this.normalizeIdea(
          item,
          index
        )
    );

    data.projects = this.toArray(
      data.projects
    ).map(
      (item, index) =>
        this.normalizeProject(
          item,
          index
        )
    );

    data.automation =
      this.normalizeAutomation(
        data.automation
      );

    this.repairIdeaProjectLinks(data);
    this.refreshPipelineStats(data);

    return data;
  },

  normalizeAutomation(value) {
    if (Array.isArray(value)) {
      return {
        workflows: this.clone(value),
        triggers: [],
        approvals: [],
        roadmap: [],
        settings: {},
        statistics: {},
        executionHistory: []
      };
    }

    const automation =
      this.isPlainObject(value)
        ? value
        : {};

    return {
      workflows: this.toArray(
        automation.workflows
      ),

      triggers: this.toArray(
        automation.triggers
      ),

      approvals: this.toArray(
        automation.approvals
      ),

      roadmap: this.toArray(
        automation.roadmap
      ),

      settings: this.isPlainObject(
        automation.settings
      )
        ? automation.settings
        : {},

      statistics: this.isPlainObject(
        automation.statistics
      )
        ? automation.statistics
        : {},

      executionHistory: this.toArray(
        automation.executionHistory
      )
    };
  },

  repairIdeaProjectLinks(data) {
    if (!data) {
      return data;
    }

    data.ideas = this.toArray(
      data.ideas
    );

    data.projects = this.toArray(
      data.projects
    );

    const projectsById = new Map();
    const projectsByIdeaId = new Map();

    data.projects.forEach(project => {
      if (project?.id) {
        projectsById.set(
          String(project.id),
          project
        );
      }

      if (
        project?.sourceIdeaId &&
        project?.status !==
          AIW.LIFECYCLE.PROJECT_STATUS.ARCHIVED &&
        !project?.deletedAt
      ) {
        projectsByIdeaId.set(
          String(project.sourceIdeaId),
          project
        );
      }
    });

    data.ideas = data.ideas.map(idea => {
      if (!idea) {
        return idea;
      }

      const linkedByProjectId =
        idea.conversion?.projectId
          ? projectsById.get(
              String(
                idea.conversion.projectId
              )
            )
          : null;

      const linkedByIdeaId =
        projectsByIdeaId.get(
          String(idea.id)
        );

      const linkedProject =
        linkedByProjectId ||
        linkedByIdeaId ||
        null;

      if (linkedProject) {
        return {
          ...idea,

          status:
            AIW.LIFECYCLE.IDEA_STATUS.CONVERTED,

          ideaStatus:
            AIW.LIFECYCLE.IDEA_STATUS.CONVERTED,

          lifecycleStatus:
            AIW.LIFECYCLE.IDEA_STATUS.CONVERTED,

          conversion: {
            ...idea.conversion,
            converted: true,
            projectId:
              linkedProject.id,
            convertedAt:
              idea.conversion?.convertedAt ||
              linkedProject.createdAt ||
              this.now()
          }
        };
      }

      if (
        idea.conversion?.converted &&
        idea.conversion?.projectId
      ) {
        return {
          ...idea,

          status:
            idea.approval?.status === "approved"
              ? AIW.LIFECYCLE.IDEA_STATUS.APPROVED
              : AIW.LIFECYCLE.IDEA_STATUS.DRAFT,

          ideaStatus:
            idea.approval?.status === "approved"
              ? AIW.LIFECYCLE.IDEA_STATUS.APPROVED
              : AIW.LIFECYCLE.IDEA_STATUS.DRAFT,

          lifecycleStatus:
            idea.approval?.status === "approved"
              ? AIW.LIFECYCLE.IDEA_STATUS.APPROVED
              : AIW.LIFECYCLE.IDEA_STATUS.DRAFT,

          conversion: {
            ...idea.conversion,
            converted: false,
            projectId: null
          }
        };
      }

      return idea;
    });

    return data;
  },

  ensureMetadata(data = this._state) {
    if (!data) {
      return null;
    }

    data.meta = this.isPlainObject(data.meta)
      ? data.meta
      : {};

    const currentTime = this.now();

    data.meta.app =
      data.meta.app ||
      AIW.DEFAULT_DATA.meta.app;

    data.meta.shortName =
      data.meta.shortName ||
      AIW.DEFAULT_DATA.meta.shortName;

    data.meta.version =
      this.version;

    data.meta.schemaVersion =
      AIW.DEFAULT_DATA.meta.schemaVersion;

    data.meta.environment =
      data.meta.environment ||
      AIW.DEFAULT_DATA.meta.environment;

    data.meta.architecture =
      data.meta.architecture ||
      AIW.DEFAULT_DATA.meta.architecture;

    data.meta.dataModel =
      data.meta.dataModel ||
      AIW.DEFAULT_DATA.meta.dataModel;

    data.meta.synchronization =
      data.meta.synchronization ||
      AIW.DEFAULT_DATA.meta.synchronization;

    data.meta.createdAt =
      data.meta.createdAt ||
      currentTime;

    data.meta.updatedAt =
      data.meta.updatedAt ||
      currentTime;

    data.meta.lastSync =
      data.meta.lastSync ||
      currentTime;

    return data.meta;
  },

  /* =========================================================
     PIPELINE STATISTICS
  ========================================================= */

  refreshPipelineStats(data = this._state) {
    if (!data) {
      return null;
    }

    const ideas = this.toArray(
      data.ideas
    ).filter(
      item => !item?.deletedAt
    );

    const projects = this.toArray(
      data.projects
    ).filter(
      item => !item?.deletedAt
    );

    const countIdeasByStatus = status =>
      ideas.filter(
        idea =>
          idea?.ideaStatus === status ||
          idea?.status === status
      ).length;

    const activeProjects =
      projects.filter(
        project =>
          ![
            AIW.LIFECYCLE.PROJECT_STATUS.COMPLETED,
            AIW.LIFECYCLE.PROJECT_STATUS.CANCELLED,
            AIW.LIFECYCLE.PROJECT_STATUS.ARCHIVED
          ].includes(
            project?.projectStatus ||
            project?.status
          )
      );

    const completedProjects =
      projects.filter(
        project =>
          (
            project?.projectStatus ||
            project?.status
          ) ===
          AIW.LIFECYCLE.PROJECT_STATUS.COMPLETED
      );

    const archivedProjects =
      projects.filter(
        project =>
          (
            project?.projectStatus ||
            project?.status
          ) ===
          AIW.LIFECYCLE.PROJECT_STATUS.ARCHIVED
      );

    const totalProgress =
      projects.reduce(
        (sum, project) =>
          sum +
          this.clamp(
            project?.progress || 0
          ),
        0
      );

    const convertedIdeas =
      countIdeasByStatus(
        AIW.LIFECYCLE.IDEA_STATUS.CONVERTED
      );

    data.pipeline = {
      totalIdeas: ideas.length,

      draftIdeas:
        countIdeasByStatus(
          AIW.LIFECYCLE.IDEA_STATUS.DRAFT
        ),

      submittedIdeas:
        countIdeasByStatus(
          AIW.LIFECYCLE.IDEA_STATUS.SUBMITTED
        ),

      pendingIdeas:
        countIdeasByStatus(
          AIW.LIFECYCLE.IDEA_STATUS.PENDING_APPROVAL
        ),

      approvedIdeas:
        countIdeasByStatus(
          AIW.LIFECYCLE.IDEA_STATUS.APPROVED
        ),

      rejectedIdeas:
        countIdeasByStatus(
          AIW.LIFECYCLE.IDEA_STATUS.REJECTED
        ),

      convertedIdeas,

      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      completedProjects:
        completedProjects.length,
      archivedProjects:
        archivedProjects.length,

      conversionRate:
        ideas.length
          ? Math.round(
              (
                convertedIdeas /
                ideas.length
              ) * 100
            )
          : 0,

      averageProjectProgress:
        projects.length
          ? Math.round(
              totalProgress /
              projects.length
            )
          : 0,

      updatedAt: this.now()
    };

    return data.pipeline;
  },

  getPipelineStats() {
    const state = this.getState();

    this.refreshPipelineStats(state);

    return this.clone(
      state.pipeline
    );
  },

  /* =========================================================
     STATE ACCESS
  ========================================================= */

  getState() {
    if (!this._initialized) {
      this.init();
    }

    return this.clone(this._state);
  },

  getData() {
    return this.getState();
  },

  get(path, fallback = undefined) {
    if (!this._initialized) {
      this.init();
    }

    if (!path) {
      return this.getState();
    }

    const value = this.getByPath(
      this._state,
      path
    );

    return value === undefined
      ? this.clone(fallback)
      : this.clone(value);
  },

  getByPath(source, path) {
    if (!path) {
      return source;
    }

    const parts = Array.isArray(path)
      ? path
      : String(path)
          .split(".")
          .filter(Boolean);

    return parts.reduce(
      (current, key) => {
        if (
          current === undefined ||
          current === null
        ) {
          return undefined;
        }

        return current[key];
      },
      source
    );
  },

  setByPath(source, path, value) {
    const parts = Array.isArray(path)
      ? path
      : String(path)
          .split(".")
          .filter(Boolean);

    if (!parts.length) {
      return source;
    }

    let current = source;

    parts.forEach((part, index) => {
      const isLast =
        index === parts.length - 1;

      if (isLast) {
        current[part] = this.clone(value);
        return;
      }

      if (
        !this.isPlainObject(
          current[part]
        )
      ) {
        current[part] = {};
      }

      current = current[part];
    });

    return source;
  },

  has(path) {
    if (!this._initialized) {
      this.init();
    }

    return (
      this.getByPath(
        this._state,
        path
      ) !== undefined
    );
  },

  /* =========================================================
     STATE WRITES
  ========================================================= */

  set(path, value, options = {}) {
    if (!this._initialized) {
      this.init();
    }

    if (
      this.isPlainObject(path) &&
      arguments.length === 1
    ) {
      return this.replaceState(path);
    }

    if (
      this.isPlainObject(path) &&
      arguments.length >= 2 &&
      this.isPlainObject(value)
    ) {
      return this.replaceState(
        path,
        value
      );
    }

    const nextState =
      this.clone(this._state);

    this.setByPath(
      nextState,
      path,
      value
    );

    return this.commit(
      nextState,
      {
        eventName:
          options.eventName ||
          "aiw:dataChanged",

        activity:
          options.activity ||
          null,

        backup:
          options.backup !== false,

        notify:
          options.notify !== false
      }
    );
  },

  updateState(updater, options = {}) {
    if (!this._initialized) {
      this.init();
    }

    let nextState;

    if (typeof updater === "function") {
      const draft =
        this.clone(this._state);

      const result =
        updater(draft);

      nextState =
        result &&
        typeof result === "object"
          ? result
          : draft;
    } else if (
      this.isPlainObject(updater)
    ) {
      nextState = this.deepMerge(
        this._state,
        updater
      );
    } else {
      return this.getState();
    }

    return this.commit(
      nextState,
      {
        eventName:
          options.eventName ||
          "aiw:dataUpdated",

        activity:
          options.activity ||
          null,

        backup:
          options.backup !== false,

        notify:
          options.notify !== false
      }
    );
  },

  patch(patchData, options = {}) {
    return this.updateState(
      patchData,
      {
        ...options,

        eventName:
          options.eventName ||
          "aiw:storeUpdated"
      }
    );
  },

  replaceState(data, options = {}) {
    const nextState =
      this.normalizeData(
        this.mergeDefaults(
          AIW.DEFAULT_DATA,
          data || {}
        )
      );

    return this.commit(
      nextState,
      {
        eventName:
          options.eventName ||
          "aiw:dataReplaced",

        activity:
          options.activity ||
          null,

        backup:
          options.backup !== false,

        notify:
          options.notify !== false
      }
    );
  },

  saveData(
    data,
    eventName = "aiw:dataChanged"
  ) {
    return this.replaceState(
      data || {},
      {
        eventName
      }
    );
  },

  commit(nextState, options = {}) {
    const normalizedState =
      this.normalizeData(
        this.mergeDefaults(
          AIW.DEFAULT_DATA,
          nextState || {}
        )
      );

    this.ensureMetadata(
      normalizedState
    );

    this.refreshPipelineStats(
      normalizedState
    );

    const currentTime = this.now();

    normalizedState.meta.updatedAt =
      currentTime;

    normalizedState.meta.lastSync =
      currentTime;

    if (
      options.activity &&
      this.getSettings()
        .activityLogging
    ) {
      this.addActivity(
        normalizedState,
        options.activity
      );
    }

    this._state =
      normalizedState;

    this.persistState({
      emit: false,
      backup:
        options.backup !== false,
      notify: false
    });

    this.syncGlobalDataReference();

    const eventName =
      options.eventName ||
      "aiw:dataChanged";

    this.emit(
      eventName,
      this.getState()
    );

    if (
      eventName !==
      "aiw:dataChanged"
    ) {
      this.emit(
        "aiw:dataChanged",
        {
          sourceEvent: eventName,
          data: this.getState()
        }
      );
    }

    this.emit(
      "aiw:storeChanged",
      {
        sourceEvent: eventName,
        data: this.getState()
      }
    );

    if (
      options.notify !== false
    ) {
      this.notifySubscribers({
        type: eventName,
        data: this.getState()
      });
    }

    return this.getState();
  },

  persistState(options = {}) {
    if (!this._state) {
      return false;
    }

    const written = this.write(
      AIW.KEYS.DATA,
      this._state
    );

    if (
      written &&
      options.backup !== false &&
      this.getSettings().autoBackup
    ) {
      this.backup(
        this._state,
        {
          emit: false
        }
      );
    }

    if (
      options.emit !== false
    ) {
      this.emit(
        "aiw:dataPersisted",
        this.getState()
      );
    }

    if (
      options.notify !== false
    ) {
      this.notifySubscribers({
        type: "persist",
        data: this.getState()
      });
    }

    return written;
  },

  syncGlobalDataReference() {
    if (!this._state) {
      return;
    }

    window.AIW.Data =
      this.clone(this._state);
  },

  /* =========================================================
     SETTINGS
  ========================================================= */

  getSettings() {
    if (!this._initialized) {
      this.init();
    }

    if (!this._settings) {
      this._settings =
        this.mergeDefaults(
          AIW.DEFAULT_SETTINGS,
          this.read(
            AIW.KEYS.SETTINGS,
            null
          )
        );
    }

    return this.clone(
      this._settings
    );
  },

  saveSettings(
    settings,
    eventName = "aiw:settingsChanged"
  ) {
    if (!this._initialized) {
      this.init();
    }

    this._settings =
      this.mergeDefaults(
        AIW.DEFAULT_SETTINGS,
        settings || {}
      );

    this.persistSettings({
      emit: false,
      notify: false
    });

    this.emit(
      eventName,
      this.getSettings()
    );

    this.notifySubscribers({
      type: eventName,
      settings: this.getSettings()
    });

    return this.getSettings();
  },

  updateSettings(updates = {}) {
    const current =
      this.getSettings();

    const nextSettings =
      this.deepMerge(
        current,
        updates
      );

    return this.saveSettings(
      nextSettings,
      "aiw:settingsUpdated"
    );
  },

  setSetting(key, value) {
    const settings =
      this.getSettings();

    settings[key] = value;

    return this.saveSettings(
      settings,
      "aiw:settingsUpdated"
    );
  },

  getSetting(
    key,
    fallback = undefined
  ) {
    const settings =
      this.getSettings();

    return settings[key] !== undefined
      ? this.clone(settings[key])
      : this.clone(fallback);
  },

  persistSettings(options = {}) {
    if (!this._settings) {
      return false;
    }

    const written = this.write(
      AIW.KEYS.SETTINGS,
      this._settings
    );

    if (
      options.emit !== false
    ) {
      this.emit(
        "aiw:settingsPersisted",
        this.getSettings()
      );
    }

    if (
      options.notify !== false
    ) {
      this.notifySubscribers({
        type: "settingsPersisted",
        settings: this.getSettings()
      });
    }

    return written;
  },

  /* =========================================================
     METADATA
  ========================================================= */

  getMetadata() {
    return this.get(
      "meta",
      {}
    );
  },

  setMetadata(metadata = {}) {
    const currentMetadata =
      this.getMetadata();

    const updatedMetadata =
      this.deepMerge(
        currentMetadata,
        metadata
      );

    return this.set(
      "meta",
      updatedMetadata,
      {
        eventName:
          "aiw:metadataChanged",

        backup: false
      }
    );
  },

  updateMetadata(metadata = {}) {
    return this.setMetadata(
      metadata
    );
  },

  touchMetadata(extra = {}) {
    return this.setMetadata({
      updatedAt: this.now(),
      lastSync: this.now(),
      ...extra
    });
  },

  /* =========================================================
     COLLECTION PATH HELPERS
  ========================================================= */

  getCollectionPath(collection) {
    const aliases = {
      workflows:
        "automation.workflows",

      triggers:
        "automation.triggers",

      approvals:
        "automation.approvals",

      automationRoadmap:
        "automation.roadmap",

      executionHistory:
        "automation.executionHistory"
    };

    return (
      aliases[collection] ||
      collection
    );
  },

  getCollection(collection) {
    const path =
      this.getCollectionPath(
        collection
      );

    const items = this.get(
      path,
      []
    );

    return this.toArray(items).filter(
      item =>
        !item ||
        !item.deletedAt
    );
  },

  getAllCollection(collection) {
    const path =
      this.getCollectionPath(
        collection
      );

    return this.toArray(
      this.get(path, [])
    );
  },

  setCollection(collection, items) {
    const path =
      this.getCollectionPath(
        collection
      );

    const normalizedItems =
      Array.isArray(items)
        ? items
        : [];

    this.set(
      path,
      normalizedItems,
      {
        eventName:
          "aiw:collectionChanged",

        activity: {
          type: "collection-set",
          collection,

          title:
            `تحديث مجموعة ${collection}`
        }
      }
    );

    this.emit(
      "aiw:collectionChanged",
      {
        collection,

        items: this.clone(
          normalizedItems
        )
      }
    );

    return this.getCollection(
      collection
    );
  },

  /* =========================================================
     CRUD OPERATIONS
  ========================================================= */

  add(collection, item = {}) {
    const path =
      this.getCollectionPath(
        collection
      );

    const items =
      this.getAllCollection(
        collection
      );

    const currentTime =
      this.now();

    let record = {
      id:
        item.id ||
        this.id(collection),

      title:
        item.title ||
        item.name ||
        "عنصر جديد",

      status:
        item.status ||
        "new",

      priority:
        item.priority ||
        "medium",

      createdAt:
        item.createdAt ||
        currentTime,

      updatedAt:
        currentTime,

      deletedAt: null,

      ...this.clone(item)
    };

    if (collection === "ideas") {
      record = this.normalizeIdea(
        record,
        items.length
      );
    }

    if (collection === "projects") {
      record = this.normalizeProject(
        record,
        items.length
      );
    }

    record.id =
      record.id ||
      this.id(collection);

    record.createdAt =
      record.createdAt ||
      currentTime;

    record.updatedAt =
      currentTime;

    if (
      record.deletedAt === undefined
    ) {
      record.deletedAt = null;
    }

    items.unshift(record);

    this.set(
      path,
      items,
      {
        eventName:
          "aiw:itemCreated",

        activity: {
          type: "create",
          collection,

          title:
            record.title ||
            record.name ||
            "إنشاء عنصر",

          refId: record.id
        }
      }
    );

    this.emit(
      "aiw:itemCreated",
      {
        collection,
        item: this.clone(record)
      }
    );

    return this.clone(record);
  },

  update(
    collection,
    id,
    updates = {}
  ) {
    const path =
      this.getCollectionPath(
        collection
      );

    const items =
      this.getAllCollection(
        collection
      );

    let updatedItem = null;

    const updatedItems =
      items.map((item, index) => {
        if (
          String(item?.id) !==
          String(id)
        ) {
          return item;
        }

        const merged = {
          ...item,
          ...this.clone(updates),
          id: item.id,
          updatedAt: this.now()
        };

        if (collection === "ideas") {
          updatedItem =
            this.normalizeIdea(
              merged,
              index
            );
        } else if (
          collection === "projects"
        ) {
          updatedItem =
            this.normalizeProject(
              merged,
              index
            );
        } else {
          updatedItem = merged;
        }

        return updatedItem;
      });

    if (!updatedItem) {
      return null;
    }

    this.set(
      path,
      updatedItems,
      {
        eventName:
          "aiw:itemUpdated",

        activity: {
          type: "update",
          collection,

          title:
            updatedItem.title ||
            updatedItem.name ||
            "تحديث عنصر",

          refId: id
        }
      }
    );

    this.emit(
      "aiw:itemUpdated",
      {
        collection,
        item: this.clone(
          updatedItem
        )
      }
    );

    return this.clone(
      updatedItem
    );
  },

  remove(
    collection,
    id,
    hardDelete = false
  ) {
    const path =
      this.getCollectionPath(
        collection
      );

    const items =
      this.getAllCollection(
        collection
      );

    const existingItem =
      items.find(
        item =>
          String(item?.id) ===
          String(id)
      );

    if (!existingItem) {
      return false;
    }

    const shouldHardDelete =
      hardDelete ||
      !this.getSettings().softDelete;

    let updatedItems;

    if (shouldHardDelete) {
      updatedItems =
        items.filter(
          item =>
            String(item?.id) !==
            String(id)
        );
    } else {
      const currentTime =
        this.now();

      updatedItems =
        items.map(item => {
          if (
            String(item?.id) !==
            String(id)
          ) {
            return item;
          }

          return {
            ...item,
            deletedAt: currentTime,
            updatedAt: currentTime
          };
        });
    }

    this.set(
      path,
      updatedItems,
      {
        eventName:
          "aiw:itemDeleted",

        activity: {
          type: "delete",
          collection,

          title:
            existingItem.title ||
            existingItem.name ||
            "حذف عنصر",

          refId: id,

          hardDelete:
            shouldHardDelete
        }
      }
    );

    this.emit(
      "aiw:itemDeleted",
      {
        collection,
        id,

        hardDelete:
          shouldHardDelete
      }
    );

    return true;
  },

  restoreItem(collection, id) {
    const path =
      this.getCollectionPath(
        collection
      );

    const items =
      this.getAllCollection(
        collection
      );

    let restoredItem = null;

    const updatedItems =
      items.map(item => {
        if (
          String(item?.id) !==
          String(id)
        ) {
          return item;
        }

        restoredItem = {
          ...item,
          deletedAt: null,
          updatedAt: this.now()
        };

        return restoredItem;
      });

    if (!restoredItem) {
      return null;
    }

    this.set(
      path,
      updatedItems,
      {
        eventName:
          "aiw:itemRestored",

        activity: {
          type: "restore",
          collection,

          title:
            restoredItem.title ||
            restoredItem.name ||
            "استعادة عنصر",

          refId: id
        }
      }
    );

    return this.clone(
      restoredItem
    );
  },

  clearCollection(
    collection,
    hardDelete = false
  ) {
    const items =
      this.getAllCollection(
        collection
      );

    if (hardDelete) {
      return this.setCollection(
        collection,
        []
      );
    }

    const currentTime =
      this.now();

    const deletedItems =
      items.map(item => ({
        ...item,
        deletedAt: currentTime,
        updatedAt: currentTime
      }));

    return this.setCollection(
      collection,
      deletedItems
    );
  },

  find(collection, id) {
    return (
      this.getCollection(collection)
        .find(
          item =>
            String(item?.id) ===
            String(id)
        ) ||
      null
    );
  },

  filter(collection, predicate) {
    const items =
      this.getCollection(
        collection
      );

    return typeof predicate === "function"
      ? items.filter(predicate)
      : items;
  },

  search(
    collection,
    query,
    fields = [
      "title",
      "name",
      "description",
      "department",
      "status",
      "priority"
    ]
  ) {
    const normalizedQuery =
      this.normalizeText(query);

    if (!normalizedQuery) {
      return this.getCollection(
        collection
      );
    }

    return this.getCollection(
      collection
    ).filter(item =>
      fields.some(field =>
        this.normalizeText(
          item?.[field]
        ).includes(
          normalizedQuery
        )
      )
    );
  },

  sort(
    collection,
    field = "createdAt",
    direction = "desc"
  ) {
    const items = [
      ...this.getCollection(collection)
    ];

    return items.sort((a, b) => {
      const aValue =
        a?.[field] ?? "";

      const bValue =
        b?.[field] ?? "";

      if (aValue === bValue) {
        return 0;
      }

      if (direction === "asc") {
        return aValue > bValue
          ? 1
          : -1;
      }

      return aValue < bValue
        ? 1
        : -1;
    });
  },

  count(collection) {
    return this.getCollection(
      collection
    ).length;
  },

  /* =========================================================
     IDEA LIFECYCLE
  ========================================================= */

  getIdeas(options = {}) {
    let ideas =
      this.getCollection("ideas");

    if (
      options.status &&
      options.status !== "all"
    ) {
      ideas = ideas.filter(
        idea =>
          (
            idea.ideaStatus ||
            idea.status
          ) === options.status
      );
    }

    if (
      options.converted === true
    ) {
      ideas = ideas.filter(
        idea =>
          Boolean(
            idea.conversion?.converted
          )
      );
    }

    if (
      options.converted === false
    ) {
      ideas = ideas.filter(
        idea =>
          !idea.conversion?.converted
      );
    }

    return ideas;
  },

  getIdea(ideaId) {
    return this.find(
      "ideas",
      ideaId
    );
  },

  createIdea(item = {}) {
    const currentTime =
      this.now();

    const record =
      this.normalizeIdea(
        {
          ...item,

          id:
            item.id ||
            this.id("idea"),

          status:
            item.ideaStatus ||
            item.status ||
            AIW.LIFECYCLE.IDEA_STATUS.DRAFT,

          ideaStatus:
            item.ideaStatus ||
            item.status ||
            AIW.LIFECYCLE.IDEA_STATUS.DRAFT,

          createdAt:
            item.createdAt ||
            currentTime,

          updatedAt:
            currentTime
        },
        this.count("ideas")
      );

    return this.add(
      "ideas",
      record
    );
  },

  updateIdea(
    ideaId,
    updates = {}
  ) {
    return this.update(
      "ideas",
      ideaId,
      updates
    );
  },

  addIdeaHistory(
    idea,
    entry = {}
  ) {
    const history =
      this.toArray(
        idea.lifecycleHistory
      );

    history.unshift({
      id:
        entry.id ||
        this.id("idea-history"),

      action:
        entry.action ||
        "updated",

      fromStatus:
        entry.fromStatus ||
        null,

      toStatus:
        entry.toStatus ||
        null,

      note:
        entry.note ||
        "",

      actor:
        entry.actor ||
        null,

      createdAt:
        entry.createdAt ||
        this.now(),

      ...this.clone(entry)
    });

    return history.slice(0, 200);
  },

  setIdeaStatus(
    ideaId,
    status,
    options = {}
  ) {
    const validStatuses =
      Object.values(
        AIW.LIFECYCLE.IDEA_STATUS
      );

    if (
      !validStatuses.includes(status)
    ) {
      return {
        success: false,
        reason: "invalid-status",
        message:
          "حالة الفكرة غير صحيحة."
      };
    }

    const idea =
      this.getIdea(ideaId);

    if (!idea) {
      return {
        success: false,
        reason: "idea-not-found",
        message:
          "لم يتم العثور على الفكرة."
      };
    }

    const previousStatus =
      idea.ideaStatus ||
      idea.status;

    const history =
      this.addIdeaHistory(
        idea,
        {
          action:
            options.action ||
            "status-changed",

          fromStatus:
            previousStatus,

          toStatus:
            status,

          note:
            options.note ||
            "",

          actor:
            options.actor ||
            null
        }
      );

    const updated =
      this.updateIdea(
        ideaId,
        {
          status,
          ideaStatus: status,
          lifecycleStatus: status,
          lifecycleHistory: history
        }
      );

    this.emit(
      "aiw:ideaStatusChanged",
      {
        idea: this.clone(updated),
        fromStatus:
          previousStatus,
        toStatus: status
      }
    );

    return {
      success: true,
      idea: updated
    };
  },

  submitIdeaForApproval(
    ideaId,
    options = {}
  ) {
    const idea =
      this.getIdea(ideaId);

    if (!idea) {
      return {
        success: false,
        reason: "idea-not-found",
        message:
          "لم يتم العثور على الفكرة."
      };
    }

    if (
      idea.conversion?.converted
    ) {
      return {
        success: false,
        reason:
          "already-converted",

        message:
          "الفكرة محولة إلى مشروع بالفعل."
      };
    }

    const currentTime =
      this.now();

    const history =
      this.addIdeaHistory(
        idea,
        {
          action:
            "submitted-for-approval",

          fromStatus:
            idea.ideaStatus,

          toStatus:
            AIW.LIFECYCLE.IDEA_STATUS.PENDING_APPROVAL,

          actor:
            options.submittedBy ||
            options.actor ||
            null,

          note:
            options.note ||
            ""
        }
      );

    const updated =
      this.updateIdea(
        ideaId,
        {
          status:
            AIW.LIFECYCLE.IDEA_STATUS.PENDING_APPROVAL,

          ideaStatus:
            AIW.LIFECYCLE.IDEA_STATUS.PENDING_APPROVAL,

          lifecycleStatus:
            AIW.LIFECYCLE.IDEA_STATUS.PENDING_APPROVAL,

          approval: {
            ...idea.approval,
            required: true,
            status: "pending",
            submittedAt:
              currentTime,
            submittedBy:
              options.submittedBy ||
              options.actor ||
              null,
            decidedAt: null,
            decidedBy: null,
            decision: null,
            note:
              options.note ||
              ""
          },

          lifecycleHistory:
            history
        }
      );

    this.addApprovalRecord({
      ideaId,
      type: "idea-approval",
      status: "pending",

      title:
        updated?.title ||
        idea.title,

      submittedAt:
        currentTime,

      submittedBy:
        options.submittedBy ||
        options.actor ||
        null,

      note:
        options.note ||
        ""
    });

    this.recordExecution({
      entityType: "idea",
      entityId: ideaId,
      action:
        "submitted-for-approval",
      status: "pending",
      actor:
        options.submittedBy ||
        options.actor ||
        null
    });

    this.emit(
      "aiw:ideaSubmitted",
      {
        idea: this.clone(updated)
      }
    );

    return {
      success: true,
      idea: updated
    };
  },

  approveIdea(
    ideaId,
    options = {}
  ) {
    const idea =
      this.getIdea(ideaId);

    if (!idea) {
      return {
        success: false,
        reason: "idea-not-found",
        message:
          "لم يتم العثور على الفكرة."
      };
    }

    if (
      idea.conversion?.converted
    ) {
      return {
        success: false,
        reason:
          "already-converted",

        message:
          "الفكرة محولة إلى مشروع بالفعل."
      };
    }

    const currentTime =
      this.now();

    const history =
      this.addIdeaHistory(
        idea,
        {
          action: "approved",

          fromStatus:
            idea.ideaStatus,

          toStatus:
            AIW.LIFECYCLE.IDEA_STATUS.APPROVED,

          actor:
            options.approvedBy ||
            options.actor ||
            null,

          note:
            options.note ||
            ""
        }
      );

    const updated =
      this.updateIdea(
        ideaId,
        {
          status:
            AIW.LIFECYCLE.IDEA_STATUS.APPROVED,

          ideaStatus:
            AIW.LIFECYCLE.IDEA_STATUS.APPROVED,

          lifecycleStatus:
            AIW.LIFECYCLE.IDEA_STATUS.APPROVED,

          approval: {
            ...idea.approval,
            required: true,
            status: "approved",
            decidedAt:
              currentTime,
            decidedBy:
              options.approvedBy ||
              options.actor ||
              null,
            decision: "approved",
            note:
              options.note ||
              idea.approval?.note ||
              ""
          },

          lifecycleHistory:
            history
        }
      );

    this.resolveApprovalRecord(
      ideaId,
      {
        status: "approved",

        decidedAt:
          currentTime,

        decidedBy:
          options.approvedBy ||
          options.actor ||
          null,

        note:
          options.note ||
          ""
      }
    );

    this.recordExecution({
      entityType: "idea",
      entityId: ideaId,
      action: "approved",
      status: "approved",
      actor:
        options.approvedBy ||
        options.actor ||
        null
    });

    this.emit(
      "aiw:ideaApproved",
      {
        idea: this.clone(updated)
      }
    );

    if (
      options.convertToProject === true
    ) {
      return this.convertIdeaToProject(
        ideaId,
        {
          ...options,
          approvedBy:
            options.approvedBy ||
            options.actor ||
            null
        }
      );
    }

    return {
      success: true,
      idea: updated
    };
  },

  rejectIdea(
    ideaId,
    options = {}
  ) {
    const idea =
      this.getIdea(ideaId);

    if (!idea) {
      return {
        success: false,
        reason: "idea-not-found",
        message:
          "لم يتم العثور على الفكرة."
      };
    }

    if (
      idea.conversion?.converted
    ) {
      return {
        success: false,
        reason:
          "already-converted",

        message:
          "لا يمكن رفض فكرة محولة إلى مشروع."
      };
    }

    const currentTime =
      this.now();

    const history =
      this.addIdeaHistory(
        idea,
        {
          action: "rejected",

          fromStatus:
            idea.ideaStatus,

          toStatus:
            AIW.LIFECYCLE.IDEA_STATUS.REJECTED,

          actor:
            options.rejectedBy ||
            options.actor ||
            null,

          note:
            options.note ||
            ""
        }
      );

    const updated =
      this.updateIdea(
        ideaId,
        {
          status:
            AIW.LIFECYCLE.IDEA_STATUS.REJECTED,

          ideaStatus:
            AIW.LIFECYCLE.IDEA_STATUS.REJECTED,

          lifecycleStatus:
            AIW.LIFECYCLE.IDEA_STATUS.REJECTED,

          approval: {
            ...idea.approval,
            required: true,
            status: "rejected",
            decidedAt:
              currentTime,
            decidedBy:
              options.rejectedBy ||
              options.actor ||
              null,
            decision: "rejected",
            note:
              options.note ||
              ""
          },

          lifecycleHistory:
            history
        }
      );

    this.resolveApprovalRecord(
      ideaId,
      {
        status: "rejected",

        decidedAt:
          currentTime,

        decidedBy:
          options.rejectedBy ||
          options.actor ||
          null,

        note:
          options.note ||
          ""
      }
    );

    this.recordExecution({
      entityType: "idea",
      entityId: ideaId,
      action: "rejected",
      status: "rejected",
      actor:
        options.rejectedBy ||
        options.actor ||
        null
    });

    this.emit(
      "aiw:ideaRejected",
      {
        idea: this.clone(updated)
      }
    );

    return {
      success: true,
      idea: updated
    };
  },

  getEligibleIdeasForProject() {
    return this.getIdeas({
      converted: false
    }).filter(idea => {
      const status =
        idea.ideaStatus ||
        idea.status;

      return [
        AIW.LIFECYCLE.IDEA_STATUS.APPROVED
      ].includes(status);
    });
  },

  /* =========================================================
     IDEA TO PROJECT CONVERSION
  ========================================================= */

  getProjectByIdeaId(ideaId) {
    return (
      this.getCollection("projects")
        .find(
          project =>
            String(
              project?.sourceIdeaId
            ) ===
            String(ideaId)
        ) ||
      null
    );
  },

  convertIdeaToProject(
    ideaId,
    options = {}
  ) {
    const idea =
      this.getIdea(ideaId);

    if (!idea) {
      return {
        success: false,
        reason: "idea-not-found",
        message:
          "لم يتم العثور على الفكرة."
      };
    }

    const existingProject =
      this.getProjectByIdeaId(
        ideaId
      );

    if (
      idea.conversion?.converted ||
      existingProject
    ) {
      return {
        success: false,
        reason:
          "already-converted",

        message:
          "تم تحويل هذه الفكرة إلى مشروع مسبقاً.",

        project:
          existingProject ||
          (
            idea.conversion?.projectId
              ? this.find(
                  "projects",
                  idea.conversion
                    .projectId
                )
              : null
          )
      };
    }

    const workflowSettings =
      this.getSettings()
        .ideaProjectWorkflow || {};

    const requireApproval =
      options.requireApproval !== undefined
        ? Boolean(
            options.requireApproval
          )
        : workflowSettings
            .requireApproval !== false;

    const isApproved =
      idea.approval?.status ===
        "approved" ||
      idea.ideaStatus ===
        AIW.LIFECYCLE.IDEA_STATUS.APPROVED;

    if (
      requireApproval &&
      !isApproved &&
      options.force !== true
    ) {
      return {
        success: false,
        reason:
          "approval-required",

        message:
          "يجب اعتماد الفكرة قبل تحويلها إلى مشروع.",

        idea
      };
    }

    const currentTime =
      this.now();

    const blueprint =
      this.deepMerge(
        this.getDefaultProjectBlueprint(
          idea
        ),
        idea.projectBlueprint || {}
      );

    const projectId =
      options.projectId ||
      this.id("project");

    const project =
      this.normalizeProject(
        {
          ...blueprint,
          ...this.clone(
            options.projectData || {}
          ),

          id: projectId,

          sourceIdeaId:
            idea.id,

          origin:
            "idea-conversion",

          title:
            options.title ||
            blueprint.title ||
            idea.title,

          titleEn:
            options.titleEn ||
            blueprint.titleEn ||
            idea.titleEn ||
            "",

          status:
            AIW.LIFECYCLE.PROJECT_STATUS.PLANNING,

          projectStatus:
            AIW.LIFECYCLE.PROJECT_STATUS.PLANNING,

          progress: 0,

          currentPhase:
            "discovery",

          approvalSnapshot:
            this.clone(
              idea.approval || {}
            ),

          lifecycleHistory: [
            {
              id:
                this.id(
                  "project-history"
                ),

              action:
                "project-created",

              fromStatus:
                null,

              toStatus:
                AIW.LIFECYCLE.PROJECT_STATUS.PLANNING,

              sourceIdeaId:
                idea.id,

              actor:
                options.convertedBy ||
                options.actor ||
                null,

              note:
                options.note ||
                "",

              createdAt:
                currentTime
            }
          ],

          createdAt:
            currentTime,

          updatedAt:
            currentTime,

          deletedAt: null
        },
        this.count("projects")
      );

    const state =
      this.getState();

    state.projects =
      this.toArray(
        state.projects
      );

    state.ideas =
      this.toArray(
        state.ideas
      );

    state.projects.unshift(
      project
    );

    state.ideas =
      state.ideas.map(
        currentIdea => {
          if (
            String(
              currentIdea?.id
            ) !==
            String(ideaId)
          ) {
            return currentIdea;
          }

          const history =
            this.addIdeaHistory(
              currentIdea,
              {
                action:
                  "converted-to-project",

                fromStatus:
                  currentIdea.ideaStatus,

                toStatus:
                  AIW.LIFECYCLE.IDEA_STATUS.CONVERTED,

                projectId,

                actor:
                  options.convertedBy ||
                  options.actor ||
                  null,

                note:
                  options.note ||
                  ""
              }
            );

          return this.normalizeIdea({
            ...currentIdea,

            status:
              AIW.LIFECYCLE.IDEA_STATUS.CONVERTED,

            ideaStatus:
              AIW.LIFECYCLE.IDEA_STATUS.CONVERTED,

            lifecycleStatus:
              AIW.LIFECYCLE.IDEA_STATUS.CONVERTED,

            conversion: {
              ...currentIdea.conversion,
              converted: true,
              projectId,
              convertedAt:
                currentTime,
              convertedBy:
                options.convertedBy ||
                options.actor ||
                null,
              revertedAt: null,
              revertedBy: null
            },

            lifecycleHistory:
              history,

            updatedAt:
              currentTime
          });
        }
      );

    this.addActivity(
      state,
      {
        type:
          "idea-to-project",

        collection:
          "projects",

        title:
          `تحويل الفكرة إلى مشروع: ${project.title}`,

        refId:
          project.id,

        sourceIdeaId:
          idea.id
      }
    );

    state.automation =
      this.normalizeAutomation(
        state.automation
      );

    state.automation.executionHistory.unshift({
      id:
        this.id(
          "execution"
        ),

      entityType:
        "project",

      entityId:
        project.id,

      sourceIdeaId:
        idea.id,

      action:
        "project-created",

      status:
        AIW.LIFECYCLE.PROJECT_STATUS.PLANNING,

      actor:
        options.convertedBy ||
        options.actor ||
        null,

      createdAt:
        currentTime
    });

    this.commit(
      state,
      {
        eventName:
          "aiw:ideaConvertedToProject",

        backup: true
      }
    );

    const createdProject =
      this.find(
        "projects",
        projectId
      );

    const convertedIdea =
      this.find(
        "ideas",
        ideaId
      );

    this.emit(
      "aiw:projectCreatedFromIdea",
      {
        idea:
          this.clone(
            convertedIdea
          ),

        project:
          this.clone(
            createdProject
          )
      }
    );

    return {
      success: true,
      idea: convertedIdea,
      project: createdProject
    };
  },

  revertProjectToIdea(
    projectId,
    options = {}
  ) {
    const project =
      this.find(
        "projects",
        projectId
      );

    if (!project) {
      return {
        success: false,
        reason:
          "project-not-found",

        message:
          "لم يتم العثور على المشروع."
      };
    }

    if (!project.sourceIdeaId) {
      return {
        success: false,
        reason:
          "project-has-no-source-idea",

        message:
          "هذا المشروع غير مرتبط بفكرة أصلية."
      };
    }

    const idea =
      this.getIdea(
        project.sourceIdeaId
      );

    if (!idea) {
      return {
        success: false,
        reason:
          "source-idea-not-found",

        message:
          "لم يتم العثور على الفكرة الأصلية."
      };
    }

    const currentTime =
      this.now();

    const state =
      this.getState();

    state.projects =
      state.projects.map(
        currentProject => {
          if (
            String(
              currentProject?.id
            ) !==
            String(projectId)
          ) {
            return currentProject;
          }

          const history =
            this.toArray(
              currentProject.lifecycleHistory
            );

          history.unshift({
            id:
              this.id(
                "project-history"
              ),

            action:
              "reverted-to-idea",

            fromStatus:
              currentProject.projectStatus,

            toStatus:
              AIW.LIFECYCLE.PROJECT_STATUS.ARCHIVED,

            actor:
              options.revertedBy ||
              options.actor ||
              null,

            note:
              options.note ||
              "",

            createdAt:
              currentTime
          });

          return {
            ...currentProject,

            status:
              AIW.LIFECYCLE.PROJECT_STATUS.ARCHIVED,

            projectStatus:
              AIW.LIFECYCLE.PROJECT_STATUS.ARCHIVED,

            archivedAt:
              currentTime,

            lifecycleHistory:
              history,

            updatedAt:
              currentTime
          };
        }
      );

    state.ideas =
      state.ideas.map(
        currentIdea => {
          if (
            String(
              currentIdea?.id
            ) !==
            String(idea.id)
          ) {
            return currentIdea;
          }

          const nextStatus =
            currentIdea.approval
              ?.status === "approved"
              ? AIW.LIFECYCLE.IDEA_STATUS.APPROVED
              : AIW.LIFECYCLE.IDEA_STATUS.DRAFT;

          const history =
            this.addIdeaHistory(
              currentIdea,
              {
                action:
                  "project-reverted",

                fromStatus:
                  AIW.LIFECYCLE.IDEA_STATUS.CONVERTED,

                toStatus:
                  nextStatus,

                projectId,

                actor:
                  options.revertedBy ||
                  options.actor ||
                  null,

                note:
                  options.note ||
                  ""
              }
            );

          return this.normalizeIdea({
            ...currentIdea,

            status:
              nextStatus,

            ideaStatus:
              nextStatus,

            lifecycleStatus:
              nextStatus,

            conversion: {
              ...currentIdea.conversion,
              converted: false,
              projectId: null,
              revertedAt:
                currentTime,
              revertedBy:
                options.revertedBy ||
                options.actor ||
                null
            },

            lifecycleHistory:
              history,

            updatedAt:
              currentTime
          });
        }
      );

    this.addActivity(
      state,
      {
        type:
          "project-reverted",

        collection:
          "projects",

        title:
          `إعادة المشروع إلى فكرة: ${project.title}`,

        refId:
          project.id,

        sourceIdeaId:
          idea.id
      }
    );

    this.commit(
      state,
      {
        eventName:
          "aiw:projectRevertedToIdea",

        backup: true
      }
    );

    return {
      success: true,

      idea:
        this.getIdea(
          idea.id
        ),

      project:
        this.find(
          "projects",
          projectId
        )
    };
  },

  /* =========================================================
     PROJECT MANAGEMENT
  ========================================================= */

  getProjects(options = {}) {
    let projects =
      this.getCollection(
        "projects"
      );

    if (
      options.includeArchived !== true
    ) {
      projects =
        projects.filter(
          project =>
            (
              project.projectStatus ||
              project.status
            ) !==
            AIW.LIFECYCLE.PROJECT_STATUS.ARCHIVED
        );
    }

    if (
      options.status &&
      options.status !== "all"
    ) {
      projects =
        projects.filter(
          project =>
            (
              project.projectStatus ||
              project.status
            ) ===
            options.status
        );
    }

    if (options.sourceIdeaId) {
      projects =
        projects.filter(
          project =>
            String(
              project.sourceIdeaId
            ) ===
            String(
              options.sourceIdeaId
            )
        );
    }

    return projects;
  },

  getProject(projectId) {
    return this.find(
      "projects",
      projectId
    );
  },

  createManualProject(
    item = {}
  ) {
    const project =
      this.normalizeProject(
        {
          ...item,

          id:
            item.id ||
            this.id("project"),

          sourceIdeaId:
            null,

          origin: "manual",

          status:
            item.status ||
            AIW.LIFECYCLE.PROJECT_STATUS.PLANNING,

          projectStatus:
            item.projectStatus ||
            item.status ||
            AIW.LIFECYCLE.PROJECT_STATUS.PLANNING,

          progress:
            item.progress ||
            0
        },
        this.count("projects")
      );

    return this.add(
      "projects",
      project
    );
  },

  updateProject(
    projectId,
    updates = {}
  ) {
    const project =
      this.getProject(projectId);

    if (!project) {
      return null;
    }

    const merged = {
      ...project,
      ...this.clone(updates)
    };

    if (
      updates.tasks ||
      merged.tasks
    ) {
      merged.tasks =
        this.toArray(
          merged.tasks
        );

      const workflow =
        this.getSettings()
          .ideaProjectWorkflow || {};

      if (
        workflow
          .calculateProgressFromTasks !== false &&
        merged.tasks.length
      ) {
        merged.progress =
          this.calculateTasksProgress(
            merged.tasks
          );
      }
    }

    if (
      merged.progress >= 100 &&
      (
        merged.projectStatus ||
        merged.status
      ) !==
        AIW.LIFECYCLE.PROJECT_STATUS.COMPLETED
    ) {
      merged.progress = 100;
    }

    return this.update(
      "projects",
      projectId,
      merged
    );
  },

  addProjectHistory(
    project,
    entry = {}
  ) {
    const history =
      this.toArray(
        project.lifecycleHistory
      );

    history.unshift({
      id:
        entry.id ||
        this.id(
          "project-history"
        ),

      action:
        entry.action ||
        "updated",

      fromStatus:
        entry.fromStatus ||
        null,

      toStatus:
        entry.toStatus ||
        null,

      note:
        entry.note ||
        "",

      actor:
        entry.actor ||
        null,

      createdAt:
        entry.createdAt ||
        this.now(),

      ...this.clone(entry)
    });

    return history.slice(0, 300);
  },

  setProjectStatus(
    projectId,
    status,
    options = {}
  ) {
    const validStatuses =
      Object.values(
        AIW.LIFECYCLE.PROJECT_STATUS
      );

    if (
      !validStatuses.includes(status)
    ) {
      return {
        success: false,
        reason:
          "invalid-status",

        message:
          "حالة المشروع غير صحيحة."
      };
    }

    const project =
      this.getProject(projectId);

    if (!project) {
      return {
        success: false,
        reason:
          "project-not-found",

        message:
          "لم يتم العثور على المشروع."
      };
    }

    const previousStatus =
      project.projectStatus ||
      project.status;

    const currentTime =
      this.now();

    const history =
      this.addProjectHistory(
        project,
        {
          action:
            options.action ||
            "status-changed",

          fromStatus:
            previousStatus,

          toStatus:
            status,

          note:
            options.note ||
            "",

          actor:
            options.actor ||
            null
        }
      );

    const updates = {
      status,
      projectStatus: status,
      lifecycleHistory: history
    };

    if (
      status ===
      AIW.LIFECYCLE.PROJECT_STATUS.IN_PROGRESS &&
      !project.startedAt
    ) {
      updates.startedAt =
        currentTime;

      updates.schedule = {
        ...project.schedule,

        actualStart:
          project.schedule
            ?.actualStart ||
          currentTime
      };
    }

    if (
      status ===
      AIW.LIFECYCLE.PROJECT_STATUS.COMPLETED
    ) {
      updates.progress = 100;
      updates.completedAt =
        currentTime;

      updates.schedule = {
        ...project.schedule,
        actualEnd:
          currentTime
      };
    }

    if (
      status ===
      AIW.LIFECYCLE.PROJECT_STATUS.ARCHIVED
    ) {
      updates.archivedAt =
        currentTime;
    }

    const updated =
      this.updateProject(
        projectId,
        updates
      );

    this.recordExecution({
      entityType: "project",
      entityId: projectId,

      sourceIdeaId:
        project.sourceIdeaId ||
        null,

      action:
        options.action ||
        "status-changed",

      fromStatus:
        previousStatus,

      status,

      actor:
        options.actor ||
        null
    });

    this.emit(
      "aiw:projectStatusChanged",
      {
        project:
          this.clone(updated),

        fromStatus:
          previousStatus,

        toStatus:
          status
      }
    );

    return {
      success: true,
      project: updated
    };
  },

  setProjectPhase(
    projectId,
    phaseId,
    options = {}
  ) {
    const project =
      this.getProject(projectId);

    if (!project) {
      return {
        success: false,
        reason:
          "project-not-found",

        message:
          "لم يتم العثور على المشروع."
      };
    }

    const phases =
      this.toArray(
        project.phases
      );

    const targetIndex =
      phases.findIndex(
        phase =>
          String(phase?.id) ===
          String(phaseId)
      );

    if (targetIndex < 0) {
      return {
        success: false,
        reason:
          "phase-not-found",

        message:
          "لم يتم العثور على المرحلة."
      };
    }

    const currentTime =
      this.now();

    const updatedPhases =
      phases.map(
        (phase, index) => {
          if (index < targetIndex) {
            return {
              ...phase,
              status: "completed",
              progress: 100,

              completedAt:
                phase.completedAt ||
                currentTime
            };
          }

          if (index === targetIndex) {
            return {
              ...phase,
              status: "current",

              startedAt:
                phase.startedAt ||
                currentTime,

              completedAt: null
            };
          }

          return {
            ...phase,
            status: "pending",
            progress:
              phase.status ===
                "completed"
                ? phase.progress
                : 0,
            completedAt: null
          };
        }
      );

    const history =
      this.addProjectHistory(
        project,
        {
          action:
            "phase-changed",

          phaseId,

          fromPhase:
            project.currentPhase,

          toPhase:
            phaseId,

          actor:
            options.actor ||
            null,

          note:
            options.note ||
            ""
        }
      );

    const updated =
      this.updateProject(
        projectId,
        {
          currentPhase:
            phaseId,

          phases:
            updatedPhases,

          lifecycleHistory:
            history
        }
      );

    this.emit(
      "aiw:projectPhaseChanged",
      {
        project:
          this.clone(updated),

        phaseId
      }
    );

    return {
      success: true,
      project: updated
    };
  },

  addProjectTask(
    projectId,
    task = {}
  ) {
    const project =
      this.getProject(projectId);

    if (!project) {
      return {
        success: false,
        reason:
          "project-not-found",

        message:
          "لم يتم العثور على المشروع."
      };
    }

    const currentTime =
      this.now();

    const taskRecord = {
      id:
        task.id ||
        this.id("task"),

      title:
        task.title ||
        task.name ||
        "مهمة جديدة",

      description:
        task.description ||
        "",

      status:
        task.status ||
        "pending",

      priority:
        task.priority ||
        "medium",

      owner:
        task.owner ||
        null,

      weight: Math.max(
        1,
        this.toNumber(
          task.weight,
          1
        )
      ),

      progress: this.clamp(
        task.progress ??
        (
          task.status === "completed"
            ? 100
            : 0
        )
      ),

      dueDate:
        task.dueDate ||
        null,

      completedAt:
        task.completedAt ||
        null,

      createdAt:
        currentTime,

      updatedAt:
        currentTime
    };

    const tasks = [
      ...this.toArray(
        project.tasks
      ),
      taskRecord
    ];

    const progress =
      this.calculateTasksProgress(
        tasks
      );

    const updated =
      this.updateProject(
        projectId,
        {
          tasks,
          progress
        }
      );

    this.emit(
      "aiw:projectTaskCreated",
      {
        project:
          this.clone(updated),

        task:
          this.clone(taskRecord)
      }
    );

    return {
      success: true,
      project: updated,
      task: taskRecord
    };
  },

  updateProjectTask(
    projectId,
    taskId,
    updates = {}
  ) {
    const project =
      this.getProject(projectId);

    if (!project) {
      return {
        success: false,
        reason:
          "project-not-found",

        message:
          "لم يتم العثور على المشروع."
      };
    }

    let updatedTask = null;

    const tasks =
      this.toArray(
        project.tasks
      ).map(task => {
        if (
          String(task?.id) !==
          String(taskId)
        ) {
          return task;
        }

        updatedTask = {
          ...task,
          ...this.clone(updates),
          id: task.id,
          updatedAt: this.now()
        };

        if (
          updatedTask.status ===
          "completed"
        ) {
          updatedTask.progress = 100;

          updatedTask.completedAt =
            updatedTask.completedAt ||
            this.now();
        }

        if (
          updatedTask.progress >= 100
        ) {
          updatedTask.progress = 100;
          updatedTask.status =
            "completed";

          updatedTask.completedAt =
            updatedTask.completedAt ||
            this.now();
        }

        return updatedTask;
      });

    if (!updatedTask) {
      return {
        success: false,
        reason:
          "task-not-found",

        message:
          "لم يتم العثور على المهمة."
      };
    }

    const progress =
      this.calculateTasksProgress(
        tasks
      );

    const updatedProject =
      this.updateProject(
        projectId,
        {
          tasks,
          progress
        }
      );

    this.emit(
      "aiw:projectTaskUpdated",
      {
        project:
          this.clone(
            updatedProject
          ),

        task:
          this.clone(
            updatedTask
          )
      }
    );

    return {
      success: true,
      project: updatedProject,
      task: updatedTask
    };
  },

  removeProjectTask(
    projectId,
    taskId
  ) {
    const project =
      this.getProject(projectId);

    if (!project) {
      return {
        success: false,
        reason:
          "project-not-found",

        message:
          "لم يتم العثور على المشروع."
      };
    }

    const originalTasks =
      this.toArray(
        project.tasks
      );

    const tasks =
      originalTasks.filter(
        task =>
          String(task?.id) !==
          String(taskId)
      );

    if (
      tasks.length ===
      originalTasks.length
    ) {
      return {
        success: false,
        reason:
          "task-not-found",

        message:
          "لم يتم العثور على المهمة."
      };
    }

    const progress =
      this.calculateTasksProgress(
        tasks
      );

    const updatedProject =
      this.updateProject(
        projectId,
        {
          tasks,
          progress
        }
      );

    this.emit(
      "aiw:projectTaskDeleted",
      {
        project:
          this.clone(
            updatedProject
          ),

        taskId
      }
    );

    return {
      success: true,
      project: updatedProject
    };
  },

  /* =========================================================
     APPROVALS
  ========================================================= */

  addApprovalRecord(
    approval = {}
  ) {
    const approvals =
      this.getAllCollection(
        "approvals"
      );

    const existingIndex =
      approvals.findIndex(
        item =>
          String(
            item?.ideaId
          ) ===
          String(
            approval.ideaId
          ) &&
          item?.status ===
            "pending"
      );

    const record = {
      id:
        approval.id ||
        this.id("approval"),

      type:
        approval.type ||
        "idea-approval",

      ideaId:
        approval.ideaId ||
        null,

      projectId:
        approval.projectId ||
        null,

      title:
        approval.title ||
        "طلب اعتماد",

      status:
        approval.status ||
        "pending",

      submittedAt:
        approval.submittedAt ||
        this.now(),

      submittedBy:
        approval.submittedBy ||
        null,

      decidedAt:
        approval.decidedAt ||
        null,

      decidedBy:
        approval.decidedBy ||
        null,

      note:
        approval.note ||
        "",

      createdAt:
        approval.createdAt ||
        this.now(),

      updatedAt:
        this.now()
    };

    if (existingIndex >= 0) {
      approvals[existingIndex] = {
        ...approvals[existingIndex],
        ...record,
        id:
          approvals[existingIndex].id
      };
    } else {
      approvals.unshift(record);
    }

    this.set(
      "automation.approvals",
      approvals,
      {
        eventName:
          "aiw:approvalCreated",

        activity: {
          type:
            "approval-created",

          collection:
            "approvals",

          title:
            record.title,

          refId:
            record.id
        }
      }
    );

    return this.clone(record);
  },

  resolveApprovalRecord(
    ideaId,
    decision = {}
  ) {
    const approvals =
      this.getAllCollection(
        "approvals"
      );

    let resolved = null;

    const updatedApprovals =
      approvals.map(item => {
        if (
          String(item?.ideaId) !==
          String(ideaId) ||
          item?.status !== "pending"
        ) {
          return item;
        }

        resolved = {
          ...item,
          status:
            decision.status ||
            "approved",

          decidedAt:
            decision.decidedAt ||
            this.now(),

          decidedBy:
            decision.decidedBy ||
            null,

          note:
            decision.note ??
            item.note ??
            "",

          updatedAt:
            this.now()
        };

        return resolved;
      });

    if (!resolved) {
      return null;
    }

    this.set(
      "automation.approvals",
      updatedApprovals,
      {
        eventName:
          "aiw:approvalResolved",

        activity: {
          type:
            "approval-resolved",

          collection:
            "approvals",

          title:
            resolved.title ||
            "اعتماد فكرة",

          refId:
            resolved.id
        }
      }
    );

    return this.clone(resolved);
  },

  /* =========================================================
     AUTOMATION EXECUTION HISTORY
  ========================================================= */

  recordExecution(entry = {}) {
    const history =
      this.getAllCollection(
        "executionHistory"
      );

    const record = {
      id:
        entry.id ||
        this.id("execution"),

      workflowId:
        entry.workflowId ||
        null,

      entityType:
        entry.entityType ||
        "system",

      entityId:
        entry.entityId ||
        null,

      sourceIdeaId:
        entry.sourceIdeaId ||
        null,

      projectId:
        entry.projectId ||
        (
          entry.entityType ===
            "project"
            ? entry.entityId
            : null
        ),

      action:
        entry.action ||
        "executed",

      fromStatus:
        entry.fromStatus ||
        null,

      status:
        entry.status ||
        "completed",

      actor:
        entry.actor ||
        null,

      details:
        entry.details ||
        {},

      createdAt:
        entry.createdAt ||
        this.now()
    };

    history.unshift(record);

    const limitedHistory =
      history.slice(0, 500);

    this.set(
      "automation.executionHistory",
      limitedHistory,
      {
        eventName:
          "aiw:executionRecorded",

        backup: false,

        notify: true
      }
    );

    return this.clone(record);
  },

  /* =========================================================
     ACTIVITY LOG
  ========================================================= */

  addActivity(data, activity = {}) {
    if (!data) {
      return null;
    }

    data.activity =
      Array.isArray(data.activity)
        ? data.activity
        : [];

    const activityRecord = {
      id:
        activity.id ||
        this.id("activity"),

      type:
        activity.type ||
        "system",

      title:
        activity.title ||
        "تحديث في المنصة",

      createdAt:
        activity.createdAt ||
        this.now(),

      ...this.clone(activity)
    };

    data.activity.unshift(
      activityRecord
    );

    data.activity =
      data.activity.slice(0, 200);

    return activityRecord;
  },

  logActivity(activity = {}) {
    const nextState =
      this.getState();

    const record =
      this.addActivity(
        nextState,
        activity
      );

    this.commit(
      nextState,
      {
        eventName:
          "aiw:activityAdded",

        backup: false
      }
    );

    return this.clone(record);
  },

  getActivity(limit = 20) {
    const safeLimit =
      Math.max(
        0,
        Number(limit) || 20
      );

    return this.getCollection(
      "activity"
    ).slice(
      0,
      safeLimit
    );
  },

  /* =========================================================
     STATISTICS
  ========================================================= */

  stats() {
    const collectionNames = [
      "strategy",
      "projects",
      "flagshipProjects",
      "ideas",
      "departments",
      "kpis",
      "maturity",
      "governance",
      "reports",
      "businessCases",
      "decisionCenter",
      "risks",
      "workflows",
      "triggers",
      "approvals",
      "executionHistory"
    ];

    const output = {
      totalRecords: 0,
      activeRecords: 0,
      deletedRecords: 0,
      collections: {},
      pipeline:
        this.getPipelineStats(),
      generatedAt:
        this.now()
    };

    collectionNames.forEach(
      collection => {
        const allItems =
          this.getAllCollection(
            collection
          );

        const activeCount =
          allItems.filter(
            item =>
              !item?.deletedAt
          ).length;

        const deletedCount =
          allItems.filter(
            item =>
              Boolean(
                item?.deletedAt
              )
          ).length;

        output.collections[
          collection
        ] = {
          total:
            allItems.length,

          active:
            activeCount,

          deleted:
            deletedCount
        };

        output.totalRecords +=
          allItems.length;

        output.activeRecords +=
          activeCount;

        output.deletedRecords +=
          deletedCount;
      }
    );

    return output;
  },

  /* =========================================================
     BACKUP AND RESTORE
  ========================================================= */

  backup(data = null, options = {}) {
    const sourceData =
      data ||
      this.getState();

    const payload = {
      backedUpAt:
        this.now(),

      version:
        this.version,

      schemaVersion:
        sourceData?.meta
          ?.schemaVersion ||
        AIW.DEFAULT_DATA.meta
          .schemaVersion,

      data:
        this.clone(
          sourceData
        ),

      settings:
        this.getSettings()
    };

    const written =
      this.write(
        AIW.KEYS.BACKUP,
        payload
      );

    if (
      written &&
      this._state
    ) {
      this._state.meta.lastBackupAt =
        payload.backedUpAt;

      this.write(
        AIW.KEYS.DATA,
        this._state
      );

      this.syncGlobalDataReference();
    }

    if (
      written &&
      options.emit !== false
    ) {
      this.emit(
        "aiw:backupCreated",
        this.clone(payload)
      );
    }

    return written
      ? this.clone(payload)
      : null;
  },

  getBackup() {
    return this.read(
      AIW.KEYS.BACKUP,
      null
    );
  },

  restoreBackup() {
    const backup =
      this.getBackup();

    if (
      !backup ||
      !backup.data
    ) {
      return null;
    }

    const restoredData =
      this.normalizeData(
        this.mergeDefaults(
          AIW.DEFAULT_DATA,
          backup.data
        )
      );

    this.ensureMetadata(
      restoredData
    );

    restoredData.meta.lastRestoredAt =
      this.now();

    const result =
      this.commit(
        restoredData,
        {
          eventName:
            "aiw:dataRestored",

          backup: false
        }
      );

    if (backup.settings) {
      this.saveSettings(
        backup.settings,
        "aiw:settingsRestored"
      );
    }

    return result;
  },

  /* =========================================================
     IMPORT AND EXPORT
  ========================================================= */

  exportData() {
    return {
      exportedAt:
        this.now(),

      app:
        this.getMetadata().app ||
        AIW.DEFAULT_DATA.meta.app,

      version:
        this.version,

      schemaVersion:
        this.getMetadata()
          .schemaVersion,

      data:
        this.getState(),

      settings:
        this.getSettings()
    };
  },

  importData(payload, options = {}) {
    if (
      !payload ||
      typeof payload !== "object"
    ) {
      return false;
    }

    let imported = false;

    if (payload.data) {
      const importedData =
        this.normalizeData(
          this.mergeDefaults(
            AIW.DEFAULT_DATA,
            payload.data
          )
        );

      this.ensureMetadata(
        importedData
      );

      importedData.meta.lastImportedAt =
        this.now();

      this.commit(
        importedData,
        {
          eventName:
            "aiw:dataImported",

          backup:
            options.backup !== false
        }
      );

      imported = true;
    }

    if (payload.settings) {
      this.saveSettings(
        payload.settings,
        "aiw:settingsImported"
      );

      imported = true;
    }

    return imported;
  },

  /* =========================================================
     RESET
  ========================================================= */

  reset(options = {}) {
    if (
      options.backupBeforeReset !==
      false
    ) {
      this.backup(
        this.getState()
      );
    }

    const fresh =
      this.clone(
        AIW.DEFAULT_DATA
      );

    const currentTime =
      this.now();

    fresh.meta.createdAt =
      currentTime;

    fresh.meta.updatedAt =
      currentTime;

    fresh.meta.lastSync =
      currentTime;

    return this.commit(
      fresh,
      {
        eventName:
          "aiw:dataReset",

        backup: false
      }
    );
  },

  resetSettings() {
    this._settings =
      this.clone(
        AIW.DEFAULT_SETTINGS
      );

    this.persistSettings({
      emit: false,
      notify: false
    });

    this.emit(
      "aiw:settingsReset",
      this.getSettings()
    );

    this.notifySubscribers({
      type:
        "aiw:settingsReset",

      settings:
        this.getSettings()
    });

    return this.getSettings();
  },

  clearAll(options = {}) {
    if (
      options.keepBackup !== true
    ) {
      this.removeStorageKey(
        AIW.KEYS.BACKUP
      );
    }

    this.removeStorageKey(
      AIW.KEYS.DATA
    );

    this.removeStorageKey(
      AIW.KEYS.SETTINGS
    );

    this._state = null;
    this._settings = null;
    this._initialized = false;

    return this.init();
  },

  /* =========================================================
     SUBSCRIPTIONS
  ========================================================= */

  subscribe(callback) {
    if (
      typeof callback !==
      "function"
    ) {
      return () => {};
    }

    this._subscribers.add(
      callback
    );

    return () => {
      this._subscribers.delete(
        callback
      );
    };
  },

  onChange(callback) {
    return this.subscribe(
      callback
    );
  },

  on(eventName, callback) {
    if (
      !eventName ||
      typeof callback !==
        "function"
    ) {
      return () => {};
    }

    const handler = event => {
      callback(
        event.detail,
        event
      );
    };

    window.addEventListener(
      eventName,
      handler
    );

    return () => {
      window.removeEventListener(
        eventName,
        handler
      );
    };
  },

  off(eventName, callback) {
    if (
      !eventName ||
      typeof callback !==
        "function"
    ) {
      return;
    }

    window.removeEventListener(
      eventName,
      callback
    );
  },

  notifySubscribers(change = {}) {
    const payload = {
      timestamp:
        this.now(),

      ...change
    };

    this._subscribers.forEach(
      callback => {
        try {
          callback(
            this.clone(payload),
            this.getState()
          );
        } catch (error) {
          console.error(
            "[AIW.Store] Subscriber failed:",
            error
          );
        }
      }
    );
  },

  /* =========================================================
     EVENTS
  ========================================================= */

  emit(name, detail) {
    if (!name) {
      return;
    }

    try {
      window.dispatchEvent(
        new CustomEvent(
          name,
          {
            detail:
              this.clone(detail)
          }
        )
      );
    } catch (error) {
      console.warn(
        `[AIW.Store] Event ${name} failed:`,
        error
      );
    }
  },

  /* =========================================================
     CROSS-TAB SYNCHRONIZATION
  ========================================================= */

  attachStorageListener() {
    if (
      this._storageListenerAttached
    ) {
      return;
    }

    this._storageListenerAttached =
      true;

    window.addEventListener(
      "storage",
      event => {
        if (this._writeLock) {
          return;
        }

        if (
          event.key ===
            AIW.KEYS.DATA &&
          event.newValue
        ) {
          try {
            const externalData =
              JSON.parse(
                event.newValue
              );

            this._state =
              this.normalizeData(
                this.mergeDefaults(
                  AIW.DEFAULT_DATA,
                  externalData
                )
              );

            this.ensureMetadata(
              this._state
            );

            this.refreshPipelineStats(
              this._state
            );

            this.syncGlobalDataReference();

            const payload = {
              source: "storage",
              data:
                this.getState()
            };

            this.emit(
              "aiw:crossTabSync",
              payload
            );

            this.emit(
              "aiw:dataChanged",
              payload
            );

            this.notifySubscribers({
              type:
                "aiw:crossTabSync",

              ...payload
            });
          } catch (error) {
            console.warn(
              "[AIW.Store] Cross-tab data synchronization failed:",
              error
            );
          }
        }

        if (
          event.key ===
            AIW.KEYS.SETTINGS &&
          event.newValue
        ) {
          try {
            this._settings =
              this.mergeDefaults(
                AIW.DEFAULT_SETTINGS,
                JSON.parse(
                  event.newValue
                )
              );

            this.emit(
              "aiw:settingsChanged",
              this.getSettings()
            );

            this.notifySubscribers({
              type:
                "aiw:settingsChanged",

              settings:
                this.getSettings()
            });
          } catch (error) {
            console.warn(
              "[AIW.Store] Cross-tab settings synchronization failed:",
              error
            );
          }
        }
      }
    );
  }
};

/* =========================================================
   STORE BOOTSTRAP
========================================================= */

AIW.Store.init();