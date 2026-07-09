/* =========================================================
   AI Work - Governance Center V1.0 Final
   Responsible AI + Risk + Controls + Operating Model
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.governance = {
  id: "governance",
  title: "الحوكمة",
  icon: "🏛️",

  principles: [
    ["🧑‍⚖️", "الإشراف البشري", "أي قرار حساس أو عالي الأثر لا يعتمد آلياً بدون مراجعة بشرية."],
    ["🔐", "الخصوصية وحماية البيانات", "تصنيف البيانات وتقييد الوصول حسب مستوى الحساسية."],
    ["📌", "الشفافية", "توثيق سبب استخدام الذكاء الاصطناعي وحدود كل نموذج أو حل."],
    ["⚖️", "العدالة وعدم التحيز", "مراجعة النتائج لتقليل التحيز وضمان العدالة في الخدمات والقرارات."],
    ["🛡️", "الأمن والسلامة", "اختبار الحلول في Sandbox قبل التوسع المؤسسي."],
    ["📊", "المساءلة والقياس", "ربط كل مشروع بمالك، مؤشرات أداء، مخاطر، وآلية مراجعة."]
  ],

  committees: [
    ["اللجنة التوجيهية العليا", "اعتماد الأولويات، الميزانيات، المشاريع الكبرى، ومراجعة الأثر الربع سنوي."],
    ["فريق مبادرة الذكاء الاصطناعي", "متابعة التنفيذ اليومي، تنسيق الإدارات، وإدارة خارطة الطريق."],
    ["فريق البيانات والخصوصية", "مراجعة تصنيف البيانات، الوصول، الامتثال، وحماية المعلومات الحساسة."],
    ["فريق الأمن الرقمي", "فحص المخاطر التقنية، الاختبارات الأمنية، والاستجابة للحوادث."],
    ["سفراء الذكاء الاصطناعي", "نشر الثقافة داخل الإدارات ورفع فرص الاستخدام والتحسين."]
  ],

  controls: [
    ["تقييم الفكرة", "قبل الاعتماد", "الأثر، الجدوى، التكلفة، المخاطر، جاهزية البيانات"],
    ["تقييم البيانات", "قبل PoC", "تصنيف البيانات، الجودة، الحساسية، الملكية"],
    ["تقييم المخاطر", "قبل الإطلاق", "الخصوصية، الأمن، التحيز، الاعتماد الزائد على AI"],
    ["اختبار Sandbox", "قبل التوسع", "تجربة معزولة وقياس نتائج قبل التطبيق المؤسسي"],
    ["مراجعة بشرية", "مستمر", "Human-in-the-Loop للقرارات الحساسة"],
    ["قياس الأثر", "ربع سنوي", "KPIs، ROI، رضا المستخدمين، توفير الوقت والتكلفة"]
  ],

  riskRegister: [
    ["جودة البيانات", "متوسط", "تطبيق Data Governance وتنظيف البيانات قبل النماذج."],
    ["الخصوصية", "عالٍ", "تقييد الوصول، إخفاء البيانات الحساسة، ومراجعة قانونية."],
    ["التحيز في النتائج", "متوسط", "اختبار المخرجات ومراجعة العينات بشكل دوري."],
    ["التبني المؤسسي", "متوسط", "تدريب مستمر وبرنامج سفراء الذكاء الاصطناعي."],
    ["تكامل الأنظمة", "متوسط", "بدء تدريجي عبر PoC وربط مرحلي بالأنظمة."],
    ["الاعتماد الزائد على الذكاء الاصطناعي", "عالٍ", "إبقاء القرارات الحرجة تحت إشراف بشري واضح."]
  ],

  render(container) {
    if (!container) return;

    const highRisks = this.riskRegister.filter(r => String(r[1]).includes("عال")).length;
    const mediumRisks = this.riskRegister.filter(r => String(r[1]).includes("متوسط")).length;

    container.innerHTML = `
      <section class="module-page">

        <div class="module-hero">
          <span class="module-kicker">Responsible AI · Governance</span>
          <h1>مركز حوكمة الذكاء الاصطناعي</h1>
          <p>
            إطار تنفيذي لضمان أن مشاريع الذكاء الاصطناعي تُدار بمسؤولية،
            مع ضوابط واضحة للخصوصية، الأمن، المخاطر، الإشراف البشري، وقياس الأثر.
          </p>

          <div class="aiw-chip-row">
            <span class="aiw-chip">🏛️ Governance Framework</span>
            <span class="aiw-chip">🧑‍⚖️ Human-in-the-Loop</span>
            <span class="aiw-chip">🔐 Privacy by Design</span>
          </div>
        </div>

        <div class="module-grid">
          ${this.kpi("مبادئ الحوكمة", this.principles.length, "Responsible AI")}
          ${this.kpi("فرق ولجان", this.committees.length, "Operating Model")}
          ${this.kpi("ضوابط تشغيلية", this.controls.length, "Control Points")}
          ${this.kpi("مخاطر عالية", highRisks, "High Risk")}
          ${this.kpi("مخاطر متوسطة", mediumRisks, "Medium Risk")}
          ${this.kpi("دورة المراجعة", "ربع سنوي", "Governance Review")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>النموذج التشغيلي للحوكمة</h2>
              <p>من يعتمد، من ينفذ، من يراجع، ومن يراقب المخاطر.</p>
            </div>

            <div class="governance-flow">
              <div><b>1</b><strong>استقبال الفكرة</strong><span>من الإدارات أو منصة الأفكار</span></div>
              <div><b>2</b><strong>تقييم أولي</strong><span>الأثر، التكلفة، الجاهزية، المخاطر</span></div>
              <div><b>3</b><strong>Sandbox / PoC</strong><span>اختبار آمن قبل التوسع</span></div>
              <div><b>4</b><strong>اعتماد تنفيذي</strong><span>اللجنة التوجيهية والميزانية</span></div>
              <div><b>5</b><strong>تشغيل ومراقبة</strong><span>KPIs، ROI، مخاطر، وتحسين مستمر</span></div>
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>قرار الحوكمة الأساسي</h2>
              <p>قاعدة ثابتة لكل مشروع AI عالي الأثر.</p>
            </div>

            <div class="governance-decision-card">
              <strong>لا يوجد إطلاق مؤسسي بدون مراجعة حوكمة</strong>
              <p>
                أي مشروع يستخدم بيانات حساسة، يؤثر على متعاملين أو موظفين،
                أو يدعم قراراً إدارياً مهماً، يجب أن يمر بتقييم خصوصية، أمن، تحيز، وإشراف بشري.
              </p>
              <button class="module-btn secondary" data-module="projects">فتح محفظة المشاريع</button>
            </div>
          </div>
        </div>

        <div class="module-section-title">
          <h2>مبادئ الذكاء الاصطناعي المسؤول</h2>
          <p>المبادئ التي تحكم التصميم والتنفيذ والتشغيل.</p>
        </div>

        <div class="governance-principles-grid">
          ${this.principles.map(p => `
            <article class="governance-principle-card">
              <div>${p[0]}</div>
              <strong>${p[1]}</strong>
              <p>${p[2]}</p>
            </article>
          `).join("")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>اللجان والأدوار</h2>
              <p>هيكل إدارة البرنامج على مستوى المؤسسة.</p>
            </div>

            <div class="governance-list">
              ${this.committees.map((c, i) => `
                <div class="governance-list-item">
                  <b>${String(i + 1).padStart(2, "0")}</b>
                  <div>
                    <strong>${c[0]}</strong>
                    <span>${c[1]}</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>سجل المخاطر</h2>
              <p>أبرز المخاطر والضوابط المقترحة للتخفيف.</p>
            </div>

            <div class="risk-list">
              ${this.riskRegister.map(r => `
                <div class="risk-card">
                  <div>
                    <strong>${r[0]}</strong>
                    <p>${r[2]}</p>
                  </div>
                  <span class="aiw-status ${this.riskClass(r[1])}">${r[1]}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <div class="module-panel">
          <div class="module-section-title compact">
            <h2>ضوابط دورة حياة المشروع</h2>
            <p>نقاط التحكم المطلوبة من الفكرة إلى التشغيل.</p>
          </div>

          <div class="controls-table">
            <div class="controls-row controls-head">
              <strong>الضابط</strong>
              <strong>التوقيت</strong>
              <strong>ما يتم مراجعته</strong>
            </div>

            ${this.controls.map(c => `
              <div class="controls-row">
                <span>${c[0]}</span>
                <span>${c[1]}</span>
                <span>${c[2]}</span>
              </div>
            `).join("")}
          </div>
        </div>

      </section>
    `;
  },

  kpi(label, value, note) {
    return `
      <div class="module-card">
        <span>${label}</span>
        <strong>${value}</strong>
        <small>${note}</small>
      </div>
    `;
  },

  riskClass(level) {
    if (String(level).includes("عال")) return "red";
    if (String(level).includes("متوسط")) return "orange";
    return "green";
  }
};