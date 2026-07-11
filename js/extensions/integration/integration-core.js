/* =========================================================
   AI Work - Enterprise Integration Core V1.0
   Phase 8: Enterprise Integration Layer

   File Path:
   js/extensions/integration/integration-core.js

   Depends On:
   - AIW.Store V2.3+
   - AIW.EventBus V1.0+

   Purpose:
   - Observe AIW.Store changes centrally
   - Convert raw Store mutations into enterprise domain events
   - Detect changes in Ideas, Projects, Tasks, Business Cases,
     Decisions, Automation, KPIs, Reports, and platform metadata
   - Keep existing modules untouched
   - Provide diagnostics, snapshots, and safe lifecycle control

   Recommended Load Order:
   1) store.js
   2) core engines
   3) modules
   4) js/extensions/integration/event-bus.js
   5) js/extensions/integration/integration-core.js
========================================================= */

(function initAIWIntegrationCore(global) {
  "use strict";

  global.AIW = global.AIW || {};
  const AIW = global.AIW;

  const VERSION = "1.0.0";
  const COMPONENT = "integration-core";

  if (AIW.IntegrationCore && AIW.IntegrationCore.__version) {
    console.warn(
      "[AIW.IntegrationCore] Existing instance detected:",
      AIW.IntegrationCore.__version
    );
    return;
  }

  const runtime = {
    initialized: false,
    started: false,
    storeReady: false,
    eventBusReady: false,
    unsubscribeStore: null,
    previousState: null,
    currentState: null,
    lastChangeAt: null,
    detectedChanges: 0,
    emittedEvents: 0,
    errors: [],
    startupAt: null
  };

  const ENTITY_CONFIG = Object.freeze({
    ideas: {
      idFields: ["id", "ideaId", "uid"],
      created: "idea.created",
      updated: "idea.updated",
      deleted: "idea.deleted"
    },
    projects: {
      idFields: ["id", "projectId", "uid"],
      created: "project.created",
      updated: "project.updated",
      deleted: "project.deleted"
    },
    businessCases: {
      idFields: ["id", "businessCaseId", "caseId", "uid"],
      created: "business-case.created",
      updated: "business-case.updated",
      deleted: "business-case.deleted"
    },
    decisions: {
      idFields: ["id", "decisionId", "uid"],
      created: "decision.created",
      updated: "decision.updated",
      deleted: "decision.deleted"
    },
    kpis: {
      idFields: ["id", "kpiId", "uid", "code"],
      created: "kpi.changed",
      updated: "kpi.changed",
      deleted: "kpi.changed"
    },
    reports: {
      idFields: ["id", "reportId", "uid"],
      created: "report.generated",
      updated: "report.generated",
      deleted: "report.refresh.requested"
    },
    notifications: {
      idFields: ["id", "notificationId", "uid"],
      created: "notification.created",
      updated: "notification.read",
      deleted: "notification.read"
    }
  });

  function nowISO() {
    return new Date().toISOString();
  }

  function safeConsole(method, ...args) {
    try {
      const fn = console && console[method];
      if (typeof fn === "function") {
        fn.apply(console, args);
      }
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

  function stableSerialize(value) {
    const seen = new WeakSet();

    function normalize(input) {
      if (!isObject(input)) return input;

      if (seen.has(input)) return "[Circular]";
      seen.add(input);

      if (Array.isArray(input)) {
        return input.map(normalize);
      }

      const output = {};
      Object.keys(input)
        .sort()
        .forEach((key) => {
          output[key] = normalize(input[key]);
        });

      return output;
    }

    try {
      return JSON.stringify(normalize(value));
    } catch (_) {
      return String(value);
    }
  }

  function isEqual(a, b) {
    if (a === b) return true;
    return stableSerialize(a) === stableSerialize(b);
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

  function firstDefined(...values) {
    for (const value of values) {
      if (value !== undefined && value !== null) {
        return value;
      }
    }
    return undefined;
  }

  function getEntityId(entity, idFields = ["id", "uid"]) {
    if (!entity || typeof entity !== "object") return "";

    for (const field of idFields) {
      const value = entity[field];
      if (value !== undefined && value !== null && value !== "") {
        return String(value);
      }
    }

    const fallback = firstDefined(
      entity.title,
      entity.name,
      entity.code,
      entity.key
    );

    return fallback ? String(fallback) : "";
  }

  function toEntityMap(collection, idFields) {
    const map = new Map();

    if (Array.isArray(collection)) {
      collection.forEach((item, index) => {
        const id = getEntityId(item, idFields) || `index:${index}`;
        map.set(id, item);
      });
      return map;
    }

    if (isPlainObject(collection)) {
      Object.keys(collection).forEach((key) => {
        const item = collection[key];
        const id = getEntityId(item, idFields) || String(key);
        map.set(id, item);
      });
    }

    return map;
  }

  function getStoreState() {
    const store = AIW.Store;

    if (!store) return {};

    try {
      if (typeof store.getState === "function") {
        return cloneSafe(store.getState()) || {};
      }

      if (typeof store.get === "function") {
        const possibleState = store.get();
        if (possibleState && typeof possibleState === "object") {
          return cloneSafe(possibleState);
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

  function getEventBus() {
    return AIW.EventBus || null;
  }

  function recordError(scope, error, metadata = {}) {
    const item = {
      id: `integration-error-${Date.now()}-${runtime.errors.length + 1}`,
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
      `[AIW.IntegrationCore] ${scope} failed.`,
      error
    );

    emitSafe("integration.error", {
      component: COMPONENT,
      error: item
    });
  }

  async function emitSafe(eventName, payload = {}, options = {}) {
    const bus = getEventBus();

    if (!bus || typeof bus.emit !== "function") {
      return null;
    }

    try {
      runtime.emittedEvents += 1;

      return await bus.emit(
        eventName,
        {
          ...cloneSafe(payload),
          integration: {
            component: COMPONENT,
            version: VERSION,
            detectedAt: nowISO()
          }
        },
        {
          source: options.source || "AIW.IntegrationCore",
          broadcast: options.broadcast !== false,
          cancelable: options.cancelable !== false,
          metadata: cloneSafe(options.metadata || {})
        }
      );
    } catch (error) {
      recordError(`emit:${eventName}`, error, { payload });
      return null;
    }
  }

  function emitSyncSafe(eventName, payload = {}, options = {}) {
    const bus = getEventBus();

    if (!bus || typeof bus.emitSync !== "function") {
      return null;
    }

    try {
      runtime.emittedEvents += 1;

      return bus.emitSync(
        eventName,
        {
          ...cloneSafe(payload),
          integration: {
            component: COMPONENT,
            version: VERSION,
            detectedAt: nowISO()
          }
        },
        {
          source: options.source || "AIW.IntegrationCore",
          broadcast: options.broadcast !== false,
          cancelable: options.cancelable !== false,
          metadata: cloneSafe(options.metadata || {})
        }
      );
    } catch (error) {
      recordError(`emitSync:${eventName}`, error, { payload });
      return null;
    }
  }

  function resolveCollection(state, collectionName) {
    const aliases = {
      ideas: [
        "ideas",
        "opportunities",
        "data.ideas",
        "portfolio.ideas"
      ],
      projects: [
        "projects",
        "data.projects",
        "portfolio.projects"
      ],
      businessCases: [
        "businessCases",
        "business.cases",
        "businessCase.items",
        "data.businessCases"
      ],
      decisions: [
        "decisions",
        "decision.items",
        "data.decisions"
      ],
      kpis: [
        "kpis",
        "metrics.kpis",
        "data.kpis"
      ],
      reports: [
        "reports",
        "reporting.reports",
        "data.reports"
      ],
      notifications: [
        "notifications",
        "alerts",
        "data.notifications"
      ]
    };

    const paths = aliases[collectionName] || [collectionName];

    for (const path of paths) {
      const value = getNestedValue(state, path, undefined);
      if (Array.isArray(value) || isPlainObject(value)) {
        return value;
      }
    }

    return [];
  }

  function resolveAutomationState(state) {
    return firstDefined(
      getNestedValue(state, "automation", undefined),
      getNestedValue(state, "data.automation", undefined),
      {}
    ) || {};
  }

  function resolveMetadataState(state) {
    return firstDefined(
      getNestedValue(state, "metadata", undefined),
      getNestedValue(state, "meta", undefined),
      {}
    ) || {};
  }

  function getStatusValue(entity) {
    return String(
      firstDefined(
        entity?.status,
        entity?.state,
        entity?.lifecycleStatus,
        ""
      ) || ""
    )
      .trim()
      .toLowerCase();
  }

  function getProgressValue(entity) {
    const value = firstDefined(
      entity?.progress,
      entity?.progressPercent,
      entity?.completion,
      entity?.completionRate,
      entity?.executionProgress
    );

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function getReadinessValue(entity) {
    const value = firstDefined(
      entity?.readiness,
      entity?.readinessPercent,
      entity?.implementationReadiness,
      entity?.executionReadiness
    );

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function getPhaseValue(entity) {
    return firstDefined(
      entity?.phase,
      entity?.currentPhase,
      entity?.stage,
      entity?.lifecyclePhase,
      null
    );
  }

  function normalizeTasks(project) {
    const possible = firstDefined(
      project?.tasks,
      project?.checkpoints,
      project?.workItems,
      []
    );

    if (Array.isArray(possible)) return possible;

    if (isPlainObject(possible)) {
      return Object.keys(possible).map((key) => ({
        ...possible[key],
        id: possible[key]?.id || key
      }));
    }

    return [];
  }

  function getTaskCompleted(task) {
    if (!task) return false;

    if (typeof task.completed === "boolean") {
      return task.completed;
    }

    const status = String(
      firstDefined(task.status, task.state, "")
    )
      .trim()
      .toLowerCase();

    return [
      "completed",
      "done",
      "closed",
      "finished",
      "complete",
      "مكتمل",
      "منجز"
    ].includes(status);
  }

  function detectEntityCollectionChanges(
    collectionName,
    previousState,
    nextState
  ) {
    const config = ENTITY_CONFIG[collectionName];
    if (!config) return;

    const previousCollection = resolveCollection(
      previousState,
      collectionName
    );
    const nextCollection = resolveCollection(
      nextState,
      collectionName
    );

    const previousMap = toEntityMap(
      previousCollection,
      config.idFields
    );
    const nextMap = toEntityMap(
      nextCollection,
      config.idFields
    );

    nextMap.forEach((nextEntity, id) => {
      if (!previousMap.has(id)) {
        emitSyncSafe(config.created, {
          entityType: collectionName,
          entityId: id,
          entity: nextEntity,
          changeType: "created"
        });

        detectLifecycleEvents(
          collectionName,
          null,
          nextEntity,
          id
        );

        return;
      }

      const previousEntity = previousMap.get(id);

      if (!isEqual(previousEntity, nextEntity)) {
        emitSyncSafe(config.updated, {
          entityType: collectionName,
          entityId: id,
          previous: previousEntity,
          current: nextEntity,
          changes: diffObjects(previousEntity, nextEntity),
          changeType: "updated"
        });

        detectLifecycleEvents(
          collectionName,
          previousEntity,
          nextEntity,
          id
        );
      }
    });

    previousMap.forEach((previousEntity, id) => {
      if (!nextMap.has(id)) {
        emitSyncSafe(config.deleted, {
          entityType: collectionName,
          entityId: id,
          entity: previousEntity,
          changeType: "deleted"
        });
      }
    });
  }

  function diffObjects(previous, current, prefix = "") {
    const changes = [];
    const keys = new Set([
      ...Object.keys(previous || {}),
      ...Object.keys(current || {})
    ]);

    keys.forEach((key) => {
      const path = prefix ? `${prefix}.${key}` : key;
      const before = previous ? previous[key] : undefined;
      const after = current ? current[key] : undefined;

      if (
        isPlainObject(before) &&
        isPlainObject(after)
      ) {
        changes.push(...diffObjects(before, after, path));
        return;
      }

      if (!isEqual(before, after)) {
        changes.push({
          path,
          previous: cloneSafe(before),
          current: cloneSafe(after)
        });
      }
    });

    return changes;
  }

  function detectLifecycleEvents(
    collectionName,
    previousEntity,
    nextEntity,
    entityId
  ) {
    if (collectionName === "ideas") {
      detectIdeaLifecycle(
        previousEntity,
        nextEntity,
        entityId
      );
      return;
    }

    if (collectionName === "projects") {
      detectProjectLifecycle(
        previousEntity,
        nextEntity,
        entityId
      );
      return;
    }

    if (collectionName === "businessCases") {
      detectBusinessCaseLifecycle(
        previousEntity,
        nextEntity,
        entityId
      );
      return;
    }

    if (collectionName === "decisions") {
      detectDecisionLifecycle(
        previousEntity,
        nextEntity,
        entityId
      );
      return;
    }

    if (collectionName === "notifications") {
      detectNotificationLifecycle(
        previousEntity,
        nextEntity,
        entityId
      );
    }
  }

  function detectIdeaLifecycle(previousIdea, currentIdea, ideaId) {
    const beforeStatus = getStatusValue(previousIdea);
    const afterStatus = getStatusValue(currentIdea);

    if (beforeStatus !== afterStatus) {
      const payload = {
        ideaId,
        idea: currentIdea,
        previousStatus: beforeStatus,
        currentStatus: afterStatus
      };

      if (
        ["approved", "accepted", "معتمد", "مقبول"].includes(afterStatus)
      ) {
        emitSyncSafe("idea.approved", payload);
      }

      if (
        ["rejected", "declined", "مرفوض"].includes(afterStatus)
      ) {
        emitSyncSafe("idea.rejected", payload);
      }

      if (
        ["converted", "project", "تحولت", "محول"].includes(afterStatus)
      ) {
        emitSyncSafe("idea.converted", payload);
      }

      if (
        ["draft", "restored", "active", "مستعادة", "نشطة"].includes(afterStatus) &&
        ["converted", "canceled", "deleted", "ملغاة", "محذوفة"].includes(beforeStatus)
      ) {
        emitSyncSafe("idea.restored", payload);
      }
    }

    const beforeProjectId = firstDefined(
      previousIdea?.projectId,
      previousIdea?.convertedProjectId,
      null
    );

    const afterProjectId = firstDefined(
      currentIdea?.projectId,
      currentIdea?.convertedProjectId,
      null
    );

    if (!beforeProjectId && afterProjectId) {
      emitSyncSafe("idea.converted", {
        ideaId,
        projectId: String(afterProjectId),
        idea: currentIdea,
        previous: previousIdea
      });
    }
  }

  function detectProjectLifecycle(previousProject, currentProject, projectId) {
    const beforeStatus = getStatusValue(previousProject);
    const afterStatus = getStatusValue(currentProject);

    if (beforeStatus !== afterStatus) {
      const payload = {
        projectId,
        project: currentProject,
        previousStatus: beforeStatus,
        currentStatus: afterStatus
      };

      if (
        ["active", "started", "in-progress", "in_progress", "نشط", "قيد التنفيذ"].includes(afterStatus) &&
        !["paused", "active", "started", "in-progress", "in_progress", "نشط", "قيد التنفيذ"].includes(beforeStatus)
      ) {
        emitSyncSafe("project.started", payload);
      }

      if (
        ["paused", "on-hold", "on_hold", "متوقف", "معلق"].includes(afterStatus)
      ) {
        emitSyncSafe("project.paused", payload);
      }

      if (
        ["active", "resumed", "in-progress", "in_progress", "نشط", "مستأنف", "قيد التنفيذ"].includes(afterStatus) &&
        ["paused", "on-hold", "on_hold", "متوقف", "معلق"].includes(beforeStatus)
      ) {
        emitSyncSafe("project.resumed", payload);
      }

      if (
        ["completed", "done", "closed", "مكتمل", "منجز"].includes(afterStatus)
      ) {
        emitSyncSafe("project.completed", payload);
      }

      if (
        ["canceled", "cancelled", "ملغى", "ملغاة"].includes(afterStatus)
      ) {
        emitSyncSafe("project.canceled", payload);
      }
    }

    const beforeProgress = getProgressValue(previousProject);
    const afterProgress = getProgressValue(currentProject);

    if (beforeProgress !== afterProgress && afterProgress !== null) {
      emitSyncSafe("project.progress.changed", {
        projectId,
        project: currentProject,
        previousProgress: beforeProgress,
        currentProgress: afterProgress,
        delta:
          beforeProgress === null
            ? afterProgress
            : afterProgress - beforeProgress
      });
    }

    const beforeReadiness = getReadinessValue(previousProject);
    const afterReadiness = getReadinessValue(currentProject);

    if (beforeReadiness !== afterReadiness && afterReadiness !== null) {
      emitSyncSafe("project.readiness.changed", {
        projectId,
        project: currentProject,
        previousReadiness: beforeReadiness,
        currentReadiness: afterReadiness,
        delta:
          beforeReadiness === null
            ? afterReadiness
            : afterReadiness - beforeReadiness
      });
    }

    const beforePhase = getPhaseValue(previousProject);
    const afterPhase = getPhaseValue(currentProject);

    if (!isEqual(beforePhase, afterPhase) && afterPhase !== null) {
      emitSyncSafe("project.phase.changed", {
        projectId,
        project: currentProject,
        previousPhase: beforePhase,
        currentPhase: afterPhase
      });
    }

    detectTaskChanges(
      previousProject,
      currentProject,
      projectId
    );
  }

  function detectTaskChanges(previousProject, currentProject, projectId) {
    const beforeTasks = normalizeTasks(previousProject);
    const afterTasks = normalizeTasks(currentProject);

    const idFields = ["id", "taskId", "checkpointId", "uid"];
    const beforeMap = toEntityMap(beforeTasks, idFields);
    const afterMap = toEntityMap(afterTasks, idFields);

    afterMap.forEach((currentTask, taskId) => {
      if (!beforeMap.has(taskId)) {
        emitSyncSafe("task.created", {
          projectId,
          taskId,
          task: currentTask
        });

        if (getTaskCompleted(currentTask)) {
          emitSyncSafe("task.completed", {
            projectId,
            taskId,
            task: currentTask,
            previousCompleted: false,
            currentCompleted: true
          });
        }

        return;
      }

      const previousTask = beforeMap.get(taskId);

      if (!isEqual(previousTask, currentTask)) {
        emitSyncSafe("task.updated", {
          projectId,
          taskId,
          previous: previousTask,
          current: currentTask,
          changes: diffObjects(previousTask, currentTask)
        });

        const beforeCompleted = getTaskCompleted(previousTask);
        const afterCompleted = getTaskCompleted(currentTask);

        if (beforeCompleted !== afterCompleted) {
          emitSyncSafe(
            afterCompleted
              ? "task.completed"
              : "task.reopened",
            {
              projectId,
              taskId,
              task: currentTask,
              previousCompleted: beforeCompleted,
              currentCompleted: afterCompleted
            }
          );
        }
      }
    });

    beforeMap.forEach((previousTask, taskId) => {
      if (!afterMap.has(taskId)) {
        emitSyncSafe("task.deleted", {
          projectId,
          taskId,
          task: previousTask
        });
      }
    });
  }

  function detectBusinessCaseLifecycle(
    previousCase,
    currentCase,
    businessCaseId
  ) {
    const beforeStatus = getStatusValue(previousCase);
    const afterStatus = getStatusValue(currentCase);

    if (beforeStatus === afterStatus) return;

    const payload = {
      businessCaseId,
      businessCase: currentCase,
      previousStatus: beforeStatus,
      currentStatus: afterStatus
    };

    if (
      ["approved", "accepted", "معتمد", "مقبول"].includes(afterStatus)
    ) {
      emitSyncSafe("business-case.approved", payload);
    }

    if (
      ["rejected", "declined", "مرفوض"].includes(afterStatus)
    ) {
      emitSyncSafe("business-case.rejected", payload);
    }
  }

  function detectDecisionLifecycle(
    previousDecision,
    currentDecision,
    decisionId
  ) {
    const beforeStatus = getStatusValue(previousDecision);
    const afterStatus = getStatusValue(currentDecision);

    if (beforeStatus === afterStatus) return;

    const payload = {
      decisionId,
      decision: currentDecision,
      previousStatus: beforeStatus,
      currentStatus: afterStatus
    };

    if (
      ["approved", "accepted", "معتمد", "مقبول"].includes(afterStatus)
    ) {
      emitSyncSafe("decision.approved", payload);
    }

    if (
      ["rejected", "declined", "مرفوض"].includes(afterStatus)
    ) {
      emitSyncSafe("decision.rejected", payload);
    }
  }

  function detectNotificationLifecycle(
    previousNotification,
    currentNotification,
    notificationId
  ) {
    const beforeRead = Boolean(
      firstDefined(
        previousNotification?.read,
        previousNotification?.isRead,
        false
      )
    );

    const afterRead = Boolean(
      firstDefined(
        currentNotification?.read,
        currentNotification?.isRead,
        false
      )
    );

    if (!beforeRead && afterRead) {
      emitSyncSafe("notification.read", {
        notificationId,
        notification: currentNotification
      });
    }
  }

  function detectAutomationChanges(previousState, nextState) {
    const beforeAutomation = resolveAutomationState(previousState);
    const afterAutomation = resolveAutomationState(nextState);

    if (isEqual(beforeAutomation, afterAutomation)) return;

    const beforeHistory = Array.isArray(beforeAutomation.executionHistory)
      ? beforeAutomation.executionHistory
      : [];

    const afterHistory = Array.isArray(afterAutomation.executionHistory)
      ? afterAutomation.executionHistory
      : [];

    if (afterHistory.length > beforeHistory.length) {
      const newExecutions = afterHistory.slice(beforeHistory.length);

      newExecutions.forEach((execution) => {
        const status = getStatusValue(execution);

        emitSyncSafe("automation.triggered", {
          execution
        });

        if (
          ["completed", "success", "succeeded", "مكتمل", "ناجح"].includes(status)
        ) {
          emitSyncSafe("automation.completed", {
            execution
          });
        }

        if (
          ["failed", "error", "فشل", "خطأ"].includes(status)
        ) {
          emitSyncSafe("automation.failed", {
            execution
          });
        }
      });
    }
  }

  function detectMetadataChanges(previousState, nextState) {
    const beforeMetadata = resolveMetadataState(previousState);
    const afterMetadata = resolveMetadataState(nextState);

    if (isEqual(beforeMetadata, afterMetadata)) return;

    emitSyncSafe("store.changed", {
      scope: "metadata",
      previous: beforeMetadata,
      current: afterMetadata,
      changes: diffObjects(beforeMetadata, afterMetadata)
    });
  }

  function detectAllChanges(previousState, nextState, changeContext = {}) {
    runtime.detectedChanges += 1;
    runtime.lastChangeAt = nowISO();

    emitSyncSafe("store.changed", {
      scope: "state",
      context: cloneSafe(changeContext),
      previousState,
      currentState: nextState
    });

    Object.keys(ENTITY_CONFIG).forEach((collectionName) => {
      try {
        detectEntityCollectionChanges(
          collectionName,
          previousState,
          nextState
        );
      } catch (error) {
        recordError(
          `detectEntityCollectionChanges:${collectionName}`,
          error
        );
      }
    });

    try {
      detectAutomationChanges(previousState, nextState);
    } catch (error) {
      recordError("detectAutomationChanges", error);
    }

    try {
      detectMetadataChanges(previousState, nextState);
    } catch (error) {
      recordError("detectMetadataChanges", error);
    }

    scheduleDownstreamRefreshes(previousState, nextState);
  }

  function scheduleDownstreamRefreshes(previousState, nextState) {
    const projectsChanged = !isEqual(
      resolveCollection(previousState, "projects"),
      resolveCollection(nextState, "projects")
    );

    const ideasChanged = !isEqual(
      resolveCollection(previousState, "ideas"),
      resolveCollection(nextState, "ideas")
    );

    const kpisChanged = !isEqual(
      resolveCollection(previousState, "kpis"),
      resolveCollection(nextState, "kpis")
    );

    const businessCasesChanged = !isEqual(
      resolveCollection(previousState, "businessCases"),
      resolveCollection(nextState, "businessCases")
    );

    const decisionsChanged = !isEqual(
      resolveCollection(previousState, "decisions"),
      resolveCollection(nextState, "decisions")
    );

    if (
      projectsChanged ||
      ideasChanged ||
      businessCasesChanged ||
      decisionsChanged
    ) {
      emitSyncSafe("kpi.recalculated", {
        reason: "source-data-changed",
        sources: {
          projectsChanged,
          ideasChanged,
          businessCasesChanged,
          decisionsChanged
        }
      });
    }

    if (
      projectsChanged ||
      ideasChanged ||
      kpisChanged ||
      businessCasesChanged ||
      decisionsChanged
    ) {
      emitSyncSafe("dashboard.refresh.requested", {
        reason: "enterprise-data-changed",
        sources: {
          projectsChanged,
          ideasChanged,
          kpisChanged,
          businessCasesChanged,
          decisionsChanged
        }
      });

      emitSyncSafe("report.refresh.requested", {
        reason: "enterprise-data-changed",
        sources: {
          projectsChanged,
          ideasChanged,
          kpisChanged,
          businessCasesChanged,
          decisionsChanged
        }
      });
    }
  }

  function handleStoreChange(...args) {
    try {
      const nextState = getStoreState();

      let context = {};

      if (args.length === 1 && isPlainObject(args[0])) {
        context = cloneSafe(args[0]);
      } else if (args.length > 0) {
        context = {
          rawArguments: cloneSafe(args)
        };
      }

      const previousState = runtime.currentState || runtime.previousState || {};

      runtime.previousState = cloneSafe(previousState);
      runtime.currentState = cloneSafe(nextState);

      if (!isEqual(previousState, nextState)) {
        detectAllChanges(
          previousState,
          nextState,
          context
        );
      }
    } catch (error) {
      recordError("handleStoreChange", error, {
        args: cloneSafe(args)
      });
    }
  }

  function subscribeToStore() {
    const store = AIW.Store;

    if (!store) {
      throw new Error("AIW.Store is not available.");
    }

    if (typeof runtime.unsubscribeStore === "function") {
      runtime.unsubscribeStore();
      runtime.unsubscribeStore = null;
    }

    if (typeof store.subscribe === "function") {
      const possibleUnsubscribe = store.subscribe(handleStoreChange);

      if (typeof possibleUnsubscribe === "function") {
        runtime.unsubscribeStore = possibleUnsubscribe;
      } else {
        runtime.unsubscribeStore = function noOpUnsubscribe() {};
      }

      return true;
    }

    if (typeof store.onChange === "function") {
      const possibleUnsubscribe = store.onChange(handleStoreChange);

      runtime.unsubscribeStore =
        typeof possibleUnsubscribe === "function"
          ? possibleUnsubscribe
          : function noOpUnsubscribe() {};

      return true;
    }

    throw new Error(
      "AIW.Store does not expose subscribe() or onChange()."
    );
  }

  function initializeSnapshots() {
    const state = getStoreState();

    runtime.previousState = cloneSafe(state);
    runtime.currentState = cloneSafe(state);
    runtime.storeReady = Boolean(AIW.Store);
    runtime.eventBusReady = Boolean(AIW.EventBus);
  }

  function start() {
    if (runtime.started) {
      return getDiagnostics();
    }

    runtime.startupAt = nowISO();

    try {
      initializeSnapshots();

      if (!AIW.EventBus) {
        throw new Error(
          "AIW.EventBus is required before Integration Core."
        );
      }

      if (!AIW.Store) {
        throw new Error(
          "AIW.Store is required before Integration Core."
        );
      }

      subscribeToStore();

      runtime.initialized = true;
      runtime.started = true;

      emitSyncSafe("store.ready", {
        component: COMPONENT,
        storeVersion:
          AIW.Store.__version ||
          AIW.Store.version ||
          "unknown"
      });

      emitSyncSafe("integration.ready", {
        component: COMPONENT,
        version: VERSION,
        storeConnected: true,
        eventBusConnected: true
      });

      safeConsole(
        "info",
        `[AIW.IntegrationCore] V${VERSION} started successfully.`
      );

      return getDiagnostics();
    } catch (error) {
      recordError("start", error);
      runtime.started = false;
      return getDiagnostics();
    }
  }

  function stop() {
    try {
      if (typeof runtime.unsubscribeStore === "function") {
        runtime.unsubscribeStore();
      }
    } catch (error) {
      recordError("stop.unsubscribeStore", error);
    }

    runtime.unsubscribeStore = null;
    runtime.started = false;

    return getDiagnostics();
  }

  function restart() {
    stop();
    return start();
  }

  function rescan(options = {}) {
    try {
      const nextState = getStoreState();
      const previousState = options.fromEmpty
        ? {}
        : runtime.currentState || {};

      runtime.previousState = cloneSafe(previousState);
      runtime.currentState = cloneSafe(nextState);

      detectAllChanges(
        previousState,
        nextState,
        {
          reason: options.reason || "manual-rescan",
          manual: true
        }
      );

      return true;
    } catch (error) {
      recordError("rescan", error, options);
      return false;
    }
  }

  function resetSnapshots() {
    const state = getStoreState();

    runtime.previousState = cloneSafe(state);
    runtime.currentState = cloneSafe(state);

    return true;
  }

  function getSnapshot() {
    return cloneSafe(runtime.currentState || {});
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
      storeReady: Boolean(AIW.Store),
      eventBusReady: Boolean(AIW.EventBus),
      subscribedToStore:
        typeof runtime.unsubscribeStore === "function",
      startupAt: runtime.startupAt,
      lastChangeAt: runtime.lastChangeAt,
      detectedChanges: runtime.detectedChanges,
      emittedEvents: runtime.emittedEvents,
      errorCount: runtime.errors.length,
      previousStateAvailable: Boolean(runtime.previousState),
      currentStateAvailable: Boolean(runtime.currentState),
      entityCollections: Object.keys(ENTITY_CONFIG)
    };
  }

  AIW.IntegrationCore = Object.freeze({
    __version: VERSION,

    start,
    stop,
    restart,
    rescan,

    resetSnapshots,
    getSnapshot,

    getDiagnostics,
    getErrors,
    clearErrors,

    diffObjects,
    isEqual
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
