export const VIDEO_MODELS = [
  "wan3.0-video",
  "wan2.7-t2v",
  "wan2.7-t2v-2026-06-12",
  "wan2.6-t2v",
] as const;

export type VideoResolution = "720P" | "1080P";
export type VideoRatio = "16:9" | "9:16" | "1:1";

export const buildVideoParameters = (
  modelId: string,
  resolution: VideoResolution,
  ratio: VideoRatio,
  duration: number,
) => {
  const modernProtocol =
    modelId.startsWith("wan3.") || modelId.startsWith("wan2.7");
  if (modernProtocol) {
    return {
      resolution,
      ratio,
      duration,
      prompt_extend: false,
      watermark: false,
    };
  }

  const sizes = {
    "720P": {
      "16:9": "1280*720",
      "9:16": "720*1280",
      "1:1": "960*960",
    },
    "1080P": {
      "16:9": "1920*1080",
      "9:16": "1080*1920",
      "1:1": "1440*1440",
    },
  } as const;

  return {
    size: sizes[resolution][ratio],
    duration,
    prompt_extend: true,
    shot_type: "multi",
    watermark: false,
  };
};
