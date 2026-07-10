/* =========================================================
   AI Work - Biometric Operations Automation Center V5.0
   Enterprise Biometric Workflow & Approval Engine
   Store V2.2 Native Architecture

   File Path:
   js/modules/automation/automation.js

   Features:
   - AIW.Store V2.2 as Single Source of Truth
   - Native automation object integration
   - No internal default workflow seeding
   - Persistent workflows, triggers and approvals
   - Real executionHistory integration
   - Idea approval queue synchronization
   - Governance, risk and project integration
   - Human-in-the-Loop enforcement
   - Workflow run simulation and execution logging
   - Approval review actions
   - Dynamic statistics and recommendations
   - Cross-page Store synchronization
   - Existing core UI design preserved
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.automation = {
  id: "automation",
  title: "الأتمتة",
  icon: "⚙️",
  version: "5.0.0",

  _container: null,
  _unsubscribeStore: null,
  _refreshTimer: null,
  _detailsModal: null,
  _confirmationModal: null,
  _pendingAction: null,
  _eventsBound: false,
  _syncBound: false,
  _isRendering: false,
  _isExecuting: false,

  config: {
    actor: "الإدارة",
    refreshDelay: 80,
    styleId: "aiw-automation-v50-styles",
    maximumHistoryRows: 30,
    minimumAutomationLevel: 60
  },

  workflowStatus: {
    ACTIVE: "active",
    PLANNED: "planned",
    ENABLING: "enabling",
    PAUSED: "paused",
    BLOCKED: "blocked",
    ARCHIVED: "archived"
  },

  executionStatus: {
    RUNNING: "running",
    COMPLETED: "completed",
    FAILED: "failed",
    CANCELLED: "cancelled",
    WAITING_APPROVAL: "waiting-approval"
  },

  approvalStatus: {
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

  getState() {
    const store = this.getStore();

    if (!store) {
      console.error("AI Work Automation V5.0: AIW.Store is unavailable.");
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
      console.error(
        "AI Work Automation V5.0: Unable to read Store state.",
        error
      );
    }

    return {};
  },

  getCollection(name) {
    const collection = this.getState()?.[name];
    return Array.isArray(collection) ? collection : [];
  },

  /* =======================================================
     Automation Reader
  ======================================================= */

  getAutomationSource() {
    const state = this.getState();

    if (
      state.automation &&
      typeof state.automation === "object"
    ) {
      return state.automation;
    }

    if (
      state.automationCenter &&
      typeof state.automationCenter === "object"
    ) {
      return state.automationCenter;
    }

    return {};
  },

  getAutomation() {
    const source = this.getAutomationSource();

    return {
      workflows: Array.isArray(source.workflows)
        ? source.workflows
            .map((workflow, index) =>
              this.normalizeWorkflow(workflow, index)
            )
            .filter(Boolean)
        : [],

      triggers: Array.isArray(source.triggers)
        ? source.triggers
            .map((trigger, index) =>
              this.normalizeTrigger(trigger, index)
            )
            .filter(Boolean)
        : [],

      approvals: Array.isArray(source.approvals)
        ? source.approvals
            .map((approval, index) =>
              this.normalizeApproval(approval, index)
            )
            .filter(Boolean)
        : [],

      roadmap: Array.isArray(source.roadmap)
        ? source.roadmap
        : [],

      executionHistory: Array.isArray(source.executionHistory)
        ? source.executionHistory
            .map((entry, index) =>
              this.normalizeExecution(entry, index)
            )
            .filter(Boolean)
        : [],

      settings: {
        engineEnabled:
          source.settings?.engineEnabled !== false,

        humanApprovalRequired:
          source.settings?.humanApprovalRequired !== false,

        automaticEscalation:
          source.settings?.automaticEscalation !== false,

        monitoringEnabled:
          source.settings?.monitoringEnabled !== false,

        reportingCycle:
          source.settings?.reportingCycle || "شهري",

        minimumAutomationLevel:
          this.normalizePercent(
            source.settings?.minimumAutomationLevel,
            this.config.minimumAutomationLevel
          ),

        retainExecutionHistory:
          source.settings?.retainExecutionHistory !== false
      },

      statistics: {
        completed: this.toSafeNumber(
          source.statistics?.completed,
          0
        ),

        failed: this.toSafeNumber(
          source.statistics?.failed,
          0
        ),

        running: this.toSafeNumber(
          source.statistics?.running,
          0
        ),

        waitingApproval: this.toSafeNumber(
          source.statistics?.waitingApproval,
          0
        ),

        lastRunAt:
          source.statistics?.lastRunAt || null
      },

      meta: {
        createdAt:
          source.meta?.createdAt || null,

        updatedAt:
          source.meta?.updatedAt || null
      }
    };
  },

  getIdeas() {
    const store = this.getStore();

    try {
      if (typeof store?.getIdeas === "function") {
        const ideas = store.getIdeas();
        if (Array.isArray(ideas)) return ideas;
      }
    } catch (error) {
      console.warn("AI Work Automation V5.0: getIdeas failed.", error);
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
      console.warn("AI Work Automation V5.0: getProjects failed.", error);
    }

    return this.getCollection("projects");
  },

  getRisks() {
    const state = this.getState();
    const risks = [];

    [
      state.risks,
      state.riskRegister,
      state.governance?.risks,
      state.governanceCenter?.risks
    ].forEach(source => {
      if (Array.isArray(source)) risks.push(...source);
    });

    return risks;
  },

  /* =======================================================
     Normalization
  ======================================================= */

  normalizeWorkflow(workflow, index = 0) {
    if (!workflow || typeof workflow !== "object") return null;

    return {
      ...workflow,

      id:
        workflow.id ??
        workflow.workflowId ??
        `workflow-${index + 1}`,

      icon:
        workflow.icon || "⚙️",

      title:
        workflow.title ||
        workflow.name ||
        "مسار عمل غير مسمى",

      trigger:
        workflow.trigger ||
        workflow.triggerTitle ||
        "لا يوجد Trigger محدد",

      triggerCode:
        workflow.triggerCode ||
        workflow.eventCode ||
        "",

      steps:
        Array.isArray(workflow.steps)
          ? workflow.steps
          : [],

      owner:
        workflow.owner ||
        workflow.team ||
        "غير محدد",

      status:
        this.normalizeWorkflowStatus(
          workflow.status ??
          workflow.state ??
          ""
        ),

      automation:
        this.normalizePercent(
          workflow.automation ??
          workflow.automationLevel ??
          workflow.coverage,
          0
        ),

      humanApprovalRequired:
        workflow.humanApprovalRequired === true ||
        workflow.requiresApproval === true,

      riskLevel:
        workflow.riskLevel ||
        workflow.risk ||
        "متوسط",

      linkedModules:
        Array.isArray(workflow.linkedModules)
          ? workflow.linkedModules
          : [],

      createdAt:
        workflow.createdAt || null,

      updatedAt:
        workflow.updatedAt || null,

      lastRunAt:
        workflow.lastRunAt || null,

      runCount:
        this.toSafeNumber(
          workflow.runCount,
          0
        )
    };
  },

  normalizeTrigger(trigger, index = 0) {
    if (Array.isArray(trigger)) {
      trigger = {
        code: trigger[0],
        title: trigger[1],
        action: trigger[2],
        status: trigger[3]
      };
    }

    if (!trigger || typeof trigger !== "object") return null;

    return {
      ...trigger,

      id:
        trigger.id ??
        `trigger-${index + 1}`,

      code:
        trigger.code ||
        trigger.triggerCode ||
        "",

      title:
        trigger.title ||
        trigger.name ||
        "حدث غير مسمى",

      action:
        trigger.action ||
        trigger.description ||
        "",

      status:
        this.normalizeTriggerStatus(
          trigger.status ??
          trigger.state ??
          ""
        ),

      workflowId:
        trigger.workflowId ??
        trigger.linkedWorkflowId ??
        null,

      lastTriggeredAt:
        trigger.lastTriggeredAt || null,

      triggerCount:
        this.toSafeNumber(
          trigger.triggerCount,
          0
        )
    };
  },

  normalizeApproval(approval, index = 0) {
    if (Array.isArray(approval)) {
      approval = {
        title: approval[0],
        owner: approval[1],
        status: approval[2],
        risk: approval[3]
      };
    }

    if (!approval || typeof approval !== "object") return null;

    return {
      ...approval,

      id:
        approval.id ??
        `approval-${index + 1}`,

      title:
        approval.title ||
        approval.name ||
        "طلب اعتماد غير مسمى",

      owner:
        approval.owner ||
        approval.assignee ||
        "غير محدد",

      status:
        this.normalizeApprovalStatus(
          approval.status ??
          approval.state ??
          ""
        ),

      statusLabel:
        approval.statusLabel ||
        approval.status ||
        "قيد المراجعة",

      risk:
        approval.risk ||
        approval.riskLevel ||
        "متوسط",

      source:
        approval.source ||
        approval.sourceType ||
        "manual",

      sourceId:
        approval.sourceId ??
        approval.entityId ??
        null,

      workflowId:
        approval.workflowId ??
        null,

      createdAt:
        approval.createdAt ||
        approval.submittedAt ||
        null,

      updatedAt:
        approval.updatedAt || null,

      decidedAt:
        approval.decidedAt || null,

      decidedBy:
        approval.decidedBy || null,

      notes:
        approval.notes || null
    };
  },

  normalizeExecution(entry, index = 0) {
    if (!entry || typeof entry !== "object") return null;

    return {
      ...entry,

      id:
        entry.id ??
        entry.executionId ??
        `execution-${index + 1}`,

      workflowId:
        entry.workflowId ??
        null,

      workflowTitle:
        entry.workflowTitle ||
        entry.title ||
        "عملية أتمتة",

      triggerCode:
        entry.triggerCode ||
        entry.eventCode ||
        "",

      status:
        this.normalizeExecutionStatus(
          entry.status ??
          entry.state ??
          ""
        ),

      startedAt:
        entry.startedAt ||
        entry.createdAt ||
        null,

      completedAt:
        entry.completedAt ||
        entry.finishedAt ||
        null,

      durationMs:
        this.toSafeNumber(
          entry.durationMs,
          0
        ),

      actor:
        entry.actor ||
        entry.executedBy ||
        "System",

      result:
        entry.result ||
        entry.output ||
        null,

      error:
        entry.error ||
        entry.errorMessage ||
        null,

      sourceType:
        entry.sourceType ||
        entry.source ||
        "workflow",

      sourceId:
        entry.sourceId ??
        null
    };
  },

  normalizeWorkflowStatus(value) {
    const status = this.normalizeStatus(value);

    const map = {
      "active": this.workflowStatus.ACTIVE,
      "نشط": this.workflowStatus.ACTIVE,
      "running": this.workflowStatus.ACTIVE,

      "planned": this.workflowStatus.PLANNED,
      "مخطط": this.workflowStatus.PLANNED,

      "enabling": this.workflowStatus.ENABLING,
      "قيد-التفعيل": this.workflowStatus.ENABLING,

      "paused": this.workflowStatus.PAUSED,
      "متوقف": this.workflowStatus.PAUSED,
      "متوقف-مؤقتاً": this.workflowStatus.PAUSED,

      "blocked": this.workflowStatus.BLOCKED,
      "متعثر": this.workflowStatus.BLOCKED,

      "archived": this.workflowStatus.ARCHIVED,
      "مؤرشف": this.workflowStatus.ARCHIVED
    };

    return map[status] || this.workflowStatus.PLANNED;
  },

  normalizeTriggerStatus(value) {
    const status = this.normalizeStatus(value);

    if (
      [
        "active",
        "enabled",
        "نشط",
        "مفعل",
        "مفعّل"
      ].includes(status)
    ) {
      return "active";
    }

    if (
      [
        "disabled",
        "inactive",
        "موقوف",
        "غير-مفعل"
      ].includes(status)
    ) {
      return "disabled";
    }

    if (
      ["archived", "مؤرشف"].includes(status)
    ) {
      return "archived";
    }

    return "active";
  },

  normalizeApprovalStatus(value) {
    const status = this.normalizeStatus(value);

    if (
      [
        "approved",
        "معتمد",
        "تمت-الموافقة"
      ].includes(status)
    ) {
      return this.approvalStatus.APPROVED;
    }

    if (
      [
        "rejected",
        "مرفوض",
        "غير-معتمد"
      ].includes(status)
    ) {
      return this.approvalStatus.REJECTED;
    }

    if (
      [
        "cancelled",
        "canceled",
        "ملغي"
      ].includes(status)
    ) {
      return this.approvalStatus.CANCELLED;
    }

    return this.approvalStatus.PENDING;
  },

  normalizeExecutionStatus(value) {
    const status = this.normalizeStatus(value);

    if (
      [
        "completed",
        "success",
        "successful",
        "مكتمل",
        "ناجح"
      ].includes(status)
    ) {
      return this.executionStatus.COMPLETED;
    }

    if (
      [
        "failed",
        "error",
        "فشل",
        "فاشل"
      ].includes(status)
    ) {
      return this.executionStatus.FAILED;
    }

    if (
      [
        "cancelled",
        "canceled",
        "ملغي"
      ].includes(status)
    ) {
      return this.executionStatus.CANCELLED;
    }

    if (
      [
        "waiting-approval",
        "pending-approval",
        "بانتظار-الاعتماد"
      ].includes(status)
    ) {
      return this.executionStatus.WAITING_APPROVAL;
    }

    return this.executionStatus.RUNNING;
  },

  /* =======================================================
     Store Updates
  ======================================================= */

  updateAutomation(changes = {}) {
    if (!changes || typeof changes !== "object") {
      return {
        success: false,
        message: "بيانات التحديث غير صالحة."
      };
    }

    const store = this.getStore();
    const current = this.getAutomation();

    if (!store) {
      return {
        success: false,
        message: "مخزن البيانات غير متاح."
      };
    }

    const updated = {
      ...current,
      ...changes,

      settings: {
        ...current.settings,
        ...(changes.settings || {})
      },

      statistics: {
        ...current.statistics,
        ...(changes.statistics || {})
      },

      meta: {
        ...current.meta,
        updatedAt: new Date().toISOString()
      }
    };

    try {
      if (typeof store.set === "function") {
        const result = store.set(
          "automation",
          updated,
          {
            event: "aiw:automationUpdated"
          }
        );

        return this.normalizeStoreResult(result, updated);
      }

      if (typeof store.update === "function") {
        const result = store.update(
          "automation",
          updated,
          {
            event: "aiw:automationUpdated"
          }
        );

        return this.normalizeStoreResult(result, updated);
      }

      if (typeof store.patch === "function") {
        const result = store.patch(
          "automation",
          updated,
          {
            event: "aiw:automationUpdated"
          }
        );

        return this.normalizeStoreResult(result, updated);
      }
    } catch (error) {
      console.error(
        "AI Work Automation V5.0: updateAutomation failed.",
        error
      );

      return {
        success: false,
        message: "تعذر تحديث بيانات الأتمتة.",
        error
      };
    }

    return {
      success: false,
      message: "Store V2.2 لا يدعم تحديث الأتمتة."
    };
  },

  normalizeStoreResult(result, data = null) {
    if (result?.success === false) return result;

    if (result === false || result === null) {
      return {
        success: false,
        message: "تعذر حفظ البيانات."
      };
    }

    return {
      success: true,
      result,
      data
    };
  },

  /* =======================================================
     Workflow CRUD
  ======================================================= */

  addWorkflow(workflow = {}) {
    const automation = this.getAutomation();
    const now = new Date().toISOString();

    const newWorkflow = this.normalizeWorkflow(
      {
        ...workflow,

        id:
          workflow.id ??
          this.createId("workflow"),

        title:
          workflow.title ||
          "مسار عمل جديد",

        status:
          workflow.status ||
          this.workflowStatus.PLANNED,

        createdAt:
          workflow.createdAt ||
          now,

        updatedAt:
          now
      },
      automation.workflows.length
    );

    const workflows = [
      ...automation.workflows,
      newWorkflow
    ];

    const result = this.updateAutomation({
      workflows
    });

    return result.success
      ? {
          success: true,
          workflow: newWorkflow
        }
      : result;
  },

  updateWorkflow(workflowId, changes = {}) {
    const automation = this.getAutomation();

    const index = automation.workflows.findIndex(
      workflow =>
        String(workflow.id) === String(workflowId)
    );

    if (index < 0) {
      return {
        success: false,
        message: "لم يتم العثور على مسار العمل."
      };
    }

    const workflows = automation.workflows.map(
      (workflow, workflowIndex) => {
        if (workflowIndex !== index) return workflow;

        return this.normalizeWorkflow(
          {
            ...workflow,
            ...changes,
            id: workflow.id,
            updatedAt: new Date().toISOString()
          },
          workflowIndex
        );
      }
    );

    const result = this.updateAutomation({
      workflows
    });

    return result.success
      ? {
          success: true,
          workflow: workflows[index]
        }
      : result;
  },

  removeWorkflow(workflowId) {
    const automation = this.getAutomation();

    const workflow = automation.workflows.find(
      item =>
        String(item.id) === String(workflowId)
    );

    if (!workflow) {
      return {
        success: false,
        message: "لم يتم العثور على مسار العمل."
      };
    }

    const workflows = automation.workflows.filter(
      item =>
        String(item.id) !== String(workflowId)
    );

    const result = this.updateAutomation({
      workflows
    });

    return result.success
      ? {
          success: true,
          workflow
        }
      : result;
  },

  /* =======================================================
     Approval Integration
  ======================================================= */

  getIdeaApprovalQueue() {
    return this.getIdeas()
      .filter(idea => {
        const status = this.normalizeStatus(
          idea.lifecycleStatus ??
          idea.ideaStatus ??
          idea.approval?.status ??
          ""
        );

        return [
          "pending",
          "submitted",
          "pending-approval"
        ].includes(status);
      })
      .map(idea => ({
        id: `idea-${idea.id}`,
        title:
          idea.title ||
          "فكرة بانتظار الاعتماد",

        owner:
          idea.approval?.owner ||
          idea.owner ||
          "الإدارة",

        status:
          this.approvalStatus.PENDING,

        statusLabel:
          "بانتظار اعتماد الفكرة",

        risk:
          idea.riskLevel ||
          idea.risk ||
          "متوسط",

        source:
          "idea",

        sourceId:
          idea.id,

        createdAt:
          idea.approval?.submittedAt ||
          idea.updatedAt ||
          idea.createdAt ||
          null
      }));
  },

  getRiskApprovalQueue() {
    return this.getRisks()
      .filter(risk => {
        const level = this.normalizeStatus(
          risk.level ??
          risk.riskLevel ??
          risk.severity ??
          ""
        );

        return (
          this.isHighRisk(level) &&
          !this.isClosedStatus(risk.status)
        );
      })
      .map(risk => ({
        id: `risk-${risk.id}`,
        title:
          risk.title ||
          risk.name ||
          "مخاطرة عالية تتطلب مراجعة",

        owner:
          risk.owner ||
          "لجنة الحوكمة",

        status:
          this.approvalStatus.PENDING,

        statusLabel:
          "تتطلب مراجعة مخاطر",

        risk:
          risk.level ||
          risk.riskLevel ||
          "عالٍ",

        source:
          "risk",

        sourceId:
          risk.id,

        createdAt:
          risk.createdAt ||
          risk.updatedAt ||
          null
      }));
  },

  getProjectApprovalQueue() {
    return this.getProjects()
      .filter(project => {
        const status = this.normalizeStatus(
          project.approval?.status ??
          project.approvalStatus ??
          ""
        );

        return [
          "pending",
          "submitted",
          "pending-approval"
        ].includes(status);
      })
      .map(project => ({
        id: `project-${project.id}`,
        title:
          project.title ||
          "مشروع بانتظار الاعتماد",

        owner:
          project.approval?.owner ||
          project.owner ||
          "الإدارة",

        status:
          this.approvalStatus.PENDING,

        statusLabel:
          "بانتظار اعتماد المشروع",

        risk:
          project.riskLevel ||
          project.risk ||
          "متوسط",

        source:
          "project",

        sourceId:
          project.id,

        createdAt:
          project.approval?.submittedAt ||
          project.updatedAt ||
          project.createdAt ||
          null
      }));
  },

  getApprovalQueue(storedApprovals = []) {
    const combined = [
      ...storedApprovals,
      ...this.getIdeaApprovalQueue(),
      ...this.getRiskApprovalQueue(),
      ...this.getProjectApprovalQueue()
    ];

    return this.uniqueBy(
      combined.map((approval, index) =>
        this.normalizeApproval(approval, index)
      ),
      approval =>
        `${approval.source}-${approval.sourceId ?? approval.id}`
    );
  },

  addApproval(approval = {}) {
    const automation = this.getAutomation();

    const newApproval = this.normalizeApproval(
      {
        ...approval,

        id:
          approval.id ??
          this.createId("approval"),

        status:
          approval.status ||
          this.approvalStatus.PENDING,

        createdAt:
          approval.createdAt ||
          new Date().toISOString()
      },
      automation.approvals.length
    );

    const approvals = [
      ...automation.approvals,
      newApproval
    ];

    const result = this.updateAutomation({
      approvals
    });

    return result.success
      ? {
          success: true,
          approval: newApproval
        }
      : result;
  },

  updateApproval(approvalId, changes = {}) {
    const automation = this.getAutomation();

    const index = automation.approvals.findIndex(
      approval =>
        String(approval.id) === String(approvalId)
    );

    if (index < 0) {
      return {
        success: false,
        message: "لم يتم العثور على طلب الاعتماد."
      };
    }

    const approvals = automation.approvals.map(
      (approval, approvalIndex) => {
        if (approvalIndex !== index) return approval;

        return this.normalizeApproval(
          {
            ...approval,
            ...changes,
            id: approval.id,
            updatedAt: new Date().toISOString()
          },
          approvalIndex
        );
      }
    );

    const result = this.updateAutomation({
      approvals
    });

    return result.success
      ? {
          success: true,
          approval: approvals[index]
        }
      : result;
  },

  approveQueueItem(approval, notes = "") {
    if (!approval) {
      return {
        success: false,
        message: "طلب الاعتماد غير موجود."
      };
    }

    if (approval.source === "idea") {
      const store = this.getStore();

      if (typeof store?.approveIdea === "function") {
        try {
          const result = store.approveIdea(
            approval.sourceId,
            {
              actor: this.config.actor,
              notes
            }
          );

          return this.normalizeStoreResult(result);
        } catch (error) {
          return {
            success: false,
            message: "تعذر اعتماد الفكرة.",
            error
          };
        }
      }
    }

    if (
      approval.source === "manual" ||
      approval.source === "workflow"
    ) {
      return this.updateApproval(
        approval.id,
        {
          status: this.approvalStatus.APPROVED,
          statusLabel: "معتمد",
          decidedAt: new Date().toISOString(),
          decidedBy: this.config.actor,
          notes
        }
      );
    }

    return {
      success: false,
      message: "اعتماد هذا النوع يتم من الوحدة المختصة."
    };
  },

  rejectQueueItem(approval, notes = "") {
    if (!approval) {
      return {
        success: false,
        message: "طلب الاعتماد غير موجود."
      };
    }

    if (!notes.trim()) {
      return {
        success: false,
        message: "يجب إدخال سبب الرفض."
      };
    }

    if (approval.source === "idea") {
      const store = this.getStore();

      if (typeof store?.rejectIdea === "function") {
        try {
          const result = store.rejectIdea(
            approval.sourceId,
            {
              actor: this.config.actor,
              reason: notes,
              notes
            }
          );

          return this.normalizeStoreResult(result);
        } catch (error) {
          return {
            success: false,
            message: "تعذر رفض الفكرة.",
            error
          };
        }
      }
    }

    if (
      approval.source === "manual" ||
      approval.source === "workflow"
    ) {
      return this.updateApproval(
        approval.id,
        {
          status: this.approvalStatus.REJECTED,
          statusLabel: "مرفوض",
          decidedAt: new Date().toISOString(),
          decidedBy: this.config.actor,
          notes
        }
      );
    }

    return {
      success: false,
      message: "رفض هذا النوع يتم من الوحدة المختصة."
    };
  },

  /* =======================================================
     Execution History
  ======================================================= */

  addExecution(entry = {}) {
    const automation = this.getAutomation();

    const execution = this.normalizeExecution(
      {
        ...entry,

        id:
          entry.id ??
          this.createId("execution"),

        startedAt:
          entry.startedAt ||
          new Date().toISOString()
      },
      automation.executionHistory.length
    );

    const executionHistory = [
      ...automation.executionHistory,
      execution
    ];

    const statistics = this.calculatePersistedStatistics(
      executionHistory
    );

    const result = this.updateAutomation({
      executionHistory,
      statistics
    });

    return result.success
      ? {
          success: true,
          execution
        }
      : result;
  },

  updateExecution(executionId, changes = {}) {
    const automation = this.getAutomation();

    const index = automation.executionHistory.findIndex(
      execution =>
        String(execution.id) === String(executionId)
    );

    if (index < 0) {
      return {
        success: false,
        message: "لم يتم العثور على سجل التنفيذ."
      };
    }

    const executionHistory = automation.executionHistory.map(
      (execution, executionIndex) => {
        if (executionIndex !== index) return execution;

        return this.normalizeExecution(
          {
            ...execution,
            ...changes,
            id: execution.id
          },
          executionIndex
        );
      }
    );

    const statistics = this.calculatePersistedStatistics(
      executionHistory
    );

    const result = this.updateAutomation({
      executionHistory,
      statistics
    });

    return result.success
      ? {
          success: true,
          execution: executionHistory[index]
        }
      : result;
  },

  calculatePersistedStatistics(history = []) {
    return {
      completed: history.filter(
        entry =>
          entry.status === this.executionStatus.COMPLETED
      ).length,

      failed: history.filter(
        entry =>
          entry.status === this.executionStatus.FAILED
      ).length,

      running: history.filter(
        entry =>
          entry.status === this.executionStatus.RUNNING
      ).length,

      waitingApproval: history.filter(
        entry =>
          entry.status === this.executionStatus.WAITING_APPROVAL
      ).length,

      lastRunAt:
        history.length
          ? (
              history[history.length - 1].startedAt ||
              history[history.length - 1].completedAt ||
              null
            )
          : null
    };
  },

  runWorkflow(workflowId, options = {}) {
    if (this._isExecuting) {
      return {
        success: false,
        message: "يوجد تنفيذ جارٍ حالياً."
      };
    }

    const automation = this.getAutomation();

    const workflow = automation.workflows.find(
      item =>
        String(item.id) === String(workflowId)
    );

    if (!workflow) {
      return {
        success: false,
        message: "لم يتم العثور على مسار العمل."
      };
    }

    if (workflow.status !== this.workflowStatus.ACTIVE) {
      return {
        success: false,
        message: "مسار العمل غير نشط."
      };
    }

    this._isExecuting = true;

    try {
      const startedAt = new Date();
      const executionId = this.createId("execution");

      const waitingApproval =
        workflow.humanApprovalRequired === true &&
        this.getAutomation().settings.humanApprovalRequired === true;

      const finalStatus = waitingApproval
        ? this.executionStatus.WAITING_APPROVAL
        : this.executionStatus.COMPLETED;

      const completedAt = new Date();

      const executionResult = this.addExecution({
        id: executionId,
        workflowId: workflow.id,
        workflowTitle: workflow.title,
        triggerCode: workflow.triggerCode,
        status: finalStatus,
        startedAt: startedAt.toISOString(),
        completedAt:
          waitingApproval
            ? null
            : completedAt.toISOString(),
        durationMs:
          completedAt.getTime() -
          startedAt.getTime(),
        actor:
          options.actor ||
          this.config.actor,
        result:
          waitingApproval
            ? "تم تنفيذ الخطوات الآلية وتحويل العملية إلى قائمة الاعتماد."
            : "تم تنفيذ مسار العمل بنجاح.",
        sourceType:
          options.sourceType ||
          "manual",
        sourceId:
          options.sourceId ??
          null
      });

      if (!executionResult.success) {
        return executionResult;
      }

      this.updateWorkflow(
        workflow.id,
        {
          lastRunAt: startedAt.toISOString(),
          runCount:
            this.toSafeNumber(workflow.runCount, 0) + 1
        }
      );

      if (waitingApproval) {
        this.addApproval({
          title: `اعتماد تنفيذ: ${workflow.title}`,
          owner: workflow.owner,
          status: this.approvalStatus.PENDING,
          statusLabel: "بانتظار اعتماد بشري",
          risk: workflow.riskLevel,
          source: "workflow",
          sourceId: executionId,
          workflowId: workflow.id,
          createdAt: startedAt.toISOString()
        });
      }

      return {
        success: true,
        execution: executionResult.execution,
        waitingApproval
      };
    } finally {
      this._isExecuting = false;
    }
  },

  /* =======================================================
     Statistics
  ======================================================= */

  getStatistics(workflows, approvals, automation) {
    const history = automation.executionHistory;

    const calculated = {
      total: workflows.length,

      active: workflows.filter(
        workflow =>
          workflow.status === this.workflowStatus.ACTIVE
      ).length,

      waitingWorkflows: workflows.filter(
        workflow =>
          workflow.status !== this.workflowStatus.ACTIVE
      ).length,

      triggers: automation.triggers.filter(
        trigger =>
          trigger.status === "active"
      ).length,

      pendingApprovals: approvals.filter(
        approval =>
          approval.status === this.approvalStatus.PENDING
      ).length,

      highApprovals: approvals.filter(
        approval =>
          approval.status === this.approvalStatus.PENDING &&
          this.isHighRisk(approval.risk)
      ).length,

      completedExecutions: history.filter(
        entry =>
          entry.status === this.executionStatus.COMPLETED
      ).length,

      failedExecutions: history.filter(
        entry =>
          entry.status === this.executionStatus.FAILED
      ).length,

      runningExecutions: history.filter(
        entry =>
          entry.status === this.executionStatus.RUNNING
      ).length,

      waitingExecutions: history.filter(
        entry =>
          entry.status === this.executionStatus.WAITING_APPROVAL
      ).length
    };

    return calculated;
  },

  getNextActions(context = {}) {
    try {
      if (
        typeof window.AIW?.Recommendation?.nextActions ===
        "function"
      ) {
        const actions =
          window.AIW.Recommendation.nextActions(context);

        if (Array.isArray(actions) && actions.length) {
          return actions.filter(Boolean).slice(0, 6);
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Automation V5.0: Recommendation engine unavailable.",
        error
      );
    }

    const actions = [];

    if (context.stats.highApprovals > 0) {
      actions.push(
        `مراجعة ${context.stats.highApprovals} طلبات اعتماد عالية الخطورة قبل متابعة التنفيذ.`
      );
    }

    if (
      context.averageAutomation <
      context.automation.settings.minimumAutomationLevel
    ) {
      actions.push(
        "رفع مستوى أتمتة المسارات الأقل من الحد التشغيلي المعتمد."
      );
    }

    if (context.stats.waitingWorkflows > 0) {
      actions.push(
        `استكمال متطلبات تفعيل ${context.stats.waitingWorkflows} مسارات غير نشطة.`
      );
    }

    if (context.stats.failedExecutions > 0) {
      actions.push(
        `تحليل ${context.stats.failedExecutions} عمليات تنفيذ فاشلة وتحديد أسبابها.`
      );
    }

    if (context.stats.waitingExecutions > 0) {
      actions.push(
        `إكمال الاعتماد البشري لـ ${context.stats.waitingExecutions} عمليات معلقة.`
      );
    }

    if (!context.automation.triggers.length) {
      actions.push(
        "إضافة Event Triggers لبدء تشغيل المسارات تلقائياً."
      );
    }

    if (!actions.length) {
      actions.push(
        "مراجعة مستوى الأتمتة وتحديد المسار التالي للتفعيل."
      );
    }

    return actions.slice(0, 6);
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

      const widgets = window.AIW?.Widgets;
      const automation = this.getAutomation();

      const workflows = automation.workflows.filter(
        workflow =>
          workflow.status !== this.workflowStatus.ARCHIVED
      );

      const triggers = automation.triggers.filter(
        trigger =>
          trigger.status === "active"
      );

      const approvals = this.getApprovalQueue(
        automation.approvals
      );

      const stats = this.getStatistics(
        workflows,
        approvals,
        automation
      );

      const averageAutomation = this.average(
        workflows.map(
          workflow => workflow.automation
        )
      );

      const nextActions = this.getNextActions({
        automation,
        workflows,
        approvals,
        stats,
        averageAutomation
      });

      container.innerHTML = `
        <section class="module-page">
          ${
            typeof widgets?.hero === "function"
              ? widgets.hero({
                  kicker:
                    "Biometric Automation · Workflow Engine",

                  title:
                    "مركز أتمتة العمليات البيومترية",

                  description:
                    "إدارة مسارات العمل والاعتمادات وسجل التنفيذ للعمليات البيومترية ضمن Store V2.2، مع فرض المراجعة البشرية للقرارات الحساسة.",

                  chips: [
                    "⚙️ Workflow Engine",
                    `🔁 ${workflows.length} Workflows`,
                    `✅ ${stats.active} نشطة`,
                    `📊 ${averageAutomation}% أتمتة`,
                    `🧾 ${automation.executionHistory.length} عمليات`
                  ]
                })
              : this.fallbackHero(
                  workflows.length,
                  stats.active,
                  averageAutomation,
                  automation.executionHistory.length
                )
          }

          <div class="module-grid">
            ${this.kpi(
              "إجمالي Workflows",
              workflows.length,
              "Biometric Flows"
            )}

            ${this.kpi(
              "المسارات النشطة",
              stats.active,
              "Active Workflows"
            )}

            ${this.kpi(
              "Event Triggers",
              triggers.length,
              "Operational Events"
            )}

            ${this.kpi(
              "طلبات الاعتماد",
              stats.pendingApprovals,
              "Approval Queue"
            )}

            ${this.kpi(
              "اعتمادات عالية الخطورة",
              stats.highApprovals,
              "High Risk"
            )}

            ${this.kpi(
              "متوسط الأتمتة",
              `${averageAutomation}%`,
              "Automation Level"
            )}
          </div>

          <div class="module-wide-grid">
            <div class="module-panel">
              ${this.sectionTitle(
                "الخلاصة التشغيلية",
                "قراءة فورية لحالة محرك الأتمتة وسجل التنفيذ."
              )}

              <div class="automation-summary-card">
                <strong>
                  الأتمتة تربط الأحداث التشغيلية بالقواعد والمراجعة البشرية وسجل التنفيذ
                </strong>

                <p>
                  جميع المسارات والاعتمادات وعمليات التنفيذ تقرأ من Store V2.2،
                  وتتم مزامنتها مع الأفكار والمشاريع والمخاطر والقرارات.
                </p>

                <div class="automation-summary-strip">
                  <div>
                    <span>Total</span>
                    <b>${stats.total}</b>
                  </div>

                  <div>
                    <span>Active</span>
                    <b>${stats.active}</b>
                  </div>

                  <div>
                    <span>Executed</span>
                    <b>${automation.executionHistory.length}</b>
                  </div>

                  <div>
                    <span>Level</span>
                    <b>${averageAutomation}%</b>
                  </div>
                </div>
              </div>
            </div>

            <div class="module-panel">
              ${this.sectionTitle(
                "Execution Status",
                "حالة العمليات المسجلة في executionHistory."
              )}

              <div class="automation-model">
                <div>
                  <b>${stats.completedExecutions}</b>
                  <span>Completed</span>
                </div>

                <div>
                  <b>${stats.runningExecutions}</b>
                  <span>Running</span>
                </div>

                <div>
                  <b>${stats.waitingExecutions}</b>
                  <span>Waiting Approval</span>
                </div>

                <div>
                  <b>${stats.failedExecutions}</b>
                  <span>Failed</span>
                </div>
              </div>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Biometric Workflow Portfolio",
              "مسارات العمل الفعلية المحفوظة في Store."
            )}

            ${
              workflows.length
                ? `
                  <div class="automation-workflow-grid">
                    ${workflows
                      .map(workflow =>
                        this.workflowCard(workflow)
                      )
                      .join("")}
                  </div>
                `
                : this.emptyState(
                    "لا توجد مسارات أتمتة مسجلة حالياً."
                  )
            }
          </div>

          <div class="module-wide-grid">
            <div class="module-panel">
              ${this.sectionTitle(
                "Biometric Event Triggers",
                "الأحداث المفعلة لتشغيل المسارات تلقائياً."
              )}

              ${
                triggers.length
                  ? `
                    <div class="automation-trigger-list">
                      ${triggers
                        .map((trigger, index) =>
                          this.triggerRow(trigger, index)
                        )
                        .join("")}
                    </div>
                  `
                  : this.emptyState(
                      "لا توجد Event Triggers مفعلة حالياً."
                    )
              }
            </div>

            <div class="module-panel">
              ${this.sectionTitle(
                "Biometric Approval Queue",
                "طلبات الاعتماد القادمة من الأتمتة والأفكار والمخاطر والمشاريع."
              )}

              ${
                approvals.length
                  ? `
                    <div class="automation-approval-list">
                      ${approvals
                        .filter(
                          approval =>
                            approval.status ===
                            this.approvalStatus.PENDING
                        )
                        .map((approval, index) =>
                          this.approvalRow(
                            approval,
                            index
                          )
                        )
                        .join("") ||
                        this.emptyState(
                          "لا توجد طلبات اعتماد معلقة حالياً."
                        )
                      }
                    </div>
                  `
                  : this.emptyState(
                      "لا توجد طلبات اعتماد معلقة حالياً."
                    )
              }
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "Execution History",
              "آخر عمليات الأتمتة المسجلة في Store V2.2."
            )}

            ${this.renderExecutionHistory(
              automation.executionHistory
            )}
          </div>

          ${
            automation.roadmap.length
              ? `
                <div class="module-panel">
                  ${this.sectionTitle(
                    "Biometric Automation Roadmap",
                    "تطور التشغيل من الإجراءات اليدوية إلى الأتمتة الذكية بإشراف بشري."
                  )}

                  <div class="automation-roadmap">
                    ${automation.roadmap
                      .map((item, index) => `
                        <div>
                          <b>${index + 1}</b>

                          <strong>
                            ${this.escapeHtml(
                              item?.title ||
                              item?.name ||
                              ""
                            )}
                          </strong>

                          <span>
                            ${this.escapeHtml(
                              item?.desc ||
                              item?.description ||
                              ""
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

          <div class="module-wide-grid">
            <div class="module-panel">
              ${this.sectionTitle(
                "Next Best Actions",
                "الإجراءات المقترحة لتحسين الأتمتة ومعالجة العمليات المعلقة."
              )}

              ${this.renderExecutiveList(
                nextActions
              )}
            </div>

            <div class="module-panel">
              ${this.sectionTitle(
                "Biometric Automation Engine Status",
                "الحالة التقنية لمحرك أتمتة العمليات."
              )}

              <div class="automation-engine-status">
                <strong>
                  AIW Biometric Automation Engine
                </strong>

                <p>
                  المحرك
                  ${
                    automation.settings.engineEnabled
                      ? "مفعّل"
                      : "غير مفعّل"
                  }
                  ويعمل وفق إعدادات Human-in-the-Loop
                  ${
                    automation.settings.humanApprovalRequired
                      ? "المفعلة"
                      : "غير المفعلة"
                  }.
                </p>

                <div class="aiw-progress">
                  <div
                    style="width:${this.clamp(
                      averageAutomation,
                      0,
                      100
                    )}%"
                  ></div>
                </div>

                <small>
                  Current biometric automation capability:
                  ${averageAutomation}%
                </small>
              </div>
            </div>
          </div>
        </section>
      `;

      this.bindActionEvents();
      this.bindAutomaticSync();
    } finally {
      this._isRendering = false;
    }
  },

  /* =======================================================
     UI Renderers
  ======================================================= */

  workflowCard(workflow) {
    const level = this.normalizePercent(
      workflow.automation
    );

    return `
      <article
        class="automation-workflow-card"
        data-workflow-id="${this.escapeAttribute(
          workflow.id
        )}"
      >
        <div class="automation-workflow-head">
          <div>
            ${this.escapeHtml(workflow.icon)}
          </div>

          <span
            class="automation-status-badge ${this.workflowStatusClass(
              workflow.status
            )}"
          >
            ${this.escapeHtml(
              this.workflowStatusLabel(
                workflow.status
              )
            )}
          </span>
        </div>

        <h3>
          ${this.escapeHtml(workflow.title)}
        </h3>

        <p>
          ${this.escapeHtml(workflow.trigger)}
        </p>

        <div class="automation-steps">
          ${workflow.steps
            .map((step, index) => `
              <span>
                ${index + 1}.
                ${this.escapeHtml(step)}
              </span>
            `)
            .join("")}
        </div>

        <div class="automation-meta">
          <span>
            المالك:
            ${this.escapeHtml(workflow.owner)}
          </span>

          <span>
            ${level}% أتمتة
          </span>
        </div>

        <div class="aiw-progress">
          <div style="width:${level}%"></div>
        </div>

        <div class="automation-workflow-actions">
          <button
            type="button"
            class="automation-action-button primary"
            data-automation-action="run-workflow"
            data-workflow-id="${this.escapeAttribute(
              workflow.id
            )}"
            ${
              workflow.status !== this.workflowStatus.ACTIVE
                ? "disabled"
                : ""
            }
          >
            ▶️ تشغيل المسار
          </button>

          <button
            type="button"
            class="automation-action-button secondary"
            data-automation-action="workflow-details"
            data-workflow-id="${this.escapeAttribute(
              workflow.id
            )}"
          >
            عرض التفاصيل
          </button>
        </div>
      </article>
    `;
  },

  triggerRow(trigger, index) {
    return `
      <div>
        <b>
          ${String(index + 1).padStart(2, "0")}
        </b>

        <strong>
          ${this.escapeHtml(trigger.code)}
        </strong>

        <span>
          ${this.escapeHtml(trigger.title)}
        </span>

        <p>
          ${this.escapeHtml(trigger.action)}
        </p>
      </div>
    `;
  },

  approvalRow(approval, index) {
    return `
      <div
        class="automation-approval-row"
        data-approval-id="${this.escapeAttribute(
          approval.id
        )}"
      >
        <b>
          ${String(index + 1).padStart(2, "0")}
        </b>

        <div>
          <strong>
            ${this.escapeHtml(approval.title)}
          </strong>

          <span>
            ${this.escapeHtml(approval.owner)}
          </span>

          <small>
            ${this.escapeHtml(
              approval.statusLabel
            )}
            · ${this.escapeHtml(
              approval.source
            )}
          </small>
        </div>

        <em class="${this.riskClass(approval.risk)}">
          ${this.escapeHtml(approval.risk)}
        </em>

        <div class="automation-approval-actions">
          <button
            type="button"
            class="automation-mini-action approve"
            data-automation-action="approve-item"
            data-approval-id="${this.escapeAttribute(
              approval.id
            )}"
            data-source="${this.escapeAttribute(
              approval.source
            )}"
            data-source-id="${this.escapeAttribute(
              approval.sourceId ?? ""
            )}"
          >
            اعتماد
          </button>

          <button
            type="button"
            class="automation-mini-action reject"
            data-automation-action="reject-item"
            data-approval-id="${this.escapeAttribute(
              approval.id
            )}"
            data-source="${this.escapeAttribute(
              approval.source
            )}"
            data-source-id="${this.escapeAttribute(
              approval.sourceId ?? ""
            )}"
          >
            رفض
          </button>
        </div>
      </div>
    `;
  },

  renderExecutionHistory(history = []) {
    if (!history.length) {
      return this.emptyState(
        "لا يوجد سجل تنفيذ حالياً."
      );
    }

    const rows = [...history]
      .sort((a, b) => {
        const timeA = new Date(
          a.startedAt ||
          a.completedAt ||
          0
        ).getTime();

        const timeB = new Date(
          b.startedAt ||
          b.completedAt ||
          0
        ).getTime();

        return timeB - timeA;
      })
      .slice(0, this.config.maximumHistoryRows);

    return `
      <div class="automation-history-list">
        ${rows
          .map(entry => `
            <div class="automation-history-row">
              <span
                class="automation-execution-status ${this.executionStatusClass(
                  entry.status
                )}"
              >
                ${this.executionStatusIcon(
                  entry.status
                )}
              </span>

              <div>
                <strong>
                  ${this.escapeHtml(
                    entry.workflowTitle
                  )}
                </strong>

                <small>
                  ${this.escapeHtml(
                    entry.triggerCode ||
                    entry.sourceType ||
                    "Manual"
                  )}
                  · ${this.escapeHtml(
                    entry.actor
                  )}
                </small>
              </div>

              <div class="automation-history-meta">
                <span>
                  ${this.escapeHtml(
                    this.executionStatusLabel(
                      entry.status
                    )
                  )}
                </span>

                <small>
                  ${this.escapeHtml(
                    this.formatDateTime(
                      entry.startedAt,
                      "غير محدد"
                    )
                  )}
                </small>
              </div>
            </div>
          `)
          .join("")}
      </div>
    `;
  },

  renderExecutiveList(items = []) {
    if (!Array.isArray(items) || !items.length) {
      return this.emptyState(
        "لا توجد إجراءات مقترحة حالياً."
      );
    }

    return `
      <div class="executive-list">
        ${items
          .slice(0, 6)
          .map((item, index) => `
            <div class="executive-item">
              <strong>
                ${String(index + 1).padStart(2, "0")}
              </strong>

              <span>
                ${this.escapeHtml(
                  this.actionText(item)
                )}
              </span>
            </div>
          `)
          .join("")}
      </div>
    `;
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
        <span>${this.escapeHtml(label)}</span>
        <strong>${this.escapeHtml(value)}</strong>
        <small>${this.escapeHtml(note)}</small>
      </div>
    `;
  },

  sectionTitle(title, description) {
    if (
      typeof window.AIW?.Widgets?.sectionTitle ===
      "function"
    ) {
      return window.AIW.Widgets.sectionTitle(
        title,
        description
      );
    }

    return `
      <div class="module-section-title compact">
        <h2>${this.escapeHtml(title)}</h2>
        <p>${this.escapeHtml(description)}</p>
      </div>
    `;
  },

  fallbackHero(
    workflowCount,
    activeCount,
    averageAutomation,
    executionCount
  ) {
    return `
      <div class="module-hero">
        <span class="module-kicker">
          Biometric Automation · Workflow Engine
        </span>

        <h1>
          مركز أتمتة العمليات البيومترية
        </h1>

        <p>
          إدارة مسارات العمل والاعتمادات وسجل التنفيذ
          ضمن Store V2.2 مع المراجعة البشرية للقرارات الحساسة.
        </p>

        <div class="aiw-chip-row">
          <span class="aiw-chip">
            🔁 ${workflowCount} Workflows
          </span>

          <span class="aiw-chip">
            ✅ ${activeCount} نشطة
          </span>

          <span class="aiw-chip">
            📊 ${averageAutomation}% أتمتة
          </span>

          <span class="aiw-chip">
            🧾 ${executionCount} عمليات
          </span>
        </div>
      </div>
    `;
  },

  emptyState(message) {
    return `
      <div class="module-empty">
        ${this.escapeHtml(message)}
      </div>
    `;
  },

  /* =======================================================
     UI Actions
  ======================================================= */

  bindActionEvents() {
    if (this._eventsBound || !this._container) return;

    this._eventsBound = true;

    this._container.addEventListener(
      "click",
      event => {
        const button = event.target.closest(
          "[data-automation-action]"
        );

        if (
          !button ||
          !this._container?.contains(button)
        ) {
          return;
        }

        const action =
          button.dataset.automationAction;

        if (action === "run-workflow") {
          this.confirmWorkflowRun(
            button.dataset.workflowId
          );
          return;
        }

        if (action === "workflow-details") {
          this.openWorkflowDetails(
            button.dataset.workflowId
          );
          return;
        }

        if (
          action === "approve-item" ||
          action === "reject-item"
        ) {
          this.confirmApprovalAction({
            action,
            approvalId:
              button.dataset.approvalId,
            source:
              button.dataset.source,
            sourceId:
              button.dataset.sourceId
          });
        }
      }
    );
  },

  confirmWorkflowRun(workflowId) {
    const workflow = this.getAutomation()
      .workflows
      .find(
        item =>
          String(item.id) ===
          String(workflowId)
      );

    if (!workflow) {
      this.showToast(
        "لم يتم العثور على مسار العمل.",
        "error"
      );
      return;
    }

    this.openConfirmation({
      type: "run-workflow",
      workflowId,
      icon: "▶️",
      title: "تشغيل مسار العمل",
      message:
        `سيتم تشغيل مسار «${workflow.title}». ` +
        (
          workflow.humanApprovalRequired
            ? "هذا المسار يتطلب اعتماداً بشرياً قبل الإغلاق."
            : "سيتم تسجيل نتيجة التنفيذ تلقائياً."
        ),
      confirmText: "تشغيل المسار",
      noteLabel: "ملاحظات التنفيذ"
    });
  },

  confirmApprovalAction(config = {}) {
    const approval = this.findApproval(
      config.approvalId,
      config.source,
      config.sourceId
    );

    if (!approval) {
      this.showToast(
        "لم يتم العثور على طلب الاعتماد.",
        "error"
      );
      return;
    }

    const isReject =
      config.action === "reject-item";

    this.openConfirmation({
      type: config.action,
      approval,
      icon: isReject ? "⛔" : "✅",
      title:
        isReject
          ? "رفض طلب الاعتماد"
          : "اعتماد الطلب",
      message:
        `سيتم ${isReject ? "رفض" : "اعتماد"} الطلب «${approval.title}».`,
      confirmText:
        isReject
          ? "تأكيد الرفض"
          : "تأكيد الاعتماد",
      noteLabel:
        isReject
          ? "سبب الرفض"
          : "ملاحظات الاعتماد",
      requiredNotes: isReject,
      danger: isReject
    });
  },

  findApproval(approvalId, source, sourceId) {
    const approvals = this.getApprovalQueue(
      this.getAutomation().approvals
    );

    return (
      approvals.find(
        approval =>
          String(approval.id) ===
          String(approvalId)
      ) ||
      approvals.find(
        approval =>
          String(approval.source) ===
            String(source) &&
          String(approval.sourceId) ===
            String(sourceId)
      ) ||
      null
    );
  },

  executePendingAction(notes = "") {
    if (!this._pendingAction || this._isExecuting) return;

    if (
      this._pendingAction.requiredNotes &&
      !notes.trim()
    ) {
      this.showToast(
        "يرجى إدخال السبب قبل المتابعة.",
        "error"
      );
      return;
    }

    this._isExecuting = true;

    try {
      let result = null;

      if (
        this._pendingAction.type ===
        "run-workflow"
      ) {
        result = this.runWorkflow(
          this._pendingAction.workflowId,
          {
            actor: this.config.actor,
            notes
          }
        );
      }

      if (
        this._pendingAction.type ===
        "approve-item"
      ) {
        result = this.approveQueueItem(
          this._pendingAction.approval,
          notes
        );
      }

      if (
        this._pendingAction.type ===
        "reject-item"
      ) {
        result = this.rejectQueueItem(
          this._pendingAction.approval,
          notes
        );
      }

      if (!result?.success) {
        this.showToast(
          result?.message ||
          "تعذر تنفيذ العملية.",
          "error"
        );
        return;
      }

      const actionType =
        this._pendingAction.type;

      this.closeConfirmation();

      if (actionType === "run-workflow") {
        this.showToast(
          result.waitingApproval
            ? "تم تشغيل المسار وتحويله للاعتماد البشري."
            : "تم تشغيل المسار وتسجيل النتيجة بنجاح.",
          "success"
        );
      }

      if (actionType === "approve-item") {
        this.showToast(
          "تم اعتماد الطلب بنجاح.",
          "success"
        );
      }

      if (actionType === "reject-item") {
        this.showToast(
          "تم رفض الطلب وتسجيل السبب.",
          "success"
        );
      }

      this.scheduleRefresh();
    } finally {
      this._isExecuting = false;
    }
  },

  /* =======================================================
     Workflow Details Modal
  ======================================================= */

  openWorkflowDetails(workflowId) {
    const workflow = this.getAutomation()
      .workflows
      .find(
        item =>
          String(item.id) ===
          String(workflowId)
      );

    if (!workflow) {
      this.showToast(
        "لم يتم العثور على مسار العمل.",
        "error"
      );
      return;
    }

    this.closeWorkflowDetails();

    const history = this.getAutomation()
      .executionHistory
      .filter(
        entry =>
          String(entry.workflowId) ===
          String(workflow.id)
      );

    const modal =
      document.createElement("div");

    modal.className =
      "automation-details-overlay";

    modal.innerHTML = `
      <div
        class="automation-details-dialog"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          class="automation-details-close"
          data-automation-details-close
        >
          ×
        </button>

        <div class="automation-details-heading">
          <div>
            ${this.escapeHtml(workflow.icon)}
          </div>

          <span>
            ${this.escapeHtml(
              workflow.triggerCode ||
              "WORKFLOW"
            )}
          </span>

          <h3>
            ${this.escapeHtml(workflow.title)}
          </h3>

          <p>
            ${this.escapeHtml(workflow.trigger)}
          </p>
        </div>

        <div class="automation-details-kpis">
          <div>
            <small>الأتمتة</small>
            <strong>
              ${workflow.automation}%
            </strong>
          </div>

          <div>
            <small>التنفيذات</small>
            <strong>
              ${history.length}
            </strong>
          </div>

          <div>
            <small>المخاطر</small>
            <strong>
              ${this.escapeHtml(workflow.riskLevel)}
            </strong>
          </div>

          <div>
            <small>Human Review</small>
            <strong>
              ${
                workflow.humanApprovalRequired
                  ? "مطلوب"
                  : "غير مطلوب"
              }
            </strong>
          </div>
        </div>

        <div class="automation-details-section">
          <strong>خطوات المسار</strong>

          <div class="automation-details-steps">
            ${workflow.steps
              .map((step, index) => `
                <div>
                  <b>${index + 1}</b>
                  <span>
                    ${this.escapeHtml(step)}
                  </span>
                </div>
              `)
              .join("") ||
              this.emptyState(
                "لا توجد خطوات مسجلة."
              )
            }
          </div>
        </div>

        <div class="automation-details-section">
          <strong>المالك والربط</strong>

          <p>
            المالك:
            ${this.escapeHtml(workflow.owner)}
          </p>

          <p>
            الوحدات المرتبطة:
            ${this.escapeHtml(
              workflow.linkedModules.join("، ") ||
              "غير محددة"
            )}
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this._detailsModal = modal;

    modal.addEventListener(
      "click",
      event => {
        if (
          event.target === modal ||
          event.target.closest(
            "[data-automation-details-close]"
          )
        ) {
          this.closeWorkflowDetails();
        }
      }
    );

    requestAnimationFrame(() => {
      modal.classList.add("visible");
    });
  },

  closeWorkflowDetails() {
    if (!this._detailsModal) return;

    const modal = this._detailsModal;

    modal.classList.remove("visible");

    window.setTimeout(() => {
      modal.remove();
    }, 180);

    this._detailsModal = null;
  },

  /* =======================================================
     Confirmation Modal
  ======================================================= */

  openConfirmation(config = {}) {
    this.closeConfirmation();

    this._pendingAction = {
      ...config
    };

    const modal =
      document.createElement("div");

    modal.className =
      "automation-confirmation-overlay";

    modal.innerHTML = `
      <div
        class="automation-confirmation-dialog"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          class="automation-confirmation-close"
          data-automation-confirmation-close
        >
          ×
        </button>

        <div class="automation-confirmation-icon">
          ${this.escapeHtml(
            config.icon || "⚙️"
          )}
        </div>

        <h3>
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

        <label class="automation-confirmation-field">
          <span>
            ${this.escapeHtml(
              config.noteLabel ||
              "ملاحظات"
            )}

            ${
              config.requiredNotes
                ? "<em>مطلوب</em>"
                : ""
            }
          </span>

          <textarea
            rows="3"
            data-automation-confirmation-notes
            placeholder="${
              config.requiredNotes
                ? "أدخل السبب قبل المتابعة..."
                : "إضافة ملاحظة اختيارية..."
            }"
          ></textarea>
        </label>

        <div class="automation-confirmation-actions">
          <button
            type="button"
            class="automation-action-button secondary"
            data-automation-confirmation-close
          >
            إلغاء
          </button>

          <button
            type="button"
            class="automation-action-button ${
              config.danger
                ? "danger"
                : "primary"
            }"
            data-automation-confirmation-submit
          >
            ${this.escapeHtml(
              config.confirmText ||
              "تأكيد"
            )}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this._confirmationModal = modal;

    modal.addEventListener(
      "click",
      event => {
        if (
          event.target === modal ||
          event.target.closest(
            "[data-automation-confirmation-close]"
          )
        ) {
          this.closeConfirmation();
          return;
        }

        if (
          event.target.closest(
            "[data-automation-confirmation-submit]"
          )
        ) {
          const notes =
            modal
              .querySelector(
                "[data-automation-confirmation-notes]"
              )
              ?.value?.trim() ||
            "";

          this.executePendingAction(notes);
        }
      }
    );

    requestAnimationFrame(() => {
      modal.classList.add("visible");

      modal
        .querySelector(
          "[data-automation-confirmation-notes]"
        )
        ?.focus();
    });
  },

  closeConfirmation() {
    if (!this._confirmationModal) {
      this._pendingAction = null;
      return;
    }

    const modal = this._confirmationModal;

    modal.classList.remove("visible");

    window.setTimeout(() => {
      modal.remove();
    }, 180);

    this._confirmationModal = null;
    this._pendingAction = null;
  },

  /* =======================================================
     Toast
  ======================================================= */

  showToast(message, type = "success") {
    document
      .querySelector(
        ".automation-workflow-toast"
      )
      ?.remove();

    const toast =
      document.createElement("div");

    toast.className =
      `automation-workflow-toast ${type}`;

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
    window.clearTimeout(
      this._refreshTimer
    );

    this._refreshTimer =
      window.setTimeout(() => {
        if (!this._container?.isConnected) {
          return;
        }

        this.render(this._container);
      }, this.config.refreshDelay);
  },

  bindAutomaticSync() {
    if (this._syncBound) return;

    this._syncBound = true;

    const refresh =
      () => this.scheduleRefresh();

    const events = [
      "aiw:dataChanged",
      "aiw:dataUpdated",
      "aiw:dataImported",
      "aiw:dataRestored",
      "aiw:dataReset",
      "aiw:storeChanged",

      "aiw:automationChanged",
      "aiw:automationUpdated",
      "aiw:workflowCreated",
      "aiw:workflowUpdated",
      "aiw:workflowExecuted",
      "aiw:executionHistoryUpdated",

      "aiw:ideaSubmittedForApproval",
      "aiw:ideaApproved",
      "aiw:ideaRejected",
      "aiw:ideaConvertedToProject",

      "aiw:projectUpdated",
      "aiw:projectCreatedFromIdea",

      "aiw:governanceChanged",
      "aiw:governanceUpdated",
      "aiw:risksChanged",
      "aiw:risksUpdated",

      "aiw:decisionChanged",
      "aiw:decisionUpdated",

      "aiw:kpisChanged",
      "aiw:kpisUpdated",

      "aiw:reportsChanged",
      "aiw:reportsUpdated"
    ];

    events.forEach(eventName => {
      window.addEventListener(
        eventName,
        refresh
      );
    });

    const store = this.getStore();

    if (
      typeof store?.subscribe ===
      "function"
    ) {
      this._unsubscribeStore =
        store.subscribe(refresh);
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
          supportedKeys.includes(event.key)
        ) {
          refresh();
        }
      }
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

    this._unsubscribeStore = null;
    this._container = null;
    this._eventsBound = false;
    this._syncBound = false;

    this.closeWorkflowDetails();
    this.closeConfirmation();
  },

  /* =======================================================
     Status Presentation
  ======================================================= */

  workflowStatusLabel(status) {
    const labels = {
      [this.workflowStatus.ACTIVE]:
        "نشط",

      [this.workflowStatus.PLANNED]:
        "مخطط",

      [this.workflowStatus.ENABLING]:
        "قيد التفعيل",

      [this.workflowStatus.PAUSED]:
        "متوقف مؤقتاً",

      [this.workflowStatus.BLOCKED]:
        "متعثر",

      [this.workflowStatus.ARCHIVED]:
        "مؤرشف"
    };

    return labels[status] || "مخطط";
  },

  workflowStatusClass(status) {
    if (
      status === this.workflowStatus.ACTIVE
    ) {
      return "active";
    }

    if (
      status === this.workflowStatus.ENABLING
    ) {
      return "enabling";
    }

    if (
      [
        this.workflowStatus.PAUSED,
        this.workflowStatus.BLOCKED
      ].includes(status)
    ) {
      return "blocked";
    }

    if (
      status === this.workflowStatus.ARCHIVED
    ) {
      return "archived";
    }

    return "planned";
  },

  executionStatusLabel(status) {
    const labels = {
      [this.executionStatus.RUNNING]:
        "قيد التنفيذ",

      [this.executionStatus.COMPLETED]:
        "مكتمل",

      [this.executionStatus.FAILED]:
        "فشل",

      [this.executionStatus.CANCELLED]:
        "ملغي",

      [this.executionStatus.WAITING_APPROVAL]:
        "بانتظار الاعتماد"
    };

    return labels[status] || "قيد التنفيذ";
  },

  executionStatusIcon(status) {
    const icons = {
      [this.executionStatus.RUNNING]:
        "⏳",

      [this.executionStatus.COMPLETED]:
        "✅",

      [this.executionStatus.FAILED]:
        "⛔",

      [this.executionStatus.CANCELLED]:
        "🚫",

      [this.executionStatus.WAITING_APPROVAL]:
        "👤"
    };

    return icons[status] || "⚙️";
  },

  executionStatusClass(status) {
    if (
      status === this.executionStatus.COMPLETED
    ) {
      return "completed";
    }

    if (
      status === this.executionStatus.FAILED
    ) {
      return "failed";
    }

    if (
      status === this.executionStatus.WAITING_APPROVAL
    ) {
      return "waiting";
    }

    if (
      status === this.executionStatus.CANCELLED
    ) {
      return "cancelled";
    }

    return "running";
  },

  riskClass(level) {
    if (this.isHighRisk(level)) {
      return "red";
    }

    const value =
      this.normalizeStatus(level);

    if (
      [
        "متوسط",
        "متوسطة",
        "medium"
      ].includes(value)
    ) {
      return "orange";
    }

    return "green";
  },

  isHighRisk(level) {
    const value =
      this.normalizeStatus(level);

    return (
      value.includes("عال") ||
      [
        "high",
        "critical",
        "حرج"
      ].includes(value)
    );
  },

  isClosedStatus(status) {
    const value =
      this.normalizeStatus(status);

    return [
      "closed",
      "resolved",
      "completed",
      "approved",
      "مغلق",
      "تم-الحل",
      "مكتمل",
      "معتمد"
    ].includes(value);
  },

  actionText(item) {
    if (typeof item === "string") {
      return item;
    }

    if (item && typeof item === "object") {
      return (
        item.title ||
        item.action ||
        item.text ||
        item.recommendation ||
        "مراجعة الإجراء التشغيلي المقترح."
      );
    }

    return "مراجعة الإجراء التشغيلي المقترح.";
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
      document.createElement("style");

    style.id =
      this.config.styleId;

    style.textContent = `
      .automation-status-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 31px;
        padding: 6px 10px;
        border: 1px solid transparent;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 800;
      }

      .automation-status-badge.active {
        color: #087d3e;
        background: #e2f7ea;
        border-color: #c8efd7;
      }

      .automation-status-badge.enabling {
        color: #b75c00;
        background: #fff3d9;
        border-color: #ffe4ac;
      }

      .automation-status-badge.blocked {
        color: #b42318;
        background: #feeceb;
        border-color: #fbd3d0;
      }

      .automation-status-badge.planned,
      .automation-status-badge.archived {
        color: #475467;
        background: #f2f4f7;
        border-color: #e4e7ec;
      }

      .automation-workflow-actions {
        display: grid;
        grid-template-columns: 1.2fr 1fr;
        gap: 9px;
        margin-top: 16px;
        padding-top: 15px;
        border-top: 1px solid rgba(15, 23, 42, 0.08);
      }

      .automation-action-button {
        appearance: none;
        min-height: 42px;
        padding: 10px 13px;
        border: 0;
        border-radius: 13px;
        font: inherit;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
      }

      .automation-action-button.primary {
        color: #ffffff;
        background: #101b2f;
      }

      .automation-action-button.secondary {
        color: #344054;
        background: #f2f4f7;
        border: 1px solid #e4e7ec;
      }

      .automation-action-button.danger {
        color: #b42318;
        background: #feeceb;
        border: 1px solid #fbd3d0;
      }

      .automation-action-button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .automation-approval-row {
        grid-template-columns:
          auto minmax(0, 1fr) auto auto !important;
      }

      .automation-approval-actions {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .automation-mini-action {
        appearance: none;
        min-width: 58px;
        min-height: 29px;
        padding: 5px 8px;
        border: 0;
        border-radius: 9px;
        font: inherit;
        font-size: 10px;
        font-weight: 800;
        cursor: pointer;
      }

      .automation-mini-action.approve {
        color: #087d3e;
        background: #e2f7ea;
      }

      .automation-mini-action.reject {
        color: #b42318;
        background: #feeceb;
      }

      .automation-history-list {
        display: grid;
        gap: 10px;
      }

      .automation-history-row {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        padding: 13px 14px;
        border: 1px solid rgba(15, 23, 42, 0.07);
        border-radius: 16px;
        background: #f9fafb;
      }

      .automation-execution-status {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 13px;
        background: #edf3ff;
      }

      .automation-execution-status.completed {
        background: #e2f7ea;
      }

      .automation-execution-status.failed {
        background: #feeceb;
      }

      .automation-execution-status.waiting {
        background: #fff3d9;
      }

      .automation-history-row strong,
      .automation-history-row small {
        display: block;
      }

      .automation-history-row strong {
        color: #101828;
        font-size: 13px;
      }

      .automation-history-row small {
        margin-top: 4px;
        color: #667085;
        font-size: 10px;
      }

      .automation-history-meta {
        text-align: left;
      }

      .automation-history-meta span {
        display: block;
        color: #344054;
        font-size: 11px;
        font-weight: 800;
      }

      .automation-details-overlay,
      .automation-confirmation-overlay {
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

      .automation-details-overlay.visible,
      .automation-confirmation-overlay.visible {
        opacity: 1;
      }

      .automation-details-dialog,
      .automation-confirmation-dialog {
        position: relative;
        width: min(100%, 570px);
        max-height: min(86vh, 760px);
        overflow-y: auto;
        padding: 28px 22px 22px;
        border-radius: 28px;
        background: #ffffff;
        box-shadow:
          0 28px 80px rgba(15, 23, 42, 0.28);
        transform:
          translateY(12px)
          scale(0.98);
        transition: transform 0.18s ease;
      }

      .automation-details-overlay.visible
      .automation-details-dialog,
      .automation-confirmation-overlay.visible
      .automation-confirmation-dialog {
        transform:
          translateY(0)
          scale(1);
      }

      .automation-details-close,
      .automation-confirmation-close {
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

      .automation-details-heading > div,
      .automation-confirmation-icon {
        display: grid;
        place-items: center;
        width: 62px;
        height: 62px;
        margin-bottom: 16px;
        border-radius: 20px;
        font-size: 30px;
        background: #101b2f;
      }

      .automation-details-heading > span {
        color: #667085;
        font-size: 11px;
        font-weight: 800;
      }

      .automation-details-heading h3,
      .automation-confirmation-dialog h3 {
        margin: 7px 0 8px;
        color: #101828;
        font-size: 22px;
        line-height: 1.5;
      }

      .automation-details-heading p,
      .automation-confirmation-dialog > p {
        margin: 0;
        color: #667085;
        font-size: 14px;
        line-height: 1.8;
      }

      .automation-details-kpis {
        display: grid;
        grid-template-columns:
          repeat(4, minmax(0, 1fr));
        gap: 9px;
        margin-top: 20px;
      }

      .automation-details-kpis > div {
        min-width: 0;
        padding: 12px 9px;
        border-radius: 14px;
        text-align: center;
        background: #f7f8fa;
      }

      .automation-details-kpis small,
      .automation-details-kpis strong {
        display: block;
      }

      .automation-details-kpis small {
        margin-bottom: 5px;
        color: #667085;
        font-size: 10px;
      }

      .automation-details-kpis strong {
        overflow: hidden;
        color: #101828;
        font-size: 13px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .automation-details-section {
        margin-top: 20px;
        padding-top: 17px;
        border-top:
          1px solid rgba(15, 23, 42, 0.08);
      }

      .automation-details-section > strong {
        display: block;
        margin-bottom: 9px;
        color: #101828;
        font-size: 14px;
      }

      .automation-details-section > p {
        margin: 6px 0;
        color: #667085;
        font-size: 13px;
        line-height: 1.7;
      }

      .automation-details-steps {
        display: grid;
        gap: 8px;
      }

      .automation-details-steps > div {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 11px;
        border-radius: 12px;
        background: #f9fafb;
      }

      .automation-details-steps b {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 27px;
        height: 27px;
        border-radius: 50%;
        color: #ffffff;
        background: #101b2f;
        font-size: 10px;
      }

      .automation-details-steps span {
        color: #475467;
        font-size: 12px;
      }

      .automation-confirmation-field {
        display: block;
        margin-top: 20px;
      }

      .automation-confirmation-field > span {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        color: #344054;
        font-size: 13px;
        font-weight: 800;
      }

      .automation-confirmation-field em {
        padding: 3px 7px;
        border-radius: 999px;
        color: #b42318;
        background: #feeceb;
        font-size: 10px;
        font-style: normal;
      }

      .automation-confirmation-field textarea {
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

      .automation-confirmation-actions {
        display: grid;
        grid-template-columns: 1fr 1.3fr;
        gap: 10px;
        margin-top: 22px;
      }

      .automation-workflow-toast {
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

      .automation-workflow-toast.visible {
        opacity: 1;
        transform:
          translateX(50%)
          translateY(0);
      }

      .automation-workflow-toast.success {
        background: #087d3e;
      }

      .automation-workflow-toast.error {
        background: #b42318;
      }

      @media (max-width: 760px) {
        .automation-workflow-actions {
          grid-template-columns: 1fr;
        }

        .automation-approval-row {
          grid-template-columns:
            auto minmax(0, 1fr) auto !important;
        }

        .automation-approval-actions {
          grid-column: 2 / -1;
          flex-direction: row;
        }

        .automation-mini-action {
          flex: 1;
        }

        .automation-details-kpis {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .automation-confirmation-actions {
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

  average(values = []) {
    const validValues = values
      .map(value => Number(value))
      .filter(value =>
        Number.isFinite(value)
      );

    if (!validValues.length) return 0;

    return Math.round(
      validValues.reduce(
        (total, value) =>
          total + value,
        0
      ) / validValues.length
    );
  },

  clamp(value, min, max) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return min;
    }

    return Math.min(
      max,
      Math.max(min, number)
    );
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

  createId(prefix = "item") {
    return (
      `${prefix}-${Date.now()}-` +
      Math.random()
        .toString(36)
        .slice(2, 8)
    );
  },

  formatDateTime(value, fallback = "") {
    if (!value) return fallback;

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return String(value);
      }

      return date.toLocaleString("ar-AE", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      return String(value);
    }
  },

  uniqueBy(items = [], selector) {
    const seen = new Set();

    return items.filter(item => {
      const key = String(selector(item));

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
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
