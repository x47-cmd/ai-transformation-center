/* =========================================================
   AI Work - Idea ROI Estimator V1.0.0
   File Path:
   js/extensions/ai-idea-generator/idea-roi-estimator.js

   File 16 of 17

   Purpose:
   - Estimate expected business value and ROI
   - Advisory calculations for executive planning
========================================================= */

(function(window){
"use strict";

window.AIW=window.AIW||{};
AIW.Extensions=AIW.Extensions||{};

const VERSION="1.0.0";
const MODULE_ID="idea-roi-estimator";

function num(v,d=0){
  v=Number(v);
  return Number.isFinite(v)?v:d;
}

function estimate(input={}){

  const cost=num(input.totalEstimatedCost||input.cost,150000);

  const annualSaving=num(input.annualSaving,cost*0.45);
  const annualRevenue=num(input.annualRevenue,0);
  const annualAvoidedLoss=num(input.annualAvoidedLoss,cost*0.20);

  const yearlyBenefit=
    annualSaving+
    annualRevenue+
    annualAvoidedLoss;

  const roi=((yearlyBenefit-cost)/cost)*100;

  const paybackMonths=
    yearlyBenefit>0
      ? Math.round((cost/yearlyBenefit)*12)
      : null;

  let rating="منخفض";
  if(roi>=100) rating="مرتفع";
  else if(roi>=35) rating="متوسط";

  return{
    moduleId:MODULE_ID,
    version:VERSION,
    currency:"AED",

    investmentCost:Math.round(cost),

    yearlyBenefit:Math.round(yearlyBenefit),

    annualSaving:Math.round(annualSaving),

    annualRevenue:Math.round(annualRevenue),

    annualAvoidedLoss:Math.round(annualAvoidedLoss),

    roiPercent:Number(roi.toFixed(1)),

    paybackMonths,

    rating,

    executiveRecommendation:
      roi>=35
        ?"يوصى بالانتقال للدراسة التفصيلية."
        :"يوصى بإعادة تقييم الفوائد أو تقليل التكلفة.",

    assumptions:[
      "الأرقام تقديرية.",
      "لا تعتبر دراسة مالية نهائية.",
      "تحتاج مراجعة الإدارة المالية."
    ],

    generatedAt:new Date().toISOString()
  };

}

AIW.Extensions.IdeaROIEstimator={
  id:MODULE_ID,
  version:VERSION,
  estimate,
  generate:estimate
};

})(window);
