/* =========================================================
   AI Work - Idea Risk Engine V1.0.0
   File Path:
   js/extensions/ai-idea-generator/idea-risk-engine.js

   File 8 of 17
========================================================= */

(function(window){
"use strict";

window.AIW=window.AIW||{};
AIW.Extensions=AIW.Extensions||{};

const HIGH=["اختراق","تعطل","فشل","تسريب","هوية","انتحال"];
const MEDIUM=["تأخير","ازدحام","بطء","خطأ","جودة"];
const LOW=["تحسين","تطوير","لوحة","تقرير"];

function clean(v){
 return String(v??"").toLowerCase();
}

function contains(list,text){
 return list.some(k=>text.includes(clean(k)));
}

function analyze(problem){
 const t=clean(problem);

 let riskLevel="منخفض";
 let score=25;
 let controls=[];

 if(contains(HIGH,t)){
   riskLevel="مرتفع";
   score=85;
   controls=[
     "مراجعة أمنية",
     "اختبار شامل",
     "اعتماد الإدارة"
   ];
 }else if(contains(MEDIUM,t)){
   riskLevel="متوسط";
   score=55;
   controls=[
     "Pilot",
     "مراجعة تشغيلية"
   ];
 }else if(contains(LOW,t)){
   riskLevel="منخفض";
   score=20;
   controls=[
     "مراجعة اعتيادية"
   ];
 }

 return{
   riskLevel,
   riskScore:score,
   controls,
   recommendation:
     score>=80
      ?"تنفيذ على مراحل."
      :"يمكن المتابعة بعد المراجعة."
 };

}

AIW.Extensions.IdeaRiskEngine={
 id:"idea-risk-engine",
 version:"1.0.0",
 analyze
};

})(window);
