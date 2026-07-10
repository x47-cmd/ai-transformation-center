/* =========================================================
   AI Work - Ideas Module V5.1
   Enterprise Biometric AI Opportunity Center
   Store V2.2 Native Architecture

   File Path:
   js/modules/ideas/ideas.js

   Features:
   - AIW.Store V2.2 as Single Source of Truth
   - Persistent idea lifecycle
   - Submit / Approve / Reject / Reopen workflow
   - Safe idea-to-project conversion
   - Duplicate conversion prevention
   - Bidirectional idea/project linking
   - Selected project navigation
   - Dynamic portfolio calculations
   - Store subscription + cross-page synchronization
   - Confirmation modal + toast notifications
   - Workflow styles without changing core UI design
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.ideas = {
  id: "ideas",
  title: "الأفكار",
  icon: "💡",
  version: "5.1.0",

  _container: null,
  _unsubscribeStore: null,
  _refreshTimer: null,
  _modal: null,
  _pendingAction: null,
  _selectedIdeaId: null,
  _eventsBound: false,
  _syncBound: false,
  _isRendering: false,
  _isExecuting: false,

  config: {
    actor: "الإدارة",
    targetIdeas: 100,
    refreshDelay: 80,
    selectedProjectKey: "aiwSelectedProjectId",
    selectedIdeaKey: "aiwSelectedIdeaId",
    styleId: "aiw-ideas-v51-styles"
  },

  lifecycle: {
    IDEA: "idea",
    DRAFT: "draft",
    SUBMITTED: "submitted",
    PENDING: "pending-approval",
    APPROVED: "approved",
    REJECTED: "rejected",
    CONVERTED: "converted-to-project",
    ARCHIVED: "archived"
  },

  approvalStatus: {
    NOT_SUBMITTED: "not-submitted",
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    CANCELLED: "cancelled"
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
      console.error("AI Work Ideas V5.1: AIW.Store is unavailable.");
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
      console.error("AI Work Ideas V5.1: Unable to read Store state.", error);
    }

    return {};
  },

  getCollection(name) {
    const collection = this.getState()?.[name];
    return Array.isArray(collection) ? collection : [];
  },

  /* =======================================================
     Ideas & Projects Readers
  ======================================================= */

  getRawIdeas() {
    const store = this.getStore();

    try {
      if (typeof store?.getIdeas === "function") {
        const ideas = store.getIdeas();
        if (Array.isArray(ideas)) return ideas;
      }
    } catch (error) {
      console.warn("AI Work Ideas V5.1: getIdeas failed.", error);
    }

    return this.getCollection("ideas");
  },

  getProjects() {
    const store = this.getStore();

    try {
      if (typeof store?.getProjects === "function") {
        const projects = store.getProjects();
        if (Array.isArray(projects)) return projects;
      }
    } catch (error) {
      console.warn("AI Work Ideas V5.1: getProjects failed.", error);
    }

    return this.getCollection("projects");
  },

  getIdeaById(ideaId) {
    if (ideaId === null || ideaId === undefined || ideaId === "") return null;

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
      console.warn("AI Work Ideas V5.1: Idea lookup failed.", error);
    }

    return (
      this.getRawIdeas().find(
        idea => String(idea?.id) === String(ideaId)
      ) || null
    );
  },

  getProjectById(projectId) {
    if (projectId === null || projectId === undefined || projectId === "") {
      return null;
    }

    const store = this.getStore();

    try {
      if (typeof store?.getProject === "function") {
        const project = store.getProject(projectId);
        if (project) return project;
      }

      if (typeof store?.find === "function") {
        const project = store.find("projects", projectId);
        if (project) return project;
      }
    } catch (error) {
      console.warn("AI Work Ideas V5.1: Project lookup failed.", error);
    }

    return (
      this.getProjects().find(
        project => String(project?.id) === String(projectId)
      ) || null
    );
  },

  getProjectByIdeaId(ideaId) {
    if (ideaId === null || ideaId === undefined || ideaId === "") return null;

    const store = this.getStore();

    try {
      if (typeof store?.getProjectByIdeaId === "function") {
        const project = store.getProjectByIdeaId(ideaId);
        if (project) return project;
      }
    } catch (error) {
      console.warn("AI Work Ideas V5.1: getProjectByIdeaId failed.", error);
    }

    const idea = this.getIdeaById(ideaId);

    if (idea?.projectId) {
      const linkedProject = this.getProjectById(idea.projectId);
      if (linkedProject) return linkedProject;
    }

    return (
      this.getProjects().find(project => {
        const sourceIdeaId =
          project?.sourceIdeaId ??
          project?.ideaId ??
          project?.origin?.ideaId ??
          project?.source?.ideaId ??
          null;

        return String(sourceIdeaId) === String(ideaId);
      }) || null
    );
  },

  getIdeas() {
    const storedIdeas = this.getRawIdeas();

    let enrichedIdeas = storedIdeas;

    try {
      const analytics = window.AIW?.BiometricAnalytics;

      if (typeof analytics?.enrichIdeas === "function") {
        const result = analytics.enrichIdeas(
          storedIdeas.map(idea => ({ ...idea }))
        );

        if (Array.isArray(result)) {
          enrichedIdeas = result;
        }
      }
    } catch (error) {
      console.warn("AI Work Ideas V5.1: Idea enrichment failed.", error);
    }

    return enrichedIdeas.map((idea, index) => ({
      ...(storedIdeas[index] || {}),
      ...(idea || {}),
      id: idea?.id ?? storedIdeas[index]?.id
    }));
  },

  /* =======================================================
     Generic Store Execution
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
        `AI Work Ideas V5.1: ${methodName} failed.`,
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
    if (result?.success === true) {
      return result;
    }

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
     CRUD
  ======================================================= */

  addIdea(idea = {}) {
    return this.executeStoreMethod(
      ["addIdea", "createIdea", "add"],
      [
        () => [idea],
        () => ["ideas", idea]
      ]
    );
  },

  updateIdea(ideaId, changes = {}) {
    return this.executeStoreMethod(
      ["updateIdea", "patchIdea", "update", "patch"],
      [
        () => [ideaId, changes],
        () => ["ideas", ideaId, changes],
        () => {
          const index = this.getRawIdeas().findIndex(
            idea => String(idea?.id) === String(ideaId)
          );
          return [`ideas.${index}`, changes];
        }
      ]
    );
  },

  removeIdea(ideaId) {
    return this.executeStoreMethod(
      ["removeIdea", "deleteIdea", "remove"],
      [
        () => [ideaId],
        () => ["ideas", ideaId]
      ]
    );
  },

  /* =======================================================
     Lifecycle Resolution
  ======================================================= */

  normalizeStatus(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/_/g, "-");
  },

  getApprovalStatus(idea = {}) {
    const status = this.normalizeStatus(
      idea?.approval?.status ??
      idea?.approvalStatus ??
      ""
    );

    if (["pending", "submitted", "pending-approval"].includes(status)) {
      return this.approvalStatus.PENDING;
    }

    if (status === "approved") return this.approvalStatus.APPROVED;
    if (status === "rejected") return this.approvalStatus.REJECTED;
    if (["cancelled", "canceled"].includes(status)) {
      return this.approvalStatus.CANCELLED;
    }

    return this.approvalStatus.NOT_SUBMITTED;
  },

  getLifecycleStatus(idea = {}) {
    if (
      idea?.convertedToProject === true ||
      idea?.conversion?.converted === true ||
      idea?.projectId
    ) {
      return this.lifecycle.CONVERTED;
    }

    const rawStatus = this.normalizeStatus(
      idea?.lifecycleStatus ??
      idea?.ideaStatus ??
      idea?.status ??
      ""
    );

    if (["converted", "converted-to-project"].includes(rawStatus)) {
      return this.lifecycle.CONVERTED;
    }

    if (["submitted", "pending", "pending-approval"].includes(rawStatus)) {
      return this.lifecycle.PENDING;
    }

    if (rawStatus === "approved") return this.lifecycle.APPROVED;
    if (rawStatus === "rejected") return this.lifecycle.REJECTED;
    if (rawStatus === "archived") return this.lifecycle.ARCHIVED;
    if (rawStatus === "draft") return this.lifecycle.DRAFT;

    const approvalStatus = this.getApprovalStatus(idea);

    if (approvalStatus === this.approvalStatus.APPROVED) {
      return this.lifecycle.APPROVED;
    }

    if (approvalStatus === this.approvalStatus.PENDING) {
      return this.lifecycle.PENDING;
    }

    if (approvalStatus === this.approvalStatus.REJECTED) {
      return this.lifecycle.REJECTED;
    }

    return this.lifecycle.IDEA;
  },

  isConverted(idea = {}) {
    if (this.getLifecycleStatus(idea) === this.lifecycle.CONVERTED) {
      return true;
    }

    if (idea?.id && this.getProjectByIdeaId(idea.id)) {
      return true;
    }

    return false;
  },

  isPendingApproval(idea = {}) {
    return this.getLifecycleStatus(idea) === this.lifecycle.PENDING;
  },

  isApproved(idea = {}) {
    return this.getLifecycleStatus(idea) === this.lifecycle.APPROVED;
  },

  isRejected(idea = {}) {
    return this.getLifecycleStatus(idea) === this.lifecycle.REJECTED;
  },

  isArchived(idea = {}) {
    return this.getLifecycleStatus(idea) === this.lifecycle.ARCHIVED;
  },

  canSubmit(idea = {}) {
    const status = this.getLifecycleStatus(idea);

    return (
      [this.lifecycle.IDEA, this.lifecycle.DRAFT].includes(status) &&
      !this.isConverted(idea) &&
      !this.isArchived(idea)
    );
  },

  canApprove(idea = {}) {
    return this.isPendingApproval(idea) && !this.isConverted(idea);
  },

  canReject(idea = {}) {
    return this.isPendingApproval(idea) && !this.isConverted(idea);
  },

  canReopen(idea = {}) {
    return this.isRejected(idea) && !this.isConverted(idea);
  },

  canConvert(idea = {}) {
    return (
      this.isApproved(idea) &&
      !this.isConverted(idea) &&
      !this.getProjectByIdeaId(idea?.id)
    );
  },

  getLifecycleLabel(idea = {}) {
    const labels = {
      [this.lifecycle.IDEA]: "فكرة قابلة للدراسة",
      [this.lifecycle.DRAFT]: "مسودة فكرة",
      [this.lifecycle.SUBMITTED]: "تم رفعها للاعتماد",
      [this.lifecycle.PENDING]: "بانتظار الاعتماد",
      [this.lifecycle.APPROVED]: "فكرة معتمدة",
      [this.lifecycle.REJECTED]: "غير معتمدة",
      [this.lifecycle.CONVERTED]: "تحولت إلى مشروع",
      [this.lifecycle.ARCHIVED]: "مؤرشفة"
    };

    return labels[this.getLifecycleStatus(idea)] || labels[this.lifecycle.IDEA];
  },

  getLifecycleClass(idea = {}) {
    const classes = {
      [this.lifecycle.IDEA]: "idea",
      [this.lifecycle.DRAFT]: "draft",
      [this.lifecycle.SUBMITTED]: "pending",
      [this.lifecycle.PENDING]: "pending",
      [this.lifecycle.APPROVED]: "approved",
      [this.lifecycle.REJECTED]: "rejected",
      [this.lifecycle.CONVERTED]: "converted",
      [this.lifecycle.ARCHIVED]: "archived"
    };

    return classes[this.getLifecycleStatus(idea)] || "idea";
  },

  getLifecycleIcon(idea = {}) {
    const icons = {
      [this.lifecycle.IDEA]: "💡",
      [this.lifecycle.DRAFT]: "📝",
      [this.lifecycle.SUBMITTED]: "📤",
      [this.lifecycle.PENDING]: "⏳",
      [this.lifecycle.APPROVED]: "✅",
      [this.lifecycle.REJECTED]: "⛔",
      [this.lifecycle.CONVERTED]: "📁",
      [this.lifecycle.ARCHIVED]: "🗄️"
    };

    return icons[this.getLifecycleStatus(idea)] || "💡";
  },

  /* =======================================================
     Approval Workflow
  ======================================================= */

  submitForApproval(ideaId, options = {}) {
    const idea = this.getIdeaById(ideaId);

    if (!idea) {
      return { success: false, message: "لم يتم العثور على الفكرة." };
    }

    if (!this.canSubmit(idea)) {
      return {
        success: false,
        message: "لا يمكن رفع الفكرة للاعتماد في حالتها الحالية."
      };
    }

    const actor = options.actor || this.config.actor;
    const notes = options.notes || "";

    return this.executeStoreMethod(
      ["submitIdeaForApproval", "submitIdea"],
      [
        () => [ideaId, { actor, notes }],
        method => method.length >= 3
          ? [ideaId, actor, notes]
          : [ideaId, { actor, notes }]
      ]
    );
  },

  approveIdea(ideaId, options = {}) {
    const idea = this.getIdeaById(ideaId);

    if (!idea) {
      return { success: false, message: "لم يتم العثور على الفكرة." };
    }

    if (!this.canApprove(idea) && !this.isApproved(idea)) {
      return {
        success: false,
        message: "الفكرة ليست في مرحلة انتظار الاعتماد."
      };
    }

    const actor = options.actor || this.config.actor;
    const notes = options.notes || "";

    return this.executeStoreMethod(
      ["approveIdea"],
      [
        () => [ideaId, { actor, notes }],
        method => method.length >= 3
          ? [ideaId, actor, notes]
          : [ideaId, { actor, notes }]
      ]
    );
  },

  rejectIdea(ideaId, options = {}) {
    const idea = this.getIdeaById(ideaId);

    if (!idea) {
      return { success: false, message: "لم يتم العثور على الفكرة." };
    }

    if (!this.canReject(idea)) {
      return {
        success: false,
        message: "الفكرة ليست في مرحلة تسمح بالرفض."
      };
    }

    const actor = options.actor || this.config.actor;
    const reason = options.reason || options.notes || "";

    return this.executeStoreMethod(
      ["rejectIdea"],
      [
        () => [ideaId, { actor, reason, notes: reason }],
        method => method.length >= 3
          ? [ideaId, actor, reason]
          : [ideaId, { actor, reason, notes: reason }]
      ]
    );
  },

  reopenIdea(ideaId, options = {}) {
    const idea = this.getIdeaById(ideaId);

    if (!idea) {
      return { success: false, message: "لم يتم العثور على الفكرة." };
    }

    if (!this.canReopen(idea)) {
      return {
        success: false,
        message: "لا يمكن إعادة فتح الفكرة في حالتها الحالية."
      };
    }

    const actor = options.actor || this.config.actor;
    const notes = options.notes || "";
    const store = this.getStore();

    if (typeof store?.reopenIdea === "function") {
      return this.executeStoreMethod(
        ["reopenIdea"],
        [
          () => [ideaId, { actor, notes }],
          method => method.length >= 3
            ? [ideaId, actor, notes]
            : [ideaId, { actor, notes }]
        ]
      );
    }

    return this.updateIdea(ideaId, {
      lifecycleStatus: this.lifecycle.IDEA,
      ideaStatus: this.lifecycle.IDEA,
      approvalStatus: this.approvalStatus.NOT_SUBMITTED,
      approval: {
        ...(idea.approval || {}),
        status: this.approvalStatus.NOT_SUBMITTED,
        decision: null,
        reason: null,
        notes,
        decidedAt: null,
        decidedBy: null,
        reopenedAt: new Date().toISOString(),
        reopenedBy: actor
      }
    });
  },

  /* =======================================================
     Conversion Workflow
  ======================================================= */

  createProjectFromIdea(ideaId, options = {}) {
    const idea = this.getIdeaById(ideaId);

    if (!idea) {
      return { success: false, message: "لم يتم العثور على الفكرة." };
    }

    const existingProject = this.getProjectByIdeaId(ideaId);

    if (existingProject) {
      return {
        success: false,
        duplicate: true,
        project: existingProject,
        message: "يوجد مشروع مرتبط بهذه الفكرة مسبقاً."
      };
    }

    if (!this.isApproved(idea)) {
      return {
        success: false,
        message: "يجب اعتماد الفكرة قبل تحويلها إلى مشروع."
      };
    }

    const actor = options.actor || this.config.actor;
    const notes = options.notes || "";

    const projectData = {
      title: idea.title || "مشروع جديد",
      department: idea.department || "غير مصنف",
      description:
        idea.solution ||
        idea.challenge ||
        "مشروع تنفيذي منشأ من فكرة معتمدة.",
      owner: idea.owner || "غير محدد",
      status: "planned",
      progress: 0,
      riskLevel: idea.riskLevel || idea.risk || "متوسط",
      priority: idea.priority || "متوسطة",
      sourceIdeaId: idea.id,
      ideaId: idea.id,
      origin: {
        type: "idea",
        ideaId: idea.id
      },
      createdFromIdea: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(options.project || {})
    };

    return this.executeStoreMethod(
      ["createProjectFromIdea", "convertIdeaToProject"],
      [
        () => [
          ideaId,
          {
            actor,
            convertedBy: actor,
            requireApproval: true,
            autoApprove: false,
            notes,
            project: projectData,
            projectData
          }
        ],
        method => method.length >= 3
          ? [ideaId, projectData, { actor, notes }]
          : [
              ideaId,
              {
                actor,
                convertedBy: actor,
                requireApproval: true,
                notes,
                project: projectData,
                projectData
              }
            ]
      ]
    );
  },

  approveAndCreateProject(ideaId, options = {}) {
    const idea = this.getIdeaById(ideaId);

    if (!idea) {
      return { success: false, message: "لم يتم العثور على الفكرة." };
    }

    const existingProject = this.getProjectByIdeaId(ideaId);

    if (existingProject) {
      return {
        success: false,
        duplicate: true,
        project: existingProject,
        message: "تم تحويل هذه الفكرة إلى مشروع مسبقاً."
      };
    }

    const actor = options.actor || this.config.actor;
    const notes = options.notes || "";
    const store = this.getStore();

    if (typeof store?.approveAndCreateProject === "function") {
      return this.executeStoreMethod(
        ["approveAndCreateProject"],
        [
          () => [
            ideaId,
            {
              actor,
              approvedBy: actor,
              convertedBy: actor,
              approvalNotes: notes,
              notes,
              project: options.project || {}
            }
          ]
        ]
      );
    }

    const approvalResult = this.approveIdea(ideaId, {
      actor,
      notes
    });

    if (!approvalResult.success) {
      return approvalResult;
    }

    return this.createProjectFromIdea(ideaId, {
      actor,
      notes,
      project: options.project || {}
    });
  },

  /* =======================================================
     Classification
  ======================================================= */

  groupByDepartment(ideas = []) {
    return ideas.reduce((groups, idea) => {
      const department = idea?.department || "غير مصنف";

      if (!groups[department]) groups[department] = [];
      groups[department].push(idea);

      return groups;
    }, {});
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

  isHighPriority(idea = {}) {
    return ["عالية", "عالي", "high", "high-priority", "critical"].includes(
      this.normalizeStatus(idea.priority)
    );
  },

  isMediumPriority(idea = {}) {
    return ["متوسطة", "متوسط", "medium"].includes(
      this.normalizeStatus(idea.priority)
    );
  },

  isLowPriority(idea = {}) {
    return ["منخفضة", "منخفض", "low"].includes(
      this.normalizeStatus(idea.priority)
    );
  },

  isQuickWin(idea = {}) {
    if (idea.quickWin === true || idea.isQuickWin === true) return true;

    const ease = this.normalizeStatus(
      idea.ease ??
      idea.difficulty ??
      idea.complexity ??
      ""
    );

    const cost = this.normalizeStatus(
      idea.cost ??
      idea.costLevel ??
      ""
    );

    return (
      ["سهلة", "سهل", "easy", "low", "منخفضة", "منخفض"].includes(ease) &&
      ["low", "منخفضة", "منخفض"].includes(cost)
    );
  },

  getDepartmentCount(departmentName, ideas = []) {
    return ideas.filter(
      idea => String(idea?.department) === String(departmentName)
    ).length;
  },

  /* =======================================================
     Text Helpers
  ======================================================= */

  valueToText(value, fallback = "لا توجد تفاصيل متاحة.") {
    if (Array.isArray(value)) {
      const cleaned = value
        .map(item => {
          if (item && typeof item === "object") {
            return item.title || item.name || item.description || "";
          }

          return String(item || "");
        })
        .filter(Boolean);

      return cleaned.length ? cleaned.join("، ") : fallback;
    }

    if (value && typeof value === "object") {
      return value.title || value.name || value.description || fallback;
    }

    const text = String(value ?? "").trim();
    return text || fallback;
  },

  /* =======================================================
     Pipeline
  ======================================================= */

  getPipeline(ideas = []) {
    const store = this.getStore();

    try {
      if (typeof store?.getPortfolioPipeline === "function") {
        const pipeline = store.getPortfolioPipeline();
        if (pipeline && typeof pipeline === "object") return pipeline;
      }

      if (typeof store?.getPipelineStats === "function") {
        const pipeline = store.getPipelineStats();
        if (pipeline && typeof pipeline === "object") return pipeline;
      }
    } catch (error) {
      console.warn("AI Work Ideas V5.1: Pipeline reader failed.", error);
    }

    return {
      totalIdeas: ideas.length,
      pendingApproval: ideas.filter(idea => this.isPendingApproval(idea)).length,
      approvedIdeas: ideas.filter(idea => this.isApproved(idea)).length,
      rejectedIdeas: ideas.filter(idea => this.isRejected(idea)).length,
      convertedIdeas: ideas.filter(idea => this.isConverted(idea)).length,
      totalProjects: this.getProjects().length
    };
  },

  /* =======================================================
     Actions Renderer
  ======================================================= */

  renderIdeaActions(idea) {
    const ideaId = this.escapeAttribute(idea?.id ?? "");

    if (this.isConverted(idea)) {
      return `
        <div class="idea-workflow-actions">
          <button
            type="button"
            class="idea-action-button primary"
            data-idea-action="open-project"
            data-idea-id="${ideaId}"
          >
            📁 فتح المشروع
          </button>

          <span class="idea-action-note">
            تم إنشاء مشروع تنفيذي مرتبط بهذه الفكرة.
          </span>
        </div>
      `;
    }

    if (this.isPendingApproval(idea)) {
      return `
        <div class="idea-workflow-actions">
          <button
            type="button"
            class="idea-action-button primary"
            data-idea-action="approve-convert"
            data-idea-id="${ideaId}"
          >
            ✅ اعتماد وإنشاء مشروع
          </button>

          <button
            type="button"
            class="idea-action-button danger"
            data-idea-action="reject"
            data-idea-id="${ideaId}"
          >
            رفض الفكرة
          </button>

          <span class="idea-action-note">
            الفكرة مرفوعة حالياً بانتظار القرار الإداري.
          </span>
        </div>
      `;
    }

    if (this.isApproved(idea)) {
      return `
        <div class="idea-workflow-actions">
          <button
            type="button"
            class="idea-action-button primary"
            data-idea-action="create-project"
            data-idea-id="${ideaId}"
          >
            🚀 إنشاء مشروع تنفيذي
          </button>

          <span class="idea-action-note">
            الفكرة معتمدة وجاهزة للتحويل إلى مشروع.
          </span>
        </div>
      `;
    }

    if (this.isRejected(idea)) {
      return `
        <div class="idea-workflow-actions">
          <button
            type="button"
            class="idea-action-button secondary"
            data-idea-action="reopen"
            data-idea-id="${ideaId}"
          >
            ↩️ إعادة فتح الفكرة
          </button>

          <span class="idea-action-note">
            يمكن تحديث نطاق الفكرة ثم رفعها للاعتماد مرة أخرى.
          </span>
        </div>
      `;
    }

    if (this.isArchived(idea)) {
      return `
        <div class="idea-workflow-actions">
          <span class="idea-action-note">
            الفكرة مؤرشفة ولا يمكن تحويلها حالياً.
          </span>
        </div>
      `;
    }

    return `
      <div class="idea-workflow-actions">
        <button
          type="button"
          class="idea-action-button primary"
          data-idea-action="submit"
          data-idea-id="${ideaId}"
        >
          📤 رفع للاعتماد
        </button>

        <span class="idea-action-note">
          يتم رفع الفكرة للاعتماد قبل إنشاء أي مشروع تنفيذي.
        </span>
      </div>
    `;
  },

  /* =======================================================
     Card Renderer
  ======================================================= */

  renderIdeaCard(idea, displayNumber = null) {
    const decisionScore = this.normalizePercent(idea?.decisionScore, 0);
    const decisionLevel = idea?.decisionLevel || "قيد التقييم";
    const riskLevel = idea?.riskLevel || idea?.risk || "متوسط";
    const lifecycleLabel = this.getLifecycleLabel(idea);
    const lifecycleClass = this.getLifecycleClass(idea);
    const lifecycleIcon = this.getLifecycleIcon(idea);

    return `
      <article
        class="idea-card"
        data-idea-id="${this.escapeAttribute(idea?.id ?? "")}"
      >
        <div class="idea-card-head">
          <div>
            <span class="idea-dept">
              ${this.escapeHtml(idea?.department || "غير مصنف")}
            </span>

            <h3>
              ${displayNumber !== null ? `${displayNumber}. ` : ""}
              ${this.escapeHtml(idea?.title || "فكرة غير مسماة")}
            </h3>
          </div>

          <div class="idea-badges">
            ${
              this.isQuickWin(idea)
                ? `<span class="idea-quickwin">Quick Win</span>`
                : ""
            }

            <span class="idea-priority ${this.badgeClass(idea?.priority)}">
              ${this.escapeHtml(idea?.priority || "قيد التقييم")}
            </span>

            <span class="idea-lifecycle-badge ${lifecycleClass}">
              ${lifecycleIcon}
              ${this.escapeHtml(lifecycleLabel)}
            </span>
          </div>
        </div>

        <div class="idea-meta">
          <span>⏱️ ${this.escapeHtml(idea?.duration || "غير محددة")}</span>
          <span>💰 ${this.escapeHtml(idea?.cost || idea?.costLevel || "غير محددة")}</span>
          <span>⚙️ ${this.escapeHtml(idea?.ease || idea?.difficulty || idea?.complexity || "غير محددة")}</span>
          <span>📊 ${decisionScore}%</span>
          <span>🛡️ ${this.escapeHtml(riskLevel)}</span>
        </div>

        <div class="idea-detail">
          <strong>التحدي</strong>
          <p>${this.escapeHtml(this.valueToText(idea?.challenge))}</p>
        </div>

        <div class="idea-detail">
          <strong>الحل المقترح</strong>
          <p>${this.escapeHtml(this.valueToText(idea?.solution))}</p>
        </div>

        <div class="idea-detail">
          <strong>دور الذكاء الاصطناعي</strong>
          <p>${this.escapeHtml(this.valueToText(idea?.aiRole))}</p>
        </div>

        <div class="idea-detail">
          <strong>الفوائد المتوقعة</strong>
          <p>${this.escapeHtml(this.valueToText(idea?.benefits))}</p>
        </div>

        <div class="idea-detail">
          <strong>قرار مبدئي</strong>
          <p>
            ${this.escapeHtml(decisionLevel)}
            · Decision Score ${decisionScore}%
          </p>
        </div>

        ${this.renderIdeaActions(idea)}
      </article>
    `;
  },

  renderDepartmentSection(department, ideas = [], ideaNumberMap = new Map()) {
    return `
      <section class="module-panel idea-department-section">
        <div class="idea-section-head">
          <div>
            <span class="module-kicker light">Solution Portfolio</span>
            <h2>${this.escapeHtml(department)}</h2>
            <p>${ideas.length} فرص قابلة للدراسة والتطوير</p>
          </div>

          <span class="idea-section-count">${ideas.length}</span>
        </div>

        <div class="idea-list">
          ${ideas
            .map(idea =>
              this.renderIdeaCard(
                idea,
                ideaNumberMap.get(String(idea?.id)) || null
              )
            )
            .join("")}
        </div>
      </section>
    `;
  },

  renderPortfolioMap(departments = [], ideas = []) {
    if (!departments.length) {
      const departmentNames = Object.keys(this.groupByDepartment(ideas));

      departments = departmentNames.map(name => ({
        name,
        maturity: 0
      }));
    }

    return `
      <div class="department-grid">
        ${departments
          .map(department => {
            const name = department?.name || "محفظة غير مسماة";
            const count = this.getDepartmentCount(name, ideas);
            const maturity = this.normalizePercent(department?.maturity, 0);

            return `
              <div class="department-chip">
                <strong>${this.escapeHtml(name)}</strong>
                <span>${count} فرص · جاهزية ${maturity}%</span>
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
    if (!container || this._isRendering) return;

    this._isRendering = true;
    this._container = container;

    try {
      this.injectWorkflowStyles();

      const state = this.getState();
      const ideas = this.getIdeas();
      const departments = Array.isArray(state.departments)
        ? state.departments
        : [];

      const groupedIdeas = this.groupByDepartment(ideas);
      const pipeline = this.getPipeline(ideas);

      const highCount = ideas.filter(idea => this.isHighPriority(idea)).length;
      const mediumCount = ideas.filter(idea => this.isMediumPriority(idea)).length;
      const lowCount = ideas.filter(idea => this.isLowPriority(idea)).length;
      const quickWins = ideas.filter(idea => this.isQuickWin(idea)).length;

      const pendingCount = this.toSafeNumber(
        pipeline.pendingApproval ?? pipeline.pendingIdeas,
        ideas.filter(idea => this.isPendingApproval(idea)).length
      );

      const approvedCount = this.toSafeNumber(
        pipeline.approvedIdeas,
        ideas.filter(idea => this.isApproved(idea)).length
      );

      const rejectedCount = this.toSafeNumber(
        pipeline.rejectedIdeas,
        ideas.filter(idea => this.isRejected(idea)).length
      );

      const convertedCount = this.toSafeNumber(
        pipeline.convertedIdeas,
        ideas.filter(idea => this.isConverted(idea)).length
      );

      const projectCount = this.toSafeNumber(
        pipeline.totalProjects,
        this.getProjects().length
      );

      const targetIdeas = Math.max(
        1,
        this.toSafeNumber(
          state.summary?.targetIdeas,
          this.config.targetIdeas
        )
      );

      const progress = this.normalizePercent(
        (ideas.length / targetIdeas) * 100,
        0
      );

      const averageDecision = ideas.length
        ? Math.round(
            ideas.reduce(
              (total, idea) =>
                total + this.toSafeNumber(idea?.decisionScore, 0),
              0
            ) / ideas.length
          )
        : 0;

      const departmentOrder = departments
        .map(department => department?.name)
        .filter(Boolean);

      const orderedDepartments = [
        ...departmentOrder.filter(department => groupedIdeas[department]),
        ...Object.keys(groupedIdeas).filter(
          department => !departmentOrder.includes(department)
        )
      ];

      const ideaNumberMap = new Map();

      ideas.forEach((idea, index) => {
        ideaNumberMap.set(String(idea?.id), index + 1);
      });

      container.innerHTML = `
        <section class="module-page">
          <div class="module-hero">
            <span class="module-kicker">
              Biometric AI Opportunity Center
            </span>

            <h1>مركز فرص الذكاء الاصطناعي</h1>

            <p>
              إدارة فرص الذكاء الاصطناعي المرتبطة بالعمليات البيومترية،
              من الدراسة والتقييم إلى الاعتماد والتحويل إلى مشاريع تنفيذية مترابطة.
            </p>

            <div class="aiw-chip-row">
              <span class="aiw-chip">💡 ${ideas.length}/${targetIdeas} فرصة</span>
              <span class="aiw-chip">🛂 ${orderedDepartments.length} محافظ</span>
              <span class="aiw-chip">🚀 ${quickWins} Quick Wins</span>
              <span class="aiw-chip">⏳ ${pendingCount} بانتظار الاعتماد</span>
              <span class="aiw-chip">📁 ${projectCount} مشاريع</span>
              <span class="aiw-chip">📊 ${averageDecision}% Decision Score</span>
              <span class="aiw-chip">🎯 ${progress}% من الهدف</span>
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
              <span>بانتظار الاعتماد</span>
              <strong>${pendingCount}</strong>
              <small>Pending Approval</small>
            </div>

            <div class="module-card">
              <span>تحولت إلى مشاريع</span>
              <strong>${convertedCount}</strong>
              <small>Converted Projects</small>
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>مسار تحويل الفرص</h2>
              <p>
                تبدأ الفرصة كفكرة قابلة للدراسة، ثم ترفع للاعتماد،
                وبعد القرار الإداري تتحول إلى مشروع تنفيذي مرتبط بالفكرة الأصلية.
              </p>
            </div>

            <div class="idea-pipeline-strip">
              <div>
                <span>💡</span>
                <strong>${ideas.length}</strong>
                <small>إجمالي الأفكار</small>
              </div>

              <div>
                <span>⏳</span>
                <strong>${pendingCount}</strong>
                <small>بانتظار الاعتماد</small>
              </div>

              <div>
                <span>✅</span>
                <strong>${approvedCount}</strong>
                <small>أفكار معتمدة</small>
              </div>

              <div>
                <span>📁</span>
                <strong>${convertedCount}</strong>
                <small>تحولت إلى مشاريع</small>
              </div>

              <div>
                <span>⛔</span>
                <strong>${rejectedCount}</strong>
                <small>غير معتمدة</small>
              </div>
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>خريطة المحافظ التشغيلية</h2>
              <p>
                توزيع الفرص حسب النطاق التشغيلي والجاهزية المؤسسية.
              </p>
            </div>

            ${this.renderPortfolioMap(departments, ideas)}
          </div>

          <div class="module-section-title">
            <h2>دليل الفرص التنفيذية</h2>
            <p>
              لا يتم إنشاء أي مشروع إلا بعد اعتماد الفكرة،
              مع منع التحويل المكرر وحفظ الرابط في الاتجاهين.
            </p>
          </div>

          ${
            orderedDepartments.length
              ? orderedDepartments
                  .map(department =>
                    this.renderDepartmentSection(
                      department,
                      groupedIdeas[department] || [],
                      ideaNumberMap
                    )
                  )
                  .join("")
              : `<div class="module-empty">لا توجد أفكار مسجلة حالياً.</div>`
          }
        </section>
      `;

      this.bindActionEvents();
      this.bindAutomaticSync();
    } finally {
      this._isRendering = false;
    }
  },

  /* =======================================================
     UI Events
  ======================================================= */

  bindActionEvents() {
    if (this._eventsBound || !this._container) return;

    this._eventsBound = true;

    this._container.addEventListener("click", event => {
      const button = event.target.closest("[data-idea-action]");

      if (!button || !this._container?.contains(button)) return;

      const action = button.dataset.ideaAction;
      const ideaId = button.dataset.ideaId;

      if (!action || !ideaId) return;

      event.preventDefault();
      this.handleIdeaAction(action, ideaId);
    });
  },

  handleIdeaAction(action, ideaId) {
    const idea = this.getIdeaById(ideaId);

    if (!idea) {
      this.showToast("لم يتم العثور على الفكرة.", "error");
      return;
    }

    if (action === "open-project") {
      this.openLinkedProject(ideaId);
      return;
    }

    const configs = {
      submit: {
        icon: "📤",
        title: "رفع الفكرة للاعتماد",
        message:
          `سيتم رفع فكرة «${idea.title || "غير مسماة"}» للقرار الإداري. لن يتم إنشاء مشروع في هذه المرحلة.`,
        confirmText: "رفع للاعتماد",
        noteLabel: "ملاحظات الرفع للاعتماد"
      },

      "approve-convert": {
        icon: "🚀",
        title: "اعتماد وإنشاء مشروع",
        message:
          `سيتم اعتماد فكرة «${idea.title || "غير مسماة"}» وإنشاء مشروع تنفيذي جديد يبدأ بنسبة إنجاز 0%.`,
        confirmText: "اعتماد وإنشاء المشروع",
        noteLabel: "ملاحظات قرار الاعتماد"
      },

      "create-project": {
        icon: "📁",
        title: "إنشاء مشروع تنفيذي",
        message:
          `الفكرة «${idea.title || "غير مسماة"}» معتمدة. سيتم إنشاء مشروع مرتبط بها مع الاحتفاظ ببيانات المصدر.`,
        confirmText: "إنشاء المشروع",
        noteLabel: "ملاحظات إنشاء المشروع"
      },

      reject: {
        icon: "⛔",
        title: "رفض الفكرة",
        message:
          `سيتم تسجيل قرار رفض فكرة «${idea.title || "غير مسماة"}». يمكن إعادة فتحها لاحقاً.`,
        confirmText: "تأكيد الرفض",
        noteLabel: "سبب الرفض",
        danger: true,
        requiredNotes: true
      },

      reopen: {
        icon: "↩️",
        title: "إعادة فتح الفكرة",
        message:
          `ستعود فكرة «${idea.title || "غير مسماة"}» إلى مرحلة الدراسة ويمكن رفعها مرة أخرى.`,
        confirmText: "إعادة فتح الفكرة",
        noteLabel: "ملاحظات إعادة الفتح"
      }
    };

    const config = configs[action];

    if (!config) return;

    this.openConfirmation({
      action,
      ideaId,
      ...config
    });
  },

  executePendingAction(notes = "") {
    if (!this._pendingAction || this._isExecuting) return;

    const { action, ideaId, requiredNotes } = this._pendingAction;

    if (requiredNotes && !notes.trim()) {
      this.showToast("يرجى إدخال سبب القرار.", "error");
      return;
    }

    this._isExecuting = true;

    try {
      let result = null;
      const options = {
        actor: this.config.actor,
        notes,
        reason: notes
      };

      if (action === "submit") {
        result = this.submitForApproval(ideaId, options);
      }

      if (action === "approve-convert") {
        result = this.approveAndCreateProject(ideaId, options);
      }

      if (action === "create-project") {
        result = this.createProjectFromIdea(ideaId, options);
      }

      if (action === "reject") {
        result = this.rejectIdea(ideaId, options);
      }

      if (action === "reopen") {
        result = this.reopenIdea(ideaId, options);
      }

      if (!result?.success) {
        this.showToast(
          result?.message || "تعذر تنفيذ العملية.",
          "error"
        );
        return;
      }

      this.closeConfirmation();

      if (action === "submit") {
        this.showToast("تم رفع الفكرة للاعتماد بنجاح.", "success");
      }

      if (["approve-convert", "create-project"].includes(action)) {
        const project =
          result?.project ||
          result?.data?.project ||
          result?.result?.project ||
          this.getProjectByIdeaId(ideaId);

        if (project?.id) {
          this.saveSelectedProject(project.id);
        }

        this.showToast(
          "تم إنشاء المشروع التنفيذي وربطه بالفكرة بنجاح.",
          "success"
        );
      }

      if (action === "reject") {
        this.showToast("تم تسجيل قرار رفض الفكرة.", "success");
      }

      if (action === "reopen") {
        this.showToast("تمت إعادة الفكرة إلى مرحلة الدراسة.", "success");
      }

      this.scheduleRefresh();
    } finally {
      this._isExecuting = false;
    }
  },

  /* =======================================================
     Navigation
  ======================================================= */

  saveSelectedProject(projectId) {
    try {
      localStorage.setItem(
        this.config.selectedProjectKey,
        String(projectId)
      );

      sessionStorage.setItem(
        this.config.selectedProjectKey,
        String(projectId)
      );
    } catch (error) {
      console.warn("AI Work Ideas V5.1: Unable to save selected project.", error);
    }
  },

  saveSelectedIdea(ideaId) {
    try {
      localStorage.setItem(
        this.config.selectedIdeaKey,
        String(ideaId)
      );

      sessionStorage.setItem(
        this.config.selectedIdeaKey,
        String(ideaId)
      );
    } catch (error) {
      console.warn("AI Work Ideas V5.1: Unable to save selected idea.", error);
    }
  },

  openLinkedProject(ideaId) {
    const project = this.getProjectByIdeaId(ideaId);

    if (!project) {
      this.showToast("تعذر العثور على المشروع المرتبط.", "error");
      return;
    }

    this.saveSelectedIdea(ideaId);
    this.saveSelectedProject(project.id);

    try {
      window.dispatchEvent(
        new CustomEvent("aiw:openProject", {
          detail: {
            projectId: project.id,
            sourceIdeaId: ideaId
          }
        })
      );
    } catch (error) {
      console.warn("AI Work Ideas V5.1: Open project event failed.", error);
    }

    if (typeof window.AIW?.App?.go === "function") {
      window.AIW.App.go("projects");
      return;
    }

    if (typeof window.AIW?.Router?.go === "function") {
      window.AIW.Router.go("projects");
      return;
    }

    window.location.hash = "#projects";
  },

  /* =======================================================
     Confirmation Modal
  ======================================================= */

  openConfirmation(config = {}) {
    this.closeConfirmation();

    this._pendingAction = {
      action: config.action,
      ideaId: config.ideaId,
      requiredNotes: config.requiredNotes === true
    };

    const modal = document.createElement("div");

    modal.className = "idea-confirmation-overlay";

    modal.innerHTML = `
      <div
        class="idea-confirmation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="idea-confirmation-title"
      >
        <button
          type="button"
          class="idea-confirmation-close"
          data-confirmation-close
          aria-label="إغلاق"
        >
          ×
        </button>

        <div class="idea-confirmation-icon">
          ${this.escapeHtml(config.icon || "💡")}
        </div>

        <h3 id="idea-confirmation-title">
          ${this.escapeHtml(config.title || "تأكيد العملية")}
        </h3>

        <p>
          ${this.escapeHtml(config.message || "هل تريد متابعة العملية؟")}
        </p>

        <label class="idea-confirmation-field">
          <span>
            ${this.escapeHtml(config.noteLabel || "ملاحظات")}
            ${config.requiredNotes ? `<em>مطلوب</em>` : ""}
          </span>

          <textarea
            data-confirmation-notes
            rows="3"
            placeholder="${
              config.requiredNotes
                ? "أدخل السبب قبل المتابعة..."
                : "إضافة ملاحظة اختيارية..."
            }"
          ></textarea>
        </label>

        <div class="idea-confirmation-actions">
          <button
            type="button"
            class="idea-action-button secondary"
            data-confirmation-close
          >
            إلغاء
          </button>

          <button
            type="button"
            class="idea-action-button ${config.danger ? "danger" : "primary"}"
            data-confirmation-submit
          >
            ${this.escapeHtml(config.confirmText || "تأكيد")}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this._modal = modal;

    modal.addEventListener("click", event => {
      if (
        event.target === modal ||
        event.target.closest("[data-confirmation-close]")
      ) {
        this.closeConfirmation();
        return;
      }

      if (event.target.closest("[data-confirmation-submit]")) {
        const notes =
          modal
            .querySelector("[data-confirmation-notes]")
            ?.value?.trim() || "";

        this.executePendingAction(notes);
      }
    });

    modal.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        this.closeConfirmation();
      }

      if (
        event.key === "Enter" &&
        (event.ctrlKey || event.metaKey)
      ) {
        const notes =
          modal
            .querySelector("[data-confirmation-notes]")
            ?.value?.trim() || "";

        this.executePendingAction(notes);
      }
    });

    requestAnimationFrame(() => {
      modal.classList.add("visible");
      modal.querySelector("[data-confirmation-notes]")?.focus();
    });
  },

  closeConfirmation() {
    if (!this._modal) {
      this._pendingAction = null;
      return;
    }

    const modal = this._modal;

    modal.classList.remove("visible");

    window.setTimeout(() => {
      modal.remove();
    }, 180);

    this._modal = null;
    this._pendingAction = null;
  },

  /* =======================================================
     Toast
  ======================================================= */

  showToast(message, type = "success") {
    document.querySelector(".idea-workflow-toast")?.remove();

    const toast = document.createElement("div");

    toast.className = `idea-workflow-toast ${type}`;
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
    }, 2800);
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
      "aiw:ideasChanged",
      "aiw:ideasUpdated",
      "aiw:ideaCreated",
      "aiw:ideaUpdated",
      "aiw:ideaSubmittedForApproval",
      "aiw:ideaSubmitted",
      "aiw:ideaApproved",
      "aiw:ideaRejected",
      "aiw:ideaReopened",
      "aiw:ideaConvertedToProject",
      "aiw:projectCreatedFromIdea",
      "aiw:projectUpdated",
      "aiw:projectArchived"
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
    this.closeConfirmation();
  },

  /* =======================================================
     Workflow Styles
  ======================================================= */

  injectWorkflowStyles() {
    if (document.getElementById(this.config.styleId)) return;

    const style = document.createElement("style");

    style.id = this.config.styleId;

    style.textContent = `
      .idea-lifecycle-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 34px;
        padding: 7px 12px;
        border: 1px solid transparent;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 800;
        line-height: 1.2;
        white-space: nowrap;
      }

      .idea-lifecycle-badge.idea,
      .idea-lifecycle-badge.draft {
        color: #3159bf;
        background: #edf3ff;
        border-color: #dbe7ff;
      }

      .idea-lifecycle-badge.pending {
        color: #b75c00;
        background: #fff3d9;
        border-color: #ffe4ac;
      }

      .idea-lifecycle-badge.approved {
        color: #087d3e;
        background: #e2f7ea;
        border-color: #c8efd7;
      }

      .idea-lifecycle-badge.rejected {
        color: #b42318;
        background: #feeceb;
        border-color: #fbd3d0;
      }

      .idea-lifecycle-badge.converted {
        color: #ffffff;
        background: #101b2f;
        border-color: #101b2f;
      }

      .idea-lifecycle-badge.archived {
        color: #667085;
        background: #f2f4f7;
        border-color: #e4e7ec;
      }

      .idea-workflow-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        margin-top: 22px;
        padding-top: 18px;
        border-top: 1px solid rgba(15, 23, 42, 0.08);
      }

      .idea-action-button {
        appearance: none;
        min-height: 44px;
        padding: 11px 17px;
        border: 0;
        border-radius: 14px;
        font: inherit;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        transition:
          transform 0.18s ease,
          opacity 0.18s ease,
          box-shadow 0.18s ease;
      }

      .idea-action-button:active {
        transform: scale(0.98);
      }

      .idea-action-button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .idea-action-button.primary {
        color: #ffffff;
        background: #101b2f;
        box-shadow: 0 8px 20px rgba(16, 27, 47, 0.16);
      }

      .idea-action-button.secondary {
        color: #344054;
        background: #f2f4f7;
        border: 1px solid #e4e7ec;
      }

      .idea-action-button.danger {
        color: #b42318;
        background: #feeceb;
        border: 1px solid #fbd3d0;
      }

      .idea-action-note {
        flex: 1 1 210px;
        color: #667085;
        font-size: 13px;
        line-height: 1.7;
      }

      .idea-pipeline-strip {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 12px;
      }

      .idea-pipeline-strip > div {
        display: flex;
        min-width: 0;
        min-height: 110px;
        padding: 14px 10px;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5px;
        border: 1px solid rgba(15, 23, 42, 0.06);
        border-radius: 20px;
        text-align: center;
        background: #f7f8fa;
      }

      .idea-pipeline-strip span {
        font-size: 22px;
      }

      .idea-pipeline-strip strong {
        color: #101828;
        font-size: 25px;
        line-height: 1;
      }

      .idea-pipeline-strip small {
        color: #667085;
        font-size: 12px;
        font-weight: 700;
      }

      .idea-confirmation-overlay {
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

      .idea-confirmation-overlay.visible {
        opacity: 1;
      }

      .idea-confirmation-dialog {
        position: relative;
        width: min(100%, 470px);
        max-height: min(82vh, 680px);
        overflow-y: auto;
        padding: 28px 22px 22px;
        border-radius: 28px;
        text-align: right;
        background: #ffffff;
        box-shadow: 0 28px 80px rgba(15, 23, 42, 0.28);
        transform: translateY(12px) scale(0.98);
        transition: transform 0.18s ease;
      }

      .idea-confirmation-overlay.visible .idea-confirmation-dialog {
        transform: translateY(0) scale(1);
      }

      .idea-confirmation-close {
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

      .idea-confirmation-icon {
        display: grid;
        place-items: center;
        width: 62px;
        height: 62px;
        margin-bottom: 18px;
        border-radius: 20px;
        font-size: 30px;
        background: #101b2f;
      }

      .idea-confirmation-dialog h3 {
        margin: 0 0 10px;
        color: #101828;
        font-size: 24px;
        line-height: 1.4;
      }

      .idea-confirmation-dialog > p {
        margin: 0;
        color: #667085;
        font-size: 15px;
        line-height: 1.8;
      }

      .idea-confirmation-field {
        display: block;
        margin-top: 20px;
      }

      .idea-confirmation-field > span {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        color: #344054;
        font-size: 13px;
        font-weight: 800;
      }

      .idea-confirmation-field em {
        padding: 3px 7px;
        border-radius: 999px;
        color: #b42318;
        background: #feeceb;
        font-size: 10px;
        font-style: normal;
      }

      .idea-confirmation-field textarea {
        width: 100%;
        min-height: 94px;
        resize: vertical;
        box-sizing: border-box;
        padding: 13px 14px;
        border: 1px solid #d0d5dd;
        border-radius: 15px;
        color: #101828;
        background: #ffffff;
        font: inherit;
        outline: none;
      }

      .idea-confirmation-field textarea:focus {
        border-color: #3159bf;
        box-shadow: 0 0 0 4px rgba(49, 89, 191, 0.1);
      }

      .idea-confirmation-actions {
        display: grid;
        grid-template-columns: 1fr 1.3fr;
        gap: 10px;
        margin-top: 22px;
      }

      .idea-workflow-toast {
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

      .idea-workflow-toast.visible {
        opacity: 1;
        transform: translateX(50%) translateY(0);
      }

      .idea-workflow-toast.error {
        background: #b42318;
      }

      .idea-workflow-toast.success {
        background: #087d3e;
      }

      @media (max-width: 900px) {
        .idea-pipeline-strip {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      @media (max-width: 720px) {
        .idea-pipeline-strip {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .idea-workflow-actions {
          align-items: stretch;
        }

        .idea-action-button {
          flex: 1 1 100%;
          width: 100%;
        }

        .idea-action-note {
          flex-basis: 100%;
        }

        .idea-confirmation-actions {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  },

  /* =======================================================
     Utilities
  ======================================================= */

  toSafeNumber(value, fallback = 0) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
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
