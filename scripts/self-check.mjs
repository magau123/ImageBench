import assert from "node:assert/strict";
import test from "node:test";
import {
  BENCHMARKS,
  SCORE_DIMENSIONS,
  validateBenchmarks,
} from "../lib/benchmarks.ts";
import { buildMarkdown } from "../lib/report.ts";
import { buildVideoParameters, VIDEO_MODELS } from "../lib/video.ts";

test("benchmark library has unique, usable office and developer prompts", () => {
  assert.equal(validateBenchmarks(), true);
  assert.ok(BENCHMARKS.length >= 18);
  assert.equal(SCORE_DIMENSIONS.length, 8);
  assert.ok(BENCHMARKS.some((item) => item.category.includes("办公")));
  assert.ok(BENCHMARKS.some((item) => item.category.includes("程序员")));
});

test("report contains prompt, ranking, scores and image links", () => {
  const markdown = buildMarkdown(
    {
      id: "demo",
      createdAt: "2026-09-21T10:00:00.000Z",
      title: "结构图测评",
      prompt: "Draw a system diagram",
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
