/* =========================================================
   AI Work - AI Maturity Center V2.1
   Enterprise Biometric Intelligence Maturity Assessment
   No UI Design Changes
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.maturity = {
  id: "maturity",
  title: "النضج",
  icon: "🧠",

  dimensions: [
    {
      id: "strategy",
      icon: "🎯",
      title: "الاستراتيجية المتخصصة",
      score: 46,
      target: 85,
      status: "قيد البناء",
      desc: "وجود رؤية واضحة لتحويل تحديات الأنظمة البيومترية والبوابات الذكية إلى مشاريع ذكاء اصطناعي قابلة للقياس."
    },
    {
      id: "governance",
      icon: "🏛️",
      title: "الحوكمة والإشراف البشري",
      score: 42,
      target: 92,
      status: "قيد البناء",
      desc: "ضوابط المراجعة البشرية، الخصوصية، السياسات، ومسؤولية التعامل مع التنبيهات الحساسة."
    },
    {
      id: "data",
      icon: "🗄️",
      title: "جودة البيانات البيومترية",
      score: 48,
      target: 90,
      status: "متوسط",
      desc: "اكتمال البيانات، سلامة التسجيلات، كشف التعارضات، التكرار، وجودة مصادر البيانات."
    },
    {
      id: "technology",
      icon: "⚙️",
      title: "جاهزية الأنظمة والتكامل",
      score: 58,
      target: 88,
      status: "جيد",
      desc: "جاهزية الأنظمة، سجلات التشغيل، الربط مع Power BI، وقابلية التكامل المرحلي."
    },
    {
      id: "users",
      icon: "👨🏻‍💻",
      title: "المستخدمون والصلاحيات",
      score: 44,
      target: 86,
      status: "قيد البناء",
      desc: "قدرة المنظومة على تحليل سلوك المستخدمين، مدة الجلسات، استخدام الصلاحيات، والأنماط غير الاعتيادية."
    },
    {
      id: "operations",
      icon: "🛂",
      title: "تشغيل البوابات الذكية",
      score: 52,
      target: 88,
      status: "متوسط",
      desc: "قياس جاهزية البوابات، زمن العبور، الأخطاء التشغيلية، ونسبة التوفر."
    },
    {
      id: "analytics",
      icon: "📊",
      title: "التحليلات والتقارير",
      score: 56,
      target: 90,
      status: "جيد",
      desc: "لوحات Power BI، مؤشرات الأداء، التقارير التنفيذية، والتوصيات الذكية."
    },
    {
      id: "security",
      icon: "🛡️",
      title: "الأمن الرقمي",
      score: 62,
      target: 94,
      status: "جيد",
      desc: "كشف الشذوذ، مراقبة الحسابات والصلاحيات، ترتيب التنبيهات، وسجل المخاطر."
    }
  ],

  levels: [
    {
      level: 1,
      title: "Initial",
      ar: "البداية",
      range: "0–20%",
      desc: "تحليلات محدودة بدون إطار واضح أو مؤشرات نضج."
    },
    {
      level: 2,
      title: "Emerging",
      ar: "ناشئ",
      range: "21–40%",
      desc: "بداية وعي بالمشاكل التشغيلية مع بعض الأفكار غير المترابطة."
    },
    {
      level: 3,
      title: "Developing",
      ar: "قيد التطوير",
      range: "41–60%",
      desc: "محفظة أفكار واضحة ولوحات قياس أولية ومشاريع قابلة للتنفيذ."
    },
    {
      level: 4,
      title: "Managed",
      ar: "مُدار",
      range: "61–80%",
      desc: "حوكمة ومؤشرات وتنبيهات وربط واضح بين البيانات والقرار."
    },
    {
      level: 5,
      title: "Optimized",
      ar: "محسّن",
      range: "81–95%",
      desc: "تحسين مستمر، نماذج كشف شذوذ، وPower BI تنفيذي متكامل."
    },
    {
      level: 6,
      title: "AI Driven Biometric Operations",
      ar: "تشغيل بيومتري مدعوم بالذكاء الاصطناعي",
      range: "96–100%",
      desc: "الذكاء الاصطناعي جزء أساسي من جودة التسجيلات، الصلاحيات، البوابات، والقرار التشغيلي."
    }
  ],

  readiness: [
    ["بيانات التسجيلات", 48, "تحتاج قواعد جودة واضحة لكشف النقص، التعارض، والتكرار."],
    ["سجلات الدخول والصلاحيات", 46, "تحتاج توحيد وربط لتحليل سلوك المستخدمين والجلسات الطويلة."],
    ["أنظمة البوابات الذكية", 55, "جاهزية تشغيلية جيدة تحتاج مؤشرات أداء وربط تحليلي مستمر."],
    ["Power BI والتحليلات", 58, "مناسبة للبدء بلوحات تنفيذية قبل نماذج الذكاء الاصطناعي المتقدمة."],
    ["الحوكمة والمراجعة", 42, "تحتاج إطار Human-in-the-Loop وسياسات واضحة للتنبيهات الحساسة."],
    ["الأمن الرقمي", 62, "جاهزية جيدة يمكن تطويرها عبر كشف الشذوذ وترتيب التنبيهات."]
  ],

  roadmap: [
    ["2026", "Foundation", "حصر مصادر البيانات، تحديد المؤشرات، وبناء لوحات Power BI أولية.", 35],
    ["2027", "Quick Wins", "تنفيذ لوحات أخطاء التسجيل، استخدام الصلاحيات، والجلسات الطويلة.", 50],
    ["2028", "AI Detection", "تطبيق نماذج كشف الشذوذ للتسجيلات، الحسابات، والصلاحيات.", 65],
    ["2029", "Executive Platform", "توحيد التقارير والتنبيهات والتوصيات داخل منصة تنفيذية.", 82],
    ["2030", "AI Driven", "تشغيل ناضج ومستدام مع تحسين مستمر وقياس أثر شامل.", 100]
  ],

  gaps: [
    {
      area: "جودة البيانات",
      current: "بيانات تشغيلية موجودة لكنها تحتاج تصنيف وتنظيف وربط",
      target: "بيانات جاهزة للتحليل والنماذج مع قواعد جودة واضحة",
      gap: "نقص في إطار جودة بيانات التسجيلات والتعارضات",
      action: "إطلاق Biometric Data Quality Framework"
    },
    {
      area: "الصلاحيات",
      current: "سجلات استخدام متاحة لكن التحليل غالباً تقليدي",
      target: "تحليل ذكي لسلوك المستخدمين والصلاحيات والجلسات",
      gap: "ضعف في كشف الأنماط غير الاعتيادية",
      action: "إطلاق User Behaviour & Privilege Analytics"
    },
    {
      area: "البوابات الذكية",
      current: "متابعة تشغيلية للأداء والأعطال",
      target: "قياس مستمر للجاهزية وزمن العبور والأنماط التشغيلية",
      gap: "الحاجة إلى Dashboard تنفيذي موحد",
      action: "بناء Smart Gate Performance Dashboard"
    },
    {
      area: "الحوكمة",
      current: "مبادئ عامة ومراجعات يدوية",
      target: "حوكمة واضحة للتنبيهات الحساسة مع Human-in-the-Loop",
      gap: "الحاجة إلى آلية مراجعة وتوثيق لكل تنبيه",
      action: "اعتماد Biometric AI Governance Model"
    }
  ],
  
    render(container) {
    if (!container) return;

    const W = window.AIW?.Widgets;
    const A = window.AIW?.Analytics;
    const AI = window.AIW?.AI;
    const R = window.AIW?.Recommendation;

    const data = window.AIW?.Data || {};
    const departments = data.departments || [];
    const analyticsScore = A?.score ? A.score() : null;

    const overall = analyticsScore?.maturityScore || this.average(this.dimensions.map(d => d.score));
    const target = 100;
    const gap = target - overall;
    const level = this.getLevel(overall);
    const strongest = [...this.dimensions].sort((a, b) => b.score - a.score)[0];
    const weakest = [...this.dimensions].sort((a, b) => a.score - b.score)[0];

    const recommendations = R?.nextActions ? R.nextActions() : this.defaultRecommendations();

    const aiInsight = AI?.executiveInsight ? AI.executiveInsight() : {
      title: "مرحلة بناء النضج المتخصص",
      message: "الأولوية الآن هي بناء خط أساس لجودة التسجيلات، الصلاحيات، البوابات الذكية، ثم تفعيل نماذج كشف الشذوذ بعد اكتمال الحوكمة.",
      color: "orange"
    };

    container.innerHTML = `
      <section class="module-page">

        ${W ? W.hero({
          kicker: "Biometric AI Maturity · Readiness",
          title: "مركز نضج الذكاء الاصطناعي",
          description: "تقييم تنفيذي لجاهزية محفظة الأنظمة البيومترية والبوابات الذكية عبر جودة البيانات، الصلاحيات، البوابات، الأمن الرقمي، الحوكمة، والتحليلات.",
          chips: [
            `🧠 النضج الحالي ${overall}%`,
            `🎯 الهدف ${target}% بحلول 2030`,
            `📊 ${this.dimensions.length} أبعاد تقييم`,
            `📉 الفجوة ${gap}%`
          ]
        }) : this.fallbackHero(overall)}

        <div class="module-grid">
          ${this.kpi("النضج الحالي", `${overall}%`, "Current Maturity")}
          ${this.kpi("المستوى الحالي", level.title, level.ar)}
          ${this.kpi("أقوى محور", strongest.title, `${strongest.score}%`)}
          ${this.kpi("أكبر فجوة", weakest.title, `${weakest.score}%`)}
          ${this.kpi("المحافظ المقاسة", departments.length || 5, "Portfolios")}
          ${this.kpi("الفجوة للهدف", `${gap}%`, "To 2030 Target")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("Executive Biometric AI Maturity Score", "قراءة تنفيذية لمستوى جاهزية المحفظة المتخصصة.")}
            <div class="maturity-ultimate-score">
              <div>
                <strong>${overall}%</strong>
                <span>${level.title} · ${level.ar}</span>
              </div>
              <div class="aiw-progress"><div style="width:${overall}%"></div></div>
              <p>
                المحفظة حالياً في مرحلة ${level.ar}. يوجد أساس جيد في الأمن الرقمي والتحليلات،
                لكن رفع النضج يتطلب تحسين جودة بيانات التسجيلات، حوكمة التنبيهات، وربط استخدام الصلاحيات
                بلوحات قياس ومراجعة بشرية واضحة.
              </p>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("AI Executive Insight", "تحليل ذكي مرتبط بمحركات Analytics وAI Engine.")}
            <div class="maturity-ai-insight ${aiInsight?.color || "orange"}">
              <strong>${aiInsight?.title || "مرحلة البناء المتخصص"}</strong>
              <p>${aiInsight?.message || "يفضل البدء بلوحات Quick Wins وتفعيل الحوكمة قبل نماذج الكشف المتقدمة."}</p>
              <button class="module-btn secondary" data-module="governance">فتح الحوكمة</button>
            </div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("Radar View", "نظرة مقارنة على أبعاد نضج المحفظة المتخصصة.")}
            <div class="maturity-chart-card">
              <canvas id="maturityRadarChart"></canvas>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("Readiness Score", "جاهزية البيانات والأنظمة والصلاحيات والتحليلات.")}
            <div class="maturity-readiness-list">
              ${this.readiness.map(item => `
                <div class="maturity-readiness-item">
                  <div>
                    <strong>${item[0]}</strong>
                    <span>${item[2]}</span>
                  </div>
                  <b>${item[1]}%</b>
                  <div class="aiw-progress"><div style="width:${item[1]}%"></div></div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("Biometric AI Maturity Dimensions", "تحليل مفصل للمحاور التي تحدد جاهزية المحفظة.")}
          <div class="maturity-heat-grid">
            ${this.dimensions.map(d => `
              <article class="maturity-heat-card ${this.heatClass(d.score)}">
                <div class="maturity-heat-head">
                  <span>${d.icon}</span>
                  <b>${d.score}%</b>
                </div>
                <strong>${d.title}</strong>
                <p>${d.desc}</p>
                <small>المستهدف: ${d.target}% · الفجوة: ${Math.max(0, d.target - d.score)}%</small>
              </article>
            `).join("")}
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("Portfolio Ranking", "ترتيب المحافظ حسب الجاهزية والنضج.")}
            <div class="maturity-department-ranking">
              ${this.rankDepartments(departments).map((d, i) => `
                <div class="maturity-rank-item">
                  <b>${String(i + 1).padStart(2, "0")}</b>
                  <div>
                    <strong>${d.name}</strong>
                    <span>${d.count || 0} أفكار · ${this.departmentAdvice(d.name)}</span>
                  </div>
                  <em>${d.maturity || 0}%</em>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("Maturity Levels", "النموذج المرجعي لتقييم تطور المحفظة.")}
            <div class="maturity-levels-ultimate">
              ${this.levels.map(l => `
                <div class="maturity-level-ultimate ${l.level === level.level ? "active" : ""}">
                  <b>${l.level}</b>
                  <div>
                    <strong>${l.title} · ${l.ar}</strong>
                    <span>${l.range}</span>
                    <p>${l.desc}</p>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("Gap Analysis", "الفجوة بين الوضع الحالي والمستهدف، مع التوصية التنفيذية.")}
          <div class="maturity-gap-table">
            <div class="maturity-gap-row maturity-gap-head">
              <strong>المجال</strong>
              <strong>الوضع الحالي</strong>
              <strong>المستهدف</strong>
              <strong>الفجوة</strong>
              <strong>الإجراء</strong>
            </div>

            ${this.gaps.map(g => `
              <div class="maturity-gap-row">
                <span>${g.area}</span>
                <span>${g.current}</span>
                <span>${g.target}</span>
                <span>${g.gap}</span>
                <span>${g.action}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("Maturity Roadmap 2026–2030", "خطة رفع النضج من لوحات القياس إلى التشغيل المدعوم بالذكاء الاصطناعي.")}
          <div class="maturity-roadmap-ultimate">
            ${this.roadmap.map(r => `
              <div>
                <b>${r[0]}</b>
                <strong>${r[1]}</strong>
                <span>${r[2]}</span>
                <div class="aiw-progress"><div style="width:${r[3]}%"></div></div>
                <small>${r[3]}%</small>
              </div>
            `).join("")}
          </div>
        </div>
        
                <div class="module-wide-grid">

          <div class="module-panel">
            ${this.sectionTitle("Executive Recommendations", "أولويات تنفيذية لرفع مستوى النضج.")}
            <div class="executive-list">
              ${recommendations.map((r, i) => `
                <div class="executive-item">
                  <strong>${String(i + 1).padStart(2, "0")}</strong>
                  <span>${r}</span>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("Next Best Actions", "الخطوات العملية التالية للإدارة.")}
            <div class="maturity-actions">

              <div>
                <b>1</b>
                <strong>رفع جودة التسجيلات</strong>
                <span>
                  بناء Dashboard لمراقبة التسجيلات الخاطئة،
                  التكرار، والتعارضات بين السجلات.
                </span>
              </div>

              <div>
                <b>2</b>
                <strong>تحليل استخدام الصلاحيات</strong>
                <span>
                  مراقبة مدة استخدام الحسابات،
                  المستخدمين غير الطبيعيين،
                  والجلسات الطويلة.
                </span>
              </div>

              <div>
                <b>3</b>
                <strong>تشغيل لوحات Power BI</strong>
                <span>
                  ربط جميع البيانات التشغيلية
                  في لوحة تنفيذية واحدة.
                </span>
              </div>

              <div>
                <b>4</b>
                <strong>الانتقال إلى AI Detection</strong>
                <span>
                  بعد اكتمال جودة البيانات
                  يبدأ تشغيل نماذج كشف الشذوذ
                  والتنبيهات الذكية.
                </span>
              </div>

            </div>
          </div>

        </div>

        <div class="module-panel">

          ${this.sectionTitle(
            "Executive Biometric Intelligence Summary",
            "الخلاصة النهائية التي يمكن رفعها للإدارة العليا."
          )}

          <div class="maturity-final-summary">

            <strong>
              أصبحت المحفظة جاهزة للانتقال من التحليل التقليدي
              إلى التحليل الذكي القائم على الذكاء الاصطناعي.
            </strong>

            <p>

              المرحلة الحالية تركز على:

              جودة التسجيلات البيومترية،
              تحليل استخدام الصلاحيات،
              كشف التكرار والتعارض،
              مراقبة أداء البوابات الذكية،
              ثم الانتقال تدريجياً
              إلى نماذج AI للكشف المبكر
              عن السلوكيات غير الطبيعية
              ودعم القرار التنفيذي.

            </p>

            <div class="maturity-summary-grid">

              <div>
                <span>Current</span>
                <b>${overall}%</b>
              </div>

              <div>
                <span>Target</span>
                <b>${target}%</b>
              </div>

              <div>
                <span>Gap</span>
                <b>${gap}%</b>
              </div>

              <div>
                <span>Level</span>
                <b>${level.title}</b>
              </div>

            </div>

          </div>

        </div>

      </section>
    `;

    this.renderCharts();
  },