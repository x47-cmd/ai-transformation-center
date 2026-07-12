/* =========================================================
   AI Work - Idea Project Readiness Engine V1.0.0
   File Path:
   js/extensions/ai-idea-generator/idea-project-readiness.js

   File 13 of 17

   Purpose:
   - Assess whether an AI opportunity is ready to become a project
   - Score business, data, technical, security, resource and integration readiness
   - Identify missing requirements and blocking conditions
   - Produce an executive readiness recommendation
========================================================= */

(function (window) {
  "use strict";

  window.AIW = window.AIW || {};
  AIW.Extensions = AIW.Extensions || {};

  const VERSION = "1.0.0";
  const MODULE_ID = "idea-project-readiness";

  const DEFAULT_WEIGHTS = Object.freeze({
    business: 0.18,
    data: 0.20,
    technical: 0.18,
    security: 0.16,
    resources: 0.14,
    integration: 0.14
  });

  function clean(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function clone(value) {
    if (value == null) return value;

    if (typeof structuredClone === "function") {
      try {
        return structuredClone(value);
      } catch (error) {
        // Continue to JSON fallback.
      }
    }

    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return value;
    }
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function normalizeNumber(value, fallback = 0, min = 0, max = 100) {
    const number = Number(value);
    const safe = Number.isFinite(number) ? number : fallback;
    return Math.min(max, Math.max(min, safe));
  }

  function normalizeArray(value) {
    if (!Array.isArray(value)) return [];

    return value
      .map((item) => {
        if (typeof item === "string") return clean(item);
        if (item && typeof item === "object") {
          return clean(item.title || item.name || item.label || item.value);
        }
        return "";
      })
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index);
  }

  function yesScore(value, trueScore = 100, falseScore = 0) {
    if (value === true) return trueScore;
    if (value === false) return falseScore;

    const text = clean(value).toLowerCase();

    if (["yes", "true", "ready", "available", "نعم", "جاهز", "متوفر"].includes(text)) {
      return trueScore;
    }

    if (["no", "false", "not ready", "unavailable", "لا", "غير جاهز", "غير متوفر"].includes(text)) {
      return falseScore;
    }

    return null;
  }

  function getPath(source, path, fallback) {
    const parts = path.split(".");
    let current = source;

    for (const part of parts) {
      if (current == null || typeof current !== "object") {
        return fallback;
      }
      current = current[part];
    }

    return current == null ? fallback : current;
  }

  function resolveBusinessScore(idea, businessCase) {
    const explicit = normalizeNumber(
      idea.businessReadiness ??
      businessCase.businessReadiness ??
      businessCase.readiness?.business,
      NaN
    );

    if (Number.isFinite(explicit)) return explicit;

    let score = 0;
    const checks = [
      Boolean(clean(idea.title || businessCase.title)),
      Boolean(clean(idea.problemStatement || businessCase.problemStatement)),
      Boolean(clean(idea.proposedSolution || businessCase.proposedSolution)),
      normalizeArray(idea.objectives || businessCase.objectives).length > 0,
      normalizeArray(idea.expectedBenefits || businessCase.expectedBenefits).length > 0,
      Boolean(clean(idea.owner || businessCase.ownership?.owner))
    ];

    score = checks.filter(Boolean).length / checks.length * 100;
    return Math.round(score);
  }

  function resolveDataScore(idea, businessCase) {
    const explicit = normalizeNumber(
      idea.dataReadiness ??
      businessCase.dataReadiness ??
      businessCase.readiness?.data,
      NaN
    );

    if (Number.isFinite(explicit)) return explicit;

    const hasData = yesScore(
      idea.dataAvailable ??
      businessCase.dataAvailable ??
      getPath(idea, "data.available", null)
    );

    const quality = normalizeNumber(
      idea.dataQuality ??
      businessCase.dataQuality ??
      getPath(idea, "data.qualityScore", 50),
      50
    );

    const access = normalizeNumber(
      idea.dataAccess ??
      businessCase.dataAccess ??
      getPath(idea, "data.accessScore", 50),
      50
    );

    const governance = normalizeNumber(
      idea.dataGovernance ??
      businessCase.dataGovernance ??
      getPath(idea, "data.governanceScore", 50),
      50
    );

    const availability = hasData == null ? 50 : hasData;

    return Math.round(
      availability * 0.35 +
      quality * 0.30 +
      access * 0.20 +
      governance * 0.15
    );
  }

  function resolveTechnicalScore(idea, businessCase) {
    const explicit = normalizeNumber(
      idea.technicalReadiness ??
      businessCase.technicalReadiness ??
      businessCase.readiness?.technical,
      NaN
    );

    if (Number.isFinite(explicit)) return explicit;

    const architecture = normalizeNumber(
      idea.architectureReadiness ??
      getPath(idea, "technical.architectureScore", 55),
      55
    );

    const feasibility = normalizeNumber(
      idea.technicalFeasibility ??
      getPath(idea, "technical.feasibilityScore", 60),
      60
    );

    const environment = normalizeNumber(
      idea.environmentReadiness ??
      getPath(idea, "technical.environmentScore", 50),
      50
    );

    const skills = normalizeNumber(
      idea.skillsAvailability ??
      getPath(idea, "technical.skillsScore", 50),
      50
    );

    return Math.round(
      architecture * 0.25 +
      feasibility * 0.35 +
      environment * 0.20 +
      skills * 0.20
    );
  }

  function resolveSecurityScore(idea, businessCase) {
    const explicit = normalizeNumber(
      idea.securityReadiness ??
      businessCase.securityReadiness ??
      businessCase.readiness?.security,
      NaN
    );

    if (Number.isFinite(explicit)) return explicit;

    const review = yesScore(
      idea.securityReviewCompleted ??
      getPath(idea, "security.reviewCompleted", null)
    );

    const privacy = normalizeNumber(
      idea.privacyReadiness ??
      getPath(idea, "security.privacyScore", 45),
      45
    );

    const access = normalizeNumber(
      idea.accessControlReadiness ??
      getPath(idea, "security.accessControlScore", 55),
      55
    );

    const compliance = normalizeNumber(
      idea.complianceReadiness ??
      getPath(idea, "security.complianceScore", 50),
      50
    );

    const reviewScore = review == null ? 40 : review;

    return Math.round(
      reviewScore * 0.30 +
      privacy * 0.25 +
      access * 0.20 +
      compliance * 0.25
    );
  }

  function resolveResourceScore(idea, businessCase) {
    const explicit = normalizeNumber(
      idea.resourceReadiness ??
      businessCase.resourceReadiness ??
      businessCase.readiness?.resources,
      NaN
    );

    if (Number.isFinite(explicit)) return explicit;

    const owner = clean(
      idea.owner ||
      businessCase.ownership?.owner
    );

    const team = normalizeArray(
      idea.implementationTeam ||
      businessCase.ownership?.implementationTeam
    );

    const budget = normalizeNumber(
      idea.budgetReadiness ??
      getPath(idea, "resources.budgetScore", 40),
      40
    );

    const capacity = normalizeNumber(
      idea.teamCapacity ??
      getPath(idea, "resources.capacityScore", team.length ? 65 : 30),
      team.length ? 65 : 30
    );

    const ownerScore = owner && owner !== "يحدد لاحقاً" ? 100 : 30;
    const teamScore = team.length >= 2 ? 85 : team.length === 1 ? 60 : 25;

    return Math.round(
      ownerScore * 0.25 +
      teamScore * 0.25 +
      budget * 0.25 +
      capacity * 0.25
    );
  }

  function resolveIntegrationScore(idea, businessCase) {
    const explicit = normalizeNumber(
      idea.integrationReadiness ??
      businessCase.integrationReadiness ??
      businessCase.readiness?.integration,
      NaN
    );

    if (Number.isFinite(explicit)) return explicit;

    const systems = normalizeArray(
      idea.targetSystems ||
      idea.integrations ||
      businessCase.dependencies
    );

    const api = normalizeNumber(
      idea.apiReadiness ??
      getPath(idea, "integration.apiScore", 45),
      45
    );

    const ownership = normalizeNumber(
      idea.systemOwnershipClarity ??
      getPath(idea, "integration.ownershipScore", 50),
      50
    );

    const compatibility = normalizeNumber(
      idea.compatibilityReadiness ??
      getPath(idea, "integration.compatibilityScore", 55),
      55
    );

    const systemScore = systems.length ? 70 : 35;

    return Math.round(
      systemScore * 0.20 +
      api * 0.30 +
      ownership * 0.20 +
      compatibility * 0.30
    );
  }

  function getLevel(score) {
    if (score >= 80) return "مرتفعة";
    if (score >= 60) return "متوسطة";
    if (score >= 40) return "منخفضة";
    return "حرجة";
  }

  function getDecision(score, blockers) {
    if (blockers.length) {
      return {
        code: "NOT_READY",
        label: "غير جاهز",
        recommendation: "لا يوصى بتحويل الفكرة إلى مشروع قبل معالجة العوائق الحرجة."
      };
    }

    if (score >= 85) {
      return {
        code: "READY_FOR_PROJECT",
        label: "جاهز للتحويل إلى مشروع",
        recommendation: "يمكن تحويل الفكرة إلى مشروع بعد الاعتماد الإداري النهائي."
      };
    }

    if (score >= 70) {
      return {
        code: "READY_FOR_PILOT",
        label: "جاهز لمشروع تجريبي",
        recommendation: "يوصى ببدء Pilot محدود قبل التوسع الكامل."
      };
    }

    if (score >= 50) {
      return {
        code: "NEEDS_ASSESSMENT",
        label: "يحتاج استكمال التقييم",
        recommendation: "يوصى باستكمال المتطلبات الناقصة وإعادة التقييم."
      };
    }

    return {
      code: "NOT_READY",
      label: "غير جاهز",
      recommendation: "الفكرة تحتاج إلى تجهيزات أساسية قبل الانتقال إلى التنفيذ."
    };
  }

  function buildMissingRequirements(scores, idea, businessCase) {
    const missing = [];

    if (scores.business < 60) {
      missing.push("توضيح المالك والأهداف والفوائد التشغيلية.");
    }

    if (scores.data < 60) {
      missing.push("تأكيد توفر البيانات وجودتها وصلاحية الوصول إليها.");
    }

    if (scores.technical < 60) {
      missing.push("استكمال التقييم الفني والمعمارية وبيئة الاختبار.");
    }

    if (scores.security < 60) {
      missing.push("استكمال مراجعة الأمن والخصوصية والامتثال.");
    }

    if (scores.resources < 60) {
      missing.push("تحديد الفريق والميزانية والقدرة التشغيلية.");
    }

    if (scores.integration < 60) {
      missing.push("تحديد الأنظمة المستهدفة وآليات التكامل والواجهات.");
    }

    if (!clean(idea.owner || businessCase.ownership?.owner)) {
      missing.push("تعيين مالك واضح للفكرة.");
    }

    if (!normalizeArray(idea.kpis || businessCase.kpis).length) {
      missing.push("تعريف مؤشرات أداء قابلة للقياس.");
    }

    return normalizeArray(missing);
  }

  function buildBlockers(scores, idea) {
    const blockers = [];

    if (scores.security < 35) {
      blockers.push("الجاهزية الأمنية أقل من الحد المقبول.");
    }

    if (scores.data < 30) {
      blockers.push("البيانات غير متوفرة أو غير صالحة حالياً.");
    }

    if (
      idea.outOfScope === true ||
      idea.validation?.inScope === false
    ) {
      blockers.push("الفكرة خارج نطاق منصة AI Work.");
    }

    if (
      idea.duplicateAnalysis?.duplicate === true ||
      idea.duplicateAnalysis?.isDuplicate === true
    ) {
      blockers.push("يوجد احتمال مرتفع أن الفكرة مكررة.");
    }

    return normalizeArray(blockers);
  }

  function assess(ideaInput = {}, businessCaseInput = {}, options = {}) {
    const idea =
      ideaInput && typeof ideaInput === "object"
        ? clone(ideaInput)
        : {};

    const businessCase =
      businessCaseInput && typeof businessCaseInput === "object"
        ? clone(businessCaseInput)
        : {};

    const title = clean(
      idea.title ||
      businessCase.title
    );

    if (!title) {
      throw new Error(
        "لا يمكن احتساب جاهزية المشروع بدون فكرة أو دراسة جدوى صالحة."
      );
    }

    const weights = {
      ...DEFAULT_WEIGHTS,
      ...(options.weights && typeof options.weights === "object"
        ? options.weights
        : {})
    };

    const scores = {
      business: resolveBusinessScore(idea, businessCase),
      data: resolveDataScore(idea, businessCase),
      technical: resolveTechnicalScore(idea, businessCase),
      security: resolveSecurityScore(idea, businessCase),
      resources: resolveResourceScore(idea, businessCase),
      integration: resolveIntegrationScore(idea, businessCase)
    };

    const totalWeight = Object.values(weights).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    ) || 1;

    const weightedScore = Object.entries(scores).reduce(
      (sum, [key, value]) => {
        return sum + value * Number(weights[key] || 0);
      },
      0
    ) / totalWeight;

    const score = Math.round(weightedScore);
    const blockers = buildBlockers(scores, idea);
    const missingRequirements = buildMissingRequirements(
      scores,
      idea,
      businessCase
    );

    const decision = getDecision(score, blockers);

    const dimensions = Object.entries(scores).map(
      ([key, value]) => ({
        key,
        score: value,
        level: getLevel(value),
        passed: value >= 60
      })
    );

    return {
      id: `readiness-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

      ideaId: clean(idea.id) || clean(businessCase.ideaId) || null,
      title,

      score,
      level: getLevel(score),

      decision,

      dimensions,
      scores,

      blockers,
      missingRequirements,

      passedDimensions: dimensions.filter((item) => item.passed).length,
      totalDimensions: dimensions.length,

      conversionAllowed:
        decision.code === "READY_FOR_PROJECT" &&
        blockers.length === 0,

      pilotAllowed:
        ["READY_FOR_PROJECT", "READY_FOR_PILOT"].includes(
          decision.code
        ) &&
        blockers.length === 0,

      nextActions:
        missingRequirements.length
          ? missingRequirements
          : [
              "استكمال الاعتماد الإداري.",
              "إنشاء سجل المشروع وربطه بالفكرة.",
              "بدء التخطيط التفصيلي للمشروع."
            ],

      governance: {
        humanReviewRequired: true,
        automaticConversionAllowed: false,
        securityReviewRequired: scores.security < 80,
        dataReviewRequired: scores.data < 80,
        businessOwnerApprovalRequired: true
      },

      generatedAt: nowISO(),

      metadata: {
        moduleId: MODULE_ID,
        version: VERSION,
        weights: clone(weights)
      }
    };
  }

  AIW.Extensions.IdeaProjectReadiness = {
    id: MODULE_ID,
    version: VERSION,
    assess,
    analyze: assess,
    getLevel
  };

  console.info(
    `[AI Work] Idea Project Readiness V${VERSION} ready`
  );
})(window);
