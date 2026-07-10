/* =========================================================
   AI Work - Export Engine V2.1
   Enterprise Data + Report Export Center

   Scope:
   - AIW.Store Integration
   - JSON Export
   - Full Backup Export
   - Collection Export
   - CSV Export
   - Executive Report Export
   - Decision Report Export
   - Print / Save as PDF
   - Safe File Naming
   - Export History
   - Notifications Integration
   - Legacy ATCExport Compatibility
========================================================= */

(function () {
  "use strict";

  window.AIW = window.AIW || {};

  const ExportEngine = {
    id: "export-engine",
    version: "2.1.0",

    _initialized: false,
    _eventsBound: false,

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

      this.emit(
        "aiw:exportEngineReady",
        {
          version: this.version,
          generatedAt: this.now()
        }
      );

      return this;
    },

    /* =========================================================
       ENGINE ACCESS
    ========================================================= */

    getStore() {
      return window.AIW?.Store || null;
    },

    getNotifications() {
      return (
        window.AIW?.Notifications ||
        window.ATCNotifications ||
        null
      );
    },

    getAnalytics() {
      return window.AIW?.Analytics || null;
    },

    getAIEngine() {
      return (
        window.AIW?.AIEngine ||
        window.AIW?.AI ||
        null
      );
    },

    getDecisionEngine() {
      return (
        window.AIW?.DecisionEngine ||
        window.ATCDecisionEngine ||
        null
      );
    },

    getRecommendationEngine() {
      return (
        window.AIW?.RecommendationEngine ||
        window.ATCRecommendationEngine ||
        null
      );
    },

    getData() {
      const store = this.getStore();

      try {
        if (
          store &&
          typeof store.getState === "function"
        ) {
          return store.getState();
        }

        if (
          store &&
          typeof store.getData === "function"
        ) {
          return store.getData();
        }

        if (
          window.ATCStore &&
          typeof window.ATCStore.getState ===
            "function"
        ) {
          return window.ATCStore.getState();
        }
      } catch (error) {
        console.warn(
          "[AIW.Export] Unable to read platform data:",
          error
        );
      }

      return window.AIW?.Data || {};
    },

    getSettings() {
      const store = this.getStore();

      try {
        if (
          store &&
          typeof store.getSettings === "function"
        ) {
          return store.getSettings();
        }
      } catch (error) {
        console.warn(
          "[AIW.Export] Unable to read platform settings:",
          error
        );
      }

      return {};
    },

    /* =========================================================
       GENERAL HELPERS
    ========================================================= */

    now() {
      return new Date().toISOString();
    },

    clone(value) {
      if (value === undefined) {
        return undefined;
      }

      try {
        return structuredClone(value);
      } catch (error) {
        try {
          return JSON.parse(
            JSON.stringify(value)
          );
        } catch (cloneError) {
          return value;
        }
      }
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

    normalizeFileName(
      name = "aiw-export"
    ) {
      const cleaned = String(name || "")
        .trim()
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      return cleaned || "aiw-export";
    },

    getDateStamp() {
      const date = new Date();

      const year = date.getFullYear();

      const month = String(
        date.getMonth() + 1
      ).padStart(2, "0");

      const day = String(
        date.getDate()
      ).padStart(2, "0");

      const hours = String(
        date.getHours()
      ).padStart(2, "0");

      const minutes = String(
        date.getMinutes()
      ).padStart(2, "0");

      return `${year}-${month}-${day}_${hours}-${minutes}`;
    },

    appendExtension(
      fileName,
      extension
    ) {
      const normalizedName =
        this.normalizeFileName(fileName);

      const normalizedExtension =
        String(extension || "")
          .replace(/^\./, "")
          .toLowerCase();

      if (
        normalizedName
          .toLowerCase()
          .endsWith(
            `.${normalizedExtension}`
          )
      ) {
        return normalizedName;
      }

      return `${normalizedName}.${normalizedExtension}`;
    },

    escapeHTML(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },

    /* =========================================================
       FILE DOWNLOAD
    ========================================================= */

    downloadBlob(
      content,
      fileName,
      mimeType =
        "application/octet-stream"
    ) {
      try {
        const blob =
          content instanceof Blob
            ? content
            : new Blob(
                [content],
                {
                  type: mimeType
                }
              );

        const url =
          URL.createObjectURL(blob);

        const link =
          document.createElement("a");

        link.href = url;
        link.download = fileName;
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);

        return true;
      } catch (error) {
        console.error(
          "[AIW.Export] File download failed:",
          error
        );

        this.notify(
          "error",
          "تعذر تصدير الملف."
        );

        return false;
      }
    },

    /* =========================================================
       JSON EXPORT
    ========================================================= */

    exportJSON(
      name = "aiw-platform-data",
      options = {}
    ) {
      try {
        const data =
          options.data !== undefined
            ? options.data
            : this.getData();

        const payload =
          options.raw === true
            ? data
            : {
                exportedAt:
                  this.now(),

                app:
                  data?.meta?.app ||
                  "Enterprise Biometric Intelligence Platform",

                version:
                  this.version,

                data:
                  this.clone(data)
              };

        const fileName =
          this.appendExtension(
            options.includeDate === false
              ? name
              : `${name}-${this.getDateStamp()}`,
            "json"
          );

        const success =
          this.downloadBlob(
            JSON.stringify(
              payload,
              null,
              2
            ),
            fileName,
            "application/json;charset=utf-8"
          );

        if (success) {
          this.recordExport({
            type: "json",
            fileName,
            source:
              options.source ||
              "platform-data"
          });

          this.notify(
            "success",
            "تم تصدير البيانات بصيغة JSON بنجاح."
          );

          this.emit(
            "aiw:dataExported",
            {
              type: "json",
              fileName
            }
          );
        }

        return success;
      } catch (error) {
        console.error(
          "[AIW.Export] JSON export failed:",
          error
        );

        this.notify(
          "error",
          "تعذر تصدير بيانات JSON."
        );

        return false;
      }
    },

    /* =========================================================
       FULL BACKUP EXPORT
    ========================================================= */

    exportBackup(
      name = "aiw-platform-backup"
    ) {
      const store = this.getStore();

      let payload;

      try {
        if (
          store &&
          typeof store.exportData === "function"
        ) {
          payload = store.exportData();
        } else {
          payload = {
            exportedAt: this.now(),
            version: this.version,
            data: this.getData(),
            settings: this.getSettings()
          };
        }

        payload.exportType =
          "full-backup";

        payload.exportEngineVersion =
          this.version;

        const fileName =
          this.appendExtension(
            `${name}-${this.getDateStamp()}`,
            "json"
          );

        const success =
          this.downloadBlob(
            JSON.stringify(
              payload,
              null,
              2
            ),
            fileName,
            "application/json;charset=utf-8"
          );

        if (success) {
          this.recordExport({
            type: "backup",
            fileName,
            source: "full-platform"
          });

          this.notify(
            "success",
            "تم إنشاء نسخة احتياطية كاملة للمنصة."
          );

          this.emit(
            "aiw:backupExported",
            {
              fileName,
              exportedAt:
                payload.exportedAt
            }
          );
        }

        return success;
      } catch (error) {
        console.error(
          "[AIW.Export] Backup export failed:",
          error
        );

        this.notify(
          "error",
          "تعذر إنشاء النسخة الاحتياطية."
        );

        return false;
      }
    },

    /* =========================================================
       COLLECTION EXPORT
    ========================================================= */

    exportCollection(
      collection,
      options = {}
    ) {
      const store = this.getStore();

      let items = [];

      try {
        if (
          store &&
          typeof store.getCollection ===
            "function"
        ) {
          items =
            store.getCollection(collection);
        } else {
          items =
            this.toArray(
              this.getData()?.[collection]
            ).filter(
              item => !item?.deletedAt
            );
        }
      } catch (error) {
        console.warn(
          `[AIW.Export] Unable to read collection "${collection}":`,
          error
        );
      }

      if (!items.length) {
        this.notify(
          "info",
          "لا توجد بيانات في هذا القسم للتصدير."
        );

        return false;
      }

      const format =
        String(
          options.format || "json"
        ).toLowerCase();

      const name =
        options.name ||
        `aiw-${collection}`;

      if (format === "csv") {
        return this.exportCSV(
          name,
          items,
          options
        );
      }

      return this.exportJSON(
        name,
        {
          data: {
            collection,
            count: items.length,
            items
          },
          source: collection,
          includeDate:
            options.includeDate !== false
        }
      );
    },

    /* =========================================================
       CSV EXPORT
    ========================================================= */

    exportCSV(
      name = "aiw-export",
      rows = [],
      options = {}
    ) {
      const data =
        this.toArray(rows);

      if (!data.length) {
        this.notify(
          "info",
          "لا توجد بيانات لتصديرها بصيغة CSV."
        );

        return false;
      }

      try {
        const columns =
          options.columns ||
          this.getCSVColumns(data);

        if (!columns.length) {
          this.notify(
            "error",
            "تعذر تحديد أعمدة ملف CSV."
          );

          return false;
        }

        const headers =
          columns.map(column =>
            typeof column === "object"
              ? column.label ||
                column.title ||
                column.key
              : column
          );

        const keys =
          columns.map(column =>
            typeof column === "object"
              ? column.key
              : column
          );

        const lines = [
          headers
            .map(value =>
              this.escapeCSVValue(value)
            )
            .join(",")
        ];

        data.forEach(row => {
          const values =
            keys.map(key =>
              this.escapeCSVValue(
                this.getByPath(
                  row,
                  key
                )
              )
            );

          lines.push(
            values.join(",")
          );
        });

        const csvContent =
          `\uFEFF${lines.join("\r\n")}`;

        const fileName =
          this.appendExtension(
            options.includeDate === false
              ? name
              : `${name}-${this.getDateStamp()}`,
            "csv"
          );

        const success =
          this.downloadBlob(
            csvContent,
            fileName,
            "text/csv;charset=utf-8"
          );

        if (success) {
          this.recordExport({
            type: "csv",
            fileName,
            count: data.length,
            source:
              options.source ||
              name
          });

          this.notify(
            "success",
            "تم تصدير البيانات بصيغة CSV بنجاح."
          );

          this.emit(
            "aiw:dataExported",
            {
              type: "csv",
              fileName,
              count: data.length
            }
          );
        }

        return success;
      } catch (error) {
        console.error(
          "[AIW.Export] CSV export failed:",
          error
        );

        this.notify(
          "error",
          "تعذر تصدير ملف CSV."
        );

        return false;
      }
    },

    getCSVColumns(rows = []) {
      const keys = new Set();

      rows.forEach(row => {
        if (
          row &&
          typeof row === "object"
        ) {
          Object.keys(row).forEach(key => {
            const value = row[key];

            if (
              value === null ||
              value === undefined ||
              typeof value !== "object"
            ) {
              keys.add(key);
            }
          });
        }
      });

      return Array.from(keys);
    },

    escapeCSVValue(value) {
      if (
        value === null ||
        value === undefined
      ) {
        return '""';
      }

      let text;

      if (typeof value === "object") {
        text = JSON.stringify(value);
      } else {
        text = String(value);
      }

      text = text.replace(/"/g, '""');

      return `"${text}"`;
    },

    getByPath(source, path) {
      if (!path) {
        return source;
      }

      return String(path)
        .split(".")
        .filter(Boolean)
        .reduce(
          (current, key) =>
            current === undefined ||
            current === null
              ? undefined
              : current[key],
          source
        );
    },

    /* =========================================================
       EXECUTIVE REPORT EXPORT
    ========================================================= */

    generateExecutiveReportData() {
      const analytics =
        this.getAnalytics();

      const aiEngine =
        this.getAIEngine();

      const decisionEngine =
        this.getDecisionEngine();

      const recommendationEngine =
        this.getRecommendationEngine();

      const analyticsSnapshot =
        analytics &&
        typeof analytics.getSnapshot ===
          "function"
          ? analytics.getSnapshot({
              fresh: true
            })
          : null;

      const aiReport =
        aiEngine &&
        typeof aiEngine.generateExecutiveReport ===
          "function"
          ? aiEngine.generateExecutiveReport()
          : null;

      const decisionSnapshot =
        decisionEngine &&
        typeof decisionEngine.getSnapshot ===
          "function"
          ? decisionEngine.getSnapshot({
              fresh: true
            })
          : null;

      const recommendationSnapshot =
        recommendationEngine &&
        typeof recommendationEngine.getSnapshot ===
          "function"
          ? recommendationEngine.getSnapshot({
              fresh: true
            })
          : null;

      const data = this.getData();

      return {
        reportTitle:
          "Enterprise Biometric Intelligence Platform",

        subtitle:
          "Executive Intelligence Report",

        generatedAt:
          this.now(),

        platformVersion:
          data?.meta?.version ||
          "2.1.0",

        executiveSummary:
          aiReport ||
          analyticsSnapshot?.executiveSummary ||
          null,

        analytics:
          analyticsSnapshot,

        decisions:
          decisionSnapshot,

        recommendations:
          recommendationSnapshot,

        platformData: {
          ideas:
            this.toArray(
              data.ideas
            ).filter(
              item => !item?.deletedAt
            ).length,

          projects:
            this.toArray(
              data.projects?.length
                ? data.projects
                : data.flagshipProjects
            ).filter(
              item => !item?.deletedAt
            ).length,

          departments:
            this.toArray(
              data.departments
            ).filter(
              item => !item?.deletedAt
            ).length,

          risks:
            this.toArray(
              data.risks
            ).filter(
              item => !item?.deletedAt
            ).length,

          kpis:
            this.toArray(
              data.kpis
            ).filter(
              item => !item?.deletedAt
            ).length,

          governance:
            this.toArray(
              data.governance
            ).filter(
              item => !item?.deletedAt
            ).length
        }
      };
    },

    exportExecutiveReport(
      name = "aiw-executive-report",
      options = {}
    ) {
      const report =
        this.generateExecutiveReportData();

      if (
        options.format === "json"
      ) {
        return this.exportJSON(
          name,
          {
            data: report,
            source:
              "executive-report"
          }
        );
      }

      return this.exportReportHTML(
        report,
        name,
        options
      );
    },

    /* =========================================================
       DECISION REPORT
    ========================================================= */

    exportDecisionReport(
      evaluation,
      name = "aiw-decision-report",
      options = {}
    ) {
      if (!evaluation) {
        this.notify(
          "error",
          "لا توجد نتيجة قرار لتصديرها."
        );

        return false;
      }

      const report = {
        reportTitle:
          "Decision Intelligence Report",

        generatedAt:
          this.now(),

        evaluation:
          this.clone(evaluation)
      };

      if (
        options.format === "json"
      ) {
        return this.exportJSON(
          name,
          {
            data: report,
            source:
              "decision-report"
          }
        );
      }

      return this.exportReportHTML(
        report,
        name,
        {
          ...options,
          reportType:
            "decision"
        }
      );
    },

    /* =========================================================
       HTML REPORT EXPORT
    ========================================================= */

    exportReportHTML(
      report,
      name,
      options = {}
    ) {
      try {
        const html =
          options.reportType ===
          "decision"
            ? this.buildDecisionReportHTML(
                report
              )
            : this.buildExecutiveReportHTML(
                report
              );

        const fileName =
          this.appendExtension(
            `${name}-${this.getDateStamp()}`,
            "html"
          );

        const success =
          this.downloadBlob(
            html,
            fileName,
            "text/html;charset=utf-8"
          );

        if (success) {
          this.recordExport({
            type:
              options.reportType ===
              "decision"
                ? "decision-report"
                : "executive-report",

            fileName,

            source:
              options.reportType ||
              "executive"
          });

          this.notify(
            "success",
            "تم تصدير التقرير التنفيذي بنجاح."
          );

          this.emit(
            "aiw:reportExported",
            {
              fileName,
              reportType:
                options.reportType ||
                "executive"
            }
          );
        }

        return success;
      } catch (error) {
        console.error(
          "[AIW.Export] Report export failed:",
          error
        );

        this.notify(
          "error",
          "تعذر تصدير التقرير."
        );

        return false;
      }
    },

    buildExecutiveReportHTML(report) {
      const summary =
        report.executiveSummary || {};

      const analytics =
        report.analytics || {};

      const scores =
        summary.scores ||
        analytics.scores ||
        {};

      const recommendations =
        summary.recommendations ||
        report.recommendations
          ?.recommendations ||
        analytics.recommendations ||
        [];

      const nextActions =
        summary.nextActions ||
        [];

      return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>
            Executive Intelligence Report
          </title>

          <style>
            :root {
              color-scheme: light;
              font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                Tahoma,
                Arial,
                sans-serif;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 40px;
              color: #101828;
              background: #f8fafc;
              line-height: 1.7;
            }

            .report {
              max-width: 1100px;
              margin: 0 auto;
            }

            .hero,
            .panel,
            .metric {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 20px;
            }

            .hero {
              padding: 34px;
              margin-bottom: 24px;
            }

            .hero small {
              color: #2563eb;
              font-weight: 700;
            }

            .hero h1 {
              margin: 10px 0 8px;
              font-size: 32px;
            }

            .hero p {
              margin: 0;
              color: #64748b;
            }

            .metrics {
              display: grid;
              grid-template-columns:
                repeat(4, minmax(0, 1fr));
              gap: 14px;
              margin-bottom: 24px;
            }

            .metric {
              padding: 20px;
            }

            .metric span {
              display: block;
              color: #64748b;
              font-size: 13px;
            }

            .metric strong {
              display: block;
              margin-top: 8px;
              font-size: 26px;
            }

            .panel {
              padding: 26px;
              margin-bottom: 20px;
            }

            .panel h2 {
              margin-top: 0;
            }

            .item {
              padding: 14px 0;
              border-bottom: 1px solid #eef2f7;
            }

            .item:last-child {
              border-bottom: 0;
            }

            .item strong {
              display: block;
            }

            .item p {
              margin: 4px 0 0;
              color: #64748b;
            }

            .footer {
              text-align: center;
              color: #64748b;
              padding: 24px 0;
            }

            @media print {
              body {
                padding: 0;
                background: #ffffff;
              }

              .hero,
              .panel,
              .metric {
                break-inside: avoid;
              }
            }

            @media (max-width: 760px) {
              body {
                padding: 18px;
              }

              .metrics {
                grid-template-columns:
                  repeat(2, minmax(0, 1fr));
              }
            }
          </style>
        </head>

        <body>
          <main class="report">
            <section class="hero">
              <small>
                Executive Intelligence Report
              </small>

              <h1>
                ${this.escapeHTML(
                  report.reportTitle
                )}
              </h1>

              <p>
                تم إنشاء التقرير في
                ${this.escapeHTML(
                  this.formatDate(
                    report.generatedAt
                  )
                )}
              </p>
            </section>

            <section class="metrics">
              ${this.renderReportMetric(
                "الدرجة التنفيذية",
                summary.score ??
                scores.executiveScore ??
                0
              )}

              ${this.renderReportMetric(
                "النضج",
                scores.maturityScore ??
                0,
                "%"
              )}

              ${this.renderReportMetric(
                "صحة المحفظة",
                scores.portfolioScore ??
                0,
                "%"
              )}

              ${this.renderReportMetric(
                "سلامة المخاطر",
                scores.riskScore ??
                0,
                "%"
              )}

              ${this.renderReportMetric(
                "الفرص",
                report.platformData
                  ?.ideas ?? 0
              )}

              ${this.renderReportMetric(
                "المشاريع",
                report.platformData
                  ?.projects ?? 0
              )}

              ${this.renderReportMetric(
                "المؤشرات",
                report.platformData
                  ?.kpis ?? 0
              )}

              ${this.renderReportMetric(
                "ضوابط الحوكمة",
                report.platformData
                  ?.governance ?? 0
              )}
            </section>

            <section class="panel">
              <h2>
                الخلاصة التنفيذية
              </h2>

              <p>
                ${this.escapeHTML(
                  summary.message ||
                  analytics
                    ?.executiveSummary
                    ?.message ||
                  "لا توجد خلاصة تنفيذية متاحة."
                )}
              </p>
            </section>

            <section class="panel">
              <h2>
                التوصيات التنفيذية
              </h2>

              ${
                this.toArray(
                  recommendations
                ).length
                  ? this.toArray(
                      recommendations
                    )
                      .map(item =>
                        this.renderReportItem(
                          typeof item ===
                            "string"
                            ? "توصية"
                            : item.title ||
                              "توصية",

                          typeof item ===
                            "string"
                            ? item
                            : item.text ||
                              item.description ||
                              ""
                        )
                      )
                      .join("")
                  : this.renderReportItem(
                      "لا توجد توصيات",
                      "لم يتم إنشاء توصيات إضافية."
                    )
              }
            </section>

            <section class="panel">
              <h2>
                الإجراءات التالية
              </h2>

              ${
                this.toArray(
                  nextActions
                ).length
                  ? this.toArray(
                      nextActions
                    )
                      .map(item =>
                        this.renderReportItem(
                          item.title ||
                          "إجراء تنفيذي",

                          item.description ||
                          item.text ||
                          ""
                        )
                      )
                      .join("")
                  : this.renderReportItem(
                      "المتابعة",
                      "استمرار متابعة المؤشرات والمخاطر والمشاريع."
                    )
              }
            </section>

            <footer class="footer">
              <div>
                Enterprise Biometric Intelligence Platform
              </div>

              <strong>
                Designed &amp; Developed by يوسف الحوسني
              </strong>
            </footer>
          </main>
        </body>
        </html>
      `;
    },

    buildDecisionReportHTML(report) {
      const evaluation =
        report.evaluation || {};

      return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>
            Decision Intelligence Report
          </title>

          <style>
            body {
              margin: 0;
              padding: 40px;
              color: #101828;
              background: #f8fafc;
              font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                Tahoma,
                Arial,
                sans-serif;
              line-height: 1.7;
            }

            main {
              max-width: 950px;
              margin: 0 auto;
            }

            section {
              padding: 26px;
              margin-bottom: 20px;
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 20px;
            }

            h1,
            h2 {
              margin-top: 0;
            }

            .score {
              font-size: 48px;
              font-weight: 800;
              color: #2563eb;
            }

            .item {
              padding: 12px 0;
              border-bottom: 1px solid #eef2f7;
            }

            .item:last-child {
              border-bottom: 0;
            }

            .item strong {
              display: block;
            }

            .item p {
              margin: 4px 0 0;
              color: #64748b;
            }

            footer {
              text-align: center;
              color: #64748b;
              padding: 24px 0;
            }

            @media print {
              body {
                padding: 0;
                background: #ffffff;
              }

              section {
                break-inside: avoid;
              }
            }
          </style>
        </head>

        <body>
          <main>
            <section>
              <small>
                Decision Intelligence Report
              </small>

              <h1>
                ${this.escapeHTML(
                  evaluation.title ||
                  "قرار تنفيذي"
                )}
              </h1>

              <div class="score">
                ${this.escapeHTML(
                  evaluation.score ?? 0
                )}%
              </div>

              <strong>
                ${this.escapeHTML(
                  evaluation.decisionLabel ||
                  evaluation.recommendationAr ||
                  evaluation.decision ||
                  "غير محدد"
                )}
              </strong>

              <p>
                ${this.escapeHTML(
                  evaluation.rationale ||
                  ""
                )}
              </p>
            </section>

            <section>
              <h2>
                عوامل التقييم
              </h2>

              ${
                this.toArray(
                  evaluation.factors
                ).length
                  ? this.toArray(
                      evaluation.factors
                    )
                      .map(factor =>
                        this.renderReportItem(
                          factor.label ||
                          factor.key,

                          `${factor.score ?? 0}% · الوزن ${factor.weight ?? 0}`
                        )
                      )
                      .join("")
                  : this.renderReportItem(
                      "لا توجد عوامل",
                      "لم يتم تسجيل عوامل تقييم."
                    )
              }
            </section>

            <section>
              <h2>
                العوائق
              </h2>

              ${
                this.toArray(
                  evaluation.blockers
                ).length
                  ? this.toArray(
                      evaluation.blockers
                    )
                      .map(item =>
                        this.renderReportItem(
                          item.title ||
                          item.code,

                          item.description ||
                          ""
                        )
                      )
                      .join("")
                  : this.renderReportItem(
                      "لا توجد عوائق",
                      "لم يتم رصد عوائق أساسية."
                    )
              }
            </section>

            <section>
              <h2>
                الإجراءات التالية
              </h2>

              ${
                this.toArray(
                  evaluation.nextActions
                ).length
                  ? this.toArray(
                      evaluation.nextActions
                    )
                      .map(item =>
                        this.renderReportItem(
                          item.title ||
                          "إجراء",

                          item.route
                            ? `المركز المرتبط: ${item.route}`
                            : ""
                        )
                      )
                      .join("")
                  : this.renderReportItem(
                      "المتابعة",
                      "لا توجد إجراءات إضافية مسجلة."
                    )
              }
            </section>

            <footer>
              <div>
                Enterprise Biometric Intelligence Platform
              </div>

              <strong>
                Designed &amp; Developed by يوسف الحوسني
              </strong>
            </footer>
          </main>
        </body>
        </html>
      `;
    },

    renderReportMetric(
      label,
      value,
      suffix = ""
    ) {
      return `
        <article class="metric">
          <span>
            ${this.escapeHTML(label)}
          </span>

          <strong>
            ${this.escapeHTML(value)}${this.escapeHTML(
              suffix
            )}
          </strong>
        </article>
      `;
    },

    renderReportItem(
      title,
      text
    ) {
      return `
        <div class="item">
          <strong>
            ${this.escapeHTML(title)}
          </strong>

          ${
            text
              ? `
                <p>
                  ${this.escapeHTML(text)}
                </p>
              `
              : ""
          }
        </div>
      `;
    },

    /* =========================================================
       PRINT AND PDF
    ========================================================= */

    printPage(options = {}) {
      try {
        this.emit(
          "aiw:printStarted",
          {
            route:
              window.AIW?.App
                ?.getCurrentRoute?.() ||
              window.location.hash
                .replace(/^#/, "") ||
              "dashboard",

            generatedAt:
              this.now()
          }
        );

        if (
          options.title
        ) {
          const originalTitle =
            document.title;

          document.title =
            options.title;

          window.print();

          window.setTimeout(() => {
            document.title =
              originalTitle;
          }, 500);
        } else {
          window.print();
        }

        return true;
      } catch (error) {
        console.error(
          "[AIW.Export] Print failed:",
          error
        );

        this.notify(
          "error",
          "تعذر فتح نافذة الطباعة."
        );

        return false;
      }
    },

    exportPDF(options = {}) {
      const result =
        this.printPage({
          title:
            options.title ||
            document.title
        });

      if (result) {
        this.notify(
          "info",
          "اختر Save as PDF من نافذة الطباعة لحفظ الملف."
        );

        this.recordExport({
          type: "pdf-print",
          fileName:
            options.name ||
            document.title,
          source:
            options.source ||
            "current-page"
        });

        this.emit(
          "aiw:pdfExportRequested",
          {
            title:
              options.title ||
              document.title,

            generatedAt:
              this.now()
          }
        );
      }

      return result;
    },

    printElement(
      elementOrSelector,
      options = {}
    ) {
      const element =
        typeof elementOrSelector ===
        "string"
          ? document.querySelector(
              elementOrSelector
            )
          : elementOrSelector;

      if (!element) {
        this.notify(
          "error",
          "تعذر العثور على القسم المطلوب طباعته."
        );

        return false;
      }

      const printWindow =
        window.open(
          "",
          "_blank",
          "width=1000,height=800"
        );

      if (!printWindow) {
        this.notify(
          "error",
          "تعذر فتح نافذة الطباعة. تحقق من إعدادات النوافذ المنبثقة."
        );

        return false;
      }

      const styles = Array.from(
        document.querySelectorAll(
          'link[rel="stylesheet"], style'
        )
      )
        .map(node =>
          node.outerHTML
        )
        .join("\n");

      printWindow.document.write(`
        <!DOCTYPE html>
        <html
          lang="${document.documentElement.lang || "ar"}"
          dir="${document.documentElement.dir || "rtl"}"
        >
        <head>
          <meta charset="UTF-8" />

          <title>
            ${this.escapeHTML(
              options.title ||
              document.title
            )}
          </title>

          ${styles}

          <style>
            body {
              padding: 24px;
              background: #ffffff;
            }

            .module-page {
              max-width: 1200px;
              margin: 0 auto;
            }
          </style>
        </head>

        <body>
          ${element.outerHTML}

          <script>
            window.addEventListener(
              "load",
              function () {
                window.print();
              }
            );
          <\/script>
        </body>
        </html>
      `);

      printWindow.document.close();

      return true;
    },

    /* =========================================================
       EXPORT HISTORY
    ========================================================= */

    recordExport(record = {}) {
      const store = this.getStore();

      const exportRecord = {
        id:
          record.id ||
          `export-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

        type:
          record.type ||
          "unknown",

        fileName:
          record.fileName ||
          "—",

        source:
          record.source ||
          "platform",

        count:
          record.count ??
          null,

        status:
          "completed",

        createdAt:
          this.now(),

        engineVersion:
          this.version
      };

      try {
        if (
          store &&
          typeof store.get === "function" &&
          typeof store.set === "function"
        ) {
          const history =
            this.toArray(
              store.get(
                "exportHistory",
                []
              )
            );

          history.unshift(
            exportRecord
          );

          store.set(
            "exportHistory",
            history.slice(0, 100),
            {
              eventName:
                "aiw:exportHistoryUpdated",

              backup: false,
              notify: false
            }
          );
        }
      } catch (error) {
        console.warn(
          "[AIW.Export] Export history was not saved:",
          error
        );
      }

      return exportRecord;
    },

    getExportHistory(limit = 20) {
      const store = this.getStore();

      try {
        if (
          store &&
          typeof store.get === "function"
        ) {
          return this.toArray(
            store.get(
              "exportHistory",
              []
            )
          ).slice(
            0,
            Math.max(
              0,
              Number(limit) || 20
            )
          );
        }
      } catch (error) {
        console.warn(
          "[AIW.Export] Unable to read export history:",
          error
        );
      }

      return [];
    },

    /* =========================================================
       EVENT ACTIONS
    ========================================================= */

    bindEvents() {
      if (this._eventsBound) {
        return;
      }

      this._eventsBound = true;

      window.addEventListener(
        "aiw:exportRequested",
        event => {
          const detail =
            event?.detail || {};

          const type =
            String(
              detail.type || "json"
            ).toLowerCase();

          if (type === "backup") {
            this.exportBackup(
              detail.name
            );

            return;
          }

          if (type === "csv") {
            this.exportCollection(
              detail.collection,
              {
                ...detail,
                format: "csv"
              }
            );

            return;
          }

          if (
            type ===
            "executive-report"
          ) {
            this.exportExecutiveReport(
              detail.name,
              detail
            );

            return;
          }

          if (type === "pdf") {
            this.exportPDF(detail);
            return;
          }

          this.exportJSON(
            detail.name,
            detail
          );
        }
      );

      window.addEventListener(
        "aiw:printRequested",
        event => {
          const detail =
            event?.detail || {};

          if (detail.selector) {
            this.printElement(
              detail.selector,
              detail
            );

            return;
          }

          this.printPage(detail);
        }
      );
    },

    /* =========================================================
       NOTIFICATIONS
    ========================================================= */

    notify(type, message) {
      const notifications =
        this.getNotifications();

      try {
        if (
          notifications &&
          typeof notifications[type] ===
            "function"
        ) {
          notifications[type](message);
          return;
        }

        if (
          notifications &&
          typeof notifications.add ===
            "function"
        ) {
          notifications.add({
            type,
            title:
              type === "success"
                ? "تمت العملية"
                : type === "error"
                  ? "تعذر إكمال العملية"
                  : "معلومة",
            message
          });

          return;
        }
      } catch (error) {
        console.warn(
          "[AIW.Export] Notification failed:",
          error
        );
      }

      if (type === "error") {
        console.error(
          `[AIW.Export] ${message}`
        );
      } else {
        console.info(
          `[AIW.Export] ${message}`
        );
      }
    },

    /* =========================================================
       DATE FORMAT
    ========================================================= */

    formatDate(value) {
      if (!value) {
        return "—";
      }

      const date = new Date(value);

      if (
        Number.isNaN(date.getTime())
      ) {
        return String(value);
      }

      try {
        return new Intl.DateTimeFormat(
          "ar-AE",
          {
            dateStyle: "medium",
            timeStyle: "short"
          }
        ).format(date);
      } catch (error) {
        return date.toLocaleString();
      }
    },

    /* =========================================================
       METADATA
    ========================================================= */

    registerMetadata() {
      const store = this.getStore();

      if (
        !store ||
        typeof store.setMetadata !==
          "function"
      ) {
        return;
      }

      try {
        store.setMetadata({
          exportEngineVersion:
            this.version,

          exportEngine:
            "Enterprise Data and Report Export Center",

          exportCapabilities: [
            "JSON Export",
            "CSV Export",
            "Full Backup",
            "Collection Export",
            "Executive Report",
            "Decision Report",
            "Print",
            "Save as PDF"
          ],

          lastExportEngineInitialization:
            this.now()
        });
      } catch (error) {
        console.warn(
          "[AIW.Export] Metadata registration skipped:",
          error
        );
      }
    },

    emit(name, detail = {}) {
      try {
        window.dispatchEvent(
          new CustomEvent(name, {
            detail:
              this.clone(detail)
          })
        );
      } catch (error) {
        console.warn(
          `[AIW.Export] Event "${name}" failed:`,
          error
        );
      }
    },

    /* =========================================================
       CLEANUP
    ========================================================= */

    destroy() {
      this._initialized = false;
    }
  };

  /* =========================================================
     GLOBAL REFERENCES
  ========================================================= */

  AIW.Export = ExportEngine;

  /*
   * Legacy compatibility:
   * Existing modules may still call ATCExport.
   */
  window.ATCExport = ExportEngine;

  /* =========================================================
     BOOTSTRAP
  ========================================================= */

  const bootstrap = () => {
    AIW.Export.init();
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