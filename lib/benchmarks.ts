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

export interface BenchmarkPrompt {
  id: string;
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
];

export const validateBenchmarks = (items: BenchmarkPrompt[] = BENCHMARKS) => {
  const ids = new Set(items.map((item) => item.id));
  return (
    ids.size === items.length &&
    items.every((item) => item.title && item.prompt && item.goal && item.category)
  );
};
