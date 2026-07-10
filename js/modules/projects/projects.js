/* =========================================================
   AI Work - Projects Module V2.3
   Biometric AI Project Delivery Center

   Updates:
   - Central AIW.Store integration
   - Persistent project storage
   - Automatic dashboard synchronization
   - Dynamic KPI calculations
   - Existing UI design preserved
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.projects = {
  id: "projects",
  title: "المشاريع",
  icon: "📁",

  _container: null,
  _syncBound: false,
  _seedChecked: false,

  /* =======================================================
     Default Projects

     Used only when the central store has no projects.
     Existing stored projects will never be overwritten.
  ======================================================= */

  defaultProjects: [
    {
      id: 1,
      icon: "👁️",
      title: "محرك سلامة البيانات البيومترية",
      englishTitle: "Biometric Data Integrity Engine",
      priority: "عالية",
      duration: "6-9 أشهر",
      cost: "متوسطة",
      progress: 72,
      status: "قيد التخطيط",
      department: "الأنظمة البيومترية"
    },
    {
      id: 2,
      icon: "🔐",
      title: "محرك كشف إساءة استخدام الحسابات",
      englishTitle: "Credential Misuse Detection Engine",
      priority: "عالية",
      duration: "6-8 أشهر",
      cost: "متوسطة",
      progress: 70,
      status: "قيد التخطيط",
      department: "المستخدمون والصلاحيات"
    },
    {
      id: 3,
      icon: "👨🏻‍💻",
      title: "منصة تحليل سلوك المستخدمين",
      englishTitle: "User Behaviour Intelligence Platform",
      priority: "عالية",
      duration: "6-9 أشهر",
      cost: "متوسطة",
      progress: 66,
      status: "قيد التخطيط",
      department: "المستخدمون والصلاحيات"
    },
    {
      id: 4,
      icon: "🛂",
      title: "تحليل أداء البوابات الذكية",
      englishTitle: "Smart Gate Performance Intelligence",
      priority: "عالية",
      duration: "6-8 أشهر",
      cost: "متوسطة",
      progress: 68,
      status: "قيد الدراسة",
      department: "البوابات الذكية"
    },
    {
      id: 5,
      icon: "📊",
      title: "لوحة العمليات البيومترية بالمطارات",
      englishTitle: "Airport Biometric Operations Dashboard",
      priority: "عالية",
      duration: "3-4 أشهر",
      cost: "منخفضة",
      progress: 88,
      status: "Quick Win",
      department: "التحليلات والتقارير التنفيذية"
    },
    {
      id: 6,
      icon: "✅",
      title: "مراقبة جودة التسجيلات البيومترية",
      englishTitle: "Biometric Registration Quality Monitor",
      priority: "عالية",
      duration: "3-5 أشهر",
      cost: "منخفضة",
      progress: 86,
      status: "Quick Win",
      department: "الأنظمة البيومترية"
    },
    {
      id: 7,
      icon: "🧬",
      title: "كشف الهويات المتكررة والمتعارضة",
      englishTitle: "Duplicate Identity Detection Engine",
      priority: "عالية",
      duration: "6-8 أشهر",
      cost: "متوسطة",
      progress: 62,
      status: "قيد الدراسة",
      department: "الأنظمة البيومترية"
    },
    {
      id: 8,
      icon: "⚠️",
      title: "لوحة ذكاء أخطاء التسجيل",
      englishTitle: "Registration Error Intelligence Dashboard",
      priority: "عالية",
      duration: "3-4 أشهر",
      cost: "منخفضة",
      progress: 90,
      status: "Quick Win",
      department: "التحليلات والتقارير التنفيذية"
    },
    {
      id: 9,
      icon: "🧾",
      title: "تحليل استخدام الصلاحيات",
      englishTitle: "Privilege Usage Analytics",
      priority: "عالية",
      duration: "3-5 أشهر",
      cost: "منخفضة",
      progress: 84,
      status: "Quick Win",
      department: "المستخدمون والصلاحيات"
    },
    {
      id: 10,
      icon: "⏱️",
      title: "كشف الجلسات الطويلة غير الطبيعية",
      englishTitle: "Long Session Anomaly Detection",
      priority: "عالية",
      duration: "3-4 أشهر",
      cost: "منخفضة",
      progress: 82,
      status: "Quick Win",
      department: "المستخدمون والصلاحيات"
    },
    {
      id: 11,
      icon: "📷",
      title: "ذكاء جودة التقاط البصمة والصورة",
      englishTitle: "Biometric Capture Quality AI",
      priority: "متوسطة",
      duration: "3-4 أشهر",
      cost: "منخفضة",
      progress: 78,
      status: "Quick Win",
      department: "الأنظمة البيومترية"
    },
    {
      id: 12,
      icon: "🛡️",
      title: "كشف الشذوذ في سجلات الدخول",
      englishTitle: "Access Log Anomaly Detection",
      priority: "عالية",
      duration: "5-7 أشهر",
      cost: "متوسطة",
      progress: 64,
      status: "قيد التخطيط",
      department: "الأمن الرقمي"
    },
    {
      id: 13,
      icon: "🚦",
      title: "ترتيب التنبيهات الأمنية بالذكاء الاصطناعي",
      englishTitle: "AI Security Alert Prioritization",
      priority: "عالية",
      duration: "3-4 أشهر",
      cost: "منخفضة",
      progress: 80,
      status: "Quick Win",
      department: "الأمن الرقمي"
    },
    {
      id: 14,
      icon: "🛠️",
      title: "الصيانة التنبؤية للبوابات الذكية",
      englishTitle: "Smart Gate Predictive Maintenance",
      priority: "عالية",
      duration: "8-10 أشهر",
      cost: "عالية",
      progress: 52,
      status: "استراتيجي",
      department: "البوابات الذكية"
    },
    {
      id: 15,
      icon: "📈",
      title: "لوحة القيادة التنفيذية للأنظمة البيومترية",
      englishTitle: "Executive Biometric Intelligence Dashboard",
      priority: "عالية",
      duration: "5-7 أشهر",
      cost: "متوسطة",
      progress: 74,
      status: "قيد التخطيط",
      department: "التحليلات والتقارير التنفيذية"
    }
  ],

  /* =======================================================
     Central Data Reader
  ======================================================= */

  getData() {
    try {
      if (
        window.AIW?.Store &&
        typeof window.AIW.Store.getState === "function"
      ) {
        return window.AIW.Store.getState() || {};
      }

      if (
        window.AIW?.Store &&
        typeof window.AIW.Store.getData === "function"
      ) {
        return window.AIW.Store.getData() || {};
      }

      return window.AIW?.Data || {};
    } catch (error) {
      console.warn(
        "AI Work Projects: Unable to read shared data.",
        error
      );

      return window.AIW?.Data || {};
    }
  },

  /* =======================================================
     Initial Project Migration
  ======================================================= */

  ensureProjectsSeeded() {
    if (this._seedChecked) return;

    this._seedChecked = true;

    const data = this.getData();
    const existingProjects = Array.isArray(data.projects)
      ? data.projects
      : [];

    if (existingProjects.length > 0) {
      return;
    }

    if (
      window.AIW?.Store &&
      typeof window.AIW.Store.update === "function"
    ) {
      const now = new Date().toISOString();

      const seededProjects = this.defaultProjects.map(
        (project) => ({
          ...project,
          createdAt: now,
          updatedAt: now
        })
      );

      window.AIW.Store.update(
        "projects",
        seededProjects,
        {
          event: "aiw:projectsUpdated"
        }
      );

      return;
    }

    if (window.AIW?.Data) {
      window.AIW.Data.projects =
        this.clone(this.defaultProjects);
    }
  },

  /* =======================================================
     Projects Reader

     Supports:
     - New object format
     - Previous array format
  ======================================================= */

  getProjects() {
    const data = this.getData();

    const source = Array.isArray(data.projects)
      ? data.projects
      : [];

    return source
      .map((project, index) =>
        this.normalizeProject(project, index)
      )
      .filter(Boolean);
  },

  normalizeProject(project, index = 0) {
    if (Array.isArray(project)) {
      return {
        id: index + 1,
        icon: project[0] || "📁",
        title: project[1] || "مشروع غير مسمى",
        englishTitle: project[2] || "",
        priority: project[3] || "متوسطة",
        duration: project[4] || "غير محددة",
        cost: project[5] || "غير محددة",
        progress: this.normalizePercent(
          project[6],
          0
        ),
        status: project[7] || "قيد الدراسة",
        department: project[8] || "غير مصنف"
      };
    }

    if (
      !project ||
      typeof project !== "object"
    ) {
      return null;
    }

    return {
      ...project,

      id:
        project.id ??
        index + 1,

      icon:
        project.icon ||
        "📁",

      title:
        project.title ||
        project.name ||
        "مشروع غير مسمى",

      englishTitle:
        project.englishTitle ||
        project.english ||
        project.codeName ||
        "",

      priority:
        project.priority ||
        "متوسطة",

      duration:
        project.duration ||
        project.timeline ||
        "غير محددة",

      cost:
        project.cost ||
        project.costLevel ||
        "غير محددة",

      progress: this.normalizePercent(
        project.progress ??
        project.readiness ??
        project.score,
        0
      ),

      status:
        project.status ||
        "قيد الدراسة",

      department:
        project.department ||
        "غير مصنف"
    };
  },

  /* =======================================================
     Project Management

     Ready for future forms and buttons.
  ======================================================= */

  addProject(project = {}) {
    if (
      window.AIW?.Store &&
      typeof window.AIW.Store.addProject === "function"
    ) {
      const createdProject =
        window.AIW.Store.addProject({
          ...project,

          englishTitle:
            project.englishTitle ||
            project.english ||
            "",

          icon:
            project.icon ||
            "📁",

          duration:
            project.duration ||
            "غير محددة",

          cost:
            project.cost ||
            "غير محددة"
        });

      return createdProject;
    }

    console.warn(
      "AI Work Projects: Store addProject is unavailable."
    );

    return false;
  },

  updateProject(id, changes = {}) {
    if (
      window.AIW?.Store &&
      typeof window.AIW.Store.updateProject === "function"
    ) {
      return window.AIW.Store.updateProject(
        id,
        changes
      );
    }

    console.warn(
      "AI Work Projects: Store updateProject is unavailable."
    );

    return false;
  },

  removeProject(id) {
    if (
      window.AIW?.Store &&
      typeof window.AIW.Store.removeProject === "function"
    ) {
      return window.AIW.Store.removeProject(id);
    }

    console.warn(
      "AI Work Projects: Store removeProject is unavailable."
    );

    return false;
  },

  /* =======================================================
     Project Classification
  ======================================================= */

  isQuickWin(project) {
    const status = String(
      project?.status || ""
    )
      .trim()
      .toLowerCase();

    return (
      status === "quick win" ||
      status === "quick-win" ||
      project?.quickWin === true
    );
  },

  isHighPriority(project) {
    const priority = String(
      project?.priority || ""
    )
      .trim()
      .toLowerCase();

    const status = String(
      project?.status || ""
    )
      .trim()
      .toLowerCase();

    return (
      priority === "عالية" ||
      priority === "عالي" ||
      priority === "استراتيجية" ||
      priority === "استراتيجي" ||
      priority === "high" ||
      priority === "critical" ||
      status === "استراتيجي"
    );
  },

  isLowCost(project) {
    const cost = String(
      project?.cost || ""
    )
      .trim()
      .toLowerCase();

    return (
      cost === "منخفضة" ||
      cost === "منخفض" ||
      cost === "low"
    );
  },

  /* =======================================================
     Main Render
  ======================================================= */

  render(container) {
    if (!container) return;

    this._container = container;

    this.ensureProjectsSeeded();

    const data = this.getData();
    const summary = data.summary || {};
    const projects = this.getProjects();

    const quickWins = projects.filter(
      (project) => this.isQuickWin(project)
    ).length;

    const highPriority = projects.filter(
      (project) => this.isHighPriority(project)
    ).length;

    const lowCost = projects.filter(
      (project) => this.isLowCost(project)
    ).length;

    const avgProgress = projects.length
      ? Math.round(
          projects.reduce(
            (sum, project) =>
              sum +
              this.normalizePercent(
                project.progress,
                0
              ),
            0
          ) / projects.length
        )
      : 0;

    const systemHealth =
      this.normalizePercent(
        summary.systemHealth ??
        summary.portfolioHealth,
        68
      );

    container.innerHTML = `
      <section class="module-page">

        <div class="module-hero">
          <span class="module-kicker">
            Project Delivery Center
          </span>

          <h1>
            مركز تنفيذ مشاريع الذكاء الاصطناعي
          </h1>

          <p>
            إدارة مشاريع الأنظمة البيومترية والبوابات الذكية من الفكرة إلى التشغيل،
            مع متابعة الجاهزية، الأولوية، التكلفة، ومراحل التنفيذ.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">
              📁 ${projects.length} مشروع
            </span>

            <span class="aiw-chip">
              🚀 ${quickWins} Quick Wins
            </span>

            <span class="aiw-chip">
              📊 ${avgProgress}% جاهزية متوسطة
            </span>
          </div>
        </div>

        <div class="module-grid">
          ${this.kpi(
            "إجمالي المشاريع",
            projects.length,
            "Project Scope"
          )}

          ${this.kpi(
            "عالية الأولوية",
            highPriority,
            "Priority Projects"
          )}

          ${this.kpi(
            "Quick Wins",
            quickWins,
            "Start First"
          )}

          ${this.kpi(
            "جاهزية التنفيذ",
            `${avgProgress}%`,
            "Execution Readiness"
          )}

          ${this.kpi(
            "منخفضة التكلفة",
            lowCost,
            "Low Cost Projects"
          )}

          ${this.kpi(
            "صحة الأنظمة",
            `${systemHealth}%`,
            "System Health"
          )}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>ملخص تنفيذي</h2>

              <p>
                قراءة سريعة لحالة مشاريع الأنظمة البيومترية والبوابات الذكية.
              </p>
            </div>

            <div class="portfolio-summary-box">
              <strong>
                أفضل بداية هي مشاريع القياس والتحليل قبل التكامل العميق
              </strong>

              <p>
                يوصى بالبدء بلوحات أخطاء التسجيل، تحليل استخدام الصلاحيات،
                مراقبة الجلسات الطويلة، ولوحة العمليات البيومترية. هذه المشاريع تعطي
                رؤية تشغيلية سريعة وتبني خط أساس واضح قبل نماذج الكشف المتقدمة.
              </p>
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>أولوية التنفيذ</h2>

              <p>
                الترتيب المقترح للانطلاق العملي.
              </p>
            </div>

            <div class="execution-order">
              <div>
                <b>1</b>
                <span>
                  لوحات Power BI لقياس الوضع الحالي
                </span>
              </div>

              <div>
                <b>2</b>
                <span>
                  تنبيهات ذكية للتسجيلات والصلاحيات
                </span>
              </div>

              <div>
                <b>3</b>
                <span>
                  نماذج كشف الشذوذ والتوصيات التنفيذية
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>قائمة المشاريع</h2>

            <p>
              ${projects.length}
              مشروعاً متخصصاً قابلاً للتحويل إلى خطة تنفيذية وتشغيل تدريجي.
            </p>
          </div>

          ${
            projects.length
              ? `
                <div class="projects-grid">
                  ${projects
                    .map((project) =>
                      this.projectCard(project)
                    )
                    .join("")}
                </div>
              `
              : `
                <div class="module-empty">
                  لا توجد مشاريع مسجلة حالياً.
                </div>
              `
          }
        </div>

      </section>
    `;

    this.bindAutomaticSync();
  },

  /* =======================================================
     Project Card
  ======================================================= */

  projectCard(project) {
    const progress = this.normalizePercent(
      project?.progress,
      0
    );

    const status =
      project?.status || "قيد الدراسة";

    return `
      <article
        class="project-card"
        data-project-id="${this.escapeAttribute(
          project?.id ?? ""
        )}"
      >
        <div class="project-card-head">
          <div class="project-icon">
            ${this.escapeHtml(
              project?.icon || "📁"
            )}
          </div>

          <span
            class="aiw-status ${this.statusClass(
              status
            )}"
          >
            ${this.escapeHtml(status)}
          </span>
        </div>

        <h3>
          ${this.escapeHtml(
            project?.title || "مشروع غير مسمى"
          )}
        </h3>

        <strong>
          ${this.escapeHtml(
            project?.englishTitle || ""
          )}
        </strong>

        <div class="project-meta">
          <span>
            الأولوية:
            ${this.escapeHtml(
              project?.priority || "غير محددة"
            )}
          </span>

          <span>
            المدة:
            ${this.escapeHtml(
              project?.duration || "غير محددة"
            )}
          </span>

          <span>
            التكلفة:
            ${this.escapeHtml(
              project?.cost || "غير محددة"
            )}
          </span>
        </div>

        <div class="project-progress">
          <div>
            <small>الجاهزية</small>
            <b>${progress}%</b>
          </div>

          <div class="aiw-progress">
            <div style="width:${progress}%"></div>
          </div>
        </div>
      </article>
    `;
  },

  /* =======================================================
     KPI Card
  ======================================================= */

  kpi(label, value, note) {
    return `
      <div class="module-card">
        <span>${this.escapeHtml(label)}</span>
        <strong>${this.escapeHtml(value)}</strong>
        <small>${this.escapeHtml(note)}</small>
      </div>
    `;
  },

  /* =======================================================
     Status Styling
  ======================================================= */

  statusClass(status) {
    const normalizedStatus = String(
      status || ""
    )
      .trim()
      .toLowerCase();

    if (
      normalizedStatus === "quick win" ||
      normalizedStatus === "مكتمل" ||
      normalizedStatus === "تشغيل" ||
      normalizedStatus === "قيد التشغيل" ||
      normalizedStatus === "active" ||
      normalizedStatus === "completed"
    ) {
      return "green";
    }

    if (
      normalizedStatus === "استراتيجي" ||
      normalizedStatus === "حرج" ||
      normalizedStatus === "critical"
    ) {
      return "red";
    }

    return "orange";
  },

  /* =======================================================
     Automatic Cross-Page Synchronization
  ======================================================= */

  bindAutomaticSync() {
    if (this._syncBound) return;

    this._syncBound = true;

    const refreshProjects = () => {
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
      "aiw:projectsChanged",
      "aiw:projectsUpdated"
    ];

    syncEvents.forEach((eventName) => {
      window.addEventListener(
        eventName,
        refreshProjects
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
          refreshProjects();
        }
      }
    );
  },

  /* =======================================================
     Utilities
  ======================================================= */

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
    return JSON.parse(
      JSON.stringify(value)
    );
  }
};