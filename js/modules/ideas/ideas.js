/* =========================================================
   AI Work - Ideas Module V3.0
   Executive Use Case Catalog + Filters
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

      const queryMatch =
        !q ||
        String(idea.title || "").toLowerCase().includes(q) ||
        String(idea.department || "").toLowerCase().includes(q) ||
        String(idea.challenge || "").toLowerCase().includes(q) ||
        String(idea.solution || "").toLowerCase().includes(q);

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
    const isQuickWin = idea.ease === "سهلة" && idea.cost === "منخفضة";

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
      </article>
    `;
  },

  renderDepartmentSection(department, ideas) {
    return `
      <section class="module-panel idea-department-section">
        <div class="idea-section-head">
          <div>
            <span class="module-kicker light">Department Portfolio</span>
            <h2>${department}</h2>
          </div>
          <strong>${ideas.length}</strong>
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
    const ideas = data.ideas || [];
    const departments = data.departments || [];

    const filteredIdeas = this.filterIdeas(ideas);
    const grouped = this.groupByDepartment(filteredIdeas);

    const highCount = ideas.filter(i => i.priority === "عالية").length;
    const mediumCount = ideas.filter(i => i.priority === "متوسطة").length;
    const lowCount = ideas.filter(i => i.priority === "منخفضة").length;
    const quickWins = ideas.filter(i => i.ease === "سهلة" && i.cost === "منخفضة").length;
    const targetIdeas = data.summary?.targetIdeas || 100;
    const progress = Math.round((ideas.length / targetIdeas) * 100);

    container.innerHTML = `
      <section class="module-page">

        <div class="module-hero">
          <span class="module-kicker">AI Use Case Catalog</span>
          <h1>مركز الأفكار</h1>
          <p>
            دليل تنفيذي لأفكار الذكاء الاصطناعي المعتمدة، مصنفة حسب الإدارات،
            مع الأولوية، الجاهزية، التكلفة، مدة التنفيذ، والتأثير المتوقع.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">💡 ${ideas.length}/${targetIdeas} فكرة</span>
            <span class="aiw-chip">🏢 ${departments.length} إدارات</span>
            <span class="aiw-chip">🚀 ${quickWins} Quick Wins</span>
            <span class="aiw-chip">📈 ${progress}% من الهدف</span>
          </div>
        </div>

        <div class="module-grid">
          <div class="module-card">
            <span>الأفكار المعتمدة</span>
            <strong>${ideas.length}</strong>
            <small>Use Cases</small>
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
            <h2>خريطة الإدارات</h2>
            <p>
              الأفكار موزعة على الإدارات الرئيسية حتى لا تبقى المبادرة محصورة في تقنية المعلومات
              والأمن الرقمي فقط.
            </p>
          </div>

          <div class="department-grid">
            ${departments.map(dep => `
              <button class="department-chip department-button ${this.state.department === dep.name ? "active" : ""}"
                onclick="AIW.Modules.ideas.setFilter('department', '${dep.name}')">
                <strong>${dep.name}</strong>
                <span>${dep.count} أفكار · نضج ${dep.maturity || 0}%</span>
              </button>
            `).join("")}
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>البحث والتصفية</h2>
            <p>فلترة الدليل حسب الإدارة، الأولوية، أو كلمة مفتاحية.</p>
          </div>

          <input
            class="module-input"
            placeholder="ابحث عن فكرة، إدارة، تحدي، أو حل..."
            value="${this.state.query}"
            oninput="AIW.Modules.ideas.setSearch(this.value)"
          />

          <div class="ideas-filter-row">
            <button class="module-btn secondary ${this.state.department === "all" ? "active-filter" : ""}" onclick="AIW.Modules.ideas.setFilter('department','all')">كل الإدارات</button>
            <button class="module-btn secondary ${this.state.priority === "all" ? "active-filter" : ""}" onclick="AIW.Modules.ideas.setFilter('priority','all')">كل الأولويات</button>
            <button class="module-btn secondary ${this.state.priority === "عالية" ? "active-filter" : ""}" onclick="AIW.Modules.ideas.setFilter('priority','عالية')">عالية</button>
            <button class="module-btn secondary ${this.state.priority === "متوسطة" ? "active-filter" : ""}" onclick="AIW.Modules.ideas.setFilter('priority','متوسطة')">متوسطة</button>
            <button class="module-btn secondary ${this.state.priority === "منخفضة" ? "active-filter" : ""}" onclick="AIW.Modules.ideas.setFilter('priority','منخفضة')">منخفضة</button>
            <button class="module-btn" onclick="AIW.Modules.ideas.resetFilters()">إعادة ضبط</button>
          </div>
        </div>

        <div class="module-section-title">
          <h2>دليل الأفكار التنفيذي</h2>
          <p>عرض جاهز للإدارة، بدون إظهار أدوات الإضافة والتعديل للمستخدم العادي.</p>
        </div>

        ${
          Object.keys(grouped).length
            ? Object.entries(grouped).map(([department, items]) =>
                this.renderDepartmentSection(department, items)
              ).join("")
            : `<div class="module-empty">لا توجد نتائج مطابقة للفلاتر الحالية.</div>`
        }

        <div class="module-panel admin-note">
          <h2>⚙️ Admin Mode لاحقاً</h2>
          <p>
            الإضافة والتعديل والحذف ستكون لاحقاً داخل Admin Mode مخفي،
            أما هذه الصفحة فهي واجهة عرض تنفيذية جاهزة.
          </p>
        </div>

      </section>
    `;
  }
};