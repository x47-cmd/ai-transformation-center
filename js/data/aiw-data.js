/* =========================================================
   AI Work - Enterprise Seed Data V5.1
   Enterprise Biometric Intelligence Platform
   Store V2.2 Native Architecture

   File Path:
   js/data/aiw-data.js

   Purpose:
   - Restore and preserve the 32 biometric AI opportunities
   - Merge missing seed ideas without overwriting user changes
   - Keep the real projects portfolio empty at first launch
   - Never create fictional projects
   - Preserve real converted and manually created projects
   - Remove legacy fictional projects once
   - Enrich legacy ideas with the V5 lifecycle model
   - Retry safely if AIW.Store is not ready yet
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};

  const DATA_VERSION = "5.1.0";
  const MIGRATION_KEY = "enterpriseSeedV51";
  const LEGACY_MIGRATION_KEY = "enterpriseSeedV5";
  const MAX_STORE_RETRIES = 20;
  const STORE_RETRY_DELAY = 100;

  let retryCount = 0;

  const now = () => new Date().toISOString();

  const clone = value => {
    try {
      if (typeof structuredClone === "function") {
        return structuredClone(value);
      }
    } catch (error) {
      console.warn("[AIW.Data] structuredClone failed.", error);
    }

    return JSON.parse(JSON.stringify(value));
  };

  const normalizeText = value =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  /* =======================================================
     Static Platform Reference Data
  ======================================================= */

  const departments = [
    {
      id: "biometric",
      name: "الأنظمة البيومترية",
      count: 8,
      maturity: 62
    },
    {
      id: "smartgates",
      name: "البوابات الذكية",
      count: 6,
      maturity: 58
    },
    {
      id: "users",
      name: "المستخدمون والصلاحيات",
      count: 8,
      maturity: 55
    },
    {
      id: "security",
      name: "الأمن الرقمي",
      count: 5,
      maturity: 70
    },
    {
      id: "analytics",
      name: "التحليلات والتقارير التنفيذية",
      count: 5,
      maturity: 52
    }
  ];

  const roadmap = [
    {
      id: "roadmap-1",
      phase: "المرحلة الأولى — حصر البيانات",
      year: "2026 Q1–Q2",
      progress: 20,
      activities:
        "حصر مصادر بيانات التسجيلات، سجلات الدخول، الصلاحيات، الأجهزة، وأخطاء الأنظمة البيومترية"
    },
    {
      id: "roadmap-2",
      phase: "المرحلة الثانية — بناء لوحات التحليل",
      year: "2026 Q3–Q4",
      progress: 35,
      activities:
        "إنشاء لوحات Power BI لمراقبة التسجيلات، الأخطاء، المستخدمين، والصلاحيات"
    },
    {
      id: "roadmap-3",
      phase: "المرحلة الثالثة — نماذج الذكاء الاصطناعي",
      year: "2027",
      progress: 50,
      activities:
        "تطبيق نماذج كشف الشذوذ، جودة البيانات، وتحليل سلوك المستخدمين"
    },
    {
      id: "roadmap-4",
      phase: "المرحلة الرابعة — الأتمتة والتنبيهات",
      year: "2028",
      progress: 65,
      activities:
        "تفعيل التنبيهات الذكية، إنشاء البلاغات تلقائياً، وربطها بإجراءات المراجعة"
    },
    {
      id: "roadmap-5",
      phase: "المرحلة الخامسة — المنصة التنفيذية",
      year: "2029",
      progress: 82,
      activities:
        "تطوير لوحة تنفيذية موحدة لقياس الأداء والمخاطر والتوصيات"
    },
    {
      id: "roadmap-6",
      phase: "المرحلة السادسة — النضج والاستدامة",
      year: "2030",
      progress: 100,
      activities:
        "تحسين مستمر، حوكمة النماذج، قياس العائد، وتوسيع الاستخدام حسب الحاجة"
    }
  ];

  const projectHorizons = [
    {
      id: "quick-wins",
      title: "مشاريع سريعة",
      type: "Quick Wins",
      examples:
        "لوحة أخطاء التسجيل، تحليل مدة الجلسات، مراقبة المستخدمين الأكثر نشاطاً، وتقرير جودة البيانات"
    },
    {
      id: "medium-term",
      title: "مشاريع متوسطة المدى",
      type: "Medium Term",
      examples:
        "الاستمارة الذكية لصرف الصلاحيات، مساعد تحليل الإدراجات الخاطئة، كشف السجلات المتعارضة، وتحليل سلوك المستخدمين"
    },
    {
      id: "strategic",
      title: "مشاريع استراتيجية",
      type: "Strategic",
      examples:
        "محرك سلامة البيانات البيومترية، كشف إساءة استخدام الحسابات، لوحة القيادة التنفيذية، والصيانة التنبؤية للبوابات"
    }
  ];

  /* =======================================================
     32 Biometric AI Opportunities
  ======================================================= */

  const rawIdeas = [
    ["الأنظمة البيومترية","Biometric Data Integrity Engine","عالية","متوسطة","6-9 أشهر","متوسطة","وجود احتمال لتسجيل بيانات بيومترية لشخص على ملف غير صحيح أو وجود تعارض بين البيانات.","تطوير محرك ذكاء اصطناعي يراجع سلامة البيانات البيومترية ويكشف التعارضات والحالات التي تحتاج مراجعة.","كشف الشذوذ، مقارنة الأنماط، تحليل جودة البيانات، وإعطاء درجة ثقة لكل سجل.","تقليل التسجيلات الخاطئة، رفع جودة البيانات، وتسريع اكتشاف الحالات التي تحتاج مراجعة."],
    ["الأنظمة البيومترية","Biometric Registration Quality Monitor","عالية","سهلة","3-5 أشهر","منخفضة","بعض عمليات التسجيل قد تكون بجودة منخفضة أو ناقصة مما يؤثر لاحقاً على المطابقة.","لوحة ذكية تراقب جودة التسجيلات الجديدة حسب الجهاز، الموقع، المستخدم، ونوع العملية.","تحليل مؤشرات الجودة وتحديد التسجيلات الضعيفة أو غير المكتملة.","رفع جودة التسجيل من البداية وتقليل الحاجة للتصحيح اليدوي لاحقاً."],
    ["الأنظمة البيومترية","Duplicate Identity Detection Engine","عالية","متوسطة","6-8 أشهر","متوسطة","احتمالية وجود أكثر من سجل لنفس الشخص أو وجود بيانات متشابهة بين عدة ملفات.","نظام يكشف السجلات المتشابهة ويقترح الحالات التي تحتاج مراجعة بشرية.","تحليل التشابه، كشف الأنماط، وربط المؤشرات بين السجلات.","تقليل التكرار، تحسين دقة قواعد البيانات، وتعزيز موثوقية المنظومة."],
    ["الأنظمة البيومترية","Biometric Capture Quality AI","متوسطة","سهلة","3-4 أشهر","منخفضة","تفاوت جودة التقاط بصمة العين أو الصورة بسبب الإضاءة أو الجهاز أو طريقة الاستخدام.","تحليل جودة الالتقاط وإظهار الأجهزة أو المواقع التي تنتج جودة أقل من المتوسط.","تصنيف جودة العينة وتحليل أسباب انخفاض الجودة.","تحسين جودة الالتقاط وتقليل حالات الفشل في المطابقة."],
    ["الأنظمة البيومترية","Registration Error Root Cause Analyzer","عالية","متوسطة","5-7 أشهر","متوسطة","صعوبة معرفة السبب الحقيقي وراء أخطاء التسجيل أو تكرار نفس الأخطاء.","محرك يحلل الأخطاء حسب المستخدم، الجهاز، الموقع، الوقت، ونوع العملية.","تحليل الأسباب الجذرية وربط الأحداث المتكررة بأنماط تشغيلية.","معالجة أسباب الأخطاء بدلاً من معالجة النتائج فقط."],
    ["الأنظمة البيومترية","Biometric Data Completeness Monitor","متوسطة","سهلة","2-3 أشهر","منخفضة","وجود سجلات ناقصة أو غير مكتملة يؤثر على جودة العمليات اللاحقة.","لوحة تراقب اكتمال الحقول الأساسية وتحدد السجلات الناقصة.","تحليل قواعد جودة البيانات وإصدار تنبيهات عند نقص البيانات.","رفع اكتمال البيانات وتحسين جاهزية السجلات."],
    ["الأنظمة البيومترية","Biometric Conflict Detection","عالية","متوسطة","5-6 أشهر","متوسطة","وجود تعارض بين بيانات الهوية والبيانات البيومترية أو اختلافات تحتاج تحقق.","نظام يكشف التعارضات ويرفعها كحالات مراجعة.","مقارنة ذكية بين السجلات، الحقول، ومؤشرات المطابقة.","تقليل المخاطر التشغيلية ورفع ثقة البيانات."],
    ["الأنظمة البيومترية","Biometric Error Case Intelligence Assistant","عالية","متوسطة","4-6 أشهر","متوسطة","يعتمد الموظفون على التحليل اليدوي للإدراجات البيومترية الخاطئة وتحديد سبب الخطأ وطريقة تصحيحه.","مساعد ذكي يحلل الحالة ويعرض الحالات السابقة المشابهة ويقترح التصحيح لاعتماده من الموظف المختص.","تصنيف نوع الخطأ، استرجاع الحالات المشابهة، اقتراح التصحيح، وقياس درجة الثقة.","تقليل زمن دراسة الحالات، توحيد قرارات التصحيح، ورفع جودة التسجيلات مع اعتماد بشري."],

    ["البوابات الذكية","Smart Gate Performance Intelligence","عالية","متوسطة","6-8 أشهر","متوسطة","الحاجة لمراقبة أداء البوابات الذكية ومعرفة التباطؤ أو الأعطال قبل تأثيرها على التشغيل.","لوحة ذكية تقيس أداء كل بوابة حسب عدد العمليات، زمن العبور، الأخطاء، ونسبة النجاح.","تحليل الأداء، كشف الانخفاض غير الطبيعي، والتنبؤ بالمشاكل التشغيلية.","رفع جاهزية البوابات وتحسين تجربة المسافرين."],
    ["البوابات الذكية","Smart Gate Predictive Maintenance","عالية","صعبة","8-10 أشهر","عالية","الأعطال قد تظهر بشكل مفاجئ وتؤثر على انسيابية حركة المسافرين.","نظام يتنبأ باحتمالية تعطل البوابة بناءً على مؤشرات الأداء والأخطاء السابقة.","نماذج تنبؤية وتحليل أنماط الأعطال.","تقليل التوقف المفاجئ وتحسين التخطيط للصيانة."],
    ["البوابات الذكية","Passenger Processing Time Analytics","متوسطة","سهلة","3-4 أشهر","منخفضة","عدم وضوح متوسط زمن عبور المسافر حسب البوابة أو الفترة أو نوع العملية.","تحليل زمن المعالجة وإظهار نقاط البطء.","تحليل السلاسل الزمنية واكتشاف الفترات غير الطبيعية.","تحسين سرعة العبور ورفع كفاءة التشغيل."],
    ["البوابات الذكية","Smart Gate Error Pattern Detection","عالية","متوسطة","5-6 أشهر","متوسطة","تكرار أخطاء معينة في بوابات أو أجهزة محددة دون تحليل عميق.","تحليل أنماط الأخطاء وربطها بالجهاز أو الموقع أو الفترة.","كشف الأنماط المتكررة وتحديد مصادر الخلل المحتملة.","تقليل الأخطاء المتكررة وتحسين الاستجابة الفنية."],
    ["البوابات الذكية","Airport Gate Utilization Optimizer","متوسطة","متوسطة","5-7 أشهر","متوسطة","تفاوت استخدام البوابات بين مواقع أو أوقات مختلفة.","تحليل الاستخدام واقتراح إعادة توزيع أو تحسين تشغيل البوابات.","تحليل كثافة الاستخدام والتوصية بالتوزيع الأمثل.","رفع الاستفادة من الموارد وتقليل الازدحام."],
    ["البوابات الذكية","Smart Gate Availability Dashboard","عالية","سهلة","3-4 أشهر","منخفضة","الحاجة لعرض مباشر لحالة البوابات الجاهزة والمتوقفة والمتأثرة بالأخطاء.","لوحة تعرض الجاهزية، الأعطال، ونسبة التوفر لكل بوابة.","تحليل مباشر للبيانات التشغيلية وإصدار مؤشرات جاهزية.","تحسين سرعة اتخاذ القرار التشغيلي."],

    ["المستخدمون والصلاحيات","Credential Misuse Detection Engine","عالية","متوسطة","6-8 أشهر","متوسطة","احتمالية استخدام حساب موظف من قبل أكثر من شخص أو استخدام الصلاحية بطريقة غير متوافقة مع السياسات.","محرك يراقب نمط استخدام الحسابات ويكشف السلوكيات غير الاعتيادية.","تحليل سلوك المستخدم، مدة الجلسات، الأجهزة، الأوقات، ونوع العمليات.","تعزيز الحوكمة وتقليل إساءة استخدام الحسابات."],
    ["المستخدمون والصلاحيات","User Behaviour Intelligence Platform","عالية","متوسطة","6-9 أشهر","متوسطة","الاعتماد على السجلات فقط لا يكفي لفهم السلوك التشغيلي للمستخدمين.","منصة تحلل سلوك المستخدمين وتبني نمطاً اعتيادياً لكل مستخدم.","كشف الشذوذ السلوكي ومقارنة الاستخدام الحالي بالتاريخ السابق.","تحسين الرقابة الذكية دون تعطيل العمل اليومي."],
    ["المستخدمون والصلاحيات","Privilege Usage Analytics","عالية","سهلة","3-5 أشهر","منخفضة","وجود صلاحيات مستخدمة بشكل زائد أو غير مستخدمة أو أعلى من الحاجة التشغيلية.","تحليل استخدام الصلاحيات وربطها بالعمليات الفعلية.","تحليل أنماط استخدام الصلاحيات الحساسة وإصدار مؤشرات مخاطر.","تحسين إدارة الصلاحيات وتقليل المخاطر."],
    ["المستخدمون والصلاحيات","Long Session Anomaly Detection","عالية","سهلة","3-4 أشهر","منخفضة","استخدام الحساب لفترات طويلة جداً قد يشير إلى استخدام غير طبيعي أو مشاركة حساب.","نظام يراقب مدة الجلسات ويكشف الجلسات غير المعتادة مقارنة بنمط المستخدم.","تحليل مدة الجلسة ووقت الدخول وعدد العمليات.","اكتشاف مبكر للحالات التي تحتاج مراجعة."],
    ["المستخدمون والصلاحيات","Multi-Device Account Usage Monitor","متوسطة","متوسطة","4-6 أشهر","متوسطة","استخدام الحساب على أجهزة أو مواقع متعددة بطريقة غير معتادة.","تحليل الأجهزة والمواقع المرتبطة بكل حساب وإصدار تنبيهات عند وجود نمط غير طبيعي.","ربط بيانات الأجهزة والمواقع وسجلات الدخول.","تعزيز الرقابة وتقليل مخاطر مشاركة الصلاحيات."],
    ["المستخدمون والصلاحيات","Sensitive Action Monitoring AI","عالية","متوسطة","5-6 أشهر","متوسطة","بعض العمليات الحساسة تحتاج مراقبة أعلى وتحليل سياقي.","تصنيف العمليات الحساسة ومراقبة تكرارها وسياق تنفيذها.","تحليل نوع العملية والمستخدم والوقت والموقع.","تعزيز الأمن والامتثال دون إيقاف العمليات."],
    ["المستخدمون والصلاحيات","Inactive Permission Risk Analyzer","متوسطة","سهلة","2-3 أشهر","منخفضة","وجود صلاحيات ممنوحة وغير مستخدمة لفترات طويلة قد يزيد المخاطر.","لوحة تكشف الصلاحيات غير المستخدمة وتقترح مراجعتها.","تحليل آخر استخدام وتكرار الاستخدام لكل صلاحية.","تقليل الصلاحيات غير الضرورية وتحسين الحوكمة."],
    ["المستخدمون والصلاحيات","Smart Permission Provisioning Assistant","عالية","متوسطة","3-5 أشهر","متوسطة","يعتمد صرف الصلاحيات على إدخال بيانات الموظف يدوياً ومراجعة الطلب وتحديد الصلاحيات المناسبة.","استمارة ذكية تجلب بيانات الموظف وتتحقق من الطلب وتقترح الصلاحيات المناسبة للقبول أو الرفض.","تعبئة الاستمارة، مقارنة الطلب بالسياسات، كشف تعارض الصلاحيات، وإظهار درجة الثقة.","تقليل الإدخال اليدوي وتسريع الصرف وتعزيز مبدأ أقل صلاحية مع اعتماد الموظف."],

    ["الأمن الرقمي","Access Log Anomaly Detection","عالية","متوسطة","5-7 أشهر","متوسطة","صعوبة مراجعة كميات كبيرة من سجلات الدخول والاستخدام يدوياً.","نظام يكتشف الأنماط غير الطبيعية في سجلات الدخول والعمليات.","كشف الشذوذ وربط الأحداث المتكررة بمستوى خطورة.","تحسين سرعة اكتشاف المخاطر التشغيلية والأمنية."],
    ["الأمن الرقمي","AI Security Alert Prioritization","عالية","سهلة","3-4 أشهر","منخفضة","كثرة التنبيهات قد تؤدي إلى تأخر مراجعة الحالات الأهم.","تصنيف التنبيهات حسب الخطورة والأولوية والتأثير المحتمل.","تحليل السياق وتقييم مستوى المخاطر لكل تنبيه.","تسريع الاستجابة وتقليل الضوضاء التشغيلية."],
    ["الأمن الرقمي","Biometric System Risk Score","عالية","متوسطة","5-6 أشهر","متوسطة","عدم وجود درجة مخاطر موحدة للأنظمة أو المواقع أو الأجهزة.","تطوير مؤشر مخاطر ذكي لكل نظام أو موقع بناءً على الأخطاء والاستخدام والتنبيهات.","دمج عدة مؤشرات في Risk Score واحد قابل للمتابعة.","تمكين الإدارة من معرفة نقاط الخطر بسرعة."],
    ["الأمن الرقمي","Unauthorized Pattern Detection","عالية","متوسطة","6-8 أشهر","متوسطة","قد تظهر أنماط استخدام لا تخالف قاعدة واضحة لكنها غير طبيعية.","كشف الأنماط غير المصرح بها أو غير المتوقعة في العمليات اليومية.","تحليل السلوك والتسلسل الزمني وتكرار العمليات.","رفع مستوى الرقابة الذكية وتقليل المخاطر."],
    ["الأمن الرقمي","Audit Evidence Intelligence","متوسطة","سهلة","3-5 أشهر","منخفضة","تجميع أدلة المراجعة والتدقيق يتطلب وقتاً وجهداً.","توليد ملخص ذكي للحالة يشمل المستخدم والوقت والعملية والسبب المحتمل والتوصية.","تلخيص السجلات وتحويلها إلى تقرير قابل للمراجعة.","تسهيل أعمال التدقيق والحوكمة."],

    ["التحليلات والتقارير التنفيذية","Executive Biometric Intelligence Dashboard","عالية","متوسطة","5-7 أشهر","متوسطة","الحاجة إلى لوحة تنفيذية موحدة تعرض حالة التسجيلات والبوابات والمستخدمين والمخاطر.","لوحة Power BI تنفيذية تربط جميع المؤشرات في شاشة واحدة.","تحليل البيانات وتوليد توصيات تنفيذية ذكية.","تحسين اتخاذ القرار ورفع وضوح الصورة التشغيلية."],
    ["التحليلات والتقارير التنفيذية","Airport Biometric Operations Dashboard","عالية","سهلة","3-4 أشهر","منخفضة","صعوبة مقارنة أداء المطارات أو المواقع من حيث التسجيلات والأخطاء والاستخدام.","لوحة تقارن الأداء حسب المطار والجهاز والمستخدم ونوع العملية.","تحليل الاتجاهات واكتشاف الفروقات غير الطبيعية.","رفع كفاءة المتابعة وتحسين توزيع الجهود."],
    ["التحليلات والتقارير التنفيذية","Registration Error Intelligence Dashboard","عالية","سهلة","3-4 أشهر","منخفضة","عدم وجود رؤية واضحة لأكثر أخطاء التسجيل تكراراً ومصادرها.","لوحة تعرض أخطاء التسجيل حسب النوع والموقع والجهاز والفترة.","تصنيف الأخطاء وتحليل تكرارها واتجاهاتها.","تقليل الأخطاء عبر قرارات مبنية على البيانات."],
    ["التحليلات والتقارير التنفيذية","AI Recommendation Center","متوسطة","متوسطة","5-6 أشهر","متوسطة","اللوحات تعرض أرقاماً لكنها لا تقدم دائماً توصيات عملية.","مركز توصيات يقترح إجراءات مثل مراجعة مستخدم أو فحص جهاز أو تحسين إجراء.","تحليل المؤشرات وتحويلها إلى توصيات قابلة للتنفيذ.","تسريع القرار وتحويل البيانات إلى إجراءات."],
    ["التحليلات والتقارير التنفيذية","Automated Executive Reporting","متوسطة","سهلة","3-4 أشهر","منخفضة","إعداد التقارير التنفيذية يستهلك وقتاً ويتكرر بشكل دوري.","توليد تقرير أسبوعي أو شهري تلقائي عن جودة التسجيلات والصلاحيات والبوابات والمخاطر.","تلخيص البيانات وتحويلها إلى تقرير تنفيذي واضح.","توفير الوقت وتوحيد أسلوب التقارير."]
  ];

  function createSeedIdea(item, index) {
    const createdAt = now();
    const riskLevel = item[2] === "عالية" ? "medium" : "low";

    return {
      id: `idea-${index + 1}`,
      department: item[0],
      title: item[1],
      titleEn: item[1],
      priority: item[2],
      ease: item[3],
      duration: item[4],
      cost: item[5],
      challenge: item[6],
      solution: item[7],
      aiRole: item[8],
      benefits: item[9],

      status: "draft",
      ideaStatus: "draft",
      lifecycleStatus: "draft",

      readiness: 0,
      decisionScore: 0,
      riskLevel,

      quickWin:
        item[3] === "سهلة" &&
        item[5] === "منخفضة",

      approval: {
        required: true,
        status: "not-submitted",
        submittedAt: null,
        submittedBy: null,
        decidedAt: null,
        decidedBy: null,
        decision: null,
        note: ""
      },

      conversion: {
        converted: false,
        projectId: null,
        convertedAt: null,
        convertedBy: null,
        revertedAt: null,
        revertedBy: null
      },

      projectBlueprint: {
        title: item[1],
        titleEn: item[1],
        description: item[7],
        objective: item[6],
        category: "biometric-ai",
        department: item[0],
        owner: null,
        sponsor: null,
        priority: item[2],
        cost: item[5],
        duration: item[4],
        readiness: 0,
        decisionScore: 0,
        riskLevel,
        benefits: [item[9]],
        expectedOutcomes: [],
        kpis: [],
        risks: [],
        dependencies: [],
        milestones: [],
        tasks: [],
        budget: {
          estimated: null,
          approved: null,
          spent: 0,
          currency: "AED"
        },
        schedule: {
          plannedStart: null,
          plannedEnd: null,
          actualStart: null,
          actualEnd: null
        }
      },

      lifecycleHistory: [],
      createdAt,
      updatedAt: createdAt,
      deletedAt: null
    };
  }

  const seedIdeas = rawIdeas.map(createSeedIdea);

  const governance = [
    "الإشراف البشري إلزامي على أي حالة تتعلق بالأشخاص أو الصلاحيات أو التسجيلات الحساسة",
    "لا يتم صرف أي صلاحية مقترحة بواسطة النظام إلا بعد قبول الموظف المسؤول عن الاعتماد",
    "لا يتم تعديل أي تسجيل بيومتري خاطئ تلقائياً قبل مراجعة واعتماد الموظف المختص",
    "الذكاء الاصطناعي يقدم مؤشرات وتنبيهات وتوصيات ولا يتخذ قراراً نهائياً بتعديل البيانات",
    "توثيق جميع التنبيهات والتوصيات وقرارات القبول والرفض لأغراض التدقيق والتحسين المستمر",
    "تطبيق مبدأ أقل صلاحية ممكنة عند اقتراح أو مراجعة صلاحيات الموظفين",
    "مراجعة دورية للنماذج والمؤشرات لضمان العدالة والدقة وتقليل الإنذارات الخاطئة"
  ];

  const risks = [
    {
      id: "risk-data-quality",
      title: "جودة البيانات",
      level: "عالٍ",
      status: "open",
      mitigation:
        "تطبيق قواعد جودة بيانات واضحة قبل تشغيل نماذج الذكاء الاصطناعي"
    },
    {
      id: "risk-privacy",
      title: "الخصوصية",
      level: "عالٍ",
      status: "open",
      mitigation:
        "استخدام مؤشرات تشغيلية ومخرجات مراجعة دون عرض بيانات شخصية غير لازمة"
    },
    {
      id: "risk-false-alerts",
      title: "الإنذارات الخاطئة",
      level: "متوسط",
      status: "open",
      mitigation:
        "اعتماد مراجعة بشرية وتدرج في مستويات التنبيه"
    },
    {
      id: "risk-integration",
      title: "التكامل مع الأنظمة",
      level: "متوسط",
      status: "open",
      mitigation:
        "البدء بلوحات قراءة وتحليل قبل أي تكامل تشغيلي عميق"
    },
    {
      id: "risk-permissions",
      title: "حوكمة الصلاحيات",
      level: "عالٍ",
      status: "open",
      mitigation:
        "تحديد أدوار واضحة للمراجعة والاعتماد وتوثيق جميع قرارات صرف الصلاحيات"
    },
    {
      id: "risk-record-update",
      title: "التعديل غير الصحيح للسجلات",
      level: "عالٍ",
      status: "open",
      mitigation:
        "منع التعديل التلقائي النهائي وإلزام اعتماد الموظف المختص مع حفظ سجل التدقيق"
    }
  ];

  const recommendations = [
    "اعتماد Enterprise Biometric Intelligence Platform كأول محفظة متخصصة ضمن مبادرة أفكار الذكاء الاصطناعي",
    "البدء بمشاريع Quick Wins مثل لوحة أخطاء التسجيل ومراقبة مدة الجلسات وتحليل استخدام الصلاحيات",
    "تنفيذ نموذج أولي للاستمارة الذكية لصرف الصلاحيات وربطها ببيانات الموظفين والسياسات المعتمدة",
    "تطوير قاعدة معرفة للحالات البيومترية الخاطئة والحلول السابقة قبل تشغيل مساعد تحليل الحالات",
    "بناء Power BI Dashboard موحد للتسجيلات والبوابات والمستخدمين والصلاحيات والتنبيهات",
    "تطبيق Human-in-the-Loop في جميع الحالات الحساسة قبل صرف الصلاحيات أو تعديل التسجيلات",
    "تحويل الأفكار المعتمدة فقط إلى مشاريع تنفيذية مرتبطة بمؤشرات وجدوى وحوكمة"
  ];

  const summaryDefaults = {
    title:
      "Enterprise Biometric Intelligence Platform",
    subtitle:
      "منصة الذكاء الاصطناعي للأنظمة البيومترية والبوابات الذكية",
    period: "2026–2030",

    ideasCount: 32,
    targetIdeas: 100,

    projectsCount: 0,
    flagshipProjectsCount: 0,
    activeProjectsCount: 0,
    completedProjectsCount: 0,
    pendingIdeasCount: 0,
    approvedIdeasCount: 0,
    convertedIdeasCount: 0,

    departmentsCount: 5,
    roadmapPhases: 6,

    maturityScore: 34,
    aiReadiness: 34,

    portfolioHealth: 68,
    systemHealth: 68,

    operationsHealth: 92,
    operationalHealth: 92,

    governanceControlsCount: 7,
    expectedROI: 42000000,

    operationsTrend: [
      82,
      76,
      88,
      70,
      92,
      84,
      96,
      90,
      94
    ],

    vision:
      "تطوير منظومة ذكية لتحسين جودة التسجيلات البيومترية، مراقبة استخدام الصلاحيات، رفع كفاءة البوابات الذكية، وتعزيز الأمن الرقمي في بيئة المطارات والمنافذ.",

    mission:
      "تحويل التحديات التشغيلية والأمنية في أنظمة بصمة العين والبوابات الذكية إلى مشاريع ذكاء اصطناعي قابلة للتنفيذ والقياس والحوكمة."
  };

  const seedData = {
    summary: summaryDefaults,
    strategy: [],
    ideas: seedIdeas,
    projects: [],
    flagshipProjects: [],
    departments,
    roadmap,
    projectHorizons,
    governance,
    risks,
    recommendations,
    alerts: [],
    meta: {
      seedVersion: DATA_VERSION,
      seededAt: null,
      migrations: {}
    }
  };

  /* =======================================================
     Legacy Fictional Project Detection
  ======================================================= */

  const legacyProjectTitles = new Set([
    "Biometric Data Integrity Engine",
    "Credential Misuse Detection Engine",
    "User Behaviour Intelligence Platform",
    "Privilege Usage Analytics",
    "Biometric Registration Quality Monitor",
    "Duplicate Identity Detection Engine",
    "Smart Gate Performance Intelligence",
    "Airport Biometric Operations Dashboard",
    "Registration Error Intelligence",
    "Registration Error Intelligence Dashboard",
    "Biometric Capture Quality AI",
    "Access Log Anomaly Detection",
    "AI Security Alert Prioritization",
    "Root Cause Analyzer for Biometric Errors",
    "Registration Error Root Cause Analyzer",
    "Executive Biometric Intelligence Dashboard",
    "Smart Gate Predictive Maintenance"
  ]);

  function isLegacyFictionalProject(project) {
    if (!project || typeof project !== "object") {
      return false;
    }

    const sourceIdeaId =
      project.sourceIdeaId ??
      project.ideaId ??
      project.origin?.ideaId ??
      project.source?.ideaId ??
      null;

    if (
      sourceIdeaId ||
      project.createdFromIdea === true ||
      project.origin === "idea-conversion" ||
      project.origin?.type === "idea"
    ) {
      return false;
    }

    const title = String(
      project.title ||
      project.englishTitle ||
      project.titleEn ||
      ""
    ).trim();

    return legacyProjectTitles.has(title);
  }

  /* =======================================================
     Idea Merge and Lifecycle Normalization
  ======================================================= */

  function getIdeaIdentity(idea) {
    const id = normalizeText(idea?.id);
    const title = normalizeText(
      idea?.titleEn ||
      idea?.title
    );

    return {
      id,
      title
    };
  }

  function findExistingIdeaIndex(ideas, seedIdea) {
    const seedIdentity = getIdeaIdentity(seedIdea);

    return ideas.findIndex(idea => {
      const identity = getIdeaIdentity(idea);

      return (
        (seedIdentity.id && identity.id === seedIdentity.id) ||
        (seedIdentity.title && identity.title === seedIdentity.title)
      );
    });
  }

  function enrichLegacyIdea(existingIdea, seedIdea) {
    const idea = {
      ...clone(seedIdea),
      ...existingIdea
    };

    idea.id =
      existingIdea?.id ||
      seedIdea.id;

    idea.department =
      existingIdea?.department ||
      seedIdea.department;

    idea.title =
      existingIdea?.title ||
      seedIdea.title;

    idea.titleEn =
      existingIdea?.titleEn ||
      existingIdea?.title ||
      seedIdea.titleEn;

    const converted =
      existingIdea?.convertedToProject === true ||
      existingIdea?.conversion?.converted === true ||
      Boolean(existingIdea?.projectId) ||
      Boolean(existingIdea?.conversion?.projectId);

    const approvalStatus =
      existingIdea?.approval?.status ||
      existingIdea?.approvalStatus ||
      seedIdea.approval.status;

    const lifecycleStatus =
      existingIdea?.lifecycleStatus ||
      existingIdea?.ideaStatus ||
      existingIdea?.status ||
      (converted ? "converted-to-project" : "draft");

    idea.status = lifecycleStatus;
    idea.ideaStatus = lifecycleStatus;
    idea.lifecycleStatus = lifecycleStatus;

    idea.approval = {
      ...clone(seedIdea.approval),
      ...(existingIdea?.approval || {}),
      status: approvalStatus
    };

    idea.conversion = {
      ...clone(seedIdea.conversion),
      ...(existingIdea?.conversion || {}),
      converted,
      projectId:
        existingIdea?.projectId ||
        existingIdea?.conversion?.projectId ||
        null
    };

    idea.projectId =
      existingIdea?.projectId ||
      idea.conversion.projectId ||
      null;

    idea.convertedToProject = converted;

    idea.projectBlueprint = {
      ...clone(seedIdea.projectBlueprint),
      ...(existingIdea?.projectBlueprint || {})
    };

    idea.lifecycleHistory = Array.isArray(
      existingIdea?.lifecycleHistory
    )
      ? existingIdea.lifecycleHistory
      : [];

    idea.createdAt =
      existingIdea?.createdAt ||
      seedIdea.createdAt;

    idea.updatedAt =
      existingIdea?.updatedAt ||
      now();

    idea.deletedAt =
      existingIdea?.deletedAt ?? null;

    return idea;
  }

  function mergeSeedIdeas(existingIdeas) {
    const mergedIdeas = Array.isArray(existingIdeas)
      ? existingIdeas.map(idea => clone(idea))
      : [];

    let addedCount = 0;
    let enrichedCount = 0;

    seedIdeas.forEach(seedIdea => {
      const existingIndex =
        findExistingIdeaIndex(
          mergedIdeas,
          seedIdea
        );

      if (existingIndex === -1) {
        mergedIdeas.push(clone(seedIdea));
        addedCount += 1;
        return;
      }

      mergedIdeas[existingIndex] =
        enrichLegacyIdea(
          mergedIdeas[existingIndex],
          seedIdea
        );

      enrichedCount += 1;
    });

    return {
      ideas: mergedIdeas,
      addedCount,
      enrichedCount
    };
  }

  /* =======================================================
     Summary Synchronization
  ======================================================= */

  function normalizeStatus(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/_/g, "-");
  }

  function getLifecycleStatus(idea) {
    if (
      idea?.convertedToProject === true ||
      idea?.conversion?.converted === true ||
      idea?.projectId
    ) {
      return "converted-to-project";
    }

    const lifecycle = normalizeStatus(
      idea?.lifecycleStatus ||
      idea?.ideaStatus ||
      idea?.status
    );

    if (
      ["converted", "converted-to-project"].includes(
        lifecycle
      )
    ) {
      return "converted-to-project";
    }

    if (
      ["submitted", "pending", "pending-approval"].includes(
        lifecycle
      )
    ) {
      return "pending-approval";
    }

    if (
      ["approved", "rejected", "archived", "draft"].includes(
        lifecycle
      )
    ) {
      return lifecycle;
    }

    const approval = normalizeStatus(
      idea?.approval?.status ||
      idea?.approvalStatus
    );

    if (approval === "approved") return "approved";
    if (approval === "rejected") return "rejected";

    if (
      ["pending", "submitted", "pending-approval"].includes(
        approval
      )
    ) {
      return "pending-approval";
    }

    return "draft";
  }

  function synchronizeSummary(draft) {
    const ideas = Array.isArray(draft.ideas)
      ? draft.ideas
      : [];

    const projects = Array.isArray(draft.projects)
      ? draft.projects
      : [];

    const activeIdeas = ideas.filter(
      idea => !idea?.deletedAt
    );

    const pendingIdeasCount = activeIdeas.filter(
      idea =>
        getLifecycleStatus(idea) ===
        "pending-approval"
    ).length;

    const approvedIdeasCount = activeIdeas.filter(
      idea =>
        getLifecycleStatus(idea) ===
        "approved"
    ).length;

    const rejectedIdeasCount = activeIdeas.filter(
      idea =>
        getLifecycleStatus(idea) ===
        "rejected"
    ).length;

    const convertedIdeasCount = activeIdeas.filter(
      idea =>
        getLifecycleStatus(idea) ===
        "converted-to-project"
    ).length;

    draft.summary = {
      ...clone(summaryDefaults),
      ...(draft.summary || {}),
      ideasCount: activeIdeas.length,
      projectsCount: projects.length,
      pendingIdeasCount,
      approvedIdeasCount,
      rejectedIdeasCount,
      convertedIdeasCount,
      departmentsCount:
        Array.isArray(draft.departments)
          ? draft.departments.length
          : departments.length,
      roadmapPhases:
        Array.isArray(draft.roadmap)
          ? draft.roadmap.length
          : roadmap.length
    };
  }

  /* =======================================================
     Store V2.2 Native Seeding
  ======================================================= */

  function getStore() {
    return window.AIW?.Store || null;
  }

  function isStoreReady(store) {
    return Boolean(
      store &&
      typeof store.getState === "function" &&
      typeof store.updateState === "function"
    );
  }

  function scheduleStoreRetry() {
    if (retryCount >= MAX_STORE_RETRIES) {
      console.error(
        "[AIW.Data] AIW.Store V2.2 was not ready after multiple retries."
      );

      window.dispatchEvent(
        new CustomEvent(
          "aiw:dataSeedFailed",
          {
            detail: {
              version: DATA_VERSION,
              reason: "store-unavailable"
            }
          }
        )
      );

      return false;
    }

    retryCount += 1;

    window.setTimeout(
      seedStore,
      STORE_RETRY_DELAY
    );

    return false;
  }

  function seedStore() {
    const store = getStore();

    if (!isStoreReady(store)) {
      return scheduleStoreRetry();
    }

    retryCount = 0;

    const state = store.getState() || {};

    const migrations =
      state.meta?.migrations &&
      typeof state.meta.migrations === "object"
        ? state.meta.migrations
        : {};

    const alreadyMigrated =
      migrations[MIGRATION_KEY] === true;

    let mergeResult = {
      addedCount: 0,
      enrichedCount: 0
    };

    store.updateState(
      draft => {
        draft.meta =
          draft.meta &&
          typeof draft.meta === "object"
            ? draft.meta
            : {};

        draft.meta.migrations =
          draft.meta.migrations &&
          typeof draft.meta.migrations === "object"
            ? draft.meta.migrations
            : {};

        /*
         * Restore all missing canonical ideas while preserving:
         * - user-created ideas
         * - approvals
         * - conversion links
         * - lifecycle history
         * - edited fields
         */
        mergeResult = mergeSeedIdeas(
          draft.ideas
        );

        draft.ideas = mergeResult.ideas;

        if (
          mergeResult.addedCount > 0 ||
          !draft.meta.seededAt
        ) {
          draft.meta.seededAt = now();
        }

        /*
         * Add reference collections only when absent.
         */
        if (
          !Array.isArray(draft.departments) ||
          draft.departments.length === 0
        ) {
          draft.departments =
            clone(departments);
        }

        if (
          !Array.isArray(draft.roadmap) ||
          draft.roadmap.length === 0
        ) {
          draft.roadmap =
            clone(roadmap);
        }

        if (
          !Array.isArray(draft.governance) ||
          draft.governance.length === 0
        ) {
          draft.governance =
            clone(governance);
        }

        if (
          !Array.isArray(draft.risks) ||
          draft.risks.length === 0
        ) {
          draft.risks =
            clone(risks);
        }

        if (
          !Array.isArray(draft.recommendations) ||
          draft.recommendations.length === 0
        ) {
          draft.recommendations =
            clone(recommendations);
        }

        if (
          !Array.isArray(draft.projectHorizons) ||
          draft.projectHorizons.length === 0
        ) {
          draft.projectHorizons =
            clone(projectHorizons);
        }

        if (!Array.isArray(draft.projects)) {
          draft.projects = [];
        }

        if (!Array.isArray(draft.flagshipProjects)) {
          draft.flagshipProjects = [];
        }

        /*
         * One-time V5.1 migration:
         * Remove only recognized legacy fictional projects
         * that have no idea-conversion source.
         */
        if (!alreadyMigrated) {
          draft.projects =
            draft.projects.filter(
              project =>
                !isLegacyFictionalProject(
                  project
                )
            );

          draft.flagshipProjects =
            draft.flagshipProjects.filter(
              project =>
                !isLegacyFictionalProject(
                  project
                )
            );

          draft.meta.migrations[
            MIGRATION_KEY
          ] = true;

          /*
           * Keep the old migration marker for compatibility.
           */
          draft.meta.migrations[
            LEGACY_MIGRATION_KEY
          ] = true;

          draft.meta.lastMigrationAt =
            now();
        }

        synchronizeSummary(draft);

        draft.meta.seedVersion =
          DATA_VERSION;

        draft.meta.lastSeedCheckAt =
          now();

        return draft;
      },
      {
        eventName: "aiw:seedDataReady",
        activity:
          !alreadyMigrated ||
          mergeResult.addedCount > 0
            ? {
                type: "data-migration",
                collection: "platform",
                title:
                  "استعادة وتثبيت بيانات فرص الذكاء الاصطناعي البيومترية",
                version: DATA_VERSION
              }
            : null,
        backup: true,
        notify: true
      }
    );

    const finalState =
      store.getState?.() || {};

    const ideasCount =
      Array.isArray(finalState.ideas)
        ? finalState.ideas.length
        : 0;

    const projectsCount =
      Array.isArray(finalState.projects)
        ? finalState.projects.length
        : 0;

    window.dispatchEvent(
      new CustomEvent(
        "aiw:dataSeeded",
        {
          detail: {
            version: DATA_VERSION,
            ideas: ideasCount,
            projects: projectsCount,
            addedIdeas:
              mergeResult.addedCount,
            enrichedIdeas:
              mergeResult.enrichedCount
          }
        }
      )
    );

    console.info(
      `[AIW.Data] Enterprise Seed Data V${DATA_VERSION} ready — ${ideasCount} ideas, ${projectsCount} projects`
    );

    return true;
  }

  /* =======================================================
     Public Reference
  ======================================================= */

  AIW.SeedData = Object.freeze({
    version: DATA_VERSION,
    data: clone(seedData),
    ideas: clone(seedIdeas),
    departments: clone(departments),
    roadmap: clone(roadmap),
    projectHorizons:
      clone(projectHorizons),
    governance: clone(governance),
    risks: clone(risks),
    recommendations:
      clone(recommendations),
    seed: seedStore
  });

  seedStore();
})();
