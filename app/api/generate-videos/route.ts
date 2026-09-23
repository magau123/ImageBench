import { NextRequest, NextResponse } from "next/server";
import {
  buildVideoParameters,
  VideoRatio,
  VideoResolution,
} from "@/lib/video";

export const maxDuration = 900;

const CREATE_ENDPOINT =
  "https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis";
const TASK_ENDPOINT = "https://dashscope.aliyuncs.com/api/v1/tasks";
const POLL_INTERVAL_MS = 15_000;
const MAX_WAIT_MS = 12 * 60_000;

interface GenerateVideoRequest {
  prompt: string;
  modelId: string;
  apiKey?: string;
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

const sleep = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function POST(request: NextRequest) {
  const body = (await request.json()) as GenerateVideoRequest;
  const prompt = body.prompt?.trim();
  const modelId = body.modelId?.trim();
  const apiKey = body.apiKey || process.env.DASHSCOPE_API_KEY;
  const resolution = body.resolution ?? "720P";
  const ratio = body.ratio ?? "16:9";
  const duration = Math.min(Math.max(body.duration ?? 5, 2), 15);

  if (!prompt || !modelId) {
    return NextResponse.json({ error: "提示词和视频模型不能为空" }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json(
      { error: "请填写百炼 API Key，或配置 DASHSCOPE_API_KEY" },
      { status: 400 },
    );
  }

  try {
    const createResponse = await fetch(CREATE_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
      },
      body: JSON.stringify({
        model: modelId,
        input: { prompt },
        parameters: buildVideoParameters(
          modelId,
          resolution,
          ratio,
          duration,
        ),
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
        `${TASK_ENDPOINT}/${encodeURIComponent(taskId)}`,
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
        return NextResponse.json({ videoUrl, taskId });
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
  } catch (error) {
    console.error(
      `Video generation failed [${modelId}]`,
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "视频生成失败" },
      { status: 500 },
    );
  }
}
