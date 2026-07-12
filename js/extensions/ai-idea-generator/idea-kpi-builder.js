/* =========================================================
   AI Work - KPI Builder V1.0.0
   File Path:
   js/extensions/ai-idea-generator/idea-kpi-builder.js

   File 9 of 17

   Purpose:
   - Generate suggested KPIs based on idea category
========================================================= */

(function(window){
"use strict";

window.AIW = window.AIW || {};
AIW.Extensions = AIW.Extensions || {};

const KPI_LIBRARY = {
  "الأنظمة البيومترية":[
    "دقة المطابقة (%)",
    "انخفاض التسجيلات الخاطئة (%)",
    "زمن التحقق (ثانية)"
  ],
  "البوابات الذكية":[
    "متوسط زمن العبور",
    "نسبة نجاح المرور",
    "عدد الأعطال"
  ],
  "المستخدمون والصلاحيات":[
    "زمن منح الصلاحية",
    "عدد تعارضات الصلاحيات",
    "طلبات الصلاحيات المنجزة"
  ],
  "الأمن الرقمي":[
    "عدد الإنذارات الحرجة",
    "زمن الاستجابة",
    "عدد الحوادث الأمنية"
  ],
  "التحليلات والتقارير التنفيذية":[
    "دقة المؤشرات",
    "زمن تحديث اللوحات",
    "نسبة اكتمال البيانات"
  ]
};

function build(portfolio){
  const key = String(portfolio || "").trim();
  return {
    portfolio:key,
    kpis: KPI_LIBRARY[key] || [
      "تحسين الكفاءة",
      "رفع جودة الخدمة",
      "تقليل زمن التنفيذ"
    ]
  };
}

AIW.Extensions.IdeaKPIBuilder = {
  id:"idea-kpi-builder",
  version:"1.0.0",
  build
};

})(window);
