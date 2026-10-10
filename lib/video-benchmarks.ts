export const VIDEO_BENCHMARK_GROUPS = [
  { name: "电影叙事", desc: "多镜头故事板、主体一致性与叙事连贯" },
  { name: "产品营销", desc: "电商展示、功能演示与品牌短片感" },
  { name: "人物动作", desc: "人体运动、表情与物理合理性" },
  { name: "运镜空间", desc: "推拉摇移、空间关系与视差" },
  { name: "风格艺术", desc: "动画、国风、抽象与强风格化" },
  { name: "压力测试", desc: "文字、多主体、快速切换等易崩坏场景" },
] as const;

export const VIDEO_SCORE_DIMENSIONS = [
  "提示词遵循",
  "主体与场景一致性",
  "运动自然度",
  "时序稳定性",
  "镜头与叙事",
  "视觉质量",
] as const;

export type VideoScoreDimension = (typeof VIDEO_SCORE_DIMENSIONS)[number];

export interface VideoBenchmarkPrompt {
  id: string;
  /** "大类 · 子类"; 大类 must be one of VIDEO_BENCHMARK_GROUPS. */
  category: string;
  title: string;
  goal: string;
  prompt: string;
  /** Suggested clip length in seconds. */
  duration?: number;
}

export const VIDEO_BENCHMARKS: VideoBenchmarkPrompt[] = [
  {
    id: "film-dawn-city",
    category: "电影叙事 · 多镜头",
    title: "黎明未来城三镜头",
    goal: "检验分镜时间码、主体一致性与运镜连贯",
    duration: 5,
    prompt:
      "生成一段电影级多镜头视频。第1个镜头[0-2秒] 黎明时分，镜头从贴近水面的低机位缓慢推进，雾气中的未来城市逐渐显现；第2个镜头[2-4秒] 一艘白色无人艇从画面左侧驶入，水面反射金色晨光；第3个镜头[4-5秒] 镜头抬升并拉远，展示城市、河道与空中交通的完整空间关系。写实摄影，稳定运镜，主体形态一致，物理运动自然，无字幕、无水印。",
  },
  {
    id: "film-cafe-meet",
    category: "电影叙事 · 对话场景",
    title: "雨夜咖啡馆重逢",
    goal: "检验人物身份稳定、情绪与剪辑节奏",
    duration: 5,
    prompt:
      "电影短片。第1镜[0-2秒] 雨夜街道外推镜头，霓虹倒映在湿润路面，咖啡馆暖黄灯光从玻璃透出；第2镜[2-4秒] 推至店内，一位穿深色风衣的亚洲男性推门进入，水珠从衣摆滴落；第3镜[4-5秒] 反打坐在窗边的女性抬头微笑对视。暖冷色对比，浅景深，无字幕无水印。",
  },
  {
    id: "film-chase-alley",
    category: "电影叙事 · 动作",
    title: "窄巷追逐",
    goal: "检验高速运动、遮挡与镜头跟随稳定性",
    duration: 5,
    prompt:
      "动作片短镜头。黄昏窄巷，手持跟拍一位穿红色连帽衫的少年沿巷奔跑，镜头尽量保持主体居中；他侧身避开堆叠纸箱，碎石被踢飞。背景墙面有涂鸦与晾晒衣物。真实运动模糊，物理合理，无慢动作特效字，无字幕无水印。",
  },
  {
    id: "mkt-bottle-spin",
    category: "产品营销 · 电商",
    title: "护肤瓶旋转展示",
    goal: "检验产品细节、材质反光与镜头环绕",
    duration: 5,
    prompt:
      "高端电商产品视频。纯白摄影棚，一瓶磨砂玻璃护肤精华瓶置于亚克力台面中央。镜头缓慢环绕 180 度，瓶身商标清晰可读为「LUMEN」，金色泵头高光平滑，液体轻微晃动。柔和棚拍光，无人物，无字幕条，无水印。",
  },
  {
    id: "mkt-app-demo",
    category: "产品营销 · 功能演示",
    title: "手机 App 手势演示",
    goal: "检验 UI 可读性、手指遮挡与界面稳定性",
    duration: 5,
    prompt:
      "产品演示短片。俯拍浅色木桌，一只手持深色手机竖屏操作。屏幕显示简洁待办 App：顶部标题「今日任务」，下方三条清晰中文任务。手指点击第一条完成，出现轻微勾选动画。真实手机反射与手指皮肤纹理，界面文字全程可读，无花屏，无字幕贴片，无水印。",
  },
  {
    id: "mkt-food-steam",
    category: "产品营销 · 餐饮",
    title: "热汤升腾特写",
    goal: "检验蒸汽、食物材质与食欲感光影",
    duration: 5,
    prompt:
      "美食广告特写。陶瓷碗中盛着浓郁番茄汤，表面油脂微微浮动，热气缓缓升起。勺子从右侧舀起一勺，汤汁拉丝落下。侧逆光勾勒蒸汽轮廓，背景虚化餐厅环境。写实微距质感，无文字无水印。",
  },
  {
    id: "act-tai-chi",
    category: "人物动作 · 武术",
    title: "公园太极",
    goal: "检验肢体关节、衣袂跟随与动作连贯",
    duration: 5,
    prompt:
      "清晨公园，一位约 60 岁亚洲男性穿灰色练功服打太极拳。镜头中景固定，人物完成「云手」连贯动作，双手与躯干协调，衣袖自然摆动。背景有模糊行人与树木，阳光透过树叶。写实，人体比例正确，无多余肢体，无字幕无水印。",
  },
  {
    id: "act-dance-spin",
    category: "人物动作 · 舞蹈",
    title: "排练室旋转",
    goal: "检验快速旋转时面部与服装稳定性",
    duration: 5,
    prompt:
      "舞蹈排练室，落地镜与木地板。一位穿黑色练功服的年轻女性完成一次原地旋转并收势站定。镜头侧前方中景跟拍，面部特征保持一致，发丝与衣摆随惯性自然落下。室内日光灯，无字幕无水印。",
  },
  {
    id: "act-pet-run",
    category: "人物动作 · 动物",
    title: "柴犬草地奔跑",
    goal: "检验四足运动周期与毛发动态",
    duration: 5,
    prompt:
      "晴天草地，一只赤色柴犬从画面左侧跑向右侧，四肢步态自然，耳朵与尾巴随跑动摆动。低机位跟拍保持犬只大致居中，背景有模糊树木。写实摄影，无文字无水印。",
  },
  {
    id: "cam-orbit-car",
    category: "运镜空间 · 环绕",
    title: "经典车环绕",
    goal: "检验 360 环绕时几何与反光连续",
    duration: 5,
    prompt:
      "黄昏海边公路旁，一辆复古红色敞篷车静止停放。镜头围绕车辆缓慢环绕约 120 度，车身金属与镀铬细节连续变化，海平面与落日背景随之旋转。电影感写实，无字幕无水印。",
  },
  {
    id: "cam-drone-reveal",
    category: "运镜空间 · 航拍",
    title: "山谷航拍揭示",
    goal: "检验大尺度空间揭示与视差层次",
    duration: 5,
    prompt:
      "航拍镜头从茂密松林上空向前推进并轻微上升，最终揭示深处隐藏的碧蓝湖泊与远处雪山。云影在山坡缓慢移动，景深层次清晰。纪录片气质，稳定云台，无字幕无水印。",
  },
  {
    id: "cam-parallax-street",
    category: "运镜空间 · 视差",
    title: "骑行街巷视差",
    goal: "检验前景中景后景分层与速度感",
    duration: 5,
    prompt:
      "第一人称视角骑行穿过欧洲老城石板街。前景路灯与招牌快速掠过，中景行人与店铺，远景教堂尖顶缓慢移动形成视差。午后阳光，轻微手持感但不眩晕，无字幕无水印。",
  },
  {
    id: "art-ink-dragon",
    category: "风格艺术 · 国风",
    title: "水墨游龙",
    goal: "检验风格统一与动态笔墨感",
    duration: 5,
    prompt:
      "中国水墨动画风格。一条墨色苍龙在宣纸纹理背景中盘旋飞行，墨迹边缘自然晕染，偶有淡彩青绿点缀山峦。镜头随龙身缓慢横移。无写实照片感，无字幕无水印。",
  },
  {
    id: "art-pixel-city",
    category: "风格艺术 · 像素",
    title: "像素雨夜都市",
    goal: "检验强风格化下的运动可读性",
    duration: 5,
    prompt:
      "16-bit 像素艺术风格。雨夜霓虹都市街道，像素小人撑伞走过积水倒影，远处列车高架驶过。固定机位，色彩限制为复古调色板，雨滴为像素颗粒。无写实渲染，无字幕无水印。",
  },
  {
    id: "art-clay-kitchen",
    category: "风格艺术 · 定格",
    title: "黏土厨房小戏",
    goal: "检验定格动画材质与微小动作",
    duration: 5,
    prompt:
      "黏土定格动画。迷你厨房里，橙色黏土小猫跳上柜台去够一盘曲奇，尾巴摆动，面粉微微扬起。柔和台灯光，可见指纹与黏土接缝质感。温馨童趣，无字幕无水印。",
  },
  {
    id: "stress-text-board",
    category: "压力测试 · 文字",
    title: "黑板公式书写",
    goal: "检验动态文字可读与笔画稳定",
    duration: 5,
    prompt:
      "教室特写：一只手用白色粉笔在黑板上书写公式 E=mc^2，笔画清晰连续。写完后镜头略微拉远显示完整板书。真实粉笔灰与摩擦声暗示，文字不得扭曲变形，无额外字幕条，无水印。",
  },
  {
    id: "stress-crowd-cross",
    category: "压力测试 · 多主体",
    title: "十字路口人流",
    goal: "检验多主体互不粘连与方向一致性",
    duration: 5,
    prompt:
      "白天城市十字路口高角度俯拍。十余位行人沿斑马线交错穿行，车辆在停止线等待。每个人物服装颜色区分明显，运动方向清晰，互不穿模。写实，无字幕无水印。",
  },
  {
    id: "stress-hard-cuts",
    category: "压力测试 · 快切",
    title: "三场景硬切",
    goal: "检验硬切场景切换是否串味或变形",
    duration: 5,
    prompt:
      "严格硬切三场景，不要溶解过渡：[0-1.5秒] 雪地中的孤独木屋外景；[1.5-3.5秒] 突然切到热带海滩冲浪板特写；[3.5-5秒] 再硬切到赛博朋克夜巷霓虹招牌。每段场景风格独立完整，主体不得串场，无字幕无水印。",
  },
];

export const videoBenchmarkGroup = (item: VideoBenchmarkPrompt) =>
  item.category.split(" · ")[0] ?? item.category;

export const videoBenchmarkSubcategory = (item: VideoBenchmarkPrompt) =>
  item.category.split(" · ")[1] ?? "";

export const validateVideoBenchmarks = (items = VIDEO_BENCHMARKS) => {
  const groups = new Set<string>(VIDEO_BENCHMARK_GROUPS.map((group) => group.name));
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) throw new Error(`duplicate video benchmark id: ${item.id}`);
    ids.add(item.id);
    const group = videoBenchmarkGroup(item);
    if (!groups.has(group)) throw new Error(`unknown video group: ${group}`);
  }
};
