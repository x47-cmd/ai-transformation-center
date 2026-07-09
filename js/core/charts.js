/* =========================================================
   AI Work - Charts Engine V1.0 Final
   Enterprise Charts Framework
   (Chart.js Wrapper)
========================================================= */

window.AIW = window.AIW || {};

AIW.Charts = {

  charts: {},

  destroy(id) {
    if (this.charts[id]) {
      this.charts[id].destroy();
      delete this.charts[id];
    }
  },

  colors: {
    primary: "#2563eb",
    secondary: "#7c3aed",
    success: "#16a34a",
    warning: "#f59e0b",
    danger: "#dc2626",
    dark: "#101828",
    gray: "#94a3b8"
  },

  defaultOptions(title = "") {
    return {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
            usePointStyle: true,
            padding: 18
          }
        },

        title: {
          display: !!title,
          text: title,
          color: "#101828",
          font: {
            size: 16,
            weight: "700"
          }
        }
      },

      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(15,23,42,.06)"
          }
        },

        x: {
          grid: {
            display: false
          }
        }
      }
    };
  },

  bar(id, labels, data, title = "") {

    this.destroy(id);

    const ctx = document.getElementById(id);

    if (!ctx) return null;

    this.charts[id] = new Chart(ctx, {

      type: "bar",

      data: {
        labels,

        datasets: [{
          label: title,

          data,

          borderRadius: 10,

          backgroundColor: this.colors.primary
        }]
      },

      options: this.defaultOptions(title)
    });

    return this.charts[id];
  },

  line(id, labels, data, title = "") {

    this.destroy(id);

    const ctx = document.getElementById(id);

    if (!ctx) return null;

    this.charts[id] = new Chart({

      type: "line",

      data: {
        labels,

        datasets: [{

          label: title,

          data,

          tension: .35,

          fill: true,

          borderWidth: 3,

          borderColor: this.colors.primary,

          backgroundColor: "rgba(37,99,235,.12)",

          pointRadius: 4
        }]
      },

      options: this.defaultOptions(title)
    });

    return this.charts[id];
  },

  doughnut(id, labels, data, title = "") {

    this.destroy(id);

    const ctx = document.getElementById(id);

    if (!ctx) return null;

    this.charts[id] = new Chart(ctx, {

      type: "doughnut",

      data: {

        labels,

        datasets: [{

          data,

          borderWidth: 0,

          backgroundColor: [

            this.colors.primary,

            this.colors.secondary,

            this.colors.success,

            this.colors.warning,

            this.colors.danger,

            this.colors.gray
          ]
        }]
      },

      options: {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

          title: {
            display: !!title,
            text: title
          },

          legend: {
            position: "bottom"
          }
        }
      }

    });

    return this.charts[id];
  },

  radar(id, labels, data, title = "") {

    this.destroy(id);

    const ctx = document.getElementById(id);

    if (!ctx) return null;

    this.charts[id] = new Chart(ctx, {

      type: "radar",

      data: {

        labels,

        datasets: [{

          label: title,

          data,

          borderWidth: 3,

          borderColor: this.colors.primary,

          backgroundColor: "rgba(37,99,235,.15)"
        }]
      },

      options: {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

          legend: {
            position: "bottom"
          }
        },

        scales: {
          r: {
            beginAtZero: true,
            max: 100
          }
        }

      }

    });

    return this.charts[id];
  },

  gauge(id, percent) {

    return this.doughnut(

      id,

      ["Progress", "Remaining"],

      [percent, 100 - percent],

      ""
    );

  }

};