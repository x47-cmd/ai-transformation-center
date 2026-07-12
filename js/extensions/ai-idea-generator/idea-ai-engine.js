/* =========================================================
   AI Work - AI Idea Engine V1.0.0
   File Path:
   js/extensions/ai-idea-generator/idea-ai-engine.js

   File 4 of 17

   Purpose:
   - Generate a complete AI opportunity draft
   - Uses Prompt Builder + Validator when available
   - Returns a normalized opportunity object
========================================================= */

(function (window) {
  "use strict";

  window.AIW = window.AIW || {};
  AIW.Extensions = AIW.Extensions || {};

  const VERSION = "1.0.0";

  function clean(v){
    return String(v ?? "").replace(/\s+/g," ").trim();
  }

  function title(problem){
    const t = clean(problem);
    return t.startsWith("حل")
      ? t
      : "حل ذكي لـ " + t;
  }

  function build(problem, context = {}) {

    const validator = AIW.Extensions.IdeaValidator;
    const promptBuilder = AIW.Extensions.IdeaPromptBuilder;

    const validation = validator
      ? validator.validate(problem)
      : { valid:true, inScope:true };

    if(!validation.valid){
      return {
        success:false,
        reason:validation.message,
        validation
      };
    }

    const prompt = promptBuilder
      ? promptBuilder.build(problem, context)
      : null;

    return {

      success:true,

      prompt,

      draft:{

        title:title(problem),

        summary:
          "فرصة مقترحة تم توليدها تلقائياً بواسطة AI Work.",

        problemStatement:clean(problem),

        proposedSolution:
          "استخدام الذكاء الاصطناعي لتحليل البيانات، اكتشاف الأنماط، وتقليل الأخطاء التشغيلية.",

        aiRole:
          "تحليل البيانات، اكتشاف الأسباب، ترتيب الأولويات، واقتراح أفضل الحلول.",

        expectedBenefits:[
          "رفع الكفاءة",
          "تقليل الأخطاء",
          "تسريع اتخاذ القرار"
        ],

        priority:"متوسطة",

        riskLevel:"متوسط",

        readiness:45,

        decisionScore:50,

        estimatedDuration:"6-12 أسبوع",

        estimatedCost:"يحدد بعد الدراسة",

        kpis:[
          "تقليل الأخطاء",
          "رفع جودة الخدمة",
          "تقليل زمن المعالجة"
        ],

        implementationPhases:[
          "تحليل",
          "تصميم",
          "تطوير",
          "اختبار",
          "تشغيل"
        ],

        requirements:[
          "توفر البيانات",
          "اعتماد الجهة المالكة"
        ],

        recommendations:[
          "إجراء دراسة جدوى",
          "تنفيذ مشروع تجريبي"
        ],

        metadata:{
          version:VERSION,
          generatedBy:"AI Idea Engine"
        }

      }

    };

  }

  AIW.Extensions.IdeaAIEngine = {

    id:"idea-ai-engine",

    version:VERSION,

    generate:build,

    analyze:build

  };

})(window);
