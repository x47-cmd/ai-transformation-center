/* =========================================================
   AI Transformation Center
   Global Configuration
   Version 1.1.0
========================================================= */

window.AIW = window.AIW || {};

const ATC_CONFIG = {
  app: {
    name: "AI Transformation Center",
    arabicName: "مركز التحول المؤسسي بالذكاء الاصطناعي",
    shortName: "AI Work",
    codeName: "ATC",
    version: "1.1.0",
    environment: "production",
    owner: "AI Work",
    direction: "rtl",
    locale: "ar-AE"
  },

  storage: {
    data: "atcDataV1",
    settings: "atcSettingsV1",
    backup: "atcBackupV1",
    currentModule: "aiwCurrentModule"
  },

  language: {
    default: "ar",
    supported: ["ar", "en"]
  },

  theme: {
    default: "light",
    supported: ["light", "dark"]
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
        subtitle: "AI Projects Portfolio",
        icon: "📁",
        container: "page-projects",
        enabled: true,
        order: 3
      },
      {
        id: "ideas",
        title: "الأفكار",
        subtitle: "AI Use Case Catalog",
        icon: "💡",
        container: "page-ideas",
        enabled: true,
        order: 4
      }
    ]
  },

  roadmap: {
    startYear: 2026,
    targetYear: 2030,
    phases: 12,
    currentPhase: 2,
    currentFocus: "Foundation UI + Executive Dashboard"
  },

  strategy: {
    targetIdeas: 100,
    currentIdeas: 42,
    targetProjects: 15,
    targetDepartments: 10,
    maturityTarget: 100,
    maturityCurrent: 34,
    roiTargetAED: 42000000
  },

  defaults: {
    currency: "AED",
    maturityScore: 34,
    portfolioHealth: 68,
    expectedROI: 42000000,
    targetYear: 2030
  },

  events: {
    DATA_CHANGED: "atc:dataChanged",
    SETTINGS_CHANGED: "atc:settingsChanged",
    LANGUAGE_CHANGED: "atc:languageChanged",
    THEME_CHANGED: "atc:themeChanged",
    ROUTE_CHANGED: "atc:routeChanged",
    KPI_CHANGED: "atc:kpiChanged",
    REPORT_CHANGED: "atc:reportChanged",
    MODULE_READY: "atc:moduleReady"
  },

  security: {
    autoBackup: true,
    validateBeforeSave: true,
    humanInTheLoop: true,
    responsibleAI: true
  }
};

Object.freeze(ATC_CONFIG);
window.ATC_CONFIG = ATC_CONFIG;
AIW.Config = ATC_CONFIG;