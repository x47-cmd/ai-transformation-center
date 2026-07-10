/* =========================================================
   AI Work - Projects Module V5.1
   Enterprise Biometric AI Project Delivery Center
   Store V2.2 Native Architecture

   File Path:
   js/modules/projects/projects.js

   Fixes in V5.1:
   - Full alignment with Store V2.2 project statuses
   - Reads projectStatus before legacy status fields
   - Supports planning / ready / in-progress / pilot /
     production / on-hold / completed / cancelled / archived
   - Correct Store V2.2 CRUD method routing
   - Safe project normalization for tasks, phases, budget,
     schedule, milestones, KPIs, risks and lifecycle history
   - Correct selected-card targeting without affecting buttons
   - Correct platform-health fallback from dashboard data
   - Stable delegated events across repeated renders
   - Selected project auto-open support
   - Full idea/project bidirectional navigation
   - No internal project seeding
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};
  AIW.Modules = AIW.Modules || {};

  AIW.Modules.projects = {
    id: "projects",
    title: "المشاريع",
    icon: "📁",
    version: "5.1.0",

    _container: null,
    _unsubscribeStore: null,
    _refreshTimer: null,
    _detailsModal: null,
    _eventsContainer: null,
    _boundClickHandler: null,
    _syncBound: false,
    _isRendering: false,
    _autoOpenedProjectId: null,

    config: {
      refreshDelay: 80,
      selectedProjectKey: "aiwSelectedProjectId",
      selectedIdeaKey: "aiwSelectedIdeaId",
      styleId: "aiw-projects-v51-styles"
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

    /* =======================================================
       Store Access
    ======================================================= */

    getStore() {
      return window.AIW?.Store || null;
    },

    getState() {
      const store = this.getStore();

      if (!store) {
        console.error(
          "AI Work Projects V5.1: AIW.Store is unavailable."
        );
        return {};
      }

      try {
        if (typeof store.getState === "function") {
          const state = store.getState();
          return state && typeof state === "object"
            ? state
            : {};
        }

        if (typeof store.getData === "function") {
          const state = store.getData();
          return state && typeof state === "object"
            ? state
            : {};
        }
      } catch (error) {
        console.error(
          "AI Work Projects V5.1: Unable to read Store state.",
          error
        );
      }

      return {};
    },

    getCollection(name) {
      const value = this.getState()?.[name];
      return Array.isArray(value) ? value : [];
    },

    /* =======================================================
       Data Readers
    ======================================================= */

    getRawProjects() {
      const store = this.getStore();

      try {
        if (typeof store?.getProjects === "function") {
          const projects = store.getProjects({
            includeArchived: false
          });

          if (Array.isArray(projects)) {
            return projects;
          }
        }

        if (typeof store?.getCollection === "function") {
          const projects = store.getCollection("projects");

          if (Array.isArray(projects)) {
            return projects;
          }
        }
      } catch (error) {
        console.warn(
          "AI Work Projects V5.1: Project reader failed.",
          error
        );
      }

      return this.getCollection("projects").filter(
        project => !project?.deletedAt
      );
    },

    getIdeas() {
      const store = this.getStore();

      try {
        if (typeof store?.getIdeas === "function") {
          const ideas = store.getIdeas();

          if (Array.isArray(ideas)) {
            return ideas;
          }
        }

        if (typeof store?.getCollection === "function") {
          const ideas = store.getCollection("ideas");

          if (Array.isArray(ideas)) {
            return ideas;
          }
        }
      } catch (error) {
        console.warn(
          "AI Work Projects V5.1: Ideas reader failed.",
          error
        );
      }

      return this.getCollection("ideas").filter(
        idea => !idea?.deletedAt
      );
    },

    getProjectById(projectId) {
      if (!this.hasValue(projectId)) {
        return null;
      }

      const store = this.getStore();

      try {
        if (typeof store?.getProject === "function") {
          const project = store.getProject(projectId);

          if (project) {
            return this.normalizeProject(project);
          }
        }

        if (typeof store?.find === "function") {
          const project = store.find(
            "projects",
            projectId
          );

          if (project) {
            return this.normalizeProject(project);
          }
        }
      } catch (error) {
        console.warn(
          "AI Work Projects V5.1: Project lookup failed.",
          error
        );
      }

      const project = this.getRawProjects().find(
        item =>
          String(item?.id) ===
          String(projectId)
      );

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
        if (typeof store?.getIdea === "function") {
          const idea = store.getIdea(ideaId);

          if (idea) {
            return idea;
          }
        }

        if (typeof store?.find === "function") {
          const idea = store.find(
            "ideas",
            ideaId
          );

          if (idea) {
            return idea;
          }
        }
      } catch (error) {
        console.warn(
          "AI Work Projects V5.1: Idea lookup failed.",
          error
        );
      }

      return (
        this.getIdeas().find(
          idea =>
            String(idea?.id) ===
            String(ideaId)
        ) || null
      );
    },

    getSourceIdea(project = {}) {
      const sourceIdeaId =
        project.sourceIdeaId ??
        project.ideaId ??
        project.origin?.ideaId ??
        project.source?.ideaId ??
        null;

      return this.hasValue(sourceIdeaId)
        ? this.getIdeaById(sourceIdeaId)
        : null;
    },

    getProjects() {
      return this.getRawProjects()
        .map((project, index) =>
          this.normalizeProject(
            project,
            index
          )
        )
        .filter(
          project =>
            Boolean(project) &&
            !project.deletedAt &&
            project.status !==
              this.status.ARCHIVED
        );
    },

    /* =======================================================
       Normalization
    ======================================================= */

    normalizeProject(project, index = 0) {
      if (Array.isArray(project)) {
        project = {
          id: index + 1,
          icon: project[0],
          title: project[1],
          titleEn: project[2],
          priority: project[3],
          duration: project[4],
          cost: project[5],
          progress: project[6],
          status: project[7],
          department: project[8]
        };
      }

      if (
        !project ||
        typeof project !== "object"
      ) {
        return null;
      }

      const status =
        this.normalizeProjectStatus(
          project.projectStatus ??
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

      const tasks =
        this.normalizeTasks(project.tasks);

      const phases =
        this.normalizePhases(
          project.phases
        );

      const progress =
        tasks.length
          ? this.calculateTasksProgress(tasks)
          : this.normalizePercent(
              project.progress ??
              project.completion ??
              0
            );

      const schedule =
        this.normalizeSchedule(
          project.schedule,
          project
        );

      const budget =
        this.normalizeBudget(
          project.budget,
          project
        );

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
        phases[0]?.id ||
        "discovery";

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

        titleEn:
          project.titleEn ||
          project.englishTitle ||
          project.english ||
          project.nameEn ||
          project.codeName ||
          "",

        englishTitle:
          project.titleEn ||
          project.englishTitle ||
          project.english ||
          project.nameEn ||
          project.codeName ||
          "",

        description:
          project.description ||
          project.summary ||
          project.solution ||
          "",

        objective:
          project.objective ||
          "",

        department:
          project.department ||
          project.businessUnit ||
          project.portfolio ||
          "غير مصنف",

        category:
          project.category ||
          project.portfolio ||
          "general",

        owner:
          this.valueToDisplayText(
            project.owner ??
            project.projectOwner ??
            project.manager,
            "غير محدد"
          ),

        sponsor:
          this.valueToDisplayText(
            project.sponsor,
            "غير محدد"
          ),

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

        budget,
        schedule,

        progress,
        readiness:
          this.normalizePercent(
            project.readiness ??
            project.decisionScore ??
            progress
          ),

        decisionScore:
          this.normalizePercent(
            project.decisionScore ??
            project.readiness ??
            progress
          ),

        status,
        projectStatus: status,

        riskLevel:
          project.riskLevel ||
          project.risk ||
          "متوسط",

        currentPhase,

        sourceIdeaId,
        ideaId: sourceIdeaId,

        origin: {
          type:
            project.origin?.type ||
            (
              sourceIdeaId
                ? "idea-conversion"
                : "manual"
            ),

          ideaId:
            sourceIdeaId,

          ...(project.origin || {})
        },

        createdFromIdea:
          project.createdFromIdea === true ||
          project.origin ===
            "idea-conversion" ||
          Boolean(sourceIdeaId),

        benefits:
          this.toArray(
            project.benefits
          ),

        expectedOutcomes:
          this.toArray(
            project.expectedOutcomes
          ),

        milestones:
          this.toArray(
            project.milestones
          ),

        tasks,
        phases,

        kpis:
          this.toArray(
            project.kpis
          ),

        risks:
          this.toArray(
            project.risks
          ),

        dependencies:
          this.toArray(
            project.dependencies
          ),

        lifecycleHistory:
          this.toArray(
            project.lifecycleHistory ||
            project.history
          ),

        createdAt:
          project.createdAt ||
          null,

        updatedAt:
          project.updatedAt ||
          null,

        startedAt:
          project.startedAt ||
          schedule.actualStart ||
          null,

        completedAt:
          project.completedAt ||
          schedule.actualEnd ||
          null,

        archivedAt:
          project.archivedAt ||
          null,

        deletedAt:
          project.deletedAt ??
          null
      };
    },

    normalizeProjectStatus(value) {
      const raw =
        this.normalizeStatus(value);

      const map = {
        planning:
          this.status.PLANNING,
        planned:
          this.status.PLANNING,
        draft:
          this.status.PLANNING,
        study:
          this.status.PLANNING,
        approved:
          this.status.READY,
        ready:
          this.status.READY,
        active:
          this.status.IN_PROGRESS,
        "in-progress":
          this.status.IN_PROGRESS,
        inprogress:
          this.status.IN_PROGRESS,
        execution:
          this.status.IN_PROGRESS,
        pilot:
          this.status.PILOT,
        production:
          this.status.PRODUCTION,
        operational:
          this.status.PRODUCTION,
        "on-hold":
          this.status.ON_HOLD,
        paused:
          this.status.ON_HOLD,
        blocked:
          this.status.ON_HOLD,
        completed:
          this.status.COMPLETED,
        cancelled:
          this.status.CANCELLED,
        canceled:
          this.status.CANCELLED,
        archived:
          this.status.ARCHIVED,

        "قيد-التخطيط":
          this.status.PLANNING,
        "قيد-الدراسة":
          this.status.PLANNING,
        "قيد-التخطيط-الأولي":
          this.status.PLANNING,
        معتمد:
          this.status.READY,
        جاهز:
          this.status.READY,
        "قيد-التنفيذ":
          this.status.IN_PROGRESS,
        "قيد-العمل":
          this.status.IN_PROGRESS,
        تشغيل:
          this.status.PRODUCTION,
        "قيد-التشغيل":
          this.status.PRODUCTION,
        "تجربة-أولية":
          this.status.PILOT,
        تجريبي:
          this.status.PILOT,
        "متوقف-مؤقتاً":
          this.status.ON_HOLD,
        "متوقف-موقتا":
          this.status.ON_HOLD,
        متعثر:
          this.status.ON_HOLD,
        محظور:
          this.status.ON_HOLD,
        مكتمل:
          this.status.COMPLETED,
        منجز:
          this.status.COMPLETED,
        ملغي:
          this.status.CANCELLED,
        مؤرشف:
          this.status.ARCHIVED
      };

      return (
        map[raw] ||
        this.status.PLANNING
      );
    },

    normalizeTasks(tasks) {
      return this.toArray(tasks).map(
        (task, index) => ({
          id:
            task?.id ||
            `task-${index + 1}`,

          title:
            task?.title ||
            task?.name ||
            `مهمة ${index + 1}`,

          description:
            task?.description ||
            "",

          status:
            this.normalizeTaskStatus(
              task?.status
            ),

          priority:
            task?.priority ||
            "medium",

          owner:
            this.valueToDisplayText(
              task?.owner,
              "غير محدد"
            ),

          weight:
            Math.max(
              1,
              this.toSafeNumber(
                task?.weight,
                1
              )
            ),

          progress:
            this.normalizePercent(
              task?.progress ??
              (
                this.normalizeTaskStatus(
                  task?.status
                ) === "completed"
                  ? 100
                  : 0
              )
            ),

          dueDate:
            task?.dueDate ||
            null,

          completedAt:
            task?.completedAt ||
            null
        })
      );
    },

    normalizeTaskStatus(value) {
      const raw =
        this.normalizeStatus(value);

      if (
        [
          "completed",
          "done",
          "مكتمل",
          "منجز"
        ].includes(raw)
      ) {
        return "completed";
      }

      if (
        [
          "in-progress",
          "active",
          "قيد-التنفيذ",
          "قيد-العمل"
        ].includes(raw)
      ) {
        return "in-progress";
      }

      if (
        [
          "blocked",
          "on-hold",
          "متعثر",
          "متوقف"
        ].includes(raw)
      ) {
        return "blocked";
      }

      return "pending";
    },

    normalizePhases(phases) {
      const defaults =
        Array.isArray(
          window.AIW?.LIFECYCLE
            ?.PROJECT_PHASES
        )
          ? window.AIW.LIFECYCLE
              .PROJECT_PHASES
          : [
              {
                id: "discovery",
                title: "التحليل",
                order: 1
              },
              {
                id: "planning",
                title: "التخطيط",
                order: 2
              },
              {
                id: "design",
                title: "التصميم",
                order: 3
              },
              {
                id: "development",
                title: "التطوير",
                order: 4
              },
              {
                id: "testing",
                title: "الاختبار",
                order: 5
              },
              {
                id: "pilot",
                title: "التجربة الأولية",
                order: 6
              },
              {
                id: "production",
                title: "التشغيل",
                order: 7
              },
              {
                id: "measurement",
                title: "قياس النتائج",
                order: 8
              }
            ];

      const source =
        this.toArray(phases).length
          ? this.toArray(phases)
          : defaults;

      return source.map(
        (phase, index) => ({
          id:
            phase?.id ||
            defaults[index]?.id ||
            `phase-${index + 1}`,

          title:
            phase?.title ||
            defaults[index]?.title ||
            `مرحلة ${index + 1}`,

          titleEn:
            phase?.titleEn ||
            defaults[index]?.titleEn ||
            "",

          order:
            this.toSafeNumber(
              phase?.order,
              index + 1
            ),

          status:
            phase?.status ||
            (
              index === 0
                ? "current"
                : "pending"
            ),

          progress:
            this.normalizePercent(
              phase?.progress,
              phase?.status ===
                "completed"
                ? 100
                : 0
            ),

          startedAt:
            phase?.startedAt ||
            null,

          completedAt:
            phase?.completedAt ||
            null
        })
      );
    },

    normalizeBudget(value, project = {}) {
      const budget =
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
          ? value
          : {};

      return {
        estimated:
          budget.estimated ??
          project.estimatedBudget ??
          null,

        approved:
          budget.approved ??
          project.approvedBudget ??
          null,

        spent:
          Math.max(
            0,
            this.toSafeNumber(
              budget.spent ??
              project.spentBudget,
              0
            )
          ),

        currency:
          budget.currency ||
          project.currency ||
          "AED"
      };
    },

    normalizeSchedule(value, project = {}) {
      const schedule =
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
          ? value
          : {};

      return {
        plannedStart:
          schedule.plannedStart ||
          project.startDate ||
          null,

        plannedEnd:
          schedule.plannedEnd ||
          project.targetDate ||
          project.endDate ||
          project.dueDate ||
          null,

        actualStart:
          schedule.actualStart ||
          project.startedAt ||
          null,

        actualEnd:
          schedule.actualEnd ||
          project.completedAt ||
          null
      };
    },

    calculateTasksProgress(tasks = []) {
      if (!tasks.length) {
        return 0;
      }

      let totalWeight = 0;
      let weightedProgress = 0;

      tasks.forEach(task => {
        const weight =
          Math.max(
            1,
            this.toSafeNumber(
              task.weight,
              1
            )
          );

        totalWeight += weight;
        weightedProgress +=
          this.normalizePercent(
            task.progress
          ) * weight;
      });

      return totalWeight
        ? Math.round(
            weightedProgress /
            totalWeight
          )
        : 0;
    },

    /* =======================================================
       Store Actions
    ======================================================= */

    createManualProject(project = {}) {
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
          typeof store.createManualProject ===
            "function"
        ) {
          const result =
            store.createManualProject(
              project
            );

          return this.normalizeActionResult(
            result
          );
        }

        if (
          typeof store.add ===
            "function"
        ) {
          const result =
            store.add(
              "projects",
              project
            );

          return this.normalizeActionResult(
            result
          );
        }
      } catch (error) {
        console.error(
          "AI Work Projects V5.1: Project creation failed.",
          error
        );

        return {
          success: false,
          message:
            "تعذر إنشاء المشروع.",
          error
        };
      }

      return {
        success: false,
        message:
          "إنشاء المشروع غير مدعوم في Store."
      };
    },

    updateProject(projectId, changes = {}) {
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
          typeof store.updateProject ===
            "function"
        ) {
          const result =
            store.updateProject(
              projectId,
              changes
            );

          return this.normalizeActionResult(
            result
          );
        }

        if (
          typeof store.update ===
            "function"
        ) {
          const result =
            store.update(
              "projects",
              projectId,
              changes
            );

          return this.normalizeActionResult(
            result
          );
        }
      } catch (error) {
        console.error(
          "AI Work Projects V5.1: Project update failed.",
          error
        );

        return {
          success: false,
          message:
            "تعذر تحديث المشروع.",
          error
        };
      }

      return {
        success: false,
        message:
          "تحديث المشروع غير مدعوم في Store."
      };
    },

    removeProject(projectId) {
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
          typeof store.remove ===
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
        console.error(
          "AI Work Projects V5.1: Project removal failed.",
          error
        );

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

    setProjectStatus(
      projectId,
      status,
      options = {}
    ) {
      const store = this.getStore();

      if (
        typeof store
          ?.setProjectStatus !==
        "function"
      ) {
        return this.updateProject(
          projectId,
          {
            status,
            projectStatus: status
          }
        );
      }

      try {
        return this.normalizeActionResult(
          store.setProjectStatus(
            projectId,
            status,
            options
          )
        );
      } catch (error) {
        return {
          success: false,
          message:
            "تعذر تغيير حالة المشروع.",
          error
        };
      }
    },

    normalizeActionResult(result) {
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
        success:
          Boolean(result),
        result
      };
    },

    /* =======================================================
       Status Helpers
    ======================================================= */

    getProjectStatusLabel(project = {}) {
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
        labels[project.status] ||
        "قيد التخطيط"
      );
    },

    getProjectStatusClass(project = {}) {
      const value = project.status;

      if (
        value ===
        this.status.IN_PROGRESS
      ) {
        return "active";
      }

      if (
        value ===
        this.status.PRODUCTION
      ) {
        return "production";
      }

      if (
        value ===
        this.status.PILOT
      ) {
        return "pilot";
      }

      if (
        value ===
        this.status.READY
      ) {
        return "approved";
      }

      if (
        value ===
        this.status.COMPLETED
      ) {
        return "completed";
      }

      if (
        value ===
        this.status.ON_HOLD
      ) {
        return "blocked";
      }

      if (
        value ===
        this.status.CANCELLED
      ) {
        return "cancelled";
      }

      if (
        value ===
        this.status.ARCHIVED
      ) {
        return "archived";
      }

      return "planned";
    },

    getProjectStatusIcon(project = {}) {
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

      return (
        icons[project.status] ||
        "📁"
      );
    },

    getProjectIcon(project = {}) {
      const department =
        this.normalizeStatus(
          project.department ??
          project.portfolio ??
          ""
        );

      if (
        department.includes("بيومتر")
      ) {
        return "👁️";
      }

      if (
        department.includes("بوابات")
      ) {
        return "🛂";
      }

      if (
        department.includes("صلاحيات")
      ) {
        return "🔐";
      }

      if (
        department.includes("أمن")
      ) {
        return "🛡️";
      }

      if (
        department.includes("تحليل")
      ) {
        return "📊";
      }

      return "📁";
    },

    /* =======================================================
       Classification & Metrics
    ======================================================= */

    isQuickWin(project = {}) {
      if (
        project.quickWin === true ||
        project.isQuickWin === true
      ) {
        return true;
      }

      const duration =
        this.normalizeStatus(
          project.duration
        );

      const cost =
        this.normalizeStatus(
          project.cost
        );

      const shortDuration =
        duration.includes("2-3") ||
        duration.includes("3-4") ||
        duration.includes("3-5") ||
        duration.includes("قصير");

      const lowCost =
        [
          "منخفضة",
          "منخفض",
          "low"
        ].includes(cost);

      return (
        shortDuration &&
        lowCost
      );
    },

    isHighPriority(project = {}) {
      return [
        "عالية",
        "عالي",
        "high",
        "critical",
        "استراتيجي",
        "استراتيجية"
      ].includes(
        this.normalizeStatus(
          project.priority
        )
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
        this.normalizeStatus(
          project.riskLevel
        )
      );
    },

    isActive(project = {}) {
      return [
        this.status.IN_PROGRESS,
        this.status.PILOT,
        this.status.PRODUCTION
      ].includes(project.status);
    },

    isCompleted(project = {}) {
      return (
        project.status ===
        this.status.COMPLETED
      );
    },

    isBlocked(project = {}) {
      return (
        project.status ===
        this.status.ON_HOLD
      );
    },

    isOnTrack(project = {}) {
      return (
        !this.isHighRisk(project) &&
        !this.isBlocked(project) &&
        ![
          this.status.CANCELLED,
          this.status.ARCHIVED
        ].includes(project.status)
      );
    },

    groupByDepartment(projects = []) {
      return projects.reduce(
        (groups, project) => {
          const department =
            project.department ||
            "غير مصنف";

          if (!groups[department]) {
            groups[department] = [];
          }

          groups[department].push(
            project
          );

          return groups;
        },
        {}
      );
    },

    getPortfolioMetrics(projects = []) {
      const total =
        projects.length;

      const active =
        projects.filter(
          project =>
            this.isActive(project)
        ).length;

      const ready =
        projects.filter(
          project =>
            project.status ===
            this.status.READY
        ).length;

      const pilot =
        projects.filter(
          project =>
            project.status ===
            this.status.PILOT
        ).length;

      const production =
        projects.filter(
          project =>
            project.status ===
            this.status.PRODUCTION
        ).length;

      const completed =
        projects.filter(
          project =>
            this.isCompleted(project)
        ).length;

      const blocked =
        projects.filter(
          project =>
            this.isBlocked(project)
        ).length;

      const highRisk =
        projects.filter(
          project =>
            this.isHighRisk(project)
        ).length;

      const quickWins =
        projects.filter(
          project =>
            this.isQuickWin(project)
        ).length;

      const linkedToIdeas =
        projects.filter(
          project =>
            Boolean(
              project.sourceIdeaId
            )
        ).length;

      const onTrack =
        projects.filter(
          project =>
            this.isOnTrack(project)
        ).length;

      const averageProgress =
        total
          ? Math.round(
              projects.reduce(
                (sum, project) =>
                  sum +
                  this.normalizePercent(
                    project.progress
                  ),
                0
              ) / total
            )
          : 0;

      const averageReadiness =
        total
          ? Math.round(
              projects.reduce(
                (sum, project) =>
                  sum +
                  this.normalizePercent(
                    project.readiness
                  ),
                0
              ) / total
            )
          : 0;

      return {
        total,
        active,
        ready,
        pilot,
        production,
        completed,
        blocked,
        highRisk,
        quickWins,
        linkedToIdeas,
        onTrack,

        averageProgress,
        averageReadiness,

        completionRate:
          total
            ? this.normalizePercent(
                (
                  completed /
                  total
                ) * 100
              )
            : 0,

        onTrackRate:
          total
            ? this.normalizePercent(
                (
                  onTrack /
                  total
                ) * 100
              )
            : 0
      };
    },

    getSystemHealth(fallback = 0) {
      const state =
        this.getState();

      return this.normalizePercent(
        state.dashboard
          ?.platformHealth ??
        state.dashboard
          ?.portfolioHealth ??
        state.summary
          ?.systemHealth ??
        state.summary
          ?.portfolioHealth ??
        state.health
          ?.overall ??
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
          sessionStorage.getItem(
            this.config
              .selectedProjectKey
          ) ||
          localStorage.getItem(
            this.config
              .selectedProjectKey
          ) ||
          null
        );
      } catch (error) {
        return null;
      }
    },

    saveSelectedProject(projectId) {
      if (!this.hasValue(projectId)) {
        return;
      }

      try {
        const value =
          String(projectId);

        sessionStorage.setItem(
          this.config
            .selectedProjectKey,
          value
        );

        localStorage.setItem(
          this.config
            .selectedProjectKey,
          value
        );
      } catch (error) {
        console.warn(
          "AI Work Projects V5.1: Unable to save selected project.",
          error
        );
      }
    },

    saveSelectedIdea(ideaId) {
      if (!this.hasValue(ideaId)) {
        return;
      }

      try {
        const value =
          String(ideaId);

        sessionStorage.setItem(
          this.config
            .selectedIdeaKey,
          value
        );

        localStorage.setItem(
          this.config
            .selectedIdeaKey,
          value
        );
      } catch (error) {
        console.warn(
          "AI Work Projects V5.1: Unable to save selected idea.",
          error
        );
      }
    },

    highlightSelectedProject() {
      if (!this._container) {
        return;
      }

      const selectedProjectId =
        this.getSelectedProjectId();

      this._container
        .querySelectorAll(
          ".project-card[data-project-id]"
        )
        .forEach(card => {
          card.classList.toggle(
            "selected",
            Boolean(
              selectedProjectId
            ) &&
            String(
              card.dataset
                .projectId
            ) ===
              String(
                selectedProjectId
              )
          );
        });

      if (!selectedProjectId) {
        return;
      }

      const selectedCard =
        this._container.querySelector(
          `.project-card[data-project-id="${this.escapeSelector(
            selectedProjectId
          )}"]`
        );

      if (selectedCard) {
        window.setTimeout(
          () => {
            selectedCard.scrollIntoView({
              behavior: "smooth",
              block: "center"
            });
          },
          120
        );
      }
    },

    autoOpenSelectedProject() {
      const selectedProjectId =
        this.getSelectedProjectId();

      if (
        !selectedProjectId ||
        this._autoOpenedProjectId ===
          String(selectedProjectId)
      ) {
        return;
      }

      const project =
        this.getProjectById(
          selectedProjectId
        );

      if (!project) {
        return;
      }

      this._autoOpenedProjectId =
        String(selectedProjectId);

      window.setTimeout(
        () => {
          if (
            this._container
              ?.isConnected
          ) {
            this.openProjectDetails(
              selectedProjectId
            );
          }
        },
        180
      );
    },

    /* =======================================================
       Render Helpers
    ======================================================= */

    renderProjectCard(project) {
      const sourceIdea =
        this.getSourceIdea(project);

      const progress =
        this.normalizePercent(
          project.progress
        );

      const readiness =
        this.normalizePercent(
          project.readiness
        );

      const selectedProjectId =
        this.getSelectedProjectId();

      const selected =
        selectedProjectId &&
        String(selectedProjectId) ===
          String(project.id);

      const currentPhase =
        project.phases.find(
          phase =>
            String(phase.id) ===
            String(
              project.currentPhase
            )
        );

      return `
        <article
          class="project-card ${
            selected
              ? "selected"
              : ""
          }"
          data-project-id="${this.escapeAttribute(
            project.id
          )}"
        >
          <div class="project-card-head">
            <div class="project-title-block">
              <div class="project-icon">
                ${this.escapeHtml(
                  project.icon ||
                  "📁"
                )}
              </div>

              <div>
                <span class="project-department">
                  ${this.escapeHtml(
                    project.department
                  )}
                </span>

                <h3>
                  ${this.escapeHtml(
                    project.title
                  )}
                </h3>

                ${
                  project.titleEn
                    ? `
                      <strong>
                        ${this.escapeHtml(
                          project.titleEn
                        )}
                      </strong>
                    `
                    : ""
                }
              </div>
            </div>

            <div class="project-badges">
              ${
                this.isQuickWin(
                  project
                )
                  ? `
                    <span class="project-quickwin">
                      Quick Win
                    </span>
                  `
                  : ""
              }

              <span class="project-priority ${this.badgeClass(
                project.priority
              )}">
                ${this.escapeHtml(
                  project.priority
                )}
              </span>

              <span class="project-status-badge ${this.getProjectStatusClass(
                project
              )}">
                ${this.getProjectStatusIcon(
                  project
                )}
                ${this.escapeHtml(
                  this.getProjectStatusLabel(
                    project
                  )
                )}
              </span>
            </div>
          </div>

          <div class="project-meta">
            <span>
              👤
              ${this.escapeHtml(
                project.owner
              )}
            </span>

            <span>
              ⏱️
              ${this.escapeHtml(
                project.duration
              )}
            </span>

            <span>
              💰
              ${this.escapeHtml(
                this.getBudgetLabel(
                  project
                )
              )}
            </span>

            <span>
              🛡️
              ${this.escapeHtml(
                project.riskLevel
              )}
            </span>

            <span>
              🧭
              ${this.escapeHtml(
                currentPhase
                  ?.title ||
                "التحليل"
              )}
            </span>
          </div>

          ${
            project.description
              ? `
                <div class="project-description">
                  ${this.escapeHtml(
                    project.description
                  )}
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
                  ${progress}%
                </b>
              </div>

              <div class="aiw-progress">
                <div
                  style="width:${progress}%"
                ></div>
              </div>
            </div>

            <div class="project-progress-block">
              <div>
                <small>
                  جاهزية التنفيذ
                </small>

                <b>
                  ${readiness}%
                </b>
              </div>

              <div class="aiw-progress readiness">
                <div
                  style="width:${readiness}%"
                ></div>
              </div>
            </div>
          </div>

          <div class="project-mini-stats">
            <span>
              ✅
              ${project.tasks.filter(
                task =>
                  task.status ===
                  "completed"
              ).length}
              /
              ${project.tasks.length}
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
                      ${this.escapeHtml(
                        sourceIdea.title ||
                        "فكرة مرتبطة"
                      )}
                    </strong>
                  </div>

                  <button
                    type="button"
                    class="project-inline-action"
                    data-project-action="open-idea"
                    data-project-id="${this.escapeAttribute(
                      project.id
                    )}"
                    data-idea-id="${this.escapeAttribute(
                      sourceIdea.id
                    )}"
                  >
                    فتح الفكرة
                  </button>
                </div>
              `
              : `
                <div class="project-origin-box manual">
                  <div>
                    <span>
                      📁 مصدر المشروع
                    </span>

                    <strong>
                      مشروع مسجل مباشرة
                    </strong>
                  </div>
                </div>
              `
          }

          <div class="project-actions">
            <button
              type="button"
              class="project-action-button primary"
              data-project-action="details"
              data-project-id="${this.escapeAttribute(
                project.id
              )}"
            >
              عرض التفاصيل
            </button>

            <button
              type="button"
              class="project-action-button secondary"
              data-project-action="select"
              data-project-id="${this.escapeAttribute(
                project.id
              )}"
            >
              تحديد المشروع
            </button>
          </div>
        </article>
      `;
    },

    renderDepartmentPortfolio(
      projects = []
    ) {
      const entries =
        Object.entries(
          this.groupByDepartment(
            projects
          )
        );

      if (!entries.length) {
        return `
          <div class="module-empty">
            لا توجد محافظ مشاريع حالياً.
          </div>
        `;
      }

      return `
        <div class="project-portfolio-grid">
          ${entries
            .map(
              ([
                department,
                items
              ]) => {
                const metrics =
                  this.getPortfolioMetrics(
                    items
                  );

                return `
                  <div class="project-portfolio-chip">
                    <strong>
                      ${this.escapeHtml(
                        department
                      )}
                    </strong>

                    <span>
                      ${items.length}
                      مشاريع
                      ·
                      ${metrics.averageProgress}%
                      تقدم
                      ·
                      ${metrics.highRisk}
                      مخاطر عالية
                    </span>
                  </div>
                `;
              }
            )
            .join("")}
        </div>
      `;
    },

    renderExecutionPriority(
      projects = []
    ) {
      const ranked =
        [...projects]
          .sort((a, b) =>
            this.getPriorityScore(b) -
            this.getPriorityScore(a)
          )
          .slice(0, 3);

      if (!ranked.length) {
        return `
          <div class="module-empty">
            لا توجد مشاريع لترتيب الأولوية.
          </div>
        `;
      }

      return `
        <div class="execution-order">
          ${ranked
            .map(
              (project, index) => `
                <div>
                  <b>
                    ${index + 1}
                  </b>

                  <span>
                    <strong>
                      ${this.escapeHtml(
                        project.title
                      )}
                    </strong>

                    <small>
                      ${this.escapeHtml(
                        project.department
                      )}
                      ·
                      جاهزية
                      ${project.readiness}%
                    </small>
                  </span>
                </div>
              `
            )
            .join("")}
        </div>
      `;
    },

    getPriorityScore(project) {
      return (
        (
          this.isHighPriority(
            project
          )
            ? 30
            : 0
        ) +
        (
          this.isQuickWin(
            project
          )
            ? 25
            : 0
        ) +
        (
          !this.isHighRisk(
            project
          )
            ? 15
            : 0
        ) +
        this.normalizePercent(
          project.readiness
        )
      );
    },

    /* =======================================================
       Main Render
    ======================================================= */

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

        const systemHealth =
          this.getSystemHealth(
            metrics.onTrackRate
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
                إدارة المشاريع التنفيذية الفعلية وربط كل مشروع
                بالفكرة الأصلية والمراحل والمهام ومؤشرات التقدم
                والمخاطر والجاهزية.
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
                  🧪
                  ${metrics.pilot}
                  تجريبي
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
                  🔗
                  ${metrics.linkedToIdeas}
                  مرتبطة بأفكار
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
                "جاهزة للتنفيذ",
                metrics.ready,
                "Ready"
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
                "صحة الأنظمة",
                `${systemHealth}%`,
                "System Health"
              )}
            </div>

            <div class="module-wide-grid">
              <div class="module-panel">
                <div class="module-section-title compact">
                  <h2>
                    الملخص التنفيذي
                  </h2>

                  <p>
                    قراءة مباشرة لحالة محفظة المشاريع من البيانات الفعلية.
                  </p>
                </div>

                <div class="portfolio-summary-box">
                  <strong>
                    ${this.escapeHtml(
                      this.getExecutiveHeadline(
                        metrics
                      )
                    )}
                  </strong>

                  <p>
                    ${this.escapeHtml(
                      this.getExecutiveSummary(
                        metrics
                      )
                    )}
                  </p>
                </div>
              </div>

              <div class="module-panel">
                <div class="module-section-title compact">
                  <h2>
                    أولوية التنفيذ
                  </h2>

                  <p>
                    ترتيب ديناميكي حسب الأولوية والجاهزية والمخاطر.
                  </p>
                </div>

                ${this.renderExecutionPriority(
                  projects
                )}
              </div>
            </div>

            <div class="module-panel">
              <div class="module-section-title compact">
                <h2>
                  خريطة محافظ المشاريع
                </h2>

                <p>
                  توزيع المشاريع حسب النطاق التشغيلي والتقدم والمخاطر.
                </p>
              </div>

              ${this.renderDepartmentPortfolio(
                projects
              )}
            </div>

            <div class="module-panel">
              <div class="module-section-title compact">
                <h2>
                  قائمة المشاريع التنفيذية
                </h2>

                <p>
                  ${metrics.total}
                  مشروع مسجل في Store V2.2.
                  لا توجد مشاريع افتراضية داخل هذه الوحدة.
                </p>
              </div>

              ${
                projects.length
                  ? `
                    <div class="projects-grid">
                      ${projects
                        .map(project =>
                          this.renderProjectCard(
                            project
                          )
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
                        تبدأ المحفظة بصفر مشروع.
                        بعد اعتماد أي فكرة وتحويلها، سيظهر المشروع هنا تلقائياً.
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

        this.bindActionEvents();
        this.bindAutomaticSync();
        this.highlightSelectedProject();
        this.autoOpenSelectedProject();
      } finally {
        this._isRendering = false;
      }
    },

    getExecutiveHeadline(metrics) {
      if (!metrics.total) {
        return "المحفظة جاهزة لاستقبال أول مشروع تنفيذي";
      }

      if (
        metrics.highRisk >
          metrics.active &&
        metrics.highRisk > 0
      ) {
        return "الأولوية الحالية هي خفض مخاطر المشاريع قبل التوسع";
      }

      if (
        metrics.production > 0
      ) {
        return "المحفظة انتقلت إلى التشغيل الفعلي لبعض المشاريع";
      }

      if (
        metrics.active > 0 &&
        metrics.averageProgress >= 60
      ) {
        return "المحفظة تتحرك بمستوى تقدم تنفيذي جيد";
      }

      if (
        metrics.quickWins > 0
      ) {
        return "أفضل بداية هي تسريع مشاريع Quick Wins الأعلى جاهزية";
      }

      return "المحفظة تحتاج ترتيب التنفيذ حسب الجاهزية والأثر";
    },

    getExecutiveSummary(metrics) {
      if (!metrics.total) {
        return (
          "لا توجد مشاريع محفوظة حالياً. بعد اعتماد أي فكرة " +
          "في مركز الأفكار سيتم إنشاء المشروع وربطه تلقائياً بالمصدر الأصلي."
        );
      }

      return (
        `تضم المحفظة ${metrics.total} مشروعاً، منها ` +
        `${metrics.active} نشطة و${metrics.completed} مكتملة. ` +
        `متوسط التقدم ${metrics.averageProgress}%، ونسبة المشاريع ` +
        `على المسار ${metrics.onTrackRate}%. توجد ${metrics.highRisk} ` +
        `مشاريع بمخاطر عالية و${metrics.linkedToIdeas} مشاريع مرتبطة بأفكار.`
      );
    },

    /* =======================================================
       Events
    ======================================================= */

    bindActionEvents() {
      if (!this._container) {
        return;
      }

      if (
        this._eventsContainer ===
        this._container &&
        this._boundClickHandler
      ) {
        return;
      }

      if (
        this._eventsContainer &&
        this._boundClickHandler
      ) {
        this._eventsContainer
          .removeEventListener(
            "click",
            this._boundClickHandler
          );
      }

      this._boundClickHandler =
        event => {
          const button =
            event.target.closest(
              "[data-project-action]"
            );

          if (
            !button ||
            !this._container
              ?.contains(button)
          ) {
            return;
          }

          const action =
            button.dataset
              .projectAction;

          const projectId =
            button.dataset
              .projectId;

          const ideaId =
            button.dataset
              .ideaId;

          event.preventDefault();

          if (
            action ===
              "details" &&
            projectId
          ) {
            this.openProjectDetails(
              projectId
            );
            return;
          }

          if (
            action ===
              "select" &&
            projectId
          ) {
            this.selectProject(
              projectId
            );
            return;
          }

          if (
            action ===
              "open-idea" &&
            ideaId
          ) {
            this.openSourceIdea(
              ideaId,
              projectId
            );
            return;
          }

          if (
            action ===
            "open-ideas"
          ) {
            this.navigateTo(
              "ideas"
            );
          }
        };

      this._eventsContainer =
        this._container;

      this._eventsContainer
        .addEventListener(
          "click",
          this._boundClickHandler
        );
    },

    selectProject(projectId) {
      const project =
        this.getProjectById(
          projectId
        );

      if (!project) {
        this.showToast(
          "لم يتم العثور على المشروع.",
          "error"
        );
        return;
      }

      this.saveSelectedProject(
        projectId
      );

      this.highlightSelectedProject();

      window.dispatchEvent(
        new CustomEvent(
          "aiw:projectSelected",
          {
            detail: {
              projectId:
                project.id,

              sourceIdeaId:
                project.sourceIdeaId ||
                null
            }
          }
        )
      );

      this.showToast(
        "تم تحديد المشروع بنجاح.",
        "success"
      );
    },

    openSourceIdea(
      ideaId,
      projectId = null
    ) {
      const idea =
        this.getIdeaById(ideaId);

      if (!idea) {
        this.showToast(
          "تعذر العثور على الفكرة الأصلية.",
          "error"
        );
        return;
      }

      this.saveSelectedIdea(
        ideaId
      );

      if (projectId) {
        this.saveSelectedProject(
          projectId
        );
      }

      window.dispatchEvent(
        new CustomEvent(
          "aiw:openIdea",
          {
            detail: {
              ideaId,
              projectId
            }
          }
        )
      );

      this.navigateTo("ideas");
    },

    navigateTo(route) {
      if (
        typeof window.AIW
          ?.App?.go ===
        "function"
      ) {
        window.AIW.App.go(
          route
        );
        return;
      }

      if (
        typeof window.AIW
          ?.Router?.go ===
        "function"
      ) {
        window.AIW.Router.go(
          route
        );
        return;
      }

      window.location.hash =
        `#${route}`;
    },

    /* =======================================================
       Details Modal
    ======================================================= */

    openProjectDetails(projectId) {
      const project =
        this.getProjectById(
          projectId
        );

      if (!project) {
        this.showToast(
          "لم يتم العثور على المشروع.",
          "error"
        );
        return;
      }

      this.closeProjectDetails();
      this.saveSelectedProject(
        projectId
      );

      const sourceIdea =
        this.getSourceIdea(project);

      const currentPhase =
        project.phases.find(
          phase =>
            String(phase.id) ===
            String(
              project.currentPhase
            )
        );

      const modal =
        document.createElement(
          "div"
        );

      modal.className =
        "project-details-overlay";

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
              ${this.escapeHtml(
                project.icon
              )}
            </div>

            <div>
              <span>
                ${this.escapeHtml(
                  project.department
                )}
              </span>

              <h3 id="project-details-title">
                ${this.escapeHtml(
                  project.title
                )}
              </h3>

              ${
                project.titleEn
                  ? `
                    <small>
                      ${this.escapeHtml(
                        project.titleEn
                      )}
                    </small>
                  `
                  : ""
              }
            </div>
          </div>

          <div class="project-details-status">
            <span class="project-status-badge ${this.getProjectStatusClass(
              project
            )}">
              ${this.getProjectStatusIcon(
                project
              )}
              ${this.escapeHtml(
                this.getProjectStatusLabel(
                  project
                )
              )}
            </span>

            <span class="project-priority ${this.badgeClass(
              project.priority
            )}">
              ${this.escapeHtml(
                project.priority
              )}
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
                المرحلة
              </small>

              <strong>
                ${this.escapeHtml(
                  currentPhase
                    ?.title ||
                  "التحليل"
                )}
              </strong>
            </div>

            <div>
              <small>
                المالك
              </small>

              <strong>
                ${this.escapeHtml(
                  project.owner
                )}
              </strong>
            </div>
          </div>

          ${
            project.description
              ? `
                <div class="project-details-section">
                  <strong>
                    وصف المشروع
                  </strong>

                  <p>
                    ${this.escapeHtml(
                      project.description
                    )}
                  </p>
                </div>
              `
              : ""
          }

          <div class="project-details-section">
            <strong>
              معلومات التنفيذ
            </strong>

            <div class="project-details-list">
              <span>
                المدة:
                ${this.escapeHtml(
                  project.duration
                )}
              </span>

              <span>
                المخاطر:
                ${this.escapeHtml(
                  project.riskLevel
                )}
              </span>

              <span>
                البداية المخططة:
                ${this.escapeHtml(
                  this.formatDate(
                    project.schedule
                      .plannedStart,
                    "غير محدد"
                  )
                )}
              </span>

              <span>
                النهاية المخططة:
                ${this.escapeHtml(
                  this.formatDate(
                    project.schedule
                      .plannedEnd,
                    "غير محدد"
                  )
                )}
              </span>

              <span>
                الميزانية التقديرية:
                ${this.escapeHtml(
                  this.formatMoney(
                    project.budget
                      .estimated,
                    project.budget
                      .currency
                  )
                )}
              </span>

              <span>
                المصروف:
                ${this.escapeHtml(
                  this.formatMoney(
                    project.budget
                      .spent,
                    project.budget
                      .currency
                  )
                )}
              </span>
            </div>
          </div>

          ${
            sourceIdea
              ? `
                <div class="project-details-section source">
                  <strong>
                    الفكرة الأصلية
                  </strong>

                  <p>
                    ${this.escapeHtml(
                      sourceIdea.title ||
                      "فكرة مرتبطة"
                    )}
                  </p>

                  <button
                    type="button"
                    class="project-action-button secondary"
                    data-modal-open-idea
                    data-idea-id="${this.escapeAttribute(
                      sourceIdea.id
                    )}"
                    data-project-id="${this.escapeAttribute(
                      project.id
                    )}"
                  >
                    فتح الفكرة الأصلية
                  </button>
                </div>
              `
              : ""
          }

          ${this.renderTasks(
            project.tasks
          )}

          ${this.renderPhases(
            project.phases,
            project.currentPhase
          )}

          ${this.renderMilestones(
            project.milestones
          )}

          ${this.renderKpis(
            project.kpis
          )}

          ${this.renderRisks(
            project.risks
          )}
        </div>
      `;

      document.body
        .appendChild(modal);

      this._detailsModal =
        modal;

      modal.addEventListener(
        "click",
        event => {
          if (
            event.target ===
              modal ||
            event.target.closest(
              "[data-project-details-close]"
            )
          ) {
            this.closeProjectDetails();
            return;
          }

          const ideaButton =
            event.target.closest(
              "[data-modal-open-idea]"
            );

          if (ideaButton) {
            const ideaId =
              ideaButton.dataset
                .ideaId;

            const linkedProjectId =
              ideaButton.dataset
                .projectId;

            this.closeProjectDetails();

            this.openSourceIdea(
              ideaId,
              linkedProjectId
            );
          }
        }
      );

      modal.addEventListener(
        "keydown",
        event => {
          if (
            event.key ===
            "Escape"
          ) {
            this.closeProjectDetails();
          }
        }
      );

      requestAnimationFrame(
        () => {
          modal.classList.add(
            "visible"
          );
        }
      );
    },

    renderTasks(tasks = []) {
      if (!tasks.length) {
        return "";
      }

      return `
        <div class="project-details-section">
          <strong>
            المهام
          </strong>

          <div class="project-task-list">
            ${tasks
              .map(task => `
                <div>
                  <span>
                    ${this.escapeHtml(
                      task.title
                    )}
                  </span>

                  <strong>
                    ${task.progress}%
                  </strong>
                </div>
              `)
              .join("")}
          </div>
        </div>
      `;
    },

    renderPhases(
      phases = [],
      currentPhase = null
    ) {
      if (!phases.length) {
        return "";
      }

      return `
        <div class="project-details-section">
          <strong>
            مراحل المشروع
          </strong>

          <div class="project-phase-list">
            ${phases
              .map(phase => `
                <div class="${
                  String(phase.id) ===
                  String(currentPhase)
                    ? "current"
                    : ""
                }">
                  <b>
                    ${phase.order}
                  </b>

                  <span>
                    ${this.escapeHtml(
                      phase.title
                    )}
                  </span>

                  <small>
                    ${phase.progress}%
                  </small>
                </div>
              `)
              .join("")}
          </div>
        </div>
      `;
    },

    renderMilestones(items = []) {
      if (!items.length) {
        return "";
      }

      return `
        <div class="project-details-section">
          <strong>
            المعالم الرئيسية
          </strong>

          <div class="project-milestones-list">
            ${items
              .map(
                (item, index) => `
                  <div>
                    <b>
                      ${index + 1}
                    </b>

                    <span>
                      ${this.escapeHtml(
                        this.valueToDisplayText(
                          item,
                          `معلم ${index + 1}`
                        )
                      )}
                    </span>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
      `;
    },

    renderKpis(items = []) {
      if (!items.length) {
        return "";
      }

      return `
        <div class="project-details-section">
          <strong>
            مؤشرات المشروع
          </strong>

          <div class="project-kpis-list">
            ${items
              .map(item => `
                <div>
                  <span>
                    ${this.escapeHtml(
                      this.valueToDisplayText(
                        item,
                        "مؤشر"
                      )
                    )}
                  </span>

                  <strong>
                    ${this.escapeHtml(
                      item &&
                      typeof item ===
                        "object"
                        ? item.value ??
                          item.target ??
                          "غير محدد"
                        : "غير محدد"
                    )}
                  </strong>
                </div>
              `)
              .join("")}
          </div>
        </div>
      `;
    },

    renderRisks(items = []) {
      if (!items.length) {
        return "";
      }

      return `
        <div class="project-details-section">
          <strong>
            مخاطر المشروع
          </strong>

          <div class="project-risk-list">
            ${items
              .map(item => `
                <div>
                  <span>
                    ${this.escapeHtml(
                      this.valueToDisplayText(
                        item,
                        "خطر"
                      )
                    )}
                  </span>

                  <strong>
                    ${this.escapeHtml(
                      item &&
                      typeof item ===
                        "object"
                        ? item.level ??
                          item.status ??
                          "قيد المتابعة"
                        : "قيد المتابعة"
                    )}
                  </strong>
                </div>
              `)
              .join("")}
          </div>
        </div>
      `;
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
        () => {
          modal.remove();
        },
        180
      );

      this._detailsModal = null;
    },

    /* =======================================================
       Sync
    ======================================================= */

    scheduleRefresh() {
      window.clearTimeout(
        this._refreshTimer
      );

      this._refreshTimer =
        window.setTimeout(
          () => {
            if (
              !this._container
                ?.isConnected
            ) {
              return;
            }

            this.render(
              this._container
            );
          },
          this.config
            .refreshDelay
        );
    },

    bindAutomaticSync() {
      if (this._syncBound) {
        return;
      }

      this._syncBound = true;

      const refresh =
        () => this.scheduleRefresh();

      [
        "aiw:dataChanged",
        "aiw:dataUpdated",
        "aiw:dataImported",
        "aiw:dataRestored",
        "aiw:dataReset",
        "aiw:storeChanged",
        "aiw:itemCreated",
        "aiw:itemUpdated",
        "aiw:itemDeleted",
        "aiw:itemRestored",
        "aiw:projectCreatedFromIdea",
        "aiw:ideaConvertedToProject",
        "aiw:projectStatusChanged",
        "aiw:projectPhaseChanged",
        "aiw:projectTaskCreated",
        "aiw:projectTaskUpdated",
        "aiw:projectTaskDeleted",
        "aiw:projectRevertedToIdea"
      ].forEach(eventName => {
        window.addEventListener(
          eventName,
          refresh
        );
      });

      const store =
        this.getStore();

      if (
        typeof store?.subscribe ===
        "function"
      ) {
        this._unsubscribeStore =
          store.subscribe(
            change => {
              const type =
                change?.type ||
                "";

              if (
                type ===
                  "aiw:metadataChanged" ||
                type ===
                  "persist" ||
                type ===
                  "settingsPersisted"
              ) {
                return;
              }

              refresh();
            }
          );
      }
    },

    destroy() {
      window.clearTimeout(
        this._refreshTimer
      );

      if (
        typeof this
          ._unsubscribeStore ===
        "function"
      ) {
        this._unsubscribeStore();
      }

      if (
        this._eventsContainer &&
        this._boundClickHandler
      ) {
        this._eventsContainer
          .removeEventListener(
            "click",
            this._boundClickHandler
          );
      }

      this._unsubscribeStore = null;
      this._eventsContainer = null;
      this._boundClickHandler = null;
      this._container = null;
      this._syncBound = false;
      this._autoOpenedProjectId = null;

      this.closeProjectDetails();
    },

    /* =======================================================
       Shared UI
    ======================================================= */

    kpi(label, value, note) {
      if (
        typeof window.AIW
          ?.Widgets?.kpi ===
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
            ${this.escapeHtml(
              label
            )}
          </span>

          <strong>
            ${this.escapeHtml(
              value
            )}
          </strong>

          <small>
            ${this.escapeHtml(
              note
            )}
          </small>
        </div>
      `;
    },

    badgeClass(value) {
      const normalized =
        this.normalizeStatus(
          value
        );

      if (
        [
          "عالية",
          "عالي",
          "high",
          "critical"
        ].includes(normalized)
      ) {
        return "high";
      }

      if (
        [
          "متوسطة",
          "متوسط",
          "medium"
        ].includes(normalized)
      ) {
        return "medium";
      }

      if (
        [
          "منخفضة",
          "منخفض",
          "low"
        ].includes(normalized)
      ) {
        return "low";
      }

      return "";
    },

    showToast(
      message,
      type = "success"
    ) {
      document
        .querySelector(
          ".project-workflow-toast"
        )
        ?.remove();

      const toast =
        document.createElement(
          "div"
        );

      toast.className =
        `project-workflow-toast ${type}`;

      toast.textContent =
        message;

      document.body
        .appendChild(toast);

      requestAnimationFrame(
        () => {
          toast.classList.add(
            "visible"
          );
        }
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

    /* =======================================================
       Styles
    ======================================================= */

    injectStyles() {
      if (
        document.getElementById(
          this.config.styleId
        )
      ) {
        return;
      }

      const style =
        document.createElement(
          "style"
        );

      style.id =
        this.config.styleId;

      style.textContent = `
        .project-card {
          position: relative;
          transition:
            transform .2s ease,
            border-color .2s ease,
            box-shadow .2s ease;
        }

        .project-card.selected {
          border-color: rgba(49,89,191,.58);
          box-shadow:
            0 0 0 3px rgba(49,89,191,.1),
            0 18px 40px rgba(15,23,42,.1);
        }

        .project-card.selected::before {
          content: "المشروع المحدد";
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 2;
          padding: 5px 9px;
          border-radius: 999px;
          color: #fff;
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

        .project-quickwin,
        .project-priority.low,
        .project-status-badge.approved {
          color: #087d3e;
          background: #e2f7ea;
          border-color: #c8efd7;
        }

        .project-priority {
          color: #475467;
          background: #f2f4f7;
          border-color: #e4e7ec;
        }

        .project-priority.high,
        .project-status-badge.blocked {
          color: #b42318;
          background: #feeceb;
          border-color: #fbd3d0;
        }

        .project-priority.medium,
        .project-status-badge.pilot {
          color: #b75c00;
          background: #fff3d9;
          border-color: #ffe4ac;
        }

        .project-status-badge.planned {
          color: #3159bf;
          background: #edf3ff;
          border-color: #dbe7ff;
        }

        .project-status-badge.active {
          color: #fff;
          background: #3159bf;
          border-color: #3159bf;
        }

        .project-status-badge.production {
          color: #fff;
          background: #087d3e;
          border-color: #087d3e;
        }

        .project-status-badge.completed {
          color: #fff;
          background: #101b2f;
          border-color: #101b2f;
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
          opacity: .72;
        }

        .project-mini-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 15px;
        }

        .project-mini-stats span {
          padding: 7px 10px;
          border-radius: 999px;
          color: #475467;
          background: #f2f4f7;
          font-size: 11px;
          font-weight: 700;
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
          background: #fff;
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
          border-top: 1px solid rgba(15,23,42,.08);
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
            transform .18s ease,
            opacity .18s ease;
        }

        .project-action-button:active {
          transform: scale(.98);
        }

        .project-action-button.primary {
          color: #fff;
          background: #101b2f;
        }

        .project-action-button.secondary {
          color: #344054;
          background: #f2f4f7;
          border: 1px solid #e4e7ec;
        }

        .projects-empty-state strong,
        .projects-empty-state p {
          display: block;
        }

        .projects-empty-state p {
          margin: 8px 0 16px;
        }

        .project-portfolio-grid {
          display: grid;
          grid-template-columns: repeat(2,minmax(0,1fr));
          gap: 12px;
        }

        .project-portfolio-chip {
          min-width: 0;
          padding: 15px;
          border: 1px solid rgba(15,23,42,.07);
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
            24px 18px
            calc(24px + env(safe-area-inset-bottom));
          direction: rtl;
          background: rgba(15,23,42,.48);
          backdrop-filter: blur(10px);
          opacity: 0;
          transition: opacity .18s ease;
        }

        .project-details-overlay.visible {
          opacity: 1;
        }

        .project-details-dialog {
          position: relative;
          width: min(100%,620px);
          max-height: min(86vh,780px);
          overflow-y: auto;
          padding: 28px 22px 22px;
          border-radius: 28px;
          background: #fff;
          box-shadow: 0 28px 80px rgba(15,23,42,.28);
          transform: translateY(12px) scale(.98);
          transition: transform .18s ease;
        }

        .project-details-overlay.visible
        .project-details-dialog {
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
          grid-template-columns: repeat(4,minmax(0,1fr));
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
          border-top: 1px solid rgba(15,23,42,.08);
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

        .project-task-list,
        .project-phase-list,
        .project-milestones-list,
        .project-kpis-list,
        .project-risk-list {
          display: grid;
          gap: 9px;
        }

        .project-task-list > div,
        .project-phase-list > div,
        .project-milestones-list > div,
        .project-kpis-list > div,
        .project-risk-list > div {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 11px 12px;
          border-radius: 13px;
          background: #f9fafb;
        }

        .project-phase-list > div.current {
          border: 1px solid #dbe7ff;
          background: #f7faff;
        }

        .project-phase-list b,
        .project-milestones-list b {
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          color: #fff;
          background: #101b2f;
          font-size: 11px;
        }

        .project-task-list span,
        .project-phase-list span,
        .project-milestones-list span,
        .project-kpis-list span,
        .project-risk-list span {
          flex: 1;
          color: #475467;
          font-size: 12px;
        }

        .project-task-list strong,
        .project-phase-list small,
        .project-kpis-list strong,
        .project-risk-list strong {
          color: #101828;
          font-size: 12px;
        }

        .project-workflow-toast {
          position: fixed;
          right: 50%;
          bottom:
            calc(
              108px +
              env(safe-area-inset-bottom)
            );
          z-index: 100000;
          width:
            min(
              calc(100% - 36px),
              420px
            );
          box-sizing: border-box;
          padding: 14px 17px;
          border-radius: 16px;
          color: #fff;
          text-align: center;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.6;
          background: #101b2f;
          box-shadow:
            0 18px 45px
            rgba(15,23,42,.25);
          opacity: 0;
          transform:
            translateX(50%)
            translateY(14px);
          transition:
            opacity .2s ease,
            transform .2s ease;
        }

        .project-workflow-toast.visible {
          opacity: 1;
          transform:
            translateX(50%)
            translateY(0);
        }

        .project-workflow-toast.success {
          background: #087d3e;
        }

        .project-workflow-toast.error {
          background: #b42318;
        }

        @media (max-width: 760px) {
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
            grid-template-columns:
              repeat(2,minmax(0,1fr));
          }

          .project-details-list {
            grid-template-columns: 1fr;
          }
        }
      `;

      document.head
        .appendChild(style);
    },

    /* =======================================================
       Utilities
    ======================================================= */

    hasValue(value) {
      return !(
        value === null ||
        value === undefined ||
        value === ""
      );
    },

    normalizeStatus(value) {
      return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/_/g, "-");
    },

    toArray(value) {
      if (Array.isArray(value)) {
        return value;
      }

      if (
        value &&
        typeof value === "object"
      ) {
        return Object.values(value);
      }

      return [];
    },

    toSafeNumber(
      value,
      fallback = 0
    ) {
      const number =
        Number(value);

      return Number.isFinite(number)
        ? number
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

    valueToDisplayText(
      value,
      fallback = ""
    ) {
      if (
        value &&
        typeof value === "object"
      ) {
        return (
          value.name ||
          value.title ||
          value.label ||
          value.email ||
          fallback
        );
      }

      const text =
        String(value ?? "")
          .trim();

      return text || fallback;
    },

    getBudgetLabel(project) {
      if (
        this.hasValue(
          project.budget?.approved
        )
      ) {
        return this.formatMoney(
          project.budget.approved,
          project.budget.currency
        );
      }

      if (
        this.hasValue(
          project.budget?.estimated
        )
      ) {
        return this.formatMoney(
          project.budget.estimated,
          project.budget.currency
        );
      }

      return project.cost ||
        "غير محددة";
    },

    formatMoney(
      value,
      currency = "AED"
    ) {
      if (!this.hasValue(value)) {
        return "غير محدد";
      }

      const number =
        Number(value);

      if (!Number.isFinite(number)) {
        return String(value);
      }

      return `${number.toLocaleString(
        "ar-AE"
      )} ${currency}`;
    },

    formatDate(
      value,
      fallback = ""
    ) {
      if (!value) {
        return fallback;
      }

      try {
        const date =
          new Date(value);

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return String(value);
        }

        return date.toLocaleDateString(
          "ar-AE",
          {
            year: "numeric",
            month: "short",
            day: "numeric"
          }
        );
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
      if (
        window.CSS &&
        typeof window.CSS.escape ===
          "function"
      ) {
        return window.CSS.escape(
          String(value)
        );
      }

      return String(value)
        .replace(
          /["\\]/g,
          "\\$&"
        );
    }
  };
})();
