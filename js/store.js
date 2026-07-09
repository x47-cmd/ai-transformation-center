/* =========================================================
   Personal Wealth Center - Store V2
   Single Source of Truth
========================================================= */

window.PWC = window.PWC || {};

PWC.KEYS = {
  DATA: "pwcDataV2",
  BACKUP: "pwcBackupV2",
  SETTINGS: "pwcSettingsV2",
  VERSION: "pwcAppVersion"
};

PWC.DEFAULT_SETTINGS = {
  currency: "AED",
  locale: "ar-AE",
  theme: "light",
  compactMode: true,
  targetNetWorth: 1000000,
  monthlySalary: 32000,
  salaryDay: 27,
  monthlyInvestment: 3500,
  emergencyTarget: 15000,
  expectedReturn: 10
};

PWC.DEFAULT_DATA = {
  meta: {
    version: "2.0.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  cash: {
    available: 0,
    emergency: 5000
  },

  portfolio: {
    capitalDeposited: 0,
    currentValue: 0,
    totalDividends: 0,
    monthlyContribution: 3500,
    expectedReturn: 10,
    transactions: []
  },

  spending: {
    monthlyBudget: 7000,
    expenses: [],
    categories: []
  },

  assets: {
    investments: 0,
    realEstate: 0,
    nationalBonds: 0,
    cashAssets: 0,
    other: 0
  },

  liabilities: {
    mainLoan: 0,
    creditCards: 0,
    installments: 0,
    other: 0
  },

  goals: {
    netWorthTarget: 1000000,
    emergencyTarget: 15000,
    portfolioTargets: [100000, 250000, 500000, 1000000]
  }
};

PWC.Store = {
  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },

  write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  getSettings() {
    const saved = this.read(PWC.KEYS.SETTINGS, {});
    return { ...PWC.DEFAULT_SETTINGS, ...saved };
  },

  saveSettings(settings) {
    const merged = { ...this.getSettings(), ...settings };
    this.write(PWC.KEYS.SETTINGS, merged);
    PWC.Events?.emit("pwc:settingsChanged", merged);
    PWC.Events?.emit("pwc:dataChanged", this.getData());
    return merged;
  },

  getData() {
    const saved = this.read(PWC.KEYS.DATA, null);
    if (!saved) {
      this.write(PWC.KEYS.DATA, PWC.DEFAULT_DATA);
      return structuredClone(PWC.DEFAULT_DATA);
    }

    return this.mergeDeep(structuredClone(PWC.DEFAULT_DATA), saved);
  },

  saveData(data) {
    data.meta = data.meta || {};
    data.meta.updatedAt = new Date().toISOString();

    this.write(PWC.KEYS.DATA, data);
    this.write(PWC.KEYS.BACKUP, data);

    PWC.Events?.emit("pwc:dataChanged", data);
    return data;
  },

  update(path, value) {
    const data = this.getData();
    const keys = path.split(".");
    let ref = data;

    keys.slice(0, -1).forEach(k => {
      if (!ref[k]) ref[k] = {};
      ref = ref[k];
    });

    ref[keys[keys.length - 1]] = value;
    return this.saveData(data);
  },

  patch(section, object) {
    const data = this.getData();
    data[section] = { ...(data[section] || {}), ...object };
    return this.saveData(data);
  },

  reset() {
    this.write(PWC.KEYS.DATA, PWC.DEFAULT_DATA);
    PWC.Events?.emit("pwc:dataChanged", PWC.DEFAULT_DATA);
  },

  mergeDeep(target, source) {
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        target[key] = this.mergeDeep(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  },

  calculate() {
    const d = this.getData();

    const cash =
      Number(d.cash?.available || 0) +
      Number(d.cash?.emergency || 0);

    const portfolio =
      Number(d.portfolio?.currentValue || 0);

    const assets =
      Number(d.assets?.investments || 0) +
      Number(d.assets?.realEstate || 0) +
      Number(d.assets?.nationalBonds || 0) +
      Number(d.assets?.cashAssets || 0) +
      Number(d.assets?.other || 0);

    const liabilities =
      Number(d.liabilities?.mainLoan || 0) +
      Number(d.liabilities?.creditCards || 0) +
      Number(d.liabilities?.installments || 0) +
      Number(d.liabilities?.other || 0);

    const netWorth = cash + portfolio + assets - liabilities;

    return {
      cash,
      portfolio,
      assets,
      liabilities,
      netWorth,
      target: Number(d.goals?.netWorthTarget || 1000000),
      progress: Math.max(0, Math.min(100, netWorth / Number(d.goals?.netWorthTarget || 1000000) * 100))
    };
  }
};