import { NextRequest, NextResponse } from "next/server";
import { ImageModel, experimental_generateImage as generateImage } from "ai";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { createFireworks, fireworks } from "@ai-sdk/fireworks";
import { createReplicate, replicate } from "@ai-sdk/replicate";
import { vertex } from "@ai-sdk/google-vertex/edge";
import {
  agnesImageEndpoint,
  normalizeAgnesApiKey,
  parseAgnesError,
} from "@/lib/agnes";
import { ProviderKey } from "@/lib/provider-config";

const TIMEOUT_MILLIS = 180_000;
const DASHSCOPE_ENDPOINT =
  "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";
const NANOBANANA_ENDPOINT = "https://img-api.apinebula.ai/v1beta/models";
const ARK_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/images/generations";

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

interface NanoBananaResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> };
  }>;
  error?: { message?: string };
}

const generateWithNanoBanana = async ({
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
  const response = await fetch(
    `${NANOBANANA_ENDPOINT}/${encodeURIComponent(modelId)}:generateContent`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt.trim() }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            aspectRatio:
              size === "1536x1024" ? "3:2" : size === "1024x1536" ? "2:3" : "1:1",
            imageSize: "1K",
          },
        },
      }),
    },
  );
  const data = (await response.json().catch(() => ({}))) as NanoBananaResponse;
  if (!response.ok) {
    throw new Error(data.error?.message || `NanoBanana 请求失败 (${response.status})`);
  }
  const inline = data.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.data,
  )?.inlineData;
  if (!inline?.data) throw new Error("NanoBanana 响应中没有生成图片");
  return { image: inline.data, mediaType: inline.mimeType || "image/png" };
};

// "2K" lets Seedream infer the aspect ratio from the prompt; Seedream rejects 1K-class pixel sizes.
const generateWithSeedream = async ({
  prompt,
  modelId,
  apiKey,
}: {
  prompt: string;
  modelId: string;
  apiKey: string;
}) => {
  const response = await fetch(ARK_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      prompt: prompt.trim(),
      size: "2K",
      response_format: "b64_json",
      watermark: false,
    }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    data?: Array<{ b64_json?: string }>;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(data.error?.message || `火山方舟请求失败 (${response.status})`);
  }
  const image = data.data?.[0]?.b64_json;
  if (!image) throw new Error("火山方舟响应中没有生成图片");
  return { image, mediaType: "image/jpeg" };
};

const agnesImageParams = (size?: GenerateRequest["size"]) => {
  if (size === "1536x1024") return { size: "2K", ratio: "3:2" };
  if (size === "1024x1536") return { size: "2K", ratio: "2:3" };
  return { size: "1K", ratio: "1:1" };
};

const generateWithAgnes = async ({
  prompt,
  modelId,
  apiKey,
  baseUrl,
  size,
}: {
  prompt: string;
  modelId: string;
  apiKey: string;
  baseUrl?: string;
  size?: GenerateRequest["size"];
}) => {
  const { size: agnesSize, ratio } = agnesImageParams(size);
  const response = await fetch(agnesImageEndpoint(baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      prompt: prompt.trim(),
      size: agnesSize,
      ratio,
      return_base64: true,
    }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    data?: Array<{ b64_json?: string; url?: string }>;
    error?: { message?: string };
    detail?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(parseAgnesError(data, response.status));
  }
  let image = data.data?.[0]?.b64_json;
  if (!image) {
    const url = data.data?.[0]?.url;
    if (!url) throw new Error("Agnes 响应中没有生成图片");
    const imageResponse = await fetch(url);
    if (!imageResponse.ok) throw new Error("Agnes 图片下载失败");
    const mediaType = imageResponse.headers.get("content-type") || "image/png";
    image = Buffer.from(await imageResponse.arrayBuffer()).toString("base64");
    return { image, mediaType };
  }
  return { image, mediaType: "image/png" };
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

    if (provider === "nanobanana") {
      const key = apiKey || process.env.NANOBANANA_API_KEY;
      if (!key) {
        return NextResponse.json(
          { error: "请填写 nanobanana 分组的 API Key，或配置 NANOBANANA_API_KEY" },
          { status: 400 },
        );
      }
      const result = await withTimeout(
        generateWithNanoBanana({ prompt, modelId, apiKey: key, size: body.size }),
        TIMEOUT_MILLIS,
      );
      return NextResponse.json({ provider, ...result });
    }

    if (provider === "seedream") {
      const key = apiKey || process.env.ARK_API_KEY;
      if (!key) {
        return NextResponse.json(
          { error: "请填写火山方舟 API Key，或配置 ARK_API_KEY" },
          { status: 400 },
        );
      }
      const result = await withTimeout(
        generateWithSeedream({ prompt, modelId, apiKey: key }),
        TIMEOUT_MILLIS,
      );
      return NextResponse.json({ provider, ...result });
    }

    if (provider === "agnes") {
      const key =
        normalizeAgnesApiKey(apiKey) ||
        normalizeAgnesApiKey(process.env.AGNES_API_KEY);
      if (!key) {
        return NextResponse.json(
          { error: "请填写 Agnes API Key，或配置 AGNES_API_KEY" },
          { status: 400 },
        );
      }
      const result = await withTimeout(
        generateWithAgnes({
          prompt,
          modelId,
          apiKey: key,
          baseUrl: baseUrl || process.env.AGNES_BASE_URL,
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
