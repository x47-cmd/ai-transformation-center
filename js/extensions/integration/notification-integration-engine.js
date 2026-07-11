/* =========================================================
   AI Work - Notification Integration Engine V1.0
   Phase 8: Enterprise Integration Layer

   File Path:
   js/extensions/integration/notification-integration-engine.js

   Depends On:
   - AIW.Store V2.3+
   - AIW.EventBus V1.0+
   - AIW.IntegrationCore V1.0+
   - AIW.KPIAutoEngine V1.0+
   - AIW.DashboardAutoSync V1.0+
   - AIW.ReportsAutoBuilder V1.0+

   Purpose:
   - Convert enterprise events into centralized notifications
   - Persist notifications into integration.notifications
   - Prevent duplicate alerts
   - Support read/unread, dismiss, clear, severity, category,
     source linking, retention, and diagnostics
   - Keep existing modules and UI untouched

   Recommended Load Order:
   1) event-bus.js
   2) integration-core.js
   3) kpi-auto-engine.js
   4) dashboard-auto-sync.js
   5) reports-auto-builder.js
   6) notification-integration-engine.js
========================================================= */

(function initAIWNotificationIntegrationEngine(global) {
  "use strict";

  global.AIW = global.AIW || {};
  const AIW = global.AIW;

  const VERSION = "1.0.0";
  const COMPONENT = "notification-integration-engine";
  const STORE_PATH = "integration.notifications";
  const MAX_NOTIFICATIONS = 250;
  const DEFAULT_RETENTION_DAYS = 90;
  const DEDUPE_WINDOW_MS = 60 * 1000;

  if (
    AIW.NotificationIntegrationEngine &&
    AIW.NotificationIntegrationEngine.__version
  ) {
    console.warn(
      "[AIW.NotificationIntegrationEngine] Existing instance detected:",
      AIW.NotificationIntegrationEngine.__version
    );
    return;
  }

  const runtime = {
    initialized: false,
    started: false,
    subscriptions: [],
    notificationCount: 0,
    persistenceCount: 0,
    lastCreatedAt: null,
    lastActionAt: null,
    lastReason: null,
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

  function getNotificationState() {
    const state = getStoreState();

    const current = firstDefined(
      getNestedValue(state, STORE_PATH, undefined),
      {}
    ) || {};

    const items = Array.isArray(current.items)
      ? current.items
      : [];

    return {
      version: VERSION,
      updatedAt: current.updatedAt || null,
      retentionDays: numberValue(
        current.retentionDays,
        DEFAULT_RETENTION_DAYS
      ),
      unreadCount: numberValue(current.unreadCount),
      totalCount: numberValue(current.totalCount, items.length),
      items: cloneSafe(items)
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

  function persistState(notificationState) {
    try {
      writeStore(STORE_PATH, notificationState);
      runtime.persistenceCount += 1;
      runtime.lastActionAt = nowISO();
      return true;
    } catch (error) {
      recordError("persistState", error, { notificationState });
      return false;
    }
  }

  function emitSafe(eventName, payload = {}) {
    try {
      if (
        AIW.EventBus &&
        typeof AIW.EventBus.emit === "function"
      ) {
        return AIW.EventBus.emit(
          eventName,
          cloneSafe(payload),
          {
            source: "AIW.NotificationIntegrationEngine",
            broadcast: true
          }
        );
      }
    } catch (error) {
      safeConsole(
        "warn",
        `[AIW.NotificationIntegrationEngine] Event failed: ${eventName}`,
        error
      );
    }

    return null;
  }

  function createId() {
    return `notification-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  function normalizeSeverity(value) {
    const severity = String(value || "")
      .trim()
      .toLowerCase();

    if (["critical", "urgent", "حرج"].includes(severity)) {
      return "critical";
    }

    if (["high", "error", "danger", "مرتفع"].includes(severity)) {
      return "high";
    }

    if (["warning", "medium", "متوسط", "تحذير"].includes(severity)) {
      return "warning";
    }

    if (["success", "completed", "ناجح"].includes(severity)) {
      return "success";
    }

    return "info";
  }

  function normalizeCategory(value) {
    const category = String(value || "general")
      .trim()
      .toLowerCase();

    return category || "general";
  }

  function buildDedupeKey(input) {
    return [
      input.category || "general",
      input.sourceType || "",
      input.sourceId || "",
      input.eventName || "",
      input.title || "",
      input.message || ""
    ].join("|");
  }

  function isDuplicate(items, dedupeKey) {
    const now = Date.now();

    return items.some((item) => {
      if (item.dedupeKey !== dedupeKey) return false;

      const createdAt = Date.parse(item.createdAt || "");
      if (Number.isNaN(createdAt)) return false;

      return now - createdAt <= DEDUPE_WINDOW_MS;
    });
  }

  function purgeExpired(items, retentionDays) {
    const cutoff =
      Date.now() -
      numberValue(retentionDays, DEFAULT_RETENTION_DAYS) *
        24 *
        60 *
        60 *
        1000;

    return items.filter((item) => {
      const createdAt = Date.parse(item.createdAt || "");
      if (Number.isNaN(createdAt)) return true;
      return createdAt >= cutoff;
    });
  }

  function finalizeState(items, currentState) {
    const trimmed = items
      .sort((a, b) => {
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      })
      .slice(0, MAX_NOTIFICATIONS);

    return {
      version: VERSION,
      updatedAt: nowISO(),
      retentionDays:
        currentState.retentionDays || DEFAULT_RETENTION_DAYS,
      totalCount: trimmed.length,
      unreadCount: trimmed.filter(
        (item) => !item.read && !item.dismissed
      ).length,
      items: trimmed
    };
  }

  function createNotification(input = {}) {
    try {
      const currentState = getNotificationState();
      let items = purgeExpired(
        currentState.items,
        currentState.retentionDays
      );

      const notification = {
        id: input.id || createId(),
        title: String(input.title || "تنبيه جديد"),
        message: String(input.message || ""),
        severity: normalizeSeverity(input.severity),
        category: normalizeCategory(input.category),
        sourceType: input.sourceType || null,
        sourceId:
          input.sourceId !== undefined &&
          input.sourceId !== null
            ? String(input.sourceId)
            : null,
        eventName: input.eventName || null,
        action: cloneSafe(input.action || null),
        metadata: cloneSafe(input.metadata || {}),
        createdAt: input.createdAt || nowISO(),
        read: Boolean(input.read),
        readAt: input.readAt || null,
        dismissed: Boolean(input.dismissed),
        dismissedAt: input.dismissedAt || null
      };

      notification.dedupeKey =
        input.dedupeKey || buildDedupeKey(notification);

      if (
        input.allowDuplicate !== true &&
        isDuplicate(items, notification.dedupeKey)
      ) {
        return null;
      }

      items.unshift(notification);

      const nextState = finalizeState(items, currentState);
      persistState(nextState);

      runtime.notificationCount += 1;
      runtime.lastCreatedAt = notification.createdAt;
      runtime.lastReason =
        input.eventName || input.reason || "manual";

      emitSafe("notification.created", {
        notification,
        unreadCount: nextState.unreadCount,
        totalCount: nextState.totalCount
      });

      dispatchDOMEvent("aiw:notifications:updated", {
        notification,
        state: nextState
      });

      return cloneSafe(notification);
    } catch (error) {
      recordError("createNotification", error, { input });
      return null;
    }
  }

  function updateNotification(id, changes = {}) {
    try {
      const currentState = getNotificationState();

      const items = currentState.items.map((item) => {
        if (String(item.id) !== String(id)) return item;

        return {
          ...item,
          ...cloneSafe(changes)
        };
      });

      const nextState = finalizeState(items, currentState);
      persistState(nextState);

      dispatchDOMEvent("aiw:notifications:updated", {
        notificationId: id,
        changes,
        state: nextState
      });

      return true;
    } catch (error) {
      recordError("updateNotification", error, { id, changes });
      return false;
    }
  }

  function markRead(id) {
    const success = updateNotification(id, {
      read: true,
      readAt: nowISO()
    });

    if (success) {
      emitSafe("notification.read", {
        notificationId: String(id)
      });
    }

    return success;
  }

  function markUnread(id) {
    return updateNotification(id, {
      read: false,
      readAt: null
    });
  }

  function markAllRead() {
    try {
      const currentState = getNotificationState();
      const readAt = nowISO();

      const items = currentState.items.map((item) => ({
        ...item,
        read: true,
        readAt
      }));

      const nextState = finalizeState(items, currentState);
      persistState(nextState);

      dispatchDOMEvent("aiw:notifications:updated", {
        action: "mark-all-read",
        state: nextState
      });

      return true;
    } catch (error) {
      recordError("markAllRead", error);
      return false;
    }
  }

  function dismiss(id) {
    return updateNotification(id, {
      dismissed: true,
      dismissedAt: nowISO()
    });
  }

  function restore(id) {
    return updateNotification(id, {
      dismissed: false,
      dismissedAt: null
    });
  }

  function remove(id) {
    try {
      const currentState = getNotificationState();

      const items = currentState.items.filter(
        (item) => String(item.id) !== String(id)
      );

      const nextState = finalizeState(items, currentState);
      persistState(nextState);

      dispatchDOMEvent("aiw:notifications:updated", {
        action: "remove",
        notificationId: String(id),
        state: nextState
      });

      return true;
    } catch (error) {
      recordError("remove", error, { id });
      return false;
    }
  }

  function clear(options = {}) {
    try {
      const currentState = getNotificationState();

      let items = currentState.items;

      if (options.readOnly) {
        items = items.filter((item) => !item.read);
      } else if (options.dismissedOnly) {
        items = items.filter((item) => !item.dismissed);
      } else {
        items = [];
      }

      const nextState = finalizeState(items, currentState);
      persistState(nextState);

      dispatchDOMEvent("aiw:notifications:updated", {
        action: "clear",
        options,
        state: nextState
      });

      return true;
    } catch (error) {
      recordError("clear", error, { options });
      return false;
    }
  }

  function getNotifications(filters = {}) {
    const state = getNotificationState();

    return state.items.filter((item) => {
      if (
        filters.unreadOnly &&
        (item.read || item.dismissed)
      ) {
        return false;
      }

      if (
        filters.category &&
        item.category !== normalizeCategory(filters.category)
      ) {
        return false;
      }

      if (
        filters.severity &&
        item.severity !== normalizeSeverity(filters.severity)
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
        filters.includeDismissed !== true &&
        item.dismissed
      ) {
        return false;
      }

      return true;
    });
  }

  function getUnreadCount() {
    return getNotificationState().unreadCount;
  }

  function dispatchDOMEvent(name, detail) {
    try {
      global.dispatchEvent(
        new CustomEvent(name, {
          detail: cloneSafe(detail)
        })
      );

      document.dispatchEvent(
        new CustomEvent(name, {
          detail: cloneSafe(detail)
        })
      );

      return true;
    } catch (error) {
      safeConsole(
        "warn",
        `[AIW.NotificationIntegrationEngine] DOM event failed: ${name}`,
        error
      );
      return false;
    }
  }

  function entityTitle(payload, fallback) {
    return firstDefined(
      payload?.project?.title,
      payload?.project?.name,
      payload?.idea?.title,
      payload?.idea?.name,
      payload?.task?.title,
      payload?.task?.name,
      payload?.businessCase?.title,
      payload?.businessCase?.name,
      payload?.decision?.title,
      payload?.decision?.name,
      fallback
    );
  }

  function entityId(payload) {
    return firstDefined(
      payload?.projectId,
      payload?.ideaId,
      payload?.taskId,
      payload?.businessCaseId,
      payload?.decisionId,
      payload?.entityId,
      null
    );
  }

  function notifyFromEvent(eventName, payload = {}) {
    const title = entityTitle(payload, "تحديث في المنصة");
    const sourceId = entityId(payload);

    const definitions = {
      "idea.approved": {
        severity: "success",
        category: "ideas",
        title: "تم اعتماد فكرة",
        message: `تم اعتماد الفكرة: ${title}.`,
        sourceType: "idea"
      },
      "idea.rejected": {
        severity: "warning",
        category: "ideas",
        title: "تم رفض فكرة",
        message: `تم رفض الفكرة: ${title}.`,
        sourceType: "idea"
      },
      "idea.converted": {
        severity: "success",
        category: "ideas",
        title: "تم تحويل فكرة إلى مشروع",
        message: `تحولت الفكرة ${title} إلى مشروع تنفيذي.`,
        sourceType: "idea"
      },
      "project.created": {
        severity: "info",
        category: "projects",
        title: "مشروع جديد",
        message: `تم إنشاء المشروع: ${title}.`,
        sourceType: "project"
      },
      "project.started": {
        severity: "success",
        category: "projects",
        title: "بدأ تنفيذ مشروع",
        message: `بدأ تنفيذ المشروع: ${title}.`,
        sourceType: "project"
      },
      "project.paused": {
        severity: "warning",
        category: "projects",
        title: "تم إيقاف مشروع",
        message: `تم إيقاف المشروع مؤقتاً: ${title}.`,
        sourceType: "project"
      },
      "project.resumed": {
        severity: "success",
        category: "projects",
        title: "تم استئناف مشروع",
        message: `تم استئناف المشروع: ${title}.`,
        sourceType: "project"
      },
      "project.completed": {
        severity: "success",
        category: "projects",
        title: "اكتمل مشروع",
        message: `تم إكمال المشروع: ${title}.`,
        sourceType: "project"
      },
      "project.canceled": {
        severity: "high",
        category: "projects",
        title: "تم إلغاء مشروع",
        message: `تم إلغاء المشروع: ${title}.`,
        sourceType: "project"
      },
      "task.completed": {
        severity: "success",
        category: "tasks",
        title: "اكتملت مهمة",
        message: `تم إكمال المهمة: ${title}.`,
        sourceType: "task"
      },
      "task.reopened": {
        severity: "warning",
        category: "tasks",
        title: "أعيد فتح مهمة",
        message: `تمت إعادة فتح المهمة: ${title}.`,
        sourceType: "task"
      },
      "business-case.approved": {
        severity: "success",
        category: "business-case",
        title: "تم اعتماد دراسة جدوى",
        message: `تم اعتماد دراسة الجدوى: ${title}.`,
        sourceType: "business-case"
      },
      "business-case.rejected": {
        severity: "warning",
        category: "business-case",
        title: "تم رفض دراسة جدوى",
        message: `تم رفض دراسة الجدوى: ${title}.`,
        sourceType: "business-case"
      },
      "decision.approved": {
        severity: "success",
        category: "decisions",
        title: "تم اعتماد قرار",
        message: `تم اعتماد القرار: ${title}.`,
        sourceType: "decision"
      },
      "decision.rejected": {
        severity: "warning",
        category: "decisions",
        title: "تم رفض قرار",
        message: `تم رفض القرار: ${title}.`,
        sourceType: "decision"
      },
      "automation.failed": {
        severity: "high",
        category: "automation",
        title: "فشل تنفيذ أتمتة",
        message: "فشلت إحدى عمليات الأتمتة وتحتاج إلى مراجعة.",
        sourceType: "automation"
      }
    };

    const definition = definitions[eventName];
    if (!definition) return null;

    return createNotification({
      ...definition,
      sourceId,
      eventName,
      metadata: payload
    });
  }

  function notifyPlatformHealth(payload = {}) {
    const score = numberValue(payload?.health?.score);

    if (score >= 70) return null;

    return createNotification({
      severity: score < 50 ? "critical" : "warning",
      category: "platform",
      title: "انخفاض صحة المنصة",
      message: `سجلت صحة المنصة ${score}%.`,
      sourceType: "platform",
      sourceId: "platform-health",
      eventName: "platform-health.updated",
      metadata: payload
    });
  }

  function notifyReportRisks(payload = {}) {
    const risks = payload?.report?.risks;

    if (!Array.isArray(risks)) return [];

    return risks
      .filter((risk) =>
        ["critical", "high"].includes(
          normalizeSeverity(risk.severity)
        )
      )
      .slice(0, 5)
      .map((risk) =>
        createNotification({
          severity: risk.severity,
          category: "risk",
          title: risk.title || "مخاطر تنفيذية",
          message: risk.message || "تم رصد خطر تنفيذي.",
          sourceType: risk.source || "report",
          sourceId: risk.sourceId || risk.id,
          eventName: "report.generated",
          metadata: risk
        })
      )
      .filter(Boolean);
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
        source: "AIW.NotificationIntegrationEngine",
        priority
      }
    );

    runtime.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  function registerListeners() {
    [
      "idea.approved",
      "idea.rejected",
      "idea.converted",
      "project.created",
      "project.started",
      "project.paused",
      "project.resumed",
      "project.completed",
      "project.canceled",
      "task.completed",
      "task.reopened",
      "business-case.approved",
      "business-case.rejected",
      "decision.approved",
      "decision.rejected",
      "automation.failed"
    ].forEach((eventName) => {
      subscribe(eventName, (payload) => {
        notifyFromEvent(eventName, payload);
      });
    });

    subscribe("platform-health.updated", (payload) => {
      notifyPlatformHealth(payload);
    });

    subscribe("report.generated", (payload, context) => {
      if (
        context?.source ===
        "AIW.NotificationIntegrationEngine"
      ) {
        return;
      }

      notifyReportRisks(payload);
    });

    subscribe("store.restored", () => {
      createNotification({
        severity: "info",
        category: "system",
        title: "تمت استعادة بيانات المنصة",
        message: "تمت استعادة نسخة البيانات بنجاح.",
        sourceType: "store",
        sourceId: "restore",
        eventName: "store.restored"
      });
    });
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
          "AIW.Store is required before Notification Integration Engine."
        );
      }

      if (!AIW.EventBus) {
        throw new Error(
          "AIW.EventBus is required before Notification Integration Engine."
        );
      }

      registerListeners();

      runtime.initialized = true;
      runtime.started = true;

      emitSafe("integration.ready", {
        component: COMPONENT,
        version: VERSION
      });

      safeConsole(
        "info",
        `[AIW.NotificationIntegrationEngine] V${VERSION} started successfully.`
      );

      return getDiagnostics();
    } catch (error) {
      recordError("start", error);
      runtime.started = false;
      return getDiagnostics();
    }
  }

  function stop() {
    unsubscribeAll();
    runtime.started = false;
    return getDiagnostics();
  }

  function restart() {
    stop();
    return start();
  }

  function recordError(scope, error, metadata = {}) {
    const item = {
      id: `notification-engine-error-${Date.now()}-${runtime.errors.length + 1}`,
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
      `[AIW.NotificationIntegrationEngine] ${scope} failed.`,
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
    const state = getNotificationState();

    return {
      version: VERSION,
      component: COMPONENT,
      initialized: runtime.initialized,
      started: runtime.started,
      subscriptionCount: runtime.subscriptions.length,
      notificationCount: runtime.notificationCount,
      persistenceCount: runtime.persistenceCount,
      lastCreatedAt: runtime.lastCreatedAt,
      lastActionAt: runtime.lastActionAt,
      lastReason: runtime.lastReason,
      errorCount: runtime.errors.length,
      storePath: STORE_PATH,
      maxNotifications: MAX_NOTIFICATIONS,
      retentionDays: state.retentionDays,
      totalStored: state.totalCount,
      unreadStored: state.unreadCount
    };
  }

  AIW.NotificationIntegrationEngine = Object.freeze({
    __version: VERSION,

    start,
    stop,
    restart,

    createNotification,
    notifyFromEvent,

    getNotifications,
    getUnreadCount,

    markRead,
    markUnread,
    markAllRead,
    dismiss,
    restore,
    remove,
    clear,

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
