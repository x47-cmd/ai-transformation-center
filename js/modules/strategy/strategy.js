/* =========================================================
   AI Work - Strategy Module V2.0
   Executive Strategy Center + Local Storage
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.strategy = {
  id: "strategy",
  title: "الاستراتيجية",
  icon: "🎯",
  storageKey: "aiwStrategyV2",

  defaultData() {
    return {
      goals: [
        {
          title: "رفع نضج الذكاء الاصطناعي المؤسسي",
          desc: "الانتقال من مرحلة التجارب الفردية إلى نموذج مؤسسي موحد لإدارة الذكاء الاصطناعي.",
          priority: "High"
        },
        {
          title: "تحويل 100 فكرة إلى محفظة مبادرات",
          desc: "تقييم الأفكار وترتيبها حسب الأثر، الجاهزية، التكلفة، والمخاطر.",
          priority: "Medium"
        },
        {
          title: "بناء حوكمة مسؤولة للذكاء الاصطناعي",
          desc: "اعتماد مبادئ الخصوصية، الشفافية، الإشراف البشري، وإدارة المخاطر.",
          priority: "High"
        }
      ],
      pillars: [
        ["⚙️", "أتمتة العمليات", "تقليل الجهد اليدوي وتسريع الإجراءات."],
        ["📊", "القرار المدعوم بالبيانات", "تمكين القيادات من قرارات أسرع وأدق."],
        ["🛡️", "الأمن الرقمي الذكي", "رصد التهديدات والاستجابة الاستباقية."],
        ["💡", "ثقافة الابتكار", "تحويل خبرات الموظفين إلى مشاريع تنفيذية."],
        ["🤖", "الموظف الرقمي", "مساعدات ذكية تدعم الموظفين والفرق."],
        ["🏛️", "الحوكمة المسؤولة", "خصوصية وشفافية وإشراف بشري."],
      ]
    };
  },

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey) || "null");
      return saved || this.defaultData();
    } catch (e) {
      return this.defaultData();
    }
  },

  save(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  },

  addGoal() {
    const title = document.getElementById("strategyGoalTitle")?.value.trim();
    const desc = document.getElementById("strategyGoalDesc")?.value.trim();
    const priority = document.getElementById("strategyGoalPriority")?.value || "Medium";

    if (!title) return;

    const data = this.load();
    data.goals.unshift({ title, desc, priority });
    this.save(data);

    AIW.App.go("strategy");
  },

  deleteGoal(index) {
    const data = this.load();
    data.goals.splice(index, 1);
    this.save(data);

    AIW.App.go("strategy");
  },

  render(container) {
    if (!container) return;

    const data = this.load();
    const highGoals = data.goals.filter(g => g.priority === "High").length;

    container.innerHTML = `
      <section class="module-page">
        <div class="module-hero">
          <span class="module-kicker">AI Strategy · 2026–2030</span>
          <h1>مركز الاستراتيجية</h1>
          <p>
            حوّل الذكاء الاصطناعي من أفكار ومبادرات منفصلة إلى برنامج مؤسسي
            واضح، قابل للقياس، ومربوط بالأهداف والحوكمة والأثر.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">🎯 Executive Strategy</span>
            <span class="aiw-chip">📊 KPI Driven</span>
            <span class="aiw-chip">🏛️ Responsible AI</span>
          </div>
        </div>

        <div class="module-grid">
          <div class="module-card">
            <span>الأهداف الاستراتيجية</span>
            <strong>${data.goals.length}</strong>
            <small>Active goals</small>
          </div>

          <div class="module-card">
            <span>الركائز</span>
            <strong>${data.pillars.length}</strong>
            <small>AI pillars</small>
          </div>

          <div class="module-card">
            <span>الأولوية العالية</span>
            <strong>${highGoals}</strong>
            <small>High priority</small>
          </div>
        </div>

        <div class="module-wide-grid">
          <div>
            <div class="module-panel">
              <h2>الرؤية</h2>
              <p>
                بناء مؤسسة مدعومة بالذكاء الاصطناعي، قادرة على التنبؤ،
                الأتمتة، إدارة المعرفة، وتحسين الخدمات بصورة مستمرة.
              </p>
            </div>

            <div class="module-panel">
              <h2>الرسالة</h2>
              <p>
                تمكين الإدارات من تحويل تحدياتها التشغيلية إلى مشاريع ذكاء اصطناعي
                قابلة للتنفيذ والقياس والحوكمة.
              </p>
            </div>
          </div>

          <div class="module-panel">
            <h2>هدف استراتيجي جديد</h2>

            <input id="strategyGoalTitle" class="module-input" placeholder="اسم الهدف">

            <textarea id="strategyGoalDesc" class="module-textarea" placeholder="وصف الهدف"></textarea>

            <select id="strategyGoalPriority" class="module-select">
              <option value="High">أولوية عالية</option>
              <option value="Medium">أولوية متوسطة</option>
              <option value="Low">أولوية منخفضة</option>
            </select>

            <button class="module-btn" onclick="AIW.Modules.strategy.addGoal()">
              حفظ الهدف
            </button>
          </div>
        </div>

        <div class="module-section-title">
          <h2>الركائز الاستراتيجية</h2>
          <p>المحاور التي توجه جميع برامج ومشاريع الذكاء الاصطناعي.</p>
        </div>

        <div class="module-grid">
          ${data.pillars.map(p => `
            <div class="module-card">
              <span>${p[0]} ${p[1]}</span>
              <strong style="font-size:18px; line-height:1.5;">${p[2]}</strong>
            </div>
          `).join("")}
        </div>

        <div class="module-panel module-list-panel">
          <h2>الأهداف الاستراتيجية</h2>

          ${
            data.goals.length
              ? data.goals.map((g, index) => `
                <div class="module-list-item">
                  <div>
                    <strong>${g.title}</strong>
                    <span>${g.desc || "بدون وصف"}</span>
                    <small>${g.priority}</small>
                  </div>

                  <button class="module-delete-btn" onclick="AIW.Modules.strategy.deleteGoal(${index})">
                    حذف
                  </button>
                </div>
              `).join("")
              : `<div class="module-empty">لا توجد أهداف حالياً.</div>`
          }
        </div>
      </section>
    `;
  }
};