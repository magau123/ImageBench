"use client";

import { useEffect, useState } from "react";
import {
  Clock3,
  Download,
  ExternalLink,
  Film,
  LoaderCircle,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { loadSavedKeys, saveKey } from "@/lib/provider-config";
import {
  VIDEO_MODELS,
  VideoRatio,
  VideoResolution,
} from "@/lib/video";

const VIDEO_SCORE_DIMENSIONS = [
  "提示词遵循",
  "主体与场景一致性",
  "运动自然度",
  "时序稳定性",
  "镜头与叙事",
  "视觉与声音质量",
] as const;

interface VideoSlot {
  id: string;
  modelId: string;
}

interface VideoResult {
  slotId: string;
  modelId: string;
  videoUrl?: string;
  elapsed?: number;
  error?: string;
  scores: Partial<Record<(typeof VIDEO_SCORE_DIMENSIONS)[number], number>>;
  winner?: boolean;
}

const initialPrompt =
  "生成一段电影级多镜头视频。第1个镜头[0-2秒] 黎明时分，镜头从贴近水面的低机位缓慢推进，雾气中的未来城市逐渐显现；第2个镜头[2-4秒] 一艘白色无人艇从画面左侧驶入，水面反射金色晨光；第3个镜头[4-5秒] 镜头抬升并拉远，展示城市、河道与空中交通的完整空间关系。写实摄影，稳定运镜，主体形态一致，物理运动自然，无字幕、无水印。";

const createSlot = (modelId: string): VideoSlot => ({
  id: crypto.randomUUID(),
  modelId,
});

const average = (scores: VideoResult["scores"]) => {
  const values = Object.values(scores);
  return values.length
    ? values.reduce((sum, score) => sum + score, 0) / values.length
    : 0;
};

export function VideoWorkbench() {
  const [slots, setSlots] = useState<VideoSlot[]>([]);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [apiKey, setApiKey] = useState("");
  const [resolution, setResolution] = useState<VideoResolution>("720P");
  const [ratio, setRatio] = useState<VideoRatio>("16:9");
  const [duration, setDuration] = useState(5);
  const [results, setResults] = useState<VideoResult[]>([]);
  const [running, setRunning] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSlots([createSlot("wan3.0-video"), createSlot("wan2.7-t2v")]);
    setApiKey(loadSavedKeys().dashscope ?? "");
  }, []);

  const updateKey = (value: string) => {
    setApiKey(value);
    saveKey("dashscope", value);
  };

  const runSlot = async (slot: VideoSlot) => {
    const started = performance.now();
    const pending: VideoResult = {
      slotId: slot.id,
      modelId: slot.modelId,
      scores: {},
    };
    setResults((current) => [
      ...current.filter((result) => result.slotId !== slot.id),
      pending,
    ]);
    setRunning((current) => new Set(current).add(slot.id));

    try {
      const response = await fetch("/api/generate-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          modelId: slot.modelId,
          apiKey: apiKey || undefined,
          resolution,
          ratio,
          duration,
        }),
      });
      const data = (await response.json()) as {
        videoUrl?: string;
        error?: string;
      };
      if (!response.ok || !data.videoUrl) {
        throw new Error(data.error || "视频生成失败");
      }
      const completed: VideoResult = {
        ...pending,
        videoUrl: data.videoUrl,
        elapsed: performance.now() - started,
      };
      setResults((current) =>
        current.map((result) =>
          result.slotId === slot.id ? completed : result,
        ),
      );
      return completed;
    } catch (error) {
      const failed: VideoResult = {
        ...pending,
        elapsed: performance.now() - started,
        error: error instanceof Error ? error.message : "视频生成失败",
      };
      setResults((current) =>
        current.map((result) => (result.slotId === slot.id ? failed : result)),
      );
      return failed;
    } finally {
      setRunning((current) => {
        const next = new Set(current);
        next.delete(slot.id);
        return next;
      });
    }
  };

  const updateScore = (
    slotId: string,
    dimension: (typeof VIDEO_SCORE_DIMENSIONS)[number],
    score: number,
  ) =>
    setResults((current) =>
      current.map((result) =>
        result.slotId === slotId
          ? { ...result, scores: { ...result.scores, [dimension]: score } }
          : result,
      ),
    );

  const chooseWinner = (slotId: string) =>
    setResults((current) =>
      current.map((result) => ({
        ...result,
        winner: result.slotId === slotId,
      })),
    );

  const busy = running.size > 0;

  return (
    <main className="min-h-screen bg-[#f5f4ef] p-5 text-slate-950">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <section className="panel p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-semibold">
                <Film className="h-5 w-5" /> 多模型视频生成对比
              </h1>
              <p className="mt-1 text-xs text-black/50">
                使用相同提示词并行比较万相视频模型。任务通常需要数分钟，结果链接有效期为
                24 小时。
              </p>
            </div>
            <a
              href="https://help.aliyun.com/zh/model-studio/text-to-video-guide"
              target="_blank"
              rel="noreferrer"
              className="secondary-button"
            >
              <ExternalLink className="h-4 w-4" /> 百炼官方文档
            </a>
          </div>

          <label className="text-xs font-semibold text-black/60">
            视频 Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(event) => {
              setPrompt(event.target.value);
              setResults([]);
            }}
            rows={6}
            placeholder="描述主体、动作、镜头运动、分镜时间、环境、光线、声音及禁止出现的内容……"
            className="mt-2 w-full resize-y rounded-xl border border-black/10 bg-[#fafaf7] p-4 text-sm leading-6 outline-none focus:border-[#6d9f29]"
          />

          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <input
              type="password"
              value={apiKey}
              onChange={(event) => updateKey(event.target.value)}
              placeholder="百炼 API Key（可使用环境变量）"
              className="field md:col-span-2"
              autoComplete="off"
            />
            <select
              value={resolution}
              onChange={(event) =>
                setResolution(event.target.value as VideoResolution)
              }
              className="field"
            >
              <option value="720P">720P</option>
              <option value="1080P">1080P</option>
            </select>
            <select
              value={ratio}
              onChange={(event) =>
                setRatio(event.target.value as VideoRatio)
              }
              className="field"
            >
              <option value="16:9">横屏 16:9</option>
              <option value="9:16">竖屏 9:16</option>
              <option value="1:1">方形 1:1</option>
            </select>
            <select
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
              className="field"
            >
              {[5, 10, 15].map((seconds) => (
                <option key={seconds} value={seconds}>
                  {seconds} 秒
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-amber-700">
              视频按秒计费；正式运行前请确认模型价格与账户余额。
            </p>
            <button
              className="primary-button"
              disabled={busy || !prompt.trim() || slots.length < 2}
              onClick={() => Promise.all(slots.map(runSlot))}
            >
              {busy ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {busy ? `生成中 ${running.size}` : "开始视频对比"}
            </button>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {slots.map((slot, index) => {
            const result = results.find((item) => item.slotId === slot.id);
            return (
              <article
                key={slot.id}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                  result?.winner
                    ? "border-[#76a936] ring-2 ring-[#b8f55b]"
                    : "border-black/10"
                }`}
              >
                <div className="flex items-center gap-2 border-b border-black/10 p-4">
                  <span className="text-xs font-semibold text-black/40">
                    VIDEO {String(index + 1).padStart(2, "0")}
                  </span>
                  <select
                    value={slot.modelId}
                    onChange={(event) =>
                      setSlots((current) =>
                        current.map((item) =>
                          item.id === slot.id
                            ? { ...item, modelId: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className="field ml-auto min-w-48"
                  >
                    {VIDEO_MODELS.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  {result && (
                    <button
                      className="icon-button"
                      onClick={() => runSlot(slot)}
                      disabled={running.has(slot.id)}
                      title="重跑此模型"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                  {slots.length > 2 && (
                    <button
                      className="icon-button text-red-600"
                      onClick={() =>
                        setSlots((current) =>
                          current.filter((item) => item.id !== slot.id),
                        )
                      }
                      title="移除模型"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="relative aspect-video bg-[#171b19]">
                  {running.has(slot.id) ? (
                    <div className="absolute inset-0 grid place-items-center text-center text-sm text-white/60">
                      <span>
                        <LoaderCircle className="mx-auto mb-3 h-8 w-8 animate-spin" />
                        视频任务处理中
                        <small className="mt-1 block text-white/35">
                          通常需要数分钟，请勿关闭页面
                        </small>
                      </span>
                    </div>
                  ) : result?.videoUrl ? (
                    <>
                      <video
                        src={result.videoUrl}
                        controls
                        loop
                        className="h-full w-full bg-black object-contain"
                      />
                      <a
                        href={result.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white"
                        title="打开或下载视频"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </>
                  ) : result?.error ? (
                    <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-red-400">
                      {result.error}
                    </div>
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-white/20">
                      <Film className="h-12 w-12" />
                    </div>
                  )}
                </div>

                {result && (
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-black/45">
                        <Clock3 className="h-3.5 w-3.5" />
                        {result.elapsed
                          ? `${(result.elapsed / 1000).toFixed(1)}s`
                          : "—"}
                      </span>
                      <span className="font-semibold">
                        {average(result.scores).toFixed(2)} / 5
                      </span>
                    </div>
                    {VIDEO_SCORE_DIMENSIONS.map((dimension) => (
                      <div
                        key={dimension}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-xs text-black/60">{dimension}</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((score) => (
                            <button
                              key={score}
                              onClick={() =>
                                updateScore(slot.id, dimension, score)
                              }
                              className={`h-6 w-6 rounded text-[11px] ${
                                result.scores[dimension] === score
                                  ? "bg-[#101b18] text-white"
                                  : "bg-black/5 hover:bg-black/10"
                              }`}
                            >
                              {score}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => chooseWinner(slot.id)}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium ${
                        result.winner
                          ? "bg-[#dfffad]"
                          : "bg-black/5 hover:bg-black/10"
                      }`}
                    >
                      <Star className="h-4 w-4" />
                      {result.winner ? "本轮最佳" : "设为最佳"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}

          {slots.length < 4 && (
            <button
              onClick={() =>
                setSlots((current) => [
                  ...current,
                  createSlot("wan2.6-t2v"),
                ])
              }
              className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-black/20 bg-white/40 text-sm text-black/45 hover:bg-white"
            >
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> 增加视频模型
              </span>
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
