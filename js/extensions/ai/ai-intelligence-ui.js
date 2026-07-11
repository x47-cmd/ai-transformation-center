/* =========================================================
   AI Work - AI Intelligence UI V1.0
   Enterprise Biometric Intelligence Platform

   File Path:
   js/extensions/ai/ai-intelligence-ui.js

   Depends on:
   - ai-intelligence-core.js
   - project-ai-advisor.js
   - project-risk-intelligence.js
   - idea-ai-scoring.js
   - similarity-intelligence.js
   - executive-insights.js

   Purpose:
   - Displays AI intelligence without modifying core modules
   - Injects executive insights into Dashboard
   - Injects project intelligence into project details
   - Injects idea intelligence into idea details
   - Adds lightweight badges, panels, and refresh controls
   - Preserves the existing design and architecture
========================================================= */

(function bootstrapAIIntelligenceUI(global) {
  "use strict";

  global.AIW = global.AIW || {};

  const AIW = global.AIW;
  const VERSION = "1.0.0";
  const STYLE_ID = "aiw-ai-intelligence-ui-style";
  const ROOT_ATTRIBUTE = "data-aiw-ai-ui";
  const UI_EVENT = "aiw:ai-ui:updated";

  const runtime = {
    initialized: false,
    observer: null,
    unsubscribers: [],
    refreshTimer: null,
    lastRenderedAt: null,
    rendering: false
  };

  function getCore() {
    return AIW.AI || AIW.Engines?.aiIntelligence || null;
  }

  function safeText(value, fallback = "") {
    return String(value ?? fallback).trim();
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function clamp(value, min = 0, max = 100) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return min;
    return Math.min(max, Math.max(min, numeric));
  }

  function escapeHTML(value) {
    return safeText(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeText(value) {
    const core = getCore();

    if (core?.utils?.normalizeText) {
      return core.utils.normalizeText(value);
    }

    return safeText(value).toLowerCase();
  }

  function getStatusClass(level) {
    const normalized = safeText(level).toLowerCase();

    if (
      ["critical", "high", "ضعيف", "حرج", "immediate"].includes(normalized)
    ) {
      return "danger";
    }

    if (
      ["medium", "moderate", "warning", "متوسط"].includes(normalized)
    ) {
      return "warning";
    }

    if (
      ["excellent", "good", "low", "positive", "ممتاز", "جيد"].includes(normalized)
    ) {
      return "success";
    }

    return "neutral";
  }

  function formatPercent(value) {
    return `${Math.round(clamp(value))}%`;
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    try {
      return new Intl.DateTimeFormat("ar-AE", {
        year: "numeric",
        month: "short",
        day: "numeric"
      }).format(date);
    } catch (_) {
      return date.toLocaleDateString();
    }
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      [${ROOT_ATTRIBUTE}] {
        direction: rtl;
        margin-top: 18px;
      }

      .aiw-ai-shell {
        display: grid;
        gap: 14px;
      }

      .aiw-ai-card {
        border: 1px solid rgba(15, 23, 42, 0.10);
        background: rgba(255,255,255,0.88);
        border-radius: 18px;
        padding: 16px;
        box-shadow: 0 10px 30px rgba(15,23,42,0.06);
        backdrop-filter: blur(12px);
      }

      .aiw-ai-card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }

      .aiw-ai-card-title {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .aiw-ai-card-title strong {
        font-size: 15px;
        color: var(--text, #0f172a);
      }

      .aiw-ai-card-title small {
        display: block;
        margin-top: 2px;
        color: var(--muted, #64748b);
        font-size: 12px;
      }

      .aiw-ai-icon {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        border-radius: 12px;
        background: rgba(37,99,235,0.10);
        font-size: 18px;
        flex: 0 0 auto;
      }

      .aiw-ai-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 28px;
        padding: 4px 9px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        border: 1px solid transparent;
        white-space: nowrap;
      }

      .aiw-ai-badge.success {
        color: #166534;
        background: #dcfce7;
        border-color: #bbf7d0;
      }

      .aiw-ai-badge.warning {
        color: #92400e;
        background: #fef3c7;
        border-color: #fde68a;
      }

      .aiw-ai-badge.danger {
        color: #991b1b;
        background: #fee2e2;
        border-color: #fecaca;
      }

      .aiw-ai-badge.neutral {
        color: #334155;
        background: #f1f5f9;
        border-color: #e2e8f0;
      }

      .aiw-ai-metrics {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
      }

      .aiw-ai-metric {
        padding: 12px;
        border-radius: 14px;
        background: rgba(248,250,252,0.9);
        border: 1px solid rgba(148,163,184,0.18);
      }

      .aiw-ai-metric span {
        display: block;
        font-size: 11px;
        color: #64748b;
        margin-bottom: 4px;
      }

      .aiw-ai-metric strong {
        color: #0f172a;
        font-size: 19px;
        line-height: 1;
      }

      .aiw-ai-progress {
        height: 8px;
        border-radius: 999px;
        overflow: hidden;
        background: #e2e8f0;
        margin-top: 8px;
      }

      .aiw-ai-progress > i {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #2563eb, #06b6d4);
      }

      .aiw-ai-summary {
        margin: 0;
        color: #334155;
        line-height: 1.8;
        font-size: 13px;
      }

      .aiw-ai-list {
        display: grid;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .aiw-ai-list li {
        display: flex;
        align-items: flex-start;
        gap: 9px;
        padding: 10px 12px;
        border-radius: 12px;
        background: rgba(248,250,252,0.88);
        border: 1px solid rgba(148,163,184,0.14);
      }

      .aiw-ai-list li > b {
        color: #2563eb;
        line-height: 1.5;
      }

      .aiw-ai-list li div {
        min-width: 0;
      }

      .aiw-ai-list li strong {
        display: block;
        color: #0f172a;
        font-size: 12px;
        margin-bottom: 2px;
      }

      .aiw-ai-list li p {
        margin: 0;
        color: #64748b;
        font-size: 12px;
        line-height: 1.65;
      }

      .aiw-ai-section-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .aiw-ai-table {
        display: grid;
        gap: 8px;
      }

      .aiw-ai-table-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 12px;
        background: rgba(248,250,252,0.88);
      }

      .aiw-ai-table-row strong {
        color: #0f172a;
        font-size: 12px;
      }

      .aiw-ai-table-row span {
        color: #64748b;
        font-size: 11px;
      }

      .aiw-ai-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }

      .aiw-ai-button {
        border: 0;
        cursor: pointer;
        border-radius: 12px;
        padding: 9px 12px;
        font: inherit;
        font-size: 12px;
        font-weight: 700;
        color: white;
        background: #2563eb;
      }

      .aiw-ai-button.secondary {
        color: #334155;
        background: #e2e8f0;
      }

      .aiw-ai-note {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        color: #64748b;
        font-size: 11px;
        margin-top: 10px;
      }

      .aiw-ai-inline-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        margin-inline-start: 8px;
        padding: 3px 7px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 800;
        background: #eff6ff;
        color: #1d4ed8;
        border: 1px solid #bfdbfe;
        vertical-align: middle;
      }

      .aiw-ai-empty {
        padding: 14px;
        border: 1px dashed #cbd5e1;
        border-radius: 12px;
        color: #64748b;
        font-size: 12px;
        text-align: center;
      }

      @media (max-width: 760px) {
        .aiw-ai-metrics {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .aiw-ai-section-grid {
          grid-template-columns: 1fr;
        }

        .aiw-ai-card-header {
          align-items: stretch;
          flex-direction: column;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function createRoot(id) {
    const root = document.createElement("section");
    root.setAttribute(ROOT_ATTRIBUTE, id);
    root.className = "aiw-ai-shell";
    return root;
  }

  function findDashboardContainer() {
    return (
      document.querySelector('[data-page="dashboard"]') ||
      document.querySelector("#dashboard") ||
      document.querySelector(".dashboard-page") ||
      document.querySelector(".dashboard") ||
      document.querySelector(".module-page")
    );
  }

  function findProjectsContainer() {
    return (
      document.querySelector('[data-page="projects"]') ||
      document.querySelector("#projects") ||
      document.querySelector(".projects-page") ||
      document.querySelector(".projects-module")
    );
  }

  function findIdeasContainer() {
    return (
      document.querySelector('[data-page="ideas"]') ||
      document.querySelector("#ideas") ||
      document.querySelector(".ideas-page") ||
      document.querySelector(".ideas-module")
    );
  }

  function findProjectModal() {
    return (
      document.querySelector('[data-project-modal]:not([hidden])') ||
      document.querySelector(".project-modal:not([hidden])") ||
      document.querySelector(".modal.project-details:not([hidden])") ||
      document.querySelector(".modal:not([hidden]) .project-details") ||
      document.querySelector(".project-details-modal")
    );
  }

  function findIdeaModal() {
    return (
      document.querySelector('[data-idea-modal]:not([hidden])') ||
      document.querySelector(".idea-modal:not([hidden])") ||
      document.querySelector(".modal.idea-details:not([hidden])") ||
      document.querySelector(".modal:not([hidden]) .idea-details") ||
      document.querySelector(".idea-details-modal")
    );
  }

  function findEntityId(container, type) {
    if (!container) return null;

    const attributes = [
      `data-${type}-id`,
      "data-id",
      "data-entity-id"
    ];

    for (const attribute of attributes) {
      const direct = container.getAttribute?.(attribute);
      if (direct) return String(direct);
    }

    const nested = container.querySelector?.(
      `[data-${type}-id], [data-entity-id], [data-id]`
    );

    if (nested) {
      return (
        nested.getAttribute(`data-${type}-id`) ||
        nested.getAttribute("data-entity-id") ||
        nested.getAttribute("data-id")
      );
    }

    return null;
  }

  function findEntityByTitle(collection, container) {
    const heading =
      container?.querySelector?.("h1, h2, h3, .modal-title, .details-title");

    const title = normalizeText(heading?.textContent);

    if (!title) return null;

    return asArray(collection).find((entity) => {
      const entityTitle = normalizeText(entity?.title || entity?.name);
      return entityTitle && (
        entityTitle === title ||
        title.includes(entityTitle) ||
        entityTitle.includes(title)
      );
    }) || null;
  }

  function getProjectEntity(container) {
    const core = getCore();
    const projects = core?.getProjects?.() || [];
    const id = findEntityId(container, "project");

    if (id) {
      return projects.find((project) => {
        const projectId = core?.utils?.entityId
          ? core.utils.entityId(project, "project")
          : String(project?.id ?? project?.projectId);

        return projectId === String(id);
      }) || null;
    }

    return findEntityByTitle(projects, container);
  }

  function getIdeaEntity(container) {
    const core = getCore();
    const ideas = core?.getIdeas?.() || [];
    const id = findEntityId(container, "idea");

    if (id) {
      return ideas.find((idea) => {
        const ideaId = core?.utils?.entityId
          ? core.utils.entityId(idea, "idea")
          : String(idea?.id ?? idea?.ideaId);

        return ideaId === String(id);
      }) || null;
    }

    return findEntityByTitle(ideas, container);
  }

  function metricCard(label, value, level = "neutral") {
    return `
      <div class="aiw-ai-metric">
        <span>${escapeHTML(label)}</span>
        <strong>${escapeHTML(value)}</strong>
        <div class="aiw-ai-progress">
          <i style="width:${clamp(parseFloat(value) || 0)}%"></i>
        </div>
      </div>
    `;
  }

  function renderList(items, icon = "•") {
    if (!items.length) {
      return `<div class="aiw-ai-empty">لا توجد بيانات حالياً.</div>`;
    }

    return `
      <ul class="aiw-ai-list">
        ${items.map((item) => `
          <li>
            <b>${escapeHTML(icon)}</b>
            <div>
              <strong>${escapeHTML(item.title || item.action || "ملاحظة")}</strong>
              <p>${escapeHTML(item.message || item.action || item.reason || "")}</p>
            </div>
          </li>
        `).join("")}
      </ul>
    `;
  }

  function renderExecutiveInsights() {
    const container = findDashboardContainer();
    const insights = AIW.ExecutiveInsights?.getInsights?.();

    if (!container || !insights) return false;

    let root = container.querySelector(
      `[${ROOT_ATTRIBUTE}="dashboard-intelligence"]`
    );

    if (!root) {
      root = createRoot("dashboard-intelligence");
      container.appendChild(root);
    }

    const healthClass = getStatusClass(insights.healthLevel);

    root.innerHTML = `
      <article class="aiw-ai-card">
        <div class="aiw-ai-card-header">
          <div class="aiw-ai-card-title">
            <div class="aiw-ai-icon">🧠</div>
            <div>
              <strong>Executive AI Intelligence</strong>
              <small>تحليل تنفيذي تلقائي للمحفظة</small>
            </div>
          </div>
          <span class="aiw-ai-badge ${healthClass}">
            صحة المحفظة ${formatPercent(insights.portfolioHealth)}
          </span>
        </div>

        <p class="aiw-ai-summary">
          ${escapeHTML(insights.executiveNarrative)}
        </p>

        <div class="aiw-ai-metrics" style="margin-top:14px">
          ${metricCard("صحة المشاريع", formatPercent(insights.averages?.projectHealth))}
          ${metricCard("متوسط المخاطر", formatPercent(insights.averages?.projectRisk))}
          ${metricCard("جاهزية المشاريع", formatPercent(insights.averages?.projectReadiness))}
          ${metricCard("جودة الأفكار", formatPercent(insights.averages?.ideaScore))}
        </div>

        <div class="aiw-ai-actions">
          <button class="aiw-ai-button" data-aiw-ai-action="refresh-all">
            تحديث التحليل
          </button>
          <button class="aiw-ai-button secondary" data-aiw-ai-action="show-status">
            حالة المحركات
          </button>
        </div>

        <div class="aiw-ai-note">
          <span>الثقة: ${formatPercent(insights.confidence)}</span>
          <span>آخر تحليل: ${formatDate(insights.generatedAt)}</span>
        </div>
      </article>

      <div class="aiw-ai-section-grid">
        <article class="aiw-ai-card">
          <div class="aiw-ai-card-header">
            <div class="aiw-ai-card-title">
              <div class="aiw-ai-icon">🚨</div>
              <div>
                <strong>Executive Alerts</strong>
                <small>أهم المؤشرات التي تحتاج انتباه</small>
              </div>
            </div>
          </div>
          ${renderList(asArray(insights.highlights).slice(0, 5), "•")}
        </article>

        <article class="aiw-ai-card">
          <div class="aiw-ai-card-header">
            <div class="aiw-ai-card-title">
              <div class="aiw-ai-icon">🎯</div>
              <div>
                <strong>Executive Recommendations</strong>
                <small>الإجراءات الأعلى أولوية</small>
              </div>
            </div>
          </div>
          ${renderList(asArray(insights.recommendations).slice(0, 5), "✓")}
        </article>
      </div>

      <div class="aiw-ai-section-grid">
        <article class="aiw-ai-card">
          <div class="aiw-ai-card-header">
            <div class="aiw-ai-card-title">
              <div class="aiw-ai-icon">⚠️</div>
              <div>
                <strong>Intervention Queue</strong>
                <small>المشاريع التي تحتاج تدخلاً</small>
              </div>
            </div>
          </div>
          ${
            insights.interventionQueue?.length
              ? `<div class="aiw-ai-table">
                  ${insights.interventionQueue.slice(0, 5).map((item) => `
                    <div class="aiw-ai-table-row">
                      <strong>${escapeHTML(item.title)}</strong>
                      <span>${formatPercent(item.priorityScore)}</span>
                      <span class="aiw-ai-badge ${getStatusClass(item.riskScore >= 60 ? "high" : "medium")}">
                        مخاطر ${formatPercent(item.riskScore)}
                      </span>
                    </div>
                  `).join("")}
                </div>`
              : `<div class="aiw-ai-empty">لا توجد مشاريع تحتاج تدخلاً حالياً.</div>`
          }
        </article>

        <article class="aiw-ai-card">
          <div class="aiw-ai-card-header">
            <div class="aiw-ai-card-title">
              <div class="aiw-ai-icon">🚀</div>
              <div>
                <strong>Opportunity Queue</strong>
                <small>فرص سريعة قابلة للتفعيل</small>
              </div>
            </div>
          </div>
          ${
            insights.opportunityQueue?.length
              ? `<div class="aiw-ai-table">
                  ${insights.opportunityQueue.slice(0, 5).map((item) => `
                    <div class="aiw-ai-table-row">
                      <strong>${escapeHTML(item.title)}</strong>
                      <span>${formatPercent(item.score)}</span>
                      <span class="aiw-ai-badge success">فرصة</span>
                    </div>
                  `).join("")}
                </div>`
              : `<div class="aiw-ai-empty">لا توجد فرص سريعة حالياً.</div>`
          }
        </article>
      </div>
    `;

    return true;
  }

  function renderProjectIntelligence() {
    const container = findProjectModal() || findProjectsContainer();

    if (!container) return false;

    const project = getProjectEntity(container);
    if (!project) return false;

    const core = getCore();
    const id = core?.utils?.entityId
      ? core.utils.entityId(project, "project")
      : String(project?.id ?? project?.projectId);

    const analysis = core?.getAnalysis?.("project", id);
    const advisor = analysis?.extensions?.["project-ai-advisor"];
    const risk = analysis?.extensions?.["project-risk-intelligence"];
    const similarity = analysis?.extensions?.["similarity-intelligence-project"];

    if (!advisor && !risk && !similarity) return false;

    let root = container.querySelector(
      `[${ROOT_ATTRIBUTE}="project-intelligence"]`
    );

    if (!root) {
      root = createRoot("project-intelligence");
      container.appendChild(root);
    }

    const recommendations = [
      ...asArray(advisor?.recommendations),
      ...asArray(risk?.recommendations)
    ].slice(0, 5);

    root.innerHTML = `
      <article class="aiw-ai-card">
        <div class="aiw-ai-card-header">
          <div class="aiw-ai-card-title">
            <div class="aiw-ai-icon">🧠</div>
            <div>
              <strong>Project AI Advisor</strong>
              <small>تحليل تنفيذي للمشروع</small>
            </div>
          </div>
          <span class="aiw-ai-badge ${getStatusClass(advisor?.healthLevel)}">
            ${escapeHTML(advisor?.healthLabel || "قيد التحليل")}
          </span>
        </div>

        <p class="aiw-ai-summary">
          ${escapeHTML(advisor?.executiveSummary || risk?.executiveSummary || "")}
        </p>

        <div class="aiw-ai-metrics" style="margin-top:14px">
          ${metricCard("Advisor Score", formatPercent(advisor?.advisorScore))}
          ${metricCard("Risk Score", formatPercent(risk?.riskScore))}
          ${metricCard("احتمالية التأخير", formatPercent(risk?.delayProbability))}
          ${metricCard("الثقة", formatPercent(advisor?.confidence || risk?.confidence))}
        </div>

        <div class="aiw-ai-note">
          <span>${escapeHTML(advisor?.managementMessage || "")}</span>
          <span>${escapeHTML(risk?.escalationLabel || "")}</span>
        </div>
      </article>

      <div class="aiw-ai-section-grid">
        <article class="aiw-ai-card">
          <div class="aiw-ai-card-header">
            <div class="aiw-ai-card-title">
              <div class="aiw-ai-icon">🚨</div>
              <div>
                <strong>Early Warnings</strong>
                <small>مؤشرات الإنذار المبكر</small>
              </div>
            </div>
          </div>
          ${renderList(asArray(risk?.earlyWarnings).slice(0, 5), "!")}
        </article>

        <article class="aiw-ai-card">
          <div class="aiw-ai-card-header">
            <div class="aiw-ai-card-title">
              <div class="aiw-ai-icon">✅</div>
              <div>
                <strong>Recommended Actions</strong>
                <small>الإجراءات المقترحة</small>
              </div>
            </div>
          </div>
          ${renderList(recommendations, "✓")}
        </article>
      </div>

      <article class="aiw-ai-card">
        <div class="aiw-ai-card-header">
          <div class="aiw-ai-card-title">
            <div class="aiw-ai-icon">🔎</div>
            <div>
              <strong>Similarity Intelligence</strong>
              <small>التشابه وإعادة الاستخدام</small>
            </div>
          </div>
          <span class="aiw-ai-badge ${getStatusClass(similarity?.duplicateDetected ? "high" : "good")}">
            التميز ${formatPercent(similarity?.uniquenessScore)}
          </span>
        </div>

        ${
          similarity?.topMatch
            ? `<div class="aiw-ai-table-row">
                <strong>${escapeHTML(similarity.topMatch.title)}</strong>
                <span>${formatPercent(similarity.topMatch.score)}</span>
                <span>${escapeHTML(similarity.topMatch.decision?.label || "")}</span>
              </div>`
            : `<div class="aiw-ai-empty">لا توجد مطابقات مؤثرة.</div>`
        }

        <div class="aiw-ai-actions">
          <button class="aiw-ai-button" data-aiw-ai-action="refresh-project" data-project-id="${escapeHTML(id)}">
            إعادة تحليل المشروع
          </button>
        </div>
      </article>
    `;

    return true;
  }

  function renderIdeaIntelligence() {
    const container = findIdeaModal() || findIdeasContainer();

    if (!container) return false;

    const idea = getIdeaEntity(container);
    if (!idea) return false;

    const core = getCore();
    const id = core?.utils?.entityId
      ? core.utils.entityId(idea, "idea")
      : String(idea?.id ?? idea?.ideaId);

    const analysis = core?.getAnalysis?.("idea", id);
    const scoring = analysis?.extensions?.["idea-ai-scoring"];
    const similarity = analysis?.extensions?.["similarity-intelligence-idea"];

    if (!scoring && !similarity) return false;

    let root = container.querySelector(
      `[${ROOT_ATTRIBUTE}="idea-intelligence"]`
    );

    if (!root) {
      root = createRoot("idea-intelligence");
      container.appendChild(root);
    }

    root.innerHTML = `
      <article class="aiw-ai-card">
        <div class="aiw-ai-card-header">
          <div class="aiw-ai-card-title">
            <div class="aiw-ai-icon">💡</div>
            <div>
              <strong>Idea AI Scoring</strong>
              <small>تقييم ذكي قابل للتفسير</small>
            </div>
          </div>
          <span class="aiw-ai-badge ${getStatusClass(scoring?.scoreLevel)}">
            ${escapeHTML(scoring?.priorityBand || "P4")}
          </span>
        </div>

        <p class="aiw-ai-summary">
          ${escapeHTML(scoring?.executiveSummary || "")}
        </p>

        <div class="aiw-ai-metrics" style="margin-top:14px">
          ${metricCard("Overall Score", formatPercent(scoring?.overallScore))}
          ${metricCard("Data Readiness", formatPercent(scoring?.dataReadiness))}
          ${metricCard("Feasibility", formatPercent(scoring?.feasibility))}
          ${metricCard("Risk", formatPercent(scoring?.riskScore))}
        </div>

        <div class="aiw-ai-note">
          <span>التوصية: ${escapeHTML(scoring?.recommendationLabel || "")}</span>
          <span>الثقة: ${formatPercent(scoring?.confidence)}</span>
        </div>
      </article>

      <div class="aiw-ai-section-grid">
        <article class="aiw-ai-card">
          <div class="aiw-ai-card-header">
            <div class="aiw-ai-card-title">
              <div class="aiw-ai-icon">⭐</div>
              <div>
                <strong>Strengths</strong>
                <small>أقوى عناصر الفكرة</small>
              </div>
            </div>
          </div>
          ${renderList(
            asArray(scoring?.strengths).map((item) => ({
              title: item.label,
              message: `${formatPercent(item.score)} — ${item.explanation || ""}`
            })),
            "★"
          )}
        </article>

        <article class="aiw-ai-card">
          <div class="aiw-ai-card-header">
            <div class="aiw-ai-card-title">
              <div class="aiw-ai-icon">🧩</div>
              <div>
                <strong>Gaps</strong>
                <small>الفجوات التي تحتاج معالجة</small>
              </div>
            </div>
          </div>
          ${renderList(
            asArray(scoring?.gaps).map((item) => ({
              title: item.label,
              message: `${formatPercent(item.score)} — ${item.explanation || ""}`
            })),
            "•"
          )}
        </article>
      </div>

      <article class="aiw-ai-card">
        <div class="aiw-ai-card-header">
          <div class="aiw-ai-card-title">
            <div class="aiw-ai-icon">🔎</div>
            <div>
              <strong>Duplicate & Similarity Check</strong>
              <small>التكرار والتشابه مع الموجود</small>
            </div>
          </div>
          <span class="aiw-ai-badge ${getStatusClass(similarity?.duplicateDetected ? "high" : "good")}">
            التميز ${formatPercent(similarity?.uniquenessScore)}
          </span>
        </div>

        ${
          similarity?.topMatch
            ? `<div class="aiw-ai-table-row">
                <strong>${escapeHTML(similarity.topMatch.title)}</strong>
                <span>${formatPercent(similarity.topMatch.score)}</span>
                <span>${escapeHTML(similarity.topMatch.decision?.label || "")}</span>
              </div>`
            : `<div class="aiw-ai-empty">لا يوجد تكرار مؤثر.</div>`
        }

        <div class="aiw-ai-actions">
          <button class="aiw-ai-button" data-aiw-ai-action="refresh-idea" data-idea-id="${escapeHTML(id)}">
            إعادة تحليل الفكرة
          </button>
        </div>
      </article>
    `;

    return true;
  }

  function injectInlineBadges() {
    const core = getCore();
    if (!core) return;

    const projects = core.getProjects?.() || [];
    const ideas = core.getIdeas?.() || [];

    document.querySelectorAll("[data-project-id]").forEach((element) => {
      if (element.querySelector(".aiw-ai-inline-badge")) return;

      const id = element.getAttribute("data-project-id");
      const analysis = core.getAnalysis?.("project", id);
      const advisor = analysis?.extensions?.["project-ai-advisor"];

      if (!advisor) return;

      const badge = document.createElement("span");
      badge.className = "aiw-ai-inline-badge";
      badge.textContent = `AI ${formatPercent(advisor.advisorScore)}`;

      const target =
        element.querySelector("h3, h4, .card-title, .project-title") ||
        element;

      target.appendChild(badge);
    });

    document.querySelectorAll("[data-idea-id]").forEach((element) => {
      if (element.querySelector(".aiw-ai-inline-badge")) return;

      const id = element.getAttribute("data-idea-id");
      const analysis = core.getAnalysis?.("idea", id);
      const scoring = analysis?.extensions?.["idea-ai-scoring"];

      if (!scoring) return;

      const badge = document.createElement("span");
      badge.className = "aiw-ai-inline-badge";
      badge.textContent = `AI ${formatPercent(scoring.overallScore)}`;

      const target =
        element.querySelector("h3, h4, .card-title, .idea-title") ||
        element;

      target.appendChild(badge);
    });

    void projects;
    void ideas;
  }

  function renderAll() {
    if (runtime.rendering) return;

    runtime.rendering = true;

    try {
      renderExecutiveInsights();
      renderProjectIntelligence();
      renderIdeaIntelligence();
      injectInlineBadges();

      runtime.lastRenderedAt = new Date().toISOString();

      global.dispatchEvent?.(
        new CustomEvent(UI_EVENT, {
          detail: {
            version: VERSION,
            renderedAt: runtime.lastRenderedAt
          }
        })
      );
    } finally {
      runtime.rendering = false;
    }
  }

  function scheduleRender() {
    clearTimeout(runtime.refreshTimer);

    runtime.refreshTimer = setTimeout(() => {
      renderAll();
    }, 120);
  }

  async function handleAction(event) {
    const button = event.target.closest("[data-aiw-ai-action]");
    if (!button) return;

    const action = button.getAttribute("data-aiw-ai-action");
    const core = getCore();

    if (!core) return;

    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = "جاري التحليل...";

    try {
      if (action === "refresh-all") {
        await core.refreshAll?.({ force: true });
      }

      if (action === "refresh-project") {
        const projectId = button.getAttribute("data-project-id");
        if (projectId) {
          await core.analyzeProject?.(projectId, { force: true });
        }
      }

      if (action === "refresh-idea") {
        const ideaId = button.getAttribute("data-idea-id");
        if (ideaId) {
          await core.analyzeIdea?.(ideaId, { force: true });
        }
      }

      if (action === "show-status") {
        const statuses = [
          core.getStatus?.(),
          AIW.ProjectAIAdvisor?.getStatus?.(),
          AIW.ProjectRiskIntelligence?.getStatus?.(),
          AIW.IdeaAIScoring?.getStatus?.(),
          AIW.SimilarityIntelligence?.getStatus?.(),
          AIW.ExecutiveInsights?.getStatus?.()
        ].filter(Boolean);

        global.alert?.(
          statuses
            .map((status) =>
              `${status.name}: ${status.initialized ? "Ready" : "Not Ready"}`
            )
            .join("\n")
        );
      }

      scheduleRender();
    } catch (error) {
      console.error("[AIW.AIUI] Action failed.", error);
      global.alert?.("تعذر تحديث التحليل حالياً.");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  function subscribe() {
    const core = getCore();
    if (!core?.on) return;

    runtime.unsubscribers.push(
      core.on("analysis:complete", scheduleRender),
      core.on("refresh:complete", scheduleRender),
      core.on("cache:invalidated", scheduleRender)
    );
  }

  function observeDOM() {
    if (runtime.observer) return;

    runtime.observer = new MutationObserver(() => {
      scheduleRender();
    });

    runtime.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "class",
        "hidden",
        "data-project-id",
        "data-idea-id"
      ]
    });
  }

  function getStatus() {
    return {
      name: "AI Intelligence UI",
      version: VERSION,
      initialized: runtime.initialized,
      lastRenderedAt: runtime.lastRenderedAt
    };
  }

  function init() {
    if (runtime.initialized) {
      return AIW.AIIntelligenceUI;
    }

    injectStyles();
    subscribe();
    observeDOM();
    document.addEventListener("click", handleAction);

    runtime.initialized = true;

    scheduleRender();

    global.dispatchEvent?.(
      new CustomEvent("aiw:ai-intelligence-ui:ready", {
        detail: {
          version: VERSION,
          initializedAt: new Date().toISOString()
        }
      })
    );

    return AIW.AIIntelligenceUI;
  }

  function destroy() {
    clearTimeout(runtime.refreshTimer);

    runtime.observer?.disconnect();
    runtime.observer = null;

    for (const unsubscribe of runtime.unsubscribers) {
      try {
        unsubscribe?.();
      } catch (_) {}
    }

    runtime.unsubscribers = [];

    document.removeEventListener("click", handleAction);
    runtime.initialized = false;
  }

  AIW.AIIntelligenceUI = {
    version: VERSION,

    init,
    destroy,
    getStatus,
    renderAll,
    renderExecutiveInsights,
    renderProjectIntelligence,
    renderIdeaIntelligence
  };

  AIW.Engines = AIW.Engines || {};
  AIW.Engines.aiIntelligenceUI =
    AIW.AIIntelligenceUI;

  function autoInit() {
    try {
      init();
    } catch (error) {
      console.error(
        "[AIW.AIIntelligenceUI] Auto initialization failed.",
        error
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      autoInit,
      { once: true }
    );
  } else {
    autoInit();
  }

})(window);
