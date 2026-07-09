/* =========================================================
   AI Work - Analytics Engine V1.0 Final
   Executive Scores + Insights + Recommendations
========================================================= */

window.AIW = window.AIW || {};

AIW.Analytics = {
  getData() {
    return window.AIW?.Data || {};
  },

  clamp(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
  },

  average(values = []) {
    const valid = values.map(Number).filter(v => !Number.isNaN(v));
    if (!valid.length) return 0;
    return this.clamp(valid.reduce((a, b) => a + b, 0) / valid.length);
  },

  score() {
    const data = this.getData();
    const summary = data.summary || {};
    const ideas = data.ideas || [];
    const departments = data.departments || [];
    const risks = data.risks || [];

    const ideaScore = this.clamp((ideas.length / (summary.targetIdeas || 100)) * 100);
    const maturityScore = this.clamp(summary.maturityScore || this.average(departments.map(d => d.maturity)));
    const portfolioScore = this.clamp(summary.portfolioHealth || 68);
    const riskScore = this.riskScore(risks);
    const governanceScore = this.governanceScore();

    const executiveScore = this.average([
      ideaScore,
      maturityScore,
      portfolioScore,
      riskScore,
      governanceScore
    ]);

    return {
      executiveScore,
      ideaScore,
      maturityScore,
      portfolioScore,
      riskScore,
      governanceScore
    };
  },

  riskScore(risks = []) {
    if (!risks.length) return 70;

    const penalty = risks.reduce((sum, r) => {
      const level = String(r.level || "");
      if (level.includes("عال")) return sum + 18;
      if (level.includes("متوسط")) return sum + 10;
      return sum + 4;
    }, 0);

    return this.clamp(100 - penalty);
  },

  governanceScore() {
    const data = this.getData();
    const governance = data.governance || [];
    const hasGovernance = governance.length >= 5;
    const hasRisks = (data.risks || []).length >= 4;
    const hasKpis = (data.kpis || []).length >= 5;

    return this.clamp(
      (hasGovernance ? 35 : 15) +
      (hasRisks ? 30 : 10) +
      (hasKpis ? 35 : 15)
    );
  },

  priorityBreakdown() {
    const ideas = this.getData().ideas || [];

    return {
      high: ideas.filter(i => i.priority === "عالية").length,
      medium: ideas.filter(i => i.priority === "متوسطة").length,
      low: ideas.filter(i => i.priority === "منخفضة").length
    };
  },

  quickWins() {
    const ideas = this.getData().ideas || [];
    return ideas.filter(i => i.ease === "سهلة" && i.cost === "منخفضة");
  },

  departmentRanking() {
    const departments = this.getData().departments || [];

    return [...departments].sort((a, b) => {
      const bm = Number(b.maturity || 0);
      const am = Number(a.maturity || 0);
      return bm - am;
    });
  },

  recommendations() {
    const score = this.score();
    const quickWins = this.quickWins();
    const ranking = this.departmentRanking();

    const output = [];

    if (score.executiveScore < 60) {
      output.push("رفع النضج المؤسسي قبل التوسع في المشاريع الكبرى.");
    }

    if (quickWins.length >= 3) {
      output.push("البدء بثلاثة مشاريع Quick Wins لإثبات القيمة خلال الأشهر الأولى.");
    }

    if (score.riskScore < 70) {
      output.push("تفعيل الحوكمة وسجل المخاطر قبل إطلاق المشاريع عالية الحساسية.");
    }

    if (ranking.length) {
      output.push(`البدء بالإدارات الأعلى جاهزية مثل ${ranking[0].name} و${ranking[1]?.name || "الإدارات التقنية"}.`);
    }

    output.push("ربط كل مشروع بمؤشر أداء ومالك مبادرة قبل الاعتماد النهائي.");

    return output;
  },

  executiveSummary() {
    const s = this.score();
    const priority = this.priorityBreakdown();

    return {
      title: "الخلاصة التنفيذية للتحول",
      score: s.executiveScore,
      status: this.status(s.executiveScore),
      message:
        s.executiveScore >= 70
          ? "البرنامج في وضع جيد للتوسع المنظم، مع ضرورة استمرار قياس الأثر والحوكمة."
          : "البرنامج يملك أساس قوي، لكنه يحتاج إلى تشغيل مؤسسي أوضح عبر الحوكمة، KPIs، وQuick Wins.",
      priority
    };
  },

  status(score) {
    if (score >= 80) return "متقدم";
    if (score >= 65) return "جيد";
    if (score >= 45) return "قيد البناء";
    return "يحتاج تأسيس";
  }
};