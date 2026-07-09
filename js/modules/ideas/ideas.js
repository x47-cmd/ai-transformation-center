/* =========================================================
   AI Work - Ideas Module V2
   Save + List + Delete
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.ideas = {
  id: "ideas",
  title: "الأفكار",
  icon: "💡",

  render(container) {
    if (!container) return;

    const ideas = AIW.Store.getCollection("ideas");

    container.innerHTML = `
      <section class="module-page">
        <div class="module-hero">
          <span class="module-kicker">Innovation Pipeline</span>
          <h1>مركز الأفكار</h1>
          <p>اجمع، صنّف، وقيّم أفكار التحول بالذكاء الاصطناعي قبل تحويلها إلى مشاريع.</p>
        </div>

        <div class="module-grid">
          <div class="module-card">
            <span>الأفكار النشطة</span>
            <strong>${ideas.length}</strong>
          </div>

          <div class="module-card">
            <span>قيد الدراسة</span>
            <strong>${ideas.filter(i => i.status === "review").length}</strong>
          </div>

          <div class="module-card">
            <span>جاهزة كمشروع</span>
            <strong>${ideas.filter(i => i.status === "ready").length}</strong>
          </div>
        </div>

        <div class="module-panel">
          <h2>إضافة فكرة جديدة</h2>

          <input id="ideaTitle" class="module-input" placeholder="اسم الفكرة">

          <textarea id="ideaDesc" class="module-textarea" placeholder="وصف مختصر للفكرة"></textarea>

          <select id="ideaStatus" class="module-input">
            <option value="new">فكرة جديدة</option>
            <option value="review">قيد الدراسة</option>
            <option value="ready">جاهزة كمشروع</option>
          </select>

          <button id="saveIdeaBtn" class="module-btn">حفظ الفكرة</button>
        </div>

        <div class="module-panel module-list-panel">
          <h2>قائمة الأفكار</h2>

          ${
            ideas.length
              ? ideas.map(item => `
                <div class="module-list-item">
                  <div>
                    <strong>${item.title}</strong>
                    <span>${item.description || "بدون وصف"}</span>
                    <small>${this.statusLabel(item.status)}</small>
                  </div>

                  <button data-delete-idea="${item.id}" class="module-delete-btn">حذف</button>
                </div>
              `).join("")
              : `<div class="module-empty">لا توجد أفكار محفوظة حالياً.</div>`
          }
        </div>
      </section>
    `;

    this.bind(container);
  },

  bind(container) {
    const saveBtn = container.querySelector("#saveIdeaBtn");

    saveBtn?.addEventListener("click", () => {
      const title = container.querySelector("#ideaTitle")?.value.trim();
      const description = container.querySelector("#ideaDesc")?.value.trim();
      const status = container.querySelector("#ideaStatus")?.value || "new";

      if (!title) {
        alert("اكتب اسم الفكرة أولاً");
        return;
      }

      AIW.Store.add("ideas", {
        title,
        description,
        status
      });

      this.render(container);
    });

    container.querySelectorAll("[data-delete-idea]").forEach(btn => {
      btn.addEventListener("click", () => {
        AIW.Store.remove("ideas", btn.dataset.deleteIdea);
        this.render(container);
      });
    });
  },

  statusLabel(status) {
    const labels = {
      new: "فكرة جديدة",
      review: "قيد الدراسة",
      ready: "جاهزة كمشروع"
    };

    return labels[status] || "فكرة جديدة";
  }
};