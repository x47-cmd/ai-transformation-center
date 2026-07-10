/* =========================================================
   AI Work - Strategy Module V3.2
   Enterprise Biometric Intelligence Strategy

   Updates:
   - Central AIW.Store integration
   - Persistent strategy data
   - Automatic cross-page synchronization
   - Dynamic roadmap and governance linkage
   - No UI design changes
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.strategy = {
  id: "strategy",
  title: "الاستراتيجية",
  icon: "🎯",

  _container: null,
  _syncBound: false,
  _seedChecked: false,

  /* =======================================================
     Default Strategy Data

     Used only when no strategy data exists in AIW.Store.
  ======================================================= */

  defaultStrategy: {
    goals: [
      {
        id: 1,
        title: "رفع جودة وسلامة البيانات البيومترية",
        desc:
          "استخدام الذكاء الاصطناعي لاكتشاف التسجيلات الخاطئة، السجلات المتعارضة، والبيانات التي تحتاج مراجعة قبل تأثيرها على التشغيل.",
        priority: "عالية",
        status: "active"
      },
      {
        id: 2,
        title: "تعزيز الرقابة الذكية على المستخدمين والصلاحيات",
        desc:
          "تحليل سلوك استخدام الحسابات والصلاحيات لاكتشاف الأنماط غير الاعتيادية، الجلسات الطويلة، واحتمالات إساءة استخدام الصلاحيات.",
        priority: "عالية",
        status: "active"
      },
      {
        id: 3,
        title: "تحسين أداء البوابات الذكية في المطارات",
        desc:
          "قياس أداء البوابات، زمن العبور، الأعطال، ونسب النجاح لتحسين الجاهزية والانسيابية التشغيلية.",
        priority: "عالية",
        status: "active"
      },
      {
        id: 4,
        title: "بناء حوكمة مسؤولة للذكاء الاصطناعي",
        desc:
          "اعتماد الإشراف البشري، الخصوصية، التدرج في التنبيهات، وتوثيق المراجعات في جميع الحالات الحساسة.",
        priority: "عالية",
        status: "active"
      }
    ],

    pillars: [
      {
        id: 1,
        icon: "👁️",
        title: "سلامة البيانات البيومترية",
        desc: "كشف الأخطاء والتعارضات ورفع جودة التسجيلات."
      },
      {
        id: 2,
        icon: "🛂",
        title: "ذكاء البوابات الذكية",
        desc: "تحليل الأداء والجاهزية وزمن العبور والأعطال."
      },
      {
        id: 3,
        icon: "👨🏻‍💻",
        title: "سلوك المستخدمين والصلاحيات",
        desc: "مراقبة الاستخدام واكتشاف الأنماط غير الطبيعية."
      },
      {
        id: 4,
        icon: "🔐",
        title: "الأمن الرقمي والامتثال",
        desc: "تعزيز الرقابة والتنبيهات الذكية وحوكمة الوصول."
      },
      {
        id: 5,
        icon: "📊",
        title: "التحليلات التنفيذية",
        desc: "لوحات Power BI ومؤشرات قياس وتوصيات للإدارة."
      },
      {
        id: 6,
        icon: "🏛️",
        title: "الحوكمة المسؤولة",
        desc: "إشراف بشري وخصوصية وتوثيق ومراجعة مستمرة."
      }
    ],

    decision: {
      title: "من أفكار تشغيلية إلى محفظة حلول متخصصة",
      description:
        "لا يتم تقديم المبادرة كأفكار عامة، بل كمحفظة متخصصة في الأنظمة البيومترية، البوابات الذكية، الصلاحيات، والأمن الرقمي، مع مؤشرات قياس وحوكمة واضحة."
    },

    updatedAt: null
  },

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
        "AI Work Strategy: Unable to read shared data.",
        error
      );

      return window.AIW?.Data || {};
    }
  },

  /* =======================================================
     Initial Strategy Migration
  ======================================================= */

  ensureStrategySeeded() {
    if (this._seedChecked) return;

    this._seedChecked = true;

    const data = this.getData();

    const hasStrategy =
      data.strategy &&
      typeof data.strategy === "object" &&
      (
        Array.isArray(data.strategy.goals) ||
        Array.isArray(data.strategy.pillars)
      );

    if (hasStrategy) {
      return;
    }

    const strategyData = this.clone(
      this.defaultStrategy
    );

    strategyData.updatedAt =
      new Date().toISOString();

    if (
      window.AIW?.Store &&
      typeof window.AIW.Store.update === "function"
    ) {
      window.AIW.Store.update(
        "strategy",
        strategyData,
        {
          event: "aiw:strategyUpdated"
        }
      );

      return;
    }

    if (window.AIW?.Data) {
      window.AIW.Data.strategy =
        strategyData;
    }
  },

  /* =======================================================
     Strategy Readers
  ======================================================= */

  getStrategy() {
    const data = this.getData();

    const strategy =
      data.strategy &&
      typeof data.strategy === "object"
        ? data.strategy
        : {};

    return {
      goals: Array.isArray(strategy.goals)
        ? strategy.goals
        : this.clone(
            this.defaultStrategy.goals
          ),

      pillars: Array.isArray(strategy.pillars)
        ? strategy.pillars
        : this.clone(
            this.defaultStrategy.pillars
          ),

      decision:
        strategy.decision &&
        typeof strategy.decision === "object"
          ? strategy.decision
          : this.clone(
              this.defaultStrategy.decision
            ),

      updatedAt:
        strategy.updatedAt || null
    };
  },

  getRoadmap() {
    const data = this.getData();

    return Array.isArray(data.roadmap)
      ? data.roadmap
      : [];
  },

  getHorizons() {
    const data = this.getData();

    return Array.isArray(data.projectHorizons)
      ? data.projectHorizons
      : [];
  },

  getGovernance() {
    const data = this.getData();

    return Array.isArray(data.governance)
      ? data.governance
      : [];
  },

  getRecommendations() {
    const data = this.getData();

    return Array.isArray(data.recommendations)
      ? data.recommendations
      : [];
  },

  /* =======================================================
     Strategy Management

     Ready for future forms and admin controls.
  ======================================================= */

  updateStrategy(changes = {}) {
    if (
      !changes ||
      typeof changes !== "object"
    ) {
      return false;
    }

    const currentStrategy =
      this.getStrategy();

    const updatedStrategy = {
      ...currentStrategy,
      ...changes,
      updatedAt: new Date().toISOString()
    };

    if (
      window.AIW?.Store &&
      typeof window.AIW.Store.update === "function"
    ) {
      return window.AIW.Store.update(
        "strategy",
        updatedStrategy,
        {
          event: "aiw:strategyUpdated"
        }
      );
    }

    if (window.AIW?.Data) {
      window.AIW.Data.strategy =
        updatedStrategy;

      window.dispatchEvent(
        new CustomEvent(
          "aiw:strategyUpdated",
          {
            detail: {
              strategy: updatedStrategy
            }
          }
        )
      );

      return true;
    }

    return false;
  },

  addGoal(goal = {}) {
    const strategy = this.getStrategy();
    const goals = [...strategy.goals];

    const newGoal = {
      id: this.getNextId(goals),
      title:
        goal.title ||
        "هدف استراتيجي جديد",
      desc:
        goal.desc ||
        goal.description ||
        "",
      priority:
        goal.priority ||
        "متوسطة",
      status:
        goal.status ||
        "active",
      createdAt:
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString()
    };

    goals.push(newGoal);

    this.updateStrategy({
      goals
    });

    return newGoal;
  },

  updateGoal(id, changes = {}) {
    const strategy = this.getStrategy();

    const goalIndex =
      strategy.goals.findIndex(
        (goal) =>
          String(goal?.id) === String(id)
      );

    if (goalIndex === -1) {
      return false;
    }

    const goals = strategy.goals.map(
      (goal, index) => {
        if (index !== goalIndex) {
          return goal;
        }

        return {
          ...goal,
          ...changes,
          id: goal.id,
          updatedAt:
            new Date().toISOString()
        };
      }
    );

    this.updateStrategy({
      goals
    });

    return goals[goalIndex];
  },

  removeGoal(id) {
    const strategy = this.getStrategy();

    const removedGoal =
      strategy.goals.find(
        (goal) =>
          String(goal?.id) === String(id)
      );

    if (!removedGoal) {
      return false;
    }

    const goals =
      strategy.goals.filter(
        (goal) =>
          String(goal?.id) !== String(id)
      );

    this.updateStrategy({
      goals
    });

    return removedGoal;
  },

  addPillar(pillar = {}) {
    const strategy = this.getStrategy();
    const pillars = [...strategy.pillars];

    const newPillar = {
      id: this.getNextId(pillars),
      icon:
        pillar.icon ||
        "🎯",
      title:
        pillar.title ||
        "ركيزة استراتيجية جديدة",
      desc:
        pillar.desc ||
        pillar.description ||
        "",
      createdAt:
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString()
    };

    pillars.push(newPillar);

    this.updateStrategy({
      pillars
    });

    return newPillar;
  },

  updatePillar(id, changes = {}) {
    const strategy = this.getStrategy();

    const pillarIndex =
      strategy.pillars.findIndex(
        (pillar) =>
          String(pillar?.id) === String(id)
      );

    if (pillarIndex === -1) {
      return false;
    }

    const pillars =
      strategy.pillars.map(
        (pillar, index) => {
          if (index !== pillarIndex) {
            return pillar;
          }

          return {
            ...pillar,
            ...changes,
            id: pillar.id,
            updatedAt:
              new Date().toISOString()
          };
        }
      );

    this.updateStrategy({
      pillars
    });

    return pillars[pillarIndex];
  },

  removePillar(id) {
    const strategy = this.getStrategy();

    const removedPillar =
      strategy.pillars.find(
        (pillar) =>
          String(pillar?.id) === String(id)
      );

    if (!removedPillar) {
      return false;
    }

    const pillars =
      strategy.pillars.filter(
        (pillar) =>
          String(pillar?.id) !== String(id)
      );

    this.updateStrategy({
      pillars
    });

    return removedPillar;
  },

  updateDecision(changes = {}) {
    const strategy = this.getStrategy();

    const decision = {
      ...strategy.decision,
      ...changes
    };

    return this.updateStrategy({
      decision
    });
  },

  /* =======================================================
     Main Render
  ======================================================= */

  render(container) {
    if (!container) return;

    this._container = container;

    this.ensureStrategySeeded();

    const data = this.getData();
    const summary = data.summary || {};

    const strategy = this.getStrategy();
    const goals = strategy.goals;
    const pillars = strategy.pillars;
    const decision = strategy.decision;

    const roadmap = this.getRoadmap();
    const horizons = this.getHorizons();
    const governance = this.getGovernance();
    const recommendations =
      this.getRecommendations();

    const period =
      summary.period ||
      "2026–2030";

    const targetIdeas = Math.max(
      1,
      this.toSafeNumber(
        summary.targetIdeas,
        100
      )
    );

    container.innerHTML = `
      <section class="module-page">

        <div class="module-hero">
          <span class="module-kicker">
            Biometric AI Strategy ·
            ${this.escapeHtml(period)}
          </span>

          <h1>مركز الاستراتيجية</h1>

          <p>
            استراتيجية متخصصة لتحويل تحديات الأنظمة البيومترية والبوابات الذكية
            إلى مشاريع ذكاء اصطناعي قابلة للتنفيذ والقياس والحوكمة.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">
              👁️ Biometric Intelligence
            </span>

            <span class="aiw-chip">
              🛂 Smart Gates
            </span>

            <span class="aiw-chip">
              🔐 Digital Security
            </span>

            <span class="aiw-chip">
              📅 ${this.escapeHtml(period)}
            </span>
          </div>
        </div>

        <div class="module-grid">
          ${this.kpi(
            "الأهداف الاستراتيجية",
            goals.length,
            "Strategic Goals"
          )}

          ${this.kpi(
            "الركائز",
            pillars.length,
            "Transformation Pillars"
          )}

          ${this.kpi(
            "مراحل الطريق",
            roadmap.length,
            "Roadmap Phases"
          )}

          ${this.kpi(
            "الأفكار المستهدفة",
            targetIdeas,
            "Target Ideas"
          )}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            <div
              class="module-section-title compact"
            >
              <h2>الرؤية والرسالة</h2>

              <p>
                الأساس التنفيذي الذي يوجه جميع مبادرات الذكاء الاصطناعي المتخصصة.
              </p>
            </div>

            <div class="strategy-statement">
              <span>الرؤية</span>

              <strong>
                ${this.escapeHtml(
                  summary.vision || ""
                )}
              </strong>
            </div>

            <div class="strategy-statement">
              <span>الرسالة</span>

              <strong>
                ${this.escapeHtml(
                  summary.mission || ""
                )}
              </strong>
            </div>
          </div>

          <div class="module-panel">
            <div
              class="module-section-title compact"
            >
              <h2>القرار الاستراتيجي</h2>

              <p>
                النقلة المطلوبة في طريقة عرض المبادرة.
              </p>
            </div>

            <div class="strategy-decision">
              <strong>
                ${this.escapeHtml(
                  decision.title ||
                  ""
                )}
              </strong>

              <p>
                ${this.escapeHtml(
                  decision.description ||
                  ""
                )}
              </p>

              <button
                class="module-btn secondary"
                data-module="ideas"
              >
                استعراض دليل الأفكار
              </button>
            </div>
          </div>
        </div>

        <div class="module-section-title">
          <h2>الأهداف الاستراتيجية</h2>

          <p>
            الأهداف التي تقود المحفظة المتخصصة خلال فترة التحول.
          </p>
        </div>

        ${
          goals.length
            ? `
              <div class="strategy-goals-grid">
                ${goals
                  .map(
                    (goal, index) => `
                      <div
                        class="strategy-goal-card"
                        data-goal-id="${this.escapeAttribute(
                          goal?.id ?? index + 1
                        )}"
                      >
                        <b>
                          ${String(
                            index + 1
                          ).padStart(2, "0")}
                        </b>

                        <span>
                          ${this.escapeHtml(
                            goal?.priority ||
                            "قيد التقييم"
                          )}
                        </span>

                        <strong>
                          ${this.escapeHtml(
                            goal?.title ||
                            "هدف غير مسمى"
                          )}
                        </strong>

                        <p>
                          ${this.escapeHtml(
                            goal?.desc ||
                            goal?.description ||
                            ""
                          )}
                        </p>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            `
            : `
              <div class="module-empty">
                لا توجد أهداف استراتيجية مسجلة حالياً.
              </div>
            `
        }

        <div class="module-section-title">
          <h2>الركائز الاستراتيجية</h2>

          <p>
            المحاور التي توجه جميع حلول الذكاء الاصطناعي في نطاق الاختصاص.
          </p>
        </div>

        ${
          pillars.length
            ? `
              <div class="module-grid">
                ${pillars
                  .map(
                    (pillar, index) => `
                      <div
                        class="module-card strategy-pillar-card"
                        data-pillar-id="${this.escapeAttribute(
                          pillar?.id ?? index + 1
                        )}"
                      >
                        <span>
                          ${this.escapeHtml(
                            pillar?.icon ||
                            "🎯"
                          )}

                          ${this.escapeHtml(
                            pillar?.title ||
                            "ركيزة غير مسماة"
                          )}
                        </span>

                        <strong>
                          ${this.escapeHtml(
                            pillar?.desc ||
                            pillar?.description ||
                            ""
                          )}
                        </strong>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            `
            : `
              <div class="module-empty">
                لا توجد ركائز استراتيجية مسجلة حالياً.
              </div>
            `
        }

        <div class="module-panel">
          <div
            class="module-section-title compact"
          >
            <h2>
              تصنيف المشاريع حسب الأفق الزمني
            </h2>

            <p>
              طريقة ترتيب محفظة المشاريع من الأسرع تنفيذاً إلى الأكثر استراتيجية.
            </p>
          </div>

          ${
            horizons.length
              ? `
                <div class="horizon-grid">
                  ${horizons
                    .map(
                      (horizon) => `
                        <div class="horizon-card">
                          <span>
                            ${this.escapeHtml(
                              horizon?.type ||
                              ""
                            )}
                          </span>

                          <strong>
                            ${this.escapeHtml(
                              horizon?.title ||
                              ""
                            )}
                          </strong>

                          <p>
                            ${this.escapeHtml(
                              horizon?.examples ||
                              ""
                            )}
                          </p>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              `
              : `
                <div class="module-empty">
                  لا توجد تصنيفات زمنية مسجلة حالياً.
                </div>
              `
          }
        </div>

        <div class="module-panel">
          <div
            class="module-section-title compact"
          >
            <h2>
              خارطة التحول
              ${this.escapeHtml(period)}
            </h2>

            <p>
              تسلسل التنفيذ من حصر البيانات إلى التنبيهات الذكية والنضج.
            </p>
          </div>

          ${
            roadmap.length
              ? `
                <div class="roadmap-list">
                  ${roadmap
                    .map((roadmapItem) => {
                      const progress =
                        this.normalizePercent(
                          roadmapItem?.progress,
                          0
                        );

                      return `
                        <div class="roadmap-item">
                          <div>
                            <strong>
                              ${this.escapeHtml(
                                roadmapItem?.phase ||
                                ""
                              )}
                            </strong>

                            <span>
                              ${this.escapeHtml(
                                roadmapItem?.year ||
                                ""
                              )}
                            </span>

                            <p>
                              ${this.escapeHtml(
                                roadmapItem?.activities ||
                                ""
                              )}
                            </p>

                            <div class="aiw-progress">
                              <div
                                style="width:${progress}%"
                              ></div>
                            </div>
                          </div>

                          <b>${progress}%</b>
                        </div>
                      `;
                    })
                    .join("")}
                </div>
              `
              : `
                <div class="module-empty">
                  لا توجد مراحل مسجلة في خارطة التحول.
                </div>
              `
          }
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            <div
              class="module-section-title compact"
            >
              <h2>إطار الحوكمة</h2>

              <p>
                الضوابط المطلوبة لضمان تنفيذ مسؤول وآمن في الحالات الحساسة.
              </p>
            </div>

            ${
              governance.length
                ? `
                  <div class="executive-list">
                    ${governance
                      .map(
                        (control, index) => `
                          <div class="executive-item">
                            <strong>
                              ${String(
                                index + 1
                              ).padStart(2, "0")}
                            </strong>

                            <span>
                              ${this.escapeHtml(
                                typeof control ===
                                  "string"
                                  ? control
                                  : control?.title ||
                                    control?.description ||
                                    control?.name ||
                                    ""
                              )}
                            </span>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                `
                : `
                  <div class="module-empty">
                    لا توجد ضوابط حوكمة مسجلة حالياً.
                  </div>
                `
            }
          </div>

          <div class="module-panel">
            <div
              class="module-section-title compact"
            >
              <h2>التوصيات النهائية</h2>

              <p>
                ما يجب رفعه للإدارة لاعتماد الانطلاق.
              </p>
            </div>

            ${
              recommendations.length
                ? `
                  <div class="executive-list">
                    ${recommendations
                      .map(
                        (recommendation, index) => `
                          <div class="executive-item">
                            <strong>
                              ${String(
                                index + 1
                              ).padStart(2, "0")}
                            </strong>

                            <span>
                              ${this.escapeHtml(
                                typeof recommendation ===
                                  "string"
                                  ? recommendation
                                  : recommendation?.title ||
                                    recommendation?.description ||
                                    ""
                              )}
                            </span>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                `
                : `
                  <div class="module-empty">
                    لا توجد توصيات مسجلة حالياً.
                  </div>
                `
            }
          </div>
        </div>

      </section>
    `;

    this.bindAutomaticSync();
  },

  /* =======================================================
     KPI Card
  ======================================================= */

  kpi(label, value, note) {
    return `
      <div class="module-card">
        <span>
          ${this.escapeHtml(label)}
        </span>

        <strong>
          ${this.escapeHtml(value)}
        </strong>

        <small>
          ${this.escapeHtml(note)}
        </small>
      </div>
    `;
  },

  /* =======================================================
     Automatic Cross-Page Synchronization
  ======================================================= */

  bindAutomaticSync() {
    if (this._syncBound) return;

    this._syncBound = true;

    const refreshStrategy = () => {
      if (
        !this._container ||
        !this._container.isConnected
      ) {
        return;
      }

      this.render(this._container);
    };

    const syncEvents = [
      "aiw:dataChanged",
      "aiw:dataUpdated",
      "aiw:dataImported",
      "aiw:dataRestored",
      "aiw:dataReset",
      "aiw:storeChanged",

      "aiw:strategyChanged",
      "aiw:strategyUpdated",

      "aiw:roadmapChanged",
      "aiw:roadmapUpdated",

      "aiw:governanceChanged",
      "aiw:governanceUpdated",

      "aiw:recommendationsChanged",
      "aiw:recommendationsUpdated"
    ];

    syncEvents.forEach((eventName) => {
      window.addEventListener(
        eventName,
        refreshStrategy
      );
    });

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
          refreshStrategy();
        }
      }
    );
  },

  /* =======================================================
     Utilities
  ======================================================= */

  getNextId(items = []) {
    if (!Array.isArray(items)) {
      return 1;
    }

    const ids = items
      .map((item) =>
        this.toSafeNumber(
          item?.id,
          0
        )
      )
      .filter((id) => id > 0);

    return ids.length
      ? Math.max(...ids) + 1
      : 1;
  },

  toSafeNumber(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
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
  },

  clone(value) {
    if (
      typeof structuredClone === "function"
    ) {
      try {
        return structuredClone(value);
      } catch (error) {
        // Use JSON fallback.
      }
    }

    return JSON.parse(
      JSON.stringify(value)
    );
  }
};