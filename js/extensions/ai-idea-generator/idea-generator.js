/* =========================================================
   AI Work - AI Idea Generator Core V1.0.0
   File Path:
   js/extensions/ai-idea-generator/idea-generator.js

   Purpose:
   - Main orchestration layer for AI-generated opportunities
   - Accepts a short problem/challenge description
   - Coordinates the future 16 generator engines
   - Produces one normalized opportunity draft
   - Works safely before UI and Store wiring are added
   - Does not modify existing Ideas, Projects, Store, or Index files

   Phase:
   AI Idea Generator - File 1 of 17
========================================================= */

(function (window) {
  "use strict";

  window.AIW = window.AIW || {};
  AIW.Extensions = AIW.Extensions || {};

  const VERSION = "1.0.0";
  const MODULE_ID = "ai-idea-generator";
  const DEFAULT_SCOPE = Object.freeze([
    "الأنظمة البيومترية",
    "البوابات الذكية",
    "المستخدمون والصلاحيات",
    "الأمن الرقمي",
    "التحليلات والتقارير التنفيذية"
  ]);

  const DEFAULT_CONFIG = Object.freeze({
    language: "ar",
    strictScope: true,
    minimumInputLength: 8,
    maximumInputLength: 1200,
    defaultStatus: "draft",
    defaultPriority: "متوسطة",
    defaultRiskLevel: "متوسط",
    defaultReadiness: 45,
    duplicateThreshold: 0.78,
    timeoutMs: 20000,
    scope: DEFAULT_SCOPE
  });

  const state = {
    initialized: false,
    config: { ...DEFAULT_CONFIG, scope: [...DEFAULT_SCOPE] },
    engines: new Map(),
    lastResult: null,
    lastError: null,
    runs: 0
  };

  function nowISO() {
    return new Date().toISOString();
  }

  function createId(prefix = "idea") {
    const random = Math.random().toString(36).slice(2, 9);
    return `${prefix}-${Date.now()}-${random}`;
  }

  function clone(value) {
    if (value == null) return value;

    if (typeof structuredClone === "function") {
      try {
        return structuredClone(value);
      } catch (error) {
        // Continue to JSON fallback.
      }
    }

    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return value;
    }
  }

  function cleanText(value) {
    return String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeNumber(value, fallback, min, max) {
    const number = Number(value);
    const safe = Number.isFinite(number) ? number : fallback;
    return Math.min(max, Math.max(min, safe));
  }

  function normalizeStringArray(value) {
    if (!Array.isArray(value)) return [];

    return value
      .map(cleanText)
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index);
  }

  function emit(eventName, payload = {}) {
    const eventPayload = {
      module: MODULE_ID,
      version: VERSION,
      timestamp: nowISO(),
      ...clone(payload)
    };

    try {
      if (window.AIW?.EventBus?.emit) {
        window.AIW.EventBus.emit(eventName, eventPayload);
      }
    } catch (error) {
      console.warn(`[${MODULE_ID}] EventBus emit failed:`, error);
    }

    try {
      window.dispatchEvent(
        new CustomEvent(`aiw:${eventName}`, {
          detail: eventPayload
        })
      );
    } catch (error) {
      // CustomEvent may not exist in very old environments.
    }
  }

  function buildError(code, message, details = {}) {
    const error = new Error(message);
    error.code = code;
    error.details = clone(details);
    return error;
  }

  function validateInput(problemText) {
    const input = cleanText(problemText);
    const { minimumInputLength, maximumInputLength } = state.config;

    if (!input) {
      throw buildError(
        "EMPTY_INPUT",
        "يرجى كتابة المشكلة أو التحدي قبل بدء التحليل."
      );
    }

    if (input.length < minimumInputLength) {
      throw buildError(
        "INPUT_TOO_SHORT",
        `وصف المشكلة قصير جداً. الحد الأدنى ${minimumInputLength} أحرف.`,
        { currentLength: input.length, minimumInputLength }
      );
    }

    if (input.length > maximumInputLength) {
      throw buildError(
        "INPUT_TOO_LONG",
        `وصف المشكلة أطول من الحد المسموح وهو ${maximumInputLength} حرفاً.`,
        { currentLength: input.length, maximumInputLength }
      );
    }

    return input;
  }

  function normalizeContext(context = {}) {
    const source = context && typeof context === "object" ? context : {};

    return {
      userId: cleanText(source.userId || ""),
      userName: cleanText(source.userName || ""),
      department: cleanText(source.department || ""),
      portfolio: cleanText(source.portfolio || ""),
      location: cleanText(source.location || ""),
      source: cleanText(source.source || "manual"),
      existingIdeas: Array.isArray(source.existingIdeas)
        ? clone(source.existingIdeas)
        : [],
      metadata:
        source.metadata && typeof source.metadata === "object"
          ? clone(source.metadata)
          : {}
    };
  }

  function normalizeEngineResult(engineId, result) {
    if (result == null) return null;

    if (typeof result !== "object") {
      return {
        engineId,
        value: result
      };
    }

    return {
      engineId,
      ...clone(result)
    };
  }

  function mergeEngineResults(results) {
    const merged = {};

    for (const result of results) {
      if (!result || typeof result !== "object") continue;

      for (const [key, value] of Object.entries(result)) {
        if (key === "engineId") continue;
        if (value === undefined || value === null || value === "") continue;

        if (Array.isArray(value)) {
          merged[key] = normalizeStringArray([
            ...(Array.isArray(merged[key]) ? merged[key] : []),
            ...value
          ]);
          continue;
        }

        if (
          typeof value === "object" &&
          !Array.isArray(value) &&
          typeof merged[key] === "object" &&
          merged[key] !== null &&
          !Array.isArray(merged[key])
        ) {
          merged[key] = {
            ...merged[key],
            ...clone(value)
          };
          continue;
        }

        merged[key] = clone(value);
      }
    }

    return merged;
  }

  function buildFallbackTitle(problemText) {
    const cleaned = cleanText(problemText)
      .replace(/[.!؟?]+$/g, "")
      .slice(0, 110);

    if (!cleaned) return "فرصة ذكاء اصطناعي جديدة";

    if (
      cleaned.includes("الذكاء الاصطناعي") ||
      cleaned.includes("ذكي") ||
      cleaned.includes("ذكاء")
    ) {
      return cleaned;
    }

    return `حل ذكي لـ ${cleaned}`;
  }

  function buildFallbackDraft(problemText, context, engineData = {}) {
    const scope =
      cleanText(engineData.scope || engineData.portfolio) ||
      cleanText(context.portfolio) ||
      "الأنظمة البيومترية";

    const title =
      cleanText(engineData.title) || buildFallbackTitle(problemText);

    const problemStatement =
      cleanText(engineData.problemStatement || engineData.description) ||
      problemText;

    const proposedSolution =
      cleanText(engineData.proposedSolution || engineData.solution) ||
      "إنشاء حل تحليلي مدعوم بالذكاء الاصطناعي لدراسة المشكلة، اكتشاف الأنماط والأسباب المحتملة، واقتراح إجراءات تشغيلية قابلة للمراجعة والاعتماد البشري.";

    const aiRole =
      cleanText(engineData.aiRole) ||
      "تحليل البيانات والحالات التاريخية، اكتشاف الأنماط غير الطبيعية، ترتيب الأسباب المحتملة، واقتراح أفضل الإجراءات مع إبقاء القرار النهائي للمختصين.";

    return {
      id: createId("opportunity"),
      sourceProblem: problemText,
      title,
      summary:
        cleanText(engineData.summary) ||
        `فرصة مقترحة لمعالجة: ${problemText}`,
      problemStatement,
      rootCauses: normalizeStringArray(engineData.rootCauses),
      proposedSolution,
      aiRole,
      expectedBenefits: normalizeStringArray(engineData.expectedBenefits),
      scope,
      department:
        cleanText(engineData.department) ||
        cleanText(context.department) ||
        "",
      owner:
        cleanText(engineData.owner) ||
        cleanText(context.userName) ||
        "يحدد لاحقاً",
      priority:
        cleanText(engineData.priority) || state.config.defaultPriority,
      riskLevel:
        cleanText(engineData.riskLevel) || state.config.defaultRiskLevel,
      readiness: normalizeNumber(
        engineData.readiness,
        state.config.defaultReadiness,
        0,
        100
      ),
      decisionScore: normalizeNumber(
        engineData.decisionScore,
        50,
        0,
        100
      ),
      confidence: normalizeNumber(
        engineData.confidence,
        0.5,
        0,
        1
      ),
      estimatedDuration:
        cleanText(engineData.estimatedDuration) || "يحدد بعد التقييم الفني",
      estimatedCost:
        cleanText(engineData.estimatedCost) || "تقدير أولي يحتاج مراجعة",
      kpis: normalizeStringArray(engineData.kpis),
      implementationPhases: normalizeStringArray(
        engineData.implementationPhases
      ),
      requirements: normalizeStringArray(engineData.requirements),
      dependencies: normalizeStringArray(engineData.dependencies),
      risks: normalizeStringArray(engineData.risks),
      recommendations: normalizeStringArray(engineData.recommendations),
      duplicateAnalysis:
        engineData.duplicateAnalysis &&
        typeof engineData.duplicateAnalysis === "object"
          ? clone(engineData.duplicateAnalysis)
          : {
              isDuplicate: false,
              similarity: 0,
              matchedIdeaId: null,
              matchedIdeaTitle: null
            },
      governance: {
        humanReviewRequired: true,
        autoApprovalAllowed: false,
        generatedByAI: true,
        ...(engineData.governance &&
        typeof engineData.governance === "object"
          ? clone(engineData.governance)
          : {})
      },
      status:
        cleanText(engineData.status) || state.config.defaultStatus,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      metadata: {
        generatorVersion: VERSION,
        source: context.source || "manual",
        userId: context.userId || null,
        location: context.location || null,
        ...(context.metadata || {}),
        ...(engineData.metadata &&
        typeof engineData.metadata === "object"
          ? clone(engineData.metadata)
          : {})
      }
    };
  }

  async function executeEngine(engineId, engine, payload) {
    if (!engine || engine.enabled === false) return null;

    const handler =
      typeof engine === "function"
        ? engine
        : typeof engine.run === "function"
          ? engine.run.bind(engine)
          : typeof engine.analyze === "function"
            ? engine.analyze.bind(engine)
            : typeof engine.generate === "function"
              ? engine.generate.bind(engine)
              : null;

    if (!handler) {
      throw buildError(
        "INVALID_ENGINE",
        `المحرك "${engineId}" لا يحتوي على دالة تشغيل صالحة.`
      );
    }

    const timeoutMs = normalizeNumber(
      engine.timeoutMs,
      state.config.timeoutMs,
      1000,
      120000
    );

    const timeoutPromise = new Promise((_, reject) => {
      window.setTimeout(() => {
        reject(
          buildError(
            "ENGINE_TIMEOUT",
            `انتهت مهلة المحرك "${engineId}" بعد ${timeoutMs}ms.`,
            { engineId, timeoutMs }
          )
        );
      }, timeoutMs);
    });

    const result = await Promise.race([
      Promise.resolve(handler(clone(payload))),
      timeoutPromise
    ]);

    return normalizeEngineResult(engineId, result);
  }

  function getOrderedEngines() {
    return [...state.engines.entries()].sort((first, second) => {
      const firstOrder = Number(first[1]?.order ?? 100);
      const secondOrder = Number(second[1]?.order ?? 100);
      return firstOrder - secondOrder;
    });
  }

  async function runPipeline(problemText, context) {
    const engineResults = [];
    const engineErrors = [];

    for (const [engineId, engine] of getOrderedEngines()) {
      try {
        emit("idea-generator:engine-started", { engineId });

        const result = await executeEngine(engineId, engine, {
          problemText,
          context: clone(context),
          config: clone(state.config),
          previousResults: clone(engineResults)
        });

        if (result) {
          engineResults.push(result);
        }

        emit("idea-generator:engine-completed", {
          engineId,
          hasResult: Boolean(result)
        });
      } catch (error) {
        const normalizedError = {
          engineId,
          code: error?.code || "ENGINE_ERROR",
          message: error?.message || "فشل تشغيل أحد محركات التحليل.",
          details: clone(error?.details || {})
        };

        engineErrors.push(normalizedError);

        emit("idea-generator:engine-failed", normalizedError);

        if (engine?.required === true) {
          throw buildError(
            "REQUIRED_ENGINE_FAILED",
            `فشل المحرك الإلزامي "${engineId}".`,
            normalizedError
          );
        }
      }
    }

    return {
      engineResults,
      engineErrors,
      merged: mergeEngineResults(engineResults)
    };
  }

  async function analyze(problemText, context = {}) {
    const runId = createId("generation-run");
    const startedAt = nowISO();

    state.lastError = null;
    state.runs += 1;

    try {
      const input = validateInput(problemText);
      const normalizedContext = normalizeContext(context);

      emit("idea-generator:started", {
        runId,
        input,
        context: normalizedContext
      });

      const pipeline = await runPipeline(input, normalizedContext);
      const draft = buildFallbackDraft(
        input,
        normalizedContext,
        pipeline.merged
      );

      const result = {
        success: true,
        runId,
        startedAt,
        completedAt: nowISO(),
        input,
        context: normalizedContext,
        draft,
        engineResults: pipeline.engineResults,
        engineErrors: pipeline.engineErrors,
        usedFallback: pipeline.engineResults.length === 0
      };

      state.lastResult = clone(result);

      emit("idea-generator:completed", {
        runId,
        draftId: draft.id,
        title: draft.title,
        usedFallback: result.usedFallback,
        engineCount: pipeline.engineResults.length,
        engineErrorCount: pipeline.engineErrors.length
      });

      return clone(result);
    } catch (error) {
      const failure = {
        success: false,
        runId,
        startedAt,
        completedAt: nowISO(),
        code: error?.code || "GENERATION_FAILED",
        message:
          error?.message ||
          "تعذر إنشاء مسودة الفكرة بسبب خطأ غير متوقع.",
        details: clone(error?.details || {})
      };

      state.lastError = clone(failure);

      emit("idea-generator:failed", failure);

      throw error;
    }
  }

  function registerEngine(engineId, engineDefinition) {
    const id = cleanText(engineId);

    if (!id) {
      throw buildError(
        "INVALID_ENGINE_ID",
        "يجب توفير معرف صالح للمحرك."
      );
    }

    if (
      typeof engineDefinition !== "function" &&
      (!engineDefinition || typeof engineDefinition !== "object")
    ) {
      throw buildError(
        "INVALID_ENGINE_DEFINITION",
        `تعريف المحرك "${id}" غير صالح.`
      );
    }

    state.engines.set(id, engineDefinition);

    emit("idea-generator:engine-registered", {
      engineId: id,
      totalEngines: state.engines.size
    });

    return api;
  }

  function unregisterEngine(engineId) {
    const id = cleanText(engineId);
    const removed = state.engines.delete(id);

    if (removed) {
      emit("idea-generator:engine-unregistered", {
        engineId: id,
        totalEngines: state.engines.size
      });
    }

    return removed;
  }

  function configure(options = {}) {
    if (!options || typeof options !== "object") return clone(state.config);

    const nextScope = Array.isArray(options.scope)
      ? normalizeStringArray(options.scope)
      : state.config.scope;

    state.config = {
      ...state.config,
      ...clone(options),
      minimumInputLength: normalizeNumber(
        options.minimumInputLength,
        state.config.minimumInputLength,
        1,
        500
      ),
      maximumInputLength: normalizeNumber(
        options.maximumInputLength,
        state.config.maximumInputLength,
        50,
        10000
      ),
      duplicateThreshold: normalizeNumber(
        options.duplicateThreshold,
        state.config.duplicateThreshold,
        0,
        1
      ),
      timeoutMs: normalizeNumber(
        options.timeoutMs,
        state.config.timeoutMs,
        1000,
        120000
      ),
      scope: nextScope.length ? nextScope : [...DEFAULT_SCOPE]
    };

    emit("idea-generator:configured", {
      config: clone(state.config)
    });

    return clone(state.config);
  }

  function initialize(options = {}) {
    if (state.initialized) {
      if (options && Object.keys(options).length) configure(options);
      return api;
    }

    configure(options);
    state.initialized = true;

    emit("idea-generator:initialized", {
      config: clone(state.config),
      registeredEngines: state.engines.size
    });

    return api;
  }

  function reset(options = {}) {
    const preserveEngines = options.preserveEngines !== false;
    const preserveConfig = options.preserveConfig !== false;

    if (!preserveEngines) state.engines.clear();

    if (!preserveConfig) {
      state.config = {
        ...DEFAULT_CONFIG,
        scope: [...DEFAULT_SCOPE]
      };
    }

    state.lastResult = null;
    state.lastError = null;
    state.runs = 0;

    emit("idea-generator:reset", {
      preserveEngines,
      preserveConfig
    });

    return api;
  }

  function getStatus() {
    return {
      id: MODULE_ID,
      version: VERSION,
      initialized: state.initialized,
      registeredEngines: state.engines.size,
      engineIds: [...state.engines.keys()],
      runs: state.runs,
      hasLastResult: Boolean(state.lastResult),
      hasLastError: Boolean(state.lastError),
      config: clone(state.config)
    };
  }

  const api = {
    id: MODULE_ID,
    version: VERSION,

    initialize,
    configure,
    analyze,
    generate: analyze,

    registerEngine,
    unregisterEngine,

    getStatus,
    getConfig: () => clone(state.config),
    getRegisteredEngines: () => [...state.engines.keys()],
    getLastResult: () => clone(state.lastResult),
    getLastError: () => clone(state.lastError),

    reset,

    utils: Object.freeze({
      cleanText,
      normalizeStringArray,
      createId,
      nowISO
    })
  };

  AIW.Extensions.IdeaGenerator = api;
  AIW.IdeaGenerator = api;

  initialize();

  console.info(
    `[AI Work] AI Idea Generator Core V${VERSION} initialized`
  );
})(window);
