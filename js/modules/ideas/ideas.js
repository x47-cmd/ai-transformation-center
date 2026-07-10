/* =========================================================
   AI Work - Ideas Module V3.2
   Biometric AI Opportunity Center
   Update: Removed Search & Filters + Static Portfolio Map
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

  getIdeas() {
    const ideas = this.getData().ideas || [];

    if (window.AIW?.BiometricAnalytics?.enrichIdeas) {
      return AIW.BiometricAnalytics.enrichIdeas();
    }

    return ideas;
  },

  groupByDepartment(ideas) {
    return ideas.reduce((groups, idea) => {
      const department = idea.department || "غير مصنف";

      if (!groups[department]) {
        groups[department] = [];
      }

      groups[department].push(idea);

      return groups;
    }, {});
  },

  badgeClass(value) {
    if (value === "عالية") return "high";
    if (value === "متوسطة") return "medium";
    if (value === "منخفضة") return "low";

    return "";
  },

  getDepartmentCount(departmentName, ideas) {
    return ideas.filter(idea => idea.department === departmentName).length;
  },

  renderIdeaCard(idea) {
    const isQuickWin =
      idea.quickWin ||
      (idea.ease === "سهلة" && idea.cost === "منخفضة");

    const decisionScore = Number(idea.decisionScore || 0);
    const decisionLevel = idea.decisionLevel || "قيد التقييم";
    const riskLevel = idea.riskLevel || "متوسط";

    return `
      <article class="idea-card">
        <div class="idea-card-head">
          <div>
            <span class="idea-dept">${idea.department || "غير مصنف"}</span>
            <h3>${idea.id}. ${idea.title}</h3>
          </div>

          <div class="idea-badges">
            ${
              isQuickWin
                ? `<span class="idea-quickwin">Quick Win</span>`
                : ""
            }

            <span class="idea-priority ${this.badgeClass(idea.priority)}">
              ${idea.priority || "قيد التقييم"}
            </span>
          </div>
        </div>

        <div class="idea-meta">
          <span>⏱️ ${idea.duration || "غير محددة"}</span>
          <span>💰 ${idea.cost || "غير محددة"}</span>
          <span>⚙️ ${idea.ease || "غير محددة"}</span>
          <span>📊 ${decisionScore}%</span>
          <span>🛡️ ${riskLevel}</span>
        </div>

        <div class="idea-detail">
          <strong>التحدي</strong>
          <p>${idea.challenge || "لا توجد تفاصيل متاحة."}</p>
        </div>

        <div class="idea-detail">
          <strong>الحل المقترح</strong>
          <p>${idea.solution || "لا توجد تفاصيل متاحة."}</p>
        </div>

        <div class="idea-detail">
          <strong>دور الذكاء الاصطناعي</strong>
          <p>${idea.aiRole || "لا توجد تفاصيل متاحة."}</p>
        </div>

        <div class="idea-detail">
          <strong>الفوائد المتوقعة</strong>
          <p>${idea.benefits || "لا توجد تفاصيل متاحة."}</p>
        </div>

        <div class="idea-detail">
          <strong>قرار مبدئي</strong>
          <p>
            ${decisionLevel}
            ·
            Decision Score ${decisionScore}%
          </p>
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
            <p>${ideas.length} فرص قابلة للدراسة والتطوير</p>
          </div>

          <span class="idea-section-count">
            ${ideas.length}
          </span>
        </div>

        <div class="idea-list">
          ${ideas
            .map(idea => this.renderIdeaCard(idea))
            .join("")}
        </div>
      </section>
    `;
  },

  renderPortfolioMap(departments, ideas) {
    return `
      <div class="department-grid">
        ${departments
          .map(department => {
            const count = this.getDepartmentCount(
              department.name,
              ideas
            );

            return `
              <div class="department-chip">
                <strong>${department.name}</strong>

                <span>
                  ${count} فرص
                  ·
                  جاهزية ${department.maturity || 0}%
                </span>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  },

  render(container) {
    if (!container) return;

    const data = this.getData();
    const ideas = this.getIdeas();
    const departments = data.departments || [];
    const groupedIdeas = this.groupByDepartment(ideas);

    const highCount = ideas.filter(
      idea => idea.priority === "عالية"
    ).length;

    const mediumCount = ideas.filter(
      idea => idea.priority === "متوسطة"
    ).length;

    const lowCount = ideas.filter(
      idea => idea.priority === "منخفضة"
    ).length;

    const quickWins = ideas.filter(
      idea =>
        idea.quickWin ||
        (idea.ease === "سهلة" && idea.cost === "منخفضة")
    ).length;

    const targetIdeas = Number(
      data.summary?.targetIdeas || 100
    );

    const progress = targetIdeas
      ? Math.min(
          100,
          Math.round((ideas.length / targetIdeas) * 100)
        )
      : 0;

    const avgDecision = ideas.length
      ? Math.round(
          ideas.reduce(
            (total, idea) =>
              total + Number(idea.decisionScore || 0),
            0
          ) / ideas.length
        )
      : 0;

    const departmentOrder = departments.map(
      department => department.name
    );

    const orderedDepartments = [
      ...departmentOrder.filter(
        department => groupedIdeas[department]
      ),

      ...Object.keys(groupedIdeas).filter(
        department => !departmentOrder.includes(department)
      )
    ];

    container.innerHTML = `
      <section class="module-page">

        <div class="module-hero">
          <span class="module-kicker">
            Biometric AI Opportunity Center
          </span>

          <h1>مركز فرص الذكاء الاصطناعي</h1>

          <p>
            دليل تنفيذي للحلول الذكية المرتبطة بجودة التسجيلات البيومترية،
            استخدام الصلاحيات، البوابات الذكية، الأمن الرقمي،
            والتحليلات والتنبيهات التشغيلية.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">
              👁️ ${ideas.length}/${targetIdeas} فرصة
            </span>

            <span class="aiw-chip">
              🛂 ${departments.length} محافظ
            </span>

            <span class="aiw-chip">
              🚀 ${quickWins} Quick Wins
            </span>

            <span class="aiw-chip">
              📊 ${avgDecision}% Decision Score
            </span>

            <span class="aiw-chip">
              🎯 ${progress}% من الهدف
            </span>
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
            <span>المحافظ التشغيلية</span>
            <strong>${departments.length}</strong>
            <small>Solution Portfolios</small>
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>خريطة المحافظ التشغيلية</h2>

            <p>
              تصنيف الفرص حسب نطاق العمل: الأنظمة البيومترية،
              البوابات الذكية، المستخدمون والصلاحيات،
              الأمن الرقمي، والتحليلات التنفيذية.
            </p>
          </div>

          ${this.renderPortfolioMap(departments, ideas)}
        </div>

        <div class="module-section-title">
          <h2>دليل الفرص التنفيذية</h2>

          <p>
            عرض منظم لجميع الفرص القابلة للتحويل إلى مشاريع تنفيذية،
            أنظمة مساندة، لوحات قياس، وتنبيهات ذكية.
          </p>
        </div>

        ${
          orderedDepartments.length
            ? orderedDepartments
                .map(department =>
                  this.renderDepartmentSection(
                    department,
                    groupedIdeas[department]
                  )
                )
                .join("")
            : `
              <div class="module-empty">
                لا توجد أفكار مسجلة حالياً.
              </div>
            `
        }

      </section>
    `;
  }
};