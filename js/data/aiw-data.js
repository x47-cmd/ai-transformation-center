
/* =========================================================
   AI Work - Enterprise Data Layer V2.2
   Scope: Enterprise Biometric Intelligence Platform

   Updates:
   - Central Single Source of Truth
   - Persistent Local Storage
   - Automatic Summary Calculations
   - Cross-Page Live Synchronization
   - Data Backup and Recovery
   - Compatible with existing AIW.Data modules
========================================================= */

window.AIW = window.AIW || {};

/* =========================================================
   Storage Configuration
========================================================= */

AIW.StorageKeys = {
  primary: "aiwDataV1",
  backup: "aiwDataBackupV1",
  settings: "aiwSettingsV1"
};

/* =========================================================
   Default Enterprise Data
========================================================= */

AIW.DefaultData = {
  summary: {
    title: "Enterprise Biometric Intelligence Platform",
    subtitle: "منصة الذكاء الاصطناعي للأنظمة البيومترية والبوابات الذكية",
    period: "2026–2030",

    ideasCount: 32,
    targetIdeas: 100,

    departmentsCount: 5,
    flagshipProjectsCount: 15,
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
  },

  flagshipProjects: [
    "Biometric Data Integrity Engine",
    "Credential Misuse Detection Engine",
    "User Behaviour Intelligence Platform",
    "Privilege Usage Analytics",
    "Biometric Registration Quality Monitor",
    "Duplicate Identity Detection Engine",
    "Smart Gate Performance Intelligence",
    "Airport Biometric Operations Dashboard",
    "Registration Error Intelligence",
    "Biometric Capture Quality AI",
    "Access Log Anomaly Detection",
    "AI Security Alert Prioritization",
    "Root Cause Analyzer for Biometric Errors",
    "Executive Biometric Intelligence Dashboard",
    "Smart Gate Predictive Maintenance"
  ],

  departments: [
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
  ],

  roadmap: [
    {
      phase: "المرحلة الأولى — حصر البيانات",
      year: "2026 Q1–Q2",
      progress: 20,
      activities:
        "حصر مصادر بيانات التسجيلات، سجلات الدخول، الصلاحيات، الأجهزة، وأخطاء الأنظمة البيومترية"
    },
    {
      phase: "المرحلة الثانية — بناء لوحات التحليل",
      year: "2026 Q3–Q4",
      progress: 35,
      activities:
        "إنشاء لوحات Power BI لمراقبة التسجيلات، الأخطاء، المستخدمين، والصلاحيات"
    },
    {
      phase: "المرحلة الثالثة — نماذج الذكاء الاصطناعي",
      year: "2027",
      progress: 50,
      activities:
        "تطبيق نماذج كشف الشذوذ، جودة البيانات، وتحليل سلوك المستخدمين"
    },
    {
      phase: "المرحلة الرابعة — الأتمتة والتنبيهات",
      year: "2028",
      progress: 65,
      activities:
        "تفعيل التنبيهات الذكية، إنشاء البلاغات تلقائياً، وربطها بإجراءات المراجعة"
    },
    {
      phase: "المرحلة الخامسة — المنصة التنفيذية",
      year: "2029",
      progress: 82,
      activities:
        "تطوير لوحة تنفيذية موحدة لقياس الأداء والمخاطر والتوصيات"
    },
    {
      phase: "المرحلة السادسة — النضج والاستدامة",
      year: "2030",
      progress: 100,
      activities:
        "تحسين مستمر، حوكمة النماذج، قياس العائد، وتوسيع الاستخدام حسب الحاجة"
    }
  ],

  projectHorizons: [
    {
      title: "مشاريع سريعة",
      type: "Quick Wins",
      examples:
        "لوحة أخطاء التسجيل، تحليل مدة الجلسات، مراقبة المستخدمين الأكثر نشاطاً، تقرير جودة البيانات"
    },
    {
      title: "مشاريع متوسطة المدى",
      type: "Medium Term",
      examples:
        "الاستمارة الذكية لصرف الصلاحيات، مساعد تحليل الإدراجات الخاطئة، كشف السجلات المتعارضة، تحليل سلوك المستخدمين، ومراقبة الصلاحيات"
    },
    {
      title: "مشاريع استراتيجية",
      type: "Strategic",
      examples:
        "محرك سلامة البيانات البيومترية، كشف إساءة استخدام الحسابات، لوحة القيادة التنفيذية، والصيانة التنبؤية للبوابات"
    }
  ],

  ideas: [
    [
      "الأنظمة البيومترية",
      "Biometric Data Integrity Engine",
      "عالية",
      "متوسطة",
      "6-9 أشهر",
      "متوسطة",
      "وجود احتمال لتسجيل بيانات بيومترية لشخص على ملف غير صحيح أو وجود تعارض بين البيانات.",
      "تطوير محرك ذكاء اصطناعي يراجع سلامة البيانات البيومترية ويكشف التعارضات والحالات التي تحتاج مراجعة.",
      "كشف الشذوذ، مقارنة الأنماط، تحليل جودة البيانات، وإعطاء درجة ثقة لكل سجل.",
      "تقليل التسجيلات الخاطئة، رفع جودة البيانات، وتسريع اكتشاف الحالات التي تحتاج مراجعة."
    ],
    [
      "الأنظمة البيومترية",
      "Biometric Registration Quality Monitor",
      "عالية",
      "سهلة",
      "3-5 أشهر",
      "منخفضة",
      "بعض عمليات التسجيل قد تكون بجودة منخفضة أو ناقصة مما يؤثر لاحقاً على المطابقة.",
      "لوحة ذكية تراقب جودة التسجيلات الجديدة حسب الجهاز، الموقع، المستخدم، ونوع العملية.",
      "تحليل مؤشرات الجودة وتحديد التسجيلات الضعيفة أو غير المكتملة.",
      "رفع جودة التسجيل من البداية وتقليل الحاجة للتصحيح اليدوي لاحقاً."
    ],
    [
      "الأنظمة البيومترية",
      "Duplicate Identity Detection Engine",
      "عالية",
      "متوسطة",
      "6-8 أشهر",
      "متوسطة",
      "احتمالية وجود أكثر من سجل لنفس الشخص أو وجود بيانات متشابهة بين عدة ملفات.",
      "نظام يكشف السجلات المتشابهة ويقترح الحالات التي تحتاج مراجعة بشرية.",
      "تحليل التشابه، كشف الأنماط، وربط المؤشرات بين السجلات.",
      "تقليل التكرار، تحسين دقة قواعد البيانات، وتعزيز موثوقية المنظومة."
    ],
    [
      "الأنظمة البيومترية",
      "Biometric Capture Quality AI",
      "متوسطة",
      "سهلة",
      "3-4 أشهر",
      "منخفضة",
      "تفاوت جودة التقاط بصمة العين أو الصورة بسبب الإضاءة أو الجهاز أو طريقة الاستخدام.",
      "تحليل جودة الالتقاط وإظهار الأجهزة أو المواقع التي تنتج جودة أقل من المتوسط.",
      "تصنيف جودة العينة وتحليل أسباب انخفاض الجودة.",
      "تحسين جودة الالتقاط وتقليل حالات الفشل في المطابقة."
    ],
    [
      "الأنظمة البيومترية",
      "Registration Error Root Cause Analyzer",
      "عالية",
      "متوسطة",
      "5-7 أشهر",
      "متوسطة",
      "صعوبة معرفة السبب الحقيقي وراء أخطاء التسجيل أو تكرار نفس الأخطاء.",
      "محرك يحلل الأخطاء حسب المستخدم، الجهاز، الموقع، الوقت، ونوع العملية.",
      "تحليل الأسباب الجذرية وربط الأحداث المتكررة بأنماط تشغيلية.",
      "معالجة أسباب الأخطاء بدلاً من معالجة النتائج فقط."
    ],
    [
      "الأنظمة البيومترية",
      "Biometric Data Completeness Monitor",
      "متوسطة",
      "سهلة",
      "2-3 أشهر",
      "منخفضة",
      "وجود سجلات ناقصة أو غير مكتملة يؤثر على جودة العمليات اللاحقة.",
      "لوحة تراقب اكتمال الحقول الأساسية وتحدد السجلات الناقصة.",
      "تحليل قواعد جودة البيانات وإصدار تنبيهات عند نقص البيانات.",
      "رفع اكتمال البيانات وتحسين جاهزية السجلات."
    ],
    [
      "الأنظمة البيومترية",
      "Biometric Conflict Detection",
      "عالية",
      "متوسطة",
      "5-6 أشهر",
      "متوسطة",
      "وجود تعارض بين بيانات الهوية والبيانات البيومترية أو اختلافات تحتاج تحقق.",
      "نظام يكشف التعارضات ويرفعها كحالات مراجعة.",
      "مقارنة ذكية بين السجلات، الحقول، ومؤشرات المطابقة.",
      "تقليل المخاطر التشغيلية ورفع ثقة البيانات."
    ],
    [
      "الأنظمة البيومترية",
      "Biometric Error Case Intelligence Assistant",
      "عالية",
      "متوسطة",
      "4-6 أشهر",
      "متوسطة",
      "يعتمد الموظفون على التحليل اليدوي للإدراجات البيومترية الخاطئة، والبحث في الحالات السابقة، وتحديد سبب الخطأ وطريقة تصحيحه، مما يزيد زمن المعالجة وقد يؤدي إلى اختلاف الحلول بين الموظفين.",
      "تطوير مساعد ذكي يحلل حالة الإدراج الخاطئ، ويحدد نوع المشكلة وسببها المحتمل، ويعرض الحالات السابقة المشابهة، ثم يقترح التصحيح المناسب ويجهز إجراء المعالجة لاعتماده من الموظف المختص.",
      "تحليل بيانات الحالة، تصنيف نوع الخطأ، مقارنة الحالة بسجل الحالات السابقة، استرجاع الحلول المشابهة، اقتراح التصحيح، قياس درجة الثقة، واكتشاف الأنماط التي تؤدي إلى تكرار الأخطاء.",
      "تقليل زمن دراسة الحالات، توحيد قرارات التصحيح، بناء قاعدة معرفة ذكية، منع تكرار الأخطاء، رفع جودة التسجيلات، والإبقاء على اعتماد الموظف قبل تعديل البيانات الحساسة."
    ],

    [
      "البوابات الذكية",
      "Smart Gate Performance Intelligence",
      "عالية",
      "متوسطة",
      "6-8 أشهر",
      "متوسطة",
      "الحاجة لمراقبة أداء البوابات الذكية ومعرفة التباطؤ أو الأعطال قبل تأثيرها على التشغيل.",
      "لوحة ذكية تقيس أداء كل بوابة حسب عدد العمليات، زمن العبور، الأخطاء، ونسبة النجاح.",
      "تحليل الأداء، كشف الانخفاض غير الطبيعي، والتنبؤ بالمشاكل التشغيلية.",
      "رفع جاهزية البوابات وتحسين تجربة المسافرين."
    ],
    [
      "البوابات الذكية",
      "Smart Gate Predictive Maintenance",
      "عالية",
      "صعبة",
      "8-10 أشهر",
      "عالية",
      "الأعطال قد تظهر بشكل مفاجئ وتؤثر على انسيابية حركة المسافرين.",
      "نظام يتنبأ باحتمالية تعطل البوابة بناءً على مؤشرات الأداء والأخطاء السابقة.",
      "نماذج تنبؤية وتحليل أنماط الأعطال.",
      "تقليل التوقف المفاجئ وتحسين التخطيط للصيانة."
    ],
    [
      "البوابات الذكية",
      "Passenger Processing Time Analytics",
      "متوسطة",
      "سهلة",
      "3-4 أشهر",
      "منخفضة",
      "عدم وضوح متوسط زمن عبور المسافر حسب البوابة أو الفترة أو نوع العملية.",
      "تحليل زمن المعالجة وإظهار نقاط البطء.",
      "تحليل السلاسل الزمنية واكتشاف الفترات غير الطبيعية.",
      "تحسين سرعة العبور ورفع كفاءة التشغيل."
    ],
    [
      "البوابات الذكية",
      "Smart Gate Error Pattern Detection",
      "عالية",
      "متوسطة",
      "5-6 أشهر",
      "متوسطة",
      "تكرار أخطاء معينة في بوابات أو أجهزة محددة دون تحليل عميق.",
      "تحليل أنماط الأخطاء وربطها بالجهاز أو الموقع أو الفترة.",
      "كشف الأنماط المتكررة وتحديد مصادر الخلل المحتملة.",
      "تقليل الأخطاء المتكررة وتحسين الاستجابة الفنية."
    ],
    [
      "البوابات الذكية",
      "Airport Gate Utilization Optimizer",
      "متوسطة",
      "متوسطة",
      "5-7 أشهر",
      "متوسطة",
      "تفاوت استخدام البوابات بين مواقع أو أوقات مختلفة.",
      "تحليل الاستخدام واقتراح إعادة توزيع أو تحسين تشغيل البوابات.",
      "تحليل كثافة الاستخدام والتوصية بالتوزيع الأمثل.",
      "رفع الاستفادة من الموارد وتقليل الازدحام."
    ],
    [
      "البوابات الذكية",
      "Smart Gate Availability Dashboard",
      "عالية",
      "سهلة",
      "3-4 أشهر",
      "منخفضة",
      "الحاجة لعرض مباشر لحالة البوابات الجاهزة والمتوقفة والمتأثرة بالأخطاء.",
      "لوحة تعرض الجاهزية، الأعطال، ونسبة التوفر لكل بوابة.",
      "تحليل مباشر للبيانات التشغيلية وإصدار مؤشرات جاهزية.",
      "تحسين سرعة اتخاذ القرار التشغيلي."
    ],

    [
      "المستخدمون والصلاحيات",
      "Credential Misuse Detection Engine",
      "عالية",
      "متوسطة",
      "6-8 أشهر",
      "متوسطة",
      "احتمالية استخدام حساب موظف من قبل أكثر من شخص أو استخدام الصلاحية بطريقة غير متوافقة مع السياسات.",
      "محرك ذكاء اصطناعي يراقب نمط استخدام الحسابات ويكشف السلوكيات غير الاعتيادية.",
      "تحليل سلوك المستخدم، مدة الجلسات، الأجهزة، الأوقات، ونوع العمليات.",
      "تعزيز الحوكمة، تقليل إساءة استخدام الحسابات، ورفع الالتزام بسياسات الصلاحيات."
    ],
    [
      "المستخدمون والصلاحيات",
      "User Behaviour Intelligence Platform",
      "عالية",
      "متوسطة",
      "6-9 أشهر",
      "متوسطة",
      "الاعتماد على السجلات فقط لا يكفي لفهم السلوك التشغيلي للمستخدمين.",
      "منصة تحلل سلوك المستخدمين وتبني نمطاً اعتيادياً لكل مستخدم.",
      "كشف الشذوذ السلوكي ومقارنة الاستخدام الحالي بالتاريخ السابق.",
      "تحسين الرقابة الذكية دون تعطيل العمل اليومي."
    ],
    [
      "المستخدمون والصلاحيات",
      "Privilege Usage Analytics",
      "عالية",
      "سهلة",
      "3-5 أشهر",
      "منخفضة",
      "وجود صلاحيات قد تكون مستخدمة بشكل زائد أو غير مستخدمة أو أعلى من الحاجة التشغيلية.",
      "تحليل استخدام الصلاحيات وربطها بالعمليات الفعلية.",
      "تحليل أنماط استخدام الصلاحيات الحساسة وإصدار مؤشرات مخاطر.",
      "تحسين إدارة الصلاحيات وتقليل المخاطر."
    ],
    [
      "المستخدمون والصلاحيات",
      "Long Session Anomaly Detection",
      "عالية",
      "سهلة",
      "3-4 أشهر",
      "منخفضة",
      "استخدام اليوزر لفترات طويلة جداً قد يشير إلى استخدام غير طبيعي أو مشاركة حساب.",
      "نظام يراقب مدة الجلسات ويكشف الجلسات غير المعتادة مقارنة بنمط المستخدم.",
      "تحليل مدة الجلسة، وقت الدخول، وعدد العمليات خلال الجلسة.",
      "اكتشاف مبكر للحالات التي تحتاج مراجعة."
    ],
    [
      "المستخدمون والصلاحيات",
      "Multi-Device Account Usage Monitor",
      "متوسطة",
      "متوسطة",
      "4-6 أشهر",
      "متوسطة",
      "استخدام نفس الحساب على أجهزة أو مواقع متعددة بطريقة غير معتادة.",
      "تحليل الأجهزة والمواقع المرتبطة بكل حساب وإصدار تنبيهات عند وجود نمط غير طبيعي.",
      "ربط بيانات الأجهزة والمواقع وسجلات الدخول.",
      "تعزيز الرقابة على الحسابات وتقليل مخاطر مشاركة الصلاحيات."
    ],
    [
      "المستخدمون والصلاحيات",
      "Sensitive Action Monitoring AI",
      "عالية",
      "متوسطة",
      "5-6 أشهر",
      "متوسطة",
      "بعض العمليات الحساسة تحتاج مراقبة أعلى وتحليل سياقي.",
      "تصنيف العمليات الحساسة ومراقبة تكرارها وسياق تنفيذها.",
      "تحليل نوع العملية، المستخدم، الوقت، والموقع لاكتشاف الحالات غير الاعتيادية.",
      "تعزيز الأمن والامتثال دون إيقاف العمليات."
    ],
    [
      "المستخدمون والصلاحيات",
      "Inactive Permission Risk Analyzer",
      "متوسطة",
      "سهلة",
      "2-3 أشهر",
      "منخفضة",
      "وجود صلاحيات ممنوحة وغير مستخدمة لفترات طويلة قد يزيد المخاطر.",
      "لوحة تكشف الصلاحيات غير المستخدمة وتقترح مراجعتها.",
      "تحليل آخر استخدام وتكرار الاستخدام لكل صلاحية.",
      "تقليل الصلاحيات غير الضرورية وتحسين الحوكمة."
    ],
    [
      "المستخدمون والصلاحيات",
      "Smart Permission Provisioning Assistant",
      "عالية",
      "متوسطة",
      "3-5 أشهر",
      "متوسطة",
      "يعتمد صرف صلاحيات الموظفين على إدخال الاسم والرقم الوظيفي ورقم الهوية والبيانات التنظيمية يدوياً، ثم مراجعة الطلب وتحديد الصلاحيات المناسبة، مما يستهلك الوقت ويرفع احتمال نقص البيانات أو صرف صلاحيات غير متوافقة مع طبيعة العمل.",
      "إنشاء استمارة ذكية يكتفي فيها مقدم الطلب بإدخال الرقم الوظيفي أو رقم الهوية، ثم يقوم النظام بجلب بيانات الموظف وتعبئة الحقول تلقائياً، والتحقق من اكتمال الطلب، واقتراح الصلاحيات المناسبة، وتجهيز الطلب للقبول أو الرفض من الموظف المسؤول.",
      "قراءة بيانات الموظف، تعبئة الاستمارة تلقائياً، التحقق من الهوية والوظيفة والإدارة، اكتشاف البيانات الناقصة، مقارنة الطلب بالسياسات، كشف تعارض الصلاحيات، واقتراح الموافقة أو الرفض مع توضيح الأسباب ودرجة الثقة.",
      "تقليل الإدخال اليدوي، تسريع صرف الصلاحيات، خفض الأخطاء البشرية، توحيد الإجراءات، تعزيز مبدأ أقل صلاحية ممكنة، وتوثيق قرار الموظف المسؤول قبل تنفيذ الصرف."
    ],

    [
      "الأمن الرقمي",
      "Access Log Anomaly Detection",
      "عالية",
      "متوسطة",
      "5-7 أشهر",
      "متوسطة",
      "صعوبة مراجعة كميات كبيرة من سجلات الدخول والاستخدام يدوياً.",
      "نظام ذكاء اصطناعي يكتشف الأنماط غير الطبيعية في سجلات الدخول والعمليات.",
      "كشف الشذوذ وربط الأحداث المتكررة بمستوى خطورة.",
      "تحسين سرعة اكتشاف المخاطر التشغيلية والأمنية."
    ],
    [
      "الأمن الرقمي",
      "AI Security Alert Prioritization",
      "عالية",
      "سهلة",
      "3-4 أشهر",
      "منخفضة",
      "كثرة التنبيهات قد تؤدي إلى تأخر مراجعة الحالات الأهم.",
      "تصنيف التنبيهات حسب الخطورة والأولوية والتأثير المحتمل.",
      "تحليل السياق وتقييم مستوى المخاطر لكل تنبيه.",
      "تسريع الاستجابة وتقليل الضوضاء التشغيلية."
    ],
    [
      "الأمن الرقمي",
      "Biometric System Risk Score",
      "عالية",
      "متوسطة",
      "5-6 أشهر",
      "متوسطة",
      "عدم وجود درجة مخاطر موحدة للأنظمة أو المواقع أو الأجهزة.",
      "تطوير مؤشر مخاطر ذكي لكل نظام أو موقع بناءً على الأخطاء، الاستخدام، والتنبيهات.",
      "دمج عدة مؤشرات في Risk Score واحد قابل للمتابعة.",
      "تمكين الإدارة من معرفة نقاط الخطر بسرعة."
    ],
    [
      "الأمن الرقمي",
      "Unauthorized Pattern Detection",
      "عالية",
      "متوسطة",
      "6-8 أشهر",
      "متوسطة",
      "قد تظهر أنماط استخدام لا تخالف قاعدة واضحة لكنها غير طبيعية.",
      "كشف الأنماط غير المصرح بها أو غير المتوقعة في العمليات اليومية.",
      "تحليل السلوك، التسلسل الزمني، وتكرار العمليات.",
      "رفع مستوى الرقابة الذكية وتقليل المخاطر."
    ],
    [
      "الأمن الرقمي",
      "Audit Evidence Intelligence",
      "متوسطة",
      "سهلة",
      "3-5 أشهر",
      "منخفضة",
      "تجميع أدلة المراجعة والتدقيق يتطلب وقتاً وجهداً.",
      "توليد ملخص ذكي للحالة يشمل المستخدم، الوقت، العملية، السبب المحتمل، والتوصية.",
      "تلخيص السجلات وتحويلها إلى تقرير قابل للمراجعة.",
      "تسهيل أعمال التدقيق والحوكمة."
    ],

    [
      "التحليلات والتقارير التنفيذية",
      "Executive Biometric Intelligence Dashboard",
      "عالية",
      "متوسطة",
      "5-7 أشهر",
      "متوسطة",
      "الحاجة إلى لوحة تنفيذية موحدة تعرض حالة التسجيلات، البوابات، المستخدمين، والمخاطر.",
      "لوحة Power BI تنفيذية تربط جميع المؤشرات في شاشة واحدة.",
      "تحليل البيانات وتوليد توصيات تنفيذية ذكية.",
      "تحسين اتخاذ القرار ورفع وضوح الصورة التشغيلية."
    ],
    [
      "التحليلات والتقارير التنفيذية",
      "Airport Biometric Operations Dashboard",
      "عالية",
      "سهلة",
      "3-4 أشهر",
      "منخفضة",
      "صعوبة مقارنة أداء المطارات أو المواقع من حيث التسجيلات والأخطاء والاستخدام.",
      "لوحة تقارن الأداء حسب المطار، الجهاز، المستخدم، ونوع العملية.",
      "تحليل الاتجاهات واكتشاف الفروقات غير الطبيعية.",
      "رفع كفاءة المتابعة وتحسين توزيع الجهود."
    ],
    [
      "التحليلات والتقارير التنفيذية",
      "Registration Error Intelligence Dashboard",
      "عالية",
      "سهلة",
      "3-4 أشهر",
      "منخفضة",
      "عدم وجود رؤية واضحة لأكثر أخطاء التسجيل تكراراً ومصادرها.",
      "لوحة تعرض أخطاء التسجيل حسب النوع والموقع والجهاز والفترة.",
      "تصنيف الأخطاء وتحليل تكرارها واتجاهاتها.",
      "تقليل الأخطاء عبر قرارات مبنية على بيانات."
    ],
    [
      "التحليلات والتقارير التنفيذية",
      "AI Recommendation Center",
      "متوسطة",
      "متوسطة",
      "5-6 أشهر",
      "متوسطة",
      "اللوحات تعرض أرقاماً لكن لا تقدم دائماً توصيات عملية.",
      "مركز توصيات يقترح إجراءات مثل مراجعة مستخدم، فحص جهاز، أو تحسين إجراء.",
      "تحليل المؤشرات وتحويلها إلى توصيات قابلة للتنفيذ.",
      "تسريع القرار وتحويل البيانات إلى إجراءات."
    ],
    [
      "التحليلات والتقارير التنفيذية",
      "Automated Executive Reporting",
      "متوسطة",
      "سهلة",
      "3-4 أشهر",
      "منخفضة",
      "إعداد التقارير التنفيذية يستهلك وقتاً ويتكرر بشكل دوري.",
      "توليد تقرير أسبوعي أو شهري تلقائي عن جودة التسجيلات، الصلاحيات، البوابات، والمخاطر.",
      "تلخيص البيانات وتحويلها إلى تقرير تنفيذي واضح.",
      "توفير الوقت وتوحيد أسلوب التقارير."
    ]
  ].map((item, index) => ({
    id: index + 1,
    department: item[0],
    title: item[1],
    priority: item[2],
    ease: item[3],
    duration: item[4],
    cost: item[5],
    challenge: item[6],
    solution: item[7],
    aiRole: item[8],
    benefits: item[9],
    status: "proposed",
    createdAt: null,
    updatedAt: null
  })),

  projects: [],

  alerts: [],

  kpis: [
    "نسبة جودة التسجيلات البيومترية",
    "عدد التسجيلات التي تحتاج مراجعة",
    "نسبة انخفاض أخطاء التسجيل",
    "عدد السجلات المتعارضة أو المتكررة المكتشفة",
    "متوسط زمن اكتشاف الخطأ",
    "عدد حالات الاستخدام غير الاعتيادي للحسابات",
    "متوسط مدة جلسات المستخدمين",
    "نسبة استخدام الصلاحيات الحساسة",
    "عدد الصلاحيات غير المستخدمة",
    "متوسط زمن معالجة طلب الصلاحية",
    "نسبة طلبات الصلاحيات المكتملة تلقائياً",
    "نسبة توصيات الصلاحيات المعتمدة",
    "متوسط زمن تحليل الإدراج الخاطئ",
    "نسبة الحالات المشابهة المسترجعة بنجاح",
    "نسبة انخفاض تكرار أخطاء الإدراج",
    "نسبة جاهزية البوابات الذكية",
    "متوسط زمن عبور المسافر",
    "عدد أعطال البوابات المتكررة",
    "مؤشر مخاطر الأنظمة البيومترية",
    "عدد التنبيهات ذات الأولوية العالية",
    "نسبة الالتزام بالمراجعة والحوكمة"
  ],

  governance: [
    "الإشراف البشري إلزامي على أي حالة تتعلق بالأشخاص أو الصلاحيات أو التسجيلات الحساسة",
    "لا يتم صرف أي صلاحية مقترحة بواسطة النظام إلا بعد قبول الموظف المسؤول عن الاعتماد",
    "لا يتم تعديل أي تسجيل بيومتري خاطئ تلقائياً قبل مراجعة واعتماد الموظف المختص",
    "الذكاء الاصطناعي يقدم مؤشرات وتنبيهات وتوصيات ولا يتخذ قراراً نهائياً بتعديل البيانات",
    "توثيق جميع التنبيهات والتوصيات وقرارات القبول والرفض لأغراض التدقيق والتحسين المستمر",
    "تطبيق مبدأ أقل صلاحية ممكنة عند اقتراح أو مراجعة صلاحيات الموظفين",
    "مراجعة دورية للنماذج والمؤشرات لضمان العدالة والدقة وتقليل الإنذارات الخاطئة"
  ],

  risks: [
    {
      title: "جودة البيانات",
      level: "عالٍ",
      mitigation:
        "تطبيق قواعد جودة بيانات واضحة قبل تشغيل نماذج الذكاء الاصطناعي"
    },
    {
      title: "الخصوصية",
      level: "عالٍ",
      mitigation:
        "استخدام مؤشرات تشغيلية ومخرجات مراجعة دون عرض بيانات شخصية غير لازمة"
    },
    {
      title: "الإنذارات الخاطئة",
      level: "متوسط",
      mitigation:
        "اعتماد مراجعة بشرية وتدرج في مستويات التنبيه"
    },
    {
      title: "التكامل مع الأنظمة",
      level: "متوسط",
      mitigation:
        "البدء بلوحات قراءة وتحليل قبل أي تكامل تشغيلي عميق"
    },
    {
      title: "حوكمة الصلاحيات",
      level: "عالٍ",
      mitigation:
        "تحديد أدوار واضحة للمراجعة والاعتماد وتوثيق جميع قرارات صرف الصلاحيات"
    },
    {
      title: "التعديل غير الصحيح للسجلات",
      level: "عالٍ",
      mitigation:
        "منع التعديل التلقائي النهائي وإلزام اعتماد الموظف المختص مع حفظ النسخة السابقة وسجل التدقيق"
    }
  ],

  recommendations: [
    "اعتماد Enterprise Biometric Intelligence Platform كأول محفظة متخصصة ضمن مبادرة أفكار الذكاء الاصطناعي",
    "البدء بمشاريع Quick Wins مثل لوحة أخطاء التسجيل، مراقبة مدة الجلسات، وتحليل استخدام الصلاحيات",
    "تنفيذ نموذج أولي للاستـمارة الذكية لصرف الصلاحيات وربطها ببيانات الموظفين والسياسات المعتمدة",
    "تطوير قاعدة معرفة للحالات البيومترية الخاطئة والحلول السابقة قبل تشغيل مساعد تحليل الحالات",
    "بناء Power BI Dashboard موحد للتسجيلات، البوابات، المستخدمين، الصلاحيات، والتنبيهات",
    "تطبيق مبدأ Human-in-the-Loop في جميع الحالات الحساسة قبل صرف الصلاحيات أو تعديل التسجيلات",
    "تحويل أفضل الأفكار إلى مشاريع تنفيذية مع KPIs وBusiness Case وخطة حوكمة واضحة"
  ],

  meta: {
    schemaVersion: "2.2",
    createdAt: null,
    updatedAt: null,
    lastBackupAt: null
  }
};

/* =========================================================
   Enterprise Store
========================================================= */

AIW.Store = {
  _data: null,
  _listeners: new Set(),

  /* =======================================================
     Initialize Store
  ======================================================= */

  init() {
    const storedData = this.readStoredData();

    this._data = storedData
      ? this.deepMerge(
          this.clone(AIW.DefaultData),
          storedData
        )
      : this.clone(AIW.DefaultData);

    this.normalizeData();

    if (!this._data.meta.createdAt) {
      this._data.meta.createdAt =
        new Date().toISOString();
    }

    this._data.meta.schemaVersion = "2.2";

    AIW.Data = this._data;

    this.save({
      silent: true,
      backup: false
    });

    this.emit("aiw:storeReady", {
      data: this.getState()
    });

    return AIW.Data;
  },

  /* =======================================================
     Public Data Readers
  ======================================================= */

  getState() {
    return this._data || AIW.Data || {};
  },

  getData() {
    return this.getState();
  },

  get(path, fallback = null) {
    if (!path) {
      return this.getState();
    }

    const keys = String(path)
      .split(".")
      .filter(Boolean);

    let current = this.getState();

    for (const key of keys) {
      if (
        current === null ||
        current === undefined ||
        typeof current !== "object" ||
        !(key in current)
      ) {
        return fallback;
      }

      current = current[key];
    }

    return current;
  },

  /* =======================================================
     General Update
  ======================================================= */

  update(path, value, options = {}) {
    if (!path) return false;

    const keys = String(path)
      .split(".")
      .filter(Boolean);

    if (!keys.length) return false;

    let current = this._data;

    for (let index = 0; index < keys.length - 1; index++) {
      const key = keys[index];

      if (
        !current[key] ||
        typeof current[key] !== "object"
      ) {
        current[key] = {};
      }

      current = current[key];
    }

    const finalKey = keys[keys.length - 1];

    current[finalKey] =
      typeof value === "function"
        ? value(current[finalKey])
        : value;

    this.normalizeData();

    return this.save({
      event: options.event || "aiw:dataUpdated",
      detail: {
        path,
        value: current[finalKey]
      }
    });
  },

  updateSummary(values = {}) {
    if (
      !values ||
      typeof values !== "object"
    ) {
      return false;
    }

    this._data.summary = {
      ...this._data.summary,
      ...values
    };

    this.normalizeData();

    return this.save({
      event: "aiw:summaryUpdated",
      detail: {
        summary: this._data.summary
      }
    });
  },

  /* =======================================================
     Ideas Management
  ======================================================= */

  addIdea(idea = {}) {
    const now = new Date().toISOString();

    const newIdea = {
      id: this.getNextId(this._data.ideas),
      department: idea.department || "غير مصنف",
      title: idea.title || "فكرة جديدة",
      priority: idea.priority || "متوسطة",
      ease: idea.ease || "متوسطة",
      duration: idea.duration || "غير محددة",
      cost: idea.cost || "غير محددة",
      challenge: idea.challenge || "",
      solution: idea.solution || "",
      aiRole: idea.aiRole || "",
      benefits: idea.benefits || "",
      status: idea.status || "proposed",
      createdAt: now,
      updatedAt: now
    };

    this._data.ideas.push(newIdea);

    this.normalizeData();

    this.save({
      event: "aiw:ideasUpdated",
      detail: {
        action: "add",
        idea: newIdea
      }
    });

    return newIdea;
  },

  updateIdea(id, changes = {}) {
    const ideaIndex = this._data.ideas.findIndex(
      (item) => String(item.id) === String(id)
    );

    if (ideaIndex === -1) {
      return false;
    }

    const updatedIdea = {
      ...this._data.ideas[ideaIndex],
      ...changes,
      id: this._data.ideas[ideaIndex].id,
      updatedAt: new Date().toISOString()
    };

    this._data.ideas[ideaIndex] = updatedIdea;

    this.normalizeData();

    this.save({
      event: "aiw:ideasUpdated",
      detail: {
        action: "update",
        idea: updatedIdea
      }
    });

    return updatedIdea;
  },

  removeIdea(id) {
    const ideaIndex = this._data.ideas.findIndex(
      (item) => String(item.id) === String(id)
    );

    if (ideaIndex === -1) {
      return false;
    }

    const removedIdea =
      this._data.ideas.splice(ideaIndex, 1)[0];

    this.normalizeData();

    this.save({
      event: "aiw:ideasUpdated",
      detail: {
        action: "remove",
        idea: removedIdea
      }
    });

    return removedIdea;
  },

  /* =======================================================
     Projects Management
  ======================================================= */

  addProject(project = {}) {
    const now = new Date().toISOString();

    const newProject = {
      id: this.getNextId(this._data.projects),
      title: project.title || "مشروع جديد",
      department: project.department || "غير مصنف",
      status: project.status || "planned",
      progress: this.normalizePercent(
        project.progress,
        0
      ),
      priority: project.priority || "متوسطة",
      owner: project.owner || "",
      startDate: project.startDate || "",
      targetDate: project.targetDate || "",
      description: project.description || "",
      createdAt: now,
      updatedAt: now
    };

    this._data.projects.push(newProject);

    this.normalizeData();

    this.save({
      event: "aiw:projectsUpdated",
      detail: {
        action: "add",
        project: newProject
      }
    });

    return newProject;
  },

  updateProject(id, changes = {}) {
    const projectIndex =
      this._data.projects.findIndex(
        (item) => String(item.id) === String(id)
      );

    if (projectIndex === -1) {
      return false;
    }

    const updatedProject = {
      ...this._data.projects[projectIndex],
      ...changes,
      id: this._data.projects[projectIndex].id,
      updatedAt: new Date().toISOString()
    };

    if ("progress" in changes) {
      updatedProject.progress =
        this.normalizePercent(
          changes.progress,
          0
        );
    }

    this._data.projects[projectIndex] =
      updatedProject;

    this.normalizeData();

    this.save({
      event: "aiw:projectsUpdated",
      detail: {
        action: "update",
        project: updatedProject
      }
    });

    return updatedProject;
  },

  removeProject(id) {
    const projectIndex =
      this._data.projects.findIndex(
        (item) => String(item.id) === String(id)
      );

    if (projectIndex === -1) {
      return false;
    }

    const removedProject =
      this._data.projects.splice(
        projectIndex,
        1
      )[0];

    this.normalizeData();

    this.save({
      event: "aiw:projectsUpdated",
      detail: {
        action: "remove",
        project: removedProject
      }
    });

    return removedProject;
  },

  /* =======================================================
     Alerts Management
  ======================================================= */

  addAlert(alert = {}) {
    const now = new Date().toISOString();

    const newAlert = {
      id: this.getNextId(this._data.alerts),
      title: alert.title || "تنبيه جديد",
      message: alert.message || "",
      severity: alert.severity || "medium",
      status: alert.status || "open",
      source: alert.source || "platform",
      createdAt: now,
      updatedAt: now,
      resolvedAt: null
    };

    this._data.alerts.push(newAlert);

    this.normalizeData();

    this.save({
      event: "aiw:alertsUpdated",
      detail: {
        action: "add",
        alert: newAlert
      }
    });

    return newAlert;
  },

  updateAlert(id, changes = {}) {
    const alertIndex =
      this._data.alerts.findIndex(
        (item) => String(item.id) === String(id)
      );

    if (alertIndex === -1) {
      return false;
    }

    const currentAlert =
      this._data.alerts[alertIndex];

    const updatedAlert = {
      ...currentAlert,
      ...changes,
      id: currentAlert.id,
      updatedAt: new Date().toISOString()
    };

    if (
      changes.status === "resolved" &&
      !updatedAlert.resolvedAt
    ) {
      updatedAlert.resolvedAt =
        new Date().toISOString();
    }

    this._data.alerts[alertIndex] =
      updatedAlert;

    this.normalizeData();

    this.save({
      event: "aiw:alertsUpdated",
      detail: {
        action: "update",
        alert: updatedAlert
      }
    });

    return updatedAlert;
  },

  resolveAlert(id) {
    return this.updateAlert(id, {
      status: "resolved",
      resolvedAt: new Date().toISOString()
    });
  },

  removeAlert(id) {
    const alertIndex =
      this._data.alerts.findIndex(
        (item) => String(item.id) === String(id)
      );

    if (alertIndex === -1) {
      return false;
    }

    const removedAlert =
      this._data.alerts.splice(
        alertIndex,
        1
      )[0];

    this.normalizeData();

    this.save({
      event: "aiw:alertsUpdated",
      detail: {
        action: "remove",
        alert: removedAlert
      }
    });

    return removedAlert;
  },

  /* =======================================================
     Governance Management
  ======================================================= */

  addGovernanceControl(control) {
    if (!control) return false;

    const newControl =
      typeof control === "string"
        ? control
        : {
            id: this.getNextId(
              this._data.governance
            ),
            ...control
          };

    this._data.governance.push(newControl);

    this.normalizeData();

    this.save({
      event: "aiw:governanceUpdated",
      detail: {
        action: "add",
        control: newControl
      }
    });

    return newControl;
  },

  removeGovernanceControl(indexOrId) {
    const governance =
      this._data.governance;

    let controlIndex = -1;

    if (
      typeof indexOrId === "number" &&
      governance[indexOrId] !== undefined
    ) {
      controlIndex = indexOrId;
    } else {
      controlIndex =
        governance.findIndex(
          (item) =>
            item &&
            typeof item === "object" &&
            String(item.id) ===
              String(indexOrId)
        );
    }

    if (controlIndex === -1) {
      return false;
    }

    const removedControl =
      governance.splice(controlIndex, 1)[0];

    this.normalizeData();

    this.save({
      event: "aiw:governanceUpdated",
      detail: {
        action: "remove",
        control: removedControl
      }
    });

    return removedControl;
  },

  /* =======================================================
     Automatic Calculations
  ======================================================= */

  normalizeData() {
    if (!this._data) {
      this._data =
        this.clone(AIW.DefaultData);
    }

    const data = this._data;

    if (
      !data.summary ||
      typeof data.summary !== "object"
    ) {
      data.summary = {};
    }

    if (!Array.isArray(data.ideas)) {
      data.ideas = [];
    }

    if (!Array.isArray(data.projects)) {
      data.projects = [];
    }

    if (!Array.isArray(data.flagshipProjects)) {
      data.flagshipProjects = [];
    }

    if (!Array.isArray(data.departments)) {
      data.departments = [];
    }

    if (!Array.isArray(data.governance)) {
      data.governance = [];
    }

    if (!Array.isArray(data.alerts)) {
      data.alerts = [];
    }

    if (!Array.isArray(data.roadmap)) {
      data.roadmap = [];
    }

    if (
      !data.meta ||
      typeof data.meta !== "object"
    ) {
      data.meta = {};
    }

    /* Ideas */

    data.summary.ideasCount =
      data.ideas.length;

    data.summary.targetIdeas =
      Math.max(
        1,
        this.toNumber(
          data.summary.targetIdeas,
          100
        )
      );

    data.summary.highPriorityIdeasCount =
      data.ideas.filter((idea) => {
        const priority = String(
          idea?.priority || ""
        )
          .trim()
          .toLowerCase();

        return (
          priority === "عالية" ||
          priority === "عالي" ||
          priority === "high" ||
          priority === "critical"
        );
      }).length;

    /* Projects */

    data.summary.flagshipProjectsCount =
      data.flagshipProjects.length ||
      data.projects.length;

    data.summary.projectsCount =
      data.projects.length ||
      data.flagshipProjects.length;

    /* Departments */

    data.summary.departmentsCount =
      data.departments.length;

    /* Roadmap */

    data.summary.roadmapPhases =
      data.roadmap.length;

    /* Governance */

    data.summary.governanceControlsCount =
      data.governance.length;

    data.summary.humanInTheLoopControls =
      data.governance.length;

    /* Readiness */

    data.summary.maturityScore =
      this.normalizePercent(
        data.summary.maturityScore ??
          data.summary.aiReadiness,
        34
      );

    data.summary.aiReadiness =
      data.summary.maturityScore;

    /* System Health */

    data.summary.portfolioHealth =
      this.normalizePercent(
        data.summary.portfolioHealth ??
          data.summary.systemHealth,
        68
      );

    data.summary.systemHealth =
      data.summary.portfolioHealth;

    /* Operational Health */

    data.summary.operationsHealth =
      this.normalizePercent(
        data.summary.operationsHealth ??
          data.summary.operationalHealth,
        92
      );

    data.summary.operationalHealth =
      data.summary.operationsHealth;

    /* Operations Trend */

    if (
      !Array.isArray(
        data.summary.operationsTrend
      ) ||
      !data.summary.operationsTrend.length
    ) {
      data.summary.operationsTrend = [
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
    }

    data.summary.operationsTrend =
      data.summary.operationsTrend
        .map((value) =>
          this.normalizePercent(value, 0)
        )
        .slice(-9);

    /* Meta */

    data.meta.schemaVersion = "2.2";
    data.meta.updatedAt =
      new Date().toISOString();

    AIW.Data = data;

    return data;
  },

  /* =======================================================
     Save and Persistence
  ======================================================= */

  save(options = {}) {
    try {
      this.normalizeData();

      if (options.backup !== false) {
        this.createBackup();
      }

      const serializedData =
        JSON.stringify(this._data);

      localStorage.setItem(
        AIW.StorageKeys.primary,
        serializedData
      );

      AIW.Data = this._data;

      if (!options.silent) {
        this.emit(
          options.event || "aiw:dataChanged",
          options.detail || {
            data: this.getState()
          }
        );

        this.emit("aiw:storeChanged", {
          data: this.getState()
        });

        this.notifySubscribers();
      }

      return true;
    } catch (error) {
      console.error(
        "AI Work Store: Unable to save data.",
        error
      );

      return false;
    }
  },

  createBackup() {
    try {
      if (!this._data) return false;

      const previousSaved =
        localStorage.getItem(
          AIW.StorageKeys.primary
        );

      if (previousSaved) {
        localStorage.setItem(
          AIW.StorageKeys.backup,
          previousSaved
        );

        if (this._data.meta) {
          this._data.meta.lastBackupAt =
            new Date().toISOString();
        }
      }

      return true;
    } catch (error) {
      console.warn(
        "AI Work Store: Backup failed.",
        error
      );

      return false;
    }
  },

  restoreBackup() {
    try {
      const backup =
        localStorage.getItem(
          AIW.StorageKeys.backup
        );

      if (!backup) {
        return false;
      }

      const parsedBackup =
        JSON.parse(backup);

      this._data = this.deepMerge(
        this.clone(AIW.DefaultData),
        parsedBackup
      );

      this.normalizeData();

      this.save({
        event: "aiw:dataRestored",
        backup: false
      });

      return true;
    } catch (error) {
      console.error(
        "AI Work Store: Unable to restore backup.",
        error
      );

      return false;
    }
  },

  reset() {
    this._data =
      this.clone(AIW.DefaultData);

    this._data.meta.createdAt =
      new Date().toISOString();

    this.normalizeData();

    this.save({
      event: "aiw:dataReset",
      backup: true
    });

    return this.getState();
  },

  /* =======================================================
     Import and Export
  ======================================================= */

  exportData() {
    this.normalizeData();

    return JSON.stringify(
      this._data,
      null,
      2
    );
  },

  importData(importedData) {
    try {
      const parsedData =
        typeof importedData === "string"
          ? JSON.parse(importedData)
          : importedData;

      if (
        !parsedData ||
        typeof parsedData !== "object"
      ) {
        return false;
      }

      this.createBackup();

      this._data = this.deepMerge(
        this.clone(AIW.DefaultData),
        parsedData
      );

      this.normalizeData();

      this.save({
        event: "aiw:dataImported",
        backup: false
      });

      return true;
    } catch (error) {
      console.error(
        "AI Work Store: Import failed.",
        error
      );

      return false;
    }
  },

  /* =======================================================
     Subscription System
  ======================================================= */

  subscribe(listener) {
    if (typeof listener !== "function") {
      return () => {};
    }

    this._listeners.add(listener);

    return () => {
      this._listeners.delete(listener);
    };
  },

  notifySubscribers() {
    const currentData =
      this.getState();

    this._listeners.forEach((listener) => {
      try {
        listener(currentData);
      } catch (error) {
        console.warn(
          "AI Work Store: Subscriber failed.",
          error
        );
      }
    });
  },

  /* =======================================================
     Browser Events
  ======================================================= */

  emit(eventName, detail = {}) {
    window.dispatchEvent(
      new CustomEvent(eventName, {
        detail
      })
    );
  },

  /* =======================================================
     Storage Reader
  ======================================================= */

  readStoredData() {
    const storageKeys = [
      AIW.StorageKeys.primary,
      "aiwData",
      "AIW_DATA"
    ];

    for (const storageKey of storageKeys) {
      try {
        const savedValue =
          localStorage.getItem(storageKey);

        if (!savedValue) continue;

        const parsedValue =
          JSON.parse(savedValue);

        if (
          parsedValue &&
          typeof parsedValue === "object"
        ) {
          return parsedValue;
        }
      } catch (error) {
        console.warn(
          `AI Work Store: Invalid data in ${storageKey}.`,
          error
        );
      }
    }

    return null;
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
        this.toNumber(item?.id, 0)
      )
      .filter((id) => id > 0);

    return ids.length
      ? Math.max(...ids) + 1
      : 1;
  },

  toNumber(value, fallback = 0) {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue)
      ? parsedValue
      : fallback;
  },

  normalizePercent(value, fallback = 0) {
    const parsedValue =
      this.toNumber(value, fallback);

    return Math.min(
      100,
      Math.max(
        0,
        Math.round(parsedValue)
      )
    );
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
  },

  deepMerge(target, source) {
    if (
      !source ||
      typeof source !== "object"
    ) {
      return target;
    }

    Object.keys(source).forEach((key) => {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (Array.isArray(sourceValue)) {
        target[key] = this.clone(sourceValue);
        return;
      }

      if (
        sourceValue &&
        typeof sourceValue === "object"
      ) {
        if (
          !targetValue ||
          typeof targetValue !== "object" ||
          Array.isArray(targetValue)
        ) {
          target[key] = {};
        }

        target[key] = this.deepMerge(
          target[key],
          sourceValue
        );

        return;
      }

      target[key] = sourceValue;
    });

    return target;
  }
};

/* =========================================================
   Cross-Tab Synchronization

   Updates data when another browser tab modifies storage.
========================================================= */

window.addEventListener(
  "storage",
  (event) => {
    if (
      event.key !== AIW.StorageKeys.primary ||
      !event.newValue
    ) {
      return;
    }

    try {
      const incomingData =
        JSON.parse(event.newValue);

      AIW.Store._data =
        AIW.Store.deepMerge(
          AIW.Store.clone(AIW.DefaultData),
          incomingData
        );

      AIW.Store.normalizeData();

      AIW.Store.emit(
        "aiw:dataUpdated",
        {
          source: "storage",
          data: AIW.Store.getState()
        }
      );

      AIW.Store.emit(
        "aiw:storeChanged",
        {
          source: "storage",
          data: AIW.Store.getState()
        }
      );

      AIW.Store.notifySubscribers();
    } catch (error) {
      console.warn(
        "AI Work Store: Cross-tab synchronization failed.",
        error
      );
    }
  }
);

/* =========================================================
   Initialize Data Layer
========================================================= */

AIW.Store.init();