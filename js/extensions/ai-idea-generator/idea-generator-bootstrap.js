/* =========================================================
   AI Work - Idea Generator Bootstrap V1.0.0
   File Path:
   js/extensions/ai-idea-generator/idea-generator-bootstrap.js

   File 6 of 17

   Purpose:
   - Register Phase 1 engines with IdeaGenerator
   - Bootstrap AI Idea Generator safely
========================================================= */

(function (window) {
  "use strict";

  window.AIW = window.AIW || {};
  AIW.Extensions = AIW.Extensions || {};

  function get(name){
    return window.AIW?.Extensions?.[name];
  }

  function bootstrap(){

    const generator = window.AIW?.IdeaGenerator;

    if(!generator){
      console.warn("[AI Work] IdeaGenerator not loaded.");
      return false;
    }

    const engines = [
      {
        id:"validator",
        ref:get("IdeaValidator"),
        order:10,
        required:true,
        run(payload){
          return this.ref.validate(payload.problemText);
        }
      },
      {
        id:"prompt-builder",
        ref:get("IdeaPromptBuilder"),
        order:20,
        run(payload){
          return {
            prompt:this.ref.build(
              payload.problemText,
              payload.context
            )
          };
        }
      },
      {
        id:"ai-engine",
        ref:get("IdeaAIEngine"),
        order:30,
        required:true,
        run(payload){
          const result=this.ref.generate(
            payload.problemText,
            payload.context
          );
          return result.success ? result.draft : result;
        }
      },
      {
        id:"similarity",
        ref:get("IdeaSimilarity"),
        order:40,
        run(payload){
          return {
            duplicateAnalysis:
              this.ref.find(
                payload.problemText,
                payload.context.existingIdeas || []
              )
          };
        }
      }
    ];

    engines.forEach(engine=>{
      if(engine.ref){
        generator.registerEngine(engine.id,engine);
      }
    });

    console.info(
      "[AI Work] AI Idea Generator Phase 1 bootstrapped."
    );

    return true;
  }

  AIW.Extensions.IdeaGeneratorBootstrap={
    id:"idea-generator-bootstrap",
    version:"1.0.0",
    bootstrap
  };

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",bootstrap);
  }else{
    bootstrap();
  }

})(window);
