/* =========================================================
   AI Work - Reports Auto Builder V1.0
   Phase 8: Enterprise Integration Layer

   File Path:
   js/extensions/integration/reports-auto-builder.js

   Depends On:
   - AIW.Store V2.3+
   - AIW.EventBus V1.0+
   - AIW.IntegrationCore V1.0+
   - AIW.KPIAutoEngine V1.0+
   - AIW.DashboardAutoSync V1.0+

   Purpose:
   - Build a normalized executive report from live Store data
   - Read Ideas, Projects, Tasks, Business Cases, Decisions,
     Automation, KPIs, Dashboard summary, and risk signals
   - Generate executive summary, highlights, gaps, risks,
     recommendations, portfolio tables, and timeline data
   - Persist report-ready data into integration.reports
   - Refresh the visible Reports module safely
   - Keep the existing Reports module and UI untouched

   Recommended Load Order:
   1) event-bus.js
   2) integration-core.js
   3) kpi-auto-engine.js
   4) dashboard-auto-sync.js
   5) reports-auto-builder.js
========================================================= */

(function initAIWReportsAutoBuilder(global) {
  "use strict";

  global.AIW = global.AIW || {};
  const AIW = global.AIW;

  const VERSION = "1.0.0";
  const COMPONENT = "reports-auto-builder";
  const STORE_PATH = "integration.reports";
  const REFRESH_DEBOUNCE_MS = 120;

  if (AIW.ReportsAutoBuilder && AIW.ReportsAutoBuilder.__version) {
    console.warn(
      "[AIW.ReportsAutoBuilder] Existing instance detected:",
      AIW.ReportsAutoBuilder.__version
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
    renderCount: 0,
    persistenceCount: 0,
    lastBuiltAt: null,
    lastRenderedAt: null,
    lastReason: null,
    lastReport: null,
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

  function getAutomation(state) {
    return firstDefined(
      getNestedValue(state, "automation", undefined),
      getNestedValue(state, "data.automation", undefined),
      {}
    ) || {};
  }

  function readKPIResult(state) {
    return firstDefined(
      getNestedValue(state, "integration.kpis", undefined),
      AIW.KPIAutoEngine?.getLastResult?.(),
      {}
    ) || {};
  }

  function readDashboardModel(state) {
    return firstDefined(
      getNestedValue(state, "integration.dashboard", undefined),
      AIW.DashboardAutoSync?.getModel?.(),
      {}
    ) || {};
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

  function isCompletedStatus(status) {
    return [
      "completed",
      "complete",
      "done",
      "closed",
      "finished",
      "مكتمل",
      "منجز",
      "مغلق"
    ].includes(status);
  }

  function isTaskCompleted(task) {
    if (!task) return false;

    if (typeof task.completed === "boolean") return task.completed;
    if (typeof task.done === "boolean") return task.done;

    return isCompletedStatus(getStatus(task));
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

    if (["critical", "very high", "severe", "حرج"].includes(raw)) {
      return { score: 4, label: "حرج", key: "critical" };
    }

    if (["high", "مرتفع", "عالي"].includes(raw)) {
      return { score: 3, label: "مرتفع", key: "high" };
    }

    if (["medium", "moderate", "متوسط"].includes(raw)) {
      return { score: 2, label: "متوسط", key: "medium" };
    }

    if (["low", "منخفض"].includes(raw)) {
      return { score: 1, label: "منخفض", key: "low" };
    }

    return { score: 0, label: "غير محدد", key: "unknown" };
  }

  function getProgress(project, projectMetric) {
    return clamp(
      firstDefined(
        projectMetric?.progress,
        project?.progress,
        project?.progressPercent,
        project?.completion,
        project?.executionProgress,
        0
      )
    );
  }

  function getReadiness(project, projectMetric) {
    return clamp(
      firstDefined(
        projectMetric?.readiness,
        project?.readiness,
        project?.readinessPercent,
        project?.implementationReadiness,
        0
      )
    );
  }

  function buildProjectTable(projects, kpiResult) {
    const metricsById = new Map(
      (kpiResult?.metrics?.projects?.projects || []).map((item) => [
        String(item.id),
        item
      ])
    );

    return projects.map((project, index) => {
      const id = getProjectId(project, index);
      const metric = metricsById.get(id);
      const tasks = normalizeTasks(project);
      const completedTasks = tasks.filter(isTaskCompleted).length;
      const risk = getRiskLevel(project);

      return {
        id,
        title: firstDefined(
          project?.title,
          project?.name,
          `Project ${index + 1}`
        ),
        owner: firstDefined(
          project?.owner,
          project?.projectOwner,
          project?.manager,
          project?.lead,
          "غير محدد"
        ),
        status: getStatus(project) || "unknown",
        phase: firstDefined(
          project?.phase,
          project?.currentPhase,
          project?.stage,
          "غير محددة"
        ),
        progress: round(getProgress(project, metric)),
        readiness: round(getReadiness(project, metric)),
        taskCount: tasks.length,
        completedTaskCount: completedTasks,
        taskCompletionRate: tasks.length
          ? round((completedTasks / tasks.length) * 100)
          : 0,
        riskLevel: risk.label,
        riskKey: risk.key,
        startDate: firstDefined(
          project?.startDate,
          project?.plannedStartDate,
          null
        ),
        endDate: firstDefined(
          project?.endDate,
          project?.plannedEndDate,
          null
        )
      };
    });
  }

  function buildExecutiveSummary(kpiResult, dashboardModel) {
    const summary = kpiResult?.summary || {};
    const metrics = kpiResult?.metrics || {};
    const headline = dashboardModel?.headline || {};
    const counters = dashboardModel?.counters || {};

    const totalProjects = numberValue(
      firstDefined(summary.totalProjects, counters.totalProjects, 0)
    );

    const activeProjects = numberValue(
      firstDefined(summary.activeProjects, counters.activeProjects, 0)
    );

    const completedProjects = numberValue(
      firstDefined(summary.completedProjects, counters.completedProjects, 0)
    );

    const totalIdeas = numberValue(
      firstDefined(summary.totalIdeas, counters.totalIdeas, 0)
    );

    const averageProgress = round(
      firstDefined(
        summary.averageProgress,
        headline.averageProgress,
        metrics?.projects?.averageProgress,
        0
      )
    );

    const averageReadiness = round(
      firstDefined(
        summary.averageReadiness,
        headline.averageReadiness,
        metrics?.projects?.averageReadiness,
        0
      )
    );

    const platformHealth = round(
      firstDefined(
        summary.platformHealth,
        headline.platformHealth,
        metrics?.platformHealth?.score,
        0
      )
    );

    return {
      title: "الخلاصة التنفيذية",
      narrative:
        `تضم المحفظة الحالية ${totalProjects} مشروعاً، منها ${activeProjects} مشروعاً نشطاً و${completedProjects} مشروعاً مكتملاً. ` +
        `يبلغ متوسط التقدم التنفيذي ${averageProgress}% ومتوسط جاهزية التنفيذ ${averageReadiness}%. ` +
        `كما تحتوي المنصة على ${totalIdeas} فكرة، بينما سجلت صحة المنصة ${platformHealth}%.`,
      indicators: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalIdeas,
        averageProgress,
        averageReadiness,
        platformHealth
      }
    };
  }

  function buildHighlights(kpiResult, dashboardModel) {
    const metrics = kpiResult?.metrics || {};
    const dashboardHighlights = Array.isArray(dashboardModel?.highlights)
      ? dashboardModel.highlights
      : [];

    const highlights = [...dashboardHighlights];

    if (numberValue(metrics?.projects?.completed) > 0) {
      highlights.push({
        id: "report-completed-projects",
        type: "success",
        title: "إنجازات المحفظة",
        text: `تم إكمال ${metrics.projects.completed} مشروعاً.`
      });
    }

    if (numberValue(metrics?.ideas?.converted) > 0) {
      highlights.push({
        id: "report-converted-ideas",
        type: "info",
        title: "تحويل الفرص",
        text: `تم تحويل ${metrics.ideas.converted} فكرة إلى مشاريع.`
      });
    }

    if (numberValue(metrics?.automation?.successRate) >= 80) {
      highlights.push({
        id: "report-automation-success",
        type: "success",
        title: "كفاءة الأتمتة",
        text: `بلغت نسبة نجاح الأتمتة ${round(metrics.automation.successRate)}%.`
      });
    }

    const seen = new Set();

    return highlights.filter((item) => {
      const key = item.id || item.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);
  }

  function buildRisks(projectTable, dashboardModel) {
    const risks = [];

    projectTable.forEach((project) => {
      if (project.riskKey === "critical" || project.riskKey === "high") {
        risks.push({
          id: `project-risk-${project.id}`,
          severity: project.riskKey,
          source: "project",
          sourceId: project.id,
          title: project.title,
          message: `المشروع مصنف بمخاطر ${project.riskLevel}.`
        });
      }

      if (project.progress < 40 && project.status === "active") {
        risks.push({
          id: `low-progress-${project.id}`,
          severity: "warning",
          source: "project",
          sourceId: project.id,
          title: project.title,
          message: `التقدم التنفيذي منخفض ويبلغ ${project.progress}%.`
        });
      }

      if (project.readiness < 50) {
        risks.push({
          id: `low-readiness-${project.id}`,
          severity: "warning",
          source: "project",
          sourceId: project.id,
          title: project.title,
          message: `جاهزية التنفيذ منخفضة وتبلغ ${project.readiness}%.`
        });
      }
    });

    const dashboardAlerts = Array.isArray(dashboardModel?.alerts)
      ? dashboardModel.alerts
      : [];

    dashboardAlerts.forEach((alert) => {
      risks.push({
        id: `dashboard-${alert.id}`,
        severity: alert.severity,
        source: "dashboard",
        title: alert.title,
        message: alert.message
      });
    });

    const seen = new Set();

    return risks.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }).slice(0, 20);
  }

  function buildGaps(kpiResult, projectTable) {
    const metrics = kpiResult?.metrics || {};
    const gaps = [];

    if (numberValue(metrics?.projects?.averageProgress) < 60) {
      gaps.push({
        id: "portfolio-progress-gap",
        area: "التنفيذ",
        severity: "warning",
        message: "متوسط تقدم محفظة المشاريع أقل من المستوى المطلوب."
      });
    }

    if (numberValue(metrics?.projects?.averageReadiness) < 65) {
      gaps.push({
        id: "portfolio-readiness-gap",
        area: "الجاهزية",
        severity: "warning",
        message: "توجد فجوة في جاهزية التنفيذ على مستوى المحفظة."
      });
    }

    if (
      numberValue(metrics?.businessCases?.total) > 0 &&
      numberValue(metrics?.businessCases?.approvalRate) < 50
    ) {
      gaps.push({
        id: "business-case-gap",
        area: "دراسات الجدوى",
        severity: "warning",
        message: "نسبة اعتماد دراسات الجدوى منخفضة."
      });
    }

    if (
      numberValue(metrics?.decisions?.total) > 0 &&
      numberValue(metrics?.decisions?.pending) > 0
    ) {
      gaps.push({
        id: "decision-gap",
        area: "القرارات",
        severity: "info",
        message: `يوجد ${metrics.decisions.pending} قراراً بانتظار الاعتماد.`
      });
    }

    const noOwnerCount = projectTable.filter(
      (project) => project.owner === "غير محدد"
    ).length;

    if (noOwnerCount > 0) {
      gaps.push({
        id: "project-owner-gap",
        area: "المساءلة",
        severity: "high",
        message: `${noOwnerCount} مشروع بدون مالك محدد.`
      });
    }

    return gaps;
  }

  function buildRecommendations(kpiResult, projectTable, risks, gaps) {
    const metrics = kpiResult?.metrics || {};
    const recommendations = [];

    if (numberValue(metrics?.projects?.paused) > 0) {
      recommendations.push({
        id: "resume-paused-projects",
        priority: "high",
        title: "مراجعة المشاريع المتوقفة",
        action: `تحديد قرار واضح لـ ${metrics.projects.paused} مشروع متوقف: استئناف أو إعادة جدولة أو إلغاء.`
      });
    }

    if (numberValue(metrics?.projects?.averageReadiness) < 70) {
      recommendations.push({
        id: "raise-readiness",
        priority: "high",
        title: "رفع جاهزية التنفيذ",
        action: "استكمال الملاك والجداول الزمنية والمتطلبات ودراسات الجدوى للمشاريع الأقل جاهزية."
      });
    }

    if (numberValue(metrics?.projects?.taskCompletionRate) < 60) {
      recommendations.push({
        id: "improve-task-completion",
        priority: "high",
        title: "تسريع إنجاز المهام",
        action: "ترتيب المهام المتأخرة حسب الأولوية والاعتماديات وتحديد مسؤول لكل مهمة."
      });
    }

    if (numberValue(metrics?.ideas?.conversionRate) < 20 && numberValue(metrics?.ideas?.total) > 0) {
      recommendations.push({
        id: "increase-idea-conversion",
        priority: "medium",
        title: "زيادة تحويل الأفكار",
        action: "اختيار أعلى الأفكار في Decision Score وتحويلها إلى مشاريع قابلة للتنفيذ."
      });
    }

    if (numberValue(metrics?.automation?.failedExecutionCount) > 0) {
      recommendations.push({
        id: "fix-automation-failures",
        priority: "high",
        title: "معالجة فشل الأتمتة",
        action: "مراجعة سجلات التنفيذ وإعادة تشغيل التدفقات الفاشلة بعد معالجة السبب."
      });
    }

    const lowestProjects = [...projectTable]
      .sort((a, b) => (a.progress + a.readiness) - (b.progress + b.readiness))
      .slice(0, 3);

    lowestProjects.forEach((project) => {
      recommendations.push({
        id: `project-action-${project.id}`,
        priority: project.riskKey === "high" || project.riskKey === "critical"
          ? "high"
          : "medium",
        title: `خطة معالجة: ${project.title}`,
        action: `رفع التقدم من ${project.progress}% والجاهزية من ${project.readiness}% عبر استكمال المهام والمتطلبات ذات الأولوية.`
      });
    });

    if (!recommendations.length && !risks.length && !gaps.length) {
      recommendations.push({
        id: "maintain-performance",
        priority: "low",
        title: "استمرار الأداء الحالي",
        action: "الحفاظ على وتيرة التنفيذ الحالية مع مراجعة المؤشرات بشكل دوري."
      });
    }

    const seen = new Set();

    return recommendations.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }).slice(0, 12);
  }

  function buildTimeline(projectTable, ideas, businessCases, decisions) {
    const items = [];

    ideas.forEach((idea, index) => {
      const date = firstDefined(
        idea?.updatedAt,
        idea?.createdAt,
        idea?.date,
        null
      );

      if (date) {
        items.push({
          id: `idea-${firstDefined(idea?.id, index)}`,
          date,
          type: "idea",
          title: firstDefined(idea?.title, idea?.name, "Idea"),
          status: getStatus(idea)
        });
      }
    });

    projectTable.forEach((project) => {
      if (project.startDate) {
        items.push({
          id: `project-start-${project.id}`,
          date: project.startDate,
          type: "project-start",
          title: project.title,
          status: project.status
        });
      }

      if (project.endDate) {
        items.push({
          id: `project-end-${project.id}`,
          date: project.endDate,
          type: "project-end",
          title: project.title,
          status: project.status
        });
      }
    });

    businessCases.forEach((businessCase, index) => {
      const date = firstDefined(
        businessCase?.approvedAt,
        businessCase?.updatedAt,
        businessCase?.createdAt,
        null
      );

      if (date) {
        items.push({
          id: `business-case-${firstDefined(businessCase?.id, index)}`,
          date,
          type: "business-case",
          title: firstDefined(
            businessCase?.title,
            businessCase?.name,
            "Business Case"
          ),
          status: getStatus(businessCase)
        });
      }
    });

    decisions.forEach((decision, index) => {
      const date = firstDefined(
        decision?.decidedAt,
        decision?.updatedAt,
        decision?.createdAt,
        null
      );

      if (date) {
        items.push({
          id: `decision-${firstDefined(decision?.id, index)}`,
          date,
          type: "decision",
          title: firstDefined(
            decision?.title,
            decision?.name,
            "Decision"
          ),
          status: getStatus(decision)
        });
      }
    });

    return items
      .filter((item) => !Number.isNaN(Date.parse(item.date)))
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
      .slice(0, 30);
  }

  function buildReport(state = getStoreState(), reason = "manual") {
    const ideas = getIdeas(state);
    const projects = getProjects(state);
    const businessCases = getBusinessCases(state);
    const decisions = getDecisions(state);
    const automation = getAutomation(state);
    const kpiResult = readKPIResult(state);
    const dashboardModel = readDashboardModel(state);

    const projectTable = buildProjectTable(projects, kpiResult);
    const risks = buildRisks(projectTable, dashboardModel);
    const gaps = buildGaps(kpiResult, projectTable);
    const recommendations = buildRecommendations(
      kpiResult,
      projectTable,
      risks,
      gaps
    );

    const report = {
      version: VERSION,
      generatedAt: nowISO(),
      reason,

      title: "Enterprise Biometric Executive Report",
      subtitle: "Live integration report generated from AIW.Store",

      executiveSummary: buildExecutiveSummary(
        kpiResult,
        dashboardModel
      ),

      highlights: buildHighlights(
        kpiResult,
        dashboardModel
      ),

      scorecard: cloneSafe(kpiResult?.kpis || []),

      portfolio: {
        projects: projectTable,
        totalProjects: projectTable.length,
        activeProjects: numberValue(
          kpiResult?.metrics?.projects?.active
        ),
        completedProjects: numberValue(
          kpiResult?.metrics?.projects?.completed
        ),
        pausedProjects: numberValue(
          kpiResult?.metrics?.projects?.paused
        ),
        averageProgress: round(
          kpiResult?.metrics?.projects?.averageProgress
        ),
        averageReadiness: round(
          kpiResult?.metrics?.projects?.averageReadiness
        )
      },

      opportunities: {
        total: ideas.length,
        approved: numberValue(kpiResult?.metrics?.ideas?.approved),
        rejected: numberValue(kpiResult?.metrics?.ideas?.rejected),
        converted: numberValue(kpiResult?.metrics?.ideas?.converted),
        conversionRate: round(
          kpiResult?.metrics?.ideas?.conversionRate
        )
      },

      businessCases: {
        total: businessCases.length,
        approved: numberValue(
          kpiResult?.metrics?.businessCases?.approved
        ),
        rejected: numberValue(
          kpiResult?.metrics?.businessCases?.rejected
        ),
        approvalRate: round(
          kpiResult?.metrics?.businessCases?.approvalRate
        )
      },

      decisions: {
        total: decisions.length,
        approved: numberValue(
          kpiResult?.metrics?.decisions?.approved
        ),
        rejected: numberValue(
          kpiResult?.metrics?.decisions?.rejected
        ),
        pending: numberValue(
          kpiResult?.metrics?.decisions?.pending
        )
      },

      automation: {
        workflowCount: Array.isArray(automation?.workflows)
          ? automation.workflows.length
          : 0,
        executionCount: numberValue(
          kpiResult?.metrics?.automation?.executionCount
        ),
        successRate: round(
          kpiResult?.metrics?.automation?.successRate
        ),
        failedExecutionCount: numberValue(
          kpiResult?.metrics?.automation?.failedExecutionCount
        )
      },

      health: {
        platformHealth: round(
          kpiResult?.metrics?.platformHealth?.score
        ),
        platformHealthStatus:
          kpiResult?.metrics?.platformHealth?.status || "unknown",
        executiveReadiness: round(
          kpiResult?.metrics?.executiveReadiness?.score
        ),
        executiveReadinessStatus:
          kpiResult?.metrics?.executiveReadiness?.status || "unknown"
      },

      risks,
      gaps,
      recommendations,

      timeline: buildTimeline(
        projectTable,
        ideas,
        businessCases,
        decisions
      ),

      source: {
        kpiCalculatedAt: kpiResult?.calculatedAt || null,
        dashboardGeneratedAt: dashboardModel?.generatedAt || null,
        storePath: STORE_PATH
      }
    };

    return report;
  }

  function recordError(scope, error, metadata = {}) {
    const item = {
      id: `reports-builder-error-${Date.now()}-${runtime.errors.length + 1}`,
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
      `[AIW.ReportsAutoBuilder] ${scope} failed.`,
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
            source: "AIW.ReportsAutoBuilder",
            broadcast: true
          }
        );
      }
    } catch (error) {
      safeConsole(
        "warn",
        `[AIW.ReportsAutoBuilder] Event failed: ${eventName}`,
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

  function persist(report) {
    try {
      const signature = stableSerialize(report);

      if (signature === runtime.lastSignature) {
        return false;
      }

      writeStore(STORE_PATH, report);
      runtime.lastSignature = signature;
      runtime.persistenceCount += 1;

      return true;
    } catch (error) {
      recordError("persist", error, { report });
      return false;
    }
  }

  function findReportsContainer() {
    const selectors = [
      '[data-module="reports"]',
      '[data-page="reports"]',
      '#reports-page',
      '#reports',
      '.reports-page',
      '.reports-module',
      '.module-reports',
      '.page-reports'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }

    return document.querySelector(
      "#app, #app-content, #main-content, main"
    );
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

  function isReportsVisible() {
    const route = getCurrentRoute();

    if (route !== "reports" && route !== "report") {
      return false;
    }

    const container = findReportsContainer();
    if (!container) return true;

    return container.offsetParent !== null || container === document.body;
  }

  function invokeReportsRender() {
    const module =
      AIW.Modules?.reports ||
      AIW.Modules?.report ||
      null;

    const container = findReportsContainer();

    if (!module || typeof module.render !== "function" || !container) {
      return false;
    }

    try {
      module.render(container);
      runtime.renderCount += 1;
      runtime.lastRenderedAt = nowISO();
      return true;
    } catch (error) {
      recordError("invokeReportsRender", error);
      return false;
    }
  }

  function dispatchDOMRefresh(report) {
    try {
      global.dispatchEvent(
        new CustomEvent("aiw:reports:model-updated", {
          detail: cloneSafe(report)
        })
      );

      document.dispatchEvent(
        new CustomEvent("aiw:reports:refresh", {
          detail: cloneSafe(report)
        })
      );

      return true;
    } catch (error) {
      recordError("dispatchDOMRefresh", error);
      return false;
    }
  }

  function refreshVisibleReports(report, options = {}) {
    dispatchDOMRefresh(report);

    if (options.render === false) return false;
    if (!isReportsVisible()) return false;

    if (invokeReportsRender()) return true;

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
      recordError("refreshVisibleReports", error);
    }

    return false;
  }

  async function build(reason = "manual", options = {}) {
    if (runtime.building) {
      runtime.pending = true;
      return runtime.lastReport;
    }

    runtime.building = true;
    runtime.pending = false;

    try {
      const state = getStoreState();
      const report = buildReport(state, reason);

      runtime.buildCount += 1;
      runtime.lastBuiltAt = report.generatedAt;
      runtime.lastReason = reason;
      runtime.lastReport = cloneSafe(report);

      const persisted =
        options.persist === false
          ? false
          : persist(report);

      const rendered = refreshVisibleReports(report, {
        render: options.render !== false
      });

      await emitSafe("report.generated", {
        reason,
        persisted,
        rendered,
        report
      });

      return cloneSafe(report);
    } catch (error) {
      recordError("build", error, { reason, options });
      return runtime.lastReport;
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
    if (!AIW.EventBus || typeof AIW.EventBus.on !== "function") {
      return null;
    }

    const unsubscribe = AIW.EventBus.on(
      eventName,
      handler,
      {
        source: "AIW.ReportsAutoBuilder",
        priority
      }
    );

    runtime.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  function registerListeners() {
    subscribe(
      "report.refresh.requested",
      (payload, context) => {
        if (context?.source === "AIW.ReportsAutoBuilder") return;
        schedule(payload?.reason || "report.refresh.requested");
      }
    );

    subscribe(
      "kpi.changed",
      (payload) => {
        schedule(payload?.reason || "kpi.changed");
      }
    );

    subscribe(
      "dashboard.updated",
      (payload) => {
        schedule(payload?.reason || "dashboard.updated");
      }
    );

    subscribe(
      "platform-health.updated",
      () => schedule("platform-health.updated")
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
          "AIW.Store is required before Reports Auto Builder."
        );
      }

      if (!AIW.EventBus) {
        throw new Error(
          "AIW.EventBus is required before Reports Auto Builder."
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
        `[AIW.ReportsAutoBuilder] V${VERSION} started successfully.`
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

  function getReport() {
    return cloneSafe(runtime.lastReport);
  }

  function getSection(path, fallback = null) {
    return cloneSafe(
      getNestedValue(runtime.lastReport, path, fallback)
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
      building: runtime.building,
      pending: runtime.pending,
      buildCount: runtime.buildCount,
      renderCount: runtime.renderCount,
      persistenceCount: runtime.persistenceCount,
      lastBuiltAt: runtime.lastBuiltAt,
      lastRenderedAt: runtime.lastRenderedAt,
      lastReason: runtime.lastReason,
      subscriptionCount: runtime.subscriptions.length,
      errorCount: runtime.errors.length,
      storePath: STORE_PATH,
      refreshDebounceMs: REFRESH_DEBOUNCE_MS,
      reportsVisible: isReportsVisible(),
      hasReport: Boolean(runtime.lastReport)
    };
  }

  AIW.ReportsAutoBuilder = Object.freeze({
    __version: VERSION,

    start,
    stop,
    restart,

    build,
    schedule,
    buildReport,

    getReport,
    getSection,
    refreshVisibleReports,
    isReportsVisible,

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
