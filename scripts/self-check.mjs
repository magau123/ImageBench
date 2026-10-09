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
import { buildVideoParameters, VIDEO_MODELS } from "../lib/video.ts";
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

test("video models use the correct DashScope protocol parameters", () => {
  assert.ok(VIDEO_MODELS.includes("wan3.0-video"));
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
