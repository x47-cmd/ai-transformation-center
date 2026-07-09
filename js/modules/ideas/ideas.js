/* =========================================================
   AI Work - Ideas Module V3.1
   Biometric AI Opportunity Center + Practical Filters
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.ideas = {
  id: "ideas",
  title: "الأفكار",
  icon: "💡",

  state: {
    department: "all",
    priority: "all",
    query: ""
  },

  getData() {
    return window.AIW?.Data || {};
  },

  getIdeas() {
    const ideas = this.getData().ideas || [];

    if (window.AIW?.BiometricAnalytics?.enrichIdeas) {
      return AIW.BiometricAnalytics.enrichIdeas();
    }

    return ideas;
  },

  groupByDepartment(ideas) {
    return ideas.reduce((acc, idea) => {
      if (!acc[idea.department]) acc[idea.department] = [];
      acc[idea.department].push(idea);
      return acc;
    }, {});
  },

  badgeClass(value) {
    if (value === "عالية") return "high";
    if (value === "متوسطة") return "medium";
    if (value === "منخفضة") return "low";
    return "";
  },

  filterIdeas(ideas) {
    const q = String(this.state.query || "").trim().toLowerCase();

    return ideas.filter(idea => {
      const departmentMatch =
        this.state.department === "all" || idea.department === this.state.department;

      const priorityMatch =
        this.state.priority === "all" || idea.priority === this.state.priority;

      const queryText = [
        idea.title,
        idea.department,
        idea.challenge,
        idea.solution,
        idea.aiRole,
        idea.benefits,
        idea.decisionLevel,
        idea.riskLevel
      ].join(" ").toLowerCase();

      const queryMatch = !q || queryText.includes(q);

      return departmentMatch && priorityMatch && queryMatch;
    });
  },

  setFilter(type, value) {
    this.state[type] = value;
    AIW.App.go("ideas", { silent: true });
  },

  setSearch(value) {
    this.state.query = value || "";
    AIW.App.go("ideas", { silent: true });
  },

  resetFilters() {
    this.state = {
      department: "all",
      priority: "all",
      query: ""
    };

    AIW.App.go("ideas", { silent: true });
  },

  renderIdeaCard(idea) {
    const isQuickWin = idea.quickWin || (idea.ease === "سهلة" && idea.cost === "منخفضة");
    const decisionScore = idea.decisionScore || 0;
    const decisionLevel = idea.decisionLevel || "قيد التقييم";
    const riskLevel = idea.riskLevel || "متوسط";

    return `
      <article class="idea-card">
        <div class="idea-card-head">
          <div>
            <span class="idea-dept">${idea.department}</span>
            <h3>${idea.id}. ${idea.title}</h3>
          </div>

          <div class="idea-badges">
            ${isQuickWin ? `<span class="idea-quickwin">Quick Win</span>` : ""}
            <span class="idea-priority ${this.badgeClass(idea.priority)}">${idea.priority}</span>
          </div>
        </div>

        <div class="idea-meta">
          <span>⏱️ ${idea.duration}</span>
          <span>💰 ${idea.cost}</span>
          <span>⚙️ ${idea.ease}</span>
          <span>📊 ${decisionScore}%</span>
          <span>🛡️ ${riskLevel}</span>
        </div>

        <div class="idea-detail">
          <strong>التحدي</strong>
          <p>${idea.challenge}</p>
        </div>

        <div class="idea-detail">
          <strong>الحل المقترح</strong>
          <p>${idea.solution}</p>
        </div>

        <div class="idea-detail">
          <strong>دور الذكاء الاصطناعي</strong>
          <p>${idea.aiRole}</p>
        </div>

        <div class="idea-detail">
          <strong>الفوائد المتوقعة</strong>
          <p>${idea.benefits}</p>
        </div>

        <div class="idea-detail">
          <strong>قرار مبدئي</strong>
          <p>${decisionLevel} · Decision Score ${decisionScore}%</p>
        </div>
      </article>
    `;
  },

  renderDepartmentSection(department, ideas) {
    return `
      <section class="module-panel idea-department-section">
        <div class="idea-section-head">
          <div>
            <span class="module-kicker light">Solution Portfolio</span>
            <h2>${department}</h2>
          </div>
        </div>

        <div class="idea-list">
          ${ideas.map(idea => this.renderIdeaCard(idea)).join("")}
        </div>
      </section>
    `;
  },

  render(container) {
    if (!container) return;

    const data = this.getData();
    const ideas = this.getIdeas();
    const departments = data.departments || [];

    const filteredIdeas = this.filterIdeas(ideas);
    const grouped = this.groupByDepartment(filteredIdeas);

    const highCount = ideas.filter(i => i.priority === "عالية").length;
    const mediumCount = ideas.filter(i => i.priority === "متوسطة").length;
    const lowCount = ideas.filter(i => i.priority === "منخفضة").length;
    const quickWins = ideas.filter(i => i.quickWin || (i.ease === "سهلة" && i.cost === "منخفضة")).length;
    const targetIdeas = data.summary?.targetIdeas || 100;
    const progress = Math.round((ideas.length / targetIdeas) * 100);
    const avgDecision = ideas.length
      ? Math.round(ideas.reduce((sum, i) => sum + Number(i.decisionScore || 0), 0) / ideas.length)
      : 0;

    container.innerHTML = `
      <section class="module-page">

<div class="page-credit">
  <span>Designed &amp; Developed by:</span>
  <strong>يوسف الحوسني</strong>
</div>

        <div class="module-hero">
          <span class="module-kicker">Biometric AI Opportunity Center</span>
          <h1>مركز فرص الذكاء الاصطناعي</h1>
          <p>
            دليل تنفيذي للحلول الذكية المرتبطة بجودة التسجيلات البيومترية،
            استخدام الصلاحيات، البوابات الذكية، الأمن الرقمي، والتنبيهات التشغيلية.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">👁️ ${ideas.length}/${targetIdeas} فرصة</span>
            <span class="aiw-chip">🛂 ${departments.length} محافظ</span>
            <span class="aiw-chip">🚀 ${quickWins} Quick Wins</span>
            <span class="aiw-chip">📊 ${avgDecision}% Decision Score</span>
          </div>
        </div>

        <div class="module-grid">
          <div class="module-card">
            <span>الفرص المسجلة</span>
            <strong>${ideas.length}</strong>
            <small>AI Opportunities</small>
          </div>

          <div class="module-card">
            <span>الأولوية العالية</span>
            <strong>${highCount}</strong>
            <small>High Priority</small>
          </div>

          <div class="module-card">
            <span>الأولوية المتوسطة</span>
            <strong>${mediumCount}</strong>
            <small>Medium Priority</small>
          </div>

          <div class="module-card">
            <span>الأولوية المنخفضة</span>
            <strong>${lowCount}</strong>
            <small>Low Priority</small>
          </div>

          <div class="module-card">
            <span>Quick Wins</span>
            <strong>${quickWins}</strong>
            <small>Easy + Low Cost</small>
          </div>

          <div class="module-card">
            <span>المعروض حالياً</span>
            <strong>${filteredIdeas.length}</strong>
            <small>Filtered Results</small>
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>خريطة المحافظ التشغيلية</h2>
            <p>
              تصنيف الفرص حسب نطاق العمل: الأنظمة البيومترية، البوابات الذكية،
              المستخدمون والصلاحيات، الأمن الرقمي، والتحليلات التنفيذية.
            </p>
          </div>

          <div class="department-grid">
            ${departments.map(dep => `
              <button class="department-chip department-button ${this.state.department === dep.name ? "active" : ""}"
                onclick="AIW.Modules.ideas.setFilter('department', '${dep.name}')">
                <strong>${dep.name}</strong>
                <span>${dep.count} فرص · جاهزية ${dep.maturity || 0}%</span>
              </button>
            `).join("")}
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>البحث والتصفية</h2>
            <p>ابحث حسب اسم الحل، التحدي، الصلاحيات، التسجيلات، البوابات، أو مستوى الأولوية.</p>
          </div>

          <input
            class="module-input"
            placeholder="مثال: تسجيل خاطئ، صلاحيات، جلسة طويلة، بوابة، تنبيه..."
            value="${this.state.query}"
            oninput="AIW.Modules.ideas.setSearch(this.value)"
          />

          <div class="ideas-filter-row">
            <button class="module-btn secondary ${this.state.department === "all" ? "active-filter" : ""}" onclick="AIW.Modules.ideas.setFilter('department','all')">كل المحافظ</button>
            <button class="module-btn secondary ${this.state.priority === "all" ? "active-filter" : ""}" onclick="AIW.Modules.ideas.setFilter('priority','all')">كل الأولويات</button>
            <button class="module-btn secondary ${this.state.priority === "عالية" ? "active-filter" : ""}" onclick="AIW.Modules.ideas.setFilter('priority','عالية')">عالية</button>
            <button class="module-btn secondary ${this.state.priority === "متوسطة" ? "active-filter" : ""}" onclick="AIW.Modules.ideas.setFilter('priority','متوسطة')">متوسطة</button>
            <button class="module-btn secondary ${this.state.priority === "منخفضة" ? "active-filter" : ""}" onclick="AIW.Modules.ideas.setFilter('priority','منخفضة')">منخفضة</button>
            <button class="module-btn" onclick="AIW.Modules.ideas.resetFilters()">إعادة ضبط</button>
          </div>
        </div>

        <div class="module-section-title">
          <h2>دليل الفرص التنفيذية</h2>
          <p>عرض منظم للفرص القابلة للتحويل إلى مشاريع تنفيذية ولوحات قياس وتنبيهات ذكية.</p>
        </div>

        ${
          Object.keys(grouped).length
            ? Object.entries(grouped).map(([department, items]) =>
                this.renderDepartmentSection(department, items)
              ).join("")
            : `<div class="module-empty">لا توجد نتائج مطابقة للفلاتر الحالية.</div>`
        }

      </section>
    `;
  }
};