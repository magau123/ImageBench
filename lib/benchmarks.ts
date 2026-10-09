export const SCORE_DIMENSIONS = [
  "指令与约束遵循",
  "中英文文字准确",
  "数字与标签准确",
  "结构与连线逻辑",
  "信息层级与排版",
  "视觉风格一致性",
  "高密度内容可读性",
  "实际交付可用性",
] as const;

export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];

export const BENCHMARK_GROUPS = [
  { name: "程序员", desc: "架构图、时序图、数据建模、运维流程与产品界面" },
  { name: "办公", desc: "管理汇报、战略分析、项目管理、BPMN 与数据看板" },
  { name: "设计营销", desc: "品牌海报、电商主图、VI 规范、包装与社媒信息图" },
  { name: "摄影写实", desc: "人像、商业产品、建筑室内、美食与夜景街拍" },
  { name: "插画艺术", desc: "角色设定、国风工笔、等距场景与儿童绘本" },
  { name: "科研教育", desc: "生物结构、物理受力、数学板书与线路地图" },
  { name: "压力测试", desc: "计数空间、长文本、多语言、手部、否定指令与光学物理" },
] as const;

export interface BenchmarkPrompt {
  id: string;
  /** "大类 · 子类"; 大类 must be one of BENCHMARK_GROUPS. */
  category: string;
  title: string;
  goal: string;
  prompt: string;
}

export const BENCHMARKS: BenchmarkPrompt[] = [
  {
    id: "arch-global-saas",
    category: "程序员 · 架构图",
    title: "全球化 SaaS 多区域容灾架构",
    goal:
      "高难度验收：双区域边界、同步与异步链路、灾备方向、信任域、图例及 20 余个精确标签均不得错位。",
    prompt:
      '为架构评审会绘制一张 16:9、白底、可直接放入 PPT 的“Global SaaS Platform — Multi-region DR Architecture”架构图。顶部是 Users，依次连接 Global DNS、CDN + WAF、Global Load Balancer。主体严格分成两个等宽虚线区域：“Primary · Singapore”和“DR · Tokyo”。每个区域均包含 Public Subnet、Private App Subnet、Data Subnet 三层；新加坡区含 API Gateway、Auth Service、Order Service、Billing Service、Kubernetes Cluster、Redis、PostgreSQL Primary、Object Storage、Kafka；东京区含相同应用服务以及 PostgreSQL Standby。蓝色实线表示同步请求，橙色虚线表示异步事件，紫色双向线只用于 PostgreSQL Cross-region Replication。右侧单独放置 Observability 区域，包含 Metrics、Logs、Traces、Alert Manager，两个区域均向其上报。左下角放图例“Sync / Async / Replication”，右下角标注“RTO ≤ 15 min · RPO ≤ 5 min”。要求所有箭头方向正确、跨区域连线不穿过节点、同类组件图标一致、不得增加未指定的云服务或乱码。',
  },
  {
    id: "arch-rag",
    category: "程序员 · 架构图",
    title: "企业级多租户 RAG 全生命周期",
    goal:
      "同时测试在线检索、离线入库、权限过滤、评测反馈三条链路，以及颜色图例与中英混排准确性。",
    prompt:
      '绘制“多租户企业 RAG 平台”全生命周期数据流图，横向 16:9，现代技术白皮书风格。画面分为三条泳道：①顶部“在线问答链路”：用户 → API Gateway → Tenant Auth → PII 脱敏 → Query Rewrite → Hybrid Search；Hybrid Search 并行查询 Vector DB 与 BM25 Index，合并后进入 ACL Filter → Reranker → Context Builder → LLM Gateway → Guardrails → 带引用答案；②中部“离线知识链路”：SharePoint / Confluence / PDF → Connector → Virus Scan → OCR → Chunking → Metadata Enrichment → Embedding → Vector DB，同时写入 BM25 Index；③底部“评测与反馈闭环”：用户反馈、人工标注、Golden Set → Offline Eval → Prompt Registry → 灰度发布，并用虚线反馈至 Query Rewrite、Reranker 和 LLM Gateway。蓝色实线=在线同步，橙色实线=离线处理，绿色虚线=评测反馈。必须显示“Tenant ID”“Document ACL”“Citation”三个治理标签；节点不得跨泳道，箭头不可反向或交叉覆盖文字。',
  },
  {
    id: "sequence-payment",
    category: "程序员 · 时序图",
    title: "支付下单、重试与补偿时序",
    goal:
      "验证 7 个参与者、成功/超时/重复回调三类分支、幂等键和补偿事务是否全部正确表达。",
    prompt:
      '绘制严格 UML 2.0 风格的支付下单时序图，参与者从左到右固定为 Client、API Gateway、Order Service、Payment Service、Payment Provider、Kafka、Inventory Service。主流程依次标注：① POST /orders（Idempotency-Key）；② Create PENDING order；③ Reserve inventory；④ POST /payments；⑤ Create payment intent；⑥ 3DS challenge；⑦ payment.succeeded webhook；⑧ Verify signature；⑨ Publish PaymentSucceeded；⑩ Confirm inventory；⑪ Update order PAID；⑫ 201 Created。必须包含三个清晰的 alt/opt 组合框：A“Provider timeout”中按 1s、2s、4s 最多重试 3 次，仍失败则发布 PaymentUnknown；B“Duplicate webhook”中根据 event_id 去重并返回 200；C“Inventory confirmation failed”中发布 RefundRequested 触发补偿退款。异步消息使用空心箭头，同步调用使用实心箭头，响应使用虚线；每个消息编号、英文大小写、状态值必须准确，不得遗漏生命线。',
  },
  {
    id: "k8s-zero-trust",
    category: "程序员 · 架构图",
    title: "Kubernetes 零信任网络拓扑",
    goal:
      "测试多层包含关系、南北/东西流量、NetworkPolicy、安全边界和运维入口的可验证准确性。",
    prompt:
      '创建一张“Kubernetes Production Cluster — Zero Trust Network”拓扑图。最外层为 VPC 10.20.0.0/16，内部划分 Public Subnet 10.20.1.0/24 和三个 Private Subnet：10.20.11.0/24、10.20.12.0/24、10.20.13.0/24。Internet 只能经 WAF → Public ALB → Ingress Gateway 进入集群；不得直接连接 Pod。集群内画出 Namespace: frontend、backend、data、observability，每个命名空间包含 2–3 个 Pod；frontend 仅可访问 backend:8080，backend 仅可访问 PostgreSQL:5432 与 Redis:6379，data 禁止入站公网流量。Service Mesh mTLS 覆盖东西向流量；Egress Gateway 是访问第三方 API 的唯一出口。右侧画出 Bastion Host → Kubernetes API 的运维链路，并标注“MFA + RBAC”。用红色盾牌标出四条 NetworkPolicy，用图例区分 North–South、East–West、Denied。所有 CIDR、端口和箭头方向必须清晰可读。',
  },
  {
    id: "data-lineage",
    category: "程序员 · 数据工程",
    title: "实时湖仓数据血缘图",
    goal:
      "测试批流一体、多层数据资产、质量闸门、敏感字段治理和下游消费之间的复杂血缘。",
    prompt:
      '生成“Lakehouse Data Lineage · Orders Domain”数据血缘图，16:9 深色背景。左侧 Sources 分组含 MySQL Orders、PostgreSQL Users、Mobile Events、CRM CSV；中间 Ingestion 分组含 Debezium CDC、Kafka、Schema Registry、Airflow Batch；Lakehouse 按 Bronze / Silver / Gold 三层自左向右展开：Bronze.raw_orders、Bronze.raw_users；Silver.clean_orders、Silver.dim_customer、Silver.fact_payment；Gold.gmv_daily、Gold.customer_360、Gold.risk_features。每一次转换都标注作业名，例如 job_clean_orders_v3。Silver 前放置 Data Quality Gate，显示“Freshness < 15m”“Null rate < 0.5%”“PK uniqueness = 100%”。customer_email 与 phone 字段旁标注 PII 锁图标，并连接 Data Catalog。右侧 Consumers 含 BI Dashboard、Feature Store、Finance Export；仅 Gold 层可连接 Consumers。CDC 用橙色箭头，Batch 用蓝色箭头，字段级血缘用细绿色线；禁止节点重叠和无来源表。',
  },
  {
    id: "devsecops-pipeline",
    category: "程序员 · 流程图",
    title: "DevSecOps 发布闸门与回滚",
    goal:
      "验证并行任务、质量阈值、人工审批、金丝雀发布和自动回滚的条件关系。",
    prompt:
      '绘制一张可用于研发规范文档的“DevSecOps Delivery Pipeline”流程图。从 Developer Push 开始，经 Pull Request、Build，随后并行执行 Unit Test、SAST、Dependency Scan、Secret Scan；四项全部通过才进入 Build OCI Image → SBOM → Sign with Cosign → Push Registry。部署阶段依次为 Deploy Staging、Integration Test、DAST、Manual Approval、Canary 5%、Observe 10 min。决策节点“SLO healthy?”：Yes → 25% → 50% → 100% → Release Complete；No → Auto Rollback → Incident Ticket → Notify Owner。明确失败阈值：Coverage ≥ 85%、Critical CVE = 0、Error Rate < 1%、p95 < 400ms。矩形表示任务、菱形表示闸门、红色路径表示失败/回滚、绿色路径表示成功；并行分叉与汇合必须符合逻辑。',
  },
  {
    id: "erd-commerce",
    category: "程序员 · 数据建模",
    title: "电商订单 ERD 与基数约束",
    goal:
      "测试 9 张表、主外键、基数符号、唯一约束和字段级文本渲染。",
    prompt:
      '绘制 PostgreSQL 电商订单域 ERD，Crow’s Foot 记法，表名固定为 users、addresses、products、product_variants、orders、order_items、payments、shipments、refunds。每张表显示 4–7 个核心字段及类型，PK 使用金色钥匙，FK 使用蓝色链条。关系必须准确：users 1:N addresses；users 1:N orders；products 1:N product_variants；orders 1:N order_items；product_variants 1:N order_items；orders 1:N payments；orders 1:N shipments；payments 1:N refunds。orders.order_no 标注 UNIQUE，order_items 标注 UNIQUE(order_id, variant_id)，payments.amount 使用 numeric(12,2)，所有表含 created_at timestamptz。按“用户 → 订单 → 履约/支付”从左到右分区，连线不得穿过表格，字段文字不可省略或伪造。',
  },
  {
    id: "incident-runbook",
    category: "程序员 · 运维",
    title: "P1 事故响应作战图",
    goal:
      "测试时间轴、角色泳道、升级条件、并行工作流和可观测数据的高密度表达。",
    prompt:
      '制作“P1 生产事故响应 Runbook”横向作战图。顶部时间轴严格为 T+0、T+5m、T+15m、T+30m、T+60m。下方四条角色泳道：On-call、Incident Commander、Engineering、Communications。T+0 Alert Fired，On-call 在 5 分钟内 Acknowledge 并执行 Check Dashboard / Logs / Recent Deployments；若 Customer Impact = Yes，立即 Declare P1、建立 War Room、指定 IC。Engineering 并行执行 Mitigate Traffic、Rollback Last Release、Protect Data；决策“Mitigation effective?”为 No 时升级至 VP Engineering，为 Yes 时进入 Monitor 15 min。Communications 在 T+15m 发布 Status Page，在此后每 30 分钟更新。恢复后依次 Confirm SLO Stable、Close Incident、Schedule Postmortem ≤ 48h。右侧固定显示关键指标 Error Rate、p95 Latency、Availability、Queue Lag。红色=紧急动作，蓝色=调查，绿色=恢复；所有 SLA 数字必须准确。',
  },
  {
    id: "office-board-onepager",
    category: "办公 · 管理汇报",
    title: "董事会经营复盘一页纸",
    goal:
      "测试高管信息密度、精确财务数字、同比环比符号、结论与图表之间的一致性。",
    prompt:
      '设计 16:9 中文董事会汇报页，标题“2026 Q3 经营复盘｜增长质量优先”，副标题“数据截至 2026-09-30”。顶部四张 KPI 卡必须逐字显示：营收 ¥86.4M（同比 +24.6%）、ARR ¥312M（同比 +31.2%）、毛利率 68.5%（环比 +2.1pp）、经营现金流 ¥18.7M（同比 +42.0%）。中部左侧为 2025Q4–2026Q3 营收与毛利率组合图，数据依次为营收 58.2 / 64.8 / 73.1 / 86.4，毛利率 63.8% / 65.1% / 66.4% / 68.5%；右侧为收入构成环形图：企业版 52%、专业版 31%、增值服务 17%。底部三栏：“亮点”写大客户续约率 94%、“风险”写亚太获客成本 +18%、“决策请求”写批准新增渠道预算 ¥6M。深蓝与暖灰，少量荧光绿强调，严禁修改数字、增加 KPI 或使用装饰性假图表。',
  },
  {
    id: "office-product-strategy",
    category: "办公 · 战略分析",
    title: "产品组合战略矩阵",
    goal:
      "测试二维矩阵定位、气泡大小、四象限解释、行动项和精确标签之间的对应。",
    prompt:
      '制作咨询公司风格的 16:9 战略分析页，标题“产品组合：增长潜力 × 盈利能力”。主体是 2×2 矩阵，横轴“毛利率：低 → 高”，纵轴“市场增速：低 → 高”。精确放置 6 个不同大小气泡：AI Copilot（右上，最大，绿色）、Data Cloud（右上，中，蓝色）、Legacy ERP（右下，大，灰色）、Mobile Suite（左上，中，橙色）、On-prem BI（左下，小，灰色）、API Platform（中心偏右上，中，紫色）。四象限标题分别为“加速投资”“选择性培育”“现金牛”“收缩退出”。右侧结论区恰好三条：① AI Copilot 增配 40% 研发资源；② Legacy ERP 聚焦续费与迁移；③ On-prem BI 停止新增功能。页脚注明“气泡大小 = FY2026 ARR”。要求位置、颜色、相对大小与文字一一对应。',
  },
  {
    id: "office-roadmap",
    category: "办公 · 项目管理",
    title: "跨团队年度路线图与依赖",
    goal:
      "测试季度时间轴、四条泳道、里程碑、跨团队依赖与风险标记。",
    prompt:
      '绘制“FY2027 AI Platform Roadmap”年度路线图，横轴严格分为 Q1 / Q2 / Q3 / Q4，纵向四条泳道 Platform、Model、Product、GTM。Platform：Q1 Feature Store v2，Q2 Multi-region Serving，Q3 Cost Router，Q4 99.99% SLA；Model：Q1 Eval Harness，Q2 Domain SFT，Q3 Multimodal Beta，Q4 Agent GA；Product：Q1 Design Partners，Q2 Copilot Beta，Q3 Admin Console，Q4 Enterprise GA；GTM：Q1 Pricing Study，Q2 Sales Enablement，Q3 APAC Launch，Q4 Partner Marketplace。用菱形里程碑标出 Beta、APAC Launch、Enterprise GA。依赖箭头必须显示 Eval Harness → Domain SFT → Copilot Beta，Multi-region Serving → APAC Launch，Admin Console → Enterprise GA。Q2 的 Multi-region Serving 旁放红色风险标记“Capacity”，Q3 的 Multimodal Beta 旁放黄色风险标记“Quality”。顶部显示目标“ARR ¥100M · 20 Enterprise Customers”。',
  },
  {
    id: "office-procurement-bpmn",
    category: "办公 · 流程图",
    title: "采购审批 BPMN 与合规分支",
    goal:
      "测试金额分级、招标条件、合规否决、并行会签和退回路径，不允许逻辑捷径。",
    prompt:
      '使用标准 BPMN 2.0 符号绘制“企业采购到付款（P2P）审批流程”。四个泳道为 Requester、Department、Procurement & Compliance、Finance。开始 → 提交采购申请 → 预算校验；预算不足返回 Requester 修改。预算通过后判断金额：≤ ¥50,000 由部门负责人审批；¥50,001–¥500,000 需部门负责人和采购经理并行会签；> ¥500,000 还需 CFO 审批并进入公开招标。所有金额均需经过“供应商制裁名单筛查”和“利益冲突声明”；任一合规检查失败直接终止并标注“Rejected — Compliance”。审批通过后依次为 PO 创建 → 三单匹配（PO / GR / Invoice）→ 匹配成功？；否 → 异常处理并返回 Procurement，是 → Finance 放款 → 归档 → 结束。独占网关用菱形，并行网关用加号，退回线使用红色虚线，正常线使用深蓝实线。',
  },
  {
    id: "office-ops-dashboard",
    category: "办公 · 数据看板",
    title: "SaaS 经营与客户健康驾驶舱",
    goal:
      "测试 12 个精确指标、多种图表、告警层级和数据口径说明能否在单屏保持清晰。",
    prompt:
      '设计 1440×1000 的中文 SaaS 经营驾驶舱，浅色主题。标题“订阅业务驾驶舱”，筛选器显示“2026 Q3｜全球｜企业客户”。第一行 KPI：MRR ¥26.0M、净收入留存 NRR 118.4%、Logo 流失率 1.7%、ARPA ¥42,600。第二行左侧 MRR 瀑布图必须按 Starting 23.8、New +1.9、Expansion +1.2、Contraction -0.5、Churn -0.4、Ending 26.0；右侧客户健康分布为 Healthy 62%、Watch 25%、Risk 13%。第三行左侧 Cohort 留存热力图显示 M0–M6，右侧表格“高风险客户 Top 5”，列为客户、ARR、健康分、续约日、Owner，首行固定“北辰科技｜¥2.8M｜42｜2026-10-18｜Lina”。底部告警条写“7 个客户将在 30 天内续约，其中 3 个健康分 < 60”。所有币种、百分比、小数位和正负号必须准确，不得生成不可解释的装饰图。',
  },
  {
    id: "office-org-raci",
    category: "办公 · 组织协作",
    title: "组织图与 RACI 双视图",
    goal:
      "测试同页双模块、汇报关系、矩阵角色和跨模块名称一致性。",
    prompt:
      '创建 16:9“AI 产品发布治理”组织协作页，左侧 55% 为组织图：Steering Committee 位于顶部；其下是 Product Lead、Engineering Lead、Risk Lead；Engineering Lead 下辖 ML Team、Platform Team、QA Team；Risk Lead 下辖 Security、Legal；Product Lead 下辖 Design、GTM。实线表示直接汇报，虚线表示协作。右侧 45% 为 RACI 矩阵，列固定为 Product、Engineering、Risk、GTM，行固定为 Scope Approval、Model Evaluation、Security Review、Launch Decision、Customer Communication。单元格严格填写：Scope Approval=A/R/C/I；Model Evaluation=C/R/A/I；Security Review=I/C/A/R；Launch Decision=R/C/A/C；Customer Communication=C/I/C/A。页脚解释 R=Responsible、A=Accountable、C=Consulted、I=Informed。左右两侧团队名称必须完全一致，矩阵对齐且每格仅一个字母。',
  },
  {
    id: "office-workshop",
    category: "办公 · 协作",
    title: "产品发现工作坊白板",
    goal:
      "测试真实白板质感、便利贴聚类、投票点、因果箭头和行动项的复杂空间布局。",
    prompt:
      '生成一张俯视角真实工作坊白板照片，主题“降低新用户首周流失”。白板分四区：左上“Evidence”含 6 张黄色便利贴，其中必须出现“D1 激活率 38%”“首次配置中位时长 12min”“42% 未完成数据导入”；右上“How Might We”含 4 张蓝色便利贴；左下“Ideas”含 8 张粉色便利贴并按 Setup、Education、Value 三组聚类；右下“Experiments”恰好三张绿色卡片：“一键导入模板”“首日任务清单”“第3天价值报告”。每个实验卡包含 Owner、Metric、Due Date 三行，并分别填写 Mia / Activation / 10-08，Chen / Completion / 10-12，Alex / Retention / 10-15。用红色圆点投票，总数严格为 12；从证据到机会点再到实验使用手绘箭头。文字应像粗头马克笔但清晰可辨，不得生成额外区域。',
  },
  {
    id: "ui-api-observability",
    category: "程序员 · 产品界面",
    title: "API 调试与可观测性工作台",
    goal:
      "测试多栏专业软件 UI、代码块、请求参数、Trace 瀑布和错误定位信息。",
    prompt:
      '设计 1600×1000 深色桌面应用界面，产品名“Pulse API Studio”。顶部环境选择器为 Production，右上状态“Connected”。左栏是 Collections，展开 Billing API，显示 POST /v1/invoices、GET /v1/invoices/{id}、POST /v1/refunds。中栏上半部请求编辑器选中 POST /v1/invoices，Tabs 为 Params / Headers / Body / Auth，Body 显示合法 JSON：customer_id "cus_4821"、amount 12800、currency "CNY"；下半部响应区状态“422 Unprocessable Entity”，耗时 384 ms，显示 JSON 错误 code "INVALID_TAX_ID"。右栏为 Trace，瀑布依次展示 api-gateway 24ms、billing-service 91ms、tax-service 243ms，并高亮 tax-service；其下 Logs 包含一条 ERROR：“Tax profile missing for customer cus_4821”。代码必须等宽、括号配对、大小写与数字准确，信息密集但不拥挤。',
  },
  {
    id: "ui-design-system",
    category: "程序员 · 产品界面",
    title: "企业设计系统组件规格页",
    goal:
      "测试组件状态矩阵、尺寸标注、Token 命名、无障碍说明和像素级一致性。",
    prompt:
      '制作一张“Atlas Design System / Form Controls”组件规格画板，1440×1000，类似专业 Figma 交付稿。左上展示 Button 的 Primary / Secondary / Danger 三种类型，每种含 Default、Hover、Focus、Disabled 四种状态；右上展示 Text Field 的 Empty、Filled、Error、Disabled，Error 文案固定“请输入有效的企业邮箱”。中部展示 Select、Checkbox、Radio、Toggle，均含正常与禁用状态。底部左侧是尺寸规范：height 40px、radius 8px、horizontal padding 16px、icon 16px、gap 8px；底部右侧列出 Design Tokens：color.primary.600 #2563EB、color.danger.600 #DC2626、space.2 8px、radius.md 8px、font.body.sm 14/20。旁边添加无障碍注释“Focus ring ≥ 2px”“Contrast ≥ 4.5:1”“Touch target ≥ 44px”。所有组件对齐到 8px 网格，状态差异明确，十六进制与 Token 拼写不得更改。',
  },
  {
    id: "constraint-spatial",
    category: "压力测试 · 空间与计数",
    title: "多层计数、位置与连线约束",
    goal:
      "同时考验精确计数、顺时针顺序、颜色绑定、单双向箭头、禁止连线和图例。",
    prompt:
      '在 1:1 白色画布中创建严格的三层同心系统图。中心只有 1 个紫色六边形“Core”。第二层恰好 6 个蓝色圆形节点，按顺时针从 12 点方向依次为 API、Auth、Orders、Billing、Search、Notify；每个节点用单向箭头指向 Core。第三层恰好 12 个灰色方形节点，按顺时针依次编号 C01–C12；C01 与 C02 只连接 API，C03 与 C04 只连接 Auth，以此类推，每两个连续编号连接第二层的一个节点。Orders 与 Billing 之间额外使用一条橙色双向箭头；Search 与 Notify 之间严禁连线。左下角图例必须包含“Request”“Data Sync”“Client”。总节点数必须严格为 19，不得重复、遗漏、增加标签或让连线穿过节点文字。',
  },
  {
    id: "typography-annual-report",
    category: "压力测试 · 复杂排版",
    title: "双语年度报告数据跨页",
    goal:
      "测试中英双语、高密度正文、财务数字、脚注、表格与图表组合排版。",
    prompt:
      '设计一张 A4 横向年度报告跨页，标题“长期主义，驱动高质量增长 / Long-termism Drives Quality Growth”，页码“32 — 33”。左页为 CEO Quote：“真正的效率，不是做得更多，而是让每一次投入都产生复利。”署名“李明｜首席执行官”。下方双栏正文各约 90 个中文字符，使用清晰的占位正文但不得出现乱码。右页上方三项数据必须为“研发投入 ¥1.26B”“研发人员占比 47.8%”“有效发明专利 1,842”；中部柱线组合图显示 2022–2026 研发投入 0.62 / 0.78 / 0.91 / 1.08 / 1.26（十亿元），研发投入率 12.4% / 13.1% / 13.8% / 14.2% / 15.0%；底部表格三行：基础研究 18%、平台工程 37%、产品创新 45%。脚注固定为“注：数据口径为集团合并范围；2026 年数据未经审计。”整体采用暖白纸张、墨黑正文、朱红强调色、严谨瑞士网格；所有中英文字、标点、数字和页码必须清晰准确。',
  },
  {
    id: "typography-ui-localization",
    category: "压力测试 · 多语言",
    title: "四语言 SaaS 定价页",
    goal:
      "测试多语言文字、价格周期、功能对勾、推荐标签和跨卡片一致布局。",
    prompt:
      '生成 1440×1000 的 SaaS 定价页面，顶部语言切换显示“简中 / English / 日本語 / Deutsch”，当前选中简中。标题“选择适合团队的方案”，月付/年付切换中年付被选中并标注“节省 20%”。三张等宽卡片：基础版 ¥99/月，专业版 ¥299/月，企业版 联系销售；专业版顶部必须有“最受欢迎”标签。基础版功能：5 位成员、10GB 存储、邮件支持；专业版：20 位成员、100GB 存储、API 访问、优先支持；企业版：无限成员、专属部署、SLA 99.99%、客户成功经理。底部 FAQ 展开项标题“可以随时更换方案吗？”并显示回答“可以，升级立即生效，降级将在下个计费周期生效。”右侧提供同一专业版卡片的 English 小预览，价格写“¥299 / month”，功能名为“20 members / 100GB storage / API access / Priority support”。所有价格、单位、对勾数量和中英文对应关系必须准确。',
  },
  {
    id: "design-festival-poster",
    category: "设计营销 · 品牌海报",
    title: "城市音乐节主视觉海报",
    goal:
      "测试大字标题排版、信息层级、中英混排日期地点、品牌色控制与印刷级完成度。",
    prompt:
      '设计一张 3:4 竖版音乐节主视觉海报，风格为瑞士国际主义排版结合流体渐变。主标题巨大且逐字准确：“潮汐 TIDE 2027”，副标题“城市夏夜音乐节 · Summer Night Music Festival”。中部为抽象的蓝紫色声波与海浪融合图形，不得出现人物。下方信息区严格三行：“07.18 — 07.20”“上海 · 西岸穹顶艺术中心”“早鸟票 ¥380 起”。底部横排 6 个演出阵容名称：Nova Lin、回声乐队、Kai & The Moons、北岸、Luna Park、SOLAR。右上角放置小号圆形徽章“限量 3000 张”。配色只允许深海蓝 #0B1E3F、电光紫 #7B5CFF、珊瑚橙 #FF7A59 和白色。所有文字须清晰锐利、无拼写错误、无多余文案，四周保留 5% 出血安全边距。',
  },
  {
    id: "design-ecommerce-hero",
    category: "设计营销 · 电商主图",
    title: "降噪耳机电商主图",
    goal:
      "测试商业级产品渲染、卖点标注数量与文字、价格促销信息及平台主图规范。",
    prompt:
      '制作一张 1:1、800×800 的电商平台主图，商品为一副哑光雾白色头戴式无线降噪耳机，45° 侧视角悬浮于浅灰到白色的渐变背景，底部有柔和接触阴影。产品材质需真实：耳罩为蛋白皮纹理，头梁有细腻金属拉丝。左侧竖排恰好 3 个卖点标签，每个带简洁线性图标：“-48dB 深度降噪”“60 小时续航”“Hi-Res 无损音质”。左上角品牌字样“AURA ONE”。右下角红色促销角标“到手价 ¥1,299”，其下灰色小字“限时立减 ¥200”。画面不得出现第二副耳机、手、模特或乱码，所有数字和单位必须准确，主体占画面约 60%。',
  },
  {
    id: "design-vi-board",
    category: "设计营销 · 品牌 VI",
    title: "茶饮品牌 Logo 与 VI 规范板",
    goal:
      "测试 Logo 原创性、色值与字体规范标注、应用延展的一致性与设计交付规范。",
    prompt:
      '制作一张 16:9 品牌 VI 规范展示板，品牌名“Lumen Tea · 拾光茶”。左上 40% 区域展示主 Logo：一片茶叶与新月融合的极简线性图形，下方为品牌字标；其右展示反白版与单色版。右上为标准色卡四块，逐字标注：Primary 墨绿 #1F4D3A、Secondary 米白 #F4EFE6、Accent 琥珀 #D99A3D、Neutral 深灰 #2B2B2B。中部为字体规范：中文“思源宋体 Bold”、英文“Playfair Display”，各附示例字“拾光茶 Aa Bb 123”。底部为三个应用延展样机：外带纸杯、帆布袋、门店招牌，均正确使用同一 Logo 与配色。标注最小使用尺寸“Min 24px”与安全空间“X = 字标高度”。所有色值、字体名和品牌名不得修改，整体为专业品牌手册质感。',
  },
  {
    id: "design-packaging",
    category: "设计营销 · 包装设计",
    title: "精品咖啡豆包装正面",
    goal:
      "测试包装立体渲染、标签信息排版、风味描述文字、烘焙度刻度和材质真实度。",
    prompt:
      '生成一个精品咖啡豆自立袋包装的正面产品渲染，牛皮纸质感，顶部有金属封口条和单向排气阀，置于浅木纹桌面，旁边散落少量咖啡豆，自然窗光。包装正面标签内容必须逐字准确：品牌“山脊 RIDGE ROASTERS”；产品名“埃塞俄比亚 耶加雪菲 G1”；处理法“水洗 Washed”；海拔“1,900–2,200m”；风味“茉莉花 · 柠檬 · 蜂蜜”；净含量“250g”；烘焙日期“2027.03.12”。标签右侧有横向烘焙度刻度条，从“浅 Light”到“深 Dark”共 5 格，指示点位于第 2 格。只出现一个包装袋，文字不得弯曲变形或模糊，排版具有独立精品咖啡品牌的克制感。',
  },
  {
    id: "design-social-infographic",
    category: "设计营销 · 社媒信息图",
    title: "小红书风格 5 步知识卡片",
    goal:
      "测试竖版社媒排版、步骤编号顺序、图标与文字对应、中文长句渲染和可读性。",
    prompt:
      '设计一张 3:4 竖版小红书风格知识卡片，奶油色背景，手绘感插画元素。顶部大标题“新手 5 步搭建个人知识库”，标题下方用荧光黄笔刷高亮“5 步”。主体为自上而下的 5 个步骤卡片，编号圆标依次为 1–5，每步含一个小图标和一行文字：1“收集：建立统一收件箱”；2“整理：按项目而非主题分类”；3“提炼：每篇笔记写三句摘要”；4“连接：为笔记添加双向链接”；5“复盘：每周日回顾 30 分钟”。底部写“收藏备用 ⭐ 关注获取模板”。右下角作者署名“@效率研究所”。步骤顺序、编号、文字必须完全准确，不得出现第 6 步或乱码，字体圆润清晰，留白舒适。',
  },
  {
    id: "photo-environmental-portrait",
    category: "摄影写实 · 环境人像",
    title: "陶艺工作室环境人像",
    goal:
      "测试皮肤与毛发真实度、手部解剖、景深焦外、混合光源色温与镜头语言遵循。",
    prompt:
      '拍摄一张真实感环境人像照片，85mm 定焦，f/1.8，人眼高度平视。一位约 60 岁的中国女性陶艺师坐在工作室转盘前，灰白短发，穿靛蓝扎染围裙，双手沾有湿润陶泥，正轻扶一只半成型的陶罐；双手各五指清晰、关节自然、无多余手指。主光为左侧大窗的柔和自然光（约 5600K），背景中一盏暖色钨丝灯（约 3000K）形成色温对比。背景架子上排列陶器，呈奶油般焦外虚化。需呈现真实皮肤纹理、细纹和毛孔，不得磨皮或塑料感。画面不含任何文字、水印或边框，色调参考 Kodak Portra 400 胶片。',
  },
  {
    id: "photo-product-perfume",
    category: "摄影写实 · 商业产品",
    title: "香水瓶玻璃折射商业大片",
    goal:
      "测试透明玻璃折射、液体与水珠、焦散光斑、反射一致性和瓶身小字渲染。",
    prompt:
      '高端商业产品摄影，一只方形厚底透明玻璃香水瓶，内装淡琥珀色液体，金色金属瓶盖，立于黑色亮面亚克力台面上。瓶身正面丝印白色细字，必须准确：“NOCTURNE”下方一行“EAU DE PARFUM · 50ml”。瓶身表面附着细小水珠。一束硬质侧逆光从右后方射入，在台面上形成清晰的琥珀色焦散光斑；台面上出现瓶子的倒影，倒影须与实体左右一致、上下颠倒。背景为深炭灰渐变，左侧少量烟雾。100mm 微距镜头，f/8，主体锐利。只能有一个瓶子，不得出现手、花朵或其他道具，玻璃厚度与折射扭曲需符合物理规律。',
  },
  {
    id: "photo-interior-wabisabi",
    category: "摄影写实 · 建筑室内",
    title: "侘寂风客厅建筑摄影",
    goal:
      "测试广角透视垂直线校正、物品数量位置、材质质感、自然光影和空间真实感。",
    prompt:
      '建筑室内摄影，24mm 移轴镜头，垂直线完全校正无畸变，一点透视正对拍摄侘寂风客厅。墙面为暖灰色微水泥，地面为宽幅浅橡木地板。画面中央一张低矮的米白色亚麻布艺沙发，沙发前一张不规则圆形石材茶几，茶几上恰好放置 1 只粗陶花瓶（插 1 枝枯枝）和 2 本叠放的书。左侧落地窗引入下午 4 点的斜射阳光，在地面和墙上投出清晰的窗格光影。右侧角落一盏纸质落地灯（未点亮）。画面中不得出现人物、电视、文字、多余装饰品；材质颗粒、织物纹理与光线衰减需真实，整体色调安静克制。',
  },
  {
    id: "photo-food-breakfast",
    category: "摄影写实 · 美食摄影",
    title: "中式早餐俯拍",
    goal:
      "测试俯拍构图、食物数量与种类准确、食材质感、蒸汽油光与餐具布置。",
    prompt:
      '美食摄影，90° 正俯拍，深色老榆木桌面。画面严格包含以下物品且数量准确：中央一笼竹蒸笼，内有恰好 6 只小笼包，褶子清晰、表皮微透；左上一碗咸豆浆，表面有紫菜、虾皮和红油；右上一根对半切开的油条，放在牛皮纸上；左下一小碟姜丝香醋；右下一双黑檀木筷子斜放在青瓷筷架上。蒸笼上方有轻微热气。光线为左上方柔和自然光，带适度阴影。食物须看起来新鲜可口、油光真实，不得出现人手、文字、额外菜品或变形餐具，色彩温暖。',
  },
  {
    id: "photo-rainy-street",
    category: "摄影写实 · 夜景街拍",
    title: "雨夜霓虹街头",
    goal:
      "测试湿润地面反射、霓虹招牌中文、景深层次、运动模糊与电影感色调。",
    prompt:
      '电影感街头摄影，35mm 镜头，雨夜的香港旧街。前景一位撑透明雨伞的行人背影，穿深色长风衣，轻微运动模糊。街道两侧悬挂霓虹招牌，其中三块必须清晰可读且逐字准确：红色“金城茶餐厅”、蓝色“永利押”、绿色“24小时营业”。湿润的柏油路面清晰倒映霓虹颜色，倒影文字须为镜像且与招牌对应。远处一辆红色出租车尾灯形成光晕。整体青橙对比色调，颗粒感参考 CineStill 800T 胶片，招牌高光处有红色光晕。不得出现其他可读文字、乱码字符或现代广告屏。',
  },
  {
    id: "art-character-sheet",
    category: "插画艺术 · 角色设定",
    title: "游戏角色三视图设定稿",
    goal:
      "测试多视角角色一致性（服装、配色、道具）、设定标注、色卡与概念设计规范。",
    prompt:
      '绘制一张 16:9 游戏角色设定稿，纯浅灰背景，日系二次元赛璐璐上色。角色为 17 岁少女机械师“绫 Aya”：齐肩银白短发、左眼戴琥珀色单片护目镜、橙色工装连体服、腰间挂一把大号扳手、右臂为暗金色机械义肢、黑色厚底靴。从左到右依次绘制正面、侧面（面朝右）、背面三视图，三者身高对齐，服装细节、配色与道具位置严格一致。右侧上方为 3 个表情头像：微笑、惊讶、生气。右下角色卡 5 块，标注“#E8E8F0 发色”“#FF8A3D 工装”“#C9A227 义肢”“#2B2B33 靴子”“#FFB74D 护目镜”。左上角写角色名“绫 Aya · Mechanic”。不得出现多余角色。',
  },
  {
    id: "art-guofeng-shanshui",
    category: "插画艺术 · 国风",
    title: "青绿山水工笔长卷",
    goal:
      "测试传统绘画风格还原、矿物颜料质感、构图意境、元素数量与书法题跋。",
    prompt:
      '创作一幅横向 21:9 青绿山水长卷，风格参考北宋《千里江山图》，绢本设色质感，带细微绢丝纹理与岁月泛黄。画面以石青、石绿为主色，山体层叠由近及远渐淡。从右至左依次布置：一座临水的木构亭子；一座横跨溪流的石拱桥，桥上恰好有 2 位行人；半山腰一处有 3 间房屋的村落；远处云雾缭绕的主峰；江面上恰好 1 叶扁舟与渔夫。左上角留白处有竖排行书题跋“溪山清远”，下方钤一方朱红篆书印章。不得出现现代物品、西式透视或油画笔触，线条需体现工笔勾勒。',
  },
  {
    id: "art-isometric-city",
    category: "插画艺术 · 等距场景",
    title: "等距微缩智慧城市街区",
    goal:
      "测试等距投影一致性、多建筑功能识别、交通元素计数、标识文字与细节密度。",
    prompt:
      '绘制一张 1:1 等距视角（isometric 30°）3D 微缩城市街区插画，柔和低多边形风格，明亮的清晨光线，统一从左上方投射阴影。街区为一个十字路口，四个象限分别为：左上“图书馆”（带圆顶和台阶），右上“咖啡馆”（户外遮阳伞 3 把），左下“社区诊所”（屋顶有红十字标志），右下“小公园”（喷泉 1 座、长椅 2 张、树 5 棵）。道路上恰好有 2 辆公交车、3 辆小汽车、1 条斑马线上有 4 个行人。每栋建筑门口有清晰小招牌，逐字为“LIBRARY”“CAFÉ”“CLINIC”“PARK”。所有物体须严格遵守同一等距角度，不得出现透视消失点。',
  },
  {
    id: "art-picture-book",
    category: "插画艺术 · 儿童绘本",
    title: "温暖水彩儿童绘本内页",
    goal:
      "测试绘本叙事画面、水彩笔触质感、角色数量与动作、内页排版与正文文字。",
    prompt:
      '绘制一页横向 4:3 儿童绘本内页，温暖水彩与彩铅混合风格，纸张纹理可见。场景是秋天傍晚的森林空地：一只戴红色围巾的小狐狸正把一颗橡果递给一只灰色小刺猬；旁边树墩上坐着一只戴圆眼镜的猫头鹰在看书；背景有 3 只萤火虫发出暖黄色光点；地面铺满橙红色落叶。画面下方 20% 留出米白色文字区域，排印绘本正文两行，逐字准确：“小狐狸说：‘这是我找到的最大的橡果，送给你。’”“小刺猬红着脸，把它抱得紧紧的。”角色造型可爱、比例统一，不得出现人类、恐怖元素或多余动物。',
  },
  {
    id: "sci-animal-cell",
    category: "科研教育 · 生物结构",
    title: "动物细胞结构剖面教学图",
    goal:
      "测试科学准确性、细胞器形态、引线标注数量与位置对应、中英文术语准确。",
    prompt:
      '绘制一张 4:3 高中生物教材风格的动物细胞三维剖面示意图，白色背景，清晰矢量插画风格，细胞被切开约四分之一以展示内部。必须准确画出并用引线标注以下 10 个结构，标注格式为“中文 English”：细胞膜 Cell Membrane、细胞核 Nucleus、核仁 Nucleolus、线粒体 Mitochondrion、粗面内质网 Rough ER、光面内质网 Smooth ER、高尔基体 Golgi Apparatus、溶酶体 Lysosome、核糖体 Ribosome、中心体 Centrosome。标注引线不得交叉，左右两侧对称排布。细胞中不得出现细胞壁、叶绿体或大液泡（这些属于植物细胞）。标题“动物细胞结构 Animal Cell Structure”。各细胞器形态需符合教科书：线粒体有内膜嵴，高尔基体为扁平囊堆叠。',
  },
  {
    id: "sci-physics-incline",
    category: "科研教育 · 物理示意",
    title: "斜面受力分析示意图",
    goal:
      "测试物理图示规范、力矢量方向与长度关系、角度标注、公式文字与坐标系正确性。",
    prompt:
      '绘制一张物理教科书风格的斜面受力分析图，白底黑线，矢量清晰。一个倾角 θ = 30° 的固定斜面，斜面上静止放置一个标注“m”的方形木块。从木块重心出发画出三个力的箭头：竖直向下的重力“G = mg”（红色）；垂直斜面向上的支持力“N”（蓝色）；沿斜面向上的静摩擦力“f”（绿色）。用虚线将重力分解为沿斜面分量“mg sinθ”和垂直斜面分量“mg cosθ”，并画出直角符号。斜面底角处标注圆弧和“θ = 30°”。右侧公式区写两行：“N = mg cosθ”“f = mg sinθ”。建立沿斜面方向的 x 轴、垂直斜面方向的 y 轴。所有箭头方向、角度和公式必须物理正确，不得添加额外的力。',
  },
  {
    id: "sci-math-blackboard",
    category: "科研教育 · 数学板书",
    title: "数学公式黑板板书",
    goal:
      "测试数学符号、上下标、分式根号的精确渲染，公式推导顺序与手写粉笔质感。",
    prompt:
      '生成一张真实教室墨绿色黑板的正面照片，白色粉笔手写板书，字迹清晰工整，有轻微粉笔灰质感。左上标题“一元二次方程求根公式推导”。板书自上而下依次为 5 行，每行一个公式，必须完全准确：① ax² + bx + c = 0 (a ≠ 0)；② x² + (b/a)x = −c/a；③ (x + b/2a)² = (b² − 4ac) / 4a²；④ x + b/2a = ±√(b² − 4ac) / 2a；⑤ x = (−b ± √(b² − 4ac)) / 2a，第 ⑤ 行用黄色粉笔画框突出。右侧角落写“判别式 Δ = b² − 4ac”并画一个简单的抛物线草图，标出与 x 轴的两个交点。上标、根号覆盖范围、分数线和正负号必须正确，不得出现错误符号或乱码。',
  },
  {
    id: "sci-metro-map",
    category: "科研教育 · 线路地图",
    title: "虚构城市地铁线路图",
    goal:
      "测试拓扑线路图规范、线路颜色与站点对应、换乘站标识、站名文字与图例完整性。",
    prompt:
      '设计一张 16:9 虚构城市“澜城”的地铁线路示意图，参考伦敦地铁图的拓扑风格：线路只允许水平、垂直与 45° 斜线，白色背景。共 3 条线路：1 号线（红色）由西向东依次为 西港、白鹭湾、市民中心、人民广场、科技园、东湖；2 号线（蓝色）由北向南依次为 北站、文化宫、人民广场、南湖公园、机场；3 号线（绿色）依次为 文化宫、市民中心、大学城、南湖公园。换乘站（人民广场、市民中心、文化宫、南湖公园）用白底黑边圆圈表示，普通站用线路色短刻度表示。每个站名中文在上、拼音在下（如“人民广场 Renmin Guangchang”）。右下角放置图例，含三条线路名称与颜色、换乘站符号。站点顺序与换乘关系必须完全正确，不得出现多余站或线路。',
  },
  {
    id: "stress-hands-piano",
    category: "压力测试 · 手部与肢体",
    title: "钢琴家双手特写",
    goal:
      "专项测试手部解剖：十指数量、关节弯曲、与琴键的接触关系和左右手区分。",
    prompt:
      '真实摄影特写，俯视 45° 拍摄一位钢琴家的双手正在三角钢琴上弹奏。左手位于低音区，小指、中指、拇指按下琴键，形成一个 C 大三和弦（C-E-G），其余手指自然悬空；右手位于中音区，五指张开跨越一个八度，拇指与小指分别按下两个 C 键。两只手必须各有且仅有 5 根手指，指甲修剪整齐，骨节、肌腱和皮肤纹理真实，手指弯曲角度符合人体解剖。黑白琴键排列须正确：每组 2 个和 3 个黑键交替出现。浅景深，焦点在右手。不得出现第三只手、融合的手指或错误的琴键排列。',
  },
  {
    id: "stress-negation-counterintuitive",
    category: "压力测试 · 否定与反常识",
    title: "否定指令与反常识组合",
    goal:
      "测试模型是否遵循“不要/没有”类否定约束，以及能否生成违反常见先验的组合。",
    prompt:
      '生成一张写实静物摄影：一张白色大理石桌面上，摆放着以下物品并严格满足约束：① 一个空的玻璃果盘，盘中没有任何水果；② 一只指针式挂钟靠墙放置，时间精确显示为 3:47（时针在 3 和 4 之间偏 4，分针指向 47 分）；③ 一个方形（立方体）的西瓜，外皮有自然条纹；④ 一杯装满的红酒，杯中酒液表面水平；⑤ 一支铅笔，笔尖朝左，橡皮擦端朝右。画面中不要出现任何人、苹果、香蕉、文字或品牌标志。光线来自右侧窗户。所有否定约束都必须被遵守，时钟时间必须准确。',
  },
  {
    id: "stress-optics-mirror",
    category: "压力测试 · 光学物理",
    title: "镜面反射与透明折射一致性",
    goal:
      "测试镜像左右关系、阴影方向统一、玻璃折射扭曲与多光源物理一致性。",
    prompt:
      '写实室内摄影：一面竖直的长方形浴室镜子挂在白色瓷砖墙上，镜前台面上从左到右依次摆放：一个红色马克杯（把手朝右）、一个装满水的透明圆柱玻璃杯（杯后插着一支斜放的牙刷）、一个绿色肥皂。镜中必须正确反射这三个物体：顺序在镜中保持左右对应关系，马克杯把手在镜像中同样位于其右侧；玻璃杯中的牙刷在水面处产生明显的折射错位。唯一光源为左上方的吸顶灯，三个物体的阴影都必须投向右下方且方向一致。镜中不得出现拍摄者或相机。所有反射、折射、阴影须符合物理规律。',
  },
  {
    id: "stress-long-text-menu",
    category: "压力测试 · 长文本渲染",
    title: "咖啡馆黑板菜单长文本",
    goal:
      "极限测试长文本：12 个菜品名、价格对齐、分区标题与中英双语的逐字准确率。",
    prompt:
      '生成一张咖啡馆墙上手写黑板菜单的正面照片，白色和彩色粉笔书写，顶部标题“SLOW DRIP · 慢滴咖啡”。菜单分三栏，每栏 4 项，品名与价格之间用点线连接、价格右对齐，所有文字必须逐字准确：【咖啡 COFFEE】美式 Americano ¥22；拿铁 Latte ¥28；澳白 Flat White ¥30；手冲 Pour Over ¥38。【茶饮 TEA】抹茶拿铁 Matcha Latte ¥30；伯爵红茶 Earl Grey ¥24；桂花乌龙 Osmanthus Oolong ¥26；柠檬冷泡 Lemon Cold Brew ¥25。【甜点 DESSERT】可颂 Croissant ¥18；巴斯克芝士 Basque Cheesecake ¥32；肉桂卷 Cinnamon Roll ¥22；提拉米苏 Tiramisu ¥35。底部小字“营业时间 08:00–20:00”。黑板边角有简单手绘咖啡杯涂鸦。不得遗漏、重复或编造菜品，不得出现乱码。',
  },
];

export const benchmarkGroup = (item: BenchmarkPrompt) => item.category.split(" · ")[0];
export const benchmarkSubcategory = (item: BenchmarkPrompt) =>
  item.category.split(" · ")[1] ?? item.category;

export const validateBenchmarks = (items: BenchmarkPrompt[] = BENCHMARKS) => {
  const ids = new Set(items.map((item) => item.id));
  const groups = new Set<string>(BENCHMARK_GROUPS.map((group) => group.name));
  return (
    ids.size === items.length &&
    items.every(
      (item) =>
        item.title && item.prompt && item.goal && groups.has(benchmarkGroup(item)),
    )
  );
};
