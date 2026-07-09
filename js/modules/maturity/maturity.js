/* =========================================================
   AI Work - AI Maturity Center V2.0 Ultimate
   Enterprise AI Maturity Assessment + Readiness + Roadmap
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
      title: "الاستراتيجية",
      score: 42,
      target: 85,
      status: "قيد البناء",
      desc: "وجود رؤية وخارطة طريق ومبادرات مرتبطة بالأهداف المؤسسية."
    },
    {
      id: "governance",
      icon: "🏛️",
      title: "الحوكمة",
      score: 38,
      target: 90,
      status: "قيد البناء",
      desc: "السياسات، الإشراف البشري، إدارة المخاطر، والامتثال."
    },
    {
      id: "data",
      icon: "🗄️",
      title: "البيانات",
      score: 44,
      target: 88,
      status: "متوسط",
      desc: "جودة البيانات، التصنيف، التوفر، الحوكمة، وقابلية الاستخدام."
    },
    {
      id: "technology",
      icon: "⚙️",
      title: "التقنية",
      score: 56,
      target: 86,
      status: "جيد",
      desc: "البنية التحتية، التكامل، المنصات، الأدوات، وقابلية التوسع."
    },
    {
      id: "people",
      icon: "👥",
      title: "الأفراد والمهارات",
      score: 46,
      target: 82,
      status: "متوسط",
      desc: "التدريب، الوعي، سفراء الذكاء الاصطناعي، والكفاءات الداخلية."
    },
    {
      id: "process",
      icon: "🔁",
      title: "العمليات",
      score: 40,
      target: 84,
      status: "قيد البناء",
      desc: "تحويل الإجراءات إلى عمليات قابلة للأتمتة والقياس والتحسين."
    },
    {
      id: "innovation",
      icon: "💡",
      title: "الابتكار",
      score: 62,
      target: 90,
      status: "جيد",
      desc: "استقبال الأفكار، التجارب السريعة، Sandbox، ومنصة الابتكار."
    },
    {
      id: "security",
      icon: "🛡️",
      title: "الأمن والسلامة",
      score: 58,
      target: 92,
      status: "جيد",
      desc: "حماية البيانات، تقييم المخاطر، أمن النماذج، والاستجابة للحوادث."
    }
  ],

  levels: [
    {
      level: 1,
      title: "Initial",
      ar: "البداية",
      range: "0–20%",
      desc: "تجارب فردية بدون إطار مؤسسي واضح."
    },
    {
      level: 2,
      title: "Emerging",
      ar: "ناشئ",
      range: "21–40%",
      desc: "مبادرات متفرقة مع بداية وعي مؤسسي."
    },
    {
      level: 3,
      title: "Developing",
      ar: "قيد التطوير",
      range: "41–60%",
      desc: "استراتيجية أولية، أفكار واضحة، وبعض المشاريع القابلة للتنفيذ."
    },
    {
      level: 4,
      title: "Managed",
      ar: "مُدار",
      range: "61–80%",
      desc: "حوكمة، مؤشرات أداء، ومشاريع مرتبطة بالأثر."
    },
    {
      level: 5,
      title: "Optimized",
      ar: "محسّن",
      range: "81–95%",
      desc: "تحسين مستمر، قياس ROI، وتكامل مؤسسي واسع."
    },
    {
      level: 6,
      title: "AI Driven Enterprise",
      ar: "مؤسسة مدفوعة بالذكاء الاصطناعي",
      range: "96–100%",
      desc: "الذكاء الاصطناعي جزء أساسي من القرار والتشغيل والخدمات."
    }
  ],

  readiness: [
    ["البيانات", 44, "تحتاج حوكمة وتصنيف وجودة أعلى قبل المشاريع الكبرى."],
    ["الأنظمة", 55, "جاهزية تقنية جيدة تحتاج تكامل أوسع."],
    ["الكفاءات", 46, "تحتاج تدريب وبرنامج سفراء واضح."],
    ["الثقافة", 50, "الوعي موجود لكن يحتاج تبني مؤسسي."],
    ["الإدارة", 68, "الدعم التنفيذي جيد ويحتاج آلية متابعة."],
    ["الميزانية", 52, "تحتاج تخصيص ميزانية حسب الأولويات والـ ROI."]
  ],

  roadmap: [
    ["2026", "Foundation", "اعتماد الاستراتيجية، الحوكمة، منصة الأفكار، وتحديد الأولويات.", 35],
    ["2027", "Quick Wins", "تنفيذ التجارب السريعة، قياس النتائج، وتفعيل سفراء الذكاء الاصطناعي.", 50],
    ["2028", "Scale", "توسيع المشاريع المتوسطة وربطها بمركز المعرفة وKPI Engine.", 65],
    ["2029", "Enterprise", "تشغيل المشاريع الكبرى مثل Digital Twin وDecision Center.", 82],
    ["2030", "AI Driven", "نضج واستدامة وقياس ROI وتحسين مستمر.", 100]
  ],

  gaps: [
    {
      area: "الحوكمة",
      current: "سياسات أولية ومبادئ عامة",
      target: "حوكمة مؤسسية كاملة مع لجان وضوابط إلزامية",
      gap: "تحتاج اعتماد رسمي وربطها بدورة حياة المشاريع",
      action: "اعتماد AI Governance Framework وربطه بكل مشروع"
    },
    {
      area: "البيانات",
      current: "بيانات متفرقة بين الأنظمة",
      target: "Data Governance وبيانات مصنفة وجاهزة للنماذج",
      gap: "جودة وتصنيف وتكامل البيانات",
      action: "إطلاق برنامج Data Readiness قبل المشاريع الكبرى"
    },
    {
      area: "المؤشرات",
      current: "مؤشرات عامة",
      target: "KPIs مرتبطة بكل مشروع وROI",
      gap: "غياب Measurement Framework موحد",
      action: "تفعيل KPI Center وربطه بمحفظة المشاريع"
    },
    {
      area: "التبني",
      current: "وعي أولي داخل بعض الإدارات",
      target: "ثقافة تبني مؤسسية عبر سفراء الذكاء الاصطناعي",
      gap: "تحتاج تدريب وتغيير مؤسسي",
      action: "إطلاق AI Champions Program"
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
    const aiInsight = AI?.executiveInsight ? AI.executiveInsight() : null;

    container.innerHTML = `
      <section class="module-page">

        ${W ? W.hero({
          kicker: "AI Maturity · Enterprise Readiness",
          title: "مركز نضج الذكاء الاصطناعي",
          description: "تقييم تنفيذي لجاهزية المؤسسة لتبني الذكاء الاصطناعي عبر الاستراتيجية، الحوكمة، البيانات، التقنية، المهارات، العمليات، الابتكار، والأمن.",
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
          ${this.kpi("الإدارات المقاسة", departments.length || 10, "Departments")}
          ${this.kpi("الفجوة للهدف", `${gap}%`, "To 2030 Target")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("Executive AI Maturity Score", "قراءة تنفيذية لمستوى جاهزية المؤسسة.")}
            <div class="maturity-ultimate-score">
              <div>
                <strong>${overall}%</strong>
                <span>${level.title} · ${level.ar}</span>
              </div>
              <div class="aiw-progress"><div style="width:${overall}%"></div></div>
              <p>
                المؤسسة حالياً في مرحلة ${level.ar}. يوجد أساس جيد من الأفكار والمشاريع،
                لكن رفع النضج يتطلب حوكمة أقوى، قياس KPI، إدارة بيانات، وتبني مؤسسي أوسع.
              </p>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("AI Executive Insight", "تحليل ذكي مرتبط بمحركات Analytics وAI Engine.")}
            <div class="maturity-ai-insight ${aiInsight?.color || "orange"}">
              <strong>${aiInsight?.title || "مرحلة البناء المؤسسي"}</strong>
              <p>${aiInsight?.message || "يفضل البدء بمشاريع Quick Wins وتفعيل الحوكمة قبل التوسع الكبير."}</p>
              <button class="module-btn secondary" data-module="governance">فتح الحوكمة</button>
            </div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("Radar View", "نظرة مقارنة على أبعاد النضج الثمانية.")}
            <div class="maturity-chart-card">
              <canvas id="maturityRadarChart"></canvas>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("Readiness Score", "جاهزية المؤسسة من ناحية البيانات والأنظمة والكفاءات.")}
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
          ${this.sectionTitle("AI Maturity Dimensions", "تحليل مفصل للمحاور التي تحدد جاهزية المؤسسة.")}
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
            ${this.sectionTitle("Department Ranking", "ترتيب الإدارات حسب جاهزية الذكاء الاصطناعي.")}
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
            ${this.sectionTitle("Maturity Levels", "النموذج المرجعي لتقييم تطور المؤسسة.")}
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
          ${this.sectionTitle("Maturity Roadmap 2026–2030", "خطة رفع النضج من التأسيس إلى مؤسسة مدفوعة بالذكاء الاصطناعي.")}
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
                <strong>اعتماد الحوكمة</strong>
                <span>ربط كل مشروع AI بضوابط ومسؤوليات واضحة.</span>
              </div>
              <div>
                <b>2</b>
                <strong>إطلاق Quick Wins</strong>
                <span>إثبات القيمة خلال أول 90 يوم.</span>
              </div>
              <div>
                <b>3</b>
                <strong>تفعيل KPI Engine</strong>
                <span>قياس الأثر والـ ROI لكل مشروع.</span>
              </div>
              <div>
                <b>4</b>
                <strong>رفع جاهزية البيانات</strong>
                <span>تصنيف وتنظيف وربط البيانات بالمشاريع.</span>
              </div>
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("Executive AI Maturity Summary", "الخلاصة النهائية التي يمكن رفعها للإدارة العليا.")}
          <div class="maturity-final-summary">
            <strong>المؤسسة تمتلك أساساً قوياً، لكنها تحتاج تشغيل مؤسسي منظم</strong>
            <p>
              توفر الاستراتيجية، دليل الأفكار، ومحفظة المشاريع يمنح البرنامج بداية قوية.
              المرحلة التالية يجب أن تركز على الحوكمة، مؤشرات الأداء، الجاهزية البيانية،
              وتنفيذ مشاريع Quick Wins لإثبات الأثر قبل التوسع في المشاريع الاستراتيجية الكبرى.
            </p>

            <div class="maturity-summary-grid">
              <div><span>Current</span><b>${overall}%</b></div>
              <div><span>Target</span><b>${target}%</b></div>
              <div><span>Gap</span><b>${gap}%</b></div>
              <div><span>Level</span><b>${level.title}</b></div>
            </div>
          </div>
        </div>

      </section>
    `;

    this.renderCharts();
  },
  
    renderCharts() {
    if (!window.AIW?.Charts?.radar) return;

    setTimeout(() => {
      AIW.Charts.radar(
        "maturityRadarChart",
        this.dimensions.map(d => d.title),
        this.dimensions.map(d => d.score),
        "AI Maturity Dimensions"
      );
    }, 50);
  },

  kpi(label, value, note) {
    if (window.AIW?.Widgets?.kpi) {
      return AIW.Widgets.kpi({ label, value, note });
    }

    return `
      <div class="module-card">
        <span>${label}</span>
        <strong>${value}</strong>
        <small>${note}</small>
      </div>
    `;
  },

  sectionTitle(title, desc) {
    if (window.AIW?.Widgets?.sectionTitle) {
      return AIW.Widgets.sectionTitle(title, desc);
    }

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

  getLevel(score) {
    if (score >= 96) return this.levels[5];
    if (score >= 81) return this.levels[4];
    if (score >= 61) return this.levels[3];
    if (score >= 41) return this.levels[2];
    if (score >= 21) return this.levels[1];
    return this.levels[0];
  },

  heatClass(score) {
    if (score >= 70) return "green";
    if (score >= 45) return "orange";
    return "red";
  },

  rankDepartments(departments) {
    return [...(departments || [])].sort((a, b) => Number(b.maturity || 0) - Number(a.maturity || 0));
  },

  departmentAdvice(name) {
    if (window.AIW?.AI?.departmentAdvice) {
      return AIW.AI.departmentAdvice(name);
    }

    return "ابدأ بالمشاريع السريعة منخفضة التكلفة.";
  },

  defaultRecommendations() {
    return [
      "اعتماد إطار حوكمة الذكاء الاصطناعي وربطه بكل مشروع.",
      "إطلاق مشاريع Quick Wins لإثبات القيمة خلال أول 90 يوم.",
      "تفعيل KPI Engine وربط كل مبادرة بمؤشرات أداء.",
      "رفع جاهزية البيانات قبل المشاريع الاستراتيجية الكبرى.",
      "تفعيل برنامج سفراء الذكاء الاصطناعي داخل الإدارات."
    ];
  },

  fallbackHero(overall) {
    return `
      <div class="module-hero">
        <span class="module-kicker">AI Maturity · Enterprise Readiness</span>
        <h1>مركز نضج الذكاء الاصطناعي</h1>
        <p>تقييم تنفيذي لجاهزية المؤسسة لتبني الذكاء الاصطناعي.</p>
        <div class="aiw-chip-row">
          <span class="aiw-chip">🧠 النضج الحالي ${overall}%</span>
        </div>
      </div>
    `;
  }
};
  