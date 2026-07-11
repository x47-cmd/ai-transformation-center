/* =========================================================
AI Work - Integration Orchestrator V1.0
Phase 8 Final

File:
js/extensions/integration/integration-orchestrator.js

Purpose
- Single entry point for all integration engines
- Coordinate execution order
- Trigger full synchronization
- Publish platform integration state
========================================================= */
(function(g){
"use strict";
g.AIW=g.AIW||{};
const AIW=g.AIW;
const VERSION="1.0.0";
const STORE_PATH="integration.orchestrator";

const ORDER=[
"IntegrationBootstrapManager",
"KPIAutoEngine",
"DashboardAutoSync",
"ReportsAutoBuilder",
"NotificationIntegrationEngine",
"ExecutiveTimelineEngine",
"SmartRecommendationEngine",
"IntegrationHealthMonitor",
"IntegrationTestSuite"
];

function set(path,val){AIW.Store?.set?.(path,val);}
function get(path){
 return AIW.Store?.getState?.()?.integration||{};
}

async function run(){
 const executed=[];

 for(const name of ORDER){
   const engine=AIW[name];
   if(!engine){executed.push({engine:name,status:"missing"});continue;}

   try{
     if(engine.boot) await engine.boot();
     else if(engine.build) await engine.build("orchestrator");
     else if(engine.sync) await engine.sync("orchestrator");
     else if(engine.run) await engine.run();
     else if(engine.start) await engine.start();

     executed.push({engine:name,status:"ok"});
   }catch(e){
     executed.push({
       engine:name,
       status:"error",
       message:e.message
     });
   }
 }

 const ok=executed.filter(x=>x.status=="ok").length;

 const result={
   version:VERSION,
   generatedAt:new Date().toISOString(),
   executed,
   total:executed.length,
   successful:ok,
   failed:executed.length-ok,
   readiness:Math.round((ok/executed.length)*100)
 };

 set(STORE_PATH,result);

 AIW.EventBus?.emit?.(
   "integration.orchestrator.completed",
   result,
   {
     source:"AIW.IntegrationOrchestrator",
     broadcast:true
   }
 );

 return result;
}

AIW.IntegrationOrchestrator={
 __version:VERSION,
 run,
 status:()=>get(STORE_PATH)
};

function boot(){
 if(!AIW.Store) return setTimeout(boot,100);
 run();
}
if(document.readyState==="loading"){
 document.addEventListener("DOMContentLoaded",boot,{once:true});
}else{
 boot();
}
})(window);
