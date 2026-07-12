/* =========================================================
   AI Work - Idea Decision Engine V1.0.1
   File Path:
   js/extensions/ai-idea-generator/idea-decision-engine.js

   File 17 of 17

   Purpose:
   - Aggregate outputs from all AI Idea Generator engines
   - Produce the final executive recommendation
   - Human approval remains mandatory

   V1.0.1 Fix:
   - Correctly passes window into the IIFE
   - Registers the engine under AIW.Extensions.IdeaDecisionEngine
   - Adds AIW.IdeaDecisionEngine compatibility alias
   - Uses nullish fallback instead of || for numeric zero values
========================================================= */

(function (window) {
  "use strict";

  window.AIW = window.AIW || {};
  AIW.Extensions = AIW.Extensions || {};

  const VERSION = "1.0.1";
  const MODULE_ID = "idea-decision-engine";

  function toNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function decide(input = {}) {
    const readiness = clamp(
      toNumber(
        input.readinessScore ??
        input.readiness?.score,
        45
      ),
      0,
      100
    );

    const risk = clamp(
      toNumber(
        input.riskScore ??
        input.risk?.score,
        55
      ),
      0,
      100
    );

    const roi = toNumber(
      input.roiPercent ??
      input.roi?.roiPercent,
      0
    );

    const strategic = clamp(
      toNumber(
        input.strategicScore ??
        input.strategicValue?.score,
        60
      ),
      0,
      100
    );

    const normalizedROI = clamp(roi, 0, 150) / 1.5;

    const confidenceScore = Math.round(
      readiness * 0.35 +
      (100 - risk) * 0.25 +
      normalizedROI * 0.20 +
      strategic * 0.20
    );

    let decisionCode = "NEEDS_REVIEW";
    let decisionLabel = "يحتاج مراجعة";

    if (risk >= 85) {
      decisionCode = "REJECT";
      decisionLabel = "رفض مبدئي";
    } else if (
      readiness >= 85 &&
      roi >= 40 &&
      strategic >= 70
    ) {
      decisionCode = "APPROVE";
      decisionLabel = "اعتماد";
    } else if (
      readiness >= 65 &&
      roi >= 20
    ) {
      decisionCode = "APPROVE_PILOT";
      decisionLabel = "اعتماد مشروع تجريبي";
    }

    const reasons = [];

    if (readiness < 60) {
      reasons.push("الجاهزية أقل من المستوى المطلوب.");
    }

    if (risk >= 70) {
      reasons.push("مستوى المخاطر مرتفع ويحتاج إلى معالجة.");
    }

    if (roi < 20) {
      reasons.push("العائد المتوقع يحتاج إلى تحسين أو مراجعة.");
    }

    if (strategic < 60) {
      reasons.push("القيمة الاستراتيجية متوسطة أو منخفضة.");
    }

    if (!reasons.length) {
      reasons.push(
        "جميع المؤشرات الرئيسية ضمن الحدود المقبولة."
      );
    }

    const nextStep =
      decisionCode === "APPROVE"
        ? "استكمال الاعتماد البشري ثم إنشاء المشروع وربطه بالفكرة."
        : decisionCode === "APPROVE_PILOT"
          ? "بدء مشروع تجريبي محدود ثم إعادة التقييم قبل التوسع."
          : decisionCode === "REJECT"
            ? "إغلاق الفكرة أو إعادة صياغتها بعد معالجة المخاطر."
            : "استكمال المتطلبات الناقصة وإعادة التقييم.";

    return {
      moduleId: MODULE_ID,
      version: VERSION,

      decisionCode,
      decisionLabel,
      confidenceScore,

      readinessScore: readiness,
      riskScore: risk,
      roiPercent: roi,
      strategicScore: strategic,

      reasons,

      requiredApprovals: [
        "Business Owner",
        "Technical Review",
        "Security Review",
        "Executive Approval"
      ],

      nextStep,

      governance: {
        humanApprovalRequired: true,
        autoProjectCreation: false,
        executiveReviewRequired: true,
        generatedByAI: true,
        finalDecision: false
      },

      generatedAt: new Date().toISOString()
    };
  }

  const api = {
    id: MODULE_ID,
    version: VERSION,
    decide,
    generate: decide
  };

  AIW.Extensions.IdeaDecisionEngine = api;

  // Compatibility alias for any code that reads directly from AIW.
  AIW.IdeaDecisionEngine = api;

  console.info(
    `[AI Work] Idea Decision Engine V${VERSION} ready`
  );
})(window);
