/* =========================================================
   AI Work - Executive Reports Center V2.2
   Biometric Executive Analytics
   Content Refinement - No UI Design Changes
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.reports = {
  id: "reports",
  title: "التقارير",
  icon: "📊",

  render(container) {
    if (!container) return;

    const W = window.AIW?.Widgets;
    const A = window.AIW?.Analytics;
    const D = window.AIW?.Decision;
    const R = window.AIW?.Recommendation;

    const data = window.AIW?.Data || {};
    const departments = data.departments || [];
    const ideas = window.AIW?.BiometricAnalytics?.enrichIdeas
      ? AIW.BiometricAnalytics.enrichIdeas()
      : (data.ideas || []);
    const roadmap = data.roadmap || [];
    const risks = data.risks || [];

    const scores = A?.score ? A.score() : {};
    const executiveScore = scores.executiveScore || 0;

    const highIdeas = ideas.filter(i => i.priority === "عالية").length;
    const mediumIdeas = ideas.filter(i => i.priority === "متوسطة").length;
    const lowIdeas = ideas.filter(i => i.priority === "منخفضة").length;
    const quickWins = D?.quickWins ? D.quickWins() : ideas.filter(i => i.ease === "سهلة" && i.cost === "منخفضة");
    const avgMaturity = this.average(departments.map(d => d.maturity || 0));

    const decisionTop = ideas
      .slice()
      .sort((a, b) => Number(b.decisionScore || 0) - Number(a.decisionScore || 0))
      .slice(0, 5);

    const recommendations = R?.fullReport ? R.fullReport() : {
      ceo: [
        "البدء بلوحات قياس جودة التسجيلات وأخطاء البيانات كمرحلة أولى.",
        "تفعيل مراجعة بشرية موثقة للتنبيهات المرتبطة بالصلاحيات والحسابات.",
        "إطلاق تحليل الجلسات الطويلة واستخدام الصلاحيات كـ Quick Win.",
        "بناء لوحة تنفيذية موحدة للبوابات الذكية والتسجيلات والتنبيهات."
      ],
      nextActions: [
        "حصر مصادر بيانات التسجيلات وسجلات الدخول والصلاحيات.",
        "تحديد خط أساس لجودة التسجيلات وزمن العبور وجاهزية البوابات.",
        "اختيار 3 مشاريع سريعة للبدء خلال المرحلة الأولى.",
        "ربط كل تنبيه بمؤشر ومالك وإجراء مراجعة واضح."
      ]
    };

    container.innerHTML = `
      <section class="module-page">

        ${W ? W.hero({
          kicker: "Executive Reports · Biometric Analytics",
          title: "مركز التقارير والتحليلات التنفيذية",
          description: "تقرير تنفيذي يوضح حالة جودة التسجيلات، استخدام الصلاحيات، أداء البوابات الذكية، المخاطر التشغيلية، وأولويات التنفيذ القادمة.",
          chips: [
            "👁️ Biometric Analytics",
            `🧠 Executive Score ${executiveScore}%`,
            `🚀 ${quickWins.length} Quick Wins`,
            `🛡️ ${risks.length} مخاطر متابعة`
          ]
        }) : this.fallbackHero()}


        <div class="module-grid">
          ${this.kpi("Executive Score", `${executiveScore}%`, "Executive Health")}
          ${this.kpi("الفرص", ideas.length, "AI Opportunities")}
          ${this.kpi("Quick Wins", quickWins.length, "Ready to Start")}
          ${this.kpi("متوسط الجاهزية", `${avgMaturity}%`, "Portfolio Readiness")}
          ${this.kpi("المخاطر", risks.length, "Risk Register")}
          ${this.kpi("أولوية عالية", highIdeas, "High Priority")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("الخلاصة التنفيذية", "قراءة مختصرة لحالة المبادرة المتخصصة.")}
            <div class="report-ultimate-summary">
              <strong>المبادرة تمتلك أساساً جيداً للانتقال إلى القياس والتشغيل الذكي</strong>
              <p>
                تركيز المرحلة القادمة سيكون على بناء خط أساس واضح لجودة التسجيلات،
                مراقبة استخدام الصلاحيات، متابعة أداء البوابات الذكية، ثم تفعيل التنبيهات
                والتحليلات المتقدمة بشكل تدريجي وتحت إشراف بشري.
              </p>

              <div class="report-score-strip">
                <div><span>Executive</span><b>${scores.executiveScore || 0}%</b></div>
                <div><span>Ideas</span><b>${scores.ideaScore || 0}%</b></div>
                <div><span>Readiness</span><b>${scores.maturityScore || 0}%</b></div>
                <div><span>Risk</span><b>${scores.riskScore || 0}%</b></div>
                <div><span>Governance</span><b>${scores.governanceScore || 0}%</b></div>
              </div>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("Executive Highlights", "أهم الرسائل التنفيذية من البيانات الحالية.")}
            <div class="report-ai-card">
              <strong>الأولوية الحالية: قياس قبل التوسع</strong>
              <p>
                أفضل مسار الآن هو تشغيل لوحات Power BI أولاً لقياس أخطاء التسجيل،
                الجلسات الطويلة، استخدام الصلاحيات، وجاهزية البوابات قبل تشغيل نماذج AI متقدمة.
              </p>
              <button class="module-btn secondary" onclick="AIW.App.go('kpis')">فتح مركز المؤشرات</button>
            </div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("توزيع الأولويات", "تصنيف الفرص حسب درجة الأولوية.")}
            <div class="report-chart-card">
              <canvas id="reportsPriorityChart"></canvas>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("صحة التشغيل", "مؤشرات الجاهزية والمخاطر والحوكمة في رسم واحد.")}
            <div class="report-chart-card">
              <canvas id="reportsHealthChart"></canvas>
            </div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("توزيع الفرص حسب المحافظ", "توزيع الحلول على نطاقات العمل الرئيسية.")}
            <div class="report-bars">
              ${departments.map(d => `
                <div class="report-bar-item">
                  <div>
                    <strong>${d.name}</strong>
                    <span>${d.count} فرص</span>
                  </div>
                  <div class="report-bar">
                    <i style="width:${Math.min((d.count / 7) * 100, 100)}%"></i>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("جاهزية المحافظ", "مقارنة تقديرية لجاهزية كل نطاق تشغيلي.")}
            <div class="report-bars">
              ${departments.map(d => `
                <div class="report-bar-item">
                  <div>
                    <strong>${d.name}</strong>
                    <span>${d.maturity || 0}%</span>
                  </div>
                  <div class="report-bar">
                    <i style="width:${d.maturity || 0}%"></i>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("Decision Intelligence", "أفضل الفرص المقترحة للبدء بناءً على Decision Score.")}
          <div class="report-decision-grid">
            ${decisionTop.map((p, i) => `
              <article class="report-decision-card">
                <b>${String(i + 1).padStart(2, "0")}</b>
                <strong>${p.title}</strong>
                <span>${p.department}</span>
                <div class="aiw-progress"><div style="width:${p.decisionScore || 0}%"></div></div>
                <small>Decision Score: ${p.decisionScore || 0}%</small>
              </article>
            `).join("")}
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("تحليل الأولويات", "قراءة تنفيذية لسهولة البدء ومستوى الأثر.")}
          <div class="report-insight-grid">
            <div class="report-insight-card">
              <span>عالية الأولوية</span>
              <strong>${highIdeas}</strong>
              <p>مرتبطة بجودة البيانات أو الصلاحيات أو الأمن وتحتاج متابعة مبكرة.</p>
            </div>

            <div class="report-insight-card">
              <span>متوسطة الأولوية</span>
              <strong>${mediumIdeas}</strong>
              <p>مناسبة للموجة الثانية بعد تجهيز مصادر البيانات والحوكمة.</p>
            </div>

            <div class="report-insight-card">
              <span>منخفضة الأولوية</span>
              <strong>${lowIdeas}</strong>
              <p>يمكن وضعها ضمن تحسينات لاحقة بعد تشغيل الحلول الأساسية.</p>
            </div>

            <div class="report-insight-card">
              <span>Quick Wins</span>
              <strong>${quickWins.length}</strong>
              <p>أنسب نقطة بداية لأنها تعتمد على القياس والتحليل قبل التكامل العميق.</p>
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("خارطة الطريق", "مراحل الانتقال من القياس إلى التنبيهات الذكية.")}
          <div class="report-roadmap-grid">
            ${roadmap.map(r => `
              <div class="report-roadmap-card">
                <b>${r.year}</b>
                <strong>${r.phase}</strong>
                <span>${r.progress}%</span>
                <div class="aiw-progress"><div style="width:${r.progress}%"></div></div>
                <p>${r.activities}</p>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("Top Executive Priorities", "أولويات مقترحة للمرحلة القادمة.")}
            <div class="executive-list">
              ${(recommendations.ceo || []).map((item, i) => `
                <div class="executive-item">
                  <strong>${String(i + 1).padStart(2, "0")}</strong>
                  <span>${item}</span>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("Next Best Actions", "خطوات عملية للبدء.")}
            <div class="executive-list">
              ${(recommendations.nextActions || []).map((item, i) => `
                <div class="executive-item">
                  <strong>${String(i + 1).padStart(2, "0")}</strong>
                  <span>${item}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("توصية التقرير", "الخطوة العملية المقترحة.")}
          <div class="report-recommendation">
            <strong>البدء بثلاث لوحات قياس تشغيلية قبل أي تكامل متقدم</strong>
            <p>
              التوصية هي البدء بلوحة جودة التسجيلات، لوحة استخدام الصلاحيات والجلسات،
              ولوحة أداء البوابات الذكية. هذه الخطوة تعطي الإدارة رؤية واضحة وتوفر
              أساساً آمناً لبناء التنبيهات ونماذج كشف الشذوذ لاحقاً.
            </p>
            <button class="module-btn secondary" onclick="AIW.App.go('kpis')">فتح مركز المؤشرات</button>
          </div>
        </div>

      </section>
    `;

    this.renderCharts({ highIdeas, mediumIdeas, lowIdeas, scores });
  },

  renderCharts({ highIdeas, mediumIdeas, lowIdeas, scores }) {
    if (!window.AIW?.Charts) return;

    setTimeout(() => {
      if (AIW.Charts.doughnut) {
        AIW.Charts.doughnut("reportsPriorityChart", ["عالية", "متوسطة", "منخفضة"], [highIdeas, mediumIdeas, lowIdeas], "Priority Distribution");
      }

      if (AIW.Charts.bar) {
        AIW.Charts.bar(
          "reportsHealthChart",
          ["Executive", "Ideas", "Readiness", "Risk", "Governance"],
          [
            scores.executiveScore || 0,
            scores.ideaScore || 0,
            scores.maturityScore || 0,
            scores.riskScore || 0,
            scores.governanceScore || 0
          ],
          "Operational Health"
        );
      }
    }, 50);
  },

  kpi(label, value, note) {
    if (window.AIW?.Widgets?.kpi) return AIW.Widgets.kpi({ label, value, note });

    return `
      <div class="module-card">
        <span>${label}</span>
        <strong>${value}</strong>
        <small>${note}</small>
      </div>
    `;
  },

  sectionTitle(title, desc) {
    if (window.AIW?.Widgets?.sectionTitle) return AIW.Widgets.sectionTitle(title, desc);

    return `
      <div class="module-section-title compact">
        <h2>${title}</h2>
        <p>${desc}</p>
      </div>
    `;
  },

  average(values) {
    if (!values.length) return 0;
    return Math.round(values.reduce((a, b) => a + Number(b || 0), 0) / values.length);
  },

  fallbackHero() {
    return `
      <div class="module-hero">
        <span class="module-kicker">Executive Reports · Biometric Analytics</span>
        <h1>مركز التقارير والتحليلات التنفيذية</h1>
        <p>تقرير تنفيذي يعرض جودة التسجيلات، الصلاحيات، البوابات، المخاطر، وأولويات التنفيذ.</p>
      </div>
    `;
  }
};