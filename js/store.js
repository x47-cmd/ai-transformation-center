/* =========================================================
   AI Work - Store V2.3.1 Final
   Enterprise Single Source of Truth
   File Path: js/store.js

   Compatible with:
   - Store V2.2 / V2.3
   - Enterprise Seed Data V5.1
   - Ideas V5.1
   - Projects V5.0
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};
  const AIW = window.AIW;

  AIW.KEYS = {
    DATA:
      window.ATC_CONFIG?.storage?.data ||
      AIW.Config?.storage?.data ||
      "aiwDataV2",

    SETTINGS:
      window.ATC_CONFIG?.storage?.settings ||
      AIW.Config?.storage?.settings ||
      "aiwSettingsV2",

    BACKUP:
      window.ATC_CONFIG?.storage?.backup ||
      AIW.Config?.storage?.backup ||
      "aiwBackupV2",

    CURRENT_MODULE:
      window.ATC_CONFIG?.storage?.currentModule ||
      AIW.Config?.storage?.currentModule ||
      "aiwCurrentModule"
  };

  AIW.LIFECYCLE = {
    IDEA_STATUS: {
      IDEA: "idea",
      DRAFT: "draft",
      SUBMITTED: "submitted",
      PENDING_APPROVAL: "pending-approval",
      APPROVED: "approved",
      REJECTED: "rejected",
      CONVERTED: "converted-to-project",
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
      { id: "discovery", title: "التحليل", titleEn: "Discovery", order: 1 },
      { id: "planning", title: "التخطيط", titleEn: "Planning", order: 2 },
      { id: "design", title: "التصميم", titleEn: "Design", order: 3 },
      { id: "development", title: "التطوير", titleEn: "Development", order: 4 },
      { id: "testing", title: "الاختبار", titleEn: "Testing", order: 5 },
      { id: "pilot", title: "التجربة الأولية", titleEn: "Pilot", order: 6 },
      { id: "production", title: "التشغيل", titleEn: "Production", order: 7 },
      { id: "measurement", title: "قياس النتائج", titleEn: "Measurement", order: 8 }
    ]
  };

  AIW.DEFAULT_DATA = {
    meta: {
      app: "Enterprise Biometric Intelligence Platform",
      shortName: "AI Work",
      version: "2.3.1",
      schemaVersion: "2.3",
      environment: "production",
      architecture: "Modular Single Page Application",
      dataModel: "Single Source of Truth",
      synchronization: "Automatic",
      seedVersion: null,
      seededAt: null,
      migrations: {},
      createdAt: null,
      updatedAt: null,
      lastSync: null,
      lastBackupAt: null,
      lastImportedAt: null,
      lastRestoredAt: null,
      lastMigrationAt: null,
      lastSeedCheckAt: null
    },

    summary: {
      targetIdeas: 100,
      targetProjects: 15,
      targetDepartments: 5,
      maturityScore: 34,
      portfolioHealth: 68,
      systemHealth: 68,
      operationsHealth: 92,
      operationalHealth: 92,
      aiReadiness: 34,
      targetYear: 2030,
      roadmapPeriod: "2026–2030",
      ideasCount: 0,
      projectsCount: 0,
      pendingIdeasCount: 0,
      approvedIdeasCount: 0,
      rejectedIdeasCount: 0,
      convertedIdeasCount: 0,
      activeProjectsCount: 0,
      completedProjectsCount: 0,
      departmentsCount: 0
    },

    dashboard: {
      maturityScore: 34,
      portfolioHealth: 68,
      platformHealth: 0,
      readinessScore: 34,
      expectedROI: 0,
      targetYear: 2030
    },

    pipeline: {
      totalIdeas: 0,
      draftIdeas: 0,
      submittedIdeas: 0,
      pendingIdeas: 0,
      pendingApproval: 0,
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
    risks: [],
    roadmap: [],
    projectHorizons: [],
    notifications: [],
    recommendations: [],
    diagnostics: [],
    alerts: [],
    activity: [],

    kpiCenter: {
      items: [],
      settings: {},
      meta: {}
    },

    reportsCenter: {
      settings: {},
      executiveSummary: {},
      executiveHighlight: {},
      finalRecommendation: {},
      meta: {}
    },

    decisionCenter: {
      scenarios: [],
      criteria: [],
      analysisScenarios: [],
      timeline: [],
      settings: {},
      briefing: {},
      meta: {}
    },

    automationCenter: {
      workflows: [],
      triggers: [],
      approvals: [],
      roadmap: [],
      settings: {},
      statistics: {},
      executionHistory: [],
      meta: {}
    },

    automation: {
      workflows: [],
      triggers: [],
      approvals: [],
      roadmap: [],
      settings: {},
      statistics: {},
      executionHistory: [],
      meta: {}
    }
  };

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

  const Store = {
    id: "store",
    version: "2.3.1",
    storageKey: AIW.KEYS.DATA,

    _state: null,
    _settings: null,
    _subscribers: new Set(),
    _initialized: false,
    _storageListenerAttached: false,
    _writeLock: false,

    init() {
      if (this._initialized) return this.getState();

      this._initialized = true;

      const stored = this.read(AIW.KEYS.DATA, null);
      const legacy =
        AIW.Data && typeof AIW.Data === "object"
          ? AIW.Data
          : null;

      this._state = this.normalizeData(
        this.mergeDefaults(
          AIW.DEFAULT_DATA,
          stored || legacy || {}
        )
      );

      this._settings = this.mergeDefaults(
        AIW.DEFAULT_SETTINGS,
        this.read(AIW.KEYS.SETTINGS, {})
      );

      this.ensureMetadata(this._state);
      this.repairIdeaProjectLinks(this._state);
      this.refreshPipelineStats(this._state);
      this.syncCompatibilityModels(this._state);

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

      this.emit("aiw:storeReady", {
        version: this.version,
        data: this.getState()
      });

      return this.getState();
    },

    clone(value) {
      if (value === undefined) return undefined;

      if (typeof structuredClone === "function") {
        try {
          return structuredClone(value);
        } catch (_) {}
      }

      try {
        return JSON.parse(JSON.stringify(value));
      } catch (error) {
        console.error("[AIW.Store] Clone failed:", error);
        return value;
      }
    },

    now() {
      return new Date().toISOString();
    },

    id(prefix = "aiw") {
      return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;
    },

    isPlainObject(value) {
      return Boolean(
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      );
    },

    toArray(value) {
      if (Array.isArray(value)) return this.clone(value);
      if (this.isPlainObject(value)) return Object.values(value);
      if (typeof value === "string" && value.trim()) return [value.trim()];
      return [];
    },

    toNumber(value, fallback = 0) {
      const number = Number(value);
      return Number.isFinite(number) ? number : fallback;
    },

    clamp(value, min = 0, max = 100) {
      return Math.min(max, Math.max(min, this.toNumber(value, min)));
    },

    normalizeText(value) {
      return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
    },

    deepMerge(target, patch) {
      const output = this.isPlainObject(target)
        ? this.clone(target)
        : {};

      if (!this.isPlainObject(patch)) return output;

      Object.entries(patch).forEach(([key, value]) => {
        if (
          this.isPlainObject(output[key]) &&
          this.isPlainObject(value)
        ) {
          output[key] = this.deepMerge(output[key], value);
        } else {
          output[key] = this.clone(value);
        }
      });

      return output;
    },

    mergeDefaults(defaults, saved) {
      if (saved === undefined || saved === null) {
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

      Object.entries(saved).forEach(([key, value]) => {
        if (
          this.isPlainObject(defaults[key]) &&
          this.isPlainObject(value)
        ) {
          output[key] = this.mergeDefaults(defaults[key], value);
        } else {
          output[key] = this.clone(value);
        }
      });

      return output;
    },

    read(key, fallback = null) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : this.clone(fallback);
      } catch (error) {
        console.warn(`[AIW.Store] Unable to read ${key}:`, error);
        return this.clone(fallback);
      }
    },

    write(key, value) {
      try {
        this._writeLock = true;
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error(`[AIW.Store] Unable to write ${key}:`, error);
        return false;
      } finally {
        this._writeLock = false;
      }
    },

    removeStorageKey(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn(`[AIW.Store] Unable to remove ${key}:`, error);
        return false;
      }
    },

    getByPath(source, path) {
      if (!path) return source;

      const parts = Array.isArray(path)
        ? path
        : String(path).split(".").filter(Boolean);

      return parts.reduce((current, part) => {
        if (current === undefined || current === null) {
          return undefined;
        }

        return current[part];
      }, source);
    },

    setByPath(source, path, value) {
      const parts = Array.isArray(path)
        ? path
        : String(path).split(".").filter(Boolean);

      if (!parts.length) return source;

      let current = source;

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;

        if (isLast) {
          current[part] = this.clone(value);
          return;
        }

        const nextPart = parts[index + 1];
        const shouldBeArray = /^\d+$/.test(nextPart);

        if (
          current[part] === undefined ||
          current[part] === null ||
          (shouldBeArray && !Array.isArray(current[part])) ||
          (!shouldBeArray && !this.isPlainObject(current[part]))
        ) {
          current[part] = shouldBeArray ? [] : {};
        }

        current = current[part];
      });

      return source;
    },

    normalizeIdeaStatus(rawValue) {
      const raw = this.normalizeText(rawValue).replace(/_/g, "-");

      const map = {
        "": AIW.LIFECYCLE.IDEA_STATUS.IDEA,
        idea: AIW.LIFECYCLE.IDEA_STATUS.IDEA,
        draft: AIW.LIFECYCLE.IDEA_STATUS.DRAFT,
        submitted: AIW.LIFECYCLE.IDEA_STATUS.PENDING_APPROVAL,
        pending: AIW.LIFECYCLE.IDEA_STATUS.PENDING_APPROVAL,
        "pending approval": AIW.LIFECYCLE.IDEA_STATUS.PENDING_APPROVAL,
        "pending-approval": AIW.LIFECYCLE.IDEA_STATUS.PENDING_APPROVAL,
        approved: AIW.LIFECYCLE.IDEA_STATUS.APPROVED,
        rejected: AIW.LIFECYCLE.IDEA_STATUS.REJECTED,
        converted: AIW.LIFECYCLE.IDEA_STATUS.CONVERTED,
        "converted to project": AIW.LIFECYCLE.IDEA_STATUS.CONVERTED,
        "converted-to-project": AIW.LIFECYCLE.IDEA_STATUS.CONVERTED,
        archived: AIW.LIFECYCLE.IDEA_STATUS.ARCHIVED
      };

      return map[raw] || AIW.LIFECYCLE.IDEA_STATUS.IDEA;
    },

    normalizeProjectStatus(rawValue) {
      const raw = this.normalizeText(rawValue).replace(/_/g, "-");

      const map = {
        "": AIW.LIFECYCLE.PROJECT_STATUS.PLANNING,
        planned: AIW.LIFECYCLE.PROJECT_STATUS.PLANNING,
        planning: AIW.LIFECYCLE.PROJECT_STATUS.PLANNING,
        "قيد التخطيط": AIW.LIFECYCLE.PROJECT_STATUS.PLANNING,
        "قيد الدراسة": AIW.LIFECYCLE.PROJECT_STATUS.PLANNING,
        "quick win": AIW.LIFECYCLE.PROJECT_STATUS.READY,
        "quick-win": AIW.LIFECYCLE.PROJECT_STATUS.READY,
        ready: AIW.LIFECYCLE.PROJECT_STATUS.READY,
        "in progress": AIW.LIFECYCLE.PROJECT_STATUS.IN_PROGRESS,
        "in-progress": AIW.LIFECYCLE.PROJECT_STATUS.IN_PROGRESS,
        active: AIW.LIFECYCLE.PROJECT_STATUS.IN_PROGRESS,
        "قيد التنفيذ": AIW.LIFECYCLE.PROJECT_STATUS.IN_PROGRESS,
        pilot: AIW.LIFECYCLE.PROJECT_STATUS.PILOT,
        production: AIW.LIFECYCLE.PROJECT_STATUS.PRODUCTION,
        "on hold": AIW.LIFECYCLE.PROJECT_STATUS.ON_HOLD,
        "on-hold": AIW.LIFECYCLE.PROJECT_STATUS.ON_HOLD,
        completed: AIW.LIFECYCLE.PROJECT_STATUS.COMPLETED,
        مكتمل: AIW.LIFECYCLE.PROJECT_STATUS.COMPLETED,
        canceled: AIW.LIFECYCLE.PROJECT_STATUS.CANCELLED,
        cancelled: AIW.LIFECYCLE.PROJECT_STATUS.CANCELLED,
        archived: AIW.LIFECYCLE.PROJECT_STATUS.ARCHIVED
      };

      return map[raw] || AIW.LIFECYCLE.PROJECT_STATUS.PLANNING;
    },

    getDefaultProjectBlueprint(idea = {}) {
      return {
        icon: idea.icon || "📁",
        title: idea.projectTitle || idea.title || idea.name || "مشروع جديد",
        titleEn:
          idea.projectTitleEn ||
          idea.englishTitle ||
          idea.titleEn ||
          idea.nameEn ||
          "",
        englishTitle:
          idea.projectTitleEn ||
          idea.englishTitle ||
          idea.titleEn ||
          "",
        description:
          idea.projectDescription ||
          idea.solution ||
          idea.description ||
          "",
        objective: idea.objective || idea.challenge || "",
        category: idea.category || idea.portfolio || "general",
        department:
          idea.department ||
          idea.ownerDepartment ||
          "غير مصنف",
        owner: idea.owner || null,
        sponsor: idea.sponsor || null,
        priority: idea.priority || "متوسطة",
        cost: idea.cost || idea.costLevel || "متوسطة",
        duration: idea.duration || idea.timeline || "غير محددة",
        readiness: this.clamp(
          idea.readiness ??
          idea.decisionScore ??
          idea.score ??
          0
        ),
        decisionScore: this.clamp(
          idea.decisionScore ??
          idea.score ??
          0
        ),
        riskLevel: idea.riskLevel || idea.risk || "متوسط",
        benefits: this.toArray(idea.benefits),
        expectedOutcomes: this.toArray(idea.expectedOutcomes),
        kpis: this.toArray(idea.kpis),
        risks: this.toArray(idea.risks),
        dependencies: this.toArray(idea.dependencies),
        milestones: [],
        tasks: [],
        phases: this.clone(AIW.LIFECYCLE.PROJECT_PHASES).map(
          (phase, index) => ({
            ...phase,
            status: index === 0 ? "current" : "pending",
            progress: 0,
            startedAt: null,
            completedAt: null
          })
        ),
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
      const timestamp = this.now();

      const converted = Boolean(
        item.convertedToProject ||
        item.conversion?.converted ||
        item.projectId ||
        item.conversion?.projectId
      );

      let status = this.normalizeIdeaStatus(
        item.lifecycleStatus ??
        item.ideaStatus ??
        item.status ??
        item.approval?.status
      );

      if (
        converted &&
        status !== AIW.LIFECYCLE.IDEA_STATUS.ARCHIVED
      ) {
        status = AIW.LIFECYCLE.IDEA_STATUS.CONVERTED;
      }

      const explicitApproval = this.normalizeText(
        item.approval?.status ||
        item.approvalStatus
      ).replace(/_/g, "-");

      let approvalStatus = "not-submitted";

      if (
        ["pending", "submitted", "pending-approval"].includes(
          explicitApproval
        )
      ) {
        approvalStatus = "pending";
      } else if (explicitApproval === "approved") {
        approvalStatus = "approved";
      } else if (explicitApproval === "rejected") {
        approvalStatus = "rejected";
      } else if (
        status === AIW.LIFECYCLE.IDEA_STATUS.APPROVED ||
        status === AIW.LIFECYCLE.IDEA_STATUS.CONVERTED
      ) {
        approvalStatus = "approved";
      } else if (
        status === AIW.LIFECYCLE.IDEA_STATUS.REJECTED
      ) {
        approvalStatus = "rejected";
      } else if (
        status === AIW.LIFECYCLE.IDEA_STATUS.PENDING_APPROVAL
      ) {
        approvalStatus = "pending";
      }

      const blueprint = this.deepMerge(
        this.getDefaultProjectBlueprint(item),
        this.isPlainObject(item.projectBlueprint)
          ? item.projectBlueprint
          : {}
      );

      return {
        ...this.clone(item),

        id: item.id || this.id(`idea-${index + 1}`),
        icon: item.icon || "💡",
        title: item.title || item.name || "فكرة جديدة",
        titleEn:
          item.titleEn ||
          item.englishTitle ||
          item.nameEn ||
          "",
        englishTitle:
          item.englishTitle ||
          item.titleEn ||
          "",
        description: item.description || "",
        challenge: item.challenge || "",
        solution: item.solution || "",
        aiRole: item.aiRole || item.role || "",
        benefits: this.toArray(item.benefits),
        category: item.category || item.portfolio || "general",
        department:
          item.department ||
          item.ownerDepartment ||
          "غير مصنف",
        priority: item.priority || "متوسطة",
        cost: item.cost || item.costLevel || "متوسطة",
        costLevel: item.costLevel || item.cost || "متوسطة",
        duration: item.duration || item.timeline || "غير محددة",
        difficulty: item.difficulty || item.ease || "متوسطة",
        ease: item.ease || item.difficulty || "متوسطة",
        readiness: this.clamp(
          item.readiness ??
          item.decisionScore ??
          item.score ??
          0
        ),
        decisionScore: this.clamp(
          item.decisionScore ??
          item.score ??
          item.readiness ??
          0
        ),
        decisionLevel: item.decisionLevel || "قيد التقييم",
        riskLevel: item.riskLevel || item.risk || "متوسط",
        risk: item.risk || item.riskLevel || "متوسط",

        quickWin: Boolean(
          item.quickWin ||
          item.isQuickWin ||
          this.normalizeText(item.badge).includes("quick")
        ),

        isQuickWin: Boolean(
          item.quickWin ||
          item.isQuickWin ||
          this.normalizeText(item.badge).includes("quick")
        ),

        status,
        ideaStatus: status,
        lifecycleStatus: status,

        approval: {
          ...(this.isPlainObject(item.approval) ? item.approval : {}),
          required: item.approval?.required !== false,
          status: approvalStatus,
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
          decision: item.approval?.decision || null,
          reason:
            item.approval?.reason ||
            item.rejectionReason ||
            null,
          note:
            item.approval?.note ||
            item.approval?.notes ||
            item.approvalNote ||
            ""
        },

        conversion: {
          ...(this.isPlainObject(item.conversion) ? item.conversion : {}),
          converted,
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
          revertedAt: item.conversion?.revertedAt || null,
          revertedBy: item.conversion?.revertedBy || null
        },

        projectId:
          item.projectId ||
          item.conversion?.projectId ||
          null,

        convertedToProject: converted,
        projectBlueprint: blueprint,
        lifecycleHistory: this.toArray(
          item.lifecycleHistory ||
          item.history
        ),

        createdAt: item.createdAt || timestamp,
        updatedAt: item.updatedAt || timestamp,
        deletedAt: item.deletedAt ?? null
      };
    },

    normalizeTask(task = {}, index = 0) {
      const timestamp = this.now();

      const progress = this.clamp(
        task.progress ??
        (
          this.normalizeText(task.status) === "completed"
            ? 100
            : 0
        )
      );

      return {
        ...this.clone(task),
        id: task.id || this.id(`task-${index + 1}`),
        title: task.title || task.name || "مهمة جديدة",
        description: task.description || "",
        status:
          progress >= 100
            ? "completed"
            : task.status || "pending",
        priority: task.priority || "medium",
        owner: task.owner || null,
        weight: Math.max(1, this.toNumber(task.weight, 1)),
        progress,
        dueDate: task.dueDate || null,
        completedAt:
          progress >= 100
            ? task.completedAt || timestamp
            : task.completedAt || null,
        createdAt: task.createdAt || timestamp,
        updatedAt: task.updatedAt || timestamp
      };
    },

    getProjectSourceIdeaId(project) {
      return (
        project?.sourceIdeaId ??
        project?.ideaId ??
        project?.origin?.ideaId ??
        project?.source?.ideaId ??
        null
      );
    },

    normalizeProject(item = {}, index = 0) {
      const timestamp = this.now();

      const status = this.normalizeProjectStatus(
        item.projectStatus ??
        item.status
      );

      const tasks = this.toArray(item.tasks).map(
        (task, taskIndex) =>
          this.normalizeTask(task, taskIndex)
      );

      const sourceIdeaId =
        item.sourceIdeaId ||
        item.ideaId ||
        item.origin?.ideaId ||
        item.source?.ideaId ||
        null;

      const phasesSource = this.toArray(item.phases).length
        ? this.toArray(item.phases)
        : AIW.LIFECYCLE.PROJECT_PHASES;

      const phases = phasesSource.map((phase, phaseIndex) => ({
        ...this.clone(phase),
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
        order: this.toNumber(phase.order, phaseIndex + 1),
        status:
          phase.status ||
          (phaseIndex === 0 ? "current" : "pending"),
        progress: this.clamp(phase.progress ?? 0),
        startedAt: phase.startedAt || null,
        completedAt: phase.completedAt || null
      }));

      const progress = tasks.length
        ? this.calculateTasksProgress(tasks)
        : this.clamp(
            item.progress ??
            item.completion ??
            item.readiness ??
            0
          );

      const titleEn =
        item.titleEn ||
        item.englishTitle ||
        item.nameEn ||
        "";

      return {
        ...this.clone(item),

        id: item.id || this.id(`project-${index + 1}`),
        sourceIdeaId,
        ideaId: sourceIdeaId,

        origin: this.isPlainObject(item.origin)
          ? this.clone(item.origin)
          : {
              type:
                sourceIdeaId
                  ? "idea"
                  : item.origin || "manual",
              ideaId: sourceIdeaId
            },

        createdFromIdea: Boolean(
          item.createdFromIdea ||
          sourceIdeaId
        ),

        icon: item.icon || "📁",
        title: item.title || item.name || "مشروع جديد",
        titleEn,
        englishTitle: item.englishTitle || titleEn,
        description: item.description || "",
        objective: item.objective || "",
        category: item.category || item.portfolio || "general",
        department: item.department || "غير مصنف",
        owner: item.owner || null,
        sponsor: item.sponsor || null,
        priority: item.priority || "متوسطة",
        cost: item.cost || item.costLevel || "متوسطة",
        costLevel: item.costLevel || item.cost || "متوسطة",
        duration: item.duration || item.timeline || "غير محددة",
        readiness: this.clamp(item.readiness ?? progress),
        decisionScore: this.clamp(item.decisionScore ?? 0),
        riskLevel: item.riskLevel || item.risk || "متوسط",

        status,
        projectStatus: status,
        progress,

        currentPhase:
          item.currentPhase ||
          phases.find(phase => phase.status === "current")?.id ||
          phases[0]?.id ||
          "discovery",

        benefits: this.toArray(item.benefits),
        expectedOutcomes: this.toArray(item.expectedOutcomes),
        kpis: this.toArray(item.kpis),
        risks: this.toArray(item.risks),
        dependencies: this.toArray(item.dependencies),
        milestones: this.toArray(item.milestones),
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
          this.isPlainObject(item.approvalSnapshot)
            ? this.clone(item.approvalSnapshot)
            : {},

        lifecycleHistory: this.toArray(
          item.lifecycleHistory ||
          item.history
        ),

        createdAt: item.createdAt || timestamp,
        updatedAt: item.updatedAt || timestamp,
        startedAt: item.startedAt || null,
        completedAt: item.completedAt || null,
        archivedAt: item.archivedAt || null,
        deletedAt: item.deletedAt ?? null
      };
    },

    normalizeAutomation(value) {
      const source = Array.isArray(value)
        ? { workflows: value }
        : this.isPlainObject(value)
          ? value
          : {};

      return {
        workflows: this.toArray(source.workflows),
        triggers: this.toArray(source.triggers),
        approvals: this.toArray(source.approvals),
        roadmap: this.toArray(source.roadmap),
        settings: this.isPlainObject(source.settings)
          ? this.clone(source.settings)
          : {},
        statistics: this.isPlainObject(source.statistics)
          ? this.clone(source.statistics)
          : {},
        executionHistory: this.toArray(source.executionHistory),
        meta: this.isPlainObject(source.meta)
          ? this.clone(source.meta)
          : {}
      };
    },

    normalizeData(input) {
      const data = this.isPlainObject(input)
        ? this.clone(input)
        : this.clone(AIW.DEFAULT_DATA);

      data.meta = this.isPlainObject(data.meta) ? data.meta : {};
      data.summary = this.isPlainObject(data.summary) ? data.summary : {};
      data.dashboard = this.isPlainObject(data.dashboard) ? data.dashboard : {};
      data.pipeline = this.isPlainObject(data.pipeline) ? data.pipeline : {};

      [
        "strategy",
        "flagshipProjects",
        "departments",
        "kpis",
        "maturity",
        "governance",
        "reports",
        "businessCases",
        "risks",
        "roadmap",
        "projectHorizons",
        "notifications",
        "recommendations",
        "diagnostics",
        "alerts",
        "activity"
      ].forEach(key => {
        data[key] = this.toArray(data[key]);
      });

      data.ideas = this.toArray(data.ideas).map(
        (item, index) => this.normalizeIdea(item, index)
      );

      data.projects = this.toArray(data.projects).map(
        (item, index) => this.normalizeProject(item, index)
      );

      data.kpiCenter = this.deepMerge(
        AIW.DEFAULT_DATA.kpiCenter,
        this.isPlainObject(data.kpiCenter)
          ? data.kpiCenter
          : {}
      );

      data.reportsCenter = this.deepMerge(
        AIW.DEFAULT_DATA.reportsCenter,
        this.isPlainObject(data.reportsCenter)
          ? data.reportsCenter
          : {}
      );

      data.decisionCenter = this.deepMerge(
        AIW.DEFAULT_DATA.decisionCenter,
        this.isPlainObject(data.decisionCenter)
          ? data.decisionCenter
          : {}
      );

      const automationSource =
        this.isPlainObject(data.automationCenter) &&
        (
          this.toArray(data.automationCenter.workflows).length ||
          this.toArray(data.automationCenter.approvals).length ||
          this.toArray(data.automationCenter.executionHistory).length
        )
          ? data.automationCenter
          : data.automation;

      data.automationCenter = this.normalizeAutomation(automationSource);
      data.automation = this.normalizeAutomation(automationSource);

      this.repairIdeaProjectLinks(data);
      this.refreshPipelineStats(data);
      this.syncCompatibilityModels(data);

      return data;
    },

    ensureMetadata(data = this._state) {
      if (!data) return null;

      const timestamp = this.now();

      data.meta = {
        ...AIW.DEFAULT_DATA.meta,
        ...(this.isPlainObject(data.meta) ? data.meta : {}),
        migrations:
          this.isPlainObject(data.meta?.migrations)
            ? data.meta.migrations
            : {},
        version: this.version,
        schemaVersion: "2.3",
        createdAt: data.meta?.createdAt || timestamp,
        updatedAt: data.meta?.updatedAt || timestamp,
        lastSync: data.meta?.lastSync || timestamp
      };

      return data.meta;
    },

    repairIdeaProjectLinks(data) {
      if (!data) return data;

      const projects = this.toArray(data.projects);
      const projectById = new Map();
      const projectByIdeaId = new Map();

      projects.forEach(project => {
        if (project?.id) {
          projectById.set(String(project.id), project);
        }

        const status = this.normalizeProjectStatus(
          project?.projectStatus ??
          project?.status
        );

        const active =
          !project?.deletedAt &&
          status !== AIW.LIFECYCLE.PROJECT_STATUS.ARCHIVED &&
          status !== AIW.LIFECYCLE.PROJECT_STATUS.CANCELLED;

        const sourceIdeaId = this.getProjectSourceIdeaId(project);

        if (active && sourceIdeaId) {
          projectByIdeaId.set(String(sourceIdeaId), project);
        }
      });

      data.ideas = this.toArray(data.ideas).map(idea => {
        const linked =
          (
            idea?.conversion?.projectId
              ? projectById.get(String(idea.conversion.projectId))
              : null
          ) ||
          (
            idea?.projectId
              ? projectById.get(String(idea.projectId))
              : null
          ) ||
          projectByIdeaId.get(String(idea?.id)) ||
          null;

        if (linked) {
          return this.normalizeIdea({
            ...idea,
            status: AIW.LIFECYCLE.IDEA_STATUS.CONVERTED,
            ideaStatus: AIW.LIFECYCLE.IDEA_STATUS.CONVERTED,
            lifecycleStatus: AIW.LIFECYCLE.IDEA_STATUS.CONVERTED,
            projectId: linked.id,
            convertedToProject: true,
            conversion: {
              ...(idea.conversion || {}),
              converted: true,
              projectId: linked.id,
              convertedAt:
                idea.conversion?.convertedAt ||
                linked.createdAt ||
                this.now()
            }
          });
        }

        if (
          idea?.conversion?.converted ||
          idea?.projectId ||
          idea?.convertedToProject
        ) {
          const nextStatus =
            idea.approval?.status === "approved"
              ? AIW.LIFECYCLE.IDEA_STATUS.APPROVED
              : AIW.LIFECYCLE.IDEA_STATUS.IDEA;

          return this.normalizeIdea({
            ...idea,
            status: nextStatus,
            ideaStatus: nextStatus,
            lifecycleStatus: nextStatus,
            projectId: null,
            convertedToProject: false,
            conversion: {
              ...(idea.conversion || {}),
              converted: false,
              projectId: null
            }
          });
        }

        return this.normalizeIdea(idea);
      });

      return data;
    },

    calculateTasksProgress(tasks = []) {
      const list = this.toArray(tasks);
      if (!list.length) return 0;

      let totalWeight = 0;
      let weightedProgress = 0;

      list.forEach(task => {
        const weight = Math.max(1, this.toNumber(task?.weight, 1));
        const progress = this.clamp(
          task?.progress ??
          (
            this.normalizeText(task?.status) === "completed"
              ? 100
              : 0
          )
        );

        totalWeight += weight;
        weightedProgress += progress * weight;
      });

      return totalWeight
        ? Math.round(weightedProgress / totalWeight)
        : 0;
    },

    refreshPipelineStats(data = this._state) {
      if (!data) return null;

      const ideas = this.toArray(data.ideas).filter(
        item => !item?.deletedAt
      );

      const projects = this.toArray(data.projects).filter(
        item => !item?.deletedAt
      );

      const countIdea = status =>
        ideas.filter(
          idea =>
            this.normalizeIdeaStatus(
              idea.lifecycleStatus ??
              idea.ideaStatus ??
              idea.status
            ) === status
        ).length;

      const activeProjects = projects.filter(project => {
        const status = this.normalizeProjectStatus(
          project.projectStatus ??
          project.status
        );

        return ![
          AIW.LIFECYCLE.PROJECT_STATUS.COMPLETED,
          AIW.LIFECYCLE.PROJECT_STATUS.CANCELLED,
          AIW.LIFECYCLE.PROJECT_STATUS.ARCHIVED
        ].includes(status);
      });

      const completedProjects = projects.filter(
        project =>
          this.normalizeProjectStatus(
            project.projectStatus ??
            project.status
          ) === AIW.LIFECYCLE.PROJECT_STATUS.COMPLETED
      );

      const archivedProjects = projects.filter(
        project =>
          this.normalizeProjectStatus(
            project.projectStatus ??
            project.status
          ) === AIW.LIFECYCLE.PROJECT_STATUS.ARCHIVED
      );

      const convertedIdeas = countIdea(
        AIW.LIFECYCLE.IDEA_STATUS.CONVERTED
      );

      const pendingIdeas = countIdea(
        AIW.LIFECYCLE.IDEA_STATUS.PENDING_APPROVAL
      );

      data.pipeline = {
        totalIdeas: ideas.length,
        draftIdeas:
          countIdea(AIW.LIFECYCLE.IDEA_STATUS.DRAFT) +
          countIdea(AIW.LIFECYCLE.IDEA_STATUS.IDEA),
        submittedIdeas: pendingIdeas,
        pendingIdeas,
        pendingApproval: pendingIdeas,
        approvedIdeas: countIdea(
          AIW.LIFECYCLE.IDEA_STATUS.APPROVED
        ),
        rejectedIdeas: countIdea(
          AIW.LIFECYCLE.IDEA_STATUS.REJECTED
        ),
        convertedIdeas,
        totalProjects: projects.length,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        archivedProjects: archivedProjects.length,
        conversionRate:
          ideas.length
            ? Math.round((convertedIdeas / ideas.length) * 100)
            : 0,
        averageProjectProgress:
          projects.length
            ? Math.round(
                projects.reduce(
                  (sum, project) =>
                    sum +
                    this.clamp(project.progress ?? 0),
                  0
                ) / projects.length
              )
            : 0,
        updatedAt: this.now()
      };

      return data.pipeline;
    },

    syncCompatibilityModels(data = this._state) {
      if (!data) return;

      const center = this.normalizeAutomation(
        data.automationCenter ||
        data.automation
      );

      data.automationCenter = this.clone(center);
      data.automation = this.clone(center);

      data.summary = this.deepMerge(
        AIW.DEFAULT_DATA.summary,
        data.summary || {}
      );

      const pipeline = data.pipeline || {};

      data.summary.ideasCount = pipeline.totalIdeas || 0;
      data.summary.projectsCount = pipeline.totalProjects || 0;
      data.summary.pendingIdeasCount = pipeline.pendingApproval || 0;
      data.summary.approvedIdeasCount = pipeline.approvedIdeas || 0;
      data.summary.rejectedIdeasCount = pipeline.rejectedIdeas || 0;
      data.summary.convertedIdeasCount = pipeline.convertedIdeas || 0;
      data.summary.activeProjectsCount = pipeline.activeProjects || 0;
      data.summary.completedProjectsCount =
        pipeline.completedProjects || 0;

      data.summary.highPriorityIdeasCount = this.toArray(data.ideas).filter(
        idea =>
          ["عالية", "عالي", "high", "critical"].includes(
            this.normalizeText(idea.priority)
          ) &&
          !idea.deletedAt
      ).length;

      data.summary.departmentsCount =
        this.toArray(data.departments).length;

      data.summary.portfolioHealth =
        data.summary.portfolioHealth ??
        data.dashboard?.portfolioHealth ??
        68;

      data.summary.systemHealth =
        data.summary.systemHealth ??
        data.summary.portfolioHealth;

      data.summary.maturityScore =
        data.summary.maturityScore ??
        data.dashboard?.maturityScore ??
        34;

      data.summary.aiReadiness =
        data.summary.aiReadiness ??
        data.summary.maturityScore;
    },

    getState() {
      if (!this._initialized) this.init();
      return this.clone(this._state);
    },

    getData() {
      return this.getState();
    },

    get(path, fallback = undefined) {
      if (!this._initialized) this.init();
      if (!path) return this.getState();

      const value = this.getByPath(this._state, path);

      return value === undefined
        ? this.clone(fallback)
        : this.clone(value);
    },

    has(path) {
      if (!this._initialized) this.init();
      return this.getByPath(this._state, path) !== undefined;
    },

    set(path, value, options = {}) {
      if (!this._initialized) this.init();

      if (this.isPlainObject(path) && arguments.length === 1) {
        return this.replaceState(path);
      }

      const next = this.clone(this._state);
      this.setByPath(next, path, value);

      return this.commit(next, {
        eventName:
          options.eventName ||
          options.event ||
          "aiw:dataChanged",
        activity: options.activity || null,
        backup: options.backup !== false,
        notify: options.notify !== false
      });
    },

    update(path, value, options = {}) {
      if (
        typeof path === "string" &&
        arguments.length >= 2
      ) {
        return this.set(path, value, {
          ...options,
          eventName:
            options.eventName ||
            options.event ||
            "aiw:dataUpdated"
        });
      }

      if (this.isPlainObject(path)) {
        return this.updateState(path, value || {});
      }

      return this.getState();
    },

    updateState(updater, options = {}) {
      if (!this._initialized) this.init();

      let next;

      if (typeof updater === "function") {
        const draft = this.clone(this._state);
        const result = updater(draft);

        next =
          result && typeof result === "object"
            ? result
            : draft;
      } else if (this.isPlainObject(updater)) {
        next = this.deepMerge(this._state, updater);
      } else {
        return this.getState();
      }

      return this.commit(next, {
        eventName:
          options.eventName ||
          options.event ||
          "aiw:dataUpdated",
        activity: options.activity || null,
        backup: options.backup !== false,
        notify: options.notify !== false
      });
    },

    patch(pathOrPatch, valueOrOptions = {}, maybeOptions = {}) {
      if (typeof pathOrPatch === "string") {
        const current = this.get(pathOrPatch);

        const nextValue =
          this.isPlainObject(current) &&
          this.isPlainObject(valueOrOptions)
            ? this.deepMerge(current, valueOrOptions)
            : valueOrOptions;

        return this.set(pathOrPatch, nextValue, {
          ...maybeOptions,
          eventName:
            maybeOptions.eventName ||
            maybeOptions.event ||
            "aiw:storeUpdated"
        });
      }

      const options = this.isPlainObject(valueOrOptions)
        ? valueOrOptions
        : {};

      return this.updateState(pathOrPatch, {
        ...options,
        eventName:
          options.eventName ||
          options.event ||
          "aiw:storeUpdated"
      });
    },

    replaceState(data, options = {}) {
      const next = this.normalizeData(
        this.mergeDefaults(
          AIW.DEFAULT_DATA,
          data || {}
        )
      );

      return this.commit(next, {
        eventName:
          options.eventName ||
          options.event ||
          "aiw:dataReplaced",
        activity: options.activity || null,
        backup: options.backup !== false,
        notify: options.notify !== false
      });
    },

    saveData(data, eventName = "aiw:dataChanged") {
      return this.replaceState(data || {}, { eventName });
    },

    commit(nextState, options = {}) {
      const normalized = this.normalizeData(
        this.mergeDefaults(
          AIW.DEFAULT_DATA,
          nextState || {}
        )
      );

      this.ensureMetadata(normalized);
      this.repairIdeaProjectLinks(normalized);
      this.refreshPipelineStats(normalized);
      this.syncCompatibilityModels(normalized);

      const timestamp = this.now();

      normalized.meta.updatedAt = timestamp;
      normalized.meta.lastSync = timestamp;

      if (
        options.activity &&
        this.getSettings().activityLogging
      ) {
        this.addActivity(normalized, options.activity);
      }

      this._state = normalized;

      this.persistState({
        emit: false,
        backup: options.backup !== false,
        notify: false
      });

      this.syncGlobalDataReference();

      const eventName =
        options.eventName ||
        "aiw:dataChanged";

      const state = this.getState();

      this.emit(eventName, state);

      if (eventName !== "aiw:dataChanged") {
        this.emit("aiw:dataChanged", {
          sourceEvent: eventName,
          data: state
        });
      }

      this.emit("aiw:storeChanged", {
        sourceEvent: eventName,
        data: state
      });

      if (options.notify !== false) {
        this.notifySubscribers({
          type: eventName,
          data: state
        });
      }

      return state;
    },

    persistState(options = {}) {
      if (!this._state) return false;

      const written = this.write(
        AIW.KEYS.DATA,
        this._state
      );

      if (
        written &&
        options.backup !== false &&
        this.getSettings().autoBackup
      ) {
        this.backup(this._state, {
          emit: false
        });
      }

      if (options.emit !== false) {
        this.emit(
          "aiw:dataPersisted",
          this.getState()
        );
      }

      if (options.notify !== false) {
        this.notifySubscribers({
          type: "persist",
          data: this.getState()
        });
      }

      return written;
    },

    syncGlobalDataReference() {
      if (this._state) {
        AIW.Data = this.clone(this._state);
      }
    },

    getSettings() {
      if (!this._initialized) this.init();

      if (!this._settings) {
        this._settings = this.mergeDefaults(
          AIW.DEFAULT_SETTINGS,
          this.read(AIW.KEYS.SETTINGS, {})
        );
      }

      return this.clone(this._settings);
    },

    saveSettings(settings = {}, eventName = "aiw:settingsChanged") {
      if (!this._initialized) this.init();

      this._settings = this.mergeDefaults(
        AIW.DEFAULT_SETTINGS,
        settings
      );

      this.persistSettings({
        emit: false,
        notify: false
      });

      this.emit(eventName, this.getSettings());

      this.notifySubscribers({
        type: eventName,
        settings: this.getSettings()
      });

      return this.getSettings();
    },

    updateSettings(updates = {}) {
      return this.saveSettings(
        this.deepMerge(
          this.getSettings(),
          updates
        ),
        "aiw:settingsUpdated"
      );
    },

    setSetting(key, value) {
      const settings = this.getSettings();
      this.setByPath(settings, key, value);

      return this.saveSettings(
        settings,
        "aiw:settingsUpdated"
      );
    },

    getSetting(key, fallback = undefined) {
      const value = this.getByPath(
        this.getSettings(),
        key
      );

      return value === undefined
        ? this.clone(fallback)
        : this.clone(value);
    },

    persistSettings(options = {}) {
      if (!this._settings) return false;

      const written = this.write(
        AIW.KEYS.SETTINGS,
        this._settings
      );

      if (options.emit !== false) {
        this.emit(
          "aiw:settingsPersisted",
          this.getSettings()
        );
      }

      if (options.notify !== false) {
        this.notifySubscribers({
          type: "settingsPersisted",
          settings: this.getSettings()
        });
      }

      return written;
    },

    getMetadata() {
      return this.get("meta", {});
    },

    setMetadata(metadata = {}) {
      return this.set(
        "meta",
        this.deepMerge(
          this.getMetadata(),
          metadata
        ),
        {
          eventName: "aiw:metadataChanged",
          backup: false
        }
      );
    },

    updateMetadata(metadata = {}) {
      return this.setMetadata(metadata);
    },

    touchMetadata(extra = {}) {
      return this.setMetadata({
        updatedAt: this.now(),
        lastSync: this.now(),
        ...extra
      });
    },

    getCollectionPath(collection) {
      const aliases = {
        workflows: "automationCenter.workflows",
        triggers: "automationCenter.triggers",
        approvals: "automationCenter.approvals",
        automationRoadmap: "automationCenter.roadmap",
        executionHistory: "automationCenter.executionHistory"
      };

      return aliases[collection] || collection;
    },

    getAllCollection(collection) {
      return this.toArray(
        this.get(
          this.getCollectionPath(collection),
          []
        )
      );
    },

    getCollection(collection) {
      return this.getAllCollection(collection).filter(
        item => !item?.deletedAt
      );
    },

    setCollection(collection, items = [], options = {}) {
      const path = this.getCollectionPath(collection);

      this.set(
        path,
        Array.isArray(items) ? items : [],
        {
          eventName:
            options.eventName ||
            options.event ||
            "aiw:collectionChanged",
          activity:
            options.activity || {
              type: "collection-set",
              collection,
              title: `تحديث مجموعة ${collection}`
            },
          backup: options.backup !== false,
          notify: options.notify !== false
        }
      );

      return this.getCollection(collection);
    },

    add(collection, item = {}) {
      const path = this.getCollectionPath(collection);
      const items = this.getAllCollection(collection);
      const timestamp = this.now();

      let record = {
        id: item.id || this.id(collection),
        title: item.title || item.name || "عنصر جديد",
        status: item.status || "new",
        priority: item.priority || "medium",
        createdAt: item.createdAt || timestamp,
        updatedAt: timestamp,
        deletedAt: null,
        ...this.clone(item)
      };

      if (collection === "ideas") {
        record = this.normalizeIdea(record, items.length);
      } else if (collection === "projects") {
        record = this.normalizeProject(record, items.length);
      }

      items.unshift(record);

      this.set(path, items, {
        eventName: "aiw:itemCreated",
        activity: {
          type: "create",
          collection,
          title:
            record.title ||
            record.name ||
            "إنشاء عنصر",
          refId: record.id
        }
      });

      this.emit("aiw:itemCreated", {
        collection,
        item: this.clone(record)
      });

      return this.clone(record);
    },

    updateItem(collection, id, updates = {}) {
      const path = this.getCollectionPath(collection);
      const items = this.getAllCollection(collection);
      let updatedItem = null;

      const nextItems = items.map((item, index) => {
        if (String(item?.id) !== String(id)) {
          return item;
        }

        const merged = {
          ...item,
          ...this.clone(updates),
          id: item.id,
          updatedAt: this.now()
        };

        updatedItem =
          collection === "ideas"
            ? this.normalizeIdea(merged, index)
            : collection === "projects"
              ? this.normalizeProject(merged, index)
              : merged;

        return updatedItem;
      });

      if (!updatedItem) return null;

      this.set(path, nextItems, {
        eventName: "aiw:itemUpdated",
        activity: {
          type: "update",
          collection,
          title:
            updatedItem.title ||
            updatedItem.name ||
            "تحديث عنصر",
          refId: id
        }
      });

      this.emit("aiw:itemUpdated", {
        collection,
        item: this.clone(updatedItem)
      });

      return this.clone(updatedItem);
    },

    remove(collection, id, hardDelete = false) {
      const path = this.getCollectionPath(collection);
      const items = this.getAllCollection(collection);
      const existing = items.find(
        item => String(item?.id) === String(id)
      );

      if (!existing) return false;

      const hard =
        hardDelete ||
        !this.getSettings().softDelete;

      const timestamp = this.now();

      const nextItems = hard
        ? items.filter(
            item => String(item?.id) !== String(id)
          )
        : items.map(item =>
            String(item?.id) === String(id)
              ? {
                  ...item,
                  deletedAt: timestamp,
                  updatedAt: timestamp
                }
              : item
          );

      this.set(path, nextItems, {
        eventName: "aiw:itemDeleted",
        activity: {
          type: "delete",
          collection,
          title:
            existing.title ||
            existing.name ||
            "حذف عنصر",
          refId: id,
          hardDelete: hard
        }
      });

      this.emit("aiw:itemDeleted", {
        collection,
        id,
        hardDelete: hard
      });

      return true;
    },

    restoreItem(collection, id) {
      const path = this.getCollectionPath(collection);
      const items = this.getAllCollection(collection);
      let restored = null;

      const nextItems = items.map(item => {
        if (String(item?.id) !== String(id)) {
          return item;
        }

        restored = {
          ...item,
          deletedAt: null,
          updatedAt: this.now()
        };

        return restored;
      });

      if (!restored) return null;

      this.set(path, nextItems, {
        eventName: "aiw:itemRestored",
        activity: {
          type: "restore",
          collection,
          title:
            restored.title ||
            restored.name ||
            "استعادة عنصر",
          refId: id
        }
      });

      return this.clone(restored);
    },

    find(collection, id) {
      return (
        this.getCollection(collection).find(
          item => String(item?.id) === String(id)
        ) || null
      );
    },

    filter(collection, predicate) {
      const items = this.getCollection(collection);

      return typeof predicate === "function"
        ? items.filter(predicate)
        : items;
    },

    count(collection) {
      return this.getCollection(collection).length;
    },

    getIdeas(options = {}) {
      let ideas = this.getCollection("ideas");

      if (
        options.status &&
        options.status !== "all"
      ) {
        ideas = ideas.filter(
          idea =>
            this.normalizeIdeaStatus(
              idea.lifecycleStatus ??
              idea.ideaStatus ??
              idea.status
            ) === this.normalizeIdeaStatus(options.status)
        );
      }

      if (options.converted === true) {
        ideas = ideas.filter(
          idea => Boolean(idea.conversion?.converted)
        );
      }

      if (options.converted === false) {
        ideas = ideas.filter(
          idea => !idea.conversion?.converted
        );
      }

      return ideas;
    },

    getIdea(ideaId) {
      return this.find("ideas", ideaId);
    },

    addIdea(item = {}) {
      return this.createIdea(item);
    },

    createIdea(item = {}) {
      const timestamp = this.now();

      const idea = this.normalizeIdea({
        ...item,
        id: item.id || this.id("idea"),
        status:
          item.lifecycleStatus ||
          item.ideaStatus ||
          item.status ||
          AIW.LIFECYCLE.IDEA_STATUS.IDEA,
        createdAt: item.createdAt || timestamp,
        updatedAt: timestamp
      });

      return this.add("ideas", idea);
    },

    updateIdea(ideaId, updates = {}) {
      const result = this.updateItem(
        "ideas",
        ideaId,
        updates
      );

      if (result) {
        this.emit("aiw:ideaUpdated", {
          idea: this.clone(result)
        });

        this.emit("aiw:ideasUpdated", {
          idea: this.clone(result),
          action: "updated"
        });
      }

      return result;
    },

    removeIdea(ideaId, hardDelete = false) {
      const result = this.remove(
        "ideas",
        ideaId,
        hardDelete
      );

      if (result) {
        this.emit("aiw:ideasUpdated", {
          ideaId,
          action: "removed"
        });
      }

      return result;
    },

    addIdeaHistory(idea, entry = {}) {
      const history = this.toArray(idea.lifecycleHistory);

      history.unshift({
        id: entry.id || this.id("idea-history"),
        action: entry.action || "updated",
        fromStatus: entry.fromStatus || null,
        toStatus: entry.toStatus || null,
        note: entry.note || entry.notes || "",
        actor: entry.actor || null,
        createdAt: entry.createdAt || this.now(),
        ...this.clone(entry)
      });

      return history.slice(0, 200);
    },

    submitIdeaForApproval(ideaId, options = {}, legacyNote = null) {
      if (!this.isPlainObject(options)) {
        options = {
          actor: options || null,
          notes: legacyNote || ""
        };
      }

      const idea = this.getIdea(ideaId);

      if (!idea) {
        return {
          success: false,
          reason: "idea-not-found",
          message: "لم يتم العثور على الفكرة."
        };
      }

      if (idea.conversion?.converted) {
        return {
          success: false,
          reason: "already-converted",
          message: "الفكرة محولة إلى مشروع بالفعل."
        };
      }

      const timestamp = this.now();
      const actor =
        options.submittedBy ||
        options.actor ||
        null;

      const note =
        options.notes ??
        options.note ??
        "";

      const history = this.addIdeaHistory(idea, {
        action: "submitted-for-approval",
        fromStatus: idea.lifecycleStatus,
        toStatus: AIW.LIFECYCLE.IDEA_STATUS.PENDING_APPROVAL,
        actor,
        note
      });

      const updated = this.updateIdea(ideaId, {
        status: AIW.LIFECYCLE.IDEA_STATUS.PENDING_APPROVAL,
        ideaStatus: AIW.LIFECYCLE.IDEA_STATUS.PENDING_APPROVAL,
        lifecycleStatus: AIW.LIFECYCLE.IDEA_STATUS.PENDING_APPROVAL,
        approval: {
          ...(idea.approval || {}),
          required: true,
          status: "pending",
          submittedAt: timestamp,
          submittedBy: actor,
          decidedAt: null,
          decidedBy: null,
          decision: null,
          reason: null,
          note
        },
        lifecycleHistory: history
      });

      this.addApprovalRecord({
        ideaId,
        type: "idea-approval",
        status: "pending",
        title: updated?.title || idea.title,
        submittedAt: timestamp,
        submittedBy: actor,
        note
      });

      this.recordExecution({
        entityType: "idea",
        entityId: ideaId,
        action: "submitted-for-approval",
        status: "pending",
        actor
      });

      this.emit("aiw:ideaSubmittedForApproval", {
        idea: this.clone(updated)
      });

      this.emit("aiw:ideaSubmitted", {
        idea: this.clone(updated)
      });

      return {
        success: true,
        idea: updated
      };
    },

    submitIdea(ideaId, options = {}, legacyNote = null) {
      return this.submitIdeaForApproval(
        ideaId,
        options,
        legacyNote
      );
    },

    approveIdea(ideaId, options = {}, legacyNote = null) {
      if (!this.isPlainObject(options)) {
        options = {
          actor: options || null,
          notes: legacyNote || ""
        };
      }

      const idea = this.getIdea(ideaId);

      if (!idea) {
        return {
          success: false,
          reason: "idea-not-found",
          message: "لم يتم العثور على الفكرة."
        };
      }

      if (idea.conversion?.converted) {
        return {
          success: false,
          reason: "already-converted",
          message: "الفكرة محولة إلى مشروع بالفعل."
        };
      }

      const timestamp = this.now();
      const actor =
        options.approvedBy ||
        options.actor ||
        null;

      const note =
        options.notes ??
        options.note ??
        "";

      const history = this.addIdeaHistory(idea, {
        action: "approved",
        fromStatus: idea.lifecycleStatus,
        toStatus: AIW.LIFECYCLE.IDEA_STATUS.APPROVED,
        actor,
        note
      });

      const updated = this.updateIdea(ideaId, {
        status: AIW.LIFECYCLE.IDEA_STATUS.APPROVED,
        ideaStatus: AIW.LIFECYCLE.IDEA_STATUS.APPROVED,
        lifecycleStatus: AIW.LIFECYCLE.IDEA_STATUS.APPROVED,
        approval: {
          ...(idea.approval || {}),
          required: true,
          status: "approved",
          decidedAt: timestamp,
          decidedBy: actor,
          decision: "approved",
          reason: null,
          note
        },
        lifecycleHistory: history
      });

      this.resolveApprovalRecord(ideaId, {
        status: "approved",
        decidedAt: timestamp,
        decidedBy: actor,
        note
      });

      this.recordExecution({
        entityType: "idea",
        entityId: ideaId,
        action: "approved",
        status: "approved",
        actor
      });

      this.emit("aiw:ideaApproved", {
        idea: this.clone(updated)
      });

      if (options.convertToProject === true) {
        return this.convertIdeaToProject(ideaId, {
          ...options,
          actor,
          notes: note
        });
      }

      return {
        success: true,
        idea: updated
      };
    },

    rejectIdea(ideaId, options = {}, legacyReason = null) {
      if (!this.isPlainObject(options)) {
        options = {
          actor: options || null,
          reason: legacyReason || ""
        };
      }

      const idea = this.getIdea(ideaId);

      if (!idea) {
        return {
          success: false,
          reason: "idea-not-found",
          message: "لم يتم العثور على الفكرة."
        };
      }

      if (idea.conversion?.converted) {
        return {
          success: false,
          reason: "already-converted",
          message: "لا يمكن رفض فكرة محولة إلى مشروع."
        };
      }

      const timestamp = this.now();
      const actor =
        options.rejectedBy ||
        options.actor ||
        null;

      const note =
        options.reason ??
        options.notes ??
        options.note ??
        "";

      const history = this.addIdeaHistory(idea, {
        action: "rejected",
        fromStatus: idea.lifecycleStatus,
        toStatus: AIW.LIFECYCLE.IDEA_STATUS.REJECTED,
        actor,
        note
      });

      const updated = this.updateIdea(ideaId, {
        status: AIW.LIFECYCLE.IDEA_STATUS.REJECTED,
        ideaStatus: AIW.LIFECYCLE.IDEA_STATUS.REJECTED,
        lifecycleStatus: AIW.LIFECYCLE.IDEA_STATUS.REJECTED,
        approval: {
          ...(idea.approval || {}),
          required: true,
          status: "rejected",
          decidedAt: timestamp,
          decidedBy: actor,
          decision: "rejected",
          reason: note || null,
          note
        },
        lifecycleHistory: history
      });

      this.resolveApprovalRecord(ideaId, {
        status: "rejected",
        decidedAt: timestamp,
        decidedBy: actor,
        note
      });

      this.recordExecution({
        entityType: "idea",
        entityId: ideaId,
        action: "rejected",
        status: "rejected",
        actor
      });

      this.emit("aiw:ideaRejected", {
        idea: this.clone(updated)
      });

      return {
        success: true,
        idea: updated
      };
    },

    reopenIdea(ideaId, options = {}, legacyNote = null) {
      if (!this.isPlainObject(options)) {
        options = {
          actor: options || null,
          notes: legacyNote || ""
        };
      }

      const idea = this.getIdea(ideaId);

      if (!idea) {
        return {
          success: false,
          reason: "idea-not-found",
          message: "لم يتم العثور على الفكرة."
        };
      }

      if (idea.conversion?.converted) {
        return {
          success: false,
          reason: "already-converted",
          message: "لا يمكن إعادة فتح فكرة مرتبطة بمشروع نشط."
        };
      }

      const actor = options.actor || null;
      const note =
        options.notes ??
        options.note ??
        "";

      const history = this.addIdeaHistory(idea, {
        action: "reopened",
        fromStatus: idea.lifecycleStatus,
        toStatus: AIW.LIFECYCLE.IDEA_STATUS.IDEA,
        actor,
        note
      });

      const updated = this.updateIdea(ideaId, {
        status: AIW.LIFECYCLE.IDEA_STATUS.IDEA,
        ideaStatus: AIW.LIFECYCLE.IDEA_STATUS.IDEA,
        lifecycleStatus: AIW.LIFECYCLE.IDEA_STATUS.IDEA,
        approval: {
          ...(idea.approval || {}),
          status: "not-submitted",
          decision: null,
          reason: null,
          decidedAt: null,
          decidedBy: null,
          note
        },
        lifecycleHistory: history
      });

      this.recordExecution({
        entityType: "idea",
        entityId: ideaId,
        action: "reopened",
        status: "idea",
        actor
      });

      this.emit("aiw:ideaReopened", {
        idea: this.clone(updated)
      });

      return {
        success: true,
        idea: updated
      };
    },

    getProjectByIdeaId(ideaId) {
      return (
        this.getCollection("projects").find(project => {
          const sourceIdeaId = this.getProjectSourceIdeaId(project);

          return String(sourceIdeaId) === String(ideaId);
        }) || null
      );
    },

    createProjectFromIdea(ideaId, options = {}) {
      return this.convertIdeaToProject(ideaId, options);
    },

    approveAndCreateProject(ideaId, options = {}) {
      const existing = this.getProjectByIdeaId(ideaId);

      if (existing) {
        return {
          success: false,
          reason: "already-converted",
          message: "تم تحويل هذه الفكرة إلى مشروع مسبقاً.",
          project: existing
        };
      }

      const idea = this.getIdea(ideaId);

      if (!idea) {
        return {
          success: false,
          reason: "idea-not-found",
          message: "لم يتم العثور على الفكرة."
        };
      }

      let approvedIdea = idea;

      if (
        this.normalizeIdeaStatus(idea.lifecycleStatus) !==
        AIW.LIFECYCLE.IDEA_STATUS.APPROVED
      ) {
        const approval = this.approveIdea(ideaId, {
          actor:
            options.approvedBy ||
            options.actor ||
            null,
          notes:
            options.approvalNotes ??
            options.notes ??
            ""
        });

        if (!approval.success) return approval;
        approvedIdea = approval.idea;
      }

      return this.convertIdeaToProject(approvedIdea.id, {
        ...options,
        requireApproval: true,
        actor:
          options.convertedBy ||
          options.actor ||
          null,
        notes:
          options.notes ??
          options.approvalNotes ??
          "",
        projectData:
          options.projectData ||
          options.project ||
          {}
      });
    },

    convertIdeaToProject(ideaId, options = {}) {
      const idea = this.getIdea(ideaId);

      if (!idea) {
        return {
          success: false,
          reason: "idea-not-found",
          message: "لم يتم العثور على الفكرة."
        };
      }

      const existing = this.getProjectByIdeaId(ideaId);

      if (
        idea.conversion?.converted ||
        existing
      ) {
        return {
          success: false,
          reason: "already-converted",
          message: "تم تحويل هذه الفكرة إلى مشروع مسبقاً.",
          project:
            existing ||
            (
              idea.conversion?.projectId
                ? this.getProject(idea.conversion.projectId)
                : null
            )
        };
      }

      const workflow =
        this.getSettings().ideaProjectWorkflow ||
        {};

      const requireApproval =
        options.requireApproval !== undefined
          ? Boolean(options.requireApproval)
          : workflow.requireApproval !== false;

      const isApproved =
        idea.approval?.status === "approved" ||
        this.normalizeIdeaStatus(idea.lifecycleStatus) ===
          AIW.LIFECYCLE.IDEA_STATUS.APPROVED;

      if (
        requireApproval &&
        !isApproved &&
        options.force !== true
      ) {
        return {
          success: false,
          reason: "approval-required",
          message: "يجب اعتماد الفكرة قبل تحويلها إلى مشروع.",
          idea
        };
      }

      const timestamp = this.now();
      const actor =
        options.convertedBy ||
        options.actor ||
        null;

      const note =
        options.notes ??
        options.note ??
        "";

      const blueprint = this.deepMerge(
        this.getDefaultProjectBlueprint(idea),
        idea.projectBlueprint || {}
      );

      const projectData =
        options.projectData ||
        options.project ||
        {};

      const projectId =
        options.projectId ||
        this.id("project");

      const project = this.normalizeProject({
        ...blueprint,
        ...this.clone(projectData),

        id: projectId,
        sourceIdeaId: idea.id,
        ideaId: idea.id,

        origin: {
          type: "idea",
          ideaId: idea.id
        },

        createdFromIdea: true,

        title:
          options.title ||
          projectData.title ||
          blueprint.title ||
          idea.title,

        titleEn:
          options.titleEn ||
          projectData.titleEn ||
          projectData.englishTitle ||
          blueprint.titleEn ||
          idea.titleEn ||
          "",

        englishTitle:
          options.titleEn ||
          projectData.englishTitle ||
          projectData.titleEn ||
          blueprint.englishTitle ||
          idea.englishTitle ||
          "",

        status: AIW.LIFECYCLE.PROJECT_STATUS.PLANNING,
        projectStatus: AIW.LIFECYCLE.PROJECT_STATUS.PLANNING,
        progress: 0,
        currentPhase: "discovery",
        approvalSnapshot: this.clone(idea.approval || {}),

        lifecycleHistory: [
          {
            id: this.id("project-history"),
            action: "project-created",
            fromStatus: null,
            toStatus: AIW.LIFECYCLE.PROJECT_STATUS.PLANNING,
            sourceIdeaId: idea.id,
            actor,
            note,
            createdAt: timestamp
          }
        ],

        createdAt: timestamp,
        updatedAt: timestamp,
        deletedAt: null
      });

      const state = this.getState();

      state.projects.unshift(project);

      state.ideas = state.ideas.map(currentIdea => {
        if (String(currentIdea?.id) !== String(ideaId)) {
          return currentIdea;
        }

        const history = this.addIdeaHistory(currentIdea, {
          action: "converted-to-project",
          fromStatus: currentIdea.lifecycleStatus,
          toStatus: AIW.LIFECYCLE.IDEA_STATUS.CONVERTED,
          projectId,
          actor,
          note
        });

        return this.normalizeIdea({
          ...currentIdea,
          status: AIW.LIFECYCLE.IDEA_STATUS.CONVERTED,
          ideaStatus: AIW.LIFECYCLE.IDEA_STATUS.CONVERTED,
          lifecycleStatus: AIW.LIFECYCLE.IDEA_STATUS.CONVERTED,
          projectId,
          convertedToProject: true,
          conversion: {
            ...(currentIdea.conversion || {}),
            converted: true,
            projectId,
            convertedAt: timestamp,
            convertedBy: actor,
            revertedAt: null,
            revertedBy: null
          },
          lifecycleHistory: history,
          updatedAt: timestamp
        });
      });

      this.addActivity(state, {
        type: "idea-to-project",
        collection: "projects",
        title: `تحويل الفكرة إلى مشروع: ${project.title}`,
        refId: project.id,
        sourceIdeaId: idea.id
      });

      state.automationCenter = this.normalizeAutomation(
        state.automationCenter
      );

      state.automationCenter.executionHistory.unshift({
        id: this.id("execution"),
        entityType: "project",
        entityId: project.id,
        projectId: project.id,
        sourceIdeaId: idea.id,
        action: "project-created",
        status: AIW.LIFECYCLE.PROJECT_STATUS.PLANNING,
        actor,
        createdAt: timestamp
      });

      state.automation = this.clone(state.automationCenter);

      this.commit(state, {
        eventName: "aiw:ideaConvertedToProject",
        backup: true
      });

      const createdProject = this.getProject(projectId);
      const convertedIdea = this.getIdea(ideaId);

      this.emit("aiw:projectCreatedFromIdea", {
        idea: this.clone(convertedIdea),
        project: this.clone(createdProject)
      });

      this.emit("aiw:projectsUpdated", {
        project: this.clone(createdProject),
        action: "created-from-idea"
      });

      return {
        success: true,
        idea: convertedIdea,
        project: createdProject
      };
    },

    getProjects(options = {}) {
      let projects = this.getCollection("projects");

      if (options.includeArchived !== true) {
        projects = projects.filter(
          project =>
            this.normalizeProjectStatus(
              project.projectStatus ??
              project.status
            ) !== AIW.LIFECYCLE.PROJECT_STATUS.ARCHIVED
        );
      }

      if (
        options.status &&
        options.status !== "all"
      ) {
        projects = projects.filter(
          project =>
            this.normalizeProjectStatus(
              project.projectStatus ??
              project.status
            ) === this.normalizeProjectStatus(options.status)
        );
      }

      if (options.sourceIdeaId) {
        projects = projects.filter(
          project =>
            String(this.getProjectSourceIdeaId(project)) ===
            String(options.sourceIdeaId)
        );
      }

      return projects;
    },

    getProject(projectId) {
      return this.find("projects", projectId);
    },

    addProject(item = {}) {
      return this.createManualProject(item);
    },

    createManualProject(item = {}) {
      const project = this.normalizeProject({
        ...item,
        id: item.id || this.id("project"),
        sourceIdeaId: item.sourceIdeaId || null,
        origin:
          item.origin ||
          {
            type: "manual",
            ideaId: null
          },
        status:
          item.projectStatus ||
          item.status ||
          AIW.LIFECYCLE.PROJECT_STATUS.PLANNING,
        projectStatus:
          item.projectStatus ||
          item.status ||
          AIW.LIFECYCLE.PROJECT_STATUS.PLANNING,
        progress: item.progress ?? 0
      });

      return this.add("projects", project);
    },

    updateProject(projectId, updates = {}) {
      const project = this.getProject(projectId);
      if (!project) return null;

      const merged = {
        ...project,
        ...this.clone(updates)
      };

      if (merged.tasks) {
        merged.tasks = this.toArray(merged.tasks).map(
          (task, index) => this.normalizeTask(task, index)
        );

        if (
          this.getSettings().ideaProjectWorkflow
            ?.calculateProgressFromTasks !== false &&
          merged.tasks.length
        ) {
          merged.progress = this.calculateTasksProgress(
            merged.tasks
          );
        }
      }

      const result = this.updateItem(
        "projects",
        projectId,
        merged
      );

      if (result) {
        this.emit("aiw:projectUpdated", {
          project: this.clone(result)
        });

        this.emit("aiw:projectsUpdated", {
          project: this.clone(result),
          action: "updated"
        });
      }

      return result;
    },

    removeProject(projectId, hardDelete = false) {
      const project = this.getProject(projectId);

      const result = this.remove(
        "projects",
        projectId,
        hardDelete
      );

      if (
        result &&
        project?.sourceIdeaId
      ) {
        const idea = this.getIdea(project.sourceIdeaId);

        if (idea) {
          const nextStatus =
            idea.approval?.status === "approved"
              ? AIW.LIFECYCLE.IDEA_STATUS.APPROVED
              : AIW.LIFECYCLE.IDEA_STATUS.IDEA;

          this.updateIdea(idea.id, {
            status: nextStatus,
            ideaStatus: nextStatus,
            lifecycleStatus: nextStatus,
            projectId: null,
            convertedToProject: false,
            conversion: {
              ...(idea.conversion || {}),
              converted: false,
              projectId: null,
              revertedAt: this.now(),
              revertedBy: null
            }
          });
        }
      }

      if (result) {
        this.emit("aiw:projectsUpdated", {
          projectId,
          action: "removed"
        });
      }

      return result;
    },

    addProjectTask(projectId, task = {}) {
      const project = this.getProject(projectId);

      if (!project) {
        return {
          success: false,
          reason: "project-not-found",
          message: "لم يتم العثور على المشروع."
        };
      }

      const taskRecord = this.normalizeTask(
        {
          ...task,
          id: task.id || this.id("task")
        },
        project.tasks?.length || 0
      );

      const tasks = [
        ...this.toArray(project.tasks),
        taskRecord
      ];

      const updated = this.updateProject(projectId, {
        tasks,
        progress: this.calculateTasksProgress(tasks)
      });

      this.emit("aiw:projectTaskCreated", {
        project: this.clone(updated),
        task: this.clone(taskRecord)
      });

      return {
        success: true,
        project: updated,
        task: taskRecord
      };
    },

    updateProjectTask(projectId, taskId, updates = {}) {
      const project = this.getProject(projectId);

      if (!project) {
        return {
          success: false,
          reason: "project-not-found",
          message: "لم يتم العثور على المشروع."
        };
      }

      let updatedTask = null;

      const tasks = this.toArray(project.tasks).map((task, index) => {
        if (String(task?.id) !== String(taskId)) return task;

        updatedTask = this.normalizeTask(
          {
            ...task,
            ...this.clone(updates),
            id: task.id,
            updatedAt: this.now()
          },
          index
        );

        return updatedTask;
      });

      if (!updatedTask) {
        return {
          success: false,
          reason: "task-not-found",
          message: "لم يتم العثور على المهمة."
        };
      }

      const updatedProject = this.updateProject(projectId, {
        tasks,
        progress: this.calculateTasksProgress(tasks)
      });

      this.emit("aiw:projectTaskUpdated", {
        project: this.clone(updatedProject),
        task: this.clone(updatedTask)
      });

      return {
        success: true,
        project: updatedProject,
        task: updatedTask
      };
    },

    removeProjectTask(projectId, taskId) {
      const project = this.getProject(projectId);

      if (!project) {
        return {
          success: false,
          reason: "project-not-found",
          message: "لم يتم العثور على المشروع."
        };
      }

      const original = this.toArray(project.tasks);
      const tasks = original.filter(
        task => String(task?.id) !== String(taskId)
      );

      if (tasks.length === original.length) {
        return {
          success: false,
          reason: "task-not-found",
          message: "لم يتم العثور على المهمة."
        };
      }

      const updatedProject = this.updateProject(projectId, {
        tasks,
        progress: this.calculateTasksProgress(tasks)
      });

      this.emit("aiw:projectTaskDeleted", {
        project: this.clone(updatedProject),
        taskId
      });

      return {
        success: true,
        project: updatedProject
      };
    },

    addApprovalRecord(approval = {}) {
      const approvals = this.getAllCollection("approvals");

      const existingIndex = approvals.findIndex(
        item =>
          String(item?.ideaId) === String(approval.ideaId) &&
          item?.status === "pending"
      );

      const record = {
        id: approval.id || this.id("approval"),
        type: approval.type || "idea-approval",
        ideaId: approval.ideaId || null,
        projectId: approval.projectId || null,
        title: approval.title || "طلب اعتماد",
        owner: approval.owner || "الإدارة",
        risk: approval.risk || "متوسط",
        status: approval.status || "pending",
        submittedAt: approval.submittedAt || this.now(),
        submittedBy: approval.submittedBy || null,
        decidedAt: approval.decidedAt || null,
        decidedBy: approval.decidedBy || null,
        note: approval.note || approval.notes || "",
        createdAt: approval.createdAt || this.now(),
        updatedAt: this.now()
      };

      if (existingIndex >= 0) {
        approvals[existingIndex] = {
          ...approvals[existingIndex],
          ...record,
          id: approvals[existingIndex].id
        };
      } else {
        approvals.unshift(record);
      }

      this.set("automationCenter.approvals", approvals, {
        eventName: "aiw:approvalCreated",
        activity: {
          type: "approval-created",
          collection: "approvals",
          title: record.title,
          refId: record.id
        }
      });

      return this.clone(record);
    },

    resolveApprovalRecord(ideaId, decision = {}) {
      const approvals = this.getAllCollection("approvals");
      let resolved = null;

      const next = approvals.map(item => {
        if (
          String(item?.ideaId) !== String(ideaId) ||
          item?.status !== "pending"
        ) {
          return item;
        }

        resolved = {
          ...item,
          status: decision.status || "approved",
          decidedAt: decision.decidedAt || this.now(),
          decidedBy: decision.decidedBy || null,
          note: decision.note ?? item.note ?? "",
          updatedAt: this.now()
        };

        return resolved;
      });

      if (!resolved) return null;

      this.set("automationCenter.approvals", next, {
        eventName: "aiw:approvalResolved",
        activity: {
          type: "approval-resolved",
          collection: "approvals",
          title: resolved.title || "اعتماد فكرة",
          refId: resolved.id
        }
      });

      return this.clone(resolved);
    },

    recordExecution(entry = {}) {
      const history = this.getAllCollection("executionHistory");

      const record = {
        id: entry.id || this.id("execution"),
        workflowId: entry.workflowId || null,
        entityType: entry.entityType || "system",
        entityId: entry.entityId || null,
        sourceIdeaId: entry.sourceIdeaId || null,
        projectId:
          entry.projectId ||
          (
            entry.entityType === "project"
              ? entry.entityId
              : null
          ),
        action: entry.action || "executed",
        fromStatus: entry.fromStatus || null,
        status: entry.status || "completed",
        actor: entry.actor || null,
        details: entry.details || {},
        createdAt: entry.createdAt || this.now()
      };

      history.unshift(record);

      this.set(
        "automationCenter.executionHistory",
        history.slice(0, 500),
        {
          eventName: "aiw:executionRecorded",
          backup: false
        }
      );

      return this.clone(record);
    },

    addActivity(data, activity = {}) {
      if (!data) return null;

      data.activity = Array.isArray(data.activity)
        ? data.activity
        : [];

      const record = {
        id: activity.id || this.id("activity"),
        type: activity.type || "system",
        title: activity.title || "تحديث في المنصة",
        createdAt: activity.createdAt || this.now(),
        ...this.clone(activity)
      };

      data.activity.unshift(record);
      data.activity = data.activity.slice(0, 200);

      return record;
    },

    logActivity(activity = {}) {
      const next = this.getState();
      const record = this.addActivity(next, activity);

      this.commit(next, {
        eventName: "aiw:activityAdded",
        backup: false
      });

      return this.clone(record);
    },

    getActivity(limit = 20) {
      return this.getCollection("activity").slice(
        0,
        Math.max(0, this.toNumber(limit, 20))
      );
    },

    getPipelineStats() {
      if (!this._initialized) this.init();

      this.refreshPipelineStats(this._state);
      this.syncCompatibilityModels(this._state);

      return this.clone(this._state.pipeline);
    },

    getPortfolioPipeline() {
      return this.getPipelineStats();
    },

    stats() {
      const names = [
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
        pipeline: this.getPipelineStats(),
        generatedAt: this.now()
      };

      names.forEach(name => {
        const all = this.getAllCollection(name);
        const active = all.filter(item => !item?.deletedAt).length;
        const deleted = all.filter(item => Boolean(item?.deletedAt)).length;

        output.collections[name] = {
          total: all.length,
          active,
          deleted
        };

        output.totalRecords += all.length;
        output.activeRecords += active;
        output.deletedRecords += deleted;
      });

      return output;
    },

    backup(data = null, options = {}) {
      const source = data || this.getState();

      const payload = {
        backedUpAt: this.now(),
        version: this.version,
        schemaVersion:
          source?.meta?.schemaVersion ||
          AIW.DEFAULT_DATA.meta.schemaVersion,
        data: this.clone(source),
        settings: this.getSettings()
      };

      const written = this.write(
        AIW.KEYS.BACKUP,
        payload
      );

      if (written && this._state) {
        this._state.meta.lastBackupAt = payload.backedUpAt;

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
      const backup = this.getBackup();

      if (!backup?.data) return null;

      const restored = this.normalizeData(
        this.mergeDefaults(
          AIW.DEFAULT_DATA,
          backup.data
        )
      );

      this.ensureMetadata(restored);
      restored.meta.lastRestoredAt = this.now();

      const result = this.commit(restored, {
        eventName: "aiw:dataRestored",
        backup: false
      });

      if (backup.settings) {
        this.saveSettings(
          backup.settings,
          "aiw:settingsRestored"
        );
      }

      return result;
    },

    exportData() {
      return {
        exportedAt: this.now(),
        app:
          this.getMetadata().app ||
          AIW.DEFAULT_DATA.meta.app,
        version: this.version,
        schemaVersion:
          this.getMetadata().schemaVersion,
        data: this.getState(),
        settings: this.getSettings()
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
        const data = this.normalizeData(
          this.mergeDefaults(
            AIW.DEFAULT_DATA,
            payload.data
          )
        );

        this.ensureMetadata(data);
        data.meta.lastImportedAt = this.now();

        this.commit(data, {
          eventName: "aiw:dataImported",
          backup: options.backup !== false
        });

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

    reset(options = {}) {
      if (options.backupBeforeReset !== false) {
        this.backup(this.getState());
      }

      const fresh = this.clone(AIW.DEFAULT_DATA);
      const timestamp = this.now();

      fresh.meta.createdAt = timestamp;
      fresh.meta.updatedAt = timestamp;
      fresh.meta.lastSync = timestamp;

      const result = this.commit(fresh, {
        eventName: "aiw:dataReset",
        backup: false
      });

      window.setTimeout(() => {
        if (typeof AIW.SeedData?.seed === "function") {
          AIW.SeedData.seed();
        }
      }, 0);

      return result;
    },

    resetSettings() {
      this._settings = this.clone(AIW.DEFAULT_SETTINGS);

      this.persistSettings({
        emit: false,
        notify: false
      });

      this.emit(
        "aiw:settingsReset",
        this.getSettings()
      );

      this.notifySubscribers({
        type: "aiw:settingsReset",
        settings: this.getSettings()
      });

      return this.getSettings();
    },

    clearAll(options = {}) {
      if (options.keepBackup !== true) {
        this.removeStorageKey(AIW.KEYS.BACKUP);
      }

      this.removeStorageKey(AIW.KEYS.DATA);
      this.removeStorageKey(AIW.KEYS.SETTINGS);

      this._state = null;
      this._settings = null;
      this._initialized = false;

      const result = this.init();

      window.setTimeout(() => {
        if (typeof AIW.SeedData?.seed === "function") {
          AIW.SeedData.seed();
        }
      }, 0);

      return result;
    },

    subscribe(callback) {
      if (typeof callback !== "function") {
        return () => {};
      }

      this._subscribers.add(callback);

      return () => {
        this._subscribers.delete(callback);
      };
    },

    onChange(callback) {
      return this.subscribe(callback);
    },

    notifySubscribers(change = {}) {
      const payload = {
        timestamp: this.now(),
        ...change
      };

      this._subscribers.forEach(callback => {
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
      });
    },

    emit(name, detail) {
      if (!name) return;

      try {
        window.dispatchEvent(
          new CustomEvent(name, {
            detail: this.clone(detail)
          })
        );
      } catch (error) {
        console.warn(
          `[AIW.Store] Event ${name} failed:`,
          error
        );
      }
    },

    attachStorageListener() {
      if (this._storageListenerAttached) return;

      this._storageListenerAttached = true;

      window.addEventListener("storage", event => {
        if (this._writeLock) return;

        if (
          event.key === AIW.KEYS.DATA &&
          event.newValue
        ) {
          try {
            const external = JSON.parse(event.newValue);

            this._state = this.normalizeData(
              this.mergeDefaults(
                AIW.DEFAULT_DATA,
                external
              )
            );

            this.ensureMetadata(this._state);
            this.repairIdeaProjectLinks(this._state);
            this.refreshPipelineStats(this._state);
            this.syncCompatibilityModels(this._state);
            this.syncGlobalDataReference();

            const payload = {
              source: "storage",
              data: this.getState()
            };

            this.emit("aiw:crossTabSync", payload);
            this.emit("aiw:dataChanged", payload);

            this.notifySubscribers({
              type: "aiw:crossTabSync",
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
          event.key === AIW.KEYS.SETTINGS &&
          event.newValue
        ) {
          try {
            this._settings = this.mergeDefaults(
              AIW.DEFAULT_SETTINGS,
              JSON.parse(event.newValue)
            );

            this.emit(
              "aiw:settingsChanged",
              this.getSettings()
            );

            this.notifySubscribers({
              type: "aiw:settingsChanged",
              settings: this.getSettings()
            });
          } catch (error) {
            console.warn(
              "[AIW.Store] Cross-tab settings synchronization failed:",
              error
            );
          }
        }
      });
    }
  };

  AIW.Store = Store;
  AIW.Store.init();

  console.info(
    `[AIW.Store] Store V${AIW.Store.version} initialized`
  );
})();
