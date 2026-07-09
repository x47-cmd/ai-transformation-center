/* =========================================================
   AI Work - Governance Center V2.0 Final
   Enterprise Responsible AI Operating Model
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.governance = {
  id: "governance",
  title: "الحوكمة",
  icon: "🏛️",

  data: {
    principles: [
      {
        icon: "🧑‍⚖️",
        title: "الإشراف البشري",
        desc: "أي قرار حساس أو عالي الأثر لا يعتمد آلياً بدون مراجعة بشرية واضحة.",
        owner: "اللجنة التوجيهية"
      },
      {
        icon: "🔐",
        title: "الخصوصية وحماية البيانات",
        desc: "تصنيف البيانات وتقييد الوصول حسب مستوى الحساسية قبل استخدام أي نموذج.",
        owner: "فريق البيانات والخصوصية"
      },
      {
        icon: "📌",
        title: "الشفافية",
        desc: "توثيق سبب استخدام الذكاء الاصطناعي وحدود كل نموذج أو حل قبل الإطلاق.",
        owner: "فريق المبادرة"
      },
      {
        icon: "⚖️",
        title: "العدالة وعدم التحيز",
        desc: "مراجعة المخرجات بشكل دوري لتقليل التحيز وضمان عدالة النتائج.",
        owner: "لجنة الحوكمة"
      },
      {
        icon: "🛡️",
        title: "الأمن والسلامة",
        desc: "اختبار الحلول في بيئة Sandbox قبل التطبيق المؤسسي الكامل.",
        owner: "الأمن الرقمي"
      },
      {
        icon: "📊",
        title: "المساءلة والقياس",
        desc: "ربط كل مشروع بمالك، مؤشرات أداء، سجل مخاطر، وآلية مراجعة.",
        owner: "مكتب البرنامج"
      }
    ],

    committees: [
      {
        name: "اللجنة التوجيهية العليا",
        role: "اعتماد الأولويات، الميزانيات، المشاريع الكبرى، ومراجعة الأثر الربع سنوي.",
        cadence: "ربع سنوي",
        authority: "اعتماد نهائي"
      },
      {
        name: "فريق مبادرة الذكاء الاصطناعي",
        role: "متابعة التنفيذ اليومي، تنسيق الإدارات، وإدارة خارطة الطريق.",
        cadence: "أسبوعي",
        authority: "إدارة تنفيذية"
      },
      {
        name: "فريق البيانات والخصوصية",
        role: "مراجعة تصنيف البيانات، الوصول، الامتثال، وحماية المعلومات الحساسة.",
        cadence: "حسب المشروع",
        authority: "مراجعة إلزامية"
      },
      {
        name: "فريق الأمن الرقمي",
        role: "فحص المخاطر التقنية، الاختبارات الأمنية، والاستجابة للحوادث.",
        cadence: "حسب المشروع",
        authority: "موافقة أمنية"
      },
      {
        name: "سفراء الذكاء الاصطناعي",
        role: "نشر الثقافة داخل الإدارات ورفع فرص الاستخدام والتحسين.",
        cadence: "شهري",
        authority: "تمكين وتوعية"
      }
    ],

    policies: [
      ["سياسة استخدام الذكاء الاصطناعي", "تحدد الاستخدامات المسموحة والممنوعة وأدوار الموظفين.", "مطلوبة"],
      ["سياسة البيانات الحساسة", "تحدد مستويات تصنيف البيانات وآلية استخدامها في نماذج الذكاء الاصطناعي.", "مطلوبة"],
      ["سياسة الإشراف البشري", "تحدد الحالات التي تتطلب مراجعة بشرية إلزامية قبل القرار.", "مطلوبة"],
      ["سياسة التقييم قبل الإطلاق", "تفرض تقييم الخصوصية، الأمن، التحيز، والجدوى قبل التشغيل.", "مطلوبة"],
      ["سياسة المراجعة الدورية", "تحدد دورات مراجعة النماذج والمخرجات ومؤشرات الأداء.", "مخططة"]
    ],

    controls: [
      ["تقييم الفكرة", "قبل الاعتماد", "الأثر، الجدوى، التكلفة، المخاطر، جاهزية البيانات", "إلزامي"],
      ["تقييم البيانات", "قبل PoC", "تصنيف البيانات، الجودة، الحساسية، الملكية", "إلزامي"],
      ["تقييم المخاطر", "قبل الإطلاق", "الخصوصية، الأمن، التحيز، الاعتماد الزائد على AI", "إلزامي"],
      ["اختبار Sandbox", "قبل التوسع", "تجربة معزولة وقياس نتائج قبل التطبيق المؤسسي", "إلزامي"],
      ["مراجعة بشرية", "مستمر", "Human-in-the-Loop للقرارات الحساسة", "إلزامي"],
      ["قياس الأثر", "ربع سنوي", "KPIs، ROI، رضا المستخدمين، توفير الوقت والتكلفة", "إلزامي"]
    ],

    risks: [
      ["جودة البيانات", "متوسط", "تطبيق Data Governance وتنظيف البيانات قبل النماذج.", "فريق البيانات"],
      ["الخصوصية", "عالٍ", "تقييد الوصول، إخفاء البيانات الحساسة، ومراجعة قانونية.", "الخصوصية"],
      ["التحيز في النتائج", "متوسط", "اختبار المخرجات ومراجعة العينات بشكل دوري.", "لجنة الحوكمة"],
      ["التبني المؤسسي", "متوسط", "تدريب مستمر وبرنامج سفراء الذكاء الاصطناعي.", "فريق المبادرة"],
      ["تكامل الأنظمة", "متوسط", "بدء تدريجي عبر PoC وربط مرحلي بالأنظمة.", "تقنية المعلومات"],
      ["الاعتماد الزائد على الذكاء الاصطناعي", "عالٍ", "إبقاء القرارات الحرجة تحت إشراف بشري واضح.", "اللجنة التوجيهية"]
    ],

    lifecycle: [
      ["1", "Idea Intake", "استقبال الفكرة من الإدارة أو منصة الأفكار."],
      ["2", "Initial Assessment", "تقييم الأثر، التكلفة، الجاهزية، والمخاطر."],
      ["3", "Data Review", "مراجعة جودة البيانات وحساسيتها وصلاحية استخدامها."],
      ["4", "Sandbox / PoC", "اختبار الحل في بيئة آمنة قبل التوسع."],
      ["5", "Governance Approval", "اعتماد الحوكمة والأمن والخصوصية قبل الإطلاق."],
      ["6", "Deployment", "الإطلاق المرحلي وربط المشروع بمؤشرات الأداء."],
      ["7", "Monitoring", "مراقبة النتائج والمخاطر والتحسين المستمر."]
    ],

    roadmap: [
      ["2026", "تأسيس الحوكمة", "اعتماد السياسات، اللجنة، وسجل المخاطر."],
      ["2027", "تفعيل PoC Governance", "ربط كل مشروع تجريبي بضوابط قياس ومراجعة."],
      ["2028", "حوكمة التوسع", "إدارة المشاريع المتوسطة وربطها بالبيانات والتقارير."],
      ["2029", "حوكمة المشاريع الكبرى", "تطبيق ضوابط متقدمة للتوأم الرقمي ومنصة القرار."],
      ["2030", "حوكمة مستدامة", "تحسين مستمر، تدقيق، وقياس أثر شامل."]
    ]
  },

  render(container) {
    if (!container) return;

    const W = window.AIW?.Widgets;
    const A = window.AIW?.Analytics;
    const R = window.AIW?.Recommendation;

    const risks = this.data.risks;
    const highRisks = risks.filter(r => String(r[1]).includes("عال")).length;
    const mediumRisks = risks.filter(r => String(r[1]).includes("متوسط")).length;
    const governanceScore = A?.score ? A.score().governanceScore : 85;
    const recommendation = R?.governance ? R.governance() : [];

    container.innerHTML = `
      <section class="module-page">

        ${W ? W.hero({
          kicker: "Responsible AI · Governance",
          title: "مركز حوكمة الذكاء الاصطناعي",
          description: "إطار تنفيذي لضمان أن مشاريع الذكاء الاصطناعي تُدار بمسؤولية، مع ضوابط واضحة للخصوصية، الأمن، المخاطر، الإشراف البشري، التقييم، والامتثال.",
          chips: ["🏛️ Governance Framework", "🧑‍⚖️ Human-in-the-Loop", "🔐 Privacy by Design", "🛡️ AI Risk Management"]
        }) : this.fallbackHero()}

        <div class="module-grid">
          ${this.kpi("مؤشر الحوكمة", `${governanceScore}%`, "Governance Score")}
          ${this.kpi("مبادئ الحوكمة", this.data.principles.length, "Responsible AI")}
          ${this.kpi("اللجان والأدوار", this.data.committees.length, "Operating Model")}
          ${this.kpi("السياسات", this.data.policies.length, "AI Policies")}
          ${this.kpi("مخاطر عالية", highRisks, "High Risk")}
          ${this.kpi("مخاطر متوسطة", mediumRisks, "Medium Risk")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("الخلاصة التنفيذية", "قراءة سريعة لحالة الحوكمة المطلوبة قبل التوسع.")}
            <div class="governance-executive-card">
              <strong>الحوكمة هي بوابة الانتقال من التجارب إلى التشغيل المؤسسي</strong>
              <p>
                لا يتم إطلاق أي مشروع ذكاء اصطناعي مؤسسي بدون تقييم بيانات، خصوصية،
                أمن، تحيز، إشراف بشري، وربطه بمؤشرات أداء واضحة.
              </p>
              <div class="aiw-progress"><div style="width:${governanceScore}%"></div></div>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("قرار الحوكمة الأساسي", "قاعدة ثابتة لكل مشروع AI عالي الأثر.")}
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
          ${this.data.principles.map(p => `
            <article class="governance-principle-card">
              <div>${p.icon}</div>
              <strong>${p.title}</strong>
              <p>${p.desc}</p>
              <small>${p.owner}</small>
            </article>
          `).join("")}
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("اللجان والأدوار", "هيكل إدارة البرنامج على مستوى المؤسسة.")}
            <div class="governance-list">
              ${this.data.committees.map((c, i) => `
                <div class="governance-list-item">
                  <b>${String(i + 1).padStart(2, "0")}</b>
                  <div>
                    <strong>${c.name}</strong>
                    <span>${c.role}</span>
                    <small>${c.cadence} · ${c.authority}</small>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("سجل المخاطر", "أبرز المخاطر والضوابط المقترحة للتخفيف.")}
            <div class="risk-list">
              ${this.data.risks.map(r => `
                <div class="risk-card">
                  <div>
                    <strong>${r[0]}</strong>
                    <p>${r[2]}</p>
                    <small>المالك: ${r[3]}</small>
                  </div>
                  <span class="aiw-status ${this.riskClass(r[1])}">${r[1]}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("السياسات المطلوبة", "وثائق وسياسات يجب اعتمادها قبل التوسع المؤسسي.")}
          <div class="governance-policy-grid">
            ${this.data.policies.map(policy => `
              <article class="governance-policy-card">
                <span class="aiw-status ${policy[2] === "مطلوبة" ? "red" : "orange"}">${policy[2]}</span>
                <strong>${policy[0]}</strong>
                <p>${policy[1]}</p>
              </article>
            `).join("")}
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("ضوابط دورة حياة المشروع", "نقاط التحكم المطلوبة من الفكرة إلى التشغيل.")}
          <div class="controls-table">
            <div class="controls-row controls-head">
              <strong>الضابط</strong>
              <strong>التوقيت</strong>
              <strong>ما يتم مراجعته</strong>
              <strong>الحالة</strong>
            </div>

            ${this.data.controls.map(c => `
              <div class="controls-row controls-row-4">
                <span>${c[0]}</span>
                <span>${c[1]}</span>
                <span>${c[2]}</span>
                <span>${c[3]}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-panel">
          ${this.sectionTitle("دورة حياة حوكمة الذكاء الاصطناعي", "المراحل التي يمر بها كل مشروع AI قبل التشغيل المؤسسي.")}
          <div class="governance-lifecycle">
            ${this.data.lifecycle.map(step => `
              <div>
                <b>${step[0]}</b>
                <strong>${step[1]}</strong>
                <span>${step[2]}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-wide-grid">
          <div class="module-panel">
            ${this.sectionTitle("خارطة حوكمة 2026–2030", "تطور الحوكمة من التأسيس إلى الاستدامة.")}
            <div class="governance-roadmap">
              ${this.data.roadmap.map(r => `
                <div>
                  <b>${r[0]}</b>
                  <strong>${r[1]}</strong>
                  <span>${r[2]}</span>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("توصيات الحوكمة", "توصيات تنفيذية مولدة من Recommendation Engine.")}
            <div class="executive-list">
              ${recommendation.map((item, i) => `
                <div class="executive-item">
                  <strong>${String(i + 1).padStart(2, "0")}</strong>
                  <span>${item}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

      </section>
    `;
  },

  kpi(label, value, note) {
    if (window.AIW?.Widgets?.kpi) {
      return AIW.Widgets.kpi({ label, value, note });
    }

    return `
      <div class="module-card">
        <span>${label}</span>
        <strong>${value}</strong>
        <small>${note}</small>
      </div>
    `;
  },

  sectionTitle(title, desc) {
    if (window.AIW?.Widgets?.sectionTitle) {
      return AIW.Widgets.sectionTitle(title, desc);
    }

    return `
      <div class="module-section-title compact">
        <h2>${title}</h2>
        <p>${desc}</p>
      </div>
    `;
  },

  riskClass(level) {
    if (String(level).includes("عال")) return "red";
    if (String(level).includes("متوسط")) return "orange";
    return "green";
  },

  fallbackHero() {
    return `
      <div class="module-hero">
        <span class="module-kicker">Responsible AI · Governance</span>
        <h1>مركز حوكمة الذكاء الاصطناعي</h1>
        <p>إطار تنفيذي لضمان أن مشاريع الذكاء الاصطناعي تُدار بمسؤولية.</p>
      </div>
    `;
  }
};