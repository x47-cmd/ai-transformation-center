/* =========================================================
   AI Work - Idea Executive Summary Engine V1.0.0
   File Path:
   js/extensions/ai-idea-generator/idea-executive-summary.js

   File 14 of 17

   Purpose:
   - Generate an executive-ready summary for a generated AI opportunity
   - Combine idea, business case and readiness outputs
   - Produce concise management language for presentation and reports
   - Keep all outputs reviewable and non-final
========================================================= */

(function (window) {
  "use strict";

  window.AIW = window.AIW || {};
  AIW.Extensions = AIW.Extensions || {};

  const VERSION = "1.0.0";
  const MODULE_ID = "idea-executive-summary";

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

  function normalizeArray(value) {
    if (!Array.isArray(value)) return [];

    return value
      .map((item) => {
        if (typeof item === "string") return clean(item);

        if (item && typeof item === "object") {
          return clean(
            item.title ||
            item.name ||
            item.label ||
            item.value ||
            item.description
          );
        }

        return "";
      })
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index);
  }

  function normalizeNumber(value, fallback = 0, min = 0, max = 100) {
    const number = Number(value);
    const safe = Number.isFinite(number) ? number : fallback;
    return Math.min(max, Math.max(min, safe));
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;
  }

  function shorten(text, maxLength) {
    const value = clean(text);

    if (!value || value.length <= maxLength) return value;

    return `${value.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
  }

  function resolveIdeaTitle(idea, businessCase) {
    return clean(
      idea.title ||
      businessCase.metadata?.sourceIdeaTitle ||
      businessCase.title?.replace(/^دراسة جدوى أولية:\s*/, "")
    );
  }

  function resolveProblem(idea, businessCase) {
    return clean(
      idea.problemStatement ||
      businessCase.problemStatement ||
      idea.summary ||
      businessCase.executiveSummary
    );
  }

  function resolveSolution(idea, businessCase) {
    return clean(
      idea.proposedSolution ||
      businessCase.proposedSolution ||
      idea.aiRole ||
      businessCase.aiRole
    );
  }

  function resolvePortfolio(idea, businessCase) {
    return clean(
      idea.portfolio ||
      idea.scope ||
      businessCase.classification?.portfolio ||
      businessCase.classification?.department
    ) || "الأنظمة البيومترية";
  }

  function resolveOwner(idea, businessCase) {
    return clean(
      idea.owner ||
      businessCase.ownership?.owner
    ) || "يحدد لاحقاً";
  }

  function resolvePriority(idea) {
    return clean(idea.priority) || "متوسطة";
  }

  function resolveRisk(idea, businessCase) {
    return {
      level:
        clean(
          idea.riskLevel ||
          businessCase.risk?.level
        ) || "متوسط",

      score: normalizeNumber(
        idea.riskScore ??
        businessCase.risk?.score,
        55
      ),

      controls: normalizeArray(
        idea.controls ||
        idea.riskControls ||
        businessCase.risk?.controls
      )
    };
  }

  function resolveReadiness(idea, businessCase, readiness) {
    const score = normalizeNumber(
      readiness.score ??
      idea.readiness ??
      businessCase.readiness?.score,
      45
    );

    const level =
      clean(
        readiness.level ||
        businessCase.readiness?.level
      ) ||
      (score >= 80
        ? "مرتفعة"
        : score >= 60
          ? "متوسطة"
          : score >= 40
            ? "منخفضة"
            : "حرجة");

    const decisionCode = clean(
      readiness.decision?.code
    );

    const decisionLabel = clean(
      readiness.decision?.label
    );

    const recommendation = clean(
      readiness.decision?.recommendation ||
      businessCase.decisionRecommendation
    );

    return {
      score,
      level,
      decisionCode,
      decisionLabel,
      recommendation
    };
  }

  function resolveBenefits(idea, businessCase) {
    const benefits = normalizeArray(
      idea.expectedBenefits ||
      businessCase.expectedBenefits
    );

    if (benefits.length) return benefits.slice(0, 5);

    return [
      "رفع الكفاءة التشغيلية.",
      "تقليل الأخطاء والعمل اليدوي.",
      "تحسين سرعة اتخاذ القرار."
    ];
  }

  function resolveKPIs(idea, businessCase) {
    const kpis = normalizeArray(
      idea.kpis ||
      businessCase.kpis
    );

    if (kpis.length) return kpis.slice(0, 5);

    return [
      "تقليل الأخطاء التشغيلية.",
      "رفع جودة الخدمة.",
      "تقليل زمن المعالجة."
    ];
  }

  function resolveTimeline(idea, businessCase) {
    return clean(
      idea.estimatedDuration ||
      businessCase.estimatedDuration ||
      businessCase.roadmap?.estimatedTimeline
    ) || "يحدد بعد الدراسة التفصيلية";
  }

  function resolveCost(idea, businessCase) {
    return clean(
      idea.estimatedCost ||
      businessCase.estimatedCost
    ) || "تقدير أولي يحتاج مراجعة";
  }

  function resolveStrategicValue(idea, businessCase) {
    const score = normalizeNumber(
      idea.strategicValueScore ??
      businessCase.strategicValue?.score ??
      idea.decisionScore,
      60
    );

    const level =
      clean(
        businessCase.strategicValue?.level
      ) ||
      (score >= 75
        ? "مرتفعة"
        : score >= 50
          ? "متوسطة"
          : "محدودة");

    return {
      score,
      level
    };
  }

  function resolveMissingRequirements(readiness) {
    return normalizeArray(
      readiness.missingRequirements
    ).slice(0, 6);
  }

  function resolveBlockers(readiness) {
    return normalizeArray(
      readiness.blockers
    ).slice(0, 6);
  }

  function resolveDecision(readiness, businessCase, strategicValue, risk) {
    if (readiness.decision?.code) {
      return {
        code: clean(readiness.decision.code),
        label: clean(readiness.decision.label),
        recommendation: clean(
          readiness.decision.recommendation
        )
      };
    }

    const readinessScore = normalizeNumber(
      readiness.score,
      businessCase.readiness?.score ?? 45
    );

    if (risk.score >= 80) {
      return {
        code: "NEEDS_RISK_REVIEW",
        label: "يحتاج مراجعة مخاطر",
        recommendation:
          "يوصى باستكمال المراجعة الأمنية والتشغيلية قبل بدء أي تنفيذ."
      };
    }

    if (readinessScore >= 85 && strategicValue.score >= 70) {
      return {
        code: "READY_FOR_PROJECT",
        label: "جاهز للتحويل إلى مشروع",
        recommendation:
          "يمكن الانتقال إلى الاعتماد النهائي ثم إنشاء المشروع."
      };
    }

    if (readinessScore >= 65 && strategicValue.score >= 60) {
      return {
        code: "READY_FOR_PILOT",
        label: "جاهز لمشروع تجريبي",
        recommendation:
          "يوصى بتنفيذ Pilot محدود وقياس النتائج قبل التوسع."
      };
    }

    return {
      code: "NEEDS_ASSESSMENT",
      label: "يحتاج استكمال التقييم",
      recommendation:
        clean(businessCase.decisionRecommendation) ||
        "يوصى باستكمال البيانات والمتطلبات وإعادة التقييم."
    };
  }

  function buildHeadline(title, portfolio, decision) {
    return `${title} — ${portfolio} — ${decision.label}`;
  }

  function buildOneLineSummary(problem, solution, portfolio) {
    const p = shorten(problem, 170);
    const s = shorten(solution, 190);

    return clean(
      `فرصة ذكاء اصطناعي ضمن ${portfolio} لمعالجة ${p} من خلال ${s}`
    );
  }

  function buildExecutiveNarrative(data) {
    const {
      title,
      portfolio,
      problem,
      solution,
      owner,
      priority,
      risk,
      readiness,
      strategicValue,
      timeline,
      cost,
      decision
    } = data;

    const ownerText =
      owner && owner !== "يحدد لاحقاً"
        ? ` والجهة المالكة المقترحة هي ${owner}`
        : "";

    return clean(
      `تقترح مبادرة "${title}" معالجة تحدٍ تشغيلي ضمن ${portfolio}. ` +
      `تتمثل المشكلة في ${shorten(problem, 250)}. ` +
      `ويقترح الحل استخدام الذكاء الاصطناعي لـ${shorten(solution, 260)}. ` +
      `القيمة الاستراتيجية مصنفة بأنها ${strategicValue.level} بدرجة ${strategicValue.score}/100، ` +
      `بينما تبلغ الجاهزية الحالية ${readiness.score}/100 (${readiness.level})، ` +
      `ومستوى المخاطر ${risk.level} بدرجة ${risk.score}/100. ` +
      `الأولوية المقترحة ${priority}${ownerText}. ` +
      `المدة التقديرية ${timeline}، والتكلفة الحالية ${cost}. ` +
      `القرار المقترح: ${decision.label}. ${decision.recommendation}`
    );
  }

  function buildManagementHighlights(data) {
    const highlights = [
      `المجال: ${data.portfolio}`,
      `القيمة الاستراتيجية: ${data.strategicValue.level} (${data.strategicValue.score}/100)`,
      `الجاهزية: ${data.readiness.level} (${data.readiness.score}/100)`,
      `المخاطر: ${data.risk.level} (${data.risk.score}/100)`,
      `الأولوية: ${data.priority}`,
      `المالك المقترح: ${data.owner}`,
      `المدة: ${data.timeline}`,
      `التكلفة: ${data.cost}`,
      `القرار: ${data.decision.label}`
    ];

    return highlights;
  }

  function buildNextActions(data) {
    const actions = [];

    if (data.blockers.length) {
      actions.push(
        ...data.blockers.map(
          (item) => `معالجة العائق: ${item}`
        )
      );
    }

    if (data.missingRequirements.length) {
      actions.push(...data.missingRequirements);
    }

    if (!data.blockers.length && !data.missingRequirements.length) {
      if (data.decision.code === "READY_FOR_PROJECT") {
        actions.push(
          "استكمال الاعتماد الإداري النهائي.",
          "إنشاء سجل المشروع وربطه بالفكرة.",
          "اعتماد خطة التنفيذ والميزانية."
        );
      } else if (data.decision.code === "READY_FOR_PILOT") {
        actions.push(
          "تحديد نطاق Pilot واضح.",
          "اختيار عينة بيانات وبيئة اختبار.",
          "قياس النتائج قبل قرار التوسع."
        );
      } else {
        actions.push(
          "استكمال التقييم الفني والبيانات.",
          "تأكيد الجهة المالكة والموارد.",
          "إعادة تقييم الجاهزية بعد استكمال المتطلبات."
        );
      }
    }

    return normalizeArray(actions).slice(0, 8);
  }

  function buildReportSections(data) {
    return [
      {
        id: "overview",
        title: "نظرة تنفيذية",
        content: data.oneLineSummary
      },
      {
        id: "problem",
        title: "التحدي",
        content: data.problem
      },
      {
        id: "solution",
        title: "الحل المقترح",
        content: data.solution
      },
      {
        id: "value",
        title: "القيمة",
        content:
          `قيمة استراتيجية ${data.strategicValue.level} بدرجة ${data.strategicValue.score}/100.`
      },
      {
        id: "readiness",
        title: "الجاهزية",
        content:
          `جاهزية ${data.readiness.level} بدرجة ${data.readiness.score}/100.`
      },
      {
        id: "risk",
        title: "المخاطر",
        content:
          `مستوى مخاطر ${data.risk.level} بدرجة ${data.risk.score}/100.`
      },
      {
        id: "decision",
        title: "القرار المقترح",
        content:
          `${data.decision.label}. ${data.decision.recommendation}`
      }
    ];
  }

  function buildPresentationScript(data) {
    return clean(
      `هذه الفكرة بعنوان "${data.title}" وتقع ضمن ${data.portfolio}. ` +
      `تهدف إلى معالجة ${shorten(data.problem, 180)}. ` +
      `الحل المقترح يعتمد على الذكاء الاصطناعي لـ${shorten(data.solution, 190)}. ` +
      `تبلغ الجاهزية الحالية ${data.readiness.score}%، ` +
      `ومستوى المخاطر ${data.risk.level}. ` +
      `التوصية الحالية هي: ${data.decision.label}.`
    );
  }

  function generate(
    ideaInput = {},
    businessCaseInput = {},
    readinessInput = {},
    options = {}
  ) {
    const idea =
      ideaInput && typeof ideaInput === "object"
        ? clone(ideaInput)
        : {};

    const businessCase =
      businessCaseInput && typeof businessCaseInput === "object"
        ? clone(businessCaseInput)
        : {};

    const readiness =
      readinessInput && typeof readinessInput === "object"
        ? clone(readinessInput)
        : {};

    const title = resolveIdeaTitle(idea, businessCase);

    if (!title) {
      throw new Error(
        "لا يمكن إنشاء الملخص التنفيذي بدون عنوان للفكرة."
      );
    }

    const problem = resolveProblem(idea, businessCase);
    const solution = resolveSolution(idea, businessCase);
    const portfolio = resolvePortfolio(idea, businessCase);
    const owner = resolveOwner(idea, businessCase);
    const priority = resolvePriority(idea);
    const risk = resolveRisk(idea, businessCase);
    const readinessData = resolveReadiness(
      idea,
      businessCase,
      readiness
    );
    const benefits = resolveBenefits(idea, businessCase);
    const kpis = resolveKPIs(idea, businessCase);
    const timeline = resolveTimeline(idea, businessCase);
    const cost = resolveCost(idea, businessCase);
    const strategicValue = resolveStrategicValue(
      idea,
      businessCase
    );
    const blockers = resolveBlockers(readiness);
    const missingRequirements =
      resolveMissingRequirements(readiness);

    const decision = resolveDecision(
      readiness,
      businessCase,
      strategicValue,
      risk
    );

    const data = {
      title,
      portfolio,
      owner,
      priority,
      problem,
      solution,
      risk,
      readiness: readinessData,
      strategicValue,
      benefits,
      kpis,
      timeline,
      cost,
      blockers,
      missingRequirements,
      decision
    };

    const oneLineSummary = buildOneLineSummary(
      problem,
      solution,
      portfolio
    );

    const headline = buildHeadline(
      title,
      portfolio,
      decision
    );

    const executiveNarrative = buildExecutiveNarrative({
      ...data,
      oneLineSummary
    });

    const managementHighlights = buildManagementHighlights(data);
    const nextActions = buildNextActions(data);
    const reportSections = buildReportSections({
      ...data,
      oneLineSummary
    });

    const presentationScript = buildPresentationScript(data);

    return {
      id: createId("executive-summary"),
      ideaId: clean(idea.id) || clean(businessCase.ideaId) || null,
      businessCaseId: clean(businessCase.id) || null,

      title,
      headline,
      oneLineSummary,
      executiveNarrative,
      presentationScript,

      scope: {
        portfolio,
        owner,
        priority
      },

      value: {
        strategicValue,
        benefits
      },

      execution: {
        readiness: readinessData,
        timeline,
        cost,
        kpis
      },

      risk: {
        ...risk,
        blockers,
        controls: risk.controls
      },

      decision,

      managementHighlights,
      nextActions,
      reportSections,

      governance: {
        humanReviewRequired: true,
        generatedByAI: true,
        autoApprovalAllowed: false,
        readyForExecutiveReview: true
      },

      status: "draft",
      generatedAt: nowISO(),
      updatedAt: nowISO(),

      metadata: {
        moduleId: MODULE_ID,
        version: VERSION,
        language: clean(options.language) || "ar",
        source:
          clean(options.source) ||
          "AI Idea Generator"
      }
    };
  }

  AIW.Extensions.IdeaExecutiveSummary = {
    id: MODULE_ID,
    version: VERSION,
    generate,
    build: generate
  };

  console.info(
    `[AI Work] Idea Executive Summary V${VERSION} ready`
  );
})(window);
