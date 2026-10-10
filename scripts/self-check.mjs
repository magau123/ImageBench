import assert from "node:assert/strict";
import test from "node:test";
import {
  BENCHMARK_GROUPS,
  BENCHMARKS,
  benchmarkGroup,
  SCORE_DIMENSIONS,
  validateBenchmarks,
} from "../lib/benchmarks.ts";
import { buildMarkdown } from "../lib/report.ts";
import {
  VIDEO_BENCHMARK_GROUPS,
  VIDEO_BENCHMARKS,
  validateVideoBenchmarks,
  videoBenchmarkGroup,
} from "../lib/video-benchmarks.ts";
import {
  agnesPollOrigin,
  normalizeAgnesApiKey,
  resolveAgnesBaseUrl,
} from "../lib/agnes.ts";
import {
  buildVideoParameters,
  createVideoSlot,
  VIDEO_MODELS,
  VIDEO_PROVIDERS,
} from "../lib/video.ts";
import { createSlot, loadSavedKeys, saveKey } from "../lib/provider-config.ts";

test("API keys persist per provider, auto-fill new slots, and clear on empty input", () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  };
  saveKey("nanobanana", "sk-banana");
  saveKey("dashscope", "sk-ali");
  assert.equal(createSlot("a", "nanobanana").apiKey, "sk-banana");
  assert.equal(createSlot("b", "nanobanana").modelId, "gemini-3.1-flash-image");
  assert.equal(createSlot("c", "seedream").modelId, "doubao-seedream-5-0-pro-260628");
  assert.equal(createSlot("d", "agnes").modelId, "agnes-image-2.5-flash");
  saveKey("nanobanana", "");
  assert.deepEqual(loadSavedKeys(), { dashscope: "sk-ali" });
  delete globalThis.localStorage;
});

test("benchmark library has unique, usable office and developer prompts", () => {
  assert.equal(validateBenchmarks(), true);
  assert.ok(BENCHMARKS.length >= 40);
  assert.equal(SCORE_DIMENSIONS.length, 8);
  for (const group of BENCHMARK_GROUPS) {
    const count = BENCHMARKS.filter((item) => benchmarkGroup(item) === group.name).length;
    assert.ok(count >= 4, `${group.name} has only ${count} prompts`);
  }
});

test("report contains prompt, ranking, scores and image links", () => {
  const markdown = buildMarkdown(
    {
      id: "demo",
      createdAt: "2026-09-21T10:00:00.000Z",
      title: "结构图测评",
      prompt: "Draw a system diagram",
      benchmarkId: "sci-metro-map",
      slots: [],
      results: [
        {
          slotId: "a",
          provider: "OpenAI",
          modelId: "model-a",
          image: "base64",
          elapsed: 1200,
          winner: true,
          scores: Object.fromEntries(
            SCORE_DIMENSIONS.map((dimension) => [dimension, 5]),
          ),
        },
        {
          slotId: "b",
          provider: "Custom",
          modelId: "model-b",
          error: "mock failure",
          scores: {},
        },
      ],
    },
    { a: "images/model-a.png" },
  );
  assert.match(markdown, /Draw a system diagram/);
  assert.match(markdown, /测试类别：科研教育 · 线路地图/);
  assert.match(markdown, /5\.00 \/ 5/);
  assert.match(markdown, /images\/model-a\.png/);
  assert.match(markdown, /mock failure/);
});

test("agnes auth and base URL routing", () => {
  assert.equal(normalizeAgnesApiKey(" Bearer sk-test "), "sk-test");
  assert.equal(
    resolveAgnesBaseUrl("https://apihub.agnes-ai.com/v1/"),
    "https://apihub.agnes-ai.com/v1",
  );
  assert.equal(
    agnesPollOrigin("https://apihub.agnes-ai.com/v1"),
    "https://apihub.agnes-ai.com",
  );
});

test("video models use the correct DashScope protocol parameters", () => {
  assert.ok(VIDEO_MODELS.includes("wan3.0-video"));
  assert.ok(VIDEO_PROVIDERS.seedance.models.length >= 2);
  assert.ok(VIDEO_PROVIDERS.agnes.models.includes("agnes-video-2.5-flash"));
  assert.deepEqual(
    buildVideoParameters("wan3.0-video", "720P", "16:9", 5),
    {
      resolution: "720P",
      ratio: "16:9",
      duration: 5,
      prompt_extend: false,
      watermark: false,
    },
  );
  assert.deepEqual(
    buildVideoParameters("wan2.6-t2v", "1080P", "9:16", 10),
    {
      size: "1080*1920",
      duration: 10,
      prompt_extend: true,
      shot_type: "multi",
      watermark: false,
    },
  );
});

test("video benchmark library covers multiple comparison angles", () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  };
  saveKey("seedream", "sk-ark");
  assert.equal(
    createVideoSlot("v", "seedance", loadSavedKeys().seedream ?? "").apiKey,
    "sk-ark",
  );
  assert.equal(
    createVideoSlot("v2", "seedance").modelId,
    "doubao-seedance-1-0-pro-250528",
  );
  delete globalThis.localStorage;

  validateVideoBenchmarks();
  assert.ok(VIDEO_BENCHMARKS.length >= 12);
  for (const group of VIDEO_BENCHMARK_GROUPS) {
    const count = VIDEO_BENCHMARKS.filter(
      (item) => videoBenchmarkGroup(item) === group.name,
    ).length;
    assert.ok(count >= 2, `${group.name} needs at least 2 prompts`);
  }
});
