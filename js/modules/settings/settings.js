/* =========================================================
   AI Work - Executive Platform Center V2.0
   Scope: Enterprise Biometric Intelligence Platform
   Update: Executive Presentation Mode
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.settings = {
  id: "settings",
  title: "المزيد",
  icon: "⋮",

  getData() {
    return window.AIW?.Data || {};
  },

  getIdeas() {
    const data = this.getData();

    if (window.AIW?.BiometricAnalytics?.enrichIdeas) {
      return AIW.BiometricAnalytics.enrichIdeas();
    }

    return data.ideas || [];
  },

  capabilities: [
    {
      icon: "💡",
      title: "إدارة فرص الذكاء الاصطناعي",
      desc: "حصر الفرص التشغيلية وتصنيفها وتقييمها قبل تحويلها إلى مشاريع تنفيذية."
    },
    {
      icon: "📁",
      title: "إدارة المشاريع التنفيذية",
      desc: "متابعة المشاريع والمراحل والجاهزية والتقدم والمخرجات المتوقعة."
    },
    {
      icon: "📊",
      title: "التحليلات التنفيذية",
      desc: "تحويل بيانات التسجيلات والبوابات والصلاحيات إلى مؤشرات تدعم القرار."
    },
    {
      icon: "🧭",
      title: "دعم اتخاذ القرار",
      desc: "تقييم الفرص والمخاطر والأولوية وتقديم توصيات قابلة للمراجعة والتنفيذ."
    },
    {
      icon: "🔔",
      title: "التنبيهات الذكية",
      desc: "تنبيهات مرتبطة بجودة التسجيلات واستخدام الصلاحيات والبوابات والمخاطر."
    },
    {
      icon: "🛡️",
      title: "الحوكمة والامتثال",
      desc: "ضمان الإشراف البشري والخصوصية والمراجعة وتوثيق القرارات الحساسة."
    }
  ],

  alertAreas: [
    {
      title: "تنبيهات التسجيلات",
      desc: "اكتشاف التسجيلات الناقصة أو المتعارضة أو منخفضة الجودة.",
      status: "متاح"
    },
    {
      title: "تنبيهات الصلاحيات",
      desc: "مراقبة الاستخدام غير المعتاد والصلاحيات غير المستخدمة أو الحساسة.",
      status: "متاح"
    },
    {
      title: "تنبيهات البوابات",
      desc: "متابعة انخفاض الأداء والأخطاء والتوقفات المتكررة.",
      status: "مخطط"
    },
    {
      title: "تصعيد المخاطر",
      desc: "رفع الحالات عالية الخطورة إلى المسؤولين حسب مستوى الأولوية.",
      status: "مخطط"
    }
  ],

  governanceControls: [
    {
      title: "الإشراف البشري",
      desc: "القرار النهائي في الحالات الحساسة يبقى لدى الموظف المسؤول.",
      status: "إلزامي"
    },
    {
      title: "مراجعة الخصوصية",
      desc: "استخدام البيانات الضرورية فقط مع حماية المعلومات الشخصية.",
      status: "إلزامي"
    },
    {
      title: "توثيق القرارات",
      desc: "حفظ التوصيات وقرارات القبول والرفض لأغراض التدقيق.",
      status: "معتمد"
    },
    {
      title: "مراجعة المخاطر",
      desc: "تقييم أثر كل مشروع قبل الانتقال إلى التكامل أو التشغيل الفعلي.",
      status: "إلزامي"
    }
  ],

  render(container) {
    if (!container) return;

    const data = this.getData();
    const ideas = this.getIdeas();
    const departments = data.departments || [];
    const projects = data.flagshipProjects || [];
    const governance = data.governance || [];
    const risks = data.risks || [];

    const highPriority = ideas.filter(
      idea => idea.priority === "عالية"
    ).length;

    const quickWins = ideas.filter(
      idea =>
        idea.quickWin ||
        (idea.ease === "سهلة" && idea.cost === "منخفضة")
    ).length;

    container.innerHTML = `
      <section class="module-page">

        ${this.renderHero(
          ideas.length,
          departments.length,
          projects.length
        )}

        <div class="module-grid">
          ${this.kpi(
            "فرص الذكاء الاصطناعي",
            ideas.length,
            "AI Opportunities"
          )}

          ${this.kpi(
            "المحافظ التشغيلية",
            departments.length,
            "Solution Portfolios"
          )}

          ${this.kpi(
            "المشاريع الرئيسية",
            projects.length,
            "Flagship Projects"
          )}

          ${this.kpi(
            "الأولوية العالية",
            highPriority,
            "High Priority"
          )}

          ${this.kpi(
            "المكاسب السريعة",
            quickWins,
            "Quick Wins"
          )}

          ${this.kpi(
            "ضوابط الحوكمة",
            governance.length,
            "Governance Controls"
          )}
        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "قدرات المنصة",
            "القدرات التنفيذية التي تقدمها المنصة لدعم تطوير وإدارة مبادرات الذكاء الاصطناعي."
          )}

          <div class="settings-section-grid">
            ${this.capabilities.map(capability => `
              <article class="settings-section-card">
                <div class="settings-section-icon">
                  ${capability.icon}
                </div>

                <strong>${capability.title}</strong>

                <p>${capability.desc}</p>
              </article>
            `).join("")}
          </div>
        </div>

        <div class="module-wide-grid">

          <div class="module-panel">
            ${this.sectionTitle(
              "مركز التنبيهات الذكية",
              "مجالات التنبيه المرتبطة بالعمليات البيومترية والصلاحيات والبوابات."
            )}

            <div class="settings-items executive-items">
              ${this.alertAreas.map(item => `
                <div>
                  <span>
                    <strong>${item.title}</strong>
                    <small>${item.desc}</small>
                  </span>

                  <b class="${item.status === "متاح" ? "green" : "orange"}">
                    ${item.status}
                  </b>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "الحوكمة والإشراف",
              "الضوابط الأساسية لضمان استخدام مسؤول وآمن للذكاء الاصطناعي."
            )}

            <div class="settings-items executive-items">
              ${this.governanceControls.map(item => `
                <div>
                  <span>
                    <strong>${item.title}</strong>
                    <small>${item.desc}</small>
                  </span>

                  <b class="green">
                    ${item.status}
                  </b>
                </div>
              `).join("")}
            </div>
          </div>

        </div>

        <div class="module-panel">
          ${this.sectionTitle(
            "نطاق المنصة",
            "المجالات التشغيلية الرئيسية التي تغطيها منصة الذكاء الاصطناعي البيومترية."
          )}

          <div class="department-grid">
            ${departments.map(department => `
              <div class="department-chip">
                <strong>${department.name}</strong>

                <span>
                  ${this.getDepartmentCount(
                    department.name,
                    ideas
                  )} فرص
                  ·
                  جاهزية ${department.maturity || 0}%
                </span>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="module-wide-grid">

          <div class="module-panel">
            ${this.sectionTitle(
              "أبرز المخاطر التي تتم إدارتها",
              "ملخص للمخاطر الرئيسية والإجراءات المقترحة لمعالجتها."
            )}

            <div class="settings-items executive-items">
              ${risks.slice(0, 5).map(risk => `
                <div>
                  <span>
                    <strong>${risk.title}</strong>
                    <small>${risk.mitigation}</small>
                  </span>

                  <b class="${
                    risk.level === "عالٍ" ||
                    risk.level === "عالية"
                      ? "orange"
                      : "green"
                  }">
                    ${risk.level}
                  </b>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="module-panel">
            ${this.sectionTitle(
              "عن المنصة",
              "تعريف تنفيذي مختصر بالمشروع."
            )}

            <div class="settings-action-card executive-about-card">
              <strong>
                Enterprise Biometric Intelligence Platform
              </strong>

              <p>
                منصة تنفيذية متخصصة في إدارة فرص ومشاريع الذكاء الاصطناعي
                المرتبطة بالأنظمة البيومترية، البوابات الذكية،
                المستخدمين والصلاحيات، الأمن الرقمي،
                والتحليلات التنفيذية.
              </p>

              <p>
                تهدف المنصة إلى تحويل التحديات التشغيلية إلى مبادرات
                قابلة للتقييم والتنفيذ والقياس، مع المحافظة على
                الإشراف البشري والحوكمة والخصوصية.
              </p>
            </div>
          </div>

        </div>

      </section>
    `;
  },

  renderHero(ideasCount, departmentsCount, projectsCount) {
    if (window.AIW?.Widgets?.hero) {
      return AIW.Widgets.hero({
        kicker: "Executive Platform Center",
        title: "مركز المنصة التنفيذي",
        description:
          "نظرة شاملة على قدرات المنصة، نطاق العمل، التنبيهات الذكية، والحوكمة المؤسسية.",
        chips: [
          `💡 ${ideasCount} فرصة`,
          `🗂️ ${departmentsCount} محافظ`,
          `📁 ${projectsCount} مشروعاً رئيسياً`,
          "🛡️ Human-in-the-Loop"
        ]
      });
    }

    return `
      <div class="module-hero">
        <span class="module-kicker">
          Executive Platform Center
        </span>

        <h1>مركز المنصة التنفيذي</h1>

        <p>
          نظرة شاملة على قدرات المنصة، نطاق العمل،
          التنبيهات الذكية، والحوكمة المؤسسية.
        </p>

        <div class="aiw-chip-row">
          <span class="aiw-chip">
            💡 ${ideasCount} فرصة
          </span>

          <span class="aiw-chip">
            🗂️ ${departmentsCount} محافظ
          </span>

          <span class="aiw-chip">
            📁 ${projectsCount} مشروعاً رئيسياً
          </span>

          <span class="aiw-chip">
            🛡️ Human-in-the-Loop
          </span>
        </div>
      </div>
    `;
  },

  getDepartmentCount(departmentName, ideas) {
    return ideas.filter(
      idea => idea.department === departmentName
    ).length;
  },

  kpi(label, value, note) {
    if (window.AIW?.Widgets?.kpi) {
      return AIW.Widgets.kpi({
        label,
        value,
        note
      });
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
  }
};