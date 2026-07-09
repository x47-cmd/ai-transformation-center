/* =========================================================
   AI Work - Ideas Module V2.0
   Executive Ideas Catalog + Data Driven
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.ideas = {
  id: "ideas",
  title: "الأفكار",
  icon: "💡",

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

  renderIdeaCard(idea) {
    return `
      <article class="idea-card">
        <div class="idea-card-head">
          <div>
            <span class="idea-dept">${idea.department}</span>
            <h3>${idea.id}. ${idea.title}</h3>
          </div>
          <span class="idea-priority ${this.badgeClass(idea.priority)}">${idea.priority}</span>
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
    const grouped = this.groupByDepartment(ideas);

    const highCount = ideas.filter(i => i.priority === "عالية").length;
    const quickWins = ideas.filter(i => i.ease === "سهلة" || i.cost === "منخفضة").length;

    container.innerHTML = `
      <section class="module-page">
        <div class="module-hero">
          <span class="module-kicker">AI Innovation Pipeline</span>
          <h1>مركز الأفكار</h1>
          <p>
            دليل تنفيذي لأفكار الذكاء الاصطناعي المعتمدة، مصنفة حسب الإدارات،
            مع التحدي، الحل، دور الذكاء الاصطناعي، الفوائد، الأولوية، المدة والتكلفة.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">💡 ${data.summary?.ideasCount || ideas.length}+ فكرة</span>
            <span class="aiw-chip">🏢 ${data.summary?.departmentsCount || departments.length} إدارات</span>
            <span class="aiw-chip">🚀 هدف ${data.summary?.targetIdeas || 100} فكرة</span>
          </div>
        </div>

        <div class="module-grid">
          <div class="module-card">
            <span>الأفكار المعتمدة</span>
            <strong>${data.summary?.ideasCount || ideas.length}</strong>
            <small>From strategy document</small>
          </div>

          <div class="module-card">
            <span>الأولوية العالية</span>
            <strong>${highCount}</strong>
            <small>High impact</small>
          </div>

          <div class="module-card">
            <span>Quick Wins</span>
            <strong>${quickWins}</strong>
            <small>Low cost / easy</small>
          </div>
        </div>

        <div class="module-panel">
          <h2>خريطة الإدارات</h2>
          <p>
            الأفكار موزعة على الإدارات الرئيسية حتى لا تبقى المبادرة محصورة في تقنية المعلومات
            والأمن الرقمي فقط.
          </p>

          <div class="department-grid">
            ${departments.map(dep => `
              <div class="department-chip">
                <strong>${dep.name}</strong>
                <span>${dep.count} أفكار</span>
              </div>
            `).join("")}
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
            : `<div class="module-empty">لم يتم تحميل بيانات الأفكار بعد.</div>`
        }

        <div class="module-panel admin-note">
          <h2>⚙️ لوحة الإدارة</h2>
          <p>
            الإضافة والتعديل والحذف ستكون لاحقاً داخل Admin Mode مخفي،
            أما هذه الصفحة فهي واجهة عرض تنفيذية جاهزة.
          </p>
        </div>
      </section>
    `;
  }
};