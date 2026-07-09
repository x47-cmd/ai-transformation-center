/* =========================================================
   AI Work - Store V1
   Single Source of Truth
========================================================= */

window.AIW = window.AIW || {};

AIW.KEYS = {
  DATA: "aiwDataV1",
  SETTINGS: "aiwSettingsV1",
  CURRENT_MODULE: "aiwCurrentModule"
};

AIW.DEFAULT_DATA = {
  ideas: [],
  projects: [],
  strategy: [],
  activity: []
};

AIW.Store = {
  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },

  write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  getData() {
    const saved = this.read(AIW.KEYS.DATA, null);
    if (!saved) {
      this.write(AIW.KEYS.DATA, AIW.DEFAULT_DATA);
      return structuredClone(AIW.DEFAULT_DATA);
    }

    return {
      ...AIW.DEFAULT_DATA,
      ...saved
    };
  },

  saveData(data) {
    this.write(AIW.KEYS.DATA, data);

    window.dispatchEvent(
      new CustomEvent("aiw:dataChanged", {
        detail: data
      })
    );

    return data;
  },

  add(collection, item) {
    const data = this.getData();

    if (!Array.isArray(data[collection])) {
      data[collection] = [];
    }

    const record = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: item.status || "new",
      priority: item.priority || "medium",
      ...item
    };

    data[collection].unshift(record);

    data.activity = data.activity || [];
    data.activity.unshift({
      id: Date.now().toString() + "-activity",
      type: collection,
      title: item.title || item.name || "عنصر جديد",
      createdAt: new Date().toISOString()
    });

    this.saveData(data);
    return record;
  },

  update(collection, id, updates) {
    const data = this.getData();

    if (!Array.isArray(data[collection])) return null;

    data[collection] = data[collection].map(item => {
      if (item.id !== id) return item;

      return {
        ...item,
        ...updates,
        updatedAt: new Date().toISOString()
      };
    });

    this.saveData(data);
    return data[collection].find(item => item.id === id);
  },

  remove(collection, id) {
    const data = this.getData();

    if (!Array.isArray(data[collection])) return;

    data[collection] = data[collection].filter(item => item.id !== id);

    this.saveData(data);
  },

  getCollection(collection) {
    const data = this.getData();
    return Array.isArray(data[collection]) ? data[collection] : [];
  },

  count(collection) {
    return this.getCollection(collection).length;
  },

  reset() {
    this.write(AIW.KEYS.DATA, AIW.DEFAULT_DATA);
    this.saveData(structuredClone(AIW.DEFAULT_DATA));
  }
};