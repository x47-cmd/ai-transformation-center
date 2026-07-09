/* =========================================================
   AI Work - More Center V1.1
   Practical Tools + Platform Status
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.settings = {
  id: "settings",
  title: "المزيد",
  icon: "⋮",

  sections: [
    {
      icon: "📤",
      title: "Export Center",
      desc: "تصدير بيانات المنصة والتقارير للاستخدام التنفيذي.",
      items: [
        ["JSON Backup", "Ready"],
        ["Executive Report", "Planned"],
        ["Power BI Data", "Planned"],
        ["PDF Summary", "Planned"]
      ]
    },
    {
      icon: "🔔",
      title: "Alert Center",
      desc: "تنبيهات التسجيلات، الصلاحيات، البوابات، والمخاطر.",
      items: [
        ["Registration Alerts", "Ready"],
        ["Privilege Alerts", "Ready"],
        ["Gate Alerts", "Planned"],
        ["Risk Escalation", "Planned"]
      ]
    },
    {
      icon: "📊",
      title: "Analytics Layer",
      desc: "محركات التحليل والقرار وDecision Score.",
      items: [
        ["Biometric Analytics", "Enabled"],
        ["Decision Score", "Enabled"],
        ["KPI Engine", "Enabled"],
        ["Charts", "Enabled"]
      ]
    },
    {
      icon: "🛡️",
      title: "Governance",
      desc: "ضوابط الإشراف البشري والخصوصية والمراجعة.",
      items: [
        ["Human-in-the-Loop", "Required"],
        ["Privacy Review", "Required"],
        ["Audit Evidence", "Planned"],
        ["Risk Review", "Required"]
      ]
    }
  ],

  render(container) {
    if (!container) return;

    const W = window.AIW?.Widgets;
    const A = window.AIW?.Analytics;
    const config = window.AIW?.Config || window.ATC_CONFIG || {};
    const scores = A?.score ? A.score() : {};

    container.innerHTML = `
      <section class="module-page">

        ${W ? W.hero({
          kicker: "More · Platform Tools",
          title: "المزيد",
          description: "مركز مختصر لأدوات المنصة: التصدير، التنبيهات، حالة المحركات، التحليلات، والحوكمة.",
          chips: [
            "📤 Export",
            "🔔 Alerts",
            "📊 Analytics",
            "🛡️ Governance"
          ]
        }) : this.fallbackHero()}
        
        <div class="page-credit">
  <span>Designed &amp; Developed by:</span>
  <strong>يوسف الحوسني</strong>
</div>

        <div class="module-grid">
          ${this.kpi("إصدار النظام", config.app?.version || "3.0.9", "Version")}
          ${this.kpi("Biometric Analytics", window.AIW?.BiometricAnalytics ? "Ready" : "Check", "Engine")}
          ${this.kpi("Executive Score", `${scores.executiveScore || 0}%`, "Analytics")}
          ${this.kpi("الوحدات", Object.keys(window.AIW?.Modules || {}).length, "Modules")}
          ${this.kpi("اللغة", "AR", "Default")}
          ${this.kpi("الوضع", "Light", "Theme")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("Platform Status", "حالة المنصة بعد تحويلها إلى نطاق الأنظمة البيومترية والبوابات الذكية.")}
            <div class="settings-summary-card">
              <strong>المنصة جاهزة لمرحلة التحليلات التشغيلية</strong>
              <p>
                تم تجهيز الأساس لربط الأفكار والمشاريع بمؤشرات فعلية،
                Decision Score، تنبيهات، ولوحات Power BI Style خاصة بجودة التسجيلات،
                الصلاحيات، البوابات الذكية، والأمن الرقمي.
              </p>

              <div class="settings-summary-strip">
                <div><span>Scope</span><b>Biometric</b></div>
                <div><span>AI</span><b>Enabled</b></div>
                <div><span>Alerts</span><b>Ready</b></div>
                <div><span>Dir</span><b>${config.app?.direction || "rtl"}</b></div>
              </div>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("Next Step", "الخطوة العملية التالية.")}
            <div class="settings-admin-card">
              <strong>اختبار الصفحات ثم بناء Operations Dashboard</strong>
              <p>
                بعد تنظيف النصوص، الخطوة التالية هي تجربة الموقع كاملاً،
                ثم إضافة لوحة تشغيلية تعرض التسجيلات، التنبيهات، الصلاحيات،
                وحالة البوابات بشكل تنفيذي.
              </p>
              <button class="module-btn secondary" onclick="AIW.App.go('dashboard')">العودة للرئيسية</button>
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("Platform Tools", "الأدوات العملية الموجودة أو المخطط لها.")}
          <div class="settings-section-grid">
            ${this.sections.map(section => `
              <article class="settings-section-card">
                <div class="settings-section-icon">${section.icon}</div>
                <strong>${section.title}</strong>
                <p>${section.desc}</p>

                <div class="settings-items">
                  ${section.items.map(item => `
                    <div>
                      <span>${item[0]}</span>
                      <b>${item[1]}</b>
                    </div>
                  `).join("")}
                </div>
              </article>
            `).join("")}
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("Core Engines Status", "حالة المحركات المركزية التي تشغل المنصة.")}
            <div class="settings-engine-list">
              ${this.engineStatus().map(e => `
                <div>
                  <b>${e.icon}</b>
                  <div>
                    <strong>${e.name}</strong>
                    <span>${e.desc}</span>
                  </div>
                  <em class="${e.ready ? "green" : "orange"}">${e.ready ? "Ready" : "Check"}</em>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("System Diagnostics", "فحص سريع لحالة المنصة.")}
            <div class="settings-diagnostics">
              ${this.diagnostics().map(d => `
                <div>
                  <strong>${d.name}</strong>
                  <span class="aiw-status ${d.ok ? "green" : "orange"}">${d.ok ? "OK" : "Check"}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("Backup & Export", "تصدير نسخة من بيانات المنصة.")}
            <div class="settings-action-card">
              <strong>تصدير بيانات AI Work</strong>
              <p>ينشئ ملف JSON يحتوي على بيانات المنصة الحالية للاحتفاظ أو المراجعة.</p>
              <button class="module-btn" onclick="AIW.Modules.settings.exportData()">تصدير البيانات</button>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("About Platform", "تعريف مختصر بالمنصة.")}
            <div class="settings-action-card">
              <strong>Enterprise Biometric Intelligence Platform</strong>
              <p>
                منصة تنفيذية لإدارة أفكار ومشاريع الذكاء الاصطناعي الخاصة
                بالأنظمة البيومترية، البوابات الذكية، الصلاحيات، والأمن الرقمي.
              </p>
            </div>
          </div>
        </div>

      </section>
    `;
  },

  engineStatus() {
    return [
      { icon: "🧩", name: "Widgets Engine", desc: "Reusable UI components.", ready: !!window.AIW?.Widgets },
      { icon: "📊", name: "Charts Engine", desc: "Chart.js wrapper.", ready: !!window.AIW?.Charts },
      { icon: "📈", name: "Analytics Engine", desc: "Scores and executive analytics.", ready: !!window.AIW?.Analytics },
      { icon: "👁️", name: "Biometric Analytics", desc: "Decision Score, alerts, and AI opportunity scoring.", ready: !!window.AIW?.BiometricAnalytics },
      { icon: "🤖", name: "AI Engine", desc: "Executive intelligence layer.", ready: !!window.AIW?.AI },
      { icon: "🧭", name: "Decision Engine", desc: "Decision support system.", ready: !!window.AIW?.Decision },
      { icon: "💡", name: "Recommendation Engine", desc: "Executive recommendations.", ready: !!window.AIW?.Recommendation },
      { icon: "🔐", name: "Permissions Engine", desc: "Roles and access control.", ready: !!window.AIW?.Permissions }
    ];
  },

  diagnostics() {
    return [
      { name: "Config Loaded", ok: !!(window.AIW?.Config || window.ATC_CONFIG) },
      { name: "Data Layer Loaded", ok: !!window.AIW?.Data },
      { name: "Biometric Analytics Loaded", ok: !!window.AIW?.BiometricAnalytics },
      { name: "Modules Loaded", ok: !!window.AIW?.Modules },
      { name: "Charts Library", ok: typeof Chart !== "undefined" },
      { name: "App Core", ok: !!window.AIW?.App }
    ];
  },

  exportData() {
    const payload = window.AIW?.Store?.exportData
      ? AIW.Store.exportData()
      : {
          exportedAt: new Date().toISOString(),
          data: window.AIW?.Data || {}
        };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `ai-work-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    URL.revokeObjectURL(url);

    if (window.AIW?.App?.toast) {
      AIW.App.toast("تم تصدير بيانات AI Work");
    }
  },

  kpi(label, value, note) {
    if (window.AIW?.Widgets?.kpi) {
      return AIW.Widgets.kpi({ label, value, note });
    }

    return `
      <div class="module-card">
        <span>${label}</span>
        <strong>${value}</strong>
        <small>${note}</small>
      </div>
    `;
  },

  sectionTitle(title, desc) {
    if (window.AIW?.Widgets?.sectionTitle) {
      return AIW.Widgets.sectionTitle(title, desc);
    }

    return `
      <div class="module-section-title compact">
        <h2>${title}</h2>
        <p>${desc}</p>
      </div>
    `;
  },

  fallbackHero() {
    return `
      <div class="module-hero">
        <span class="module-kicker">More · Platform Tools</span>
        <h1>المزيد</h1>
        <p>أدوات التصدير والتنبيهات والتحليلات وحالة المنصة.</p>
      </div>
    `;
  }
};