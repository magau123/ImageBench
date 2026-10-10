import { NextRequest, NextResponse } from "next/server";
import {
  agnesVideoCreateEndpoint,
  agnesVideoPollUrl,
  normalizeAgnesApiKey,
  parseAgnesError,
} from "@/lib/agnes";
import {
  buildVideoParameters,
  VideoProviderKey,
  VideoRatio,
  VideoResolution,
} from "@/lib/video";

export const maxDuration = 900;

const DASHSCOPE_CREATE =
  "https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis";
const DASHSCOPE_TASK = "https://dashscope.aliyuncs.com/api/v1/tasks";
const ARK_TASKS = "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks";
const POLL_INTERVAL_MS = 15_000;
const AGNES_POLL_INTERVAL_MS = 5_000;
const MAX_WAIT_MS = 12 * 60_000;

interface GenerateVideoRequest {
  prompt: string;
  provider?: VideoProviderKey;
  modelId: string;
  apiKey?: string;
  baseUrl?: string;
  resolution?: VideoResolution;
  ratio?: VideoRatio;
  duration?: number;
}

interface DashScopeTaskResponse {
  output?: {
    task_id?: string;
    task_status?: string;
    video_url?: string;
    code?: string;
    message?: string;
  };
  code?: string;
  message?: string;
}

interface ArkTaskResponse {
  id?: string;
  status?: string;
  content?: { video_url?: string };
  error?: { message?: string };
}

const sleep = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const generateWithDashScope = async ({
  prompt,
  modelId,
  apiKey,
  resolution,
  ratio,
  duration,
}: {
  prompt: string;
  modelId: string;
  apiKey: string;
  resolution: VideoResolution;
  ratio: VideoRatio;
  duration: number;
}) => {
  const createResponse = await fetch(DASHSCOPE_CREATE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-DashScope-Async": "enable",
    },
    body: JSON.stringify({
      model: modelId,
      input: { prompt },
      parameters: buildVideoParameters(modelId, resolution, ratio, duration),
    }),
  });
  const created = (await createResponse.json()) as DashScopeTaskResponse;
  if (!createResponse.ok) {
    throw new Error(
      created.message || created.code || `视频任务创建失败 (${createResponse.status})`,
    );
  }

  const taskId = created.output?.task_id;
  if (!taskId) throw new Error("百炼响应中没有视频任务 ID");

  const started = Date.now();
  while (Date.now() - started < MAX_WAIT_MS) {
    await sleep(POLL_INTERVAL_MS);
    const statusResponse = await fetch(
      `${DASHSCOPE_TASK}/${encodeURIComponent(taskId)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    const status = (await statusResponse.json()) as DashScopeTaskResponse;
    if (!statusResponse.ok) {
      throw new Error(
        status.message || status.code || `视频任务查询失败 (${statusResponse.status})`,
      );
    }

    const taskStatus = status.output?.task_status;
    if (taskStatus === "SUCCEEDED") {
      const videoUrl = status.output?.video_url;
      if (!videoUrl) throw new Error("视频任务成功，但响应中没有视频地址");
      return { videoUrl, taskId };
    }
    if (["FAILED", "CANCELED", "UNKNOWN"].includes(taskStatus ?? "")) {
      throw new Error(
        status.output?.message ||
          status.output?.code ||
          `视频任务状态：${taskStatus}`,
      );
    }
  }

  throw new Error("视频生成超过 12 分钟，请稍后重试");
};

const generateWithSeedance = async ({
  prompt,
  modelId,
  apiKey,
  resolution,
  ratio,
  duration,
}: {
  prompt: string;
  modelId: string;
  apiKey: string;
  resolution: VideoResolution;
  ratio: VideoRatio;
  duration: number;
}) => {
  const createResponse = await fetch(ARK_TASKS, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      content: [{ type: "text", text: prompt }],
      resolution: resolution.toLowerCase(),
      ratio,
      duration,
      watermark: false,
    }),
  });
  const created = (await createResponse.json().catch(() => ({}))) as ArkTaskResponse;
  if (!createResponse.ok) {
    throw new Error(
      created.error?.message || `火山方舟视频任务创建失败 (${createResponse.status})`,
    );
  }
  const taskId = created.id;
  if (!taskId) throw new Error("火山方舟响应中没有视频任务 ID");

  const started = Date.now();
  while (Date.now() - started < MAX_WAIT_MS) {
    await sleep(POLL_INTERVAL_MS);
    const statusResponse = await fetch(
      `${ARK_TASKS}/${encodeURIComponent(taskId)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    const status = (await statusResponse.json().catch(() => ({}))) as ArkTaskResponse;
    if (!statusResponse.ok) {
      throw new Error(
        status.error?.message || `火山方舟任务查询失败 (${statusResponse.status})`,
      );
    }

    const taskStatus = (status.status ?? "").toLowerCase();
    if (taskStatus === "succeeded") {
      const videoUrl = status.content?.video_url;
      if (!videoUrl) throw new Error("视频任务成功，但响应中没有视频地址");
      return { videoUrl, taskId };
    }
    if (["failed", "cancelled", "canceled"].includes(taskStatus)) {
      throw new Error(status.error?.message || `视频任务状态：${status.status}`);
    }
  }

  throw new Error("视频生成超过 12 分钟，请稍后重试");
};

const generateWithAgnes = async ({
  prompt,
  modelId,
  apiKey,
  baseUrl,
  resolution,
  ratio,
  duration,
}: {
  prompt: string;
  modelId: string;
  apiKey: string;
  baseUrl?: string;
  resolution: VideoResolution;
  ratio: VideoRatio;
  duration: number;
}) => {
  const seconds = String(Math.min(Math.max(duration, 4), 12));
  // ponytail: Flash model only accepts 720P; downgrade silently instead of failing the whole bench run.
  const size = modelId.includes("flash")
    ? "720P"
    : resolution === "1080P"
      ? "1080P"
      : "720P";

  const createResponse = await fetch(agnesVideoCreateEndpoint(baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      prompt: prompt.trim(),
      mode: "text",
      seconds,
      size,
      aspect_ratio: ratio,
    }),
  });
  const created = (await createResponse.json().catch(() => ({}))) as {
    video_id?: string;
    error?: { message?: string };
    detail?: string;
    message?: string;
  };
  if (!createResponse.ok) {
    throw new Error(parseAgnesError(created, createResponse.status));
  }
  const videoId = created.video_id;
  if (!videoId) throw new Error("Agnes 响应中没有 video_id");

  const pollUrl = agnesVideoPollUrl(baseUrl, videoId, modelId);
  const started = Date.now();
  while (Date.now() - started < MAX_WAIT_MS) {
    await sleep(AGNES_POLL_INTERVAL_MS);
    const statusResponse = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const status = (await statusResponse.json().catch(() => ({}))) as {
      status?: string;
      url?: string;
      error?: { message?: string } | string | null;
      detail?: string;
      message?: string;
    };
    if (!statusResponse.ok) {
      throw new Error(parseAgnesError(status, statusResponse.status));
    }

    const taskStatus = (status.status ?? "").toLowerCase();
    if (taskStatus === "completed") {
      if (!status.url) throw new Error("视频任务成功，但响应中没有视频地址");
      return { videoUrl: status.url, taskId: videoId };
    }
    if (taskStatus === "failed") {
      const message =
        typeof status.error === "string"
          ? status.error
          : status.error?.message || "Agnes 视频生成失败";
      throw new Error(message);
    }
  }

  throw new Error("视频生成超过 12 分钟，请稍后重试");
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as GenerateVideoRequest;
  const prompt = body.prompt?.trim();
  const modelId = body.modelId?.trim();
  const provider = body.provider ?? "dashscope";
  const resolution = body.resolution ?? "720P";
  const ratio = body.ratio ?? "16:9";
  const duration = Math.min(Math.max(body.duration ?? 5, 2), 15);

  if (!prompt || !modelId) {
    return NextResponse.json({ error: "提示词和视频模型不能为空" }, { status: 400 });
  }

  try {
    if (provider === "agnes") {
      const apiKey =
        normalizeAgnesApiKey(body.apiKey) ||
        normalizeAgnesApiKey(process.env.AGNES_API_KEY);
      if (!apiKey) {
        return NextResponse.json(
          { error: "请填写 Agnes API Key，或配置 AGNES_API_KEY" },
          { status: 400 },
        );
      }
      const result = await generateWithAgnes({
        prompt,
        modelId,
        apiKey,
        baseUrl: body.baseUrl || process.env.AGNES_BASE_URL,
        resolution,
        ratio,
        duration,
      });
      return NextResponse.json({ provider, ...result });
    }

    if (provider === "seedance") {
      const apiKey = body.apiKey || process.env.ARK_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "请填写火山方舟 API Key，或配置 ARK_API_KEY" },
          { status: 400 },
        );
      }
      const result = await generateWithSeedance({
        prompt,
        modelId,
        apiKey,
        resolution,
        ratio,
        duration,
      });
      return NextResponse.json({ provider, ...result });
    }

    if (provider !== "dashscope") {
      return NextResponse.json({ error: "不支持的视频供应商" }, { status: 400 });
    }

    const apiKey = body.apiKey || process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "请填写百炼 API Key，或配置 DASHSCOPE_API_KEY" },
        { status: 400 },
      );
    }
    const result = await generateWithDashScope({
      prompt,
      modelId,
      apiKey,
      resolution,
      ratio,
      duration,
    });
    return NextResponse.json({ provider, ...result });
  } catch (error) {
    // Secrets are deliberately excluded from logs.
    console.error(
      `Video generation failed [${provider}, ${modelId}]`,
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "视频生成失败" },
      { status: 500 },
    );
  }
}
