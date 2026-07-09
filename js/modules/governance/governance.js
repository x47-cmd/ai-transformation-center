/* =========================================================
   AI Work - Governance Center V2.1
   Enterprise Biometric Intelligence Governance
   No UI Design Changes
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
        desc: "أي تنبيه يتعلق بتسجيل بيومتري، صلاحية مستخدم، أو سلوك غير اعتيادي لا يتحول إلى إجراء نهائي بدون مراجعة بشرية.",
        owner: "فريق المراجعة والحوكمة"
      },
      {
        icon: "🔐",
        title: "الخصوصية وحماية البيانات",
        desc: "استخدام أقل قدر ممكن من البيانات، وتقييد الوصول إلى البيانات الحساسة وسجلات الاستخدام حسب الحاجة التشغيلية فقط.",
        owner: "فريق البيانات والخصوصية"
      },
      {
        icon: "📌",
        title: "الشفافية والتوثيق",
        desc: "توثيق سبب التنبيه، المؤشرات المستخدمة، نتيجة المراجعة، والإجراء المتخذ لكل حالة.",
        owner: "فريق المبادرة"
      },
      {
        icon: "⚖️",
        title: "تقليل الإنذارات الخاطئة",
        desc: "مراجعة دقة النماذج بشكل دوري حتى لا يتم تصنيف المستخدمين أو التسجيلات بشكل غير عادل.",
        owner: "لجنة الحوكمة"
      },
      {
        icon: "🛡️",
        title: "الأمن الرقمي",
        desc: "مراقبة استخدام الصلاحيات والحسابات الحساسة بطريقة ذكية مع الحفاظ على ضوابط الوصول والتدقيق.",
        owner: "الأمن الرقمي"
      },
      {
        icon: "📊",
        title: "المساءلة والقياس",
        desc: "ربط كل مشروع بمؤشرات أداء واضحة مثل جودة التسجيل، عدد التنبيهات، زمن المراجعة، ونسبة الانخفاض في الأخطاء.",
        owner: "مكتب البرنامج"
      }
    ],

    committees: [
      {
        name: "لجنة اعتماد محفظة الأنظمة البيومترية",
        role: "اعتماد الأولويات، المشاريع، مؤشرات الأداء، ومراجعة نتائج المحفظة بشكل دوري.",
        cadence: "ربع سنوي",
        authority: "اعتماد نهائي"
      },
      {
        name: "فريق عمليات الأنظمة البيومترية والبوابات الذكية",
        role: "متابعة جودة التسجيلات، أداء البوابات، الأخطاء التشغيلية، ومخرجات التحليل.",
        cadence: "أسبوعي",
        authority: "متابعة تنفيذية"
      },
      {
        name: "فريق البيانات والخصوصية",
        role: "مراجعة مصادر البيانات، حساسية السجلات، صلاحية استخدامها، وآلية إخفاء أو تقليل البيانات.",
        cadence: "حسب المشروع",
        authority: "مراجعة إلزامية"
      },
      {
        name: "فريق الأمن الرقمي والصلاحيات",
        role: "مراجعة تنبيهات السلوك غير الاعتيادي، استخدام الصلاحيات، والجلسات الطويلة أو المشبوهة.",
        cadence: "حسب التنبيه",
        authority: "موافقة أمنية"
      },
      {
        name: "فريق Power BI والتحليلات التنفيذية",
        role: "بناء المؤشرات واللوحات التنفيذية وربط المشاريع بالتقارير الدورية.",
        cadence: "شهري",
        authority: "تحليل وقياس"
      }
    ],

    policies: [
      ["سياسة استخدام بيانات الأنظمة البيومترية", "تحدد حدود استخدام بيانات التسجيلات والجودة والسجلات التشغيلية في نماذج الذكاء الاصطناعي.", "مطلوبة"],
      ["سياسة مراقبة استخدام الحسابات والصلاحيات", "تحدد آلية تحليل السلوك، مدة الجلسات، استخدام الأجهزة، والصلاحيات الحساسة.", "مطلوبة"],
      ["سياسة الإشراف البشري على التنبيهات", "تؤكد أن الذكاء الاصطناعي يقدم تنبيهاً وتوصية ولا يتخذ إجراءً نهائياً على المستخدم أو السجل.", "مطلوبة"],
      ["سياسة جودة البيانات البيومترية", "تحدد معايير اكتمال البيانات، جودة التسجيل، التعارضات، والتكرار.", "مطلوبة"],
      ["سياسة المراجعة الدورية للنماذج", "تحدد مراجعة دقة النماذج، الإنذارات الخاطئة، ومؤشرات الأداء بشكل دوري.", "مخططة"]
    ],

    controls: [
      ["تقييم الفكرة", "قبل الاعتماد", "صلة الفكرة بالاختصاص، الأثر، الجاهزية، المخاطر، وقابلية القياس", "إلزامي"],
      ["تقييم البيانات", "قبل PoC", "مصادر البيانات، الجودة، الحساسية، الصلاحيات، وقابلية الربط", "إلزامي"],
      ["تقييم الخصوصية", "قبل الإطلاق", "تقليل البيانات، إخفاء البيانات غير اللازمة، وتحديد صلاحيات الوصول", "إلزامي"],
      ["اختبار Sandbox", "قبل التوسع", "تجربة النموذج على بيانات اختبار أو بيانات محدودة قبل التطبيق الأوسع", "إلزامي"],
      ["مراجعة بشرية", "مستمر", "كل حالة تخص تسجيل خاطئ، تعارض بيانات، أو استخدام غير اعتيادي للحساب", "إلزامي"],
      ["قياس الأثر", "شهري / ربع سنوي", "KPIs، جودة التسجيل، التنبيهات، زمن المراجعة، انخفاض الأخطاء", "إلزامي"]
    ],

    risks: [
      ["جودة البيانات", "عالٍ", "تطبيق قواعد جودة واضحة قبل تشغيل نماذج كشف الأخطاء والتعارضات.", "فريق البيانات"],
      ["الخصوصية", "عالٍ", "تقليل البيانات المعروضة في اللوحات وحصر الوصول حسب الحاجة.", "الخصوصية"],
      ["الإنذارات الخاطئة", "متوسط", "اعتماد مراجعة بشرية وتحديث عتبات التنبيه بناءً على النتائج.", "لجنة الحوكمة"],
      ["إساءة تفسير التنبيهات", "متوسط", "توضيح أن التنبيه مؤشر للمراجعة وليس إدانة أو قراراً نهائياً.", "فريق المراجعة"],
      ["تكامل الأنظمة", "متوسط", "البدء بلوحات قراءة وتحليل قبل أي تكامل تشغيلي مباشر.", "تقنية المعلومات"],
      ["حوكمة الصلاحيات", "عالٍ", "تحديد أدوار واضحة للمراجعة والاعتماد وتوثيق كل إجراء.", "الأمن الرقمي"]
    ],

    lifecycle: [
      ["1", "Use Case Intake", "استقبال الفكرة ضمن نطاق الأنظمة البيومترية أو البوابات الذكية أو الصلاحيات."],
      ["2", "Initial Assessment", "تقييم الأثر، الجاهزية، التكلفة، المخاطر، وقابلية القياس."],
      ["3", "Data Review", "مراجعة جودة البيانات وحساسيتها وقابلية استخدامها."],
      ["4", "Sandbox / PoC", "اختبار التحليل أو النموذج في بيئة محدودة وآمنة."],
      ["5", "Governance Approval", "اعتماد الخصوصية، الأمن، الإشراف البشري، ومؤشرات القياس."],
      ["6", "Deployment", "الإطلاق المرحلي وربط المشروع بلوحات Power BI والتنبيهات."],
      ["7", "Monitoring", "مراقبة الدقة، الإنذارات الخاطئة، الأثر، والتحسين المستمر."]
    ],

    roadmap: [
      ["2026", "تأسيس الحوكمة", "اعتماد السياسات، مصادر البيانات، وسجل المخاطر للمحفظة المتخصصة."],
      ["2027", "حوكمة التجارب", "ربط كل PoC بضوابط جودة بيانات ومراجعة بشرية ومؤشرات قياس."],
      ["2028", "حوكمة التنبيهات", "تفعيل آليات مراجعة تنبيهات التسجيلات والصلاحيات والبوابات."],
      ["2029", "حوكمة المنصة التنفيذية", "توحيد الحوكمة داخل لوحة تنفيذية وDecision Center."],
      ["2030", "حوكمة مستدامة", "تحسين مستمر، تدقيق، وقياس أثر شامل للمحفظة."]
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
    const recommendation = R?.governance ? R.governance() : [
      "اعتماد Human-in-the-Loop كشرط أساسي لكل تنبيه حساس.",
      "البدء بلوحات Power BI للقراءة والتحليل قبل أي تكامل تشغيلي مباشر.",
      "تحديد صلاحيات الوصول إلى لوحات المستخدمين والسجلات حسب الدور الوظيفي.",
      "تفعيل مراجعة دورية للإنذارات الخاطئة ودقة نماذج كشف الشذوذ.",
      "توثيق نتيجة كل مراجعة لتحسين النماذج ورفع جودة القرار."
    ];

    container.innerHTML = `
      <section class="module-page">

        ${W ? W.hero({
          kicker: "Responsible Biometric AI · Governance",
          title: "مركز حوكمة الذكاء الاصطناعي",
          description: "إطار تنفيذي لضمان أن مشاريع الذكاء الاصطناعي في الأنظمة البيومترية، البوابات الذكية، المستخدمين، والصلاحيات تُدار بمسؤولية، مع ضوابط للخصوصية، الأمن، الإشراف البشري، والمراجعة.",
          chips: ["👁️ Biometric Governance", "🧑‍⚖️ Human-in-the-Loop", "🔐 Privacy by Design", "🛡️ Access Risk Management"]
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
              <strong>الحوكمة هي شرط أساسي قبل مراقبة التسجيلات أو الصلاحيات بالذكاء الاصطناعي</strong>
              <p>
                لا يتم إطلاق أي نموذج يكشف أخطاء التسجيل أو السلوك غير الاعتيادي للمستخدمين
                بدون تقييم بيانات، خصوصية، أمن، إشراف بشري، ومؤشرات قياس واضحة.
              </p>
              <div class="aiw-progress"><div style="width:${governanceScore}%"></div></div>
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle("قرار الحوكمة الأساسي", "قاعدة ثابتة لكل مشروع AI عالي الحساسية.")}
            <div class="governance-decision-card">
              <strong>الذكاء الاصطناعي ينبه ولا يحكم</strong>
              <p>
                أي حالة تخص تسجيل خاطئ، تعارض بيانات، استخدام صلاحية، أو سلوك غير اعتيادي
                يجب أن تُعرض كمؤشر للمراجعة البشرية، وليس كقرار نهائي تلقائي.
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
            ${this.sectionTitle("اللجان والأدوار", "هيكل إدارة المحفظة المتخصصة.")}
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
          ${this.sectionTitle("السياسات المطلوبة", "وثائق وسياسات يجب اعتمادها قبل التوسع.")}
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
          ${this.sectionTitle("دورة حياة حوكمة الذكاء الاصطناعي", "المراحل التي يمر بها كل مشروع AI قبل التشغيل.")}
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
            ${this.sectionTitle("توصيات الحوكمة", "توصيات تنفيذية للمحفظة المتخصصة.")}
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
        <span class="module-kicker">Responsible Biometric AI · Governance</span>
        <h1>مركز حوكمة الذكاء الاصطناعي</h1>
        <p>إطار تنفيذي لضمان أن مشاريع الذكاء الاصطناعي في الأنظمة البيومترية والصلاحيات تُدار بمسؤولية.</p>
      </div>
    `;
  }
};