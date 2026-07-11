/* =========================================================
   AI Work - Project Risk Intelligence V1.0
   Enterprise Biometric Intelligence Platform

   File Path:
   js/extensions/ai/project-risk-intelligence.js

   Depends on:
   - js/extensions/ai/ai-intelligence-core.js

   Purpose:
   - Calculates explainable project risk scores
   - Detects early-warning signals and delivery threats
   - Estimates delay probability and escalation urgency
   - Generates mitigation actions and review guidance
   - Works as an independent registered AIW.AI analyzer
   - Does not modify projects.js or the current UI design
========================================================= */

(function bootstrapProjectRiskIntelligence(global) {
  "use strict";

  global.AIW = global.AIW || {};

  const AIW = global.AIW;
  const VERSION = "1.0.0";
  const ANALYZER_NAME = "project-risk-intelligence";
  const HISTORY_STORAGE_KEY = "aiw_project_risk_history_v1";
  const MAX_HISTORY_PER_PROJECT = 30;

  const runtime = {
    initialized: false,
    unregister: null,
    generated: 0,
    lastRunAt: null,
    history: {}
  };

  function getCore() {
    return AIW.AI || AIW.Engines?.aiIntelligence || null;
  }

  function requireCore() {
    const core = getCore();

    if (!core || typeof core.registerAnalyzer !== "function") {
      throw new Error(
        "AI Intelligence Core is required before Project Risk Intelligence."
      );
    }

    return core;
  }

  function safeText(value, fallback = "") {
    return String(value ?? fallback).trim();
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
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

  function normalizeStatus(value) {
    const core = getCore();

    if (core?.utils?.normalizeStatus) {
      return core.utils.normalizeStatus(value);
    }

    return safeText(value).toLowerCase() || "unknown";
  }

  function normalizeText(value) {
    const core = getCore();

    if (core?.utils?.normalizeText) {
      return core.utils.normalizeText(value);
    }

    return safeText(value).toLowerCase();
  }

  function projectId(project) {
    const core = getCore();

    if (core?.utils?.entityId) {
      return core.utils.entityId(project, "project");
    }

    return String(
      project?.id ??
      project?._id ??
      project?.projectId ??
      project?.title ??
      project?.name ??
      "project"
    );
  }

  function getTasks(project) {
    const core = getCore();

    if (core?.utils?.extractTasks) {
      return core.utils.extractTasks(project);
    }

    return asArray(
      project?.tasks ||
      project?.checkpoints ||
      project?.workItems
    );
  }

  function isCompleted(task) {
    const core = getCore();

    if (core?.utils?.isTaskCompleted) {
      return core.utils.isTaskCompleted(task);
    }

    return Boolean(
      task?.completed === true ||
      task?.done === true ||
      normalizeStatus(task?.status) === "completed"
    );
  }

  function taskProgress(project) {
    const core = getCore();

    if (core?.utils?.taskProgress) {
      return core.utils.taskProgress(project);
    }

    const tasks = getTasks(project);

    if (!tasks.length) {
      return {
        score: clamp(project?.progress ?? 0),
        total: 0,
        completed: 0,
        overdue: 0,
        source: "project"
      };
    }

    const completed = tasks.filter(isCompleted).length;

    return {
      score: round((completed / tasks.length) * 100),
      total: tasks.length,
      completed,
      overdue: 0,
      source: "tasks"
    };
  }

  function requirementReadiness(project) {
    const core = getCore();

    if (core?.utils?.requirementReadiness) {
      return core.utils.requirementReadiness(project);
    }

    return {
      score: clamp(
        project?.readiness ??
        project?.implementationReadiness ??
        0
      ),
      total: 0,
      completed: 0,
      source: "project"
    };
  }

  function projectDataCompleteness(project) {
    const core = getCore();

    if (core?.utils?.projectDataCompleteness) {
      return core.utils.projectDataCompleteness(project);
    }

    return 60;
  }

  function parseDate(value) {
    if (!value) return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function daysBetween(first, second = new Date()) {
    const firstDate = parseDate(first);
    const secondDate = parseDate(second);

    if (!firstDate || !secondDate) return null;

    return round(
      (secondDate.getTime() - firstDate.getTime()) / 86400000,
      0
    );
  }

  function getProjectDates(project) {
    return {
      start:
        parseDate(project?.startDate) ||
        parseDate(project?.startedAt) ||
        parseDate(project?.createdAt),
      end:
        parseDate(project?.endDate) ||
        parseDate(project?.targetDate) ||
        parseDate(project?.deadline),
      updated:
        parseDate(project?.updatedAt) ||
        parseDate(project?.lastUpdatedAt) ||
        parseDate(project?.modifiedAt)
    };
  }

  function getBlockedTasks(tasks) {
    return tasks.filter((task) => {
      const status = normalizeStatus(task?.status);
      const text = normalizeText(task?.status);

      return Boolean(
        task?.blocked === true ||
        task?.isBlocked === true ||
        status === "blocked" ||
        text.includes("موقوف") ||
        text.includes("محظور") ||
        text.includes("blocked")
      );
    });
  }

  function getCriticalTasks(tasks) {
    return tasks.filter((task) => {
      const priority = normalizeText(
        task?.priority ||
        task?.severity ||
        task?.importance
      );

      return Boolean(
        task?.critical === true ||
        priority.includes("critical") ||
        priority.includes("high") ||
        priority.includes("حرج") ||
        priority.includes("عالي") ||
        priority.includes("مرتفع")
      );
    });
  }

  function getOverdueTasks(tasks) {
    const now = new Date();

    return tasks.filter((task) => {
      if (isCompleted(task)) return false;

      const due =
        parseDate(task?.dueDate) ||
        parseDate(task?.deadline) ||
        parseDate(task?.targetDate);

      return due ? due.getTime() < now.getTime() : false;
    });
  }

  function getDependencies(project) {
    return asArray(
      project?.dependencies ||
      project?.projectDependencies ||
      project?.integrationDependencies ||
      project?.externalDependencies
    );
  }

  function getOpenDependencies(project) {
    return getDependencies(project).filter((dependency) => {
      const status = normalizeStatus(dependency?.status);

      return !Boolean(
        dependency?.completed === true ||
        dependency?.resolved === true ||
        status === "completed"
      );
    });
  }

  function getExplicitRisks(project, context) {
    const projectSpecific = asArray(
      project?.risks ||
      project?.projectRisks ||
      project?.riskRegister
    );

    const related = asArray(context?.risks).filter((risk) => {
      const linkedId =
        risk?.projectId ??
        risk?.entityId ??
        risk?.relatedProjectId;

      return linkedId !== undefined &&
        String(linkedId) === projectId(project);
    });

    return [...projectSpecific, ...related];
  }

  function isOpenRisk(risk) {
    const status = normalizeStatus(risk?.status);

    return !Boolean(
      risk?.closed === true ||
      risk?.resolved === true ||
      status === "completed" ||
      status === "cancelled"
    );
  }

  function riskSeverityScore(value) {
    const normalized = normalizeText(value).replace(/\s+/g, "");

    const map = {
      critical: 100,
      حرج: 100,
      high: 80,
      مرتفع: 80,
      عالي: 80,
      medium: 55,
      متوسط: 55,
      low: 25,
      منخفض: 25
    };

    return map[normalized] ?? clamp(Number(value) || 50);
  }

  function averageExplicitRiskScore(risks) {
    const openRisks = risks.filter(isOpenRisk);

    if (!openRisks.length) return 0;

    return round(
      openRisks.reduce((sum, risk) => {
        const probability = clamp(
          Number(
            risk?.probability ??
            risk?.likelihood ??
            riskSeverityScore(risk?.likelihoodLevel)
          ) || 50
        );

        const impact = clamp(
          Number(
            risk?.impact ??
            risk?.impactScore ??
            riskSeverityScore(risk?.severity)
          ) || 50
        );

        return sum + round((probability * impact) / 100);
      }, 0) / openRisks.length
    );
  }

  function scheduleRisk(project, progress) {
    const { start, end } = getProjectDates(project);

    if (!start || !end || end <= start) {
      return {
        score: 35,
        plannedProgress: null,
        variance: null,
        overdueProject: false,
        explanation: "البيانات الزمنية غير مكتملة، لذلك توجد مخاطرة قياس متوسطة."
      };
    }

    const now = new Date();
    const total = end.getTime() - start.getTime();
    const elapsedPercent = clamp(
      ((now.getTime() - start.getTime()) / total) * 100
    );

    const variance = round(progress.score - elapsedPercent, 1);
    const overdueProject =
      now.getTime() > end.getTime() &&
      progress.score < 100;

    let score = 20;

    if (overdueProject) {
      score = 95;
    } else if (variance <= -25) {
      score = 85;
    } else if (variance <= -15) {
      score = 70;
    } else if (variance <= -8) {
      score = 52;
    } else if (variance < 0) {
      score = 35;
    } else {
      score = 15;
    }

    return {
      score,
      plannedProgress: round(elapsedPercent),
      variance,
      overdueProject,
      explanation:
        overdueProject
          ? "المشروع تجاوز تاريخ الانتهاء ولم يكتمل."
          : variance < 0
          ? `التقدم أقل من المسار الزمني بمقدار ${Math.abs(variance)} نقطة.`
          : `التقدم يساوي أو يتجاوز المسار الزمني بمقدار ${Math.abs(variance)} نقطة.`
    };
  }

  function inactivityRisk(project) {
    const { updated } = getProjectDates(project);

    if (!updated) {
      return {
        score: 35,
        inactiveDays: null,
        explanation: "لا يوجد تاريخ تحديث واضح."
      };
    }

    const inactiveDays = daysBetween(updated, new Date());

    let score = 10;

    if (inactiveDays >= 60) score = 90;
    else if (inactiveDays >= 30) score = 75;
    else if (inactiveDays >= 14) score = 55;
    else if (inactiveDays >= 7) score = 35;

    return {
      score,
      inactiveDays,
      explanation:
        inactiveDays > 0
          ? `مر ${inactiveDays} يوم منذ آخر تحديث مسجل.`
          : "المشروع محدث حديثاً."
    };
  }

  function ownershipRisk(project) {
    const owner = safeText(
      project?.owner ||
      project?.projectOwner ||
      project?.manager ||
      project?.lead
    );

    return {
      score: owner ? 10 : 85,
      owner: owner || null,
      explanation: owner
        ? `المالك التنفيذي محدد: ${owner}.`
        : "لا يوجد مالك تنفيذي واضح للمشروع."
    };
  }

  function readinessRisk(project) {
    const readiness = requirementReadiness(project);

    return {
      score: clamp(100 - readiness.score),
      readiness,
      explanation: `جاهزية التنفيذ الحالية ${readiness.score}%.`
    };
  }

  function dataQualityRisk(project) {
    const completeness = projectDataCompleteness(project);

    return {
      score: clamp(100 - completeness),
      completeness,
      explanation: `اكتمال بيانات المشروع ${completeness}%.`
    };
  }

  function taskExecutionRisk(project) {
    const tasks = getTasks(project);
    const blocked = getBlockedTasks(tasks);
    const overdue = getOverdueTasks(tasks);
    const critical = getCriticalTasks(tasks);
    const incompleteCritical = critical.filter(
      (task) => !isCompleted(task)
    );
    const progress = taskProgress(project);

    let score = 100 - progress.score;

    score += blocked.length * 18;
    score += overdue.length * 12;
    score += incompleteCritical.length * 8;

    return {
      score: clamp(score),
      tasks,
      progress,
      blocked,
      overdue,
      critical,
      incompleteCritical,
      explanation: `المهام: ${tasks.length}، المحظورة: ${blocked.length}، المتأخرة: ${overdue.length}، الحرجة غير المكتملة: ${incompleteCritical.length}.`
    };
  }

  function dependencyRisk(project) {
    const dependencies = getDependencies(project);
    const open = getOpenDependencies(project);

    if (!dependencies.length) {
      return {
        score: 20,
        dependencies,
        open,
        explanation: "لا توجد تبعيات مسجلة."
      };
    }

    return {
      score: clamp((open.length / dependencies.length) * 100),
      dependencies,
      open,
      explanation: `يوجد ${open.length} تبعية مفتوحة من أصل ${dependencies.length}.`
    };
  }

  function statusRisk(project) {
    const status = normalizeStatus(project?.status);

    const map = {
      active: 15,
      approved: 20,
      completed: 0,
      paused: 75,
      pending: 45,
      draft: 55,
      cancelled: 100,
      rejected: 95,
      unknown: 50
    };

    return {
      score: map[status] ?? 50,
      status,
      explanation: `حالة المشروع الحالية: ${status}.`
    };
  }

  function explicitRiskSignal(project, context) {
    const risks = getExplicitRisks(project, context);
    const openRisks = risks.filter(isOpenRisk);
    const score = averageExplicitRiskScore(risks);

    return {
      score,
      risks,
      openRisks,
      explanation: `يوجد ${openRisks.length} خطر مفتوح مرتبط بالمشروع.`
    };
  }

  function buildFactor(key, label, score, weight, explanation, evidence) {
    return {
      key,
      label,
      score: clamp(score),
      weight,
      explanation,
      evidence
    };
  }

  function weightedRisk(factors) {
    const totalWeight = factors.reduce(
      (sum, factor) => sum + Number(factor.weight || 0),
      0
    );

    if (!totalWeight) return 0;

    return round(
      factors.reduce(
        (sum, factor) =>
          sum + clamp(factor.score) * Number(factor.weight || 0),
        0
      ) / totalWeight
    );
  }

  function riskLevel(score) {
    if (score >= 80) return "critical";
    if (score >= 60) return "high";
    if (score >= 35) return "medium";
    return "low";
  }

  function riskLabel(level) {
    const labels = {
      critical: "حرج",
      high: "مرتفع",
      medium: "متوسط",
      low: "منخفض"
    };

    return labels[level] || labels.medium;
  }

  function escalationLevel(score, signals) {
    if (
      score >= 85 ||
      signals.schedule.overdueProject ||
      signals.tasks.blocked.length >= 3 ||
      signals.tasks.overdue.length >= 5
    ) {
      return "executive";
    }

    if (
      score >= 65 ||
      signals.status.status === "paused" ||
      signals.tasks.blocked.length > 0
    ) {
      return "management";
    }

    if (score >= 40) return "owner";
    return "monitor";
  }

  function escalationLabel(level) {
    const labels = {
      executive: "تصعيد تنفيذي",
      management: "مراجعة إدارية",
      owner: "إجراء من مالك المشروع",
      monitor: "مراقبة اعتيادية"
    };

    return labels[level] || labels.monitor;
  }

  function delayProbability(signals, totalRisk) {
    const raw =
      signals.schedule.score * 0.40 +
      signals.tasks.score * 0.25 +
      signals.dependencies.score * 0.15 +
      signals.inactivity.score * 0.10 +
      totalRisk * 0.10;

    return clamp(round(raw));
  }

  function buildWarning(code, title, message, severity, metric, action) {
    return {
      id: `${code}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      code,
      title,
      message,
      severity,
      metric,
      action
    };
  }

  function buildWarnings(signals, totalRisk) {
    const warnings = [];

    if (signals.schedule.overdueProject) {
      warnings.push(
        buildWarning(
          "PROJECT_OVERDUE",
          "المشروع تجاوز موعد الانتهاء",
          "تاريخ الانتهاء مضى والمشروع لم يصل إلى 100%.",
          "critical",
          signals.schedule.variance,
          "اعتماد خطة استرداد وجدول زمني جديد فوراً."
        )
      );
    }

    if (signals.tasks.blocked.length) {
      warnings.push(
        buildWarning(
          "BLOCKED_TASKS",
          "مهام محظورة",
          `يوجد ${signals.tasks.blocked.length} مهمة محظورة.`,
          signals.tasks.blocked.length >= 3 ? "critical" : "high",
          signals.tasks.blocked.length,
          "تحديد العائق والجهة المسؤولة عن فكه."
        )
      );
    }

    if (signals.tasks.overdue.length) {
      warnings.push(
        buildWarning(
          "OVERDUE_TASKS",
          "مهام متأخرة",
          `يوجد ${signals.tasks.overdue.length} مهمة متأخرة.`,
          signals.tasks.overdue.length >= 4 ? "critical" : "high",
          signals.tasks.overdue.length,
          "إعادة الجدولة وتحديد التزامات جديدة."
        )
      );
    }

    if (signals.readiness.readiness.score < 40) {
      warnings.push(
        buildWarning(
          "LOW_READINESS",
          "جاهزية تنفيذ منخفضة",
          `الجاهزية الحالية ${signals.readiness.readiness.score}%.`,
          "high",
          signals.readiness.readiness.score,
          "إيقاف الانتقال للمرحلة التالية حتى إغلاق المتطلبات."
        )
      );
    }

    if (signals.ownership.score >= 80) {
      warnings.push(
        buildWarning(
          "NO_OWNER",
          "لا يوجد مالك تنفيذي",
          "المشروع لا يحتوي على مسؤول تنفيذي واضح.",
          "high",
          null,
          "تعيين مالك للمشروع."
        )
      );
    }

    if (
      signals.inactivity.inactiveDays !== null &&
      signals.inactivity.inactiveDays >= 14
    ) {
      warnings.push(
        buildWarning(
          "INACTIVE_PROJECT",
          "انخفاض نشاط المشروع",
          `مر ${signals.inactivity.inactiveDays} يوم منذ آخر تحديث.`,
          signals.inactivity.inactiveDays >= 30 ? "high" : "medium",
          signals.inactivity.inactiveDays,
          "طلب تحديث رسمي من مالك المشروع."
        )
      );
    }

    if (signals.dependencies.open.length >= 2) {
      warnings.push(
        buildWarning(
          "OPEN_DEPENDENCIES",
          "تبعيات مفتوحة",
          `يوجد ${signals.dependencies.open.length} تبعية مفتوحة.`,
          signals.dependencies.open.length >= 4 ? "high" : "medium",
          signals.dependencies.open.length,
          "تحديد ملاك التبعيات ومواعيد إغلاقها."
        )
      );
    }

    if (signals.explicit.openRisks.length >= 3) {
      warnings.push(
        buildWarning(
          "RISK_REGISTER",
          "عدد مرتفع من المخاطر المفتوحة",
          `يوجد ${signals.explicit.openRisks.length} خطر مفتوح.`,
          totalRisk >= 70 ? "high" : "medium",
          signals.explicit.openRisks.length,
          "مراجعة سجل المخاطر وخطط التخفيف."
        )
      );
    }

    if (!warnings.length) {
      warnings.push(
        buildWarning(
          "STABLE",
          "لا توجد إنذارات حرجة",
          "المؤشرات الحالية لا تظهر تهديداً تنفيذياً مباشراً.",
          "low",
          totalRisk,
          "الاستمرار بالمراقبة الدورية."
        )
      );
    }

    return warnings;
  }

  function buildMitigations(signals, level) {
    const mitigations = [];

    if (signals.tasks.blocked.length) {
      mitigations.push({
        priority: 1,
        category: "delivery",
        title: "فك العوائق التنفيذية",
        action: "اجمع المهام المحظورة في قائمة واحدة وحدد المسؤول والموعد لكل عائق.",
        expectedImpact: "خفض التأخير وتحسين التدفق التنفيذي."
      });
    }

    if (signals.tasks.overdue.length) {
      mitigations.push({
        priority: 1,
        category: "schedule",
        title: "إعادة ضبط الجدول",
        action: "أعد جدولة المهام المتأخرة وحدد التبعيات الحرجة.",
        expectedImpact: "تقليل احتمالية التأخير الكلي."
      });
    }

    if (signals.readiness.readiness.score < 60) {
      mitigations.push({
        priority: 2,
        category: "readiness",
        title: "إغلاق فجوات الجاهزية",
        action: "أكمل المتطلبات والبيانات والتكاملات قبل رفع مستوى التنفيذ.",
        expectedImpact: "تقليل مخاطر إعادة العمل."
      });
    }

    if (signals.ownership.score >= 80) {
      mitigations.push({
        priority: 1,
        category: "governance",
        title: "تعيين مالك واضح",
        action: "عيّن مالكاً تنفيذياً واحداً مسؤولاً عن القرار والتصعيد.",
        expectedImpact: "رفع المساءلة وسرعة الاستجابة."
      });
    }

    if (signals.dependencies.open.length) {
      mitigations.push({
        priority: 2,
        category: "dependencies",
        title: "إدارة التبعيات",
        action: "أنشئ متابعة أسبوعية للتبعيات المفتوحة وملاكها.",
        expectedImpact: "خفض المخاطر الخارجية على المشروع."
      });
    }

    if (signals.data.completeness < 70) {
      mitigations.push({
        priority: 3,
        category: "data",
        title: "تحسين جودة البيانات",
        action: "استكمل المالك والمرحلة والمدة والأولوية والمخاطر والمتطلبات.",
        expectedImpact: "رفع دقة التحليل والقرار."
      });
    }

    if (!mitigations.length) {
      mitigations.push({
        priority: 3,
        category: "monitoring",
        title: "استمرار المراقبة",
        action: "استمر بالمراجعة الأسبوعية للمخاطر والتقدم.",
        expectedImpact: "الحفاظ على استقرار المشروع."
      });
    }

    return mitigations
      .sort((first, second) => first.priority - second.priority)
      .slice(0, level === "critical" ? 6 : 4);
  }

  function nextReviewDate(level) {
    const date = new Date();

    const days =
      level === "critical"
        ? 1
        : level === "high"
        ? 3
        : level === "medium"
        ? 7
        : 14;

    date.setDate(date.getDate() + days);

    return {
      date: date.toISOString(),
      inDays: days
    };
  }

  function restoreHistory() {
    try {
      const raw = global.localStorage?.getItem(HISTORY_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);

      if (parsed && typeof parsed === "object") {
        runtime.history = parsed;
      }
    } catch (error) {
      console.warn(
        "[AIW.ProjectRiskIntelligence] Could not restore history.",
        error
      );
      runtime.history = {};
    }
  }

  function persistHistory() {
    try {
      global.localStorage?.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(runtime.history)
      );
    } catch (error) {
      console.warn(
        "[AIW.ProjectRiskIntelligence] Could not persist history.",
        error
      );
    }
  }

  function recordRisk(projectKey, snapshot) {
    runtime.history[projectKey] = asArray(
      runtime.history[projectKey]
    );

    runtime.history[projectKey].unshift(snapshot);
    runtime.history[projectKey] =
      runtime.history[projectKey].slice(
        0,
        MAX_HISTORY_PER_PROJECT
      );

    persistHistory();
  }

  function getRiskTrend(projectKey, currentScore) {
    const history = asArray(runtime.history[projectKey]);
    const previous = history[0];

    if (!previous) {
      return {
        direction: "stable",
        delta: 0,
        previousScore: null,
        message: "لا توجد قراءة سابقة كافية لقياس الاتجاه."
      };
    }

    const delta = round(currentScore - Number(previous.score || 0), 1);

    if (delta >= 5) {
      return {
        direction: "rising",
        delta,
        previousScore: previous.score,
        message: `المخاطر ارتفعت بمقدار ${Math.abs(delta)} نقطة.`
      };
    }

    if (delta <= -5) {
      return {
        direction: "falling",
        delta,
        previousScore: previous.score,
        message: `المخاطر انخفضت بمقدار ${Math.abs(delta)} نقطة.`
      };
    }

    return {
      direction: "stable",
      delta,
      previousScore: previous.score,
      message: "مستوى المخاطر مستقر تقريباً."
    };
  }

  function topFactors(factors, limit = 5) {
    return [...factors]
      .sort(
        (first, second) =>
          second.score * second.weight -
          first.score * first.weight
      )
      .slice(0, limit)
      .map((factor) => ({
        key: factor.key,
        label: factor.label,
        score: factor.score,
        weight: factor.weight,
        explanation: factor.explanation,
        contribution: round(factor.score * factor.weight, 2)
      }));
  }

  function buildExecutiveSummary(project, result) {
    const title = safeText(
      project?.title ||
      project?.name,
      "المشروع"
    );

    return `${title} يحمل مستوى مخاطر ${riskLabel(result.riskLevel)} بدرجة ${result.riskScore}%. احتمالية التأخير ${result.delayProbability}%. التوصية الحالية: ${result.escalationLabel}.`;
  }

  function buildFindings(result) {
    return result.earlyWarnings.map((warning) => ({
      type: "risk-intelligence",
      severity: warning.severity,
      title: warning.title,
      message: warning.message,
      metric: warning.metric,
      action: warning.action
    }));
  }

  function buildRecommendations(result) {
    return result.mitigationPlan.map((item) => ({
      title: item.title,
      action: item.action,
      priority:
        item.priority === 1
          ? "high"
          : item.priority === 2
          ? "medium"
          : "low",
      reason: `معالجة عامل مخاطر ضمن فئة ${item.category}.`,
      expectedImpact: item.expectedImpact,
      source: ANALYZER_NAME
    }));
  }

  function analyzeProject(project, context) {
    const progress = taskProgress(project);

    const signals = {
      schedule: scheduleRisk(project, progress),
      inactivity: inactivityRisk(project),
      ownership: ownershipRisk(project),
      readiness: readinessRisk(project),
      data: dataQualityRisk(project),
      tasks: taskExecutionRisk(project),
      dependencies: dependencyRisk(project),
      status: statusRisk(project),
      explicit: explicitRiskSignal(project, context)
    };

    const factors = [
      buildFactor(
        "schedule",
        "المخاطر الزمنية",
        signals.schedule.score,
        0.22,
        signals.schedule.explanation,
        signals.schedule
      ),
      buildFactor(
        "taskExecution",
        "مخاطر تنفيذ المهام",
        signals.tasks.score,
        0.22,
        signals.tasks.explanation,
        {
          blocked: signals.tasks.blocked.length,
          overdue: signals.tasks.overdue.length,
          incompleteCritical:
            signals.tasks.incompleteCritical.length
        }
      ),
      buildFactor(
        "readiness",
        "مخاطر الجاهزية",
        signals.readiness.score,
        0.14,
        signals.readiness.explanation,
        signals.readiness.readiness
      ),
      buildFactor(
        "dependencies",
        "مخاطر التبعيات",
        signals.dependencies.score,
        0.10,
        signals.dependencies.explanation,
        {
          total: signals.dependencies.dependencies.length,
          open: signals.dependencies.open.length
        }
      ),
      buildFactor(
        "ownership",
        "مخاطر الملكية",
        signals.ownership.score,
        0.08,
        signals.ownership.explanation,
        signals.ownership.owner
      ),
      buildFactor(
        "inactivity",
        "مخاطر انخفاض النشاط",
        signals.inactivity.score,
        0.08,
        signals.inactivity.explanation,
        signals.inactivity.inactiveDays
      ),
      buildFactor(
        "explicitRisks",
        "سجل المخاطر",
        signals.explicit.score,
        0.08,
        signals.explicit.explanation,
        {
          total: signals.explicit.risks.length,
          open: signals.explicit.openRisks.length
        }
      ),
      buildFactor(
        "dataQuality",
        "جودة البيانات",
        signals.data.score,
        0.05,
        signals.data.explanation,
        signals.data.completeness
      ),
      buildFactor(
        "status",
        "مخاطر الحالة",
        signals.status.score,
        0.03,
        signals.status.explanation,
        signals.status.status
      )
    ];

    let riskScore = weightedRisk(factors);

    if (signals.schedule.overdueProject) {
      riskScore = Math.max(riskScore, 88);
    }

    if (signals.status.status === "cancelled") {
      riskScore = 100;
    }

    if (signals.status.status === "completed") {
      riskScore = Math.min(riskScore, 10);
    }

    riskScore = clamp(riskScore);

    const level = riskLevel(riskScore);
    const escalation = escalationLevel(
      riskScore,
      signals
    );
    const delay = delayProbability(
      signals,
      riskScore
    );
    const key = projectId(project);
    const trend = getRiskTrend(
      key,
      riskScore
    );
    const warnings = buildWarnings(
      signals,
      riskScore
    );
    const mitigations = buildMitigations(
      signals,
      level
    );
    const review = nextReviewDate(level);
    const top = topFactors(factors);

    const result = {
      id: key,
      analyzer: ANALYZER_NAME,
      version: VERSION,
      generatedAt: new Date().toISOString(),

      riskScore,
      riskLevel: level,
      riskLabel: riskLabel(level),
      confidence: clamp(
        55 +
        (progress.source !== "none" ? 10 : 0) +
        (signals.readiness.readiness.source !== "none" ? 10 : 0) +
        (signals.ownership.owner ? 8 : 0) +
        (signals.schedule.plannedProgress !== null ? 8 : 0) +
        (signals.explicit.risks.length ? 5 : 0)
      ),

      delayProbability: delay,
      successProbabilityAdjustment: round(
        -1 * riskScore * 0.35,
        0
      ),

      escalationLevel: escalation,
      escalationLabel: escalationLabel(
        escalation
      ),

      review: {
        recommendedDate: review.date,
        inDays: review.inDays,
        cadence:
          level === "critical"
            ? "يومي"
            : level === "high"
            ? "كل 3 أيام"
            : level === "medium"
            ? "أسبوعي"
            : "كل أسبوعين"
      },

      trend,
      topRiskFactors: top,
      earlyWarnings: warnings,
      mitigationPlan: mitigations,
      factors,
      signals: {
        schedule: signals.schedule,
        taskExecution: {
          score: signals.tasks.score,
          totalTasks: signals.tasks.tasks.length,
          blockedTasks: signals.tasks.blocked.length,
          overdueTasks: signals.tasks.overdue.length,
          criticalTasks: signals.tasks.critical.length,
          incompleteCriticalTasks:
            signals.tasks.incompleteCritical.length,
          progress: signals.tasks.progress
        },
        readiness: signals.readiness,
        dependencies: {
          score: signals.dependencies.score,
          total: signals.dependencies.dependencies.length,
          open: signals.dependencies.open.length
        },
        ownership: signals.ownership,
        inactivity: signals.inactivity,
        explicitRisks: {
          score: signals.explicit.score,
          total: signals.explicit.risks.length,
          open: signals.explicit.openRisks.length
        },
        dataQuality: signals.data,
        status: signals.status
      }
    };

    result.executiveSummary = buildExecutiveSummary(
      project,
      result
    );
    result.findings = buildFindings(result);
    result.recommendations =
      buildRecommendations(result);
    result.decisionSupport = {
      canProceed:
        level !== "critical" &&
        !signals.schedule.overdueProject &&
        signals.tasks.blocked.length < 3,
      shouldPause:
        level === "critical" ||
        signals.tasks.blocked.length >= 3,
      needsExecutiveEscalation:
        escalation === "executive",
      needsManagementReview:
        escalation === "executive" ||
        escalation === "management",
      suggestedDecision:
        level === "critical"
          ? "إيقاف الانتقال للمرحلة التالية واعتماد خطة معالجة فورية."
          : level === "high"
          ? "الاستمرار المشروط بإغلاق العوائق الأعلى خطورة."
          : level === "medium"
          ? "الاستمرار مع مراجعة أسبوعية للمخاطر."
          : "الاستمرار ضمن المراقبة الاعتيادية."
    };

    recordRisk(key, {
      at: result.generatedAt,
      score: riskScore,
      level,
      delayProbability: delay
    });

    runtime.generated += 1;
    runtime.lastRunAt = result.generatedAt;

    return result;
  }

  function getRisk(projectKey) {
    const core = getCore();

    if (!core || typeof core.getAnalysis !== "function") {
      return null;
    }

    const analysis = core.getAnalysis(
      "project",
      projectKey
    );

    return (
      analysis?.extensions?.[ANALYZER_NAME] ||
      null
    );
  }

  function getHistory(projectKey) {
    return JSON.parse(
      JSON.stringify(
        asArray(runtime.history[String(projectKey)])
      )
    );
  }

  function clearHistory(projectKey) {
    if (projectKey) {
      delete runtime.history[String(projectKey)];
    } else {
      runtime.history = {};
    }

    persistHistory();
  }

  async function refreshProject(projectKey) {
    const core = requireCore();

    return core.analyzeProject(
      projectKey,
      { force: true }
    );
  }

  async function refreshAll() {
    const core = requireCore();

    return core.refreshAll({
      force: true
    });
  }

  function getStatus() {
    return {
      name: "Project Risk Intelligence",
      version: VERSION,
      initialized: runtime.initialized,
      generated: runtime.generated,
      lastRunAt: runtime.lastRunAt,
      analyzerName: ANALYZER_NAME,
      trackedProjects: Object.keys(
        runtime.history
      ).length
    };
  }

  function init() {
    if (runtime.initialized) {
      return AIW.ProjectRiskIntelligence;
    }

    const core = requireCore();

    restoreHistory();

    runtime.unregister = core.registerAnalyzer(
      "project",
      ANALYZER_NAME,
      analyzeProject,
      {
        version: VERSION,
        priority: 30
      }
    );

    runtime.initialized = true;

    core.emit?.("risk-intelligence:ready", {
      name: ANALYZER_NAME,
      version: VERSION,
      initializedAt: new Date().toISOString()
    });

    global.dispatchEvent?.(
      new CustomEvent(
        "aiw:project-risk-intelligence:ready",
        {
          detail: {
            name: ANALYZER_NAME,
            version: VERSION
          }
        }
      )
    );

    core.refreshAll?.({
      force: true
    }).catch((error) => {
      console.error(
        "[AIW.ProjectRiskIntelligence] Initial refresh failed.",
        error
      );
    });

    return AIW.ProjectRiskIntelligence;
  }

  function destroy() {
    if (typeof runtime.unregister === "function") {
      runtime.unregister();
    }

    runtime.unregister = null;
    runtime.initialized = false;
  }

  AIW.ProjectRiskIntelligence = {
    version: VERSION,
    analyzerName: ANALYZER_NAME,

    init,
    destroy,
    getStatus,

    analyzeProject,
    getRisk,
    getHistory,
    clearHistory,
    refreshProject,
    refreshAll
  };

  AIW.Engines = AIW.Engines || {};
  AIW.Engines.projectRiskIntelligence =
    AIW.ProjectRiskIntelligence;

  function autoInit() {
    try {
      init();
    } catch (error) {
      console.error(
        "[AIW.ProjectRiskIntelligence] Auto initialization failed.",
        error
      );
    }
  }

  if (getCore()) {
    autoInit();
  } else {
    global.addEventListener(
      "aiw:ai:ready",
      autoInit,
      { once: true }
    );

    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          if (getCore()) autoInit();
        },
        { once: true }
      );
    }
  }

})(window);
