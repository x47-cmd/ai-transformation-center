/* =========================================================
   AI Work - Idea Decision Engine V1.0.0
   File Path:
   js/extensions/ai-idea-generator/idea-decision-engine.js

   File 17 of 17

   Purpose:
   - Aggregate outputs from all AI Idea Generator engines
   - Produce the final executive recommendation
   - Human approval remains mandatory
========================================================= */

(function(window){
"use strict";

window.AIW=window.AIW||{};
AIW.Extensions=AIW.Extensions||{};

const VERSION="1.0.0";
const MODULE_ID="idea-decision-engine";

function num(v,d=0){
  v=Number(v);
  return Number.isFinite(v)?v:d;
}

function txt(v){
  return String(v??"").trim();
}

function decide(input={}){

  const readiness=num(input.readinessScore||input.readiness?.score,45);
  const risk=num(input.riskScore||input.risk?.score,55);
  const roi=num(input.roiPercent||input.roi?.roiPercent,0);
  const strategic=num(input.strategicScore||input.strategicValue?.score,60);

  const confidence=Math.round(
      readiness*0.35+
      (100-risk)*0.25+
      Math.min(Math.max(roi,0),150)/1.5*0.20+
      strategic*0.20
  );

  let decision="NEEDS_REVIEW";
  let label="يحتاج مراجعة";

  if(risk>=85){
      decision="REJECT";
      label="رفض مبدئي";
  }else if(readiness>=85 && roi>=40 && strategic>=70){
      decision="APPROVE";
      label="اعتماد";
  }else if(readiness>=65 && roi>=20){
      decision="APPROVE_PILOT";
      label="اعتماد مشروع تجريبي";
  }

  const reasons=[];

  if(readiness<60)
      reasons.push("الجاهزية أقل من المستوى المطلوب.");

  if(risk>=70)
      reasons.push("مستوى المخاطر مرتفع ويحتاج معالجة.");

  if(roi<20)
      reasons.push("العائد المتوقع يحتاج تحسين.");

  if(strategic<60)
      reasons.push("القيمة الاستراتيجية متوسطة أو منخفضة.");

  if(!reasons.length)
      reasons.push("جميع المؤشرات الرئيسية ضمن الحدود المقبولة.");

  return{

    moduleId:MODULE_ID,
    version:VERSION,

    decisionCode:decision,
    decisionLabel:label,

    confidenceScore:confidence,

    readinessScore:readiness,
    riskScore:risk,
    roiPercent:roi,
    strategicScore:strategic,

    reasons,

    requiredApprovals:[
      "Business Owner",
      "Technical Review",
      "Security Review",
      "Executive Approval"
    ],

    nextStep:
      decision==="APPROVE"
        ?"إنشاء المشروع وربطه بالفكرة."
      :decision==="APPROVE_PILOT"
        ?"بدء Pilot ثم إعادة التقييم."
      :decision==="REJECT"
        ?"إغلاق الفكرة أو إعادة صياغتها."
      :"استكمال المتطلبات وإعادة التقييم.",

    governance:{
      humanApprovalRequired:true,
      autoProjectCreation:false,
      executiveReviewRequired:true
    },

    generatedAt:new Date().toISOString()

  };

}

AIW.Extensions.IdeaDecisionEngine={
  id:MODULE_ID,
  version:VERSION,
  decide,
  generate:decide
};

})();