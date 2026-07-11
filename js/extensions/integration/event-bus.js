/* =========================================================
   AI Work - Enterprise Event Bus V1.0
   Phase 8: Enterprise Integration Layer

   File Path:
   js/extensions/integration/event-bus.js

   Purpose:
   - Central event communication layer between modules
   - Decouples Ideas, Projects, KPIs, Reports, Dashboard,
     Automation, Decision, Notifications, and future extensions
   - Supports synchronous and asynchronous handlers
   - Supports priorities, once-only listeners, wildcards,
     event history, diagnostics, and safe error isolation
   - Does not modify existing modules or UI design

   Recommended Load Order:
   1) store.js
   2) core engines
   3) modules
   4) js/extensions/integration/event-bus.js
   5) other Phase 8 integration extensions
========================================================= */

(function initAIWEventBus(global) {
  "use strict";

  global.AIW = global.AIW || {};
  const AIW = global.AIW;

  if (AIW.EventBus && AIW.EventBus.__version) {
    console.warn(
      "[AIW.EventBus] Existing instance detected:",
      AIW.EventBus.__version
    );
    return;
  }

  const VERSION = "1.0.0";
  const HISTORY_LIMIT = 300;
  const DEFAULT_PRIORITY = 0;

  const listeners = new Map();
  const wildcardListeners = new Map();
  const eventHistory = [];
  const activeDispatches = new Set();

  let listenerSequence = 0;
  let eventSequence = 0;
  let isPaused = false;

  function nowISO() {
    return new Date().toISOString();
  }

  function normalizeEventName(eventName) {
    if (typeof eventName !== "string") return "";
    return eventName.trim().toLowerCase();
  }

  function isValidHandler(handler) {
    return typeof handler === "function";
  }

  function createListenerId() {
    listenerSequence += 1;
    return `aiw-listener-${Date.now()}-${listenerSequence}`;
  }

  function createEventId() {
    eventSequence += 1;
    return `aiw-event-${Date.now()}-${eventSequence}`;
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

  function safeConsole(method, ...args) {
    try {
      const fn = console && console[method];
      if (typeof fn === "function") fn.apply(console, args);
    } catch (_) {}
  }

  function matchesWildcard(pattern, eventName) {
    if (!pattern.includes("*")) return pattern === eventName;

    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*");

    const regex = new RegExp(`^${escaped}$`);
    return regex.test(eventName);
  }

  function getListenersForEvent(eventName) {
    const exact = listeners.get(eventName) || [];
    const wildcards = [];

    wildcardListeners.forEach((group, pattern) => {
      if (matchesWildcard(pattern, eventName)) {
        wildcards.push(...group);
      }
    });

    return [...exact, ...wildcards].sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.createdOrder - b.createdOrder;
    });
  }

  function recordHistory(entry) {
    eventHistory.push(entry);

    if (eventHistory.length > HISTORY_LIMIT) {
      eventHistory.splice(0, eventHistory.length - HISTORY_LIMIT);
    }
  }

  function removeListenerById(listenerId) {
    let removed = false;

    const removeFromMap = (map) => {
      map.forEach((group, key) => {
        const next = group.filter((item) => item.id !== listenerId);

        if (next.length !== group.length) {
          removed = true;

          if (next.length) {
            map.set(key, next);
          } else {
            map.delete(key);
          }
        }
      });
    };

    removeFromMap(listeners);
    removeFromMap(wildcardListeners);

    return removed;
  }

  function subscribe(eventName, handler, options = {}) {
    const normalized = normalizeEventName(eventName);

    if (!normalized) {
      throw new Error("[AIW.EventBus] Event name is required.");
    }

    if (!isValidHandler(handler)) {
      throw new TypeError("[AIW.EventBus] Event handler must be a function.");
    }

    const listener = {
      id: options.id || createListenerId(),
      eventName: normalized,
      handler,
      once: Boolean(options.once),
      priority: Number.isFinite(Number(options.priority))
        ? Number(options.priority)
        : DEFAULT_PRIORITY,
      source: options.source || "anonymous",
      createdAt: nowISO(),
      createdOrder: listenerSequence,
      metadata: cloneSafe(options.metadata || {})
    };

    const targetMap = normalized.includes("*")
      ? wildcardListeners
      : listeners;

    const group = targetMap.get(normalized) || [];
    group.push(listener);
    targetMap.set(normalized, group);

    return function unsubscribe() {
      return removeListenerById(listener.id);
    };
  }

  function once(eventName, handler, options = {}) {
    return subscribe(eventName, handler, {
      ...options,
      once: true
    });
  }

  function unsubscribe(eventName, handlerOrId) {
    const normalized = normalizeEventName(eventName);
    if (!normalized) return false;

    const targetMap = normalized.includes("*")
      ? wildcardListeners
      : listeners;

    const group = targetMap.get(normalized);
    if (!group || !group.length) return false;

    const next = group.filter((item) => {
      if (typeof handlerOrId === "function") {
        return item.handler !== handlerOrId;
      }
      return item.id !== handlerOrId;
    });

    if (next.length === group.length) return false;

    if (next.length) {
      targetMap.set(normalized, next);
    } else {
      targetMap.delete(normalized);
    }

    return true;
  }

  function clear(eventName) {
    if (!eventName) {
      listeners.clear();
      wildcardListeners.clear();
      return true;
    }

    const normalized = normalizeEventName(eventName);
    if (!normalized) return false;

    listeners.delete(normalized);
    wildcardListeners.delete(normalized);
    return true;
  }

  function createEventContext(eventName, payload, options = {}) {
    const eventId = createEventId();

    return {
      id: eventId,
      name: eventName,
      payload,
      source: options.source || "unknown",
      timestamp: nowISO(),
      metadata: cloneSafe(options.metadata || {}),
      cancelable: options.cancelable !== false,
      canceled: false,
      cancelReason: "",
      stopped: false,
      errors: [],
      results: [],
      cancel(reason = "Canceled by listener") {
        if (!this.cancelable) return false;
        this.canceled = true;
        this.cancelReason = String(reason || "Canceled by listener");
        return true;
      },
      stopPropagation() {
        this.stopped = true;
      }
    };
  }

  async function emit(eventName, payload = {}, options = {}) {
    const normalized = normalizeEventName(eventName);

    if (!normalized) {
      throw new Error("[AIW.EventBus] Event name is required.");
    }

    const context = createEventContext(
      normalized,
      cloneSafe(payload),
      options
    );

    if (isPaused && !options.force) {
      const pausedRecord = {
        id: context.id,
        name: normalized,
        source: context.source,
        timestamp: context.timestamp,
        status: "paused",
        payload: cloneSafe(context.payload),
        listenerCount: 0,
        durationMs: 0,
        canceled: false,
        cancelReason: "",
        errors: []
      };

      recordHistory(pausedRecord);
      return context;
    }

    const handlers = getListenersForEvent(normalized);
    const startedAt = performance.now
      ? performance.now()
      : Date.now();

    activeDispatches.add(context.id);

    for (const listener of handlers) {
      if (context.stopped) break;

      try {
        const result = await listener.handler(
          context.payload,
          context
        );

        context.results.push({
          listenerId: listener.id,
          source: listener.source,
          result
        });
      } catch (error) {
        const errorInfo = {
          listenerId: listener.id,
          source: listener.source,
          message: error?.message || String(error),
          stack: error?.stack || null
        };

        context.errors.push(errorInfo);

        safeConsole(
          "error",
          `[AIW.EventBus] Listener failed for "${normalized}"`,
          error
        );

        if (options.stopOnError) {
          context.stopPropagation();
        }
      } finally {
        if (listener.once) {
          removeListenerById(listener.id);
        }
      }
    }

    const endedAt = performance.now
      ? performance.now()
      : Date.now();

    activeDispatches.delete(context.id);

    const historyRecord = {
      id: context.id,
      name: normalized,
      source: context.source,
      timestamp: context.timestamp,
      status: context.errors.length ? "completed_with_errors" : "completed",
      payload: cloneSafe(context.payload),
      listenerCount: handlers.length,
      durationMs: Math.max(0, Math.round((endedAt - startedAt) * 100) / 100),
      canceled: context.canceled,
      cancelReason: context.cancelReason,
      errors: cloneSafe(context.errors)
    };

    recordHistory(historyRecord);

    if (options.broadcast !== false) {
      broadcastToWindow(normalized, context);
    }

    return context;
  }

  function emitSync(eventName, payload = {}, options = {}) {
    const normalized = normalizeEventName(eventName);

    if (!normalized) {
      throw new Error("[AIW.EventBus] Event name is required.");
    }

    const context = createEventContext(
      normalized,
      cloneSafe(payload),
      options
    );

    if (isPaused && !options.force) {
      recordHistory({
        id: context.id,
        name: normalized,
        source: context.source,
        timestamp: context.timestamp,
        status: "paused",
        payload: cloneSafe(context.payload),
        listenerCount: 0,
        durationMs: 0,
        canceled: false,
        cancelReason: "",
        errors: []
      });

      return context;
    }

    const handlers = getListenersForEvent(normalized);
    const startedAt = performance.now
      ? performance.now()
      : Date.now();

    activeDispatches.add(context.id);

    for (const listener of handlers) {
      if (context.stopped) break;

      try {
        const result = listener.handler(
          context.payload,
          context
        );

        if (result && typeof result.then === "function") {
          safeConsole(
            "warn",
            `[AIW.EventBus] Async listener used during emitSync for "${normalized}".`
          );
        }

        context.results.push({
          listenerId: listener.id,
          source: listener.source,
          result
        });
      } catch (error) {
        const errorInfo = {
          listenerId: listener.id,
          source: listener.source,
          message: error?.message || String(error),
          stack: error?.stack || null
        };

        context.errors.push(errorInfo);

        safeConsole(
          "error",
          `[AIW.EventBus] Sync listener failed for "${normalized}"`,
          error
        );

        if (options.stopOnError) {
          context.stopPropagation();
        }
      } finally {
        if (listener.once) {
          removeListenerById(listener.id);
        }
      }
    }

    const endedAt = performance.now
      ? performance.now()
      : Date.now();

    activeDispatches.delete(context.id);

    recordHistory({
      id: context.id,
      name: normalized,
      source: context.source,
      timestamp: context.timestamp,
      status: context.errors.length ? "completed_with_errors" : "completed",
      payload: cloneSafe(context.payload),
      listenerCount: handlers.length,
      durationMs: Math.max(0, Math.round((endedAt - startedAt) * 100) / 100),
      canceled: context.canceled,
      cancelReason: context.cancelReason,
      errors: cloneSafe(context.errors)
    });

    if (options.broadcast !== false) {
      broadcastToWindow(normalized, context);
    }

    return context;
  }

  function broadcastToWindow(eventName, context) {
    try {
      if (
        typeof global.dispatchEvent !== "function" ||
        typeof global.CustomEvent !== "function"
      ) {
        return;
      }

      global.dispatchEvent(
        new CustomEvent(`aiw:${eventName}`, {
          detail: {
            id: context.id,
            name: context.name,
            payload: cloneSafe(context.payload),
            source: context.source,
            timestamp: context.timestamp,
            canceled: context.canceled,
            cancelReason: context.cancelReason,
            errors: cloneSafe(context.errors)
          }
        })
      );
    } catch (error) {
      safeConsole(
        "warn",
        "[AIW.EventBus] Window broadcast failed.",
        error
      );
    }
  }

  function getHistory(filters = {}) {
    const {
      eventName,
      source,
      status,
      limit = HISTORY_LIMIT
    } = filters;

    const normalizedName = eventName
      ? normalizeEventName(eventName)
      : "";

    return eventHistory
      .filter((item) => {
        if (normalizedName && item.name !== normalizedName) return false;
        if (source && item.source !== source) return false;
        if (status && item.status !== status) return false;
        return true;
      })
      .slice(-Math.max(0, Number(limit) || HISTORY_LIMIT))
      .map(cloneSafe);
  }

  function clearHistory() {
    eventHistory.length = 0;
    return true;
  }

  function getDiagnostics() {
    const exactListeners = [];
    const wildcardItems = [];

    listeners.forEach((group, eventName) => {
      exactListeners.push({
        eventName,
        count: group.length,
        listeners: group.map((item) => ({
          id: item.id,
          source: item.source,
          priority: item.priority,
          once: item.once,
          createdAt: item.createdAt
        }))
      });
    });

    wildcardListeners.forEach((group, pattern) => {
      wildcardItems.push({
        pattern,
        count: group.length,
        listeners: group.map((item) => ({
          id: item.id,
          source: item.source,
          priority: item.priority,
          once: item.once,
          createdAt: item.createdAt
        }))
      });
    });

    return {
      version: VERSION,
      paused: isPaused,
      activeDispatches: activeDispatches.size,
      exactEventGroups: exactListeners.length,
      wildcardEventGroups: wildcardItems.length,
      totalListeners:
        exactListeners.reduce((sum, item) => sum + item.count, 0) +
        wildcardItems.reduce((sum, item) => sum + item.count, 0),
      historySize: eventHistory.length,
      historyLimit: HISTORY_LIMIT,
      exactListeners,
      wildcardListeners: wildcardItems
    };
  }

  function pause() {
    isPaused = true;
    return true;
  }

  function resume() {
    isPaused = false;
    return true;
  }

  function isEventBusPaused() {
    return isPaused;
  }

  function waitFor(eventName, options = {}) {
    const timeout = Number(options.timeout || 0);
    const predicate = typeof options.predicate === "function"
      ? options.predicate
      : null;

    return new Promise((resolve, reject) => {
      let timeoutId = null;

      const unsubscribe = subscribe(
        eventName,
        (payload, context) => {
          if (predicate && !predicate(payload, context)) {
            return;
          }

          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          unsubscribe();
          resolve({ payload, context });
        },
        {
          once: false,
          priority: options.priority || DEFAULT_PRIORITY,
          source: options.source || "waitFor"
        }
      );

      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          unsubscribe();
          reject(
            new Error(
              `[AIW.EventBus] Timeout waiting for event "${eventName}".`
            )
          );
        }, timeout);
      }
    });
  }

  const EVENT_NAMES = Object.freeze({
    STORE_READY: "store.ready",
    STORE_CHANGED: "store.changed",
    STORE_RESET: "store.reset",
    STORE_RESTORED: "store.restored",

    IDEA_CREATED: "idea.created",
    IDEA_UPDATED: "idea.updated",
    IDEA_APPROVED: "idea.approved",
    IDEA_REJECTED: "idea.rejected",
    IDEA_CONVERTED: "idea.converted",
    IDEA_RESTORED: "idea.restored",
    IDEA_DELETED: "idea.deleted",

    PROJECT_CREATED: "project.created",
    PROJECT_UPDATED: "project.updated",
    PROJECT_STARTED: "project.started",
    PROJECT_PAUSED: "project.paused",
    PROJECT_RESUMED: "project.resumed",
    PROJECT_COMPLETED: "project.completed",
    PROJECT_CANCELED: "project.canceled",
    PROJECT_DELETED: "project.deleted",

    TASK_CREATED: "task.created",
    TASK_UPDATED: "task.updated",
    TASK_COMPLETED: "task.completed",
    TASK_REOPENED: "task.reopened",
    TASK_DELETED: "task.deleted",

    PHASE_CHANGED: "project.phase.changed",
    PROGRESS_CHANGED: "project.progress.changed",
    READINESS_CHANGED: "project.readiness.changed",

    BUSINESS_CASE_CREATED: "business-case.created",
    BUSINESS_CASE_UPDATED: "business-case.updated",
    BUSINESS_CASE_APPROVED: "business-case.approved",
    BUSINESS_CASE_REJECTED: "business-case.rejected",

    KPI_RECALCULATED: "kpi.recalculated",
    KPI_CHANGED: "kpi.changed",

    REPORT_REFRESH_REQUESTED: "report.refresh.requested",
    REPORT_GENERATED: "report.generated",

    DASHBOARD_REFRESH_REQUESTED: "dashboard.refresh.requested",
    DASHBOARD_UPDATED: "dashboard.updated",

    AUTOMATION_TRIGGERED: "automation.triggered",
    AUTOMATION_COMPLETED: "automation.completed",
    AUTOMATION_FAILED: "automation.failed",

    DECISION_CREATED: "decision.created",
    DECISION_UPDATED: "decision.updated",
    DECISION_APPROVED: "decision.approved",
    DECISION_REJECTED: "decision.rejected",

    NOTIFICATION_CREATED: "notification.created",
    NOTIFICATION_READ: "notification.read",

    INTEGRATION_READY: "integration.ready",
    INTEGRATION_ERROR: "integration.error",
    PLATFORM_HEALTH_UPDATED: "platform-health.updated",
    EXECUTIVE_SUMMARY_UPDATED: "executive-summary.updated"
  });

  AIW.EventBus = Object.freeze({
    __version: VERSION,
    events: EVENT_NAMES,

    on: subscribe,
    once,
    off: unsubscribe,
    clear,

    emit,
    emitSync,
    waitFor,

    pause,
    resume,
    isPaused: isEventBusPaused,

    getHistory,
    clearHistory,
    getDiagnostics
  });

  AIW.Events = EVENT_NAMES;

  safeConsole(
    "info",
    `[AIW.EventBus] Enterprise Event Bus V${VERSION} initialized.`
  );

  // Emit initialization event after the public API is available.
  setTimeout(() => {
    AIW.EventBus.emit(
      EVENT_NAMES.INTEGRATION_READY,
      {
        component: "event-bus",
        version: VERSION
      },
      {
        source: "AIW.EventBus",
        broadcast: true
      }
    );
  }, 0);
})(window);
