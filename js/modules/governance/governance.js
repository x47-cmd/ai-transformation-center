/* =========================================================
   AI Work - Governance Center V2.2
   Enterprise Biometric Intelligence Governance

   Updates:
   - Central AIW.Store Integration
   - Persistent Governance Data
   - Automatic Cross-Page Synchronization
   - Dynamic Governance Score
   - Dynamic Risk and Policy Calculations
   - No UI Design Changes
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.governance = {
  id: "governance",
  title: "الحوكمة",
  icon: "🏛️",

  _container: null,
  _syncBound: false,
  _seedChecked: false,

  /* =======================================================
     Default Governance Center Data

     Stored under:
     AIW.Store → governanceCenter

     Important:
     AIW.Data.governance remains reserved for the shared
     Human-in-the-Loop controls used by Dashboard/Strategy.
  ======================================================= */

  defaultData: {
    principles: [
      {
        id: 1,
        icon: "🧑‍⚖️",
        title: "الإشراف البشري",
        desc: "أي تنبيه يتعلق بتسجيل بيومتري، صلاحية مستخدم، أو سلوك غير اعتيادي لا يتحول إلى إجراء نهائي بدون مراجعة بشرية.",
        owner: "فريق المراجعة والحوكمة",
        status: "active"
      },
      {
        id: 2,
        icon: "🔐",
        title: "الخصوصية وحماية البيانات",
        desc: "استخدام أقل قدر ممكن من البيانات، وتقييد الوصول إلى البيانات الحساسة وسجلات الاستخدام حسب الحاجة التشغيلية فقط.",
        owner: "فريق البيانات والخصوصية",
        status: "active"
      },
      {
        id: 3,
        icon: "📌",
        title: "الشفافية والتوثيق",
        desc: "توثيق سبب التنبيه، المؤشرات المستخدمة، نتيجة المراجعة، والإجراء المتخذ لكل حالة.",
        owner: "فريق المبادرة",
        status: "active"
      },
      {
        id: 4,
        icon: "⚖️",
        title: "تقليل الإنذارات الخاطئة",
        desc: "مراجعة دقة النماذج بشكل دوري حتى لا يتم تصنيف المستخدمين أو التسجيلات بشكل غير عادل.",
        owner: "لجنة الحوكمة",
        status: "active"
      },
      {
        id: 5,
        icon: "🛡️",
        title: "الأمن الرقمي",
        desc: "مراقبة استخدام الصلاحيات والحسابات الحساسة بطريقة ذكية مع الحفاظ على ضوابط الوصول والتدقيق.",
        owner: "الأمن الرقمي",
        status: "active"
      },
      {
        id: 6,
        icon: "📊",
        title: "المساءلة والقياس",
        desc: "ربط كل مشروع بمؤشرات أداء واضحة مثل جودة التسجيل، عدد التنبيهات، زمن المراجعة، ونسبة الانخفاض في الأخطاء.",
        owner: "مكتب البرنامج",
        status: "active"
      }
    ],

    committees: [
      {
        id: 1,
        name: "لجنة اعتماد محفظة الأنظمة البيومترية",
        role: "اعتماد الأولويات، المشاريع، مؤشرات الأداء، ومراجعة نتائج المحفظة بشكل دوري.",
        cadence: "ربع سنوي",
        authority: "اعتماد نهائي",
        status: "active"
      },
      {
        id: 2,
        name: "فريق عمليات الأنظمة البيومترية والبوابات الذكية",
        role: "متابعة جودة التسجيلات، أداء البوابات، الأخطاء التشغيلية، ومخرجات التحليل.",
        cadence: "أسبوعي",
        authority: "متابعة تنفيذية",
        status: "active"
      },
      {
        id: 3,
        name: "فريق البيانات والخصوصية",
        role: "مراجعة مصادر البيانات، حساسية السجلات، صلاحية استخدامها، وآلية إخفاء أو تقليل البيانات.",
        cadence: "حسب المشروع",
        authority: "مراجعة إلزامية",
        status: "active"
      },
      {
        id: 4,
        name: "فريق الأمن الرقمي والصلاحيات",
        role: "مراجعة تنبيهات السلوك غير الاعتيادي، استخدام الصلاحيات، والجلسات الطويلة أو المشبوهة.",
        cadence: "حسب التنبيه",
        authority: "موافقة أمنية",
        status: "active"
      },
      {
        id: 5,
        name: "فريق Power BI والتحليلات التنفيذية",
        role: "بناء المؤشرات واللوحات التنفيذية وربط المشاريع بالتقارير الدورية.",
        cadence: "شهري",
        authority: "تحليل وقياس",
        status: "active"
      }
    ],

    policies: [
      {
        id: 1,
        title: "سياسة استخدام بيانات الأنظمة البيومترية",
        desc: "تحدد حدود استخدام بيانات التسجيلات والجودة والسجلات التشغيلية في نماذج الذكاء الاصطناعي.",
        status: "مطلوبة"
      },
      {
        id: 2,
        title: "سياسة مراقبة استخدام الحسابات والصلاحيات",
        desc: "تحدد آلية تحليل السلوك، مدة الجلسات، استخدام الأجهزة، والصلاحيات الحساسة.",
        status: "مطلوبة"
      },
      {
        id: 3,
        title: "سياسة الإشراف البشري على التنبيهات",
        desc: "تؤكد أن الذكاء الاصطناعي يقدم تنبيهاً وتوصية ولا يتخذ إجراءً نهائياً على المستخدم أو السجل.",
        status: "مطلوبة"
      },
      {
        id: 4,
        title: "سياسة جودة البيانات البيومترية",
        desc: "تحدد معايير اكتمال البيانات، جودة التسجيل، التعارضات، والتكرار.",
        status: "مطلوبة"
      },
      {
        id: 5,
        title: "سياسة المراجعة الدورية للنماذج",
        desc: "تحدد مراجعة دقة النماذج، الإنذارات الخاطئة، ومؤشرات الأداء بشكل دوري.",
        status: "مخططة"
      }
    ],

    controls: [
      {
        id: 1,
        title: "تقييم الفكرة",
        timing: "قبل الاعتماد",
        review: "صلة الفكرة بالاختصاص، الأثر، الجاهزية، المخاطر، وقابلية القياس",
        status: "إلزامي"
      },
      {
        id: 2,
        title: "تقييم البيانات",
        timing: "قبل PoC",
        review: "مصادر البيانات، الجودة، الحساسية، الصلاحيات، وقابلية الربط",
        status: "إلزامي"
      },
      {
        id: 3,
        title: "تقييم الخصوصية",
        timing: "قبل الإطلاق",
        review: "تقليل البيانات، إخفاء البيانات غير اللازمة، وتحديد صلاحيات الوصول",
        status: "إلزامي"
      },
      {
        id: 4,
        title: "اختبار Sandbox",
        timing: "قبل التوسع",
        review: "تجربة النموذج على بيانات اختبار أو بيانات محدودة قبل التطبيق الأوسع",
        status: "إلزامي"
      },
      {
        id: 5,
        title: "مراجعة بشرية",
        timing: "مستمر",
        review: "كل حالة تخص تسجيل خاطئ، تعارض بيانات، أو استخدام غير اعتيادي للحساب",
        status: "إلزامي"
      },
      {
        id: 6,
        title: "قياس الأثر",
        timing: "شهري / ربع سنوي",
        review: "KPIs، جودة التسجيل، التنبيهات، زمن المراجعة، انخفاض الأخطاء",
        status: "إلزامي"
      }
    ],

    risks: [
      {
        id: 1,
        title: "جودة البيانات",
        level: "عالٍ",
        mitigation: "تطبيق قواعد جودة واضحة قبل تشغيل نماذج كشف الأخطاء والتعارضات.",
        owner: "فريق البيانات",
        status: "open"
      },
      {
        id: 2,
        title: "الخصوصية",
        level: "عالٍ",
        mitigation: "تقليل البيانات المعروضة في اللوحات وحصر الوصول حسب الحاجة.",
        owner: "الخصوصية",
        status: "open"
      },
      {
        id: 3,
        title: "الإنذارات الخاطئة",
        level: "متوسط",
        mitigation: "اعتماد مراجعة بشرية وتحديث عتبات التنبيه بناءً على النتائج.",
        owner: "لجنة الحوكمة",
        status: "open"
      },
      {
        id: 4,
        title: "إساءة تفسير التنبيهات",
        level: "متوسط",
        mitigation: "توضيح أن التنبيه مؤشر للمراجعة وليس إدانة أو قراراً نهائياً.",
        owner: "فريق المراجعة",
        status: "open"
      },
      {
        id: 5,
        title: "تكامل الأنظمة",
        level: "متوسط",
        mitigation: "البدء بلوحات قراءة وتحليل قبل أي تكامل تشغيلي مباشر.",
        owner: "تقنية المعلومات",
        status: "open"
      },
      {
        id: 6,
        title: "حوكمة الصلاحيات",
        level: "عالٍ",
        mitigation: "تحديد أدوار واضحة للمراجعة والاعتماد وتوثيق كل إجراء.",
        owner: "الأمن الرقمي",
        status: "open"
      }
    ],

    lifecycle: [
      {
        id: 1,
        number: "1",
        title: "Use Case Intake",
        desc: "استقبال الفكرة ضمن نطاق الأنظمة البيومترية أو البوابات الذكية أو الصلاحيات."
      },
      {
        id: 2,
        number: "2",
        title: "Initial Assessment",
        desc: "تقييم الأثر، الجاهزية، التكلفة، المخاطر، وقابلية القياس."
      },
      {
        id: 3,
        number: "3",
        title: "Data Review",
        desc: "مراجعة جودة البيانات وحساسيتها وقابلية استخدامها."
      },
      {
        id: 4,
        number: "4",
        title: "Sandbox / PoC",
        desc: "اختبار التحليل أو النموذج في بيئة محدودة وآمنة."
      },
      {
        id: 5,
        number: "5",
        title: "Governance Approval",
        desc: "اعتماد الخصوصية، الأمن، الإشراف البشري، ومؤشرات القياس."
      },
      {
        id: 6,
        number: "6",
        title: "Deployment",
        desc: "الإطلاق المرحلي وربط المشروع بلوحات Power BI والتنبيهات."
      },
      {
        id: 7,
        number: "7",
        title: "Monitoring",
        desc: "مراقبة الدقة، الإنذارات الخاطئة، الأثر، والتحسين المستمر."
      }
    ],

    roadmap: [
      {
        id: 1,
        year: "2026",
        title: "تأسيس الحوكمة",
        desc: "اعتماد السياسات، مصادر البيانات، وسجل المخاطر للمحفظة المتخصصة."
      },
      {
        id: 2,
        year: "2027",
        title: "حوكمة التجارب",
        desc: "ربط كل PoC بضوابط جودة بيانات ومراجعة بشرية ومؤشرات قياس."
      },
      {
        id: 3,
        year: "2028",
        title: "حوكمة التنبيهات",
        desc: "تفعيل آليات مراجعة تنبيهات التسجيلات والصلاحيات والبوابات."
      },
      {
        id: 4,
        year: "2029",
        title: "حوكمة المنصة التنفيذية",
        desc: "توحيد الحوكمة داخل لوحة تنفيذية وDecision Center."
      },
      {
        id: 5,
        year: "2030",
        title: "حوكمة مستدامة",
        desc: "تحسين مستمر، تدقيق، وقياس أثر شامل للمحفظة."
      }
    ],

    recommendations: [
      "اعتماد Human-in-the-Loop كشرط أساسي لكل تنبيه حساس.",
      "البدء بلوحات Power BI للقراءة والتحليل قبل أي تكامل تشغيلي مباشر.",
      "تحديد صلاحيات الوصول إلى لوحات المستخدمين والسجلات حسب الدور الوظيفي.",
      "تفعيل مراجعة دورية للإنذارات الخاطئة ودقة نماذج كشف الشذوذ.",
      "توثيق نتيجة كل مراجعة لتحسين النماذج ورفع جودة القرار."
    ],

    metrics: {
      manualScore: null
    },

    meta: {
      createdAt: null,
      updatedAt: null
    }
  },

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
        "AI Work Governance: Unable to read shared data.",
        error
      );

      return window.AIW?.Data || {};
    }
  },

  /* =======================================================
     Initial Data Migration
  ======================================================= */

  ensureDataSeeded() {
    if (this._seedChecked) return;

    this._seedChecked = true;

    const sharedData = this.getSharedData();

    const hasGovernanceCenter =
      sharedData.governanceCenter &&
      typeof sharedData.governanceCenter === "object" &&
      Array.isArray(sharedData.governanceCenter.principles);

    if (hasGovernanceCenter) {
      return;
    }

    const governanceCenter = this.clone(
      this.defaultData
    );

    const now = new Date().toISOString();

    governanceCenter.meta.createdAt = now;
    governanceCenter.meta.updatedAt = now;

    if (
      window.AIW?.Store &&
      typeof window.AIW.Store.update === "function"
    ) {
      window.AIW.Store.update(
        "governanceCenter",
        governanceCenter,
        {
          event: "aiw:governanceUpdated"
        }
      );

      return;
    }

    if (window.AIW?.Data) {
      window.AIW.Data.governanceCenter =
        governanceCenter;
    }
  },

  /* =======================================================
     Governance Data Reader
  ======================================================= */

  getData() {
    const sharedData = this.getSharedData();

    const governanceCenter =
      sharedData.governanceCenter &&
      typeof sharedData.governanceCenter === "object"
        ? sharedData.governanceCenter
        : this.defaultData;

    return this.normalizeGovernanceData(
      governanceCenter
    );
  },

  normalizeGovernanceData(source = {}) {
    return {
      principles: Array.isArray(source.principles)
        ? source.principles
        : [],

      committees: Array.isArray(source.committees)
        ? source.committees
        : [],

      policies: Array.isArray(source.policies)
        ? source.policies
        : [],

      controls: Array.isArray(source.controls)
        ? source.controls
        : [],

      risks: Array.isArray(source.risks)
        ? source.risks
        : [],

      lifecycle: Array.isArray(source.lifecycle)
        ? source.lifecycle
        : [],

      roadmap: Array.isArray(source.roadmap)
        ? source.roadmap
        : [],

      recommendations: Array.isArray(source.recommendations)
        ? source.recommendations
        : [],

      metrics:
        source.metrics &&
        typeof source.metrics === "object"
          ? source.metrics
          : {
              manualScore: null
            },

      meta:
        source.meta &&
        typeof source.meta === "object"
          ? source.meta
          : {
              createdAt: null,
              updatedAt: null
            }
    };
  },

  /* =======================================================
     Governance Calculations
  ======================================================= */

  getMetrics(data = this.getData()) {
    const requiredPolicies = data.policies.filter(
      (policy) =>
        this.isRequiredPolicy(policy.status)
    ).length;

    const approvedPolicies = data.policies.filter(
      (policy) =>
        this.isApprovedPolicy(policy.status)
    ).length;

    const activePrinciples = data.principles.filter(
      (principle) =>
        this.isActiveStatus(principle.status)
    ).length;

    const activeCommittees = data.committees.filter(
      (committee) =>
        this.isActiveStatus(committee.status)
    ).length;

    const mandatoryControls = data.controls.filter(
      (control) =>
        this.isMandatoryControl(control.status)
    ).length;

    const highRisks = data.risks.filter(
      (risk) =>
        this.isHighRisk(risk.level) &&
        !this.isClosedStatus(risk.status)
    ).length;

    const mediumRisks = data.risks.filter(
      (risk) =>
        this.isMediumRisk(risk.level) &&
        !this.isClosedStatus(risk.status)
    ).length;

    const policyCoverage = data.policies.length
      ? Math.round(
          (
            (approvedPolicies +
              requiredPolicies * 0.75) /
            data.policies.length
          ) * 100
        )
      : 0;

    const principleCoverage = data.principles.length
      ? Math.round(
          (activePrinciples /
            data.principles.length) *
            100
        )
      : 0;

    const committeeCoverage = data.committees.length
      ? Math.round(
          (activeCommittees /
            data.committees.length) *
            100
        )
      : 0;

    const controlCoverage = data.controls.length
      ? Math.round(
          (mandatoryControls /
            data.controls.length) *
            100
        )
      : 0;

    const riskPenalty = Math.min(
      35,
      highRisks * 7 + mediumRisks * 3
    );

    const calculatedScore = this.normalizePercent(
      Math.round(
        policyCoverage * 0.25 +
        principleCoverage * 0.25 +
        committeeCoverage * 0.2 +
        controlCoverage * 0.3 -
        riskPenalty * 0.25
      ),
      0
    );

    const analyticsScore =
      this.getAnalyticsGovernanceScore();

    const manualScore = this.toNullableNumber(
      data.metrics?.manualScore
    );

    const governanceScore =
      manualScore !== null
        ? this.normalizePercent(manualScore, 0)
        : analyticsScore !== null
          ? this.normalizePercent(
              analyticsScore,
              calculatedScore
            )
          : calculatedScore;

    return {
      requiredPolicies,
      approvedPolicies,
      activePrinciples,
      activeCommittees,
      mandatoryControls,
      highRisks,
      mediumRisks,
      policyCoverage,
      principleCoverage,
      committeeCoverage,
      controlCoverage,
      governanceScore
    };
  },

  getAnalyticsGovernanceScore() {
    try {
      if (
        window.AIW?.Analytics &&
        typeof window.AIW.Analytics.score === "function"
      ) {
        const result =
          window.AIW.Analytics.score();

        const score =
          result?.governanceScore;

        return Number.isFinite(Number(score))
          ? Number(score)
          : null;
      }
    } catch (error) {
      console.warn(
        "AI Work Governance: Analytics score unavailable.",
        error
      );
    }

    return null;
  },

  getRecommendations(data, metrics) {
    try {
      if (
        window.AIW?.Recommendation &&
        typeof window.AIW.Recommendation.governance ===
          "function"
      ) {
        const generated =
          window.AIW.Recommendation.governance(
            data,
            metrics
          );

        if (
          Array.isArray(generated) &&
          generated.length
        ) {
          return generated;
        }
      }
    } catch (error) {
      console.warn(
        "AI Work Governance: Recommendation engine failed.",
        error
      );
    }

    const recommendations = [];

    if (metrics.highRisks > 0) {
      recommendations.push(
        `مراجعة ${metrics.highRisks} مخاطر عالية وإسناد إجراءات التخفيف إلى المالكين المعنيين.`
      );
    }

    if (metrics.policyCoverage < 90) {
      recommendations.push(
        "استكمال السياسات المطلوبة وتحويل السياسات المخططة إلى وثائق معتمدة قبل التوسع."
      );
    }

    if (metrics.controlCoverage < 100) {
      recommendations.push(
        "استكمال ضوابط دورة حياة المشروع وربط كل مرحلة بنقطة اعتماد واضحة."
      );
    }

    if (recommendations.length < 3) {
      recommendations.push(
        "اعتماد Human-in-the-Loop كشرط أساسي لكل تنبيه حساس."
      );
    }

    if (recommendations.length < 4) {
      recommendations.push(
        "تفعيل مراجعة دورية للإنذارات الخاطئة ودقة نماذج كشف الشذوذ."
      );
    }

    if (recommendations.length < 5) {
      recommendations.push(
        "توثيق نتيجة كل مراجعة لتحسين النماذج ورفع جودة القرار."
      );
    }

    return recommendations.slice(0, 5);
  },

  /* =======================================================
     Governance Update Methods

     Ready for future forms and admin controls.
  ======================================================= */

  updateGovernanceCenter(changes = {}) {
    if (
      !changes ||
      typeof changes !== "object"
    ) {
      return false;
    }

    const current = this.getData();

    const updated = {
      ...current,
      ...changes,
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
        "governanceCenter",
        updated,
        {
          event: "aiw:governanceUpdated"
        }
      );
    }

    if (window.AIW?.Data) {
      window.AIW.Data.governanceCenter =
        updated;

      window.dispatchEvent(
        new CustomEvent(
          "aiw:governanceUpdated",
          {
            detail: {
              governanceCenter: updated
            }
          }
        )
      );

      return true;
    }

    return false;
  },

  addPrinciple(principle = {}) {
    return this.addCollectionItem(
      "principles",
      {
        icon: principle.icon || "🏛️",
        title:
          principle.title ||
          "مبدأ حوكمة جديد",
        desc:
          principle.desc ||
          principle.description ||
          "",
        owner:
          principle.owner ||
          "غير محدد",
        status:
          principle.status ||
          "active"
      }
    );
  },

  updatePrinciple(id, changes = {}) {
    return this.updateCollectionItem(
      "principles",
      id,
      changes
    );
  },

  removePrinciple(id) {
    return this.removeCollectionItem(
      "principles",
      id
    );
  },

  addCommittee(committee = {}) {
    return this.addCollectionItem(
      "committees",
      {
        name:
          committee.name ||
          "لجنة جديدة",
        role:
          committee.role ||
          "",
        cadence:
          committee.cadence ||
          "حسب الحاجة",
        authority:
          committee.authority ||
          "مراجعة",
        status:
          committee.status ||
          "active"
      }
    );
  },

  updateCommittee(id, changes = {}) {
    return this.updateCollectionItem(
      "committees",
      id,
      changes
    );
  },

  removeCommittee(id) {
    return this.removeCollectionItem(
      "committees",
      id
    );
  },

  addPolicy(policy = {}) {
    return this.addCollectionItem(
      "policies",
      {
        title:
          policy.title ||
          "سياسة جديدة",
        desc:
          policy.desc ||
          policy.description ||
          "",
        status:
          policy.status ||
          "مخططة"
      }
    );
  },

  updatePolicy(id, changes = {}) {
    return this.updateCollectionItem(
      "policies",
      id,
      changes
    );
  },

  removePolicy(id) {
    return this.removeCollectionItem(
      "policies",
      id
    );
  },

  addControl(control = {}) {
    return this.addCollectionItem(
      "controls",
      {
        title:
          control.title ||
          "ضابط جديد",
        timing:
          control.timing ||
          "غير محدد",
        review:
          control.review ||
          "",
        status:
          control.status ||
          "إلزامي"
      }
    );
  },

  updateControl(id, changes = {}) {
    return this.updateCollectionItem(
      "controls",
      id,
      changes
    );
  },

  removeControl(id) {
    return this.removeCollectionItem(
      "controls",
      id
    );
  },

  addRisk(risk = {}) {
    return this.addCollectionItem(
      "risks",
      {
        title:
          risk.title ||
          "مخاطرة جديدة",
        level:
          risk.level ||
          "متوسط",
        mitigation:
          risk.mitigation ||
          "",
        owner:
          risk.owner ||
          "غير محدد",
        status:
          risk.status ||
          "open"
      }
    );
  },

  updateRisk(id, changes = {}) {
    return this.updateCollectionItem(
      "risks",
      id,
      changes
    );
  },

  removeRisk(id) {
    return this.removeCollectionItem(
      "risks",
      id
    );
  },

  addCollectionItem(collectionName, item) {
    const data = this.getData();

    const collection = Array.isArray(
      data[collectionName]
    )
      ? [...data[collectionName]]
      : [];

    const now = new Date().toISOString();

    const newItem = {
      id: this.getNextId(collection),
      ...item,
      createdAt: now,
      updatedAt: now
    };

    collection.push(newItem);

    this.updateGovernanceCenter({
      [collectionName]: collection
    });

    return newItem;
  },

  updateCollectionItem(
    collectionName,
    id,
    changes = {}
  ) {
    const data = this.getData();

    const collection = Array.isArray(
      data[collectionName]
    )
      ? data[collectionName]
      : [];

    const itemIndex = collection.findIndex(
      (item) =>
        String(item?.id) === String(id)
    );

    if (itemIndex === -1) {
      return false;
    }

    const updatedCollection =
      collection.map((item, index) => {
        if (index !== itemIndex) {
          return item;
        }

        return {
          ...item,
          ...changes,
          id: item.id,
          updatedAt: new Date().toISOString()
        };
      });

    this.updateGovernanceCenter({
      [collectionName]: updatedCollection
    });

    return updatedCollection[itemIndex];
  },

  removeCollectionItem(
    collectionName,
    id
  ) {
    const data = this.getData();

    const collection = Array.isArray(
      data[collectionName]
    )
      ? data[collectionName]
      : [];

    const removedItem = collection.find(
      (item) =>
        String(item?.id) === String(id)
    );

    if (!removedItem) {
      return false;
    }

    const updatedCollection =
      collection.filter(
        (item) =>
          String(item?.id) !== String(id)
      );

    this.updateGovernanceCenter({
      [collectionName]: updatedCollection
    });

    return removedItem;
  },

  /* =======================================================
     Main Render
  ======================================================= */

  render(container) {
    if (!container) return;

    this._container = container;

    this.ensureDataSeeded();

    const W = window.AIW?.Widgets;

    const data = this.getData();
    const metrics = this.getMetrics(data);

    const recommendations =
      this.getRecommendations(
        data,
        metrics
      );

    container.innerHTML = `
      <section class="module-page">

        ${
          W?.hero
            ? W.hero({
                kicker:
                  "Responsible Biometric AI · Governance",

                title:
                  "مركز حوكمة الذكاء الاصطناعي",

                description:
                  "إطار تنفيذي لضمان أن مشاريع الذكاء الاصطناعي في الأنظمة البيومترية، البوابات الذكية، المستخدمين، والصلاحيات تُدار بمسؤولية، مع ضوابط للخصوصية، الأمن، الإشراف البشري، والمراجعة.",

                chips: [
                  "👁️ Biometric Governance",
                  "🧑‍⚖️ Human-in-the-Loop",
                  "🔐 Privacy by Design",
                  "🛡️ Access Risk Management"
                ]
              })
            : this.fallbackHero()
        }

        <div class="module-grid">
          ${this.kpi(
            "مؤشر الحوكمة",
            `${metrics.governanceScore}%`,
            "Governance Score"
          )}

          ${this.kpi(
            "مبادئ الحوكمة",
            data.principles.length,
            "Responsible AI"
          )}

          ${this.kpi(
            "اللجان والأدوار",
            data.committees.length,
            "Operating Model"
          )}

          ${this.kpi(
            "السياسات",
            data.policies.length,
            "AI Policies"
          )}

          ${this.kpi(
            "مخاطر عالية",
            metrics.highRisks,
            "High Risk"
          )}

          ${this.kpi(
            "مخاطر متوسطة",
            metrics.mediumRisks,
            "Medium Risk"
          )}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "الخلاصة التنفيذية",
              "قراءة سريعة لحالة الحوكمة المطلوبة قبل التوسع."
            )}

            <div class="governance-executive-card">
              <strong>
                الحوكمة هي شرط أساسي قبل مراقبة التسجيلات أو الصلاحيات بالذكاء الاصطناعي
              </strong>

              <p>
                لا يتم إطلاق أي نموذج يكشف أخطاء التسجيل أو السلوك غير الاعتيادي للمستخدمين
                بدون تقييم بيانات، خصوصية، أمن، إشراف بشري، ومؤشرات قياس واضحة.
              </p>

              <div class="aiw-progress">
                <div
                  style="width:${metrics.governanceScore}%"
                ></div>
              </div>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "قرار الحوكمة الأساسي",
              "قاعدة ثابتة لكل مشروع AI عالي الحساسية."
            )}

            <div class="governance-decision-card">
              <strong>
                الذكاء الاصطناعي ينبه ولا يحكم
              </strong>

              <p>
                أي حالة تخص تسجيل خاطئ، تعارض بيانات، استخدام صلاحية، أو سلوك غير اعتيادي
                يجب أن تُعرض كمؤشر للمراجعة البشرية، وليس كقرار نهائي تلقائي.
              </p>

              <button
                class="module-btn secondary"
                data-module="projects"
              >
                فتح محفظة المشاريع
              </button>
            </div>
          </div>
        </div>

        <div class="module-section-title">
          <h2>
            مبادئ الذكاء الاصطناعي المسؤول
          </h2>

          <p>
            المبادئ التي تحكم التصميم والتنفيذ والتشغيل.
          </p>
        </div>

        ${
          data.principles.length
            ? `
              <div class="governance-principles-grid">
                ${data.principles
                  .map(
                    (principle) => `
                      <article
                        class="governance-principle-card"
                        data-principle-id="${this.escapeAttribute(
                          principle?.id ?? ""
                        )}"
                      >
                        <div>
                          ${this.escapeHtml(
                            principle?.icon || "🏛️"
                          )}
                        </div>

                        <strong>
                          ${this.escapeHtml(
                            principle?.title || ""
                          )}
                        </strong>

                        <p>
                          ${this.escapeHtml(
                            principle?.desc ||
                            principle?.description ||
                            ""
                          )}
                        </p>

                        <small>
                          ${this.escapeHtml(
                            principle?.owner ||
                            "غير محدد"
                          )}
                        </small>
                      </article>
                    `
                  )
                  .join("")}
              </div>
            `
            : this.emptyState(
                "لا توجد مبادئ حوكمة مسجلة حالياً."
              )
        }

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "اللجان والأدوار",
              "هيكل إدارة المحفظة المتخصصة."
            )}

            ${
              data.committees.length
                ? `
                  <div class="governance-list">
                    ${data.committees
                      .map(
                        (committee, index) => `
                          <div
                            class="governance-list-item"
                            data-committee-id="${this.escapeAttribute(
                              committee?.id ?? ""
                            )}"
                          >
                            <b>
                              ${String(
                                index + 1
                              ).padStart(2, "0")}
                            </b>

                            <div>
                              <strong>
                                ${this.escapeHtml(
                                  committee?.name || ""
                                )}
                              </strong>

                              <span>
                                ${this.escapeHtml(
                                  committee?.role || ""
                                )}
                              </span>

                              <small>
                                ${this.escapeHtml(
                                  committee?.cadence ||
                                  "غير محدد"
                                )}
                                ·
                                ${this.escapeHtml(
                                  committee?.authority ||
                                  "غير محدد"
                                )}
                              </small>
                            </div>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                `
                : this.emptyState(
                    "لا توجد لجان أو أدوار مسجلة حالياً."
                  )
            }
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "سجل المخاطر",
              "أبرز المخاطر والضوابط المقترحة للتخفيف."
            )}

            ${
              data.risks.length
                ? `
                  <div class="risk-list">
                    ${data.risks
                      .map(
                        (risk) => `
                          <div
                            class="risk-card"
                            data-risk-id="${this.escapeAttribute(
                              risk?.id ?? ""
                            )}"
                          >
                            <div>
                              <strong>
                                ${this.escapeHtml(
                                  risk?.title || ""
                                )}
                              </strong>

                              <p>
                                ${this.escapeHtml(
                                  risk?.mitigation || ""
                                )}
                              </p>

                              <small>
                                المالك:
                                ${this.escapeHtml(
                                  risk?.owner ||
                                  "غير محدد"
                                )}
                              </small>
                            </div>

                            <span
                              class="aiw-status ${this.riskClass(
                                risk?.level
                              )}"
                            >
                              ${this.escapeHtml(
                                risk?.level ||
                                "غير محدد"
                              )}
                            </span>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                `
                : this.emptyState(
                    "لا توجد مخاطر مسجلة حالياً."
                  )
            }
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "السياسات المطلوبة",
            "وثائق وسياسات يجب اعتمادها قبل التوسع."
          )}

          ${
            data.policies.length
              ? `
                <div class="governance-policy-grid">
                  ${data.policies
                    .map(
                      (policy) => `
                        <article
                          class="governance-policy-card"
                          data-policy-id="${this.escapeAttribute(
                            policy?.id ?? ""
                          )}"
                        >
                          <span
                            class="aiw-status ${this.policyClass(
                              policy?.status
                            )}"
                          >
                            ${this.escapeHtml(
                              policy?.status ||
                              "غير محددة"
                            )}
                          </span>

                          <strong>
                            ${this.escapeHtml(
                              policy?.title || ""
                            )}
                          </strong>

                          <p>
                            ${this.escapeHtml(
                              policy?.desc ||
                              policy?.description ||
                              ""
                            )}
                          </p>
                        </article>
                      `
                    )
                    .join("")}
                </div>
              `
              : this.emptyState(
                  "لا توجد سياسات مسجلة حالياً."
                )
          }
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "ضوابط دورة حياة المشروع",
            "نقاط التحكم المطلوبة من الفكرة إلى التشغيل."
          )}

          ${
            data.controls.length
              ? `
                <div class="controls-table">
                  <div class="controls-row controls-head">
                    <strong>الضابط</strong>
                    <strong>التوقيت</strong>
                    <strong>ما يتم مراجعته</strong>
                    <strong>الحالة</strong>
                  </div>

                  ${data.controls
                    .map(
                      (control) => `
                        <div
                          class="controls-row controls-row-4"
                          data-control-id="${this.escapeAttribute(
                            control?.id ?? ""
                          )}"
                        >
                          <span>
                            ${this.escapeHtml(
                              control?.title || ""
                            )}
                          </span>

                          <span>
                            ${this.escapeHtml(
                              control?.timing || ""
                            )}
                          </span>

                          <span>
                            ${this.escapeHtml(
                              control?.review || ""
                            )}
                          </span>

                          <span>
                            ${this.escapeHtml(
                              control?.status || ""
                            )}
                          </span>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              `
              : this.emptyState(
                  "لا توجد ضوابط مسجلة حالياً."
                )
          }
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "دورة حياة حوكمة الذكاء الاصطناعي",
            "المراحل التي يمر بها كل مشروع AI قبل التشغيل."
          )}

          ${
            data.lifecycle.length
              ? `
                <div class="governance-lifecycle">
                  ${data.lifecycle
                    .map(
                      (step) => `
                        <div>
                          <b>
                            ${this.escapeHtml(
                              step?.number ||
                              step?.id ||
                              ""
                            )}
                          </b>

                          <strong>
                            ${this.escapeHtml(
                              step?.title || ""
                            )}
                          </strong>

                          <span>
                            ${this.escapeHtml(
                              step?.desc ||
                              step?.description ||
                              ""
                            )}
                          </span>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              `
              : this.emptyState(
                  "لا توجد مراحل حوكمة مسجلة حالياً."
                )
          }
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle(
              "خارطة حوكمة 2026–2030",
              "تطور الحوكمة من التأسيس إلى الاستدامة."
            )}

            ${
              data.roadmap.length
                ? `
                  <div class="governance-roadmap">
                    ${data.roadmap
                      .map(
                        (roadmapItem) => `
                          <div>
                            <b>
                              ${this.escapeHtml(
                                roadmapItem?.year || ""
                              )}
                            </b>

                            <strong>
                              ${this.escapeHtml(
                                roadmapItem?.title || ""
                              )}
                            </strong>

                            <span>
                              ${this.escapeHtml(
                                roadmapItem?.desc ||
                                roadmapItem?.description ||
                                ""
                              )}
                            </span>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                `
                : this.emptyState(
                    "لا توجد خارطة حوكمة مسجلة حالياً."
                  )
            }
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "توصيات الحوكمة",
              "توصيات تنفيذية للمحفظة المتخصصة."
            )}

            ${
              recommendations.length
                ? `
                  <div class="executive-list">
                    ${recommendations
                      .map(
                        (recommendation, index) => `
                          <div class="executive-item">
                            <strong>
                              ${String(
                                index + 1
                              ).padStart(2, "0")}
                            </strong>

                            <span>
                              ${this.escapeHtml(
                                typeof recommendation ===
                                  "string"
                                  ? recommendation
                                  : recommendation?.title ||
                                    recommendation?.description ||
                                    ""
                              )}
                            </span>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                `
                : this.emptyState(
                    "لا توجد توصيات حوكمة حالياً."
                  )
            }
          </div>
        </div>

      </section>
    `;

    this.bindAutomaticSync();
  },

  /* =======================================================
     Shared UI Components
  ======================================================= */

  kpi(label, value, note) {
    if (
      window.AIW?.Widgets &&
      typeof window.AIW.Widgets.kpi === "function"
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

  emptyState(message) {
    return `
      <div class="module-empty">
        ${this.escapeHtml(message)}
      </div>
    `;
  },

  riskClass(level) {
    if (this.isHighRisk(level)) {
      return "red";
    }

    if (this.isMediumRisk(level)) {
      return "orange";
    }

    return "green";
  },

  policyClass(status) {
    const normalizedStatus = String(
      status || ""
    )
      .trim()
      .toLowerCase();

    if (
      normalizedStatus === "معتمدة" ||
      normalizedStatus === "معتمد" ||
      normalizedStatus === "approved" ||
      normalizedStatus === "active"
    ) {
      return "green";
    }

    if (
      normalizedStatus === "مطلوبة" ||
      normalizedStatus === "required"
    ) {
      return "red";
    }

    return "orange";
  },

  fallbackHero() {
    return `
      <div class="module-hero">
        <span class="module-kicker">
          Responsible Biometric AI · Governance
        </span>

        <h1>
          مركز حوكمة الذكاء الاصطناعي
        </h1>

        <p>
          إطار تنفيذي لضمان أن مشاريع الذكاء الاصطناعي في الأنظمة البيومترية والصلاحيات تُدار بمسؤولية.
        </p>
      </div>
    `;
  },

  /* =======================================================
     Automatic Synchronization
  ======================================================= */

  bindAutomaticSync() {
    if (this._syncBound) return;

    this._syncBound = true;

    const refreshGovernance = () => {
      if (
        !this._container ||
        !this._container.isConnected
      ) {
        return;
      }

      this.render(this._container);
    };

    const syncEvents = [
      "aiw:dataChanged",
      "aiw:dataUpdated",
      "aiw:dataImported",
      "aiw:dataRestored",
      "aiw:dataReset",
      "aiw:storeChanged",

      "aiw:governanceChanged",
      "aiw:governanceUpdated",

      "aiw:risksChanged",
      "aiw:risksUpdated",

      "aiw:policiesChanged",
      "aiw:policiesUpdated",

      "aiw:controlsChanged",
      "aiw:controlsUpdated"
    ];

    syncEvents.forEach((eventName) => {
      window.addEventListener(
        eventName,
        refreshGovernance
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
          refreshGovernance();
        }
      }
    );
  },

  /* =======================================================
     Classification Helpers
  ======================================================= */

  isHighRisk(level) {
    const value = String(
      level || ""
    )
      .trim()
      .toLowerCase();

    return (
      value.includes("عال") ||
      value === "high" ||
      value === "critical" ||
      value === "حرج"
    );
  },

  isMediumRisk(level) {
    const value = String(
      level || ""
    )
      .trim()
      .toLowerCase();

    return (
      value.includes("متوسط") ||
      value === "medium"
    );
  },

  isClosedStatus(status) {
    const value = String(
      status || ""
    )
      .trim()
      .toLowerCase();

    return (
      value === "closed" ||
      value === "resolved" ||
      value === "مغلق" ||
      value === "تم الحل"
    );
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

    return !(
      value === "inactive" ||
      value === "disabled" ||
      value === "archived" ||
      value === "غير مفعل" ||
      value === "موقوف"
    );
  },

  isRequiredPolicy(status) {
    const value = String(
      status || ""
    )
      .trim()
      .toLowerCase();

    return (
      value === "مطلوبة" ||
      value === "required"
    );
  },

  isApprovedPolicy(status) {
    const value = String(
      status || ""
    )
      .trim()
      .toLowerCase();

    return (
      value === "معتمدة" ||
      value === "معتمد" ||
      value === "approved" ||
      value === "active"
    );
  },

  isMandatoryControl(status) {
    const value = String(
      status || ""
    )
      .trim()
      .toLowerCase();

    return (
      value === "إلزامي" ||
      value === "mandatory" ||
      value === "required"
    );
  },

  /* =======================================================
     Utilities
  ======================================================= */

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

  toNullableNumber(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : null;
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
      typeof structuredClone === "function"
    ) {
      try {
        return structuredClone(value);
      } catch (error) {
        // JSON fallback below.
      }
    }

    return JSON.parse(
      JSON.stringify(value)
    );
  }
};