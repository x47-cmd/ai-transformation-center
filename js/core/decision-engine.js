/* =========================================================
   AI Work - Decision Engine V1.0 Final
   Executive Decision Support System (DSS)
========================================================= */

window.AIW = window.AIW || {};

AIW.Decision = {

    version: "1.0",

    get data() {
        return window.AIW?.Data || {};
    },

    scoreIdea(idea) {

        let score = 0;

        // الأولوية
        switch (idea.priority) {
            case "عالية":
                score += 40;
                break;
            case "متوسطة":
                score += 25;
                break;
            default:
                score += 10;
        }

        // التكلفة
        switch (idea.cost) {
            case "منخفضة":
                score += 20;
                break;
            case "متوسطة":
                score += 10;
                break;
            default:
                score += 3;
        }

        // السهولة
        switch (idea.ease) {
            case "سهلة":
                score += 20;
                break;
            case "متوسطة":
                score += 10;
                break;
            default:
                score += 3;
        }

        // مدة التنفيذ
        const duration = String(idea.duration || "");

        if (duration.includes("3")) score += 20;
        else if (duration.includes("6")) score += 10;
        else score += 5;

        return Math.min(score, 100);
    },

    rankedIdeas() {

        return (this.data.ideas || [])
            .map(i => ({
                ...i,
                score: this.scoreIdea(i)
            }))
            .sort((a, b) => b.score - a.score);

    },

    quickWins() {

        return this.rankedIdeas().filter(i => i.score >= 80);

    },

    strategicProjects() {

        return this.rankedIdeas().filter(i => i.score >= 60);

    },

    recommendBudget(project) {

        switch (project.cost) {

            case "منخفضة":
                return "100K - 300K AED";

            case "متوسطة":
                return "300K - 1M AED";

            default:
                return "1M+ AED";

        }

    },

    recommendTimeline(project) {

        if (!project.duration)
            return "6 أشهر";

        return project.duration;

    },

    recommendTeam(project) {

        return [

            "Project Manager",

            "Business Owner",

            "AI Specialist",

            "Data Engineer",

            "Developer",

            "Cybersecurity",

            "Change Management"

        ];

    },

    recommendStage(project) {

        const score = this.scoreIdea(project);

        if (score >= 85)
            return "Quick Win";

        if (score >= 70)
            return "Wave 1";

        if (score >= 55)
            return "Wave 2";

        return "Strategic Future";

    },

    portfolioHealth() {

        const ideas = this.rankedIdeas();

        if (!ideas.length)
            return 0;

        return Math.round(
            ideas.reduce((a, b) => a + b.score, 0) /
            ideas.length
        );

    },

    topFiveProjects() {

        return this.rankedIdeas().slice(0, 5);

    },

    executiveDecision() {

        return {

            generatedAt: new Date().toISOString(),

            portfolioHealth: this.portfolioHealth(),

            quickWins: this.quickWins(),

            strategicProjects: this.strategicProjects(),

            topProjects: this.topFiveProjects()

        };

    }

};