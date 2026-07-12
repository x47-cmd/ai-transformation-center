/* =========================================================
   AI Work - Idea Cost Estimator V1.0.1
   File Path:
   js/extensions/ai-idea-generator/idea-cost-estimator.js

   File 15 of 17

   Purpose:
   - Produce an explainable preliminary cost estimate
   - Estimate implementation effort by major cost categories
   - Output is advisory and requires financial review

   V1.0.1 Fix:
   - Correctly passes window into the IIFE
   - Registers the engine under AIW.Extensions.IdeaCostEstimator
   - Adds AIW.IdeaCostEstimator compatibility alias
========================================================= */

(function (window) {
  "use strict";

  window.AIW = window.AIW || {};
  AIW.Extensions = AIW.Extensions || {};

  const VERSION = "1.0.1";
  const MODULE_ID = "idea-cost-estimator";

  function toNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  const BASE_COSTS = Object.freeze({
    low: 50000,
    medium: 150000,
    high: 400000
  });

  function resolveEstimateLevel(readiness, risk) {
    if (risk >= 80) return "high";
    if (readiness >= 70) return "low";
    return "medium";
  }

  function estimate(input = {}) {
    const readiness = clamp(
      toNumber(
        input.readiness ??
        input.readinessScore,
        45
      ),
      0,
      100
    );

    const risk = clamp(
      toNumber(
        input.riskScore ??
        input.risk,
        55
      ),
      0,
      100
    );

    const complexity = clamp(
      toNumber(
        input.complexityScore ??
        input.complexity,
        60
      ),
      0,
      100
    );

    const estimateLevel = resolveEstimateLevel(
      readiness,
      risk
    );

    let base = BASE_COSTS[estimateLevel];

    /*
      Complexity adjustment:
      - Complexity 50 = base cost
      - Lower than 50 reduces the base
      - Higher than 50 increases the base
    */
    base *= 1 + (complexity - 50) / 100;
    base = Math.max(25000, base);

    const engineering = Math.round(base * 0.35);
    const ai = Math.round(base * 0.20);
    const integration = Math.round(base * 0.15);
    const infrastructure = Math.round(base * 0.10);
    const testing = Math.round(base * 0.10);
    const training = Math.round(base * 0.05);
    const contingency = Math.round(base * 0.05);

    const totalEstimatedCost =
      engineering +
      ai +
      integration +
      infrastructure +
      testing +
      training +
      contingency;

    return {
      moduleId: MODULE_ID,
      version: VERSION,

      estimateLevel,
      currency: "AED",
      totalEstimatedCost,

      breakdown: {
        engineering,
        ai,
        integration,
        infrastructure,
        testing,
        training,
        contingency
      },

      inputs: {
        readiness,
        riskScore: risk,
        complexityScore: complexity
      },

      assumptions: [
        "التقدير أولي وغير ملزم.",
        "يتطلب مراجعة مالية وفنية قبل الاعتماد.",
        "قد تتغير التكلفة بعد دراسة الجدوى التفصيلية.",
        "لا يشمل التقدير أي تكاليف غير معروفة أو عقود خارجية غير محددة."
      ],

      recommendation:
        totalEstimatedCost > 300000
          ? "يفضل تنفيذ المبادرة على مراحل تبدأ بمشروع تجريبي محدود."
          : "يمكن البدء بمشروع تجريبي قبل التوسع الكامل.",

      governance: {
        humanReviewRequired: true,
        financialApprovalRequired: true,
        generatedByAI: true,
        finalEstimate: false
      },

      generatedAt: new Date().toISOString()
    };
  }

  const api = {
    id: MODULE_ID,
    version: VERSION,
    estimate,
    generate: estimate
  };

  AIW.Extensions.IdeaCostEstimator = api;

  // Compatibility alias for any code that reads directly from AIW.
  AIW.IdeaCostEstimator = api;

  console.info(
    `[AI Work] Idea Cost Estimator V${VERSION} ready`
  );
})(window);
