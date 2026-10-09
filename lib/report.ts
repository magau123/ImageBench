import { BENCHMARKS, SCORE_DIMENSIONS } from "./benchmarks.ts";
import { averageScore } from "./evaluation.ts";
import type { EvaluationSession } from "./evaluation.ts";

const safeName = (value: string) =>
  value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").slice(0, 80);

export const buildMarkdown = (
  session: EvaluationSession,
  imagePaths: Record<string, string> = {},
) => {
  const ranked = [...session.results].sort(
    (a, b) => averageScore(b.scores) - averageScore(a.scores),
  );
  const completed = ranked.filter((result) => result.image);
  const fastest = [...completed].sort(
    (a, b) => (a.elapsed ?? Infinity) - (b.elapsed ?? Infinity),
  )[0];
  const winner = ranked.find((result) => result.winner) ?? ranked[0];
  const benchmark = BENCHMARKS.find((item) => item.id === session.benchmarkId);

  const lines = [
    `# ${session.title}`,
    "",
    `> 测评时间：${new Date(session.createdAt).toLocaleString("zh-CN")}`,
    "",
    ...(benchmark
      ? [`- 测试类别：${benchmark.category}`, `- 验收重点：${benchmark.goal}`, ""]
      : []),
    "## 测评方法",
    "",
    `本次使用完全相同的提示词并行测试 ${session.results.length} 个模型，从${SCORE_DIMENSIONS.join("、")}共 ${SCORE_DIMENSIONS.length} 个维度进行人工评分（1–5 分）。`,
    "",
    "### 提示词",
    "",
    "```text",
    session.prompt,
    "```",
    "",
    "## 结果对比",
    "",
  ];

  ranked.forEach((result, index) => {
    lines.push(
      `### ${index + 1}. ${result.modelId}`,
      "",
      `- 供应商：${result.provider}`,
      `- 生成耗时：${result.elapsed ? `${(result.elapsed / 1000).toFixed(1)} 秒` : "失败/未知"}`,
      `- 综合评分：${averageScore(result.scores).toFixed(2)} / 5`,
      ...SCORE_DIMENSIONS.map(
        (dimension) => `- ${dimension}：${result.scores[dimension] ?? "未评分"}`,
      ),
      "",
    );
    if (imagePaths[result.slotId]) {
      lines.push(
        `![${result.modelId}](${imagePaths[result.slotId]})`,
        "",
      );
    }
    if (result.error) lines.push(`> 生成失败：${result.error}`, "");
  });

  lines.push(
    "## 结论",
    "",
    winner
      ? `综合表现最佳的是 **${winner.modelId}**，平均评分 ${averageScore(winner.scores).toFixed(2)} / 5。`
      : "本轮尚未选出最佳模型。",
    fastest
      ? `速度最快的是 **${fastest.modelId}**，耗时 ${((fastest.elapsed ?? 0) / 1000).toFixed(1)} 秒。`
      : "",
    "",
    "模型输出具有随机性，单轮结果不能代表模型稳定水平；正式结论建议对每类题目重复至少三次。",
    "",
  );
  return lines.filter((line) => line !== undefined).join("\n");
};

const base64Bytes = (base64: string) =>
  Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));

export const exportReport = async (session: EvaluationSession) => {
  const picker = (
    window as typeof window & {
      showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
    }
  ).showDirectoryPicker;

  if (picker) {
    const directory = await picker();
    const imagesDirectory = await directory.getDirectoryHandle("images", {
      create: true,
    });
    const paths: Record<string, string> = {};
    for (const result of session.results) {
      if (!result.image) continue;
      const extension = result.mediaType?.includes("jpeg") ? "jpg" : "png";
      const filename = `${safeName(result.modelId)}-${result.slotId}.${extension}`;
      const handle = await imagesDirectory.getFileHandle(filename, {
        create: true,
      });
      const writable = await handle.createWritable();
      await writable.write(base64Bytes(result.image));
      await writable.close();
      paths[result.slotId] = `images/${filename}`;
    }
    const report = await directory.getFileHandle("report.md", { create: true });
    const writable = await report.createWritable();
    await writable.write(buildMarkdown(session, paths));
    await writable.close();
    return "已导出 report.md 与 images 文件夹";
  }

  const markdown = buildMarkdown(session);
  const escaped = markdown
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  const gallery = session.results
    .filter((result) => result.image)
    .map(
      (result) =>
        `<figure><img src="data:${result.mediaType ?? "image/png"};base64,${result.image}" alt="${safeName(result.modelId)}"><figcaption>${safeName(result.modelId)}</figcaption></figure>`,
    )
    .join("");
  const html = `<!doctype html><meta charset="utf-8"><title>${safeName(session.title)}</title><style>body{max-width:960px;margin:40px auto;font:16px/1.7 system-ui;padding:0 20px}pre{white-space:pre-wrap}img{max-width:100%}figure{margin:32px 0}</style><pre>${escaped}</pre>${gallery}`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName(session.title)}.html`;
  link.click();
  URL.revokeObjectURL(url);
  return "当前浏览器不支持文件夹导出，已下载自包含 HTML";
};
