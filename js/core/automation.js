/* =========================================================
   AI Work - Automation Engine V1.0 Final
   Enterprise Workflow + Event Engine
========================================================= */

window.AIW = window.AIW || {};

AIW.Automation = {

  version: "1.0",

  jobs: [],

  events: {},

  init() {

    this.load();

    window.addEventListener("aiw:dataChanged", e => {
      this.trigger("DATA_CHANGED", e.detail);
    });

    window.addEventListener("aiw:routeChanged", e => {
      this.trigger("ROUTE_CHANGED", e.detail);
    });

  },

  load() {

    try {

      this.jobs = JSON.parse(
        localStorage.getItem("aiwAutomationJobs") || "[]"
      );

    } catch {

      this.jobs = [];

    }

  },

  save() {

    localStorage.setItem(
      "aiwAutomationJobs",
      JSON.stringify(this.jobs)
    );

  },

  on(eventName, callback) {

    if (!this.events[eventName]) {

      this.events[eventName] = [];

    }

    this.events[eventName].push(callback);

  },

  trigger(eventName, payload = {}) {

    const listeners = this.events[eventName] || [];

    listeners.forEach(fn => {

      try {

        fn(payload);

      }

      catch (err) {

        console.error("Automation Error", err);

      }

    });

  },

  createJob(job) {

    const item = {

      id: Date.now().toString(),

      createdAt: new Date().toISOString(),

      enabled: true,

      status: "waiting",

      type: "workflow",

      trigger: "",

      action: "",

      ...job

    };

    this.jobs.push(item);

    this.save();

    return item;

  },

  updateJob(id, updates) {

    this.jobs = this.jobs.map(job => {

      if (job.id !== id) return job;

      return {

        ...job,

        ...updates,

        updatedAt: new Date().toISOString()

      };

    });

    this.save();

  },

  deleteJob(id) {

    this.jobs = this.jobs.filter(j => j.id !== id);

    this.save();

  },

  runJob(id) {

    const job = this.jobs.find(j => j.id === id);

    if (!job) return;

    job.lastRun = new Date().toISOString();

    job.status = "completed";

    this.save();

    this.trigger("JOB_EXECUTED", job);

    return job;

  },

  getJobs() {

    return this.jobs;

  },

  getEnabledJobs() {

    return this.jobs.filter(j => j.enabled);

  },

  statistics() {

    return {

      total: this.jobs.length,

      active: this.jobs.filter(j => j.enabled).length,

      completed: this.jobs.filter(j => j.status === "completed").length,

      waiting: this.jobs.filter(j => j.status === "waiting").length

    };

  },

  registerDefaultRules() {

    this.on("DATA_CHANGED", () => {

      console.log("Automation: Data Updated");

    });

    this.on("JOB_EXECUTED", job => {

      console.log("Workflow Finished:", job.name);

    });

    this.on("ROUTE_CHANGED", route => {

      console.log("Opened:", route.moduleId);

    });

  }

};

document.addEventListener("DOMContentLoaded", () => {

  AIW.Automation.init();

  AIW.Automation.registerDefaultRules();

});