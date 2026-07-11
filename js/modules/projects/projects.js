/* =========================================================
   AI Work - Projects Module V5.2.1
   Enterprise Biometric AI Project Delivery Center
   Store V2.3 Native Architecture

   File Path:
   js/modules/projects/projects.js

   V5.2.1:
   - Preserves the current project cards and details modal
   - Add / complete / reopen / delete project tasks
   - Calculates executive progress automatically from tasks
   - Calculates implementation readiness automatically
   - Project phase guidance with description and checkpoints
   - Start / pause / resume / complete / cancel / archive project
   - Safe project removal with idea-link restoration
   - Store subscription and cross-page synchronization
   - Fixes null owner crash in Safari / iPhone
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};
  AIW.Modules = AIW.Modules || {};

  const PHASE_GUIDE = {
    discovery: {
      title: "التحليل",
      description: "فهم المشكلة التشغيلية، تحديد نطاق المشروع، توثيق أصحاب المصلحة، وحصر مصادر البيانات والقيود.",
      outputs: ["وثيقة المشكلة", "نطاق أولي", "أصحاب المصلحة", "قائمة مصادر البيانات"]
    },
    planning: {
      title: "التخطيط",
      description: "إعداد خطة التنفيذ، الجدول الزمني، المسؤوليات، الميزانية التقديرية، والمخاطر الأولية.",
      outputs: ["خطة المشروع", "جدول زمني", "توزيع المسؤوليات", "سجل مخاطر أولي"]
    },
    design: {
      title: "التصميم",
      description: "تصميم الحل، تجربة المستخدم، تدفقات البيانات، الضوابط الأمنية، ومعايير القبول.",
      outputs: ["تصميم الحل", "تدفق البيانات", "ضوابط الحوكمة", "معايير القبول"]
    },
    development: {
      title: "التطوير",
      description: "بناء المكونات التقنية، إعداد التكاملات، تجهيز البيانات، وتوثيق النسخة الأولية.",
      outputs: ["نسخة أولية", "تكاملات", "بيانات جاهزة", "توثيق تقني"]
    },
    testing: {
      title: "الاختبار",
      description: "اختبار الوظائف والدقة والأمن والأداء، تسجيل الملاحظات، وإغلاق العيوب الحرجة.",
      outputs: ["خطة اختبار", "نتائج الاختبار", "سجل العيوب", "اعتماد الجاهزية"]
    },
    pilot: {
      title: "التجربة الأولية",
      description: "تشغيل الحل على نطاق محدود، جمع الملاحظات، قياس المؤشرات، وتحسين النموذج.",
      outputs: ["نتائج التجربة", "ملاحظات المستخدمين", "قياس المؤشرات", "خطة التحسين"]
    },
    production: {
      title: "التشغيل",
      description: "نشر الحل في البيئة التشغيلية، مراقبة الأداء، إدارة الدعم، وتفعيل إجراءات الاستجابة.",
      outputs: ["إطلاق تشغيلي", "مراقبة الأداء", "خطة دعم", "إجراءات استجابة"]
    },
    measurement: {
      title: "قياس النتائج",
      description: "قياس الأثر الفعلي، مقارنة النتائج بالمستهدفات، توثيق الدروس، واتخاذ قرار التوسع.",
      outputs: ["تقرير الأثر", "مقارنة المستهدفات", "دروس مستفادة", "قرار التوسع"]
    }
  };

  AIW.Modules.projects = {
    id: "projects",
    title: "المشاريع",
    icon: "📁",
    version: "5.2.1",

    _container: null,
    _unsubscribeStore: null,
    _refreshTimer: null,
    _detailsModal: null,
    _confirmModal: null,
    _boundContainer: null,
    _boundClick: null,
    _syncBound: false,
    _isRendering: false,
    _activeProjectId: null,

    config: {
      refreshDelay: 80,
      selectedProjectKey: "aiwSelectedProjectId",
      selectedIdeaKey: "aiwSelectedIdeaId",
      styleId: "aiw-projects-v521-styles"
    },

    status: {
      PLANNING: "planning",
      READY: "ready",
      IN_PROGRESS: "in-progress",
      PILOT: "pilot",
      PRODUCTION: "production",
      ON_HOLD: "on-hold",
      COMPLETED: "completed",
      CANCELLED: "cancelled",
      ARCHIVED: "archived"
    },

    getStore() {
      return window.AIW?.Store || null;
    },

    getState() {
      const store = this.getStore();

      try {
        return typeof store?.getState === "function"
          ? store.getState()
          : typeof store?.getData === "function"
            ? store.getData()
            : {};
      } catch (error) {
        console.error("[AIW Projects V5.2.1] Store read failed.", error);
        return {};
      }
    },

    toArray(value) {
      if (Array.isArray(value)) return value;
      if (value && typeof value === "object") return Object.values(value);
      return [];
    },

    toNumber(value, fallback = 0) {
      const number = Number(value);
      return Number.isFinite(number) ? number : fallback;
    },

    clamp(value, min = 0, max = 100) {
      return Math.min(
        max,
        Math.max(
          min,
          Math.round(this.toNumber(value, min))
        )
      );
    },

    normalizeText(value) {
      return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/_/g, "-");
    },

    hasValue(value) {
      return value !== null && value !== undefined && value !== "";
    },

    valueToDisplayText(value, fallback = "") {
      if (value === null || value === undefined) {
        return fallback;
      }

      if (typeof value === "object" && !Array.isArray(value)) {
        return (
          value.name ||
          value.title ||
          value.label ||
          value.email ||
          fallback
        );
      }

      const text = String(value).trim();
      return text || fallback;
    },

    normalizeProjectStatus(value) {
      const raw = this.normalizeText(value);

      const map = {
        "": this.status.PLANNING,
        planning: this.status.PLANNING,
        planned: this.status.PLANNING,
        draft: this.status.PLANNING,
        "قيد-التخطيط": this.status.PLANNING,
        ready: this.status.READY,
        approved: this.status.READY,
        جاهز: this.status.READY,
        active: this.status.IN_PROGRESS,
        "in-progress": this.status.IN_PROGRESS,
        "قيد-التنفيذ": this.status.IN_PROGRESS,
        pilot: this.status.PILOT,
        تجريبي: this.status.PILOT,
        production: this.status.PRODUCTION,
        operational: this.status.PRODUCTION,
        "قيد-التشغيل": this.status.PRODUCTION,
        "on-hold": this.status.ON_HOLD,
        paused: this.status.ON_HOLD,
        "متوقف-مؤقتاً": this.status.ON_HOLD,
        completed: this.status.COMPLETED,
        مكتمل: this.status.COMPLETED,
        cancelled: this.status.CANCELLED,
        canceled: this.status.CANCELLED,
        ملغي: this.status.CANCELLED,
        archived: this.status.ARCHIVED,
        مؤرشف: this.status.ARCHIVED
      };

      return map[raw] || this.status.PLANNING;
    },

    normalizeTask(task = {}, index = 0) {
      const status = this.normalizeText(task.status);

      const completed =
        task.completed === true ||
        ["completed", "done", "مكتمل", "منجز"].includes(status) ||
        this.toNumber(task.progress, 0) >= 100;

      return {
        ...task,
        id: task.id || `task-${index + 1}`,
        title: task.title || task.name || `مهمة ${index + 1}`,
        description: task.description || "",
        owner: this.valueToDisplayText(task.owner, "غير محدد"),
        weight: Math.max(1, this.toNumber(task.weight, 1)),
        status:
          completed
            ? "completed"
            : status === "in-progress"
              ? "in-progress"
              : "pending",
        progress: completed ? 100 : this.clamp(task.progress || 0),
        dueDate: task.dueDate || null,
        completedAt:
          completed
            ? (task.completedAt || new Date().toISOString())
            : null
      };
    },

    getDefaultPhases() {
      const lifecycle = window.AIW?.LIFECYCLE?.PROJECT_PHASES;

      const source =
        Array.isArray(lifecycle) && lifecycle.length
          ? lifecycle
          : Object.keys(PHASE_GUIDE).map((id, index) => ({
              id,
              title: PHASE_GUIDE[id].title,
              order: index + 1
            }));

      return source.map((phase, index) => ({
        id:
          phase.id ||
          Object.keys(PHASE_GUIDE)[index] ||
          `phase-${index + 1}`,

        title:
          phase.title ||
          PHASE_GUIDE[phase.id]?.title ||
          `مرحلة ${index + 1}`,

        titleEn: phase.titleEn || "",
        order: this.toNumber(phase.order, index + 1),
        status: index === 0 ? "current" : "pending",
        progress: 0,
        startedAt: index === 0 ? new Date().toISOString() : null,
        completedAt: null
      }));
    },

    normalizePhases(phases) {
      const source = this.toArray(phases);
      const defaults = this.getDefaultPhases();
      const list = source.length ? source : defaults;

      return list.map((phase, index) => ({
        ...phase,
        id:
          phase.id ||
          defaults[index]?.id ||
          `phase-${index + 1}`,

        title:
          phase.title ||
          defaults[index]?.title ||
          `مرحلة ${index + 1}`,

        titleEn:
          phase.titleEn ||
          defaults[index]?.titleEn ||
          "",

        order:
          this.toNumber(
            phase.order,
            index + 1
          ),

        status:
          phase.status ||
          (index === 0 ? "current" : "pending"),

        progress:
          this.clamp(
            phase.progress ??
            (phase.status === "completed" ? 100 : 0)
          ),

        startedAt:
          phase.startedAt ||
          null,

        completedAt:
          phase.completedAt ||
          null
      }));
    },

    calculateTasksProgress(tasks = []) {
      if (!tasks.length) return 0;

      let totalWeight = 0;
      let weightedProgress = 0;

      tasks.forEach(task => {
        const weight = Math.max(
          1,
          this.toNumber(task.weight, 1)
        );

        totalWeight += weight;
        weightedProgress +=
          this.clamp(task.progress) *
          weight;
      });

      return totalWeight
        ? Math.round(weightedProgress / totalWeight)
        : 0;
    },

    calculatePhaseProgress(phases = []) {
      if (!phases.length) return 0;

      const total = phases.reduce(
        (sum, phase) =>
          sum + this.clamp(phase.progress),
        0
      );

      return Math.round(total / phases.length);
    },

    calculateReadiness(project = {}) {
      const tasks = this.toArray(project.tasks);
      const phases = this.toArray(project.phases);

      const taskScore = tasks.length
        ? this.calculateTasksProgress(tasks)
        : 0;

      const phaseScore = phases.length
        ? this.calculatePhaseProgress(phases)
        : 0;

      const planningSignals = [
        Boolean(
          project.owner &&
          project.owner !== "غير محدد"
        ),
        Boolean(project.schedule?.plannedStart),
        Boolean(project.schedule?.plannedEnd),
        Boolean(this.hasValue(project.budget?.estimated)),
        this.toArray(project.kpis).length > 0,
        this.toArray(project.risks).length > 0
      ];

      const planningScore = Math.round(
        (
          planningSignals.filter(Boolean).length /
          planningSignals.length
        ) * 100
      );

      if (!tasks.length && !phases.length) {
        return this.clamp(
          project.readiness ??
          planningScore
        );
      }

      return this.clamp(
        taskScore * 0.45 +
        phaseScore * 0.35 +
        planningScore * 0.20
      );
    },

    normalizeProject(project = {}, index = 0) {
      const tasks = this.toArray(project.tasks).map(
        (task, taskIndex) =>
          this.normalizeTask(task, taskIndex)
      );

      const phases = this.normalizePhases(
        project.phases
      );

      const progress = tasks.length
        ? this.calculateTasksProgress(tasks)
        : this.clamp(
            project.progress ??
            project.completion ??
            0
          );

      const schedule = {
        plannedStart:
          project.schedule?.plannedStart ||
          project.startDate ||
          null,

        plannedEnd:
          project.schedule?.plannedEnd ||
          project.targetDate ||
          project.endDate ||
          null,

        actualStart:
          project.schedule?.actualStart ||
          project.startedAt ||
          null,

        actualEnd:
          project.schedule?.actualEnd ||
          project.completedAt ||
          null
      };

      const budget = {
        estimated:
          project.budget?.estimated ??
          project.estimatedBudget ??
          null,

        approved:
          project.budget?.approved ??
          project.approvedBudget ??
          null,

        spent:
          Math.max(
            0,
            this.toNumber(
              project.budget?.spent ??
              project.spentBudget,
              0
            )
          ),

        currency:
          project.budget?.currency ||
          project.currency ||
          "AED"
      };

      const currentPhase =
        project.currentPhase ||
        phases.find(
          phase =>
            phase.status === "current"
        )?.id ||
        phases.find(
          phase =>
            phase.status !== "completed"
        )?.id ||
        phases[phases.length - 1]?.id ||
        "discovery";

      const normalized = {
        ...project,

        id:
          project.id ||
          project.projectId ||
          `project-${index + 1}`,

        icon:
          project.icon ||
          "📁",

        title:
          project.title ||
          project.name ||
          "مشروع غير مسمى",

        titleEn:
          project.titleEn ||
          project.englishTitle ||
          project.nameEn ||
          "",

        department:
          project.department ||
          project.businessUnit ||
          project.portfolio ||
          "غير مصنف",

        description:
          project.description ||
          project.summary ||
          project.solution ||
          "",

        owner: this.valueToDisplayText(
          project.owner ??
          project.projectOwner ??
          project.manager,
          "غير محدد"
        ),

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

        riskLevel:
          project.riskLevel ||
          project.risk ||
          "متوسط",

        status:
          this.normalizeProjectStatus(
            project.projectStatus ??
            project.status
          ),

        projectStatus:
          this.normalizeProjectStatus(
            project.projectStatus ??
            project.status
          ),

        tasks,
        phases,
        progress,
        schedule,
        budget,
        currentPhase,

        sourceIdeaId:
          project.sourceIdeaId ||
          project.ideaId ||
          null,

        ideaId:
          project.ideaId ||
          project.sourceIdeaId ||
          null,

        milestones:
          this.toArray(project.milestones),

        kpis:
          this.toArray(project.kpis),

        risks:
          this.toArray(project.risks),

        dependencies:
          this.toArray(project.dependencies),

        readiness: 0,
        deletedAt: project.deletedAt || null
      };

      normalized.readiness =
        this.calculateReadiness(normalized);

      return normalized;
    },

    getProjects() {
      const store = this.getStore();
      let projects = [];

      try {
        if (
          typeof store?.getProjects ===
          "function"
        ) {
          projects = store.getProjects({
            includeArchived: false
          });
        } else if (
          typeof store?.getCollection ===
          "function"
        ) {
          projects = store.getCollection(
            "projects"
          );
        } else {
          projects =
            this.getState().projects ||
            [];
        }
      } catch (error) {
        console.warn(
          "[AIW Projects V5.2.1] Project read failed.",
          error
        );
      }

      return this.toArray(projects)
        .map((project, index) =>
          this.normalizeProject(
            project,
            index
          )
        )
        .filter(
          project =>
            !project.deletedAt &&
            project.status !==
              this.status.ARCHIVED
        );
    },

    getProjectById(projectId) {
      const store = this.getStore();
      let project = null;

      try {
        if (
          typeof store?.getProject ===
          "function"
        ) {
          project =
            store.getProject(projectId);
        } else if (
          typeof store?.find ===
          "function"
        ) {
          project =
            store.find(
              "projects",
              projectId
            );
        }
      } catch (_) {}

      if (!project) {
        project =
          this.getProjects().find(
            item =>
              String(item.id) ===
              String(projectId)
          );
      }

      return project
        ? this.normalizeProject(project)
        : null;
    },

    getIdeaById(ideaId) {
      if (!this.hasValue(ideaId)) {
        return null;
      }

      const store = this.getStore();

      try {
        if (
          typeof store?.getIdea ===
          "function"
        ) {
          return store.getIdea(ideaId);
        }

        if (
          typeof store?.find ===
          "function"
        ) {
          return store.find(
            "ideas",
            ideaId
          );
        }
      } catch (_) {}

      return (
        this.toArray(
          this.getState().ideas
        ).find(
          idea =>
            String(idea.id) ===
            String(ideaId)
        ) || null
      );
    },

    getSourceIdea(project = {}) {
      return project.sourceIdeaId
        ? this.getIdeaById(
            project.sourceIdeaId
          )
        : null;
    },

    normalizeResult(result) {
      if (result?.success === false) {
        return result;
      }

      if (result?.success === true) {
        return result;
      }

      if (
        result &&
        typeof result === "object"
      ) {
        return {
          success: true,
          project:
            result.project ||
            result,
          result
        };
      }

      return {
        success: Boolean(result),
        result
      };
    },

    updateProject(projectId, changes = {}) {
      const store = this.getStore();

      try {
        if (
          typeof store?.updateProject ===
          "function"
        ) {
          return this.normalizeResult(
            store.updateProject(
              projectId,
              changes
            )
          );
        }

        if (
          typeof store?.updateItem ===
          "function"
        ) {
          return this.normalizeResult(
            store.updateItem(
              "projects",
              projectId,
              changes
            )
          );
        }
      } catch (error) {
        return {
          success: false,
          message: "تعذر تحديث المشروع.",
          error
        };
      }

      return {
        success: false,
        message:
          "تحديث المشروع غير مدعوم في Store."
      };
    },

    addTask(projectId, taskData = {}) {
      const store = this.getStore();

      try {
        if (
          typeof store?.addProjectTask ===
          "function"
        ) {
          return this.normalizeResult(
            store.addProjectTask(
              projectId,
              taskData
            )
          );
        }
      } catch (error) {
        return {
          success: false,
          message: "تعذر إضافة المهمة.",
          error
        };
      }

      const project =
        this.getProjectById(projectId);

      if (!project) {
        return {
          success: false,
          message:
            "لم يتم العثور على المشروع."
        };
      }

      const task = this.normalizeTask(
        {
          id: `task-${Date.now()}`,
          title: taskData.title,
          description:
            taskData.description ||
            "",
          owner:
            taskData.owner ||
            "غير محدد",
          weight:
            taskData.weight ||
            1,
          status: "pending",
          progress: 0
        },
        project.tasks.length
      );

      return this.updateProject(
        projectId,
        {
          tasks: [
            ...project.tasks,
            task
          ]
        }
      );
    },

    toggleTask(projectId, taskId) {
      const project =
        this.getProjectById(projectId);

      if (!project) {
        return {
          success: false,
          message:
            "لم يتم العثور على المشروع."
        };
      }

      const task =
        project.tasks.find(
          item =>
            String(item.id) ===
            String(taskId)
        );

      if (!task) {
        return {
          success: false,
          message:
            "لم يتم العثور على المهمة."
        };
      }

      const completed =
        task.status !== "completed";

      const updates = {
        status:
          completed
            ? "completed"
            : "pending",

        progress:
          completed
            ? 100
            : 0,

        completedAt:
          completed
            ? new Date().toISOString()
            : null
      };

      const store = this.getStore();

      try {
        if (
          typeof store?.updateProjectTask ===
          "function"
        ) {
          return this.normalizeResult(
            store.updateProjectTask(
              projectId,
              taskId,
              updates
            )
          );
        }
      } catch (error) {
        return {
          success: false,
          message:
            "تعذر تحديث المهمة.",
          error
        };
      }

      const tasks =
        project.tasks.map(
          item =>
            String(item.id) ===
            String(taskId)
              ? {
                  ...item,
                  ...updates
                }
              : item
        );

      return this.updateProject(
        projectId,
        { tasks }
      );
    },

    deleteTask(projectId, taskId) {
      const store = this.getStore();

      try {
        if (
          typeof store?.removeProjectTask ===
          "function"
        ) {
          return this.normalizeResult(
            store.removeProjectTask(
              projectId,
              taskId
            )
          );
        }
      } catch (error) {
        return {
          success: false,
          message:
            "تعذر حذف المهمة.",
          error
        };
      }

      const project =
        this.getProjectById(projectId);

      if (!project) {
        return {
          success: false,
          message:
            "لم يتم العثور على المشروع."
        };
      }

      return this.updateProject(
        projectId,
        {
          tasks:
            project.tasks.filter(
              item =>
                String(item.id) !==
                String(taskId)
            )
        }
      );
    },

    setProjectStatus(projectId, nextStatus) {
      const store = this.getStore();

      try {
        if (
          typeof store?.setProjectStatus ===
          "function"
        ) {
          return this.normalizeResult(
            store.setProjectStatus(
              projectId,
              nextStatus,
              {
                actor: "الإدارة"
              }
            )
          );
        }
      } catch (error) {
        return {
          success: false,
          message:
            "تعذر تغيير حالة المشروع.",
          error
        };
      }

      const changes = {
        status: nextStatus,
        projectStatus: nextStatus
      };

      if (
        nextStatus ===
        this.status.IN_PROGRESS
      ) {
        const current =
          this.getProjectById(projectId);

        changes.startedAt =
          current?.startedAt ||
          new Date().toISOString();

        changes.schedule = {
          ...(current?.schedule || {}),
          actualStart:
            current?.schedule?.actualStart ||
            new Date().toISOString()
        };
      }

      if (
        nextStatus ===
        this.status.COMPLETED
      ) {
        changes.progress = 100;
        changes.readiness = 100;
        changes.completedAt =
          new Date().toISOString();
      }

      return this.updateProject(
        projectId,
        changes
      );
    },

    updatePhase(projectId, phaseId, action) {
      const project =
        this.getProjectById(projectId);

      if (!project) {
        return {
          success: false,
          message:
            "لم يتم العثور على المشروع."
        };
      }

      const now =
        new Date().toISOString();

      let phases =
        project.phases.map(
          phase => ({ ...phase })
        );

      const index =
        phases.findIndex(
          phase =>
            String(phase.id) ===
            String(phaseId)
        );

      if (index < 0) {
        return {
          success: false,
          message:
            "لم يتم العثور على المرحلة."
        };
      }

      if (action === "complete") {
        phases[index] = {
          ...phases[index],
          status: "completed",
          progress: 100,
          completedAt: now,
          startedAt:
            phases[index].startedAt ||
            now
        };

        if (phases[index + 1]) {
          phases[index + 1] = {
            ...phases[index + 1],
            status: "current",
            startedAt:
              phases[index + 1].startedAt ||
              now
          };
        }
      }

      if (action === "activate") {
        phases = phases.map(
          (phase, phaseIndex) => ({
            ...phase,

            status:
              phaseIndex < index
                ? "completed"
                : phaseIndex === index
                  ? "current"
                  : phase.status === "completed"
                    ? "completed"
                    : "pending",

            progress:
              phaseIndex < index
                ? 100
                : phase.progress,

            completedAt:
              phaseIndex < index
                ? (
                    phase.completedAt ||
                    now
                  )
                : phase.completedAt,

            startedAt:
              phaseIndex === index
                ? (
                    phase.startedAt ||
                    now
                  )
                : phase.startedAt
          })
        );
      }

      const current =
        phases.find(
          phase =>
            phase.status === "current"
        ) ||
        [...phases].reverse().find(
          phase =>
            phase.status === "completed"
        ) ||
        phases[0];

      return this.updateProject(
        projectId,
        {
          phases,
          currentPhase:
            current?.id ||
            project.currentPhase
        }
      );
    },

    removeProject(projectId) {
      const store = this.getStore();

      try {
        if (
          typeof store?.removeProject ===
          "function"
        ) {
          return this.normalizeResult(
            store.removeProject(projectId)
          );
        }

        if (
          typeof store?.remove ===
          "function"
        ) {
          return {
            success:
              store.remove(
                "projects",
                projectId
              ) === true
          };
        }
      } catch (error) {
        return {
          success: false,
          message:
            "تعذر حذف المشروع.",
          error
        };
      }

      return {
        success: false,
        message:
          "حذف المشروع غير مدعوم في Store."
      };
    },

    restoreIdeaLink(project) {
      if (!project?.sourceIdeaId) {
        return;
      }

      const store = this.getStore();

      const idea =
        this.getIdeaById(
          project.sourceIdeaId
        );

      if (!idea) return;

      const changes = {
        status: "approved",
        ideaStatus: "approved",
        lifecycleStatus: "approved",
        projectId: null,
        convertedToProject: false,

        conversion: {
          ...(idea.conversion || {}),
          converted: false,
          projectId: null,
          revertedAt:
            new Date().toISOString(),
          revertedBy:
            "الإدارة"
        }
      };

      try {
        if (
          typeof store?.updateIdea ===
          "function"
        ) {
          store.updateIdea(
            idea.id,
            changes
          );
        } else if (
          typeof store?.updateItem ===
          "function"
        ) {
          store.updateItem(
            "ideas",
            idea.id,
            changes
          );
        }
      } catch (error) {
        console.warn(
          "[AIW Projects V5.2.1] Idea link restoration failed.",
          error
        );
      }
    },

    cancelProject(projectId) {
      const project =
        this.getProjectById(projectId);

      if (!project) {
        return {
          success: false,
          message:
            "لم يتم العثور على المشروع."
        };
      }

      const result =
        this.setProjectStatus(
          projectId,
          this.status.CANCELLED
        );

      if (result.success) {
        this.restoreIdeaLink(project);
      }

      return result;
    },

    deleteProject(projectId) {
      const project =
        this.getProjectById(projectId);

      if (!project) {
        return {
          success: false,
          message:
            "لم يتم العثور على المشروع."
        };
      }

      const result =
        this.removeProject(projectId);

      if (result.success) {
        this.restoreIdeaLink(project);
      }

      return result;
    },

    getStatusLabel(status) {
      const labels = {
        [this.status.PLANNING]:
          "قيد التخطيط",

        [this.status.READY]:
          "جاهز للتنفيذ",

        [this.status.IN_PROGRESS]:
          "قيد التنفيذ",

        [this.status.PILOT]:
          "تجربة أولية",

        [this.status.PRODUCTION]:
          "قيد التشغيل",

        [this.status.ON_HOLD]:
          "متوقف مؤقتاً",

        [this.status.COMPLETED]:
          "مكتمل",

        [this.status.CANCELLED]:
          "ملغي",

        [this.status.ARCHIVED]:
          "مؤرشف"
      };

      return (
        labels[status] ||
        "قيد التخطيط"
      );
    },

    getStatusClass(status) {
      if (
        status ===
        this.status.IN_PROGRESS
      ) {
        return "active";
      }

      if (
        status ===
        this.status.PRODUCTION
      ) {
        return "production";
      }

      if (
        status ===
        this.status.PILOT
      ) {
        return "pilot";
      }

      if (
        status ===
        this.status.READY
      ) {
        return "approved";
      }

      if (
        status ===
        this.status.COMPLETED
      ) {
        return "completed";
      }

      if (
        status ===
        this.status.ON_HOLD
      ) {
        return "blocked";
      }

      if (
        status ===
        this.status.CANCELLED
      ) {
        return "cancelled";
      }

      return "planned";
    },

    getStatusIcon(status) {
      const icons = {
        [this.status.PLANNING]:
          "📝",

        [this.status.READY]:
          "✅",

        [this.status.IN_PROGRESS]:
          "🚀",

        [this.status.PILOT]:
          "🧪",

        [this.status.PRODUCTION]:
          "🟢",

        [this.status.ON_HOLD]:
          "⏸️",

        [this.status.COMPLETED]:
          "🏁",

        [this.status.CANCELLED]:
          "⛔",

        [this.status.ARCHIVED]:
          "🗄️"
      };

      return icons[status] || "📁";
    },

    getPortfolioMetrics(projects = []) {
      const total = projects.length;

      const active =
        projects.filter(project =>
          [
            this.status.IN_PROGRESS,
            this.status.PILOT,
            this.status.PRODUCTION
          ].includes(project.status)
        ).length;

      const completed =
        projects.filter(
          project =>
            project.status ===
            this.status.COMPLETED
        ).length;

      const paused =
        projects.filter(
          project =>
            project.status ===
            this.status.ON_HOLD
        ).length;

      const averageProgress =
        total
          ? Math.round(
              projects.reduce(
                (sum, project) =>
                  sum + project.progress,
                0
              ) / total
            )
          : 0;

      const averageReadiness =
        total
          ? Math.round(
              projects.reduce(
                (sum, project) =>
                  sum + project.readiness,
                0
              ) / total
            )
          : 0;

      return {
        total,
        active,
        completed,
        paused,
        averageProgress,
        averageReadiness
      };
    },

    renderProjectCard(project) {
      const sourceIdea =
        this.getSourceIdea(project);

      const completedTasks =
        project.tasks.filter(
          task =>
            task.status === "completed"
        ).length;

      const currentPhase =
        project.phases.find(
          phase =>
            String(phase.id) ===
            String(project.currentPhase)
        );

      return `
        <article
          class="project-card"
          data-project-id="${this.escape(project.id)}"
        >
          <div class="project-card-head">
            <div class="project-title-block">
              <div class="project-icon">
                ${this.escape(project.icon)}
              </div>

              <div>
                <span class="project-department">
                  ${this.escape(project.department)}
                </span>

                <h3>
                  ${this.escape(project.title)}
                </h3>

                ${
                  project.titleEn
                    ? `
                      <strong>
                        ${this.escape(project.titleEn)}
                      </strong>
                    `
                    : ""
                }
              </div>
            </div>

            <div class="project-badges">
              <span class="project-priority">
                ${this.escape(project.priority)}
              </span>

              <span class="project-status-badge ${this.getStatusClass(project.status)}">
                ${this.getStatusIcon(project.status)}
                ${this.escape(
                  this.getStatusLabel(
                    project.status
                  )
                )}
              </span>
            </div>
          </div>

          <div class="project-meta">
            <span>
              👤
              ${this.escape(project.owner)}
            </span>

            <span>
              ⏱️
              ${this.escape(project.duration)}
            </span>

            <span>
              🛡️
              ${this.escape(project.riskLevel)}
            </span>

            <span>
              🧭
              ${this.escape(
                currentPhase?.title ||
                "التحليل"
              )}
            </span>
          </div>

          ${
            project.description
              ? `
                <div class="project-description">
                  ${this.escape(project.description)}
                </div>
              `
              : ""
          }

          <div class="project-delivery-grid">
            <div class="project-progress-block">
              <div>
                <small>
                  التقدم التنفيذي
                </small>

                <b>
                  ${project.progress}%
                </b>
              </div>

              <div class="aiw-progress">
                <div style="width:${project.progress}%"></div>
              </div>
            </div>

            <div class="project-progress-block">
              <div>
                <small>
                  جاهزية التنفيذ
                </small>

                <b>
                  ${project.readiness}%
                </b>
              </div>

              <div class="aiw-progress readiness">
                <div style="width:${project.readiness}%"></div>
              </div>
            </div>
          </div>

          <div class="project-mini-stats">
            <span>
              ✅
              ${completedTasks}/${project.tasks.length}
              مهام
            </span>

            <span>
              📍
              ${project.milestones.length}
              معالم
            </span>

            <span>
              📊
              ${project.kpis.length}
              مؤشرات
            </span>

            <span>
              ⚠️
              ${project.risks.length}
              مخاطر
            </span>
          </div>

          ${
            sourceIdea
              ? `
                <div class="project-origin-box">
                  <div>
                    <span>
                      💡 الفكرة الأصلية
                    </span>

                    <strong>
                      ${this.escape(
                        sourceIdea.title ||
                        "فكرة مرتبطة"
                      )}
                    </strong>
                  </div>

                  <button
                    type="button"
                    class="project-inline-action"
                    data-project-action="open-idea"
                    data-project-id="${this.escape(project.id)}"
                    data-idea-id="${this.escape(sourceIdea.id)}"
                  >
                    فتح الفكرة
                  </button>
                </div>
              `
              : ""
          }

          <div class="project-actions">
            <button
              type="button"
              class="project-action-button primary"
              data-project-action="details"
              data-project-id="${this.escape(project.id)}"
            >
              عرض التفاصيل وإدارة المشروع
            </button>
          </div>
        </article>
      `;
    },

    render(container) {
      if (
        !container ||
        this._isRendering
      ) {
        return;
      }

      this._isRendering = true;
      this._container = container;

      try {
        this.injectStyles();

        const projects =
          this.getProjects();

        const metrics =
          this.getPortfolioMetrics(
            projects
          );

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
                إدارة المشاريع التنفيذية وربط التقدم بالمهام والمراحل،
                مع التحكم بحالة المشروع والجاهزية والإلغاء والأرشفة.
              </p>

              <div class="aiw-chip-row">
                <span class="aiw-chip">
                  📁
                  ${metrics.total}
                  مشروع
                </span>

                <span class="aiw-chip">
                  🚀
                  ${metrics.active}
                  نشط
                </span>

                <span class="aiw-chip">
                  ⏸️
                  ${metrics.paused}
                  متوقف
                </span>

                <span class="aiw-chip">
                  ✅
                  ${metrics.completed}
                  مكتمل
                </span>

                <span class="aiw-chip">
                  📊
                  ${metrics.averageProgress}%
                  متوسط التقدم
                </span>

                <span class="aiw-chip">
                  🎯
                  ${metrics.averageReadiness}%
                  متوسط الجاهزية
                </span>
              </div>
            </div>

            <div class="module-grid">
              ${this.kpi(
                "إجمالي المشاريع",
                metrics.total,
                "Project Portfolio"
              )}

              ${this.kpi(
                "المشاريع النشطة",
                metrics.active,
                "Active Delivery"
              )}

              ${this.kpi(
                "المشاريع المتوقفة",
                metrics.paused,
                "On Hold"
              )}

              ${this.kpi(
                "المشاريع المكتملة",
                metrics.completed,
                "Completed"
              )}

              ${this.kpi(
                "متوسط التقدم",
                `${metrics.averageProgress}%`,
                "Delivery Progress"
              )}

              ${this.kpi(
                "متوسط الجاهزية",
                `${metrics.averageReadiness}%`,
                "Implementation Readiness"
              )}
            </div>

            <div class="module-panel">
              <div class="module-section-title compact">
                <h2>
                  قائمة المشاريع التنفيذية
                </h2>

                <p>
                  التقدم التنفيذي يرتفع تلقائياً عند إكمال المهام،
                  والجاهزية تُحسب من المهام والمراحل وبيانات التخطيط.
                </p>
              </div>

              ${
                projects.length
                  ? `
                    <div class="projects-grid">
                      ${projects
                        .map(project =>
                          this.renderProjectCard(project)
                        )
                        .join("")}
                    </div>
                  `
                  : `
                    <div class="module-empty projects-empty-state">
                      <strong>
                        لا توجد مشاريع حالياً
                      </strong>

                      <p>
                        بعد اعتماد فكرة وتحويلها، سيظهر المشروع هنا تلقائياً.
                      </p>

                      <button
                        type="button"
                        class="project-action-button primary"
                        data-project-action="open-ideas"
                      >
                        فتح مركز الأفكار
                      </button>
                    </div>
                  `
              }
            </div>
          </section>
        `;

        this.bindEvents();
        this.bindSync();
      } finally {
        this._isRendering = false;
      }
    },

    kpi(label, value, note) {
      if (
        typeof window.AIW?.Widgets?.kpi ===
        "function"
      ) {
        return window.AIW.Widgets.kpi({
          label,
          value,
          note
        });
      }

      return `
        <div class="module-card">
          <span>
            ${this.escape(label)}
          </span>

          <strong>
            ${this.escape(value)}
          </strong>

          <small>
            ${this.escape(note)}
          </small>
        </div>
      `;
    },

    bindEvents() {
      if (!this._container) return;

      if (
        this._boundContainer &&
        this._boundClick
      ) {
        this._boundContainer.removeEventListener(
          "click",
          this._boundClick
        );
      }

      this._boundClick = event => {
        const button =
          event.target.closest(
            "[data-project-action]"
          );

        if (!button) return;

        const action =
          button.dataset.projectAction;

        const projectId =
          button.dataset.projectId;

        const ideaId =
          button.dataset.ideaId;

        if (action === "details") {
          this.openProjectDetails(
            projectId
          );
        }

        if (action === "open-idea") {
          this.openSourceIdea(
            ideaId,
            projectId
          );
        }

        if (action === "open-ideas") {
          this.navigateTo("ideas");
        }
      };

      this._boundContainer =
        this._container;

      this._boundContainer.addEventListener(
        "click",
        this._boundClick
      );
    },

    openProjectDetails(projectId) {
      const project =
        this.getProjectById(projectId);

      if (!project) {
        this.showToast(
          "لم يتم العثور على المشروع.",
          "error"
        );
        return;
      }

      this.closeProjectDetails();
      this._activeProjectId = projectId;

      const sourceIdea =
        this.getSourceIdea(project);

      const modal =
        document.createElement("div");

      modal.className =
        "project-details-overlay";

      modal.innerHTML = `
        <div
          class="project-details-dialog"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            class="project-details-close"
            data-modal-action="close"
            aria-label="إغلاق"
          >
            ×
          </button>

          <div class="project-details-heading">
            <div class="project-details-icon">
              ${this.escape(project.icon)}
            </div>

            <div>
              <span>
                ${this.escape(project.department)}
              </span>

              <h3>
                ${this.escape(project.title)}
              </h3>

              ${
                project.titleEn
                  ? `
                    <small>
                      ${this.escape(project.titleEn)}
                    </small>
                  `
                  : ""
              }
            </div>
          </div>

          <div class="project-details-status">
            <span class="project-status-badge ${this.getStatusClass(project.status)}">
              ${this.getStatusIcon(project.status)}
              ${this.escape(
                this.getStatusLabel(
                  project.status
                )
              )}
            </span>

            <span class="project-priority">
              ${this.escape(project.priority)}
            </span>
          </div>

          <div class="project-details-kpis">
            <div>
              <small>
                التقدم
              </small>

              <strong>
                ${project.progress}%
              </strong>
            </div>

            <div>
              <small>
                الجاهزية
              </small>

              <strong>
                ${project.readiness}%
              </strong>
            </div>

            <div>
              <small>
                المهام
              </small>

              <strong>
                ${
                  project.tasks.filter(
                    task =>
                      task.status === "completed"
                  ).length
                }/${project.tasks.length}
              </strong>
            </div>

            <div>
              <small>
                المرحلة
              </small>

              <strong>
                ${this.escape(
                  project.phases.find(
                    phase =>
                      phase.id ===
                      project.currentPhase
                  )?.title ||
                  "التحليل"
                )}
              </strong>
            </div>
          </div>

          <div class="project-management-bar">
            ${this.renderStatusActions(project)}
          </div>

          ${
            project.description
              ? `
                <div class="project-details-section">
                  <strong>
                    وصف المشروع
                  </strong>

                  <p>
                    ${this.escape(project.description)}
                  </p>
                </div>
              `
              : ""
          }

          ${
            sourceIdea
              ? `
                <div class="project-details-section source">
                  <strong>
                    الفكرة الأصلية
                  </strong>

                  <p>
                    ${this.escape(
                      sourceIdea.title ||
                      "فكرة مرتبطة"
                    )}
                  </p>

                  <button
                    type="button"
                    class="project-action-button secondary"
                    data-modal-action="open-idea"
                    data-idea-id="${this.escape(sourceIdea.id)}"
                    data-project-id="${this.escape(project.id)}"
                  >
                    فتح الفكرة الأصلية
                  </button>
                </div>
              `
              : ""
          }

          ${this.renderTaskManager(project)}
          ${this.renderPhaseManager(project)}

          <div class="project-danger-zone">
            <strong>
              إدارة المشروع
            </strong>

            <p>
              الإلغاء يعيد الفكرة إلى حالة معتمدة.
              الحذف يزيل المشروع من القائمة مع فك الارتباط بالفكرة الأصلية.
            </p>

            <div>
              <button
                type="button"
                class="project-action-button warning"
                data-modal-action="cancel-project"
                data-project-id="${this.escape(project.id)}"
              >
                إلغاء المشروع
              </button>

              <button
                type="button"
                class="project-action-button danger"
                data-modal-action="delete-project"
                data-project-id="${this.escape(project.id)}"
              >
                حذف المشروع
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this._detailsModal = modal;

      modal.addEventListener(
        "click",
        event => {
          if (event.target === modal) {
            this.closeProjectDetails();
            return;
          }

          const button =
            event.target.closest(
              "[data-modal-action]"
            );

          if (!button) return;

          const action =
            button.dataset.modalAction;

          const targetProjectId =
            button.dataset.projectId ||
            project.id;

          const taskId =
            button.dataset.taskId;

          const phaseId =
            button.dataset.phaseId;

          if (action === "close") {
            this.closeProjectDetails();
          }

          if (action === "open-idea") {
            this.closeProjectDetails();

            this.openSourceIdea(
              button.dataset.ideaId,
              targetProjectId
            );
          }

          if (action === "add-task") {
            this.submitNewTask(
              targetProjectId
            );
          }

          if (action === "toggle-task") {
            this.runAction(
              () =>
                this.toggleTask(
                  targetProjectId,
                  taskId
                ),
              "تم تحديث المهمة."
            );
          }

          if (action === "delete-task") {
            this.openConfirm({
              title: "حذف المهمة",
              message:
                "سيتم حذف هذه المهمة وإعادة حساب التقدم التنفيذي.",
              confirmText: "حذف المهمة",
              danger: true,

              onConfirm: () => {
                const result =
                  this.deleteTask(
                    targetProjectId,
                    taskId
                  );

                if (result.success) {
                  this.reloadOpenProject(
                    targetProjectId,
                    "تم حذف المهمة."
                  );
                }

                return result;
              }
            });
          }

          if (action === "phase-info") {
            this.openPhaseInfo(
              targetProjectId,
              phaseId
            );
          }

          if (action === "phase-complete") {
            this.runAction(
              () =>
                this.updatePhase(
                  targetProjectId,
                  phaseId,
                  "complete"
                ),
              "تم إكمال المرحلة والانتقال للمرحلة التالية."
            );
          }

          if (action === "phase-activate") {
            this.runAction(
              () =>
                this.updatePhase(
                  targetProjectId,
                  phaseId,
                  "activate"
                ),
              "تم تحديد المرحلة الحالية."
            );
          }

          if (action === "start-project") {
            this.changeStatus(
              targetProjectId,
              this.status.IN_PROGRESS
            );
          }

          if (action === "pause-project") {
            this.changeStatus(
              targetProjectId,
              this.status.ON_HOLD
            );
          }

          if (action === "resume-project") {
            this.changeStatus(
              targetProjectId,
              this.status.IN_PROGRESS
            );
          }

          if (action === "pilot-project") {
            this.changeStatus(
              targetProjectId,
              this.status.PILOT
            );
          }

          if (action === "production-project") {
            this.changeStatus(
              targetProjectId,
              this.status.PRODUCTION
            );
          }

          if (action === "complete-project") {
            this.openConfirm({
              title: "إكمال المشروع",
              message:
                "سيتم تسجيل المشروع كمكتمل ورفع التقدم والجاهزية إلى 100%.",
              confirmText:
                "إكمال المشروع",

              onConfirm: () => {
                const result =
                  this.setProjectStatus(
                    targetProjectId,
                    this.status.COMPLETED
                  );

                if (result.success) {
                  this.reloadOpenProject(
                    targetProjectId,
                    "تم إكمال المشروع."
                  );
                }

                return result;
              }
            });
          }

          if (action === "cancel-project") {
            this.openConfirm({
              title: "إلغاء المشروع",
              message:
                "سيتم إلغاء المشروع وإعادة الفكرة الأصلية إلى حالة معتمدة.",
              confirmText:
                "إلغاء المشروع",
              danger: true,

              onConfirm: () => {
                const result =
                  this.cancelProject(
                    targetProjectId
                  );

                if (result.success) {
                  this.closeProjectDetails();
                  this.scheduleRefresh();

                  this.showToast(
                    "تم إلغاء المشروع وإعادة الفكرة.",
                    "success"
                  );
                }

                return result;
              }
            });
          }

          if (action === "delete-project") {
            this.openConfirm({
              title: "حذف المشروع",
              message:
                "سيتم حذف المشروع من المحفظة وفك ارتباطه بالفكرة الأصلية.",
              confirmText:
                "حذف المشروع",
              danger: true,

              onConfirm: () => {
                const result =
                  this.deleteProject(
                    targetProjectId
                  );

                if (result.success) {
                  this.closeProjectDetails();
                  this.scheduleRefresh();

                  this.showToast(
                    "تم حذف المشروع وإعادة الفكرة.",
                    "success"
                  );
                }

                return result;
              }
            });
          }
        }
      );

      requestAnimationFrame(
        () =>
          modal.classList.add(
            "visible"
          )
      );
    },

    renderStatusActions(project) {
      const buttons = [];

      if (
        [
          this.status.PLANNING,
          this.status.READY
        ].includes(project.status)
      ) {
        buttons.push(`
          <button
            type="button"
            data-modal-action="start-project"
            data-project-id="${this.escape(project.id)}"
          >
            🚀 بدء التنفيذ
          </button>
        `);
      }

      if (
        [
          this.status.IN_PROGRESS,
          this.status.PILOT,
          this.status.PRODUCTION
        ].includes(project.status)
      ) {
        buttons.push(`
          <button
            type="button"
            data-modal-action="pause-project"
            data-project-id="${this.escape(project.id)}"
          >
            ⏸️ إيقاف مؤقت
          </button>
        `);
      }

      if (
        project.status ===
        this.status.ON_HOLD
      ) {
        buttons.push(`
          <button
            type="button"
            data-modal-action="resume-project"
            data-project-id="${this.escape(project.id)}"
          >
            ▶️ استئناف
          </button>
        `);
      }

      if (
        project.status ===
        this.status.IN_PROGRESS
      ) {
        buttons.push(`
          <button
            type="button"
            data-modal-action="pilot-project"
            data-project-id="${this.escape(project.id)}"
          >
            🧪 بدء التجربة
          </button>
        `);
      }

      if (
        project.status ===
        this.status.PILOT
      ) {
        buttons.push(`
          <button
            type="button"
            data-modal-action="production-project"
            data-project-id="${this.escape(project.id)}"
          >
            🟢 الانتقال للتشغيل
          </button>
        `);
      }

      if (
        ![
          this.status.COMPLETED,
          this.status.CANCELLED
        ].includes(project.status)
      ) {
        buttons.push(`
          <button
            type="button"
            data-modal-action="complete-project"
            data-project-id="${this.escape(project.id)}"
          >
            🏁 إكمال المشروع
          </button>
        `);
      }

      return buttons.join("");
    },

    renderTaskManager(project) {
      return `
        <div class="project-details-section">
          <div class="project-section-heading">
            <div>
              <strong>
                المهام ونقاط الإنجاز
              </strong>

              <small>
                كل مهمة مكتملة ترفع التقدم التنفيذي تلقائياً.
              </small>
            </div>
          </div>

          <div class="project-new-task">
            <input
              type="text"
              data-new-task-title
              placeholder="اسم المهمة الجديدة"
            >

            <input
              type="text"
              data-new-task-description
              placeholder="وصف مختصر اختياري"
            >

            <button
              type="button"
              class="project-action-button primary"
              data-modal-action="add-task"
              data-project-id="${this.escape(project.id)}"
            >
              إضافة مهمة
            </button>
          </div>

          <div class="project-task-list">
            ${
              project.tasks.length
                ? project.tasks
                    .map(task => `
                      <div class="${
                        task.status === "completed"
                          ? "completed"
                          : ""
                      }">
                        <button
                          type="button"
                          class="project-task-check"
                          data-modal-action="toggle-task"
                          data-project-id="${this.escape(project.id)}"
                          data-task-id="${this.escape(task.id)}"
                        >
                          ${
                            task.status === "completed"
                              ? "✓"
                              : ""
                          }
                        </button>

                        <span>
                          <strong>
                            ${this.escape(task.title)}
                          </strong>

                          ${
                            task.description
                              ? `
                                <small>
                                  ${this.escape(task.description)}
                                </small>
                              `
                              : ""
                          }
                        </span>

                        <b>
                          ${task.progress}%
                        </b>

                        <button
                          type="button"
                          class="project-task-delete"
                          data-modal-action="delete-task"
                          data-project-id="${this.escape(project.id)}"
                          data-task-id="${this.escape(task.id)}"
                        >
                          حذف
                        </button>
                      </div>
                    `)
                    .join("")
                : `
                  <div class="project-empty-inline">
                    لا توجد مهام بعد.
                    أضف أول مهمة لبدء حساب التقدم التنفيذي.
                  </div>
                `
            }
          </div>
        </div>
      `;
    },

    renderPhaseManager(project) {
      return `
        <div class="project-details-section">
          <div class="project-section-heading">
            <div>
              <strong>
                مراحل المشروع
              </strong>

              <small>
                اضغط على المرحلة لعرض المطلوب والمخرجات المقترحة.
              </small>
            </div>
          </div>

          <div class="project-phase-list">
            ${project.phases
              .map(phase => `
                <div class="${
                  phase.status === "current"
                    ? "current"
                    : ""
                } ${
                  phase.status === "completed"
                    ? "completed"
                    : ""
                }">
                  <button
                    type="button"
                    class="project-phase-main"
                    data-modal-action="phase-info"
                    data-project-id="${this.escape(project.id)}"
                    data-phase-id="${this.escape(phase.id)}"
                  >
                    <b>
                      ${
                        phase.status === "completed"
                          ? "✓"
                          : phase.order
                      }
                    </b>

                    <span>
                      <strong>
                        ${this.escape(phase.title)}
                      </strong>

                      <small>
                        ${phase.progress}%
                      </small>
                    </span>
                  </button>

                  <div class="project-phase-actions">
                    ${
                      phase.status !== "completed"
                        ? `
                          <button
                            type="button"
                            data-modal-action="phase-activate"
                            data-project-id="${this.escape(project.id)}"
                            data-phase-id="${this.escape(phase.id)}"
                          >
                            تحديد
                          </button>

                          <button
                            type="button"
                            data-modal-action="phase-complete"
                            data-project-id="${this.escape(project.id)}"
                            data-phase-id="${this.escape(phase.id)}"
                          >
                            إكمال
                          </button>
                        `
                        : `
                          <span>
                            مكتملة
                          </span>
                        `
                    }
                  </div>
                </div>
              `)
              .join("")}
          </div>
        </div>
      `;
    },

    submitNewTask(projectId) {
      const modal =
        this._detailsModal;

      const title =
        modal
          ?.querySelector(
            "[data-new-task-title]"
          )
          ?.value
          ?.trim() ||
        "";

      const description =
        modal
          ?.querySelector(
            "[data-new-task-description]"
          )
          ?.value
          ?.trim() ||
        "";

      if (!title) {
        this.showToast(
          "اكتب اسم المهمة أولاً.",
          "error"
        );
        return;
      }

      const result =
        this.addTask(
          projectId,
          {
            title,
            description,
            weight: 1
          }
        );

      if (!result.success) {
        this.showToast(
          result.message ||
          "تعذر إضافة المهمة.",
          "error"
        );
        return;
      }

      this.reloadOpenProject(
        projectId,
        "تمت إضافة المهمة."
      );
    },

    changeStatus(projectId, status) {
      const result =
        this.setProjectStatus(
          projectId,
          status
        );

      if (!result.success) {
        this.showToast(
          result.message ||
          "تعذر تغيير حالة المشروع.",
          "error"
        );
        return;
      }

      this.reloadOpenProject(
        projectId,
        "تم تحديث حالة المشروع."
      );
    },

    runAction(action, successMessage) {
      const result = action();

      if (!result?.success) {
        this.showToast(
          result?.message ||
          "تعذر تنفيذ العملية.",
          "error"
        );
        return;
      }

      this.reloadOpenProject(
        this._activeProjectId,
        successMessage
      );
    },

    reloadOpenProject(projectId, message = "") {
      this.scheduleRefresh();
      this.closeProjectDetails();

      window.setTimeout(
        () => {
          this.openProjectDetails(
            projectId
          );

          if (message) {
            this.showToast(
              message,
              "success"
            );
          }
        },
        120
      );
    },

    openPhaseInfo(projectId, phaseId) {
      const project =
        this.getProjectById(projectId);

      const phase =
        project?.phases.find(
          item =>
            String(item.id) ===
            String(phaseId)
        );

      if (!phase) return;

      const guide =
        PHASE_GUIDE[phase.id] ||
        {
          title: phase.title,
          description:
            "هذه المرحلة تحتاج تحديد نطاق العمل والمخرجات المطلوبة حسب طبيعة المشروع.",
          outputs: [
            "تحديد المتطلبات",
            "توثيق المخرجات",
            "مراجعة واعتماد"
          ]
        };

      this.openConfirm({
        title: guide.title,
        message: guide.description,

        html: `
          <div class="phase-guide-box">
            <strong>
              المخرجات المقترحة
            </strong>

            <ul>
              ${guide.outputs
                .map(item => `
                  <li>
                    ${this.escape(item)}
                  </li>
                `)
                .join("")}
            </ul>

            <p>
              التقدم الحالي:
              ${phase.progress}%
            </p>
          </div>
        `,

        confirmText: "إغلاق",
        hideCancel: true,

        onConfirm: () => ({
          success: true
        })
      });
    },

    openConfirm(config = {}) {
      this.closeConfirm();

      const modal =
        document.createElement("div");

      modal.className =
        "project-confirm-overlay";

      modal.innerHTML = `
        <div class="project-confirm-dialog">
          <h3>
            ${this.escape(
              config.title ||
              "تأكيد"
            )}
          </h3>

          <p>
            ${this.escape(
              config.message ||
              ""
            )}
          </p>

          ${config.html || ""}

          <div class="project-confirm-actions">
            ${
              config.hideCancel
                ? ""
                : `
                  <button
                    type="button"
                    class="project-action-button secondary"
                    data-confirm-action="cancel"
                  >
                    إلغاء
                  </button>
                `
            }

            <button
              type="button"
              class="project-action-button ${
                config.danger
                  ? "danger"
                  : "primary"
              }"
              data-confirm-action="confirm"
            >
              ${this.escape(
                config.confirmText ||
                "تأكيد"
              )}
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this._confirmModal = modal;

      modal.addEventListener(
        "click",
        event => {
          if (
            event.target === modal ||
            event.target.closest(
              '[data-confirm-action="cancel"]'
            )
          ) {
            this.closeConfirm();
            return;
          }

          if (
            event.target.closest(
              '[data-confirm-action="confirm"]'
            )
          ) {
            const result =
              typeof config.onConfirm ===
                "function"
                ? config.onConfirm()
                : { success: true };

            if (
              result?.success !==
              false
            ) {
              this.closeConfirm();
            } else {
              this.showToast(
                result.message ||
                "تعذر تنفيذ العملية.",
                "error"
              );
            }
          }
        }
      );

      requestAnimationFrame(
        () =>
          modal.classList.add(
            "visible"
          )
      );
    },

    closeConfirm() {
      if (!this._confirmModal) {
        return;
      }

      const modal =
        this._confirmModal;

      modal.classList.remove(
        "visible"
      );

      window.setTimeout(
        () => modal.remove(),
        160
      );

      this._confirmModal = null;
    },

    closeProjectDetails() {
      if (!this._detailsModal) {
        return;
      }

      const modal =
        this._detailsModal;

      modal.classList.remove(
        "visible"
      );

      window.setTimeout(
        () => modal.remove(),
        180
      );

      this._detailsModal = null;
      this._activeProjectId = null;
    },

    openSourceIdea(ideaId, projectId = null) {
      if (!ideaId) return;

      try {
        sessionStorage.setItem(
          this.config.selectedIdeaKey,
          String(ideaId)
        );

        localStorage.setItem(
          this.config.selectedIdeaKey,
          String(ideaId)
        );

        if (projectId) {
          sessionStorage.setItem(
            this.config.selectedProjectKey,
            String(projectId)
          );

          localStorage.setItem(
            this.config.selectedProjectKey,
            String(projectId)
          );
        }
      } catch (_) {}

      this.navigateTo("ideas");
    },

    navigateTo(route) {
      if (
        typeof window.AIW?.App?.go ===
        "function"
      ) {
        window.AIW.App.go(route);
      } else if (
        typeof window.AIW?.Router?.go ===
        "function"
      ) {
        window.AIW.Router.go(route);
      } else {
        window.location.hash =
          `#${route}`;
      }
    },

    scheduleRefresh() {
      window.clearTimeout(
        this._refreshTimer
      );

      this._refreshTimer =
        window.setTimeout(
          () => {
            if (
              this._container
                ?.isConnected
            ) {
              this.render(
                this._container
              );
            }
          },
          this.config.refreshDelay
        );
    },

    bindSync() {
      if (this._syncBound) return;

      this._syncBound = true;

      const refresh =
        () => this.scheduleRefresh();

      [
        "aiw:dataChanged",
        "aiw:dataUpdated",
        "aiw:storeChanged",
        "aiw:projectUpdated",
        "aiw:projectsUpdated",
        "aiw:projectTaskCreated",
        "aiw:projectTaskUpdated",
        "aiw:projectTaskDeleted",
        "aiw:projectStatusChanged",
        "aiw:projectPhaseChanged",
        "aiw:ideaConvertedToProject",
        "aiw:projectCreatedFromIdea",
        "aiw:itemDeleted"
      ].forEach(eventName =>
        window.addEventListener(
          eventName,
          refresh
        )
      );

      const store =
        this.getStore();

      if (
        typeof store?.subscribe ===
        "function"
      ) {
        this._unsubscribeStore =
          store.subscribe(
            change => {
              if (
                ![
                  "persist",
                  "settingsPersisted",
                  "aiw:metadataChanged"
                ].includes(
                  change?.type
                )
              ) {
                refresh();
              }
            }
          );
      }
    },

    showToast(message, type = "success") {
      document
        .querySelector(
          ".project-workflow-toast"
        )
        ?.remove();

      const toast =
        document.createElement("div");

      toast.className =
        `project-workflow-toast ${type}`;

      toast.textContent =
        message;

      document.body.appendChild(
        toast
      );

      requestAnimationFrame(
        () =>
          toast.classList.add(
            "visible"
          )
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
        2600
      );
    },

    injectStyles() {
      if (
        document.getElementById(
          this.config.styleId
        )
      ) {
        return;
      }

      const style =
        document.createElement("style");

      style.id =
        this.config.styleId;

      style.textContent = `
        .project-card { position:relative; }

        .project-title-block {
          display:flex;
          align-items:flex-start;
          gap:12px;
          min-width:0;
        }

        .project-title-block > div:last-child {
          min-width:0;
        }

        .project-department {
          display:block;
          margin-bottom:5px;
          color:#667085;
          font-size:12px;
          font-weight:700;
        }

        .project-badges {
          display:flex;
          flex-wrap:wrap;
          justify-content:flex-end;
          gap:7px;
        }

        .project-priority,
        .project-status-badge {
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:5px;
          min-height:32px;
          padding:6px 10px;
          border:1px solid transparent;
          border-radius:999px;
          font-size:12px;
          font-weight:800;
          white-space:nowrap;
        }

        .project-priority {
          color:#475467;
          background:#f2f4f7;
          border-color:#e4e7ec;
        }

        .project-status-badge.planned {
          color:#3159bf;
          background:#edf3ff;
          border-color:#dbe7ff;
        }

        .project-status-badge.approved {
          color:#087d3e;
          background:#e2f7ea;
          border-color:#c8efd7;
        }

        .project-status-badge.active {
          color:#fff;
          background:#3159bf;
          border-color:#3159bf;
        }

        .project-status-badge.pilot {
          color:#b75c00;
          background:#fff3d9;
          border-color:#ffe4ac;
        }

        .project-status-badge.production {
          color:#fff;
          background:#087d3e;
          border-color:#087d3e;
        }

        .project-status-badge.blocked {
          color:#b42318;
          background:#feeceb;
          border-color:#fbd3d0;
        }

        .project-status-badge.completed {
          color:#fff;
          background:#101b2f;
          border-color:#101b2f;
        }

        .project-status-badge.cancelled {
          color:#667085;
          background:#f2f4f7;
          border-color:#e4e7ec;
        }

        .project-description {
          margin-top:15px;
          color:#667085;
          font-size:14px;
          line-height:1.8;
        }

        .project-delivery-grid {
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:14px;
          margin-top:18px;
        }

        .project-progress-block > div:first-child {
          display:flex;
          justify-content:space-between;
          gap:10px;
          margin-bottom:8px;
        }

        .project-progress-block small {
          color:#667085;
          font-size:12px;
          font-weight:700;
        }

        .project-mini-stats {
          display:flex;
          flex-wrap:wrap;
          gap:8px;
          margin-top:15px;
        }

        .project-mini-stats span {
          padding:7px 10px;
          border-radius:999px;
          color:#475467;
          background:#f2f4f7;
          font-size:11px;
          font-weight:700;
        }

        .project-origin-box {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:14px;
          margin-top:18px;
          padding:14px;
          border:1px solid #dbe7ff;
          border-radius:16px;
          background:#f7faff;
        }

        .project-origin-box span {
          display:block;
          margin-bottom:4px;
          color:#667085;
          font-size:11px;
          font-weight:700;
        }

        .project-origin-box strong {
          display:block;
          color:#101828;
          font-size:13px;
        }

        .project-inline-action {
          min-height:36px;
          padding:8px 11px;
          border:1px solid #dbe7ff;
          border-radius:11px;
          color:#3159bf;
          background:#fff;
          font:inherit;
          font-size:12px;
          font-weight:800;
        }

        .project-actions {
          display:grid;
          margin-top:18px;
          padding-top:16px;
          border-top:1px solid rgba(15,23,42,.08);
        }

        .project-action-button {
          appearance:none;
          min-height:43px;
          padding:10px 14px;
          border:0;
          border-radius:13px;
          font:inherit;
          font-size:13px;
          font-weight:800;
          cursor:pointer;
        }

        .project-action-button.primary {
          color:#fff;
          background:#101b2f;
        }

        .project-action-button.secondary {
          color:#344054;
          background:#f2f4f7;
          border:1px solid #e4e7ec;
        }

        .project-action-button.warning {
          color:#b75c00;
          background:#fff3d9;
          border:1px solid #ffe4ac;
        }

        .project-action-button.danger {
          color:#fff;
          background:#b42318;
        }

        .project-details-overlay,
        .project-confirm-overlay {
          position:fixed;
          inset:0;
          z-index:99999;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:
            24px 18px
            calc(
              24px +
              env(safe-area-inset-bottom)
            );
          direction:rtl;
          background:rgba(15,23,42,.48);
          backdrop-filter:blur(10px);
          opacity:0;
          transition:opacity .18s ease;
        }

        .project-details-overlay.visible,
        .project-confirm-overlay.visible {
          opacity:1;
        }

        .project-details-dialog {
          position:relative;
          width:min(100%,620px);
          max-height:min(86vh,780px);
          overflow-y:auto;
          padding:28px 22px 22px;
          border-radius:28px;
          background:#fff;
          box-shadow:0 28px 80px rgba(15,23,42,.28);
        }

        .project-details-close {
          position:absolute;
          top:14px;
          left:15px;
          width:36px;
          height:36px;
          border:0;
          border-radius:50%;
          color:#475467;
          background:#f2f4f7;
          font-size:24px;
          cursor:pointer;
        }

        .project-details-heading {
          display:flex;
          align-items:flex-start;
          gap:14px;
          padding-left:42px;
        }

        .project-details-icon {
          display:grid;
          place-items:center;
          flex:0 0 auto;
          width:62px;
          height:62px;
          border-radius:20px;
          font-size:30px;
          background:#101b2f;
        }

        .project-details-heading span {
          display:block;
          margin-bottom:4px;
          color:#667085;
          font-size:12px;
          font-weight:700;
        }

        .project-details-heading h3 {
          margin:0;
          color:#101828;
          font-size:23px;
          line-height:1.5;
        }

        .project-details-heading small {
          display:block;
          margin-top:5px;
          color:#667085;
          font-size:12px;
        }

        .project-details-status {
          display:flex;
          flex-wrap:wrap;
          gap:8px;
          margin-top:20px;
        }

        .project-details-kpis {
          display:grid;
          grid-template-columns:
            repeat(4,minmax(0,1fr));
          gap:10px;
          margin-top:20px;
        }

        .project-details-kpis > div {
          min-width:0;
          padding:13px 10px;
          border-radius:16px;
          text-align:center;
          background:#f7f8fa;
        }

        .project-details-kpis small,
        .project-details-kpis strong {
          display:block;
        }

        .project-details-kpis small {
          margin-bottom:5px;
          color:#667085;
          font-size:11px;
        }

        .project-management-bar {
          display:flex;
          flex-wrap:wrap;
          gap:8px;
          margin-top:18px;
        }

        .project-management-bar button,
        .project-phase-actions button {
          min-height:38px;
          padding:8px 11px;
          border:1px solid #dbe7ff;
          border-radius:11px;
          color:#3159bf;
          background:#fff;
          font:inherit;
          font-size:12px;
          font-weight:800;
        }

        .project-details-section {
          margin-top:20px;
          padding-top:18px;
          border-top:1px solid rgba(15,23,42,.08);
        }

        .project-details-section > strong {
          display:block;
          margin-bottom:9px;
          color:#101828;
          font-size:14px;
        }

        .project-details-section > p {
          margin:0;
          color:#667085;
          font-size:14px;
          line-height:1.8;
        }

        .project-details-section.source {
          padding:16px;
          border:1px solid #dbe7ff;
          border-radius:18px;
          background:#f7faff;
        }

        .project-section-heading {
          display:flex;
          justify-content:space-between;
          gap:12px;
          margin-bottom:12px;
        }

        .project-section-heading strong,
        .project-section-heading small {
          display:block;
        }

        .project-section-heading small {
          margin-top:4px;
          color:#667085;
          font-size:11px;
        }

        .project-new-task {
          display:grid;
          grid-template-columns:1fr 1fr auto;
          gap:8px;
          margin-bottom:12px;
        }

        .project-new-task input {
          width:100%;
          box-sizing:border-box;
          min-height:42px;
          padding:10px 12px;
          border:1px solid #d0d5dd;
          border-radius:12px;
          font:inherit;
        }

        .project-task-list,
        .project-phase-list {
          display:grid;
          gap:9px;
        }

        .project-task-list > div {
          display:flex;
          align-items:center;
          gap:10px;
          padding:11px 12px;
          border-radius:13px;
          background:#f9fafb;
        }

        .project-task-list > div.completed {
          opacity:.72;
        }

        .project-task-check {
          display:grid;
          place-items:center;
          flex:0 0 auto;
          width:30px;
          height:30px;
          border:1px solid #d0d5dd;
          border-radius:9px;
          color:#fff;
          background:#fff;
          font-weight:900;
        }

        .project-task-list > div.completed
        .project-task-check {
          background:#087d3e;
          border-color:#087d3e;
        }

        .project-task-list span {
          flex:1;
          min-width:0;
        }

        .project-task-list span strong,
        .project-task-list span small {
          display:block;
        }

        .project-task-list span strong {
          color:#101828;
          font-size:13px;
        }

        .project-task-list span small {
          margin-top:3px;
          color:#667085;
          font-size:11px;
        }

        .project-task-delete {
          border:0;
          color:#b42318;
          background:transparent;
          font:inherit;
          font-size:11px;
          font-weight:800;
        }

        .project-empty-inline {
          color:#667085;
          font-size:12px;
          line-height:1.7;
        }

        .project-phase-list > div {
          display:flex;
          align-items:center;
          gap:10px;
          padding:10px;
          border:1px solid transparent;
          border-radius:14px;
          background:#f9fafb;
        }

        .project-phase-list > div.current {
          border-color:#dbe7ff;
          background:#f7faff;
        }

        .project-phase-list > div.completed {
          background:#f2fbf5;
        }

        .project-phase-main {
          display:flex;
          align-items:center;
          gap:10px;
          flex:1;
          min-width:0;
          border:0;
          background:transparent;
          text-align:right;
          font:inherit;
        }

        .project-phase-main b {
          display:grid;
          place-items:center;
          flex:0 0 auto;
          width:30px;
          height:30px;
          border-radius:50%;
          color:#fff;
          background:#101b2f;
          font-size:11px;
        }

        .project-phase-main span {
          flex:1;
        }

        .project-phase-main strong,
        .project-phase-main small {
          display:block;
        }

        .project-phase-main strong {
          color:#101828;
          font-size:13px;
        }

        .project-phase-main small {
          margin-top:3px;
          color:#667085;
          font-size:11px;
        }

        .project-phase-actions {
          display:flex;
          gap:6px;
        }

        .project-phase-actions span {
          color:#087d3e;
          font-size:11px;
          font-weight:800;
        }

        .project-danger-zone {
          margin-top:24px;
          padding:16px;
          border:1px solid #fbd3d0;
          border-radius:18px;
          background:#fffafa;
        }

        .project-danger-zone > strong {
          display:block;
          color:#b42318;
        }

        .project-danger-zone > p {
          color:#667085;
          font-size:12px;
          line-height:1.7;
        }

        .project-danger-zone > div {
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:8px;
        }

        .project-confirm-dialog {
          width:min(100%,460px);
          padding:24px;
          border-radius:24px;
          background:#fff;
          box-shadow:0 28px 80px rgba(15,23,42,.28);
        }

        .project-confirm-dialog h3 {
          margin:0 0 10px;
          color:#101828;
        }

        .project-confirm-dialog > p {
          margin:0;
          color:#667085;
          line-height:1.8;
        }

        .project-confirm-actions {
          display:grid;
          grid-template-columns:1fr 1.2fr;
          gap:9px;
          margin-top:20px;
        }

        .phase-guide-box {
          margin-top:16px;
          padding:14px;
          border-radius:16px;
          background:#f7f8fa;
        }

        .phase-guide-box ul {
          margin:10px 0;
          padding-right:20px;
          color:#475467;
          line-height:1.9;
        }

        .phase-guide-box p {
          margin:0;
          color:#3159bf;
          font-weight:800;
        }

        .project-workflow-toast {
          position:fixed;
          right:50%;
          bottom:
            calc(
              108px +
              env(safe-area-inset-bottom)
            );
          z-index:100000;
          width:
            min(
              calc(100% - 36px),
              420px
            );
          box-sizing:border-box;
          padding:14px 17px;
          border-radius:16px;
          color:#fff;
          text-align:center;
          font-size:14px;
          font-weight:800;
          background:#087d3e;
          box-shadow:
            0 18px 45px
            rgba(15,23,42,.25);
          opacity:0;
          transform:
            translateX(50%)
            translateY(14px);
          transition:
            opacity .2s ease,
            transform .2s ease;
        }

        .project-workflow-toast.visible {
          opacity:1;
          transform:
            translateX(50%)
            translateY(0);
        }

        .project-workflow-toast.error {
          background:#b42318;
        }

        @media (max-width:760px) {
          .project-badges {
            justify-content:flex-start;
          }

          .project-delivery-grid {
            grid-template-columns:1fr;
          }

          .project-origin-box {
            align-items:flex-start;
            flex-direction:column;
          }

          .project-inline-action {
            width:100%;
          }

          .project-details-kpis {
            grid-template-columns:
              repeat(2,minmax(0,1fr));
          }

          .project-new-task {
            grid-template-columns:1fr;
          }

          .project-phase-list > div {
            align-items:flex-start;
            flex-direction:column;
          }

          .project-phase-actions {
            width:100%;
          }

          .project-phase-actions button {
            flex:1;
          }

          .project-danger-zone > div,
          .project-confirm-actions {
            grid-template-columns:1fr;
          }
        }
      `;

      document.head.appendChild(
        style
      );
    },

    destroy() {
      window.clearTimeout(
        this._refreshTimer
      );

      if (
        typeof this._unsubscribeStore ===
        "function"
      ) {
        this._unsubscribeStore();
      }

      if (
        this._boundContainer &&
        this._boundClick
      ) {
        this._boundContainer
          .removeEventListener(
            "click",
            this._boundClick
          );
      }

      this._unsubscribeStore = null;
      this._boundContainer = null;
      this._boundClick = null;
      this._container = null;
      this._syncBound = false;

      this.closeProjectDetails();
      this.closeConfirm();
    },

    escape(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  };
})();
