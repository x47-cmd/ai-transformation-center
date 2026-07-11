/* =========================================================
   AI Work - Enterprise KPI Auto Engine V1.0
   Phase 8: Enterprise Integration Layer

   File Path:
   js/extensions/integration/kpi-auto-engine.js

   Depends On:
   - AIW.Store V2.3+
   - AIW.EventBus V1.0+
   - AIW.IntegrationCore V1.0+

   Purpose:
   - Calculate enterprise KPIs automatically from Store data
   - Derive project execution progress from completed tasks
   - Derive implementation readiness from task, phase, status,
     ownership, requirements, risks, and business-case signals
   - Calculate portfolio, idea, task, risk, and delivery metrics
   - Persist calculated KPI results safely into AIW.Store
   - Request Dashboard and Reports refresh automatically
   - Keep the existing UI and module files untouched

   Recommended Load Order:
   1) store.js
   2) core engines
   3) modules
   4) event-bus.js
   5) integration-core.js
   6) kpi-auto-engine.js
========================================================= */

(function initAIWKPIAutoEngine(global) {
  "use strict";

  global.AIW = global.AIW || {};
  const AIW = global.AIW;

  const VERSION = "1.0.0";
  const COMPONENT = "kpi-auto-engine";
  const STORE_PATH = "integration.kpis";
  const CALCULATION_DEBOUNCE_MS = 80;

  if (AIW.KPIAutoEngine && AIW.KPIAutoEngine.__version) {
    console.warn(
      "[AIW.KPIAutoEngine] Existing instance detected:",
      AIW.KPIAutoEngine.__version
    );
    return;
  }

  const runtime = {
    initialized: false,
    started: false,
    calculating: false,
    pendingCalculation: false,
    timerId: null,
    subscriptions: [],
    calculationCount: 0,
    persistenceCount: 0,
    lastCalculatedAt: null,
    lastReason: null,
    lastResult: null,
    lastSignature: "",
    errors: []
  };

  const STATUS_GROUPS = Object.freeze({
    active: [
      "active",
      "started",
      "in-progress",
      "in_progress",
      "executing",
      "execution",
      "نشط",
      "قيد التنفيذ",
      "جاري التنفيذ"
    ],
    paused: [
      "paused",
      "on-hold",
      "on_hold",
      "hold",
      "متوقف",
      "معلق",
      "موقوف"
    ],
    completed: [
      "completed",
      "complete",
      "done",
      "closed",
      "finished",
      "مكتمل",
      "منجز",
      "مغلق"
    ],
    canceled: [
      "canceled",
      "cancelled",
      "terminated",
      "ملغى",
      "ملغاة"
    ],
    draft: [
      "draft",
      "new",
      "planned",
      "planning",
      "جديد",
      "مسودة",
      "مخطط"
    ],
    approved: [
      "approved",
      "accepted",
      "معتمد",
      "مقبول"
    ],
    rejected: [
      "rejected",
      "declined",
      "مرفوض"
    ],
    converted: [
      "converted",
      "project",
      "converted-to-project",
      "converted_to_project",
      "محول",
      "تحولت"
    ]
  });

  function nowISO() {
    return new Date().toISOString();
  }

  function safeConsole(method, ...args) {
    try {
      const fn = console && console[method];
      if (typeof fn === "function") fn.apply(console, args);
    } catch (_) {}
  }

  function cloneSafe(value) {
    if (value === undefined) return undefined;

    try {
      if (typeof structuredClone === "function") {
        return structuredClone(value);
      }
    } catch (_) {}

    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return value;
    }
  }

  function isObject(value) {
    return value !== null && typeof value === "object";
  }

  function isPlainObject(value) {
    if (!isObject(value) || Array.isArray(value)) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }

  function firstDefined(...values) {
    for (const value of values) {
      if (value !== undefined && value !== null) return value;
    }
    return undefined;
  }

  function numberOrNull(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function clamp(value, min = 0, max = 100) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.min(max, Math.max(min, number));
  }

  function round(value, decimals = 1) {
    const factor = 10 ** decimals;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function average(values) {
    const valid = values
      .map(Number)
      .filter((value) => Number.isFinite(value));

    if (!valid.length) return 0;
    return valid.reduce((sum, value) => sum + value, 0) / valid.length;
  }

  function sum(values) {
    return values
      .map(Number)
      .filter((value) => Number.isFinite(value))
      .reduce((total, value) => total + value, 0);
  }

  function stableSerialize(value) {
    const seen = new WeakSet();

    function normalize(input) {
      if (!isObject(input)) return input;

      if (seen.has(input)) return "[Circular]";
      seen.add(input);

      if (Array.isArray(input)) {
        return input.map(normalize);
      }

      return Object.keys(input)
        .sort()
        .reduce((output, key) => {
          output[key] = normalize(input[key]);
          return output;
        }, {});
    }

    try {
      return JSON.stringify(normalize(value));
    } catch (_) {
      return String(value);
    }
  }

  function getNestedValue(source, path, fallback) {
    if (!source || typeof path !== "string") return fallback;

    const parts = path.split(".").filter(Boolean);
    let current = source;

    for (const part of parts) {
      if (current == null || !(part in Object(current))) {
        return fallback;
      }
      current = current[part];
    }

    return current === undefined ? fallback : current;
  }

  function getStoreState() {
    const store = AIW.Store;
    if (!store) return {};

    try {
      if (typeof store.getState === "function") {
        return cloneSafe(store.getState()) || {};
      }

      if (typeof store.get === "function") {
        const state = store.get();
        if (state && typeof state === "object") {
          return cloneSafe(state);
        }
      }

      if (store.state && typeof store.state === "object") {
        return cloneSafe(store.state);
      }

      if (store.data && typeof store.data === "object") {
        return cloneSafe(store.data);
      }
    } catch (error) {
      recordError("getStoreState", error);
    }

    return {};
  }

  function resolveCollection(state, paths) {
    for (const path of paths) {
      const value = getNestedValue(state, path, undefined);

      if (Array.isArray(value)) {
        return value;
      }

      if (isPlainObject(value)) {
        return Object.keys(value).map((key) => {
          const item = value[key];

          if (isPlainObject(item) && item.id == null) {
            return { ...item, id: key };
          }

          return item;
        });
      }
    }

    return [];
  }

  function getIdeas(state) {
    return resolveCollection(state, [
      "ideas",
      "opportunities",
      "data.ideas",
      "portfolio.ideas"
    ]);
  }

  function getProjects(state) {
    return resolveCollection(state, [
      "projects",
      "data.projects",
      "portfolio.projects"
    ]);
  }

  function getBusinessCases(state) {
    return resolveCollection(state, [
      "businessCases",
      "business.cases",
      "businessCase.items",
      "data.businessCases"
    ]);
  }

  function getDecisions(state) {
    return resolveCollection(state, [
      "decisions",
      "decision.items",
      "data.decisions"
    ]);
  }

  function getAutomationState(state) {
    return firstDefined(
      getNestedValue(state, "automation", undefined),
      getNestedValue(state, "data.automation", undefined),
      {}
    ) || {};
  }

  function getStatus(entity) {
    return String(
      firstDefined(
        entity?.status,
        entity?.state,
        entity?.lifecycleStatus,
        entity?.projectStatus,
        ""
      ) || ""
    )
      .trim()
      .toLowerCase();
  }

  function isStatus(entity, group) {
    return STATUS_GROUPS[group]?.includes(getStatus(entity)) || false;
  }

  function normalizeTasks(project) {
    const tasks = firstDefined(
      project?.tasks,
      project?.checkpoints,
      project?.workItems,
      project?.milestones,
      []
    );

    if (Array.isArray(tasks)) return tasks;

    if (isPlainObject(tasks)) {
      return Object.keys(tasks).map((key) => {
        const task = tasks[key];
        return isPlainObject(task)
          ? { ...task, id: task.id || key }
          : task;
      });
    }

    return [];
  }

  function isTaskCompleted(task) {
    if (!task) return false;

    if (typeof task.completed === "boolean") {
      return task.completed;
    }

    if (typeof task.done === "boolean") {
      return task.done;
    }

    const status = String(
      firstDefined(task.status, task.state, "")
    )
      .trim()
      .toLowerCase();

    return STATUS_GROUPS.completed.includes(status);
  }

  function getTaskWeight(task) {
    const value = firstDefined(
      task?.weight,
      task?.priorityWeight,
      task?.scoreWeight,
      1
    );

    const weight = Number(value);
    return Number.isFinite(weight) && weight > 0 ? weight : 1;
  }

  function calculateTaskProgress(project) {
    const tasks = normalizeTasks(project);

    if (!tasks.length) {
      const explicit = firstDefined(
        project?.progress,
        project?.progressPercent,
        project?.completion,
        project?.completionRate,
        project?.executionProgress
      );

      const numeric = numberOrNull(explicit);

      return {
        progress: numeric === null ? 0 : clamp(numeric),
        taskCount: 0,
        completedTaskCount: 0,
        weightedTotal: 0,
        weightedCompleted: 0,
        source: numeric === null ? "none" : "project-field"
      };
    }

    const weightedTotal = sum(tasks.map(getTaskWeight));
    const weightedCompleted = sum(
      tasks
        .filter(isTaskCompleted)
        .map(getTaskWeight)
    );

    return {
      progress: weightedTotal
        ? clamp((weightedCompleted / weightedTotal) * 100)
        : 0,
      taskCount: tasks.length,
      completedTaskCount: tasks.filter(isTaskCompleted).length,
      weightedTotal,
      weightedCompleted,
      source: "tasks"
    };
  }

  function hasOwner(project) {
    return Boolean(
      firstDefined(
        project?.owner,
        project?.projectOwner,
        project?.manager,
        project?.lead,
        project?.teamLead,
        ""
      )
    );
  }

  function hasTimeline(project) {
    return Boolean(
      firstDefined(
        project?.startDate,
        project?.plannedStartDate,
        project?.endDate,
        project?.plannedEndDate,
        project?.duration,
        project?.timeline,
        ""
      )
    );
  }

  function hasRequirements(project) {
    const requirements = firstDefined(
      project?.requirements,
      project?.prerequisites,
      project?.dependencies,
      project?.implementationRequirements,
      []
    );

    if (Array.isArray(requirements)) {
      return requirements.length > 0;
    }

    if (isPlainObject(requirements)) {
      return Object.keys(requirements).length > 0;
    }

    return Boolean(requirements);
  }

  function hasBusinessCase(project, businessCases) {
    const projectId = String(
      firstDefined(project?.id, project?.projectId, "")
    );

    if (
      project?.businessCaseId ||
      project?.businessCase ||
      project?.businessCaseApproved
    ) {
      return true;
    }

    return businessCases.some((businessCase) => {
      const linkedId = String(
        firstDefined(
          businessCase?.projectId,
          businessCase?.linkedProjectId,
          ""
        )
      );

      return projectId && linkedId === projectId;
    });
  }

  function getRiskLevel(entity) {
    const raw = String(
      firstDefined(
        entity?.riskLevel,
        entity?.risk,
        entity?.riskRating,
        entity?.overallRisk,
        ""
      ) || ""
    )
      .trim()
      .toLowerCase();

    if (["critical", "very high", "severe", "حرج"].includes(raw)) return 4;
    if (["high", "مرتفع", "عالي"].includes(raw)) return 3;
    if (["medium", "moderate", "متوسط"].includes(raw)) return 2;
    if (["low", "منخفض"].includes(raw)) return 1;
    return 0;
  }

  function calculateProjectReadiness(project, businessCases) {
    const explicit = firstDefined(
      project?.readiness,
      project?.readinessPercent,
      project?.implementationReadiness,
      project?.executionReadiness
    );

    const explicitNumber = numberOrNull(explicit);

    const taskResult = calculateTaskProgress(project);
    const status = getStatus(project);
    const phase = firstDefined(
      project?.phase,
      project?.currentPhase,
      project?.stage,
      project?.lifecyclePhase,
      ""
    );

    const checks = {
      owner: hasOwner(project),
      timeline: hasTimeline(project),
      requirements: hasRequirements(project),
      businessCase: hasBusinessCase(project, businessCases),
      tasks: taskResult.taskCount > 0,
      activeLifecycle:
        Boolean(status) &&
        !STATUS_GROUPS.canceled.includes(status) &&
        !STATUS_GROUPS.rejected.includes(status),
      phase: Boolean(phase)
    };

    const baseReadiness =
      (Number(checks.owner) * 15) +
      (Number(checks.timeline) * 15) +
      (Number(checks.requirements) * 15) +
      (Number(checks.businessCase) * 20) +
      (Number(checks.tasks) * 15) +
      (Number(checks.activeLifecycle) * 10) +
      (Number(checks.phase) * 10);

    const riskPenalty = getRiskLevel(project) * 5;
    const calculated = clamp(baseReadiness - riskPenalty);

    return {
      readiness:
        explicitNumber === null
          ? calculated
          : clamp(explicitNumber),
      calculatedReadiness: calculated,
      explicitReadiness:
        explicitNumber === null ? null : clamp(explicitNumber),
      riskPenalty,
      checks,
      source:
        explicitNumber === null
          ? "calculated"
          : "project-field"
    };
  }

  function getProjectId(project, index) {
    return String(
      firstDefined(
        project?.id,
        project?.projectId,
        project?.uid,
        project?.code,
        `project-${index + 1}`
      )
    );
  }

  function calculatePortfolioProjects(projects, businessCases) {
    const enriched = projects.map((project, index) => {
      const taskResult = calculateTaskProgress(project);
      const readinessResult = calculateProjectReadiness(
        project,
        businessCases
      );

      return {
        id: getProjectId(project, index),
        title: firstDefined(
          project?.title,
          project?.name,
          `Project ${index + 1}`
        ),
        status: getStatus(project),
        progress: round(taskResult.progress),
        readiness: round(readinessResult.readiness),
        taskCount: taskResult.taskCount,
        completedTaskCount: taskResult.completedTaskCount,
        riskLevel: getRiskLevel(project),
        progressSource: taskResult.source,
        readinessSource: readinessResult.source
      };
    });

    const total = enriched.length;
    const active = projects.filter((item) => isStatus(item, "active")).length;
    const paused = projects.filter((item) => isStatus(item, "paused")).length;
    const completed = projects.filter((item) => isStatus(item, "completed")).length;
    const canceled = projects.filter((item) => isStatus(item, "canceled")).length;
    const draft = projects.filter((item) => isStatus(item, "draft")).length;

    const allTasks = projects.flatMap(normalizeTasks);
    const completedTasks = allTasks.filter(isTaskCompleted);

    return {
      total,
      active,
      paused,
      completed,
      canceled,
      draft,
      averageProgress: round(
        average(enriched.map((item) => item.progress))
      ),
      averageReadiness: round(
        average(enriched.map((item) => item.readiness))
      ),
      completionRate: total
        ? round((completed / total) * 100)
        : 0,
      activeRate: total
        ? round((active / total) * 100)
        : 0,
      taskCount: allTasks.length,
      completedTaskCount: completedTasks.length,
      taskCompletionRate: allTasks.length
        ? round((completedTasks.length / allTasks.length) * 100)
        : 0,
      highRiskCount: enriched.filter((item) => item.riskLevel >= 3).length,
      mediumRiskCount: enriched.filter((item) => item.riskLevel === 2).length,
      lowRiskCount: enriched.filter((item) => item.riskLevel === 1).length,
      projects: enriched
    };
  }

  function calculateIdeaMetrics(ideas) {
    const total = ideas.length;
    const approved = ideas.filter((item) => isStatus(item, "approved")).length;
    const rejected = ideas.filter((item) => isStatus(item, "rejected")).length;
    const converted = ideas.filter((item) => {
      if (isStatus(item, "converted")) return true;
      return Boolean(
        firstDefined(
          item?.projectId,
          item?.convertedProjectId,
          false
        )
      );
    }).length;

    const draft = ideas.filter((item) => isStatus(item, "draft")).length;

    const decisionScores = ideas
      .map((item) =>
        numberOrNull(
          firstDefined(
            item?.decisionScore,
            item?.score,
            item?.priorityScore
          )
        )
      )
      .filter((value) => value !== null);

    return {
      total,
      approved,
      rejected,
      converted,
      draft,
      approvalRate: total
        ? round((approved / total) * 100)
        : 0,
      conversionRate: total
        ? round((converted / total) * 100)
        : 0,
      averageDecisionScore: decisionScores.length
        ? round(average(decisionScores))
        : 0,
      highRiskCount: ideas.filter((item) => getRiskLevel(item) >= 3).length
    };
  }

  function calculateBusinessCaseMetrics(businessCases) {
    const total = businessCases.length;
    const approved = businessCases.filter((item) =>
      isStatus(item, "approved")
    ).length;
    const rejected = businessCases.filter((item) =>
      isStatus(item, "rejected")
    ).length;
    const draft = businessCases.filter((item) =>
      isStatus(item, "draft")
    ).length;

    return {
      total,
      approved,
      rejected,
      draft,
      approvalRate: total
        ? round((approved / total) * 100)
        : 0
    };
  }

  function calculateDecisionMetrics(decisions) {
    const total = decisions.length;
    const approved = decisions.filter((item) =>
      isStatus(item, "approved")
    ).length;
    const rejected = decisions.filter((item) =>
      isStatus(item, "rejected")
    ).length;
    const pending = Math.max(0, total - approved - rejected);

    return {
      total,
      approved,
      rejected,
      pending,
      approvalRate: total
        ? round((approved / total) * 100)
        : 0
    };
  }

  function calculateAutomationMetrics(automation) {
    const workflows = Array.isArray(automation?.workflows)
      ? automation.workflows
      : [];

    const history = Array.isArray(automation?.executionHistory)
      ? automation.executionHistory
      : [];

    const successful = history.filter((item) => {
      const status = getStatus(item);
      return ["completed", "success", "succeeded", "مكتمل", "ناجح"].includes(status);
    }).length;

    const failed = history.filter((item) => {
      const status = getStatus(item);
      return ["failed", "error", "فشل", "خطأ"].includes(status);
    }).length;

    return {
      workflowCount: workflows.length,
      activeWorkflowCount: workflows.filter((item) =>
        isStatus(item, "active")
      ).length,
      executionCount: history.length,
      successfulExecutionCount: successful,
      failedExecutionCount: failed,
      successRate: history.length
        ? round((successful / history.length) * 100)
        : 0
    };
  }

  function calculatePlatformHealth(metrics) {
    const weights = {
      projectProgress: 25,
      readiness: 25,
      taskCompletion: 20,
      businessApproval: 10,
      ideaConversion: 10,
      automationSuccess: 10
    };

    const weightedScore =
      (metrics.projects.averageProgress / 100) * weights.projectProgress +
      (metrics.projects.averageReadiness / 100) * weights.readiness +
      (metrics.projects.taskCompletionRate / 100) * weights.taskCompletion +
      (metrics.businessCases.approvalRate / 100) * weights.businessApproval +
      (metrics.ideas.conversionRate / 100) * weights.ideaConversion +
      (metrics.automation.successRate / 100) * weights.automationSuccess;

    const riskPenalty =
      (metrics.projects.highRiskCount * 2.5) +
      (metrics.ideas.highRiskCount * 1.5) +
      (metrics.automation.failedExecutionCount * 1);

    const score = clamp(weightedScore - Math.min(riskPenalty, 25));

    let status = "critical";
    let label = "حرج";

    if (score >= 85) {
      status = "excellent";
      label = "ممتاز";
    } else if (score >= 70) {
      status = "healthy";
      label = "جيد";
    } else if (score >= 50) {
      status = "attention";
      label = "يحتاج متابعة";
    }

    return {
      score: round(score),
      status,
      label,
      riskPenalty: round(riskPenalty),
      weights
    };
  }

  function calculateExecutiveReadiness(metrics) {
    const score = average([
      metrics.projects.averageReadiness,
      metrics.projects.taskCompletionRate,
      metrics.businessCases.approvalRate,
      metrics.decisions.approvalRate
    ]);

    let status = "low";
    let label = "منخفضة";

    if (score >= 80) {
      status = "high";
      label = "مرتفعة";
    } else if (score >= 60) {
      status = "medium";
      label = "متوسطة";
    }

    return {
      score: round(score),
      status,
      label
    };
  }

  function buildKPIList(metrics) {
    return [
      {
        id: "portfolio-projects-total",
        label: "إجمالي المشاريع",
        value: metrics.projects.total,
        unit: "project",
        category: "portfolio"
      },
      {
        id: "portfolio-active-projects",
        label: "المشاريع النشطة",
        value: metrics.projects.active,
        unit: "project",
        category: "portfolio"
      },
      {
        id: "portfolio-average-progress",
        label: "متوسط التقدم التنفيذي",
        value: metrics.projects.averageProgress,
        unit: "%",
        category: "execution"
      },
      {
        id: "portfolio-average-readiness",
        label: "متوسط جاهزية التنفيذ",
        value: metrics.projects.averageReadiness,
        unit: "%",
        category: "readiness"
      },
      {
        id: "tasks-completion-rate",
        label: "معدل إنجاز المهام",
        value: metrics.projects.taskCompletionRate,
        unit: "%",
        category: "execution"
      },
      {
        id: "ideas-total",
        label: "إجمالي الأفكار",
        value: metrics.ideas.total,
        unit: "idea",
        category: "ideas"
      },
      {
        id: "ideas-conversion-rate",
        label: "معدل تحويل الأفكار",
        value: metrics.ideas.conversionRate,
        unit: "%",
        category: "ideas"
      },
      {
        id: "business-case-approval-rate",
        label: "اعتماد دراسات الجدوى",
        value: metrics.businessCases.approvalRate,
        unit: "%",
        category: "business-case"
      },
      {
        id: "decision-approval-rate",
        label: "معدل اعتماد القرارات",
        value: metrics.decisions.approvalRate,
        unit: "%",
        category: "decision"
      },
      {
        id: "automation-success-rate",
        label: "نجاح الأتمتة",
        value: metrics.automation.successRate,
        unit: "%",
        category: "automation"
      },
      {
        id: "platform-health",
        label: "صحة المنصة",
        value: metrics.platformHealth.score,
        unit: "%",
        category: "platform"
      },
      {
        id: "executive-readiness",
        label: "الجاهزية التنفيذية",
        value: metrics.executiveReadiness.score,
        unit: "%",
        category: "readiness"
      }
    ];
  }

  function calculate(state = getStoreState(), reason = "manual") {
    const ideas = getIdeas(state);
    const projects = getProjects(state);
    const businessCases = getBusinessCases(state);
    const decisions = getDecisions(state);
    const automation = getAutomationState(state);

    const metrics = {
      ideas: calculateIdeaMetrics(ideas),
      projects: calculatePortfolioProjects(projects, businessCases),
      businessCases: calculateBusinessCaseMetrics(businessCases),
      decisions: calculateDecisionMetrics(decisions),
      automation: calculateAutomationMetrics(automation)
    };

    metrics.platformHealth = calculatePlatformHealth(metrics);
    metrics.executiveReadiness = calculateExecutiveReadiness(metrics);

    const result = {
      version: VERSION,
      calculatedAt: nowISO(),
      reason,
      summary: {
        totalIdeas: metrics.ideas.total,
        totalProjects: metrics.projects.total,
        activeProjects: metrics.projects.active,
        completedProjects: metrics.projects.completed,
        averageProgress: metrics.projects.averageProgress,
        averageReadiness: metrics.projects.averageReadiness,
        taskCompletionRate: metrics.projects.taskCompletionRate,
        platformHealth: metrics.platformHealth.score,
        executiveReadiness: metrics.executiveReadiness.score
      },
      metrics,
      kpis: buildKPIList(metrics)
    };

    return result;
  }

  function recordError(scope, error, metadata = {}) {
    const item = {
      id: `kpi-error-${Date.now()}-${runtime.errors.length + 1}`,
      scope,
      message: error?.message || String(error),
      stack: error?.stack || null,
      metadata: cloneSafe(metadata),
      timestamp: nowISO()
    };

    runtime.errors.push(item);

    if (runtime.errors.length > 100) {
      runtime.errors.splice(0, runtime.errors.length - 100);
    }

    safeConsole(
      "error",
      `[AIW.KPIAutoEngine] ${scope} failed.`,
      error
    );

    emitSafe("integration.error", {
      component: COMPONENT,
      error: item
    });
  }

  async function emitSafe(eventName, payload = {}) {
    try {
      if (
        AIW.EventBus &&
        typeof AIW.EventBus.emit === "function"
      ) {
        return await AIW.EventBus.emit(
          eventName,
          cloneSafe(payload),
          {
            source: "AIW.KPIAutoEngine",
            broadcast: true
          }
        );
      }
    } catch (error) {
      safeConsole(
        "warn",
        `[AIW.KPIAutoEngine] Event emission failed: ${eventName}`,
        error
      );
    }

    return null;
  }

  function writeWithStoreAPI(path, value) {
    const store = AIW.Store;

    if (!store) {
      throw new Error("AIW.Store is not available.");
    }

    if (typeof store.set === "function") {
      store.set(path, cloneSafe(value));
      return true;
    }

    if (typeof store.patch === "function") {
      const parts = path.split(".");
      const root = parts.shift();

      if (parts.length === 0) {
        store.patch({ [root]: cloneSafe(value) });
        return true;
      }

      const currentState = getStoreState();
      const rootValue = cloneSafe(currentState[root] || {});
      let cursor = rootValue;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          cursor[part] = cloneSafe(value);
        } else {
          cursor[part] = isPlainObject(cursor[part])
            ? cursor[part]
            : {};
          cursor = cursor[part];
        }
      });

      store.patch({ [root]: rootValue });
      return true;
    }

    throw new Error(
      "AIW.Store does not expose set() or patch()."
    );
  }

  function persist(result) {
    try {
      const persistable = {
        version: result.version,
        calculatedAt: result.calculatedAt,
        reason: result.reason,
        summary: result.summary,
        metrics: result.metrics,
        kpis: result.kpis
      };

      const signature = stableSerialize(persistable);

      if (signature === runtime.lastSignature) {
        return false;
      }

      writeWithStoreAPI(STORE_PATH, persistable);

      runtime.lastSignature = signature;
      runtime.persistenceCount += 1;

      return true;
    } catch (error) {
      recordError("persist", error, { result });
      return false;
    }
  }

  async function run(reason = "manual", options = {}) {
    if (runtime.calculating) {
      runtime.pendingCalculation = true;
      return runtime.lastResult;
    }

    runtime.calculating = true;
    runtime.pendingCalculation = false;

    try {
      const state = getStoreState();
      const result = calculate(state, reason);

      runtime.calculationCount += 1;
      runtime.lastCalculatedAt = result.calculatedAt;
      runtime.lastReason = reason;
      runtime.lastResult = cloneSafe(result);

      const persisted =
        options.persist === false
          ? false
          : persist(result);

      await emitSafe("kpi.recalculated", {
        reason,
        persisted,
        summary: result.summary,
        metrics: result.metrics,
        kpis: result.kpis
      });

      await emitSafe("kpi.changed", {
        reason,
        persisted,
        kpis: result.kpis
      });

      await emitSafe("platform-health.updated", {
        reason,
        health: result.metrics.platformHealth
      });

      await emitSafe("dashboard.refresh.requested", {
        reason: "kpi-auto-engine",
        sourceReason: reason
      });

      await emitSafe("report.refresh.requested", {
        reason: "kpi-auto-engine",
        sourceReason: reason
      });

      return cloneSafe(result);
    } catch (error) {
      recordError("run", error, { reason, options });
      return runtime.lastResult;
    } finally {
      runtime.calculating = false;

      if (runtime.pendingCalculation) {
        runtime.pendingCalculation = false;
        schedule("pending-calculation");
      }
    }
  }

  function schedule(reason = "event") {
    runtime.lastReason = reason;

    if (runtime.timerId) {
      clearTimeout(runtime.timerId);
    }

    runtime.timerId = setTimeout(() => {
      runtime.timerId = null;
      run(reason);
    }, CALCULATION_DEBOUNCE_MS);

    return true;
  }

  function subscribe(eventName, handler, options = {}) {
    if (
      !AIW.EventBus ||
      typeof AIW.EventBus.on !== "function"
    ) {
      return null;
    }

    const unsubscribe = AIW.EventBus.on(
      eventName,
      handler,
      {
        source: "AIW.KPIAutoEngine",
        priority: options.priority || 0
      }
    );

    runtime.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  function registerEventListeners() {
    const events = [
      "idea.created",
      "idea.updated",
      "idea.approved",
      "idea.rejected",
      "idea.converted",
      "idea.restored",
      "idea.deleted",

      "project.created",
      "project.updated",
      "project.started",
      "project.paused",
      "project.resumed",
      "project.completed",
      "project.canceled",
      "project.deleted",

      "task.created",
      "task.updated",
      "task.completed",
      "task.reopened",
      "task.deleted",

      "project.phase.changed",
      "project.progress.changed",
      "project.readiness.changed",

      "business-case.created",
      "business-case.updated",
      "business-case.approved",
      "business-case.rejected",

      "decision.created",
      "decision.updated",
      "decision.approved",
      "decision.rejected",

      "automation.completed",
      "automation.failed",
      "store.restored"
    ];

    events.forEach((eventName) => {
      subscribe(eventName, () => {
        schedule(eventName);
      });
    });

    subscribe(
      "kpi.recalculated",
      (payload, context) => {
        if (context?.source === "AIW.KPIAutoEngine") {
          return;
        }

        schedule(
          payload?.reason
            ? `external:${payload.reason}`
            : "external-kpi-request"
        );
      },
      { priority: -10 }
    );
  }

  function unsubscribeAll() {
    runtime.subscriptions.forEach((unsubscribe) => {
      try {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      } catch (_) {}
    });

    runtime.subscriptions.length = 0;
  }

  function start() {
    if (runtime.started) {
      return getDiagnostics();
    }

    try {
      if (!AIW.Store) {
        throw new Error(
          "AIW.Store is required before KPI Auto Engine."
        );
      }

      if (!AIW.EventBus) {
        throw new Error(
          "AIW.EventBus is required before KPI Auto Engine."
        );
      }

      registerEventListeners();

      runtime.initialized = true;
      runtime.started = true;

      schedule("startup");

      safeConsole(
        "info",
        `[AIW.KPIAutoEngine] V${VERSION} started successfully.`
      );

      return getDiagnostics();
    } catch (error) {
      recordError("start", error);
      runtime.started = false;
      return getDiagnostics();
    }
  }

  function stop() {
    if (runtime.timerId) {
      clearTimeout(runtime.timerId);
      runtime.timerId = null;
    }

    unsubscribeAll();

    runtime.started = false;
    runtime.pendingCalculation = false;

    return getDiagnostics();
  }

  function restart() {
    stop();
    return start();
  }

  function getLastResult() {
    return cloneSafe(runtime.lastResult);
  }

  function getProjectMetrics(projectId) {
    const projects =
      runtime.lastResult?.metrics?.projects?.projects || [];

    return cloneSafe(
      projects.find(
        (project) => String(project.id) === String(projectId)
      ) || null
    );
  }

  function getKPI(kpiId) {
    const kpis = runtime.lastResult?.kpis || [];

    return cloneSafe(
      kpis.find(
        (kpi) => String(kpi.id) === String(kpiId)
      ) || null
    );
  }

  function getErrors() {
    return cloneSafe(runtime.errors);
  }

  function clearErrors() {
    runtime.errors.length = 0;
    return true;
  }

  function getDiagnostics() {
    return {
      version: VERSION,
      component: COMPONENT,
      initialized: runtime.initialized,
      started: runtime.started,
      calculating: runtime.calculating,
      pendingCalculation: runtime.pendingCalculation,
      calculationCount: runtime.calculationCount,
      persistenceCount: runtime.persistenceCount,
      lastCalculatedAt: runtime.lastCalculatedAt,
      lastReason: runtime.lastReason,
      subscriptionCount: runtime.subscriptions.length,
      errorCount: runtime.errors.length,
      storePath: STORE_PATH,
      debounceMs: CALCULATION_DEBOUNCE_MS,
      hasLastResult: Boolean(runtime.lastResult)
    };
  }

  AIW.KPIAutoEngine = Object.freeze({
    __version: VERSION,

    start,
    stop,
    restart,

    run,
    schedule,
    calculate,

    getLastResult,
    getProjectMetrics,
    getKPI,

    calculateTaskProgress,
    calculateProjectReadiness,

    getDiagnostics,
    getErrors,
    clearErrors
  });

  function autoStart() {
    const attempt = () => {
      if (runtime.started) return;

      if (AIW.Store && AIW.EventBus) {
        start();
        return;
      }

      global.setTimeout(attempt, 100);
    };

    attempt();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      autoStart,
      { once: true }
    );
  } else {
    autoStart();
  }
})(window);
