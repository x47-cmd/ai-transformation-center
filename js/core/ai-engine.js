/* =========================================================
   AI Work - AI Engine V1.0 Final
   Enterprise Intelligence Layer
========================================================= */

window.AIW = window.AIW || {};

AIW.AI = {

    version: "1.0",

    get data() {
        return window.AIW?.Data || {};
    },

    get analytics() {
        return window.AIW?.Analytics || {};
    },

    overview() {

        const summary =
            this.analytics.executiveSummary
                ? this.analytics.executiveSummary()
                : {};

        return {
            score: summary.score || 0,
            status: summary.status || "Unknown",
            message: summary.message || "",
            recommendations: this.recommendations()
        };

    },

    recommendations() {

        if (this.analytics.recommendations) {
            return this.analytics.recommendations();
        }

        return [];

    },

    executiveInsight() {

        const score =
            this.analytics.score
                ? this.analytics.score()
                : {};

        if (score.executiveScore >= 85) {

            return {
                level: "Excellent",
                color: "green",
                title: "جاهزية عالية",
                message:
                    "المؤسسة جاهزة للتوسع المؤسسي في الذكاء الاصطناعي."
            };

        }

        if (score.executiveScore >= 70) {

            return {
                level: "Good",
                color: "green",
                title: "جاهزية جيدة",
                message:
                    "يمكن البدء بالمشاريع الاستراتيجية مع الاستمرار بقياس الأثر."
            };

        }

        if (score.executiveScore >= 50) {

            return {
                level: "Medium",
                color: "orange",
                title: "مرحلة البناء",
                message:
                    "يفضل زيادة Quick Wins وتفعيل الحوكمة قبل التوسع."
            };

        }

        return {

            level: "Low",

            color: "red",

            title: "التأسيس أولاً",

            message:
                "التركيز الحالي يجب أن يكون على بناء الحوكمة والبيانات ومؤشرات الأداء."

        };

    },

    nextBestActions() {

        const actions = [];

        const quickWins =
            this.analytics.quickWins
                ? this.analytics.quickWins()
                : [];

        if (quickWins.length) {

            actions.push({

                priority: 1,

                title:
                    "ابدأ بمشاريع Quick Wins",

                description:
                    "إثبات القيمة بسرعة يزيد دعم الإدارة."

            });

        }

        actions.push({

            priority: 2,

            title:
                "ربط جميع المشاريع بـ KPI",

            description:
                "كل مشروع يجب أن يملك مؤشر أداء واضح."

        });

        actions.push({

            priority: 3,

            title:
                "اعتماد لجنة الحوكمة",

            description:
                "اعتماد رسمي للذكاء الاصطناعي."

        });

        actions.push({

            priority: 4,

            title:
                "قياس ROI ربع سنوي",

            description:
                "متابعة القيمة الحقيقية للمبادرات."

        });

        return actions;

    },

    departmentAdvice(name) {

        const map = {

            "تقنية المعلومات":
                "ابدأ بالمساعد المؤسسي والتقارير الذكية.",

            "الأمن الرقمي":
                "ركز على AI SOC وتحليل المخاطر.",

            "الموارد البشرية":
                "ابدأ بالمساعد الداخلي وتحليل المهارات.",

            "المالية":
                "التنبؤ المالي والتقارير الذكية.",

            "خدمة المتعاملين":
                "ابدأ بالمساعد الذكي وتحليل رضا المتعاملين."

        };

        return map[name] || "ابدأ بالمشاريع السريعة منخفضة التكلفة.";

    },

    riskComment(score) {

        if (score >= 80)
            return "المخاطر تحت السيطرة.";

        if (score >= 60)
            return "توجد مخاطر تحتاج متابعة.";

        return "الحوكمة يجب أن تكون أولوية.";

    },

    maturityComment(score) {

        if (score >= 80)
            return "نضج مؤسسي مرتفع.";

        if (score >= 60)
            return "نضج جيد.";

        if (score >= 40)
            return "مرحلة انتقالية.";

        return "مرحلة تأسيس.";

    },

    generateExecutiveReport() {

        const overview = this.overview();

        const insight = this.executiveInsight();

        return {

            generatedAt:
                new Date().toISOString(),

            score:
                overview.score,

            status:
                insight.title,

            message:
                insight.message,

            recommendations:
                overview.recommendations,

            nextActions:
                this.nextBestActions()

        };

    }

};