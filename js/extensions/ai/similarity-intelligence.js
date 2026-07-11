/* =========================================================
   AI Work - Similarity Intelligence V1.0
   Enterprise Biometric Intelligence Platform

   File Path:
   js/extensions/ai/similarity-intelligence.js

   Depends on:
   - js/extensions/ai/ai-intelligence-core.js

   Purpose:
   - Detects duplicate and near-duplicate ideas/projects
   - Calculates explainable similarity percentages
   - Recommends merge, reuse, link, or proceed decisions
   - Builds lightweight internal knowledge relationships
   - Works as an independent AIW.AI analyzer extension
   - Does not modify ideas.js, projects.js, or the UI design
========================================================= */

(function bootstrapSimilarityIntelligence(global) {
  "use strict";

  global.AIW = global.AIW || {};

  const AIW = global.AIW;
  const VERSION = "1.0.0";
  const IDEA_ANALYZER_NAME = "similarity-intelligence-idea";
  const PROJECT_ANALYZER_NAME = "similarity-intelligence-project";
  const PORTFOLIO_ANALYZER_NAME = "similarity-intelligence-portfolio";

  const runtime = {
    initialized: false,
    unregisterIdea: null,
    unregisterProject: null,
    unregisterPortfolio: null,
    generated: 0,
    lastRunAt: null
  };

  const STOP_WORDS = new Set([
    "the", "and", "for", "with", "from", "into", "using", "use", "to", "of",
    "a", "an", "in", "on", "by", "is", "are", "be", "this", "that",
    "في", "من", "الى", "إلى", "على", "عن", "مع", "او", "أو", "و", "ثم",
    "هذا", "هذه", "ذلك", "تلك", "هو", "هي", "يتم", "يمكن", "عبر", "ضمن",
    "نظام", "حل", "مشروع", "فكرة", "منصة", "ذكي", "ذكية", "الذكاء", "الاصطناعي",
    "الذكاءالاصطناعي", "باستخدام", "استخدام", "تطوير", "تحسين", "ادارة", "إدارة"
  ]);

  const CATEGORY_RULES = [
    {
      id: "biometrics",
      label: "Biometrics",
      keywords: [
        "biometric", "biometrics", "face", "facial", "fingerprint", "iris",
        "identity", "enrollment", "authentication", "verification",
        "بصمه", "بصمة", "وجه", "تعرف", "هوية", "تسجيل", "مصادقة", "تحقق"
      ]
    },
    {
      id: "computer-vision",
      label: "Computer Vision",
      keywords: [
        "vision", "camera", "image", "video", "object detection", "ocr",
        "صوره", "صورة", "فيديو", "كاميرا", "رؤية", "كشف", "تعرف بصري"
      ]
    },
    {
      id: "nlp",
      label: "NLP",
      keywords: [
        "nlp", "language", "text", "chatbot", "assistant", "document",
        "translation", "summarization", "لغة", "نص", "محادثة", "مساعد",
        "مستند", "ترجمة", "تلخيص"
      ]
    },
    {
      id: "analytics",
      label: "Analytics",
      keywords: [
        "analytics", "prediction", "forecast", "insight", "dashboard", "trend",
        "تحليل", "تنبؤ", "توقع", "مؤشر", "لوحة", "اتجاه"
      ]
    },
    {
      id: "automation",
      label: "Automation",
      keywords: [
        "automation", "workflow", "trigger", "approval", "process",
        "اتمته", "أتمتة", "سير عمل", "اجراء", "إجراء", "اعتماد"
      ]
    },
    {
      id: "cybersecurity",
      label: "Cybersecurity",
      keywords: [
        "security", "cyber", "fraud", "threat", "risk", "attack",
        "امن", "أمن", "سيبراني", "احتيال", "تهديد", "هجوم", "مخاطر"
      ]
    },
    {
      id: "decision-intelligence",
      label: "Decision Intelligence",
      keywords: [
        "decision", "recommendation", "priority", "scoring", "advisor",
        "قرار", "توصية", "اولوية", "أولوية", "تقييم", "مستشار"
      ]
    },
    {
      id: "data",
      label: "Data Intelligence",
      keywords: [
        "data", "quality", "integration", "database", "master data",
        "بيانات", "جودة", "تكامل", "قاعدة بيانات", "سجل"
      ]
    }
  ];

  function getCore() {
    return AIW.AI || AIW.Engines?.aiIntelligence || null;
  }

  function requireCore() {
    const core = getCore();

    if (!core || typeof core.registerAnalyzer !== "function") {
      throw new Error(
        "AI Intelligence Core is required before Similarity Intelligence."
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

  function normalizeText(value) {
    const core = getCore();

    if (core?.utils?.normalizeText) {
      return core.utils.normalizeText(value);
    }

    return safeText(value)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function entityId(entity, prefix) {
    const core = getCore();

    if (core?.utils?.entityId) {
      return core.utils.entityId(entity, prefix);
    }

    return String(
      entity?.id ??
      entity?._id ??
      entity?.uuid ??
      entity?.key ??
      entity?.code ??
      entity?.title ??
      entity?.name ??
      `${prefix}_${Math.random().toString(36).slice(2, 8)}`
    );
  }

  function tokenize(value) {
    const normalized = normalizeText(value);

    return [...new Set(
      normalized
        .split(" ")
        .map((token) => token.trim())
        .filter((token) => token.length > 1)
        .filter((token) => !STOP_WORDS.has(token))
    )];
  }

  function tokenFrequency(value) {
    const map = new Map();

    for (const token of tokenize(value)) {
      map.set(token, (map.get(token) || 0) + 1);
    }

    return map;
  }

  function cosineSimilarity(firstValue, secondValue) {
    const first = tokenFrequency(firstValue);
    const second = tokenFrequency(secondValue);
    const vocabulary = new Set([...first.keys(), ...second.keys()]);

    if (!vocabulary.size) return 100;

    let dot = 0;
    let firstMagnitude = 0;
    let secondMagnitude = 0;

    for (const token of vocabulary) {
      const firstCount = first.get(token) || 0;
      const secondCount = second.get(token) || 0;

      dot += firstCount * secondCount;
      firstMagnitude += firstCount ** 2;
      secondMagnitude += secondCount ** 2;
    }

    if (!firstMagnitude || !secondMagnitude) return 0;

    return round(
      (dot / (Math.sqrt(firstMagnitude) * Math.sqrt(secondMagnitude))) * 100,
      1
    );
  }

  function jaccardSimilarity(firstValue, secondValue) {
    const core = getCore();

    if (core?.utils?.jaccardSimilarity) {
      return core.utils.jaccardSimilarity(firstValue, secondValue);
    }

    const first = new Set(tokenize(firstValue));
    const second = new Set(tokenize(secondValue));

    if (!first.size && !second.size) return 100;
    if (!first.size || !second.size) return 0;

    const intersection = [...first].filter((token) => second.has(token)).length;
    const union = new Set([...first, ...second]).size;

    return round((intersection / union) * 100, 1);
  }

  function keywordOverlap(firstKeywords, secondKeywords) {
    const first = new Set(asArray(firstKeywords));
    const second = new Set(asArray(secondKeywords));

    if (!first.size && !second.size) return 100;
    if (!first.size || !second.size) return 0;

    const intersection = [...first].filter((item) => second.has(item)).length;
    const union = new Set([...first, ...second]).size;

    return round((intersection / union) * 100, 1);
  }

  function extractText(entity) {
    return [
      entity?.title,
      entity?.name,
      entity?.description,
      entity?.summary,
      entity?.challenge,
      entity?.problem,
      entity?.solution,
      entity?.proposedSolution,
      entity?.objective,
      entity?.objectives,
      entity?.goal,
      entity?.benefits,
      entity?.businessImpact,
      entity?.department,
      entity?.businessUnit,
      entity?.category,
      entity?.technology,
      entity?.aiType
    ]
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .filter(Boolean)
      .join(" ");
  }

  function extractKeywords(entity, limit = 12) {
    const frequencies = new Map();

    const importantSegments = [
      { value: entity?.title || entity?.name, weight: 4 },
      { value: entity?.challenge || entity?.problem, weight: 3 },
      { value: entity?.solution || entity?.proposedSolution, weight: 3 },
      { value: entity?.description || entity?.summary, weight: 2 },
      { value: entity?.department || entity?.businessUnit, weight: 1 },
      { value: entity?.category || entity?.technology || entity?.aiType, weight: 2 }
    ];

    for (const segment of importantSegments) {
      for (const token of tokenize(segment.value)) {
        frequencies.set(
          token,
          (frequencies.get(token) || 0) + segment.weight
        );
      }
    }

    return [...frequencies.entries()]
      .sort((first, second) => second[1] - first[1])
      .slice(0, limit)
      .map(([keyword, weight]) => ({
        keyword,
        weight
      }));
  }

  function classifyEntity(entity) {
    const text = normalizeText(extractText(entity));
    const matches = [];

    for (const rule of CATEGORY_RULES) {
      const matched = rule.keywords.filter((keyword) =>
        text.includes(normalizeText(keyword))
      );

      if (matched.length) {
        matches.push({
          id: rule.id,
          label: rule.label,
          matchedKeywords: matched,
          score: clamp(matched.length * 20)
        });
      }
    }

    if (!matches.length) {
      return {
        primary: {
          id: "general-ai",
          label: "General AI",
          score: 50
        },
        all: []
      };
    }

    matches.sort((first, second) => second.score - first.score);

    return {
      primary: matches[0],
      all: matches
    };
  }

  function sameDepartment(first, second) {
    const firstDepartment = normalizeText(
      first?.department || first?.businessUnit || first?.sector
    );
    const secondDepartment = normalizeText(
      second?.department || second?.businessUnit || second?.sector
    );

    if (!firstDepartment || !secondDepartment) return null;
    return firstDepartment === secondDepartment;
  }

  function sameCategory(first, second) {
    const firstClassification = classifyEntity(first);
    const secondClassification = classifyEntity(second);

    return (
      firstClassification.primary.id ===
      secondClassification.primary.id
    );
  }

  function titleSimilarity(first, second) {
    return round(
      cosineSimilarity(
        first?.title || first?.name,
        second?.title || second?.name
      ) * 0.65 +
      jaccardSimilarity(
        first?.title || first?.name,
        second?.title || second?.name
      ) * 0.35,
      1
    );
  }

  function descriptionSimilarity(first, second) {
    return round(
      cosineSimilarity(
        first?.description || first?.summary,
        second?.description || second?.summary
      ) * 0.60 +
      jaccardSimilarity(
        first?.description || first?.summary,
        second?.description || second?.summary
      ) * 0.40,
      1
    );
  }

  function problemSimilarity(first, second) {
    return round(
      cosineSimilarity(
        first?.challenge || first?.problem,
        second?.challenge || second?.problem
      ) * 0.60 +
      jaccardSimilarity(
        first?.challenge || first?.problem,
        second?.challenge || second?.problem
      ) * 0.40,
      1
    );
  }

  function solutionSimilarity(first, second) {
    return round(
      cosineSimilarity(
        first?.solution || first?.proposedSolution,
        second?.solution || second?.proposedSolution
      ) * 0.60 +
      jaccardSimilarity(
        first?.solution || first?.proposedSolution,
        second?.solution || second?.proposedSolution
      ) * 0.40,
      1
    );
  }

  function compareEntities(first, second, options = {}) {
    const firstKeywords = extractKeywords(first).map((item) => item.keyword);
    const secondKeywords = extractKeywords(second).map((item) => item.keyword);

    const metrics = {
      title: titleSimilarity(first, second),
      description: descriptionSimilarity(first, second),
      problem: problemSimilarity(first, second),
      solution: solutionSimilarity(first, second),
      keywords: keywordOverlap(firstKeywords, secondKeywords),
      department:
        sameDepartment(first, second) === true
          ? 100
          : sameDepartment(first, second) === false
          ? 0
          : 50,
      category: sameCategory(first, second) ? 100 : 0
    };

    const weights = {
      title: options.titleWeight ?? 0.22,
      description: options.descriptionWeight ?? 0.18,
      problem: options.problemWeight ?? 0.20,
      solution: options.solutionWeight ?? 0.20,
      keywords: options.keywordsWeight ?? 0.12,
      department: options.departmentWeight ?? 0.04,
      category: options.categoryWeight ?? 0.04
    };

    const totalWeight = Object.values(weights).reduce(
      (sum, value) => sum + value,
      0
    );

    const score = round(
      Object.keys(weights).reduce(
        (sum, key) => sum + metrics[key] * weights[key],
        0
      ) / totalWeight,
      1
    );

    return {
      score: clamp(score),
      metrics,
      weights,
      sharedKeywords: firstKeywords.filter((keyword) =>
        secondKeywords.includes(keyword)
      ),
      sameDepartment: sameDepartment(first, second),
      sameCategory: sameCategory(first, second)
    };
  }

  function similarityLevel(score) {
    if (score >= 90) return "duplicate";
    if (score >= 78) return "very-high";
    if (score >= 65) return "high";
    if (score >= 45) return "medium";
    return "low";
  }

  function similarityLabel(level) {
    const labels = {
      duplicate: "مكرر جداً",
      "very-high": "تشابه مرتفع جداً",
      high: "تشابه مرتفع",
      medium: "تشابه متوسط",
      low: "تشابه منخفض"
    };

    return labels[level] || labels.low;
  }

  function decisionFromScore(score, comparedType) {
    if (score >= 90) {
      return {
        action: "block-duplicate",
        label: "منع التكرار",
        message:
          comparedType === "project"
            ? "يوجد مشروع مطابق تقريباً؛ يوصى بعدم إنشاء مشروع جديد."
            : "توجد فكرة مطابقة تقريباً؛ يوصى بدمجها أو تحديث الفكرة الحالية."
      };
    }

    if (score >= 78) {
      return {
        action: "merge-or-reuse",
        label: "دمج أو إعادة استخدام",
        message:
          comparedType === "project"
            ? "يوصى بإعادة استخدام المشروع أو توسيع نطاقه بدلاً من البدء من الصفر."
            : "يوصى بدمج الفكرتين قبل الاعتماد."
      };
    }

    if (score >= 65) {
      return {
        action: "review-link",
        label: "مراجعة وربط",
        message:
          "يوجد تشابه مهم؛ راجع فرص الربط ومشاركة البيانات أو المكونات."
      };
    }

    if (score >= 45) {
      return {
        action: "consider-reuse",
        label: "دراسة إعادة الاستخدام",
        message:
          "يوجد تشابه جزئي يمكن الاستفادة منه في المتطلبات أو البيانات أو الحل."
      };
    }

    return {
      action: "proceed",
      label: "الاستمرار",
      message:
        "لا يظهر تكرار مؤثر في البيانات الحالية."
    };
  }

  function buildMatch(entity, type, comparison) {
    const level = similarityLevel(comparison.score);
    const decision = decisionFromScore(comparison.score, type);

    return {
      id: entityId(entity, type),
      type,
      title: safeText(
        entity?.title || entity?.name,
        type === "project" ? "مشروع بدون اسم" : "فكرة بدون اسم"
      ),
      department: safeText(
        entity?.department || entity?.businessUnit || entity?.sector
      ) || null,
      score: comparison.score,
      level,
      levelLabel: similarityLabel(level),
      decision,
      sharedKeywords: comparison.sharedKeywords,
      sameDepartment: comparison.sameDepartment,
      sameCategory: comparison.sameCategory,
      metrics: comparison.metrics
    };
  }

  function findMatches(target, collection, type, options = {}) {
    const targetId = entityId(target, options.targetType || type);

    return asArray(collection)
      .filter((entity) => entityId(entity, type) !== targetId)
      .map((entity) => {
        const comparison = compareEntities(target, entity, options);
        return buildMatch(entity, type, comparison);
      })
      .filter((match) => match.score >= (options.minimumScore ?? 35))
      .sort((first, second) => second.score - first.score)
      .slice(0, options.limit ?? 10);
  }

  function uniquenessScore(matches) {
    const highest = asArray(matches)[0]?.score || 0;
    return clamp(round(100 - highest));
  }

  function buildSummary(targetTitle, ideaMatches, projectMatches, uniqueness) {
    const strongestIdea = ideaMatches[0];
    const strongestProject = projectMatches[0];
    const strongest =
      !strongestIdea
        ? strongestProject
        : !strongestProject
        ? strongestIdea
        : strongestIdea.score >= strongestProject.score
        ? strongestIdea
        : strongestProject;

    if (!strongest) {
      return `${targetTitle} لا يظهر لها تشابه مؤثر مع البيانات الحالية. درجة التميز ${uniqueness}%.`;
    }

    return `${targetTitle} أعلى تشابه لها هو ${strongest.score}% مع ${strongest.title}. درجة التميز ${uniqueness}%. التوصية: ${strongest.decision.label}.`;
  }

  function buildFinding(title, message, severity, metric, action) {
    const core = getCore();

    if (core?.utils?.buildFinding) {
      return core.utils.buildFinding(
        "similarity-intelligence",
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
      type: "similarity-intelligence",
      title,
      message,
      severity,
      metric,
      action
    };
  }

  function buildRecommendation(title, action, priority, reason, expectedImpact) {
    const core = getCore();

    if (core?.utils?.buildRecommendation) {
      return core.utils.buildRecommendation(
        title,
        action,
        {
          priority,
          reason,
          expectedImpact,
          source: "similarity-intelligence"
        }
      );
    }

    return {
      title,
      action,
      priority,
      reason,
      expectedImpact,
      source: "similarity-intelligence"
    };
  }

  function buildFindings(ideaMatches, projectMatches, uniqueness) {
    const findings = [];
    const topIdea = ideaMatches[0];
    const topProject = projectMatches[0];

    if (topIdea && topIdea.score >= 78) {
      findings.push(
        buildFinding(
          "فكرة مشابهة بدرجة مرتفعة",
          `أعلى تشابه مع فكرة حالية هو ${topIdea.score}%: ${topIdea.title}.`,
          topIdea.score >= 90 ? "high" : "medium",
          topIdea.score,
          topIdea.decision.message
        )
      );
    }

    if (topProject && topProject.score >= 65) {
      findings.push(
        buildFinding(
          "مشروع مشابه موجود",
          `أعلى تشابه مع مشروع قائم هو ${topProject.score}%: ${topProject.title}.`,
          topProject.score >= 85 ? "high" : "medium",
          topProject.score,
          topProject.decision.message
        )
      );
    }

    if (uniqueness >= 75) {
      findings.push(
        buildFinding(
          "فكرة متميزة",
          `درجة التميز الحالية ${uniqueness}%.`,
          "positive",
          uniqueness,
          "الاستمرار في التقييم والتنفيذ."
        )
      );
    }

    if (!findings.length) {
      findings.push(
        buildFinding(
          "لا يوجد تكرار مؤثر",
          "لا توجد مطابقات مرتفعة في البيانات الحالية.",
          "positive",
          uniqueness,
          "الاستمرار مع مراقبة أي إضافات مستقبلية."
        )
      );
    }

    return findings;
  }

  function buildRecommendations(ideaMatches, projectMatches) {
    const recommendations = [];
    const topIdea = ideaMatches[0];
    const topProject = projectMatches[0];

    if (topIdea?.score >= 90) {
      recommendations.push(
        buildRecommendation(
          "منع تكرار الفكرة",
          `ادمج الفكرة الحالية مع "${topIdea.title}" أو حدث الفكرة الأصلية.`,
          "high",
          `نسبة التشابه ${topIdea.score}%.`,
          "خفض ازدواجية العمل والبيانات والميزانية."
        )
      );
    } else if (topIdea?.score >= 78) {
      recommendations.push(
        buildRecommendation(
          "مراجعة الدمج",
          `قارن نطاق الفكرتين وحدد إمكانية دمجهما في مبادرة واحدة.`,
          "high",
          `نسبة التشابه ${topIdea.score}%.`,
          "توحيد النطاق وتقليل التكرار."
        )
      );
    }

    if (topProject?.score >= 78) {
      recommendations.push(
        buildRecommendation(
          "إعادة استخدام مشروع قائم",
          `راجع المشروع "${topProject.title}" قبل إنشاء تنفيذ جديد.`,
          "high",
          `نسبة التشابه ${topProject.score}%.`,
          "تسريع التنفيذ وإعادة استخدام المكونات والخبرات."
        )
      );
    } else if (topProject?.score >= 60) {
      recommendations.push(
        buildRecommendation(
          "ربط المبادرات",
          `اربط الفكرة بالمشروع "${topProject.title}" لمشاركة البيانات أو الحلول.`,
          "medium",
          `نسبة التشابه ${topProject.score}%.`,
          "رفع التكامل وتقليل إعادة العمل."
        )
      );
    }

    if (!recommendations.length) {
      recommendations.push(
        buildRecommendation(
          "الاستمرار بالتقييم",
          "لا يظهر تكرار مؤثر؛ استمر في التقييم الفني والتنفيذي.",
          "low",
          "المطابقات الحالية منخفضة.",
          "الحفاظ على جودة القرار دون تعطيل الفكرة."
        )
      );
    }

    return recommendations;
  }

  function analyzeIdea(idea, context) {
    const ideaMatches = findMatches(
      idea,
      context.ideas,
      "idea",
      {
        targetType: "idea",
        minimumScore: 35,
        limit: 8
      }
    );

    const projectMatches = findMatches(
      idea,
      context.projects,
      "project",
      {
        targetType: "idea",
        minimumScore: 35,
        limit: 8
      }
    );

    const allMatches = [...ideaMatches, ...projectMatches]
      .sort((first, second) => second.score - first.score);

    const uniqueness = uniquenessScore(allMatches);
    const classification = classifyEntity(idea);
    const keywords = extractKeywords(idea);

    const result = {
      id: entityId(idea, "idea"),
      analyzer: IDEA_ANALYZER_NAME,
      version: VERSION,
      generatedAt: new Date().toISOString(),

      uniquenessScore: uniqueness,
      duplicateRisk: clamp(100 - uniqueness),
      duplicateDetected:
        Boolean(allMatches[0] && allMatches[0].score >= 90),
      highestSimilarity:
        allMatches[0]?.score || 0,

      classification,
      keywords,
      ideaMatches,
      projectMatches,
      topMatch: allMatches[0] || null
    };

    result.executiveSummary = buildSummary(
      safeText(idea?.title || idea?.name, "الفكرة"),
      ideaMatches,
      projectMatches,
      uniqueness
    );

    result.findings = buildFindings(
      ideaMatches,
      projectMatches,
      uniqueness
    );

    result.recommendations = buildRecommendations(
      ideaMatches,
      projectMatches
    );

    result.decisionSupport = {
      shouldBlockDuplicate:
        Boolean(allMatches[0] && allMatches[0].score >= 90),
      shouldMerge:
        Boolean(ideaMatches[0] && ideaMatches[0].score >= 78),
      shouldReuseProject:
        Boolean(projectMatches[0] && projectMatches[0].score >= 78),
      shouldLink:
        Boolean(allMatches[0] && allMatches[0].score >= 60),
      suggestedDecision:
        allMatches[0]?.decision?.message ||
        "الاستمرار بالتقييم."
    };

    runtime.generated += 1;
    runtime.lastRunAt = result.generatedAt;

    return result;
  }

  function analyzeProject(project, context) {
    const projectMatches = findMatches(
      project,
      context.projects,
      "project",
      {
        targetType: "project",
        minimumScore: 35,
        limit: 8
      }
    );

    const ideaMatches = findMatches(
      project,
      context.ideas,
      "idea",
      {
        targetType: "project",
        minimumScore: 35,
        limit: 8
      }
    );

    const allMatches = [...projectMatches, ...ideaMatches]
      .sort((first, second) => second.score - first.score);

    const uniqueness = uniquenessScore(allMatches);
    const classification = classifyEntity(project);
    const keywords = extractKeywords(project);

    const result = {
      id: entityId(project, "project"),
      analyzer: PROJECT_ANALYZER_NAME,
      version: VERSION,
      generatedAt: new Date().toISOString(),

      uniquenessScore: uniqueness,
      duplicateRisk: clamp(100 - uniqueness),
      duplicateDetected:
        Boolean(projectMatches[0] && projectMatches[0].score >= 90),
      highestSimilarity:
        allMatches[0]?.score || 0,

      classification,
      keywords,
      projectMatches,
      ideaMatches,
      topMatch: allMatches[0] || null
    };

    result.executiveSummary = buildSummary(
      safeText(project?.title || project?.name, "المشروع"),
      projectMatches,
      ideaMatches,
      uniqueness
    );

    result.findings = buildFindings(
      projectMatches,
      ideaMatches,
      uniqueness
    );

    result.recommendations = buildRecommendations(
      projectMatches,
      ideaMatches
    );

    result.decisionSupport = {
      shouldMergeProject:
        Boolean(projectMatches[0] && projectMatches[0].score >= 78),
      shouldLinkIdea:
        Boolean(ideaMatches[0] && ideaMatches[0].score >= 65),
      shouldShareComponents:
        Boolean(allMatches[0] && allMatches[0].score >= 60),
      suggestedDecision:
        allMatches[0]?.decision?.message ||
        "الاستمرار بالتنفيذ."
    };

    runtime.generated += 1;
    runtime.lastRunAt = result.generatedAt;

    return result;
  }

  function analyzePortfolio(_state, context) {
    const duplicateIdeas = [];
    const duplicateProjects = [];
    const reusableLinks = [];

    for (let firstIndex = 0; firstIndex < context.ideas.length; firstIndex += 1) {
      for (
        let secondIndex = firstIndex + 1;
        secondIndex < context.ideas.length;
        secondIndex += 1
      ) {
        const first = context.ideas[firstIndex];
        const second = context.ideas[secondIndex];
        const comparison = compareEntities(first, second);

        if (comparison.score >= 78) {
          duplicateIdeas.push({
            firstId: entityId(first, "idea"),
            firstTitle: safeText(first?.title || first?.name),
            secondId: entityId(second, "idea"),
            secondTitle: safeText(second?.title || second?.name),
            score: comparison.score,
            decision: decisionFromScore(comparison.score, "idea")
          });
        }
      }
    }

    for (
      let firstIndex = 0;
      firstIndex < context.projects.length;
      firstIndex += 1
    ) {
      for (
        let secondIndex = firstIndex + 1;
        secondIndex < context.projects.length;
        secondIndex += 1
      ) {
        const first = context.projects[firstIndex];
        const second = context.projects[secondIndex];
        const comparison = compareEntities(first, second);

        if (comparison.score >= 78) {
          duplicateProjects.push({
            firstId: entityId(first, "project"),
            firstTitle: safeText(first?.title || first?.name),
            secondId: entityId(second, "project"),
            secondTitle: safeText(second?.title || second?.name),
            score: comparison.score,
            decision: decisionFromScore(comparison.score, "project")
          });
        }
      }
    }

    for (const idea of context.ideas) {
      const matches = findMatches(
        idea,
        context.projects,
        "project",
        {
          targetType: "idea",
          minimumScore: 60,
          limit: 3
        }
      );

      for (const match of matches) {
        reusableLinks.push({
          ideaId: entityId(idea, "idea"),
          ideaTitle: safeText(idea?.title || idea?.name),
          projectId: match.id,
          projectTitle: match.title,
          score: match.score,
          decision: match.decision
        });
      }
    }

    const result = {
      id: "portfolio",
      analyzer: PORTFOLIO_ANALYZER_NAME,
      version: VERSION,
      generatedAt: new Date().toISOString(),

      duplicateIdeas: duplicateIdeas
        .sort((first, second) => second.score - first.score),
      duplicateProjects: duplicateProjects
        .sort((first, second) => second.score - first.score),
      reusableLinks: reusableLinks
        .sort((first, second) => second.score - first.score),

      totals: {
        duplicateIdeaPairs: duplicateIdeas.length,
        duplicateProjectPairs: duplicateProjects.length,
        reusableIdeaProjectLinks: reusableLinks.length
      }
    };

    result.executiveSummary =
      duplicateIdeas.length || duplicateProjects.length
        ? `تم اكتشاف ${duplicateIdeas.length} زوج أفكار متشابه و${duplicateProjects.length} زوج مشاريع متشابه، مع ${reusableLinks.length} فرصة لإعادة الاستخدام.`
        : `لا توجد حالياً ازدواجية مرتفعة، وتم العثور على ${reusableLinks.length} فرصة ربط وإعادة استخدام.`;

    result.findings = [];

    if (duplicateIdeas.length) {
      result.findings.push(
        buildFinding(
          "أفكار متشابهة",
          `يوجد ${duplicateIdeas.length} زوج أفكار يحتاج مراجعة دمج.`,
          "medium",
          duplicateIdeas.length,
          "مراجعة قائمة الأزواج الأعلى تشابهاً."
        )
      );
    }

    if (duplicateProjects.length) {
      result.findings.push(
        buildFinding(
          "مشاريع متشابهة",
          `يوجد ${duplicateProjects.length} زوج مشاريع يحتاج مراجعة نطاق.`,
          "high",
          duplicateProjects.length,
          "منع ازدواجية التنفيذ والميزانية."
        )
      );
    }

    if (reusableLinks.length) {
      result.findings.push(
        buildFinding(
          "فرص إعادة استخدام",
          `يوجد ${reusableLinks.length} فرصة لربط فكرة بمشروع قائم.`,
          "positive",
          reusableLinks.length,
          "مراجعة فرص إعادة الاستخدام قبل بدء مشاريع جديدة."
        )
      );
    }

    result.recommendations = [];

    if (duplicateIdeas.length) {
      result.recommendations.push(
        buildRecommendation(
          "تنظيف محفظة الأفكار",
          "راجع الأزواج الأعلى تشابهاً وادمج المتكرر منها.",
          "high",
          "تقليل ازدواجية الأفكار.",
          "رفع جودة المحفظة وسرعة القرار."
        )
      );
    }

    if (duplicateProjects.length) {
      result.recommendations.push(
        buildRecommendation(
          "مراجعة ازدواجية المشاريع",
          "قارن نطاق المشاريع المتشابهة ووحد المكونات المشتركة.",
          "high",
          "تقليل تكرار التنفيذ.",
          "خفض الكلفة وإعادة استخدام الخبرات."
        )
      );
    }

    if (reusableLinks.length) {
      result.recommendations.push(
        buildRecommendation(
          "تفعيل إعادة الاستخدام",
          "اربط الأفكار الجديدة بالمشاريع القائمة الأعلى تشابهاً.",
          "medium",
          "استثمار الأصول الحالية.",
          "تسريع التنفيذ وتقليل إعادة العمل."
        )
      );
    }

    return result;
  }

  function getIdeaSimilarity(ideaKey) {
    const core = getCore();
    const analysis = core?.getAnalysis?.("idea", ideaKey);

    return (
      analysis?.extensions?.[IDEA_ANALYZER_NAME] ||
      null
    );
  }

  function getProjectSimilarity(projectKey) {
    const core = getCore();
    const analysis = core?.getAnalysis?.("project", projectKey);

    return (
      analysis?.extensions?.[PROJECT_ANALYZER_NAME] ||
      null
    );
  }

  function compare(firstEntity, secondEntity, options = {}) {
    return compareEntities(firstEntity, secondEntity, options);
  }

  function getStatus() {
    return {
      name: "Similarity Intelligence",
      version: VERSION,
      initialized: runtime.initialized,
      generated: runtime.generated,
      lastRunAt: runtime.lastRunAt,
      analyzers: {
        idea: IDEA_ANALYZER_NAME,
        project: PROJECT_ANALYZER_NAME,
        portfolio: PORTFOLIO_ANALYZER_NAME
      }
    };
  }

  function init() {
    if (runtime.initialized) {
      return AIW.SimilarityIntelligence;
    }

    const core = requireCore();

    runtime.unregisterIdea = core.registerAnalyzer(
      "idea",
      IDEA_ANALYZER_NAME,
      analyzeIdea,
      {
        version: VERSION,
        priority: 30
      }
    );

    runtime.unregisterProject = core.registerAnalyzer(
      "project",
      PROJECT_ANALYZER_NAME,
      analyzeProject,
      {
        version: VERSION,
        priority: 40
      }
    );

    runtime.unregisterPortfolio = core.registerAnalyzer(
      "portfolio",
      PORTFOLIO_ANALYZER_NAME,
      analyzePortfolio,
      {
        version: VERSION,
        priority: 20
      }
    );

    runtime.initialized = true;

    core.emit?.("similarity-intelligence:ready", {
      version: VERSION,
      initializedAt: new Date().toISOString()
    });

    global.dispatchEvent?.(
      new CustomEvent(
        "aiw:similarity-intelligence:ready",
        {
          detail: {
            version: VERSION
          }
        }
      )
    );

    core.refreshAll?.({
      force: true
    }).catch((error) => {
      console.error(
        "[AIW.SimilarityIntelligence] Initial refresh failed.",
        error
      );
    });

    return AIW.SimilarityIntelligence;
  }

  function destroy() {
    runtime.unregisterIdea?.();
    runtime.unregisterProject?.();
    runtime.unregisterPortfolio?.();

    runtime.unregisterIdea = null;
    runtime.unregisterProject = null;
    runtime.unregisterPortfolio = null;
    runtime.initialized = false;
  }

  AIW.SimilarityIntelligence = {
    version: VERSION,

    init,
    destroy,
    getStatus,

    analyzeIdea,
    analyzeProject,
    analyzePortfolio,
    compare,

    getIdeaSimilarity,
    getProjectSimilarity,

    utils: {
      tokenize,
      extractKeywords,
      classifyEntity,
      compareEntities,
      findMatches,
      similarityLevel,
      similarityLabel,
      uniquenessScore
    }
  };

  AIW.Engines = AIW.Engines || {};
  AIW.Engines.similarityIntelligence =
    AIW.SimilarityIntelligence;

  function autoInit() {
    try {
      init();
    } catch (error) {
      console.error(
        "[AIW.SimilarityIntelligence] Auto initialization failed.",
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
