/* =========================================================
AI Work - Integration Test Suite V1.0
Phase 8

File:
js/extensions/integration/integration-test-suite.js

Purpose
- Verify integration pipeline
- Save results into integration.tests
- Emit integration.tests.completed
========================================================= */
(function(g){
"use strict";
g.AIW=g.AIW||{};
const AIW=g.AIW;
const VERSION="1.0.0";
const PATH="integration.tests";

const CHECKS=[
["KPI","integration.kpis"],
["Dashboard","integration.dashboard"],
["Reports","integration.reports"],
["Notifications","integration.notifications"],
["Timeline","integration.timeline"],
["Recommendations","integration.recommendations"],
["Health","integration.health"]
];

function state(){return AIW.Store?.getState?AIW.Store.getState():{};}
function read(path){
 return path.split(".").reduce((o,k)=>o&&o[k],state());
}
function write(path,val){AIW.Store?.set?.(path,val);}

function run(){
 const tests=CHECKS.map(([name,path])=>{
   const data=read(path);
   return {
     name,
     path,
     passed:!!data,
     updatedAt:data?.generatedAt||data?.updatedAt||null,
     details:!!data?"OK":"Missing integration output"
   };
 });

 const passed=tests.filter(t=>t.passed).length;
 const score=Math.round((passed/tests.length)*100);

 const result={
   version:VERSION,
   generatedAt:new Date().toISOString(),
   score,
   passed,
   failed:tests.length-passed,
   status:score===100?"PASS":score>=80?"WARNING":"FAIL",
   tests
 };

 write(PATH,result);

 AIW.EventBus?.emit?.("integration.tests.completed",result,{
   source:"AIW.IntegrationTestSuite",
   broadcast:true
 });

 return result;
}

AIW.IntegrationTestSuite={
 __version:VERSION,
 run,
 get:()=>read(PATH)||{}
};

function boot(){
 if(!AIW.Store) return setTimeout(boot,100);
 run();
}
if(document.readyState==="loading"){
 document.addEventListener("DOMContentLoaded",boot,{once:true});
}else{boot();}
})(window);
