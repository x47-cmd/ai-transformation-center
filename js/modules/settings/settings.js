/* =========================================================
   AI Work - Settings Center V1.0 Ultimate
   Enterprise Configuration + Admin Foundation
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.settings = {
  id: "settings",
  title: "الإعدادات",
  icon: "⚙️",

  sections: [
    {
      icon: "🏢",
      title: "Organization Profile",
      desc: "بيانات الجهة، الرؤية، الفترة الاستراتيجية، والمالك التنفيذي.",
      items: [
        ["اسم المنصة", "AI Transformation Center"],
        ["الاسم العربي", "مركز التحول المؤسسي بالذكاء الاصطناعي"],
        ["الفترة", "2026–2030"],
        ["المالك التنفيذي", "AI Work"]
      ]
    },
    {
      icon: "🤖",
      title: "AI Configuration",
      desc: "إعدادات طبقة الذكاء والتحليلات والتوصيات.",
      items: [
        ["AI Engine", "Enabled"],
        ["Recommendation Engine", "Enabled"],
        ["Decision Engine", "Enabled"],
        ["Human-in-the-Loop", "Required"]
      ]
    },
    {
      icon: "📊",
      title: "Analytics & KPI",
      desc: "إعدادات المؤشرات والتحليلات وقياس الأداء.",
      items: [
        ["Executive Score", "Enabled"],
        ["Maturity Score", "Enabled"],
        ["ROI Tracking", "Enabled"],
        ["Review Cycle", "Quarterly"]
      ]
    },
    {
      icon: "🔐",
      title: "Security & Governance",
      desc: "إعدادات الحوكمة، الخصوصية، التحكم، وسجل المخاطر.",
      items: [
        ["Responsible AI", "Enabled"],
        ["Privacy Review", "Required"],
        ["Risk Review", "Required"],
        ["Audit Logs", "Planned"]
      ]
    },
    {
      icon: "🔔",
      title: "Notifications",
      desc: "تنبيهات المخاطر، المؤشرات، الاعتمادات، والتقارير.",
      items: [
        ["Risk Alerts", "Planned"],
        ["KPI Alerts", "Planned"],
        ["Approval Alerts", "Planned"],
        ["Quarterly Reports", "Planned"]
      ]
    },
    {
      icon: "🔌",
      title: "Integrations",
      desc: "تكاملات مستقبلية مع Microsoft 365 وPower BI وSharePoint.",
      items: [
        ["Power BI", "Future"],
        ["Microsoft Graph", "Future"],
        ["SharePoint", "Future"],
        ["Azure OpenAI", "Future"]
      ]
    }
  ],

  render(container) {
    if (!container) return;

    const W = window.AIW?.Widgets;
    const A = window.AIW?.Analytics;
    const data = window.AIW?.Data || {};
    const config = window.AIW?.Config || window.ATC_CONFIG || {};
    const scores = A?.score ? A.score() : {};

    container.innerHTML = `
      <section class="module-page">

        ${W ? W.hero({
          kicker: "Enterprise Settings · Administration",
          title: "مركز الإعدادات والإدارة",
          description: "لوحة إعدادات مؤسسية لإدارة المنصة، المحركات، الحوكمة، التحليلات، التكاملات، الأمان، النسخ الاحتياطي، والصلاحيات المستقبلية.",
          chips: [
            "⚙️ System Config",
            "🔐 Security Ready",
            "🤖 AI Engines",
            "🔌 Integration Ready"
          ]
        }) : this.fallbackHero()}

        <div class="module-grid">
          ${this.kpi("إصدار النظام", config.app?.version || "2.0.0", "Version")}
          ${this.kpi("المحركات", "8", "Core Engines")}
          ${this.kpi("الوحدات", "12", "Modules")}
          ${this.kpi("Executive Score", `${scores.executiveScore || 0}%`, "Analytics")}
          ${this.kpi("اللغة", "AR", "Default")}
          ${this.kpi("الوضع", "Light", "Theme")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("System Overview", "ملخص حالة النظام والبنية الحالية.")}
            <div class="settings-summary-card">
              <strong>AI Work أصبح جاهزاً كبنية Enterprise Operating System</strong>
              <p>
                تم تجهيز المنصة بمحركات مركزية للتحليلات، القرارات، التوصيات، الرسوم،
                الأتمتة، والواجهات، مع وحدات تنفيذية للاستراتيجية والمشاريع والحوكمة والنضج.
              </p>

              <div class="settings-summary-strip">
                <div><span>App</span><b>${config.app?.shortName || "AI Work"}</b></div>
                <div><span>Env</span><b>${config.app?.environment || "production"}</b></div>
                <div><span>Locale</span><b>${config.app?.locale || "ar-AE"}</b></div>
                <div><span>Dir</span><b>${config.app?.direction || "rtl"}</b></div>
              </div>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("Admin Decision", "قرار إداري مهم للمرحلة القادمة.")}
            <div class="settings-admin-card">
              <strong>الخطوة التالية هي الربط بين الوحدات والمحركات</strong>
              <p>
                بعد اكتمال الإعدادات، نبدأ مرحلة الربط النهائي: كل صفحة تقرأ من Analytics,
                Decision, Recommendation, Automation, Store بدل الحساب اليدوي داخل كل موديول.
              </p>
              <button class="module-btn secondary" data-module="dashboard">العودة للرئيسية</button>
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("Configuration Sections", "أقسام الإعدادات الرئيسية للمنصة.")}
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
                  <em class="${e.ready ? "green" : "orange"}">${e.ready ? "Ready" : "Planned"}</em>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("Data & Storage", "مفاتيح التخزين المحلية الحالية.")}
            <div class="settings-storage-list">
              <div><strong>Data Key</strong><span>${config.storage?.data || "atcDataV1"}</span></div>
              <div><strong>Settings Key</strong><span>${config.storage?.settings || "atcSettingsV1"}</span></div>
              <div><strong>Backup Key</strong><span>${config.storage?.backup || "atcBackupV1"}</span></div>
              <div><strong>Current Module</strong><span>${config.storage?.currentModule || "aiwCurrentModule"}</span></div>
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("Platform Roadmap", "الإعدادات والتكاملات المستقبلية المخطط لها.")}
          <div class="settings-roadmap">
            <div><b>1</b><strong>Permissions</strong><span>Roles, access, admin mode.</span></div>
            <div><b>2</b><strong>Notifications</strong><span>Alerts, reminders, risk escalation.</span></div>
            <div><b>3</b><strong>Integrations</strong><span>Power BI, M365, SharePoint.</span></div>
            <div><b>4</b><strong>AI Assistant</strong><span>Executive Copilot and chat layer.</span></div>
            <div><b>5</b><strong>Cloud Backend</strong><span>Database, API, authentication.</span></div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("Backup & Restore", "إدارة النسخ الاحتياطي للبيانات.")}
            <div class="settings-action-card">
              <strong>Local Backup Ready</strong>
              <p>حالياً البيانات محفوظة محلياً، والمرحلة القادمة يمكن ربطها بسحابة أو قاعدة بيانات.</p>
              <button class="module-btn" onclick="AIW.Modules.settings.exportData()">تصدير البيانات</button>
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

      </section>
    `;
  },

  engineStatus() {
    return [
      { icon: "🧩", name: "Widgets Engine", desc: "Reusable UI components.", ready: !!window.AIW?.Widgets },
      { icon: "📊", name: "Charts Engine", desc: "Chart.js wrapper.", ready: !!window.AIW?.Charts },
      { icon: "📈", name: "Analytics Engine", desc: "Scores and executive analytics.", ready: !!window.AIW?.Analytics },
      { icon: "⚙️", name: "Automation Engine", desc: "Workflow and event engine.", ready: !!window.AIW?.Automation },
      { icon: "🤖", name: "AI Engine", desc: "Enterprise intelligence layer.", ready: !!window.AIW?.AI },
      { icon: "🧭", name: "Decision Engine", desc: "Decision support system.", ready: !!window.AIW?.Decision },
      { icon: "💡", name: "Recommendation Engine", desc: "Executive recommendations.", ready: !!window.AIW?.Recommendation },
      { icon: "🔐", name: "Permissions Engine", desc: "Roles and access control.", ready: !!window.AIW?.Permissions }
    ];
  },

  diagnostics() {
    return [
      { name: "Config Loaded", ok: !!(window.AIW?.Config || window.ATC_CONFIG) },
      { name: "Data Layer Loaded", ok: !!window.AIW?.Data },
      { name: "Store Loaded", ok: !!window.AIW?.Store },
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
        <span class="module-kicker">Enterprise Settings</span>
        <h1>مركز الإعدادات والإدارة</h1>
        <p>لوحة إعدادات مؤسسية لإدارة المنصة والمحركات والتكاملات.</p>
      </div>
    `;
  }
};