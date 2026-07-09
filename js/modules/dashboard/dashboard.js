/* =========================================================
   AI Work - Executive Dashboard V1
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.dashboard = {
  id: "dashboard",
  title: "الرئيسية",
  icon: "🏠",

  render(container) {
    if (!container) return;

    const data = window.AIW?.Data || {};
    const summary = data.summary || {};

    container.innerHTML = `
      <section class="module-page">
        <div class="module-hero">
          <span class="module-kicker">Executive Operating System</span>
          <h1>AI Transformation Center</h1>
          <p>
            منصة تنفيذية لتحويل استراتيجية الذكاء الاصطناعي من وثيقة ثابتة
            إلى تجربة تفاعلية تعرض الرؤية، الأفكار، المشاريع، المؤشرات، الحوكمة، وخارطة الطريق.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">📅 ${summary.period || "2026–2030"}</span>
            <span class="aiw-chip">💡 ${summary.ideasCount || 42}+ فكرة</span>
            <span class="aiw-chip">📁 ${summary.flagshipProjectsCount || 15} مشروع</span>
          </div>
        </div>

        <div class="module-grid">
          <div class="module-card">
            <span>الأفكار</span>
            <strong>${summary.ideasCount || 42}</strong>
            <small>AI Ideas</small>
          </div>

          <div class="module-card">
            <span>المشاريع الرئيسية</span>
            <strong>${summary.flagshipProjectsCount || 15}</strong>
            <small>Flagship Projects</small>
          </div>

          <div class="module-card">
            <span>الإدارات</span>
            <strong>${summary.departmentsCount || 10}</strong>
            <small>Departments</small>
          </div>

          <div class="module-card">
            <span>مراحل الطريق</span>
            <strong>${summary.roadmapPhases || 6}</strong>
            <small>Roadmap</small>
          </div>
        </div>

        <div class="module-panel">
          <h2>الرؤية التنفيذية</h2>
          <p>
            ${summary.vision || "بناء مؤسسة مدعومة بالذكاء الاصطناعي قادرة على التنبؤ، الأتمتة، إدارة المعرفة، وتحسين الخدمات بصورة مستمرة."}
          </p>
        </div>

        <div class="module-panel">
          <h2>الرسالة</h2>
          <p>
            ${summary.mission || "تمكين الإدارات من تحويل تحدياتها التشغيلية إلى مشاريع ذكاء اصطناعي قابلة للتنفيذ والقياس والحوكمة."}
          </p>
        </div>

        <div class="module-panel">
          <h2>المشاريع الاستراتيجية الرئيسية</h2>
          <div class="executive-list">
            ${(data.flagshipProjects || []).map((p, i) => `
              <div class="executive-item">
                <strong>${String(i + 1).padStart(2, "0")}</strong>
                <span>${p}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-panel">
          <h2>خارطة التحول 2026–2030</h2>
          <div class="roadmap-list">
            ${(data.roadmap || []).map(r => `
              <div class="roadmap-item">
                <div>
                  <strong>${r.phase}</strong>
                  <span>${r.year}</span>
                  <p>${r.activities}</p>
                </div>
                <b>${r.progress}%</b>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-panel">
          <h2>مؤشرات الأداء الرئيسية</h2>
          <div class="executive-list">
            ${(data.kpis || []).map(k => `
              <div class="executive-item">
                <strong>KPI</strong>
                <span>${k}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-panel">
          <h2>الحوكمة</h2>
          <div class="executive-list">
            ${(data.governance || []).map((g, i) => `
              <div class="executive-item">
                <strong>${String(i + 1).padStart(2, "0")}</strong>
                <span>${g}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-panel admin-note">
          <h2>⚙️ Admin Mode لاحقاً</h2>
          <p>
            الإضافة والتعديل والحذف ستكون في لوحة إدارة مخفية، أما هذه الواجهة فهي للعرض التنفيذي والتحليل.
          </p>
        </div>
      </section>
    `;
  }
};