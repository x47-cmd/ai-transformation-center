/* =========================================================
AI Work - Integration Health Monitor V1.0
Phase 8 Enterprise Integration

File:
js/extensions/integration/integration-health-monitor.js

Purpose
- Monitor all integration engines
- Produce unified health snapshot
- Persist to integration.health
- Emit integration.health.updated
========================================================= */
(function(global){
"use strict";
global.AIW=global.AIW||{};
const AIW=global.AIW;
const VERSION="1.0.0";
const STORE_PATH="integration.health";

function getState(){
  return AIW.Store?.getState?AIW.Store.getState():{};
}
function get(path,fallback){
  return path.split(".").reduce((o,k)=>o&&o[k],getState())??fallback;
}
function set(path,val){
  AIW.Store?.set?.(path,val);
}
function exists(path){
  return get(path,null)!==null;
}
function engine(name,path){
  return {
    name,
    ready:exists(path),
    updatedAt:get(path+".generatedAt",get(path+".updatedAt",null))
  };
}
function score(list){
  const ok=list.filter(e=>e.ready).length;
  return Math.round((ok/list.length)*100);
}
function build(){
  const engines=[
    engine("EventBus","integration.events"),
    engine("KPI","integration.kpis"),
    engine("Dashboard","integration.dashboard"),
    engine("Reports","integration.reports"),
    engine("Notifications","integration.notifications"),
    engine("Timeline","integration.timeline"),
    engine("Recommendations","integration.recommendations")
  ];

  const healthScore=score(engines);

  const result={
    version:VERSION,
    generatedAt:new Date().toISOString(),
    healthScore,
    status:healthScore>=90?"excellent":healthScore>=70?"healthy":healthScore>=50?"warning":"critical",
    engines,
    readyEngines:engines.filter(x=>x.ready).length,
    totalEngines:engines.length
  };

  set(STORE_PATH,result);

  AIW.EventBus?.emit?.("integration.health.updated",result,{
    source:"AIW.IntegrationHealthMonitor",
    broadcast:true
  });

  return result;
}

AIW.IntegrationHealthMonitor={
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
