/* =========================================================
 AI Work - Idea Validator V1.0.0
 File: js/extensions/ai-idea-generator/idea-validator.js
 File 3 of 17
========================================================= */
(function(window){
"use strict";
window.AIW=window.AIW||{};
AIW.Extensions=AIW.Extensions||{};

const SCOPE=[
"بصمة","بيومتري","بيومترية","وجه","قزحية","بوابة","بوابات",
"صلاحية","صلاحيات","هوية","تسجيل","مسافر","مطار","أمن",
"تحقق","Face","Iris","Fingerprint","Gate","Access"
];

function clean(v){
 return String(v??"").replace(/\s+/g," ").trim();
}

function score(text){
 const t=clean(text).toLowerCase();
 let hits=0;
 SCOPE.forEach(k=>{
   if(t.includes(k.toLowerCase())) hits++;
 });
 return Math.min(100,hits*10);
}

function validate(problem){
 const text=clean(problem);
 const errors=[];
 if(!text) errors.push("EMPTY_INPUT");
 if(text.length<8) errors.push("INPUT_TOO_SHORT");

 const domainScore=score(text);
 const inScope=domainScore>=10;

 return{
   valid:errors.length===0 && inScope,
   inScope,
   domainScore,
   errors,
   message: inScope
      ? "المشكلة ضمن نطاق AI Work."
      : "المشكلة خارج نطاق المنصة المتخصصة.",
   suggestion: inScope
      ? "يمكن إرسالها لمحركات التحليل."
      : "يرجى إدخال تحدٍ يتعلق بالأنظمة البيومترية أو البوابات الذكية أو الصلاحيات أو الأمن الرقمي."
 };
}

AIW.Extensions.IdeaValidator={
 id:"idea-validator",
 version:"1.0.0",
 validate,
 score
};

})(window);
