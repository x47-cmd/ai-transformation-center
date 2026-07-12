/* =========================================================
   AI Work - Idea Similarity Engine V1.0.0
   File Path:
   js/extensions/ai-idea-generator/idea-similarity.js

   File 5 of 17

   Purpose:
   - Detect similar AI opportunities
   - Prevent duplicate ideas
========================================================= */

(function(window){
"use strict";

window.AIW = window.AIW || {};
AIW.Extensions = AIW.Extensions || {};

function clean(v){
  return String(v ?? "").toLowerCase().replace(/\s+/g," ").trim();
}

function tokenize(text){
  return clean(text)
    .split(/[\s,.;:!?؟،\-_/]+/)
    .filter(Boolean);
}

function similarity(a,b){

  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));

  if(!ta.size || !tb.size) return 0;

  let common = 0;

  ta.forEach(word=>{
    if(tb.has(word)) common++;
  });

  const score = common / Math.max(ta.size,tb.size);

  return Number((score*100).toFixed(1));

}

function find(problem, ideas=[]){

  const result = ideas.map(item=>{

    const score = similarity(
      problem,
      item.title || item.problem || ""
    );

    return{
      id:item.id || null,
      title:item.title || "",
      similarity:score
    };

  })
  .sort((a,b)=>b.similarity-a.similarity);

  const best = result[0] || null;

  return{

    duplicate:
      best ? best.similarity >= 75 : false,

    highestSimilarity:
      best ? best.similarity : 0,

    matchedIdea:
      best,

    matches:
      result

  };

}

AIW.Extensions.IdeaSimilarity={

  id:"idea-similarity",

  version:"1.0.0",

  similarity,

  find

};

})(window);
