/* =========================================================
   AI Work - Strategy Module V3.0
   Executive Strategy Center + Central Data
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.strategy = {
  id: "strategy",
  title: "الاستراتيجية",
  icon: "🎯",

  goals: [
    {
      title: "رفع نضج الذكاء الاصطناعي المؤسسي",
      desc: "الانتقال من التجارب الفردية إلى برنامج مؤسسي موحد لإدارة الذكاء الاصطناعي.",
      priority: "عالية"
    },
    {
      title: "تحويل 100 فكرة إلى محفظة مبادرات",
      desc: "استقبال الأفكار، تقييمها، تصنيفها، وتحويل الأعلى أثراً إلى مشاريع قابلة للتنفيذ.",
      priority: "عالية"
    },
    {
      title: "بناء حوكمة مسؤولة للذكاء الاصطناعي",
      desc: "اعتماد الخصوصية، الشفافية، الإشراف البشري، وإدارة المخاطر كجزء أساسي من كل مشروع.",
      priority: "عالية"
    },
    {
      title: "تحقيق أثر مالي وتشغيلي قابل للقياس",
      desc: "ربط كل مبادرة بمؤشرات أداء وعائد متوقع وتوفير في الوقت أو التكلفة.",
      priority: "متوسطة"
    }
  ],

  pillars: [
    ["⚙️", "أتمتة العمليات", "تقليل الجهد اليدوي وتسريع الإجراءات المتكررة."],
    ["📊", "القرار المدعوم بالبيانات", "تمكين القيادات من قرارات أسرع وأدق."],
    ["🛡️", "الأمن الرقمي الذكي", "رصد التهديدات والاستجابة الاستباقية."],
    ["💡", "ثقافة الابتكار", "تحويل خبرات الموظفين إلى مشاريع تنفيذية."],
    ["🤖", "الموظف الرقمي", "مساعدات ذكية تدعم الموظفين والفرق."],
    ["🏛️", "الحوكمة المسؤولة", "خصوصية وشفافية وإشراف بشري."]
  ],

  render(container) {
    if (!container) return;

    const data = window.AIW?.Data || {};
    const summary = data.summary || {};
    const roadmap = data.roadmap || [];
    const horizons = data.projectHorizons || [];
    const governance = data.governance || [];
    const recommendations = data.recommendations || [];

    container.innerHTML = `
      <section class="module-page">

        <div class="module-hero">
          <span class="module-kicker">AI Strategy · ${summary.period || "2026–2030"}</span>
          <h1>مركز الاستراتيجية</h1>
          <p>
            تحويل مبادرة أفكار الذكاء الاصطناعي إلى برنامج تحول مؤسسي متكامل
            له رؤية، أهداف، ركائز، خارطة طريق، حوكمة، ومؤشرات قياس واضحة.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">🎯 Executive Strategy</span>
            <span class="aiw-chip">📊 KPI Driven</span>
            <span class="aiw-chip">🏛️ Responsible AI</span>
            <span class="aiw-chip">📅 ${summary.period || "2026–2030"}</span>
          </div>
        </div>

        <div class="module-grid">
          ${this.kpi("الأهداف الاستراتيجية", this.goals.length, "Strategic Goals")}
          ${this.kpi("الركائز", this.pillars.length, "Transformation Pillars")}
          ${this.kpi("مراحل الطريق", roadmap.length, "Roadmap Phases")}
          ${this.kpi("الأفكار المستهدفة", summary.targetIdeas || 100, "Target Ideas")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>الرؤية والرسالة</h2>
              <p>الأساس التنفيذي الذي يوجه جميع مبادرات الذكاء الاصطناعي.</p>
            </div>

            <div class="strategy-statement">
              <span>الرؤية</span>
              <strong>${summary.vision || ""}</strong>
            </div>

            <div class="strategy-statement">
              <span>الرسالة</span>
              <strong>${summary.mission || ""}</strong>
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>القرار الاستراتيجي</h2>
              <p>النقلة المطلوبة في طريقة عرض المبادرة.</p>
            </div>

            <div class="strategy-decision">
              <strong>من أفكار متفرقة إلى برنامج رسمي</strong>
              <p>
                لا يتم تقديم المبادرة كمجموعة أفكار فقط، بل كاستراتيجية تحول مؤسسي
                بالذكاء الاصطناعي تشمل الإدارات كافة وتربط الأفكار بالمشاريع والحوكمة والعائد.
              </p>
              <button class="module-btn secondary" data-module="ideas">استعراض دليل الأفكار</button>
            </div>
          </div>
        </div>

        <div class="module-section-title">
          <h2>الأهداف الاستراتيجية</h2>
          <p>الأهداف التي تقود البرنامج خلال فترة التحول.</p>
        </div>

        <div class="strategy-goals-grid">
          ${this.goals.map((g, index) => `
            <div class="strategy-goal-card">
              <b>${String(index + 1).padStart(2, "0")}</b>
              <span>${g.priority}</span>
              <strong>${g.title}</strong>
              <p>${g.desc}</p>
            </div>
          `).join("")}
        </div>

        <div class="module-section-title">
          <h2>الركائز الاستراتيجية</h2>
          <p>المحاور التي توجه جميع برامج ومشاريع الذكاء الاصطناعي.</p>
        </div>

        <div class="module-grid">
          ${this.pillars.map(p => `
            <div class="module-card strategy-pillar-card">
              <span>${p[0]} ${p[1]}</span>
              <strong>${p[2]}</strong>
            </div>
          `).join("")}
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>تصنيف المشاريع حسب الأفق الزمني</h2>
            <p>طريقة ترتيب محفظة المشاريع من الأسرع تنفيذاً إلى الأكثر استراتيجية.</p>
          </div>

          <div class="horizon-grid">
            ${horizons.map(h => `
              <div class="horizon-card">
                <span>${h.type}</span>
                <strong>${h.title}</strong>
                <p>${h.examples}</p>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>خارطة التحول 2026–2030</h2>
            <p>تسلسل التنفيذ من التحضير إلى النضج والاستدامة.</p>
          </div>

          <div class="roadmap-list">
            ${roadmap.map(r => `
              <div class="roadmap-item">
                <div>
                  <strong>${r.phase}</strong>
                  <span>${r.year}</span>
                  <p>${r.activities}</p>
                  <div class="aiw-progress"><div style="width:${r.progress}%"></div></div>
                </div>
                <b>${r.progress}%</b>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>إطار الحوكمة</h2>
              <p>الضوابط المطلوبة لضمان تنفيذ مسؤول وآمن.</p>
            </div>

            <div class="executive-list">
              ${governance.map((g, i) => `
                <div class="executive-item">
                  <strong>${String(i + 1).padStart(2, "0")}</strong>
                  <span>${g}</span>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>التوصيات النهائية</h2>
              <p>ما يجب رفعه للإدارة لاعتماد الانطلاق.</p>
            </div>

            <div class="executive-list">
              ${recommendations.map((r, i) => `
                <div class="executive-item">
                  <strong>${String(i + 1).padStart(2, "0")}</strong>
                  <span>${r}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

      </section>
    `;
  },

  kpi(label, value, note) {
    return `
      <div class="module-card">
        <span>${label}</span>
        <strong>${value}</strong>
        <small>${note}</small>
      </div>
    `;
  }
};