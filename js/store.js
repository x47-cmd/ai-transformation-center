/* =========================================================
   AI Work - Store V2.1
   Enterprise Single Source of Truth

   Features:
   - Centralized State Management
   - Deep Data Merge
   - Legacy Data Compatibility
   - Automatic Persistence
   - Automatic Backup
   - Metadata Management
   - State Subscription
   - Cross-Tab Synchronization
   - Activity Logging
   - Soft Delete
   - Import / Export / Restore
   - Safe Recovery
========================================================= */

window.AIW = window.AIW || {};

/* =========================================================
   STORAGE KEYS
========================================================= */

AIW.KEYS = {
  DATA:
    (
      window.ATC_CONFIG &&
      ATC_CONFIG.storage &&
      ATC_CONFIG.storage.data
    ) ||
    "atcDataV1",

  SETTINGS:
    (
      window.ATC_CONFIG &&
      ATC_CONFIG.storage &&
      ATC_CONFIG.storage.settings
    ) ||
    "atcSettingsV1",

  BACKUP:
    (
      window.ATC_CONFIG &&
      ATC_CONFIG.storage &&
      ATC_CONFIG.storage.backup
    ) ||
    "atcBackupV1",

  CURRENT_MODULE:
    (
      window.ATC_CONFIG &&
      ATC_CONFIG.storage &&
      ATC_CONFIG.storage.currentModule
    ) ||
    "aiwCurrentModule"
};

/* =========================================================
   DEFAULT PLATFORM DATA
========================================================= */

AIW.DEFAULT_DATA = {
  meta: {
    app: "Enterprise Biometric Intelligence Platform",
    shortName: "AI Work",
    version: "2.1.0",
    schemaVersion: "2.1",
    environment: "Enterprise",
    architecture: "Modular Single Page Application",
    dataModel: "Single Source of Truth",
    synchronization: "Automatic",
    createdAt: null,
    updatedAt: null,
    lastSync: null,
    lastBackupAt: null,
    lastImportedAt: null,
    lastRestoredAt: null
  },

  dashboard: {
    maturityScore: 34,
    portfolioHealth: 68,
    platformHealth: 0,
    readinessScore: 0,
    expectedROI: 42000000,
    targetYear: 2030
  },

  strategy: [],
  projects: [],
  flagshipProjects: [],
  ideas: [],
  departments: [],
  kpis: [],
  maturity: [],
  governance: [],
  reports: [],
  businessCases: [],
  decisionCenter: [],
  risks: [],

  automation: {
    workflows: [],
    triggers: [],
    approvals: [],
    roadmap: [],
    settings: {},
    statistics: {}
  },

  notifications: [],
  recommendations: [],
  diagnostics: [],
  activity: []
};

/* =========================================================
   DEFAULT PLATFORM SETTINGS
========================================================= */

AIW.DEFAULT_SETTINGS = {
  language: "ar",
  locale: "ar-AE",
  direction: "rtl",
  theme: "light",
  compactMode: false,
  autoBackup: true,
  backupLimit: 1,
  notifications: true,
  autoSync: true,
  activityLogging: true,
  softDelete: true
};

/* =========================================================
   CENTRAL STORE
========================================================= */

AIW.Store = {
  version: "2.1.0",
  storageKey: AIW.KEYS.DATA,

  _state: null,
  _settings: null,
  _subscribers: new Set(),
  _initialized: false,
  _storageListenerAttached: false,
  _writeLock: false,

  /* =========================================================
     INITIALIZATION
  ========================================================= */

  init() {
    if (this._initialized) {
      return this.getState();
    }

    this._initialized = true;

    const storedData = this.read(
      AIW.KEYS.DATA,
      null
    );

    const legacyData =
      window.AIW?.Data &&
      typeof window.AIW.Data === "object"
        ? window.AIW.Data
        : null;

    let sourceData = storedData;

    if (!sourceData && legacyData) {
      sourceData = legacyData;
    }

    this._state = this.normalizeData(
      this.mergeDefaults(
        AIW.DEFAULT_DATA,
        sourceData || {}
      )
    );

    this._settings = this.mergeDefaults(
      AIW.DEFAULT_SETTINGS,
      this.read(AIW.KEYS.SETTINGS, null)
    );

    this.ensureMetadata(this._state);

    this.persistState({
      emit: false,
      backup: false,
      notify: false
    });

    this.persistSettings({
      emit: false,
      notify: false
    });

    this.attachStorageListener();
    this.syncGlobalDataReference();

    return this.getState();
  },

  /* =========================================================
     CORE HELPERS
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
        console.error(
          "[AIW.Store] Clone failed:",
          cloneError
        );

        return value;
      }
    }
  },

  now() {
    return new Date().toISOString();
  },

  id(prefix = "aiw") {
    const randomPart = Math.random()
      .toString(36)
      .slice(2, 10);

    return `${prefix}-${Date.now()}-${randomPart}`;
  },

  isPlainObject(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  },

  toArray(value) {
    if (Array.isArray(value)) {
      return value;
    }

    if (this.isPlainObject(value)) {
      return Object.values(value);
    }

    return [];
  },

  normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  },

  /* =========================================================
     STORAGE
  ========================================================= */

  read(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key);

      if (!raw) {
        return this.clone(fallback);
      }

      return JSON.parse(raw);
    } catch (error) {
      console.warn(
        `[AIW.Store] Unable to read ${key}:`,
        error
      );

      return this.clone(fallback);
    }
  },

  write(key, value) {
    try {
      this._writeLock = true;

      window.localStorage.setItem(
        key,
        JSON.stringify(value)
      );

      return true;
    } catch (error) {
      console.error(
        `[AIW.Store] Unable to write ${key}:`,
        error
      );

      return false;
    } finally {
      this._writeLock = false;
    }
  },

  removeStorageKey(key) {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(
        `[AIW.Store] Unable to remove ${key}:`,
        error
      );

      return false;
    }
  },

  /* =========================================================
     DEEP MERGE
  ========================================================= */

  mergeDefaults(defaults, saved) {
    if (saved === undefined || saved === null) {
      return this.clone(defaults);
    }

    if (Array.isArray(defaults)) {
      return Array.isArray(saved)
        ? this.clone(saved)
        : this.clone(defaults);
    }

    if (!this.isPlainObject(defaults)) {
      return this.clone(saved);
    }

    if (!this.isPlainObject(saved)) {
      return this.clone(defaults);
    }

    const output = this.clone(defaults);

    Object.keys(saved).forEach(key => {
      const defaultValue = defaults[key];
      const savedValue = saved[key];

      if (
        this.isPlainObject(defaultValue) &&
        this.isPlainObject(savedValue)
      ) {
        output[key] = this.mergeDefaults(
          defaultValue,
          savedValue
        );

        return;
      }

      output[key] = this.clone(savedValue);
    });

    return output;
  },

  deepMerge(target, patch) {
    const output = this.isPlainObject(target)
      ? this.clone(target)
      : {};

    if (!this.isPlainObject(patch)) {
      return output;
    }

    Object.keys(patch).forEach(key => {
      const patchValue = patch[key];
      const targetValue = output[key];

      if (
        this.isPlainObject(targetValue) &&
        this.isPlainObject(patchValue)
      ) {
        output[key] = this.deepMerge(
          targetValue,
          patchValue
        );

        return;
      }

      output[key] = this.clone(patchValue);
    });

    return output;
  },

  /* =========================================================
     DATA NORMALIZATION
  ========================================================= */

  normalizeData(input) {
    const data = this.isPlainObject(input)
      ? this.clone(input)
      : this.clone(AIW.DEFAULT_DATA);

    data.meta = this.isPlainObject(data.meta)
      ? data.meta
      : {};

    data.dashboard = this.isPlainObject(
      data.dashboard
    )
      ? data.dashboard
      : {};

    const arrayCollections = [
      "strategy",
      "projects",
      "flagshipProjects",
      "ideas",
      "departments",
      "kpis",
      "maturity",
      "governance",
      "reports",
      "businessCases",
      "decisionCenter",
      "risks",
      "notifications",
      "recommendations",
      "diagnostics",
      "activity"
    ];

    arrayCollections.forEach(collection => {
      data[collection] = this.toArray(
        data[collection]
      );
    });

    data.automation =
      this.normalizeAutomation(
        data.automation
      );

    return data;
  },

  normalizeAutomation(value) {
    if (Array.isArray(value)) {
      return {
        workflows: this.clone(value),
        triggers: [],
        approvals: [],
        roadmap: [],
        settings: {},
        statistics: {}
      };
    }

    const automation = this.isPlainObject(value)
      ? value
      : {};

    return {
      workflows: this.toArray(
        automation.workflows
      ),
      triggers: this.toArray(
        automation.triggers
      ),
      approvals: this.toArray(
        automation.approvals
      ),
      roadmap: this.toArray(
        automation.roadmap
      ),
      settings: this.isPlainObject(
        automation.settings
      )
        ? automation.settings
        : {},
      statistics: this.isPlainObject(
        automation.statistics
      )
        ? automation.statistics
        : {}
    };
  },

  ensureMetadata(data = this._state) {
    if (!data) {
      return null;
    }

    data.meta = this.isPlainObject(data.meta)
      ? data.meta
      : {};

    const currentTime = this.now();

    data.meta.app =
      data.meta.app ||
      AIW.DEFAULT_DATA.meta.app;

    data.meta.shortName =
      data.meta.shortName ||
      AIW.DEFAULT_DATA.meta.shortName;

    data.meta.version =
      data.meta.version ||
      this.version;

    data.meta.schemaVersion =
      data.meta.schemaVersion ||
      AIW.DEFAULT_DATA.meta.schemaVersion;

    data.meta.environment =
      data.meta.environment ||
      AIW.DEFAULT_DATA.meta.environment;

    data.meta.architecture =
      data.meta.architecture ||
      AIW.DEFAULT_DATA.meta.architecture;

    data.meta.dataModel =
      data.meta.dataModel ||
      AIW.DEFAULT_DATA.meta.dataModel;

    data.meta.synchronization =
      data.meta.synchronization ||
      AIW.DEFAULT_DATA.meta.synchronization;

    data.meta.createdAt =
      data.meta.createdAt ||
      currentTime;

    data.meta.updatedAt =
      data.meta.updatedAt ||
      currentTime;

    data.meta.lastSync =
      data.meta.lastSync ||
      currentTime;

    return data.meta;
  },

  /* =========================================================
     STATE ACCESS
  ========================================================= */

  getState() {
    if (!this._initialized) {
      this.init();
    }

    return this.clone(this._state);
  },

  getData() {
    return this.getState();
  },

  get(path, fallback = undefined) {
    if (!this._initialized) {
      this.init();
    }

    if (!path) {
      return this.getState();
    }

    const value = this.getByPath(
      this._state,
      path
    );

    return value === undefined
      ? this.clone(fallback)
      : this.clone(value);
  },

  getByPath(source, path) {
    if (!path) {
      return source;
    }

    const parts = Array.isArray(path)
      ? path
      : String(path)
          .split(".")
          .filter(Boolean);

    return parts.reduce(
      (current, key) => {
        if (
          current === undefined ||
          current === null
        ) {
          return undefined;
        }

        return current[key];
      },
      source
    );
  },

  setByPath(source, path, value) {
    const parts = Array.isArray(path)
      ? path
      : String(path)
          .split(".")
          .filter(Boolean);

    if (!parts.length) {
      return source;
    }

    let current = source;

    parts.forEach((part, index) => {
      const isLast =
        index === parts.length - 1;

      if (isLast) {
        current[part] = this.clone(value);
        return;
      }

      if (!this.isPlainObject(current[part])) {
        current[part] = {};
      }

      current = current[part];
    });

    return source;
  },

  has(path) {
    return this.getByPath(
      this._state,
      path
    ) !== undefined;
  },

  /* =========================================================
     STATE WRITES
  ========================================================= */

  set(path, value, options = {}) {
    if (!this._initialized) {
      this.init();
    }

    if (
      this.isPlainObject(path) &&
      arguments.length === 1
    ) {
      return this.replaceState(path);
    }

    if (
      this.isPlainObject(path) &&
      arguments.length >= 2 &&
      this.isPlainObject(value)
    ) {
      return this.replaceState(
        path,
        value
      );
    }

    const nextState = this.clone(this._state);

    this.setByPath(
      nextState,
      path,
      value
    );

    return this.commit(
      nextState,
      {
        eventName:
          options.eventName ||
          "aiw:dataChanged",

        activity:
          options.activity || null,

        backup:
          options.backup !== false,

        notify:
          options.notify !== false
      }
    );
  },

  updateState(updater, options = {}) {
    if (!this._initialized) {
      this.init();
    }

    let nextState;

    if (typeof updater === "function") {
      const draft = this.clone(this._state);
      const result = updater(draft);

      nextState =
        result &&
        typeof result === "object"
          ? result
          : draft;
    } else if (this.isPlainObject(updater)) {
      nextState = this.deepMerge(
        this._state,
        updater
      );
    } else {
      return this.getState();
    }

    return this.commit(
      nextState,
      {
        eventName:
          options.eventName ||
          "aiw:dataUpdated",

        activity:
          options.activity || null,

        backup:
          options.backup !== false,

        notify:
          options.notify !== false
      }
    );
  },

  patch(patchData, options = {}) {
    return this.updateState(
      patchData,
      {
        ...options,
        eventName:
          options.eventName ||
          "aiw:storeUpdated"
      }
    );
  },

  replaceState(data, options = {}) {
    const nextState = this.normalizeData(
      this.mergeDefaults(
        AIW.DEFAULT_DATA,
        data || {}
      )
    );

    return this.commit(
      nextState,
      {
        eventName:
          options.eventName ||
          "aiw:dataReplaced",

        activity:
          options.activity || null,

        backup:
          options.backup !== false,

        notify:
          options.notify !== false
      }
    );
  },

  saveData(
    data,
    eventName = "aiw:dataChanged"
  ) {
    return this.replaceState(
      data || {},
      {
        eventName
      }
    );
  },

  commit(nextState, options = {}) {
    const normalizedState =
      this.normalizeData(
        this.mergeDefaults(
          AIW.DEFAULT_DATA,
          nextState || {}
        )
      );

    this.ensureMetadata(normalizedState);

    const currentTime = this.now();

    normalizedState.meta.updatedAt =
      currentTime;

    normalizedState.meta.lastSync =
      currentTime;

    if (
      options.activity &&
      this.getSettings().activityLogging
    ) {
      this.addActivity(
        normalizedState,
        options.activity
      );
    }

    this._state = normalizedState;

    this.persistState({
      emit: false,
      backup: options.backup !== false,
      notify: false
    });

    this.syncGlobalDataReference();

    const eventName =
      options.eventName ||
      "aiw:dataChanged";

    this.emit(
      eventName,
      this.getState()
    );

    if (eventName !== "aiw:dataChanged") {
      this.emit(
        "aiw:dataChanged",
        {
          sourceEvent: eventName,
          data: this.getState()
        }
      );
    }

    this.emit(
      "aiw:storeChanged",
      {
        sourceEvent: eventName,
        data: this.getState()
      }
    );

    if (options.notify !== false) {
      this.notifySubscribers({
        type: eventName,
        data: this.getState()
      });
    }

    return this.getState();
  },

  persistState(options = {}) {
    if (!this._state) {
      return false;
    }

    const written = this.write(
      AIW.KEYS.DATA,
      this._state
    );

    if (
      written &&
      options.backup !== false &&
      this.getSettings().autoBackup
    ) {
      this.backup(
        this._state,
        {
          emit: false
        }
      );
    }

    if (
      options.emit !== false
    ) {
      this.emit(
        "aiw:dataPersisted",
        this.getState()
      );
    }

    if (
      options.notify !== false
    ) {
      this.notifySubscribers({
        type: "persist",
        data: this.getState()
      });
    }

    return written;
  },

  syncGlobalDataReference() {
    if (!this._state) {
      return;
    }

    window.AIW.Data = this.clone(
      this._state
    );
  },

  /* =========================================================
     SETTINGS
  ========================================================= */

  getSettings() {
    if (!this._initialized) {
      this.init();
    }

    if (!this._settings) {
      this._settings =
        this.mergeDefaults(
          AIW.DEFAULT_SETTINGS,
          this.read(
            AIW.KEYS.SETTINGS,
            null
          )
        );
    }

    return this.clone(this._settings);
  },

  saveSettings(
    settings,
    eventName = "aiw:settingsChanged"
  ) {
    if (!this._initialized) {
      this.init();
    }

    this._settings =
      this.mergeDefaults(
        AIW.DEFAULT_SETTINGS,
        settings || {}
      );

    this.persistSettings({
      emit: false,
      notify: false
    });

    this.emit(
      eventName,
      this.getSettings()
    );

    this.notifySubscribers({
      type: eventName,
      settings: this.getSettings()
    });

    return this.getSettings();
  },

  updateSettings(updates = {}) {
    const current =
      this.getSettings();

    const nextSettings =
      this.deepMerge(
        current,
        updates
      );

    return this.saveSettings(
      nextSettings,
      "aiw:settingsUpdated"
    );
  },

  setSetting(key, value) {
    const settings =
      this.getSettings();

    settings[key] = value;

    return this.saveSettings(
      settings,
      "aiw:settingsUpdated"
    );
  },

  getSetting(key, fallback = undefined) {
    const settings =
      this.getSettings();

    return settings[key] !== undefined
      ? this.clone(settings[key])
      : this.clone(fallback);
  },

  persistSettings(options = {}) {
    if (!this._settings) {
      return false;
    }

    const written = this.write(
      AIW.KEYS.SETTINGS,
      this._settings
    );

    if (
      options.emit !== false
    ) {
      this.emit(
        "aiw:settingsPersisted",
        this.getSettings()
      );
    }

    if (
      options.notify !== false
    ) {
      this.notifySubscribers({
        type: "settingsPersisted",
        settings: this.getSettings()
      });
    }

    return written;
  },

  /* =========================================================
     METADATA
  ========================================================= */

  getMetadata() {
    return this.get(
      "meta",
      {}
    );
  },

  setMetadata(metadata = {}) {
    const currentMetadata =
      this.getMetadata();

    const updatedMetadata =
      this.deepMerge(
        currentMetadata,
        metadata
      );

    return this.set(
      "meta",
      updatedMetadata,
      {
        eventName:
          "aiw:metadataChanged",
        backup: false
      }
    );
  },

  updateMetadata(metadata = {}) {
    return this.setMetadata(metadata);
  },

  touchMetadata(extra = {}) {
    return this.setMetadata({
      updatedAt: this.now(),
      lastSync: this.now(),
      ...extra
    });
  },

  /* =========================================================
     COLLECTION PATH HELPERS
  ========================================================= */

  getCollectionPath(collection) {
    const aliases = {
      workflows: "automation.workflows",
      triggers: "automation.triggers",
      approvals: "automation.approvals",
      automationRoadmap: "automation.roadmap"
    };

    return aliases[collection] || collection;
  },

  getCollection(collection) {
    const path =
      this.getCollectionPath(collection);

    const items = this.get(
      path,
      []
    );

    return this.toArray(items).filter(
      item =>
        !item ||
        !item.deletedAt
    );
  },

  getAllCollection(collection) {
    const path =
      this.getCollectionPath(collection);

    return this.toArray(
      this.get(path, [])
    );
  },

  setCollection(collection, items) {
    const path =
      this.getCollectionPath(collection);

    const normalizedItems =
      Array.isArray(items)
        ? items
        : [];

    this.set(
      path,
      normalizedItems,
      {
        eventName:
          "aiw:collectionChanged",

        activity: {
          type: "collection-set",
          collection,
          title:
            `تحديث مجموعة ${collection}`
        }
      }
    );

    this.emit(
      "aiw:collectionChanged",
      {
        collection,
        items: this.clone(
          normalizedItems
        )
      }
    );

    return this.getCollection(collection);
  },

  /* =========================================================
     CRUD OPERATIONS
  ========================================================= */

  add(collection, item = {}) {
    const path =
      this.getCollectionPath(collection);

    const items =
      this.getAllCollection(collection);

    const currentTime = this.now();

    const record = {
      id:
        item.id ||
        this.id(collection),

      title:
        item.title ||
        item.name ||
        "عنصر جديد",

      status:
        item.status ||
        "new",

      priority:
        item.priority ||
        "medium",

      createdAt:
        item.createdAt ||
        currentTime,

      updatedAt:
        currentTime,

      deletedAt:
        null,

      ...this.clone(item)
    };

    record.id =
      record.id ||
      this.id(collection);

    record.createdAt =
      record.createdAt ||
      currentTime;

    record.updatedAt =
      currentTime;

    if (
      record.deletedAt === undefined
    ) {
      record.deletedAt = null;
    }

    items.unshift(record);

    this.set(
      path,
      items,
      {
        eventName:
          "aiw:itemCreated",

        activity: {
          type: "create",
          collection,
          title:
            record.title ||
            record.name ||
            "إنشاء عنصر",
          refId: record.id
        }
      }
    );

    this.emit(
      "aiw:itemCreated",
      {
        collection,
        item: this.clone(record)
      }
    );

    return this.clone(record);
  },

  update(collection, id, updates = {}) {
    const path =
      this.getCollectionPath(collection);

    const items =
      this.getAllCollection(collection);

    let updatedItem = null;

    const updatedItems =
      items.map(item => {
        if (
          String(item?.id) !==
          String(id)
        ) {
          return item;
        }

        updatedItem = {
          ...item,
          ...this.clone(updates),
          id: item.id,
          updatedAt: this.now()
        };

        return updatedItem;
      });

    if (!updatedItem) {
      return null;
    }

    this.set(
      path,
      updatedItems,
      {
        eventName:
          "aiw:itemUpdated",

        activity: {
          type: "update",
          collection,
          title:
            updatedItem.title ||
            updatedItem.name ||
            "تحديث عنصر",
          refId: id
        }
      }
    );

    this.emit(
      "aiw:itemUpdated",
      {
        collection,
        item: this.clone(updatedItem)
      }
    );

    return this.clone(updatedItem);
  },

  remove(
    collection,
    id,
    hardDelete = false
  ) {
    const path =
      this.getCollectionPath(collection);

    const items =
      this.getAllCollection(collection);

    const existingItem =
      items.find(
        item =>
          String(item?.id) ===
          String(id)
      );

    if (!existingItem) {
      return false;
    }

    const shouldHardDelete =
      hardDelete ||
      !this.getSettings().softDelete;

    let updatedItems;

    if (shouldHardDelete) {
      updatedItems =
        items.filter(
          item =>
            String(item?.id) !==
            String(id)
        );
    } else {
      const currentTime = this.now();

      updatedItems =
        items.map(item => {
          if (
            String(item?.id) !==
            String(id)
          ) {
            return item;
          }

          return {
            ...item,
            deletedAt: currentTime,
            updatedAt: currentTime
          };
        });
    }

    this.set(
      path,
      updatedItems,
      {
        eventName:
          "aiw:itemDeleted",

        activity: {
          type: "delete",
          collection,
          title:
            existingItem.title ||
            existingItem.name ||
            "حذف عنصر",
          refId: id,
          hardDelete:
            shouldHardDelete
        }
      }
    );

    this.emit(
      "aiw:itemDeleted",
      {
        collection,
        id,
        hardDelete:
          shouldHardDelete
      }
    );

    return true;
  },

  restoreItem(collection, id) {
    const path =
      this.getCollectionPath(collection);

    const items =
      this.getAllCollection(collection);

    let restoredItem = null;

    const updatedItems =
      items.map(item => {
        if (
          String(item?.id) !==
          String(id)
        ) {
          return item;
        }

        restoredItem = {
          ...item,
          deletedAt: null,
          updatedAt: this.now()
        };

        return restoredItem;
      });

    if (!restoredItem) {
      return null;
    }

    this.set(
      path,
      updatedItems,
      {
        eventName:
          "aiw:itemRestored",

        activity: {
          type: "restore",
          collection,
          title:
            restoredItem.title ||
            restoredItem.name ||
            "استعادة عنصر",
          refId: id
        }
      }
    );

    return this.clone(restoredItem);
  },

  clearCollection(
    collection,
    hardDelete = false
  ) {
    const items =
      this.getAllCollection(collection);

    if (hardDelete) {
      return this.setCollection(
        collection,
        []
      );
    }

    const currentTime = this.now();

    const deletedItems =
      items.map(item => ({
        ...item,
        deletedAt: currentTime,
        updatedAt: currentTime
      }));

    return this.setCollection(
      collection,
      deletedItems
    );
  },

  find(collection, id) {
    return (
      this.getCollection(collection)
        .find(
          item =>
            String(item?.id) ===
            String(id)
        ) ||
      null
    );
  },

  filter(collection, predicate) {
    const items =
      this.getCollection(collection);

    return typeof predicate === "function"
      ? items.filter(predicate)
      : items;
  },

  search(
    collection,
    query,
    fields = [
      "title",
      "name",
      "description",
      "department",
      "status",
      "priority"
    ]
  ) {
    const normalizedQuery =
      this.normalizeText(query);

    if (!normalizedQuery) {
      return this.getCollection(collection);
    }

    return this.getCollection(
      collection
    ).filter(item =>
      fields.some(field =>
        this.normalizeText(
          item?.[field]
        ).includes(normalizedQuery)
      )
    );
  },

  sort(
    collection,
    field = "createdAt",
    direction = "desc"
  ) {
    const items = [
      ...this.getCollection(collection)
    ];

    return items.sort((a, b) => {
      const aValue =
        a?.[field] ?? "";

      const bValue =
        b?.[field] ?? "";

      if (aValue === bValue) {
        return 0;
      }

      if (direction === "asc") {
        return aValue > bValue
          ? 1
          : -1;
      }

      return aValue < bValue
        ? 1
        : -1;
    });
  },

  count(collection) {
    return this.getCollection(
      collection
    ).length;
  },

  /* =========================================================
     ACTIVITY LOG
  ========================================================= */

  addActivity(data, activity = {}) {
    if (!data) {
      return null;
    }

    data.activity =
      Array.isArray(data.activity)
        ? data.activity
        : [];

    const activityRecord = {
      id:
        activity.id ||
        this.id("activity"),

      type:
        activity.type ||
        "system",

      title:
        activity.title ||
        "تحديث في المنصة",

      createdAt:
        activity.createdAt ||
        this.now(),

      ...this.clone(activity)
    };

    data.activity.unshift(
      activityRecord
    );

    data.activity =
      data.activity.slice(0, 200);

    return activityRecord;
  },

  logActivity(activity = {}) {
    const nextState =
      this.getState();

    const record =
      this.addActivity(
        nextState,
        activity
      );

    this.commit(
      nextState,
      {
        eventName:
          "aiw:activityAdded",
        backup: false
      }
    );

    return this.clone(record);
  },

  getActivity(limit = 20) {
    const safeLimit = Math.max(
      0,
      Number(limit) || 20
    );

    return this.getCollection(
      "activity"
    ).slice(0, safeLimit);
  },

  /* =========================================================
     STATISTICS
  ========================================================= */

  stats() {
    const collectionNames = [
      "strategy",
      "projects",
      "flagshipProjects",
      "ideas",
      "departments",
      "kpis",
      "maturity",
      "governance",
      "reports",
      "businessCases",
      "decisionCenter",
      "risks",
      "workflows",
      "triggers",
      "approvals"
    ];

    const output = {
      totalRecords: 0,
      activeRecords: 0,
      deletedRecords: 0,
      collections: {},
      generatedAt: this.now()
    };

    collectionNames.forEach(collection => {
      const allItems =
        this.getAllCollection(collection);

      const activeCount =
        allItems.filter(
          item => !item?.deletedAt
        ).length;

      const deletedCount =
        allItems.filter(
          item =>
            Boolean(item?.deletedAt)
        ).length;

      output.collections[collection] = {
        total: allItems.length,
        active: activeCount,
        deleted: deletedCount
      };

      output.totalRecords +=
        allItems.length;

      output.activeRecords +=
        activeCount;

      output.deletedRecords +=
        deletedCount;
    });

    return output;
  },

  /* =========================================================
     BACKUP AND RESTORE
  ========================================================= */

  backup(data = null, options = {}) {
    const sourceData =
      data ||
      this.getState();

    const payload = {
      backedUpAt: this.now(),
      version: this.version,
      schemaVersion:
        sourceData?.meta?.schemaVersion ||
        AIW.DEFAULT_DATA.meta.schemaVersion,
      data: this.clone(sourceData),
      settings: this.getSettings()
    };

    const written = this.write(
      AIW.KEYS.BACKUP,
      payload
    );

    if (written && this._state) {
      this._state.meta.lastBackupAt =
        payload.backedUpAt;

      this.write(
        AIW.KEYS.DATA,
        this._state
      );

      this.syncGlobalDataReference();
    }

    if (
      written &&
      options.emit !== false
    ) {
      this.emit(
        "aiw:backupCreated",
        this.clone(payload)
      );
    }

    return written
      ? this.clone(payload)
      : null;
  },

  getBackup() {
    return this.read(
      AIW.KEYS.BACKUP,
      null
    );
  },

  restoreBackup() {
    const backup =
      this.getBackup();

    if (
      !backup ||
      !backup.data
    ) {
      return null;
    }

    const restoredData =
      this.normalizeData(
        this.mergeDefaults(
          AIW.DEFAULT_DATA,
          backup.data
        )
      );

    this.ensureMetadata(
      restoredData
    );

    restoredData.meta.lastRestoredAt =
      this.now();

    const result =
      this.commit(
        restoredData,
        {
          eventName:
            "aiw:dataRestored",
          backup: false
        }
      );

    if (backup.settings) {
      this.saveSettings(
        backup.settings,
        "aiw:settingsRestored"
      );
    }

    return result;
  },

  /* =========================================================
     IMPORT AND EXPORT
  ========================================================= */

  exportData() {
    return {
      exportedAt: this.now(),
      app:
        this.getMetadata().app ||
        AIW.DEFAULT_DATA.meta.app,
      version: this.version,
      schemaVersion:
        this.getMetadata().schemaVersion,
      data: this.getState(),
      settings: this.getSettings()
    };
  },

  importData(payload, options = {}) {
    if (
      !payload ||
      typeof payload !== "object"
    ) {
      return false;
    }

    let imported = false;

    if (payload.data) {
      const importedData =
        this.normalizeData(
          this.mergeDefaults(
            AIW.DEFAULT_DATA,
            payload.data
          )
        );

      this.ensureMetadata(importedData);

      importedData.meta.lastImportedAt =
        this.now();

      this.commit(
        importedData,
        {
          eventName:
            "aiw:dataImported",

          backup:
            options.backup !== false
        }
      );

      imported = true;
    }

    if (payload.settings) {
      this.saveSettings(
        payload.settings,
        "aiw:settingsImported"
      );

      imported = true;
    }

    return imported;
  },

  /* =========================================================
     RESET
  ========================================================= */

  reset(options = {}) {
    const fresh =
      this.clone(
        AIW.DEFAULT_DATA
      );

    const currentTime =
      this.now();

    fresh.meta.createdAt =
      currentTime;

    fresh.meta.updatedAt =
      currentTime;

    fresh.meta.lastSync =
      currentTime;

    const result =
      this.commit(
        fresh,
        {
          eventName:
            "aiw:dataReset",

          backup:
            options.backupBeforeReset !==
            false
        }
      );

    return result;
  },

  resetSettings() {
    this._settings =
      this.clone(
        AIW.DEFAULT_SETTINGS
      );

    this.persistSettings({
      emit: false,
      notify: false
    });

    this.emit(
      "aiw:settingsReset",
      this.getSettings()
    );

    this.notifySubscribers({
      type: "aiw:settingsReset",
      settings: this.getSettings()
    });

    return this.getSettings();
  },

  clearAll(options = {}) {
    if (
      options.keepBackup !== true
    ) {
      this.removeStorageKey(
        AIW.KEYS.BACKUP
      );
    }

    this.removeStorageKey(
      AIW.KEYS.DATA
    );

    this.removeStorageKey(
      AIW.KEYS.SETTINGS
    );

    this._state = null;
    this._settings = null;
    this._initialized = false;

    return this.init();
  },

  /* =========================================================
     SUBSCRIPTIONS
  ========================================================= */

  subscribe(callback) {
    if (typeof callback !== "function") {
      return () => {};
    }

    this._subscribers.add(callback);

    return () => {
      this._subscribers.delete(
        callback
      );
    };
  },

  onChange(callback) {
    return this.subscribe(callback);
  },

  on(eventName, callback) {
    if (
      !eventName ||
      typeof callback !== "function"
    ) {
      return () => {};
    }

    const handler = event => {
      callback(
        event.detail,
        event
      );
    };

    window.addEventListener(
      eventName,
      handler
    );

    return () => {
      window.removeEventListener(
        eventName,
        handler
      );
    };
  },

  off(eventName, callback) {
    if (
      !eventName ||
      typeof callback !== "function"
    ) {
      return;
    }

    window.removeEventListener(
      eventName,
      callback
    );
  },

  notifySubscribers(change = {}) {
    const payload = {
      timestamp: this.now(),
      ...change
    };

    this._subscribers.forEach(callback => {
      try {
        callback(
          this.clone(payload),
          this.getState()
        );
      } catch (error) {
        console.error(
          "[AIW.Store] Subscriber failed:",
          error
        );
      }
    });
  },

  /* =========================================================
     EVENTS
  ========================================================= */

  emit(name, detail) {
    if (!name) {
      return;
    }

    try {
      window.dispatchEvent(
        new CustomEvent(name, {
          detail: this.clone(detail)
        })
      );
    } catch (error) {
      console.warn(
        `[AIW.Store] Event ${name} failed:`,
        error
      );
    }
  },

  /* =========================================================
     CROSS-TAB SYNCHRONIZATION
  ========================================================= */

  attachStorageListener() {
    if (
      this._storageListenerAttached
    ) {
      return;
    }

    this._storageListenerAttached =
      true;

    window.addEventListener(
      "storage",
      event => {
        if (this._writeLock) {
          return;
        }

        if (
          event.key === AIW.KEYS.DATA &&
          event.newValue
        ) {
          try {
            const externalData =
              JSON.parse(
                event.newValue
              );

            this._state =
              this.normalizeData(
                this.mergeDefaults(
                  AIW.DEFAULT_DATA,
                  externalData
                )
              );

            this.ensureMetadata(
              this._state
            );

            this.syncGlobalDataReference();

            const payload = {
              source: "storage",
              data: this.getState()
            };

            this.emit(
              "aiw:crossTabSync",
              payload
            );

            this.emit(
              "aiw:dataChanged",
              payload
            );

            this.notifySubscribers({
              type:
                "aiw:crossTabSync",
              ...payload
            });
          } catch (error) {
            console.warn(
              "[AIW.Store] Cross-tab data synchronization failed:",
              error
            );
          }
        }

        if (
          event.key ===
            AIW.KEYS.SETTINGS &&
          event.newValue
        ) {
          try {
            this._settings =
              this.mergeDefaults(
                AIW.DEFAULT_SETTINGS,
                JSON.parse(
                  event.newValue
                )
              );

            this.emit(
              "aiw:settingsChanged",
              this.getSettings()
            );

            this.notifySubscribers({
              type:
                "aiw:settingsChanged",
              settings:
                this.getSettings()
            });
          } catch (error) {
            console.warn(
              "[AIW.Store] Cross-tab settings synchronization failed:",
              error
            );
          }
        }
      }
    );
  }
};

/* =========================================================
   STORE BOOTSTRAP
========================================================= */

AIW.Store.init();