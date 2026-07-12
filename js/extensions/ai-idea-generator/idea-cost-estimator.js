/* =========================================================
   AI Work - Idea Cost Estimator V1.0.0
   File Path:
   js/extensions/ai-idea-generator/idea-cost-estimator.js

   File 15 of 17

   Purpose:
   - Produce an explainable preliminary cost estimate
   - Estimate implementation effort by major cost categories
   - Output is advisory and requires financial review
========================================================= */

(function(window){
"use strict";

window.AIW=window.AIW||{};
AIW.Extensions=AIW.Extensions||{};

const VERSION="1.0.0";
const MODULE_ID="idea-cost-estimator";

function clean(v){return String(v??"").replace(/\s+/g," ").trim();}
function n(v,d=0){v=Number(v);return Number.isFinite(v)?v:d;}

const BASE={
 low:50000,
 medium:150000,
 high:400000
};

function level(readiness,risk){
 if(risk>=80) return "high";
 if(readiness>=70) return "low";
 return "medium";
}

function estimate(input={}){
 const readiness=n(input.readiness,45);
 const risk=n(input.riskScore,55);
 const complexity=n(input.complexityScore,60);

 const l=level(readiness,risk);

 let base=BASE[l];
 base*=1+(complexity-50)/100;

 const engineering=Math.round(base*0.35);
 const ai=Math.round(base*0.20);
 const integration=Math.round(base*0.15);
 const infrastructure=Math.round(base*0.10);
 const testing=Math.round(base*0.10);
 const training=Math.round(base*0.05);
 const contingency=Math.round(base*0.05);

 const total=engineering+ai+integration+infrastructure+testing+training+contingency;

 return{
   moduleId:MODULE_ID,
   version:VERSION,
   estimateLevel:l,
   currency:"AED",
   totalEstimatedCost:total,
   breakdown:{
     engineering,
     ai,
     integration,
     infrastructure,
     testing,
     training,
     contingency
   },
   assumptions:[
     "تقدير أولي غير ملزم.",
     "يحتاج مراجعة مالية.",
     "قد يتغير بعد دراسة الجدوى."
   ],
   recommendation:
     total>300000
       ?"يفضل التنفيذ على مراحل."
       :"يمكن البدء بمشروع تجريبي قبل التوسع.",
   generatedAt:new Date().toISOString()
 };
}

AIW.Extensions.IdeaCostEstimator={
 id:MODULE_ID,
 version:VERSION,
 estimate,
 generate:estimate
};

})();