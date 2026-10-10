"use client";

import { useEffect, useState } from "react";
import {
  VIDEO_BENCHMARK_GROUPS,
  VIDEO_BENCHMARKS,
  VIDEO_SCORE_DIMENSIONS,
  VideoScoreDimension,
  videoBenchmarkGroup,
  videoBenchmarkSubcategory,
} from "@/lib/video-benchmarks";
import { normalizeAgnesApiKey } from "@/lib/agnes";
import { loadSavedKeys, saveKey } from "@/lib/provider-config";
import {
  createVideoSlot,
  VIDEO_PROVIDERS,
  VideoProviderKey,
  VideoRatio,
  VideoResolution,
  VideoSlot,
  videoKeyStoreId,
} from "@/lib/video";

const newVideoSlot = (provider: VideoProviderKey = "dashscope") =>
  createVideoSlot(
    crypto.randomUUID(),
    provider,
    loadSavedKeys()[videoKeyStoreId(provider)] ?? "",
  );
import {
  Clock3,
  Download,
  ExternalLink,
  Film,
  FolderClock,
  LoaderCircle,
  PencilLine,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";

interface VideoResult {
  slotId: string;
  provider: VideoProviderKey;
  modelId: string;
  videoUrl?: string;
  elapsed?: number;
  error?: string;
  scores: Partial<Record<VideoScoreDimension, number>>;
  winner?: boolean;
}

const average = (scores: VideoResult["scores"]) => {
  const values = Object.values(scores);
  return values.length
    ? values.reduce((sum, score) => sum + score, 0) / values.length
    : 0;
};

export function VideoWorkbench() {
  const [slots, setSlots] = useState<VideoSlot[]>([]);
  const [prompt, setPrompt] = useState(VIDEO_BENCHMARKS[0].prompt);
  const [benchmarkId, setBenchmarkId] = useState(VIDEO_BENCHMARKS[0].id);
  const [group, setGroup] = useState<string>(VIDEO_BENCHMARK_GROUPS[0].name);
  const [title, setTitle] = useState(VIDEO_BENCHMARKS[0].title);
  const [resolution, setResolution] = useState<VideoResolution>("720P");
  const [ratio, setRatio] = useState<VideoRatio>("16:9");
  const [duration, setDuration] = useState(VIDEO_BENCHMARKS[0].duration ?? 5);
  const [results, setResults] = useState<VideoResult[]>([]);
  const [running, setRunning] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSlots([newVideoSlot("dashscope"), newVideoSlot("agnes")]);
  }, []);

  const selectedBenchmark = VIDEO_BENCHMARKS.find((item) => item.id === benchmarkId);
  const customMode = benchmarkId === "custom";

  const startCustomPrompt = () => {
    setBenchmarkId("custom");
    setTitle("自定义视频对比");
    setPrompt("");
    setResults([]);
  };

  const selectBenchmark = (id: string) => {
    const item = VIDEO_BENCHMARKS.find((benchmark) => benchmark.id === id);
    if (!item) return;
    setBenchmarkId(item.id);
    setTitle(item.title);
    setPrompt(item.prompt);
    setDuration(item.duration ?? 5);
    setGroup(videoBenchmarkGroup(item));
    setResults([]);
  };

  const selectProvider = (id: string, provider: VideoProviderKey) => {
    const next = newVideoSlot(provider);
    setSlots((current) =>
      current.map((slot) =>
        slot.id === id
          ? { ...next, id: slot.id }
          : slot,
      ),
    );
  };

  const updateKey = (provider: VideoProviderKey, apiKey: string) => {
    const value =
      provider === "agnes" ? normalizeAgnesApiKey(apiKey) : apiKey.trim();
    saveKey(videoKeyStoreId(provider), value);
    setSlots((current) =>
      current.map((slot) =>
        slot.provider === provider ? { ...slot, apiKey: value } : slot,
      ),
    );
  };

  const runSlot = async (slot: VideoSlot) => {
    const started = performance.now();
    const pending: VideoResult = {
      slotId: slot.id,
      provider: slot.provider,
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
          provider: slot.provider,
          modelId: slot.modelId,
          apiKey: slot.apiKey || undefined,
          baseUrl: slot.baseUrl || undefined,
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
    dimension: VideoScoreDimension,
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
    <main className="min-h-screen bg-[#f5f4ef] text-slate-950">
      <div className="mx-auto grid max-w-[1600px] gap-5 p-5 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <section className="panel">
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <FolderClock className="h-4 w-4" /> 视频题库
              <span className="ml-auto text-xs font-normal text-black/40">
                {VIDEO_BENCHMARKS.length} 题
              </span>
            </div>
            <div className="mb-2 flex flex-wrap gap-1">
              {VIDEO_BENCHMARK_GROUPS.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setGroup(item.name)}
                  title={item.desc}
                  className={`rounded-full px-2.5 py-1 text-[11px] transition ${
                    group === item.name
                      ? "bg-[#101b18] font-semibold text-white"
                      : "bg-black/5 text-black/60 hover:bg-black/10"
                  }`}
                >
                  {item.name}{" "}
                  {
                    VIDEO_BENCHMARKS.filter(
                      (benchmark) => videoBenchmarkGroup(benchmark) === item.name,
                    ).length
                  }
                </button>
              ))}
            </div>
            <p className="mb-2 text-[11px] leading-4 text-black/45">
              {VIDEO_BENCHMARK_GROUPS.find((item) => item.name === group)?.desc}
            </p>
            <div className="max-h-[70vh] space-y-1 overflow-auto pr-1">
              <button
                onClick={startCustomPrompt}
                className={`mb-2 w-full rounded-xl border px-3 py-3 text-left transition ${
                  customMode
                    ? "border-[#87b943] bg-[#dfffad]"
                    : "border-dashed border-black/20 bg-[#fafaf7] hover:border-black/40"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <PencilLine className="h-4 w-4" />
                  自定义 Prompt
                </span>
                <span className="mt-1 block text-[11px] leading-4 text-black/50">
                  输入任意真实视频需求，使用相同提示词并行比较模型
                </span>
              </button>
              {VIDEO_BENCHMARKS.filter(
                (item) => videoBenchmarkGroup(item) === group,
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectBenchmark(item.id)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left transition ${
                    benchmarkId === item.id ? "bg-[#dfffad]" : "hover:bg-black/5"
                  }`}
                >
                  <span className="block text-[11px] text-black/45">
                    {videoBenchmarkSubcategory(item)}
                  </span>
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="mt-1 block line-clamp-2 text-[11px] leading-4 text-black/45">
                    {item.goal}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <div className="space-y-5">
          <section className="panel p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full bg-transparent text-xl font-semibold outline-none"
                />
                <p className="mt-1 text-xs text-black/50">
                  多供应商视频对比 · 任务通常需要数分钟，结果链接约 24 小时有效
                </p>
              </div>
              <button
                className="primary-button"
                disabled={busy || !prompt.trim() || slots.length < 1}
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

            {selectedBenchmark && !customMode && (
              <div className="mb-3 rounded-xl bg-[#eef6e0] px-3 py-2 text-xs text-[#31451a]">
                验收重点：{selectedBenchmark.goal}
              </div>
            )}

            <textarea
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                setResults([]);
              }}
              rows={6}
              placeholder="描述主体、动作、镜头运动、分镜时间、环境、光线及禁止出现的内容……"
              className="w-full resize-y rounded-xl border border-black/10 bg-[#fafaf7] p-4 text-sm leading-6 outline-none focus:border-[#6d9f29]"
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
                onChange={(event) => setRatio(event.target.value as VideoRatio)}
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
            <p className="mt-3 text-xs text-amber-700">
              视频按秒计费；正式运行前请确认模型价格与账户余额。
            </p>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            {slots.map((slot, index) => {
              const result = results.find((item) => item.slotId === slot.id);
              const definition = VIDEO_PROVIDERS[slot.provider];
              return (
                <article
                  key={slot.id}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                    result?.winner
                      ? "border-[#76a936] ring-2 ring-[#b8f55b]"
                      : "border-black/10"
                  }`}
                >
                  <div className="space-y-2 border-b border-black/10 p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-black/40">
                        VIDEO {String(index + 1).padStart(2, "0")}
                      </span>
                      {result && (
                        <button
                          className="icon-button ml-auto"
                          onClick={() => runSlot(slot)}
                          disabled={running.has(slot.id)}
                          title="重跑此模型"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                      {slots.length > 1 && (
                        <button
                          className={`icon-button text-red-600 ${result ? "" : "ml-auto"}`}
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
                    <select
                      value={slot.provider}
                      onChange={(event) =>
                        selectProvider(
                          slot.id,
                          event.target.value as VideoProviderKey,
                        )
                      }
                      className="field w-full"
                    >
                      {(
                        Object.entries(VIDEO_PROVIDERS) as [
                          VideoProviderKey,
                          (typeof VIDEO_PROVIDERS)[VideoProviderKey],
                        ][]
                      ).map(([key, item]) => (
                        <option key={key} value={key}>
                          {item.displayName}
                        </option>
                      ))}
                    </select>
                    <input
                      list={`video-models-${slot.id}`}
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
                      className="field w-full"
                      placeholder="模型 ID"
                    />
                    <datalist id={`video-models-${slot.id}`}>
                      {definition.models.map((model) => (
                        <option key={model} value={model} />
                      ))}
                    </datalist>
                    {definition.needsBaseUrl && (
                      <input
                        value={slot.baseUrl}
                        onChange={(event) =>
                          setSlots((current) =>
                            current.map((item) =>
                              item.id === slot.id
                                ? { ...item, baseUrl: event.target.value.trim() }
                                : item,
                            ),
                          )
                        }
                        className="field w-full"
                        placeholder="Base URL（国内默认 api.agnes-ai.cn/v1；国际站 apihub.agnes-ai.com/v1）"
                      />
                    )}
                    <input
                      type="password"
                      value={slot.apiKey}
                      onChange={(event) =>
                        updateKey(slot.provider, event.target.value)
                      }
                      className="field w-full"
                      placeholder={`API Key（自动保存；留空读取 ${definition.envHint}）`}
                      autoComplete="off"
                    />
                    <a
                      href={definition.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[11px] text-sky-700 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {definition.docsLabel}
                    </a>
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
                  setSlots((current) => [...current, newVideoSlot("dashscope")])
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
      </div>
    </main>
  );
}
