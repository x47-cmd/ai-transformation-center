/* =========================================================
   AI Work - Ideas Module V3.3
   Biometric AI Opportunity Center

   Updates:
   - Central AIW.Store integration
   - Automatic cross-page synchronization
   - Persistent idea management methods
   - Dynamic portfolio calculations
   - No UI design changes
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.ideas = {
  id: "ideas",
  title: "الأفكار",
  icon: "💡",

  _container: null,
  _syncBound: false,
  _unsubscribeStore: null,

  /* =======================================================
     Central Data Reader
  ======================================================= */

  getData() {
    try {
      if (
        window.AIW?.Store &&
        typeof window.AIW.Store.getState === "function"
      ) {
        const storeData = window.AIW.Store.getState();

        if (
          storeData &&
          typeof storeData === "object"
        ) {
          return storeData;
        }
      }

      if (
        window.AIW?.Store &&
        typeof window.AIW.Store.getData === "function"
      ) {
        const storeData = window.AIW.Store.getData();

        if (
          storeData &&
          typeof storeData === "object"
        ) {
          return storeData;
        }
      }

      return window.AIW?.Data || {};
    } catch (error) {
      console.warn(
        "AI Work Ideas: Unable to read shared data.",
        error
      );

      return window.AIW?.Data || {};
    }
  },

  /* =======================================================
     Ideas Reader
  ======================================================= */

  getIdeas() {
    const data = this.getData();

    const storedIdeas = Array.isArray(data.ideas)
      ? data.ideas
      : [];

    try {
      if (
        window.AIW?.BiometricAnalytics &&
        typeof window.AIW.BiometricAnalytics.enrichIdeas ===
          "function"
      ) {
        const enrichedIdeas =
          window.AIW.BiometricAnalytics.enrichIdeas(
            storedIdeas
          );

        if (Array.isArray(enrichedIdeas)) {
          return enrichedIdeas;
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Ideas: Idea enrichment failed.",
        error
      );
    }

    return storedIdeas;
  },

  /* =======================================================
     Idea Management

     These methods are ready for future forms/buttons.
     All changes are saved and reflected on the dashboard.
  ======================================================= */

  addIdea(idea = {}) {
    if (
      window.AIW?.Store &&
      typeof window.AIW.Store.addIdea === "function"
    ) {
      return window.AIW.Store.addIdea(idea);
    }

    console.warn(
      "AI Work Ideas: AIW.Store.addIdea is unavailable."
    );

    return false;
  },

  updateIdea(id, changes = {}) {
    if (
      window.AIW?.Store &&
      typeof window.AIW.Store.updateIdea === "function"
    ) {
      return window.AIW.Store.updateIdea(
        id,
        changes
      );
    }

    console.warn(
      "AI Work Ideas: AIW.Store.updateIdea is unavailable."
    );

    return false;
  },

  removeIdea(id) {
    if (
      window.AIW?.Store &&
      typeof window.AIW.Store.removeIdea === "function"
    ) {
      return window.AIW.Store.removeIdea(id);
    }

    console.warn(
      "AI Work Ideas: AIW.Store.removeIdea is unavailable."
    );

    return false;
  },

  /* =======================================================
     Grouping and Classification
  ======================================================= */

  groupByDepartment(ideas = []) {
    return ideas.reduce((groups, idea) => {
      const department =
        idea?.department || "غير مصنف";

      if (!groups[department]) {
        groups[department] = [];
      }

      groups[department].push(idea);

      return groups;
    }, {});
  },

  badgeClass(value) {
    const normalizedValue = String(
      value || ""
    ).trim();

    if (
      normalizedValue === "عالية" ||
      normalizedValue === "عالي"
    ) {
      return "high";
    }

    if (normalizedValue === "متوسطة") {
      return "medium";
    }

    if (
      normalizedValue === "منخفضة" ||
      normalizedValue === "منخفض"
    ) {
      return "low";
    }

    return "";
  },

  isHighPriority(idea) {
    const priority = String(
      idea?.priority || ""
    )
      .trim()
      .toLowerCase();

    return (
      priority === "عالية" ||
      priority === "عالي" ||
      priority === "high" ||
      priority === "high priority" ||
      priority === "critical"
    );
  },

  isMediumPriority(idea) {
    const priority = String(
      idea?.priority || ""
    )
      .trim()
      .toLowerCase();

    return (
      priority === "متوسطة" ||
      priority === "متوسط" ||
      priority === "medium"
    );
  },

  isLowPriority(idea) {
    const priority = String(
      idea?.priority || ""
    )
      .trim()
      .toLowerCase();

    return (
      priority === "منخفضة" ||
      priority === "منخفض" ||
      priority === "low"
    );
  },

  isQuickWin(idea) {
    if (idea?.quickWin === true) {
      return true;
    }

    const ease = String(
      idea?.ease || ""
    )
      .trim()
      .toLowerCase();

    const cost = String(
      idea?.cost || ""
    )
      .trim()
      .toLowerCase();

    const easyValues = [
      "سهلة",
      "سهل",
      "easy"
    ];

    const lowCostValues = [
      "منخفضة",
      "منخفض",
      "low"
    ];

    return (
      easyValues.includes(ease) &&
      lowCostValues.includes(cost)
    );
  },

  getDepartmentCount(
    departmentName,
    ideas = []
  ) {
    return ideas.filter(
      (idea) =>
        idea?.department === departmentName
    ).length;
  },

  /* =======================================================
     Idea Card
  ======================================================= */

  renderIdeaCard(idea) {
    const isQuickWin = this.isQuickWin(idea);

    const decisionScore =
      this.normalizePercent(
        idea?.decisionScore,
        0
      );

    const decisionLevel =
      idea?.decisionLevel || "قيد التقييم";

    const riskLevel =
      idea?.riskLevel || "متوسط";

    const ideaId =
      idea?.id ?? "—";

    return `
      <article
        class="idea-card"
        data-idea-id="${this.escapeAttribute(ideaId)}"
      >
        <div class="idea-card-head">
          <div>
            <span class="idea-dept">
              ${this.escapeHtml(
                idea?.department || "غير مصنف"
              )}
            </span>

            <h3>
              ${this.escapeHtml(ideaId)}.
              ${this.escapeHtml(
                idea?.title || "فكرة غير مسماة"
              )}
            </h3>
          </div>

          <div class="idea-badges">
            ${
              isQuickWin
                ? `
                  <span class="idea-quickwin">
                    Quick Win
                  </span>
                `
                : ""
            }

            <span
              class="idea-priority ${this.badgeClass(
                idea?.priority
              )}"
            >
              ${this.escapeHtml(
                idea?.priority || "قيد التقييم"
              )}
            </span>
          </div>
        </div>

        <div class="idea-meta">
          <span>
            ⏱️
            ${this.escapeHtml(
              idea?.duration || "غير محددة"
            )}
          </span>

          <span>
            💰
            ${this.escapeHtml(
              idea?.cost || "غير محددة"
            )}
          </span>

          <span>
            ⚙️
            ${this.escapeHtml(
              idea?.ease || "غير محددة"
            )}
          </span>

          <span>
            📊 ${decisionScore}%
          </span>

          <span>
            🛡️
            ${this.escapeHtml(riskLevel)}
          </span>
        </div>

        <div class="idea-detail">
          <strong>التحدي</strong>

          <p>
            ${this.escapeHtml(
              idea?.challenge ||
                "لا توجد تفاصيل متاحة."
            )}
          </p>
        </div>

        <div class="idea-detail">
          <strong>الحل المقترح</strong>

          <p>
            ${this.escapeHtml(
              idea?.solution ||
                "لا توجد تفاصيل متاحة."
            )}
          </p>
        </div>

        <div class="idea-detail">
          <strong>دور الذكاء الاصطناعي</strong>

          <p>
            ${this.escapeHtml(
              idea?.aiRole ||
                "لا توجد تفاصيل متاحة."
            )}
          </p>
        </div>

        <div class="idea-detail">
          <strong>الفوائد المتوقعة</strong>

          <p>
            ${this.escapeHtml(
              idea?.benefits ||
                "لا توجد تفاصيل متاحة."
            )}
          </p>
        </div>

        <div class="idea-detail">
          <strong>قرار مبدئي</strong>

          <p>
            ${this.escapeHtml(decisionLevel)}
            ·
            Decision Score ${decisionScore}%
          </p>
        </div>
      </article>
    `;
  },

  /* =======================================================
     Department Section
  ======================================================= */

  renderDepartmentSection(
    department,
    ideas = []
  ) {
    return `
      <section
        class="module-panel idea-department-section"
      >
        <div class="idea-section-head">
          <div>
            <span class="module-kicker light">
              Solution Portfolio
            </span>

            <h2>
              ${this.escapeHtml(department)}
            </h2>

            <p>
              ${ideas.length}
              فرص قابلة للدراسة والتطوير
            </p>
          </div>

          <span class="idea-section-count">
            ${ideas.length}
          </span>
        </div>

        <div class="idea-list">
          ${ideas
            .map((idea) =>
              this.renderIdeaCard(idea)
            )
            .join("")}
        </div>
      </section>
    `;
  },

  /* =======================================================
     Portfolio Map
  ======================================================= */

  renderPortfolioMap(
    departments = [],
    ideas = []
  ) {
    return `
      <div class="department-grid">
        ${departments
          .map((department) => {
            const count =
              this.getDepartmentCount(
                department?.name,
                ideas
              );

            const maturity =
              this.normalizePercent(
                department?.maturity,
                0
              );

            return `
              <div class="department-chip">
                <strong>
                  ${this.escapeHtml(
                    department?.name ||
                      "محفظة غير مسماة"
                  )}
                </strong>

                <span>
                  ${count} فرص
                  ·
                  جاهزية ${maturity}%
                </span>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  },

  /* =======================================================
     Main Render
  ======================================================= */

  render(container) {
    if (!container) return;

    this._container = container;

    const data = this.getData();
    const ideas = this.getIdeas();

    const departments = Array.isArray(
      data.departments
    )
      ? data.departments
      : [];

    const groupedIdeas =
      this.groupByDepartment(ideas);

    const highCount = ideas.filter(
      (idea) => this.isHighPriority(idea)
    ).length;

    const mediumCount = ideas.filter(
      (idea) => this.isMediumPriority(idea)
    ).length;

    const lowCount = ideas.filter(
      (idea) => this.isLowPriority(idea)
    ).length;

    const quickWins = ideas.filter(
      (idea) => this.isQuickWin(idea)
    ).length;

    const targetIdeas = Math.max(
      1,
      this.toSafeNumber(
        data.summary?.targetIdeas,
        100
      )
    );

    const progress = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          (ideas.length / targetIdeas) * 100
        )
      )
    );

    const avgDecision = ideas.length
      ? Math.round(
          ideas.reduce(
            (total, idea) =>
              total +
              this.toSafeNumber(
                idea?.decisionScore,
                0
              ),
            0
          ) / ideas.length
        )
      : 0;

    const departmentOrder =
      departments
        .map(
          (department) =>
            department?.name
        )
        .filter(Boolean);

    const orderedDepartments = [
      ...departmentOrder.filter(
        (department) =>
          groupedIdeas[department]
      ),

      ...Object.keys(groupedIdeas).filter(
        (department) =>
          !departmentOrder.includes(
            department
          )
      )
    ];

    container.innerHTML = `
      <section class="module-page">

        <div class="module-hero">
          <span class="module-kicker">
            Biometric AI Opportunity Center
          </span>

          <h1>
            مركز فرص الذكاء الاصطناعي
          </h1>

          <p>
            دليل تنفيذي للحلول الذكية المرتبطة بجودة التسجيلات البيومترية،
            استخدام الصلاحيات، البوابات الذكية، الأمن الرقمي،
            والتحليلات والتنبيهات التشغيلية.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">
              👁️
              ${ideas.length}/${targetIdeas}
              فرصة
            </span>

            <span class="aiw-chip">
              🛂
              ${departments.length}
              محافظ
            </span>

            <span class="aiw-chip">
              🚀
              ${quickWins}
              Quick Wins
            </span>

            <span class="aiw-chip">
              📊
              ${avgDecision}%
              Decision Score
            </span>

            <span class="aiw-chip">
              🎯
              ${progress}%
              من الهدف
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
            <strong>
              ${departments.length}
            </strong>
            <small>Solution Portfolios</small>
          </div>
        </div>

        <div class="module-panel">
          <div
            class="module-section-title compact"
          >
            <h2>
              خريطة المحافظ التشغيلية
            </h2>

            <p>
              تصنيف الفرص حسب نطاق العمل: الأنظمة البيومترية،
              البوابات الذكية، المستخدمون والصلاحيات،
              الأمن الرقمي، والتحليلات التنفيذية.
            </p>
          </div>

          ${this.renderPortfolioMap(
            departments,
            ideas
          )}
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
                .map((department) =>
                  this.renderDepartmentSection(
                    department,
                    groupedIdeas[
                      department
                    ] || []
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

    this.bindAutomaticSync();
  },

  /* =======================================================
     Automatic Synchronization
  ======================================================= */

  bindAutomaticSync() {
    if (this._syncBound) return;

    this._syncBound = true;

    const refreshIdeas = () => {
      if (
        !this._container ||
        !this._container.isConnected
      ) {
        return;
      }

      this.render(this._container);
    };

    const events = [
      "aiw:dataChanged",
      "aiw:dataUpdated",
      "aiw:dataImported",
      "aiw:dataRestored",
      "aiw:dataReset",
      "aiw:storeChanged",
      "aiw:ideasChanged",
      "aiw:ideasUpdated"
    ];

    events.forEach((eventName) => {
      window.addEventListener(
        eventName,
        refreshIdeas
      );
    });

    if (
      window.AIW?.Store &&
      typeof window.AIW.Store.subscribe ===
        "function"
    ) {
      this._unsubscribeStore =
        window.AIW.Store.subscribe(
          refreshIdeas
        );
    }

    window.addEventListener(
      "storage",
      (event) => {
        const supportedKeys = [
          "aiwDataV1",
          "aiwData",
          "AIW_DATA"
        ];

        if (
          !event.key ||
          supportedKeys.includes(event.key)
        ) {
          refreshIdeas();
        }
      }
    );
  },

  /* =======================================================
     Utilities
  ======================================================= */

  toSafeNumber(value, fallback = 0) {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue)
      ? parsedValue
      : fallback;
  },

  normalizePercent(value, fallback = 0) {
    return Math.min(
      100,
      Math.max(
        0,
        Math.round(
          this.toSafeNumber(
            value,
            fallback
          )
        )
      )
    );
  },

  escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  escapeAttribute(value) {
    return this.escapeHtml(value);
  }
};