/* =========================================================
   AI Work - Idea Classifier V1.0.0
   File Path:
   js/extensions/ai-idea-generator/idea-classifier.js

   File 7 of 17

   Purpose:
   - Automatically classify generated ideas
   - Assign department and portfolio
========================================================= */

(function(window){
"use strict";

window.AIW=window.AIW||{};
AIW.Extensions=AIW.Extensions||{};

const RULES=[
{
 portfolio:"الأنظمة البيومترية",
 department:"الأنظمة البيومترية",
 keywords:["بصمة","وجه","قزحية","بيومتري","تسجيل"]
},
{
 portfolio:"البوابات الذكية",
 department:"البوابات الذكية",
 keywords:["بوابة","بوابات","Gate","مسافر","عبور"]
},
{
 portfolio:"المستخدمون والصلاحيات",
 department:"المستخدمون والصلاحيات",
 keywords:["صلاحية","صلاحيات","هوية","مستخدم","Access"]
},
{
 portfolio:"الأمن الرقمي",
 department:"الأمن الرقمي",
 keywords:["أمن","اختراق","تهديد","سيبراني","Cyber"]
},
{
 portfolio:"التحليلات والتقارير التنفيذية",
 department:"التحليلات والتقارير التنفيذية",
 keywords:["تحليل","تقارير","لوحة","KPI","Dashboard"]
}
];

function clean(v){
 return String(v??"").toLowerCase().trim();
}

function classify(text){

 const value=clean(text);

 let best={
   portfolio:"الأنظمة البيومترية",
   department:"الأنظمة البيومترية",
   confidence:40
 };

 RULES.forEach(rule=>{

   let score=0;

   rule.keywords.forEach(k=>{
      if(value.includes(clean(k))) score+=20;
   });

   if(score>best.confidence){
      best={
        portfolio:rule.portfolio,
        department:rule.department,
        confidence:Math.min(score,100)
      };
   }

 });

 return best;

}

AIW.Extensions.IdeaClassifier={
 id:"idea-classifier",
 version:"1.0.0",
 classify
};

})(window);
