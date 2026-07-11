/* =========================================================
AI Work - Integration Bootstrap Manager V1.0
Phase 8

File:
js/extensions/integration/integration-bootstrap-manager.js

Purpose
- Start integration engines in dependency order
- Verify availability
- Publish bootstrap state
========================================================= */
(function(g){
"use strict";
g.AIW=g.AIW||{};
const AIW=g.AIW;
const VERSION="1.0.0";
const STORE_PATH="integration.bootstrap";

const ENGINES=[
 ["EventBus",()=>AIW.EventBus],
 ["IntegrationCore",()=>AIW.IntegrationCore],
 ["KPIAutoEngine",()=>AIW.KPIAutoEngine],
 ["DashboardAutoSync",()=>AIW.DashboardAutoSync],
 ["ReportsAutoBuilder",()=>AIW.ReportsAutoBuilder],
 ["NotificationIntegrationEngine",()=>AIW.NotificationIntegrationEngine],
 ["ExecutiveTimelineEngine",()=>AIW.ExecutiveTimelineEngine],
 ["SmartRecommendationEngine",()=>AIW.SmartRecommendationEngine],
 ["IntegrationHealthMonitor",()=>AIW.IntegrationHealthMonitor],
 ["IntegrationTestSuite",()=>AIW.IntegrationTestSuite]
];

function set(path,val){AIW.Store?.set?.(path,val);}

function boot(){
 const engines=ENGINES.map(([name,getter])=>{
   const ref=getter();
   let started=false;
   try{
     if(ref?.start){ref.start(); started=true;}
     else if(ref){started=true;}
   }catch(e){}
   return {name,available:!!ref,started};
 });

 const ready=engines.filter(e=>e.available).length;
 const result={
   version:VERSION,
   generatedAt:new Date().toISOString(),
   engines,
   ready,
   total:engines.length,
   readiness:Math.round((ready/engines.length)*100)
 };

 set(STORE_PATH,result);

 AIW.EventBus?.emit?.("integration.bootstrap.completed",result,{
   source:"AIW.IntegrationBootstrapManager",
   broadcast:true
 });

 return result;
}

AIW.IntegrationBootstrapManager={
 __version:VERSION,
 boot
};

function wait(){
 if(!AIW.Store) return setTimeout(wait,100);
 boot();
}
if(document.readyState==="loading"){
 document.addEventListener("DOMContentLoaded",wait,{once:true});
}else{wait();}
})(window);
