/* =========================================================
   AI Work - Executive Insights V1.0
   Enterprise Biometric Intelligence Platform

   File Path:
   js/extensions/ai/executive-insights.js

   Depends on:
   - js/extensions/ai/ai-intelligence-core.js
   - project-ai-advisor.js
   - project-risk-intelligence.js
   - idea-ai-scoring.js
   - similarity-intelligence.js

   Purpose:
   - Generates portfolio-wide executive intelligence
   - Identifies intervention priorities and opportunities
   - Summarizes projects, ideas, risks, duplication, and readiness
   - Produces decision-ready highlights and recommendations
   - Works as an independent portfolio analyzer extension
   - Does not modify dashboard.js or the current UI design
========================================================= */

(function bootstrapExecutiveInsights(global) {
  "use strict";

  global.AIW = global.AIW || {};

  const AIW = global.AIW;
  const VERSION = "1.0.0";
  const ANALYZER_NAME = "executive-insights";

  const runtime = {
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
        "AI Intelligence Core is required before Executive Insights."
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

  function average(values) {
    const valid = asArray(values)
      .map(Number)
      .filter(Number.isFinite);

    if (!valid.length) return 0;

    return round(
      valid.reduce((sum, value) => sum + value, 0) / valid.length
    );
  }

  function entityId(entity, prefix) {
    const core = getCore();

    if (core?.utils?.entityId) {
      return core.utils.entityId(entity, prefix);
    }

    return String(
      entity?.id ??
      entity?._id ??
      entity?.title ??
      entity?.name ??
      `${prefix}_${Math.random().toString(36).slice(2, 8)}`
    );
  }

  function normalizeStatus(value) {
    const core = getCore();

    if (core?.utils?.normalizeStatus) {
      return core.utils.normalizeStatus(value);
    }

    return safeText(value).toLowerCase() || "unknown";
  }

  function getProjectAnalysis(project) {
    const core = getCore();

    return core?.getAnalysis?.(
      "project",
      entityId(project, "project")
    ) || null;
  }

  function getIdeaAnalysis(idea) {
    const core = getCore();

    return core?.getAnalysis?.(
      "idea",
      entityId(idea, "idea")
    ) || null;
  }

  function getExtension(analysis, name) {
    return analysis?.extensions?.[name] || null;
  }

  function getAdvisor(project) {
    return getExtension(
      getProjectAnalysis(project),
      "project-ai-advisor"
    );
  }

  function getRisk(project) {
    return getExtension(
      getProjectAnalysis(project),
      "project-risk-intelligence"
    );
  }

  function getProjectSimilarity(project) {
    return getExtension(
      getProjectAnalysis(project),
      "similarity-intelligence-project"
    );
  }

  function getIdeaScore(idea) {
    return getExtension(
      getIdeaAnalysis(idea),
      "idea-ai-scoring"
    );
  }

  function getIdeaSimilarity(idea) {
    return getExtension(
      getIdeaAnalysis(idea),
      "similarity-intelligence-idea"
    );
  }

  function buildItem(type, title, message, options = {}) {
    return {
      id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      severity: options.severity || "info",
      priority: options.priority || "medium",
      title,
      message,
      metric: options.metric ?? null,
      entityType: options.entityType || null,
      entityId: options.entityId || null,
      entityTitle: options.entityTitle || null,
      action: options.action || "",
      reason: options.reason || ""
    };
  }

  function buildRecommendation(title, action, options = {}) {
    const core = getCore();

    if (core?.utils?.buildRecommendation) {
      return core.utils.buildRecommendation(
        title,
        action,
        {
          priority: options.priority || "medium",
          reason: options.reason || "",
          expectedImpact: options.expectedImpact || "",
          source: ANALYZER_NAME
        }
      );
    }

    return {
      title,
      action,
      priority: options.priority || "medium",
      reason: options.reason || "",
      expectedImpact: options.expectedImpact || "",
      source: ANALYZER_NAME
    };
  }

  function groupByDepartment(entities, scoreResolver) {
    const departments = {};

    for (const entity of entities) {
      const department = safeText(
        entity?.department ||
        entity?.businessUnit ||
        entity?.sector ||
        "غير محدد"
      );

      departments[department] = departments[department] || {
        department,
        count: 0,
        scores: []
      };

      departments[department].count += 1;

      const score = scoreResolver(entity);
      if (Number.isFinite(Number(score))) {
        departments[department].scores.push(Number(score));
      }
    }

    return Object.values(departments)
      .map((item) => ({
        department: item.department,
        count: item.count,
        averageScore: average(item.scores)
      }))
      .sort((first, second) => second.averageScore - first.averageScore);
  }

  function topProjects(projects, resolver, limit = 5, direction = "desc") {
    return projects
      .map((project) => ({
        id: entityId(project, "project"),
        title: safeText(project?.title || project?.name, "مشروع بدون اسم"),
        department: safeText(
          project?.department || project?.businessUnit || project?.sector
        ) || null,
        value: Number(resolver(project) || 0),
        status: normalizeStatus(project?.status)
      }))
      .sort((first, second) =>
        direction === "asc"
          ? first.value - second.value
          : second.value - first.value
      )
      .slice(0, limit);
  }

  function topIdeas(ideas, resolver, limit = 5, direction = "desc") {
    return ideas
      .map((idea) => ({
        id: entityId(idea, "idea"),
        title: safeText(idea?.title || idea?.name, "فكرة بدون اسم"),
        department: safeText(
          idea?.department || idea?.businessUnit || idea?.sector
        ) || null,
        value: Number(resolver(idea) || 0),
        status: normalizeStatus(idea?.status)
      }))
      .sort((first, second) =>
        direction === "asc"
          ? first.value - second.value
          : second.value - first.value
      )
      .slice(0, limit);
  }

  function collectProjectMetrics(projects) {
    return projects.map((project) => {
      const advisor = getAdvisor(project);
      const risk = getRisk(project);
      const similarity = getProjectSimilarity(project);

      return {
        project,
        id: entityId(project, "project"),
        title: safeText(project?.title || project?.name, "مشروع بدون اسم"),
        status: normalizeStatus(project?.status),
        department: safeText(
          project?.department || project?.businessUnit || project?.sector
        ) || "غير محدد",
        healthScore: advisor?.advisorScore ?? 0,
        confidence: advisor?.confidence ?? 0,
        interventionLevel: advisor?.interventionLevel ?? "medium",
        riskScore: risk?.riskScore ?? 0,
        riskLevel: risk?.riskLevel ?? "low",
        delayProbability: risk?.delayProbability ?? 0,
        blockedTasks: risk?.signals?.taskExecution?.blockedTasks ?? 0,
        overdueTasks: risk?.signals?.taskExecution?.overdueTasks ?? 0,
        progress: risk?.signals?.taskExecution?.progress?.score ??
          advisor?.metrics?.progress?.score ??
          0,
        readiness: risk?.signals?.readiness?.readiness?.score ??
          advisor?.metrics?.readiness?.score ??
          0,
        duplicateRisk: similarity?.duplicateRisk ?? 0,
        topMatch: similarity?.topMatch ?? null,
        needsExecutiveReview:
          advisor?.decisionSupport?.needsExecutiveReview === true ||
          risk?.decisionSupport?.needsExecutiveEscalation === true
      };
    });
  }

  function collectIdeaMetrics(ideas) {
    return ideas.map((idea) => {
      const scoring = getIdeaScore(idea);
      const similarity = getIdeaSimilarity(idea);

      return {
        idea,
        id: entityId(idea, "idea"),
        title: safeText(idea?.title || idea?.name, "فكرة بدون اسم"),
        status: normalizeStatus(idea?.status),
        department: safeText(
          idea?.department || idea?.businessUnit || idea?.sector
        ) || "غير محدد",
        overallScore: scoring?.overallScore ?? 0,
        executivePriority: scoring?.executivePriority ?? 0,
        priorityBand: scoring?.priorityBand ?? "P4",
        readiness: scoring?.dataReadiness ?? 0,
        feasibility: scoring?.feasibility ?? 0,
        riskScore: scoring?.riskScore ?? 0,
        recommendation: scoring?.recommendation ?? "study",
        uniquenessScore: similarity?.uniquenessScore ?? 100,
        duplicateRisk: similarity?.duplicateRisk ?? 0,
        duplicateDetected: similarity?.duplicateDetected === true,
        topMatch: similarity?.topMatch ?? null
      };
    });
  }

  function calculatePortfolioHealth(projectMetrics, ideaMetrics) {
    const projectHealth = average(
      projectMetrics.map((item) => item.healthScore)
    );
    const projectRiskControl = projectMetrics.length
      ? 100 - average(projectMetrics.map((item) => item.riskScore))
      : 100;
    const ideaQuality = average(
      ideaMetrics.map((item) => item.overallScore)
    );
    const ideaUniqueness = average(
      ideaMetrics.map((item) => item.uniquenessScore)
    );

    return clamp(
      round(
        projectHealth * 0.45 +
        projectRiskControl * 0.25 +
        ideaQuality * 0.20 +
        ideaUniqueness * 0.10
      )
    );
  }

  function buildHighlights(projectMetrics, ideaMetrics, portfolioHealth) {
    const highlights = [];

    const highRiskProjects = projectMetrics.filter(
      (item) => ["high", "critical"].includes(item.riskLevel)
    );

    const executiveReview = projectMetrics.filter(
      (item) => item.needsExecutiveReview
    );

    const delayedProjects = projectMetrics.filter(
      (item) => item.delayProbability >= 65
    );

    const nearlyComplete = projectMetrics.filter(
      (item) => item.progress >= 80 && item.progress < 100
    );

    const priorityIdeas = ideaMetrics.filter(
      (item) =>
        item.executivePriority >= 75 &&
        ["approve", "pilot"].includes(item.recommendation)
    );

    const duplicateIdeas = ideaMetrics.filter(
      (item) => item.duplicateDetected || item.duplicateRisk >= 78
    );

    if (highRiskProjects.length) {
      highlights.push(
        buildItem(
          "risk",
          "مشاريع عالية المخاطر",
          `يوجد ${highRiskProjects.length} مشروع بمستوى مخاطر مرتفع أو حرج.`,
          {
            severity: highRiskProjects.length >= 3 ? "high" : "medium",
            priority: "high",
            metric: highRiskProjects.length,
            action: "مراجعة المشاريع الأعلى خطورة فوراً."
          }
        )
      );
    }

    if (executiveReview.length) {
      highlights.push(
        buildItem(
          "intervention",
          "مشاريع تحتاج تدخلاً تنفيذياً",
          `يوجد ${executiveReview.length} مشروع يحتاج مراجعة أو تصعيداً تنفيذياً.`,
          {
            severity: "high",
            priority: "high",
            metric: executiveReview.length,
            action: "تحديد قرارات تصحيحية وملاك واضحين."
          }
        )
      );
    }

    if (delayedProjects.length) {
      highlights.push(
        buildItem(
          "delay",
          "احتمالية تأخير مرتفعة",
          `يوجد ${delayedProjects.length} مشروع باحتمالية تأخير 65% أو أكثر.`,
          {
            severity: "medium",
            priority: "high",
            metric: delayedProjects.length,
            action: "مراجعة الجداول والعوائق والتبعيات."
          }
        )
      );
    }

    if (nearlyComplete.length) {
      highlights.push(
        buildItem(
          "opportunity",
          "مشاريع قريبة من الإنجاز",
          `يوجد ${nearlyComplete.length} مشروع تجاوز 80% ويمكن تسريع إغلاقه.`,
          {
            severity: "positive",
            priority: "medium",
            metric: nearlyComplete.length,
            action: "إغلاق المهام النهائية وتوثيق النتائج."
          }
        )
      );
    }

    if (priorityIdeas.length) {
      highlights.push(
        buildItem(
          "idea-opportunity",
          "أفكار عالية الأولوية",
          `يوجد ${priorityIdeas.length} فكرة مناسبة للاعتماد أو Pilot.`,
          {
            severity: "positive",
            priority: "medium",
            metric: priorityIdeas.length,
            action: "رفعها للمراجعة التنفيذية."
          }
        )
      );
    }

    if (duplicateIdeas.length) {
      highlights.push(
        buildItem(
          "duplication",
          "أفكار متكررة أو شديدة التشابه",
          `يوجد ${duplicateIdeas.length} فكرة تحتاج مراجعة دمج أو إعادة استخدام.`,
          {
            severity: "medium",
            priority: "medium",
            metric: duplicateIdeas.length,
            action: "تنظيف محفظة الأفكار قبل إنشاء مشاريع جديدة."
          }
        )
      );
    }

    if (!highlights.length) {
      highlights.push(
        buildItem(
          "stable",
          "المحفظة مستقرة",
          `صحة المحفظة الحالية ${portfolioHealth}%. لا توجد مؤشرات حرجة.`,
          {
            severity: "positive",
            priority: "low",
            metric: portfolioHealth,
            action: "الاستمرار بالمراقبة الدورية."
          }
        )
      );
    }

    return highlights;
  }

  function buildInterventionQueue(projectMetrics) {
    return projectMetrics
      .filter((item) =>
        item.needsExecutiveReview ||
        item.riskScore >= 60 ||
        item.delayProbability >= 65 ||
        item.blockedTasks > 0
      )
      .map((item) => {
        let priorityScore = 0;

        priorityScore += item.riskScore * 0.35;
        priorityScore += item.delayProbability * 0.25;
        priorityScore += (100 - item.healthScore) * 0.20;
        priorityScore += Math.min(100, item.blockedTasks * 25) * 0.10;
        priorityScore += Math.min(100, item.overdueTasks * 15) * 0.10;

        return {
          id: item.id,
          title: item.title,
          department: item.department,
          priorityScore: round(priorityScore),
          riskScore: item.riskScore,
          healthScore: item.healthScore,
          delayProbability: item.delayProbability,
          blockedTasks: item.blockedTasks,
          overdueTasks: item.overdueTasks,
          recommendedAction:
            item.riskScore >= 80
              ? "خطة معالجة فورية وتصعيد تنفيذي."
              : item.delayProbability >= 70
              ? "إعادة ضبط الجدول والعوائق."
              : item.blockedTasks > 0
              ? "فك العوائق وتحديد الملاك."
              : "مراجعة إدارية قصيرة المدى."
        };
      })
      .sort((first, second) => second.priorityScore - first.priorityScore);
  }

  function buildOpportunityQueue(projectMetrics, ideaMetrics) {
    const opportunities = [];

    for (const project of projectMetrics) {
      if (
        project.progress >= 80 &&
        project.progress < 100 &&
        project.riskScore < 50
      ) {
        opportunities.push({
          type: "project-completion",
          id: project.id,
          title: project.title,
          score: round(
            project.progress * 0.65 +
            (100 - project.riskScore) * 0.35
          ),
          message: "فرصة لتسريع إغلاق المشروع وتحقيق قيمة مبكرة."
        });
      }

      if (
        project.readiness >= 75 &&
        project.healthScore >= 70 &&
        project.riskScore < 45
      ) {
        opportunities.push({
          type: "phase-advance",
          id: project.id,
          title: project.title,
          score: round(
            project.readiness * 0.50 +
            project.healthScore * 0.30 +
            (100 - project.riskScore) * 0.20
          ),
          message: "المشروع مناسب لمراجعة الانتقال للمرحلة التالية."
        });
      }
    }

    for (const idea of ideaMetrics) {
      if (
        idea.executivePriority >= 75 &&
        ["approve", "pilot"].includes(idea.recommendation) &&
        idea.duplicateRisk < 70
      ) {
        opportunities.push({
          type: "idea-activation",
          id: idea.id,
          title: idea.title,
          score: idea.executivePriority,
          message:
            idea.recommendation === "approve"
              ? "الفكرة مناسبة للتحويل إلى مشروع."
              : "الفكرة مناسبة لتجربة محدودة."
        });
      }
    }

    return opportunities
      .sort((first, second) => second.score - first.score)
      .slice(0, 10);
  }

  function buildDepartmentInsights(projectMetrics, ideaMetrics) {
    const projectDepartments = groupByDepartment(
      projectMetrics.map((item) => item.project),
      (project) => getAdvisor(project)?.advisorScore ?? 0
    );

    const ideaDepartments = groupByDepartment(
      ideaMetrics.map((item) => item.idea),
      (idea) => getIdeaScore(idea)?.overallScore ?? 0
    );

    const map = new Map();

    for (const item of projectDepartments) {
      map.set(item.department, {
        department: item.department,
        projects: item.count,
        projectHealth: item.averageScore,
        ideas: 0,
        ideaQuality: 0
      });
    }

    for (const item of ideaDepartments) {
      const current = map.get(item.department) || {
        department: item.department,
        projects: 0,
        projectHealth: 0,
        ideas: 0,
        ideaQuality: 0
      };

      current.ideas = item.count;
      current.ideaQuality = item.averageScore;
      map.set(item.department, current);
    }

    return [...map.values()]
      .map((item) => ({
        ...item,
        overallScore: round(
          item.projectHealth * 0.65 +
          item.ideaQuality * 0.35
        )
      }))
      .sort((first, second) => second.overallScore - first.overallScore);
  }

  function buildRecommendations(
    projectMetrics,
    ideaMetrics,
    interventionQueue,
    opportunityQueue
  ) {
    const recommendations = [];

    if (interventionQueue.length) {
      recommendations.push(
        buildRecommendation(
          "مراجعة محفظة المشاريع الحرجة",
          "راجع أعلى خمسة مشاريع في قائمة التدخل وحدد قراراً ومالكاً وموعداً لكل إجراء.",
          {
            priority: "high",
            reason: `${interventionQueue.length} مشروع يحتاج تدخلاً.`,
            expectedImpact: "خفض المخاطر وتحسين الالتزام التنفيذي."
          }
        )
      );
    }

    const duplicateIdeas = ideaMetrics.filter(
      (item) => item.duplicateRisk >= 78
    );

    if (duplicateIdeas.length) {
      recommendations.push(
        buildRecommendation(
          "تنظيف محفظة الأفكار",
          "ادمج أو اربط الأفكار الأعلى تشابهاً قبل الموافقة على مشاريع جديدة.",
          {
            priority: "high",
            reason: `${duplicateIdeas.length} فكرة ذات خطر تكرار مرتفع.`,
            expectedImpact: "تقليل ازدواجية العمل والميزانية."
          }
        )
      );
    }

    const lowReadinessProjects = projectMetrics.filter(
      (item) => item.readiness < 50
    );

    if (lowReadinessProjects.length) {
      recommendations.push(
        buildRecommendation(
          "رفع جاهزية التنفيذ",
          "ركز على إغلاق متطلبات البيانات والتكامل والملكية للمشاريع منخفضة الجاهزية.",
          {
            priority: "medium",
            reason: `${lowReadinessProjects.length} مشروع جاهزيته أقل من 50%.`,
            expectedImpact: "تقليل التعثر وإعادة العمل."
          }
        )
      );
    }

    if (opportunityQueue.length) {
      recommendations.push(
        buildRecommendation(
          "تفعيل الفرص السريعة",
          "اعتمد قائمة الفرص الأعلى لتسريع إغلاق المشاريع أو بدء Pilots للأفكار الجاهزة.",
          {
            priority: "medium",
            reason: `${opportunityQueue.length} فرصة ذات قيمة تنفيذية.`,
            expectedImpact: "تحقيق نتائج مبكرة وإظهار أثر المنصة."
          }
        )
      );
    }

    if (!recommendations.length) {
      recommendations.push(
        buildRecommendation(
          "استمرار الحوكمة الدورية",
          "استمر بالمراجعة الأسبوعية للمشاريع والأفكار والمخاطر.",
          {
            priority: "low",
            reason: "المحفظة الحالية مستقرة.",
            expectedImpact: "الحفاظ على الاستقرار وجودة القرار."
          }
        )
      );
    }

    return recommendations;
  }

  function buildExecutiveNarrative(
    portfolioHealth,
    projectMetrics,
    ideaMetrics,
    interventionQueue,
    opportunityQueue
  ) {
    const highRisk = projectMetrics.filter(
      (item) => ["high", "critical"].includes(item.riskLevel)
    ).length;

    const approvedIdeas = ideaMetrics.filter(
      (item) => item.recommendation === "approve"
    ).length;

    return `صحة المحفظة الحالية ${portfolioHealth}%. يوجد ${projectMetrics.length} مشروع و${ideaMetrics.length} فكرة قيد التحليل. ${highRisk} مشروع بمخاطر مرتفعة أو حرجة، و${interventionQueue.length} مشروع يحتاج تدخلاً إدارياً أو تنفيذياً. بالمقابل، توجد ${opportunityQueue.length} فرصة قابلة للتسريع و${approvedIdeas} فكرة مناسبة للاعتماد المباشر وفق البيانات الحالية.`;
  }

  function analyzePortfolio(_state, context) {
    const projectMetrics = collectProjectMetrics(context.projects);
    const ideaMetrics = collectIdeaMetrics(context.ideas);

    const portfolioHealth = calculatePortfolioHealth(
      projectMetrics,
      ideaMetrics
    );

    const interventionQueue = buildInterventionQueue(
      projectMetrics
    );

    const opportunityQueue = buildOpportunityQueue(
      projectMetrics,
      ideaMetrics
    );

    const departmentInsights = buildDepartmentInsights(
      projectMetrics,
      ideaMetrics
    );

    const highlights = buildHighlights(
      projectMetrics,
      ideaMetrics,
      portfolioHealth
    );

    const recommendations = buildRecommendations(
      projectMetrics,
      ideaMetrics,
      interventionQueue,
      opportunityQueue
    );

    const result = {
      id: "portfolio",
      analyzer: ANALYZER_NAME,
      version: VERSION,
      generatedAt: new Date().toISOString(),

      portfolioHealth,
      healthLevel:
        portfolioHealth >= 85
          ? "excellent"
          : portfolioHealth >= 70
          ? "good"
          : portfolioHealth >= 50
          ? "moderate"
          : portfolioHealth >= 30
          ? "weak"
          : "critical",

      confidence: clamp(
        round(
          45 +
          (projectMetrics.length ? 20 : 0) +
          (ideaMetrics.length ? 15 : 0) +
          Math.min(20, (projectMetrics.length + ideaMetrics.length) * 2)
        )
      ),

      totals: {
        projects: projectMetrics.length,
        ideas: ideaMetrics.length,
        activeProjects: projectMetrics.filter(
          (item) => item.status === "active"
        ).length,
        pausedProjects: projectMetrics.filter(
          (item) => item.status === "paused"
        ).length,
        completedProjects: projectMetrics.filter(
          (item) => item.status === "completed"
        ).length,
        highRiskProjects: projectMetrics.filter(
          (item) => ["high", "critical"].includes(item.riskLevel)
        ).length,
        executiveInterventions: interventionQueue.length,
        priorityIdeas: ideaMetrics.filter(
          (item) => item.executivePriority >= 75
        ).length,
        duplicateIdeas: ideaMetrics.filter(
          (item) => item.duplicateRisk >= 78
        ).length
      },

      averages: {
        projectHealth: average(
          projectMetrics.map((item) => item.healthScore)
        ),
        projectRisk: average(
          projectMetrics.map((item) => item.riskScore)
        ),
        projectReadiness: average(
          projectMetrics.map((item) => item.readiness)
        ),
        projectProgress: average(
          projectMetrics.map((item) => item.progress)
        ),
        ideaScore: average(
          ideaMetrics.map((item) => item.overallScore)
        ),
        ideaPriority: average(
          ideaMetrics.map((item) => item.executivePriority)
        ),
        ideaUniqueness: average(
          ideaMetrics.map((item) => item.uniquenessScore)
        )
      },

      rankings: {
        highestRiskProjects: topProjects(
          context.projects,
          (project) => getRisk(project)?.riskScore ?? 0,
          5,
          "desc"
        ),
        healthiestProjects: topProjects(
          context.projects,
          (project) => getAdvisor(project)?.advisorScore ?? 0,
          5,
          "desc"
        ),
        lowestReadinessProjects: topProjects(
          context.projects,
          (project) =>
            getAdvisor(project)?.metrics?.readiness?.score ?? 0,
          5,
          "asc"
        ),
        highestPriorityIdeas: topIdeas(
          context.ideas,
          (idea) => getIdeaScore(idea)?.executivePriority ?? 0,
          5,
          "desc"
        ),
        mostUniqueIdeas: topIdeas(
          context.ideas,
          (idea) => getIdeaSimilarity(idea)?.uniquenessScore ?? 0,
          5,
          "desc"
        )
      },

      highlights,
      interventionQueue,
      opportunityQueue,
      departmentInsights,
      recommendations
    };

    result.executiveNarrative = buildExecutiveNarrative(
      portfolioHealth,
      projectMetrics,
      ideaMetrics,
      interventionQueue,
      opportunityQueue
    );

    result.findings = highlights.map((item) => ({
      type: "executive-insight",
      severity: item.severity,
      title: item.title,
      message: item.message,
      metric: item.metric,
      action: item.action
    }));

    result.decisionSupport = {
      needsExecutiveMeeting:
        interventionQueue.some(
          (item) => item.priorityScore >= 75
        ),
      shouldFreezeNewProjects:
        result.totals.highRiskProjects >= 5 ||
        result.averages.projectRisk >= 70,
      shouldPrioritizeCompletion:
        opportunityQueue.some(
          (item) => item.type === "project-completion"
        ),
      shouldActivateIdeas:
        opportunityQueue.some(
          (item) => item.type === "idea-activation"
        ),
      suggestedDecision:
        interventionQueue.length
          ? "ابدأ بمراجعة المشاريع الأعلى أولوية في قائمة التدخل قبل توسيع المحفظة."
          : opportunityQueue.length
          ? "ركز على الفرص السريعة لإظهار نتائج تنفيذية مبكرة."
          : "استمر بالحوكمة والمراقبة الدورية."
    };

    runtime.generated += 1;
    runtime.lastRunAt = result.generatedAt;

    return result;
  }

  function getInsights() {
    const core = getCore();

    const analysis = core?.getAnalysis?.(
      "portfolio",
      "portfolio"
    );

    return (
      analysis?.extensions?.[ANALYZER_NAME] ||
      null
    );
  }

  async function refresh() {
    const core = requireCore();

    return core.analyzePortfolio({
      force: true,
      includeEntities: true
    });
  }

  function getStatus() {
    return {
      name: "Executive Insights",
      version: VERSION,
      initialized: runtime.initialized,
      generated: runtime.generated,
      lastRunAt: runtime.lastRunAt,
      analyzerName: ANALYZER_NAME
    };
  }

  function init() {
    if (runtime.initialized) {
      return AIW.ExecutiveInsights;
    }

    const core = requireCore();

    runtime.unregister = core.registerAnalyzer(
      "portfolio",
      ANALYZER_NAME,
      analyzePortfolio,
      {
        version: VERSION,
        priority: 40
      }
    );

    runtime.initialized = true;

    core.emit?.("executive-insights:ready", {
      name: ANALYZER_NAME,
      version: VERSION,
      initializedAt: new Date().toISOString()
    });

    global.dispatchEvent?.(
      new CustomEvent(
        "aiw:executive-insights:ready",
        {
          detail: {
            name: ANALYZER_NAME,
            version: VERSION
          }
        }
      )
    );

    core.analyzePortfolio?.({
      force: true,
      includeEntities: true
    }).catch((error) => {
      console.error(
        "[AIW.ExecutiveInsights] Initial analysis failed.",
        error
      );
    });

    return AIW.ExecutiveInsights;
  }

  function destroy() {
    if (typeof runtime.unregister === "function") {
      runtime.unregister();
    }

    runtime.unregister = null;
    runtime.initialized = false;
  }

  AIW.ExecutiveInsights = {
    version: VERSION,
    analyzerName: ANALYZER_NAME,

    init,
    destroy,
    getStatus,

    analyzePortfolio,
    getInsights,
    refresh
  };

  AIW.Engines = AIW.Engines || {};
  AIW.Engines.executiveInsights =
    AIW.ExecutiveInsights;

  function autoInit() {
    try {
      init();
    } catch (error) {
      console.error(
        "[AIW.ExecutiveInsights] Auto initialization failed.",
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
