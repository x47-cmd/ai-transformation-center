/* =========================================================
   AI Work - KPI Center V2.2
   Enterprise Biometric Intelligence KPI Engine

   Updates:
   - Central AIW.Store Integration
   - Persistent KPI Data
   - Automatic Cross-Page Synchronization
   - Fixed Inverse KPI Progress Calculation
   - Dynamic Executive Metrics
   - No UI Design Changes
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.kpis = {
  id: "kpis",
  title: "المؤشرات",
  icon: "📈",

  _container: null,
  _syncBound: false,
  _seedChecked: false,

  /* =======================================================
     Default KPI Data

     direction:
     - "higher" = القيمة الأعلى أفضل
     - "lower"  = القيمة الأقل أفضل
  ======================================================= */

  defaultKpis: [
    {
      id: 1,
      icon: "👁️",
      title: "جودة التسجيلات البيومترية",
      desc: "نسبة التسجيلات المكتملة والسليمة مقابل التسجيلات التي تحتاج مراجعة.",
      target: 98,
      current: 84,
      baseline: 72,
      unit: "%",
      owner: "فريق الأنظمة البيومترية",
      frequency: "شهري",
      direction: "higher",
      status: "active"
    },
    {
      id: 2,
      icon: "⚠️",
      title: "التسجيلات التي تحتاج مراجعة",
      desc: "عدد الحالات التي اكتشفها النظام كمحتملة الخطأ أو التعارض.",
      target: 20,
      current: 65,
      baseline: 90,
      unit: "حالة",
      owner: "فريق المراجعة",
      frequency: "أسبوعي",
      direction: "lower",
      status: "active"
    },
    {
      id: 3,
      icon: "🧬",
      title: "السجلات المتعارضة أو المتكررة",
      desc: "عدد السجلات التي تحتوي على تشابه أو تعارض يستدعي المراجعة.",
      target: 10,
      current: 38,
      baseline: 55,
      unit: "سجل",
      owner: "فريق جودة البيانات",
      frequency: "شهري",
      direction: "lower",
      status: "active"
    },
    {
      id: 4,
      icon: "🔐",
      title: "تنبيهات استخدام الصلاحيات",
      desc: "عدد التنبيهات الناتجة عن استخدام غير اعتيادي للحسابات أو الصلاحيات.",
      target: 15,
      current: 42,
      baseline: 60,
      unit: "تنبيه",
      owner: "الأمن الرقمي",
      frequency: "أسبوعي",
      direction: "lower",
      status: "active"
    },
    {
      id: 5,
      icon: "⏱️",
      title: "الجلسات الطويلة غير الطبيعية",
      desc: "عدد جلسات الاستخدام التي تجاوزت النمط المعتاد للمستخدم أو الموقع.",
      target: 10,
      current: 31,
      baseline: 48,
      unit: "جلسة",
      owner: "فريق الصلاحيات",
      frequency: "أسبوعي",
      direction: "lower",
      status: "active"
    },
    {
      id: 6,
      icon: "🛂",
      title: "جاهزية البوابات الذكية",
      desc: "نسبة توفر البوابات الذكية وجاهزيتها التشغيلية.",
      target: 99,
      current: 91,
      baseline: 82,
      unit: "%",
      owner: "فريق البوابات الذكية",
      frequency: "يومي",
      direction: "higher",
      status: "active"
    },
    {
      id: 7,
      icon: "📊",
      title: "زمن عبور المسافر",
      desc: "متوسط زمن إكمال العملية عبر البوابة الذكية.",
      target: 15,
      current: 24,
      baseline: 32,
      unit: "ثانية",
      owner: "فريق العمليات",
      frequency: "يومي",
      direction: "lower",
      status: "active"
    },
    {
      id: 8,
      icon: "🛡️",
      title: "الامتثال للحوكمة",
      desc: "نسبة التنبيهات والمشاريع الحساسة التي مرت بمراجعة بشرية موثقة.",
      target: 100,
      current: 72,
      baseline: 55,
      unit: "%",
      owner: "فريق الحوكمة",
      frequency: "شهري",
      direction: "higher",
      status: "active"
    }
  ],

  /* =======================================================
     Shared Data Reader
  ======================================================= */

  getSharedData() {
    try {
      if (
        window.AIW?.Store &&
        typeof window.AIW.Store.getState === "function"
      ) {
        return window.AIW.Store.getState() || {};
      }

      if (
        window.AIW?.Store &&
        typeof window.AIW.Store.getData === "function"
      ) {
        return window.AIW.Store.getData() || {};
      }

      return window.AIW?.Data || {};
    } catch (error) {
      console.warn(
        "AI Work KPI: Unable to read shared data.",
        error
      );

      return window.AIW?.Data || {};
    }
  },

  /* =======================================================
     Initial KPI Migration
  ======================================================= */

  ensureKpisSeeded() {
    if (this._seedChecked) return;

    this._seedChecked = true;

    const sharedData = this.getSharedData();

    const hasKpiCenter =
      sharedData.kpiCenter &&
      typeof sharedData.kpiCenter === "object" &&
      Array.isArray(sharedData.kpiCenter.items);

    if (hasKpiCenter) {
      return;
    }

    const now = new Date().toISOString();

    const kpiCenter = {
      items: this.clone(this.defaultKpis),

      settings: {
        reviewCycle: "شهري",
        onTrackThreshold: 60,
        advancedThreshold: 75,
        attentionThreshold: 40
      },

      meta: {
        createdAt: now,
        updatedAt: now
      }
    };

    if (
      window.AIW?.Store &&
      typeof window.AIW.Store.update === "function"
    ) {
      window.AIW.Store.update(
        "kpiCenter",
        kpiCenter,
        {
          event: "aiw:kpisUpdated"
        }
      );

      return;
    }

    if (window.AIW?.Data) {
      window.AIW.Data.kpiCenter = kpiCenter;
    }
  },

  /* =======================================================
     KPI Data Reader
  ======================================================= */

  getKpiCenter() {
    const sharedData = this.getSharedData();

    const source =
      sharedData.kpiCenter &&
      typeof sharedData.kpiCenter === "object"
        ? sharedData.kpiCenter
        : {};

    return {
      items: Array.isArray(source.items)
        ? source.items
            .map((item, index) =>
              this.normalizeKpi(item, index)
            )
            .filter(Boolean)
        : this.clone(this.defaultKpis),

      settings: {
        reviewCycle:
          source.settings?.reviewCycle ||
          "شهري",

        onTrackThreshold:
          this.toSafeNumber(
            source.settings?.onTrackThreshold,
            60
          ),

        advancedThreshold:
          this.toSafeNumber(
            source.settings?.advancedThreshold,
            75
          ),

        attentionThreshold:
          this.toSafeNumber(
            source.settings?.attentionThreshold,
            40
          )
      },

      meta: {
        createdAt:
          source.meta?.createdAt || null,

        updatedAt:
          source.meta?.updatedAt || null
      }
    };
  },

  getKpis() {
    return this.getKpiCenter().items;
  },

  normalizeKpi(kpi, index = 0) {
    if (
      !kpi ||
      typeof kpi !== "object"
    ) {
      return null;
    }

    return {
      ...kpi,

      id:
        kpi.id ??
        index + 1,

      icon:
        kpi.icon ||
        "📈",

      title:
        kpi.title ||
        kpi.name ||
        "مؤشر غير مسمى",

      desc:
        kpi.desc ||
        kpi.description ||
        "",

      target:
        this.toSafeNumber(
          kpi.target,
          0
        ),

      current:
        this.toSafeNumber(
          kpi.current,
          0
        ),

      baseline:
        this.toSafeNumber(
          kpi.baseline,
          kpi.current || 0
        ),

      unit:
        kpi.unit ||
        "",

      owner:
        kpi.owner ||
        "غير محدد",

      frequency:
        kpi.frequency ||
        "شهري",

      direction:
        kpi.direction === "lower"
          ? "lower"
          : "higher",

      status:
        kpi.status ||
        "active"
    };
  },

  /* =======================================================
     KPI Store Updates
  ======================================================= */

  updateKpiCenter(changes = {}) {
    if (
      !changes ||
      typeof changes !== "object"
    ) {
      return false;
    }

    const current = this.getKpiCenter();

    const updated = {
      ...current,
      ...changes,

      settings: {
        ...current.settings,
        ...(changes.settings || {})
      },

      meta: {
        ...current.meta,
        updatedAt: new Date().toISOString()
      }
    };

    if (
      window.AIW?.Store &&
      typeof window.AIW.Store.update === "function"
    ) {
      return window.AIW.Store.update(
        "kpiCenter",
        updated,
        {
          event: "aiw:kpisUpdated"
        }
      );
    }

    if (window.AIW?.Data) {
      window.AIW.Data.kpiCenter = updated;

      window.dispatchEvent(
        new CustomEvent(
          "aiw:kpisUpdated",
          {
            detail: {
              kpiCenter: updated
            }
          }
        )
      );

      return true;
    }

    return false;
  },

  addKpi(kpi = {}) {
    const center = this.getKpiCenter();
    const items = [...center.items];

    const now = new Date().toISOString();

    const newKpi = this.normalizeKpi(
      {
        id: this.getNextId(items),
        icon: kpi.icon || "📈",
        title: kpi.title || "مؤشر جديد",
        desc:
          kpi.desc ||
          kpi.description ||
          "",
        target: kpi.target ?? 100,
        current: kpi.current ?? 0,
        baseline:
          kpi.baseline ??
          kpi.current ??
          0,
        unit: kpi.unit || "%",
        owner: kpi.owner || "غير محدد",
        frequency:
          kpi.frequency ||
          "شهري",
        direction:
          kpi.direction === "lower"
            ? "lower"
            : "higher",
        status:
          kpi.status ||
          "active",
        createdAt: now,
        updatedAt: now
      },
      items.length
    );

    items.push(newKpi);

    this.updateKpiCenter({
      items
    });

    return newKpi;
  },

  updateKpi(id, changes = {}) {
    const center = this.getKpiCenter();

    const itemIndex =
      center.items.findIndex(
        (item) =>
          String(item.id) === String(id)
      );

    if (itemIndex === -1) {
      return false;
    }

    const items =
      center.items.map((item, index) => {
        if (index !== itemIndex) {
          return item;
        }

        return this.normalizeKpi(
          {
            ...item,
            ...changes,
            id: item.id,
            updatedAt:
              new Date().toISOString()
          },
          index
        );
      });

    this.updateKpiCenter({
      items
    });

    return items[itemIndex];
  },

  removeKpi(id) {
    const center = this.getKpiCenter();

    const removedKpi =
      center.items.find(
        (item) =>
          String(item.id) === String(id)
      );

    if (!removedKpi) {
      return false;
    }

    const items =
      center.items.filter(
        (item) =>
          String(item.id) !== String(id)
      );

    this.updateKpiCenter({
      items
    });

    return removedKpi;
  },

  updateKpiValue(id, current) {
    return this.updateKpi(id, {
      current:
        this.toSafeNumber(
          current,
          0
        )
    });
  },

  updateKpiTarget(id, target) {
    return this.updateKpi(id, {
      target:
        this.toSafeNumber(
          target,
          0
        )
    });
  },

  /* =======================================================
     KPI Calculations
  ======================================================= */

  progress(kpiOrCurrent, target, direction = "higher") {
    let currentValue;
    let targetValue;
    let baselineValue;
    let progressDirection;

    if (
      kpiOrCurrent &&
      typeof kpiOrCurrent === "object"
    ) {
      currentValue =
        this.toSafeNumber(
          kpiOrCurrent.current,
          0
        );

      targetValue =
        this.toSafeNumber(
          kpiOrCurrent.target,
          0
        );

      baselineValue =
        this.toSafeNumber(
          kpiOrCurrent.baseline,
          currentValue
        );

      progressDirection =
        kpiOrCurrent.direction === "lower"
          ? "lower"
          : "higher";
    } else {
      currentValue =
        this.toSafeNumber(
          kpiOrCurrent,
          0
        );

      targetValue =
        this.toSafeNumber(
          target,
          0
        );

      baselineValue = currentValue;

      progressDirection =
        direction === "lower"
          ? "lower"
          : "higher";
    }

    if (progressDirection === "lower") {
      if (targetValue <= 0) {
        return currentValue <= 0
          ? 100
          : 0;
      }

      if (currentValue <= targetValue) {
        return 100;
      }

      if (
        baselineValue > targetValue &&
        baselineValue !== currentValue
      ) {
        const achievedReduction =
          baselineValue - currentValue;

        const requiredReduction =
          baselineValue - targetValue;

        return this.normalizePercent(
          (
            achievedReduction /
            requiredReduction
          ) * 100,
          0
        );
      }

      return this.normalizePercent(
        (
          targetValue /
          Math.max(currentValue, 1)
        ) * 100,
        0
      );
    }

    if (targetValue <= 0) {
      return 0;
    }

    return this.normalizePercent(
      (
        currentValue /
        targetValue
      ) * 100,
      0
    );
  },

  getMetrics(kpis, settings) {
    const progressValues =
      kpis.map((kpi) =>
        this.progress(kpi)
      );

    const avgProgress =
      this.average(progressValues);

    const onTrack =
      progressValues.filter(
        (score) =>
          score >=
          settings.onTrackThreshold
      ).length;

    const advanced =
      progressValues.filter(
        (score) =>
          score >=
          settings.advancedThreshold
      ).length;

    const building =
      progressValues.filter(
        (score) =>
          score >=
            settings.attentionThreshold &&
          score <
            settings.onTrackThreshold
      ).length;

    const behind =
      progressValues.filter(
        (score) =>
          score <
          settings.attentionThreshold
      ).length;

    return {
      avgProgress,
      onTrack,
      advanced,
      building,
      behind,
      progressValues
    };
  },

  getExecutiveScore(avgProgress) {
    try {
      if (
        window.AIW?.Analytics &&
        typeof window.AIW.Analytics.score ===
          "function"
      ) {
        const scores =
          window.AIW.Analytics.score();

        const executiveScore =
          Number(scores?.executiveScore);

        if (
          Number.isFinite(
            executiveScore
          )
        ) {
          return this.normalizePercent(
            executiveScore,
            avgProgress
          );
        }
      }
    } catch (error) {
      console.warn(
        "AI Work KPI: Executive score unavailable.",
        error
      );
    }

    return avgProgress;
  },

  getAiReport() {
    try {
      if (
        window.AIW?.AI &&
        typeof window.AIW.AI
          .generateExecutiveReport ===
          "function"
      ) {
        const report =
          window.AIW.AI
            .generateExecutiveReport();

        if (
          report &&
          typeof report === "object"
        ) {
          return report;
        }
      }
    } catch (error) {
      console.warn(
        "AI Work KPI: AI report unavailable.",
        error
      );
    }

    return {
      status: "مرحلة بناء المؤشرات",
      message:
        "المرحلة التالية يجب أن تركز على ربط جودة التسجيلات، استخدام الصلاحيات، وأداء البوابات بلوحات قياس تنفيذية."
    };
  },

  getRecommendations() {
    try {
      if (
        window.AIW?.Recommendation &&
        typeof window.AIW.Recommendation
          .nextActions === "function"
      ) {
        const recommendations =
          window.AIW.Recommendation
            .nextActions();

        if (
          Array.isArray(
            recommendations
          ) &&
          recommendations.length
        ) {
          return recommendations;
        }
      }
    } catch (error) {
      console.warn(
        "AI Work KPI: Recommendation engine unavailable.",
        error
      );
    }

    return [
      "البدء بقياس جودة التسجيلات البيومترية كخط أساس قبل تشغيل نماذج الكشف المتقدمة.",
      "إطلاق لوحة Power BI للتسجيلات التي تحتاج مراجعة والسجلات المتعارضة.",
      "تحديد عتبة واضحة للجلسات الطويلة غير الطبيعية حسب طبيعة كل موقع ومستخدم.",
      "ربط تنبيهات استخدام الصلاحيات بإجراء مراجعة بشرية موثق.",
      "مراجعة مؤشرات جاهزية البوابات وزمن العبور بشكل يومي لتحسين التشغيل."
    ];
  },

  /* =======================================================
     Main Render
  ======================================================= */

  render(container) {
    if (!container) return;

    this._container = container;

    this.ensureKpisSeeded();

    const W = window.AIW?.Widgets;

    const center =
      this.getKpiCenter();

    const kpis =
      center.items.filter(
        (kpi) =>
          this.isActiveStatus(
            kpi.status
          )
      );

    const metrics =
      this.getMetrics(
        kpis,
        center.settings
      );

    const executiveScore =
      this.getExecutiveScore(
        metrics.avgProgress
      );

    const recommendations =
      this.getRecommendations();

    const aiReport =
      this.getAiReport();

    container.innerHTML = `
      <section class="module-page">

        ${
          W?.hero
            ? W.hero({
                kicker:
                  "Biometric KPI Engine · Performance",

                title:
                  "مركز مؤشرات الأداء",

                description:
                  "محرك قياس تنفيذي يربط مشاريع الأنظمة البيومترية والبوابات الذكية بالمخرجات الفعلية: جودة التسجيلات، أخطاء البيانات، استخدام الصلاحيات، جاهزية البوابات، زمن العبور، والحوكمة.",

                chips: [
                  "👁️ Biometric KPIs",
                  `🎯 ${kpis.length} مؤشرات رئيسية`,
                  `📊 ${metrics.avgProgress}% متوسط التقدم`,
                  `🧠 Executive Score ${executiveScore}%`
                ]
              })
            : this.fallbackHero()
        }

        <div class="module-grid">
          ${this.kpi(
            "عدد المؤشرات",
            kpis.length,
            "Core KPIs"
          )}

          ${this.kpi(
            "على المسار",
            metrics.onTrack,
            "On Track"
          )}

          ${this.kpi(
            "متأخرة",
            metrics.behind,
            "Needs Attention"
          )}

          ${this.kpi(
            "متوسط التقدم",
            `${metrics.avgProgress}%`,
            "Average Progress"
          )}

          ${this.kpi(
            "Executive Score",
            `${executiveScore}%`,
            "Overall"
          )}

          ${this.kpi(
            "دورة القياس",
            center.settings.reviewCycle,
            "Review Cycle"
          )}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "الخلاصة التنفيذية للمؤشرات",
              "قراءة سريعة لأداء محفظة الأنظمة البيومترية والبوابات الذكية."
            )}

            <div class="kpi-ultimate-summary">
              <strong>
                القياس هو الأساس لتحويل التحديات التشغيلية إلى قرارات ذكية
              </strong>

              <p>
                كل فكرة ذكاء اصطناعي في نطاق الأنظمة البيومترية يجب أن ترتبط بمؤشر واضح:
                جودة تسجيل، انخفاض أخطاء، تنبيهات صلاحيات، جاهزية بوابات، زمن عبور، أو امتثال حوكمي.
              </p>

              <div class="kpi-summary-strip">
                <div>
                  <span>Progress</span>
                  <b>${metrics.avgProgress}%</b>
                </div>

                <div>
                  <span>On Track</span>
                  <b>${metrics.onTrack}</b>
                </div>

                <div>
                  <span>Behind</span>
                  <b>${metrics.behind}</b>
                </div>

                <div>
                  <span>Score</span>
                  <b>${executiveScore}%</b>
                </div>
              </div>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "AI KPI Insight",
              "توصية ذكية مرتبطة بمحرك AI."
            )}

            <div class="kpi-ai-card">
              <strong>
                ${this.escapeHtml(
                  aiReport.status ||
                  "مرحلة البناء"
                )}
              </strong>

              <p>
                ${this.escapeHtml(
                  aiReport.message ||
                  "المرحلة التالية يجب أن تركز على تحويل المشاريع إلى KPIs قابلة للقياس."
                )}
              </p>

              <button
                class="module-btn secondary"
                data-module="reports"
              >
                فتح التقارير
              </button>
            </div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "KPI Progress Chart",
              "مقارنة التقدم الحالي مقابل المستهدف."
            )}

            <div class="kpi-chart-card">
              <canvas id="kpiProgressChart"></canvas>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "KPI Health",
              "توزيع حالة المؤشرات."
            )}

            <div class="kpi-chart-card">
              <canvas id="kpiHealthChart"></canvas>
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "مؤشرات الأداء الرئيسية",
            "المؤشرات التي تربط الاستراتيجية بالأثر القابل للقياس."
          )}

          ${
            kpis.length
              ? `
                <div class="kpi-list">
                  ${kpis
                    .map((kpi) =>
                      this.renderKpi(kpi)
                    )
                    .join("")}
                </div>
              `
              : this.emptyState(
                  "لا توجد مؤشرات أداء مسجلة حالياً."
                )
          }
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "KPI Governance Model",
            "كيف يتم اعتماد وقياس كل مؤشر؟"
          )}

          <div class="kpi-governance-grid">
            <div>
              <b>1</b>
              <strong>Baseline</strong>
              <span>
                تحديد خط الأساس الحالي للتسجيلات، الصلاحيات، والبوابات.
              </span>
            </div>

            <div>
              <b>2</b>
              <strong>Target</strong>
              <span>
                تحديد المستهدف والمالك ودورة القياس لكل مؤشر.
              </span>
            </div>

            <div>
              <b>3</b>
              <strong>Measure</strong>
              <span>
                قياس الأثر بعد لوحة التحليل أو PoC أو الإطلاق المرحلي.
              </span>
            </div>

            <div>
              <b>4</b>
              <strong>Review</strong>
              <span>
                مراجعة شهرية أو ربع سنوية للنتائج والتنبيهات.
              </span>
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "Decision Rules",
            "قواعد اتخاذ القرار بناءً على المؤشرات."
          )}

          <div class="kpi-impact-grid">
            <div>
              <strong>
                متى نعتبر المشروع ناجح؟
              </strong>

              <p>
                عندما يثبت انخفاضاً واضحاً في الأخطاء أو تحسناً في الجودة أو الجاهزية مقارنة بخط الأساس.
              </p>
            </div>

            <div>
              <strong>
                متى نوقف المشروع؟
              </strong>

              <p>
                إذا زادت الإنذارات الخاطئة، أو ظهرت مخاطر خصوصية، أو لم تثبت البيانات قيمة تشغيلية واضحة.
              </p>
            </div>

            <div>
              <strong>
                متى نتوسع؟
              </strong>

              <p>
                بعد تحقق المؤشرات، توثيق المراجعة البشرية، واعتماد الحوكمة والأمن الرقمي.
              </p>
            </div>
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "Executive Recommendations",
              "خطوات رفع أداء المؤشرات."
            )}

            <div class="executive-list">
              ${recommendations
                .map(
                  (item, index) => `
                    <div class="executive-item">
                      <strong>
                        ${String(
                          index + 1
                        ).padStart(2, "0")}
                      </strong>

                      <span>
                        ${this.escapeHtml(
                          typeof item === "string"
                            ? item
                            : item?.title ||
                              item?.description ||
                              ""
                        )}
                      </span>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "KPI Ownership",
              "توزيع ملكية المؤشرات."
            )}

            <div class="kpi-owner-list">
              ${kpis
                .map(
                  (kpi) => `
                    <div>
                      <strong>
                        ${this.escapeHtml(
                          kpi.title
                        )}
                      </strong>

                      <span>
                        ${this.escapeHtml(
                          kpi.owner
                        )}
                      </span>

                      <small>
                        ${this.escapeHtml(
                          kpi.frequency
                        )}
                      </small>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>
        </div>

      </section>
    `;

    this.renderCharts(
      kpis,
      metrics
    );

    this.bindAutomaticSync();
  },

  /* =======================================================
     KPI Card
  ======================================================= */

  renderKpi(kpi) {
    const progress =
      this.progress(kpi);

    return `
      <article
        class="kpi-card"
        data-kpi-id="${this.escapeAttribute(
          kpi.id
        )}"
      >
        <div class="kpi-card-head">
          <div class="kpi-icon">
            ${this.escapeHtml(
              kpi.icon
            )}
          </div>

          <span
            class="aiw-status ${this.statusClass(
              progress
            )}"
          >
            ${this.status(progress)}
          </span>
        </div>

        <h3>
          ${this.escapeHtml(
            kpi.title
          )}
        </h3>

        <p>
          ${this.escapeHtml(
            kpi.desc
          )}
        </p>

        <div class="kpi-values">
          <div>
            <span>الحالي</span>

            <strong>
              ${this.formatValue(
                kpi.current,
                kpi.unit
              )}
            </strong>
          </div>

          <div>
            <span>المستهدف</span>

            <strong>
              ${this.formatValue(
                kpi.target,
                kpi.unit
              )}
            </strong>
          </div>
        </div>

        <div class="kpi-meta-row">
          <span>
            المالك:
            ${this.escapeHtml(
              kpi.owner
            )}
          </span>

          <span>
            ${this.escapeHtml(
              kpi.frequency
            )}
          </span>
        </div>

        <div class="aiw-progress">
          <div
            style="width:${progress}%"
          ></div>
        </div>

        <small>
          ${progress}% من المستهدف
        </small>
      </article>
    `;
  },

  /* =======================================================
     Charts
  ======================================================= */

  renderCharts(kpis, metrics) {
    if (!window.AIW?.Charts) return;

    setTimeout(() => {
      const labels =
        kpis.map((kpi) =>
          kpi.title
        );

      const progressValues =
        kpis.map((kpi) =>
          this.progress(kpi)
        );

      if (
        window.AIW?.Charts &&
        typeof window.AIW.Charts.bar ===
          "function"
      ) {
        window.AIW.Charts.bar(
          "kpiProgressChart",
          labels,
          progressValues,
          "KPI Progress"
        );
      }

      if (
        window.AIW?.Charts &&
        typeof window.AIW.Charts.doughnut ===
          "function"
      ) {
        window.AIW.Charts.doughnut(
          "kpiHealthChart",

          [
            "على المسار",
            "قيد البناء",
            "متأخرة"
          ],

          [
            metrics.onTrack,
            metrics.building,
            metrics.behind
          ],

          "KPI Health"
        );
      }
    }, 50);
  },

  /* =======================================================
     Status Helpers
  ======================================================= */

  status(score) {
    if (score >= 75) {
      return "متقدم";
    }

    if (score >= 60) {
      return "على المسار";
    }

    if (score >= 40) {
      return "قيد البناء";
    }

    return "متأخر";
  },

  statusClass(score) {
    if (score >= 75) {
      return "green";
    }

    if (score >= 40) {
      return "orange";
    }

    return "red";
  },

  isActiveStatus(status) {
    if (
      status === undefined ||
      status === null ||
      status === ""
    ) {
      return true;
    }

    const value = String(status)
      .trim()
      .toLowerCase();

    return ![
      "inactive",
      "disabled",
      "archived",
      "موقوف",
      "غير مفعل"
    ].includes(value);
  },

  /* =======================================================
     Shared UI Components
  ======================================================= */

  kpi(label, value, note) {
    if (
      window.AIW?.Widgets &&
      typeof window.AIW.Widgets.kpi ===
        "function"
    ) {
      return window.AIW.Widgets.kpi({
        label,
        value,
        note
      });
    }

    return `
      <div class="module-card">
        <span>
          ${this.escapeHtml(label)}
        </span>

        <strong>
          ${this.escapeHtml(value)}
        </strong>

        <small>
          ${this.escapeHtml(note)}
        </small>
      </div>
    `;
  },

  sectionTitle(title, desc) {
    if (
      window.AIW?.Widgets &&
      typeof window.AIW.Widgets.sectionTitle ===
        "function"
    ) {
      return window.AIW.Widgets.sectionTitle(
        title,
        desc
      );
    }

    return `
      <div class="module-section-title compact">
        <h2>
          ${this.escapeHtml(title)}
        </h2>

        <p>
          ${this.escapeHtml(desc)}
        </p>
      </div>
    `;
  },

  fallbackHero() {
    return `
      <div class="module-hero">
        <span class="module-kicker">
          Biometric KPI Engine · Performance
        </span>

        <h1>
          مركز مؤشرات الأداء
        </h1>

        <p>
          محرك قياس تنفيذي يربط الأنظمة البيومترية والبوابات الذكية بالأثر القابل للقياس.
        </p>
      </div>
    `;
  },

  emptyState(message) {
    return `
      <div class="module-empty">
        ${this.escapeHtml(message)}
      </div>
    `;
  },

  /* =======================================================
     Automatic Synchronization
  ======================================================= */

  bindAutomaticSync() {
    if (this._syncBound) return;

    this._syncBound = true;

    const refreshKpis = () => {
      if (
        !this._container ||
        !this._container.isConnected
      ) {
        return;
      }

      this.render(
        this._container
      );
    };

    const syncEvents = [
      "aiw:dataChanged",
      "aiw:dataUpdated",
      "aiw:dataImported",
      "aiw:dataRestored",
      "aiw:dataReset",
      "aiw:storeChanged",

      "aiw:kpisChanged",
      "aiw:kpisUpdated",

      "aiw:projectsChanged",
      "aiw:projectsUpdated",

      "aiw:governanceChanged",
      "aiw:governanceUpdated",

      "aiw:operationsChanged",
      "aiw:operationsUpdated"
    ];

    syncEvents.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          refreshKpis
        );
      }
    );

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
          supportedKeys.includes(
            event.key
          )
        ) {
          refreshKpis();
        }
      }
    );
  },

  /* =======================================================
     Utilities
  ======================================================= */

  formatValue(value, unit) {
    const safeValue =
      this.toSafeNumber(
        value,
        0
      );

    return `${safeValue} ${unit || ""}`.trim();
  },

  average(values) {
    if (
      !Array.isArray(values) ||
      !values.length
    ) {
      return 0;
    }

    return Math.round(
      values.reduce(
        (total, value) =>
          total +
          this.toSafeNumber(
            value,
            0
          ),
        0
      ) / values.length
    );
  },

  getNextId(items = []) {
    if (!Array.isArray(items)) {
      return 1;
    }

    const ids = items
      .map((item) =>
        this.toSafeNumber(
          item?.id,
          0
        )
      )
      .filter((id) => id > 0);

    return ids.length
      ? Math.max(...ids) + 1
      : 1;
  },

  toSafeNumber(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;
  },

  normalizePercent(value, fallback = 0) {
    return Math.min(
      100,
      Math.max(
        0,
        Math.round(
          this.toSafeNumber(
            value,
            fallback
          )
        )
      )
    );
  },

  escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  escapeAttribute(value) {
    return this.escapeHtml(value);
  },

  clone(value) {
    if (
      typeof structuredClone ===
      "function"
    ) {
      try {
        return structuredClone(value);
      } catch (error) {
        // Use JSON fallback.
      }
    }

    return JSON.parse(
      JSON.stringify(value)
    );
  }
};