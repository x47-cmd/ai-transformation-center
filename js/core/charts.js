/* =========================================================
   AI Work - Charts Engine V1.1
   Enterprise Chart.js Framework

   Features:
   - Safe Chart.js Wrapper
   - Bar / Line / Doughnut / Radar / Gauge
   - Multiple Dataset Support
   - Automatic Chart Destruction
   - Module Lifecycle Integration
   - Theme-Aware Options
   - RTL / LTR Support
   - Responsive Rendering
   - Safe Data Normalization
   - Legacy Compatibility
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};

  const Charts = {
    id: "charts",
    version: "1.1.0",

    charts: {},
    _initialized: false,
    _eventsBound: false,
    _resizeTimer: null,

    colors: {
      primary: "#2563eb",
      secondary: "#7c3aed",
      success: "#16a34a",
      warning: "#f59e0b",
      danger: "#dc2626",
      dark: "#101828",
      gray: "#94a3b8",
      lightGray: "#e2e8f0",
      background: "#ffffff"
    },

    palette: [
      "#2563eb",
      "#7c3aed",
      "#16a34a",
      "#f59e0b",
      "#dc2626",
      "#0891b2",
      "#db2777",
      "#64748b",
      "#0f766e",
      "#9333ea"
    ],

    /* =========================================================
       INITIALIZATION
    ========================================================= */

    init() {
      if (this._initialized) {
        return this;
      }

      this._initialized = true;

      this.bindEvents();
      this.registerMetadata();

      return this;
    },

    isAvailable() {
      return typeof window.Chart === "function";
    },

    /* =========================================================
       GENERAL HELPERS
    ========================================================= */

    getSettings() {
      try {
        if (
          window.AIW?.Store &&
          typeof AIW.Store.getSettings === "function"
        ) {
          return AIW.Store.getSettings();
        }
      } catch (error) {
        console.warn(
          "[AIW.Charts] Unable to read settings:",
          error
        );
      }

      return {
        language: "ar",
        direction: "rtl",
        theme: "light"
      };
    },

    getDirection() {
      const settings = this.getSettings();

      return (
        settings.direction ||
        document.documentElement.dir ||
        "rtl"
      );
    },

    isDarkMode() {
      const settings = this.getSettings();

      return (
        settings.theme === "dark" ||
        document.body.classList.contains(
          "aiw-dark-mode"
        )
      );
    },

    getTextColor() {
      return this.isDarkMode()
        ? "#e2e8f0"
        : "#101828";
    },

    getMutedColor() {
      return this.isDarkMode()
        ? "#94a3b8"
        : "#64748b";
    },

    getGridColor() {
      return this.isDarkMode()
        ? "rgba(148,163,184,.14)"
        : "rgba(15,23,42,.06)";
    },

    clamp(value, min = 0, max = 100) {
      const number = Number(value);

      if (!Number.isFinite(number)) {
        return min;
      }

      return Math.min(
        max,
        Math.max(min, number)
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

    normalizeNumbers(values) {
      return this.toArray(values).map(value => {
        const number = Number(value);

        return Number.isFinite(number)
          ? number
          : 0;
      });
    },

    normalizeLabels(labels) {
      return this.toArray(labels).map(
        label => String(label ?? "")
      );
    },

    mergeOptions(base, custom) {
      if (
        !custom ||
        typeof custom !== "object"
      ) {
        return base;
      }

      const output = {
        ...base
      };

      Object.keys(custom).forEach(key => {
        const baseValue = output[key];
        const customValue = custom[key];

        if (
          baseValue &&
          customValue &&
          typeof baseValue === "object" &&
          typeof customValue === "object" &&
          !Array.isArray(baseValue) &&
          !Array.isArray(customValue)
        ) {
          output[key] = this.mergeOptions(
            baseValue,
            customValue
          );
        } else {
          output[key] = customValue;
        }
      });

      return output;
    },

    resolveCanvas(idOrElement) {
      if (!idOrElement) {
        return null;
      }

      if (
        typeof idOrElement === "string"
      ) {
        return document.getElementById(
          idOrElement
        );
      }

      if (
        idOrElement instanceof HTMLCanvasElement
      ) {
        return idOrElement;
      }

      return null;
    },

    getChartId(idOrElement) {
      if (
        typeof idOrElement === "string"
      ) {
        return idOrElement;
      }

      if (
        idOrElement &&
        idOrElement.id
      ) {
        return idOrElement.id;
      }

      return null;
    },

    /* =========================================================
       CHART REGISTRY
    ========================================================= */

    destroy(idOrElement) {
      const id =
        this.getChartId(idOrElement);

      if (!id) {
        return false;
      }

      const chart = this.charts[id];

      if (!chart) {
        return false;
      }

      try {
        chart.destroy();
      } catch (error) {
        console.warn(
          `[AIW.Charts] Unable to destroy chart "${id}":`,
          error
        );
      }

      delete this.charts[id];

      return true;
    },

    destroyAll() {
      Object.keys(this.charts).forEach(
        id => this.destroy(id)
      );

      return true;
    },

    destroyWithin(container) {
      if (!container) {
        return;
      }

      const canvases =
        container.querySelectorAll?.(
          "canvas[id]"
        ) || [];

      canvases.forEach(canvas => {
        this.destroy(canvas.id);
      });
    },

    get(id) {
      return this.charts[id] || null;
    },

    has(id) {
      return Boolean(this.charts[id]);
    },

    /* =========================================================
       DEFAULT OPTIONS
    ========================================================= */

    defaultOptions(
      title = "",
      customOptions = {}
    ) {
      const direction =
        this.getDirection();

      const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 450
        },
        interaction: {
          mode: "index",
          intersect: false
        },
        layout: {
          padding: {
            top: 8,
            right: 8,
            bottom: 4,
            left: 8
          }
        },
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            rtl: direction === "rtl",
            textDirection: direction,
            labels: {
              color: this.getMutedColor(),
              boxWidth: 12,
              boxHeight: 12,
              usePointStyle: true,
              pointStyle: "circle",
              padding: 18,
              font: {
                size: 12,
                weight: "600"
              }
            }
          },
          title: {
            display: Boolean(title),
            text: title,
            color: this.getTextColor(),
            padding: {
              top: 4,
              bottom: 18
            },
            font: {
              size: 16,
              weight: "700"
            }
          },
          tooltip: {
            rtl: direction === "rtl",
            textDirection: direction,
            padding: 12,
            displayColors: true,
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            backgroundColor:
              "rgba(15,23,42,.92)",
            borderWidth: 0
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: this.getMutedColor(),
              precision: 0
            },
            grid: {
              color: this.getGridColor(),
              drawBorder: false
            },
            border: {
              display: false
            }
          },
          x: {
            ticks: {
              color: this.getMutedColor()
            },
            grid: {
              display: false
            },
            border: {
              display: false
            }
          }
        }
      };

      return this.mergeOptions(
        options,
        customOptions
      );
    },

    circularOptions(
      title = "",
      customOptions = {}
    ) {
      const direction =
        this.getDirection();

      const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        animation: {
          duration: 450
        },
        plugins: {
          title: {
            display: Boolean(title),
            text: title,
            color: this.getTextColor(),
            padding: {
              bottom: 16
            },
            font: {
              size: 16,
              weight: "700"
            }
          },
          legend: {
            display: true,
            position: "bottom",
            rtl: direction === "rtl",
            textDirection: direction,
            labels: {
              color: this.getMutedColor(),
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 12,
              padding: 18
            }
          },
          tooltip: {
            rtl: direction === "rtl",
            textDirection: direction,
            padding: 12,
            backgroundColor:
              "rgba(15,23,42,.92)"
          }
        }
      };

      return this.mergeOptions(
        options,
        customOptions
      );
    },

    /* =========================================================
       GENERIC CHART CREATION
    ========================================================= */

    create(
      idOrElement,
      configuration = {}
    ) {
      if (!this.isAvailable()) {
        console.warn(
          "[AIW.Charts] Chart.js is not loaded."
        );

        return null;
      }

      const canvas =
        this.resolveCanvas(idOrElement);

      if (!canvas) {
        console.warn(
          "[AIW.Charts] Chart canvas was not found:",
          idOrElement
        );

        return null;
      }

      const id =
        this.getChartId(canvas);

      if (!id) {
        console.warn(
          "[AIW.Charts] Chart canvas must have an id."
        );

        return null;
      }

      this.destroy(id);

      try {
        const chart =
          new window.Chart(
            canvas,
            configuration
          );

        this.charts[id] = chart;

        this.emit(
          "aiw:chartCreated",
          {
            id,
            type:
              configuration.type ||
              "unknown"
          }
        );

        return chart;
      } catch (error) {
        console.error(
          `[AIW.Charts] Failed to create chart "${id}":`,
          error
        );

        return null;
      }
    },

    /* =========================================================
       DATASET HELPERS
    ========================================================= */

    normalizeDatasets(
      data,
      options = {}
    ) {
      if (
        Array.isArray(data) &&
        data.length &&
        typeof data[0] === "object" &&
        !Array.isArray(data[0]) &&
        (
          "data" in data[0] ||
          "label" in data[0]
        )
      ) {
        return data.map(
          (dataset, index) => ({
            ...dataset,
            data: this.normalizeNumbers(
              dataset.data
            ),
            backgroundColor:
              dataset.backgroundColor ||
              this.palette[
                index %
                this.palette.length
              ],
            borderColor:
              dataset.borderColor ||
              this.palette[
                index %
                this.palette.length
              ]
          })
        );
      }

      return [
        {
          label:
            options.label ||
            options.title ||
            "",
          data:
            this.normalizeNumbers(data),
          backgroundColor:
            options.backgroundColor ||
            this.colors.primary,
          borderColor:
            options.borderColor ||
            this.colors.primary
        }
      ];
    },

    /* =========================================================
       BAR CHART
    ========================================================= */

    bar(
      id,
      labels,
      data,
      title = "",
      options = {}
    ) {
      const datasets =
        this.normalizeDatasets(
          data,
          {
            title,
            ...options
          }
        ).map(dataset => ({
          borderRadius:
            dataset.borderRadius ?? 10,
          borderSkipped: false,
          maxBarThickness:
            dataset.maxBarThickness ?? 52,
          ...dataset
        }));

      return this.create(id, {
        type: "bar",
        data: {
          labels:
            this.normalizeLabels(labels),
          datasets
        },
        options:
          this.defaultOptions(
            title,
            options.chartOptions || {}
          )
      });
    },

    /* =========================================================
       LINE CHART
    ========================================================= */

    line(
      id,
      labels,
      data,
      title = "",
      options = {}
    ) {
      const datasets =
        this.normalizeDatasets(
          data,
          {
            title,
            ...options
          }
        ).map((dataset, index) => {
          const borderColor =
            dataset.borderColor ||
            this.palette[
              index %
              this.palette.length
            ];

          return {
            tension:
              dataset.tension ?? 0.35,
            fill:
              dataset.fill ?? true,
            borderWidth:
              dataset.borderWidth ?? 3,
            borderColor,
            backgroundColor:
              dataset.backgroundColor ||
              this.hexToRGBA(
                borderColor,
                0.12
              ),
            pointRadius:
              dataset.pointRadius ?? 4,
            pointHoverRadius:
              dataset.pointHoverRadius ?? 6,
            pointBackgroundColor:
              dataset.pointBackgroundColor ||
              borderColor,
            ...dataset
          };
        });

      return this.create(id, {
        type: "line",
        data: {
          labels:
            this.normalizeLabels(labels),
          datasets
        },
        options:
          this.defaultOptions(
            title,
            options.chartOptions || {}
          )
      });
    },

    /* =========================================================
       DOUGHNUT CHART
    ========================================================= */

    doughnut(
      id,
      labels,
      data,
      title = "",
      options = {}
    ) {
      const values =
        this.normalizeNumbers(data);

      const colors =
        options.colors ||
        this.palette.slice(
          0,
          Math.max(values.length, 1)
        );

      return this.create(id, {
        type: "doughnut",
        data: {
          labels:
            this.normalizeLabels(labels),
          datasets: [
            {
              data: values,
              borderWidth:
                options.borderWidth ?? 0,
              borderColor:
                options.borderColor ||
                "transparent",
              backgroundColor: colors,
              hoverOffset:
                options.hoverOffset ?? 5
            }
          ]
        },
        options:
          this.circularOptions(
            title,
            {
              cutout:
                options.cutout || "68%",
              ...(options.chartOptions || {})
            }
          )
      });
    },

    /* =========================================================
       RADAR CHART
    ========================================================= */

    radar(
      id,
      labels,
      data,
      title = "",
      options = {}
    ) {
      const datasets =
        this.normalizeDatasets(
          data,
          {
            title,
            ...options
          }
        ).map((dataset, index) => {
          const borderColor =
            dataset.borderColor ||
            this.palette[
              index %
              this.palette.length
            ];

          return {
            borderWidth:
              dataset.borderWidth ?? 3,
            borderColor,
            backgroundColor:
              dataset.backgroundColor ||
              this.hexToRGBA(
                borderColor,
                0.15
              ),
            pointBackgroundColor:
              dataset.pointBackgroundColor ||
              borderColor,
            pointRadius:
              dataset.pointRadius ?? 3,
            ...dataset
          };
        });

      const defaultRadarOptions = {
        scales: {
          r: {
            beginAtZero: true,
            min: 0,
            max:
              options.max ?? 100,
            ticks: {
              display:
                options.showTicks === true,
              stepSize:
                options.stepSize || 20,
              backdropColor:
                "transparent",
              color:
                this.getMutedColor()
            },
            angleLines: {
              color:
                this.getGridColor()
            },
            grid: {
              color:
                this.getGridColor()
            },
            pointLabels: {
              color:
                this.getTextColor(),
              font: {
                size: 12,
                weight: "600"
              }
            }
          }
        }
      };

      return this.create(id, {
        type: "radar",
        data: {
          labels:
            this.normalizeLabels(labels),
          datasets
        },
        options:
          this.mergeOptions(
            this.defaultOptions(
              title,
              defaultRadarOptions
            ),
            options.chartOptions || {}
          )
      });
    },

    /* =========================================================
       GAUGE CHART
    ========================================================= */

    gauge(
      id,
      percent,
      options = {}
    ) {
      const value =
        this.clamp(percent);

      const remaining =
        100 - value;

      const statusColor =
        options.color ||
        this.getGaugeColor(value);

      const labels =
        options.labels || [
          options.progressLabel ||
            "Progress",
          options.remainingLabel ||
            "Remaining"
        ];

      return this.create(id, {
        type: "doughnut",
        data: {
          labels,
          datasets: [
            {
              data: [
                value,
                remaining
              ],
              borderWidth: 0,
              backgroundColor: [
                statusColor,
                options.remainingColor ||
                  this.colors.lightGray
              ],
              hoverOffset: 0,
              circumference:
                options.semiCircle
                  ? 180
                  : 360,
              rotation:
                options.semiCircle
                  ? -90
                  : 0
            }
          ]
        },
        options:
          this.circularOptions(
            options.title || "",
            {
              cutout:
                options.cutout ||
                "74%",
              plugins: {
                legend: {
                  display:
                    options.showLegend ===
                    true
                },
                tooltip: {
                  enabled:
                    options.showTooltip !==
                    false
                }
              },
              ...(options.chartOptions || {})
            }
          )
      });
    },

    getGaugeColor(value) {
      const percentage =
        this.clamp(value);

      if (percentage >= 75) {
        return this.colors.success;
      }

      if (percentage >= 50) {
        return this.colors.warning;
      }

      return this.colors.danger;
    },

    /* =========================================================
       HORIZONTAL BAR
    ========================================================= */

    horizontalBar(
      id,
      labels,
      data,
      title = "",
      options = {}
    ) {
      const chartOptions =
        this.defaultOptions(
          title,
          options.chartOptions || {}
        );

      chartOptions.indexAxis = "y";

      return this.bar(
        id,
        labels,
        data,
        title,
        {
          ...options,
          chartOptions
        }
      );
    },

    /* =========================================================
       MIXED CHART
    ========================================================= */

    mixed(
      id,
      labels,
      datasets = [],
      title = "",
      options = {}
    ) {
      const normalizedDatasets =
        this.toArray(datasets).map(
          (dataset, index) => {
            const color =
              dataset.borderColor ||
              this.palette[
                index %
                this.palette.length
              ];

            return {
              type:
                dataset.type ||
                "bar",
              label:
                dataset.label ||
                "",
              data:
                this.normalizeNumbers(
                  dataset.data
                ),
              borderColor: color,
              backgroundColor:
                dataset.backgroundColor ||
                (
                  dataset.type === "line"
                    ? this.hexToRGBA(
                        color,
                        0.12
                      )
                    : color
                ),
              borderWidth:
                dataset.borderWidth ??
                (
                  dataset.type === "line"
                    ? 3
                    : 0
                ),
              tension:
                dataset.tension ?? 0.35,
              fill:
                dataset.fill ??
                (
                  dataset.type === "line"
                ),
              borderRadius:
                dataset.borderRadius ??
                (
                  dataset.type === "bar"
                    ? 8
                    : 0
                ),
              ...dataset
            };
          }
        );

      return this.create(id, {
        type: "bar",
        data: {
          labels:
            this.normalizeLabels(labels),
          datasets:
            normalizedDatasets
        },
        options:
          this.defaultOptions(
            title,
            options.chartOptions || {}
          )
      });
    },

    /* =========================================================
       UPDATE EXISTING CHART
    ========================================================= */

    update(
      id,
      {
        labels,
        datasets,
        options
      } = {}
    ) {
      const chart =
        this.get(id);

      if (!chart) {
        return null;
      }

      if (labels) {
        chart.data.labels =
          this.normalizeLabels(labels);
      }

      if (datasets) {
        chart.data.datasets =
          this.toArray(datasets);
      }

      if (options) {
        chart.options =
          this.mergeOptions(
            chart.options,
            options
          );
      }

      try {
        chart.update();
        return chart;
      } catch (error) {
        console.warn(
          `[AIW.Charts] Unable to update chart "${id}":`,
          error
        );

        return null;
      }
    },

    resizeAll() {
      Object.values(
        this.charts
      ).forEach(chart => {
        try {
          chart.resize();
        } catch (error) {
          // Ignore charts removed from DOM.
        }
      });
    },

    /* =========================================================
       COLOR HELPERS
    ========================================================= */

    hexToRGBA(hex, alpha = 1) {
      const normalizedHex =
        String(hex || "")
          .replace("#", "")
          .trim();

      if (
        !/^[0-9a-f]{6}$/i.test(
          normalizedHex
        )
      ) {
        return `rgba(37,99,235,${alpha})`;
      }

      const red =
        parseInt(
          normalizedHex.slice(0, 2),
          16
        );

      const green =
        parseInt(
          normalizedHex.slice(2, 4),
          16
        );

      const blue =
        parseInt(
          normalizedHex.slice(4, 6),
          16
        );

      return `rgba(${red},${green},${blue},${alpha})`;
    },

    /* =========================================================
       EVENTS AND LIFECYCLE
    ========================================================= */

    bindEvents() {
      if (this._eventsBound) {
        return;
      }

      this._eventsBound = true;

      window.addEventListener(
        "resize",
        () => {
          window.clearTimeout(
            this._resizeTimer
          );

          this._resizeTimer =
            window.setTimeout(() => {
              this.resizeAll();
            }, 120);
        }
      );

      window.addEventListener(
        "aiw:settingsChanged",
        () => {
          this.refreshTheme();
        }
      );

      window.addEventListener(
        "aiw:settingsUpdated",
        () => {
          this.refreshTheme();
        }
      );

      window.addEventListener(
        "aiw:routeChanged",
        event => {
          const previousRoute =
            event?.detail?.previousRoute;

          if (!previousRoute) {
            return;
          }

          this.removeDetachedCharts();
        }
      );

      window.addEventListener(
        "aiw:moduleRendered",
        () => {
          this.removeDetachedCharts();
        }
      );
    },

    removeDetachedCharts() {
      Object.keys(
        this.charts
      ).forEach(id => {
        const canvas =
          document.getElementById(id);

        if (
          !canvas ||
          !document.body.contains(canvas)
        ) {
          this.destroy(id);
        }
      });
    },

    refreshTheme() {
      Object.values(
        this.charts
      ).forEach(chart => {
        try {
          const options =
            chart.options;

          if (
            options.plugins?.title
          ) {
            options.plugins.title.color =
              this.getTextColor();
          }

          if (
            options.plugins?.legend
              ?.labels
          ) {
            options.plugins.legend.labels.color =
              this.getMutedColor();
          }

          if (
            options.scales?.x?.ticks
          ) {
            options.scales.x.ticks.color =
              this.getMutedColor();
          }

          if (
            options.scales?.y?.ticks
          ) {
            options.scales.y.ticks.color =
              this.getMutedColor();
          }

          if (
            options.scales?.y?.grid
          ) {
            options.scales.y.grid.color =
              this.getGridColor();
          }

          if (
            options.scales?.r
          ) {
            options.scales.r.grid.color =
              this.getGridColor();

            options.scales.r.angleLines.color =
              this.getGridColor();

            options.scales.r.pointLabels.color =
              this.getTextColor();
          }

          chart.update("none");
        } catch (error) {
          // Ignore charts no longer available.
        }
      });
    },

    emit(name, detail = {}) {
      try {
        window.dispatchEvent(
          new CustomEvent(name, {
            detail
          })
        );
      } catch (error) {
        console.warn(
          `[AIW.Charts] Event "${name}" failed:`,
          error
        );
      }
    },

    registerMetadata() {
      const store =
        window.AIW?.Store;

      if (
        !store ||
        typeof store.setMetadata !==
          "function"
      ) {
        return;
      }

      try {
        store.setMetadata({
          chartsVersion:
            this.version,
          chartsEngine:
            "Chart.js Enterprise Wrapper",
          chartLibraryAvailable:
            this.isAvailable(),
          lastChartsInitialization:
            new Date().toISOString()
        });
      } catch (error) {
        console.warn(
          "[AIW.Charts] Metadata registration skipped:",
          error
        );
      }
    },

    /* =========================================================
       CLEANUP
    ========================================================= */

    destroyEngine() {
      window.clearTimeout(
        this._resizeTimer
      );

      this.destroyAll();

      this._initialized = false;
    }
  };

  /* =========================================================
     GLOBAL REFERENCE
  ========================================================= */

  AIW.Charts = Charts;

  /* =========================================================
     BOOTSTRAP
  ========================================================= */

  const bootstrap = () => {
    AIW.Charts.init();
  };

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      bootstrap,
      {
        once: true
      }
    );
  } else {
    bootstrap();
  }
})();