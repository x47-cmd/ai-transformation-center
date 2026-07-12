/* =========================================================
   AI Work - Ideas Module V6.0
   Enterprise Biometric AI Opportunity Center
   Store V2.3 Native Architecture
   AI Opportunity Generator Integration

   File Path:
   js/modules/ideas/ideas.js

   Features:
   - Preserves the approved Ideas Center design and workflow
   - AIW.Store as Single Source of Truth
   - Persistent idea lifecycle
   - Submit / Approve / Reject / Reopen workflow
   - Safe idea-to-project conversion
   - Duplicate conversion prevention
   - Bidirectional idea/project linking
   - AI Opportunity Generator integration
   - Short problem input → full executive opportunity draft
   - Scope validation
   - Similarity / duplicate analysis
   - Classification, risk, KPI, owner and roadmap generation
   - Business case, readiness, executive summary, cost, ROI and decision
   - Human review before saving
   - Store subscription + cross-page synchronization
========================================================= */

window.AIW = window.AIW || {};
AIW.Modules = AIW.Modules || {};

AIW.Modules.ideas = {
  id: "ideas",
  title: "الأفكار",
  icon: "💡",
  version: "6.0.0",

  _container: null,
  _unsubscribeStore: null,
  _refreshTimer: null,
  _modal: null,
  _generatorModal: null,
  _pendingAction: null,
  _generatedPackage: null,
  _eventsBound: false,
  _syncBound: false,
  _isRendering: false,
  _isExecuting: false,
  _isGenerating: false,

  config: {
    actor: "الإدارة",
    targetIdeas: 100,
    refreshDelay: 80,
    selectedProjectKey: "aiwSelectedProjectId",
    selectedIdeaKey: "aiwSelectedIdeaId",
    styleId: "aiw-ideas-v60-styles",
    minProblemLength: 8,
    maxProblemLength: 1200
  },

  lifecycle: {
    IDEA: "idea",
    DRAFT: "draft",
    SUBMITTED: "submitted",
    PENDING: "pending-approval",
    APPROVED: "approved",
    REJECTED: "rejected",
    CONVERTED: "converted-to-project",
    ARCHIVED: "archived"
  },

  approvalStatus: {
    NOT_SUBMITTED: "not-submitted",
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    CANCELLED: "cancelled"
  },

  /* =======================================================
     Store Access
  ======================================================= */

  getStore() {
    return window.AIW?.Store || null;
  },

  getState() {
    const store = this.getStore();

    if (!store) {
      console.error("AI Work Ideas V6.0: AIW.Store is unavailable.");
      return {};
    }

    try {
      if (typeof store.getState === "function") {
        return store.getState() || {};
      }

      if (typeof store.getData === "function") {
        return store.getData() || {};
      }
    } catch (error) {
      console.error("AI Work Ideas V6.0: Unable to read Store state.", error);
    }

    return {};
  },

  getCollection(name) {
    const collection = this.getState()?.[name];
    return Array.isArray(collection) ? collection : [];
  },

  getRawIdeas() {
    const store = this.getStore();

    try {
      if (typeof store?.getIdeas === "function") {
        const ideas = store.getIdeas();
        if (Array.isArray(ideas)) return ideas;
      }
    } catch (error) {
      console.warn("AI Work Ideas V6.0: getIdeas failed.", error);
    }

    return this.getCollection("ideas");
  },

  getProjects() {
    const store = this.getStore();

    try {
      if (typeof store?.getProjects === "function") {
        const projects = store.getProjects();
        if (Array.isArray(projects)) return projects;
      }
    } catch (error) {
      console.warn("AI Work Ideas V6.0: getProjects failed.", error);
    }

    return this.getCollection("projects");
  },

  getIdeaById(ideaId) {
    if (ideaId === null || ideaId === undefined || ideaId === "") return null;

    const store = this.getStore();

    try {
      if (typeof store?.getIdea === "function") {
        const idea = store.getIdea(ideaId);
        if (idea) return idea;
      }

      if (typeof store?.find === "function") {
        const idea = store.find("ideas", ideaId);
        if (idea) return idea;
      }
    } catch (error) {
      console.warn("AI Work Ideas V6.0: Idea lookup failed.", error);
    }

    return this.getRawIdeas().find(
      idea => String(idea?.id) === String(ideaId)
    ) || null;
  },

  getProjectById(projectId) {
    if (projectId === null || projectId === undefined || projectId === "") {
      return null;
    }

    const store = this.getStore();

    try {
      if (typeof store?.getProject === "function") {
        const project = store.getProject(projectId);
        if (project) return project;
      }

      if (typeof store?.find === "function") {
        const project = store.find("projects", projectId);
        if (project) return project;
      }
    } catch (error) {
      console.warn("AI Work Ideas V6.0: Project lookup failed.", error);
    }

    return this.getProjects().find(
      project => String(project?.id) === String(projectId)
    ) || null;
  },

  getProjectByIdeaId(ideaId) {
    if (ideaId === null || ideaId === undefined || ideaId === "") return null;

    const store = this.getStore();

    try {
      if (typeof store?.getProjectByIdeaId === "function") {
        const project = store.getProjectByIdeaId(ideaId);
        if (project) return project;
      }
    } catch (error) {
      console.warn("AI Work Ideas V6.0: getProjectByIdeaId failed.", error);
    }

    const idea = this.getIdeaById(ideaId);

    if (idea?.projectId) {
      const linkedProject = this.getProjectById(idea.projectId);
      if (linkedProject) return linkedProject;
    }

    return this.getProjects().find(project => {
      const sourceIdeaId =
        project?.sourceIdeaId ??
        project?.ideaId ??
        project?.origin?.ideaId ??
        project?.source?.ideaId ??
        null;

      return String(sourceIdeaId) === String(ideaId);
    }) || null;
  },

  getIdeas() {
    const storedIdeas = this.getRawIdeas();
    let enrichedIdeas = storedIdeas;

    try {
      const analytics = window.AIW?.BiometricAnalytics;

      if (typeof analytics?.enrichIdeas === "function") {
        const result = analytics.enrichIdeas(
          storedIdeas.map(idea => ({ ...idea }))
        );

        if (Array.isArray(result)) enrichedIdeas = result;
      }
    } catch (error) {
      console.warn("AI Work Ideas V6.0: Idea enrichment failed.", error);
    }

    return enrichedIdeas.map((idea, index) => ({
      ...(storedIdeas[index] || {}),
      ...(idea || {}),
      id: idea?.id ?? storedIdeas[index]?.id
    }));
  },

  /* =======================================================
     Generic Store Execution
  ======================================================= */

  executeStoreMethod(methodNames = [], argumentFactories = []) {
    const store = this.getStore();

    if (!store) {
      return { success: false, message: "مخزن بيانات المنصة غير متاح." };
    }

    const methodName = methodNames.find(
      name => typeof store[name] === "function"
    );

    if (!methodName) {
      return {
        success: false,
        message: "العملية المطلوبة غير مدعومة في مخزن البيانات."
      };
    }

    const method = store[methodName].bind(store);
    const factories = Array.isArray(argumentFactories)
      ? argumentFactories
      : [argumentFactories];

    let lastError = null;

    for (const factory of factories) {
      try {
        const args = typeof factory === "function"
          ? factory(method)
          : Array.isArray(factory)
            ? factory
            : [];

        const result = method(...args);

        if (result?.success === false) return result;
        if (result === false || result === null) continue;

        return this.normalizeActionResult(result);
      } catch (error) {
        lastError = error;
      }
    }

    console.error(`AI Work Ideas V6.0: ${methodName} failed.`, lastError);

    return {
      success: false,
      message: "تعذر تنفيذ العملية.",
      error: lastError
    };
  },

  normalizeActionResult(result) {
    if (result?.success === true) return result;

    if (result && typeof result === "object") {
      return { success: true, ...result, result };
    }

    return { success: Boolean(result), result };
  },

  addIdea(idea = {}) {
    return this.executeStoreMethod(
      ["addIdea", "createIdea", "add"],
      [
        () => [idea],
        () => ["ideas", idea]
      ]
    );
  },

  updateIdea(ideaId, changes = {}) {
    return this.executeStoreMethod(
      ["updateIdea", "patchIdea", "update", "patch"],
      [
        () => [ideaId, changes],
        () => ["ideas", ideaId, changes],
        () => {
          const index = this.getRawIdeas().findIndex(
            idea => String(idea?.id) === String(ideaId)
          );
          return [`ideas.${index}`, changes];
        }
      ]
    );
  },

  removeIdea(ideaId) {
    return this.executeStoreMethod(
      ["removeIdea", "deleteIdea", "remove"],
      [
        () => [ideaId],
        () => ["ideas", ideaId]
      ]
    );
  },

  /* =======================================================
     AI Generator Access
  ======================================================= */

  getGenerator() {
    return window.AIW?.IdeaGenerator ||
      window.AIW?.Extensions?.IdeaGenerator ||
      null;
  },

  getExtension(name) {
    return window.AIW?.Extensions?.[name] || null;
  },

  getGeneratorStatus() {
    const required = [
      "IdeaGenerator",
      "IdeaPromptBuilder",
      "IdeaValidator",
      "IdeaAIEngine",
      "IdeaSimilarity",
      "IdeaClassifier",
      "IdeaRiskEngine",
      "IdeaKPIBuilder",
      "IdeaOwnerEngine",
      "IdeaRoadmapEngine",
      "IdeaBusinessCaseGenerator",
      "IdeaProjectReadiness",
      "IdeaExecutiveSummary",
      "IdeaCostEstimator",
      "IdeaROIEstimator",
      "IdeaDecisionEngine"
    ];

    const missing = required.filter(name => {
      if (name === "IdeaGenerator") return !this.getGenerator();
      return !this.getExtension(name);
    });

    return {
      ready: missing.length === 0,
      missing,
      loaded: required.length - missing.length,
      total: required.length
    };
  },

  async generateOpportunity(problemText) {
    const problem = String(problemText || "").trim();

    if (problem.length < this.config.minProblemLength) {
      throw new Error(
        `يرجى كتابة مشكلة أو تحدٍ واضح لا يقل عن ${this.config.minProblemLength} أحرف.`
      );
    }

    if (problem.length > this.config.maxProblemLength) {
      throw new Error(
        `الحد الأقصى لوصف المشكلة هو ${this.config.maxProblemLength} حرفاً.`
      );
    }

    const generator = this.getGenerator();

    if (!generator?.generate && !generator?.analyze) {
      throw new Error("محرك توليد الأفكار غير محمّل.");
    }

    const existingIdeas = this.getRawIdeas().map(idea => ({
      id: idea.id,
      title: idea.title,
      problem: idea.challenge || idea.problemStatement || "",
      department: idea.department
    }));

    const generationResult = await Promise.resolve(
      typeof generator.generate === "function"
        ? generator.generate(problem, {
            source: "ideas-module",
            existingIdeas
          })
        : generator.analyze(problem, {
            source: "ideas-module",
            existingIdeas
          })
    );

    const draft =
      generationResult?.draft ||
      generationResult?.result?.draft ||
      generationResult;

    if (!draft || generationResult?.success === false) {
      throw new Error(
        generationResult?.message ||
        generationResult?.reason ||
        "تعذر إنشاء مسودة الفكرة."
      );
    }

    const classifier = this.getExtension("IdeaClassifier");
    const riskEngine = this.getExtension("IdeaRiskEngine");
    const kpiBuilder = this.getExtension("IdeaKPIBuilder");
    const ownerEngine = this.getExtension("IdeaOwnerEngine");
    const roadmapEngine = this.getExtension("IdeaRoadmapEngine");
    const similarityEngine = this.getExtension("IdeaSimilarity");
    const businessCaseGenerator = this.getExtension(
      "IdeaBusinessCaseGenerator"
    );
    const readinessEngine = this.getExtension("IdeaProjectReadiness");
    const executiveSummaryEngine = this.getExtension(
      "IdeaExecutiveSummary"
    );
    const costEstimator = this.getExtension("IdeaCostEstimator");
    const roiEstimator = this.getExtension("IdeaROIEstimator");
    const decisionEngine = this.getExtension("IdeaDecisionEngine");

    const classification = classifier?.classify
      ? classifier.classify([
          draft.title,
          draft.summary,
          draft.problemStatement,
          draft.proposedSolution
        ].filter(Boolean).join(" "))
      : {
          portfolio: draft.scope || "الأنظمة البيومترية",
          department: draft.department || "الأنظمة البيومترية",
          confidence: 50
        };

    const risk = riskEngine?.analyze
      ? riskEngine.analyze([
          draft.title,
          draft.problemStatement,
          draft.proposedSolution
        ].filter(Boolean).join(" "))
      : {
          riskLevel: draft.riskLevel || "متوسط",
          riskScore: 55,
          controls: []
        };

    const kpiResult = kpiBuilder?.build
      ? kpiBuilder.build(classification.portfolio)
      : { kpis: draft.kpis || [] };

    const ownership = ownerEngine?.assign
      ? ownerEngine.assign(classification.portfolio)
      : {
          owner: draft.owner || "يحدد لاحقاً",
          stakeholders: [],
          implementationTeam: []
        };

    const roadmap = roadmapEngine?.build
      ? roadmapEngine.build(classification.portfolio)
      : {
          estimatedTimeline: draft.estimatedDuration || "يحدد لاحقاً",
          milestones: [],
          phases: []
        };

    const duplicateAnalysis = similarityEngine?.find
      ? similarityEngine.find(problem, existingIdeas)
      : draft.duplicateAnalysis || {
          duplicate: false,
          highestSimilarity: 0,
          matchedIdea: null,
          matches: []
        };

    const normalizedIdea = {
      ...draft,
      sourceProblem: problem,
      title: draft.title || `حل ذكي لـ ${problem}`,
      summary:
        draft.summary ||
        `فرصة ذكاء اصطناعي مقترحة لمعالجة: ${problem}`,
      problemStatement:
        draft.problemStatement ||
        draft.challenge ||
        problem,
      challenge:
        draft.challenge ||
        draft.problemStatement ||
        problem,
      proposedSolution:
        draft.proposedSolution ||
        draft.solution ||
        "استخدام الذكاء الاصطناعي لتحليل المشكلة واقتراح إجراءات قابلة للمراجعة.",
      solution:
        draft.solution ||
        draft.proposedSolution ||
        "استخدام الذكاء الاصطناعي لتحليل المشكلة واقتراح إجراءات قابلة للمراجعة.",
      aiRole:
        draft.aiRole ||
        "تحليل البيانات واكتشاف الأنماط واقتراح أفضل الإجراءات.",
      expectedBenefits:
        draft.expectedBenefits ||
        draft.benefits ||
        [
          "رفع الكفاءة التشغيلية",
          "تقليل الأخطاء",
          "تسريع اتخاذ القرار"
        ],
      benefits:
        draft.benefits ||
        draft.expectedBenefits ||
        [
          "رفع الكفاءة التشغيلية",
          "تقليل الأخطاء",
          "تسريع اتخاذ القرار"
        ],
      department:
        classification.department ||
        draft.department ||
        "الأنظمة البيومترية",
      portfolio:
        classification.portfolio ||
        draft.scope ||
        "الأنظمة البيومترية",
      classificationConfidence:
        classification.confidence || 50,
      owner:
        ownership.owner ||
        draft.owner ||
        "يحدد لاحقاً",
      stakeholders:
        ownership.stakeholders || [],
      implementationTeam:
        ownership.implementationTeam || [],
      riskLevel:
        risk.riskLevel ||
        draft.riskLevel ||
        "متوسط",
      riskScore:
        Number(risk.riskScore ?? 55),
      riskControls:
        risk.controls || [],
      priority:
        draft.priority || "متوسطة",
      readiness:
        Number(draft.readiness ?? 45),
      decisionScore:
        Number(draft.decisionScore ?? 50),
      kpis:
        kpiResult?.kpis?.length
          ? kpiResult.kpis
          : draft.kpis || [],
      roadmap,
      estimatedDuration:
        draft.estimatedDuration ||
        roadmap.estimatedTimeline ||
        "يحدد لاحقاً",
      duplicateAnalysis
    };

    const businessCase = businessCaseGenerator?.generate
      ? businessCaseGenerator.generate(normalizedIdea, {
          source: "AI Idea Generator"
        })
      : null;

    const readiness = readinessEngine?.assess
      ? readinessEngine.assess(normalizedIdea, businessCase || {})
      : null;

    const cost = costEstimator?.estimate
      ? costEstimator.estimate({
          readiness:
            readiness?.score ??
            normalizedIdea.readiness,
          riskScore:
            readiness?.scores?.security ??
            normalizedIdea.riskScore,
          complexityScore:
            Number(normalizedIdea.complexityScore ?? 60)
        })
      : null;

    const roi = roiEstimator?.estimate
      ? roiEstimator.estimate({
          totalEstimatedCost:
            cost?.totalEstimatedCost ||
            150000
        })
      : null;

    const strategicScore =
      businessCase?.strategicValue?.score ??
      normalizedIdea.decisionScore ??
      60;

    const decision = decisionEngine?.decide
      ? decisionEngine.decide({
          readinessScore:
            readiness?.score ??
            normalizedIdea.readiness,
          riskScore:
            normalizedIdea.riskScore,
          roiPercent:
            roi?.roiPercent ?? 0,
          strategicScore
        })
      : null;

    const executiveSummary = executiveSummaryEngine?.generate
      ? executiveSummaryEngine.generate(
          normalizedIdea,
          businessCase || {},
          readiness || {}
        )
      : null;

    return {
      generationResult,
      idea: normalizedIdea,
      classification,
      risk,
      kpis: kpiResult,
      ownership,
      roadmap,
      duplicateAnalysis,
      businessCase,
      readiness,
      cost,
      roi,
      decision,
      executiveSummary,
      generatedAt: new Date().toISOString()
    };
  },

  mapGeneratedPackageToIdea(pkg) {
    const idea = pkg?.idea || {};
    const readiness = pkg?.readiness || {};
    const cost = pkg?.cost || {};
    const roi = pkg?.roi || {};
    const decision = pkg?.decision || {};
    const executiveSummary = pkg?.executiveSummary || {};
    const businessCase = pkg?.businessCase || {};

    const id =
      idea.id ||
      `idea-ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return {
      id,
      title: idea.title,
      department: idea.department,
      portfolio: idea.portfolio,
      challenge: idea.challenge || idea.problemStatement,
      problemStatement: idea.problemStatement || idea.challenge,
      solution: idea.solution || idea.proposedSolution,
      proposedSolution: idea.proposedSolution || idea.solution,
      aiRole: idea.aiRole,
      benefits: idea.benefits || idea.expectedBenefits,
      expectedBenefits: idea.expectedBenefits || idea.benefits,
      owner: idea.owner,
      stakeholders: idea.stakeholders || [],
      implementationTeam: idea.implementationTeam || [],
      priority: idea.priority || "متوسطة",
      riskLevel: idea.riskLevel || "متوسط",
      riskScore: Number(idea.riskScore ?? 55),
      riskControls: idea.riskControls || [],
      readiness: Number(readiness.score ?? idea.readiness ?? 45),
      decisionScore: Number(
        decision.confidenceScore ??
        idea.decisionScore ??
        50
      ),
      decisionLevel:
        decision.decisionLabel ||
        readiness.decision?.label ||
        "يحتاج مراجعة",
      duration:
        idea.estimatedDuration ||
        businessCase.estimatedDuration ||
        idea.roadmap?.estimatedTimeline ||
        "يحدد لاحقاً",
      cost:
        cost.totalEstimatedCost
          ? `${this.formatNumber(cost.totalEstimatedCost)} AED`
          : idea.estimatedCost || "يحدد لاحقاً",
      costLevel:
        cost.estimateLevel || "تقديري",
      ease:
        readiness.score >= 75
          ? "متوسطة"
          : "تحتاج دراسة",
      kpis: idea.kpis || [],
      roadmap: idea.roadmap || {},
      milestones: idea.roadmap?.milestones || [],
      implementationPhases:
        idea.roadmap?.phases || [],
      businessCase,
      readinessAssessment: readiness,
      costEstimate: cost,
      roiEstimate: roi,
      executiveSummary,
      aiDecision: decision,
      duplicateAnalysis:
        pkg.duplicateAnalysis ||
        idea.duplicateAnalysis ||
        null,
      sourceProblem: idea.sourceProblem,
      generatedByAI: true,
      generationVersion: "AI Opportunity Generator V1",
      lifecycleStatus: this.lifecycle.DRAFT,
      ideaStatus: this.lifecycle.DRAFT,
      approvalStatus: this.approvalStatus.NOT_SUBMITTED,
      approval: {
        status: this.approvalStatus.NOT_SUBMITTED,
        submittedAt: null,
        submittedBy: null,
        decidedAt: null,
        decidedBy: null
      },
      convertedToProject: false,
      projectId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        source: "ai-idea-generator",
        generatedAt: pkg.generatedAt || new Date().toISOString(),
        humanReviewRequired: true
      }
    };
  },

  saveGeneratedIdea() {
    if (!this._generatedPackage?.idea) {
      this.showToast("لا توجد مسودة جاهزة للحفظ.", "error");
      return;
    }

    const duplicate = this._generatedPackage.duplicateAnalysis;

    if (
      duplicate?.duplicate === true &&
      duplicate?.highestSimilarity >= 90
    ) {
      const confirmed = window.confirm(
        `يوجد تشابه مرتفع بنسبة ${duplicate.highestSimilarity}% مع فكرة موجودة. هل تريد حفظ الفكرة رغم ذلك؟`
      );

      if (!confirmed) return;
    }

    const ideaRecord = this.mapGeneratedPackageToIdea(
      this._generatedPackage
    );

    const result = this.addIdea(ideaRecord);

    if (!result?.success) {
      this.showToast(
        result?.message || "تعذر حفظ الفكرة الجديدة.",
        "error"
      );
      return;
    }

    this.closeGeneratorModal();
    this.showToast(
      "تم حفظ الفكرة الذكية كمسودة بنجاح.",
      "success"
    );
    this.scheduleRefresh();
  },

  /* =======================================================
     Lifecycle
  ======================================================= */

  normalizeStatus(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/_/g, "-");
  },

  getApprovalStatus(idea = {}) {
    const status = this.normalizeStatus(
      idea?.approval?.status ??
      idea?.approvalStatus ??
      ""
    );

    if (["pending", "submitted", "pending-approval"].includes(status)) {
      return this.approvalStatus.PENDING;
    }

    if (status === "approved") return this.approvalStatus.APPROVED;
    if (status === "rejected") return this.approvalStatus.REJECTED;

    return this.approvalStatus.NOT_SUBMITTED;
  },

  getLifecycleStatus(idea = {}) {
    if (
      idea?.convertedToProject === true ||
      idea?.conversion?.converted === true ||
      idea?.projectId
    ) {
      return this.lifecycle.CONVERTED;
    }

    const rawStatus = this.normalizeStatus(
      idea?.lifecycleStatus ??
      idea?.ideaStatus ??
      idea?.status ??
      ""
    );

    if (["converted", "converted-to-project"].includes(rawStatus)) {
      return this.lifecycle.CONVERTED;
    }

    if (["submitted", "pending", "pending-approval"].includes(rawStatus)) {
      return this.lifecycle.PENDING;
    }

    if (rawStatus === "approved") return this.lifecycle.APPROVED;
    if (rawStatus === "rejected") return this.lifecycle.REJECTED;
    if (rawStatus === "archived") return this.lifecycle.ARCHIVED;
    if (rawStatus === "draft") return this.lifecycle.DRAFT;

    const approvalStatus = this.getApprovalStatus(idea);

    if (approvalStatus === this.approvalStatus.APPROVED) {
      return this.lifecycle.APPROVED;
    }

    if (approvalStatus === this.approvalStatus.PENDING) {
      return this.lifecycle.PENDING;
    }

    if (approvalStatus === this.approvalStatus.REJECTED) {
      return this.lifecycle.REJECTED;
    }

    return this.lifecycle.IDEA;
  },

  isConverted(idea = {}) {
    return (
      this.getLifecycleStatus(idea) === this.lifecycle.CONVERTED ||
      Boolean(idea?.id && this.getProjectByIdeaId(idea.id))
    );
  },

  isPendingApproval(idea = {}) {
    return this.getLifecycleStatus(idea) === this.lifecycle.PENDING;
  },

  isApproved(idea = {}) {
    return this.getLifecycleStatus(idea) === this.lifecycle.APPROVED;
  },

  isRejected(idea = {}) {
    return this.getLifecycleStatus(idea) === this.lifecycle.REJECTED;
  },

  canSubmit(idea = {}) {
    const status = this.getLifecycleStatus(idea);

    return (
      [this.lifecycle.IDEA, this.lifecycle.DRAFT].includes(status) &&
      !this.isConverted(idea)
    );
  },

  canApprove(idea = {}) {
    return this.isPendingApproval(idea) && !this.isConverted(idea);
  },

  canReject(idea = {}) {
    return this.isPendingApproval(idea) && !this.isConverted(idea);
  },

  canReopen(idea = {}) {
    return this.isRejected(idea) && !this.isConverted(idea);
  },

  canConvert(idea = {}) {
    return (
      this.isApproved(idea) &&
      !this.isConverted(idea) &&
      !this.getProjectByIdeaId(idea?.id)
    );
  },

  getLifecycleLabel(idea = {}) {
    const labels = {
      [this.lifecycle.IDEA]: "فكرة قابلة للدراسة",
      [this.lifecycle.DRAFT]: "مسودة فكرة",
      [this.lifecycle.PENDING]: "بانتظار الاعتماد",
      [this.lifecycle.APPROVED]: "فكرة معتمدة",
      [this.lifecycle.REJECTED]: "غير معتمدة",
      [this.lifecycle.CONVERTED]: "تحولت إلى مشروع",
      [this.lifecycle.ARCHIVED]: "مؤرشفة"
    };

    return labels[this.getLifecycleStatus(idea)] || labels[this.lifecycle.IDEA];
  },

  getLifecycleClass(idea = {}) {
    const status = this.getLifecycleStatus(idea);

    if (status === this.lifecycle.PENDING) return "pending";
    if (status === this.lifecycle.APPROVED) return "approved";
    if (status === this.lifecycle.REJECTED) return "rejected";
    if (status === this.lifecycle.CONVERTED) return "converted";
    if (status === this.lifecycle.ARCHIVED) return "archived";
    return status === this.lifecycle.DRAFT ? "draft" : "idea";
  },

  getLifecycleIcon(idea = {}) {
    const icons = {
      [this.lifecycle.IDEA]: "💡",
      [this.lifecycle.DRAFT]: "📝",
      [this.lifecycle.PENDING]: "⏳",
      [this.lifecycle.APPROVED]: "✅",
      [this.lifecycle.REJECTED]: "⛔",
      [this.lifecycle.CONVERTED]: "📁",
      [this.lifecycle.ARCHIVED]: "🗄️"
    };

    return icons[this.getLifecycleStatus(idea)] || "💡";
  },

  /* =======================================================
     Workflow Operations
  ======================================================= */

  submitForApproval(ideaId, options = {}) {
    const idea = this.getIdeaById(ideaId);

    if (!idea) return { success: false, message: "لم يتم العثور على الفكرة." };

    const actor = options.actor || this.config.actor;
    const notes = options.notes || "";

    return this.executeStoreMethod(
      ["submitIdeaForApproval", "submitIdea"],
      [
        () => [ideaId, { actor, notes }],
        method => method.length >= 3
          ? [ideaId, actor, notes]
          : [ideaId, { actor, notes }]
      ]
    );
  },

  approveIdea(ideaId, options = {}) {
    const actor = options.actor || this.config.actor;
    const notes = options.notes || "";

    return this.executeStoreMethod(
      ["approveIdea"],
      [
        () => [ideaId, { actor, notes }],
        method => method.length >= 3
          ? [ideaId, actor, notes]
          : [ideaId, { actor, notes }]
      ]
    );
  },

  rejectIdea(ideaId, options = {}) {
    const actor = options.actor || this.config.actor;
    const reason = options.reason || options.notes || "";

    return this.executeStoreMethod(
      ["rejectIdea"],
      [
        () => [ideaId, { actor, reason, notes: reason }],
        method => method.length >= 3
          ? [ideaId, actor, reason]
          : [ideaId, { actor, reason, notes: reason }]
      ]
    );
  },

  reopenIdea(ideaId, options = {}) {
    const idea = this.getIdeaById(ideaId);

    if (!idea) return { success: false, message: "لم يتم العثور على الفكرة." };

    const actor = options.actor || this.config.actor;
    const notes = options.notes || "";
    const store = this.getStore();

    if (typeof store?.reopenIdea === "function") {
      return this.executeStoreMethod(
        ["reopenIdea"],
        [() => [ideaId, { actor, notes }]]
      );
    }

    return this.updateIdea(ideaId, {
      lifecycleStatus: this.lifecycle.IDEA,
      ideaStatus: this.lifecycle.IDEA,
      approvalStatus: this.approvalStatus.NOT_SUBMITTED,
      approval: {
        ...(idea.approval || {}),
        status: this.approvalStatus.NOT_SUBMITTED,
        reason: null,
        notes,
        decidedAt: null,
        decidedBy: null,
        reopenedAt: new Date().toISOString(),
        reopenedBy: actor
      }
    });
  },

  createProjectFromIdea(ideaId, options = {}) {
    const idea = this.getIdeaById(ideaId);

    if (!idea) return { success: false, message: "لم يتم العثور على الفكرة." };

    const existingProject = this.getProjectByIdeaId(ideaId);

    if (existingProject) {
      return {
        success: false,
        duplicate: true,
        project: existingProject,
        message: "يوجد مشروع مرتبط بهذه الفكرة مسبقاً."
      };
    }

    if (!this.isApproved(idea)) {
      return {
        success: false,
        message: "يجب اعتماد الفكرة قبل تحويلها إلى مشروع."
      };
    }

    const actor = options.actor || this.config.actor;
    const notes = options.notes || "";

    const phases =
      idea.implementationPhases?.length
        ? idea.implementationPhases
        : [
            "تحليل المتطلبات",
            "التصميم",
            "التطوير",
            "الاختبار",
            "الإطلاق"
          ];

    const projectData = {
      title: idea.title || "مشروع جديد",
      department: idea.department || "غير مصنف",
      description:
        idea.solution ||
        idea.proposedSolution ||
        idea.challenge ||
        "مشروع تنفيذي منشأ من فكرة معتمدة.",
      owner: idea.owner || "غير محدد",
      status: "planned",
      progress: 0,
      readiness:
        idea.readinessAssessment?.score ??
        idea.readiness ??
        0,
      riskLevel: idea.riskLevel || "متوسط",
      priority: idea.priority || "متوسطة",
      sourceIdeaId: idea.id,
      ideaId: idea.id,
      origin: { type: "idea", ideaId: idea.id },
      createdFromIdea: true,
      tasks: phases.map((phase, index) => ({
        id: `task-${Date.now()}-${index + 1}`,
        title:
          typeof phase === "string"
            ? phase
            : phase.title || phase.name || `المرحلة ${index + 1}`,
        completed: false,
        order: index + 1
      })),
      businessCase: idea.businessCase || null,
      kpis: idea.kpis || [],
      roadmap: idea.roadmap || {},
      costEstimate: idea.costEstimate || null,
      roiEstimate: idea.roiEstimate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(options.project || {})
    };

    return this.executeStoreMethod(
      ["createProjectFromIdea", "convertIdeaToProject"],
      [
        () => [
          ideaId,
          {
            actor,
            convertedBy: actor,
            requireApproval: true,
            autoApprove: false,
            notes,
            project: projectData,
            projectData
          }
        ],
        method => method.length >= 3
          ? [ideaId, projectData, { actor, notes }]
          : [ideaId, { actor, notes, project: projectData, projectData }]
      ]
    );
  },

  approveAndCreateProject(ideaId, options = {}) {
    const store = this.getStore();
    const actor = options.actor || this.config.actor;
    const notes = options.notes || "";

    if (typeof store?.approveAndCreateProject === "function") {
      return this.executeStoreMethod(
        ["approveAndCreateProject"],
        [
          () => [
            ideaId,
            {
              actor,
              approvedBy: actor,
              convertedBy: actor,
              approvalNotes: notes,
              notes,
              project: options.project || {}
            }
          ]
        ]
      );
    }

    const approvalResult = this.approveIdea(ideaId, { actor, notes });

    if (!approvalResult.success) return approvalResult;

    return this.createProjectFromIdea(ideaId, {
      actor,
      notes,
      project: options.project || {}
    });
  },

  /* =======================================================
     Rendering Helpers
  ======================================================= */

  groupByDepartment(ideas = []) {
    return ideas.reduce((groups, idea) => {
      const department = idea?.department || "غير مصنف";
      if (!groups[department]) groups[department] = [];
      groups[department].push(idea);
      return groups;
    }, {});
  },

  badgeClass(value) {
    const normalized = this.normalizeStatus(value);

    if (["عالية", "عالي", "high", "critical"].includes(normalized)) {
      return "high";
    }

    if (["متوسطة", "متوسط", "medium"].includes(normalized)) {
      return "medium";
    }

    if (["منخفضة", "منخفض", "low"].includes(normalized)) {
      return "low";
    }

    return "";
  },

  isHighPriority(idea = {}) {
    return ["عالية", "عالي", "high", "critical"].includes(
      this.normalizeStatus(idea.priority)
    );
  },

  isMediumPriority(idea = {}) {
    return ["متوسطة", "متوسط", "medium"].includes(
      this.normalizeStatus(idea.priority)
    );
  },

  isLowPriority(idea = {}) {
    return ["منخفضة", "منخفض", "low"].includes(
      this.normalizeStatus(idea.priority)
    );
  },

  isQuickWin(idea = {}) {
    if (idea.quickWin === true || idea.isQuickWin === true) return true;

    const ease = this.normalizeStatus(
      idea.ease ?? idea.difficulty ?? idea.complexity ?? ""
    );

    const cost = this.normalizeStatus(
      idea.cost ?? idea.costLevel ?? ""
    );

    return (
      ["سهلة", "سهل", "easy", "low", "منخفضة", "منخفض"].includes(ease) &&
      ["low", "منخفضة", "منخفض"].includes(cost)
    );
  },

  getDepartmentCount(departmentName, ideas = []) {
    return ideas.filter(
      idea => String(idea?.department) === String(departmentName)
    ).length;
  },

  valueToText(value, fallback = "لا توجد تفاصيل متاحة.") {
    if (Array.isArray(value)) {
      const cleaned = value
        .map(item => {
          if (item && typeof item === "object") {
            return item.title || item.name || item.description || "";
          }
          return String(item || "");
        })
        .filter(Boolean);

      return cleaned.length ? cleaned.join("، ") : fallback;
    }

    if (value && typeof value === "object") {
      return value.title || value.name || value.description || fallback;
    }

    const text = String(value ?? "").trim();
    return text || fallback;
  },

  getPipeline(ideas = []) {
    const store = this.getStore();

    try {
      if (typeof store?.getPortfolioPipeline === "function") {
        const pipeline = store.getPortfolioPipeline();
        if (pipeline && typeof pipeline === "object") return pipeline;
      }

      if (typeof store?.getPipelineStats === "function") {
        const pipeline = store.getPipelineStats();
        if (pipeline && typeof pipeline === "object") return pipeline;
      }
    } catch (error) {
      console.warn("AI Work Ideas V6.0: Pipeline reader failed.", error);
    }

    return {
      totalIdeas: ideas.length,
      pendingApproval: ideas.filter(idea => this.isPendingApproval(idea)).length,
      approvedIdeas: ideas.filter(idea => this.isApproved(idea)).length,
      rejectedIdeas: ideas.filter(idea => this.isRejected(idea)).length,
      convertedIdeas: ideas.filter(idea => this.isConverted(idea)).length,
      totalProjects: this.getProjects().length
    };
  },

  renderIdeaActions(idea) {
    const ideaId = this.escapeAttribute(idea?.id ?? "");

    if (this.isConverted(idea)) {
      return `
        <div class="idea-workflow-actions">
          <button type="button" class="idea-action-button primary"
            data-idea-action="open-project" data-idea-id="${ideaId}">
            📁 فتح المشروع
          </button>
          <span class="idea-action-note">
            تم إنشاء مشروع تنفيذي مرتبط بهذه الفكرة.
          </span>
        </div>
      `;
    }

    if (this.isPendingApproval(idea)) {
      return `
        <div class="idea-workflow-actions">
          <button type="button" class="idea-action-button primary"
            data-idea-action="approve-convert" data-idea-id="${ideaId}">
            ✅ اعتماد وإنشاء مشروع
          </button>
          <button type="button" class="idea-action-button danger"
            data-idea-action="reject" data-idea-id="${ideaId}">
            رفض الفكرة
          </button>
        </div>
      `;
    }

    if (this.isApproved(idea)) {
      return `
        <div class="idea-workflow-actions">
          <button type="button" class="idea-action-button primary"
            data-idea-action="create-project" data-idea-id="${ideaId}">
            🚀 إنشاء مشروع تنفيذي
          </button>
        </div>
      `;
    }

    if (this.isRejected(idea)) {
      return `
        <div class="idea-workflow-actions">
          <button type="button" class="idea-action-button secondary"
            data-idea-action="reopen" data-idea-id="${ideaId}">
            ↩️ إعادة فتح الفكرة
          </button>
        </div>
      `;
    }

    return `
      <div class="idea-workflow-actions">
        <button type="button" class="idea-action-button primary"
          data-idea-action="submit" data-idea-id="${ideaId}">
          📤 رفع للاعتماد
        </button>
      </div>
    `;
  },

  renderIdeaCard(idea, displayNumber = null) {
    const decisionScore = this.normalizePercent(idea?.decisionScore, 0);
    const riskLevel = idea?.riskLevel || idea?.risk || "متوسط";
    const lifecycleLabel = this.getLifecycleLabel(idea);
    const lifecycleClass = this.getLifecycleClass(idea);
    const lifecycleIcon = this.getLifecycleIcon(idea);

    return `
      <article class="idea-card" data-idea-id="${this.escapeAttribute(idea?.id ?? "")}">
        <div class="idea-card-head">
          <div>
            <span class="idea-dept">
              ${this.escapeHtml(idea?.department || "غير مصنف")}
            </span>
            <h3>
              ${displayNumber !== null ? `${displayNumber}. ` : ""}
              ${this.escapeHtml(idea?.title || "فكرة غير مسماة")}
            </h3>
          </div>

          <div class="idea-badges">
            ${idea.generatedByAI ? `<span class="idea-ai-badge">✨ مولّدة بالذكاء الاصطناعي</span>` : ""}
            ${this.isQuickWin(idea) ? `<span class="idea-quickwin">Quick Win</span>` : ""}
            <span class="idea-priority ${this.badgeClass(idea?.priority)}">
              ${this.escapeHtml(idea?.priority || "قيد التقييم")}
            </span>
            <span class="idea-lifecycle-badge ${lifecycleClass}">
              ${lifecycleIcon} ${this.escapeHtml(lifecycleLabel)}
            </span>
          </div>
        </div>

        <div class="idea-meta">
          <span>⏱️ ${this.escapeHtml(idea?.duration || "غير محددة")}</span>
          <span>💰 ${this.escapeHtml(idea?.cost || idea?.costLevel || "غير محددة")}</span>
          <span>⚙️ ${this.escapeHtml(idea?.ease || idea?.difficulty || "غير محددة")}</span>
          <span>📊 ${decisionScore}%</span>
          <span>🛡️ ${this.escapeHtml(riskLevel)}</span>
        </div>

        <div class="idea-detail">
          <strong>التحدي</strong>
          <p>${this.escapeHtml(this.valueToText(idea?.challenge || idea?.problemStatement))}</p>
        </div>

        <div class="idea-detail">
          <strong>الحل المقترح</strong>
          <p>${this.escapeHtml(this.valueToText(idea?.solution || idea?.proposedSolution))}</p>
        </div>

        <div class="idea-detail">
          <strong>دور الذكاء الاصطناعي</strong>
          <p>${this.escapeHtml(this.valueToText(idea?.aiRole))}</p>
        </div>

        <div class="idea-detail">
          <strong>الفوائد المتوقعة</strong>
          <p>${this.escapeHtml(this.valueToText(idea?.benefits || idea?.expectedBenefits))}</p>
        </div>

        <div class="idea-detail">
          <strong>قرار مبدئي</strong>
          <p>
            ${this.escapeHtml(idea?.decisionLevel || "قيد التقييم")}
            · Decision Score ${decisionScore}%
          </p>
        </div>

        ${this.renderIdeaActions(idea)}
      </article>
    `;
  },

  renderDepartmentSection(department, ideas = [], ideaNumberMap = new Map()) {
    return `
      <section class="module-panel idea-department-section">
        <div class="idea-section-head">
          <div>
            <span class="module-kicker light">Solution Portfolio</span>
            <h2>${this.escapeHtml(department)}</h2>
            <p>${ideas.length} فرص قابلة للدراسة والتطوير</p>
          </div>
          <span class="idea-section-count">${ideas.length}</span>
        </div>

        <div class="idea-list">
          ${ideas
            .map(idea =>
              this.renderIdeaCard(
                idea,
                ideaNumberMap.get(String(idea?.id)) || null
              )
            )
            .join("")}
        </div>
      </section>
    `;
  },

  renderPortfolioMap(departments = [], ideas = []) {
    if (!departments.length) {
      departments = Object.keys(this.groupByDepartment(ideas)).map(name => ({
        name,
        maturity: 0
      }));
    }

    return `
      <div class="department-grid">
        ${departments.map(department => {
          const name = department?.name || "محفظة غير مسماة";
          const count = this.getDepartmentCount(name, ideas);
          const maturity = this.normalizePercent(department?.maturity, 0);

          return `
            <div class="department-chip">
              <strong>${this.escapeHtml(name)}</strong>
              <span>${count} فرص · جاهزية ${maturity}%</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  },

  /* =======================================================
     Main Render
  ======================================================= */

  render(container) {
    if (!container || this._isRendering) return;

    this._isRendering = true;
    this._container = container;

    try {
      this.injectStyles();

      const state = this.getState();
      const ideas = this.getIdeas();
      const departments = Array.isArray(state.departments)
        ? state.departments
        : [];

      const groupedIdeas = this.groupByDepartment(ideas);
      const pipeline = this.getPipeline(ideas);
      const generatorStatus = this.getGeneratorStatus();

      const highCount = ideas.filter(idea => this.isHighPriority(idea)).length;
      const mediumCount = ideas.filter(idea => this.isMediumPriority(idea)).length;
      const lowCount = ideas.filter(idea => this.isLowPriority(idea)).length;
      const quickWins = ideas.filter(idea => this.isQuickWin(idea)).length;

      const pendingCount = this.toSafeNumber(
        pipeline.pendingApproval ?? pipeline.pendingIdeas,
        ideas.filter(idea => this.isPendingApproval(idea)).length
      );

      const approvedCount = this.toSafeNumber(
        pipeline.approvedIdeas,
        ideas.filter(idea => this.isApproved(idea)).length
      );

      const rejectedCount = this.toSafeNumber(
        pipeline.rejectedIdeas,
        ideas.filter(idea => this.isRejected(idea)).length
      );

      const convertedCount = this.toSafeNumber(
        pipeline.convertedIdeas,
        ideas.filter(idea => this.isConverted(idea)).length
      );

      const projectCount = this.toSafeNumber(
        pipeline.totalProjects,
        this.getProjects().length
      );

      const targetIdeas = Math.max(
        1,
        this.toSafeNumber(
          state.summary?.targetIdeas,
          this.config.targetIdeas
        )
      );

      const progress = this.normalizePercent(
        (ideas.length / targetIdeas) * 100,
        0
      );

      const averageDecision = ideas.length
        ? Math.round(
            ideas.reduce(
              (total, idea) =>
                total + this.toSafeNumber(idea?.decisionScore, 0),
              0
            ) / ideas.length
          )
        : 0;

      const departmentOrder = departments
        .map(department => department?.name)
        .filter(Boolean);

      const orderedDepartments = [
        ...departmentOrder.filter(department => groupedIdeas[department]),
        ...Object.keys(groupedIdeas).filter(
          department => !departmentOrder.includes(department)
        )
      ];

      const ideaNumberMap = new Map();
      ideas.forEach((idea, index) => {
        ideaNumberMap.set(String(idea?.id), index + 1);
      });

      container.innerHTML = `
        <section class="module-page">
          <div class="module-hero">
            <span class="module-kicker">
              Biometric AI Opportunity Center
            </span>

            <h1>مركز فرص الذكاء الاصطناعي</h1>

            <p>
              إدارة فرص الذكاء الاصطناعي المرتبطة بالعمليات البيومترية،
              من الدراسة والتقييم إلى الاعتماد والتحويل إلى مشاريع تنفيذية مترابطة.
            </p>

            <div class="ideas-hero-actions">
              <button
                type="button"
                class="idea-generate-button"
                data-idea-action="open-generator"
                ${generatorStatus.ready ? "" : "disabled"}
              >
                ✨ إضافة فكرة بالذكاء الاصطناعي
              </button>

              <span class="idea-generator-status ${generatorStatus.ready ? "ready" : "not-ready"}">
                ${generatorStatus.ready
                  ? `جاهز · ${generatorStatus.loaded}/${generatorStatus.total} محرك`
                  : `غير مكتمل · ${generatorStatus.loaded}/${generatorStatus.total} محرك`}
              </span>
            </div>

            <div class="aiw-chip-row">
              <span class="aiw-chip">💡 ${ideas.length}/${targetIdeas} فرصة</span>
              <span class="aiw-chip">🛂 ${orderedDepartments.length} محافظ</span>
              <span class="aiw-chip">🚀 ${quickWins} Quick Wins</span>
              <span class="aiw-chip">⏳ ${pendingCount} بانتظار الاعتماد</span>
              <span class="aiw-chip">📁 ${projectCount} مشاريع</span>
              <span class="aiw-chip">📊 ${averageDecision}% Decision Score</span>
              <span class="aiw-chip">🎯 ${progress}% من الهدف</span>
            </div>
          </div>

          ${!generatorStatus.ready ? `
            <div class="idea-generator-warning">
              <strong>⚠️ مولّد الأفكار غير مكتمل</strong>
              <p>
                الملفات الناقصة: ${this.escapeHtml(generatorStatus.missing.join("، "))}
              </p>
            </div>
          ` : ""}

          <div class="module-grid">
            <div class="module-card">
              <span>الفرص المسجلة</span>
              <strong>${ideas.length}</strong>
              <small>AI Opportunities</small>
            </div>

            <div class="module-card">
              <span>الأولوية العالية</span>
              <strong>${highCount}</strong>
              <small>High Priority</small>
            </div>

            <div class="module-card">
              <span>الأولوية المتوسطة</span>
              <strong>${mediumCount}</strong>
              <small>Medium Priority</small>
            </div>

            <div class="module-card">
              <span>الأولوية المنخفضة</span>
              <strong>${lowCount}</strong>
              <small>Low Priority</small>
            </div>

            <div class="module-card">
              <span>بانتظار الاعتماد</span>
              <strong>${pendingCount}</strong>
              <small>Pending Approval</small>
            </div>

            <div class="module-card">
              <span>تحولت إلى مشاريع</span>
              <strong>${convertedCount}</strong>
              <small>Converted Projects</small>
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>مسار تحويل الفرص</h2>
              <p>
                تبدأ الفرصة كفكرة قابلة للدراسة، ثم ترفع للاعتماد،
                وبعد القرار الإداري تتحول إلى مشروع تنفيذي مرتبط بالفكرة الأصلية.
              </p>
            </div>

            <div class="idea-pipeline-strip">
              <div><span>💡</span><strong>${ideas.length}</strong><small>إجمالي الأفكار</small></div>
              <div><span>⏳</span><strong>${pendingCount}</strong><small>بانتظار الاعتماد</small></div>
              <div><span>✅</span><strong>${approvedCount}</strong><small>أفكار معتمدة</small></div>
              <div><span>📁</span><strong>${convertedCount}</strong><small>تحولت إلى مشاريع</small></div>
              <div><span>⛔</span><strong>${rejectedCount}</strong><small>غير معتمدة</small></div>
            </div>
          </div>

          <div class="module-panel">
            <div class="module-section-title compact">
              <h2>خريطة المحافظ التشغيلية</h2>
              <p>توزيع الفرص حسب النطاق التشغيلي والجاهزية المؤسسية.</p>
            </div>

            ${this.renderPortfolioMap(departments, ideas)}
          </div>

          <div class="module-section-title">
            <h2>دليل الفرص التنفيذية</h2>
            <p>
              لا يتم إنشاء أي مشروع إلا بعد اعتماد الفكرة،
              مع منع التحويل المكرر وحفظ الرابط في الاتجاهين.
            </p>
          </div>

          ${
            orderedDepartments.length
              ? orderedDepartments.map(department =>
                  this.renderDepartmentSection(
                    department,
                    groupedIdeas[department] || [],
                    ideaNumberMap
                  )
                ).join("")
              : `<div class="module-empty">لا توجد أفكار مسجلة حالياً.</div>`
          }
        </section>
      `;

      this.bindActionEvents();
      this.bindAutomaticSync();
    } finally {
      this._isRendering = false;
    }
  },

  /* =======================================================
     Generator Modal
  ======================================================= */

  openGeneratorModal() {
    const status = this.getGeneratorStatus();

    if (!status.ready) {
      this.showToast(
        "مولّد الأفكار غير مكتمل. تأكد من تحميل الملفات في index.html.",
        "error"
      );
      return;
    }

    this.closeGeneratorModal();
    this._generatedPackage = null;

    const modal = document.createElement("div");
    modal.className = "idea-generator-overlay";

    modal.innerHTML = `
      <div class="idea-generator-dialog" role="dialog" aria-modal="true">
        <button type="button" class="idea-confirmation-close"
          data-generator-close aria-label="إغلاق">×</button>

        <div class="idea-confirmation-icon">✨</div>

        <span class="module-kicker light">AI Opportunity Generator</span>
        <h3>أنشئ فكرة متكاملة من مشكلة مختصرة</h3>

        <p class="idea-generator-intro">
          اكتب المشكلة أو التحدي داخل نطاق الأنظمة البيومترية والبوابات الذكية
          والصلاحيات والأمن الرقمي، وستقوم المنصة بتوليد مسودة متكاملة للمراجعة.
        </p>

        <label class="idea-generator-field">
          <span>المشكلة أو التحدي</span>
          <textarea
            rows="5"
            maxlength="${this.config.maxProblemLength}"
            data-generator-problem
            placeholder="مثال: وجود تسجيلات بيومترية خاطئة أو متعارضة لبعض المسافرين في المطار."
          ></textarea>
          <small data-generator-counter>0/${this.config.maxProblemLength}</small>
        </label>

        <div class="idea-generator-actions">
          <button type="button" class="idea-action-button secondary"
            data-generator-close>إلغاء</button>
          <button type="button" class="idea-action-button primary"
            data-generator-run>✨ تحليل وتوليد الفكرة</button>
        </div>

        <div class="idea-generator-loading" data-generator-loading hidden>
          <div class="idea-generator-spinner"></div>
          <strong>جاري تحليل المشكلة...</strong>
          <span>يتم تشغيل محركات التصنيف والمخاطر والجدوى والقرار.</span>
        </div>

        <div class="idea-generator-result" data-generator-result hidden></div>
      </div>
    `;

    document.body.appendChild(modal);
    this._generatorModal = modal;

    const textarea = modal.querySelector("[data-generator-problem]");
    const counter = modal.querySelector("[data-generator-counter]");

    textarea?.addEventListener("input", () => {
      counter.textContent = `${textarea.value.length}/${this.config.maxProblemLength}`;
    });

    modal.addEventListener("click", async event => {
      if (
        event.target === modal ||
        event.target.closest("[data-generator-close]")
      ) {
        this.closeGeneratorModal();
        return;
      }

      if (event.target.closest("[data-generator-run]")) {
        await this.runGeneratorFromModal();
        return;
      }

      if (event.target.closest("[data-generator-save]")) {
        this.saveGeneratedIdea();
      }
    });

    requestAnimationFrame(() => {
      modal.classList.add("visible");
      textarea?.focus();
    });
  },

  async runGeneratorFromModal() {
    if (!this._generatorModal || this._isGenerating) return;

    const textarea = this._generatorModal.querySelector(
      "[data-generator-problem]"
    );

    const runButton = this._generatorModal.querySelector(
      "[data-generator-run]"
    );

    const loading = this._generatorModal.querySelector(
      "[data-generator-loading]"
    );

    const resultBox = this._generatorModal.querySelector(
      "[data-generator-result]"
    );

    const problem = textarea?.value?.trim() || "";

    this._isGenerating = true;
    runButton.disabled = true;
    loading.hidden = false;
    resultBox.hidden = true;

    try {
      const pkg = await this.generateOpportunity(problem);
      this._generatedPackage = pkg;
      resultBox.innerHTML = this.renderGeneratedPackage(pkg);
      resultBox.hidden = false;
    } catch (error) {
      resultBox.innerHTML = `
        <div class="idea-generator-error">
          <strong>تعذر توليد الفكرة</strong>
          <p>${this.escapeHtml(error?.message || "حدث خطأ غير متوقع.")}</p>
        </div>
      `;
      resultBox.hidden = false;
    } finally {
      this._isGenerating = false;
      runButton.disabled = false;
      loading.hidden = true;
    }
  },

  renderGeneratedPackage(pkg) {
    const idea = pkg?.idea || {};
    const readiness = pkg?.readiness || {};
    const cost = pkg?.cost || {};
    const roi = pkg?.roi || {};
    const decision = pkg?.decision || {};
    const duplicate = pkg?.duplicateAnalysis || {};
    const executive = pkg?.executiveSummary || {};

    return `
      <div class="idea-generated-card">
        <div class="idea-generated-head">
          <div>
            <span class="idea-ai-badge">✨ مسودة مولّدة بالذكاء الاصطناعي</span>
            <h4>${this.escapeHtml(idea.title || "فكرة جديدة")}</h4>
          </div>
          <span class="idea-lifecycle-badge draft">📝 مسودة</span>
        </div>

        ${duplicate?.highestSimilarity > 0 ? `
          <div class="idea-duplicate-alert ${duplicate.duplicate ? "warning" : ""}">
            <strong>🔎 فحص التشابه</strong>
            <p>
              أعلى نسبة تشابه: ${this.normalizePercent(duplicate.highestSimilarity, 0)}%
              ${duplicate?.matchedIdea?.title
                ? ` مع «${this.escapeHtml(duplicate.matchedIdea.title)}»`
                : ""}
            </p>
          </div>
        ` : ""}

        <div class="idea-generated-grid">
          <div><span>المحفظة</span><strong>${this.escapeHtml(idea.portfolio || idea.department || "غير محددة")}</strong></div>
          <div><span>الأولوية</span><strong>${this.escapeHtml(idea.priority || "متوسطة")}</strong></div>
          <div><span>المخاطر</span><strong>${this.escapeHtml(idea.riskLevel || "متوسط")}</strong></div>
          <div><span>الجاهزية</span><strong>${this.normalizePercent(readiness.score ?? idea.readiness, 0)}%</strong></div>
          <div><span>التكلفة</span><strong>${cost.totalEstimatedCost ? `${this.formatNumber(cost.totalEstimatedCost)} AED` : "تقديرية"}</strong></div>
          <div><span>ROI</span><strong>${Number.isFinite(Number(roi.roiPercent)) ? `${roi.roiPercent}%` : "يحتاج دراسة"}</strong></div>
        </div>

        <div class="idea-generated-section">
          <strong>التحدي</strong>
          <p>${this.escapeHtml(this.valueToText(idea.problemStatement || idea.challenge))}</p>
        </div>

        <div class="idea-generated-section">
          <strong>الحل المقترح</strong>
          <p>${this.escapeHtml(this.valueToText(idea.proposedSolution || idea.solution))}</p>
        </div>

        <div class="idea-generated-section">
          <strong>دور الذكاء الاصطناعي</strong>
          <p>${this.escapeHtml(this.valueToText(idea.aiRole))}</p>
        </div>

        <div class="idea-generated-section">
          <strong>الفوائد المتوقعة</strong>
          <p>${this.escapeHtml(this.valueToText(idea.expectedBenefits || idea.benefits))}</p>
        </div>

        <div class="idea-generated-section">
          <strong>مؤشرات الأداء المقترحة</strong>
          <p>${this.escapeHtml(this.valueToText(idea.kpis, "تحدد بعد المراجعة."))}</p>
        </div>

        <div class="idea-generated-section">
          <strong>القرار التنفيذي المقترح</strong>
          <p>
            ${this.escapeHtml(
              decision.decisionLabel ||
              readiness.decision?.label ||
              "يحتاج مراجعة"
            )}
            ${decision.confidenceScore !== undefined
              ? ` · ثقة ${this.normalizePercent(decision.confidenceScore, 0)}%`
              : ""}
          </p>
        </div>

        ${executive.presentationScript ? `
          <div class="idea-generated-section executive">
            <strong>ملخص جاهز للعرض</strong>
            <p>${this.escapeHtml(executive.presentationScript)}</p>
          </div>
        ` : ""}

        <div class="idea-generator-review-note">
          يتم حفظ الفكرة كمسودة فقط. الاعتماد والتحويل إلى مشروع يحتاجان قراراً بشرياً.
        </div>

        <button type="button" class="idea-action-button primary idea-save-generated"
          data-generator-save>
          💾 حفظ الفكرة كمسودة
        </button>
      </div>
    `;
  },

  closeGeneratorModal() {
    if (!this._generatorModal) {
      this._generatedPackage = null;
      return;
    }

    const modal = this._generatorModal;
    modal.classList.remove("visible");

    window.setTimeout(() => modal.remove(), 180);

    this._generatorModal = null;
    this._generatedPackage = null;
    this._isGenerating = false;
  },

  /* =======================================================
     UI Events
  ======================================================= */

  bindActionEvents() {
    if (this._eventsBound || !this._container) return;

    this._eventsBound = true;

    this._container.addEventListener("click", event => {
      const button = event.target.closest("[data-idea-action]");

      if (!button || !this._container?.contains(button)) return;

      const action = button.dataset.ideaAction;
      const ideaId = button.dataset.ideaId;

      event.preventDefault();

      if (action === "open-generator") {
        this.openGeneratorModal();
        return;
      }

      if (!action || !ideaId) return;

      this.handleIdeaAction(action, ideaId);
    });
  },

  handleIdeaAction(action, ideaId) {
    const idea = this.getIdeaById(ideaId);

    if (!idea) {
      this.showToast("لم يتم العثور على الفكرة.", "error");
      return;
    }

    if (action === "open-project") {
      this.openLinkedProject(ideaId);
      return;
    }

    const configs = {
      submit: {
        icon: "📤",
        title: "رفع الفكرة للاعتماد",
        message:
          `سيتم رفع فكرة «${idea.title || "غير مسماة"}» للقرار الإداري.`,
        confirmText: "رفع للاعتماد",
        noteLabel: "ملاحظات الرفع"
      },
      "approve-convert": {
        icon: "🚀",
        title: "اعتماد وإنشاء مشروع",
        message:
          `سيتم اعتماد فكرة «${idea.title || "غير مسماة"}» وإنشاء مشروع تنفيذي.`,
        confirmText: "اعتماد وإنشاء المشروع",
        noteLabel: "ملاحظات الاعتماد"
      },
      "create-project": {
        icon: "📁",
        title: "إنشاء مشروع تنفيذي",
        message:
          `سيتم إنشاء مشروع مرتبط بفكرة «${idea.title || "غير مسماة"}».`,
        confirmText: "إنشاء المشروع",
        noteLabel: "ملاحظات إنشاء المشروع"
      },
      reject: {
        icon: "⛔",
        title: "رفض الفكرة",
        message:
          `سيتم تسجيل قرار رفض فكرة «${idea.title || "غير مسماة"}».`,
        confirmText: "تأكيد الرفض",
        noteLabel: "سبب الرفض",
        danger: true,
        requiredNotes: true
      },
      reopen: {
        icon: "↩️",
        title: "إعادة فتح الفكرة",
        message:
          `ستعود فكرة «${idea.title || "غير مسماة"}» إلى مرحلة الدراسة.`,
        confirmText: "إعادة فتح الفكرة",
        noteLabel: "ملاحظات إعادة الفتح"
      }
    };

    const config = configs[action];
    if (!config) return;

    this.openConfirmation({ action, ideaId, ...config });
  },

  executePendingAction(notes = "") {
    if (!this._pendingAction || this._isExecuting) return;

    const { action, ideaId, requiredNotes } = this._pendingAction;

    if (requiredNotes && !notes.trim()) {
      this.showToast("يرجى إدخال سبب القرار.", "error");
      return;
    }

    this._isExecuting = true;

    try {
      const options = {
        actor: this.config.actor,
        notes,
        reason: notes
      };

      let result = null;

      if (action === "submit") {
        result = this.submitForApproval(ideaId, options);
      }

      if (action === "approve-convert") {
        result = this.approveAndCreateProject(ideaId, options);
      }

      if (action === "create-project") {
        result = this.createProjectFromIdea(ideaId, options);
      }

      if (action === "reject") {
        result = this.rejectIdea(ideaId, options);
      }

      if (action === "reopen") {
        result = this.reopenIdea(ideaId, options);
      }

      if (!result?.success) {
        this.showToast(
          result?.message || "تعذر تنفيذ العملية.",
          "error"
        );
        return;
      }

      this.closeConfirmation();
      this.showToast("تم تنفيذ العملية بنجاح.", "success");
      this.scheduleRefresh();
    } finally {
      this._isExecuting = false;
    }
  },

  /* =======================================================
     Navigation
  ======================================================= */

  saveSelectedProject(projectId) {
    try {
      localStorage.setItem(this.config.selectedProjectKey, String(projectId));
      sessionStorage.setItem(this.config.selectedProjectKey, String(projectId));
    } catch (error) {
      console.warn("AI Work Ideas V6.0: Unable to save selected project.", error);
    }
  },

  saveSelectedIdea(ideaId) {
    try {
      localStorage.setItem(this.config.selectedIdeaKey, String(ideaId));
      sessionStorage.setItem(this.config.selectedIdeaKey, String(ideaId));
    } catch (error) {
      console.warn("AI Work Ideas V6.0: Unable to save selected idea.", error);
    }
  },

  openLinkedProject(ideaId) {
    const project = this.getProjectByIdeaId(ideaId);

    if (!project) {
      this.showToast("تعذر العثور على المشروع المرتبط.", "error");
      return;
    }

    this.saveSelectedIdea(ideaId);
    this.saveSelectedProject(project.id);

    if (typeof window.AIW?.App?.go === "function") {
      window.AIW.App.go("projects");
      return;
    }

    if (typeof window.AIW?.Router?.go === "function") {
      window.AIW.Router.go("projects");
      return;
    }

    window.location.hash = "#projects";
  },

  /* =======================================================
     Confirmation Modal
  ======================================================= */

  openConfirmation(config = {}) {
    this.closeConfirmation();

    this._pendingAction = {
      action: config.action,
      ideaId: config.ideaId,
      requiredNotes: config.requiredNotes === true
    };

    const modal = document.createElement("div");
    modal.className = "idea-confirmation-overlay";

    modal.innerHTML = `
      <div class="idea-confirmation-dialog" role="dialog" aria-modal="true">
        <button type="button" class="idea-confirmation-close"
          data-confirmation-close aria-label="إغلاق">×</button>

        <div class="idea-confirmation-icon">
          ${this.escapeHtml(config.icon || "💡")}
        </div>

        <h3>${this.escapeHtml(config.title || "تأكيد العملية")}</h3>
        <p>${this.escapeHtml(config.message || "هل تريد متابعة العملية؟")}</p>

        <label class="idea-confirmation-field">
          <span>
            ${this.escapeHtml(config.noteLabel || "ملاحظات")}
            ${config.requiredNotes ? `<em>مطلوب</em>` : ""}
          </span>

          <textarea data-confirmation-notes rows="3"
            placeholder="${config.requiredNotes ? "أدخل السبب..." : "ملاحظة اختيارية..."}"></textarea>
        </label>

        <div class="idea-confirmation-actions">
          <button type="button" class="idea-action-button secondary"
            data-confirmation-close>إلغاء</button>

          <button type="button"
            class="idea-action-button ${config.danger ? "danger" : "primary"}"
            data-confirmation-submit>
            ${this.escapeHtml(config.confirmText || "تأكيد")}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this._modal = modal;

    modal.addEventListener("click", event => {
      if (
        event.target === modal ||
        event.target.closest("[data-confirmation-close]")
      ) {
        this.closeConfirmation();
        return;
      }

      if (event.target.closest("[data-confirmation-submit]")) {
        const notes =
          modal.querySelector("[data-confirmation-notes]")
            ?.value?.trim() || "";

        this.executePendingAction(notes);
      }
    });

    requestAnimationFrame(() => {
      modal.classList.add("visible");
    });
  },

  closeConfirmation() {
    if (!this._modal) {
      this._pendingAction = null;
      return;
    }

    const modal = this._modal;
    modal.classList.remove("visible");
    window.setTimeout(() => modal.remove(), 180);

    this._modal = null;
    this._pendingAction = null;
  },

  /* =======================================================
     Toast / Sync
  ======================================================= */

  showToast(message, type = "success") {
    document.querySelector(".idea-workflow-toast")?.remove();

    const toast = document.createElement("div");
    toast.className = `idea-workflow-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("visible"));

    window.setTimeout(() => {
      toast.classList.remove("visible");
      window.setTimeout(() => toast.remove(), 200);
    }, 2800);
  },

  scheduleRefresh() {
    window.clearTimeout(this._refreshTimer);

    this._refreshTimer = window.setTimeout(() => {
      if (!this._container?.isConnected) return;
      this.render(this._container);
    }, this.config.refreshDelay);
  },

  bindAutomaticSync() {
    if (this._syncBound) return;
    this._syncBound = true;

    const refresh = () => this.scheduleRefresh();

    [
      "aiw:dataChanged",
      "aiw:dataUpdated",
      "aiw:storeChanged",
      "aiw:ideasChanged",
      "aiw:ideaCreated",
      "aiw:ideaUpdated",
      "aiw:ideaApproved",
      "aiw:ideaRejected",
      "aiw:ideaConvertedToProject",
      "aiw:projectCreatedFromIdea"
    ].forEach(eventName => {
      window.addEventListener(eventName, refresh);
    });

    const store = this.getStore();

    if (typeof store?.subscribe === "function") {
      this._unsubscribeStore = store.subscribe(refresh);
    }

    window.addEventListener("storage", refresh);
  },

  destroy() {
    window.clearTimeout(this._refreshTimer);

    if (typeof this._unsubscribeStore === "function") {
      this._unsubscribeStore();
    }

    this._unsubscribeStore = null;
    this._container = null;
    this._eventsBound = false;
    this._syncBound = false;
    this.closeConfirmation();
    this.closeGeneratorModal();
  },

  /* =======================================================
     Styles
  ======================================================= */

  injectStyles() {
    if (document.getElementById(this.config.styleId)) return;

    const style = document.createElement("style");
    style.id = this.config.styleId;

    style.textContent = `
      .ideas-hero-actions {
        display:flex;
        flex-wrap:wrap;
        align-items:center;
        gap:10px;
        margin-top:20px;
      }

      .idea-generate-button {
        min-height:48px;
        padding:12px 18px;
        border:0;
        border-radius:16px;
        color:#101b2f;
        background:#ffffff;
        font:inherit;
        font-weight:900;
        cursor:pointer;
        box-shadow:0 10px 24px rgba(15,23,42,.15);
      }

      .idea-generate-button:disabled {
        opacity:.55;
        cursor:not-allowed;
      }

      .idea-generator-status {
        padding:8px 12px;
        border-radius:999px;
        font-size:12px;
        font-weight:800;
      }

      .idea-generator-status.ready {
        color:#087d3e;
        background:#e2f7ea;
      }

      .idea-generator-status.not-ready {
        color:#b42318;
        background:#feeceb;
      }

      .idea-generator-warning {
        margin:0 0 20px;
        padding:16px;
        border:1px solid #fbd3d0;
        border-radius:18px;
        color:#b42318;
        background:#fff5f4;
      }

      .idea-ai-badge {
        display:inline-flex;
        align-items:center;
        padding:7px 11px;
        border-radius:999px;
        color:#3159bf;
        background:#edf3ff;
        font-size:12px;
        font-weight:900;
      }

      .idea-lifecycle-badge {
        display:inline-flex;
        align-items:center;
        gap:6px;
        padding:7px 12px;
        border-radius:999px;
        font-size:13px;
        font-weight:800;
        white-space:nowrap;
      }

      .idea-lifecycle-badge.idea,
      .idea-lifecycle-badge.draft {
        color:#3159bf;
        background:#edf3ff;
      }

      .idea-lifecycle-badge.pending {
        color:#b75c00;
        background:#fff3d9;
      }

      .idea-lifecycle-badge.approved {
        color:#087d3e;
        background:#e2f7ea;
      }

      .idea-lifecycle-badge.rejected {
        color:#b42318;
        background:#feeceb;
      }

      .idea-lifecycle-badge.converted {
        color:#fff;
        background:#101b2f;
      }

      .idea-workflow-actions {
        display:flex;
        flex-wrap:wrap;
        align-items:center;
        gap:10px;
        margin-top:22px;
        padding-top:18px;
        border-top:1px solid rgba(15,23,42,.08);
      }

      .idea-action-button {
        min-height:44px;
        padding:11px 17px;
        border:0;
        border-radius:14px;
        font:inherit;
        font-size:14px;
        font-weight:800;
        cursor:pointer;
      }

      .idea-action-button.primary {
        color:#fff;
        background:#101b2f;
      }

      .idea-action-button.secondary {
        color:#344054;
        background:#f2f4f7;
        border:1px solid #e4e7ec;
      }

      .idea-action-button.danger {
        color:#b42318;
        background:#feeceb;
        border:1px solid #fbd3d0;
      }

      .idea-pipeline-strip {
        display:grid;
        grid-template-columns:repeat(5,minmax(0,1fr));
        gap:12px;
      }

      .idea-pipeline-strip>div {
        min-height:110px;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        gap:5px;
        padding:14px 10px;
        border:1px solid rgba(15,23,42,.06);
        border-radius:20px;
        text-align:center;
        background:#f7f8fa;
      }

      .idea-pipeline-strip strong {
        font-size:25px;
        color:#101828;
      }

      .idea-pipeline-strip small {
        color:#667085;
        font-weight:700;
      }

      .idea-confirmation-overlay,
      .idea-generator-overlay {
        position:fixed;
        inset:0;
        z-index:99999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px 16px calc(20px + env(safe-area-inset-bottom));
        direction:rtl;
        background:rgba(15,23,42,.5);
        backdrop-filter:blur(10px);
        opacity:0;
        transition:opacity .18s ease;
      }

      .idea-confirmation-overlay.visible,
      .idea-generator-overlay.visible {
        opacity:1;
      }

      .idea-confirmation-dialog,
      .idea-generator-dialog {
        position:relative;
        width:min(100%,720px);
        max-height:88vh;
        overflow-y:auto;
        box-sizing:border-box;
        padding:28px 22px 24px;
        border-radius:28px;
        background:#fff;
        box-shadow:0 28px 80px rgba(15,23,42,.28);
      }

      .idea-confirmation-dialog {
        width:min(100%,470px);
      }

      .idea-confirmation-close {
        position:absolute;
        top:14px;
        left:15px;
        width:36px;
        height:36px;
        border:0;
        border-radius:50%;
        background:#f2f4f7;
        color:#475467;
        font-size:24px;
        cursor:pointer;
      }

      .idea-confirmation-icon {
        display:grid;
        place-items:center;
        width:62px;
        height:62px;
        margin-bottom:18px;
        border-radius:20px;
        font-size:30px;
        background:#101b2f;
      }

      .idea-confirmation-field,
      .idea-generator-field {
        display:block;
        margin-top:20px;
      }

      .idea-confirmation-field>span,
      .idea-generator-field>span {
        display:block;
        margin-bottom:8px;
        color:#344054;
        font-size:13px;
        font-weight:800;
      }

      .idea-confirmation-field textarea,
      .idea-generator-field textarea {
        width:100%;
        box-sizing:border-box;
        padding:14px;
        border:1px solid #d0d5dd;
        border-radius:15px;
        color:#101828;
        background:#fff;
        font:inherit;
        outline:none;
      }

      .idea-generator-field small {
        display:block;
        margin-top:6px;
        color:#98a2b3;
        text-align:left;
      }

      .idea-confirmation-actions,
      .idea-generator-actions {
        display:grid;
        grid-template-columns:1fr 1.3fr;
        gap:10px;
        margin-top:22px;
      }

      .idea-generator-intro {
        color:#667085;
        line-height:1.8;
      }

      .idea-generator-loading {
        margin-top:22px;
        padding:24px;
        border-radius:20px;
        text-align:center;
        background:#f7f8fa;
      }

      .idea-generator-spinner {
        width:36px;
        height:36px;
        margin:0 auto 12px;
        border:4px solid #dbe7ff;
        border-top-color:#3159bf;
        border-radius:50%;
        animation:idea-spin .8s linear infinite;
      }

      @keyframes idea-spin {
        to { transform:rotate(360deg); }
      }

      .idea-generator-result {
        margin-top:22px;
      }

      .idea-generated-card {
        padding:18px;
        border:1px solid #e4e7ec;
        border-radius:22px;
        background:#fff;
      }

      .idea-generated-head {
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:12px;
        margin-bottom:18px;
      }

      .idea-generated-head h4 {
        margin:12px 0 0;
        color:#101828;
        font-size:22px;
        line-height:1.5;
      }

      .idea-generated-grid {
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:10px;
        margin-bottom:18px;
      }

      .idea-generated-grid>div {
        padding:13px;
        border-radius:16px;
        background:#f7f8fa;
      }

      .idea-generated-grid span {
        display:block;
        color:#667085;
        font-size:12px;
      }

      .idea-generated-grid strong {
        display:block;
        margin-top:5px;
        color:#101828;
      }

      .idea-generated-section {
        padding:14px 0;
        border-top:1px solid #eaecf0;
      }

      .idea-generated-section strong {
        color:#101828;
      }

      .idea-generated-section p {
        margin:7px 0 0;
        color:#667085;
        line-height:1.8;
      }

      .idea-generated-section.executive {
        padding:16px;
        border:0;
        border-radius:16px;
        background:#edf3ff;
      }

      .idea-duplicate-alert {
        margin-bottom:16px;
        padding:12px 14px;
        border-radius:15px;
        background:#f2f4f7;
      }

      .idea-duplicate-alert.warning {
        color:#b75c00;
        background:#fff3d9;
      }

      .idea-generator-review-note {
        margin-top:16px;
        padding:12px 14px;
        border-radius:14px;
        color:#667085;
        background:#f7f8fa;
        font-size:13px;
        line-height:1.7;
      }

      .idea-save-generated {
        width:100%;
        margin-top:14px;
      }

      .idea-generator-error {
        padding:16px;
        border-radius:16px;
        color:#b42318;
        background:#feeceb;
      }

      .idea-workflow-toast {
        position:fixed;
        right:50%;
        bottom:calc(108px + env(safe-area-inset-bottom));
        z-index:100000;
        width:min(calc(100% - 36px),420px);
        padding:14px 17px;
        border-radius:16px;
        color:#fff;
        text-align:center;
        font-weight:800;
        background:#101b2f;
        opacity:0;
        transform:translateX(50%) translateY(14px);
        transition:.2s ease;
      }

      .idea-workflow-toast.visible {
        opacity:1;
        transform:translateX(50%) translateY(0);
      }

      .idea-workflow-toast.error { background:#b42318; }
      .idea-workflow-toast.success { background:#087d3e; }

      @media (max-width:720px) {
        .idea-pipeline-strip,
        .idea-generated-grid {
          grid-template-columns:repeat(2,minmax(0,1fr));
        }

        .idea-confirmation-actions,
        .idea-generator-actions {
          grid-template-columns:1fr;
        }

        .idea-workflow-actions .idea-action-button {
          width:100%;
        }
      }
    `;

    document.head.appendChild(style);
  },

  /* =======================================================
     Utilities
  ======================================================= */

  toSafeNumber(value, fallback = 0) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
  },

  normalizePercent(value, fallback = 0) {
    return Math.min(
      100,
      Math.max(0, Math.round(this.toSafeNumber(value, fallback)))
    );
  },

  formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(
      this.toSafeNumber(value, 0)
    );
  },

  escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  escapeAttribute(value) {
    return this.escapeHtml(value);
  }
};
