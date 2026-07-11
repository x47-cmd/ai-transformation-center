/* =========================================================
   AI Work - Executive Timeline Engine V1.0
   Phase 8: Enterprise Integration Layer

   File Path:
   js/extensions/integration/executive-timeline-engine.js

   Depends On:
   - AIW.Store V2.3+
   - AIW.EventBus V1.0+
   - AIW.IntegrationCore V1.0+
   - AIW.KPIAutoEngine V1.0+
   - AIW.DashboardAutoSync V1.0+
   - AIW.ReportsAutoBuilder V1.0+
   - AIW.NotificationIntegrationEngine V1.0+

   Purpose:
   - Build one unified executive timeline for the full lifecycle
   - Merge Ideas, Projects, Tasks, Business Cases, Decisions,
     Automation, Notifications, and integration events
   - Persist normalized timeline data into integration.timeline
   - Support filtering, grouping, querying, and diagnostics
   - Keep existing modules and UI untouched

   Recommended Load Order:
   1) event-bus.js
   2) integration-core.js
   3) kpi-auto-engine.js
   4) dashboard-auto-sync.js
   5) reports-auto-builder.js
   6) notification-integration-engine.js
   7) executive-timeline-engine.js
========================================================= */

(function initAIWExecutiveTimelineEngine(global) {
  "use strict";

  global.AIW = global.AIW || {};
  const AIW = global.AIW;

  const VERSION = "1.0.0";
  const COMPONENT = "executive-timeline-engine";
  const STORE_PATH = "integration.timeline";
  const MAX_TIMELINE_ITEMS = 500;
  const REFRESH_DEBOUNCE_MS = 120;

  if (
    AIW.ExecutiveTimelineEngine &&
    AIW.ExecutiveTimelineEngine.__version
  ) {
    console.warn(
      "[AIW.ExecutiveTimelineEngine] Existing instance detected:",
      AIW.ExecutiveTimelineEngine.__version
    );
    return;
  }

  const runtime = {
    initialized: false,
    started: false,
    building: false,
    pending: false,
    timerId: null,
    subscriptions: [],
    buildCount: 0,
    persistenceCount: 0,
    lastBuiltAt: null,
    lastReason: null,
    lastTimeline: null,
    lastSignature: "",
    errors: []
  };

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

  function numberValue(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
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

      if (Array.isArray(value)) return value;

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

  function getNotifications(state) {
    return firstDefined(
      getNestedValue(state, "integration.notifications.items", undefined),
      []
    ) || [];
  }

  function getAutomationHistory(state) {
    const automation = firstDefined(
      getNestedValue(state, "automation", undefined),
      getNestedValue(state, "data.automation", undefined),
      {}
    ) || {};

    return Array.isArray(automation.executionHistory)
      ? automation.executionHistory
      : [];
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

  function normalizeDate(value) {
    if (!value) return null;

    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) return null;

    return new Date(parsed).toISOString();
  }

  function timelineId(parts) {
    return parts
      .filter((part) => part !== undefined && part !== null && part !== "")
      .map((part) => String(part).replace(/\s+/g, "-"))
      .join(":");
  }

  function createItem(input = {}) {
    const date = normalizeDate(input.date);

    if (!date) return null;

    return {
      id: input.id || timelineId([
        input.type,
        input.sourceType,
        input.sourceId,
        date
      ]),
      date,
      type: input.type || "event",
      category: input.category || "general",
      title: input.title || "Timeline Event",
      description: input.description || "",
      status: input.status || null,
      severity: input.severity || "info",
      sourceType: input.sourceType || null,
      sourceId:
        input.sourceId !== undefined &&
        input.sourceId !== null
          ? String(input.sourceId)
          : null,
      parentType: input.parentType || null,
      parentId:
        input.parentId !== undefined &&
        input.parentId !== null
          ? String(input.parentId)
          : null,
      owner: input.owner || null,
      metadata: cloneSafe(input.metadata || {})
    };
  }

  function addIfValid(collection, item) {
    if (item) collection.push(item);
  }

  function buildIdeaItems(ideas) {
    const items = [];

    ideas.forEach((idea, index) => {
      const id = firstDefined(
        idea?.id,
        idea?.ideaId,
        idea?.uid,
        `idea-${index + 1}`
      );

      const title = firstDefined(
        idea?.title,
        idea?.name,
        `Idea ${index + 1}`
      );

      addIfValid(
        items,
        createItem({
          id: timelineId(["idea", id, "created"]),
          date: firstDefined(
            idea?.createdAt,
            idea?.submittedAt,
            idea?.date
          ),
          type: "idea-created",
          category: "ideas",
          title,
          description: "تم إنشاء الفكرة.",
          status: getStatus(idea),
          severity: "info",
          sourceType: "idea",
          sourceId: id,
          owner: firstDefined(
            idea?.owner,
            idea?.submitter,
            null
          ),
          metadata: idea
        })
      );

      addIfValid(
        items,
        createItem({
          id: timelineId(["idea", id, "updated"]),
          date: idea?.updatedAt,
          type: "idea-updated",
          category: "ideas",
          title,
          description: "تم تحديث بيانات الفكرة.",
          status: getStatus(idea),
          severity: "info",
          sourceType: "idea",
          sourceId: id,
          metadata: idea
        })
      );

      addIfValid(
        items,
        createItem({
          id: timelineId(["idea", id, "approved"]),
          date: idea?.approvedAt,
          type: "idea-approved",
          category: "ideas",
          title,
          description: "تم اعتماد الفكرة.",
          status: getStatus(idea),
          severity: "success",
          sourceType: "idea",
          sourceId: id,
          metadata: idea
        })
      );

      addIfValid(
        items,
        createItem({
          id: timelineId(["idea", id, "converted"]),
          date: firstDefined(
            idea?.convertedAt,
            idea?.projectCreatedAt
          ),
          type: "idea-converted",
          category: "ideas",
          title,
          description: "تم تحويل الفكرة إلى مشروع.",
          status: getStatus(idea),
          severity: "success",
          sourceType: "idea",
          sourceId: id,
          parentType: "project",
          parentId: firstDefined(
            idea?.projectId,
            idea?.convertedProjectId,
            null
          ),
          metadata: idea
        })
      );

      addIfValid(
        items,
        createItem({
          id: timelineId(["idea", id, "rejected"]),
          date: idea?.rejectedAt,
          type: "idea-rejected",
          category: "ideas",
          title,
          description: "تم رفض الفكرة.",
          status: getStatus(idea),
          severity: "warning",
          sourceType: "idea",
          sourceId: id,
          metadata: idea
        })
      );
    });

    return items;
  }

  function buildProjectItems(projects) {
    const items = [];

    projects.forEach((project, index) => {
      const id = firstDefined(
        project?.id,
        project?.projectId,
        project?.uid,
        `project-${index + 1}`
      );

      const title = firstDefined(
        project?.title,
        project?.name,
        `Project ${index + 1}`
      );

      const owner = firstDefined(
        project?.owner,
        project?.projectOwner,
        project?.manager,
        project?.lead,
        null
      );

      addIfValid(
        items,
        createItem({
          id: timelineId(["project", id, "created"]),
          date: project?.createdAt,
          type: "project-created",
          category: "projects",
          title,
          description: "تم إنشاء المشروع.",
          status: getStatus(project),
          severity: "info",
          sourceType: "project",
          sourceId: id,
          owner,
          metadata: project
        })
      );

      addIfValid(
        items,
        createItem({
          id: timelineId(["project", id, "start"]),
          date: firstDefined(
            project?.startDate,
            project?.plannedStartDate,
            project?.startedAt
          ),
          type: "project-started",
          category: "projects",
          title,
          description: "بدأ تنفيذ المشروع.",
          status: getStatus(project),
          severity: "success",
          sourceType: "project",
          sourceId: id,
          owner,
          metadata: project
        })
      );

      addIfValid(
        items,
        createItem({
          id: timelineId(["project", id, "updated"]),
          date: project?.updatedAt,
          type: "project-updated",
          category: "projects",
          title,
          description: "تم تحديث المشروع.",
          status: getStatus(project),
          severity: "info",
          sourceType: "project",
          sourceId: id,
          owner,
          metadata: project
        })
      );

      addIfValid(
        items,
        createItem({
          id: timelineId(["project", id, "paused"]),
          date: project?.pausedAt,
          type: "project-paused",
          category: "projects",
          title,
          description: "تم إيقاف المشروع مؤقتاً.",
          status: getStatus(project),
          severity: "warning",
          sourceType: "project",
          sourceId: id,
          owner,
          metadata: project
        })
      );

      addIfValid(
        items,
        createItem({
          id: timelineId(["project", id, "resumed"]),
          date: project?.resumedAt,
          type: "project-resumed",
          category: "projects",
          title,
          description: "تم استئناف المشروع.",
          status: getStatus(project),
          severity: "success",
          sourceType: "project",
          sourceId: id,
          owner,
          metadata: project
        })
      );

      addIfValid(
        items,
        createItem({
          id: timelineId(["project", id, "completed"]),
          date: firstDefined(
            project?.completedAt,
            project?.actualEndDate
          ),
          type: "project-completed",
          category: "projects",
          title,
          description: "تم إكمال المشروع.",
          status: getStatus(project),
          severity: "success",
          sourceType: "project",
          sourceId: id,
          owner,
          metadata: project
        })
      );

      addIfValid(
        items,
        createItem({
          id: timelineId(["project", id, "end"]),
          date: firstDefined(
            project?.endDate,
            project?.plannedEndDate
          ),
          type: "project-deadline",
          category: "projects",
          title,
          description: "موعد انتهاء المشروع.",
          status: getStatus(project),
          severity: "info",
          sourceType: "project",
          sourceId: id,
          owner,
          metadata: project
        })
      );

      normalizeTasks(project).forEach((task, taskIndex) => {
        const taskId = firstDefined(
          task?.id,
          task?.taskId,
          task?.checkpointId,
          `task-${taskIndex + 1}`
        );

        const taskTitle = firstDefined(
          task?.title,
          task?.name,
          `Task ${taskIndex + 1}`
        );

        addIfValid(
          items,
          createItem({
            id: timelineId(["task", id, taskId, "created"]),
            date: task?.createdAt,
            type: "task-created",
            category: "tasks",
            title: taskTitle,
            description: `تم إنشاء المهمة ضمن المشروع: ${title}.`,
            status: getStatus(task),
            severity: "info",
            sourceType: "task",
            sourceId: taskId,
            parentType: "project",
            parentId: id,
            owner: firstDefined(
              task?.owner,
              task?.assignee,
              owner
            ),
            metadata: task
          })
        );

        addIfValid(
          items,
          createItem({
            id: timelineId(["task", id, taskId, "due"]),
            date: firstDefined(
              task?.dueDate,
              task?.deadline
            ),
            type: "task-deadline",
            category: "tasks",
            title: taskTitle,
            description: `موعد استحقاق المهمة ضمن المشروع: ${title}.`,
            status: getStatus(task),
            severity: "info",
            sourceType: "task",
            sourceId: taskId,
            parentType: "project",
            parentId: id,
            owner: firstDefined(
              task?.owner,
              task?.assignee,
              owner
            ),
            metadata: task
          })
        );

        addIfValid(
          items,
          createItem({
            id: timelineId(["task", id, taskId, "completed"]),
            date: task?.completedAt,
            type: "task-completed",
            category: "tasks",
            title: taskTitle,
            description: `تم إكمال المهمة ضمن المشروع: ${title}.`,
            status: getStatus(task),
            severity: "success",
            sourceType: "task",
            sourceId: taskId,
            parentType: "project",
            parentId: id,
            owner: firstDefined(
              task?.owner,
              task?.assignee,
              owner
            ),
            metadata: task
          })
        );
      });
    });

    return items;
  }

  function buildBusinessCaseItems(businessCases) {
    const items = [];

    businessCases.forEach((businessCase, index) => {
      const id = firstDefined(
        businessCase?.id,
        businessCase?.businessCaseId,
        businessCase?.caseId,
        `business-case-${index + 1}`
      );

      const title = firstDefined(
        businessCase?.title,
        businessCase?.name,
        `Business Case ${index + 1}`
      );

      addIfValid(
        items,
        createItem({
          id: timelineId(["business-case", id, "created"]),
          date: businessCase?.createdAt,
          type: "business-case-created",
          category: "business-case",
          title,
          description: "تم إنشاء دراسة الجدوى.",
          status: getStatus(businessCase),
          severity: "info",
          sourceType: "business-case",
          sourceId: id,
          parentType: "project",
          parentId: businessCase?.projectId,
          metadata: businessCase
        })
      );

      addIfValid(
        items,
        createItem({
          id: timelineId(["business-case", id, "approved"]),
          date: businessCase?.approvedAt,
          type: "business-case-approved",
          category: "business-case",
          title,
          description: "تم اعتماد دراسة الجدوى.",
          status: getStatus(businessCase),
          severity: "success",
          sourceType: "business-case",
          sourceId: id,
          parentType: "project",
          parentId: businessCase?.projectId,
          metadata: businessCase
        })
      );

      addIfValid(
        items,
        createItem({
          id: timelineId(["business-case", id, "rejected"]),
          date: businessCase?.rejectedAt,
          type: "business-case-rejected",
          category: "business-case",
          title,
          description: "تم رفض دراسة الجدوى.",
          status: getStatus(businessCase),
          severity: "warning",
          sourceType: "business-case",
          sourceId: id,
          parentType: "project",
          parentId: businessCase?.projectId,
          metadata: businessCase
        })
      );
    });

    return items;
  }

  function buildDecisionItems(decisions) {
    const items = [];

    decisions.forEach((decision, index) => {
      const id = firstDefined(
        decision?.id,
        decision?.decisionId,
        decision?.uid,
        `decision-${index + 1}`
      );

      const title = firstDefined(
        decision?.title,
        decision?.name,
        `Decision ${index + 1}`
      );

      addIfValid(
        items,
        createItem({
          id: timelineId(["decision", id, "created"]),
          date: decision?.createdAt,
          type: "decision-created",
          category: "decisions",
          title,
          description: "تم إنشاء قرار تنفيذي.",
          status: getStatus(decision),
          severity: "info",
          sourceType: "decision",
          sourceId: id,
          parentType: firstDefined(
            decision?.projectId ? "project" : null,
            decision?.ideaId ? "idea" : null
          ),
          parentId: firstDefined(
            decision?.projectId,
            decision?.ideaId,
            null
          ),
          metadata: decision
        })
      );

      addIfValid(
        items,
        createItem({
          id: timelineId(["decision", id, "approved"]),
          date: firstDefined(
            decision?.approvedAt,
            decision?.decidedAt
          ),
          type: "decision-approved",
          category: "decisions",
          title,
          description: "تم اعتماد القرار التنفيذي.",
          status: getStatus(decision),
          severity: "success",
          sourceType: "decision",
          sourceId: id,
          parentType: firstDefined(
            decision?.projectId ? "project" : null,
            decision?.ideaId ? "idea" : null
          ),
          parentId: firstDefined(
            decision?.projectId,
            decision?.ideaId,
            null
          ),
          metadata: decision
        })
      );

      addIfValid(
        items,
        createItem({
          id: timelineId(["decision", id, "rejected"]),
          date: decision?.rejectedAt,
          type: "decision-rejected",
          category: "decisions",
          title,
          description: "تم رفض القرار التنفيذي.",
          status: getStatus(decision),
          severity: "warning",
          sourceType: "decision",
          sourceId: id,
          parentType: firstDefined(
            decision?.projectId ? "project" : null,
            decision?.ideaId ? "idea" : null
          ),
          parentId: firstDefined(
            decision?.projectId,
            decision?.ideaId,
            null
          ),
          metadata: decision
        })
      );
    });

    return items;
  }

  function buildAutomationItems(history) {
    const items = [];

    history.forEach((execution, index) => {
      const id = firstDefined(
        execution?.id,
        execution?.executionId,
        execution?.runId,
        `execution-${index + 1}`
      );

      const title = firstDefined(
        execution?.title,
        execution?.workflowTitle,
        execution?.workflowName,
        "Automation Execution"
      );

      addIfValid(
        items,
        createItem({
          id: timelineId(["automation", id]),
          date: firstDefined(
            execution?.completedAt,
            execution?.startedAt,
            execution?.createdAt,
            execution?.timestamp
          ),
          type: "automation-execution",
          category: "automation",
          title,
          description: firstDefined(
            execution?.message,
            execution?.description,
            "تم تنفيذ عملية أتمتة."
          ),
          status: getStatus(execution),
          severity:
            ["failed", "error", "فشل", "خطأ"].includes(
              getStatus(execution)
            )
              ? "high"
              : "success",
          sourceType: "automation",
          sourceId: id,
          metadata: execution
        })
      );
    });

    return items;
  }

  function buildNotificationItems(notifications) {
    return notifications
      .map((notification) =>
        createItem({
          id: timelineId(["notification", notification.id]),
          date: notification.createdAt,
          type: "notification",
          category: notification.category || "notifications",
          title: notification.title,
          description: notification.message,
          status: notification.read ? "read" : "unread",
          severity: notification.severity || "info",
          sourceType: notification.sourceType || "notification",
          sourceId: notification.sourceId || notification.id,
          metadata: notification
        })
      )
      .filter(Boolean);
  }

  function dedupeItems(items) {
    const seen = new Set();

    return items.filter((item) => {
      const key = item.id || stableSerialize([
        item.type,
        item.sourceType,
        item.sourceId,
        item.date,
        item.title
      ]);

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function groupByDate(items) {
    return items.reduce((groups, item) => {
      const dateKey = item.date.slice(0, 10);

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].push(item);
      return groups;
    }, {});
  }

  function buildSummary(items) {
    const categories = {};
    const severity = {};

    items.forEach((item) => {
      categories[item.category] =
        numberValue(categories[item.category]) + 1;

      severity[item.severity] =
        numberValue(severity[item.severity]) + 1;
    });

    return {
      totalItems: items.length,
      categories,
      severity,
      latestDate: items[0]?.date || null,
      earliestDate: items[items.length - 1]?.date || null
    };
  }

  function buildTimeline(state = getStoreState(), reason = "manual") {
    const ideas = getIdeas(state);
    const projects = getProjects(state);
    const businessCases = getBusinessCases(state);
    const decisions = getDecisions(state);
    const automationHistory = getAutomationHistory(state);
    const notifications = getNotifications(state);

    let items = [
      ...buildIdeaItems(ideas),
      ...buildProjectItems(projects),
      ...buildBusinessCaseItems(businessCases),
      ...buildDecisionItems(decisions),
      ...buildAutomationItems(automationHistory),
      ...buildNotificationItems(notifications)
    ];

    items = dedupeItems(items)
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
      .slice(0, MAX_TIMELINE_ITEMS);

    return {
      version: VERSION,
      generatedAt: nowISO(),
      reason,
      summary: buildSummary(items),
      groups: groupByDate(items),
      items,
      sourceCounts: {
        ideas: ideas.length,
        projects: projects.length,
        businessCases: businessCases.length,
        decisions: decisions.length,
        automationExecutions: automationHistory.length,
        notifications: notifications.length
      }
    };
  }

  function writeStore(path, value) {
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

      if (!parts.length) {
        store.patch({ [root]: cloneSafe(value) });
        return true;
      }

      const state = getStoreState();
      const rootValue = cloneSafe(state[root] || {});
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

    throw new Error("AIW.Store does not expose set() or patch().");
  }

  function persist(timeline) {
    try {
      const signature = stableSerialize(timeline);

      if (signature === runtime.lastSignature) {
        return false;
      }

      writeStore(STORE_PATH, timeline);

      runtime.lastSignature = signature;
      runtime.persistenceCount += 1;

      return true;
    } catch (error) {
      recordError("persist", error, { timeline });
      return false;
    }
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
            source: "AIW.ExecutiveTimelineEngine",
            broadcast: true
          }
        );
      }
    } catch (error) {
      safeConsole(
        "warn",
        `[AIW.ExecutiveTimelineEngine] Event failed: ${eventName}`,
        error
      );
    }

    return null;
  }

  function dispatchDOMEvent(timeline) {
    try {
      global.dispatchEvent(
        new CustomEvent("aiw:timeline:updated", {
          detail: cloneSafe(timeline)
        })
      );

      document.dispatchEvent(
        new CustomEvent("aiw:timeline:updated", {
          detail: cloneSafe(timeline)
        })
      );

      return true;
    } catch (error) {
      recordError("dispatchDOMEvent", error);
      return false;
    }
  }

  async function build(reason = "manual", options = {}) {
    if (runtime.building) {
      runtime.pending = true;
      return runtime.lastTimeline;
    }

    runtime.building = true;
    runtime.pending = false;

    try {
      const state = getStoreState();
      const timeline = buildTimeline(state, reason);

      runtime.buildCount += 1;
      runtime.lastBuiltAt = timeline.generatedAt;
      runtime.lastReason = reason;
      runtime.lastTimeline = cloneSafe(timeline);

      const persisted =
        options.persist === false
          ? false
          : persist(timeline);

      dispatchDOMEvent(timeline);

      await emitSafe("timeline.updated", {
        reason,
        persisted,
        timeline
      });

      return cloneSafe(timeline);
    } catch (error) {
      recordError("build", error, { reason, options });
      return runtime.lastTimeline;
    } finally {
      runtime.building = false;

      if (runtime.pending) {
        runtime.pending = false;
        schedule("pending-build");
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
      build(reason);
    }, REFRESH_DEBOUNCE_MS);

    return true;
  }

  function subscribe(eventName, handler, priority = 0) {
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
        source: "AIW.ExecutiveTimelineEngine",
        priority
      }
    );

    runtime.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  function registerListeners() {
    [
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

      "business-case.created",
      "business-case.updated",
      "business-case.approved",
      "business-case.rejected",

      "decision.created",
      "decision.updated",
      "decision.approved",
      "decision.rejected",

      "automation.triggered",
      "automation.completed",
      "automation.failed",

      "notification.created",
      "notification.read",
      "store.restored"
    ].forEach((eventName) => {
      subscribe(eventName, () => {
        schedule(eventName);
      });
    });

    subscribe(
      "integration.ready",
      (payload) => {
        if (payload?.component === COMPONENT) return;
        schedule(
          `integration.ready:${payload?.component || "unknown"}`
        );
      },
      -10
    );
  }

  function unsubscribeAll() {
    runtime.subscriptions.forEach((unsubscribe) => {
      try {
        if (typeof unsubscribe === "function") unsubscribe();
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
          "AIW.Store is required before Executive Timeline Engine."
        );
      }

      if (!AIW.EventBus) {
        throw new Error(
          "AIW.EventBus is required before Executive Timeline Engine."
        );
      }

      registerListeners();

      runtime.initialized = true;
      runtime.started = true;

      schedule("startup");

      emitSafe("integration.ready", {
        component: COMPONENT,
        version: VERSION
      });

      safeConsole(
        "info",
        `[AIW.ExecutiveTimelineEngine] V${VERSION} started successfully.`
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
    runtime.pending = false;

    return getDiagnostics();
  }

  function restart() {
    stop();
    return start();
  }

  function getTimeline() {
    return cloneSafe(runtime.lastTimeline);
  }

  function query(filters = {}) {
    const items = runtime.lastTimeline?.items || [];

    return cloneSafe(
      items.filter((item) => {
        if (
          filters.category &&
          item.category !== filters.category
        ) {
          return false;
        }

        if (
          filters.type &&
          item.type !== filters.type
        ) {
          return false;
        }

        if (
          filters.sourceType &&
          item.sourceType !== filters.sourceType
        ) {
          return false;
        }

        if (
          filters.sourceId &&
          String(item.sourceId) !== String(filters.sourceId)
        ) {
          return false;
        }

        if (
          filters.parentId &&
          String(item.parentId) !== String(filters.parentId)
        ) {
          return false;
        }

        if (
          filters.severity &&
          item.severity !== filters.severity
        ) {
          return false;
        }

        if (
          filters.dateFrom &&
          Date.parse(item.date) < Date.parse(filters.dateFrom)
        ) {
          return false;
        }

        if (
          filters.dateTo &&
          Date.parse(item.date) > Date.parse(filters.dateTo)
        ) {
          return false;
        }

        return true;
      })
    );
  }

  function getEntityHistory(sourceType, sourceId) {
    return query({
      sourceType,
      sourceId
    });
  }

  function getProjectHistory(projectId) {
    const items = runtime.lastTimeline?.items || [];

    return cloneSafe(
      items.filter((item) => {
        return (
          (item.sourceType === "project" &&
            String(item.sourceId) === String(projectId)) ||
          (item.parentType === "project" &&
            String(item.parentId) === String(projectId))
        );
      })
    );
  }

  function recordError(scope, error, metadata = {}) {
    const item = {
      id: `timeline-engine-error-${Date.now()}-${runtime.errors.length + 1}`,
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
      `[AIW.ExecutiveTimelineEngine] ${scope} failed.`,
      error
    );

    emitSafe("integration.error", {
      component: COMPONENT,
      error: item
    });
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
      building: runtime.building,
      pending: runtime.pending,
      buildCount: runtime.buildCount,
      persistenceCount: runtime.persistenceCount,
      lastBuiltAt: runtime.lastBuiltAt,
      lastReason: runtime.lastReason,
      subscriptionCount: runtime.subscriptions.length,
      errorCount: runtime.errors.length,
      storePath: STORE_PATH,
      maxTimelineItems: MAX_TIMELINE_ITEMS,
      refreshDebounceMs: REFRESH_DEBOUNCE_MS,
      hasTimeline: Boolean(runtime.lastTimeline),
      timelineItemCount:
        runtime.lastTimeline?.summary?.totalItems || 0
    };
  }

  AIW.ExecutiveTimelineEngine = Object.freeze({
    __version: VERSION,

    start,
    stop,
    restart,

    build,
    schedule,
    buildTimeline,

    getTimeline,
    query,
    getEntityHistory,
    getProjectHistory,

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
