import { NextRequest, NextResponse } from "next/server";
import { ImageModel, experimental_generateImage as generateImage } from "ai";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { createFireworks, fireworks } from "@ai-sdk/fireworks";
import { createReplicate, replicate } from "@ai-sdk/replicate";
import { vertex } from "@ai-sdk/google-vertex/edge";
import { ProviderKey } from "@/lib/provider-config";

const TIMEOUT_MILLIS = 180_000;
const DASHSCOPE_ENDPOINT =
  "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

interface GenerateRequest {
  prompt: string;
  provider: ProviderKey;
  modelId: string;
  apiKey?: string;
  baseUrl?: string;
  size?: "1024x1024" | "1536x1024" | "1024x1536";
}

const withTimeout = <T,>(promise: Promise<T>, timeoutMillis: number) =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeoutMillis),
    ),
  ]);

interface DashScopeResponse {
  output?: {
    choices?: Array<{
      message?: { content?: Array<{ image?: string }> };
    }>;
  };
  code?: string;
  message?: string;
}

const generateWithDashScope = async ({
  prompt,
  modelId,
  apiKey,
  size,
}: {
  prompt: string;
  modelId: string;
  apiKey: string;
  size?: GenerateRequest["size"];
}) => {
  const legacyModel = !modelId.startsWith("qwen-image-2") &&
    !modelId.startsWith("qwen-image-3");
  const dimensions = legacyModel
    ? size === "1536x1024"
      ? "1664*928"
      : size === "1024x1536"
        ? "928*1664"
        : "1328*1328"
    : (size ?? "1024x1024").replace("x", "*");

  const response = await fetch(DASHSCOPE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      input: {
        messages: [
          {
            role: "user",
            content: [{ text: prompt.trim() }],
          },
        ],
      },
      parameters: {
        size: dimensions,
        n: 1,
        prompt_extend: false,
        watermark: false,
      },
    }),
  });
  const data = (await response.json()) as DashScopeResponse;
  if (!response.ok) {
    throw new Error(data.message || data.code || `百炼请求失败 (${response.status})`);
  }
  const imageUrl = data.output?.choices?.[0]?.message?.content?.find(
    (item) => item.image,
  )?.image;
  if (!imageUrl) throw new Error("百炼响应中没有生成图片");

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) throw new Error("百炼图片下载失败");
  const mediaType = imageResponse.headers.get("content-type") || "image/png";
  if (!mediaType.startsWith("image/")) throw new Error("百炼返回了无效图片格式");
  const image = Buffer.from(await imageResponse.arrayBuffer()).toString("base64");
  return { image, mediaType };
};

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).slice(2);
  const body = (await req.json()) as GenerateRequest;
  const { prompt, provider, modelId, apiKey, baseUrl } = body;

  try {
    if (!prompt?.trim() || !provider || !modelId?.trim()) {
      return NextResponse.json({ error: "请求参数不完整" }, { status: 400 });
    }

    if (provider === "dashscope") {
      const key = apiKey || process.env.DASHSCOPE_API_KEY;
      if (!key) {
        return NextResponse.json(
          { error: "请填写百炼 API Key，或配置 DASHSCOPE_API_KEY" },
          { status: 400 },
        );
      }
      const result = await withTimeout(
        generateWithDashScope({
          prompt,
          modelId,
          apiKey: key,
          size: body.size,
        }),
        TIMEOUT_MILLIS,
      );
      return NextResponse.json({ provider, ...result });
    }

    let model: ImageModel;
    let usesAspectRatio = false;
    switch (provider) {
      case "custom": {
        if (!apiKey || !baseUrl) {
          return NextResponse.json(
            { error: "兼容接口需要 Base URL 和 API Key" },
            { status: 400 },
          );
        }
        const endpoint = new URL(baseUrl);
        if (!["http:", "https:"].includes(endpoint.protocol)) {
          return NextResponse.json(
            { error: "Base URL 仅支持 HTTP 或 HTTPS" },
            { status: 400 },
          );
        }
        model = createOpenAI({
          apiKey,
          baseURL: endpoint.toString().replace(/\/+$/, ""),
        }).image(modelId);
        break;
      }
      case "openai":
        model = apiKey
          ? createOpenAI({ apiKey }).image(modelId)
          : openai.image(modelId);
        break;
      case "replicate":
        model = apiKey
          ? createReplicate({ apiToken: apiKey }).image(modelId)
          : replicate.image(modelId);
        break;
      case "fireworks":
        model = apiKey
          ? createFireworks({ apiKey }).image(modelId)
          : fireworks.image(modelId);
        usesAspectRatio = true;
        break;
      case "vertex":
        model = vertex.image(modelId);
        usesAspectRatio = true;
        break;
      default:
        return NextResponse.json({ error: "不支持的供应商" }, { status: 400 });
    }

    const result = await withTimeout(
      generateImage({
        model,
        prompt: prompt.trim(),
        ...(usesAspectRatio
          ? { aspectRatio: body.size === "1536x1024" ? "3:2" : body.size === "1024x1536" ? "2:3" : "1:1" }
          : { size: body.size ?? "1024x1024" }),
        ...(provider !== "openai" && provider !== "custom"
          ? { seed: Math.floor(Math.random() * 1_000_000) }
          : {}),
        providerOptions: { vertex: { addWatermark: false } },
      }),
      TIMEOUT_MILLIS,
    );

    return NextResponse.json({
      provider,
      image: result.image.base64,
      mediaType: result.image.mimeType,
    });
  } catch (error) {
    // Secrets are deliberately excluded from logs.
    console.error(
      `Image generation failed [${requestId}, ${provider}, ${modelId}]`,
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "图片生成失败" },
      { status: 500 },
    );
  }
}
