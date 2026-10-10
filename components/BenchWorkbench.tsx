"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BENCHMARK_GROUPS,
  BENCHMARKS,
  benchmarkGroup,
  benchmarkSubcategory,
  SCORE_DIMENSIONS,
  ScoreDimension,
} from "@/lib/benchmarks";
import {
  averageScore,
  EvaluationSession,
  GenerationResult,
} from "@/lib/evaluation";
import { clearSessions, listSessions, saveSession } from "@/lib/history";
import { normalizeAgnesApiKey } from "@/lib/agnes";
import {
  createSlot,
  loadSavedKeys,
  ModelSlot,
  PROVIDERS,
  ProviderKey,
  saveKey,
} from "@/lib/provider-config";
import { exportReport } from "@/lib/report";
import {
  Clock3,
  Download,
  ExternalLink,
  FileDown,
  FolderClock,
  ImageIcon,
  LoaderCircle,
  PencilLine,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";

const newInitialSlots = () => [
  createSlot(crypto.randomUUID(), "custom"),
  createSlot(crypto.randomUUID(), "openai"),
];

const withoutSecret = ({ id, provider, modelId, baseUrl }: ModelSlot) => ({
  id,
  provider,
  modelId,
  baseUrl,
});

export function BenchWorkbench({ showHeader = true }: { showHeader?: boolean }) {
  const [slots, setSlots] = useState<ModelSlot[]>([]);
  const [prompt, setPrompt] = useState(BENCHMARKS[0].prompt);
  const [benchmarkId, setBenchmarkId] = useState(BENCHMARKS[0].id);
  const [group, setGroup] = useState<string>(BENCHMARK_GROUPS[0].name);
  const [title, setTitle] = useState(BENCHMARKS[0].title);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [running, setRunning] = useState<Set<string>>(new Set());
  const [sessions, setSessions] = useState<EvaluationSession[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [zoom, setZoom] = useState(1);
  const [notice, setNotice] = useState("");
  const importInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSlots(newInitialSlots());
    listSessions().then(setSessions).catch(() => setNotice("无法读取本地历史"));
  }, []);

  const currentSession = useMemo<EvaluationSession>(
    () => ({
      id: sessionId || crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      title: title || "多模型生图测评",
      prompt,
      benchmarkId,
      slots: slots.map(withoutSecret),
      results,
    }),
    [benchmarkId, prompt, results, sessionId, slots, title],
  );
  const selectedBenchmark = BENCHMARKS.find((item) => item.id === benchmarkId);
  const customMode = benchmarkId === "custom";

  const startCustomPrompt = () => {
    setBenchmarkId("custom");
    setTitle("自定义生图对比");
    setPrompt("");
    setResults([]);
    setSessionId("");
  };

  const selectBenchmark = (id: string) => {
    const benchmark = BENCHMARKS.find((item) => item.id === id);
    if (!benchmark) return;
    setBenchmarkId(benchmark.id);
    setTitle(benchmark.title);
    setPrompt(benchmark.prompt);
    setResults([]);
    setSessionId("");
  };

  const patchSlot = (id: string, patch: Partial<ModelSlot>) =>
    setSlots((current) =>
      current.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)),
    );

  const selectProvider = (id: string, provider: ProviderKey) =>
    patchSlot(id, {
      provider,
      modelId: PROVIDERS[provider].defaultModel,
      baseUrl: PROVIDERS[provider].defaultBaseUrl ?? "",
      apiKey: loadSavedKeys()[provider] ?? "",
    });

  const updateKey = (provider: ProviderKey, apiKey: string) => {
    const value =
      provider === "agnes" ? normalizeAgnesApiKey(apiKey) : apiKey.trim();
    saveKey(provider, value);
    setSlots((current) =>
      current.map((slot) =>
        slot.provider === provider ? { ...slot, apiKey: value } : slot,
      ),
    );
  };

  const runSlot = async (slot: ModelSlot) => {
    const started = performance.now();
    setRunning((current) => new Set(current).add(slot.id));
    const pending: GenerationResult = {
      slotId: slot.id,
      provider: PROVIDERS[slot.provider].displayName,
      modelId: slot.modelId,
      scores: {},
    };
    setResults((current) => [
      ...current.filter((result) => result.slotId !== slot.id),
      pending,
    ]);
    try {
      const response = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          provider: slot.provider,
          modelId: slot.modelId,
          apiKey: slot.apiKey || undefined,
          baseUrl: slot.baseUrl || undefined,
        }),
      });
      const data = (await response.json()) as {
        image?: string;
        mediaType?: string;
        error?: string;
      };
      if (!response.ok || !data.image) throw new Error(data.error || "生成失败");
      const completed = {
        ...pending,
        image: data.image,
        mediaType: data.mediaType,
        elapsed: performance.now() - started,
      };
      setResults((current) =>
        current.map((result) => (result.slotId === slot.id ? completed : result)),
      );
      return completed;
    } catch (error) {
      const failed = {
        ...pending,
        elapsed: performance.now() - started,
        error: error instanceof Error ? error.message : "生成失败",
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

  const runAll = async () => {
    if (!prompt.trim() || slots.length < 2) return;
    const id = crypto.randomUUID();
    setSessionId(id);
    setResults([]);
    const completed = await Promise.all(slots.map(runSlot));
    const session: EvaluationSession = {
      id,
      createdAt: new Date().toISOString(),
      title: title || "多模型生图测评",
      prompt,
      benchmarkId,
      slots: slots.map(withoutSecret),
      results: completed,
    };
    await saveSession(session);
    setSessions(await listSessions());
    setNotice("本轮结果已保存到本机");
  };

  const persistResults = async (updated: GenerationResult[]) => {
    setResults(updated);
    if (sessionId) {
      await saveSession({ ...currentSession, results: updated });
      setSessions(await listSessions());
    }
  };

  const updateScore = (
    slotId: string,
    dimension: ScoreDimension,
    score: number,
  ) =>
    persistResults(
      results.map((result) =>
        result.slotId === slotId
          ? { ...result, scores: { ...result.scores, [dimension]: score } }
          : result,
      ),
    );

  const chooseWinner = (slotId: string) =>
    persistResults(
      results.map((result) => ({
        ...result,
        winner: result.slotId === slotId,
      })),
    );

  const openSession = (session: EvaluationSession) => {
    setSessionId(session.id);
    setTitle(session.title);
    setPrompt(session.prompt);
    setBenchmarkId(session.benchmarkId ?? "");
    const benchmark = BENCHMARKS.find((item) => item.id === session.benchmarkId);
    if (benchmark) setGroup(benchmarkGroup(benchmark));
    const keys = loadSavedKeys();
    setSlots(session.slots.map((slot) => ({ ...slot, apiKey: keys[slot.provider] ?? "" })));
    setResults(session.results);
  };

  const downloadImage = (result: GenerationResult) => {
    if (!result.image) return;
    const link = document.createElement("a");
    link.href = `data:${result.mediaType ?? "image/png"};base64,${result.image}`;
    link.download = `${result.modelId.replaceAll("/", "-")}.png`;
    link.click();
  };

  const exportHistory = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(sessions, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "image-bench-history.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importHistory = async (file?: File) => {
    if (!file) return;
    const imported = JSON.parse(await file.text()) as EvaluationSession[];
    await Promise.all(imported.map(saveSession));
    setSessions(await listSessions());
    setNotice(`已导入 ${imported.length} 条记录`);
  };

  const busy = running.size > 0;

  return (
    <main className="min-h-screen bg-[#f5f4ef] text-slate-950">
      {showHeader && <header className="border-b border-black/10 bg-[#101b18] text-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-5">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-5 w-5 text-[#b8f55b]" /> Image Bench
            </div>
            <p className="mt-1 text-xs text-white/55">
              面向办公与开发者场景的多模型生图测评台
            </p>
          </div>
          <div className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/65">
            BYOK · 密钥仅保存在本机浏览器
          </div>
        </div>
      </header>}

      <div className="mx-auto grid max-w-[1600px] gap-5 p-5 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <section className="panel">
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <FolderClock className="h-4 w-4" /> 实战题库
              <span className="ml-auto text-xs font-normal text-black/40">
                {BENCHMARKS.length} 题
              </span>
            </div>
            <div className="mb-2 flex flex-wrap gap-1">
              {BENCHMARK_GROUPS.map((item) => (
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
                  {BENCHMARKS.filter((benchmark) => benchmarkGroup(benchmark) === item.name).length}
                </button>
              ))}
            </div>
            <p className="mb-2 text-[11px] leading-4 text-black/45">
              {BENCHMARK_GROUPS.find((item) => item.name === group)?.desc}
            </p>
            <div className="max-h-[45vh] space-y-1 overflow-auto pr-1">
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
                  输入任意真实生图需求，使用相同提示词并行比较模型
                </span>
              </button>
              {BENCHMARKS.filter((item) => benchmarkGroup(item) === group).map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectBenchmark(item.id)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left transition ${
                    benchmarkId === item.id ? "bg-[#dfffad]" : "hover:bg-black/5"
                  }`}
                >
                  <span className="block text-[11px] text-black/45">
                    {benchmarkSubcategory(item)}
                  </span>
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="mt-1 block line-clamp-2 text-[11px] leading-4 text-black/45">
                    {item.goal}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold">历史记录</span>
              <span className="text-xs text-black/40">{sessions.length}</span>
            </div>
            <div className="max-h-56 space-y-1 overflow-auto">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => openSession(session)}
                  className="w-full rounded-lg p-2 text-left text-sm hover:bg-black/5"
                >
                  <span className="block truncate font-medium">{session.title}</span>
                  <span className="text-[11px] text-black/45">
                    {new Date(session.createdAt).toLocaleString("zh-CN")}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1">
              <button className="tool-button" onClick={exportHistory} title="导出历史">
                <Download className="h-4 w-4" />
              </button>
              <button
                className="tool-button"
                onClick={() => importInput.current?.click()}
                title="导入历史"
              >
                <Upload className="h-4 w-4" />
              </button>
              <button
                className="tool-button text-red-600"
                onClick={async () => {
                  if (!confirm("清空本机全部历史记录？")) return;
                  await clearSessions();
                  setSessions([]);
                }}
                title="清空历史"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <input
                ref={importInput}
                type="file"
                accept="application/json"
                hidden
                onChange={(event) => importHistory(event.target.files?.[0])}
              />
            </div>
          </section>
        </aside>

        <div className="min-w-0 space-y-5">
          <section className="panel p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <input
                aria-label="测评标题"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="min-w-64 border-0 bg-transparent text-xl font-semibold outline-none"
              />
              <div className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4 text-black/45" />
                <input
                  aria-label="同步缩放"
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.1"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                />
                <button
                  onClick={() => exportReport(currentSession).then(setNotice)}
                  disabled={!results.length}
                  className="secondary-button"
                >
                  <FileDown className="h-4 w-4" /> 导出 Blog
                </button>
              </div>
            </div>
            {selectedBenchmark && (
              <div className="mb-3 rounded-lg border border-[#b8d98a] bg-[#f2f9e8] px-3 py-2 text-xs leading-5 text-[#365019]">
                <strong>验收重点：</strong>{selectedBenchmark.goal}
              </div>
            )}
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="generation-prompt" className="text-xs font-semibold text-black/60">
                {customMode ? "自定义生图 Prompt" : "题库 Prompt（可直接修改）"}
              </label>
              <span className="text-[11px] text-black/35">{prompt.length} 字符</span>
            </div>
            <textarea
              id="generation-prompt"
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                setBenchmarkId("custom");
                setResults([]);
                setSessionId("");
              }}
              rows={5}
              placeholder="详细描述要生成的图片：主体、场景、构图、文字内容、视觉风格、尺寸比例，以及必须满足或禁止出现的约束……"
              className="w-full resize-y rounded-xl border border-black/10 bg-[#fafaf7] p-4 text-sm leading-6 outline-none focus:border-[#6d9f29]"
            />
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-black/45">
                相同提示词将同时发送给全部模型；单个失败不影响其他模型。
              </p>
              <button
                onClick={runAll}
                disabled={busy || !prompt.trim() || slots.length < 2}
                className="primary-button"
              >
                {busy ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {busy ? `生成中 ${running.size}` : "开始对比"}
              </button>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {slots.map((slot, index) => {
              const result = results.find((item) => item.slotId === slot.id);
              const definition = PROVIDERS[slot.provider];
              return (
                <article
                  key={slot.id}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                    result?.winner
                      ? "border-[#76a936] ring-2 ring-[#b8f55b]"
                      : "border-black/10"
                  }`}
                >
                  <div className="border-b border-black/10 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-black/40">
                        Model {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="flex gap-1">
                        {result && (
                          <button
                            className="icon-button"
                            onClick={() => runSlot(slot)}
                            disabled={running.has(slot.id)}
                            title="仅重跑此模型"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        {slots.length > 2 && (
                          <button
                            className="icon-button"
                            onClick={() =>
                              setSlots((current) =>
                                current.filter((item) => item.id !== slot.id),
                              )
                            }
                            title="移除模型"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={slot.provider}
                        onChange={(event) =>
                          selectProvider(slot.id, event.target.value as ProviderKey)
                        }
                        className="field"
                      >
                        {Object.entries(PROVIDERS).map(([key, provider]) => (
                          <option key={key} value={key}>
                            {provider.displayName}
                          </option>
                        ))}
                      </select>
                      <input
                        list={`models-${slot.id}`}
                        value={slot.modelId}
                        onChange={(event) =>
                          patchSlot(slot.id, { modelId: event.target.value })
                        }
                        className="field"
                        placeholder="模型 ID"
                      />
                      <datalist id={`models-${slot.id}`}>
                        {definition.models.map((model) => (
                          <option key={model} value={model} />
                        ))}
                      </datalist>
                    </div>
                    {definition.needsBaseUrl && (
                      <input
                        value={slot.baseUrl}
                        onChange={(event) =>
                          patchSlot(slot.id, { baseUrl: event.target.value })
                        }
                        className="field mt-2 w-full"
                        placeholder={
                          slot.provider === "agnes"
                            ? "Base URL（国内 api.agnes-ai.cn/v1 · 国际 apihub.agnes-ai.com/v1）"
                            : "Base URL，例如 https://apinebula.ai/v1"
                        }
                      />
                    )}
                    {slot.provider !== "vertex" && (
                      <input
                        type="password"
                        value={slot.apiKey}
                        onChange={(event) => updateKey(slot.provider, event.target.value)}
                        className="field mt-2 w-full"
                        placeholder={`API Key（自动保存；留空读取 ${definition.envHint ?? "环境变量"}）`}
                        autoComplete="off"
                      />
                    )}
                    {slot.provider === "dashscope" && (
                      <a
                        href="https://help.aliyun.com/zh/model-studio/qwen-image-generation-and-editing-api-reference"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 flex items-center gap-1 text-[11px] text-orange-700 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        百炼千问图像生成官方 API 文档
                      </a>
                    )}
                    {slot.provider === "nanobanana" && (
                      <a
                        href="https://docs.apinebula.ai/docs/advanced/image/nanobanana"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 flex items-center gap-1 text-[11px] text-amber-700 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        需使用 nanobanana 分组令牌 · 接入文档
                      </a>
                    )}
                    {slot.provider === "seedream" && (
                      <a
                        href="https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 flex items-center gap-1 text-[11px] text-sky-700 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        获取火山方舟 API Key（需先开通对应模型）
                      </a>
                    )}
                    {slot.provider === "agnes" && (
                      <a
                        href="https://wiki.agnes-ai.cn/zh-Hans/docs/agnes-image-21-flash"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 flex items-center gap-1 text-[11px] text-violet-700 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Agnes 文档 · 国际站 Key 请将 Base URL 改为 apihub.agnes-ai.com/v1
                      </a>
                    )}
                  </div>

                  <div className="relative aspect-square overflow-hidden bg-[#eeeee8]">
                    {running.has(slot.id) ? (
                      <div className="absolute inset-0 grid place-items-center text-sm text-black/45">
                        <span className="text-center">
                          <LoaderCircle className="mx-auto mb-2 h-7 w-7 animate-spin" />
                          正在生成
                        </span>
                      </div>
                    ) : result?.image ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`data:${result.mediaType ?? "image/png"};base64,${result.image}`}
                          alt={`${result.modelId} 生成结果`}
                          className="h-full w-full object-contain transition-transform"
                          style={{ transform: `scale(${zoom})` }}
                        />
                        <button
                          className="absolute bottom-3 right-3 rounded-full bg-black/70 p-2 text-white"
                          onClick={() => downloadImage(result)}
                          title="下载图片"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </>
                    ) : result?.error ? (
                      <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-red-600">
                        {result.error}
                      </div>
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-black/20">
                        <ImageIcon className="h-12 w-12" />
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
                          {averageScore(result.scores).toFixed(2)} / 5
                        </span>
                      </div>
                      {SCORE_DIMENSIONS.map((dimension) => (
                        <ScoreRow
                          key={dimension}
                          dimension={dimension}
                          value={result.scores[dimension]}
                          onChange={(score) => updateScore(slot.id, dimension, score)}
                        />
                      ))}
                      <button
                        onClick={() => chooseWinner(slot.id)}
                        className={`flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium ${
                          result.winner ? "bg-[#dfffad]" : "bg-black/5 hover:bg-black/10"
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

            {slots.length < 6 && (
              <button
                onClick={() =>
                  setSlots((current) => [
                    ...current,
                    createSlot(crypto.randomUUID(), "custom"),
                  ])
                }
                className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-black/20 bg-white/40 text-sm text-black/45 hover:bg-white"
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> 增加模型窗口
                </span>
              </button>
            )}
          </section>
        </div>
      </div>

      {notice && (
        <button
          onClick={() => setNotice("")}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-[#101b18] px-4 py-2 text-sm text-white shadow-xl"
        >
          {notice}
        </button>
      )}
    </main>
  );
}

function ScoreRow({
  dimension,
  value,
  onChange,
}: {
  dimension: ScoreDimension;
  value?: number;
  onChange: (score: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-black/60">{dimension}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            onClick={() => onChange(score)}
            className={`h-6 w-6 rounded text-[11px] ${
              value === score
                ? "bg-[#101b18] text-white"
                : "bg-black/5 hover:bg-black/10"
            }`}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}
