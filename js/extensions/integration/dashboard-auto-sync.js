/* =========================================================
   AI Work - Dashboard Auto Sync V1.0
   Phase 8: Enterprise Integration Layer

   File Path:
   js/extensions/integration/dashboard-auto-sync.js

   Depends On:
   - AIW.Store V2.3+
   - AIW.EventBus V1.0+
   - AIW.IntegrationCore V1.0+
   - AIW.KPIAutoEngine V1.0+

   Purpose:
   - Build one normalized executive dashboard data model
   - Read calculated KPIs from integration.kpis
   - Persist dashboard-ready data into integration.dashboard
   - Refresh the visible Dashboard safely when required
   - Keep the existing Dashboard module and design untouched
   - Expose a stable API for future Dashboard widgets

   Recommended Load Order:
   1) event-bus.js
   2) integration-core.js
   3) kpi-auto-engine.js
   4) dashboard-auto-sync.js
========================================================= */

(function initAIWDashboardAutoSync(global) {
  "use strict";

  global.AIW = global.AIW || {};
  const AIW = global.AIW;

  const VERSION = "1.0.0";
  const COMPONENT = "dashboard-auto-sync";
  const STORE_PATH = "integration.dashboard";
  const REFRESH_DEBOUNCE_MS = 100;

  if (AIW.DashboardAutoSync && AIW.DashboardAutoSync.__version) {
    console.warn(
      "[AIW.DashboardAutoSync] Existing instance detected:",
      AIW.DashboardAutoSync.__version
    );
    return;
  }

  const runtime = {
    initialized: false,
    started: false,
    syncing: false,
    pending: false,
    timerId: null,
    subscriptions: [],
    syncCount: 0,
    renderCount: 0,
    persistenceCount: 0,
    lastSyncedAt: null,
    lastRenderedAt: null,
    lastReason: null,
    lastModel: null,
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

  function round(value, decimals = 1) {
    const factor = 10 ** decimals;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, numberValue(value, min)));
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

  function readKPIResult(state) {
    return firstDefined(
      getNestedValue(state, "integration.kpis", undefined),
      AIW.KPIAutoEngine?.getLastResult?.(),
      {}
    ) || {};
  }

  function findKPI(kpis, id, fallback = 0) {
    if (!Array.isArray(kpis)) return fallback;

    const item = kpis.find(
      (entry) => String(entry?.id) === String(id)
    );

    return item ? numberValue(item.value, fallback) : fallback;
  }

  function healthDescriptor(score) {
    const value = clamp(score);

    if (value >= 85) {
      return {
        status: "excellent",
        label: "ممتاز",
        message: "المنصة تعمل بكفاءة تنفيذية مرتفعة."
      };
    }

    if (value >= 70) {
      return {
        status: "healthy",
        label: "جيد",
        message: "حالة المنصة مستقرة مع فرص تحسين محدودة."
      };
    }

    if (value >= 50) {
      return {
        status: "attention",
        label: "يحتاج متابعة",
        message: "توجد مؤشرات تتطلب متابعة تنفيذية."
      };
    }

    return {
      status: "critical",
      label: "حرج",
      message: "توجد فجوات تنفيذية تتطلب معالجة مباشرة."
    };
  }

  function buildAlerts(metrics) {
    const alerts = [];

    const projects = metrics?.projects || {};
    const ideas = metrics?.ideas || {};
    const automation = metrics?.automation || {};
    const businessCases = metrics?.businessCases || {};

    if (numberValue(projects.paused) > 0) {
      alerts.push({
        id: "paused-projects",
        severity: "warning",
        title: "مشاريع متوقفة",
        message: `${projects.paused} مشروع بحاجة إلى قرار استئناف أو معالجة.`
      });
    }

    if (numberValue(projects.highRiskCount) > 0) {
      alerts.push({
        id: "high-risk-projects",
        severity: "high",
        title: "مخاطر مرتفعة",
        message: `${projects.highRiskCount} مشروع مصنف بمخاطر مرتفعة.`
      });
    }

    if (numberValue(projects.taskCompletionRate) < 50 && numberValue(projects.taskCount) > 0) {
      alerts.push({
        id: "low-task-completion",
        severity: "warning",
        title: "إنجاز المهام منخفض",
        message: `معدل إنجاز المهام ${round(projects.taskCompletionRate)}%.`
      });
    }

    if (numberValue(ideas.converted) === 0 && numberValue(ideas.total) > 0) {
      alerts.push({
        id: "no-converted-ideas",
        severity: "info",
        title: "لا توجد أفكار محولة",
        message: "لم يتم تحويل أي فكرة إلى مشروع حتى الآن."
      });
    }

    if (numberValue(businessCases.approvalRate) < 50 && numberValue(businessCases.total) > 0) {
      alerts.push({
        id: "business-case-approval",
        severity: "warning",
        title: "اعتماد دراسات الجدوى",
        message: `نسبة الاعتماد الحالية ${round(businessCases.approvalRate)}%.`
      });
    }

    if (numberValue(automation.failedExecutionCount) > 0) {
      alerts.push({
        id: "automation-failures",
        severity: "high",
        title: "فشل في الأتمتة",
        message: `${automation.failedExecutionCount} عملية أتمتة فشلت.`
      });
    }

    return alerts.slice(0, 8);
  }

  function buildHighlights(metrics) {
    const projects = metrics?.projects || {};
    const ideas = metrics?.ideas || {};

    const highlights = [];

    if (numberValue(projects.completed) > 0) {
      highlights.push({
        id: "completed-projects",
        type: "success",
        title: "مشاريع مكتملة",
        value: numberValue(projects.completed),
        text: "مشاريع وصلت إلى الإغلاق التنفيذي."
      });
    }

    if (numberValue(projects.averageProgress) >= 70) {
      highlights.push({
        id: "strong-progress",
        type: "success",
        title: "تقدم تنفيذي قوي",
        value: round(projects.averageProgress),
        suffix: "%",
        text: "متوسط تقدم محفظة المشاريع مرتفع."
      });
    }

    if (numberValue(projects.averageReadiness) >= 75) {
      highlights.push({
        id: "high-readiness",
        type: "success",
        title: "جاهزية مرتفعة",
        value: round(projects.averageReadiness),
        suffix: "%",
        text: "المشاريع تملك عناصر تنفيذ أساسية جيدة."
      });
    }

    if (numberValue(ideas.converted) > 0) {
      highlights.push({
        id: "idea-conversions",
        type: "info",
        title: "تحويل الأفكار",
        value: numberValue(ideas.converted),
        text: "أفكار تحولت إلى مشاريع فعلية."
      });
    }

    return highlights.slice(0, 6);
  }

  function buildTrend(metrics) {
    const projects = metrics?.projects || {};

    return [
      {
        id: "progress",
        label: "التقدم التنفيذي",
        value: round(projects.averageProgress)
      },
      {
        id: "readiness",
        label: "جاهزية التنفيذ",
        value: round(projects.averageReadiness)
      },
      {
        id: "tasks",
        label: "إنجاز المهام",
        value: round(projects.taskCompletionRate)
      },
      {
        id: "completion",
        label: "إكمال المشاريع",
        value: round(projects.completionRate)
      }
    ];
  }

  function buildDashboardModel(state = getStoreState(), reason = "manual") {
    const kpiResult = readKPIResult(state);
    const summary = kpiResult.summary || {};
    const metrics = kpiResult.metrics || {};
    const kpis = Array.isArray(kpiResult.kpis) ? kpiResult.kpis : [];

    const platformHealth = numberValue(
      firstDefined(
        summary.platformHealth,
        metrics?.platformHealth?.score,
        findKPI(kpis, "platform-health", 0)
      )
    );

    const executiveReadiness = numberValue(
      firstDefined(
        summary.executiveReadiness,
        metrics?.executiveReadiness?.score,
        findKPI(kpis, "executive-readiness", 0)
      )
    );

    const health = healthDescriptor(platformHealth);

    return {
      version: VERSION,
      generatedAt: nowISO(),
      reason,

      headline: {
        platformHealth: round(platformHealth),
        platformHealthStatus: health.status,
        platformHealthLabel: health.label,
        platformHealthMessage: health.message,
        executiveReadiness: round(executiveReadiness),
        averageProgress: round(
          firstDefined(
            summary.averageProgress,
            metrics?.projects?.averageProgress,
            0
          )
        ),
        averageReadiness: round(
          firstDefined(
            summary.averageReadiness,
            metrics?.projects?.averageReadiness,
            0
          )
        )
      },

      counters: {
        totalIdeas: numberValue(
          firstDefined(summary.totalIdeas, metrics?.ideas?.total, 0)
        ),
        approvedIdeas: numberValue(metrics?.ideas?.approved),
        convertedIdeas: numberValue(metrics?.ideas?.converted),
        totalProjects: numberValue(
          firstDefined(summary.totalProjects, metrics?.projects?.total, 0)
        ),
        activeProjects: numberValue(
          firstDefined(summary.activeProjects, metrics?.projects?.active, 0)
        ),
        pausedProjects: numberValue(metrics?.projects?.paused),
        completedProjects: numberValue(
          firstDefined(summary.completedProjects, metrics?.projects?.completed, 0)
        ),
        totalTasks: numberValue(metrics?.projects?.taskCount),
        completedTasks: numberValue(metrics?.projects?.completedTaskCount)
      },

      performance: {
        taskCompletionRate: round(
          firstDefined(
            summary.taskCompletionRate,
            metrics?.projects?.taskCompletionRate,
            0
          )
        ),
        projectCompletionRate: round(metrics?.projects?.completionRate),
        ideaConversionRate: round(metrics?.ideas?.conversionRate),
        businessCaseApprovalRate: round(
          metrics?.businessCases?.approvalRate
        ),
        decisionApprovalRate: round(metrics?.decisions?.approvalRate),
        automationSuccessRate: round(metrics?.automation?.successRate)
      },

      risk: {
        highRiskProjects: numberValue(metrics?.projects?.highRiskCount),
        mediumRiskProjects: numberValue(metrics?.projects?.mediumRiskCount),
        lowRiskProjects: numberValue(metrics?.projects?.lowRiskCount),
        highRiskIdeas: numberValue(metrics?.ideas?.highRiskCount),
        platformRiskPenalty: round(metrics?.platformHealth?.riskPenalty)
      },

      alerts: buildAlerts(metrics),
      highlights: buildHighlights(metrics),
      trend: buildTrend(metrics),

      projects: cloneSafe(metrics?.projects?.projects || []),
      kpis: cloneSafe(kpis),

      source: {
        kpiCalculatedAt: kpiResult.calculatedAt || null,
        kpiVersion: kpiResult.version || null,
        storePath: "integration.kpis"
      }
    };
  }

  function recordError(scope, error, metadata = {}) {
    const item = {
      id: `dashboard-sync-error-${Date.now()}-${runtime.errors.length + 1}`,
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
      `[AIW.DashboardAutoSync] ${scope} failed.`,
      error
    );

    emitSafe("integration.error", {
      component: COMPONENT,
      error: item
    });
  }

  async function emitSafe(eventName, payload = {}) {
    try {
      if (AIW.EventBus && typeof AIW.EventBus.emit === "function") {
        return await AIW.EventBus.emit(
          eventName,
          cloneSafe(payload),
          {
            source: "AIW.DashboardAutoSync",
            broadcast: true
          }
        );
      }
    } catch (error) {
      safeConsole(
        "warn",
        `[AIW.DashboardAutoSync] Event failed: ${eventName}`,
        error
      );
    }

    return null;
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

  function persist(model) {
    try {
      const signature = stableSerialize(model);

      if (signature === runtime.lastSignature) {
        return false;
      }

      writeStore(STORE_PATH, model);
      runtime.lastSignature = signature;
      runtime.persistenceCount += 1;

      return true;
    } catch (error) {
      recordError("persist", error, { model });
      return false;
    }
  }

  function findDashboardContainer() {
    const selectors = [
      '[data-module="dashboard"]',
      '[data-page="dashboard"]',
      '#dashboard-page',
      '#dashboard',
      '.dashboard-page',
      '.dashboard-module',
      '.module-dashboard',
      '.page-dashboard'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }

    const appContainer = document.querySelector(
      "#app, #app-content, #main-content, main"
    );

    return appContainer || null;
  }

  function getCurrentRoute() {
    return String(
      firstDefined(
        AIW.Router?.currentRoute,
        AIW.Router?.current,
        AIW.App?.currentPage,
        document.body?.dataset?.page,
        location.hash?.replace(/^#\/?/, ""),
        ""
      ) || ""
    )
      .trim()
      .toLowerCase();
  }

  function isDashboardVisible() {
    const route = getCurrentRoute();

    if (route === "dashboard" || route === "" || route === "home") {
      const container = findDashboardContainer();
      if (!container) return route === "dashboard" || route === "home";
      return container.offsetParent !== null || container === document.body;
    }

    return false;
  }

  function invokeDashboardRender() {
    const module =
      AIW.Modules?.dashboard ||
      AIW.Modules?.home ||
      null;

    const container = findDashboardContainer();

    if (!module || typeof module.render !== "function" || !container) {
      return false;
    }

    try {
      module.render(container);
      runtime.renderCount += 1;
      runtime.lastRenderedAt = nowISO();
      return true;
    } catch (error) {
      recordError("invokeDashboardRender", error);
      return false;
    }
  }

  function dispatchDOMRefresh(model) {
    try {
      global.dispatchEvent(
        new CustomEvent("aiw:dashboard:model-updated", {
          detail: cloneSafe(model)
        })
      );

      document.dispatchEvent(
        new CustomEvent("aiw:dashboard:refresh", {
          detail: cloneSafe(model)
        })
      );

      return true;
    } catch (error) {
      recordError("dispatchDOMRefresh", error);
      return false;
    }
  }

  function refreshVisibleDashboard(model, options = {}) {
    dispatchDOMRefresh(model);

    if (options.render === false) return false;
    if (!isDashboardVisible()) return false;

    if (invokeDashboardRender()) {
      return true;
    }

    try {
      if (typeof AIW.App?.refresh === "function") {
        AIW.App.refresh();
        runtime.renderCount += 1;
        runtime.lastRenderedAt = nowISO();
        return true;
      }

      if (typeof AIW.Router?.refresh === "function") {
        AIW.Router.refresh();
        runtime.renderCount += 1;
        runtime.lastRenderedAt = nowISO();
        return true;
      }
    } catch (error) {
      recordError("refreshVisibleDashboard", error);
    }

    return false;
  }

  async function sync(reason = "manual", options = {}) {
    if (runtime.syncing) {
      runtime.pending = true;
      return runtime.lastModel;
    }

    runtime.syncing = true;
    runtime.pending = false;

    try {
      const state = getStoreState();
      const model = buildDashboardModel(state, reason);

      runtime.syncCount += 1;
      runtime.lastSyncedAt = model.generatedAt;
      runtime.lastReason = reason;
      runtime.lastModel = cloneSafe(model);

      const persisted =
        options.persist === false
          ? false
          : persist(model);

      const rendered = refreshVisibleDashboard(model, {
        render: options.render !== false
      });

      await emitSafe("dashboard.updated", {
        reason,
        persisted,
        rendered,
        model
      });

      return cloneSafe(model);
    } catch (error) {
      recordError("sync", error, { reason, options });
      return runtime.lastModel;
    } finally {
      runtime.syncing = false;

      if (runtime.pending) {
        runtime.pending = false;
        schedule("pending-sync");
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
      sync(reason);
    }, REFRESH_DEBOUNCE_MS);

    return true;
  }

  function subscribe(eventName, handler, priority = 0) {
    if (!AIW.EventBus || typeof AIW.EventBus.on !== "function") {
      return null;
    }

    const unsubscribe = AIW.EventBus.on(
      eventName,
      handler,
      {
        source: "AIW.DashboardAutoSync",
        priority
      }
    );

    runtime.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  function registerListeners() {
    subscribe(
      "kpi.changed",
      (payload, context) => {
        if (context?.source === "AIW.DashboardAutoSync") return;
        schedule(payload?.reason || "kpi.changed");
      }
    );

    subscribe(
      "platform-health.updated",
      () => schedule("platform-health.updated")
    );

    subscribe(
      "dashboard.refresh.requested",
      (payload, context) => {
        if (context?.source === "AIW.DashboardAutoSync") return;
        schedule(payload?.reason || "dashboard.refresh.requested");
      }
    );

    subscribe(
      "store.restored",
      () => schedule("store.restored")
    );

    subscribe(
      "integration.ready",
      (payload) => {
        if (payload?.component === COMPONENT) return;
        schedule(`integration.ready:${payload?.component || "unknown"}`);
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
          "AIW.Store is required before Dashboard Auto Sync."
        );
      }

      if (!AIW.EventBus) {
        throw new Error(
          "AIW.EventBus is required before Dashboard Auto Sync."
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
        `[AIW.DashboardAutoSync] V${VERSION} started successfully.`
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

  function getModel() {
    return cloneSafe(runtime.lastModel);
  }

  function getMetric(path, fallback = null) {
    return cloneSafe(
      getNestedValue(runtime.lastModel, path, fallback)
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
      syncing: runtime.syncing,
      pending: runtime.pending,
      syncCount: runtime.syncCount,
      renderCount: runtime.renderCount,
      persistenceCount: runtime.persistenceCount,
      lastSyncedAt: runtime.lastSyncedAt,
      lastRenderedAt: runtime.lastRenderedAt,
      lastReason: runtime.lastReason,
      subscriptionCount: runtime.subscriptions.length,
      errorCount: runtime.errors.length,
      storePath: STORE_PATH,
      refreshDebounceMs: REFRESH_DEBOUNCE_MS,
      dashboardVisible: isDashboardVisible(),
      hasModel: Boolean(runtime.lastModel)
    };
  }

  AIW.DashboardAutoSync = Object.freeze({
    __version: VERSION,

    start,
    stop,
    restart,

    sync,
    schedule,
    buildDashboardModel,

    getModel,
    getMetric,
    refreshVisibleDashboard,
    isDashboardVisible,

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
