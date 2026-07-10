/* =========================================================
   AI Work - Notifications Engine V2.1
   Enterprise Notification + Alert Center

   Scope:
   - Toast Notifications
   - Persistent Notification Center
   - AIW.Store Integration
   - Read / Unread Management
   - Archive / Restore / Delete
   - Notification Actions
   - Smart Alerts
   - Cross-Module Events
   - Duplicate Prevention
   - RTL / LTR Support
   - Legacy ATCNotifications Compatibility
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};

  const Notifications = {
    id: "notifications-engine",
    version: "2.1.0",

    containerId: "atc-notifications",

    items: [],

    settings: {
      enabled: true,
      persistNotifications: true,
      showToasts: true,
      maxStoredItems: 200,
      maxVisibleToasts: 5,
      defaultDuration: 3200,
      position: "top-end",
      preventDuplicates: true,
      duplicateWindow: 5000,
      playSound: false
    },

    _initialized: false,
    _eventsBound: false,
    _storeUnsubscribe: null,
    _refreshTimer: null,
    _container: null,
    _recentNotifications: new Map(),
    _activeToastTimers: new Map(),
    _isSynchronizing: false,

    /* =========================================================
       INITIALIZATION
    ========================================================= */

    init() {
      if (this._initialized) {
        return this;
      }

      this._initialized = true;

      this.load();
      this.bindEvents();
      this.bindStore();
      this.registerMetadata();
      this.updateNotificationBadge();

      this.emit(
        "aiw:notificationsReady",
        {
          version: this.version,
          unread: this.getUnreadCount(),
          total: this.getNotifications().length
        }
      );

      return this;
    },

    /* =========================================================
       ENGINE ACCESS
    ========================================================= */

    getStore() {
      return window.AIW?.Store || null;
    },

    getAppSettings() {
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
          "[AIW.Notifications] Unable to read platform settings:",
          error
        );
      }

      return {};
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
          "[AIW.Notifications] Unable to read platform data:",
          error
        );
      }

      return window.AIW?.Data || {};
    },

    /* =========================================================
       GENERAL HELPERS
    ========================================================= */

    now() {
      return new Date().toISOString();
    },

    id(prefix = "notification") {
      return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;
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

    normalizeText(value) {
      return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
    },

    normalizeType(type) {
      const normalized =
        this.normalizeText(type);

      const typeAliases = {
        danger: "error",
        failed: "error",
        failure: "error",
        critical: "error",

        warn: "warning",
        pending: "warning",

        successful: "success",
        completed: "success",
        complete: "success",
        approved: "success",

        neutral: "info",
        message: "info"
      };

      return (
        typeAliases[normalized] ||
        (
          [
            "success",
            "error",
            "warning",
            "info"
          ].includes(normalized)
            ? normalized
            : "info"
        )
      );
    },

    escapeHTML(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },

    getDirection() {
      const appSettings =
        this.getAppSettings();

      return (
        appSettings.direction ||
        document.documentElement.dir ||
        "rtl"
      );
    },

    getTypeIcon(type) {
      return {
        success: "✓",
        error: "!",
        warning: "!",
        info: "i"
      }[this.normalizeType(type)] || "i";
    },

    getTypeTitle(type) {
      return {
        success: "تمت العملية",
        error: "تعذر إكمال العملية",
        warning: "تنبيه",
        info: "معلومة"
      }[this.normalizeType(type)] || "معلومة";
    },

    getTypeColor(type) {
      return {
        success: "#22c55e",
        error: "#ef4444",
        warning: "#f59e0b",
        info: "#3b82f6"
      }[this.normalizeType(type)] || "#3b82f6";
    },

    /* =========================================================
       LOAD AND SAVE
    ========================================================= */

    load() {
      const data = this.getData();

      this.items =
        this.toArray(
          data.notifications
        ).map(item =>
          this.normalizeNotification(
            item
          )
        );

      const storedSettings =
        data.notificationSettings;

      if (
        storedSettings &&
        typeof storedSettings === "object"
      ) {
        this.settings = {
          ...this.settings,
          ...storedSettings
        };
      }

      const appSettings =
        this.getAppSettings();

      if (
        appSettings.notifications === false
      ) {
        this.settings.enabled = false;
      }

      return this.getState();
    },

    save(options = {}) {
      if (this._isSynchronizing) {
        return this.getState();
      }

      const store = this.getStore();

      const items =
        this.items.slice(
          0,
          this.settings.maxStoredItems
        );

      this.items = items;

      this._isSynchronizing = true;

      try {
        if (
          store &&
          typeof store.set === "function"
        ) {
          const state = this.getData();

          const currentNotifications =
            this.toArray(
              state.notifications
            );

          const currentSettings =
            state.notificationSettings ||
            {};

          const itemsChanged =
            JSON.stringify(
              currentNotifications
            ) !== JSON.stringify(items);

          const settingsChanged =
            JSON.stringify(
              currentSettings
            ) !==
            JSON.stringify(
              this.settings
            );

          if (
            itemsChanged ||
            settingsChanged
          ) {
            store.patch(
              {
                notifications:
                  this.clone(items),

                notificationSettings:
                  this.clone(
                    this.settings
                  )
              },
              {
                eventName:
                  options.eventName ||
                  "aiw:notificationsChanged",

                backup:
                  options.backup !== false,

                notify:
                  options.notify !== false
              }
            );
          }
        }
      } catch (error) {
        console.warn(
          "[AIW.Notifications] Store synchronization failed:",
          error
        );
      } finally {
        this._isSynchronizing = false;
      }

      this.updateNotificationBadge();

      if (options.emit !== false) {
        this.emit(
          options.eventName ||
            "aiw:notificationsChanged",
          this.getState()
        );
      }

      return this.getState();
    },

    refreshFromStore() {
      if (this._isSynchronizing) {
        return this.getState();
      }

      const data = this.getData();

      const nextItems =
        this.toArray(
          data.notifications
        );

      const nextSettings =
        data.notificationSettings ||
        {};

      const currentSnapshot =
        JSON.stringify({
          items: this.items,
          settings: this.settings
        });

      const nextSnapshot =
        JSON.stringify({
          items: nextItems,
          settings: {
            ...this.settings,
            ...nextSettings
          }
        });

      if (
        currentSnapshot ===
        nextSnapshot
      ) {
        return this.getState();
      }

      this.load();
      this.updateNotificationBadge();

      this.emit(
        "aiw:notificationsRefreshed",
        this.getState()
      );

      return this.getState();
    },

    normalizeNotification(
      notification = {}
    ) {
      const type =
        this.normalizeType(
          notification.type
        );

      const currentTime =
        this.now();

      return {
        id:
          notification.id ||
          this.id(),

        title:
          notification.title ||
          this.getTypeTitle(type),

        message:
          notification.message ||
          notification.text ||
          "",

        type,

        source:
          notification.source ||
          "platform",

        category:
          notification.category ||
          "general",

        priority:
          notification.priority ||
          this.getDefaultPriority(type),

        read:
          notification.read === true,

        archived:
          notification.archived === true,

        persistent:
          notification.persistent !==
          false,

        toast:
          notification.toast !== false,

        route:
          notification.route ||
          notification.module ||
          "",

        action:
          notification.action ||
          "",

        actionLabel:
          notification.actionLabel ||
          notification.buttonText ||
          "",

        sourceId:
          notification.sourceId ||
          null,

        metadata:
          notification.metadata &&
          typeof notification.metadata ===
            "object"
            ? notification.metadata
            : {},

        createdAt:
          notification.createdAt ||
          currentTime,

        updatedAt:
          notification.updatedAt ||
          currentTime,

        readAt:
          notification.readAt ||
          null,

        archivedAt:
          notification.archivedAt ||
          null,

        expiresAt:
          notification.expiresAt ||
          null,

        ...this.clone(notification),

        type
      };
    },

    getDefaultPriority(type) {
      return {
        error: "high",
        warning: "medium",
        success: "low",
        info: "low"
      }[this.normalizeType(type)] || "low";
    },

    /* =========================================================
       CREATE NOTIFICATIONS
    ========================================================= */

    add(notification = {}) {
      if (
        typeof notification === "string"
      ) {
        notification = {
          message: notification
        };
      }

      const record =
        this.normalizeNotification(
          notification
        );

      if (
        this.settings.preventDuplicates &&
        this.isDuplicate(record)
      ) {
        return null;
      }

      if (
        record.persistent &&
        this.settings.persistNotifications
      ) {
        this.items.unshift(record);

        this.items =
          this.items.slice(
            0,
            this.settings.maxStoredItems
          );

        this.save({
          eventName:
            "aiw:notificationCreated",
          backup: false
        });
      }

      if (
        this.settings.enabled &&
        this.settings.showToasts &&
        record.toast !== false
      ) {
        this.showToast(record);
      }

      this.trackRecentNotification(
        record
      );

      this.emit(
        "aiw:notificationCreated",
        {
          notification:
            this.clone(record)
        }
      );

      return this.clone(record);
    },

    create(notification = {}) {
      return this.add(notification);
    },

    show(message, type = "info", options = {}) {
      return this.add({
        message,
        type,
        persistent:
          options.persistent ??
          false,
        toast:
          options.toast !== false,
        ...options
      });
    },

    success(message, options = {}) {
      return this.show(
        message,
        "success",
        options
      );
    },

    error(message, options = {}) {
      return this.show(
        message,
        "error",
        options
      );
    },

    warning(message, options = {}) {
      return this.show(
        message,
        "warning",
        options
      );
    },

    info(message, options = {}) {
      return this.show(
        message,
        "info",
        options
      );
    },

    alert({
      title = "تنبيه",
      message = "",
      type = "warning",
      priority = "medium",
      route = "",
      source = "platform",
      sourceId = null,
      metadata = {},
      action = "",
      actionLabel = ""
    } = {}) {
      return this.add({
        title,
        message,
        type,
        priority,
        route,
        source,
        sourceId,
        metadata,
        action,
        actionLabel,
        persistent: true,
        toast: true
      });
    },

    /* =========================================================
       DUPLICATE PREVENTION
    ========================================================= */

    getDuplicateKey(notification) {
      return [
        this.normalizeType(
          notification.type
        ),
        this.normalizeText(
          notification.title
        ),
        this.normalizeText(
          notification.message
        ),
        notification.sourceId || ""
      ].join("|");
    },

    isDuplicate(notification) {
      const key =
        this.getDuplicateKey(
          notification
        );

      const lastTime =
        this._recentNotifications.get(
          key
        );

      if (!lastTime) {
        return false;
      }

      return (
        Date.now() - lastTime <
        this.settings.duplicateWindow
      );
    },

    trackRecentNotification(
      notification
    ) {
      const key =
        this.getDuplicateKey(
          notification
        );

      this._recentNotifications.set(
        key,
        Date.now()
      );

      window.setTimeout(() => {
        this._recentNotifications.delete(
          key
        );
      }, this.settings.duplicateWindow);
    },

    /* =========================================================
       TOAST CONTAINER
    ========================================================= */

    getToastContainer() {
      if (
        this._container &&
        document.body.contains(
          this._container
        )
      ) {
        return this._container;
      }

      let container =
        document.getElementById(
          this.containerId
        );

      if (!container) {
        container =
          document.createElement(
            "div"
          );

        container.id =
          this.containerId;

        container.className =
          "aiw-notifications-container";

        container.setAttribute(
          "aria-live",
          "polite"
        );

        container.setAttribute(
          "aria-atomic",
          "false"
        );

        container.style.cssText =
          this.getContainerStyles();

        document.body.appendChild(
          container
        );
      }

      this._container =
        container;

      return container;
    },

    getContainerStyles() {
      const direction =
        this.getDirection();

      const isRTL =
        direction === "rtl";

      const position =
        this.settings.position;

      let vertical = "top: 16px;";
      let horizontal =
        isRTL
          ? "right: 16px;"
          : "left: 16px;";

      if (
        position.includes("bottom")
      ) {
        vertical =
          "bottom: 16px;";
      }

      if (
        position.includes("start")
      ) {
        horizontal =
          isRTL
            ? "right: 16px;"
            : "left: 16px;";
      }

      if (
        position.includes("end")
      ) {
        horizontal =
          isRTL
            ? "left: 16px;"
            : "right: 16px;";
      }

      return `
        position: fixed;
        ${vertical}
        ${horizontal}
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: min(360px, calc(100vw - 32px));
        max-width: 360px;
        pointer-events: none;
      `;
    },

    /* =========================================================
       TOAST DISPLAY
    ========================================================= */

    showToast(notification = {}) {
      if (!this.settings.enabled) {
        return null;
      }

      const record =
        notification.id
          ? notification
          : this.normalizeNotification(
              notification
            );

      const container =
        this.getToastContainer();

      this.enforceToastLimit(
        container
      );

      const toast =
        document.createElement("div");

      toast.className =
        `aiw-notification-toast aiw-notification-${record.type}`;

      toast.setAttribute(
        "data-notification-id",
        record.id
      );

      toast.setAttribute(
        "role",
        record.type === "error"
          ? "alert"
          : "status"
      );

      toast.style.cssText =
        this.getToastStyles(record.type);

      toast.innerHTML = `
        <div
          class="aiw-notification-icon"
          style="
            width: 30px;
            height: 30px;
            flex: 0 0 30px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            font-weight: 800;
            background: ${this.getTypeColor(
              record.type
            )};
            color: #ffffff;
          "
        >
          ${this.escapeHTML(
            this.getTypeIcon(
              record.type
            )
          )}
        </div>

        <div
          class="aiw-notification-content"
          style="
            min-width: 0;
            flex: 1;
          "
        >
          <strong
            style="
              display: block;
              margin-bottom: 2px;
              color: #ffffff;
              font-size: 13px;
              line-height: 1.45;
            "
          >
            ${this.escapeHTML(
              record.title
            )}
          </strong>

          ${
            record.message
              ? `
                <p
                  style="
                    margin: 0;
                    color: rgba(255,255,255,.82);
                    font-size: 12px;
                    line-height: 1.55;
                    overflow-wrap: anywhere;
                  "
                >
                  ${this.escapeHTML(
                    record.message
                  )}
                </p>
              `
              : ""
          }

          ${
            record.actionLabel &&
            (
              record.route ||
              record.action
            )
              ? `
                <button
                  type="button"
                  data-notification-action
                  style="
                    margin-top: 8px;
                    padding: 6px 10px;
                    border: 1px solid rgba(255,255,255,.22);
                    border-radius: 9px;
                    background: rgba(255,255,255,.1);
                    color: #ffffff;
                    font: inherit;
                    font-size: 11px;
                    cursor: pointer;
                  "
                >
                  ${this.escapeHTML(
                    record.actionLabel
                  )}
                </button>
              `
              : ""
          }
        </div>

        <button
          type="button"
          data-notification-close
          aria-label="إغلاق التنبيه"
          style="
            width: 24px;
            height: 24px;
            flex: 0 0 24px;
            display: grid;
            place-items: center;
            border: 0;
            border-radius: 8px;
            background: transparent;
            color: rgba(255,255,255,.72);
            font-size: 18px;
            cursor: pointer;
          "
        >
          ×
        </button>
      `;

      const closeButton =
        toast.querySelector(
          "[data-notification-close]"
        );

      closeButton?.addEventListener(
        "click",
        event => {
          event.stopPropagation();
          this.dismissToast(toast);
        }
      );

      const actionButton =
        toast.querySelector(
          "[data-notification-action]"
        );

      actionButton?.addEventListener(
        "click",
        event => {
          event.stopPropagation();

          this.executeNotificationAction(
            record
          );

          this.markAsRead(
            record.id
          );

          this.dismissToast(toast);
        }
      );

      toast.addEventListener(
        "click",
        event => {
          if (
            event.target.closest(
              "button"
            )
          ) {
            return;
          }

          if (
            record.route ||
            record.action
          ) {
            this.executeNotificationAction(
              record
            );

            this.markAsRead(
              record.id
            );

            this.dismissToast(toast);
          }
        }
      );

      container.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform =
          "translateY(0)";
      });

      const duration =
        Number(
          record.duration ||
          this.settings.defaultDuration
        );

      if (
        duration > 0 &&
        record.autoClose !== false
      ) {
        const timer =
          window.setTimeout(() => {
            this.dismissToast(toast);
          }, duration);

        this._activeToastTimers.set(
          record.id,
          timer
        );
      }

      return toast;
    },

    getToastStyles(type) {
      const direction =
        this.getDirection();

      const borderSide =
        direction === "rtl"
          ? "border-right"
          : "border-left";

      return `
        pointer-events: auto;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 13px 14px;
        border-radius: 16px;
        background: rgba(17,24,39,.97);
        color: #ffffff;
        box-shadow: 0 14px 40px rgba(15,23,42,.22);
        ${borderSide}: 5px solid ${this.getTypeColor(
          type
        )};
        opacity: 0;
        transform: translateY(-8px);
        transition:
          opacity .25s ease,
          transform .25s ease;
        cursor: default;
        direction: ${direction};
        text-align: ${
          direction === "rtl"
            ? "right"
            : "left"
        };
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
      `;
    },

    enforceToastLimit(container) {
      const toasts =
        Array.from(
          container.querySelectorAll(
            ".aiw-notification-toast"
          )
        );

      const max =
        Math.max(
          1,
          Number(
            this.settings
              .maxVisibleToasts
          ) || 5
        );

      if (toasts.length < max) {
        return;
      }

      const extraCount =
        toasts.length - max + 1;

      toasts
        .slice(0, extraCount)
        .forEach(toast =>
          this.dismissToast(
            toast,
            false
          )
        );
    },

    dismissToast(
      toastOrId,
      animate = true
    ) {
      const toast =
        typeof toastOrId === "string"
          ? document.querySelector(
              `[data-notification-id="${CSS.escape(
                toastOrId
              )}"]`
            )
          : toastOrId;

      if (!toast) {
        return false;
      }

      const notificationId =
        toast.getAttribute(
          "data-notification-id"
        );

      if (
        notificationId &&
        this._activeToastTimers.has(
          notificationId
        )
      ) {
        window.clearTimeout(
          this._activeToastTimers.get(
            notificationId
          )
        );

        this._activeToastTimers.delete(
          notificationId
        );
      }

      if (!animate) {
        toast.remove();
        return true;
      }

      toast.style.opacity = "0";
      toast.style.transform =
        "translateY(-8px)";

      window.setTimeout(() => {
        toast.remove();
      }, 260);

      return true;
    },

    dismissAllToasts() {
      const container =
        this.getToastContainer();

      container
        .querySelectorAll(
          ".aiw-notification-toast"
        )
        .forEach(toast =>
          this.dismissToast(
            toast
          )
        );
    },

    /* =========================================================
       NOTIFICATION ACTIONS
    ========================================================= */

    executeNotificationAction(
      notification
    ) {
      if (!notification) {
        return false;
      }

      if (
        typeof notification.action ===
          "function"
      ) {
        try {
          notification.action(
            this.clone(notification)
          );

          return true;
        } catch (error) {
          console.error(
            "[AIW.Notifications] Notification action failed:",
            error
          );

          return false;
        }
      }

      if (notification.route) {
        const router =
          window.AIW?.Router ||
          window.ATCRouter;

        const app =
          window.AIW?.App ||
          window.ATCApp;

        if (
          router &&
          typeof router.navigate ===
            "function"
        ) {
          router.navigate(
            notification.route
          );

          return true;
        }

        if (
          app &&
          typeof app.go === "function"
        ) {
          app.go(
            notification.route
          );

          return true;
        }

        window.location.hash =
          notification.route;

        return true;
      }

      if (
        typeof notification.action ===
          "string" &&
        notification.action
      ) {
        this.emit(
          "aiw:notificationAction",
          {
            action:
              notification.action,

            notification:
              this.clone(
                notification
              )
          }
        );

        return true;
      }

      return false;
    },

    /* =========================================================
       READ MANAGEMENT
    ========================================================= */

    markAsRead(id) {
      let updatedItem = null;

      this.items =
        this.items.map(item => {
          if (
            String(item.id) !==
            String(id)
          ) {
            return item;
          }

          updatedItem = {
            ...item,
            read: true,
            readAt:
              item.readAt ||
              this.now(),
            updatedAt:
              this.now()
          };

          return updatedItem;
        });

      if (!updatedItem) {
        return null;
      }

      this.save({
        eventName:
          "aiw:notificationRead",
        backup: false
      });

      return this.clone(
        updatedItem
      );
    },

    markAsUnread(id) {
      let updatedItem = null;

      this.items =
        this.items.map(item => {
          if (
            String(item.id) !==
            String(id)
          ) {
            return item;
          }

          updatedItem = {
            ...item,
            read: false,
            readAt: null,
            updatedAt:
              this.now()
          };

          return updatedItem;
        });

      if (!updatedItem) {
        return null;
      }

      this.save({
        eventName:
          "aiw:notificationUnread",
        backup: false
      });

      return this.clone(
        updatedItem
      );
    },

    markAllAsRead() {
      const currentTime =
        this.now();

      let changed = false;

      this.items =
        this.items.map(item => {
          if (
            item.read ||
            item.archived
          ) {
            return item;
          }

          changed = true;

          return {
            ...item,
            read: true,
            readAt: currentTime,
            updatedAt:
              currentTime
          };
        });

      if (!changed) {
        return 0;
      }

      this.save({
        eventName:
          "aiw:allNotificationsRead",
        backup: false
      });

      return this.items.length;
    },

    /* =========================================================
       ARCHIVE AND DELETE
    ========================================================= */

    archive(id) {
      let archivedItem = null;

      this.items =
        this.items.map(item => {
          if (
            String(item.id) !==
            String(id)
          ) {
            return item;
          }

          archivedItem = {
            ...item,
            archived: true,
            archivedAt:
              this.now(),
            updatedAt:
              this.now()
          };

          return archivedItem;
        });

      if (!archivedItem) {
        return null;
      }

      this.save({
        eventName:
          "aiw:notificationArchived",
        backup: false
      });

      return this.clone(
        archivedItem
      );
    },

    restore(id) {
      let restoredItem = null;

      this.items =
        this.items.map(item => {
          if (
            String(item.id) !==
            String(id)
          ) {
            return item;
          }

          restoredItem = {
            ...item,
            archived: false,
            archivedAt: null,
            updatedAt:
              this.now()
          };

          return restoredItem;
        });

      if (!restoredItem) {
        return null;
      }

      this.save({
        eventName:
          "aiw:notificationRestored",
        backup: false
      });

      return this.clone(
        restoredItem
      );
    },

    remove(id) {
      const exists =
        this.items.some(
          item =>
            String(item.id) ===
            String(id)
        );

      if (!exists) {
        return false;
      }

      this.items =
        this.items.filter(
          item =>
            String(item.id) !==
            String(id)
        );

      this.save({
        eventName:
          "aiw:notificationDeleted",
        backup: false
      });

      this.dismissToast(id);

      return true;
    },

    delete(id) {
      return this.remove(id);
    },

    clear(options = {}) {
      const includeArchived =
        options.includeArchived !==
        false;

      const readOnly =
        options.readOnly === true;

      const previousCount =
        this.items.length;

      this.items =
        this.items.filter(item => {
          if (
            !includeArchived &&
            item.archived
          ) {
            return true;
          }

          if (
            readOnly &&
            !item.read
          ) {
            return true;
          }

          return false;
        });

      const removedCount =
        previousCount -
        this.items.length;

      if (!removedCount) {
        return 0;
      }

      this.save({
        eventName:
          "aiw:notificationsCleared",
        backup: false
      });

      return removedCount;
    },

    clearAll() {
      return this.clear({
        includeArchived: true
      });
    },

    /* =========================================================
       QUERY METHODS
    ========================================================= */

    getNotifications(options = {}) {
      let result =
        this.items.filter(item => {
          if (
            this.isExpired(item)
          ) {
            return false;
          }

          if (
            options.includeArchived !==
              true &&
            item.archived
          ) {
            return false;
          }

          return true;
        });

      if (
        options.unread === true
      ) {
        result =
          result.filter(
            item => !item.read
          );
      }

      if (
        options.read === true
      ) {
        result =
          result.filter(
            item => item.read
          );
      }

      if (options.type) {
        const type =
          this.normalizeType(
            options.type
          );

        result =
          result.filter(
            item =>
              item.type === type
          );
      }

      if (options.source) {
        const source =
          this.normalizeText(
            options.source
          );

        result =
          result.filter(
            item =>
              this.normalizeText(
                item.source
              ) === source
          );
      }

      if (options.category) {
        const category =
          this.normalizeText(
            options.category
          );

        result =
          result.filter(
            item =>
              this.normalizeText(
                item.category
              ) === category
          );
      }

      result.sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      );

      if (
        options.limit !== undefined
      ) {
        result =
          result.slice(
            0,
            Math.max(
              0,
              Number(
                options.limit
              ) || 0
            )
          );
      }

      return this.clone(result);
    },

    getAll(options = {}) {
      return this.getNotifications(
        options
      );
    },

    getUnread() {
      return this.getNotifications({
        unread: true
      });
    },

    getUnreadCount() {
      return this.getUnread().length;
    },

    getArchived() {
      return this.items
        .filter(
          item =>
            item.archived &&
            !this.isExpired(item)
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        )
        .map(item =>
          this.clone(item)
        );
    },

    find(id) {
      const item =
        this.items.find(
          notification =>
            String(
              notification.id
            ) === String(id)
        );

      return item
        ? this.clone(item)
        : null;
    },

    isExpired(notification) {
      if (!notification.expiresAt) {
        return false;
      }

      const expiresAt =
        new Date(
          notification.expiresAt
        ).getTime();

      if (
        Number.isNaN(expiresAt)
      ) {
        return false;
      }

      return expiresAt <= Date.now();
    },

    cleanupExpired() {
      const previousCount =
        this.items.length;

      this.items =
        this.items.filter(
          item =>
            !this.isExpired(item)
        );

      const removed =
        previousCount -
        this.items.length;

      if (removed) {
        this.save({
          eventName:
            "aiw:expiredNotificationsRemoved",
          backup: false
        });
      }

      return removed;
    },

    /* =========================================================
       STATISTICS
    ========================================================= */

    statistics() {
      const active =
        this.getNotifications();

      return {
        total:
          active.length,

        unread:
          active.filter(
            item => !item.read
          ).length,

        read:
          active.filter(
            item => item.read
          ).length,

        archived:
          this.getArchived().length,

        success:
          active.filter(
            item =>
              item.type ===
              "success"
          ).length,

        warning:
          active.filter(
            item =>
              item.type ===
              "warning"
          ).length,

        error:
          active.filter(
            item =>
              item.type ===
              "error"
          ).length,

        info:
          active.filter(
            item =>
              item.type ===
              "info"
          ).length,

        highPriority:
          active.filter(
            item =>
              this.normalizeText(
                item.priority
              ) === "high" ||
              this.normalizeText(
                item.priority
              ) === "عالية"
          ).length,

        updatedAt:
          this.now()
      };
    },

    getState() {
      return {
        version:
          this.version,

        settings:
          this.clone(
            this.settings
          ),

        notifications:
          this.getNotifications({
            includeArchived: true
          }),

        statistics:
          this.statistics()
      };
    },

    /* =========================================================
       SETTINGS
    ========================================================= */

    getSettings() {
      return this.clone(
        this.settings
      );
    },

    updateSettings(
      updates = {}
    ) {
      this.settings = {
        ...this.settings,
        ...this.clone(updates)
      };

      if (
        Number(
          this.settings
            .maxStoredItems
        ) < 1
      ) {
        this.settings.maxStoredItems =
          200;
      }

      if (
        Number(
          this.settings
            .maxVisibleToasts
        ) < 1
      ) {
        this.settings.maxVisibleToasts =
          5;
      }

      this.save({
        eventName:
          "aiw:notificationSettingsUpdated",
        backup: false
      });

      if (this._container) {
        this._container.style.cssText =
          this.getContainerStyles();
      }

      return this.getSettings();
    },

    enable() {
      return this.updateSettings({
        enabled: true
      });
    },

    disable() {
      this.dismissAllToasts();

      return this.updateSettings({
        enabled: false
      });
    },

    /* =========================================================
       BADGE SYNCHRONIZATION
    ========================================================= */

    updateNotificationBadge() {
      const count =
        this.getUnreadCount();

      document
        .querySelectorAll(
          "[data-notification-count]"
        )
        .forEach(element => {
          element.textContent =
            count > 99
              ? "99+"
              : String(count);

          element.hidden =
            count === 0;

          element.setAttribute(
            "aria-label",
            `${count} تنبيهات غير مقروءة`
          );
        });

      document
        .querySelectorAll(
          "[data-notification-badge]"
        )
        .forEach(element => {
          element.classList.toggle(
            "has-notifications",
            count > 0
          );

          element.setAttribute(
            "data-count",
            String(count)
          );
        });

      this.emit(
        "aiw:notificationCountChanged",
        {
          count
        }
      );

      return count;
    },

    /* =========================================================
       SMART PLATFORM ALERTS
    ========================================================= */

    createRiskAlert(risk = {}) {
      const level =
        risk.level ||
        risk.riskLevel ||
        risk.severity ||
        "";

      const highRisk =
        this.normalizeText(level)
          .includes("high") ||
        this.normalizeText(level)
          .includes("critical") ||
        String(level).includes("عال") ||
        String(level).includes("حرج");

      if (!highRisk) {
        return null;
      }

      return this.alert({
        title:
          "مخاطر تحتاج مراجعة",

        message:
          risk.title ||
          risk.name ||
          "تم رصد خطر مرتفع يحتاج إلى معالجة.",

        type: "error",
        priority: "high",
        route: "governance",
        source: "risk-engine",
        sourceId:
          risk.id ||
          null,

        action:
          "OPEN_RISK",

        actionLabel:
          "فتح الحوكمة",

        metadata: {
          riskLevel: level
        }
      });
    },

    createProjectAlert(
      project = {}
    ) {
      const status =
        this.normalizeText(
          project.status
        );

      const delayed =
        status.includes(
          "delayed"
        ) ||
        status.includes(
          "blocked"
        ) ||
        String(
          project.status || ""
        ).includes("متأخر") ||
        String(
          project.status || ""
        ).includes("متعثر");

      if (!delayed) {
        return null;
      }

      return this.alert({
        title:
          "مشروع يحتاج تدخلاً",

        message:
          project.title ||
          project.name ||
          "يوجد مشروع متأخر أو متعثر.",

        type: "warning",
        priority: "high",
        route: "projects",
        source:
          "project-engine",
        sourceId:
          project.id ||
          null,

        action:
          "OPEN_PROJECT",

        actionLabel:
          "فتح المشروع"
      });
    },

    createKpiAlert(kpi = {}) {
      const score =
        Number(
          kpi.score ??
          kpi.performance ??
          kpi.achievement ??
          kpi.percentage
        );

      if (
        Number.isFinite(score) &&
        score >= 60
      ) {
        return null;
      }

      const status =
        this.normalizeText(
          kpi.status
        );

      const criticalStatus =
        status.includes("red") ||
        status.includes(
          "critical"
        ) ||
        status.includes(
          "failed"
        ) ||
        String(
          kpi.status || ""
        ).includes("متأخر") ||
        String(
          kpi.status || ""
        ).includes("حرج");

      if (
        !criticalStatus &&
        !Number.isFinite(score)
      ) {
        return null;
      }

      return this.alert({
        title:
          "مؤشر أداء يحتاج متابعة",

        message:
          kpi.title ||
          kpi.name ||
          "يوجد مؤشر أداء أقل من المستوى المطلوب.",

        type: "warning",
        priority: "medium",
        route: "kpis",
        source: "kpi-engine",
        sourceId:
          kpi.id ||
          null,

        action:
          "OPEN_KPI",

        actionLabel:
          "فتح المؤشرات",

        metadata: {
          score:
            Number.isFinite(score)
              ? score
              : null
        }
      });
    },

    /* =========================================================
       PLATFORM EVENTS
    ========================================================= */

    bindEvents() {
      if (this._eventsBound) {
        return;
      }

      this._eventsBound = true;

      window.addEventListener(
        "aiw:notificationRequested",
        event => {
          this.add(
            event?.detail ||
            {}
          );
        }
      );

      window.addEventListener(
        "aiw:riskUpdated",
        event => {
          const risk =
            event?.detail?.risk ||
            event?.detail;

          if (risk) {
            this.createRiskAlert(
              risk
            );
          }
        }
      );

      window.addEventListener(
        "aiw:projectUpdated",
        event => {
          const project =
            event?.detail?.project ||
            event?.detail;

          if (project) {
            this.createProjectAlert(
              project
            );
          }
        }
      );

      window.addEventListener(
        "aiw:kpiUpdated",
        event => {
          const kpi =
            event?.detail?.kpi ||
            event?.detail;

          if (kpi) {
            this.createKpiAlert(
              kpi
            );
          }
        }
      );

      window.addEventListener(
        "aiw:workflowFailed",
        event => {
          const workflow =
            event?.detail?.workflow ||
            {};

          this.alert({
            title:
              "تعذر تنفيذ تدفق عمل",

            message:
              workflow.title ||
              workflow.name ||
              "فشل تنفيذ أحد تدفقات العمل.",

            type: "error",
            priority: "high",
            route: "automation",
            source:
              "automation-engine",

            sourceId:
              workflow.id ||
              null,

            actionLabel:
              "فتح الأتمتة"
          });
        }
      );

      window.addEventListener(
        "aiw:approvalCreated",
        event => {
          const approval =
            event?.detail?.approval ||
            {};

          this.alert({
            title:
              "طلب اعتماد جديد",

            message:
              approval.title ||
              "يوجد طلب اعتماد يحتاج إلى مراجعة.",

            type: "warning",
            priority: "medium",
            route: "automation",
            source:
              "approval-engine",

            sourceId:
              approval.id ||
              null,

            actionLabel:
              "فتح الموافقات"
          });
        }
      );

      window.addEventListener(
        "aiw:approvalApproved",
        event => {
          const approval =
            event?.detail?.approval ||
            {};

          this.success(
            approval.title
              ? `تم اعتماد: ${approval.title}`
              : "تم اعتماد الطلب بنجاح.",
            {
              persistent: true,
              route: "automation",
              source:
                "approval-engine",
              sourceId:
                approval.id ||
                null
            }
          );
        }
      );

      window.addEventListener(
        "aiw:approvalRejected",
        event => {
          const approval =
            event?.detail?.approval ||
            {};

          this.warning(
            approval.title
              ? `تم رفض: ${approval.title}`
              : "تم رفض طلب الاعتماد.",
            {
              persistent: true,
              route: "automation",
              source:
                "approval-engine",
              sourceId:
                approval.id ||
                null
            }
          );
        }
      );

      window.addEventListener(
        "aiw:dataImported",
        () => {
          this.success(
            "تم استيراد بيانات المنصة بنجاح."
          );
        }
      );

      window.addEventListener(
        "aiw:dataRestored",
        () => {
          this.success(
            "تمت استعادة النسخة الاحتياطية بنجاح."
          );
        }
      );

      window.addEventListener(
        "aiw:dataReset",
        () => {
          this.warning(
            "تمت إعادة بيانات المنصة إلى الإعدادات الافتراضية."
          );
        }
      );

      window.addEventListener(
        "aiw:settingsChanged",
        event => {
          const settings =
            event?.detail ||
            {};

          if (
            settings.notifications ===
            false
          ) {
            this.settings.enabled =
              false;

            this.dismissAllToasts();
          } else if (
            settings.notifications ===
            true
          ) {
            this.settings.enabled =
              true;
          }
        }
      );

      document.addEventListener(
        "visibilitychange",
        () => {
          if (
            document.visibilityState ===
            "visible"
          ) {
            this.cleanupExpired();
            this.updateNotificationBadge();
          }
        }
      );
    },

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
                "aiw:notificationsChanged",
                "aiw:notificationCreated",
                "aiw:notificationRead",
                "aiw:notificationUnread",
                "aiw:allNotificationsRead",
                "aiw:notificationArchived",
                "aiw:notificationRestored",
                "aiw:notificationDeleted",
                "aiw:notificationsCleared",
                "aiw:expiredNotificationsRemoved",
                "aiw:notificationSettingsUpdated",
                "aiw:metadataChanged",
                "persist",
                "settingsPersisted"
              ];

              if (
                ignoredEvents.includes(
                  type
                )
              ) {
                return;
              }

              this.scheduleRefresh();
            });
        }
      } catch (error) {
        console.warn(
          "[AIW.Notifications] Store subscription failed:",
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
          `[AIW.Notifications] Event "${name}" failed:`,
          error
        );
      }
    },

    /* =========================================================
       METADATA
    ========================================================= */

    registerMetadata() {
      const store =
        this.getStore();

      if (
        !store ||
        typeof store.setMetadata !==
          "function"
      ) {
        return;
      }

      try {
        store.setMetadata({
          notificationsEngineVersion:
            this.version,

          notificationsEngine:
            "Enterprise Notification and Alert Center",

          notificationCapabilities: [
            "Toast Notifications",
            "Persistent Notification Center",
            "Read Management",
            "Archive Management",
            "Smart Risk Alerts",
            "Project Alerts",
            "KPI Alerts",
            "Workflow Alerts",
            "Notification Actions"
          ],

          lastNotificationsInitialization:
            this.now()
        });
      } catch (error) {
        console.warn(
          "[AIW.Notifications] Metadata registration skipped:",
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

      this._activeToastTimers.forEach(
        timer => {
          window.clearTimeout(timer);
        }
      );

      this._activeToastTimers.clear();
      this._recentNotifications.clear();

      if (
        typeof this._storeUnsubscribe ===
          "function"
      ) {
        try {
          this._storeUnsubscribe();
        } catch (error) {
          console.warn(
            "[AIW.Notifications] Store unsubscribe failed:",
            error
          );
        }
      }

      this.dismissAllToasts();

      this._storeUnsubscribe = null;
      this._container = null;
      this._isSynchronizing = false;
      this._initialized = false;
    }
  };

  /* =========================================================
     GLOBAL REFERENCES
  ========================================================= */

  AIW.Notifications =
    Notifications;

  /*
   * Legacy compatibility:
   * Existing modules may still call ATCNotifications.
   */
  window.ATCNotifications =
    Notifications;

  /* =========================================================
     BOOTSTRAP
  ========================================================= */

  const bootstrap = () => {
    AIW.Notifications.init();
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