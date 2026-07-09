/* =========================================================
   ATC Decision Engine
   Enterprise Foundation V2
========================================================= */

(function () {
  "use strict";

  window.ATCDecisionEngine = {
    version: "2.0.0",

    evaluateProject(project = {}) {
      const impact = Number(project.impact || project.roi || 0);
      const risk = Number(project.risk || 0);
      const maturity = Number(project.maturity || 0);

      const score = Math.max(0, Math.min(100, impact + maturity - risk));

      return {
        score,
        priority:
          score >= 80 ? "High" :
          score >= 55 ? "Medium" :
          "Low",
        recommendation:
          score >= 80 ? "Proceed" :
          score >= 55 ? "Review" :
          "Hold"
      };
    },

    evaluatePortfolio(projects = []) {
      if (!Array.isArray(projects) || !projects.length) {
        return { averageScore: 0, health: "No Data" };
      }

      const scores = projects.map(p => this.evaluateProject(p).score);
      const averageScore = Math.round(
        scores.reduce((a, b) => a + b, 0) / scores.length
      );

      return {
        averageScore,
        health:
          averageScore >= 80 ? "Strong" :
          averageScore >= 55 ? "Moderate" :
          "Needs Attention"
      };
    }
  };
})();