/* =========================================================
   AI Work - Executive Platform Center V2.1
   Scope: Enterprise Biometric Intelligence Platform

   Features:
   - AIW.Store Integration
   - Platform Health
   - Core Engines Status
   - Module Registry
   - Platform Metadata
   - Diagnostics Center
   - Version Information
   - Automatic Synchronization
   - Executive Presentation Mode
   - No UI Design Changes
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.settings = {
  id: "settings",
  title: "المزيد",
  icon: "⋮",
  version: "2.1.0",

  _container: null,
  _unsubscribe: null,
  _listenersAttached: false,
  _refreshTimer: null,
  _lastRenderAt: null,

  /* =========================================================
     PLATFORM CONFIGURATION
  ========================================================= */

  platformInfo: {
    name: "Enterprise Biometric Intelligence Platform",
    shortName: "AI Work",
    edition: "Executive Platform",
    environment: "Enterprise",
    architecture: "Modular Single Page Application",
    dataModel: "Single Source of Truth",
    synchronization: "Automatic",
    deployment: "GitHub Pages",
    locale: "ar-AE",
    direction: "RTL"
  },

  capabilities: [
    {
      icon: "💡",
      title: "إدارة فرص الذكاء الاصطناعي",
      desc:
        "حصر الفرص التشغيلية وتصنيفها وتقييمها قبل تحويلها إلى مشاريع تنفيذية."
    },
    {
      icon: "📁",
      title: "إدارة المشاريع التنفيذية",
      desc:
        "متابعة المشاريع والمراحل والجاهزية والتقدم والمخرجات المتوقعة."
    },
    {
      icon: "📊",
      title: "التحليلات التنفيذية",
      desc:
        "تحويل بيانات التسجيلات والبوابات والصلاحيات إلى مؤشرات تدعم القرار."
    },
    {
      icon: "🧭",
      title: "دعم اتخاذ القرار",
      desc:
        "تقييم الفرص والمخاطر والأولوية وتقديم توصيات قابلة للمراجعة والتنفيذ."
    },
    {
      icon: "🔔",
      title: "التنبيهات الذكية",
      desc:
        "تنبيهات مرتبطة بجودة التسجيلات واستخدام الصلاحيات والبوابات والمخاطر."
    },
    {
      icon: "🛡️",
      title: "الحوكمة والامتثال",
      desc:
        "ضمان الإشراف البشري والخصوصية والمراجعة وتوثيق القرارات الحساسة."
    }
  ],

  alertAreas: [
    {
      title: "تنبيهات التسجيلات",
      desc:
        "اكتشاف التسجيلات الناقصة أو المتعارضة أو منخفضة الجودة.",
      status: "متاح"
    },
    {
      title: "تنبيهات الصلاحيات",
      desc:
        "مراقبة الاستخدام غير المعتاد والصلاحيات غير المستخدمة أو الحساسة.",
      status: "متاح"
    },
    {
      title: "تنبيهات البوابات",
      desc:
        "متابعة انخفاض الأداء والأخطاء والتوقفات المتكررة.",
      status: "مخطط"
    },
    {
      title: "تصعيد المخاطر",
      desc:
        "رفع الحالات عالية الخطورة إلى المسؤولين حسب مستوى الأولوية.",
      status: "مخطط"
    }
  ],

  governanceControls: [
    {
      title: "الإشراف البشري",
      desc:
        "القرار النهائي في الحالات الحساسة يبقى لدى الموظف المسؤول.",
      status: "إلزامي"
    },
    {
      title: "مراجعة الخصوصية",
      desc:
        "استخدام البيانات الضرورية فقط مع حماية المعلومات الشخصية.",
      status: "إلزامي"
    },
    {
      title: "توثيق القرارات",
      desc:
        "حفظ التوصيات وقرارات القبول والرفض لأغراض التدقيق.",
      status: "معتمد"
    },
    {
      title: "مراجعة المخاطر",
      desc:
        "تقييم أثر كل مشروع قبل الانتقال إلى التكامل أو التشغيل الفعلي.",
      status: "إلزامي"
    }
  ],

  engineDefinitions: [
    {
      key: "Store",
      label: "محرك البيانات المركزي",
      description:
        "إدارة الحالة المركزية وحفظ البيانات ومزامنة الوحدات.",
      required: true
    },
    {
      key: "Router",
      label: "محرك التنقل",
      description:
        "إدارة الانتقال بين صفحات ووحدات المنصة.",
      required: true
    },
    {
      key: "Widgets",
      label: "محرك الواجهات",
      description:
        "توفير المكونات المشتركة مثل الهيرو والمؤشرات والعناوين.",
      required: true
    },
    {
      key: "Analytics",
      label: "محرك التحليلات",
      description:
        "تحليل البيانات التشغيلية واستخراج المؤشرات التنفيذية.",
      required: false
    },
    {
      key: "BiometricAnalytics",
      label: "محرك التحليلات البيومترية",
      description:
        "إثراء الفرص وتحليل الأنظمة والعمليات البيومترية.",
      required: false
    },
    {
      key: "Automation",
      label: "محرك الأتمتة",
      description:
        "تنفيذ تدفقات العمل والمحفزات والتصعيدات التشغيلية.",
      required: false
    },
    {
      key: "AIEngine",
      label: "محرك الذكاء الاصطناعي",
      description:
        "تشغيل التحليلات والتوصيات المدعومة بالذكاء الاصطناعي.",
      required: false
    },
    {
      key: "DecisionEngine",
      label: "محرك القرار",
      description:
        "تقييم الأولويات والمخاطر وإنتاج توصيات القرار.",
      required: false
    },
    {
      key: "RecommendationEngine",
      label: "محرك التوصيات",
      description:
        "توليد التوصيات التنفيذية بناءً على بيانات المنصة.",
      required: false
    },
    {
      key: "Notifications",
      label: "محرك التنبيهات",
      description:
        "إدارة الإشعارات والتنبيهات التشغيلية والتنفيذية.",
      required: false
    },
    {
      key: "Permissions",
      label: "محرك الصلاحيات",
      description:
        "إدارة الوصول والصلاحيات والأدوار داخل المنصة.",
      required: false
    },
    {
      key: "Export",
      label: "محرك التصدير",
      description:
        "إعداد البيانات والتقارير للتصدير والمشاركة.",
      required: false
    },
    {
      key: "Charts",
      label: "محرك الرسوم البيانية",
      description:
        "عرض المؤشرات والاتجاهات والبيانات بصرياً.",
      required: false
    }
  ],

  /* =========================================================
     DATA ACCESS
  ========================================================= */

  getStore() {
    return window.AIW?.Store || null;
  },

  getStoreState() {
    const store = this.getStore();

    if (!store) {
      return null;
    }

    try {
      if (typeof store.getState === "function") {
        return store.getState();
      }

      if (typeof store.getData === "function") {
        return store.getData();
      }

      if (typeof store.get === "function") {
        const state = store.get();

        if (state && typeof state === "object") {
          return state;
        }
      }

      if (store.state && typeof store.state === "object") {
        return store.state;
      }

      if (store.data && typeof store.data === "object") {
        return store.data;
      }
    } catch (error) {
      console.warn(
        "[AIW Settings] Unable to read AIW.Store:",
        error
      );
    }

    return null;
  },

  getData() {
    const storeState = this.getStoreState();

    if (storeState && typeof storeState === "object") {
      if (
        storeState.data &&
        typeof storeState.data === "object"
      ) {
        return storeState.data;
      }

      return storeState;
    }

    return window.AIW?.Data || {};
  },

  getIdeas() {
    const data = this.getData();

    try {
      if (
        window.AIW?.BiometricAnalytics &&
        typeof AIW.BiometricAnalytics.enrichIdeas === "function"
      ) {
        const enrichedIdeas =
          AIW.BiometricAnalytics.enrichIdeas();

        if (Array.isArray(enrichedIdeas)) {
          return enrichedIdeas;
        }
      }
    } catch (error) {
      console.warn(
        "[AIW Settings] Idea enrichment failed:",
        error
      );
    }

    return this.toArray(data.ideas);
  },

  getDepartments() {
    const data = this.getData();

    return this.toArray(
      data.departments ||
      data.portfolios ||
      data.solutionPortfolios
    );
  },

  getProjects() {
    const data = this.getData();

    return this.toArray(
      data.flagshipProjects ||
      data.projects
    );
  },

  getGovernance() {
    const data = this.getData();

    return this.toArray(
      data.governance ||
      data.governanceControls
    );
  },

  getRisks() {
    const data = this.getData();

    return this.toArray(data.risks);
  },

  getKpis() {
    const data = this.getData();

    return this.toArray(
      data.kpis ||
      data.performanceIndicators
    );
  },

  getWorkflows() {
    const data = this.getData();
    const automationModule =
      window.AIW?.Modules?.automation;

    return this.toArray(
      data.workflows ||
      data.automation?.workflows ||
      automationModule?.workflows
    );
  },

  /* =========================================================
     STORE SYNCHRONIZATION
  ========================================================= */

  initialize(container) {
    if (container) {
      this._container = container;
    }

    this.bindStore();
    this.bindPlatformEvents();
    this.updatePlatformMetadata();

    return this;
  },

  bindStore() {
    const store = this.getStore();

    if (!store || this._unsubscribe) {
      return;
    }

    const refresh = () => {
      this.scheduleRefresh();
    };

    try {
      if (typeof store.subscribe === "function") {
        const unsubscribe = store.subscribe(refresh);

        if (typeof unsubscribe === "function") {
          this._unsubscribe = unsubscribe;
        } else {
          this._unsubscribe = () => {};
        }

        return;
      }

      if (typeof store.onChange === "function") {
        const unsubscribe = store.onChange(refresh);

        if (typeof unsubscribe === "function") {
          this._unsubscribe = unsubscribe;
        } else {
          this._unsubscribe = () => {};
        }

        return;
      }

      if (typeof store.on === "function") {
        store.on("change", refresh);

        this._unsubscribe = () => {
          if (typeof store.off === "function") {
            store.off("change", refresh);
          }
        };
      }
    } catch (error) {
      console.warn(
        "[AIW Settings] Store subscription failed:",
        error
      );
    }
  },

  bindPlatformEvents() {
    if (this._listenersAttached) {
      return;
    }

    this._listenersAttached = true;

    const events = [
      "aiw:dataChanged",
      "aiw:dataUpdated",
      "aiw:storeChanged",
      "aiw:storeUpdated",
      "aiw:moduleUpdated",
      "aiw:projectUpdated",
      "aiw:ideaUpdated",
      "aiw:governanceUpdated",
      "aiw:kpiUpdated",
      "aiw:riskUpdated",
      "aiw:automationUpdated",
      "storage"
    ];

    events.forEach(eventName => {
      window.addEventListener(
        eventName,
        () => this.scheduleRefresh()
      );
    });
  },

  scheduleRefresh() {
    window.clearTimeout(this._refreshTimer);

    this._refreshTimer = window.setTimeout(() => {
      if (
        this._container &&
        document.body.contains(this._container)
      ) {
        this.render(this._container);
      }
    }, 80);
  },

  updatePlatformMetadata() {
    const store = this.getStore();

    if (!store) {
      return;
    }

    const metadata = {
      settingsModuleVersion: this.version,
      platformName: this.platformInfo.name,
      platformEdition: this.platformInfo.edition,
      architecture: this.platformInfo.architecture,
      synchronization:
        this.platformInfo.synchronization,
      lastSettingsAccess:
        new Date().toISOString()
    };

    try {
      if (typeof store.setMetadata === "function") {
        store.setMetadata(metadata);
        return;
      }

      if (typeof store.updateMetadata === "function") {
        store.updateMetadata(metadata);
        return;
      }

      if (typeof store.patch === "function") {
        store.patch({
          meta: {
            ...(this.getData().meta || {}),
            ...metadata
          }
        });
      }
    } catch (error) {
      console.warn(
        "[AIW Settings] Metadata synchronization skipped:",
        error
      );
    }
  },

  /* =========================================================
     PLATFORM HEALTH
  ========================================================= */

  getEngineStatuses() {
    return this.engineDefinitions.map(engine => {
      const instance = window.AIW?.[engine.key];
      const available = Boolean(instance);

      let status = available
        ? "يعمل"
        : engine.required
          ? "غير متاح"
          : "غير محمل";

      let health = available ? 100 : 0;

      if (
        available &&
        instance.enabled === false
      ) {
        status = "متوقف";
        health = 25;
      }

      if (
        available &&
        instance.status === "error"
      ) {
        status = "خطأ";
        health = 10;
      }

      if (
        available &&
        instance.status === "warning"
      ) {
        status = "تحذير";
        health = 65;
      }

      return {
        ...engine,
        instance,
        available,
        status,
        health,
        version:
          instance?.version ||
          instance?.VERSION ||
          "—"
      };
    });
  },

  getModuleRegistry() {
    const modules = window.AIW?.Modules || {};

    return Object.keys(modules)
      .map(key => {
        const module = modules[key] || {};

        const hasRender =
          typeof module.render === "function";

        return {
          key,
          id: module.id || key,
          title: module.title || key,
          icon: module.icon || "◼",
          version:
            module.version ||
            module.VERSION ||
            "—",
          ready: hasRender,
          status: hasRender
            ? "جاهز"
            : "غير مكتمل"
        };
      })
      .sort((a, b) =>
        String(a.title).localeCompare(
          String(b.title),
          "ar"
        )
      );
  },

  getDiagnostics() {
    const data = this.getData();
    const engines = this.getEngineStatuses();
    const modules = this.getModuleRegistry();

    const checks = [
      {
        title: "طبقة البيانات المركزية",
        description:
          "التحقق من توفر AIW.Store كمصدر موحد للبيانات.",
        passed: Boolean(this.getStore()),
        critical: true
      },
      {
        title: "بيانات المنصة",
        description:
          "التحقق من وجود نموذج بيانات صالح يمكن للوحدات قراءته.",
        passed:
          Boolean(data) &&
          typeof data === "object",
        critical: true
      },
      {
        title: "سجل الوحدات",
        description:
          "التحقق من تسجيل الوحدات التشغيلية داخل AIW.Modules.",
        passed: modules.length > 0,
        critical: true
      },
      {
        title: "الوحدات القابلة للعرض",
        description:
          "التحقق من احتواء الوحدات المسجلة على دالة render.",
        passed:
          modules.length > 0 &&
          modules.every(module => module.ready),
        critical: false
      },
      {
        title: "مكونات الواجهة المشتركة",
        description:
          "التحقق من توفر AIW.Widgets لبناء الواجهات الموحدة.",
        passed: Boolean(window.AIW?.Widgets),
        critical: false
      },
      {
        title: "محرك التحليلات البيومترية",
        description:
          "التحقق من توفر محرك إثراء وتحليل الفرص البيومترية.",
        passed: Boolean(
          window.AIW?.BiometricAnalytics
        ),
        critical: false
      },
      {
        title: "محركات Core الأساسية",
        description:
          "التحقق من توفر المحركات المصنفة كمتطلبات أساسية.",
        passed: engines
          .filter(engine => engine.required)
          .every(engine => engine.available),
        critical: true
      },
      {
        title: "التخزين المحلي",
        description:
          "التحقق من قدرة المتصفح على استخدام Local Storage.",
        passed: this.checkLocalStorage(),
        critical: false
      }
    ];

    return checks;
  },

  calculatePlatformHealth() {
    const engines = this.getEngineStatuses();
    const modules = this.getModuleRegistry();
    const diagnostics = this.getDiagnostics();

    const requiredEngines = engines.filter(
      engine => engine.required
    );

    const requiredEngineScore =
      requiredEngines.length
        ? requiredEngines.reduce(
            (sum, engine) => sum + engine.health,
            0
          ) / requiredEngines.length
        : 100;

    const allEngineScore =
      engines.length
        ? engines.reduce(
            (sum, engine) => sum + engine.health,
            0
          ) / engines.length
        : 0;

    const moduleScore =
      modules.length
        ? (
            modules.filter(module => module.ready)
              .length /
            modules.length
          ) * 100
        : 0;

    const diagnosticScore =
      diagnostics.length
        ? (
            diagnostics.filter(check => check.passed)
              .length /
            diagnostics.length
          ) * 100
        : 0;

    const dataScore =
      this.calculateDataCompleteness();

    const score = Math.round(
      requiredEngineScore * 0.3 +
      allEngineScore * 0.15 +
      moduleScore * 0.2 +
      diagnosticScore * 0.2 +
      dataScore * 0.15
    );

    return {
      score: Math.max(0, Math.min(100, score)),
      status: this.getHealthStatus(score),
      requiredEngineScore: Math.round(
        requiredEngineScore
      ),
      allEngineScore: Math.round(allEngineScore),
      moduleScore: Math.round(moduleScore),
      diagnosticScore: Math.round(
        diagnosticScore
      ),
      dataScore: Math.round(dataScore)
    };
  },

  calculateDataCompleteness() {
    const collections = [
      this.getIdeas(),
      this.getDepartments(),
      this.getProjects(),
      this.getGovernance(),
      this.getRisks(),
      this.getKpis(),
      this.getWorkflows()
    ];

    const availableCollections =
      collections.filter(
        collection =>
          Array.isArray(collection) &&
          collection.length > 0
      ).length;

    return Math.round(
      (availableCollections / collections.length) *
        100
    );
  },

  getHealthStatus(score) {
    if (score >= 90) {
      return "ممتاز";
    }

    if (score >= 75) {
      return "مستقر";
    }

    if (score >= 60) {
      return "يحتاج متابعة";
    }

    return "يحتاج معالجة";
  },

  getHealthClass(score) {
    if (score >= 75) {
      return "green";
    }

    return "orange";
  },

  /* =========================================================
     METADATA
  ========================================================= */

  getMetadata() {
    const data = this.getData();
    const storeState = this.getStoreState();
    const store = this.getStore();

    const metadata =
      data.meta ||
      data.metadata ||
      storeState?.meta ||
      storeState?.metadata ||
      {};

    const storageKey =
      store?.storageKey ||
      store?.key ||
      window.AIW?.Config?.storageKey ||
      window.AIW?.CONFIG?.storageKey ||
      "AIW Platform Storage";

    return {
      platformVersion:
        window.AIW?.version ||
        window.AIW?.VERSION ||
        window.AIW?.Config?.version ||
        window.AIW?.CONFIG?.version ||
        metadata.version ||
        "2.0.0",
      moduleVersion: this.version,
      dataVersion:
        metadata.dataVersion ||
        metadata.schemaVersion ||
        "1.0",
      environment:
        window.AIW?.Config?.environment ||
        window.AIW?.CONFIG?.environment ||
        this.platformInfo.environment,
      storageKey,
      createdAt:
        metadata.createdAt ||
        metadata.created ||
        "—",
      updatedAt:
        metadata.updatedAt ||
        metadata.lastUpdated ||
        metadata.modifiedAt ||
        this._lastRenderAt ||
        "—",
      lastSync:
        metadata.lastSync ||
        metadata.syncedAt ||
        metadata.lastSynchronizedAt ||
        "تلقائي",
      storeMode: store
        ? "AIW.Store"
        : "AIW.Data Fallback"
    };
  },

  /* =========================================================
     RENDER
  ========================================================= */

  render(container) {
    if (!container) {
      return;
    }

    this._container = container;
    this._lastRenderAt = new Date().toISOString();

    this.initialize(container);

    const ideas = this.getIdeas();
    const departments = this.getDepartments();
    const projects = this.getProjects();
    const governance = this.getGovernance();
    const risks = this.getRisks();
    const kpis = this.getKpis();
    const workflows = this.getWorkflows();

    const engines = this.getEngineStatuses();
    const modules = this.getModuleRegistry();
    const diagnostics = this.getDiagnostics();
    const health = this.calculatePlatformHealth();
    const metadata = this.getMetadata();

    const highPriority = ideas.filter(idea =>
      this.isHighPriority(idea)
    ).length;

    const quickWins = ideas.filter(idea =>
      this.isQuickWin(idea)
    ).length;

    const activeEngines = engines.filter(
      engine => engine.available
    ).length;

    const readyModules = modules.filter(
      module => module.ready
    ).length;

    const passedDiagnostics = diagnostics.filter(
      check => check.passed
    ).length;

    container.innerHTML = `
      <section class="module-page">

        ${this.renderHero({
          health,
          ideasCount: ideas.length,
          departmentsCount: departments.length,
          projectsCount: projects.length,
          modulesCount: modules.length
        })}

        <div class="module-grid">
          ${this.kpi(
            "صحة المنصة",
            `${health.score}%`,
            health.status
          )}

          ${this.kpi(
            "الوحدات الجاهزة",
            `${readyModules}/${modules.length}`,
            "Module Registry"
          )}

          ${this.kpi(
            "المحركات النشطة",
            `${activeEngines}/${engines.length}`,
            "Core Engines"
          )}

          ${this.kpi(
            "فحوصات التشخيص",
            `${passedDiagnostics}/${diagnostics.length}`,
            "Diagnostics"
          )}

          ${this.kpi(
            "فرص الذكاء الاصطناعي",
            ideas.length,
            "AI Opportunities"
          )}

          ${this.kpi(
            "المشاريع الرئيسية",
            projects.length,
            "Flagship Projects"
          )}
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "صحة المنصة",
            "تقييم موحد لجاهزية البيانات والوحدات والمحركات والفحوصات التشغيلية."
          )}

          <div class="settings-items executive-items">
            ${this.renderHealthItem(
              "الحالة العامة",
              `التقييم الموحد لصحة المنصة وجاهزيتها التشغيلية.`,
              `${health.score}% · ${health.status}`,
              this.getHealthClass(health.score)
            )}

            ${this.renderHealthItem(
              "المحركات الأساسية",
              "جاهزية محرك البيانات والتنقل ومكونات الواجهة المطلوبة لتشغيل المنصة.",
              `${health.requiredEngineScore}%`,
              this.getHealthClass(
                health.requiredEngineScore
              )
            )}

            ${this.renderHealthItem(
              "جاهزية الوحدات",
              "نسبة الوحدات المسجلة التي تحتوي على واجهة عرض تشغيلية.",
              `${health.moduleScore}%`,
              this.getHealthClass(
                health.moduleScore
              )
            )}

            ${this.renderHealthItem(
              "اكتمال البيانات",
              "توفر بيانات الفرص والمشاريع والحوكمة والمخاطر والمؤشرات والأتمتة.",
              `${health.dataScore}%`,
              this.getHealthClass(
                health.dataScore
              )
            )}

            ${this.renderHealthItem(
              "سلامة التشخيص",
              "نتائج الفحوصات التقنية والتنظيمية الأساسية للمنصة.",
              `${health.diagnosticScore}%`,
              this.getHealthClass(
                health.diagnosticScore
              )
            )}
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "حالة محركات المنصة",
            "عرض حالة محركات Core والخدمات المشتركة المستخدمة بواسطة الوحدات التشغيلية."
          )}

          <div class="settings-items executive-items">
            ${engines.map(engine => `
              <div>
                <span>
                  <strong>${engine.label}</strong>

                  <small>
                    ${engine.description}
                    ${
                      engine.version !== "—"
                        ? ` · الإصدار ${engine.version}`
                        : ""
                    }
                  </small>
                </span>

                <b class="${
                  engine.available &&
                  engine.status !== "خطأ" &&
                  engine.status !== "متوقف"
                    ? "green"
                    : "orange"
                }">
                  ${engine.status}
                </b>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "سجل وحدات المنصة",
            "الوحدات المسجلة حالياً داخل AIW.Modules وحالة جاهزية كل وحدة."
          )}

          <div class="department-grid">
            ${modules.map(module => `
              <div class="department-chip">
                <strong>
                  ${module.icon}
                  ${module.title}
                </strong>

                <span>
                  ${module.status}
                  ·
                  ${
                    module.version !== "—"
                      ? `V${module.version}`
                      : module.id
                  }
                </span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "مركز التشخيص",
            "فحوصات تلقائية للتحقق من جاهزية طبقة البيانات والمحركات والوحدات والتخزين."
          )}

          <div class="settings-items executive-items">
            ${diagnostics.map(check => `
              <div>
                <span>
                  <strong>${check.title}</strong>

                  <small>
                    ${check.description}
                    ${
                      check.critical
                        ? " · فحص أساسي"
                        : ""
                    }
                  </small>
                </span>

                <b class="${
                  check.passed
                    ? "green"
                    : "orange"
                }">
                  ${
                    check.passed
                      ? "سليم"
                      : "يحتاج مراجعة"
                  }
                </b>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "قدرات المنصة",
            "القدرات التنفيذية التي تقدمها المنصة لدعم تطوير وإدارة مبادرات الذكاء الاصطناعي."
          )}

          <div class="settings-section-grid">
            ${this.capabilities.map(capability => `
              <article class="settings-section-card">
                <div class="settings-section-icon">
                  ${capability.icon}
                </div>

                <strong>${capability.title}</strong>

                <p>${capability.desc}</p>
              </article>
            `).join("")}
          </div>
        </div>

        <div class="module-wide-grid">

          <div class="module-panel">
            ${this.sectionTitle(
              "مركز التنبيهات الذكية",
              "مجالات التنبيه المرتبطة بالعمليات البيومترية والصلاحيات والبوابات."
            )}

            <div class="settings-items executive-items">
              ${this.alertAreas.map(item => `
                <div>
                  <span>
                    <strong>${item.title}</strong>

                    <small>${item.desc}</small>
                  </span>

                  <b class="${
                    item.status === "متاح"
                      ? "green"
                      : "orange"
                  }">
                    ${item.status}
                  </b>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "الحوكمة والإشراف",
              "الضوابط الأساسية لضمان استخدام مسؤول وآمن للذكاء الاصطناعي."
            )}

            <div class="settings-items executive-items">
              ${this.governanceControls.map(item => `
                <div>
                  <span>
                    <strong>${item.title}</strong>

                    <small>${item.desc}</small>
                  </span>

                  <b class="green">
                    ${item.status}
                  </b>
                </div>
              `).join("")}
            </div>
          </div>

        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "نطاق المنصة",
            "المجالات التشغيلية الرئيسية التي تغطيها منصة الذكاء الاصطناعي البيومترية."
          )}

          ${
            departments.length
              ? `
                <div class="department-grid">
                  ${departments.map(department => `
                    <div class="department-chip">
                      <strong>
                        ${
                          department.name ||
                          department.title ||
                          "محفظة تشغيلية"
                        }
                      </strong>

                      <span>
                        ${this.getDepartmentCount(
                          department.name ||
                          department.title,
                          ideas
                        )} فرص
                        ·
                        جاهزية ${
                          this.getDepartmentMaturity(
                            department
                          )
                        }%
                      </span>
                    </div>
                  `).join("")}
                </div>
              `
              : this.renderEmptyState(
                  "لا توجد محافظ تشغيلية مسجلة حالياً."
                )
          }
        </div>

        <div class="module-wide-grid">

          <div class="module-panel">
            ${this.sectionTitle(
              "أبرز المخاطر التي تتم إدارتها",
              "ملخص للمخاطر الرئيسية والإجراءات المقترحة لمعالجتها."
            )}

            ${
              risks.length
                ? `
                  <div class="settings-items executive-items">
                    ${risks.slice(0, 5).map(risk => `
                      <div>
                        <span>
                          <strong>
                            ${
                              risk.title ||
                              risk.name ||
                              "مخاطر تشغيلية"
                            }
                          </strong>

                          <small>
                            ${
                              risk.mitigation ||
                              risk.action ||
                              risk.description ||
                              "تتم مراجعة خطة المعالجة."
                            }
                          </small>
                        </span>

                        <b class="${
                          this.isHighRisk(risk)
                            ? "orange"
                            : "green"
                        }">
                          ${
                            risk.level ||
                            risk.riskLevel ||
                            "متوسط"
                          }
                        </b>
                      </div>
                    `).join("")}
                  </div>
                `
                : this.renderEmptyState(
                    "لا توجد مخاطر مسجلة حالياً."
                  )
            }
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "مؤشرات التشغيل",
              "ملخص رقمي للبيانات التشغيلية المرتبطة بالمنصة."
            )}

            <div class="settings-items executive-items">
              ${this.renderSummaryItem(
                "الأولوية العالية",
                "الفرص التي تتطلب اهتماماً تنفيذياً مرتفعاً.",
                highPriority
              )}

              ${this.renderSummaryItem(
                "المكاسب السريعة",
                "الفرص منخفضة التعقيد والقابلة للتنفيذ بسرعة.",
                quickWins
              )}

              ${this.renderSummaryItem(
                "ضوابط الحوكمة",
                "ضوابط الحوكمة المسجلة في طبقة البيانات.",
                governance.length
              )}

              ${this.renderSummaryItem(
                "مؤشرات الأداء",
                "مؤشرات الأداء المتاحة للقياس والمتابعة.",
                kpis.length
              )}

              ${this.renderSummaryItem(
                "تدفقات الأتمتة",
                "تدفقات العمل المتوفرة في مركز الأتمتة.",
                workflows.length
              )}
            </div>
          </div>

        </div>

        <div class="module-wide-grid">

          <div class="module-panel">
            ${this.sectionTitle(
              "بيانات المنصة",
              "البيانات الوصفية وإعدادات البيئة ومصدر البيانات المستخدم حالياً."
            )}

            <div class="settings-items executive-items">
              ${this.renderMetadataItem(
                "إصدار المنصة",
                metadata.platformVersion
              )}

              ${this.renderMetadataItem(
                "إصدار مركز المنصة",
                metadata.moduleVersion
              )}

              ${this.renderMetadataItem(
                "إصدار نموذج البيانات",
                metadata.dataVersion
              )}

              ${this.renderMetadataItem(
                "بيئة التشغيل",
                metadata.environment
              )}

              ${this.renderMetadataItem(
                "مصدر البيانات",
                metadata.storeMode
              )}

              ${this.renderMetadataItem(
                "مفتاح التخزين",
                metadata.storageKey
              )}

              ${this.renderMetadataItem(
                "آخر تحديث",
                this.formatDate(metadata.updatedAt)
              )}

              ${this.renderMetadataItem(
                "آخر مزامنة",
                this.formatDate(metadata.lastSync)
              )}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "عن المنصة",
              "تعريف تنفيذي مختصر بالمشروع."
            )}

            <div class="settings-action-card executive-about-card">
              <strong>
                Enterprise Biometric Intelligence Platform
              </strong>

              <p>
                منصة تنفيذية متخصصة في إدارة فرص ومشاريع
                الذكاء الاصطناعي المرتبطة بالأنظمة
                البيومترية، البوابات الذكية، المستخدمين
                والصلاحيات، الأمن الرقمي، والتحليلات
                التنفيذية.
              </p>

              <p>
                تهدف المنصة إلى تحويل التحديات التشغيلية
                إلى مبادرات قابلة للتقييم والتنفيذ والقياس،
                مع المحافظة على الإشراف البشري والحوكمة
                والخصوصية.
              </p>

              <p>
                تعتمد المنصة على بنية وحدات مترابطة ومصدر
                موحد للبيانات، بحيث تنعكس التحديثات تلقائياً
                على المؤشرات والتقارير والقرارات وباقي
                المراكز التشغيلية.
              </p>
            </div>
          </div>

        </div>

      </section>
    `;
  },

  /* =========================================================
     UI COMPONENTS
  ========================================================= */

  renderHero({
    health,
    ideasCount,
    departmentsCount,
    projectsCount,
    modulesCount
  }) {
    const chips = [
      `🩺 صحة المنصة ${health.score}%`,
      `💡 ${ideasCount} فرصة`,
      `🗂️ ${departmentsCount} محافظ`,
      `📁 ${projectsCount} مشروعاً رئيسياً`,
      `🧩 ${modulesCount} وحدات`,
      "🔄 Auto Sync"
    ];

    if (
      window.AIW?.Widgets &&
      typeof AIW.Widgets.hero === "function"
    ) {
      return AIW.Widgets.hero({
        kicker: "Executive Platform Center",
        title: "مركز المنصة التنفيذي",
        description:
          "نظرة شاملة على صحة المنصة، المحركات، الوحدات، البيانات، التشخيص والحوكمة المؤسسية.",
        chips
      });
    }

    return `
      <div class="module-hero">
        <span class="module-kicker">
          Executive Platform Center
        </span>

        <h1>مركز المنصة التنفيذي</h1>

        <p>
          نظرة شاملة على صحة المنصة، المحركات، الوحدات،
          البيانات، التشخيص والحوكمة المؤسسية.
        </p>

        <div class="aiw-chip-row">
          ${chips.map(chip => `
            <span class="aiw-chip">
              ${chip}
            </span>
          `).join("")}
        </div>
      </div>
    `;
  },

  renderHealthItem(
    title,
    description,
    value,
    className
  ) {
    return `
      <div>
        <span>
          <strong>${title}</strong>
          <small>${description}</small>
        </span>

        <b class="${className}">
          ${value}
        </b>
      </div>
    `;
  },

  renderSummaryItem(title, description, value) {
    return `
      <div>
        <span>
          <strong>${title}</strong>
          <small>${description}</small>
        </span>

        <b class="green">
          ${value}
        </b>
      </div>
    `;
  },

  renderMetadataItem(title, value) {
    return `
      <div>
        <span>
          <strong>${title}</strong>
          <small>Platform Metadata</small>
        </span>

        <b class="green">
          ${this.escapeHTML(String(value ?? "—"))}
        </b>
      </div>
    `;
  },

  renderEmptyState(message) {
    return `
      <div class="settings-action-card executive-about-card">
        <strong>لا توجد بيانات</strong>
        <p>${message}</p>
      </div>
    `;
  },

  kpi(label, value, note) {
    if (
      window.AIW?.Widgets &&
      typeof AIW.Widgets.kpi === "function"
    ) {
      return AIW.Widgets.kpi({
        label,
        value,
        note
      });
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
    if (
      window.AIW?.Widgets &&
      typeof AIW.Widgets.sectionTitle === "function"
    ) {
      return AIW.Widgets.sectionTitle(
        title,
        desc
      );
    }

    return `
      <div class="module-section-title compact">
        <h2>${title}</h2>
        <p>${desc}</p>
      </div>
    `;
  },

  /* =========================================================
     HELPERS
  ========================================================= */

  getDepartmentCount(departmentName, ideas) {
    if (!departmentName) {
      return 0;
    }

    const normalizedDepartment =
      this.normalizeText(departmentName);

    return this.toArray(ideas).filter(idea => {
      const ideaDepartment =
        idea.department ||
        idea.portfolio ||
        idea.departmentName ||
        idea.category ||
        "";

      return (
        this.normalizeText(ideaDepartment) ===
        normalizedDepartment
      );
    }).length;
  },

  getDepartmentMaturity(department) {
    const value =
      department.maturity ??
      department.readiness ??
      department.score ??
      department.progress ??
      0;

    return this.clampNumber(value, 0, 100);
  },

  isHighPriority(idea) {
    const priority = this.normalizeText(
      idea.priority ||
      idea.priorityLevel ||
      idea.level
    );

    return [
      "عالية",
      "عال",
      "عالٍ",
      "مرتفع",
      "مرتفعة",
      "high",
      "critical"
    ].includes(priority);
  },

  isQuickWin(idea) {
    if (idea.quickWin === true) {
      return true;
    }

    const ease = this.normalizeText(
      idea.ease ||
      idea.complexity ||
      idea.difficulty
    );

    const cost = this.normalizeText(
      idea.cost ||
      idea.costLevel
    );

    const easyValues = [
      "سهلة",
      "سهل",
      "منخفضة",
      "منخفض",
      "easy",
      "low"
    ];

    const lowCostValues = [
      "منخفضة",
      "منخفض",
      "قليلة",
      "قليل",
      "low"
    ];

    return (
      easyValues.includes(ease) &&
      lowCostValues.includes(cost)
    );
  },

  isHighRisk(risk) {
    const level = this.normalizeText(
      risk.level ||
      risk.riskLevel ||
      risk.severity
    );

    return [
      "عال",
      "عالٍ",
      "عالية",
      "مرتفع",
      "مرتفعة",
      "high",
      "critical"
    ].includes(level);
  },

  checkLocalStorage() {
    try {
      const key = "__aiw_settings_test__";

      window.localStorage.setItem(key, "1");
      window.localStorage.removeItem(key);

      return true;
    } catch (error) {
      return false;
    }
  },

  formatDate(value) {
    if (
      !value ||
      value === "—" ||
      value === "تلقائي"
    ) {
      return value || "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    try {
      return new Intl.DateTimeFormat("ar-AE", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(date);
    } catch (error) {
      return date.toLocaleString();
    }
  },

  normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  },

  clampNumber(value, min, max) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return min;
    }

    return Math.min(
      max,
      Math.max(min, Math.round(number))
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

  escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  destroy() {
    window.clearTimeout(this._refreshTimer);

    if (typeof this._unsubscribe === "function") {
      try {
        this._unsubscribe();
      } catch (error) {
        console.warn(
          "[AIW Settings] Unsubscribe failed:",
          error
        );
      }
    }

    this._unsubscribe = null;
    this._container = null;
  }
};