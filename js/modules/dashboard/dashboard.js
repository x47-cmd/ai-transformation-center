/* =========================================================
   AI Work - Executive Dashboard V3.3
   Scope: Enterprise Biometric Intelligence Platform

   Updates:
   - Preserve the blue hero without visual changes
   - Remove "Next Stage" panel
   - Add Executive Alerts panel
   - Prepare centralized data integration
   - Add automatic cross-page refresh
   - Improve safe numeric calculations
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.dashboard = {
  id: "dashboard",
  title: "الرئيسية",
  icon: "🏠",

  _container: null,
  _syncBound: false,

  render(container) {
    if (!container) return;

    this._container = container;

    const data = this.getData();
    const summary = data.summary || {};

    const ideas = Array.isArray(data.ideas)
      ? data.ideas
      : [];

    const projects = Array.isArray(data.projects)
      ? data.projects
      : [];

    const governance = Array.isArray(data.governance)
      ? data.governance
      : [];

    const alerts = this.getAlerts(data);

    /* =====================================================
       Ideas
    ===================================================== */

    const ideasCount = this.toSafeNumber(
      summary.ideasCount ??
      ideas.length,
      0
    );

    const targetIdeas = Math.max(
      1,
      this.toSafeNumber(
        summary.targetIdeas,
        100
      )
    );

    const ideaProgress = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          (ideasCount / targetIdeas) * 100
        )
      )
    );

    /* =====================================================
       High Priority Ideas
    ===================================================== */

    const calculatedHighPriorityIdeas = ideas.filter((item) => {
      const priority = String(
        item?.priority ??
        item?.priorityLevel ??
        item?.level ??
        ""
      )
        .trim()
        .toLowerCase();

      return (
        priority === "عالية" ||
        priority === "عالي" ||
        priority === "high" ||
        priority === "high priority" ||
        priority === "critical"
      );
    }).length;

    const highPriorityIdeas = this.toSafeNumber(
      summary.highPriorityIdeasCount ??
      calculatedHighPriorityIdeas,
      0
    );

    /* =====================================================
       Executive Indicators
    ===================================================== */

    const readiness = this.normalizePercent(
      summary.aiReadiness ??
      summary.readiness ??
      summary.maturityScore,
      34
    );

    const systemHealth = this.normalizePercent(
      summary.systemHealth ??
      summary.portfolioHealth,
      68
    );

    const operationsHealth = this.normalizePercent(
      summary.operationsHealth ??
      summary.operationalHealth,
      92
    );

    /* =====================================================
       Hero Statistics
    ===================================================== */

    const flagshipProjectsCount = this.toSafeNumber(
      summary.flagshipProjectsCount ??
      summary.projectsCount ??
      projects.length,
      15
    );

    const departmentsCount = this.toSafeNumber(
      summary.departmentsCount ??
      summary.operationalPortfoliosCount ??
      (Array.isArray(data.departments)
        ? data.departments.length
        : 0),
      5
    );

    const roadmapPeriod =
      summary.period ??
      summary.roadmapPeriod ??
      "2026–2030";

    /* =====================================================
       Governance
    ===================================================== */

    const activeGovernanceControls = governance.filter((item) => {
      const status = String(
        item?.status ??
        item?.state ??
        ""
      )
        .trim()
        .toLowerCase();

      if (!status) return true;

      return (
        status === "active" ||
        status === "enabled" ||
        status === "approved" ||
        status === "مفعل" ||
        status === "مفعّل" ||
        status === "معتمد" ||
        status === "نشط"
      );
    }).length;

    const governanceControlsCount = this.toSafeNumber(
      summary.governanceControlsCount ??
      summary.humanInTheLoopControls ??
      activeGovernanceControls,
      0
    );

    /* =====================================================
       Executive Alerts
    ===================================================== */

    const criticalAlertsCount = alerts.filter((item) => {
      const severity = String(
        item?.severity ??
        item?.level ??
        item?.priority ??
        item?.type ??
        ""
      )
        .trim()
        .toLowerCase();

      const status = String(
        item?.status ??
        item?.state ??
        ""
      )
        .trim()
        .toLowerCase();

      const isClosed =
        status === "closed" ||
        status === "resolved" ||
        status === "dismissed" ||
        status === "مغلق" ||
        status === "تم الحل";

      const isCritical =
        severity === "critical" ||
        severity === "high" ||
        severity === "حرج" ||
        severity === "عالي" ||
        severity === "عالية";

      return isCritical && !isClosed;
    }).length;

    const executiveAlertValue =
      criticalAlertsCount > 0
        ? `${criticalAlertsCount} حرجة`
        : "0 حرجة";

    const executiveAlertNote =
      criticalAlertsCount > 0
        ? "تحتاج مراجعة تنفيذية"
        : "جميع المؤشرات مستقرة";

    /* =====================================================
       Operations Trend
    ===================================================== */

    const operationsTrend = this.getOperationsTrend(
      summary.operationsTrend ??
      summary.operationalTrend ??
      data.operationsTrend
    );

    container.innerHTML = `
      <section class="module-page v3-dashboard-page">

        <!-- =================================================
             Hero
             Kept visually and structurally unchanged
        ================================================== -->

        <section class="v3-hero-card">
          <div class="v3-hero-content">
            <span class="v3-hero-badge">
              Enterprise Biometric AI Platform
            </span>

            <h1>
              منصة تنفيذية لتطوير الأنظمة البيومترية
              والبوابات الذكية بالذكاء الاصطناعي
            </h1>

            <p>
              مركز واحد يربط جودة التسجيلات، استخدام الصلاحيات،
              أداء البوابات، الأمن الرقمي، المؤشرات، والتنبيهات الذكية.
            </p>
          </div>

          <div class="v3-ai-visual">
            <div class="v3-ai-orb">AI</div>
          </div>

          <div class="v3-hero-stats">
            <div>
              <strong>${ideasCount}/${targetIdeas} 💡</strong>
              <span>فكرة متخصصة</span>
            </div>

            <div>
              <strong>
                ${flagshipProjectsCount} 📁
              </strong>
              <span>حل ذكي رئيسي</span>
            </div>

            <div>
              <strong>
                ${departmentsCount} 🛂
              </strong>
              <span>محافظ تشغيلية</span>
            </div>

            <div>
              <strong>
                ${roadmapPeriod} 🗓️
              </strong>
              <span>خارطة زمنية</span>
            </div>
          </div>
        </section>

        <!-- =================================================
             Main KPIs
        ================================================== -->

        <section class="v3-kpi-grid">
          ${this.kpiCard(
            "👁️",
            "الأفكار الحالية",
            ideasCount,
            `${ideaProgress}% من هدف ${targetIdeas} فكرة`,
            "blue"
          )}

          ${this.kpiCard(
            "🚀",
            "أولوية عالية",
            highPriorityIdeas,
            "جاهزة للتقييم التنفيذي",
            "green"
          )}

          ${this.kpiCard(
            "🛂",
            "جاهزية الذكاء الاصطناعي",
            `${readiness}%`,
            "AI Readiness",
            "purple"
          )}

          ${this.kpiCard(
            "📊",
            "صحة الأنظمة",
            `${systemHealth}%`,
            "System Health",
            "green"
          )}
        </section>

        <!-- =================================================
             Operational Health
        ================================================== -->

        <section class="v3-roi-card">
          <div>
            <h3>🟢 حالة العمليات البيومترية</h3>
            <strong>${operationsHealth}%</strong>
            <p>Operational Health</p>
          </div>

          <div
            class="v3-mini-chart"
            aria-label="مؤشر حالة العمليات البيومترية"
          >
            ${this.renderMiniChart(operationsTrend)}
          </div>
        </section>

        <!-- =================================================
             Governance + Executive Alerts
        ================================================== -->

        <section class="v3-summary-grid">
          <article class="v3-small-panel">
            <h3>🛡️ الحوكمة</h3>
            <strong>${governanceControlsCount}</strong>
            <p>ضابط رقابي مفعّل</p>
          </article>

          <article class="v3-small-panel">
            <h3>🔔 التنبيهات التنفيذية</h3>
            <strong>${executiveAlertValue}</strong>
            <p>${executiveAlertNote}</p>
          </article>
        </section>

      </section>
    `;

    this.bindAutomaticSync();
  },

  /* =======================================================
     KPI Card
  ======================================================= */

  kpiCard(icon, label, value, note, tone) {
    return `
      <article class="v3-kpi-card">
        <div class="v3-kpi-icon ${tone}">
          ${icon}
        </div>

        <div class="v3-kpi-text">
          <h3>${label}</h3>
          <strong>${value}</strong>
          <p>${note}</p>
        </div>
      </article>
    `;
  },

  /* =======================================================
     Central Data Reader

     Priority:
     1. AIW.Store.getState()
     2. AIW.Store.getData()
     3. AIW.Data
     4. localStorage
  ======================================================= */

  getData() {
    try {
      if (
        window.AIW?.Store &&
        typeof window.AIW.Store.getState === "function"
      ) {
        const storeState = window.AIW.Store.getState();

        if (
          storeState &&
          typeof storeState === "object"
        ) {
          return storeState;
        }
      }

      if (
        window.AIW?.Store &&
        typeof window.AIW.Store.getData === "function"
      ) {
        const storeData = window.AIW.Store.getData();

        if (
          storeData &&
          typeof storeData === "object"
        ) {
          return storeData;
        }
      }

      if (
        window.AIW?.Data &&
        typeof window.AIW.Data === "object"
      ) {
        return window.AIW.Data;
      }

      return this.readLocalStorageData();
    } catch (error) {
      console.warn(
        "AI Work Dashboard: Unable to read shared data.",
        error
      );

      return {};
    }
  },

  /* =======================================================
     Local Storage Fallback
  ======================================================= */

  readLocalStorageData() {
    const storageKeys = [
      "aiwDataV1",
      "aiwData",
      "AIW_DATA"
    ];

    for (const key of storageKeys) {
      try {
        const savedValue = localStorage.getItem(key);

        if (!savedValue) continue;

        const parsedValue = JSON.parse(savedValue);

        if (
          parsedValue &&
          typeof parsedValue === "object"
        ) {
          return parsedValue;
        }
      } catch (error) {
        console.warn(
          `AI Work Dashboard: Invalid stored data in ${key}.`,
          error
        );
      }
    }

    return {};
  },

  /* =======================================================
     Alerts Reader
  ======================================================= */

  getAlerts(data) {
    if (Array.isArray(data.alerts)) {
      return data.alerts;
    }

    if (Array.isArray(data.notifications)) {
      return data.notifications;
    }

    if (Array.isArray(data.executiveAlerts)) {
      return data.executiveAlerts;
    }

    return [];
  },

  /* =======================================================
     Operations Trend
  ======================================================= */

  getOperationsTrend(trend) {
    const fallbackTrend = [
      82,
      76,
      88,
      70,
      92,
      84,
      96,
      90,
      94
    ];

    if (!Array.isArray(trend) || trend.length === 0) {
      return fallbackTrend;
    }

    const cleanedTrend = trend
      .map((item) => {
        if (
          item &&
          typeof item === "object"
        ) {
          return this.normalizePercent(
            item.value ??
            item.health ??
            item.score ??
            item.percentage,
            0
          );
        }

        return this.normalizePercent(item, 0);
      })
      .filter((value) => Number.isFinite(value))
      .slice(-9);

    return cleanedTrend.length
      ? cleanedTrend
      : fallbackTrend;
  },

  renderMiniChart(values) {
    return values
      .map((value) => {
        const safeHeight = Math.max(
          12,
          Math.min(100, value)
        );

        return `
          <span
            style="height:${safeHeight}%"
            title="${safeHeight}%"
          ></span>
        `;
      })
      .join("");
  },

  /* =======================================================
     Automatic Cross-Page Synchronization
  ======================================================= */

  bindAutomaticSync() {
    if (this._syncBound) return;

    this._syncBound = true;

    const refreshDashboard = () => {
      const activeContainer = this._container;

      if (
        !activeContainer ||
        !activeContainer.isConnected
      ) {
        return;
      }

      this.render(activeContainer);
    };

    const syncEvents = [
      "aiw:dataChanged",
      "aiw:dataUpdated",
      "aiw:storeChanged",

      "aiw:ideasChanged",
      "aiw:ideasUpdated",

      "aiw:projectsChanged",
      "aiw:projectsUpdated",

      "aiw:strategyChanged",
      "aiw:strategyUpdated",

      "aiw:governanceChanged",
      "aiw:governanceUpdated",

      "aiw:alertsChanged",
      "aiw:alertsUpdated",

      "aiw:operationsChanged",
      "aiw:operationsUpdated"
    ];

    syncEvents.forEach((eventName) => {
      window.addEventListener(
        eventName,
        refreshDashboard
      );
    });

    window.addEventListener(
      "storage",
      (event) => {
        const supportedKeys = [
          "aiwDataV1",
          "aiwData",
          "AIW_DATA"
        ];

        if (
          !event.key ||
          supportedKeys.includes(event.key)
        ) {
          refreshDashboard();
        }
      }
    );
  },

  /* =======================================================
     Utilities
  ======================================================= */

  toSafeNumber(value, fallback = 0) {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue)
      ? parsedValue
      : fallback;
  },

  normalizePercent(value, fallback = 0) {
    const parsedValue = this.toSafeNumber(
      value,
      fallback
    );

    return Math.min(
      100,
      Math.max(
        0,
        Math.round(parsedValue)
      )
    );
  }
};