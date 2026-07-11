/* =========================================================
   AI Work - Idea AI Scoring V1.0
   Enterprise Biometric Intelligence Platform

   File Path:
   js/extensions/ai/idea-ai-scoring.js

   Depends on:
   - js/extensions/ai/ai-intelligence-core.js

   Purpose:
   - Scores ideas using explainable weighted intelligence
   - Calculates readiness, value, feasibility, risk, and priority
   - Produces approval guidance and next-best actions
   - Works as an independent registered AIW.AI analyzer
   - Does not modify ideas.js or the current UI design
========================================================= */

(function bootstrapIdeaAIScoring(global) {
  "use strict";

  global.AIW = global.AIW || {};

  const AIW = global.AIW;
  const VERSION = "1.0.0";
  const ANALYZER_NAME = "idea-ai-scoring";

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
        "AI Intelligence Core is required before Idea AI Scoring."
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

  function toNumber(value, fallback = 0) {
    const core = getCore();

    if (core?.utils?.toNumber) {
      return core.utils.toNumber(value, fallback);
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function normalizeText(value) {
    const core = getCore();

    if (core?.utils?.normalizeText) {
      return core.utils.normalizeText(value);
    }

    return safeText(value).toLowerCase();
  }

  function ideaId(idea) {
    const core = getCore();

    if (core?.utils?.entityId) {
      return core.utils.entityId(idea, "idea");
    }

    return String(
      idea?.id ??
      idea?._id ??
      idea?.ideaId ??
      idea?.title ??
      idea?.name ??
      "idea"
    );
  }

  function ideaDataCompleteness(idea) {
    const core = getCore();

    if (core?.utils?.ideaDataCompleteness) {
      return core.utils.ideaDataCompleteness(idea);
    }

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

    return round((completed / fields.length) * 100);
  }

  function mapLevel(value, map, fallback = 50) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return clamp(value);
    }

    const normalized = normalizeText(value).replace(/\s+/g, "");

    if (Object.prototype.hasOwnProperty.call(map, normalized)) {
      return map[normalized];
    }

    const numeric = toNumber(value, NaN);
    return Number.isFinite(numeric) ? clamp(numeric) : fallback;
  }

  function scoreImpact(idea) {
    return mapLevel(
      idea?.impactScore ??
      idea?.businessImpactScore ??
      idea?.operationalImpact ??
      idea?.impact,
      {
        transformational: 100,
        تحولي: 100,
        veryhigh: 95,
        high: 85,
        مرتفع: 85,
        عالي: 85,
        medium: 60,
        متوسط: 60,
        low: 35,
        منخفض: 35
      },
      60
    );
  }

  function scoreStrategicAlignment(idea) {
    return mapLevel(
      idea?.strategicAlignment ??
      idea?.alignmentScore ??
      idea?.strategyFit ??
      idea?.priority,
      {
        critical: 100,
        حرج: 100,
        veryhigh: 95,
        high: 85,
        مرتفع: 85,
        عالي: 85,
        medium: 60,
        متوسط: 60,
        low: 35,
        منخفض: 35
      },
      65
    );
  }

  function scoreDataReadiness(idea) {
    return mapLevel(
      idea?.dataReadiness ??
      idea?.dataAvailability ??
      idea?.aiReadiness ??
      idea?.readiness,
      {
        ready: 95,
        جاهز: 95,
        complete: 95,
        مكتمل: 95,
        high: 85,
        مرتفع: 85,
        available: 80,
        متوفر: 80,
        medium: 60,
        متوسط: 60,
        partial: 50,
        جزئي: 50,
        low: 30,
        منخفض: 30,
        unavailable: 10,
        غيرمتوفر: 10
      },
      55
    );
  }

  function scoreFeasibility(idea) {
    const explicit = idea?.feasibilityScore ?? idea?.feasibility;

    if (explicit !== undefined && explicit !== null) {
      return mapLevel(
        explicit,
        {
          veryhigh: 95,
          high: 85,
          مرتفع: 85,
          medium: 60,
          متوسط: 60,
          low: 35,
          منخفض: 35
        },
        60
      );
    }

    const complexity = scoreComplexity(idea);
    const integration = scoreIntegrationComplexity(idea);
    const skills = scoreSkillsReadiness(idea);

    return clamp(
      round(
        (100 - complexity) * 0.50 +
        (100 - integration) * 0.25 +
        skills * 0.25
      )
    );
  }

  function scoreComplexity(idea) {
    return mapLevel(
      idea?.complexityScore ??
      idea?.implementationComplexity ??
      idea?.complexity,
      {
        veryhigh: 95,
        شديد: 95,
        high: 80,
        مرتفع: 80,
        عالي: 80,
        medium: 55,
        متوسط: 55,
        low: 25,
        منخفض: 25,
        easy: 15,
        سهل: 15
      },
      50
    );
  }

  function scoreIntegrationComplexity(idea) {
    return mapLevel(
      idea?.integrationComplexity ??
      idea?.integrationRisk ??
      idea?.technicalComplexity,
      {
        veryhigh: 95,
        high: 80,
        مرتفع: 80,
        medium: 55,
        متوسط: 55,
        low: 25,
        منخفض: 25
      },
      50
    );
  }

  function scoreSkillsReadiness(idea) {
    return mapLevel(
      idea?.skillsReadiness ??
      idea?.teamReadiness ??
      idea?.resourceReadiness,
      {
        ready: 95,
        جاهز: 95,
        high: 85,
        مرتفع: 85,
        medium: 60,
        متوسط: 60,
        low: 30,
        منخفض: 30
      },
      55
    );
  }

  function scoreInnovation(idea) {
    return mapLevel(
      idea?.innovationScore ??
      idea?.innovation ??
      idea?.novelty ??
      idea?.uniqueness,
      {
        breakthrough: 100,
        disruptive: 95,
        تحولي: 95,
        high: 85,
        مرتفع: 85,
        medium: 60,
        متوسط: 60,
        low: 35,
        منخفض: 35
      },
      65
    );
  }

  function scoreUserValue(idea) {
    return mapLevel(
      idea?.userValue ??
      idea?.customerValue ??
      idea?.employeeValue ??
      idea?.serviceImpact,
      {
        veryhigh: 95,
        high: 85,
        مرتفع: 85,
        medium: 60,
        متوسط: 60,
        low: 35,
        منخفض: 35
      },
      60
    );
  }

  function scoreTimeToValue(idea) {
    const months = toNumber(
      idea?.durationMonths ??
      idea?.estimatedMonths ??
      idea?.timelineMonths,
      NaN
    );

    if (Number.isFinite(months)) {
      if (months <= 3) return 95;
      if (months <= 6) return 80;
      if (months <= 12) return 60;
      if (months <= 18) return 40;
      return 25;
    }

    return mapLevel(
      idea?.timeToValue ??
      idea?.duration ??
      idea?.timeline,
      {
        immediate: 100,
        سريع: 90,
        short: 85,
        قصير: 85,
        medium: 60,
        متوسط: 60,
        long: 35,
        طويل: 35
      },
      60
    );
  }

  function scoreRisk(idea) {
    return mapLevel(
      idea?.riskScore ??
      idea?.riskLevel ??
      idea?.risk,
      {
        critical: 100,
        حرج: 100,
        high: 80,
        مرتفع: 80,
        عالي: 80,
        medium: 55,
        متوسط: 55,
        low: 25,
        منخفض: 25
      },
      Math.max(
        20,
        round(
          scoreComplexity(idea) * 0.55 +
          (100 - scoreDataReadiness(idea)) * 0.45
        )
      )
    );
  }

  function scoreGovernanceReadiness(idea) {
    const fields = [
      idea?.owner || idea?.submittedBy,
      idea?.department || idea?.businessUnit,
      idea?.risk || idea?.riskLevel,
      idea?.dataOwner,
      idea?.approvalStatus || idea?.status
    ];

    const completed = fields.filter((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined && String(value).trim() !== "";
    }).length;

    return round((completed / fields.length) * 100);
  }

  function scoreReusePotential(idea) {
    return mapLevel(
      idea?.reusePotential ??
      idea?.scalability ??
      idea?.replicability,
      {
        veryhigh: 95,
        high: 85,
        مرتفع: 85,
        medium: 60,
        متوسط: 60,
        low: 35,
        منخفض: 35
      },
      60
    );
  }

  function buildDimension(
    key,
    label,
    score,
    weight,
    explanation,
    evidence = null,
    inverse = false
  ) {
    return {
      key,
      label,
      score: clamp(score),
      weight,
      explanation,
      evidence,
      inverse
    };
  }

  function weightedScore(dimensions) {
    const totalWeight = dimensions.reduce(
      (sum, dimension) => sum + Number(dimension.weight || 0),
      0
    );

    if (!totalWeight) return 0;

    return round(
      dimensions.reduce((sum, dimension) => {
        const effectiveScore = dimension.inverse
          ? 100 - clamp(dimension.score)
          : clamp(dimension.score);

        return sum + effectiveScore * Number(dimension.weight || 0);
      }, 0) / totalWeight
    );
  }

  function levelFromScore(score) {
    if (score >= 85) return "excellent";
    if (score >= 70) return "good";
    if (score >= 50) return "moderate";
    if (score >= 30) return "weak";
    return "critical";
  }

  function levelLabel(level) {
    const labels = {
      excellent: "ممتاز",
      good: "جيد",
      moderate: "متوسط",
      weak: "ضعيف",
      critical: "حرج"
    };

    return labels[level] || labels.moderate;
  }

  function priorityBand(score) {
    if (score >= 85) return "P1";
    if (score >= 70) return "P2";
    if (score >= 50) return "P3";
    return "P4";
  }

  function recommendationType(score, readiness, feasibility, risk) {
    if (score >= 80 && readiness >= 65 && feasibility >= 60 && risk <= 60) {
      return "approve";
    }

    if (score >= 65 && readiness >= 45 && feasibility >= 45) {
      return "pilot";
    }

    if (score >= 50) {
      return "study";
    }

    return "hold";
  }

  function recommendationLabel(type) {
    const labels = {
      approve: "اعتماد للتحويل إلى مشروع",
      pilot: "تنفيذ تجربة محدودة",
      study: "إجراء دراسة تفصيلية",
      hold: "تعليق مؤقت"
    };

    return labels[type] || labels.study;
  }

  function topStrengths(dimensions, limit = 3) {
    return [...dimensions]
      .filter((dimension) => !dimension.inverse)
      .sort((first, second) => second.score - first.score)
      .slice(0, limit)
      .map((dimension) => ({
        key: dimension.key,
        label: dimension.label,
        score: dimension.score,
        explanation: dimension.explanation
      }));
  }

  function topGaps(dimensions, limit = 4) {
    return [...dimensions]
      .map((dimension) => ({
        ...dimension,
        effectiveScore: dimension.inverse
          ? 100 - dimension.score
          : dimension.score
      }))
      .sort((first, second) => first.effectiveScore - second.effectiveScore)
      .slice(0, limit)
      .map((dimension) => ({
        key: dimension.key,
        label: dimension.label,
        score: dimension.effectiveScore,
        explanation: dimension.explanation
      }));
  }

  function createFinding(title, message, severity, metric = null, action = "") {
    const core = getCore();

    if (core?.utils?.buildFinding) {
      return core.utils.buildFinding(
        "idea-scoring",
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
      type: "idea-scoring",
      title,
      message,
      severity,
      metric,
      action
    };
  }

  function createRecommendation(title, action, priority, reason, expectedImpact) {
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

  function buildFindings(result) {
    const findings = [];

    findings.push(
      createFinding(
        "التقييم الذكي للفكرة",
        `حصلت الفكرة على ${result.overallScore}% بتصنيف ${result.scoreLabel}.`,
        result.overallScore >= 70
          ? "positive"
          : result.overallScore >= 50
          ? "medium"
          : "high",
        result.overallScore
      )
    );

    if (result.dataReadiness < 50) {
      findings.push(
        createFinding(
          "جاهزية البيانات منخفضة",
          `جاهزية البيانات الحالية ${result.dataReadiness}%.`,
          result.dataReadiness < 30 ? "high" : "medium",
          result.dataReadiness,
          "تحديد مصادر البيانات وملكيتها وجودتها."
        )
      );
    }

    if (result.feasibility < 50) {
      findings.push(
        createFinding(
          "قابلية التنفيذ تحتاج تحسين",
          `قابلية التنفيذ الحالية ${result.feasibility}%.`,
          "medium",
          result.feasibility,
          "تقليل النطاق أو تنفيذ Pilot."
        )
      );
    }

    if (result.riskScore >= 70) {
      findings.push(
        createFinding(
          "مخاطر مرتفعة",
          `مستوى المخاطر المقدر ${result.riskScore}%.`,
          "high",
          result.riskScore,
          "إعداد خطة مخاطر قبل الاعتماد."
        )
      );
    }

    if (result.strategicAlignment >= 80 && result.impact >= 80) {
      findings.push(
        createFinding(
          "فرصة استراتيجية عالية",
          "الفكرة تجمع بين مواءمة استراتيجية وأثر تشغيلي مرتفع.",
          "positive",
          round(
            (result.strategicAlignment + result.impact) / 2
          ),
          "تسريع المراجعة التنفيذية."
        )
      );
    }

    if (result.dataCompleteness < 70) {
      findings.push(
        createFinding(
          "بيانات الفكرة غير مكتملة",
          `اكتمال البيانات الحالية ${result.dataCompleteness}%.`,
          result.dataCompleteness < 45 ? "high" : "medium",
          result.dataCompleteness,
          "استكمال الحقول الأساسية قبل القرار النهائي."
        )
      );
    }

    return findings;
  }

  function buildNextActions(result) {
    const actions = [];

    if (result.dataReadiness < 60) {
      actions.push({
        priority: 1,
        category: "data",
        action: "تحديد مصادر البيانات والمالك وجودة البيانات المطلوبة.",
        reason: `جاهزية البيانات ${result.dataReadiness}%.`
      });
    }

    if (result.feasibility < 60) {
      actions.push({
        priority: 1,
        category: "feasibility",
        action: "تقليص النطاق وبناء تجربة محدودة لإثبات قابلية التنفيذ.",
        reason: `قابلية التنفيذ ${result.feasibility}%.`
      });
    }

    if (result.riskScore >= 60) {
      actions.push({
        priority: 1,
        category: "risk",
        action: "إعداد سجل مخاطر أولي وخطة تخفيف قبل الاعتماد.",
        reason: `مستوى المخاطر ${result.riskScore}%.`
      });
    }

    if (result.governanceReadiness < 60) {
      actions.push({
        priority: 2,
        category: "governance",
        action: "تحديد المالك والجهة والاعتماد ومسؤول البيانات.",
        reason: `جاهزية الحوكمة ${result.governanceReadiness}%.`
      });
    }

    if (result.timeToValue < 50) {
      actions.push({
        priority: 2,
        category: "delivery",
        action: "تقسيم الفكرة إلى مراحل قصيرة ذات قيمة مبكرة.",
        reason: `سرعة الوصول للقيمة ${result.timeToValue}%.`
      });
    }

    if (result.dataCompleteness < 75) {
      actions.push({
        priority: 2,
        category: "data-quality",
        action: "استكمال التحدي والحل والأثر والمدة والتعقيد والمخاطر.",
        reason: `اكتمال البيانات ${result.dataCompleteness}%.`
      });
    }

    if (!actions.length) {
      actions.push({
        priority: 3,
        category: "approval",
        action: "رفع الفكرة للمراجعة التنفيذية والتحويل إلى مشروع.",
        reason: "المؤشرات الحالية داعمة للاعتماد."
      });
    }

    return actions
      .sort((first, second) => first.priority - second.priority)
      .slice(0, 5)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));
  }

  function buildRecommendations(result) {
    const recommendations = result.nextBestActions.map((item) =>
      createRecommendation(
        item.rank === 1
          ? "الإجراء الأول المقترح"
          : `الإجراء المقترح رقم ${item.rank}`,
        item.action,
        item.priority === 1
          ? "high"
          : item.priority === 2
          ? "medium"
          : "low",
        item.reason,
        item.category === "data"
          ? "رفع جاهزية البيانات ودقة القرار."
          : item.category === "feasibility"
          ? "تقليل مخاطر التنفيذ."
          : item.category === "risk"
          ? "خفض التعرض للمخاطر."
          : item.category === "governance"
          ? "رفع وضوح المسؤوليات."
          : "تسريع الوصول للقيمة."
      )
    );

    return recommendations;
  }

  function buildExecutiveSummary(idea, result) {
    const title = safeText(
      idea?.title ||
      idea?.name,
      "الفكرة"
    );

    return `${title} حصلت على تقييم ${result.overallScore}% وأولوية ${result.priorityBand}. التوصية الحالية: ${result.recommendationLabel}. أبرز نقاط القوة ${result.strengths.map((item) => item.label).join("، ") || "غير محددة"}، وأهم فجوة ${result.gaps[0]?.label || "غير محددة"}.`;
  }

  function calculateConfidence(result) {
    const evidence = [
      result.dataCompleteness >= 60,
      result.impact !== 60,
      result.strategicAlignment !== 65,
      result.dataReadiness !== 55,
      result.complexity !== 50,
      result.riskScore !== 50,
      result.governanceReadiness >= 60
    ];

    return clamp(
      round(
        45 +
        (evidence.filter(Boolean).length / evidence.length) * 50
      )
    );
  }

  function analyzeIdea(idea) {
    const impact = scoreImpact(idea);
    const strategicAlignment = scoreStrategicAlignment(idea);
    const dataReadiness = scoreDataReadiness(idea);
    const feasibility = scoreFeasibility(idea);
    const complexity = scoreComplexity(idea);
    const innovation = scoreInnovation(idea);
    const userValue = scoreUserValue(idea);
    const timeToValue = scoreTimeToValue(idea);
    const riskScore = scoreRisk(idea);
    const governanceReadiness = scoreGovernanceReadiness(idea);
    const reusePotential = scoreReusePotential(idea);
    const dataCompleteness = ideaDataCompleteness(idea);

    const dimensions = [
      buildDimension(
        "impact",
        "الأثر التشغيلي",
        impact,
        0.20,
        `الأثر المتوقع ${impact}%.`,
        idea?.impact ?? impact
      ),
      buildDimension(
        "strategicAlignment",
        "المواءمة الاستراتيجية",
        strategicAlignment,
        0.15,
        `المواءمة الاستراتيجية ${strategicAlignment}%.`,
        idea?.strategicAlignment ?? idea?.priority
      ),
      buildDimension(
        "dataReadiness",
        "جاهزية البيانات",
        dataReadiness,
        0.14,
        `جاهزية البيانات ${dataReadiness}%.`,
        idea?.dataReadiness ?? idea?.dataAvailability
      ),
      buildDimension(
        "feasibility",
        "قابلية التنفيذ",
        feasibility,
        0.13,
        `قابلية التنفيذ ${feasibility}%.`,
        idea?.feasibility
      ),
      buildDimension(
        "innovation",
        "الابتكار",
        innovation,
        0.10,
        `مستوى الابتكار ${innovation}%.`,
        idea?.innovation
      ),
      buildDimension(
        "userValue",
        "قيمة المستخدم",
        userValue,
        0.08,
        `قيمة المستخدم ${userValue}%.`,
        idea?.userValue ?? idea?.serviceImpact
      ),
      buildDimension(
        "timeToValue",
        "سرعة الوصول للقيمة",
        timeToValue,
        0.06,
        `سرعة الوصول للقيمة ${timeToValue}%.`,
        idea?.timeToValue ?? idea?.duration
      ),
      buildDimension(
        "governance",
        "جاهزية الحوكمة",
        governanceReadiness,
        0.05,
        `جاهزية الحوكمة ${governanceReadiness}%.`,
        governanceReadiness
      ),
      buildDimension(
        "reuse",
        "قابلية التوسع وإعادة الاستخدام",
        reusePotential,
        0.04,
        `قابلية التوسع وإعادة الاستخدام ${reusePotential}%.`,
        idea?.reusePotential ?? idea?.scalability
      ),
      buildDimension(
        "risk",
        "المخاطر",
        riskScore,
        0.03,
        `مستوى المخاطر ${riskScore}%.`,
        idea?.risk ?? idea?.riskLevel,
        true
      ),
      buildDimension(
        "dataCompleteness",
        "اكتمال البيانات",
        dataCompleteness,
        0.02,
        `اكتمال بيانات الفكرة ${dataCompleteness}%.`,
        dataCompleteness
      )
    ];

    const overallScore = weightedScore(dimensions);
    const scoreLevel = levelFromScore(overallScore);
    const executivePriority = clamp(
      round(
        overallScore * 0.70 +
        impact * 0.12 +
        strategicAlignment * 0.10 +
        timeToValue * 0.08
      )
    );
    const priority = priorityBand(executivePriority);
    const recommendation = recommendationType(
      overallScore,
      dataReadiness,
      feasibility,
      riskScore
    );
    const strengths = topStrengths(dimensions);
    const gaps = topGaps(dimensions);

    const result = {
      id: ideaId(idea),
      analyzer: ANALYZER_NAME,
      version: VERSION,
      generatedAt: new Date().toISOString(),

      overallScore,
      scoreLevel,
      scoreLabel: levelLabel(scoreLevel),
      executivePriority,
      priorityBand: priority,

      recommendation,
      recommendationLabel: recommendationLabel(recommendation),

      impact,
      strategicAlignment,
      dataReadiness,
      feasibility,
      complexity,
      innovation,
      userValue,
      timeToValue,
      riskScore,
      governanceReadiness,
      reusePotential,
      dataCompleteness,

      strengths,
      gaps,
      dimensions
    };

    result.nextBestActions = buildNextActions(result);
    result.findings = buildFindings(result);
    result.recommendations = buildRecommendations(result);
    result.executiveSummary = buildExecutiveSummary(idea, result);
    result.confidence = calculateConfidence(result);

    result.decisionSupport = {
      canApprove:
        recommendation === "approve",
      shouldPilot:
        recommendation === "pilot",
      needsDetailedStudy:
        recommendation === "study",
      shouldHold:
        recommendation === "hold",
      suggestedDecision:
        recommendation === "approve"
          ? "اعتماد الفكرة وتحويلها إلى مشروع مع بدء التخطيط."
          : recommendation === "pilot"
          ? "اعتماد تجربة محدودة قبل التوسع."
          : recommendation === "study"
          ? "إجراء دراسة بيانات وجدوى ومخاطر قبل الاعتماد."
          : "تعليق الفكرة مؤقتاً حتى معالجة فجوات الجاهزية والقيمة."
    };

    runtime.generated += 1;
    runtime.lastRunAt = result.generatedAt;

    return result;
  }

  function getScore(ideaKey) {
    const core = getCore();

    if (!core || typeof core.getAnalysis !== "function") {
      return null;
    }

    const analysis = core.getAnalysis("idea", ideaKey);

    return (
      analysis?.extensions?.[ANALYZER_NAME] ||
      null
    );
  }

  async function refreshIdea(ideaKey) {
    const core = requireCore();

    return core.analyzeIdea(
      ideaKey,
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
      name: "Idea AI Scoring",
      version: VERSION,
      initialized: runtime.initialized,
      generated: runtime.generated,
      lastRunAt: runtime.lastRunAt,
      analyzerName: ANALYZER_NAME
    };
  }

  function init() {
    if (runtime.initialized) {
      return AIW.IdeaAIScoring;
    }

    const core = requireCore();

    runtime.unregister = core.registerAnalyzer(
      "idea",
      ANALYZER_NAME,
      analyzeIdea,
      {
        version: VERSION,
        priority: 20
      }
    );

    runtime.initialized = true;

    core.emit?.("idea-ai-scoring:ready", {
      name: ANALYZER_NAME,
      version: VERSION,
      initializedAt: new Date().toISOString()
    });

    global.dispatchEvent?.(
      new CustomEvent(
        "aiw:idea-ai-scoring:ready",
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
        "[AIW.IdeaAIScoring] Initial refresh failed.",
        error
      );
    });

    return AIW.IdeaAIScoring;
  }

  function destroy() {
    if (typeof runtime.unregister === "function") {
      runtime.unregister();
    }

    runtime.unregister = null;
    runtime.initialized = false;
  }

  AIW.IdeaAIScoring = {
    version: VERSION,
    analyzerName: ANALYZER_NAME,

    init,
    destroy,
    getStatus,

    analyzeIdea,
    getScore,
    refreshIdea,
    refreshAll
  };

  AIW.Engines = AIW.Engines || {};
  AIW.Engines.ideaAIScoring =
    AIW.IdeaAIScoring;

  function autoInit() {
    try {
      init();
    } catch (error) {
      console.error(
        "[AIW.IdeaAIScoring] Auto initialization failed.",
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
