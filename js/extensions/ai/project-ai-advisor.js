/* =========================================================
   AI Work - Project AI Advisor V1.0
   Enterprise Biometric Intelligence Platform

   File Path:
   js/extensions/ai/project-ai-advisor.js

   Depends on:
   - js/extensions/ai/ai-intelligence-core.js

   Purpose:
   - Adds explainable executive advice to project analyses
   - Generates health summaries and intervention priorities
   - Produces next-best actions and management guidance
   - Works as a registered AIW.AI project analyzer
   - Does not modify projects.js or the current UI design
========================================================= */

(function bootstrapProjectAIAdvisor(global) {
  "use strict";

  global.AIW = global.AIW || {};

  const AIW = global.AIW;
  const VERSION = "1.0.0";
  const ANALYZER_NAME = "project-ai-advisor";

  const state = {
    initialized: false,
    unregister: null,
    generated: 0,
    lastRunAt: null
  };

  function getCore() {
    return AIW.AI || AIW.Engines?.aiIntelligence || null;
  }

  function requireCore() {
    const core = getCore();

    if (!core || typeof core.registerAnalyzer !== "function") {
      throw new Error(
        "AI Intelligence Core is required before Project AI Advisor."
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

  function getProjectId(project) {
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
      safeText(task?.status).toLowerCase() === "completed"
    );
  }

  function getProgress(project) {
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

  function getReadiness(project) {
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

  function getDataCompleteness(project) {
    const core = getCore();

    if (core?.utils?.projectDataCompleteness) {
      return core.utils.projectDataCompleteness(project);
    }

    return 60;
  }

  function getOwner(project) {
    return safeText(
      project?.owner ||
      project?.projectOwner ||
      project?.manager ||
      project?.lead ||
      project?.responsible
    );
  }

  function getDepartment(project) {
    return safeText(
      project?.department ||
      project?.businessUnit ||
      project?.sector ||
      project?.unit
    );
  }

  function getPhase(project) {
    return safeText(
      project?.currentPhase ||
      project?.phase ||
      project?.stage ||
      project?.lifecycleStage
    );
  }

  function getPriority(project) {
    return safeText(
      project?.priority ||
      project?.executivePriority ||
      project?.importance
    );
  }

  function getDates(project) {
    const startValue =
      project?.startDate ||
      project?.startedAt ||
      project?.createdAt;

    const endValue =
      project?.endDate ||
      project?.targetDate ||
      project?.deadline;

    const start = startValue ? new Date(startValue) : null;
    const end = endValue ? new Date(endValue) : null;

    return {
      start:
        start && !Number.isNaN(start.getTime())
          ? start
          : null,
      end:
        end && !Number.isNaN(end.getTime())
          ? end
          : null
    };
  }

  function getScheduleSignal(project, progress) {
    const { start, end } = getDates(project);

    if (!start || !end || end <= start) {
      return {
        status: "unknown",
        score: 60,
        plannedProgress: null,
        variance: null,
        summary: "لا توجد بيانات زمنية كافية لقياس الانحراف."
      };
    }

    const now = new Date();
    const total = end.getTime() - start.getTime();
    const elapsed = clamp(
      ((now.getTime() - start.getTime()) / total) * 100
    );

    const variance = round(progress.score - elapsed, 1);

    if (variance >= 10) {
      return {
        status: "ahead",
        score: 90,
        plannedProgress: round(elapsed),
        variance,
        summary: `المشروع متقدم عن المسار الزمني بمقدار ${Math.abs(variance)} نقطة.`
      };
    }

    if (variance >= -8) {
      return {
        status: "on-track",
        score: 78,
        plannedProgress: round(elapsed),
        variance,
        summary: "المشروع قريب من المسار الزمني المخطط."
      };
    }

    if (variance >= -20) {
      return {
        status: "at-risk",
        score: 48,
        plannedProgress: round(elapsed),
        variance,
        summary: `المشروع أقل من المسار الزمني بمقدار ${Math.abs(variance)} نقطة.`
      };
    }

    return {
      status: "delayed",
      score: 25,
      plannedProgress: round(elapsed),
      variance,
      summary: `المشروع متأخر بشكل واضح بمقدار ${Math.abs(variance)} نقطة.`
    };
  }

  function getBlockedTasks(tasks) {
    return tasks.filter((task) => {
      const status = normalizeStatus(task?.status);

      return Boolean(
        task?.blocked === true ||
        task?.isBlocked === true ||
        status === "blocked" ||
        safeText(task?.status).includes("موقوف") ||
        safeText(task?.status).includes("محظور")
      );
    });
  }

  function getCriticalTasks(tasks) {
    return tasks.filter((task) => {
      const priority = safeText(
        task?.priority ||
        task?.severity ||
        task?.importance
      ).toLowerCase();

      return Boolean(
        task?.critical === true ||
        priority === "critical" ||
        priority === "high" ||
        priority.includes("حرج") ||
        priority.includes("عالي") ||
        priority.includes("مرتفع")
      );
    });
  }

  function getIncompleteCriticalTasks(tasks) {
    return getCriticalTasks(tasks).filter((task) => !isCompleted(task));
  }

  function scoreOwnerCoverage(owner) {
    return owner ? 100 : 25;
  }

  function scorePhaseClarity(phase) {
    return phase ? 100 : 35;
  }

  function scorePriorityClarity(priority) {
    return priority ? 100 : 45;
  }

  function buildDriver(
    key,
    label,
    score,
    weight,
    explanation,
    evidence = null
  ) {
    return {
      key,
      label,
      score: clamp(score),
      weight,
      explanation,
      evidence
    };
  }

  function weightedAverage(drivers) {
    const validDrivers = asArray(drivers).filter(
      (driver) => Number(driver?.weight) > 0
    );

    const totalWeight = validDrivers.reduce(
      (sum, driver) => sum + Number(driver.weight),
      0
    );

    if (!totalWeight) return 0;

    return round(
      validDrivers.reduce(
        (sum, driver) =>
          sum + clamp(driver.score) * Number(driver.weight),
        0
      ) / totalWeight,
      0
    );
  }

  function getHealthLevel(score) {
    if (score >= 85) return "excellent";
    if (score >= 70) return "good";
    if (score >= 50) return "moderate";
    if (score >= 30) return "weak";
    return "critical";
  }

  function getInterventionLevel(score, status, blockedCount, overdueCount) {
    if (
      status === "cancelled" ||
      score < 35 ||
      blockedCount >= 3 ||
      overdueCount >= 5
    ) {
      return "immediate";
    }

    if (
      status === "paused" ||
      score < 55 ||
      blockedCount > 0 ||
      overdueCount >= 2
    ) {
      return "high";
    }

    if (score < 75 || overdueCount === 1) {
      return "medium";
    }

    return "low";
  }

  function getUrgencyLabel(level) {
    const labels = {
      immediate: "تدخل فوري",
      high: "أولوية مرتفعة",
      medium: "متابعة إدارية",
      low: "مراقبة اعتيادية"
    };

    return labels[level] || labels.medium;
  }

  function getHealthLabel(level) {
    const labels = {
      excellent: "ممتاز",
      good: "جيد",
      moderate: "متوسط",
      weak: "ضعيف",
      critical: "حرج"
    };

    return labels[level] || "متوسط";
  }

  function getStatusArabic(status) {
    const labels = {
      active: "نشط",
      paused: "متوقف مؤقتاً",
      completed: "مكتمل",
      cancelled: "ملغي",
      pending: "معلق",
      draft: "مسودة",
      approved: "معتمد",
      rejected: "مرفوض",
      unknown: "غير محدد"
    };

    return labels[status] || safeText(status, "غير محدد");
  }

  function createFinding(
    title,
    message,
    severity,
    metric = null,
    action = ""
  ) {
    const core = getCore();

    if (core?.utils?.buildFinding) {
      return core.utils.buildFinding(
        "advisor",
        title,
        message,
        {
          severity,
          metric,
          action
        }
      );
    }

    return {
      type: "advisor",
      title,
      message,
      severity,
      metric,
      action
    };
  }

  function createRecommendation(
    title,
    action,
    priority,
    reason,
    expectedImpact
  ) {
    const core = getCore();

    if (core?.utils?.buildRecommendation) {
      return core.utils.buildRecommendation(
        title,
        action,
        {
          priority,
          reason,
          expectedImpact,
          source: ANALYZER_NAME
        }
      );
    }

    return {
      title,
      action,
      priority,
      reason,
      expectedImpact,
      source: ANALYZER_NAME
    };
  }

  function choosePrimaryConcern(metrics) {
    const concerns = [
      {
        key: "progress",
        score: metrics.progress.score,
        title: "التقدم التنفيذي",
        message: `التقدم الحالي ${metrics.progress.score}%.`
      },
      {
        key: "readiness",
        score: metrics.readiness.score,
        title: "جاهزية التنفيذ",
        message: `الجاهزية الحالية ${metrics.readiness.score}%.`
      },
      {
        key: "schedule",
        score: metrics.schedule.score,
        title: "الالتزام الزمني",
        message: metrics.schedule.summary
      },
      {
        key: "data",
        score: metrics.dataCompleteness,
        title: "اكتمال بيانات المشروع",
        message: `اكتمال البيانات الحالية ${metrics.dataCompleteness}%.`
      },
      {
        key: "ownership",
        score: scoreOwnerCoverage(metrics.owner),
        title: "الملكية والمسؤولية",
        message: metrics.owner
          ? `المالك الحالي: ${metrics.owner}.`
          : "لا يوجد مالك واضح للمشروع."
      }
    ];

    if (metrics.blockedTasks.length) {
      concerns.push({
        key: "blockedTasks",
        score: Math.max(0, 60 - metrics.blockedTasks.length * 15),
        title: "مهام محظورة",
        message: `يوجد ${metrics.blockedTasks.length} مهمة محظورة.`
      });
    }

    if (metrics.progress.overdue > 0) {
      concerns.push({
        key: "overdueTasks",
        score: Math.max(0, 65 - metrics.progress.overdue * 12),
        title: "مهام متأخرة",
        message: `يوجد ${metrics.progress.overdue} مهمة متأخرة.`
      });
    }

    return concerns.sort((first, second) => first.score - second.score)[0];
  }

  function chooseStrongestPoint(drivers) {
    return [...drivers].sort(
      (first, second) => second.score - first.score
    )[0];
  }

  function buildExecutiveSummary(project, result) {
    const title = safeText(
      project?.title ||
      project?.name,
      "المشروع"
    );

    const healthText = getHealthLabel(result.healthLevel);
    const statusText = getStatusArabic(result.status);
    const urgencyText = getUrgencyLabel(result.interventionLevel);

    if (result.status === "completed") {
      return `${title} مكتمل، وتقييمه التنفيذي ${healthText} بدرجة ${result.advisorScore}%. لا توجد حاجة لتدخل تشغيلي إلا لإغلاق التوثيق والدروس المستفادة.`;
    }

    if (result.status === "cancelled") {
      return `${title} ملغي حالياً. يحتاج مراجعة سبب الإلغاء وتوثيق القرار قبل إغلاق السجل نهائياً.`;
    }

    return `${title} حالته ${statusText}، وصحته التنفيذية ${healthText} بدرجة ${result.advisorScore}%. مستوى المتابعة المطلوب: ${urgencyText}. أهم نقطة تحتاج انتباهاً هي ${result.primaryConcern.title}.`;
  }

  function buildManagementMessage(result) {
    if (result.interventionLevel === "immediate") {
      return "يوصى بتدخل تنفيذي فوري لتثبيت المسؤوليات، معالجة العوائق، وإعادة ضبط خطة التنفيذ.";
    }

    if (result.interventionLevel === "high") {
      return "يوصى بمراجعة إدارية قريبة مع خطة تصحيحية واضحة ومواعيد قصيرة.";
    }

    if (result.interventionLevel === "medium") {
      return "المشروع قابل للاستمرار، لكنه يحتاج متابعة مركزة للنقاط الأضعف قبل الانتقال للمرحلة التالية.";
    }

    return "المشروع مستقر حالياً ويمكن متابعته ضمن الحوكمة التشغيلية الاعتيادية.";
  }

  function buildNextBestActions(metrics, primaryConcern) {
    const actions = [];

    if (!metrics.owner) {
      actions.push({
        rank: 1,
        action: "تعيين مالك تنفيذي واضح للمشروع.",
        reason: "غياب المالك يقلل المساءلة ويؤخر القرارات.",
        category: "ownership"
      });
    }

    if (metrics.blockedTasks.length) {
      actions.push({
        rank: 1,
        action: "فك حظر المهام المتوقفة وتحديد الجهة المسؤولة عن كل عائق.",
        reason: `يوجد ${metrics.blockedTasks.length} مهمة محظورة.`,
        category: "delivery"
      });
    }

    if (metrics.progress.overdue > 0) {
      actions.push({
        rank: 1,
        action: "إعادة جدولة المهام المتأخرة مع مواعيد ومالكين محددين.",
        reason: `يوجد ${metrics.progress.overdue} مهمة متأخرة.`,
        category: "schedule"
      });
    }

    if (metrics.readiness.score < 60) {
      actions.push({
        rank: 2,
        action: "إغلاق متطلبات الجاهزية قبل رفع مستوى التنفيذ.",
        reason: `الجاهزية الحالية ${metrics.readiness.score}%.`,
        category: "readiness"
      });
    }

    if (metrics.dataCompleteness < 70) {
      actions.push({
        rank: 2,
        action: "استكمال بيانات المشروع الأساسية والتحليلية.",
        reason: `اكتمال البيانات الحالية ${metrics.dataCompleteness}%.`,
        category: "data"
      });
    }

    if (!metrics.phase) {
      actions.push({
        rank: 2,
        action: "تحديد المرحلة الحالية والمرحلة التالية للمشروع.",
        reason: "غياب المرحلة يجعل قياس التقدم والمخاطر أقل دقة.",
        category: "governance"
      });
    }

    if (
      metrics.schedule.status === "delayed" ||
      metrics.schedule.status === "at-risk"
    ) {
      actions.push({
        rank: 1,
        action: "مراجعة خطة التنفيذ والجدول الزمني وإزالة الأعمال غير الضرورية.",
        reason: metrics.schedule.summary,
        category: "schedule"
      });
    }

    if (!actions.length) {
      actions.push({
        rank: 3,
        action: "الاستمرار على الخطة الحالية مع مراجعة أسبوعية للمهام والمخاطر.",
        reason: "المؤشرات الحالية مستقرة.",
        category: "monitoring"
      });
    }

    const unique = [];
    const seen = new Set();

    for (const action of actions) {
      const key = action.action.toLowerCase();

      if (seen.has(key)) continue;

      seen.add(key);
      unique.push(action);
    }

    return unique
      .sort((first, second) => first.rank - second.rank)
      .slice(0, 5)
      .map((action, index) => ({
        ...action,
        rank: index + 1,
        primary:
          index === 0 ||
          action.category === primaryConcern.key
      }));
  }

  function buildFindings(metrics, result) {
    const findings = [];

    findings.push(
      createFinding(
        "التقييم التنفيذي",
        `حصل المشروع على ${result.advisorScore}% بتصنيف ${getHealthLabel(result.healthLevel)}.`,
        result.healthLevel === "critical"
          ? "high"
          : result.healthLevel === "weak"
          ? "medium"
          : "positive",
        result.advisorScore
      )
    );

    if (!metrics.owner) {
      findings.push(
        createFinding(
          "لا يوجد مالك واضح",
          "بيانات المشروع لا تحتوي على مالك أو مسؤول تنفيذي محدد.",
          "high",
          null,
          "تعيين مالك للمشروع."
        )
      );
    }

    if (metrics.blockedTasks.length) {
      findings.push(
        createFinding(
          "وجود مهام محظورة",
          `يوجد ${metrics.blockedTasks.length} مهمة لا تستطيع التقدم حالياً.`,
          metrics.blockedTasks.length >= 3 ? "high" : "medium",
          metrics.blockedTasks.length,
          "تحديد العائق والجهة المسؤولة عن حله."
        )
      );
    }

    if (metrics.incompleteCriticalTasks.length) {
      findings.push(
        createFinding(
          "مهام حرجة غير مكتملة",
          `يوجد ${metrics.incompleteCriticalTasks.length} مهمة حرجة غير منجزة.`,
          metrics.incompleteCriticalTasks.length >= 3
            ? "high"
            : "medium",
          metrics.incompleteCriticalTasks.length,
          "رفع أولوية المهام الحرجة."
        )
      );
    }

    if (metrics.progress.overdue > 0) {
      findings.push(
        createFinding(
          "مهام متأخرة",
          `يوجد ${metrics.progress.overdue} مهمة تجاوزت موعدها.`,
          metrics.progress.overdue >= 3 ? "high" : "medium",
          metrics.progress.overdue,
          "إعادة الجدولة وتحديد التزام جديد."
        )
      );
    }

    if (metrics.schedule.status === "delayed") {
      findings.push(
        createFinding(
          "تأخير زمني واضح",
          metrics.schedule.summary,
          "high",
          metrics.schedule.variance,
          "مراجعة نطاق وجدول المشروع."
        )
      );
    }

    if (metrics.readiness.score < 50) {
      findings.push(
        createFinding(
          "جاهزية منخفضة",
          `جاهزية التنفيذ الحالية ${metrics.readiness.score}%.`,
          metrics.readiness.score < 30 ? "high" : "medium",
          metrics.readiness.score,
          "إغلاق متطلبات الجاهزية."
        )
      );
    }

    if (metrics.dataCompleteness < 65) {
      findings.push(
        createFinding(
          "بيانات غير مكتملة",
          `اكتمال بيانات المشروع ${metrics.dataCompleteness}%.`,
          metrics.dataCompleteness < 40 ? "high" : "medium",
          metrics.dataCompleteness,
          "استكمال البيانات الأساسية."
        )
      );
    }

    if (
      metrics.progress.score >= 80 &&
      metrics.readiness.score >= 70 &&
      metrics.schedule.status !== "delayed"
    ) {
      findings.push(
        createFinding(
          "جاهز للتقدم",
          "المؤشرات الحالية تدعم الانتقال المنضبط إلى المرحلة التالية.",
          "positive",
          round(
            (metrics.progress.score + metrics.readiness.score) / 2
          ),
          "إجراء مراجعة انتقال المرحلة."
        )
      );
    }

    return findings;
  }

  function buildRecommendations(metrics, result) {
    const recommendations = [];

    for (const action of result.nextBestActions) {
      recommendations.push(
        createRecommendation(
          action.primary
            ? "الإجراء التنفيذي الأول"
            : `إجراء رقم ${action.rank}`,
          action.action,
          action.rank === 1
            ? result.interventionLevel === "immediate"
              ? "critical"
              : "high"
            : action.rank === 2
            ? "medium"
            : "low",
          action.reason,
          action.category === "ownership"
            ? "رفع المساءلة وسرعة القرار."
            : action.category === "schedule"
            ? "تحسين الالتزام الزمني."
            : action.category === "readiness"
            ? "تقليل مخاطر التنفيذ المبكر."
            : action.category === "data"
            ? "رفع دقة التحليل والتوصيات."
            : "تحسين استقرار التنفيذ."
        )
      );
    }

    return recommendations;
  }

  function calculateConfidence(metrics) {
    const evidence = [
      metrics.progress.source !== "none",
      metrics.readiness.source !== "none",
      Boolean(metrics.owner),
      Boolean(metrics.phase),
      Boolean(metrics.priority),
      metrics.dataCompleteness >= 60,
      Boolean(metrics.schedule.plannedProgress !== null),
      metrics.tasks.length > 0
    ];

    const available = evidence.filter(Boolean).length;

    return clamp(
      round(45 + (available / evidence.length) * 50)
    );
  }

  function analyzeProject(project, context) {
    const tasks = getTasks(project);
    const progress = getProgress(project);
    const readiness = getReadiness(project);
    const dataCompleteness = getDataCompleteness(project);
    const status = normalizeStatus(project?.status);
    const owner = getOwner(project);
    const department = getDepartment(project);
    const phase = getPhase(project);
    const priority = getPriority(project);
    const schedule = getScheduleSignal(project, progress);
    const blockedTasks = getBlockedTasks(tasks);
    const criticalTasks = getCriticalTasks(tasks);
    const incompleteCriticalTasks = getIncompleteCriticalTasks(tasks);

    const metrics = {
      tasks,
      progress,
      readiness,
      dataCompleteness,
      status,
      owner,
      department,
      phase,
      priority,
      schedule,
      blockedTasks,
      criticalTasks,
      incompleteCriticalTasks
    };

    const drivers = [
      buildDriver(
        "delivery",
        "التنفيذ",
        progress.score,
        0.24,
        `التقدم التنفيذي الحالي ${progress.score}%.`,
        progress
      ),
      buildDriver(
        "readiness",
        "الجاهزية",
        readiness.score,
        0.20,
        `جاهزية التنفيذ الحالية ${readiness.score}%.`,
        readiness
      ),
      buildDriver(
        "schedule",
        "الالتزام الزمني",
        schedule.score,
        0.17,
        schedule.summary,
        schedule
      ),
      buildDriver(
        "data",
        "اكتمال البيانات",
        dataCompleteness,
        0.12,
        `اكتمال البيانات الحالية ${dataCompleteness}%.`,
        dataCompleteness
      ),
      buildDriver(
        "ownership",
        "وضوح الملكية",
        scoreOwnerCoverage(owner),
        0.10,
        owner
          ? `المالك الحالي ${owner}.`
          : "لا يوجد مالك واضح.",
        owner
      ),
      buildDriver(
        "phase",
        "وضوح المرحلة",
        scorePhaseClarity(phase),
        0.07,
        phase
          ? `المرحلة الحالية ${phase}.`
          : "المرحلة الحالية غير محددة.",
        phase
      ),
      buildDriver(
        "priority",
        "وضوح الأولوية",
        scorePriorityClarity(priority),
        0.05,
        priority
          ? `الأولوية الحالية ${priority}.`
          : "الأولوية غير محددة.",
        priority
      ),
      buildDriver(
        "blockers",
        "العوائق",
        Math.max(
          0,
          100 -
            blockedTasks.length * 25 -
            progress.overdue * 12 -
            incompleteCriticalTasks.length * 8
        ),
        0.05,
        `العوائق: ${blockedTasks.length}، المتأخرة: ${progress.overdue}، الحرجة غير المكتملة: ${incompleteCriticalTasks.length}.`,
        {
          blocked: blockedTasks.length,
          overdue: progress.overdue,
          incompleteCritical: incompleteCriticalTasks.length
        }
      )
    ];

    let advisorScore = weightedAverage(drivers);

    if (status === "completed") {
      advisorScore = Math.max(advisorScore, 90);
    }

    if (status === "paused") {
      advisorScore -= 12;
    }

    if (status === "cancelled") {
      advisorScore = 5;
    }

    advisorScore = clamp(advisorScore);

    const healthLevel = getHealthLevel(advisorScore);
    const interventionLevel = getInterventionLevel(
      advisorScore,
      status,
      blockedTasks.length,
      progress.overdue
    );

    const primaryConcern = choosePrimaryConcern(metrics);
    const strongestPoint = chooseStrongestPoint(drivers);
    const nextBestActions = buildNextBestActions(
      metrics,
      primaryConcern
    );

    const result = {
      id: getProjectId(project),
      title: safeText(
        project?.title ||
        project?.name,
        "مشروع بدون اسم"
      ),
      analyzer: ANALYZER_NAME,
      version: VERSION,
      generatedAt: new Date().toISOString(),

      advisorScore,
      healthLevel,
      healthLabel: getHealthLabel(healthLevel),
      interventionLevel,
      interventionLabel: getUrgencyLabel(interventionLevel),
      confidence: calculateConfidence(metrics),

      status,
      statusLabel: getStatusArabic(status),
      owner: owner || null,
      department: department || null,
      phase: phase || null,
      priority: priority || null,

      primaryConcern,
      strongestPoint: {
        key: strongestPoint.key,
        title: strongestPoint.label,
        score: strongestPoint.score,
        explanation: strongestPoint.explanation
      },

      nextBestActions,
      drivers,
      metrics: {
        progress,
        readiness,
        dataCompleteness,
        schedule,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(isCompleted).length,
        blockedTasks: blockedTasks.length,
        overdueTasks: progress.overdue,
        criticalTasks: criticalTasks.length,
        incompleteCriticalTasks:
          incompleteCriticalTasks.length
      }
    };

    result.executiveSummary = buildExecutiveSummary(
      project,
      result
    );

    result.managementMessage = buildManagementMessage(result);
    result.findings = buildFindings(metrics, result);
    result.recommendations = buildRecommendations(metrics, result);

    result.decisionSupport = {
      canContinue:
        status !== "cancelled" &&
        advisorScore >= 45 &&
        blockedTasks.length < 3,
      canAdvancePhase:
        progress.score >= 75 &&
        readiness.score >= 70 &&
        blockedTasks.length === 0 &&
        incompleteCriticalTasks.length === 0,
      needsExecutiveReview:
        interventionLevel === "immediate" ||
        interventionLevel === "high",
      needsRecoveryPlan:
        schedule.status === "delayed" ||
        status === "paused" ||
        advisorScore < 45,
      suggestedDecision:
        status === "completed"
          ? "إغلاق المشروع وتوثيق الدروس المستفادة."
          : status === "cancelled"
          ? "توثيق قرار الإلغاء وإغلاق الالتزامات."
          : interventionLevel === "immediate"
          ? "تجميد الانتقال للمرحلة التالية وبدء خطة تصحيح فورية."
          : interventionLevel === "high"
          ? "الاستمرار المشروط بخطة معالجة قصيرة المدى."
          : progress.score >= 75 &&
            readiness.score >= 70 &&
            blockedTasks.length === 0
          ? "الموافقة على مراجعة الانتقال للمرحلة التالية."
          : "الاستمرار مع متابعة أسبوعية للإجراءات المقترحة."
    };

    state.generated += 1;
    state.lastRunAt = result.generatedAt;

    return result;
  }

  function getAdvice(projectId) {
    const core = getCore();

    if (!core || typeof core.getAnalysis !== "function") {
      return null;
    }

    const analysis = core.getAnalysis("project", projectId);

    return (
      analysis?.extensions?.[ANALYZER_NAME] ||
      analysis?.extensions?.projectAdvisor ||
      null
    );
  }

  async function refreshProject(projectId) {
    const core = requireCore();

    return core.analyzeProject(projectId, {
      force: true
    });
  }

  async function refreshAll() {
    const core = requireCore();

    return core.refreshAll({
      force: true
    });
  }

  function getStatus() {
    return {
      name: "Project AI Advisor",
      version: VERSION,
      initialized: state.initialized,
      generated: state.generated,
      lastRunAt: state.lastRunAt,
      analyzerName: ANALYZER_NAME
    };
  }

  function init() {
    if (state.initialized) {
      return AIW.ProjectAIAdvisor;
    }

    const core = requireCore();

    state.unregister = core.registerAnalyzer(
      "project",
      ANALYZER_NAME,
      analyzeProject,
      {
        version: VERSION,
        priority: 20
      }
    );

    state.initialized = true;

    core.emit?.("advisor:ready", {
      name: ANALYZER_NAME,
      version: VERSION,
      initializedAt: new Date().toISOString()
    });

    global.dispatchEvent?.(
      new CustomEvent("aiw:project-ai-advisor:ready", {
        detail: {
          name: ANALYZER_NAME,
          version: VERSION
        }
      })
    );

    core.refreshAll?.({
      force: true
    }).catch((error) => {
      console.error(
        "[AIW.ProjectAIAdvisor] Initial refresh failed.",
        error
      );
    });

    return AIW.ProjectAIAdvisor;
  }

  function destroy() {
    if (typeof state.unregister === "function") {
      state.unregister();
    }

    state.unregister = null;
    state.initialized = false;
  }

  AIW.ProjectAIAdvisor = {
    version: VERSION,
    analyzerName: ANALYZER_NAME,

    init,
    destroy,
    getStatus,

    analyzeProject,
    getAdvice,
    refreshProject,
    refreshAll
  };

  AIW.Engines = AIW.Engines || {};
  AIW.Engines.projectAIAdvisor = AIW.ProjectAIAdvisor;

  function autoInit() {
    try {
      init();
    } catch (error) {
      console.error(
        "[AIW.ProjectAIAdvisor] Auto initialization failed.",
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
