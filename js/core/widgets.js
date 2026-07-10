/* =========================================================
   AI Work - Core Widgets Engine V1.0 Final
   Reusable Enterprise UI Components
========================================================= */

window.AIW = window.AIW || {};

AIW.Widgets = {
  escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  },

  formatNumber(value) {
    const n = Number(value || 0);
    return n.toLocaleString("ar-AE");
  },

  formatAED(value) {
    const n = Number(value || 0);
    if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 ? 1 : 0)}M AED`;
    return `${n.toLocaleString("ar-AE")} AED`;
  },

  percent(value) {
    const n = Number(value || 0);
    return `${Math.max(0, Math.min(100, Math.round(n)))}%`;
  },

  statusClass(value) {
    const v = String(value || "").toLowerCase();

    if (
      v.includes("high") ||
      v.includes("عال") ||
      v.includes("red") ||
      v.includes("خطر")
    ) {
      return "red";
    }

    if (
      v.includes("medium") ||
      v.includes("متوسط") ||
      v.includes("orange") ||
      v.includes("قيد")
    ) {
      return "orange";
    }

    if (
      v.includes("low") ||
      v.includes("منخفض") ||
      v.includes("green") ||
      v.includes("مكتمل") ||
      v.includes("quick") ||
      v.includes("متقدم")
    ) {
      return "green";
    }

    return "";
  },

  kpi({ label = "", value = "", note = "", icon = "" } = {}) {
    return `
      <div class="module-card aiw-widget-kpi">
        <span>${icon ? `${this.escape(icon)} ` : ""}${this.escape(label)}</span>
        <strong>${this.escape(value)}</strong>
        ${note ? `<small>${this.escape(note)}</small>` : ""}
      </div>
    `;
  },

  status(value, label) {
    return `
      <span class="aiw-status ${this.statusClass(value)}">
        ${this.escape(label || value)}
      </span>
    `;
  },

  progress(value, label = "") {
    const pct = Math.max(0, Math.min(100, Number(value || 0)));

    return `
      <div class="aiw-widget-progress">
        ${
          label
            ? `<div class="aiw-widget-progress-head">
                <span>${this.escape(label)}</span>
                <b>${Math.round(pct)}%</b>
              </div>`
            : ""
        }
        <div class="aiw-progress">
          <div style="width:${pct}%"></div>
        </div>
      </div>
    `;
  },

  hero({
    kicker = "",
    title = "",
    description = "",
    chips = []
  } = {}) {
    return `
      <div class="module-hero">
        ${kicker ? `<span class="module-kicker">${this.escape(kicker)}</span>` : ""}
        <h1>${this.escape(title)}</h1>
        <p>${this.escape(description)}</p>

        ${
          chips.length
            ? `<div class="aiw-chip-row">
                ${chips.map(chip => `<span class="aiw-chip">${this.escape(chip)}</span>`).join("")}
              </div>`
            : ""
        }
      </div>
    `;
  },

  sectionTitle(title, desc = "") {
    return `
      <div class="module-section-title compact">
        <h2>${this.escape(title)}</h2>
        ${desc ? `<p>${this.escape(desc)}</p>` : ""}
      </div>
    `;
  },

  insight({
    title = "",
    text = "",
    buttonText = "",
    module = ""
  } = {}) {
    return `
      <div class="aiw-widget-insight">
        <strong>${this.escape(title)}</strong>
        <p>${this.escape(text)}</p>
        ${
          buttonText && module
            ? `<button class="module-btn secondary" data-module="${this.escape(module)}">${this.escape(buttonText)}</button>`
            : ""
        }
      </div>
    `;
  },

  list(items = [], options = {}) {
    const numbered = options.numbered !== false;

    return `
      <div class="executive-list">
        ${items.map((item, index) => `
          <div class="executive-item">
            <strong>${numbered ? String(index + 1).padStart(2, "0") : this.escape(options.badge || "•")}</strong>
            <span>${this.escape(item)}</span>
          </div>
        `).join("")}
      </div>
    `;
  },

  empty({
    icon = "📭",
    title = "لا توجد بيانات",
    text = "لا توجد عناصر للعرض حالياً."
  } = {}) {
    return `
      <div class="aiw-card aiw-empty">
        <div class="aiw-empty-icon">${this.escape(icon)}</div>
        <h2>${this.escape(title)}</h2>
        <p>${this.escape(text)}</p>
      </div>
    `;
  },

  error({
    title = "حدث خطأ",
    text = "تعذر تحميل هذا القسم.",
    detail = ""
  } = {}) {
    return `
      <div class="aiw-card aiw-empty">
        <div class="aiw-empty-icon">⚠️</div>
        <h2>${this.escape(title)}</h2>
        <p>${this.escape(text)}</p>
        ${detail ? `<small>${this.escape(detail)}</small>` : ""}
      </div>
    `;
  },

  table({ columns = [], rows = [] } = {}) {
    return `
      <div class="aiw-widget-table">
        <div class="aiw-widget-table-row aiw-widget-table-head" style="grid-template-columns: repeat(${columns.length}, 1fr);">
          ${columns.map(col => `<strong>${this.escape(col)}</strong>`).join("")}
        </div>

        ${rows.map(row => `
          <div class="aiw-widget-table-row" style="grid-template-columns: repeat(${columns.length}, 1fr);">
            ${row.map(cell => `<span>${this.escape(cell)}</span>`).join("")}
          </div>
        `).join("")}
      </div>
    `;
  },

  metricList(items = []) {
    return `
      <div class="aiw-widget-metric-list">
        ${items.map(item => `
          <div class="aiw-widget-metric-item">
            <div>
              <strong>${this.escape(item.title)}</strong>
              ${item.subtitle ? `<span>${this.escape(item.subtitle)}</span>` : ""}
            </div>
            <b>${this.escape(item.value)}</b>
          </div>
        `).join("")}
      </div>
    `;
  },

  cardGrid(items = []) {
    return `
      <div class="aiw-widget-card-grid">
        ${items.map(item => `
          <article class="aiw-widget-card">
            ${item.icon ? `<div class="aiw-widget-card-icon">${this.escape(item.icon)}</div>` : ""}
            <strong>${this.escape(item.title)}</strong>
            ${item.text ? `<p>${this.escape(item.text)}</p>` : ""}
            ${item.status ? this.status(item.status) : ""}
          </article>
        `).join("")}
      </div>
    `;
  }
};

/* =========================================================
   Global Page Credit
   Automatically added to the bottom of every module page
========================================================= */

(function () {
  "use strict";

  function addGlobalPageCredit() {
    const pages = document.querySelectorAll(".module-page");

    pages.forEach((page) => {
      const existingCredit = page.querySelector(".aiw-global-credit");

      if (existingCredit) return;

      const credit = document.createElement("div");

      credit.className = "aiw-global-credit";

      credit.innerHTML = `
        <span dir="ltr">Designed &amp; Developed by</span>
        <strong>يوسف الحوسني</strong>
      `;

      page.appendChild(credit);
    });
  }

  function startGlobalPageCredit() {
    addGlobalPageCredit();

    const observer = new MutationObserver(() => {
      addGlobalPageCredit();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener("hashchange", () => {
      setTimeout(addGlobalPageCredit, 50);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startGlobalPageCredit);
  } else {
    startGlobalPageCredit();
  }
})();