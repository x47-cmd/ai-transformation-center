/* =========================================================
   AI Work - Store V2.0
   Enterprise Single Source of Truth
========================================================= */

window.AIW = window.AIW || {};

AIW.KEYS = {
  DATA: (window.ATC_CONFIG && ATC_CONFIG.storage && ATC_CONFIG.storage.data) || "atcDataV1",
  SETTINGS: (window.ATC_CONFIG && ATC_CONFIG.storage && ATC_CONFIG.storage.settings) || "atcSettingsV1",
  BACKUP: (window.ATC_CONFIG && ATC_CONFIG.storage && ATC_CONFIG.storage.backup) || "atcBackupV1",
  CURRENT_MODULE: (window.ATC_CONFIG && ATC_CONFIG.storage && ATC_CONFIG.storage.currentModule) || "aiwCurrentModule"
};

AIW.DEFAULT_DATA = {
  meta: {
    app: "AI Transformation Center",
    version: "2.0.0",
    createdAt: null,
    updatedAt: null
  },

  dashboard: {
    maturityScore: 34,
    portfolioHealth: 68,
    expectedROI: 42000000,
    targetYear: 2030
  },

  strategy: [],
  projects: [],
  ideas: [],
  kpis: [],
  maturity: [],
  governance: [],
  reports: [],
  automation: [],
  decisionCenter: [],
  risks: [],
  activity: []
};

AIW.DEFAULT_SETTINGS = {
  language: "ar",
  theme: "light",
  compactMode: false,
  autoBackup: true,
  notifications: true
};

AIW.Store = {
  clone(value) {
    try {
      return structuredClone(value);
    } catch (e) {
      return JSON.parse(JSON.stringify(value));
    }
  },

  now() {
    return new Date().toISOString();
  },

  id(prefix = "aiw") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  },

  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : this.clone(fallback);
    } catch (e) {
      return this.clone(fallback);
    }
  },

  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("AIW Store Write Error:", e);
      return false;
    }
  },

  mergeDefaults(defaults, saved) {
    if (!saved || typeof saved !== "object") return this.clone(defaults);

    const output = Array.isArray(defaults) ? [] : { ...defaults };

    Object.keys(saved).forEach(key => {
      const defaultValue = defaults ? defaults[key] : undefined;
      const savedValue = saved[key];

      if (
        defaultValue &&
        savedValue &&
        typeof defaultValue === "object" &&
        typeof savedValue === "object" &&
        !Array.isArray(defaultValue) &&
        !Array.isArray(savedValue)
      ) {
        output[key] = this.mergeDefaults(defaultValue, savedValue);
      } else {
        output[key] = savedValue;
      }
    });

    return output;
  },

  getData() {
    const saved = this.read(AIW.KEYS.DATA, null);
    const data = this.mergeDefaults(AIW.DEFAULT_DATA, saved);

    if (!data.meta.createdAt) data.meta.createdAt = this.now();
    data.meta.updatedAt = data.meta.updatedAt || this.now();

    this.write(AIW.KEYS.DATA, data);
    return data;
  },

  saveData(data, eventName = "aiw:dataChanged") {
    const finalData = this.mergeDefaults(AIW.DEFAULT_DATA, data || {});
    finalData.meta = finalData.meta || {};
    finalData.meta.updatedAt = this.now();

    this.write(AIW.KEYS.DATA, finalData);

    if (this.getSettings().autoBackup) {
      this.backup(finalData);
    }

    this.emit(eventName, finalData);
    return finalData;
  },

  getSettings() {
    const saved = this.read(AIW.KEYS.SETTINGS, null);
    const settings = this.mergeDefaults(AIW.DEFAULT_SETTINGS, saved);
    this.write(AIW.KEYS.SETTINGS, settings);
    return settings;
  },

  saveSettings(settings) {
    const finalSettings = this.mergeDefaults(AIW.DEFAULT_SETTINGS, settings || {});
    this.write(AIW.KEYS.SETTINGS, finalSettings);
    this.emit("aiw:settingsChanged", finalSettings);
    return finalSettings;
  },

  backup(data) {
    const payload = {
      backedUpAt: this.now(),
      version: "2.0.0",
      data: data || this.getData()
    };

    this.write(AIW.KEYS.BACKUP, payload);
    return payload;
  },

  restoreBackup() {
    const backup = this.read(AIW.KEYS.BACKUP, null);
    if (!backup || !backup.data) return null;

    this.saveData(backup.data, "aiw:dataRestored");
    return backup.data;
  },

  getCollection(collection) {
    const data = this.getData();
    return Array.isArray(data[collection])
      ? data[collection].filter(item => !item.deletedAt)
      : [];
  },

  getAllCollection(collection) {
    const data = this.getData();
    return Array.isArray(data[collection]) ? data[collection] : [];
  },

  setCollection(collection, items) {
    const data = this.getData();
    data[collection] = Array.isArray(items) ? items : [];
    this.saveData(data, "aiw:collectionChanged");
    this.emit("aiw:collectionChanged", { collection, items: data[collection] });
    return data[collection];
  },

  add(collection, item = {}) {
    const data = this.getData();

    if (!Array.isArray(data[collection])) {
      data[collection] = [];
    }

    const record = {
      id: item.id || this.id(collection),
      title: item.title || item.name || "عنصر جديد",
      status: item.status || "new",
      priority: item.priority || "medium",
      createdAt: this.now(),
      updatedAt: this.now(),
      deletedAt: null,
      ...item
    };

    data[collection].unshift(record);

    this.addActivity(data, {
      type: "create",
      collection,
      title: record.title,
      refId: record.id
    });

    this.saveData(data, "aiw:itemCreated");
    this.emit("aiw:itemCreated", { collection, item: record });

    return record;
  },

  update(collection, id, updates = {}) {
    const data = this.getData();

    if (!Array.isArray(data[collection])) return null;

    let updatedItem = null;

    data[collection] = data[collection].map(item => {
      if (item.id !== id) return item;

      updatedItem = {
        ...item,
        ...updates,
        updatedAt: this.now()
      };

      return updatedItem;
    });

    if (!updatedItem) return null;

    this.addActivity(data, {
      type: "update",
      collection,
      title: updatedItem.title || updatedItem.name || "تحديث عنصر",
      refId: id
    });

    this.saveData(data, "aiw:itemUpdated");
    this.emit("aiw:itemUpdated", { collection, item: updatedItem });

    return updatedItem;
  },

  remove(collection, id, hardDelete = false) {
    const data = this.getData();

    if (!Array.isArray(data[collection])) return false;

    const item = data[collection].find(x => x.id === id);
    if (!item) return false;

    if (hardDelete) {
      data[collection] = data[collection].filter(x => x.id !== id);
    } else {
      data[collection] = data[collection].map(x =>
        x.id === id
          ? { ...x, deletedAt: this.now(), updatedAt: this.now() }
          : x
      );
    }

    this.addActivity(data, {
      type: "delete",
      collection,
      title: item.title || item.name || "حذف عنصر",
      refId: id
    });

    this.saveData(data, "aiw:itemDeleted");
    this.emit("aiw:itemDeleted", { collection, id, hardDelete });

    return true;
  },

  find(collection, id) {
    return this.getCollection(collection).find(item => item.id === id) || null;
  },

  filter(collection, predicate) {
    const items = this.getCollection(collection);
    return typeof predicate === "function" ? items.filter(predicate) : items;
  },

  search(collection, query, fields = ["title", "name", "description", "department"]) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return this.getCollection(collection);

    return this.getCollection(collection).filter(item =>
      fields.some(field =>
        String(item[field] || "").toLowerCase().includes(q)
      )
    );
  },

  sort(collection, field = "createdAt", direction = "desc") {
    const items = [...this.getCollection(collection)];

    return items.sort((a, b) => {
      const av = a[field] || "";
      const bv = b[field] || "";

      if (direction === "asc") return av > bv ? 1 : -1;
      return av < bv ? 1 : -1;
    });
  },

  count(collection) {
    return this.getCollection(collection).length;
  },

  stats() {
    const data = this.getData();

    const collections = [
      "strategy",
      "projects",
      "ideas",
      "kpis",
      "maturity",
      "governance",
      "reports",
      "automation",
      "decisionCenter",
      "risks"
    ];

    const output = {
      totalRecords: 0,
      collections: {}
    };

    collections.forEach(collection => {
      const count = Array.isArray(data[collection])
        ? data[collection].filter(item => !item.deletedAt).length
        : 0;

      output.collections[collection] = count;
      output.totalRecords += count;
    });

    return output;
  },

  addActivity(data, activity) {
    data.activity = Array.isArray(data.activity) ? data.activity : [];

    data.activity.unshift({
      id: this.id("activity"),
      createdAt: this.now(),
      ...activity
    });

    data.activity = data.activity.slice(0, 100);
  },

  getActivity(limit = 20) {
    return this.getCollection("activity").slice(0, limit);
  },

  emit(name, detail) {
    window.dispatchEvent(
      new CustomEvent(name, {
        detail
      })
    );
  },

  reset() {
    const fresh = this.clone(AIW.DEFAULT_DATA);
    fresh.meta.createdAt = this.now();
    fresh.meta.updatedAt = this.now();

    this.write(AIW.KEYS.DATA, fresh);
    this.emit("aiw:dataReset", fresh);

    return fresh;
  },

  exportData() {
    return {
      exportedAt: this.now(),
      version: "2.0.0",
      data: this.getData(),
      settings: this.getSettings()
    };
  },

  importData(payload) {
    if (!payload) return false;

    if (payload.data) {
      this.saveData(payload.data, "aiw:dataImported");
    }

    if (payload.settings) {
      this.saveSettings(payload.settings);
    }

    return true;
  }
};