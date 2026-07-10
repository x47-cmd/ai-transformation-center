/* =========================================================
   AI Work - Projects Module V5.0
   Enterprise Biometric AI Project Delivery Center
   Store V2.2 Native Architecture

   File Path:
   js/modules/projects/projects.js

   Features:
   - AIW.Store V2.2 as Single Source of Truth
   - No internal default project seeding
   - Persistent project portfolio management
   - Idea-to-project source traceability
   - Bidirectional project/idea navigation
   - Selected project persistence
   - Dynamic delivery KPIs
   - Risk and execution classification
   - Store subscription + cross-page synchronization
   - Project details modal
   - Existing core UI design preserved
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.projects = {
  id: "projects",
  title: "المشاريع",
  icon: "📁",
  version: "5.0.0",

  _container: null,
  _unsubscribeStore: null,
  _refreshTimer: null,
  _detailsModal: null,
  _eventsBound: false,
  _syncBound: false,
  _isRendering: false,

  config: {
    refreshDelay: 80,
    selectedProjectKey: "aiwSelectedProjectId",
    selectedIdeaKey: "aiwSelectedIdeaId",
    styleId: "aiw-projects-v50-styles"
  },

  status: {
    PLANNED: "planned",
    STUDY: "study",
    APPROVED: "approved",
    ACTIVE: "active",
    IN_PROGRESS: "in-progress",
    PAUSED: "paused",
    BLOCKED: "blocked",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    ARCHIVED: "archived"
  },

  /* =======================================================
     Store Access
  ======================================================= */

  getStore() {
    return window.AIW?.Store || null;
  },

  hasStore() {
    return Boolean(this.getStore());
  },

  getState() {
    const store = this.getStore();

    if (!store) {
      console.error("AI Work Projects V5.0: AIW.Store is unavailable.");
      return {};
    }

    try {
      if (typeof store.getState === "function") {
        const state = store.getState();
        return state && typeof state === "object" ? state : {};
      }

      if (typeof store.getData === "function") {
        const state = store.getData();
        return state && typeof state === "object" ? state : {};
      }
    } catch (error) {
      console.error("AI Work Projects V5.0: Unable to read Store state.", error);
    }

    return {};
  },

  getCollection(name) {
    const collection = this.getState()?.[name];
    return Array.isArray(collection) ? collection : [];
  },

  /* =======================================================
     Projects & Ideas Readers
  ======================================================= */

  getRawProjects() {
    const store = this.getStore();

    try {
      if (typeof store?.getProjects === "function") {
        const projects = store.getProjects();
        if (Array.isArray(projects)) return projects;
      }
    } catch (error) {
      console.warn("AI Work Projects V5.0: getProjects failed.", error);
    }

    return this.getCollection("projects");
  },

  getIdeas() {
    const store = this.getStore();

    try {
      if (typeof store?.getIdeas === "function") {
        const ideas = store.getIdeas();
        if (Array.isArray(ideas)) return ideas;
      }
    } catch (error) {
      console.warn("AI Work Projects V5.0: getIdeas failed.", error);
    }

    return this.getCollection("ideas");
  },

  getProjectById(projectId) {
    if (projectId === null || projectId === undefined || projectId === "") {
      return null;
    }

    const store = this.getStore();

    try {
      if (typeof store?.getProject === "function") {
        const project = store.getProject(projectId);
        if (project) return this.normalizeProject(project);
      }

      if (typeof store?.find === "function") {
        const project = store.find("projects", projectId);
        if (project) return this.normalizeProject(project);
      }
    } catch (error) {
      console.warn("AI Work Projects V5.0: Project lookup failed.", error);
    }

    const project = this.getRawProjects().find(
      item => String(item?.id) === String(projectId)
    );

    return project ? this.normalizeProject(project) : null;
  },

  getIdeaById(ideaId) {
    if (ideaId === null || ideaId === undefined || ideaId === "") {
      return null;
    }

    const store = this.getStore();

    try {
      if (typeof store?.getIdea === "function") {
        const idea = store.getIdea(ideaId);
        if (idea) return idea;
      }

      if (typeof store?.find === "function") {
        const idea = store.find("ideas", ideaId);
        if (idea) return idea;
      }
    } catch (error) {
      console.warn("AI Work Projects V5.0: Idea lookup failed.", error);
    }

    return (
      this.getIdeas().find(
        item => String(item?.id) === String(ideaId)
      ) || null
    );
  },

  getSourceIdea(project = {}) {
    const sourceIdeaId =
      project?.sourceIdeaId ??
      project?.ideaId ??
      project?.origin?.ideaId ??
      project?.source?.ideaId ??
      null;

    if (!sourceIdeaId) return null;

    return this.getIdeaById(sourceIdeaId);
  },

  getProjects() {
    return this.getRawProjects()
      .map((project, index) => this.normalizeProject(project, index))
      .filter(Boolean);
  },

  /* =======================================================
     Project Normalization
  ======================================================= */

  normalizeProject(project, index = 0) {
    if (Array.isArray(project)) {
      project = {
        id: index + 1,
        icon: project[0],
        title: project[1],
        englishTitle: project[2],
        priority: project[3],
        duration: project[4],
        cost: project[5],
        progress: project[6],
        status: project[7],
        department: project[8]
      };
    }

    if (!project || typeof project !== "object") return null;

    const normalizedStatus = this.normalizeProjectStatus(
      project.status ??
      project.lifecycleStatus ??
      project.deliveryStatus ??
      ""
    );

    const sourceIdeaId =
      project.sourceIdeaId ??
      project.ideaId ??
      project.origin?.ideaId ??
      project.source?.ideaId ??
      null;

    return {
      ...project,

      id:
        project.id ??
        project.projectId ??
        `project-${index + 1}`,

      icon:
        project.icon ||
        this.getProjectIcon(project),

      title:
        project.title ||
        project.name ||
        "مشروع غير مسمى",

      englishTitle:
        project.englishTitle ||
        project.english ||
        project.codeName ||
        "",

      description:
        project.description ||
        project.summary ||
        project.solution ||
        "",

      department:
        project.department ||
        project.businessUnit ||
        project.portfolio ||
        "غير مصنف",

      owner:
        project.owner ||
        project.projectOwner ||
        project.manager ||
        "غير محدد",

      priority:
        project.priority ||
        "متوسطة",

      duration:
        project.duration ||
        project.timeline ||
        project.estimatedDuration ||
        "غير محددة",

      cost:
        project.cost ||
        project.costLevel ||
        project.budgetLevel ||
        "غير محددة",

      budget:
        project.budget ??
        project.estimatedBudget ??
        null,

      progress: this.normalizePercent(
        project.progress ??
        project.completion ??
        project.readiness ??
        project.score,
        0
      ),

      readiness: this.normalizePercent(
        project.readiness ??
        project.progress ??
        project.score,
        0
      ),

      status: normalizedStatus,

      riskLevel:
        project.riskLevel ||
        project.risk ||
        "متوسط",

      startDate:
        project.startDate ||
        project.startedAt ||
        null,

      targetDate:
        project.targetDate ||
        project.endDate ||
        project.dueDate ||
        null,

      sourceIdeaId,

      ideaId: sourceIdeaId,

      origin: {
        type:
          project.origin?.type ||
          (sourceIdeaId ? "idea" : "manual"),

        ideaId:
          sourceIdeaId,

        ...(project.origin || {})
      },

      createdFromIdea:
        project.createdFromIdea === true ||
        Boolean(sourceIdeaId),

      milestones:
        Array.isArray(project.milestones)
          ? project.milestones
          : [],

      kpis:
        Array.isArray(project.kpis)
          ? project.kpis
          : [],

      risks:
        Array.isArray(project.risks)
          ? project.risks
          : [],

      createdAt:
        project.createdAt ||
        null,

      updatedAt:
        project.updatedAt ||
        null
    };
  },

  normalizeProjectStatus(value) {
    const raw = this.normalizeStatus(value);

    const map = {
      "planned": this.status.PLANNED,
      "قيد-التخطيط": this.status.PLANNED,
      "قيد-التخطيط-الأولي": this.status.PLANNED,

      "study": this.status.STUDY,
      "قيد-الدراسة": this.status.STUDY,

      "approved": this.status.APPROVED,
      "معتمد": this.status.APPROVED,

      "active": this.status.ACTIVE,
      "تشغيل": this.status.ACTIVE,
      "قيد-التشغيل": this.status.ACTIVE,

      "in-progress": this.status.IN_PROGRESS,
      "inprogress": this.status.IN_PROGRESS,
      "قيد-التنفيذ": this.status.IN_PROGRESS,
      "قيد-العمل": this.status.IN_PROGRESS,

      "paused": this.status.PAUSED,
      "متوقف-مؤقتاً": this.status.PAUSED,
      "متوقف-موقتا": this.status.PAUSED,

      "blocked": this.status.BLOCKED,
      "متعثر": this.status.BLOCKED,
      "محظور": this.status.BLOCKED,

      "completed": this.status.COMPLETED,
      "مكتمل": this.status.COMPLETED,
      "منجز": this.status.COMPLETED,

      "cancelled": this.status.CANCELLED,
      "canceled": this.status.CANCELLED,
      "ملغي": this.status.CANCELLED,

      "archived": this.status.ARCHIVED,
      "مؤرشف": this.status.ARCHIVED,

      "quick-win": this.status.PLANNED,
      "quickwin": this.status.PLANNED,

      "استراتيجي": this.status.PLANNED
    };

    return map[raw] || this.status.PLANNED;
  },

  getProjectStatusLabel(project = {}) {
    const labels = {
      [this.status.PLANNED]: "قيد التخطيط",
      [this.status.STUDY]: "قيد الدراسة",
      [this.status.APPROVED]: "معتمد",
      [this.status.ACTIVE]: "قيد التشغيل",
      [this.status.IN_PROGRESS]: "قيد التنفيذ",
      [this.status.PAUSED]: "متوقف مؤقتاً",
      [this.status.BLOCKED]: "متعثر",
      [this.status.COMPLETED]: "مكتمل",
      [this.status.CANCELLED]: "ملغي",
      [this.status.ARCHIVED]: "مؤرشف"
    };

    return labels[project.status] || "قيد التخطيط";
  },

  getProjectStatusClass(project = {}) {
    const status = project.status;

    if ([this.status.ACTIVE, this.status.IN_PROGRESS].includes(status)) {
      return "active";
    }

    if (status === this.status.COMPLETED) {
      return "completed";
    }

    if ([this.status.PAUSED, this.status.BLOCKED].includes(status)) {
      return "blocked";
    }

    if (status === this.status.CANCELLED) {
      return "cancelled";
    }

    if (status === this.status.ARCHIVED) {
      return "archived";
    }

    if (status === this.status.APPROVED) {
      return "approved";
    }

    if (status === this.status.STUDY) {
      return "study";
    }

    return "planned";
  },

  getProjectStatusIcon(project = {}) {
    const icons = {
      [this.status.PLANNED]: "📝",
      [this.status.STUDY]: "🔎",
      [this.status.APPROVED]: "✅",
      [this.status.ACTIVE]: "🟢",
      [this.status.IN_PROGRESS]: "🚀",
      [this.status.PAUSED]: "⏸️",
      [this.status.BLOCKED]: "⚠️",
      [this.status.COMPLETED]: "🏁",
      [this.status.CANCELLED]: "⛔",
      [this.status.ARCHIVED]: "🗄️"
    };

    return icons[project.status] || "📁";
  },

  getProjectIcon(project = {}) {
    const department = this.normalizeStatus(
      project.department ??
      project.portfolio ??
      ""
    );

    if (department.includes("بيومتر")) return "👁️";
    if (department.includes("بوابات")) return "🛂";
    if (department.includes("صلاحيات")) return "🔐";
    if (department.includes("أمن")) return "🛡️";
    if (department.includes("تحليل")) return "📊";

    return "📁";
  },

  /* =======================================================
     Store Execution
  ======================================================= */

  executeStoreMethod(methodNames = [], argumentFactories = []) {
    const store = this.getStore();

    if (!store) {
      return {
        success: false,
        message: "مخزن بيانات المنصة غير متاح."
      };
    }

    const methodName = methodNames.find(
      name => typeof store[name] === "function"
    );

    if (!methodName) {
      return {
        success: false,
        message: "العملية المطلوبة غير مدعومة في Store V2.2."
      };
    }

    const method = store[methodName].bind(store);
    const factories = Array.isArray(argumentFactories)
      ? argumentFactories
      : [argumentFactories];

    let lastError = null;

    for (const factory of factories) {
      try {
        const args = typeof factory === "function"
          ? factory(method)
          : Array.isArray(factory)
            ? factory
            : [];

        const result = method(...args);

        if (result?.success === false) {
          return result;
        }

        if (result === false || result === null) {
          continue;
        }

        return this.normalizeActionResult(result);
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) {
      console.error(
        `AI Work Projects V5.0: ${methodName} failed.`,
        lastError
      );
    }

    return {
      success: false,
      message: "تعذر تنفيذ العملية.",
      error: lastError
    };
  },

  normalizeActionResult(result) {
    if (result?.success === true) return result;

    if (result && typeof result === "object") {
      return {
        success: true,
        ...result,
        result
      };
    }

    return {
      success: Boolean(result),
      result
    };
  },

  /* =======================================================
     Project Management
  ======================================================= */

  addProject(project = {}) {
    const normalized = this.normalizeProject({
      ...project,
      id:
        project.id ??
        `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt:
        project.createdAt ??
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString()
    });

    return this.executeStoreMethod(
      ["addProject", "createProject", "add"],
      [
        () => [normalized],
        () => ["projects", normalized]
      ]
    );
  },

  updateProject(projectId, changes = {}) {
    const updatedChanges = {
      ...changes,
      updatedAt: new Date().toISOString()
    };

    return this.executeStoreMethod(
      ["updateProject", "patchProject", "update", "patch"],
      [
        () => [projectId, updatedChanges],
        () => ["projects", projectId, updatedChanges],
        () => {
          const index = this.getRawProjects().findIndex(
            project => String(project?.id) === String(projectId)
          );

          return [`projects.${index}`, updatedChanges];
        }
      ]
    );
  },

  removeProject(projectId) {
    return this.executeStoreMethod(
      ["removeProject", "deleteProject", "remove"],
      [
        () => [projectId],
        () => ["projects", projectId]
      ]
    );
  },

  /* =======================================================
     Classification
  ======================================================= */

  isQuickWin(project = {}) {
    if (project.quickWin === true || project.isQuickWin === true) {
      return true;
    }

    const legacyStatus = this.normalizeStatus(
      project.rawStatus ??
      project.originalStatus ??
      project.statusLabel ??
      ""
    );

    if (["quick-win", "quickwin"].includes(legacyStatus)) {
      return true;
    }

    const duration = this.normalizeStatus(project.duration);
    const cost = this.normalizeStatus(project.cost);

    const shortDuration =
      duration.includes("3-4") ||
      duration.includes("3-5") ||
      duration.includes("قصير");

    const lowCost = ["منخفضة", "منخفض", "low"].includes(cost);

    return shortDuration && lowCost;
  },

  isHighPriority(project = {}) {
    const priority = this.normalizeStatus(project.priority);

    return [
      "عالية",
      "عالي",
      "استراتيجية",
      "استراتيجي",
      "high",
      "critical"
    ].includes(priority);
  },

  isLowCost(project = {}) {
    return ["منخفضة", "منخفض", "low"].includes(
      this.normalizeStatus(project.cost)
    );
  },

  isHighRisk(project = {}) {
    return [
      "عالية",
      "عالي",
      "high",
      "critical",
      "حرج"
    ].includes(
      this.normalizeStatus(project.riskLevel)
    );
  },

  isActive(project = {}) {
    return [
      this.status.ACTIVE,
      this.status.IN_PROGRESS
    ].includes(project.status);
  },

  isCompleted(project = {}) {
    return project.status === this.status.COMPLETED;
  },

  isBlocked(project = {}) {
    return [
      this.status.PAUSED,
      this.status.BLOCKED
    ].includes(project.status);
  },

  isOnTrack(project = {}) {
    return (
      !this.isHighRisk(project) &&
      !this.isBlocked(project) &&
      project.status !== this.status.CANCELLED
    );
  },

  groupByDepartment(projects = []) {
    return projects.reduce((groups, project) => {
      const department = project.department || "غير مصنف";

      if (!groups[department]) groups[department] = [];
      groups[department].push(project);

      return groups;
    }, {});
  },

  /* =======================================================
     Metrics
  ======================================================= */

  getPortfolioMetrics(projects = []) {
    const total = projects.length;
    const active = projects.filter(project => this.isActive(project)).length;
    const completed = projects.filter(project => this.isCompleted(project)).length;
    const blocked = projects.filter(project => this.isBlocked(project)).length;
    const highRisk = projects.filter(project => this.isHighRisk(project)).length;
    const highPriority = projects.filter(project => this.isHighPriority(project)).length;
    const quickWins = projects.filter(project => this.isQuickWin(project)).length;
    const lowCost = projects.filter(project => this.isLowCost(project)).length;
    const linkedToIdeas = projects.filter(project => Boolean(project.sourceIdeaId)).length;
    const onTrack = projects.filter(project => this.isOnTrack(project)).length;

    const averageProgress = total
      ? Math.round(
          projects.reduce(
            (sum, project) => sum + this.normalizePercent(project.progress),
            0
          ) / total
        )
      : 0;

    const averageReadiness = total
      ? Math.round(
          projects.reduce(
            (sum, project) => sum + this.normalizePercent(project.readiness),
            0
          ) / total
        )
      : 0;

    const completionRate = total
      ? this.normalizePercent((completed / total) * 100)
      : 0;

    const onTrackRate = total
      ? this.normalizePercent((onTrack / total) * 100)
      : 0;

    return {
      total,
      active,
      completed,
      blocked,
      highRisk,
      highPriority,
      quickWins,
      lowCost,
      linkedToIdeas,
      onTrack,
      averageProgress,
      averageReadiness,
      completionRate,
      onTrackRate
    };
  },

  getSystemHealth(fallback = 0) {
    const state = this.getState();

    return this.normalizePercent(
      state.summary?.systemHealth ??
      state.summary?.portfolioHealth ??
      state.health?.overall ??
      fallback,
      fallback
    );
  },

  /* =======================================================
     Selected Project
  ======================================================= */

  getSelectedProjectId() {
    try {
      return (
        sessionStorage.getItem(this.config.selectedProjectKey) ||
        localStorage.getItem(this.config.selectedProjectKey) ||
        null
      );
    } catch (error) {
      return null;
    }
  },

  saveSelectedProject(projectId) {
    try {
      sessionStorage.setItem(
        this.config.selectedProjectKey,
        String(projectId)
      );

      localStorage.setItem(
        this.config.selectedProjectKey,
        String(projectId)
      );
    } catch (error) {
      console.warn(
        "AI Work Projects V5.0: Unable to save selected project.",
        error
      );
    }
  },

  saveSelectedIdea(ideaId) {
    try {
      sessionStorage.setItem(
        this.config.selectedIdeaKey,
        String(ideaId)
      );

      localStorage.setItem(
        this.config.selectedIdeaKey,
        String(ideaId)
      );
    } catch (error) {
      console.warn(
        "AI Work Projects V5.0: Unable to save selected idea.",
        error
      );
    }
  },

  highlightSelectedProject() {
    if (!this._container) return;

    const selectedProjectId = this.getSelectedProjectId();

    this._container
      .querySelectorAll("[data-project-id]")
      .forEach(card => {
        card.classList.toggle(
          "selected",
          Boolean(selectedProjectId) &&
          String(card.dataset.projectId) === String(selectedProjectId)
        );
      });

    if (selectedProjectId) {
      const selectedCard = this._container.querySelector(
        `[data-project-id="${this.escapeSelector(selectedProjectId)}"]`
      );

      if (selectedCard) {
        window.setTimeout(() => {
          selectedCard.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        }, 120);
      }
    }
  },

  /* =======================================================
     Project Card
  ======================================================= */

  renderProjectCard(project) {
    const sourceIdea = this.getSourceIdea(project);
    const progress = this.normalizePercent(project.progress);
    const readiness = this.normalizePercent(project.readiness);
    const statusLabel = this.getProjectStatusLabel(project);
    const statusClass = this.getProjectStatusClass(project);
    const statusIcon = this.getProjectStatusIcon(project);
    const selectedProjectId = this.getSelectedProjectId();
    const isSelected =
      selectedProjectId &&
      String(selectedProjectId) === String(project.id);

    return `
      <article
        class="project-card ${isSelected ? "selected" : ""}"
        data-project-id="${this.escapeAttribute(project.id)}"
      >
        <div class="project-card-head">
          <div class="project-title-block">
            <div class="project-icon">
              ${this.escapeHtml(project.icon || "📁")}
            </div>

            <div>
              <span class="project-department">
                ${this.escapeHtml(project.department)}
              </span>

              <h3>
                ${this.escapeHtml(project.title)}
              </h3>

              ${
                project.englishTitle
                  ? `<strong>${this.escapeHtml(project.englishTitle)}</strong>`
                  : ""
              }
            </div>
          </div>

          <div class="project-badges">
            ${
              this.isQuickWin(project)
                ? `<span class="project-quickwin">Quick Win</span>`
                : ""
            }

            <span class="project-priority ${this.badgeClass(project.priority)}">
              ${this.escapeHtml(project.priority)}
            </span>

            <span class="project-status-badge ${statusClass}">
              ${statusIcon}
              ${this.escapeHtml(statusLabel)}
            </span>
          </div>
        </div>

        <div class="project-meta">
          <span>👤 ${this.escapeHtml(project.owner)}</span>
          <span>⏱️ ${this.escapeHtml(project.duration)}</span>
          <span>💰 ${this.escapeHtml(project.cost)}</span>
          <span>🛡️ ${this.escapeHtml(project.riskLevel)}</span>
          <span>📅 ${this.escapeHtml(this.formatDate(project.targetDate, "غير محدد"))}</span>
        </div>

        ${
          project.description
            ? `
              <div class="project-description">
                ${this.escapeHtml(project.description)}
              </div>
            `
            : ""
        }

        <div class="project-delivery-grid">
          <div class="project-progress-block">
            <div>
              <small>التقدم التنفيذي</small>
              <b>${progress}%</b>
            </div>

            <div class="aiw-progress">
              <div style="width:${progress}%"></div>
            </div>
          </div>

          <div class="project-progress-block">
            <div>
              <small>جاهزية التنفيذ</small>
              <b>${readiness}%</b>
            </div>

            <div class="aiw-progress readiness">
              <div style="width:${readiness}%"></div>
            </div>
          </div>
        </div>

        ${
          sourceIdea
            ? `
              <div class="project-origin-box">
                <div>
                  <span>💡 الفكرة الأصلية</span>
                  <strong>${this.escapeHtml(sourceIdea.title || "فكرة مرتبطة")}</strong>
                </div>

                <button
                  type="button"
                  class="project-inline-action"
                  data-project-action="open-idea"
                  data-project-id="${this.escapeAttribute(project.id)}"
                  data-idea-id="${this.escapeAttribute(sourceIdea.id)}"
                >
                  فتح الفكرة
                </button>
              </div>
            `
            : `
              <div class="project-origin-box manual">
                <div>
                  <span>📁 مصدر المشروع</span>
                  <strong>مشروع مسجل مباشرة</strong>
                </div>
              </div>
            `
        }

        <div class="project-actions">
          <button
            type="button"
            class="project-action-button primary"
            data-project-action="details"
            data-project-id="${this.escapeAttribute(project.id)}"
          >
            عرض التفاصيل
          </button>

          <button
            type="button"
            class="project-action-button secondary"
            data-project-action="select"
            data-project-id="${this.escapeAttribute(project.id)}"
          >
            تحديد المشروع
          </button>
        </div>
      </article>
    `;
  },

  /* =======================================================
     Portfolio Sections
  ======================================================= */

  renderDepartmentPortfolio(projects = []) {
    const grouped = this.groupByDepartment(projects);
    const entries = Object.entries(grouped);

    if (!entries.length) {
      return `<div class="module-empty">لا توجد محافظ مشاريع حالياً.</div>`;
    }

    return `
      <div class="project-portfolio-grid">
        ${entries
          .map(([department, departmentProjects]) => {
            const metrics = this.getPortfolioMetrics(departmentProjects);

            return `
              <div class="project-portfolio-chip">
                <strong>${this.escapeHtml(department)}</strong>
                <span>
                  ${departmentProjects.length} مشاريع
                  · ${metrics.averageProgress}% تقدم
                  · ${metrics.highRisk} مخاطر عالية
                </span>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  },

  renderExecutionPriority(projects = []) {
    const ranked = [...projects]
      .sort((a, b) => {
        const scoreA =
          (this.isHighPriority(a) ? 30 : 0) +
          (this.isQuickWin(a) ? 25 : 0) +
          (this.isLowCost(a) ? 15 : 0) +
          this.normalizePercent(a.readiness);

        const scoreB =
          (this.isHighPriority(b) ? 30 : 0) +
          (this.isQuickWin(b) ? 25 : 0) +
          (this.isLowCost(b) ? 15 : 0) +
          this.normalizePercent(b.readiness);

        return scoreB - scoreA;
      })
      .slice(0, 3);

    if (!ranked.length) {
      return `<div class="module-empty">لا توجد مشاريع لترتيب الأولوية.</div>`;
    }

    return `
      <div class="execution-order">
        ${ranked
          .map((project, index) => `
            <div>
              <b>${index + 1}</b>

              <span>
                <strong>${this.escapeHtml(project.title)}</strong>
                <small>
                  ${this.escapeHtml(project.department)}
                  · جاهزية ${this.normalizePercent(project.readiness)}%
                </small>
              </span>
            </div>
          `)
          .join("")}
      </div>
    `;
  },

  /* =======================================================
     Main Render
  ======================================================= */

  render(container) {
    if (!container || this._isRendering) return;

    this._isRendering = true;
    this._container = container;

    try {
      this.injectStyles();

      const projects = this.getProjects();
      const metrics = this.getPortfolioMetrics(projects);
      const systemHealth = this.getSystemHealth(metrics.onTrackRate);

      container.innerHTML = `
        <section class="module-page">
          <div class="module-hero">
            <span class="module-kicker">
              Biometric AI Project Delivery Center
            </span>

            <h1>
              مركز تنفيذ مشاريع الذكاء الاصطناعي
            </h1>

            <p>
              إدارة المشاريع التنفيذية الفعلية من Store V2.2،
              وربط كل مشروع بالفكرة الأصلية ومؤشرات التقدم والمخاطر والجاهزية.
            </p>

            <div class="aiw-chip-row">
              <span class="aiw-chip">📁 ${metrics.total} مشروع</span>
              <span class="aiw-chip">🚀 ${metrics.active} نشط</span>
              <span class="aiw-chip">✅ ${metrics.completed} مكتمل</span>
              <span class="aiw-chip">⚠️ ${metrics.highRisk} مخاطر عالية</span>
              <span class="aiw-chip">📊 ${metrics.averageProgress}% متوسط التقدم</span>
              <span class="aiw-chip">🔗 ${metrics.linkedToIdeas} مرتبطة بأفكار</span>
            </div>
          </div>

          <div class="module-grid">
            ${this.kpi("إجمالي المشاريع", metrics.total, "Project Portfolio")}
            ${this.kpi("المشاريع النشطة", metrics.active, "Active Delivery")}
            ${this.kpi("المشاريع المكتملة", metrics.completed, "Completed")}
            ${this.kpi("متوسط التقدم", `${metrics.averageProgress}%`, "Delivery Progress")}
            ${this.kpi("على المسار", `${metrics.onTrackRate}%`, "On Track")}
            ${this.kpi("صحة الأنظمة", `${systemHealth}%`, "System Health")}
          </div>

          <div class="module-wide-grid">
            <div class="module-panel">
              <div class="module-section-title compact">
                <h2>الملخص التنفيذي</h2>

                <p>
                  قراءة مباشرة لحالة Portfolio المشاريع من البيانات الفعلية.
                </p>
              </div>

              <div class="portfolio-summary-box">
                <strong>
                  ${this.escapeHtml(this.getExecutiveHeadline(metrics))}
                </strong>

                <p>
                  ${this.escapeHtml(this.getExecutiveSummary(metrics))}
                </p>
              </div>
            </div>

            <div class="module-panel">
              <div class="module-section-title compact">
                <h2>أولوية التنفيذ</h2>

                <p>
                  ترتيب ديناميكي بناءً على الأولوية والجاهزية والتكلفة.
                </p>
              </div>

              ${this.renderExecutionPriority(projects)}
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>خريطة محافظ المشاريع</h2>

              <p>
                توزيع المشاريع حسب النطاق التشغيلي والتقدم والمخاطر.
              </p>
            </div>

            ${this.renderDepartmentPortfolio(projects)}
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>قائمة المشاريع التنفيذية</h2>

              <p>
                ${metrics.total} مشروعاً مسجلاً في Store V2.2.
                لا توجد بيانات افتراضية داخل هذه الوحدة.
              </p>
            </div>

            ${
              projects.length
                ? `
                  <div class="projects-grid">
                    ${projects
                      .map(project => this.renderProjectCard(project))
                      .join("")}
                  </div>
                `
                : `
                  <div class="module-empty">
                    لا توجد مشاريع مسجلة حالياً.
                    يتم إنشاء المشاريع من الأفكار المعتمدة أو من خلال Store.
                  </div>
                `
            }
          </div>
        </section>
      `;

      this.bindActionEvents();
      this.bindAutomaticSync();
      this.highlightSelectedProject();
    } finally {
      this._isRendering = false;
    }
  },

  getExecutiveHeadline(metrics = {}) {
    if (!metrics.total) {
      return "المحفظة جاهزة لاستقبال أول مشروع تنفيذي";
    }

    if (metrics.highRisk > metrics.active && metrics.highRisk > 0) {
      return "الأولوية الحالية هي خفض مخاطر المشاريع قبل التوسع";
    }

    if (metrics.active > 0 && metrics.averageProgress >= 60) {
      return "المحفظة تتحرك باتجاه تشغيل فعلي بمستوى تقدم جيد";
    }

    if (metrics.quickWins > 0) {
      return "أفضل بداية هي تسريع مشاريع Quick Wins الأعلى جاهزية";
    }

    return "المحفظة تحتاج ترتيب التنفيذ حسب الجاهزية والأثر";
  },

  getExecutiveSummary(metrics = {}) {
    if (!metrics.total) {
      return (
        "لا توجد مشاريع محفوظة حالياً. بعد اعتماد أي فكرة في مركز الأفكار، " +
        "سيتم إنشاء المشروع وربطه تلقائياً بالمصدر الأصلي."
      );
    }

    return (
      `تضم المحفظة ${metrics.total} مشروعاً، منها ${metrics.active} قيد التنفيذ ` +
      `و${metrics.completed} مكتملة. متوسط التقدم ${metrics.averageProgress}%، ` +
      `ونسبة المشاريع على المسار ${metrics.onTrackRate}%. توجد ${metrics.highRisk} ` +
      `مشاريع بمخاطر عالية و${metrics.linkedToIdeas} مشاريع مرتبطة بأفكار معتمدة.`
    );
  },

  /* =======================================================
     Actions
  ======================================================= */

  bindActionEvents() {
    if (this._eventsBound || !this._container) return;

    this._eventsBound = true;

    this._container.addEventListener("click", event => {
      const button = event.target.closest("[data-project-action]");

      if (!button || !this._container?.contains(button)) return;

      const action = button.dataset.projectAction;
      const projectId = button.dataset.projectId;
      const ideaId = button.dataset.ideaId;

      if (!action) return;

      event.preventDefault();

      if (action === "details" && projectId) {
        this.openProjectDetails(projectId);
        return;
      }

      if (action === "select" && projectId) {
        this.selectProject(projectId);
        return;
      }

      if (action === "open-idea" && ideaId) {
        this.openSourceIdea(ideaId, projectId);
      }
    });
  },

  selectProject(projectId) {
    const project = this.getProjectById(projectId);

    if (!project) {
      this.showToast("لم يتم العثور على المشروع.", "error");
      return;
    }

    this.saveSelectedProject(projectId);
    this.highlightSelectedProject();

    try {
      window.dispatchEvent(
        new CustomEvent("aiw:projectSelected", {
          detail: {
            projectId: project.id,
            sourceIdeaId: project.sourceIdeaId || null
          }
        })
      );
    } catch (error) {
      console.warn("AI Work Projects V5.0: projectSelected event failed.", error);
    }

    this.showToast("تم تحديد المشروع بنجاح.", "success");
  },

  openSourceIdea(ideaId, projectId = null) {
    const idea = this.getIdeaById(ideaId);

    if (!idea) {
      this.showToast("تعذر العثور على الفكرة الأصلية.", "error");
      return;
    }

    this.saveSelectedIdea(ideaId);

    if (projectId) {
      this.saveSelectedProject(projectId);
    }

    try {
      window.dispatchEvent(
        new CustomEvent("aiw:openIdea", {
          detail: {
            ideaId,
            projectId
          }
        })
      );
    } catch (error) {
      console.warn("AI Work Projects V5.0: openIdea event failed.", error);
    }

    if (typeof window.AIW?.App?.go === "function") {
      window.AIW.App.go("ideas");
      return;
    }

    if (typeof window.AIW?.Router?.go === "function") {
      window.AIW.Router.go("ideas");
      return;
    }

    window.location.hash = "#ideas";
  },

  /* =======================================================
     Details Modal
  ======================================================= */

  openProjectDetails(projectId) {
    const project = this.getProjectById(projectId);

    if (!project) {
      this.showToast("لم يتم العثور على المشروع.", "error");
      return;
    }

    this.closeProjectDetails();
    this.saveSelectedProject(projectId);

    const sourceIdea = this.getSourceIdea(project);
    const modal = document.createElement("div");

    modal.className = "project-details-overlay";

    modal.innerHTML = `
      <div
        class="project-details-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-details-title"
      >
        <button
          type="button"
          class="project-details-close"
          data-project-details-close
          aria-label="إغلاق"
        >
          ×
        </button>

        <div class="project-details-heading">
          <div class="project-details-icon">
            ${this.escapeHtml(project.icon)}
          </div>

          <div>
            <span>
              ${this.escapeHtml(project.department)}
            </span>

            <h3 id="project-details-title">
              ${this.escapeHtml(project.title)}
            </h3>

            ${
              project.englishTitle
                ? `<small>${this.escapeHtml(project.englishTitle)}</small>`
                : ""
            }
          </div>
        </div>

        <div class="project-details-status">
          <span class="project-status-badge ${this.getProjectStatusClass(project)}">
            ${this.getProjectStatusIcon(project)}
            ${this.escapeHtml(this.getProjectStatusLabel(project))}
          </span>

          <span class="project-priority ${this.badgeClass(project.priority)}">
            ${this.escapeHtml(project.priority)}
          </span>
        </div>

        <div class="project-details-kpis">
          <div>
            <small>التقدم</small>
            <strong>${this.normalizePercent(project.progress)}%</strong>
          </div>

          <div>
            <small>الجاهزية</small>
            <strong>${this.normalizePercent(project.readiness)}%</strong>
          </div>

          <div>
            <small>المخاطر</small>
            <strong>${this.escapeHtml(project.riskLevel)}</strong>
          </div>

          <div>
            <small>المالك</small>
            <strong>${this.escapeHtml(project.owner)}</strong>
          </div>
        </div>

        ${
          project.description
            ? `
              <div class="project-details-section">
                <strong>وصف المشروع</strong>
                <p>${this.escapeHtml(project.description)}</p>
              </div>
            `
            : ""
        }

        <div class="project-details-section">
          <strong>معلومات التنفيذ</strong>

          <div class="project-details-list">
            <span>المدة: ${this.escapeHtml(project.duration)}</span>
            <span>التكلفة: ${this.escapeHtml(project.cost)}</span>
            <span>تاريخ البداية: ${this.escapeHtml(this.formatDate(project.startDate, "غير محدد"))}</span>
            <span>التاريخ المستهدف: ${this.escapeHtml(this.formatDate(project.targetDate, "غير محدد"))}</span>
          </div>
        </div>

        ${
          sourceIdea
            ? `
              <div class="project-details-section source">
                <strong>الفكرة الأصلية</strong>
                <p>${this.escapeHtml(sourceIdea.title || "فكرة مرتبطة")}</p>

                <button
                  type="button"
                  class="project-action-button secondary"
                  data-modal-open-idea
                  data-idea-id="${this.escapeAttribute(sourceIdea.id)}"
                  data-project-id="${this.escapeAttribute(project.id)}"
                >
                  فتح الفكرة الأصلية
                </button>
              </div>
            `
            : ""
        }

        ${
          project.milestones.length
            ? `
              <div class="project-details-section">
                <strong>المراحل الرئيسية</strong>

                <div class="project-milestones-list">
                  ${project.milestones
                    .map((milestone, index) => `
                      <div>
                        <b>${index + 1}</b>
                        <span>
                          ${this.escapeHtml(
                            milestone?.title ||
                            milestone?.name ||
                            String(milestone)
                          )}
                        </span>
                      </div>
                    `)
                    .join("")}
                </div>
              </div>
            `
            : ""
        }

        ${
          project.kpis.length
            ? `
              <div class="project-details-section">
                <strong>مؤشرات المشروع</strong>

                <div class="project-kpis-list">
                  ${project.kpis
                    .map(kpi => `
                      <div>
                        <span>
                          ${this.escapeHtml(
                            kpi?.title ||
                            kpi?.name ||
                            "مؤشر"
                          )}
                        </span>

                        <strong>
                          ${this.escapeHtml(
                            kpi?.value ??
                            kpi?.target ??
                            "غير محدد"
                          )}
                        </strong>
                      </div>
                    `)
                    .join("")}
                </div>
              </div>
            `
            : ""
        }
      </div>
    `;

    document.body.appendChild(modal);
    this._detailsModal = modal;

    modal.addEventListener("click", event => {
      if (
        event.target === modal ||
        event.target.closest("[data-project-details-close]")
      ) {
        this.closeProjectDetails();
        return;
      }

      const ideaButton = event.target.closest("[data-modal-open-idea]");

      if (ideaButton) {
        const ideaId = ideaButton.dataset.ideaId;
        const linkedProjectId = ideaButton.dataset.projectId;

        this.closeProjectDetails();
        this.openSourceIdea(ideaId, linkedProjectId);
      }
    });

    modal.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        this.closeProjectDetails();
      }
    });

    requestAnimationFrame(() => {
      modal.classList.add("visible");
    });
  },

  closeProjectDetails() {
    if (!this._detailsModal) return;

    const modal = this._detailsModal;

    modal.classList.remove("visible");

    window.setTimeout(() => {
      modal.remove();
    }, 180);

    this._detailsModal = null;
  },

  /* =======================================================
     Toast
  ======================================================= */

  showToast(message, type = "success") {
    document.querySelector(".project-workflow-toast")?.remove();

    const toast = document.createElement("div");

    toast.className = `project-workflow-toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("visible");
    });

    window.setTimeout(() => {
      toast.classList.remove("visible");

      window.setTimeout(() => {
        toast.remove();
      }, 200);
    }, 2600);
  },

  /* =======================================================
     Synchronization
  ======================================================= */

  scheduleRefresh() {
    window.clearTimeout(this._refreshTimer);

    this._refreshTimer = window.setTimeout(() => {
      if (!this._container?.isConnected) return;
      this.render(this._container);
    }, this.config.refreshDelay);
  },

  bindAutomaticSync() {
    if (this._syncBound) return;

    this._syncBound = true;

    const refresh = () => this.scheduleRefresh();

    const events = [
      "aiw:dataChanged",
      "aiw:dataUpdated",
      "aiw:dataImported",
      "aiw:dataRestored",
      "aiw:dataReset",
      "aiw:storeChanged",
      "aiw:projectsChanged",
      "aiw:projectsUpdated",
      "aiw:projectCreated",
      "aiw:projectUpdated",
      "aiw:projectRemoved",
      "aiw:projectArchived",
      "aiw:projectCreatedFromIdea",
      "aiw:ideaConvertedToProject",
      "aiw:ideaUpdated"
    ];

    events.forEach(eventName => {
      window.addEventListener(eventName, refresh);
    });

    const store = this.getStore();

    if (typeof store?.subscribe === "function") {
      this._unsubscribeStore = store.subscribe(refresh);
    }

    window.addEventListener("storage", event => {
      const supportedKeys = [
        window.AIW?.KEYS?.DATA,
        "atcDataV1",
        "aiwDataV1",
        "aiwData",
        "AIW_DATA"
      ].filter(Boolean);

      if (!event.key || supportedKeys.includes(event.key)) {
        refresh();
      }
    });
  },

  destroy() {
    window.clearTimeout(this._refreshTimer);

    if (typeof this._unsubscribeStore === "function") {
      this._unsubscribeStore();
    }

    this._unsubscribeStore = null;
    this._container = null;
    this._eventsBound = false;
    this._syncBound = false;
    this.closeProjectDetails();
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

  badgeClass(value) {
    const normalized = this.normalizeStatus(value);

    if (["عالية", "عالي", "high", "critical"].includes(normalized)) {
      return "high";
    }

    if (["متوسطة", "متوسط", "medium"].includes(normalized)) {
      return "medium";
    }

    if (["منخفضة", "منخفض", "low"].includes(normalized)) {
      return "low";
    }

    return "";
  },

  /* =======================================================
     Styles
  ======================================================= */

  injectStyles() {
    if (document.getElementById(this.config.styleId)) return;

    const style = document.createElement("style");

    style.id = this.config.styleId;

    style.textContent = `
      .project-card {
        position: relative;
        transition:
          transform 0.2s ease,
          border-color 0.2s ease,
          box-shadow 0.2s ease;
      }

      .project-card.selected {
        border-color: rgba(49, 89, 191, 0.58);
        box-shadow:
          0 0 0 3px rgba(49, 89, 191, 0.1),
          0 18px 40px rgba(15, 23, 42, 0.1);
      }

      .project-card.selected::before {
        content: "المشروع المحدد";
        position: absolute;
        top: 12px;
        left: 12px;
        z-index: 2;
        padding: 5px 9px;
        border-radius: 999px;
        color: #ffffff;
        background: #3159bf;
        font-size: 10px;
        font-weight: 800;
      }

      .project-title-block {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        min-width: 0;
      }

      .project-title-block > div:last-child {
        min-width: 0;
      }

      .project-department {
        display: block;
        margin-bottom: 5px;
        color: #667085;
        font-size: 12px;
        font-weight: 700;
      }

      .project-badges {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 7px;
      }

      .project-quickwin,
      .project-priority,
      .project-status-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        min-height: 32px;
        padding: 6px 10px;
        border: 1px solid transparent;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 800;
        line-height: 1.2;
        white-space: nowrap;
      }

      .project-quickwin {
        color: #087d3e;
        background: #e2f7ea;
        border-color: #c8efd7;
      }

      .project-priority {
        color: #475467;
        background: #f2f4f7;
        border-color: #e4e7ec;
      }

      .project-priority.high {
        color: #b42318;
        background: #feeceb;
        border-color: #fbd3d0;
      }

      .project-priority.medium {
        color: #b75c00;
        background: #fff3d9;
        border-color: #ffe4ac;
      }

      .project-priority.low {
        color: #087d3e;
        background: #e2f7ea;
        border-color: #c8efd7;
      }

      .project-status-badge.planned,
      .project-status-badge.study {
        color: #3159bf;
        background: #edf3ff;
        border-color: #dbe7ff;
      }

      .project-status-badge.approved {
        color: #087d3e;
        background: #e2f7ea;
        border-color: #c8efd7;
      }

      .project-status-badge.active {
        color: #ffffff;
        background: #087d3e;
        border-color: #087d3e;
      }

      .project-status-badge.completed {
        color: #ffffff;
        background: #101b2f;
        border-color: #101b2f;
      }

      .project-status-badge.blocked {
        color: #b42318;
        background: #feeceb;
        border-color: #fbd3d0;
      }

      .project-status-badge.cancelled,
      .project-status-badge.archived {
        color: #667085;
        background: #f2f4f7;
        border-color: #e4e7ec;
      }

      .project-description {
        margin-top: 15px;
        color: #667085;
        font-size: 14px;
        line-height: 1.8;
      }

      .project-delivery-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
        margin-top: 18px;
      }

      .project-progress-block > div:first-child {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 8px;
      }

      .project-progress-block small {
        color: #667085;
        font-size: 12px;
        font-weight: 700;
      }

      .project-progress-block b {
        color: #101828;
        font-size: 13px;
      }

      .aiw-progress.readiness > div {
        opacity: 0.72;
      }

      .project-origin-box {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        margin-top: 18px;
        padding: 14px;
        border: 1px solid #dbe7ff;
        border-radius: 16px;
        background: #f7faff;
      }

      .project-origin-box.manual {
        border-color: #e4e7ec;
        background: #f9fafb;
      }

      .project-origin-box > div {
        min-width: 0;
      }

      .project-origin-box span {
        display: block;
        margin-bottom: 4px;
        color: #667085;
        font-size: 11px;
        font-weight: 700;
      }

      .project-origin-box strong {
        display: block;
        overflow: hidden;
        color: #101828;
        font-size: 13px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .project-inline-action {
        appearance: none;
        flex: 0 0 auto;
        min-height: 36px;
        padding: 8px 11px;
        border: 1px solid #dbe7ff;
        border-radius: 11px;
        color: #3159bf;
        background: #ffffff;
        font: inherit;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
      }

      .project-actions {
        display: grid;
        grid-template-columns: 1.2fr 1fr;
        gap: 10px;
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid rgba(15, 23, 42, 0.08);
      }

      .project-action-button {
        appearance: none;
        min-height: 43px;
        padding: 10px 14px;
        border: 0;
        border-radius: 13px;
        font: inherit;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
        transition:
          transform 0.18s ease,
          opacity 0.18s ease;
      }

      .project-action-button:active {
        transform: scale(0.98);
      }

      .project-action-button.primary {
        color: #ffffff;
        background: #101b2f;
      }

      .project-action-button.secondary {
        color: #344054;
        background: #f2f4f7;
        border: 1px solid #e4e7ec;
      }

      .project-portfolio-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .project-portfolio-chip {
        min-width: 0;
        padding: 15px;
        border: 1px solid rgba(15, 23, 42, 0.07);
        border-radius: 18px;
        background: #f8fafc;
      }

      .project-portfolio-chip strong {
        display: block;
        margin-bottom: 6px;
        color: #101828;
        font-size: 14px;
      }

      .project-portfolio-chip span {
        color: #667085;
        font-size: 12px;
        line-height: 1.7;
      }

      .execution-order span {
        min-width: 0;
      }

      .execution-order span strong,
      .execution-order span small {
        display: block;
      }

      .execution-order span small {
        margin-top: 4px;
        color: #667085;
        font-size: 11px;
      }

      .project-details-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding:
          24px
          18px
          calc(24px + env(safe-area-inset-bottom));
        direction: rtl;
        background: rgba(15, 23, 42, 0.48);
        backdrop-filter: blur(10px);
        opacity: 0;
        transition: opacity 0.18s ease;
      }

      .project-details-overlay.visible {
        opacity: 1;
      }

      .project-details-dialog {
        position: relative;
        width: min(100%, 620px);
        max-height: min(86vh, 780px);
        overflow-y: auto;
        padding: 28px 22px 22px;
        border-radius: 28px;
        background: #ffffff;
        box-shadow: 0 28px 80px rgba(15, 23, 42, 0.28);
        transform: translateY(12px) scale(0.98);
        transition: transform 0.18s ease;
      }

      .project-details-overlay.visible .project-details-dialog {
        transform: translateY(0) scale(1);
      }

      .project-details-close {
        position: absolute;
        top: 14px;
        left: 15px;
        width: 36px;
        height: 36px;
        border: 0;
        border-radius: 50%;
        color: #475467;
        background: #f2f4f7;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
      }

      .project-details-heading {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding-left: 42px;
      }

      .project-details-icon {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 62px;
        height: 62px;
        border-radius: 20px;
        font-size: 30px;
        background: #101b2f;
      }

      .project-details-heading span {
        display: block;
        margin-bottom: 4px;
        color: #667085;
        font-size: 12px;
        font-weight: 700;
      }

      .project-details-heading h3 {
        margin: 0;
        color: #101828;
        font-size: 23px;
        line-height: 1.5;
      }

      .project-details-heading small {
        display: block;
        margin-top: 5px;
        color: #667085;
        font-size: 12px;
      }

      .project-details-status {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 20px;
      }

      .project-details-kpis {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
        margin-top: 20px;
      }

      .project-details-kpis > div {
        min-width: 0;
        padding: 13px 10px;
        border-radius: 16px;
        text-align: center;
        background: #f7f8fa;
      }

      .project-details-kpis small,
      .project-details-kpis strong {
        display: block;
      }

      .project-details-kpis small {
        margin-bottom: 5px;
        color: #667085;
        font-size: 11px;
      }

      .project-details-kpis strong {
        overflow: hidden;
        color: #101828;
        font-size: 14px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .project-details-section {
        margin-top: 20px;
        padding-top: 18px;
        border-top: 1px solid rgba(15, 23, 42, 0.08);
      }

      .project-details-section > strong {
        display: block;
        margin-bottom: 9px;
        color: #101828;
        font-size: 14px;
      }

      .project-details-section > p {
        margin: 0;
        color: #667085;
        font-size: 14px;
        line-height: 1.8;
      }

      .project-details-section.source {
        padding: 16px;
        border: 1px solid #dbe7ff;
        border-radius: 18px;
        background: #f7faff;
      }

      .project-details-list {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 9px;
      }

      .project-details-list span {
        padding: 10px 12px;
        border-radius: 12px;
        color: #475467;
        background: #f9fafb;
        font-size: 12px;
      }

      .project-milestones-list,
      .project-kpis-list {
        display: grid;
        gap: 9px;
      }

      .project-milestones-list > div,
      .project-kpis-list > div {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 11px 12px;
        border-radius: 13px;
        background: #f9fafb;
      }

      .project-milestones-list b {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        color: #ffffff;
        background: #101b2f;
        font-size: 11px;
      }

      .project-milestones-list span,
      .project-kpis-list span {
        flex: 1;
        color: #475467;
        font-size: 12px;
      }

      .project-kpis-list strong {
        color: #101828;
        font-size: 12px;
      }

      .project-workflow-toast {
        position: fixed;
        right: 50%;
        bottom: calc(108px + env(safe-area-inset-bottom));
        z-index: 100000;
        width: min(calc(100% - 36px), 420px);
        box-sizing: border-box;
        padding: 14px 17px;
        border-radius: 16px;
        color: #ffffff;
        text-align: center;
        font-size: 14px;
        font-weight: 800;
        line-height: 1.6;
        background: #101b2f;
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.25);
        opacity: 0;
        transform: translateX(50%) translateY(14px);
        transition:
          opacity 0.2s ease,
          transform 0.2s ease;
      }

      .project-workflow-toast.visible {
        opacity: 1;
        transform: translateX(50%) translateY(0);
      }

      .project-workflow-toast.success {
        background: #087d3e;
      }

      .project-workflow-toast.error {
        background: #b42318;
      }

      @media (max-width: 760px) {
        .project-card-head {
          align-items: flex-start;
        }

        .project-badges {
          justify-content: flex-start;
        }

        .project-delivery-grid,
        .project-portfolio-grid {
          grid-template-columns: 1fr;
        }

        .project-actions {
          grid-template-columns: 1fr;
        }

        .project-origin-box {
          align-items: flex-start;
          flex-direction: column;
        }

        .project-inline-action {
          width: 100%;
        }

        .project-details-kpis {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .project-details-list {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  },

  /* =======================================================
     Utilities
  ======================================================= */

  normalizeStatus(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/_/g, "-");
  },

  toSafeNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  },

  normalizePercent(value, fallback = 0) {
    return Math.min(
      100,
      Math.max(
        0,
        Math.round(this.toSafeNumber(value, fallback))
      )
    );
  },

  formatDate(value, fallback = "") {
    if (!value) return fallback;

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return String(value);
      }

      return date.toLocaleDateString("ar-AE", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch (error) {
      return String(value);
    }
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

  escapeSelector(value) {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(String(value));
    }

    return String(value).replace(/["\\]/g, "\\$&");
  }
};
