/* =========================================================
   AI Work - Automation Engine V1.1
   Enterprise Workflow + Trigger + Approval Engine

   Scope:
   - AIW.Store Integration
   - Workflow Management
   - Trigger Management
   - Approval Management
   - Event Rules
   - Execution History
   - Automation Statistics
   - Cross-Module Synchronization
   - Legacy Job Compatibility
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};

  const Automation = {
    id: "automation-engine",
    version: "1.1.0",

    storageKey: "aiwAutomationJobs",

    jobs: [],
    workflows: [],
    triggers: [],
    approvals: [],
    roadmap: [],
    settings: {},
    statisticsData: {},
    executionHistory: [],

    events: {},
    rules: [],

    _initialized: false,
    _eventsBound: false,
    _defaultsRegistered: false,
    _storeUnsubscribe: null,
    _refreshTimer: null,
    _isSynchronizing: false,
    _executingJobs: new Set(),

    /* =========================================================
       INITIALIZATION
    ========================================================= */

    init() {
      if (this._initialized) {
        return this;
      }

      this._initialized = true;

      this.load();
      this.bindPlatformEvents();
      this.bindStore();
      this.registerDefaultRules();
      this.refreshStatistics();
      this.registerMetadata();

      this.emitPlatformEvent(
        "aiw:automationReady",
        {
          version: this.version,
          statistics: this.statistics()
        }
      );

      return this;
    },

    /* =========================================================
       DATA ACCESS
    ========================================================= */

    getStore() {
      return window.AIW?.Store || null;
    },

    getData() {
      const store = this.getStore();

      try {
        if (
          store &&
          typeof store.getState === "function"
        ) {
          return store.getState();
        }

        if (
          store &&
          typeof store.getData === "function"
        ) {
          return store.getData();
        }
      } catch (error) {
        console.warn(
          "[AIW.Automation] Unable to read Store data:",
          error
        );
      }

      return window.AIW?.Data || {};
    },

    getAutomationData() {
      const data = this.getData();

      if (
        data.automation &&
        typeof data.automation === "object" &&
        !Array.isArray(data.automation)
      ) {
        return data.automation;
      }

      if (Array.isArray(data.automation)) {
        return {
          workflows: data.automation,
          triggers: [],
          approvals: [],
          roadmap: [],
          settings: {},
          statistics: {},
          executionHistory: []
        };
      }

      return {
        workflows: [],
        triggers: [],
        approvals: [],
        roadmap: [],
        settings: {},
        statistics: {},
        executionHistory: []
      };
    },

    /* =========================================================
       GENERAL HELPERS
    ========================================================= */

    clone(value) {
      if (value === undefined) {
        return undefined;
      }

      try {
        return structuredClone(value);
      } catch (error) {
        try {
          return JSON.parse(
            JSON.stringify(value)
          );
        } catch (cloneError) {
          return value;
        }
      }
    },

    now() {
      return new Date().toISOString();
    },

    id(prefix = "automation") {
      return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;
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

    normalizeText(value) {
      return String(value || "")
        .trim()
        .toLowerCase();
    },

    normalizeEventName(value) {
      return String(value || "")
        .trim()
        .replace(/\s+/g, "_")
        .replace(/-/g, "_")
        .toUpperCase();
    },

    isPlainObject(value) {
      return Boolean(
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      );
    },

    /* =========================================================
       LOAD AND SAVE
    ========================================================= */

    load() {
      const automationData =
        this.getAutomationData();

      this.workflows = this.normalizeRecords(
        automationData.workflows,
        "workflow"
      );

      this.triggers = this.normalizeRecords(
        automationData.triggers,
        "trigger"
      );

      this.approvals = this.normalizeRecords(
        automationData.approvals,
        "approval"
      );

      this.roadmap = this.toArray(
        automationData.roadmap
      );

      this.settings = this.isPlainObject(
        automationData.settings
      )
        ? this.clone(automationData.settings)
        : {};

      this.statisticsData = this.isPlainObject(
        automationData.statistics
      )
        ? this.clone(automationData.statistics)
        : {};

      this.executionHistory = this.toArray(
        automationData.executionHistory ||
        automationData.history
      );

      /*
       * Legacy compatibility:
       * Import jobs saved by Automation Engine V1.0.
       */
      const legacyJobs =
        this.loadLegacyJobs();

      if (
        !this.workflows.length &&
        legacyJobs.length
      ) {
        this.workflows =
          this.normalizeRecords(
            legacyJobs,
            "workflow"
          );

        this.syncToStore({
          eventName:
            "aiw:automationMigrated",
          backup: false
        });
      }

      this.jobs = this.workflows;

      return this.getState();
    },

    loadLegacyJobs() {
      try {
        const raw =
          window.localStorage.getItem(
            this.storageKey
          );

        if (!raw) {
          return [];
        }

        const parsed = JSON.parse(raw);

        return Array.isArray(parsed)
          ? parsed
          : [];
      } catch (error) {
        console.warn(
          "[AIW.Automation] Legacy jobs could not be loaded:",
          error
        );

        return [];
      }
    },

    save(options = {}) {
      return this.syncToStore({
        eventName:
          options.eventName ||
          "aiw:automationChanged",

        backup:
          options.backup !== false,

        emit:
          options.emit !== false
      });
    },

    syncToStore(options = {}) {
      if (this._isSynchronizing) {
        return this.getState();
      }

      const store = this.getStore();

      const automationState = {
        workflows: this.clone(
          this.workflows
        ),
        triggers: this.clone(
          this.triggers
        ),
        approvals: this.clone(
          this.approvals
        ),
        roadmap: this.clone(
          this.roadmap
        ),
        settings: this.clone(
          this.settings
        ),
        statistics: this.clone(
          this.refreshStatistics(false)
        ),
        executionHistory: this.clone(
          this.executionHistory.slice(0, 200)
        )
      };

      this._isSynchronizing = true;

      try {
        if (
          store &&
          typeof store.set === "function"
        ) {
          store.set(
            "automation",
            automationState,
            {
              eventName:
                options.eventName ||
                "aiw:automationChanged",

              backup:
                options.backup !== false,

              notify:
                options.notify !== false
            }
          );
        } else if (
          store &&
          typeof store.patch === "function"
        ) {
          store.patch(
            {
              automation:
                automationState
            },
            {
              eventName:
                options.eventName ||
                "aiw:automationChanged",

              backup:
                options.backup !== false,

              notify:
                options.notify !== false
            }
          );
        } else {
          const data = this.getData();

          data.automation =
            automationState;

          window.AIW.Data = data;

          try {
            window.localStorage.setItem(
              this.storageKey,
              JSON.stringify(
                automationState.workflows
              )
            );
          } catch (error) {
            console.warn(
              "[AIW.Automation] Local fallback save failed:",
              error
            );
          }
        }
      } catch (error) {
        console.error(
          "[AIW.Automation] Store synchronization failed:",
          error
        );
      } finally {
        this._isSynchronizing = false;
      }

      this.jobs = this.workflows;

      if (options.emit !== false) {
        this.emitPlatformEvent(
          options.eventName ||
            "aiw:automationChanged",
          this.getState()
        );
      }

      return this.getState();
    },

    normalizeRecords(records, type) {
      return this.toArray(records).map(
        record =>
          this.normalizeRecord(
            record,
            type
          )
      );
    },

    normalizeRecord(record = {}, type) {
      const currentTime = this.now();

      const title =
        record.title ||
        record.name ||
        this.getDefaultTitle(type);

      return {
        id:
          record.id ||
          this.id(type),

        title,
        name:
          record.name ||
          title,

        type:
          record.type ||
          type,

        enabled:
          record.enabled !== false,

        status:
          record.status ||
          this.getDefaultStatus(type),

        createdAt:
          record.createdAt ||
          currentTime,

        updatedAt:
          record.updatedAt ||
          currentTime,

        deletedAt:
          record.deletedAt ||
          null,

        ...this.clone(record)
      };
    },

    getDefaultTitle(type) {
      const titles = {
        workflow: "تدفق عمل جديد",
        trigger: "محفز جديد",
        approval: "طلب اعتماد جديد"
      };

      return titles[type] || "عنصر أتمتة";
    },

    getDefaultStatus(type) {
      if (type === "approval") {
        return "pending";
      }

      return "waiting";
    },

    /* =========================================================
       STATE
    ========================================================= */

    getState() {
      return {
        version: this.version,
        workflows: this.clone(
          this.workflows
        ),
        triggers: this.clone(
          this.triggers
        ),
        approvals: this.clone(
          this.approvals
        ),
        roadmap: this.clone(
          this.roadmap
        ),
        settings: this.clone(
          this.settings
        ),
        statistics: this.statistics(),
        executionHistory: this.clone(
          this.executionHistory
        )
      };
    },

    refreshFromStore() {
      if (this._isSynchronizing) {
        return this.getState();
      }

      const previousState =
        JSON.stringify({
          workflows: this.workflows,
          triggers: this.triggers,
          approvals: this.approvals,
          roadmap: this.roadmap,
          settings: this.settings
        });

      const automationData =
        this.getAutomationData();

      const nextState =
        JSON.stringify({
          workflows:
            automationData.workflows || [],
          triggers:
            automationData.triggers || [],
          approvals:
            automationData.approvals || [],
          roadmap:
            automationData.roadmap || [],
          settings:
            automationData.settings || {}
        });

      if (previousState === nextState) {
        return this.getState();
      }

      this.load();
      this.refreshStatistics(false);

      this.emitPlatformEvent(
        "aiw:automationRefreshed",
        this.getState()
      );

      return this.getState();
    },

    /* =========================================================
       INTERNAL EVENT ENGINE
    ========================================================= */

    on(eventName, callback, options = {}) {
      if (
        !eventName ||
        typeof callback !== "function"
      ) {
        return () => {};
      }

      const normalizedEvent =
        this.normalizeEventName(eventName);

      if (!this.events[normalizedEvent]) {
        this.events[normalizedEvent] =
          [];
      }

      const listener = {
        id:
          options.id ||
          this.id("listener"),

        callback,

        once:
          options.once === true,

        priority:
          Number(options.priority) || 0
      };

      this.events[normalizedEvent].push(
        listener
      );

      this.events[normalizedEvent].sort(
        (a, b) =>
          b.priority - a.priority
      );

      return () => {
        this.off(
          normalizedEvent,
          listener.id
        );
      };
    },

    once(eventName, callback) {
      return this.on(
        eventName,
        callback,
        {
          once: true
        }
      );
    },

    off(eventName, listenerOrCallback) {
      const normalizedEvent =
        this.normalizeEventName(eventName);

      if (!this.events[normalizedEvent]) {
        return false;
      }

      const previousLength =
        this.events[normalizedEvent].length;

      this.events[normalizedEvent] =
        this.events[normalizedEvent].filter(
          listener =>
            listener.id !==
              listenerOrCallback &&
            listener.callback !==
              listenerOrCallback
        );

      return (
        previousLength !==
        this.events[normalizedEvent].length
      );
    },

    async trigger(eventName, payload = {}) {
      const normalizedEvent =
        this.normalizeEventName(eventName);

      const listeners = [
        ...(this.events[normalizedEvent] ||
          [])
      ];

      const results = [];

      for (const listener of listeners) {
        try {
          const result =
            await listener.callback(
              this.clone(payload),
              {
                eventName:
                  normalizedEvent,
                automation: this
              }
            );

          results.push({
            listenerId: listener.id,
            success: true,
            result
          });

          if (listener.once) {
            this.off(
              normalizedEvent,
              listener.id
            );
          }
        } catch (error) {
          console.error(
            `[AIW.Automation] Event listener failed for "${normalizedEvent}":`,
            error
          );

          results.push({
            listenerId: listener.id,
            success: false,
            error:
              error?.message ||
              String(error)
          });
        }
      }

      await this.processTriggers(
        normalizedEvent,
        payload
      );

      return results;
    },

    /* =========================================================
       WORKFLOWS
    ========================================================= */

    createWorkflow(workflow = {}) {
      const record =
        this.normalizeRecord(
          {
            status: "waiting",
            trigger:
              workflow.trigger || "",
            action:
              workflow.action || "",
            steps: this.toArray(
              workflow.steps
            ),
            runCount:
              Number(workflow.runCount) ||
              0,
            lastRun:
              workflow.lastRun ||
              null,
            ...workflow
          },
          "workflow"
        );

      this.workflows.unshift(record);
      this.jobs = this.workflows;

      this.addExecutionHistory({
        type: "workflow-created",
        workflowId: record.id,
        title: record.title,
        status: "completed"
      });

      this.save({
        eventName:
          "aiw:workflowCreated"
      });

      this.emitPlatformEvent(
        "aiw:workflowCreated",
        {
          workflow:
            this.clone(record)
        }
      );

      return this.clone(record);
    },

    createJob(job = {}) {
      return this.createWorkflow(job);
    },

    updateWorkflow(id, updates = {}) {
      let updatedWorkflow = null;

      this.workflows =
        this.workflows.map(workflow => {
          if (
            String(workflow.id) !==
            String(id)
          ) {
            return workflow;
          }

          updatedWorkflow = {
            ...workflow,
            ...this.clone(updates),
            id: workflow.id,
            updatedAt: this.now()
          };

          return updatedWorkflow;
        });

      if (!updatedWorkflow) {
        return null;
      }

      this.jobs = this.workflows;

      this.save({
        eventName:
          "aiw:workflowUpdated"
      });

      this.emitPlatformEvent(
        "aiw:workflowUpdated",
        {
          workflow:
            this.clone(updatedWorkflow)
        }
      );

      return this.clone(
        updatedWorkflow
      );
    },

    updateJob(id, updates = {}) {
      return this.updateWorkflow(
        id,
        updates
      );
    },

    deleteWorkflow(
      id,
      hardDelete = false
    ) {
      const workflow =
        this.workflows.find(
          item =>
            String(item.id) ===
            String(id)
        );

      if (!workflow) {
        return false;
      }

      if (hardDelete) {
        this.workflows =
          this.workflows.filter(
            item =>
              String(item.id) !==
              String(id)
          );
      } else {
        this.workflows =
          this.workflows.map(item => {
            if (
              String(item.id) !==
              String(id)
            ) {
              return item;
            }

            return {
              ...item,
              enabled: false,
              status: "deleted",
              deletedAt: this.now(),
              updatedAt: this.now()
            };
          });
      }

      this.jobs = this.workflows;

      this.save({
        eventName:
          "aiw:workflowDeleted"
      });

      this.emitPlatformEvent(
        "aiw:workflowDeleted",
        {
          id,
          hardDelete
        }
      );

      return true;
    },

    deleteJob(id) {
      return this.deleteWorkflow(
        id,
        true
      );
    },

    restoreWorkflow(id) {
      let restoredWorkflow = null;

      this.workflows =
        this.workflows.map(workflow => {
          if (
            String(workflow.id) !==
            String(id)
          ) {
            return workflow;
          }

          restoredWorkflow = {
            ...workflow,
            enabled: true,
            status: "waiting",
            deletedAt: null,
            updatedAt: this.now()
          };

          return restoredWorkflow;
        });

      if (!restoredWorkflow) {
        return null;
      }

      this.save({
        eventName:
          "aiw:workflowRestored"
      });

      return this.clone(
        restoredWorkflow
      );
    },

    getWorkflow(id) {
      return (
        this.getWorkflows().find(
          workflow =>
            String(workflow.id) ===
            String(id)
        ) || null
      );
    },

    getWorkflows(options = {}) {
      let workflows =
        this.workflows.filter(
          workflow =>
            !workflow.deletedAt
        );

      if (options.enabled === true) {
        workflows =
          workflows.filter(
            workflow =>
              workflow.enabled !== false
          );
      }

      if (options.status) {
        const status =
          this.normalizeText(
            options.status
          );

        workflows =
          workflows.filter(
            workflow =>
              this.normalizeText(
                workflow.status
              ) === status
          );
      }

      return this.clone(workflows);
    },

    getJobs() {
      return this.getWorkflows();
    },

    getEnabledWorkflows() {
      return this.getWorkflows({
        enabled: true
      });
    },

    getEnabledJobs() {
      return this.getEnabledWorkflows();
    },

    enableWorkflow(id) {
      return this.updateWorkflow(id, {
        enabled: true,
        status: "waiting"
      });
    },

    disableWorkflow(id) {
      return this.updateWorkflow(id, {
        enabled: false,
        status: "disabled"
      });
    },

    async runWorkflow(
      id,
      payload = {},
      options = {}
    ) {
      const workflow =
        this.workflows.find(
          item =>
            String(item.id) ===
            String(id) &&
            !item.deletedAt
        );

      if (!workflow) {
        return null;
      }

      if (
        workflow.enabled === false &&
        options.force !== true
      ) {
        return {
          success: false,
          reason: "disabled",
          workflow:
            this.clone(workflow)
        };
      }

      if (this._executingJobs.has(id)) {
        return {
          success: false,
          reason:
            "already-running",
          workflow:
            this.clone(workflow)
        };
      }

      this._executingJobs.add(id);

      const startedAt = this.now();

      this.updateWorkflowInMemory(id, {
        status: "running",
        lastStartedAt: startedAt
      });

      const execution = {
        id: this.id("execution"),
        workflowId: workflow.id,
        workflowTitle:
          workflow.title ||
          workflow.name,
        trigger:
          options.trigger ||
          workflow.trigger ||
          "manual",
        payload:
          this.clone(payload),
        startedAt,
        completedAt: null,
        status: "running",
        steps: []
      };

      try {
        const stepResults =
          await this.executeWorkflowSteps(
            workflow,
            payload,
            execution
          );

        const completedAt = this.now();

        const updatedWorkflow =
          this.updateWorkflowInMemory(
            id,
            {
              status: "completed",
              lastRun: completedAt,
              lastCompletedAt:
                completedAt,
              runCount:
                Number(
                  workflow.runCount || 0
                ) + 1,
              lastResult: "success",
              lastError: null
            }
          );

        execution.status = "completed";
        execution.completedAt =
          completedAt;
        execution.steps =
          stepResults;

        this.addExecutionHistory(
          execution
        );

        this.save({
          eventName:
            "aiw:workflowExecuted"
        });

        await this.trigger(
          "JOB_EXECUTED",
          {
            workflow:
              this.clone(
                updatedWorkflow
              ),
            execution:
              this.clone(execution)
          }
        );

        this.emitPlatformEvent(
          "aiw:workflowExecuted",
          {
            workflow:
              this.clone(
                updatedWorkflow
              ),
            execution:
              this.clone(execution)
          }
        );

        return {
          success: true,
          workflow:
            this.clone(
              updatedWorkflow
            ),
          execution:
            this.clone(execution)
        };
      } catch (error) {
        const failedAt = this.now();

        const updatedWorkflow =
          this.updateWorkflowInMemory(
            id,
            {
              status: "failed",
              lastRun: failedAt,
              lastFailedAt: failedAt,
              runCount:
                Number(
                  workflow.runCount || 0
                ) + 1,
              lastResult: "failed",
              lastError:
                error?.message ||
                String(error)
            }
          );

        execution.status = "failed";
        execution.completedAt =
          failedAt;
        execution.error =
          error?.message ||
          String(error);

        this.addExecutionHistory(
          execution
        );

        this.save({
          eventName:
            "aiw:workflowFailed"
        });

        await this.trigger(
          "JOB_FAILED",
          {
            workflow:
              this.clone(
                updatedWorkflow
              ),
            execution:
              this.clone(execution),
            error
          }
        );

        this.emitPlatformEvent(
          "aiw:workflowFailed",
          {
            workflow:
              this.clone(
                updatedWorkflow
              ),
            execution:
              this.clone(execution)
          }
        );

        return {
          success: false,
          workflow:
            this.clone(
              updatedWorkflow
            ),
          execution:
            this.clone(execution),
          error:
            error?.message ||
            String(error)
        };
      } finally {
        this._executingJobs.delete(id);
      }
    },

    runJob(id, payload = {}) {
      return this.runWorkflow(
        id,
        payload
      );
    },

    updateWorkflowInMemory(
      id,
      updates = {}
    ) {
      let updatedWorkflow = null;

      this.workflows =
        this.workflows.map(workflow => {
          if (
            String(workflow.id) !==
            String(id)
          ) {
            return workflow;
          }

          updatedWorkflow = {
            ...workflow,
            ...this.clone(updates),
            updatedAt: this.now()
          };

          return updatedWorkflow;
        });

      this.jobs = this.workflows;

      return updatedWorkflow;
    },

    async executeWorkflowSteps(
      workflow,
      payload,
      execution
    ) {
      const steps =
        this.toArray(workflow.steps);

      if (!steps.length) {
        const action =
          workflow.action;

        if (action) {
          const result =
            await this.executeAction(
              action,
              payload,
              {
                workflow,
                execution
              }
            );

          return [
            {
              id: this.id("step"),
              title:
                typeof action === "string"
                  ? action
                  : action.title ||
                    action.type ||
                    "Workflow Action",
              status: "completed",
              result,
              completedAt: this.now()
            }
          ];
        }

        return [];
      }

      const results = [];

      for (
        let index = 0;
        index < steps.length;
        index += 1
      ) {
        const step = steps[index];

        const normalizedStep =
          typeof step === "string"
            ? {
                title: step,
                action: step
              }
            : step;

        const stepExecution = {
          id:
            normalizedStep.id ||
            this.id("step"),
          index,
          title:
            normalizedStep.title ||
            normalizedStep.name ||
            `Step ${index + 1}`,
          status: "running",
          startedAt: this.now()
        };

        try {
          const result =
            await this.executeAction(
              normalizedStep.action ||
                normalizedStep.type ||
                normalizedStep,
              payload,
              {
                workflow,
                execution,
                step:
                  normalizedStep,
                index
              }
            );

          stepExecution.status =
            "completed";
          stepExecution.completedAt =
            this.now();
          stepExecution.result =
            result;

          results.push(stepExecution);
        } catch (error) {
          stepExecution.status =
            "failed";
          stepExecution.completedAt =
            this.now();
          stepExecution.error =
            error?.message ||
            String(error);

          results.push(stepExecution);

          if (
            normalizedStep.continueOnError !==
            true
          ) {
            throw error;
          }
        }
      }

      return results;
    },

    async executeAction(
      action,
      payload = {},
      context = {}
    ) {
      if (
        typeof action === "function"
      ) {
        return action(
          this.clone(payload),
          context
        );
      }

      if (
        action &&
        typeof action.run === "function"
      ) {
        return action.run(
          this.clone(payload),
          context
        );
      }

      const actionType =
        typeof action === "string"
          ? action
          : action?.type ||
            action?.action ||
            "";

      const normalizedAction =
        this.normalizeEventName(
          actionType
        );

      switch (normalizedAction) {
        case "CREATE_NOTIFICATION":
        case "NOTIFY":
          return this.executeNotificationAction(
            action,
            payload
          );

        case "NAVIGATE":
        case "OPEN_MODULE":
          return this.executeNavigationAction(
            action,
            payload
          );

        case "UPDATE_STORE":
        case "PATCH_STORE":
          return this.executeStoreAction(
            action,
            payload
          );

        case "CREATE_APPROVAL":
        case "REQUEST_APPROVAL":
          return this.createApproval({
            ...(this.isPlainObject(action)
              ? action
              : {}),
            payload
          });

        case "LOG":
          console.info(
            "[AIW.Automation]",
            action?.message ||
              payload
          );

          return true;

        default:
          /*
           * Unknown textual steps are treated as
           * descriptive workflow steps.
           */
          return {
            action:
              actionType ||
              "descriptive-step",
            acknowledged: true
          };
      }
    },

    executeNotificationAction(
      action,
      payload
    ) {
      const notification = {
        title:
          action?.title ||
          payload?.title ||
          "تنبيه من الأتمتة",

        message:
          action?.message ||
          payload?.message ||
          "تم تنفيذ تدفق العمل.",

        type:
          action?.notificationType ||
          "info",

        source:
          "automation"
      };

      if (
        window.AIW?.Notifications &&
        typeof AIW.Notifications.add ===
          "function"
      ) {
        return AIW.Notifications.add(
          notification
        );
      }

      this.emitPlatformEvent(
        "aiw:notificationRequested",
        notification
      );

      return notification;
    },

    executeNavigationAction(
      action,
      payload
    ) {
      const route =
        action?.route ||
        action?.module ||
        payload?.route ||
        "dashboard";

      if (
        window.AIW?.Router &&
        typeof AIW.Router.navigate ===
          "function"
      ) {
        return AIW.Router.navigate(
          route
        );
      }

      if (
        window.AIW?.App &&
        typeof AIW.App.go === "function"
      ) {
        return AIW.App.go(route);
      }

      window.location.hash = route;

      return route;
    },

    executeStoreAction(
      action,
      payload
    ) {
      const store = this.getStore();

      if (!store) {
        return false;
      }

      const patch =
        action?.patch ||
        action?.data ||
        payload?.patch ||
        payload?.data ||
        {};

      if (
        typeof store.patch === "function"
      ) {
        return store.patch(
          patch,
          {
            eventName:
              "aiw:automationStoreUpdated"
          }
        );
      }

      return false;
    },

    /* =========================================================
       TRIGGERS
    ========================================================= */

    createTrigger(trigger = {}) {
      const record =
        this.normalizeRecord(
          {
            event:
              trigger.event ||
              trigger.eventName ||
              trigger.trigger ||
              "",

            workflowId:
              trigger.workflowId ||
              trigger.jobId ||
              "",

            conditions:
              this.toArray(
                trigger.conditions
              ),

            match:
              trigger.match ||
              "all",

            runCount:
              Number(trigger.runCount) ||
              0,

            lastTriggeredAt:
              trigger.lastTriggeredAt ||
              null,

            ...trigger
          },
          "trigger"
        );

      this.triggers.unshift(record);

      this.save({
        eventName:
          "aiw:triggerCreated"
      });

      this.emitPlatformEvent(
        "aiw:triggerCreated",
        {
          trigger:
            this.clone(record)
        }
      );

      return this.clone(record);
    },

    updateTrigger(id, updates = {}) {
      let updatedTrigger = null;

      this.triggers =
        this.triggers.map(trigger => {
          if (
            String(trigger.id) !==
            String(id)
          ) {
            return trigger;
          }

          updatedTrigger = {
            ...trigger,
            ...this.clone(updates),
            updatedAt: this.now()
          };

          return updatedTrigger;
        });

      if (!updatedTrigger) {
        return null;
      }

      this.save({
        eventName:
          "aiw:triggerUpdated"
      });

      return this.clone(
        updatedTrigger
      );
    },

    deleteTrigger(
      id,
      hardDelete = true
    ) {
      const exists =
        this.triggers.some(
          trigger =>
            String(trigger.id) ===
            String(id)
        );

      if (!exists) {
        return false;
      }

      if (hardDelete) {
        this.triggers =
          this.triggers.filter(
            trigger =>
              String(trigger.id) !==
              String(id)
          );
      } else {
        this.triggers =
          this.triggers.map(trigger => {
            if (
              String(trigger.id) !==
              String(id)
            ) {
              return trigger;
            }

            return {
              ...trigger,
              enabled: false,
              status: "deleted",
              deletedAt: this.now(),
              updatedAt: this.now()
            };
          });
      }

      this.save({
        eventName:
          "aiw:triggerDeleted"
      });

      return true;
    },

    getTriggers(options = {}) {
      let triggers =
        this.triggers.filter(
          trigger => !trigger.deletedAt
        );

      if (options.enabled === true) {
        triggers =
          triggers.filter(
            trigger =>
              trigger.enabled !== false
          );
      }

      if (options.event) {
        const eventName =
          this.normalizeEventName(
            options.event
          );

        triggers =
          triggers.filter(
            trigger =>
              this.normalizeEventName(
                trigger.event ||
                trigger.eventName ||
                trigger.trigger
              ) === eventName
          );
      }

      return this.clone(triggers);
    },

    async processTriggers(
      eventName,
      payload
    ) {
      const matchingTriggers =
        this.getTriggers({
          enabled: true,
          event: eventName
        });

      const results = [];

      for (const trigger of matchingTriggers) {
        const conditionsMatched =
          this.evaluateConditions(
            trigger.conditions,
            payload,
            trigger.match
          );

        if (!conditionsMatched) {
          results.push({
            triggerId: trigger.id,
            matched: false
          });

          continue;
        }

        this.updateTriggerInMemory(
          trigger.id,
          {
            lastTriggeredAt:
              this.now(),
            runCount:
              Number(
                trigger.runCount || 0
              ) + 1,
            status: "triggered"
          }
        );

        const result =
          await this.runWorkflow(
            trigger.workflowId,
            payload,
            {
              trigger: eventName
            }
          );

        results.push({
          triggerId: trigger.id,
          matched: true,
          result
        });
      }

      if (matchingTriggers.length) {
        this.save({
          eventName:
            "aiw:triggersProcessed",
          backup: false
        });
      }

      return results;
    },

    updateTriggerInMemory(
      id,
      updates = {}
    ) {
      let updatedTrigger = null;

      this.triggers =
        this.triggers.map(trigger => {
          if (
            String(trigger.id) !==
            String(id)
          ) {
            return trigger;
          }

          updatedTrigger = {
            ...trigger,
            ...this.clone(updates),
            updatedAt: this.now()
          };

          return updatedTrigger;
        });

      return updatedTrigger;
    },

    evaluateConditions(
      conditions,
      payload,
      matchMode = "all"
    ) {
      const conditionList =
        this.toArray(conditions);

      if (!conditionList.length) {
        return true;
      }

      const results =
        conditionList.map(condition =>
          this.evaluateCondition(
            condition,
            payload
          )
        );

      if (
        this.normalizeText(matchMode) ===
        "any"
      ) {
        return results.some(Boolean);
      }

      return results.every(Boolean);
    },

    evaluateCondition(
      condition,
      payload
    ) {
      if (
        typeof condition === "function"
      ) {
        try {
          return Boolean(
            condition(payload)
          );
        } catch (error) {
          return false;
        }
      }

      if (
        !condition ||
        typeof condition !== "object"
      ) {
        return true;
      }

      const field =
        condition.field ||
        condition.path ||
        "";

      const operator =
        this.normalizeText(
          condition.operator ||
          "equals"
        );

      const expected =
        condition.value;

      const actual =
        this.getByPath(
          payload,
          field
        );

      switch (operator) {
        case "equals":
        case "equal":
        case "==":
          return String(actual) ===
            String(expected);

        case "not_equals":
        case "not equal":
        case "!=":
          return String(actual) !==
            String(expected);

        case "greater_than":
        case "greater":
        case ">":
          return Number(actual) >
            Number(expected);

        case "greater_or_equal":
        case ">=":
          return Number(actual) >=
            Number(expected);

        case "less_than":
        case "less":
        case "<":
          return Number(actual) <
            Number(expected);

        case "less_or_equal":
        case "<=":
          return Number(actual) <=
            Number(expected);

        case "contains":
          return this.normalizeText(
            actual
          ).includes(
            this.normalizeText(expected)
          );

        case "not_contains":
          return !this.normalizeText(
            actual
          ).includes(
            this.normalizeText(expected)
          );

        case "exists":
          return (
            actual !== undefined &&
            actual !== null &&
            actual !== ""
          );

        case "not_exists":
          return (
            actual === undefined ||
            actual === null ||
            actual === ""
          );

        case "in":
          return this.toArray(
            expected
          ).some(
            item =>
              String(item) ===
              String(actual)
          );

        default:
          return String(actual) ===
            String(expected);
      }
    },

    getByPath(source, path) {
      if (!path) {
        return source;
      }

      return String(path)
        .split(".")
        .filter(Boolean)
        .reduce(
          (current, key) =>
            current === undefined ||
            current === null
              ? undefined
              : current[key],
          source
        );
    },

    /* =========================================================
       APPROVALS
    ========================================================= */

    createApproval(approval = {}) {
      const record =
        this.normalizeRecord(
          {
            status: "pending",

            workflowId:
              approval.workflowId ||
              "",

            requestedBy:
              approval.requestedBy ||
              "System",

            assignedTo:
              approval.assignedTo ||
              approval.approver ||
              "",

            requestedAt:
              approval.requestedAt ||
              this.now(),

            decisionAt:
              null,

            decisionBy:
              null,

            comment:
              "",

            ...approval
          },
          "approval"
        );

      this.approvals.unshift(record);

      this.save({
        eventName:
          "aiw:approvalCreated"
      });

      this.emitPlatformEvent(
        "aiw:approvalCreated",
        {
          approval:
            this.clone(record)
        }
      );

      this.trigger(
        "APPROVAL_CREATED",
        {
          approval:
            this.clone(record)
        }
      );

      return this.clone(record);
    },

    approve(
      id,
      details = {}
    ) {
      return this.resolveApproval(
        id,
        "approved",
        details
      );
    },

    reject(
      id,
      details = {}
    ) {
      return this.resolveApproval(
        id,
        "rejected",
        details
      );
    },

    resolveApproval(
      id,
      decision,
      details = {}
    ) {
      let resolvedApproval = null;

      this.approvals =
        this.approvals.map(approval => {
          if (
            String(approval.id) !==
            String(id)
          ) {
            return approval;
          }

          resolvedApproval = {
            ...approval,
            status: decision,
            decision,
            decisionAt: this.now(),
            decisionBy:
              details.decisionBy ||
              details.approvedBy ||
              details.rejectedBy ||
              "User",
            comment:
              details.comment ||
              details.reason ||
              "",
            updatedAt: this.now()
          };

          return resolvedApproval;
        });

      if (!resolvedApproval) {
        return null;
      }

      this.save({
        eventName:
          decision === "approved"
            ? "aiw:approvalApproved"
            : "aiw:approvalRejected"
      });

      const eventName =
        decision === "approved"
          ? "APPROVAL_APPROVED"
          : "APPROVAL_REJECTED";

      this.trigger(
        eventName,
        {
          approval:
            this.clone(
              resolvedApproval
            )
        }
      );

      this.emitPlatformEvent(
        decision === "approved"
          ? "aiw:approvalApproved"
          : "aiw:approvalRejected",
        {
          approval:
            this.clone(
              resolvedApproval
            )
        }
      );

      return this.clone(
        resolvedApproval
      );
    },

    getApprovals(options = {}) {
      let approvals =
        this.approvals.filter(
          approval =>
            !approval.deletedAt
        );

      if (options.status) {
        const status =
          this.normalizeText(
            options.status
          );

        approvals =
          approvals.filter(
            approval =>
              this.normalizeText(
                approval.status
              ) === status
          );
      }

      if (options.assignedTo) {
        const assignedTo =
          this.normalizeText(
            options.assignedTo
          );

        approvals =
          approvals.filter(
            approval =>
              this.normalizeText(
                approval.assignedTo
              ) === assignedTo
          );
      }

      return this.clone(approvals);
    },

    getPendingApprovals() {
      return this.getApprovals({
        status: "pending"
      });
    },

    /* =========================================================
       EXECUTION HISTORY
    ========================================================= */

    addExecutionHistory(entry = {}) {
      const record = {
        id:
          entry.id ||
          this.id("history"),

        createdAt:
          entry.createdAt ||
          this.now(),

        ...this.clone(entry)
      };

      this.executionHistory.unshift(
        record
      );

      this.executionHistory =
        this.executionHistory.slice(
          0,
          200
        );

      return record;
    },

    getExecutionHistory(limit = 50) {
      const safeLimit =
        Math.max(
          0,
          Number(limit) || 50
        );

      return this.clone(
        this.executionHistory.slice(
          0,
          safeLimit
        )
      );
    },

    clearExecutionHistory() {
      this.executionHistory = [];

      this.save({
        eventName:
          "aiw:automationHistoryCleared",
        backup: false
      });

      return true;
    },

    /* =========================================================
       RULES
    ========================================================= */

    addRule(rule = {}) {
      const record = {
        id:
          rule.id ||
          this.id("rule"),

        event:
          this.normalizeEventName(
            rule.event ||
            rule.eventName
          ),

        enabled:
          rule.enabled !== false,

        condition:
          rule.condition ||
          null,

        action:
          rule.action ||
          null,

        priority:
          Number(rule.priority) || 0,

        createdAt:
          rule.createdAt ||
          this.now(),

        ...this.clone(rule)
      };

      this.rules.push(record);

      this.rules.sort(
        (a, b) =>
          b.priority - a.priority
      );

      const unsubscribe =
        this.on(
          record.event,
          async payload => {
            if (
              record.enabled === false
            ) {
              return false;
            }

            if (
              typeof record.condition ===
                "function" &&
              !record.condition(payload)
            ) {
              return false;
            }

            if (record.action) {
              return this.executeAction(
                record.action,
                payload,
                {
                  rule: record
                }
              );
            }

            return true;
          },
          {
            id: record.id,
            priority:
              record.priority
          }
        );

      record.unsubscribe =
        unsubscribe;

      return this.clone({
        ...record,
        unsubscribe: undefined
      });
    },

    removeRule(id) {
      const rule =
        this.rules.find(
          item =>
            String(item.id) ===
            String(id)
        );

      if (!rule) {
        return false;
      }

      if (
        typeof rule.unsubscribe ===
        "function"
      ) {
        rule.unsubscribe();
      }

      this.rules =
        this.rules.filter(
          item =>
            String(item.id) !==
            String(id)
        );

      return true;
    },

    registerDefaultRules() {
      if (this._defaultsRegistered) {
        return;
      }

      this._defaultsRegistered = true;

      this.on(
        "DATA_CHANGED",
        payload => {
          this.addExecutionHistory({
            type: "platform-event",
            event: "DATA_CHANGED",
            title:
              "تم تحديث بيانات المنصة",
            status: "completed",
            payloadSummary:
              this.summarizePayload(
                payload
              )
          });
        },
        {
          id:
            "default-data-changed",
          priority: -10
        }
      );

      this.on(
        "JOB_EXECUTED",
        payload => {
          const workflow =
            payload?.workflow ||
            payload;

          console.info(
            "[AIW.Automation] Workflow completed:",
            workflow?.title ||
            workflow?.name ||
            workflow?.id
          );
        },
        {
          id:
            "default-job-executed",
          priority: -10
        }
      );

      this.on(
        "JOB_FAILED",
        payload => {
          console.error(
            "[AIW.Automation] Workflow failed:",
            payload?.workflow?.title ||
            payload?.workflow?.name ||
            payload?.workflow?.id
          );
        },
        {
          id:
            "default-job-failed",
          priority: -10
        }
      );

      this.on(
        "ROUTE_CHANGED",
        payload => {
          const route =
            payload?.route ||
            payload?.moduleId ||
            "unknown";

          this.statisticsData.lastRoute =
            route;
        },
        {
          id:
            "default-route-changed",
          priority: -10
        }
      );
    },

    summarizePayload(payload) {
      if (
        payload === null ||
        payload === undefined
      ) {
        return "No payload";
      }

      if (
        typeof payload !== "object"
      ) {
        return String(payload).slice(
          0,
          120
        );
      }

      const keys =
        Object.keys(payload).slice(
          0,
          6
        );

      return keys.length
        ? keys.join(", ")
        : "Empty object";
    },

    /* =========================================================
       STATISTICS
    ========================================================= */

    refreshStatistics(
      shouldSave = false
    ) {
      const workflows =
        this.getWorkflows();

      const triggers =
        this.getTriggers();

      const approvals =
        this.getApprovals();

      const history =
        this.executionHistory;

      const statistics = {
        total:
          workflows.length,

        active:
          workflows.filter(
            workflow =>
              workflow.enabled !== false
          ).length,

        enabled:
          workflows.filter(
            workflow =>
              workflow.enabled !== false
          ).length,

        disabled:
          workflows.filter(
            workflow =>
              workflow.enabled === false
          ).length,

        completed:
          workflows.filter(
            workflow =>
              this.normalizeText(
                workflow.status
              ) === "completed"
          ).length,

        waiting:
          workflows.filter(
            workflow =>
              [
                "waiting",
                "new",
                "pending"
              ].includes(
                this.normalizeText(
                  workflow.status
                )
              )
          ).length,

        running:
          workflows.filter(
            workflow =>
              this.normalizeText(
                workflow.status
              ) === "running"
          ).length,

        failed:
          workflows.filter(
            workflow =>
              this.normalizeText(
                workflow.status
              ) === "failed"
          ).length,

        triggers:
          triggers.length,

        activeTriggers:
          triggers.filter(
            trigger =>
              trigger.enabled !== false
          ).length,

        approvals:
          approvals.length,

        pendingApprovals:
          approvals.filter(
            approval =>
              this.normalizeText(
                approval.status
              ) === "pending"
          ).length,

        approvedApprovals:
          approvals.filter(
            approval =>
              this.normalizeText(
                approval.status
              ) === "approved"
          ).length,

        rejectedApprovals:
          approvals.filter(
            approval =>
              this.normalizeText(
                approval.status
              ) === "rejected"
          ).length,

        totalExecutions:
          history.filter(
            entry =>
              entry.workflowId
          ).length,

        successfulExecutions:
          history.filter(
            entry =>
              entry.status ===
              "completed"
          ).length,

        failedExecutions:
          history.filter(
            entry =>
              entry.status ===
              "failed"
          ).length,

        successRate: 0,

        lastExecutionAt:
          history.find(
            entry =>
              entry.workflowId
          )?.completedAt ||
          history.find(
            entry =>
              entry.workflowId
          )?.createdAt ||
          null,

        updatedAt:
          this.now()
      };

      const executionTotal =
        statistics.successfulExecutions +
        statistics.failedExecutions;

      statistics.successRate =
        executionTotal
          ? Math.round(
              (
                statistics.successfulExecutions /
                executionTotal
              ) * 100
            )
          : 0;

      this.statisticsData = {
        ...this.statisticsData,
        ...statistics
      };

      if (shouldSave) {
        this.save({
          eventName:
            "aiw:automationStatisticsUpdated",
          backup: false
        });
      }

      return this.clone(
        this.statisticsData
      );
    },

    statistics() {
      return this.refreshStatistics(
        false
      );
    },

    /* =========================================================
       PLATFORM EVENTS
    ========================================================= */

    bindPlatformEvents() {
      if (this._eventsBound) {
        return;
      }

      this._eventsBound = true;

      window.addEventListener(
        "aiw:dataChanged",
        event => {
          const sourceEvent =
            event?.detail?.sourceEvent;

          const ignoredEvents = [
            "aiw:automationChanged",
            "aiw:workflowCreated",
            "aiw:workflowUpdated",
            "aiw:workflowDeleted",
            "aiw:workflowExecuted",
            "aiw:workflowFailed",
            "aiw:triggerCreated",
            "aiw:triggerUpdated",
            "aiw:approvalCreated",
            "aiw:approvalApproved",
            "aiw:approvalRejected",
            "aiw:triggersProcessed"
          ];

          if (
            ignoredEvents.includes(
              sourceEvent
            )
          ) {
            return;
          }

          this.trigger(
            "DATA_CHANGED",
            event.detail
          );
        }
      );

      window.addEventListener(
        "aiw:routeChanged",
        event => {
          this.trigger(
            "ROUTE_CHANGED",
            event.detail
          );
        }
      );

      window.addEventListener(
        "aiw:itemCreated",
        event => {
          this.trigger(
            "ITEM_CREATED",
            event.detail
          );
        }
      );

      window.addEventListener(
        "aiw:itemUpdated",
        event => {
          this.trigger(
            "ITEM_UPDATED",
            event.detail
          );
        }
      );

      window.addEventListener(
        "aiw:itemDeleted",
        event => {
          this.trigger(
            "ITEM_DELETED",
            event.detail
          );
        }
      );

      window.addEventListener(
        "aiw:collectionChanged",
        event => {
          this.trigger(
            "COLLECTION_CHANGED",
            event.detail
          );
        }
      );

      window.addEventListener(
        "aiw:riskUpdated",
        event => {
          this.trigger(
            "RISK_UPDATED",
            event.detail
          );
        }
      );

      window.addEventListener(
        "aiw:kpiUpdated",
        event => {
          this.trigger(
            "KPI_UPDATED",
            event.detail
          );
        }
      );

      window.addEventListener(
        "aiw:projectUpdated",
        event => {
          this.trigger(
            "PROJECT_UPDATED",
            event.detail
          );
        }
      );

      window.addEventListener(
        "aiw:ideaUpdated",
        event => {
          this.trigger(
            "IDEA_UPDATED",
            event.detail
          );
        }
      );
    },

    bindStore() {
      const store = this.getStore();

      if (
        !store ||
        this._storeUnsubscribe
      ) {
        return;
      }

      try {
        if (
          typeof store.subscribe ===
            "function"
        ) {
          this._storeUnsubscribe =
            store.subscribe(change => {
              const type =
                change?.type || "";

              const ignoredEvents = [
                "aiw:automationChanged",
                "aiw:workflowCreated",
                "aiw:workflowUpdated",
                "aiw:workflowDeleted",
                "aiw:workflowExecuted",
                "aiw:workflowFailed",
                "aiw:triggerCreated",
                "aiw:triggerUpdated",
                "aiw:triggerDeleted",
                "aiw:approvalCreated",
                "aiw:approvalApproved",
                "aiw:approvalRejected",
                "aiw:triggersProcessed",
                "aiw:automationStatisticsUpdated",
                "aiw:metadataChanged",
                "persist",
                "settingsPersisted"
              ];

              if (
                ignoredEvents.includes(type)
              ) {
                return;
              }

              this.scheduleRefresh();
            });

          return;
        }

        if (
          typeof store.onChange ===
            "function"
        ) {
          this._storeUnsubscribe =
            store.onChange(() => {
              this.scheduleRefresh();
            });
        }
      } catch (error) {
        console.warn(
          "[AIW.Automation] Store subscription failed:",
          error
        );
      }
    },

    scheduleRefresh() {
      window.clearTimeout(
        this._refreshTimer
      );

      this._refreshTimer =
        window.setTimeout(() => {
          this.refreshFromStore();
        }, 120);
    },

    emitPlatformEvent(
      eventName,
      detail = {}
    ) {
      try {
        window.dispatchEvent(
          new CustomEvent(eventName, {
            detail: this.clone(detail)
          })
        );
      } catch (error) {
        console.warn(
          `[AIW.Automation] Event "${eventName}" failed:`,
          error
        );
      }
    },

    /* =========================================================
       SETTINGS AND ROADMAP
    ========================================================= */

    getSettings() {
      return this.clone(
        this.settings
      );
    },

    updateSettings(updates = {}) {
      this.settings = {
        ...this.settings,
        ...this.clone(updates)
      };

      this.save({
        eventName:
          "aiw:automationSettingsUpdated"
      });

      return this.getSettings();
    },

    getRoadmap() {
      return this.clone(
        this.roadmap
      );
    },

    setRoadmap(items = []) {
      this.roadmap =
        this.toArray(items);

      this.save({
        eventName:
          "aiw:automationRoadmapUpdated"
      });

      return this.getRoadmap();
    },

    /* =========================================================
       METADATA
    ========================================================= */

    registerMetadata() {
      const store = this.getStore();

      if (
        !store ||
        typeof store.setMetadata !==
          "function"
      ) {
        return;
      }

      try {
        store.setMetadata({
          automationEngineVersion:
            this.version,

          automationEngine:
            "Enterprise Workflow and Event Engine",

          automationCapabilities: [
            "Workflows",
            "Triggers",
            "Approvals",
            "Execution History",
            "Event Rules",
            "Statistics"
          ],

          lastAutomationInitialization:
            this.now()
        });
      } catch (error) {
        console.warn(
          "[AIW.Automation] Metadata registration skipped:",
          error
        );
      }
    },

    /* =========================================================
       CLEANUP
    ========================================================= */

    destroy() {
      window.clearTimeout(
        this._refreshTimer
      );

      if (
        typeof this._storeUnsubscribe ===
          "function"
      ) {
        try {
          this._storeUnsubscribe();
        } catch (error) {
          console.warn(
            "[AIW.Automation] Store unsubscribe failed:",
            error
          );
        }
      }

      this.rules.forEach(rule => {
        if (
          typeof rule.unsubscribe ===
            "function"
        ) {
          rule.unsubscribe();
        }
      });

      this._storeUnsubscribe = null;
      this._executingJobs.clear();
      this.events = {};
      this.rules = [];
      this._initialized = false;
      this._eventsBound = false;
      this._defaultsRegistered = false;
    }
  };

  /* =========================================================
     GLOBAL REFERENCE
  ========================================================= */

  AIW.Automation = Automation;

  /* =========================================================
     BOOTSTRAP
  ========================================================= */

  const bootstrap = () => {
    AIW.Automation.init();
  };

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      bootstrap,
      {
        once: true
      }
    );
  } else {
    bootstrap();
  }
})();