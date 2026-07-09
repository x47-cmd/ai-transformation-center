/* =========================================================
   AI Work
   Translation Engine V2.0
========================================================= */

window.AIW = window.AIW || {};

AIW.I18N = {

    current:
        localStorage.getItem("aiwLanguage") || "ar",

    dictionary: {

        ar: {

            appName: "مركز التحول المؤسسي بالذكاء الاصطناعي",
            appSubtitle:
                "منصة تنفيذية لإدارة استراتيجية ومشاريع ومؤشرات الذكاء الاصطناعي",

            dashboard: "الرئيسية",
            strategy: "الاستراتيجية",
            projects: "المشاريع",
            ideas: "الأفكار",
            roadmap: "خارطة الطريق",
            governance: "الحوكمة",
            reports: "التقارير",
            maturity: "النضج",
            innovation: "الابتكار",
            settings: "الإعدادات",

            ideasCount: "الأفكار",
            projectsCount: "المشاريع",
            departments: "الإدارات",
            maturityScore: "النضج",

            executiveDashboard:
                "لوحة القيادة التنفيذية",

            executiveStrategy:
                "مركز الاستراتيجية",

            projectsPortfolio:
                "محفظة المشاريع",

            useCaseCatalog:
                "دليل الأفكار",

            search:
                "بحث",

            filter:
                "تصفية",

            quickWins:
                "Quick Wins",

            highPriority:
                "أولوية عالية",

            mediumPriority:
                "أولوية متوسطة",

            lowPriority:
                "أولوية منخفضة"

        },

        en: {

            appName:
                "AI Transformation Center",

            appSubtitle:
                "Executive platform for AI Strategy, Projects and Enterprise Transformation",

            dashboard:
                "Dashboard",

            strategy:
                "Strategy",

            projects:
                "Projects",

            ideas:
                "AI Ideas",

            roadmap:
                "Roadmap",

            governance:
                "Governance",

            reports:
                "Reports",

            maturity:
                "AI Maturity",

            innovation:
                "Innovation",

            settings:
                "Settings",

            ideasCount:
                "Ideas",

            projectsCount:
                "Projects",

            departments:
                "Departments",

            maturityScore:
                "AI Maturity",

            executiveDashboard:
                "Executive Dashboard",

            executiveStrategy:
                "Strategy Center",

            projectsPortfolio:
                "Projects Portfolio",

            useCaseCatalog:
                "AI Use Case Catalog",

            search:
                "Search",

            filter:
                "Filter",

            quickWins:
                "Quick Wins",

            highPriority:
                "High Priority",

            mediumPriority:
                "Medium Priority",

            lowPriority:
                "Low Priority"

        }

    },

    t(key) {

        const lang = this.current;

        return (
            this.dictionary?.[lang]?.[key] ??
            this.dictionary.ar[key] ??
            key
        );

    },

    set(lang){

        if(!this.dictionary[lang]) return;

        this.current=lang;

        localStorage.setItem(
            "aiwLanguage",
            lang
        );

        document.documentElement.lang=lang;

        document.documentElement.dir=
            lang==="ar" ? "rtl":"ltr";

        window.dispatchEvent(
            new CustomEvent(
                "aiw:languageChanged",
                {
                    detail:{
                        language:lang
                    }
                }
            )
        );

    },

    toggle(){

        this.set(
            this.current==="ar"
            ? "en"
            : "ar"
        );

        if(window.AIW?.App){

            AIW.App.go(
                AIW.App.currentModule
            );

        }

    }

};

Object.freeze(AIW.I18N);