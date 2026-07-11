/* =========================================================
   AI Work - AI Intelligence Core V1.0
   Enterprise Biometric Intelligence Platform

   File Path:
   js/extensions/ai/ai-intelligence-core.js

   Purpose:
   - Central intelligence foundation for all AI extensions
   - Reads platform data safely from AIW.Store V2.3
   - Provides explainable scoring utilities
   - Runs and caches idea/project/portfolio analyses
   - Automatically reacts to Store changes
   - Does not modify any existing module or UI design

   Architecture:
   AIW.AI
   ├── analyzeProject(projectId, options)
   ├── analyzeIdea(ideaId, options)
   ├── analyzePortfolio(options)
   ├── registerAnalyzer(type, name, handler, options)
   ├── getAnalysis(type, entityId)
   ├── getAllAnalyses(type)
   ├── invalidate(type, entityId)
   ├── refreshAll(options)
   ├── on(eventName, handler)
   └── off(eventName, handler)
========================================================= */

(function bootstrapAIIntelligenceCore(global) {
  "use strict";

  global.AIW = global.AIW || {};

  const AIW = global.AIW;
  const CORE_VERSION = "1.0.0";
  const STORAGE_KEY = "aiw_ai_intelligence_v1";
  const DEFAULT_CACHE_TTL = 5 * 60 * 1000;
  const MAX_HISTORY_ITEMS = 300;

  const listeners = new Map();
  const analyzers = {
    project: new Map(),
    idea: new Map(),
    portfolio: new Map()
  };

  const runtime = {
    initialized: false,
    initializing: false,
    subscriptionReady: false,
    unsubscribeStore: null,
    timer: null,
    revision: 0,
    stateSignature: "",
    lastRefreshAt: null,
    cache: createEmptyCache(),
    history: []
  };

  function createEmptyCache() {
    return {
      project: {},
      idea: {},
      portfolio: {}
    };
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function clamp(value, min = 0, max = 100) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return min;
    return Math.min(max, Math.max(min, numeric));
  }

  function round(value, decimals = 0) {
    const factor = 10 ** decimals;
    return Math.round((Number(value) || 0) * factor) / factor;
  }

  function toNumber(value, fallback = 0) {
    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string") {
      const cleaned = value
        .replace(/[,%]/g, "")
        .replace(/[^\d.-]/g, "")
        .trim();

      const parsed = Number(cleaned);
      if (Number.isFinite(parsed)) return parsed;
    }

    return fallback;
  }

  function toBoolean(value, fallback = false) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value > 0;

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();

      if (
        ["true", "yes", "1", "done", "completed", "complete", "active", "approved", "نعم", "مكتمل", "منجز", "معتمد"].includes(normalized)
      ) {
        return true;
      }

      if (
        ["false", "no", "0", "pending", "inactive", "rejected", "لا", "معلق", "غير مكتمل", "مرفوض"].includes(normalized)
      ) {
        return false;
      }
    }

    return fallback;
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function deepClone(value) {
    if (value === undefined) return undefined;

    try {
      if (typeof structuredClone === "function") {
        return structuredClone(value);
      }
    } catch (_) {
      // Fall through to JSON clone.
    }

    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return value;
    }
  }

  function safeText(value, fallback = "") {
    if (value === null || value === undefined) return fallback;
    return String(value).trim();
  }

  function normalizeText(value) {
    return safeText(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(value) {
    return [...new Set(
      normalizeText(value)
        .split(" ")
        .map((token) => token.trim())
        .filter((token) => token.length > 1)
    )];
  }

  function stableStringify(value) {
    const seen = new WeakSet();

    function normalize(input) {
      if (input === null || typeof input !== "object") return input;
      if (seen.has(input)) return "[Circular]";

      seen.add(input);

      if (Array.isArray(input)) {
        return input.map(normalize);
      }

      return Object.keys(input)
        .sort()
        .reduce((accumulator, key) => {
          accumulator[key] = normalize(input[key]);
          return accumulator;
        }, {});
    }

    try {
      return JSON.stringify(normalize(value));
    } catch (_) {
      return "";
    }
  }

  function hashString(value) {
    const input = safeText(value);
    let hash = 2166136261;

    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(36);
  }

  function createId(prefix = "ai") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeStatus(value) {
    const status = normalizeText(value);

    const map = {
      active: "active",
      نشط: "active",
      paused: "paused",
      pause: "paused",
      متوقف: "paused",
      موقوف: "paused",
      onhold: "paused",
      completed: "completed",
      complete: "completed",
      done: "completed",
      مكتمل: "completed",
      منجز: "completed",
      cancelled: "cancelled",
      canceled: "cancelled",
      ملغي: "cancelled",
      ملغى: "cancelled",
      pending: "pending",
      معلق: "pending",
      draft: "draft",
      مسوده: "draft",
      approved: "approved",
      معتمد: "approved",
      rejected: "rejected",
      مرفوض: "rejected"
    };

    return map[status.replace(/\s+/g, "")] || status || "unknown";
  }

  function levelFromScore(score, options = {}) {
    const numeric = clamp(score);
    const inverse = options.inverse === true;

    if (inverse) {
      if (numeric >= 80) return "critical";
      if (numeric >= 60) return "high";
      if (numeric >= 35) return "medium";
      return "low";
    }

    if (numeric >= 85) return "excellent";
    if (numeric >= 70) return "good";
    if (numeric >= 50) return "moderate";
    if (numeric >= 30) return "weak";
    return "critical";
  }

  function riskLevelFromScore(score) {
    const numeric = clamp(score);

    if (numeric >= 80) return "critical";
    if (numeric >= 60) return "high";
    if (numeric >= 35) return "medium";
    return "low";
  }

  function weightedScore(items, options = {}) {
    const normalizedItems = asArray(items)
      .map((item) => ({
        key: safeText(item?.key || item?.name),
        label: safeText(item?.label || item?.key || item?.name),
        score: clamp(item?.score),
        weight: Math.max(0, toNumber(item?.weight, 1)),
        evidence: item?.evidence ?? null,
        explanation: safeText(item?.explanation)
      }))
      .filter((item) => item.weight > 0);

    const totalWeight = normalizedItems.reduce((sum, item) => sum + item.weight, 0);

    if (!totalWeight) {
      return {
        score: clamp(options.fallback ?? 0),
        confidence: 0,
        breakdown: []
      };
    }

    const rawScore = normalizedItems.reduce(
      (sum, item) => sum + item.score * item.weight,
      0
    ) / totalWeight;

    const completeness = normalizedItems.filter(
      (item) => item.evidence !== null && item.evidence !== undefined && item.evidence !== ""
    ).length / normalizedItems.length;

    const confidenceBase = options.confidenceBase ?? 55;
    const confidence = clamp(confidenceBase + completeness * 40);

    return {
      score: round(rawScore, options.decimals ?? 0),
      confidence: round(confidence, 0),
      breakdown: normalizedItems.map((item) => ({
        ...item,
        contribution: round((item.score * item.weight) / totalWeight, 2)
      }))
    };
  }

  function jaccardSimilarity(firstValue, secondValue) {
    const firstTokens = new Set(tokenize(firstValue));
    const secondTokens = new Set(tokenize(secondValue));

    if (!firstTokens.size && !secondTokens.size) return 100;
    if (!firstTokens.size || !secondTokens.size) return 0;

    const intersection = [...firstTokens].filter((token) => secondTokens.has(token)).length;
    const union = new Set([...firstTokens, ...secondTokens]).size;

    return round((intersection / union) * 100, 1);
  }

  function daysBetween(firstDate, secondDate = new Date()) {
    const first = new Date(firstDate);
    const second = new Date(secondDate);

    if (Number.isNaN(first.getTime()) || Number.isNaN(second.getTime())) return null;

    return Math.round((second.getTime() - first.getTime()) / 86400000);
  }

  function safeDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function emit(eventName, payload) {
    const eventHandlers = listeners.get(eventName);
    if (!eventHandlers) return;

    [...eventHandlers].forEach((handler) => {
      try {
        handler(deepClone(payload));
      } catch (error) {
        console.error(`[AIW.AI] Listener failed for "${eventName}"`, error);
      }
    });
  }

  function on(eventName, handler) {
    if (typeof handler !== "function") return () => {};

    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set());
    }

    listeners.get(eventName).add(handler);

    return () => off(eventName, handler);
  }

  function off(eventName, handler) {
    listeners.get(eventName)?.delete(handler);
  }

  function getStore() {
    return AIW.Store || global.AIWStore || global.Store || null;
  }

  function readStoreState() {
    const store = getStore();

    try {
      if (store && typeof store.getState === "function") {
        return deepClone(store.getState()) || {};
      }

      if (store && typeof store.get === "function") {
        const root = store.get();
        if (root && typeof root === "object") return deepClone(root);
      }

      if (AIW.Data && typeof AIW.Data === "object") {
        return deepClone(AIW.Data);
      }
    } catch (error) {
      console.warn("[AIW.AI] Could not read Store state.", error);
    }

    return {};
  }

  function readPath(source, path, fallback) {
    if (!path) return source;

    const segments = Array.isArray(path)
      ? path
      : String(path).split(".").filter(Boolean);

    let cursor = source;

    for (const segment of segments) {
      if (cursor === null || cursor === undefined) return fallback;
      cursor = cursor[segment];
    }

    return cursor === undefined ? fallback : cursor;
  }

  function getCollection(state, candidates) {
    for (const path of candidates) {
      const value = readPath(state, path);

      if (Array.isArray(value)) return value;

      if (value && typeof value === "object") {
        if (Array.isArray(value.items)) return value.items;
        if (Array.isArray(value.list)) return value.list;
        if (Array.isArray(value.data)) return value.data;

        const objectValues = Object.values(value);
        if (objectValues.length && objectValues.every((item) => item && typeof item === "object")) {
          return objectValues;
        }
      }
    }

    return [];
  }

  function getProjects(state = readStoreState()) {
    return getCollection(state, [
      "projects",
      "data.projects",
      "modules.projects.items",
      "portfolio.projects",
      "project.items"
    ]);
  }

  function getIdeas(state = readStoreState()) {
    return getCollection(state, [
      "ideas",
      "data.ideas",
      "modules.ideas.items",
      "opportunities",
      "idea.items"
    ]);
  }

  function getRisks(state = readStoreState()) {
    return getCollection(state, [
      "risks",
      "data.risks",
      "governance.risks",
      "modules.governance.risks"
    ]);
  }

  function getKPIs(state = readStoreState()) {
    return getCollection(state, [
      "kpis",
      "data.kpis",
      "metrics",
      "modules.kpis.items"
    ]);
  }

  function entityId(entity, fallbackPrefix = "entity") {
    const directId =
      entity?.id ??
      entity?._id ??
      entity?.uuid ??
      entity?.projectId ??
      entity?.ideaId ??
      entity?.key ??
      entity?.code;

    if (directId !== undefined && directId !== null && String(directId).trim()) {
      return String(directId);
    }

    const identityText = [
      entity?.title,
      entity?.name,
      entity?.department,
      entity?.createdAt
    ].filter(Boolean).join("|");

    return `${fallbackPrefix}_${hashString(identityText || stableStringify(entity))}`;
  }

  function findEntity(collection, targetId, type) {
    const normalizedTarget = String(targetId);

    return asArray(collection).find(
      (entity) => entityId(entity, type) === normalizedTarget
    ) || null;
  }

  function extractTasks(project) {
    const candidates = [
      project?.tasks,
      project?.checkpoints,
      project?.workItems,
      project?.executionTasks,
      project?.plan?.tasks,
      project?.delivery?.tasks
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate;
    }

    const phases = asArray(project?.phases);
    if (phases.length) {
      return phases.flatMap((phase) =>
        asArray(phase?.tasks || phase?.checkpoints).map((task) => ({
          ...task,
          phaseId: task?.phaseId || phase?.id,
          phaseTitle: task?.phaseTitle || phase?.title || phase?.name
        }))
      );
    }

    return [];
  }

  function isTaskCompleted(task) {
    return Boolean(
      task?.completed === true ||
      task?.done === true ||
      task?.isCompleted === true ||
      normalizeStatus(task?.status) === "completed" ||
      toBoolean(task?.completed, false)
    );
  }

  function taskProgress(project) {
    const tasks = extractTasks(project);

    if (!tasks.length) {
      const direct = [
        project?.progress,
        project?.completion,
        project?.executionProgress,
        project?.metrics?.progress
      ].find((value) => value !== undefined && value !== null);

      return {
        score: clamp(toNumber(direct, 0)),
        total: 0,
        completed: 0,
        overdue: 0,
        source: direct !== undefined ? "project" : "none"
      };
    }

    const completed = tasks.filter(isTaskCompleted).length;
    const today = new Date();

    const overdue = tasks.filter((task) => {
      if (isTaskCompleted(task)) return false;
      const due = safeDate(task?.dueDate || task?.deadline || task?.targetDate);
      return due ? due.getTime() < today.getTime() : false;
    }).length;

    return {
      score: round((completed / tasks.length) * 100, 0),
      total: tasks.length,
      completed,
      overdue,
      source: "tasks"
    };
  }

  function requirementReadiness(project) {
    const requirements = asArray(
      project?.requirements ||
      project?.implementationRequirements ||
      project?.readinessRequirements ||
      project?.prerequisites
    );

    if (!requirements.length) {
      const direct = [
        project?.readiness,
        project?.implementationReadiness,
        project?.metrics?.readiness
      ].find((value) => value !== undefined && value !== null);

      return {
        score: clamp(toNumber(direct, 0)),
        total: 0,
        completed: 0,
        source: direct !== undefined ? "project" : "none"
      };
    }

    const completed = requirements.filter((requirement) =>
      Boolean(
        requirement?.completed === true ||
        requirement?.ready === true ||
        requirement?.available === true ||
        normalizeStatus(requirement?.status) === "completed"
      )
    ).length;

    return {
      score: round((completed / requirements.length) * 100, 0),
      total: requirements.length,
      completed,
      source: "requirements"
    };
  }

  function getProjectDates(project) {
    const start =
      safeDate(project?.startDate) ||
      safeDate(project?.startedAt) ||
      safeDate(project?.createdAt);

    const end =
      safeDate(project?.endDate) ||
      safeDate(project?.targetDate) ||
      safeDate(project?.deadline);

    return { start, end };
  }

  function projectTimeliness(project, progressScore) {
    const { start, end } = getProjectDates(project);

    if (!start || !end || end <= start) {
      return {
        score: 65,
        plannedProgress: null,
        variance: null,
        explanation: "لا توجد مدة زمنية مكتملة تسمح بقياس الانحراف."
      };
    }

    const now = new Date();
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = clamp(
      ((now.getTime() - start.getTime()) / totalDuration) * 100
    );

    const variance = round(progressScore - elapsed, 1);
    const score = clamp(70 + variance * 1.5);

    return {
      score: round(score, 0),
      plannedProgress: round(elapsed, 0),
      variance,
      explanation:
        variance >= 0
          ? `التقدم أعلى من المسار الزمني المخطط بمقدار ${Math.abs(variance)} نقطة.`
          : `التقدم أقل من المسار الزمني المخطط بمقدار ${Math.abs(variance)} نقطة.`
    };
  }

  function projectDataCompleteness(project) {
    const fields = [
      project?.title || project?.name,
      project?.description || project?.summary,
      project?.owner || project?.projectOwner,
      project?.department || project?.businessUnit,
      project?.status,
      project?.phase || project?.currentPhase,
      project?.startDate || project?.startedAt,
      project?.endDate || project?.targetDate,
      project?.priority,
      project?.objectives || project?.goal
    ];

    const completed = fields.filter((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined && String(value).trim() !== "";
    }).length;

    return round((completed / fields.length) * 100, 0);
  }

  function ideaDataCompleteness(idea) {
    const fields = [
      idea?.title || idea?.name,
      idea?.description || idea?.summary,
      idea?.challenge || idea?.problem,
      idea?.solution || idea?.proposedSolution,
      idea?.department || idea?.businessUnit,
      idea?.owner || idea?.submittedBy,
      idea?.impact || idea?.businessImpact,
      idea?.dataAvailability || idea?.dataReadiness,
      idea?.complexity,
      idea?.risk || idea?.riskLevel
    ];

    const completed = fields.filter((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined && String(value).trim() !== "";
    }).length;

    return round((completed / fields.length) * 100, 0);
  }

  function statusHealthScore(statusValue) {
    const status = normalizeStatus(statusValue);

    const map = {
      active: 85,
      approved: 80,
      completed: 100,
      paused: 35,
      pending: 55,
      draft: 45,
      cancelled: 0,
      rejected: 10,
      unknown: 55
    };

    return map[status] ?? 55;
  }

  function priorityScore(value) {
    const normalized = normalizeText(value).replace(/\s+/g, "");

    const map = {
      critical: 100,
      حرج: 100,
      عاجل: 100,
      high: 85,
      مرتفع: 85,
      عالي: 85,
      medium: 60,
      متوسط: 60,
      low: 35,
      منخفض: 35
    };

    return map[normalized] ?? clamp(toNumber(value, 60));
  }

  function complexityScore(value) {
    const normalized = normalizeText(value).replace(/\s+/g, "");

    const map = {
      veryhigh: 95,
      شديده: 95,
      high: 80,
      مرتفع: 80,
      عالي: 80,
      medium: 55,
      متوسط: 55,
      low: 25,
      منخفض: 25,
      easy: 20,
      سهل: 20
    };

    return map[normalized] ?? clamp(toNumber(value, 50));
  }

  function buildFinding(type, title, message, options = {}) {
    return {
      id: createId("finding"),
      type,
      severity: options.severity || "info",
      title,
      message,
      metric: options.metric ?? null,
      action: options.action || "",
      evidence: options.evidence ?? null
    };
  }

  function buildRecommendation(title, action, options = {}) {
    return {
      id: createId("recommendation"),
      title,
      action,
      priority: options.priority || "medium",
      reason: options.reason || "",
      expectedImpact: options.expectedImpact || "",
      source: options.source || "ai-intelligence-core"
    };
  }

  function baseProjectAnalysis(project, context) {
    const progress = taskProgress(project);
    const readiness = requirementReadiness(project);
    const timeliness = projectTimeliness(project, progress.score);
    const completeness = projectDataCompleteness(project);
    const status = normalizeStatus(project?.status);

    const healthModel = weightedScore([
      {
        key: "progress",
        label: "التقدم التنفيذي",
        score: progress.score,
        weight: 0.30,
        evidence: progress
      },
      {
        key: "readiness",
        label: "جاهزية التنفيذ",
        score: readiness.score,
        weight: 0.25,
        evidence: readiness
      },
      {
        key: "timeliness",
        label: "الالتزام الزمني",
        score: timeliness.score,
        weight: 0.20,
        evidence: timeliness
      },
      {
        key: "status",
        label: "صحة الحالة",
        score: statusHealthScore(status),
        weight: 0.15,
        evidence: status
      },
      {
        key: "dataCompleteness",
        label: "اكتمال البيانات",
        score: completeness,
        weight: 0.10,
        evidence: completeness
      }
    ]);

    let riskScore = 100 - healthModel.score;

    if (progress.overdue > 0) {
      riskScore += Math.min(25, progress.overdue * 6);
    }

    if (status === "paused") riskScore += 15;
    if (status === "cancelled") riskScore = 100;
    if (readiness.score < 40) riskScore += 10;

    riskScore = clamp(riskScore);
    const riskLevel = riskLevelFromScore(riskScore);
    const findings = [];
    const recommendations = [];

    if (progress.overdue > 0) {
      findings.push(
        buildFinding(
          "delay",
          "مهام متأخرة",
          `يوجد ${progress.overdue} من المهام تجاوزت موعدها ولم تكتمل.`,
          {
            severity: progress.overdue >= 3 ? "high" : "medium",
            metric: progress.overdue,
            evidence: progress
          }
        )
      );

      recommendations.push(
        buildRecommendation(
          "معالجة المهام المتأخرة",
          "راجع المهام المتأخرة وحدد مالكاً وموعداً تنفيذياً جديداً لكل مهمة.",
          {
            priority: progress.overdue >= 3 ? "high" : "medium",
            reason: "التأخير يؤثر مباشرة على صحة المشروع واحتمالية إكماله في الوقت.",
            expectedImpact: "رفع الالتزام الزمني وتقليل مخاطر التنفيذ."
          }
        )
      );
    }

    if (readiness.score < 60) {
      findings.push(
        buildFinding(
          "readiness",
          "جاهزية تنفيذ منخفضة",
          `جاهزية التنفيذ الحالية ${readiness.score}%.`,
          {
            severity: readiness.score < 35 ? "high" : "medium",
            metric: readiness.score,
            evidence: readiness
          }
        )
      );

      recommendations.push(
        buildRecommendation(
          "إغلاق متطلبات الجاهزية",
          "أكمل المتطلبات الأساسية قبل الانتقال إلى مرحلة تنفيذ أعلى.",
          {
            priority: readiness.score < 35 ? "high" : "medium",
            reason: "ضعف الجاهزية يرفع احتمالية التعثر وإعادة العمل.",
            expectedImpact: "تقليل مخاطر البدء غير المكتمل."
          }
        )
      );
    }

    if (completeness < 70) {
      findings.push(
        buildFinding(
          "data-quality",
          "بيانات المشروع غير مكتملة",
          `اكتمال بيانات المشروع ${completeness}%.`,
          {
            severity: completeness < 45 ? "high" : "medium",
            metric: completeness
          }
        )
      );

      recommendations.push(
        buildRecommendation(
          "استكمال بيانات المشروع",
          "أضف المالك، المدة، الهدف، المرحلة، الأولوية والبيانات التشغيلية الناقصة.",
          {
            priority: "medium",
            reason: "التحليل الذكي يصبح أدق كلما اكتملت بيانات المشروع.",
            expectedImpact: "رفع دقة التوصيات ومستوى الثقة."
          }
        )
      );
    }

    if (!findings.length) {
      findings.push(
        buildFinding(
          "positive",
          "المشروع مستقر",
          "لا توجد حالياً مؤشرات حرجة في البيانات المتاحة.",
          {
            severity: "low",
            metric: healthModel.score
          }
        )
      );
    }

    return {
      id: entityId(project, "project"),
      entityType: "project",
      title: safeText(project?.title || project?.name, "مشروع بدون اسم"),
      generatedAt: nowISO(),
      modelVersion: CORE_VERSION,
      healthScore: healthModel.score,
      healthLevel: levelFromScore(healthModel.score),
      successProbability: clamp(
        round(
          healthModel.score * 0.75 +
          readiness.score * 0.15 +
          timeliness.score * 0.10,
          0
        )
      ),
      riskScore: round(riskScore, 0),
      riskLevel,
      confidence: healthModel.confidence,
      progress,
      readiness,
      timeliness,
      dataCompleteness: completeness,
      status,
      findings,
      recommendations,
      breakdown: healthModel.breakdown,
      context: {
        totalProjects: context.projects.length,
        totalIdeas: context.ideas.length,
        totalRisks: context.risks.length,
        totalKPIs: context.kpis.length
      }
    };
  }

  function baseIdeaAnalysis(idea, context) {
    const completeness = ideaDataCompleteness(idea);

    const impact = clamp(
      toNumber(
        idea?.impactScore ??
        idea?.businessImpactScore ??
        idea?.strategicValue ??
        idea?.impact,
        60
      )
    );

    const readiness = clamp(
      toNumber(
        idea?.aiReadiness ??
        idea?.readiness ??
        idea?.dataReadiness ??
        idea?.dataAvailability,
        55
      )
    );

    const complexity = complexityScore(
      idea?.complexityScore ??
      idea?.complexity ??
      idea?.implementationComplexity
    );

    const innovation = clamp(
      toNumber(
        idea?.innovationScore ??
        idea?.innovation ??
        idea?.novelty,
        65
      )
    );

    const strategicAlignment = clamp(
      toNumber(
        idea?.strategicAlignment ??
        idea?.alignmentScore ??
        idea?.priorityScore ??
        priorityScore(idea?.priority),
        65
      )
    );

    const risk = clamp(
      toNumber(
        idea?.riskScore ??
        idea?.risk ??
        idea?.riskLevel,
        Math.max(15, complexity - readiness * 0.25)
      )
    );

    const scoreModel = weightedScore([
      {
        key: "impact",
        label: "الأثر التشغيلي",
        score: impact,
        weight: 0.25,
        evidence: idea?.impact ?? impact
      },
      {
        key: "readiness",
        label: "الجاهزية",
        score: readiness,
        weight: 0.20,
        evidence: idea?.dataReadiness ?? idea?.dataAvailability ?? readiness
      },
      {
        key: "strategicAlignment",
        label: "المواءمة الاستراتيجية",
        score: strategicAlignment,
        weight: 0.20,
        evidence: idea?.strategicAlignment ?? idea?.priority
      },
      {
        key: "innovation",
        label: "الابتكار",
        score: innovation,
        weight: 0.15,
        evidence: idea?.innovation ?? innovation
      },
      {
        key: "feasibility",
        label: "قابلية التنفيذ",
        score: 100 - complexity,
        weight: 0.10,
        evidence: idea?.complexity ?? complexity
      },
      {
        key: "dataCompleteness",
        label: "اكتمال البيانات",
        score: completeness,
        weight: 0.10,
        evidence: completeness
      }
    ]);

    const executivePriority = clamp(
      scoreModel.score * 0.75 +
      (100 - risk) * 0.15 +
      readiness * 0.10
    );

    const findings = [];
    const recommendations = [];

    if (readiness < 50) {
      findings.push(
        buildFinding(
          "readiness",
          "جاهزية الفكرة منخفضة",
          `جاهزية البيانات والتنفيذ الحالية ${readiness}%.`,
          {
            severity: readiness < 30 ? "high" : "medium",
            metric: readiness
          }
        )
      );

      recommendations.push(
        buildRecommendation(
          "تنفيذ دراسة جاهزية",
          "حدد مصادر البيانات، المسؤوليات، التكاملات والمتطلبات قبل اعتماد المشروع.",
          {
            priority: readiness < 30 ? "high" : "medium",
            reason: "الفكرة ذات الجاهزية المنخفضة قد تتحول إلى مشروع متعثر.",
            expectedImpact: "رفع وضوح المتطلبات قبل الاعتماد."
          }
        )
      );
    }

    if (complexity >= 75) {
      findings.push(
        buildFinding(
          "complexity",
          "تعقيد تنفيذي مرتفع",
          `مستوى التعقيد المقدر ${complexity}%.`,
          {
            severity: "high",
            metric: complexity
          }
        )
      );

      recommendations.push(
        buildRecommendation(
          "بدء تجربة محدودة",
          "نفذ Pilot صغيراً قبل التوسع الكامل.",
          {
            priority: "high",
            reason: "التعقيد المرتفع يحتاج اختباراً مبكراً للمتطلبات والمخاطر.",
            expectedImpact: "تقليل كلفة الخطأ وتحسين قرار الاستثمار."
          }
        )
      );
    }

    if (impact >= 80 && readiness >= 60) {
      findings.push(
        buildFinding(
          "opportunity",
          "فرصة عالية القيمة",
          "الفكرة تجمع بين أثر مرتفع وجاهزية مناسبة للتنفيذ.",
          {
            severity: "positive",
            metric: round((impact + readiness) / 2, 0)
          }
        )
      );
    }

    if (completeness < 70) {
      recommendations.push(
        buildRecommendation(
          "استكمال وصف الفكرة",
          "أكمل التحدي، الحل، المالك، البيانات، الأثر، التعقيد والمخاطر.",
          {
            priority: "medium",
            reason: "اكتمال البيانات يرفع موثوقية التقييم الذكي.",
            expectedImpact: "رفع دقة قرار الاعتماد."
          }
        )
      );
    }

    return {
      id: entityId(idea, "idea"),
      entityType: "idea",
      title: safeText(idea?.title || idea?.name, "فكرة بدون اسم"),
      generatedAt: nowISO(),
      modelVersion: CORE_VERSION,
      overallScore: scoreModel.score,
      scoreLevel: levelFromScore(scoreModel.score),
      executivePriority: round(executivePriority, 0),
      priorityLevel: levelFromScore(executivePriority),
      confidence: scoreModel.confidence,
      impact,
      readiness,
      complexity,
      innovation,
      strategicAlignment,
      riskScore: risk,
      riskLevel: riskLevelFromScore(risk),
      dataCompleteness: completeness,
      findings,
      recommendations,
      breakdown: scoreModel.breakdown,
      context: {
        totalProjects: context.projects.length,
        totalIdeas: context.ideas.length
      }
    };
  }

  function basePortfolioAnalysis(context) {
    const projectAnalyses = Object.values(runtime.cache.project)
      .map((entry) => entry?.result)
      .filter(Boolean);

    const ideaAnalyses = Object.values(runtime.cache.idea)
      .map((entry) => entry?.result)
      .filter(Boolean);

    const averageProjectHealth = projectAnalyses.length
      ? round(
          projectAnalyses.reduce((sum, item) => sum + toNumber(item.healthScore), 0) /
          projectAnalyses.length,
          0
        )
      : 0;

    const averageIdeaScore = ideaAnalyses.length
      ? round(
          ideaAnalyses.reduce((sum, item) => sum + toNumber(item.overallScore), 0) /
          ideaAnalyses.length,
          0
        )
      : 0;

    const highRiskProjects = projectAnalyses.filter(
      (item) => ["high", "critical"].includes(item.riskLevel)
    );

    const priorityIdeas = ideaAnalyses.filter(
      (item) => item.executivePriority >= 75
    );

    const pausedProjects = context.projects.filter(
      (project) => normalizeStatus(project?.status) === "paused"
    );

    const portfolioHealth = weightedScore([
      {
        key: "projectHealth",
        label: "صحة المشاريع",
        score: averageProjectHealth,
        weight: 0.55,
        evidence: projectAnalyses.length
      },
      {
        key: "ideaQuality",
        label: "جودة محفظة الأفكار",
        score: averageIdeaScore,
        weight: 0.25,
        evidence: ideaAnalyses.length
      },
      {
        key: "riskControl",
        label: "التحكم بالمخاطر",
        score: context.projects.length
          ? 100 - (highRiskProjects.length / context.projects.length) * 100
          : 100,
        weight: 0.20,
        evidence: highRiskProjects.length
      }
    ]);

    const findings = [];
    const recommendations = [];

    if (highRiskProjects.length) {
      findings.push(
        buildFinding(
          "portfolio-risk",
          "مشاريع تحتاج تدخلاً تنفيذياً",
          `يوجد ${highRiskProjects.length} مشروع بمستوى مخاطر مرتفع أو حرج.`,
          {
            severity: highRiskProjects.length >= 3 ? "high" : "medium",
            metric: highRiskProjects.length,
            evidence: highRiskProjects.map((item) => ({
              id: item.id,
              title: item.title,
              riskScore: item.riskScore,
              riskLevel: item.riskLevel
            }))
          }
        )
      );

      recommendations.push(
        buildRecommendation(
          "مراجعة المشاريع عالية المخاطر",
          "اعقد مراجعة تنفيذية للمشاريع الأعلى خطورة وحدد إجراءات تصحيحية واضحة.",
          {
            priority: "high",
            reason: "تقليل التعثر وحماية الجدول التنفيذي للمحفظة.",
            expectedImpact: "خفض المخاطر وتحسين صحة المحفظة."
          }
        )
      );
    }

    if (pausedProjects.length) {
      findings.push(
        buildFinding(
          "paused-projects",
          "مشاريع متوقفة",
          `يوجد ${pausedProjects.length} مشروع متوقف حالياً.`,
          {
            severity: "medium",
            metric: pausedProjects.length
          }
        )
      );
    }

    if (priorityIdeas.length) {
      findings.push(
        buildFinding(
          "priority-ideas",
          "أفكار جاهزة للمراجعة",
          `يوجد ${priorityIdeas.length} فكرة ذات أولوية تنفيذية مرتفعة.`,
          {
            severity: "positive",
            metric: priorityIdeas.length
          }
        )
      );
    }

    if (!findings.length) {
      findings.push(
        buildFinding(
          "stable",
          "المحفظة مستقرة",
          "لا توجد مؤشرات حرجة في البيانات الحالية.",
          {
            severity: "positive",
            metric: portfolioHealth.score
          }
        )
      );
    }

    return {
      id: "portfolio",
      entityType: "portfolio",
      generatedAt: nowISO(),
      modelVersion: CORE_VERSION,
      portfolioHealth: portfolioHealth.score,
      healthLevel: levelFromScore(portfolioHealth.score),
      confidence: portfolioHealth.confidence,
      totals: {
        projects: context.projects.length,
        ideas: context.ideas.length,
        risks: context.risks.length,
        kpis: context.kpis.length,
        highRiskProjects: highRiskProjects.length,
        priorityIdeas: priorityIdeas.length,
        pausedProjects: pausedProjects.length
      },
      averages: {
        projectHealth: averageProjectHealth,
        ideaScore: averageIdeaScore
      },
      findings,
      recommendations,
      breakdown: portfolioHealth.breakdown
    };
  }

  function getContext() {
    const state = readStoreState();

    return {
      state,
      projects: getProjects(state),
      ideas: getIdeas(state),
      risks: getRisks(state),
      kpis: getKPIs(state)
    };
  }

  function normalizeAnalyzerResult(result, analyzerName) {
    if (result === undefined || result === null) return null;

    if (typeof result !== "object") {
      return {
        analyzer: analyzerName,
        value: result
      };
    }

    return {
      analyzer: analyzerName,
      ...deepClone(result)
    };
  }

  async function executeRegisteredAnalyzers(type, entity, context) {
    const registered = analyzers[type];
    if (!registered || !registered.size) return [];

    const outputs = [];

    for (const [name, descriptor] of registered.entries()) {
      try {
        const output = await descriptor.handler(
          deepClone(entity),
          deepClone(context),
          AIW.AI
        );

        const normalized = normalizeAnalyzerResult(output, name);
        if (normalized) outputs.push(normalized);
      } catch (error) {
        console.error(`[AIW.AI] Analyzer "${name}" failed.`, error);

        outputs.push({
          analyzer: name,
          error: true,
          message: error?.message || "Analyzer failed"
        });
      }
    }

    return outputs;
  }

  function mergeExtensions(baseResult, extensionResults) {
    const result = deepClone(baseResult);
    result.extensions = {};

    for (const extension of extensionResults) {
      const name = extension.analyzer || createId("extension");
      result.extensions[name] = extension;

      if (Array.isArray(extension.findings)) {
        result.findings = [
          ...asArray(result.findings),
          ...deepClone(extension.findings)
        ];
      }

      if (Array.isArray(extension.recommendations)) {
        result.recommendations = [
          ...asArray(result.recommendations),
          ...deepClone(extension.recommendations)
        ];
      }
    }

    return result;
  }

  function buildCacheKey(type, id) {
    return `${type}:${id}`;
  }

  function getCacheEntry(type, id) {
    return runtime.cache?.[type]?.[id] || null;
  }

  function isCacheValid(entry, signature, options = {}) {
    if (!entry) return false;
    if (options.force === true) return false;
    if (entry.signature !== signature) return false;

    const ttl = toNumber(options.ttl, DEFAULT_CACHE_TTL);
    const age = Date.now() - toNumber(entry.createdAtEpoch, 0);

    return ttl <= 0 || age <= ttl;
  }

  function saveCacheEntry(type, id, signature, result) {
    runtime.cache[type] = runtime.cache[type] || {};
    runtime.cache[type][id] = {
      key: buildCacheKey(type, id),
      signature,
      createdAt: nowISO(),
      createdAtEpoch: Date.now(),
      result: deepClone(result)
    };

    runtime.revision += 1;
    persistRuntime();
  }

  function recordHistory(event) {
    runtime.history.unshift({
      id: createId("history"),
      at: nowISO(),
      ...deepClone(event)
    });

    runtime.history = runtime.history.slice(0, MAX_HISTORY_ITEMS);
  }

  async function analyzeProject(projectId, options = {}) {
    await ensureInitialized();

    const context = getContext();
    const project = findEntity(context.projects, projectId, "project");

    if (!project) {
      throw new Error(`Project "${projectId}" was not found.`);
    }

    const id = entityId(project, "project");
    const signature = hashString(stableStringify(project));
    const cached = getCacheEntry("project", id);

    if (isCacheValid(cached, signature, options)) {
      return deepClone(cached.result);
    }

    emit("analysis:start", { type: "project", id });

    const baseResult = baseProjectAnalysis(project, context);
    const extensionResults = await executeRegisteredAnalyzers(
      "project",
      project,
      context
    );

    const finalResult = mergeExtensions(baseResult, extensionResults);

    saveCacheEntry("project", id, signature, finalResult);
    recordHistory({
      action: "analyze",
      type: "project",
      entityId: id,
      score: finalResult.healthScore,
      riskScore: finalResult.riskScore
    });

    emit("analysis:complete", {
      type: "project",
      id,
      result: finalResult
    });

    return deepClone(finalResult);
  }

  async function analyzeIdea(ideaId, options = {}) {
    await ensureInitialized();

    const context = getContext();
    const idea = findEntity(context.ideas, ideaId, "idea");

    if (!idea) {
      throw new Error(`Idea "${ideaId}" was not found.`);
    }

    const id = entityId(idea, "idea");
    const signature = hashString(stableStringify(idea));
    const cached = getCacheEntry("idea", id);

    if (isCacheValid(cached, signature, options)) {
      return deepClone(cached.result);
    }

    emit("analysis:start", { type: "idea", id });

    const baseResult = baseIdeaAnalysis(idea, context);
    const extensionResults = await executeRegisteredAnalyzers(
      "idea",
      idea,
      context
    );

    const finalResult = mergeExtensions(baseResult, extensionResults);

    saveCacheEntry("idea", id, signature, finalResult);
    recordHistory({
      action: "analyze",
      type: "idea",
      entityId: id,
      score: finalResult.overallScore,
      riskScore: finalResult.riskScore
    });

    emit("analysis:complete", {
      type: "idea",
      id,
      result: finalResult
    });

    return deepClone(finalResult);
  }

  async function analyzePortfolio(options = {}) {
    await ensureInitialized();

    const context = getContext();

    if (options.includeEntities !== false) {
      for (const project of context.projects) {
        await analyzeProject(entityId(project, "project"), options);
      }

      for (const idea of context.ideas) {
        await analyzeIdea(entityId(idea, "idea"), options);
      }
    }

    const signature = hashString(
      stableStringify({
        projects: context.projects,
        ideas: context.ideas,
        risks: context.risks,
        kpis: context.kpis
      })
    );

    const cached = getCacheEntry("portfolio", "portfolio");

    if (isCacheValid(cached, signature, options)) {
      return deepClone(cached.result);
    }

    emit("analysis:start", { type: "portfolio", id: "portfolio" });

    const baseResult = basePortfolioAnalysis(context);
    const extensionResults = await executeRegisteredAnalyzers(
      "portfolio",
      context.state,
      context
    );

    const finalResult = mergeExtensions(baseResult, extensionResults);

    saveCacheEntry("portfolio", "portfolio", signature, finalResult);
    recordHistory({
      action: "analyze",
      type: "portfolio",
      entityId: "portfolio",
      score: finalResult.portfolioHealth
    });

    emit("analysis:complete", {
      type: "portfolio",
      id: "portfolio",
      result: finalResult
    });

    return deepClone(finalResult);
  }

  function registerAnalyzer(type, name, handler, options = {}) {
    if (!analyzers[type]) {
      throw new Error(`Unsupported analyzer type "${type}".`);
    }

    if (!name || typeof handler !== "function") {
      throw new Error("Analyzer name and handler are required.");
    }

    analyzers[type].set(String(name), {
      handler,
      priority: toNumber(options.priority, 100),
      registeredAt: nowISO(),
      version: options.version || "1.0.0"
    });

    const sorted = [...analyzers[type].entries()]
      .sort((first, second) => first[1].priority - second[1].priority);

    analyzers[type] = new Map(sorted);

    emit("analyzer:registered", {
      type,
      name: String(name),
      version: options.version || "1.0.0"
    });

    return () => {
      analyzers[type]?.delete(String(name));
      emit("analyzer:removed", { type, name: String(name) });
    };
  }

  function getAnalysis(type, entityIdValue) {
    const id = entityIdValue || (type === "portfolio" ? "portfolio" : null);
    if (!id) return null;

    return deepClone(getCacheEntry(type, String(id))?.result || null);
  }

  function getAllAnalyses(type) {
    const entries = runtime.cache?.[type] || {};

    return Object.values(entries)
      .map((entry) => deepClone(entry?.result))
      .filter(Boolean);
  }

  function invalidate(type, entityIdValue) {
    if (!type) {
      runtime.cache = createEmptyCache();
    } else if (type && entityIdValue) {
      delete runtime.cache?.[type]?.[String(entityIdValue)];
    } else if (runtime.cache[type]) {
      runtime.cache[type] = {};
    }

    runtime.revision += 1;
    persistRuntime();

    emit("cache:invalidated", {
      type: type || "all",
      entityId: entityIdValue || null
    });
  }

  async function refreshAll(options = {}) {
    await ensureInitialized();

    const context = getContext();
    const output = {
      projects: [],
      ideas: [],
      portfolio: null,
      errors: [],
      startedAt: nowISO()
    };

    emit("refresh:start", {
      projects: context.projects.length,
      ideas: context.ideas.length
    });

    for (const project of context.projects) {
      try {
        output.projects.push(
          await analyzeProject(entityId(project, "project"), {
            ...options,
            force: options.force !== false
          })
        );
      } catch (error) {
        output.errors.push({
          type: "project",
          id: entityId(project, "project"),
          message: error?.message || "Project analysis failed"
        });
      }
    }

    for (const idea of context.ideas) {
      try {
        output.ideas.push(
          await analyzeIdea(entityId(idea, "idea"), {
            ...options,
            force: options.force !== false
          })
        );
      } catch (error) {
        output.errors.push({
          type: "idea",
          id: entityId(idea, "idea"),
          message: error?.message || "Idea analysis failed"
        });
      }
    }

    try {
      output.portfolio = await analyzePortfolio({
        ...options,
        force: options.force !== false,
        includeEntities: false
      });
    } catch (error) {
      output.errors.push({
        type: "portfolio",
        id: "portfolio",
        message: error?.message || "Portfolio analysis failed"
      });
    }

    output.completedAt = nowISO();
    runtime.lastRefreshAt = output.completedAt;
    runtime.stateSignature = createStateSignature(context.state);

    persistRuntime();
    emit("refresh:complete", output);

    return deepClone(output);
  }

  function createStateSignature(state) {
    const relevant = {
      projects: getProjects(state),
      ideas: getIdeas(state),
      risks: getRisks(state),
      kpis: getKPIs(state)
    };

    return hashString(stableStringify(relevant));
  }

  function scheduleRefresh(reason = "store-change") {
    clearTimeout(runtime.timer);

    runtime.timer = setTimeout(async () => {
      try {
        const state = readStoreState();
        const nextSignature = createStateSignature(state);

        if (nextSignature === runtime.stateSignature) return;

        await refreshAll({ force: true, reason });
      } catch (error) {
        console.error("[AIW.AI] Scheduled refresh failed.", error);
      }
    }, 180);
  }

  function subscribeToStore() {
    if (runtime.subscriptionReady) return;

    const store = getStore();

    if (store && typeof store.subscribe === "function") {
      try {
        const unsubscribe = store.subscribe((...args) => {
          emit("store:change", { args: deepClone(args) });
          scheduleRefresh("store-subscription");
        });

        if (typeof unsubscribe === "function") {
          runtime.unsubscribeStore = unsubscribe;
        }

        runtime.subscriptionReady = true;
        return;
      } catch (error) {
        console.warn("[AIW.AI] Store subscription failed.", error);
      }
    }

    global.addEventListener?.("aiw:store:changed", () =>
      scheduleRefresh("custom-event")
    );

    global.addEventListener?.("storage", (event) => {
      if (!event?.key) return;

      if (
        event.key.includes("aiw") ||
        event.key.includes("AIW") ||
        event.key.includes("store")
      ) {
        scheduleRefresh("storage-event");
      }
    });

    runtime.subscriptionReady = true;
  }

  function persistRuntime() {
    const payload = {
      version: CORE_VERSION,
      savedAt: nowISO(),
      revision: runtime.revision,
      stateSignature: runtime.stateSignature,
      lastRefreshAt: runtime.lastRefreshAt,
      cache: runtime.cache,
      history: runtime.history
    };

    try {
      global.localStorage?.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn("[AIW.AI] Could not persist intelligence cache.", error);
    }

    const store = getStore();

    try {
      if (store && typeof store.setMetadata === "function") {
        store.setMetadata("aiIntelligence", {
          version: CORE_VERSION,
          revision: runtime.revision,
          lastRefreshAt: runtime.lastRefreshAt
        });
      }
    } catch (_) {
      // Metadata is optional and must never interrupt the platform.
    }
  }

  function restoreRuntime() {
    try {
      const raw = global.localStorage?.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);

      if (!parsed || typeof parsed !== "object") return;

      runtime.cache = {
        ...createEmptyCache(),
        ...(parsed.cache || {})
      };

      runtime.history = asArray(parsed.history).slice(0, MAX_HISTORY_ITEMS);
      runtime.revision = toNumber(parsed.revision, 0);
      runtime.stateSignature = safeText(parsed.stateSignature);
      runtime.lastRefreshAt = parsed.lastRefreshAt || null;
    } catch (error) {
      console.warn("[AIW.AI] Could not restore intelligence cache.", error);
      runtime.cache = createEmptyCache();
      runtime.history = [];
    }
  }

  async function ensureInitialized() {
    if (runtime.initialized) return AIW.AI;
    return init();
  }

  async function init(options = {}) {
    if (runtime.initialized) return AIW.AI;

    if (runtime.initializing) {
      return new Promise((resolve) => {
        const stop = on("core:ready", () => {
          stop();
          resolve(AIW.AI);
        });
      });
    }

    runtime.initializing = true;

    restoreRuntime();
    subscribeToStore();

    const currentState = readStoreState();
    const currentSignature = createStateSignature(currentState);

    if (options.autoRefresh !== false) {
      try {
        await refreshAll({
          force: currentSignature !== runtime.stateSignature
        });
      } catch (error) {
        console.error("[AIW.AI] Initial analysis failed.", error);
      }
    }

    runtime.initialized = true;
    runtime.initializing = false;
    runtime.stateSignature = currentSignature;
    persistRuntime();

    emit("core:ready", {
      version: CORE_VERSION,
      initializedAt: nowISO()
    });

    global.dispatchEvent?.(
      new CustomEvent("aiw:ai:ready", {
        detail: {
          version: CORE_VERSION,
          initializedAt: nowISO()
        }
      })
    );

    return AIW.AI;
  }

  function destroy() {
    clearTimeout(runtime.timer);

    if (typeof runtime.unsubscribeStore === "function") {
      runtime.unsubscribeStore();
    }

    runtime.unsubscribeStore = null;
    runtime.subscriptionReady = false;
    runtime.initialized = false;
    runtime.initializing = false;

    emit("core:destroyed", { at: nowISO() });
  }

  function getStatus() {
    return {
      name: "AI Intelligence Core",
      version: CORE_VERSION,
      initialized: runtime.initialized,
      initializing: runtime.initializing,
      subscriptionReady: runtime.subscriptionReady,
      revision: runtime.revision,
      lastRefreshAt: runtime.lastRefreshAt,
      cache: {
        projects: Object.keys(runtime.cache.project || {}).length,
        ideas: Object.keys(runtime.cache.idea || {}).length,
        portfolio: Object.keys(runtime.cache.portfolio || {}).length
      },
      analyzers: {
        project: analyzers.project.size,
        idea: analyzers.idea.size,
        portfolio: analyzers.portfolio.size
      }
    };
  }

  function getHistory(limit = 50) {
    return deepClone(runtime.history.slice(0, Math.max(0, toNumber(limit, 50))));
  }

  function clearHistory() {
    runtime.history = [];
    persistRuntime();
    emit("history:cleared", { at: nowISO() });
  }

  AIW.AI = {
    version: CORE_VERSION,
    storageKey: STORAGE_KEY,

    init,
    destroy,
    getStatus,

    analyzeProject,
    analyzeIdea,
    analyzePortfolio,
    refreshAll,

    registerAnalyzer,
    getAnalysis,
    getAllAnalyses,
    invalidate,

    getProjects: () => deepClone(getProjects(readStoreState())),
    getIdeas: () => deepClone(getIdeas(readStoreState())),
    getRisks: () => deepClone(getRisks(readStoreState())),
    getKPIs: () => deepClone(getKPIs(readStoreState())),

    getHistory,
    clearHistory,

    on,
    off,
    emit,

    utils: {
      clamp,
      round,
      toNumber,
      toBoolean,
      asArray,
      deepClone,
      safeText,
      normalizeText,
      tokenize,
      stableStringify,
      hashString,
      createId,
      normalizeStatus,
      levelFromScore,
      riskLevelFromScore,
      weightedScore,
      jaccardSimilarity,
      daysBetween,
      safeDate,
      entityId,
      findEntity,
      extractTasks,
      isTaskCompleted,
      taskProgress,
      requirementReadiness,
      projectTimeliness,
      projectDataCompleteness,
      ideaDataCompleteness,
      priorityScore,
      complexityScore,
      buildFinding,
      buildRecommendation,
      readStoreState,
      readPath
    }
  };

  AIW.Engines = AIW.Engines || {};
  AIW.Engines.aiIntelligence = AIW.AI;

  function autoInit() {
    AIW.AI.init().catch((error) => {
      console.error("[AIW.AI] Auto initialization failed.", error);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit, { once: true });
  } else {
    queueMicrotask(autoInit);
  }

})(window);
