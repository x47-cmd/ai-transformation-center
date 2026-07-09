/* =========================================================
   AI Transformation Center
   Global Configuration
   Version 1.0
========================================================= */

const ATC_CONFIG = {
  app: {
    name: "AI Transformation Center",
    shortName: "ATC",
    version: "1.0.0",
    environment: "production"
  },

  storage: {
    data: "atcDataV1",
    settings: "atcSettingsV1",
    backup: "atcBackupV1"
  },

  language: {
    default: "ar",
    supported: ["ar", "en"]
  },

  theme: {
    default: "light"
  },

  events: {
    DATA_CHANGED: "atc:dataChanged",
    SETTINGS_CHANGED: "atc:settingsChanged",
    LANGUAGE_CHANGED: "atc:languageChanged",
    THEME_CHANGED: "atc:themeChanged",
    KPI_CHANGED: "atc:kpiChanged",
    REPORT_CHANGED: "atc:reportChanged"
  },

  security: {
    autoBackup: true,
    validateBeforeSave: true
  }
};

Object.freeze(ATC_CONFIG);