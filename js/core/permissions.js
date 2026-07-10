/* =========================================================
   AI Work - Permissions Engine V2.1
   Enterprise Role-Based Access Control

   Scope:
   - AIW.Store Integration
   - Role-Based Access Control
   - Module Permissions
   - Action Permissions
   - Approval Permissions
   - Dynamic UI Protection
   - Permission Overrides
   - Audit Events
   - Legacy ATCPermissions Compatibility
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};

  const Permissions = {
    id: "permissions-engine",
    version: "2.1.0",

    storageKey: "atcRole",
    defaultRole: "executive",

    currentRole: "executive",
    overrides: {},
    moduleRules: {},

    _initialized: false,
    _eventsBound: false,
    _storeUnsubscribe: null,
    _refreshTimer: null,
    _observer: null,
    _isSynchronizing: false,

    roles: {
      admin: {
        id: "admin",
        title: "مدير النظام",
        titleEn: "Administrator",
        level: 100,

        permissions: [
          "*",
          "view",
          "create",
          "edit",
          "delete",
          "restore",
          "export",
          "import",
          "print",
          "approve",
          "reject",
          "execute",
          "configure",
          "settings",
          "manage-users",
          "manage-roles",
          "manage-permissions",
          "view-audit",
          "reset-data"
        ],

        modules: ["*"]
      },

      executive: {
        id: "executive",
        title: "قيادي تنفيذي",
        titleEn: "Executive",
        level: 80,

        permissions: [
          "view",
          "export",
          "print",
          "approve",
          "reject",
          "view-decisions",
          "view-reports",
          "view-risks",
          "view-kpis"
        ],

        modules: [
          "dashboard",
          "strategy",
          "projects",
          "ideas",
          "governance",
          "maturity",
          "reports",
          "kpis",
          "business",
          "automation",
          "decision",
          "settings"
        ]
      },

      manager: {
        id: "manager",
        title: "مدير تشغيلي",
        titleEn: "Manager",
        level: 60,

        permissions: [
          "view",
          "create",
          "edit",
          "export",
          "print",
          "execute",
          "request-approval",
          "view-reports",
          "view-risks",
          "view-kpis"
        ],

        modules: [
          "dashboard",
          "strategy",
          "projects",
          "ideas",
          "governance",
          "maturity",
          "reports",
          "kpis",
          "business",
          "automation",
          "decision"
        ]
      },

      analyst: {
        id: "analyst",
        title: "محلل",
        titleEn: "Analyst",
        level: 45,

        permissions: [
          "view",
          "create",
          "edit",
          "export",
          "print",
          "view-reports",
          "view-kpis"
        ],

        modules: [
          "dashboard",
          "projects",
          "ideas",
          "maturity",
          "reports",
          "kpis",
          "business",
          "decision"
        ]
      },

      operator: {
        id: "operator",
        title: "مستخدم تشغيلي",
        titleEn: "Operator",
        level: 30,

        permissions: [
          "view",
          "create",
          "edit",
          "execute",
          "request-approval"
        ],

        modules: [
          "dashboard",
          "projects",
          "ideas",
          "automation"
        ]
      },

      viewer: {
        id: "viewer",
        title: "مستخدم للعرض",
        titleEn: "Viewer",
        level: 10,

        permissions: [
          "view"
        ],

        modules: [
          "dashboard",
          "strategy",
          "projects",
          "ideas",
          "governance",
          "maturity",
          "reports",
          "kpis",
          "business",
          "decision"
        ]
      }
    },

    sensitiveActions: [
      "delete",
      "reset-data",
      "manage-users",
      "manage-roles",
      "manage-permissions",
      "configure",
      "settings"
    ],

    approvalActions: [
      "approve",
      "reject"
    ],

    /* =========================================================
       INITIALIZATION
    ========================================================= */

    init() {
      if (this._initialized) {
        this.applyToDOM();
        return this;
      }

      this._initialized = true;

      this.load();
      this.bindEvents();
      this.bindStore();
      this.startDOMObserver();
      this.applyToDOM();
      this.registerMetadata();

      this.emit(
        "aiw:permissionsReady",
        {
          version: this.version,
          role: this.currentRole,
          roleInfo: this.getRoleInfo()
        }
      );

      return this;
    },

    /* =========================================================
       STORE ACCESS
    ========================================================= */

    getStore() {
      return window.AIW?.Store || null;
    },

    getPlatformSettings() {
      const store = this.getStore();

      try {
        if (
          store &&
          typeof store.getSettings === "function"
        ) {
          return store.getSettings();
        }
      } catch (error) {
        console.warn(
          "[AIW.Permissions] Unable to read settings:",
          error
        );
      }

      return {};
    },

    savePlatformSettings(settings) {
      const store = this.getStore();

      try {
        if (
          store &&
          typeof store.saveSettings === "function"
        ) {
          return store.saveSettings(settings);
        }
      } catch (error) {
        console.warn(
          "[AIW.Permissions] Unable to save settings:",
          error
        );
      }

      return null;
    },

    /* =========================================================
       GENERAL HELPERS
    ========================================================= */

    now() {
      return new Date().toISOString();
    },

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

    normalize(value) {
      return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/_/g, "-");
    },

    isValidRole(role) {
      return Boolean(
        this.roles[
          this.normalize(role)
        ]
      );
    },

    /* =========================================================
       LOAD AND SAVE
    ========================================================= */

    load() {
      const settings =
        this.getPlatformSettings();

      const permissionsSettings =
        settings.permissions &&
        typeof settings.permissions === "object"
          ? settings.permissions
          : {};

      const savedRole =
        permissionsSettings.currentRole ||
        settings.role ||
        this.readLegacyRole() ||
        this.defaultRole;

      this.currentRole =
        this.isValidRole(savedRole)
          ? this.normalize(savedRole)
          : this.defaultRole;

      this.overrides =
        permissionsSettings.overrides &&
        typeof permissionsSettings.overrides ===
          "object"
          ? this.clone(
              permissionsSettings.overrides
            )
          : {};

      this.moduleRules =
        permissionsSettings.moduleRules &&
        typeof permissionsSettings.moduleRules ===
          "object"
          ? this.clone(
              permissionsSettings.moduleRules
            )
          : {};

      return this.getState();
    },

    readLegacyRole() {
      try {
        return window.localStorage.getItem(
          this.storageKey
        );
      } catch (error) {
        return null;
      }
    },

    save(options = {}) {
      if (this._isSynchronizing) {
        return this.getState();
      }

      this._isSynchronizing = true;

      try {
        const settings =
          this.getPlatformSettings();

        const nextSettings = {
          ...settings,

          role: this.currentRole,

          permissions: {
            ...(settings.permissions || {}),

            currentRole:
              this.currentRole,

            overrides:
              this.clone(
                this.overrides
              ),

            moduleRules:
              this.clone(
                this.moduleRules
              ),

            updatedAt:
              this.now(),

            engineVersion:
              this.version
          }
        };

        this.savePlatformSettings(
          nextSettings
        );

        try {
          window.localStorage.setItem(
            this.storageKey,
            this.currentRole
          );
        } catch (error) {
          console.warn(
            "[AIW.Permissions] Legacy role persistence failed:",
            error
          );
        }
      } finally {
        this._isSynchronizing = false;
      }

      if (options.emit !== false) {
        this.emit(
          options.eventName ||
            "aiw:permissionsChanged",
          this.getState()
        );

        document.dispatchEvent(
          new CustomEvent(
            "atc:permissionsChanged",
            {
              detail: {
                role:
                  this.currentRole
              }
            }
          )
        );
      }

      return this.getState();
    },

    refreshFromStore() {
      if (this._isSynchronizing) {
        return this.getState();
      }

      const previousState =
        JSON.stringify({
          role:
            this.currentRole,
          overrides:
            this.overrides,
          moduleRules:
            this.moduleRules
        });

      this.load();

      const nextState =
        JSON.stringify({
          role:
            this.currentRole,
          overrides:
            this.overrides,
          moduleRules:
            this.moduleRules
        });

      if (
        previousState !==
        nextState
      ) {
        this.applyToDOM();

        this.emit(
          "aiw:permissionsRefreshed",
          this.getState()
        );
      }

      return this.getState();
    },

    /* =========================================================
       ROLE MANAGEMENT
    ========================================================= */

    getRole() {
      return this.currentRole;
    },

    getRoleInfo(role = null) {
      const roleId =
        this.normalize(
          role || this.currentRole
        );

      const roleInfo =
        this.roles[roleId];

      return roleInfo
        ? this.clone(roleInfo)
        : null;
    },

    setRole(role, options = {}) {
      const normalizedRole =
        this.normalize(role);

      if (
        !this.roles[normalizedRole]
      ) {
        return false;
      }

      const previousRole =
        this.currentRole;

      if (
        normalizedRole ===
        previousRole
      ) {
        return true;
      }

      this.currentRole =
        normalizedRole;

      this.save({
        eventName:
          "aiw:roleChanged"
      });

      this.applyToDOM();

      this.recordAudit({
        action: "ROLE_CHANGED",
        result: "success",
        previousRole,
        role:
          normalizedRole,
        source:
          options.source ||
          "permissions-engine"
      });

      this.emit(
        "aiw:roleChanged",
        {
          role:
            normalizedRole,
          previousRole,
          roleInfo:
            this.getRoleInfo()
        }
      );

      return true;
    },

    getRoles() {
      return Object.values(
        this.roles
      ).map(role =>
        this.clone(role)
      );
    },

    addRole(role = {}) {
      const id =
        this.normalize(
          role.id ||
          role.name
        );

      if (!id) {
        return false;
      }

      if (
        this.roles[id] &&
        role.overwrite !== true
      ) {
        return false;
      }

      this.roles[id] = {
        id,
        title:
          role.title ||
          id,

        titleEn:
          role.titleEn ||
          role.title ||
          id,

        level:
          Number(role.level) || 1,

        permissions:
          this.toArray(
            role.permissions
          ),

        modules:
          this.toArray(
            role.modules
          )
      };

      this.emit(
        "aiw:rolesChanged",
        {
          role:
            this.clone(
              this.roles[id]
            )
        }
      );

      return this.clone(
        this.roles[id]
      );
    },

    removeRole(role) {
      const normalizedRole =
        this.normalize(role);

      if (
        !this.roles[normalizedRole] ||
        normalizedRole ===
          this.defaultRole ||
        normalizedRole === "admin"
      ) {
        return false;
      }

      delete this.roles[
        normalizedRole
      ];

      if (
        this.currentRole ===
        normalizedRole
      ) {
        this.setRole(
          this.defaultRole
        );
      }

      this.emit(
        "aiw:rolesChanged",
        {
          removedRole:
            normalizedRole
        }
      );

      return true;
    },

    /* =========================================================
       PERMISSION CHECKS
    ========================================================= */

    can(action, context = {}) {
      const normalizedAction =
        this.normalize(action);

      if (!normalizedAction) {
        return false;
      }

      const role =
        this.getRoleInfo();

      if (!role) {
        return false;
      }

      const override =
        this.getOverride(
          normalizedAction,
          context
        );

      if (
        override !== null
      ) {
        return override;
      }

      if (
        role.permissions.includes("*")
      ) {
        return true;
      }

      if (
        role.permissions.includes(
          normalizedAction
        )
      ) {
        return true;
      }

      if (
        context.module &&
        this.moduleRules[
          context.module
        ]
      ) {
        const moduleRule =
          this.moduleRules[
            context.module
          ];

        if (
          Array.isArray(
            moduleRule.permissions
          ) &&
          moduleRule.permissions.includes(
            normalizedAction
          )
        ) {
          return true;
        }
      }

      return false;
    },

    cannot(action, context = {}) {
      return !this.can(
        action,
        context
      );
    },

    canAny(actions = [], context = {}) {
      return this.toArray(
        actions
      ).some(action =>
        this.can(
          action,
          context
        )
      );
    },

    canAll(actions = [], context = {}) {
      const permissionList =
        this.toArray(actions);

      if (!permissionList.length) {
        return true;
      }

      return permissionList.every(
        action =>
          this.can(
            action,
            context
          )
      );
    },

    canView(module) {
      return (
        this.can("view", {
          module
        }) &&
        this.canAccessModule(module)
      );
    },

    canEdit(module = "") {
      return this.can(
        "edit",
        {
          module
        }
      );
    },

    canDelete(module = "") {
      return this.can(
        "delete",
        {
          module
        }
      );
    },

    canApprove(module = "") {
      return this.can(
        "approve",
        {
          module
        }
      );
    },

    canExport(module = "") {
      return this.can(
        "export",
        {
          module
        }
      );
    },

    canAccessModule(module) {
      const normalizedModule =
        this.normalize(module);

      const role =
        this.getRoleInfo();

      if (!role) {
        return false;
      }

      const override =
        this.getModuleOverride(
          normalizedModule
        );

      if (
        override !== null
      ) {
        return override;
      }

      if (
        role.modules.includes("*")
      ) {
        return true;
      }

      if (
        role.modules.includes(
          normalizedModule
        )
      ) {
        return true;
      }

      const moduleRule =
        this.moduleRules[
          normalizedModule
        ];

      if (
        moduleRule &&
        Array.isArray(
          moduleRule.roles
        )
      ) {
        return moduleRule.roles.includes(
          this.currentRole
        );
      }

      return false;
    },

    hasMinimumLevel(level) {
      const role =
        this.getRoleInfo();

      return Boolean(
        role &&
        Number(role.level) >=
          Number(level || 0)
      );
    },

    /* =========================================================
       OVERRIDES
    ========================================================= */

    getOverride(action, context = {}) {
      const roleOverrides =
        this.overrides[
          this.currentRole
        ];

      if (
        !roleOverrides ||
        typeof roleOverrides !==
          "object"
      ) {
        return null;
      }

      const module =
        this.normalize(
          context.module
        );

      if (
        module &&
        roleOverrides.modules &&
        roleOverrides.modules[module] &&
        typeof roleOverrides
          .modules[module][action] ===
          "boolean"
      ) {
        return roleOverrides
          .modules[module][action];
      }

      if (
        roleOverrides.permissions &&
        typeof roleOverrides
          .permissions[action] ===
          "boolean"
      ) {
        return roleOverrides
          .permissions[action];
      }

      return null;
    },

    getModuleOverride(module) {
      const roleOverrides =
        this.overrides[
          this.currentRole
        ];

      if (
        !roleOverrides ||
        !roleOverrides.modules ||
        !roleOverrides.modules[module]
      ) {
        return null;
      }

      const rule =
        roleOverrides.modules[module];

      if (
        typeof rule.access ===
        "boolean"
      ) {
        return rule.access;
      }

      return null;
    },

    setPermissionOverride(
      role,
      action,
      allowed,
      options = {}
    ) {
      const roleId =
        this.normalize(role);

      const permission =
        this.normalize(action);

      if (
        !this.roles[roleId] ||
        !permission
      ) {
        return false;
      }

      this.overrides[roleId] =
        this.overrides[roleId] ||
        {};

      this.overrides[roleId]
        .permissions =
        this.overrides[roleId]
          .permissions ||
        {};

      this.overrides[roleId]
        .permissions[permission] =
        Boolean(allowed);

      this.save({
        eventName:
          "aiw:permissionOverrideChanged"
      });

      this.applyToDOM();

      return true;
    },

    setModuleOverride(
      role,
      module,
      allowed
    ) {
      const roleId =
        this.normalize(role);

      const moduleId =
        this.normalize(module);

      if (
        !this.roles[roleId] ||
        !moduleId
      ) {
        return false;
      }

      this.overrides[roleId] =
        this.overrides[roleId] ||
        {};

      this.overrides[roleId]
        .modules =
        this.overrides[roleId]
          .modules ||
        {};

      this.overrides[roleId]
        .modules[moduleId] =
        this.overrides[roleId]
          .modules[moduleId] ||
        {};

      this.overrides[roleId]
        .modules[moduleId].access =
        Boolean(allowed);

      this.save({
        eventName:
          "aiw:modulePermissionChanged"
      });

      this.applyToDOM();

      return true;
    },

    clearOverrides(role = null) {
      if (role) {
        const roleId =
          this.normalize(role);

        delete this.overrides[
          roleId
        ];
      } else {
        this.overrides = {};
      }

      this.save({
        eventName:
          "aiw:permissionOverridesCleared"
      });

      this.applyToDOM();

      return true;
    },

    /* =========================================================
       MODULE RULES
    ========================================================= */

    setModuleRule(
      module,
      rule = {}
    ) {
      const moduleId =
        this.normalize(module);

      if (!moduleId) {
        return false;
      }

      this.moduleRules[
        moduleId
      ] = {
        ...(this.moduleRules[
          moduleId
        ] || {}),
        ...this.clone(rule)
      };

      this.save({
        eventName:
          "aiw:moduleRuleChanged"
      });

      this.applyToDOM();

      return this.clone(
        this.moduleRules[
          moduleId
        ]
      );
    },

    getModuleRule(module) {
      return (
        this.clone(
          this.moduleRules[
            this.normalize(module)
          ]
        ) || null
      );
    },

    /* =========================================================
       AUTHORIZATION
    ========================================================= */

    authorize(
      action,
      context = {},
      options = {}
    ) {
      const allowed =
        this.can(
          action,
          context
        );

      this.recordAudit({
        action:
          this.normalize(action),

        module:
          context.module ||
          null,

        resource:
          context.resource ||
          null,

        resourceId:
          context.resourceId ||
          context.id ||
          null,

        result:
          allowed
            ? "allowed"
            : "denied",

        role:
          this.currentRole,

        source:
          options.source ||
          "authorization"
      });

      if (!allowed) {
        if (
          options.notify !== false
        ) {
          this.notifyDenied(
            action
          );
        }

        this.emit(
          "aiw:permissionDenied",
          {
            action:
              this.normalize(action),
            context:
              this.clone(context),
            role:
              this.currentRole
          }
        );

        return false;
      }

      this.emit(
        "aiw:permissionGranted",
        {
          action:
            this.normalize(action),
          context:
            this.clone(context),
          role:
            this.currentRole
        }
      );

      return true;
    },

    require(
      action,
      callback,
      context = {}
    ) {
      if (
        !this.authorize(
          action,
          context
        )
      ) {
        return false;
      }

      if (
        typeof callback ===
        "function"
      ) {
        return callback();
      }

      return true;
    },

    guardModule(module) {
      const allowed =
        this.canAccessModule(
          module
        );

      if (!allowed) {
        this.notifyDenied(
          "view"
        );

        this.emit(
          "aiw:moduleAccessDenied",
          {
            module,
            role:
              this.currentRole
          }
        );
      }

      return allowed;
    },

    /* =========================================================
       DOM PROTECTION
    ========================================================= */

    applyToDOM(root = document) {
      if (
        !root ||
        typeof root.querySelectorAll !==
          "function"
      ) {
        return;
      }

      this.applyActionPermissions(
        root
      );

      this.applyModulePermissions(
        root
      );

      this.applyRoleVisibility(
        root
      );

      this.applyLevelVisibility(
        root
      );

      this.updateRoleLabels(
        root
      );
    },

    applyActionPermissions(root) {
      root
        .querySelectorAll(
          "[data-permission]"
        )
        .forEach(element => {
          const permissions =
            String(
              element.getAttribute(
                "data-permission"
              ) || ""
            )
              .split(",")
              .map(item =>
                this.normalize(item)
              )
              .filter(Boolean);

          const mode =
            element.getAttribute(
              "data-permission-mode"
            ) || "all";

          const module =
            element.getAttribute(
              "data-permission-module"
            ) ||
            element.closest(
              "[data-current-module]"
            )?.getAttribute(
              "data-current-module"
            ) ||
            "";

          const allowed =
            mode === "any"
              ? this.canAny(
                  permissions,
                  {
                    module
                  }
                )
              : this.canAll(
                  permissions,
                  {
                    module
                  }
                );

          this.applyElementState(
            element,
            allowed
          );
        });
    },

    applyModulePermissions(root) {
      root
        .querySelectorAll(
          "[data-route], [data-module-access]"
        )
        .forEach(element => {
          const module =
            element.getAttribute(
              "data-module-access"
            ) ||
            element.getAttribute(
              "data-route"
            );

          if (!module) {
            return;
          }

          const allowed =
            this.canAccessModule(
              module
            );

          this.applyElementState(
            element,
            allowed,
            {
              hide:
                element.hasAttribute(
                  "data-hide-unauthorized"
                ) ||
                element.closest(
                  "nav"
                ) !== null
            }
          );
        });
    },

    applyRoleVisibility(root) {
      root
        .querySelectorAll(
          "[data-role]"
        )
        .forEach(element => {
          const roles =
            String(
              element.getAttribute(
                "data-role"
              ) || ""
            )
              .split(",")
              .map(item =>
                this.normalize(item)
              )
              .filter(Boolean);

          const allowed =
            roles.includes(
              this.currentRole
            ) ||
            roles.includes("*");

          this.applyElementState(
            element,
            allowed,
            {
              hide: true
            }
          );
        });
    },

    applyLevelVisibility(root) {
      root
        .querySelectorAll(
          "[data-min-role-level]"
        )
        .forEach(element => {
          const level =
            Number(
              element.getAttribute(
                "data-min-role-level"
              )
            );

          this.applyElementState(
            element,
            this.hasMinimumLevel(
              level
            ),
            {
              hide: true
            }
          );
        });
    },

    applyElementState(
      element,
      allowed,
      options = {}
    ) {
      element.classList.toggle(
        "aiw-permission-denied",
        !allowed
      );

      element.setAttribute(
        "data-permission-allowed",
        String(allowed)
      );

      if (
        options.hide === true
      ) {
        element.hidden =
          !allowed;

        return;
      }

      if (
        "disabled" in element
      ) {
        element.disabled =
          !allowed;
      }

      element.setAttribute(
        "aria-disabled",
        String(!allowed)
      );

      if (!allowed) {
        if (
          !element.hasAttribute(
            "data-original-title"
          )
        ) {
          element.setAttribute(
            "data-original-title",
            element.getAttribute(
              "title"
            ) || ""
          );
        }

        element.setAttribute(
          "title",
          "لا تملك صلاحية تنفيذ هذا الإجراء."
        );
      } else {
        const originalTitle =
          element.getAttribute(
            "data-original-title"
          );

        if (
          originalTitle !== null
        ) {
          if (originalTitle) {
            element.setAttribute(
              "title",
              originalTitle
            );
          } else {
            element.removeAttribute(
              "title"
            );
          }
        }
      }
    },

    updateRoleLabels(root) {
      const roleInfo =
        this.getRoleInfo();

      root
        .querySelectorAll(
          "[data-current-role]"
        )
        .forEach(element => {
          element.textContent =
            roleInfo?.title ||
            this.currentRole;
        });

      root
        .querySelectorAll(
          "[data-current-role-id]"
        )
        .forEach(element => {
          element.textContent =
            this.currentRole;
        });
    },

    /* =========================================================
       DOM EVENTS
    ========================================================= */

    bindEvents() {
      if (this._eventsBound) {
        return;
      }

      this._eventsBound = true;

      document.addEventListener(
        "click",
        event => {
          const protectedElement =
            event.target.closest(
              "[data-permission]"
            );

          if (!protectedElement) {
            return;
          }

          const permissions =
            String(
              protectedElement.getAttribute(
                "data-permission"
              ) || ""
            )
              .split(",")
              .map(item =>
                this.normalize(item)
              )
              .filter(Boolean);

          const mode =
            protectedElement.getAttribute(
              "data-permission-mode"
            ) || "all";

          const module =
            protectedElement.getAttribute(
              "data-permission-module"
            ) || "";

          const allowed =
            mode === "any"
              ? this.canAny(
                  permissions,
                  {
                    module
                  }
                )
              : this.canAll(
                  permissions,
                  {
                    module
                  }
                );

          if (!allowed) {
            event.preventDefault();
            event.stopImmediatePropagation();

            this.notifyDenied(
              permissions.join(", ")
            );

            this.recordAudit({
              action:
                permissions.join(","),
              module,
              result: "denied",
              role:
                this.currentRole,
              source:
                "dom-protection"
            });
          }
        },
        true
      );

      window.addEventListener(
        "aiw:moduleRendered",
        () => {
          this.scheduleDOMRefresh();
        }
      );

      window.addEventListener(
        "aiw:routeChanged",
        event => {
          const route =
            event?.detail?.route;

          if (
            route &&
            !this.canAccessModule(
              route
            )
          ) {
            this.emit(
              "aiw:moduleAccessDenied",
              {
                module: route,
                role:
                  this.currentRole
              }
            );
          }

          this.scheduleDOMRefresh();
        }
      );

      window.addEventListener(
        "aiw:settingsChanged",
        () => {
          this.scheduleRefresh();
        }
      );
    },

    startDOMObserver() {
      if (
        typeof MutationObserver ===
          "undefined"
      ) {
        return;
      }

      const target =
        document.getElementById(
          "appMain"
        ) ||
        document.querySelector(
          "[data-app-main]"
        ) ||
        document.body;

      if (!target) {
        return;
      }

      if (this._observer) {
        this._observer.disconnect();
      }

      this._observer =
        new MutationObserver(
          mutations => {
            const relevant =
              mutations.some(
                mutation =>
                  mutation.addedNodes &&
                  mutation.addedNodes.length
              );

            if (relevant) {
              this.scheduleDOMRefresh();
            }
          }
        );

      this._observer.observe(
        target,
        {
          childList: true,
          subtree: true
        }
      );
    },

    scheduleDOMRefresh() {
      window.clearTimeout(
        this._refreshTimer
      );

      this._refreshTimer =
        window.setTimeout(() => {
          this.applyToDOM();
        }, 60);
    },

    /* =========================================================
       STORE EVENTS
    ========================================================= */

    bindStore() {
      const store =
        this.getStore();

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
                "aiw:permissionsChanged",
                "aiw:roleChanged",
                "aiw:permissionOverrideChanged",
                "aiw:modulePermissionChanged",
                "aiw:permissionOverridesCleared",
                "aiw:moduleRuleChanged",
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
        }
      } catch (error) {
        console.warn(
          "[AIW.Permissions] Store subscription failed:",
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
          this.applyToDOM();
        }, 120);
    },

    /* =========================================================
       AUDIT LOG
    ========================================================= */

    recordAudit(entry = {}) {
      const store =
        this.getStore();

      const record = {
        id:
          entry.id ||
          `permission-audit-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        type:
          "permission",

        action:
          entry.action ||
          "UNKNOWN",

        module:
          entry.module ||
          null,

        resource:
          entry.resource ||
          null,

        resourceId:
          entry.resourceId ||
          null,

        result:
          entry.result ||
          "unknown",

        role:
          entry.role ||
          this.currentRole,

        previousRole:
          entry.previousRole ||
          null,

        source:
          entry.source ||
          "permissions-engine",

        createdAt:
          this.now(),

        engineVersion:
          this.version
      };

      try {
        if (
          store &&
          typeof store.getData === "function" &&
          typeof store.saveData === "function"
        ) {
          const data =
            store.getData();

          data.activity =
            Array.isArray(
              data.activity
            )
              ? data.activity
              : [];

          data.activity.unshift(
            record
          );

          data.activity =
            data.activity.slice(
              0,
              200
            );

          store.saveData(
            data,
            "aiw:permissionAuditRecorded"
          );
        }
      } catch (error) {
        console.warn(
          "[AIW.Permissions] Audit record was not saved:",
          error
        );
      }

      return record;
    },

    /* =========================================================
       NOTIFICATIONS
    ========================================================= */

    notifyDenied(action = "") {
      const notifications =
        window.AIW?.Notifications ||
        window.ATCNotifications;

      const message =
        action
          ? `لا تملك صلاحية تنفيذ الإجراء: ${action}.`
          : "لا تملك صلاحية تنفيذ هذا الإجراء.";

      if (
        notifications &&
        typeof notifications.warning ===
          "function"
      ) {
        notifications.warning(
          message
        );

        return;
      }

      console.warn(
        `[AIW.Permissions] ${message}`
      );
    },

    /* =========================================================
       STATE AND STATISTICS
    ========================================================= */

    getPermissions(
      role = null
    ) {
      const roleInfo =
        this.getRoleInfo(role);

      return roleInfo
        ? this.clone(
            roleInfo.permissions
          )
        : [];
    },

    getModules(role = null) {
      const roleInfo =
        this.getRoleInfo(role);

      return roleInfo
        ? this.clone(
            roleInfo.modules
          )
        : [];
    },

    getState() {
      return {
        version:
          this.version,

        currentRole:
          this.currentRole,

        roleInfo:
          this.getRoleInfo(),

        permissions:
          this.getPermissions(),

        modules:
          this.getModules(),

        overrides:
          this.clone(
            this.overrides
          ),

        moduleRules:
          this.clone(
            this.moduleRules
          ),

        statistics:
          this.statistics()
      };
    },

    statistics() {
      const roleInfo =
        this.getRoleInfo();

      return {
        currentRole:
          this.currentRole,

        roleTitle:
          roleInfo?.title ||
          this.currentRole,

        roleLevel:
          roleInfo?.level ||
          0,

        roles:
          Object.keys(
            this.roles
          ).length,

        permissions:
          roleInfo?.permissions
            ?.length || 0,

        modules:
          roleInfo?.modules
            ?.includes("*")
            ? "all"
            : roleInfo?.modules
                ?.length || 0,

        overrides:
          Object.keys(
            this.overrides[
              this.currentRole
            ] || {}
          ).length,

        updatedAt:
          this.now()
      };
    },

    /* =========================================================
       METADATA
    ========================================================= */

    registerMetadata() {
      const store =
        this.getStore();

      if (
        !store ||
        typeof store.getData !==
          "function" ||
        typeof store.saveData !==
          "function"
      ) {
        return;
      }

      try {
        const data =
          store.getData();

        data.meta =
          data.meta || {};

        data.meta.permissionsEngineVersion =
          this.version;

        data.meta.permissionsEngine =
          "Enterprise Role-Based Access Control";

        data.meta.currentRole =
          this.currentRole;

        data.meta.permissionsCapabilities = [
          "Role-Based Access Control",
          "Action Permissions",
          "Module Permissions",
          "Permission Overrides",
          "UI Protection",
          "Authorization Audit",
          "Approval Permissions"
        ];

        data.meta.lastPermissionsInitialization =
          this.now();

        store.saveData(
          data,
          "aiw:permissionsMetadataUpdated"
        );
      } catch (error) {
        console.warn(
          "[AIW.Permissions] Metadata registration skipped:",
          error
        );
      }
    },

    emit(name, detail = {}) {
      try {
        window.dispatchEvent(
          new CustomEvent(name, {
            detail:
              this.clone(detail)
          })
        );
      } catch (error) {
        console.warn(
          `[AIW.Permissions] Event "${name}" failed:`,
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

      if (this._observer) {
        this._observer.disconnect();
      }

      if (
        typeof this._storeUnsubscribe ===
          "function"
      ) {
        try {
          this._storeUnsubscribe();
        } catch (error) {
          console.warn(
            "[AIW.Permissions] Store unsubscribe failed:",
            error
          );
        }
      }

      this._observer = null;
      this._storeUnsubscribe = null;
      this._isSynchronizing = false;
      this._initialized = false;
    }
  };

  /* =========================================================
     GLOBAL REFERENCES
  ========================================================= */

  AIW.Permissions =
    Permissions;

  /*
   * Legacy compatibility:
   * Existing modules may still call ATCPermissions.
   */
  window.ATCPermissions =
    Permissions;

  /* =========================================================
     BOOTSTRAP
  ========================================================= */

  const bootstrap = () => {
    AIW.Permissions.init();
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