/* =========================================================
   AI Work - AI Prompt Builder V1.0.0
   File Path:
   js/extensions/ai-idea-generator/idea-prompt-builder.js

   Purpose:
   - File 2 of 17
   - Builds structured AI prompts from a short problem statement.
   - Keeps prompts restricted to AI Work scope.
========================================================= */

(function (window) {
  "use strict";

  window.AIW = window.AIW || {};
  AIW.Extensions = AIW.Extensions || {};

  const DOMAIN = [
    "الأنظمة البيومترية",
    "البوابات الذكية",
    "المستخدمون والصلاحيات",
    "الأمن الرقمي",
    "التحليلات التنفيذية"
  ];

  function clean(v){
    return String(v ?? "").replace(/\s+/g," ").trim();
  }

  function build(problem, context = {}){
    const text = clean(problem);

    return {
      systemRole:
        "أنت محلل مبادرات ذكاء اصطناعي متخصص في الأنظمة البيومترية فقط.",
      scope: DOMAIN,
      objective:
        "حوّل المشكلة إلى فرصة ذكاء اصطناعي تنفيذية مع اقتراح حل عملي.",
      input:{
        problem:text,
        department:clean(context.department),
        portfolio:clean(context.portfolio)
      },
      expectedOutput:[
        "title",
        "summary",
        "problemStatement",
        "rootCauses",
        "proposedSolution",
        "aiRole",
        "expectedBenefits",
        "priority",
        "riskLevel",
        "readiness",
        "kpis",
        "implementationPhases",
        "requirements",
        "recommendations"
      ],
      rules:[
        "لا تخرج عن نطاق الأنظمة البيومترية.",
        "إذا كانت المشكلة خارج النطاق أعد حالة OUT_OF_SCOPE.",
        "اقترح حلولاً قابلة للمراجعة البشرية.",
        "لا تعتمد الفكرة تلقائياً."
      ]
    };
  }

  AIW.Extensions.IdeaPromptBuilder = {
    id:"idea-prompt-builder",
    version:"1.0.0",
    build
  };

})(window);
