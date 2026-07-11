/* =========================================================
 AI Work - Smart Recommendation Integration Engine V1.0
 Phase 8 - Enterprise Integration Layer

 File:
 js/extensions/integration/smart-recommendation-engine.js

 Purpose
 - Read unified integration models
 - Generate executive recommendations
 - Persist to integration.recommendations
 - Publish recommendation.updated events
 - No UI changes required
========================================================= */

(function (global) {
"use strict";

global.AIW = global.AIW || {};
const AIW = global.AIW;

const VERSION="1.0.0";
const STORE_PATH="integration.recommendations";

function state(){
  if(AIW.Store?.getState) return AIW.Store.getState();
  return {};
}
function get(path,fallback){
  return path.split(".").reduce((o,k)=>o&&o[k],state()) ?? fallback;
}
function set(path,val){
  if(AIW.Store?.set) AIW.Store.set(path,val);
}

function build(){
  const kpis=get("integration.kpis",{});
  const dash=get("integration.dashboard",{});
  const report=get("integration.reports",{});

  const rec=[];

  const hp=Number(dash?.headline?.platformHealth||0);
  const prog=Number(dash?.headline?.averageProgress||0);
  const ready=Number(dash?.headline?.averageReadiness||0);

  if(hp<70){
    rec.push({
      id:"platform-health",
      priority:"high",
      area:"Platform",
      title:"رفع صحة المنصة",
      recommendation:"راجع المشاريع عالية المخاطر والتنبيهات المفتوحة."
    });
  }

  if(prog<60){
    rec.push({
      id:"progress",
      priority:"high",
      area:"Projects",
      title:"تسريع التنفيذ",
      recommendation:"ركز على المشاريع ذات أقل نسبة تقدم وأنهِ المهام الحرجة أولاً."
    });
  }

  if(ready<70){
    rec.push({
      id:"readiness",
      priority:"high",
      area:"Projects",
      title:"رفع الجاهزية",
      recommendation:"استكمال المتطلبات والملاك والجداول الزمنية قبل بدء التنفيذ."
    });
  }

  (report.recommendations||[]).forEach((r,i)=>{
    rec.push({
      id:"report-"+i,
      priority:r.priority||"medium",
      area:"Executive",
      title:r.title,
      recommendation:r.action
    });
  });

  const result={
    version:VERSION,
    generatedAt:new Date().toISOString(),
    total:rec.length,
    recommendations:rec,
    source:{
      dashboard:!!dash.generatedAt,
      reports:!!report.generatedAt,
      kpis:!!kpis.calculatedAt
    }
  };

  set(STORE_PATH,result);

  AIW.EventBus?.emit?.("recommendations.updated",result,{
    source:"AIW.SmartRecommendationEngine",
    broadcast:true
  });

  return result;
}

AIW.SmartRecommendationEngine={
  __version:VERSION,
  build,
  get:()=>get(STORE_PATH,{})
};

function boot(){
  if(!AIW.Store) return setTimeout(boot,100);
  build();
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",boot,{once:true});
}else{
  boot();
}

})(window);
