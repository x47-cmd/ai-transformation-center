/* =========================================================
   AI Work - Ideas Module V4.0
   Biometric AI Opportunity Center
   Idea Approval + Project Conversion Workflow

   Features:
   - Central AIW.Store integration
   - Persistent opportunity management
   - Idea approval lifecycle
   - Idea-to-project conversion
   - Duplicate conversion prevention
   - Project linking in both directions
   - Automatic cross-page synchronization
   - Dynamic portfolio calculations
   - Confirmation modal
   - No core UI design changes
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.ideas = {
  id: "ideas",
  title: "الأفكار",
  icon: "💡",

  _container: null,
  _syncBound: false,
  _actionsBound: false,
  _unsubscribeStore: null,
  _refreshTimer: null,
  _modal: null,
  _pendingAction: null,
  _selectedIdeaId: null,

  /* =======================================================
     Lifecycle Constants
  ======================================================= */

  lifecycle: {
    IDEA: "idea",
    DRAFT: "draft",
    SUBMITTED: "submitted",
    PENDING: "pending-approval",
    APPROVED: "approved",
    REJECTED: "rejected",
    CONVERTED: "converted-to-project",
    CONVERTED_ALT: "converted",
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
     Central Data Reader
  ======================================================= */

  getData() {
    try {
      if (
        window.AIW?.Store &&
        typeof window.AIW.Store.getState ===
          "function"
      ) {
        const storeData =
          window.AIW.Store.getState();

        if (
          storeData &&
          typeof storeData === "object"
        ) {
          return storeData;
        }
      }

      if (
        window.AIW?.Store &&
        typeof window.AIW.Store.getData ===
          "function"
      ) {
        const storeData =
          window.AIW.Store.getData();

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

  getStore() {
    return window.AIW?.Store || null;
  },

  /* =======================================================
     Ideas Reader
  ======================================================= */

  getRawIdeas() {
    const store = this.getStore();

    try {
      if (
        store &&
        typeof store.getIdeas === "function"
      ) {
        const ideas = store.getIdeas();

        if (Array.isArray(ideas)) {
          return ideas;
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Ideas: Store idea reader failed.",
        error
      );
    }

    const data = this.getData();

    return Array.isArray(data.ideas)
      ? data.ideas
      : [];
  },

  getIdeas() {
    const storedIdeas =
      this.getRawIdeas();

    try {
      if (
        window.AIW?.BiometricAnalytics &&
        typeof window.AIW.BiometricAnalytics
          .enrichIdeas === "function"
      ) {
        const enrichedIdeas =
          window.AIW.BiometricAnalytics.enrichIdeas(
            storedIdeas
          );

        if (Array.isArray(enrichedIdeas)) {
          return enrichedIdeas.map(
            (idea, index) => ({
              ...storedIdeas[index],
              ...idea,

              id:
                idea?.id ??
                storedIdeas[index]?.id
            })
          );
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

  getIdeaById(ideaId) {
    const store = this.getStore();

    try {
      if (
        store &&
        typeof store.getIdea === "function"
      ) {
        const idea =
          store.getIdea(ideaId);

        if (idea) {
          return idea;
        }
      }

      if (
        store &&
        typeof store.find === "function"
      ) {
        const idea =
          store.find(
            "ideas",
            ideaId
          );

        if (idea) {
          return idea;
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Ideas: Unable to locate idea.",
        error
      );
    }

    return (
      this.getRawIdeas().find(
        idea =>
          String(idea?.id) ===
          String(ideaId)
      ) || null
    );
  },

  getProjectByIdeaId(ideaId) {
    const store = this.getStore();

    try {
      if (
        store &&
        typeof store.getProjectByIdeaId ===
          "function"
      ) {
        const project =
          store.getProjectByIdeaId(
            ideaId
          );

        if (project) {
          return project;
        }
      }

      const idea =
        this.getIdeaById(ideaId);

      if (
        idea?.projectId &&
        store &&
        typeof store.getProject === "function"
      ) {
        const project =
          store.getProject(
            idea.projectId
          );

        if (project) {
          return project;
        }
      }

      const data = this.getData();

      return (
        (
          Array.isArray(data.projects)
            ? data.projects
            : []
        ).find(
          project =>
            String(
              project?.sourceIdeaId
            ) === String(ideaId) ||
            String(project?.id) ===
              String(idea?.projectId)
        ) || null
      );
    } catch (error) {
      console.warn(
        "AI Work Ideas: Project lookup failed.",
        error
      );

      return null;
    }
  },

  /* =======================================================
     Idea Management
  ======================================================= */

  addIdea(idea = {}) {
    const store = this.getStore();

    if (
      store &&
      typeof store.addIdea === "function"
    ) {
      return store.addIdea(idea);
    }

    if (
      store &&
      typeof store.add === "function"
    ) {
      return store.add(
        "ideas",
        idea
      );
    }

    console.warn(
      "AI Work Ideas: Idea creation is unavailable."
    );

    return false;
  },

  updateIdea(id, changes = {}) {
    const store = this.getStore();

    if (
      store &&
      typeof store.updateIdea === "function"
    ) {
      return store.updateIdea(
        id,
        changes
      );
    }

    if (
      store &&
      typeof store.update === "function"
    ) {
      return store.update(
        "ideas",
        id,
        changes
      );
    }

    console.warn(
      "AI Work Ideas: Idea update is unavailable."
    );

    return false;
  },

  removeIdea(id) {
    const store = this.getStore();

    if (
      store &&
      typeof store.removeIdea === "function"
    ) {
      return store.removeIdea(id);
    }

    if (
      store &&
      typeof store.remove === "function"
    ) {
      return store.remove(
        "ideas",
        id
      );
    }

    console.warn(
      "AI Work Ideas: Idea removal is unavailable."
    );

    return false;
  },

  /* =======================================================
     Lifecycle Readers
  ======================================================= */

  getLifecycleStatus(idea = {}) {
    if (
      idea?.convertedToProject === true ||
      idea?.conversion?.converted === true ||
      idea?.projectId
    ) {
      return this.lifecycle.CONVERTED;
    }

    const rawStatus = String(
      idea?.lifecycleStatus ||
      idea?.ideaStatus ||
      ""
    )
      .trim()
      .toLowerCase();

    if (
      rawStatus ===
        this.lifecycle.CONVERTED ||
      rawStatus ===
        this.lifecycle.CONVERTED_ALT
    ) {
      return this.lifecycle.CONVERTED;
    }

    if (
      rawStatus ===
      this.lifecycle.PENDING
    ) {
      return this.lifecycle.PENDING;
    }

    if (
      rawStatus ===
      this.lifecycle.APPROVED
    ) {
      return this.lifecycle.APPROVED;
    }

    if (
      rawStatus ===
      this.lifecycle.REJECTED
    ) {
      return this.lifecycle.REJECTED;
    }

    if (
      rawStatus ===
      this.lifecycle.ARCHIVED
    ) {
      return this.lifecycle.ARCHIVED;
    }

    const approvalStatus =
      this.getApprovalStatus(idea);

    if (
      approvalStatus ===
      this.approvalStatus.APPROVED
    ) {
      return this.lifecycle.APPROVED;
    }

    if (
      approvalStatus ===
      this.approvalStatus.PENDING
    ) {
      return this.lifecycle.PENDING;
    }

    if (
      approvalStatus ===
      this.approvalStatus.REJECTED
    ) {
      return this.lifecycle.REJECTED;
    }

    return this.lifecycle.IDEA;
  },

  getApprovalStatus(idea = {}) {
    const status = String(
      idea?.approval?.status ||
      ""
    )
      .trim()
      .toLowerCase();

    if (
      status ===
      this.approvalStatus.PENDING
    ) {
      return this.approvalStatus.PENDING;
    }

    if (
      status ===
      this.approvalStatus.APPROVED
    ) {
      return this.approvalStatus.APPROVED;
    }

    if (
      status ===
      this.approvalStatus.REJECTED
    ) {
      return this.approvalStatus.REJECTED;
    }

    if (
      status ===
      this.approvalStatus.CANCELLED
    ) {
      return this.approvalStatus.CANCELLED;
    }

    return this.approvalStatus.NOT_SUBMITTED;
  },

  isConverted(idea = {}) {
    return (
      this.getLifecycleStatus(idea) ===
      this.lifecycle.CONVERTED
    );
  },

  isPendingApproval(idea = {}) {
    return (
      this.getLifecycleStatus(idea) ===
      this.lifecycle.PENDING
    );
  },

  isApproved(idea = {}) {
    return (
      this.getLifecycleStatus(idea) ===
      this.lifecycle.APPROVED
    );
  },

  isRejected(idea = {}) {
    return (
      this.getLifecycleStatus(idea) ===
      this.lifecycle.REJECTED
    );
  },

  getLifecycleLabel(idea = {}) {
    const status =
      this.getLifecycleStatus(idea);

    const labels = {
      [this.lifecycle.IDEA]:
        "فكرة قابلة للدراسة",

      [this.lifecycle.DRAFT]:
        "فكرة قابلة للدراسة",

      [this.lifecycle.SUBMITTED]:
        "تم رفعها للاعتماد",

      [this.lifecycle.PENDING]:
        "بانتظار الاعتماد",

      [this.lifecycle.APPROVED]:
        "فكرة معتمدة",

      [this.lifecycle.REJECTED]:
        "غير معتمدة",

      [this.lifecycle.CONVERTED]:
        "تحولت إلى مشروع",

      [this.lifecycle.ARCHIVED]:
        "مؤرشفة"
    };

    return (
      labels[status] ||
      "فكرة قابلة للدراسة"
    );
  },

  getLifecycleClass(idea = {}) {
    const status =
      this.getLifecycleStatus(idea);

    const classes = {
      [this.lifecycle.IDEA]:
        "idea",

      [this.lifecycle.DRAFT]:
        "idea",

      [this.lifecycle.SUBMITTED]:
        "pending",

      [this.lifecycle.PENDING]:
        "pending",

      [this.lifecycle.APPROVED]:
        "approved",

      [this.lifecycle.REJECTED]:
        "rejected",

      [this.lifecycle.CONVERTED]:
        "converted",

      [this.lifecycle.ARCHIVED]:
        "archived"
    };

    return classes[status] || "idea";
  },

  getLifecycleIcon(idea = {}) {
    const status =
      this.getLifecycleStatus(idea);

    const icons = {
      [this.lifecycle.IDEA]: "💡",
      [this.lifecycle.DRAFT]: "💡",
      [this.lifecycle.SUBMITTED]: "⏳",
      [this.lifecycle.PENDING]: "⏳",
      [this.lifecycle.APPROVED]: "✅",
      [this.lifecycle.REJECTED]: "⛔",
      [this.lifecycle.CONVERTED]: "📁",
      [this.lifecycle.ARCHIVED]: "🗄️"
    };

    return icons[status] || "💡";
  },

  /* =======================================================
     Approval and Conversion Methods
  ======================================================= */

  submitForApproval(
    ideaId,
    options = {}
  ) {
    const store = this.getStore();

    if (
      !store ||
      typeof store.submitIdeaForApproval !==
        "function"
    ) {
      return {
        success: false,
        message:
          "خدمة رفع الأفكار للاعتماد غير متاحة."
      };
    }

    try {
      let result;

      if (
        store.submitIdeaForApproval
          .length >= 2
      ) {
        result =
          store.submitIdeaForApproval(
            ideaId,
            options.actor || null,
            options.notes || null
          );
      } else {
        result =
          store.submitIdeaForApproval(
            ideaId,
            options
          );
      }

      if (
        result &&
        result.success === false
      ) {
        return result;
      }

      return {
        success: Boolean(result),
        idea:
          result?.idea ||
          result ||
          this.getIdeaById(ideaId)
      };
    } catch (error) {
      console.error(
        "AI Work Ideas: Submit approval failed.",
        error
      );

      return {
        success: false,
        message:
          "تعذر رفع الفكرة للاعتماد."
      };
    }
  },

  approveIdea(
    ideaId,
    options = {}
  ) {
    const store = this.getStore();

    if (
      !store ||
      typeof store.approveIdea !==
        "function"
    ) {
      return {
        success: false,
        message:
          "خدمة اعتماد الأفكار غير متاحة."
      };
    }

    try {
      let result;

      if (
        store.approveIdea.length >= 2
      ) {
        result =
          store.approveIdea(
            ideaId,
            options.actor || null,
            options.notes || null
          );
      } else {
        result =
          store.approveIdea(
            ideaId,
            options
          );
      }

      if (
        result &&
        result.success === false
      ) {
        return result;
      }

      return {
        success: Boolean(result),
        idea:
          result?.idea ||
          result ||
          this.getIdeaById(ideaId)
      };
    } catch (error) {
      console.error(
        "AI Work Ideas: Approval failed.",
        error
      );

      return {
        success: false,
        message:
          "تعذر اعتماد الفكرة."
      };
    }
  },

  rejectIdea(
    ideaId,
    options = {}
  ) {
    const store = this.getStore();

    if (
      !store ||
      typeof store.rejectIdea !==
        "function"
    ) {
      return {
        success: false,
        message:
          "خدمة رفض الأفكار غير متاحة."
      };
    }

    try {
      let result;

      if (
        store.rejectIdea.length >= 2
      ) {
        result =
          store.rejectIdea(
            ideaId,
            options.actor || null,
            options.reason ||
              options.notes ||
              null
          );
      } else {
        result =
          store.rejectIdea(
            ideaId,
            options
          );
      }

      if (
        result &&
        result.success === false
      ) {
        return result;
      }

      return {
        success: Boolean(result),
        idea:
          result?.idea ||
          result ||
          this.getIdeaById(ideaId)
      };
    } catch (error) {
      console.error(
        "AI Work Ideas: Rejection failed.",
        error
      );

      return {
        success: false,
        message:
          "تعذر رفض الفكرة."
      };
    }
  },

  reopenIdea(
    ideaId,
    options = {}
  ) {
    const store = this.getStore();

    try {
      if (
        store &&
        typeof store.reopenIdea ===
          "function"
      ) {
        const result =
          store.reopenIdea(
            ideaId,
            options.actor || null,
            options.notes || null
          );

        return {
          success: Boolean(result),
          idea:
            result?.idea ||
            result
        };
      }

      const idea =
        this.getIdeaById(ideaId);

      if (!idea) {
        return {
          success: false,
          message:
            "لم يتم العثور على الفكرة."
        };
      }

      const updated =
        this.updateIdea(
          ideaId,
          {
            lifecycleStatus:
              this.lifecycle.IDEA,

            ideaStatus:
              this.lifecycle.IDEA,

            approval: {
              ...(idea.approval || {}),

              status:
                this.approvalStatus
                  .NOT_SUBMITTED,

              decision: null,
              reason: null,
              decidedAt: null,
              decidedBy: null
            }
          }
        );

      return {
        success: Boolean(updated),
        idea: updated
      };
    } catch (error) {
      console.error(
        "AI Work Ideas: Reopen failed.",
        error
      );

      return {
        success: false,
        message:
          "تعذر إعادة فتح الفكرة."
      };
    }
  },

  createProjectFromIdea(
    ideaId,
    options = {}
  ) {
    const store = this.getStore();

    if (!store) {
      return {
        success: false,
        message:
          "مخزن بيانات المنصة غير متاح."
      };
    }

    try {
      if (
        typeof store.createProjectFromIdea ===
          "function"
      ) {
        return (
          store.createProjectFromIdea(
            ideaId,
            {
              actor:
                options.actor || null,

              convertedBy:
                options.actor || null,

              approvedBy:
                options.actor || null,

              requireApproval:
                options.requireApproval !==
                false,

              autoApprove:
                options.autoApprove ===
                true,

              approvalNotes:
                options.approvalNotes ||
                null,

              notes:
                options.notes || null,

              project:
                options.project || {}
            }
          ) || {
            success: false,
            message:
              "تعذر إنشاء المشروع."
          }
        );
      }

      if (
        typeof store.convertIdeaToProject ===
          "function"
      ) {
        return (
          store.convertIdeaToProject(
            ideaId,
            {
              actor:
                options.actor || null,

              convertedBy:
                options.actor || null,

              requireApproval:
                options.requireApproval !==
                false,

              autoApprove:
                options.autoApprove ===
                true,

              note:
                options.notes || null,

              projectData:
                options.project || {}
            }
          ) || {
            success: false,
            message:
              "تعذر إنشاء المشروع."
          }
        );
      }

      return {
        success: false,
        message:
          "خدمة تحويل الأفكار إلى مشاريع غير متاحة."
      };
    } catch (error) {
      console.error(
        "AI Work Ideas: Project conversion failed.",
        error
      );

      return {
        success: false,
        message:
          "حدث خطأ أثناء تحويل الفكرة إلى مشروع."
      };
    }
  },

  approveAndCreateProject(
    ideaId,
    options = {}
  ) {
    const store = this.getStore();

    try {
      if (
        store &&
        typeof store.approveAndCreateProject ===
          "function"
      ) {
        return (
          store.approveAndCreateProject(
            ideaId,
            {
              actor:
                options.actor || null,

              approvedBy:
                options.actor || null,

              convertedBy:
                options.actor || null,

              approvalNotes:
                options.notes || null,

              notes:
                options.notes || null,

              project:
                options.project || {}
            }
          ) || {
            success: false,
            message:
              "تعذر اعتماد الفكرة وإنشاء المشروع."
          }
        );
      }

      const approvalResult =
        this.approveIdea(
          ideaId,
          options
        );

      if (!approvalResult.success) {
        return approvalResult;
      }

      return this.createProjectFromIdea(
        ideaId,
        {
          ...options,
          requireApproval: true,
          autoApprove: false
        }
      );
    } catch (error) {
      console.error(
        "AI Work Ideas: Approve and create failed.",
        error
      );

      return {
        success: false,
        message:
          "تعذر اعتماد الفكرة وتحويلها إلى مشروع."
      };
    }
  },

  /* =======================================================
     Grouping and Classification
  ======================================================= */

  groupByDepartment(ideas = []) {
    return ideas.reduce(
      (groups, idea) => {
        const department =
          idea?.department ||
          "غير مصنف";

        if (!groups[department]) {
          groups[department] = [];
        }

        groups[department].push(
          idea
        );

        return groups;
      },
      {}
    );
  },

  badgeClass(value) {
    const normalizedValue =
      String(value || "")
        .trim()
        .toLowerCase();

    if (
      [
        "عالية",
        "عالي",
        "high",
        "critical"
      ].includes(normalizedValue)
    ) {
      return "high";
    }

    if (
      [
        "متوسطة",
        "متوسط",
        "medium"
      ].includes(normalizedValue)
    ) {
      return "medium";
    }

    if (
      [
        "منخفضة",
        "منخفض",
        "low"
      ].includes(normalizedValue)
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

    return [
      "عالية",
      "عالي",
      "high",
      "high priority",
      "critical"
    ].includes(priority);
  },

  isMediumPriority(idea) {
    const priority = String(
      idea?.priority || ""
    )
      .trim()
      .toLowerCase();

    return [
      "متوسطة",
      "متوسط",
      "medium"
    ].includes(priority);
  },

  isLowPriority(idea) {
    const priority = String(
      idea?.priority || ""
    )
      .trim()
      .toLowerCase();

    return [
      "منخفضة",
      "منخفض",
      "low"
    ].includes(priority);
  },

  isQuickWin(idea) {
    if (
      idea?.quickWin === true ||
      idea?.isQuickWin === true
    ) {
      return true;
    }

    const ease = String(
      idea?.ease ||
      idea?.difficulty ||
      idea?.complexity ||
      ""
    )
      .trim()
      .toLowerCase();

    const cost = String(
      idea?.cost ||
      idea?.costLevel ||
      ""
    )
      .trim()
      .toLowerCase();

    const easyValues = [
      "سهلة",
      "سهل",
      "منخفضة",
      "منخفض",
      "easy",
      "low"
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
      idea =>
        idea?.department ===
        departmentName
    ).length;
  },

  /* =======================================================
     Text Helpers
  ======================================================= */

  valueToText(
    value,
    fallback = "لا توجد تفاصيل متاحة."
  ) {
    if (Array.isArray(value)) {
      const cleaned = value
        .map(item => {
          if (
            item &&
            typeof item === "object"
          ) {
            return (
              item.title ||
              item.name ||
              item.description ||
              ""
            );
          }

          return String(item || "");
        })
        .filter(Boolean);

      return cleaned.length
        ? cleaned.join("، ")
        : fallback;
    }

    if (
      value &&
      typeof value === "object"
    ) {
      return (
        value.title ||
        value.name ||
        value.description ||
        fallback
      );
    }

    const text = String(
      value ?? ""
    ).trim();

    return text || fallback;
  },

  /* =======================================================
     Workflow Actions Renderer
  ======================================================= */

  renderIdeaActions(idea) {
    const status =
      this.getLifecycleStatus(idea);

    const ideaId =
      this.escapeAttribute(
        idea?.id ?? ""
      );

    if (
      status ===
      this.lifecycle.CONVERTED
    ) {
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

    if (
      status ===
      this.lifecycle.PENDING
    ) {
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

    if (
      status ===
      this.lifecycle.APPROVED
    ) {
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
            تم اعتماد الفكرة وهي جاهزة للتحويل إلى مشروع.
          </span>
        </div>
      `;
    }

    if (
      status ===
      this.lifecycle.REJECTED
    ) {
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
            يمكن إعادة الفكرة للدراسة بعد تحديث نطاقها أو بياناتها.
          </span>
        </div>
      `;
    }

    if (
      status ===
      this.lifecycle.ARCHIVED
    ) {
      return `
        <div class="idea-workflow-actions">
          <span class="idea-action-note">
            هذه الفكرة مؤرشفة ولا يمكن تحويلها حالياً.
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
          يتم رفع الفكرة للمدير قبل إنشاء أي مشروع تنفيذي.
        </span>
      </div>
    `;
  },

  /* =======================================================
     Idea Card
  ======================================================= */

  renderIdeaCard(
    idea,
    displayNumber = null
  ) {
    const isQuickWin =
      this.isQuickWin(idea);

    const decisionScore =
      this.normalizePercent(
        idea?.decisionScore,
        0
      );

    const decisionLevel =
      idea?.decisionLevel ||
      "قيد التقييم";

    const riskLevel =
      idea?.riskLevel ||
      idea?.risk ||
      "متوسط";

    const ideaId =
      idea?.id ?? "";

    const lifecycleLabel =
      this.getLifecycleLabel(idea);

    const lifecycleClass =
      this.getLifecycleClass(idea);

    const lifecycleIcon =
      this.getLifecycleIcon(idea);

    const cardNumber =
      displayNumber !== null
        ? `${displayNumber}.`
        : "";

    return `
      <article
        class="idea-card"
        data-idea-id="${this.escapeAttribute(
          ideaId
        )}"
      >
        <div class="idea-card-head">
          <div>
            <span class="idea-dept">
              ${this.escapeHtml(
                idea?.department ||
                "غير مصنف"
              )}
            </span>

            <h3>
              ${
                cardNumber
                  ? `${cardNumber} `
                  : ""
              }

              ${this.escapeHtml(
                idea?.title ||
                "فكرة غير مسماة"
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
                idea?.priority ||
                "قيد التقييم"
              )}
            </span>

            <span
              class="idea-lifecycle-badge ${lifecycleClass}"
            >
              ${lifecycleIcon}
              ${this.escapeHtml(
                lifecycleLabel
              )}
            </span>
          </div>
        </div>

        <div class="idea-meta">
          <span>
            ⏱️
            ${this.escapeHtml(
              idea?.duration ||
              "غير محددة"
            )}
          </span>

          <span>
            💰
            ${this.escapeHtml(
              idea?.cost ||
              idea?.costLevel ||
              "غير محددة"
            )}
          </span>

          <span>
            ⚙️
            ${this.escapeHtml(
              idea?.ease ||
              idea?.difficulty ||
              idea?.complexity ||
              "غير محددة"
            )}
          </span>

          <span>
            📊 ${decisionScore}%
          </span>

          <span>
            🛡️
            ${this.escapeHtml(
              riskLevel
            )}
          </span>
        </div>

        <div class="idea-detail">
          <strong>التحدي</strong>

          <p>
            ${this.escapeHtml(
              this.valueToText(
                idea?.challenge
              )
            )}
          </p>
        </div>

        <div class="idea-detail">
          <strong>الحل المقترح</strong>

          <p>
            ${this.escapeHtml(
              this.valueToText(
                idea?.solution
              )
            )}
          </p>
        </div>

        <div class="idea-detail">
          <strong>دور الذكاء الاصطناعي</strong>

          <p>
            ${this.escapeHtml(
              this.valueToText(
                idea?.aiRole
              )
            )}
          </p>
        </div>

        <div class="idea-detail">
          <strong>الفوائد المتوقعة</strong>

          <p>
            ${this.escapeHtml(
              this.valueToText(
                idea?.benefits
              )
            )}
          </p>
        </div>

        <div class="idea-detail">
          <strong>قرار مبدئي</strong>

          <p>
            ${this.escapeHtml(
              decisionLevel
            )}
            ·
            Decision Score
            ${decisionScore}%
          </p>
        </div>

        ${this.renderIdeaActions(idea)}
      </article>
    `;
  },

  /* =======================================================
     Department Section
  ======================================================= */

  renderDepartmentSection(
    department,
    ideas = [],
    ideaNumberMap = new Map()
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
              ${this.escapeHtml(
                department
              )}
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
            .map(idea =>
              this.renderIdeaCard(
                idea,
                ideaNumberMap.get(
                  String(idea?.id)
                ) || null
              )
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
          .map(department => {
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
     Pipeline Reader
  ======================================================= */

  getPipeline(ideas = []) {
    const store = this.getStore();

    try {
      if (
        store &&
        typeof store.getPortfolioPipeline ===
          "function"
      ) {
        return (
          store.getPortfolioPipeline() ||
          {}
        );
      }

      if (
        store &&
        typeof store.getPipelineStats ===
          "function"
      ) {
        return (
          store.getPipelineStats() ||
          {}
        );
      }
    } catch (error) {
      console.warn(
        "AI Work Ideas: Pipeline calculation failed.",
        error
      );
    }

    const convertedIdeas =
      ideas.filter(
        idea =>
          this.isConverted(idea)
      ).length;

    const pendingApproval =
      ideas.filter(
        idea =>
          this.isPendingApproval(idea)
      ).length;

    const approvedIdeas =
      ideas.filter(
        idea =>
          this.isApproved(idea)
      ).length;

    const rejectedIdeas =
      ideas.filter(
        idea =>
          this.isRejected(idea)
      ).length;

    return {
      totalIdeas: ideas.length,
      convertedIdeas,
      pendingApproval,
      approvedIdeas,
      rejectedIdeas,
      totalProjects:
        convertedIdeas
    };
  },

  /* =======================================================
     Main Render
  ======================================================= */

  render(container) {
    if (!container) {
      return;
    }

    this._container =
      container;

    this.injectWorkflowStyles();

    const data =
      this.getData();

    const ideas =
      this.getIdeas();

    const departments =
      Array.isArray(
        data.departments
      )
        ? data.departments
        : [];

    const groupedIdeas =
      this.groupByDepartment(
        ideas
      );

    const pipeline =
      this.getPipeline(
        ideas
      );

    const highCount =
      ideas.filter(
        idea =>
          this.isHighPriority(
            idea
          )
      ).length;

    const mediumCount =
      ideas.filter(
        idea =>
          this.isMediumPriority(
            idea
          )
      ).length;

    const lowCount =
      ideas.filter(
        idea =>
          this.isLowPriority(
            idea
          )
      ).length;

    const quickWins =
      ideas.filter(
        idea =>
          this.isQuickWin(
            idea
          )
      ).length;

    const pendingCount =
      this.toSafeNumber(
        pipeline.pendingApproval ??
        pipeline.pendingIdeas,
        ideas.filter(
          idea =>
            this.isPendingApproval(
              idea
            )
        ).length
      );

    const convertedCount =
      this.toSafeNumber(
        pipeline.convertedIdeas,
        ideas.filter(
          idea =>
            this.isConverted(
              idea
            )
        ).length
      );

    const projectCount =
      this.toSafeNumber(
        pipeline.totalProjects,
        convertedCount
      );

    const targetIdeas =
      Math.max(
        1,
        this.toSafeNumber(
          data.summary?.targetIdeas,
          100
        )
      );

    const progress =
      Math.min(
        100,
        Math.max(
          0,
          Math.round(
            (
              ideas.length /
              targetIdeas
            ) *
            100
          )
        )
      );

    const avgDecision =
      ideas.length
        ? Math.round(
            ideas.reduce(
              (total, idea) =>
                total +
                this.toSafeNumber(
                  idea?.decisionScore,
                  0
                ),
              0
            ) /
            ideas.length
          )
        : 0;

    const departmentOrder =
      departments
        .map(
          department =>
            department?.name
        )
        .filter(Boolean);

    const orderedDepartments = [
      ...departmentOrder.filter(
        department =>
          groupedIdeas[department]
      ),

      ...Object.keys(
        groupedIdeas
      ).filter(
        department =>
          !departmentOrder.includes(
            department
          )
      )
    ];

    const ideaNumberMap =
      new Map();

    ideas.forEach(
      (idea, index) => {
        ideaNumberMap.set(
          String(idea?.id),
          index + 1
        );
      }
    );

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
              ⏳
              ${pendingCount}
              بانتظار الاعتماد
            </span>

            <span class="aiw-chip">
              📁
              ${projectCount}
              مشاريع
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
            <span>بانتظار الاعتماد</span>
            <strong>${pendingCount}</strong>
            <small>Pending Approval</small>
          </div>

          <div class="module-card">
            <span>Quick Wins</span>
            <strong>${quickWins}</strong>
            <small>Easy + Low Cost</small>
          </div>

          <div class="module-card">
            <span>تحولت إلى مشاريع</span>
            <strong>${convertedCount}</strong>
            <small>Approved Projects</small>
          </div>
        </div>

        <div class="module-panel">
          <div
            class="module-section-title compact"
          >
            <h2>
              مسار تحويل الفرص
            </h2>

            <p>
              جميع الفرص تبدأ كأفكار قابلة للدراسة،
              ثم ترفع للاعتماد، وبعد القرار الإداري
              تتحول إلى مشاريع تنفيذية مرتبطة بالفكرة الأصلية.
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
              <strong>
                ${this.toSafeNumber(
                  pipeline.approvedIdeas,
                  ideas.filter(
                    idea =>
                      this.isApproved(
                        idea
                      )
                  ).length
                )}
              </strong>
              <small>أفكار معتمدة</small>
            </div>

            <div>
              <span>📁</span>
              <strong>${projectCount}</strong>
              <small>مشاريع منشأة</small>
            </div>
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
          <h2>
            دليل الفرص التنفيذية
          </h2>

          <p>
            عرض منظم لجميع الفرص القابلة للتحويل إلى مشاريع تنفيذية.
            لا يتم إنشاء أي مشروع إلا بعد اعتماد الفكرة.
          </p>
        </div>

        ${
          orderedDepartments.length
            ? orderedDepartments
                .map(
                  department =>
                    this.renderDepartmentSection(
                      department,
                      groupedIdeas[
                        department
                      ] || [],
                      ideaNumberMap
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

    this.bindActionEvents();
    this.bindAutomaticSync();
  },

  /* =======================================================
     Action Events
  ======================================================= */

  bindActionEvents() {
    if (
      !this._container ||
      this._actionsBound
    ) {
      return;
    }

    this._actionsBound = true;

    this._container.addEventListener(
      "click",
      event => {
        const button =
          event.target.closest(
            "[data-idea-action]"
          );

        if (!button) {
          return;
        }

        const action =
          button.dataset
            .ideaAction;

        const ideaId =
          button.dataset
            .ideaId;

        if (
          !action ||
          !ideaId
        ) {
          return;
        }

        event.preventDefault();

        this.handleIdeaAction(
          action,
          ideaId
        );
      }
    );
  },

  handleIdeaAction(
    action,
    ideaId
  ) {
    const idea =
      this.getIdeaById(
        ideaId
      );

    if (!idea) {
      this.showToast(
        "لم يتم العثور على الفكرة.",
        "error"
      );

      return;
    }

    if (
      action === "submit"
    ) {
      this.openConfirmation({
        action,
        ideaId,

        icon: "📤",

        title:
          "رفع الفكرة للاعتماد",

        message:
          `سيتم رفع فكرة «${idea.title}» للقرار الإداري. لن يتم إنشاء مشروع في هذه المرحلة.`,

        confirmText:
          "رفع للاعتماد",

        noteLabel:
          "ملاحظات الرفع للاعتماد"
      });

      return;
    }

    if (
      action ===
      "approve-convert"
    ) {
      this.openConfirmation({
        action,
        ideaId,

        icon: "🚀",

        title:
          "اعتماد وإنشاء مشروع",

        message:
          `سيتم اعتماد فكرة «${idea.title}» وإنشاء مشروع تنفيذي جديد يبدأ بنسبة إنجاز 0%.`,

        confirmText:
          "اعتماد وإنشاء المشروع",

        noteLabel:
          "ملاحظات قرار الاعتماد"
      });

      return;
    }

    if (
      action ===
      "create-project"
    ) {
      this.openConfirmation({
        action,
        ideaId,

        icon: "📁",

        title:
          "إنشاء مشروع تنفيذي",

        message:
          `الفكرة «${idea.title}» معتمدة. سيتم إنشاء مشروع مرتبط بها مع الاحتفاظ بكامل بيانات الفكرة.`,

        confirmText:
          "إنشاء المشروع",

        noteLabel:
          "ملاحظات إنشاء المشروع"
      });

      return;
    }

    if (
      action === "reject"
    ) {
      this.openConfirmation({
        action,
        ideaId,

        icon: "⛔",

        title:
          "رفض الفكرة",

        message:
          `سيتم تسجيل قرار رفض فكرة «${idea.title}». يمكن إعادة فتحها لاحقاً بعد تعديلها.`,

        confirmText:
          "تأكيد الرفض",

        danger: true,

        noteLabel:
          "سبب الرفض"
      });

      return;
    }

    if (
      action === "reopen"
    ) {
      this.openConfirmation({
        action,
        ideaId,

        icon: "↩️",

        title:
          "إعادة فتح الفكرة",

        message:
          `ستعود فكرة «${idea.title}» إلى مرحلة الدراسة ويمكن رفعها للاعتماد مرة أخرى.`,

        confirmText:
          "إعادة فتح الفكرة",

        noteLabel:
          "ملاحظات إعادة الفتح"
      });

      return;
    }

    if (
      action ===
      "open-project"
    ) {
      this.openLinkedProject(
        ideaId
      );
    }
  },

  executePendingAction(
    notes = ""
  ) {
    if (!this._pendingAction) {
      return;
    }

    const {
      action,
      ideaId
    } = this._pendingAction;

    const actor =
      "الإدارة";

    let result;

    if (
      action === "submit"
    ) {
      result =
        this.submitForApproval(
          ideaId,
          {
            actor,
            notes
          }
        );
    }

    if (
      action ===
      "approve-convert"
    ) {
      result =
        this.approveAndCreateProject(
          ideaId,
          {
            actor,
            notes
          }
        );
    }

    if (
      action ===
      "create-project"
    ) {
      result =
        this.createProjectFromIdea(
          ideaId,
          {
            actor,
            notes,
            requireApproval: true
          }
        );
    }

    if (
      action === "reject"
    ) {
      result =
        this.rejectIdea(
          ideaId,
          {
            actor,
            reason: notes,
            notes
          }
        );
    }

    if (
      action === "reopen"
    ) {
      result =
        this.reopenIdea(
          ideaId,
          {
            actor,
            notes
          }
        );
    }

    if (
      !result ||
      result.success === false
    ) {
      this.showToast(
        result?.message ||
        "تعذر تنفيذ العملية.",
        "error"
      );

      return;
    }

    this.closeConfirmation();

    if (
      action === "submit"
    ) {
      this.showToast(
        "تم رفع الفكرة للاعتماد بنجاح.",
        "success"
      );
    }

    if (
      action ===
        "approve-convert" ||
      action ===
        "create-project"
    ) {
      const project =
        result?.project ||
        this.getProjectByIdeaId(
          ideaId
        );

      if (project?.id) {
        this.saveSelectedProject(
          project.id
        );
      }

      this.showToast(
        "تم إنشاء المشروع التنفيذي وربطه بالفكرة بنجاح.",
        "success"
      );
    }

    if (
      action === "reject"
    ) {
      this.showToast(
        "تم تسجيل قرار رفض الفكرة.",
        "success"
      );
    }

    if (
      action === "reopen"
    ) {
      this.showToast(
        "تمت إعادة الفكرة إلى مرحلة الدراسة.",
        "success"
      );
    }

    this.scheduleRefresh();
  },

  /* =======================================================
     Project Navigation
  ======================================================= */

  openLinkedProject(ideaId) {
    const project =
      this.getProjectByIdeaId(
        ideaId
      );

    if (!project) {
      this.showToast(
        "تعذر العثور على المشروع المرتبط.",
        "error"
      );

      return;
    }

    this.saveSelectedProject(
      project.id
    );

    try {
      window.dispatchEvent(
        new CustomEvent(
          "aiw:openProject",
          {
            detail: {
              projectId:
                project.id,

              sourceIdeaId:
                ideaId
            }
          }
        )
      );
    } catch (error) {
      console.warn(
        "AI Work Ideas: Open project event failed.",
        error
      );
    }

    if (
      window.AIW?.App &&
      typeof window.AIW.App.go ===
        "function"
    ) {
      window.AIW.App.go(
        "projects"
      );

      return;
    }

    if (
      window.AIW?.Router &&
      typeof window.AIW.Router.go ===
        "function"
    ) {
      window.AIW.Router.go(
        "projects"
      );

      return;
    }

    window.location.hash =
      "#projects";
  },

  saveSelectedProject(projectId) {
    try {
      window.localStorage.setItem(
        "aiwSelectedProjectId",
        String(projectId)
      );

      window.sessionStorage.setItem(
        "aiwSelectedProjectId",
        String(projectId)
      );
    } catch (error) {
      console.warn(
        "AI Work Ideas: Unable to save selected project.",
        error
      );
    }
  },

  /* =======================================================
     Confirmation Modal
  ======================================================= */

  openConfirmation(config = {}) {
    this.closeConfirmation();

    this._pendingAction = {
      action:
        config.action,

      ideaId:
        config.ideaId
    };

    const modal =
      document.createElement(
        "div"
      );

    modal.className =
      "idea-confirmation-overlay";

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
          ${this.escapeHtml(
            config.icon || "💡"
          )}
        </div>

        <h3 id="idea-confirmation-title">
          ${this.escapeHtml(
            config.title ||
            "تأكيد العملية"
          )}
        </h3>

        <p>
          ${this.escapeHtml(
            config.message ||
            "هل تريد متابعة العملية؟"
          )}
        </p>

        <label class="idea-confirmation-field">
          <span>
            ${this.escapeHtml(
              config.noteLabel ||
              "ملاحظات"
            )}
          </span>

          <textarea
            data-confirmation-notes
            rows="3"
            placeholder="إضافة ملاحظة اختيارية..."
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
            class="idea-action-button ${
              config.danger
                ? "danger"
                : "primary"
            }"
            data-confirmation-submit
          >
            ${this.escapeHtml(
              config.confirmText ||
              "تأكيد"
            )}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(
      modal
    );

    this._modal = modal;

    modal.addEventListener(
      "click",
      event => {
        if (
          event.target === modal ||
          event.target.closest(
            "[data-confirmation-close]"
          )
        ) {
          this.closeConfirmation();
          return;
        }

        if (
          event.target.closest(
            "[data-confirmation-submit]"
          )
        ) {
          const notes =
            modal.querySelector(
              "[data-confirmation-notes]"
            )?.value?.trim() ||
            "";

          this.executePendingAction(
            notes
          );
        }
      }
    );

    window.setTimeout(
      () => {
        modal.classList.add(
          "visible"
        );

        modal
          .querySelector(
            "[data-confirmation-notes]"
          )
          ?.focus();
      },
      10
    );
  },

  closeConfirmation() {
    if (!this._modal) {
      this._pendingAction =
        null;

      return;
    }

    const modal =
      this._modal;

    modal.classList.remove(
      "visible"
    );

    window.setTimeout(
      () => {
        modal.remove();
      },
      180
    );

    this._modal = null;
    this._pendingAction = null;
  },

  /* =======================================================
     Toast
  ======================================================= */

  showToast(
    message,
    type = "success"
  ) {
    const existing =
      document.querySelector(
        ".idea-workflow-toast"
      );

    if (existing) {
      existing.remove();
    }

    const toast =
      document.createElement(
        "div"
      );

    toast.className =
      `idea-workflow-toast ${type}`;

    toast.textContent =
      message;

    document.body.appendChild(
      toast
    );

    window.setTimeout(
      () => {
        toast.classList.add(
          "visible"
        );
      },
      10
    );

    window.setTimeout(
      () => {
        toast.classList.remove(
          "visible"
        );

        window.setTimeout(
          () => toast.remove(),
          200
        );
      },
      2800
    );
  },

  /* =======================================================
     Automatic Synchronization
  ======================================================= */

  scheduleRefresh() {
    window.clearTimeout(
      this._refreshTimer
    );

    this._refreshTimer =
      window.setTimeout(
        () => {
          if (
            !this._container ||
            !this._container
              .isConnected
          ) {
            return;
          }

          this._actionsBound =
            false;

          this.render(
            this._container
          );
        },
        80
      );
  },

  bindAutomaticSync() {
    if (this._syncBound) {
      return;
    }

    this._syncBound = true;

    const refreshIdeas =
      () => {
        this.scheduleRefresh();
      };

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
      "aiw:projectArchived"
    ];

    events.forEach(
      eventName => {
        window.addEventListener(
          eventName,
          refreshIdeas
        );
      }
    );

    if (
      window.AIW?.Store &&
      typeof window.AIW.Store
        .subscribe === "function"
    ) {
      this._unsubscribeStore =
        window.AIW.Store.subscribe(
          refreshIdeas
        );
    }

    window.addEventListener(
      "storage",
      event => {
        const supportedKeys = [
          window.AIW?.KEYS?.DATA,
          "atcDataV1",
          "aiwDataV1",
          "aiwData",
          "AIW_DATA"
        ].filter(Boolean);

        if (
          !event.key ||
          supportedKeys.includes(
            event.key
          )
        ) {
          refreshIdeas();
        }
      }
    );
  },

  /* =======================================================
     Workflow Styles
  ======================================================= */

  injectWorkflowStyles() {
    if (
      document.getElementById(
        "aiw-ideas-workflow-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "aiw-ideas-workflow-styles";

    style.textContent = `
      .idea-lifecycle-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 34px;
        padding: 7px 12px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 800;
        line-height: 1.2;
        white-space: nowrap;
        border: 1px solid transparent;
      }

      .idea-lifecycle-badge.idea {
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
        border: 0;
        min-height: 44px;
        padding: 11px 17px;
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
        box-shadow:
          0 8px 20px rgba(16, 27, 47, 0.16);
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
        grid-template-columns:
          repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .idea-pipeline-strip > div {
        display: flex;
        min-width: 0;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5px;
        min-height: 110px;
        padding: 14px 10px;
        border-radius: 20px;
        text-align: center;
        background: #f7f8fa;
        border: 1px solid rgba(15, 23, 42, 0.06);
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
        box-shadow:
          0 28px 80px rgba(15, 23, 42, 0.28);
        transform: translateY(12px) scale(0.98);
        transition: transform 0.18s ease;
      }

      .idea-confirmation-overlay.visible
      .idea-confirmation-dialog {
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

      .idea-confirmation-field span {
        display: block;
        margin-bottom: 8px;
        color: #344054;
        font-size: 13px;
        font-weight: 800;
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
        box-shadow:
          0 0 0 4px rgba(49, 89, 191, 0.1);
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
        bottom:
          calc(
            108px +
            env(safe-area-inset-bottom)
          );
        z-index: 100000;
        width: min(
          calc(100% - 36px),
          420px
        );
        box-sizing: border-box;
        padding: 14px 17px;
        border-radius: 16px;
        color: #ffffff;
        text-align: center;
        font-size: 14px;
        font-weight: 800;
        line-height: 1.6;
        background: #101b2f;
        box-shadow:
          0 18px 45px rgba(15, 23, 42, 0.25);
        opacity: 0;
        transform:
          translateX(50%)
          translateY(14px);
        transition:
          opacity 0.2s ease,
          transform 0.2s ease;
      }

      .idea-workflow-toast.visible {
        opacity: 1;
        transform:
          translateX(50%)
          translateY(0);
      }

      .idea-workflow-toast.error {
        background: #b42318;
      }

      .idea-workflow-toast.success {
        background: #087d3e;
      }

      @media (max-width: 720px) {
        .idea-pipeline-strip {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
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

    document.head.appendChild(
      style
    );
  },

  /* =======================================================
     Utilities
  ======================================================= */

  toSafeNumber(
    value,
    fallback = 0
  ) {
    const parsedValue =
      Number(value);

    return Number.isFinite(
      parsedValue
    )
      ? parsedValue
      : fallback;
  },

  normalizePercent(
    value,
    fallback = 0
  ) {
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
    return this.escapeHtml(
      value
    );
  }
};