/* =========================================================
   AI Work - Biometric Analytics Engine V1.0
   Power BI Style Analytics + Alerts + Decision Score
========================================================= */

window.AIW = window.AIW || {};

AIW.BiometricAnalytics = {
  weights: {
    priority: 30,
    impact: 25,
    feasibility: 20,
    cost: 15,
    speed: 10
  },

  priorityScore(priority) {
    if (priority === "عالية") return 100;
    if (priority === "متوسطة") return 70;
    if (priority === "منخفضة") return 40;
    return 50;
  },

  easeScore(ease) {
    if (ease === "سهلة") return 100;
    if (ease === "متوسطة") return 70;
    if (ease === "صعبة") return 45;
    return 60;
  },

  costScore(cost) {
    if (cost === "منخفضة") return 100;
    if (cost === "متوسطة") return 70;
    if (cost === "عالية") return 45;
    return 60;
  },

  durationScore(duration) {
    const text = String(duration || "");
    if (text.includes("2-3") || text.includes("3-4") || text.includes("3-5")) return 100;
    if (text.includes("4-6") || text.includes("5-6") || text.includes("5-7")) return 80;
    if (text.includes("6-8") || text.includes("6-9")) return 65;
    if (text.includes("8-10") || text.includes("9-12") || text.includes("10-12")) return 45;
    return 60;
  },

  impactScore(idea) {
    const text = [
      idea.title,
      idea.challenge,
      idea.solution,
      idea.aiRole,
      idea.benefits
    ].join(" ").toLowerCase();

    let score = 50;

    if (text.includes("تسجيل") || text.includes("registration")) score += 15;
    if (text.includes("صلاحيات") || text.includes("privilege") || text.includes("credential")) score += 15;
    if (text.includes("بوابات") || text.includes("gate")) score += 10;
    if (text.includes("أمن") || text.includes("security") || text.includes("risk")) score += 10;
    if (text.includes("تنبيه") || text.includes("alert")) score += 5;
    if (text.includes("تعارض") || text.includes("duplicate") || text.includes("conflict")) score += 10;

    return Math.min(score, 100);
  },

  decisionScore(idea) {
    const p = this.priorityScore(idea.priority);
    const i = this.impactScore(idea);
    const f = this.easeScore(idea.ease);
    const c = this.costScore(idea.cost);
    const s = this.durationScore(idea.duration);

    const score =
      (p * this.weights.priority +
        i * this.weights.impact +
        f * this.weights.feasibility +
        c * this.weights.cost +
        s * this.weights.speed) / 100;

    return Math.round(score);
  },

  decisionLevel(score) {
    if (score >= 85) return "اعتماد فوري";
    if (score >= 75) return "أولوية تنفيذ";
    if (score >= 60) return "قيد الدراسة";
    return "لاحقاً";
  },

  riskLevel(idea) {
    const text = [
      idea.title,
      idea.challenge,
      idea.solution,
      idea.aiRole
    ].join(" ").toLowerCase();

    if (
      text.includes("صلاحيات") ||
      text.includes("credential") ||
      text.includes("privilege") ||
      text.includes("سلوك") ||
      text.includes("security")
    ) {
      return "عالٍ";
    }

    if (
      text.includes("بيومترية") ||
      text.includes("biometric") ||
      text.includes("تسجيل") ||
      text.includes("identity")
    ) {
      return "متوسط";
    }

    return "منخفض";
  },

  isQuickWin(idea) {
    return idea.ease === "سهلة" && idea.cost === "منخفضة";
  },

  enrichIdeas() {
    const ideas = window.AIW?.Data?.ideas || [];

    return ideas.map(idea => {
      const score = this.decisionScore(idea);

      return {
        ...idea,
        decisionScore: score,
        decisionLevel: this.decisionLevel(score),
        riskLevel: this.riskLevel(idea),
        quickWin: this.isQuickWin(idea),
        kpis: this.ideaKpis(idea),
        alerts: this.ideaAlerts(idea),
        powerBiViews: this.powerBiViews(idea)
      };
    });
  },

  ideaKpis(idea) {
    const title = String(idea.title || "").toLowerCase();

    if (title.includes("credential") || title.includes("privilege") || title.includes("user") || title.includes("session")) {
      return [
        "عدد تنبيهات الصلاحيات",
        "متوسط مدة الجلسة",
        "عدد الجلسات غير الطبيعية",
        "نسبة الصلاحيات غير المستخدمة",
        "زمن مراجعة التنبيه"
      ];
    }

    if (title.includes("gate")) {
      return [
        "نسبة جاهزية البوابات",
        "متوسط زمن العبور",
        "عدد أخطاء البوابات",
        "نسبة التوفر",
        "عدد الأعطال المتكررة"
      ];
    }

    if (title.includes("registration") || title.includes("biometric") || title.includes("identity")) {
      return [
        "نسبة جودة التسجيلات",
        "عدد التسجيلات التي تحتاج مراجعة",
        "عدد السجلات المتعارضة",
        "نسبة انخفاض أخطاء التسجيل",
        "متوسط زمن اكتشاف الخطأ"
      ];
    }

    return [
      "عدد الحالات المكتشفة",
      "متوسط زمن المعالجة",
      "نسبة التحسن",
      "عدد التنبيهات",
      "مستوى الامتثال"
    ];
  },

  ideaAlerts(idea) {
    const title = String(idea.title || "").toLowerCase();

    if (title.includes("credential") || title.includes("session")) {
      return [
        "جلسة طويلة بشكل غير طبيعي",
        "استخدام حساب خارج النمط المعتاد",
        "ارتفاع مفاجئ في عدد العمليات"
      ];
    }

    if (title.includes("registration") || title.includes("identity")) {
      return [
        "تسجيل يحتاج مراجعة",
        "احتمال تعارض بين بيانات",
        "جودة تسجيل أقل من المتوسط"
      ];
    }

    if (title.includes("gate")) {
      return [
        "انخفاض جاهزية بوابة",
        "ارتفاع زمن العبور",
        "تكرار أخطاء تشغيلية"
      ];
    }

    return [
      "مؤشر يحتاج مراجعة",
      "انحراف عن المتوسط",
      "تغير في النمط التشغيلي"
    ];
  },

  powerBiViews(idea) {
    return [
      "Executive Overview",
      "Trend Analysis",
      "Risk & Alerts",
      "KPI Performance",
      "Root Cause Analysis"
    ];
  },

  portfolioSummary() {
    const ideas = this.enrichIdeas();

    const highPriority = ideas.filter(i => i.priority === "عالية").length;
    const quickWins = ideas.filter(i => i.quickWin).length;
    const highRisk = ideas.filter(i => i.riskLevel === "عالٍ").length;
    const avgScore = ideas.length
      ? Math.round(ideas.reduce((sum, i) => sum + i.decisionScore, 0) / ideas.length)
      : 0;

    return {
      totalIdeas: ideas.length,
      highPriority,
      quickWins,
      highRisk,
      avgDecisionScore: avgScore,
      topIdeas: [...ideas].sort((a, b) => b.decisionScore - a.decisionScore).slice(0, 5)
    };
  },

  alerts() {
    const ideas = this.enrichIdeas();
    const summary = this.portfolioSummary();
    const alerts = [];

    if (summary.highRisk > 0) {
      alerts.push({
        level: "high",
        title: "مخاطر عالية تحتاج حوكمة",
        message: `${summary.highRisk} أفكار مرتبطة بالصلاحيات أو الأمن الرقمي تحتاج مراجعة Human-in-the-Loop.`
      });
    }

    if (summary.quickWins >= 5) {
      alerts.push({
        level: "medium",
        title: "فرصة Quick Wins",
        message: `يوجد ${summary.quickWins} مشاريع سهلة ومنخفضة التكلفة مناسبة للبدء السريع.`
      });
    }

    if (summary.avgDecisionScore >= 75) {
      alerts.push({
        level: "success",
        title: "محفظة قوية للتنفيذ",
        message: `متوسط Decision Score هو ${summary.avgDecisionScore}% مما يشير إلى جاهزية جيدة للتحويل إلى مشاريع.`
      });
    }

    const top = summary.topIdeas[0];
    if (top) {
      alerts.push({
        level: "info",
        title: "أفضل فكرة للتنفيذ",
        message: `${top.title} حصلت على Decision Score ${top.decisionScore}%.`
      });
    }

    return alerts;
  }
};