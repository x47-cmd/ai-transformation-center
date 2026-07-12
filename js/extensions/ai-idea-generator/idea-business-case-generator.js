/* =========================================================
   AI Work - Idea Business Case Generator V1.0.0
   File Path:
   js/extensions/ai-idea-generator/idea-business-case-generator.js

   File 12 of 17

   Purpose:
   - Build a structured business case from a generated AI opportunity
   - Reuse classification, KPI, owner, roadmap and risk outputs
   - Produce an executive-ready business case draft
   - Keep all values reviewable and non-final
========================================================= */

(function (window) {
  "use strict";

  window.AIW = window.AIW || {};
  AIW.Extensions = AIW.Extensions || {};

  const VERSION = "1.0.0";
  const MODULE_ID = "idea-business-case-generator";

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
      .map(clean)
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index);
  }

  function normalizeNumber(value, fallback, min, max) {
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

  function resolveExtension(name) {
    return window.AIW?.Extensions?.[name] || null;
  }

  function resolveClassification(idea) {
    const explicitPortfolio = clean(
      idea.portfolio || idea.scope || idea.category
    );

    const explicitDepartment = clean(idea.department);

    if (explicitPortfolio || explicitDepartment) {
      return {
        portfolio: explicitPortfolio || explicitDepartment,
        department: explicitDepartment || explicitPortfolio,
        confidence: normalizeNumber(
          idea.classificationConfidence,
          70,
          0,
          100
        )
      };
    }

    const classifier = resolveExtension("IdeaClassifier");

    if (classifier?.classify) {
      return classifier.classify(
        [
          idea.title,
          idea.summary,
          idea.problemStatement,
          idea.proposedSolution
        ]
          .filter(Boolean)
          .join(" ")
      );
    }

    return {
      portfolio: "الأنظمة البيومترية",
      department: "الأنظمة البيومترية",
      confidence: 40
    };
  }

  function resolveRisk(idea) {
    if (idea.riskLevel || idea.riskScore) {
      return {
        riskLevel: clean(idea.riskLevel) || "متوسط",
        riskScore: normalizeNumber(idea.riskScore, 55, 0, 100),
        controls: normalizeArray(idea.controls || idea.riskControls),
        recommendation: clean(idea.riskRecommendation)
      };
    }

    const riskEngine = resolveExtension("IdeaRiskEngine");

    if (riskEngine?.analyze) {
      return riskEngine.analyze(
        [
          idea.title,
          idea.problemStatement,
          idea.proposedSolution
        ]
          .filter(Boolean)
          .join(" ")
      );
    }

    return {
      riskLevel: "متوسط",
      riskScore: 55,
      controls: ["مراجعة تشغيلية", "اختبار تجريبي"],
      recommendation: "يمكن المتابعة بعد استكمال المراجعات."
    };
  }

  function resolveKPIs(idea, portfolio) {
    const current = normalizeArray(idea.kpis);

    if (current.length) return current;

    const builder = resolveExtension("IdeaKPIBuilder");

    if (builder?.build) {
      return normalizeArray(builder.build(portfolio)?.kpis);
    }

    return [
      "تقليل الأخطاء التشغيلية",
      "رفع جودة الخدمة",
      "تقليل زمن المعالجة"
    ];
  }

  function resolveOwner(idea, portfolio) {
    if (idea.owner || idea.stakeholders || idea.implementationTeam) {
      return {
        owner: clean(idea.owner) || "يحدد لاحقاً",
        stakeholders: normalizeArray(idea.stakeholders),
        implementationTeam: normalizeArray(idea.implementationTeam)
      };
    }

    const engine = resolveExtension("IdeaOwnerEngine");

    if (engine?.assign) {
      return engine.assign(portfolio);
    }

    return {
      owner: "يحدد لاحقاً",
      stakeholders: ["الإدارة", "العمليات"],
      implementationTeam: ["مدير مشروع", "محلل أعمال"]
    };
  }

  function resolveRoadmap(idea, portfolio) {
    const explicitPhases = Array.isArray(idea.implementationPhases)
      ? idea.implementationPhases
      : null;

    if (explicitPhases?.length) {
      return {
        estimatedTimeline:
          clean(idea.estimatedDuration) || "يحدد بعد الدراسة",
        milestones: normalizeArray(idea.milestones),
        phases: explicitPhases.map((phase, index) => {
          if (typeof phase === "string") {
            return {
              id: index + 1,
              title: clean(phase),
              duration: "",
              deliverable: ""
            };
          }

          return {
            id: phase.id || index + 1,
            title: clean(phase.title || phase.name),
            duration: clean(phase.duration),
            deliverable: clean(phase.deliverable)
          };
        })
      };
    }

    const engine = resolveExtension("IdeaRoadmapEngine");

    if (engine?.build) {
      return engine.build(portfolio);
    }

    return {
      estimatedTimeline: "10-18 أسبوع",
      milestones: [
        "اعتماد الفكرة",
        "اعتماد دراسة الجدوى",
        "نجاح التجربة",
        "الإطلاق"
      ],
      phases: []
    };
  }

  function inferStrategicValue(idea, riskScore, readiness) {
    const impact = normalizeNumber(
      idea.impactScore || idea.decisionScore,
      65,
      0,
      100
    );

    const valueScore = Math.round(
      impact * 0.5 +
      readiness * 0.3 +
      (100 - riskScore) * 0.2
    );

    let level = "متوسطة";

    if (valueScore >= 75) level = "مرتفعة";
    else if (valueScore < 50) level = "محدودة";

    return {
      score: valueScore,
      level
    };
  }

  function buildObjectives(idea) {
    const objectives = normalizeArray(idea.objectives);

    if (objectives.length) return objectives;

    return [
      "تقليل أثر المشكلة التشغيلية الحالية.",
      "رفع جودة ودقة العمليات المرتبطة بالمجال.",
      "توفير دعم تحليلي لاتخاذ القرار.",
      "إنشاء أساس قابل للقياس والتوسع مستقبلاً."
    ];
  }

  function buildBenefits(idea) {
    const benefits = normalizeArray(idea.expectedBenefits);

    if (benefits.length) return benefits;

    return [
      "رفع الكفاءة التشغيلية.",
      "تقليل الأخطاء والعمل اليدوي.",
      "تحسين سرعة الاستجابة.",
      "رفع جودة التقارير والقرارات."
    ];
  }

  function buildAssumptions(idea) {
    const assumptions = normalizeArray(idea.assumptions);

    if (assumptions.length) return assumptions;

    return [
      "توفر بيانات كافية وذات جودة مناسبة للتحليل.",
      "توفر مالك واضح للفكرة وفريق مختص للمراجعة.",
      "إمكانية تنفيذ تجربة محدودة قبل التوسع.",
      "التزام جميع الأطراف بمتطلبات الأمن والحوكمة."
    ];
  }

  function buildDependencies(idea) {
    const dependencies = normalizeArray(idea.dependencies);

    if (dependencies.length) return dependencies;

    return [
      "الوصول إلى البيانات والأنظمة ذات العلاقة.",
      "اعتماد الجهة المالكة.",
      "المراجعة الأمنية والتقنية.",
      "توفر بيئة اختبار مناسبة."
    ];
  }

  function buildRisks(risk) {
    const risks = [];

    if (risk.riskScore >= 70) {
      risks.push(
        "احتمال تأثير مرتفع على العمليات أو الأمن في حال التنفيذ غير الصحيح."
      );
    }

    risks.push(
      "ضعف جودة البيانات قد يؤثر على دقة النتائج.",
      "الحاجة إلى تكامل آمن مع الأنظمة الحالية.",
      "ضرورة وجود مراجعة بشرية للنتائج والتوصيات."
    );

    return normalizeArray(risks);
  }

  function generate(ideaInput = {}, context = {}) {
    const idea =
      ideaInput && typeof ideaInput === "object"
        ? clone(ideaInput)
        : {};

    const title = clean(idea.title);

    if (!title) {
      throw new Error(
        "لا يمكن إنشاء دراسة جدوى أولية بدون عنوان للفكرة."
      );
    }

    const classification = resolveClassification(idea);
    const risk = resolveRisk(idea);

    const readiness = normalizeNumber(
      idea.readiness,
      45,
      0,
      100
    );

    const owner = resolveOwner(idea, classification.portfolio);
    const roadmap = resolveRoadmap(idea, classification.portfolio);
    const kpis = resolveKPIs(idea, classification.portfolio);

    const strategicValue = inferStrategicValue(
      idea,
      risk.riskScore,
      readiness
    );

    const businessCase = {
      id: createId("business-case"),
      ideaId: clean(idea.id) || null,
      title: `دراسة جدوى أولية: ${title}`,
      executiveSummary:
        clean(idea.executiveSummary) ||
        `تقترح هذه المبادرة استخدام الذكاء الاصطناعي لمعالجة "${title}" من خلال تحليل البيانات، اكتشاف الأنماط، ودعم فرق العمل بتوصيات قابلة للمراجعة والاعتماد.`,

      problemStatement:
        clean(idea.problemStatement) ||
        clean(idea.summary) ||
        title,

      proposedSolution:
        clean(idea.proposedSolution) ||
        "حل مدعوم بالذكاء الاصطناعي لتحليل المشكلة، تحديد الأسباب المحتملة، واقتراح إجراءات تشغيلية قابلة للقياس.",

      aiRole:
        clean(idea.aiRole) ||
        "تحليل البيانات والحالات السابقة، اكتشاف الأنماط، ترتيب الأولويات، وتقديم توصيات مع إبقاء القرار النهائي للمختصين.",

      classification: {
        portfolio: classification.portfolio,
        department: classification.department,
        confidence: classification.confidence
      },

      ownership: {
        owner: owner.owner,
        stakeholders: normalizeArray(owner.stakeholders),
        implementationTeam: normalizeArray(
          owner.implementationTeam
        )
      },

      objectives: buildObjectives(idea),
      expectedBenefits: buildBenefits(idea),
      kpis,

      strategicValue,

      readiness: {
        score: readiness,
        level:
          readiness >= 75
            ? "مرتفعة"
            : readiness >= 50
              ? "متوسطة"
              : "منخفضة",
        note:
          readiness >= 75
            ? "الفكرة قريبة من الجاهزية للانتقال إلى دراسة تفصيلية."
            : "الفكرة تحتاج إلى استكمال المتطلبات قبل التنفيذ."
      },

      risk: {
        level: clean(risk.riskLevel) || "متوسط",
        score: normalizeNumber(risk.riskScore, 55, 0, 100),
        controls: normalizeArray(risk.controls),
        recommendation: clean(risk.recommendation),
        identifiedRisks: buildRisks(risk)
      },

      roadmap: clone(roadmap),

      assumptions: buildAssumptions(idea),
      dependencies: buildDependencies(idea),

      estimatedDuration:
        clean(idea.estimatedDuration) ||
        clean(roadmap.estimatedTimeline) ||
        "يحدد بعد الدراسة التفصيلية",

      estimatedCost:
        clean(idea.estimatedCost) ||
        "تقدير أولي يحتاج مراجعة مالية وفنية",

      decisionRecommendation:
        strategicValue.score >= 70 && risk.riskScore < 80
          ? "يوصى بالانتقال إلى دراسة تفصيلية أو مشروع تجريبي."
          : "يوصى باستكمال التقييم الفني والبيانات قبل اتخاذ قرار التنفيذ.",

      governance: {
        humanReviewRequired: true,
        generatedByAI: true,
        autoApprovalAllowed: false,
        requiresSecurityReview: true,
        requiresBusinessOwnerApproval: true
      },

      status: "draft",
      generatedAt: nowISO(),
      updatedAt: nowISO(),

      metadata: {
        moduleId: MODULE_ID,
        version: VERSION,
        sourceIdeaTitle: title,
        generatedFrom:
          clean(context.source) ||
          clean(idea.metadata?.source) ||
          "AI Idea Generator",
        context: clone(context)
      }
    };

    return clone(businessCase);
  }

  AIW.Extensions.IdeaBusinessCaseGenerator = {
    id: MODULE_ID,
    version: VERSION,
    generate,
    build: generate
  };

  console.info(
    `[AI Work] Idea Business Case Generator V${VERSION} ready`
  );
})(window);
