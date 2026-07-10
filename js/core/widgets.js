/* =========================================================
   AI Work - Core Widgets Engine V1.1
   Enterprise Reusable UI Components

   Scope:
   - Shared UI Components
   - Safe HTML Rendering
   - Unified Number Formatting
   - Status Intelligence
   - Navigation Actions
   - Empty and Error States
   - Automatic Global Page Credit
   - Legacy Compatibility
   - No UI Design Changes
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};

  const Widgets = {
    id: "widgets",
    version: "1.1.0",

    _initialized: false,
    _eventsBound: false,
    _creditObserver: null,
    _creditTimer: null,

    /* =========================================================
       INITIALIZATION
    ========================================================= */

    init() {
      if (this._initialized) {
        this.ensureGlobalPageCredit();
        return this;
      }

      this._initialized = true;

      this.bindEvents();
      this.startGlobalPageCredit();
      this.registerMetadata();

      return this;
    },

    /* =========================================================
       GENERAL HELPERS
    ========================================================= */

    escape(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },

    escapeAttribute(value) {
      return this.escape(value)
        .replace(/`/g, "&#096;");
    },

    normalizeText(value) {
      return String(value ?? "")
        .trim()
        .toLowerCase();
    },

    clamp(value, min = 0, max = 100) {
      const number = Number(value);

      if (!Number.isFinite(number)) {
        return min;
      }

      return Math.min(
        max,
        Math.max(min, number)
      );
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

    getSettings() {
      try {
        if (
          window.AIW?.Store &&
          typeof AIW.Store.getSettings === "function"
        ) {
          return AIW.Store.getSettings();
        }
      } catch (error) {
        console.warn(
          "[AIW.Widgets] Unable to read platform settings:",
          error
        );
      }

      return {
        language: "ar",
        locale: "ar-AE",
        direction: "rtl"
      };
    },

    getLocale() {
      const settings = this.getSettings();

      if (settings.locale) {
        return settings.locale;
      }

      return settings.language === "en"
        ? "en-US"
        : "ar-AE";
    },

    /* =========================================================
       FORMATTERS
    ========================================================= */

    formatNumber(value, options = {}) {
      const number = Number(value);

      if (!Number.isFinite(number)) {
        return options.fallback ?? "0";
      }

      try {
        return new Intl.NumberFormat(
          options.locale || this.getLocale(),
          {
            maximumFractionDigits:
              options.maximumFractionDigits ?? 2,

            minimumFractionDigits:
              options.minimumFractionDigits ?? 0,

            useGrouping:
              options.useGrouping !== false
          }
        ).format(number);
      } catch (error) {
        return number.toLocaleString();
      }
    },

    formatCompactNumber(value, options = {}) {
      const number = Number(value);

      if (!Number.isFinite(number)) {
        return options.fallback ?? "0";
      }

      try {
        return new Intl.NumberFormat(
          options.locale || this.getLocale(),
          {
            notation: "compact",
            maximumFractionDigits:
              options.maximumFractionDigits ?? 1
          }
        ).format(number);
      } catch (error) {
        if (Math.abs(number) >= 1000000) {
          return `${(
            number / 1000000
          ).toFixed(1)}M`;
        }

        if (Math.abs(number) >= 1000) {
          return `${(
            number / 1000
          ).toFixed(1)}K`;
        }

        return String(number);
      }
    },

    formatAED(value, options = {}) {
      const number = Number(value);

      if (!Number.isFinite(number)) {
        return options.fallback ?? "0 AED";
      }

      if (
        options.compact !== false &&
        Math.abs(number) >= 1000000
      ) {
        const compactValue =
          number / 1000000;

        const decimals =
          Number.isInteger(compactValue)
            ? 0
            : 1;

        return `${compactValue.toFixed(
          decimals
        )}M AED`;
      }

      if (
        options.compact === true &&
        Math.abs(number) >= 1000
      ) {
        return `${this.formatCompactNumber(
          number,
          options
        )} AED`;
      }

      return `${this.formatNumber(
        number,
        {
          ...options,
          maximumFractionDigits:
            options.maximumFractionDigits ?? 0
        }
      )} AED`;
    },

    formatCurrency(
      value,
      currency = "AED",
      options = {}
    ) {
      const number = Number(value);

      if (!Number.isFinite(number)) {
        return options.fallback ?? `0 ${currency}`;
      }

      try {
        return new Intl.NumberFormat(
          options.locale || this.getLocale(),
          {
            style: "currency",
            currency,
            maximumFractionDigits:
              options.maximumFractionDigits ?? 0
          }
        ).format(number);
      } catch (error) {
        return `${this.formatNumber(
          number,
          options
        )} ${currency}`;
      }
    },

    percent(value, options = {}) {
      const number = this.clamp(
        value,
        options.min ?? 0,
        options.max ?? 100
      );

      const rounded =
        options.decimals !== undefined
          ? Number(number).toFixed(
              options.decimals
            )
          : Math.round(number);

      return `${rounded}%`;
    },

    formatDate(value, options = {}) {
      if (!value) {
        return options.fallback ?? "—";
      }

      const date =
        value instanceof Date
          ? value
          : new Date(value);

      if (
        Number.isNaN(date.getTime())
      ) {
        return String(value);
      }

      try {
        return new Intl.DateTimeFormat(
          options.locale || this.getLocale(),
          {
            dateStyle:
              options.dateStyle || "medium",

            ...(options.includeTime
              ? {
                  timeStyle:
                    options.timeStyle ||
                    "short"
                }
              : {})
          }
        ).format(date);
      } catch (error) {
        return date.toLocaleString();
      }
    },

    /* =========================================================
       STATUS INTELLIGENCE
    ========================================================= */

    statusClass(value) {
      const normalized =
        this.normalizeText(value);

      if (!normalized) {
        return "";
      }

      const redValues = [
        "critical",
        "high",
        "danger",
        "error",
        "failed",
        "overdue",
        "عال",
        "عالٍ",
        "عالية",
        "مرتفع",
        "مرتفعة",
        "خطر",
        "حرج",
        "حرجة",
        "متأخر",
        "فشل",
        "خطأ"
      ];

      const orangeValues = [
        "medium",
        "warning",
        "pending",
        "planned",
        "review",
        "in progress",
        "متوسط",
        "متوسطة",
        "تحذير",
        "معلق",
        "مخطط",
        "مراجعة",
        "قيد",
        "جاري",
        "جزئي"
      ];

      const greenValues = [
        "low",
        "success",
        "active",
        "available",
        "ready",
        "completed",
        "approved",
        "healthy",
        "quick",
        "advanced",
        "stable",
        "منخفض",
        "منخفضة",
        "ناجح",
        "نشط",
        "متاح",
        "جاهز",
        "مكتمل",
        "مكتملة",
        "معتمد",
        "معتمدة",
        "سليم",
        "مستقر",
        "متقدم",
        "إلزامي"
      ];

      if (
        redValues.some(item =>
          normalized.includes(item)
        )
      ) {
        return "red";
      }

      if (
        orangeValues.some(item =>
          normalized.includes(item)
        )
      ) {
        return "orange";
      }

      if (
        greenValues.some(item =>
          normalized.includes(item)
        )
      ) {
        return "green";
      }

      return "";
    },

    status(value, label = "") {
      const displayValue =
        label || value || "—";

      return `
        <span class="aiw-status ${this.statusClass(
          value
        )}">
          ${this.escape(displayValue)}
        </span>
      `;
    },

    /* =========================================================
       KPI COMPONENT
    ========================================================= */

    kpi({
      label = "",
      value = "",
      note = "",
      icon = "",
      status = "",
      className = ""
    } = {}) {
      return `
        <div class="module-card aiw-widget-kpi ${
          this.escapeAttribute(className)
        }">
          <span>
            ${
              icon
                ? `<span class="aiw-widget-kpi-icon">${this.escape(
                    icon
                  )}</span>`
                : ""
            }

            ${this.escape(label)}
          </span>

          <strong>
            ${this.escape(value)}
          </strong>

          ${
            note
              ? `<small>${this.escape(
                  note
                )}</small>`
              : ""
          }

          ${
            status
              ? this.status(status)
              : ""
          }
        </div>
      `;
    },

    /* =========================================================
       PROGRESS COMPONENTS
    ========================================================= */

    progress(value, label = "", options = {}) {
      const percentage =
        this.clamp(value);

      const displayPercentage =
        options.decimals !== undefined
          ? percentage.toFixed(
              options.decimals
            )
          : Math.round(percentage);

      return `
        <div class="aiw-widget-progress">
          ${
            label || options.showValue
              ? `
                <div class="aiw-widget-progress-head">
                  <span>
                    ${this.escape(label)}
                  </span>

                  <b>
                    ${displayPercentage}%
                  </b>
                </div>
              `
              : ""
          }

          <div
            class="aiw-progress"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="${percentage}"
            aria-label="${this.escapeAttribute(
              label || "Progress"
            )}"
          >
            <div style="width:${percentage}%"></div>
          </div>
        </div>
      `;
    },

    /* =========================================================
       HERO COMPONENT
    ========================================================= */

    hero({
      kicker = "",
      title = "",
      description = "",
      chips = [],
      actions = [],
      className = ""
    } = {}) {
      const safeChips =
        this.toArray(chips);

      const safeActions =
        this.toArray(actions);

      return `
        <div class="module-hero ${
          this.escapeAttribute(className)
        }">
          ${
            kicker
              ? `
                <span class="module-kicker">
                  ${this.escape(kicker)}
                </span>
              `
              : ""
          }

          <h1>
            ${this.escape(title)}
          </h1>

          ${
            description
              ? `
                <p>
                  ${this.escape(description)}
                </p>
              `
              : ""
          }

          ${
            safeChips.length
              ? `
                <div class="aiw-chip-row">
                  ${safeChips
                    .map(
                      chip => `
                        <span class="aiw-chip">
                          ${this.escape(
                            chip
                          )}
                        </span>
                      `
                    )
                    .join("")}
                </div>
              `
              : ""
          }

          ${
            safeActions.length
              ? `
                <div class="module-actions">
                  ${safeActions
                    .map(action =>
                      this.button(action)
                    )
                    .join("")}
                </div>
              `
              : ""
          }
        </div>
      `;
    },

    /* =========================================================
       SECTION TITLE
    ========================================================= */

    sectionTitle(
      title,
      desc = "",
      options = {}
    ) {
      return `
        <div class="module-section-title ${
          options.compact === false
            ? ""
            : "compact"
        }">
          <div>
            ${
              options.kicker
                ? `
                  <span class="module-kicker">
                    ${this.escape(
                      options.kicker
                    )}
                  </span>
                `
                : ""
            }

            <h2>
              ${this.escape(title)}
            </h2>

            ${
              desc
                ? `
                  <p>
                    ${this.escape(desc)}
                  </p>
                `
                : ""
            }
          </div>

          ${
            options.action
              ? `
                <div class="module-section-action">
                  ${this.button(
                    options.action
                  )}
                </div>
              `
              : ""
          }
        </div>
      `;
    },

    /* =========================================================
       BUTTON COMPONENT
    ========================================================= */

    button({
      label = "",
      text = "",
      route = "",
      module = "",
      action = "",
      type = "button",
      variant = "secondary",
      icon = "",
      className = "",
      disabled = false,
      title = ""
    } = {}) {
      const displayLabel =
        label || text;

      const targetRoute =
        route || module;

      const attributes = [
        `type="${this.escapeAttribute(
          type
        )}"`,

        targetRoute
          ? `data-route="${this.escapeAttribute(
              targetRoute
            )}"`
          : "",

        action
          ? `data-action="${this.escapeAttribute(
              action
            )}"`
          : "",

        title
          ? `title="${this.escapeAttribute(
              title
            )}"`
          : "",

        disabled
          ? "disabled"
          : ""
      ]
        .filter(Boolean)
        .join(" ");

      return `
        <button
          class="module-btn ${this.escapeAttribute(
            variant
          )} ${this.escapeAttribute(
            className
          )}"
          ${attributes}
        >
          ${
            icon
              ? `<span>${this.escape(
                  icon
                )}</span>`
              : ""
          }

          ${this.escape(displayLabel)}
        </button>
      `;
    },

    /* =========================================================
       INSIGHT COMPONENT
    ========================================================= */

    insight({
      title = "",
      text = "",
      buttonText = "",
      module = "",
      route = "",
      icon = "",
      status = ""
    } = {}) {
      const targetRoute =
        route || module;

      return `
        <div class="aiw-widget-insight">
          ${
            icon
              ? `
                <div class="aiw-widget-insight-icon">
                  ${this.escape(icon)}
                </div>
              `
              : ""
          }

          <strong>
            ${this.escape(title)}
          </strong>

          ${
            text
              ? `
                <p>
                  ${this.escape(text)}
                </p>
              `
              : ""
          }

          ${
            status
              ? this.status(status)
              : ""
          }

          ${
            buttonText && targetRoute
              ? this.button({
                  label: buttonText,
                  route: targetRoute,
                  variant: "secondary"
                })
              : ""
          }
        </div>
      `;
    },

    /* =========================================================
       LIST COMPONENT
    ========================================================= */

    list(items = [], options = {}) {
      const safeItems =
        this.toArray(items);

      const numbered =
        options.numbered !== false;

      if (!safeItems.length) {
        return options.empty === false
          ? ""
          : this.empty({
              title:
                options.emptyTitle ||
                "لا توجد بيانات",

              text:
                options.emptyText ||
                "لا توجد عناصر للعرض حالياً."
            });
      }

      return `
        <div class="executive-list">
          ${safeItems
            .map((item, index) => {
              const itemText =
                typeof item === "object"
                  ? item.text ||
                    item.title ||
                    item.label ||
                    ""
                  : item;

              const badge =
                typeof item === "object"
                  ? item.badge
                  : null;

              return `
                <div class="executive-item">
                  <strong>
                    ${
                      numbered
                        ? String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )
                        : this.escape(
                            badge ||
                            options.badge ||
                            "•"
                          )
                    }
                  </strong>

                  <span>
                    ${this.escape(
                      itemText
                    )}
                  </span>
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    },

    /* =========================================================
       EMPTY AND ERROR STATES
    ========================================================= */

    empty({
      icon = "📭",
      title = "لا توجد بيانات",
      text = "لا توجد عناصر للعرض حالياً.",
      buttonText = "",
      route = ""
    } = {}) {
      return `
        <div class="aiw-card aiw-empty">
          <div class="aiw-empty-icon">
            ${this.escape(icon)}
          </div>

          <h2>
            ${this.escape(title)}
          </h2>

          <p>
            ${this.escape(text)}
          </p>

          ${
            buttonText && route
              ? this.button({
                  label: buttonText,
                  route,
                  variant: "secondary"
                })
              : ""
          }
        </div>
      `;
    },

    error({
      title = "حدث خطأ",
      text = "تعذر تحميل هذا القسم.",
      detail = "",
      retryRoute = "",
      retryText = "إعادة المحاولة"
    } = {}) {
      return `
        <div class="aiw-card aiw-empty aiw-error-state">
          <div class="aiw-empty-icon">
            ⚠️
          </div>

          <h2>
            ${this.escape(title)}
          </h2>

          <p>
            ${this.escape(text)}
          </p>

          ${
            detail
              ? `
                <small>
                  ${this.escape(detail)}
                </small>
              `
              : ""
          }

          ${
            retryRoute
              ? this.button({
                  label: retryText,
                  route: retryRoute,
                  variant: "secondary"
                })
              : ""
          }
        </div>
      `;
    },

    /* =========================================================
       TABLE COMPONENT
    ========================================================= */

    table({
      columns = [],
      rows = [],
      emptyText = "لا توجد بيانات للعرض."
    } = {}) {
      const safeColumns =
        this.toArray(columns);

      const safeRows =
        this.toArray(rows);

      if (!safeColumns.length) {
        return this.empty({
          title: "تعذر عرض الجدول",
          text:
            "لم يتم تحديد أعمدة الجدول."
        });
      }

      if (!safeRows.length) {
        return this.empty({
          title: "لا توجد بيانات",
          text: emptyText
        });
      }

      const gridTemplate =
        `repeat(${safeColumns.length}, minmax(0, 1fr))`;

      return `
        <div class="aiw-widget-table">
          <div
            class="aiw-widget-table-row aiw-widget-table-head"
            style="grid-template-columns:${gridTemplate};"
          >
            ${safeColumns
              .map(column => {
                const label =
                  typeof column === "object"
                    ? column.label ||
                      column.title ||
                      column.key ||
                      ""
                    : column;

                return `
                  <strong>
                    ${this.escape(label)}
                  </strong>
                `;
              })
              .join("")}
          </div>

          ${safeRows
            .map(row => {
              const cells =
                Array.isArray(row)
                  ? row
                  : safeColumns.map(
                      column => {
                        const key =
                          typeof column === "object"
                            ? column.key
                            : column;

                        return row?.[key];
                      }
                    );

              return `
                <div
                  class="aiw-widget-table-row"
                  style="grid-template-columns:${gridTemplate};"
                >
                  ${cells
                    .map(
                      cell => `
                        <span>
                          ${this.escape(
                            cell ?? "—"
                          )}
                        </span>
                      `
                    )
                    .join("")}
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    },

    /* =========================================================
       METRIC LIST
    ========================================================= */

    metricList(items = []) {
      const safeItems =
        this.toArray(items);

      if (!safeItems.length) {
        return this.empty();
      }

      return `
        <div class="aiw-widget-metric-list">
          ${safeItems
            .map(
              item => `
                <div class="aiw-widget-metric-item">
                  <div>
                    <strong>
                      ${this.escape(
                        item.title ||
                        item.label ||
                        ""
                      )}
                    </strong>

                    ${
                      item.subtitle ||
                      item.note
                        ? `
                          <span>
                            ${this.escape(
                              item.subtitle ||
                              item.note
                            )}
                          </span>
                        `
                        : ""
                    }
                  </div>

                  <b class="${this.statusClass(
                    item.status
                  )}">
                    ${this.escape(
                      item.value ?? "—"
                    )}
                  </b>
                </div>
              `
            )
            .join("")}
        </div>
      `;
    },

    /* =========================================================
       CARD GRID
    ========================================================= */

    cardGrid(items = [], options = {}) {
      const safeItems =
        this.toArray(items);

      if (!safeItems.length) {
        return this.empty({
          title:
            options.emptyTitle ||
            "لا توجد بيانات",

          text:
            options.emptyText ||
            "لا توجد بطاقات للعرض حالياً."
        });
      }

      return `
        <div class="aiw-widget-card-grid">
          ${safeItems
            .map(
              item => `
                <article class="aiw-widget-card">
                  ${
                    item.icon
                      ? `
                        <div class="aiw-widget-card-icon">
                          ${this.escape(
                            item.icon
                          )}
                        </div>
                      `
                      : ""
                  }

                  <strong>
                    ${this.escape(
                      item.title ||
                      item.label ||
                      ""
                    )}
                  </strong>

                  ${
                    item.text ||
                    item.description
                      ? `
                        <p>
                          ${this.escape(
                            item.text ||
                            item.description
                          )}
                        </p>
                      `
                      : ""
                  }

                  ${
                    item.status
                      ? this.status(
                          item.status,
                          item.statusLabel
                        )
                      : ""
                  }

                  ${
                    item.route &&
                    item.buttonText
                      ? this.button({
                          label:
                            item.buttonText,
                          route:
                            item.route,
                          variant:
                            item.buttonVariant ||
                            "secondary"
                        })
                      : ""
                  }
                </article>
              `
            )
            .join("")}
        </div>
      `;
    },

    /* =========================================================
       CHIP COMPONENT
    ========================================================= */

    chip(
      text,
      status = "",
      options = {}
    ) {
      return `
        <span class="aiw-chip ${
          this.statusClass(status)
        } ${
          this.escapeAttribute(
            options.className || ""
          )
        }">
          ${
            options.icon
              ? `${this.escape(
                  options.icon
                )} `
              : ""
          }

          ${this.escape(text)}
        </span>
      `;
    },

    chipRow(items = []) {
      const safeItems =
        this.toArray(items);

      if (!safeItems.length) {
        return "";
      }

      return `
        <div class="aiw-chip-row">
          ${safeItems
            .map(item => {
              if (
                item &&
                typeof item === "object"
              ) {
                return this.chip(
                  item.text ||
                  item.label ||
                  "",
                  item.status ||
                  "",
                  item
                );
              }

              return this.chip(item);
            })
            .join("")}
        </div>
      `;
    },

    /* =========================================================
       GLOBAL EVENTS
    ========================================================= */

    bindEvents() {
      if (this._eventsBound) {
        return;
      }

      this._eventsBound = true;

      /*
       * Legacy navigation support.
       * Some older widgets use data-module instead of data-route.
       */
      document.addEventListener(
        "click",
        event => {
          const moduleButton =
            event.target.closest(
              "[data-module]:not([data-route])"
            );

          if (!moduleButton) {
            return;
          }

          const route =
            moduleButton.getAttribute(
              "data-module"
            );

          if (!route) {
            return;
          }

          event.preventDefault();
          this.navigate(route);
        }
      );

      window.addEventListener(
        "aiw:moduleRendered",
        () => {
          this.scheduleGlobalPageCredit();
        }
      );

      window.addEventListener(
        "aiw:routeChanged",
        () => {
          this.scheduleGlobalPageCredit();
        }
      );

      window.addEventListener(
        "atc:routeChanged",
        () => {
          this.scheduleGlobalPageCredit();
        }
      );

      window.addEventListener(
        "aiw:dataChanged",
        () => {
          this.scheduleGlobalPageCredit();
        }
      );
    },

    navigate(route) {
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
        return router.navigate(route);
      }

      if (
        app &&
        typeof app.go === "function"
      ) {
        return app.go(route);
      }

      window.location.hash =
        route || "dashboard";

      return route;
    },

    /* =========================================================
       GLOBAL PAGE CREDIT
    ========================================================= */

    createGlobalPageCredit() {
      const credit =
        document.createElement("div");

      credit.className =
        "aiw-global-credit";

      credit.setAttribute(
        "data-aiw-global-credit",
        "true"
      );

      credit.innerHTML = `
        <span dir="ltr">
          Designed &amp; Developed by
        </span>

        <strong>
          يوسف الحوسني
        </strong>
      `;

      return credit;
    },

    ensureGlobalPageCredit(root = document) {
      const pages =
        root.querySelectorAll
          ? root.querySelectorAll(
              ".module-page"
            )
          : [];

      pages.forEach(page => {
        const directCredits = Array.from(
          page.children
        ).filter(
          child =>
            child.classList?.contains(
              "aiw-global-credit"
            )
        );

        if (!directCredits.length) {
          page.appendChild(
            this.createGlobalPageCredit()
          );

          return;
        }

        /*
         * Keep only one direct credit inside each module page.
         */
        directCredits
          .slice(1)
          .forEach(credit =>
            credit.remove()
          );

        directCredits[0].setAttribute(
          "data-aiw-global-credit",
          "true"
        );
      });
    },

    scheduleGlobalPageCredit() {
      window.clearTimeout(
        this._creditTimer
      );

      this._creditTimer =
        window.setTimeout(() => {
          const appMain =
            document.getElementById(
              "appMain"
            ) ||
            document.querySelector(
              "[data-app-main]"
            ) ||
            document;

          this.ensureGlobalPageCredit(
            appMain
          );
        }, 40);
    },

    startGlobalPageCredit() {
      this.ensureGlobalPageCredit();

      const target =
        document.getElementById(
          "appMain"
        ) ||
        document.querySelector(
          "[data-app-main]"
        ) ||
        document.body;

      if (
        !target ||
        typeof MutationObserver ===
          "undefined"
      ) {
        return;
      }

      if (this._creditObserver) {
        this._creditObserver.disconnect();
      }

      this._creditObserver =
        new MutationObserver(
          mutations => {
            const hasRelevantChange =
              mutations.some(
                mutation =>
                  mutation.addedNodes &&
                  mutation.addedNodes.length
              );

            if (hasRelevantChange) {
              this.scheduleGlobalPageCredit();
            }
          }
        );

      this._creditObserver.observe(
        target,
        {
          childList: true,
          subtree: true
        }
      );
    },

    /* =========================================================
       METADATA
    ========================================================= */

    registerMetadata() {
      const store =
        window.AIW?.Store;

      if (
        !store ||
        typeof store.setMetadata !==
          "function"
      ) {
        return;
      }

      try {
        store.setMetadata({
          widgetsVersion:
            this.version,

          widgetsEngine:
            "Enterprise Reusable UI Components",

          globalCredit:
            "Designed & Developed by يوسف الحوسني",

          lastWidgetsInitialization:
            new Date().toISOString()
        });
      } catch (error) {
        console.warn(
          "[AIW.Widgets] Metadata registration skipped:",
          error
        );
      }
    },

    /* =========================================================
       CLEANUP
    ========================================================= */

    destroy() {
      window.clearTimeout(
        this._creditTimer
      );

      if (this._creditObserver) {
        this._creditObserver.disconnect();
      }

      this._creditObserver = null;
      this._initialized = false;
    }
  };

  /* =========================================================
     GLOBAL REFERENCE
  ========================================================= */

  AIW.Widgets = Widgets;

  /* =========================================================
     BOOTSTRAP
  ========================================================= */

  const bootstrap = () => {
    AIW.Widgets.init();
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