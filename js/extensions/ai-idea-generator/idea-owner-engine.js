/* =========================================================
   AI Work - Idea Owner Engine V1.0.0
   File Path:
   js/extensions/ai-idea-generator/idea-owner-engine.js

   File 10 of 17

   Purpose:
   - Suggest owner, stakeholders and implementation team
========================================================= */

(function(window){
"use strict";

window.AIW = window.AIW || {};
AIW.Extensions = AIW.Extensions || {};

const MAP = {
  "الأنظمة البيومترية":{
    owner:"فريق الأنظمة البيومترية",
    stakeholders:["العمليات","الدعم الفني"],
    team:["مهندس أنظمة","محلل بيانات","QA"]
  },
  "البوابات الذكية":{
    owner:"فريق البوابات الذكية",
    stakeholders:["العمليات","الصيانة"],
    team:["مهندس بوابات","محلل أعمال","QA"]
  },
  "المستخدمون والصلاحيات":{
    owner:"فريق الهوية والصلاحيات",
    stakeholders:["الموارد البشرية","الدعم"],
    team:["IAM Specialist","Security Analyst"]
  },
  "الأمن الرقمي":{
    owner:"فريق الأمن الرقمي",
    stakeholders:["SOC","إدارة المخاطر"],
    team:["Security Engineer","SOC Analyst"]
  },
  "التحليلات والتقارير التنفيذية":{
    owner:"فريق التحليلات",
    stakeholders:["الإدارة التنفيذية"],
    team:["Data Analyst","Power BI Developer"]
  }
};

function assign(portfolio){
  const key = String(portfolio||"").trim();
  const data = MAP[key] || {
    owner:"يحدد لاحقاً",
    stakeholders:["الإدارة"],
    team:["Project Manager"]
  };

  return {
    portfolio:key,
    owner:data.owner,
    stakeholders:[...data.stakeholders],
    implementationTeam:[...data.team]
  };
}

AIW.Extensions.IdeaOwnerEngine = {
  id:"idea-owner-engine",
  version:"1.0.0",
  assign
};

})(window);
