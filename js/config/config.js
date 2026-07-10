/* =========================================================
   AI Work
   Enterprise Biometric Intelligence Platform
   Global Configuration V5.0
   Store V2.2 Native Architecture

   File Path:
   js/config/config.js

   Purpose:
   - Global application identity
   - Stable navigation registry
   - Store and backup key registry
   - Shared event names
   - Platform feature flags
   - Compatibility aliases for legacy ATC files
   - No operational portfolio data inside configuration
========================================================= */

window.AIW = window.AIW || {};

/* =========================================================
   Deep Freeze Utility
========================================================= */

function deepFreeze(object) {
  if (
    !object ||
    typeof object !== "object" ||
    Object.isFrozen(object)
  ) {
    return object;
  }

  Object.getOwnPropertyNames(object).forEach((property) => {
    const value = object[property];

    if (
      value &&
      typeof value === "object"
    ) {
      deepFreeze(value);
    }
  });

  return Object.freeze(object);
}

/* =========================================================
   Global Configuration
========================================================= */

const AIW_CONFIG = {
  app: {
    name: "AI Work",
    arabicName: "منصة الذكاء البيومتري المؤسسي",
    englishName: "Enterprise Biometric Intelligence Platform",
    shortName: "AI Work",
    codeName: "AIW",
    version: "5.0.0",
    architectureVersion: "2.2",
    environment: "production",
    owner: "AI Work",
    direction: "rtl",
    locale: "ar-AE",
    defaultLanguage: "ar",
    targetYear: 2030
  },

  storage: {
    data: "aiwDataV2",
    settings: "aiwSettingsV2",
    backup: "aiwBackupV2",
    metadata: "aiwMetadataV2",
    currentModule: "aiwCurrentModule",
    selectedProject: "aiwSelectedProjectId",

    legacy: {
      data: [
        "atcDataV1",
        "aiwDataV1",
        "aiwData",
        "AIW_DATA"
      ],

      settings: [
        "atcSettingsV1",
        "aiwSettingsV1"
      ],

      backup: [
        "atcBackupV1",
        "aiwBackupV1"
      ]
    }
  },

  language: {
    default: "ar",
    supported: [
      "ar",
      "en"
    ]
  },

  theme: {
    default: "light",
    supported: [
      "light",
      "dark"
    ]
  },

  navigation: {
    defaultModule: "dashboard",

    modules: [
      {
        id: "dashboard",
        title: "الرئيسية",
        subtitle: "Executive Dashboard",
        icon: "🏠",
        container: "page-dashboard",
        enabled: true,
        order: 1
      },
      {
        id: "strategy",
        title: "الاستراتيجية",
        subtitle: "Executive Strategy Center",
        icon: "🎯",
        container: "page-strategy",
        enabled: true,
        order: 2
      },
      {
        id: "projects",
        title: "المشاريع",
        subtitle: "AI Project Delivery Center",
        icon: "📁",
        container: "page-projects",
        enabled: true,
        order: 3
      },
      {
        id: "ideas",
        title: "الأفكار",
        subtitle: "Biometric AI Opportunity Center",
        icon: "💡",
        container: "page-ideas",
        enabled: true,
        order: 4
      },
      {
        id: "governance",
        title: "الحوكمة",
        subtitle: "Responsible AI Governance",
        icon: "🛡️",
        container: "page-governance",
        enabled: true,
        order: 5
      },
      {
        id: "maturity",
        title: "النضج",
        subtitle: "AI Maturity Center",
        icon: "🧠",
        container: "page-maturity",
        enabled: true,
        order: 6
      },
      {
        id: "reports",
        title: "التقارير",
        subtitle: "Executive Reports Center",
        icon: "📊",
        container: "page-reports",
        enabled: true,
        order: 7
      },
      {
        id: "kpis",
        title: "المؤشرات",
        subtitle: "KPI Performance Center",
        icon: "📈",
        container: "page-kpis",
        enabled: true,
        order: 8
      },
      {
        id: "business",
        title: "الجدوى",
        subtitle: "Business Case Center",
        icon: "💼",
        container: "page-business",
        enabled: true,
        order: 9
      },
      {
        id: "automation",
        title: "الأتمتة",
        subtitle: "Biometric Workflow Center",
        icon: "⚙️",
        container: "page-automation",
        enabled: true,
        order: 10
      },
      {
        id: "decision",
        title: "القرار",
        subtitle: "Decision Intelligence Center",
        icon: "🧭",
        container: "page-decision",
        enabled: true,
        order: 11
      },
      {
        id: "settings",
        title: "المزيد",
        subtitle: "Platform Tools & Settings",
        icon: "⋮",
        container: "page-settings",
        enabled: true,
        order: 12
      }
    ]
  },

  roadmap: {
    startYear: 2026,
    targetYear: 2030,
    phases: 12
  },

  defaults: {
    currency: "AED",
    locale: "ar-AE",
    direction: "rtl",
    reportingCycle: "شهري",
    humanApprovalRequired: true
  },

  features: {
    storeV2: true,
    crossPageSync: true,
    autoBackup: true,
    importExport: true,
    responsibleAI: true,
    humanInTheLoop: true,
    biometricAnalytics: true,
    decisionIntelligence: true,
    workflowAutomation: true,
    executiveReporting: true,
    legacyMigration: true
  },

  events: {
    DATA_CHANGED: "aiw:dataChanged",
    DATA_UPDATED: "aiw:dataUpdated",
    DATA_IMPORTED: "aiw:dataImported",
    DATA_RESTORED: "aiw:dataRestored",
    DATA_RESET: "aiw:dataReset",
    STORE_CHANGED: "aiw:storeChanged",

    SETTINGS_CHANGED: "aiw:settingsChanged",
    LANGUAGE_CHANGED: "aiw:languageChanged",
    THEME_CHANGED: "aiw:themeChanged",
    ROUTE_CHANGED: "aiw:routeChanged",
    MODULE_READY: "aiw:moduleReady",

    IDEAS_CHANGED: "aiw:ideasChanged",
    IDEAS_UPDATED: "aiw:ideasUpdated",
    IDEA_CREATED: "aiw:ideaCreated",
    IDEA_UPDATED: "aiw:ideaUpdated",
    IDEA_SUBMITTED: "aiw:ideaSubmittedForApproval",
    IDEA_APPROVED: "aiw:ideaApproved",
    IDEA_REJECTED: "aiw:ideaRejected",
    IDEA_REOPENED: "aiw:ideaReopened",
    IDEA_CONVERTED: "aiw:ideaConvertedToProject",

    PROJECTS_CHANGED: "aiw:projectsChanged",
    PROJECTS_UPDATED: "aiw:projectsUpdated",
    PROJECT_CREATED: "aiw:projectCreated",
    PROJECT_UPDATED: "aiw:projectUpdated",
    PROJECT_ARCHIVED: "aiw:projectArchived",

    AUTOMATION_CHANGED: "aiw:automationChanged",
    AUTOMATION_UPDATED: "aiw:automationUpdated",
    WORKFLOW_EXECUTED: "aiw:workflowExecuted",

    DECISION_CHANGED: "aiw:decisionChanged",
    DECISION_UPDATED: "aiw:decisionUpdated",
    DECISION_APPROVED: "aiw:decisionApproved",
    DECISION_REJECTED: "aiw:decisionRejected",

    KPIS_CHANGED: "aiw:kpisChanged",
    KPIS_UPDATED: "aiw:kpisUpdated",
    KPI_VALUE_UPDATED: "aiw:kpiValueUpdated",

    REPORTS_CHANGED: "aiw:reportsChanged",
    REPORTS_UPDATED: "aiw:reportsUpdated",
    REPORT_GENERATED: "aiw:reportGenerated",

    GOVERNANCE_CHANGED: "aiw:governanceChanged",
    GOVERNANCE_UPDATED: "aiw:governanceUpdated",
    RISKS_CHANGED: "aiw:risksChanged",
    RISKS_UPDATED: "aiw:risksUpdated",
    ROADMAP_CHANGED: "aiw:roadmapChanged",
    ROADMAP_UPDATED: "aiw:roadmapUpdated"
  },

  security: {
    autoBackup: true,
    validateBeforeSave: true,
    humanInTheLoop: true,
    responsibleAI: true,
    preventDuplicateConversion: true,
    preserveAuditHistory: true
  },

  compatibility: {
    exposeLegacyConfigName: true,
    legacyCodeName: "ATC",
    legacyEventPrefix: "atc:"
  }
};

/* =========================================================
   Freeze and Expose
========================================================= */

deepFreeze(AIW_CONFIG);

window.AIW_CONFIG = AIW_CONFIG;
window.ATC_CONFIG = AIW_CONFIG;

AIW.Config = AIW_CONFIG;
AIW.KEYS = AIW_CONFIG.storage;
AIW.EVENTS = AIW_CONFIG.events;
