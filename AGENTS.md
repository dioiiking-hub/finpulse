# AGENTS.md — FinPulse 财经脉搏 · 项目上下文

> 写给任何接手本项目的 Agent（Kimi Code / Claude Code / Cursor / Codex 等）。
> 读完本文件即可理解项目的全部逻辑、数据流与运维方式，无需翻阅历史会话。

## 1. 项目是什么

面向**财经自媒体团队**的「中美财经热点监控 + AI 选题推荐」看板。
核心价值链：`全球财经信源 → 热点流 → 规则引擎评分 → 自动生成自媒体选题（标题+推荐理由+平台适配+对谈提纲）→ 团队认领协作`。

- 纯前端 SPA：React 19 + TypeScript + Vite 7 + Tailwind CSS 3.4.19 + framer-motion + lucide-react + Lenis
- 无后端；数据层为可插拔适配器设计，降级链完善（任何数据源失效都不白屏）
- GitHub 仓库：`dioiiking-hub/finpulse`（main 分支，Public）
- 视觉：Bloomberg 终端风深色主题，**红涨绿跌（中国惯例）**，品牌金 `#D8A94E`，数字一律 JetBrains Mono + tabular-nums

## 2. 页面与路由

| 路由 | 页面 | 职责 |
|---|---|---|
| `/` | 热点监控大屏 | canvas 世界点阵 Hero、TickerTape 跑马灯、实时热点流、TOP10 热度榜、情绪仪、中美瞭望、工作流 |
| `/topics` | 选题推荐 | 选题卡（S/A/B 级+标题+推荐理由+平台适配+关联热点）、520px 详情抽屉（对谈提纲/备选标题/最佳发布时间）、平台+分类+热度筛选、团队选题库 |
| `/markets` | 市场速览 | 开闭市状态带、中美指数卡（可点击跳数据源行情页）、中美对比 SVG 大图、汇率/大宗/加密、财经日历（★级选题预警）、联动观察 |
| `/about` | 数据源与协作 | 数据链路图、信源清单表、推荐引擎白皮书（Score=K×S×T×C）、团队工作流、FAQ |

## 3. 数据架构（三条数据流）

### 3.1 行情快照流（真实数据，GitHub Actions 驱动）
```
.github/workflows/snapshot.yml（每小时整点 cron）
  → scripts/make_snapshot_gh.py
      yfinance 拉 13 项行情（Yahoo）；A股指数失败时 akshare（东方财富）兜底
      容错：单品种失败保留旧值；全部失败退出码 1 不提交
  → 提交 public/data/market-snapshot.json 回仓库（finpulse-bot）
前端 src/lib/marketSnapshot.ts（每 30 分钟重取）
  → 拉取顺序：raw.githubusercontent.com（主，缓存~5min）
             → cdn.jsdelivr.net（备，缓存较久）
             → 站点内置 /data/market-snapshot.json（兜底）
  → useMarketSnapshot() 把快照按 id 叠加到 src/data/markets.ts 静态数组
```
- quotes 的 key 与 `src/data/markets.ts` TICKER_ITEMS 的 id 严格一致：sh-comp/sz-comp/chinext/hsi/hstech/dow/nasdaq/sp500/vix/gold/wti/usdcnh/btc
- hstech 特殊：Yahoo 无恒科指数代码，用 ETF `3033.HK` 代理，quote 带 `note` 字段，UI 需展示该标注
- 前端远程仓库配置：`src/lib/marketSnapshot.ts` 顶部 `REMOTE_SNAPSHOT_REPO = 'dioiiking-hub/finpulse@main'`
- 本地/沙箱版取数脚本：`scripts/make_snapshot.py`（走 iFinD+Yahoo 插件，schema 相同，已被 Actions 版取代，保留备用）

### 3.2 热点新闻流（前端 60s 轮询）
`src/lib/feeds.ts`：`useNewsFeed()` 单例 store（useSyncExternalStore）。
拉取降级链：**RSSHub 公共实例**（rsshub.rssforever.com / rsshub.ktachibana.party 互备，路由：财联社电报 `/cls/telegraph`、华尔街见闻 live/news/hot、新浪滚动 2516/2518、金十 `/jin10`、CNBC `/cnbc/rss`）→ 直连 RSS + 公共 CORS 代理（rss2json / allorigins，8s 超时）→ 内置演示数据流（`src/data/mockNews.ts`，36 条+持续生成）。
导航栏常驻 LIVE/DEMO 徽标 + 60s 倒计时环（点击手动刷新）。

### 3.3 选题推荐引擎（规则驱动，`src/lib/recommend.ts`）
- `classifyText`：7 分类关键词法（宏观政策/美股/A股港股/大宗商品/科技AI/监管地缘/加密货币）
- `computeHeat`：`Score = K(关键词权重) × S(来源权重) × T(时间衰减，半衰期 90 分钟) × C(跨源共振，每多一源+2 上限+8)`，归一化 0-100
- `generateTopics`：标题模板 × 平台适配 × 推荐理由生成
- **平台维度 5 个**：公众号深度 / 短视频快评 / 微博快讯 / 直播话题 / **播客**
  - 播客规则：宏观政策/监管地缘/A股港股=高适配（主适配候选）；美股/科技AI=次适配；heat≥80 出局；heat<70 时效+1
  - 播客标题模板：「深聊丨{k}之后，钱会往哪去？」「从{k}聊起…」「{k}的另一面…」；形式「40分钟对谈 · 对谈提纲 5 条」；最佳发布「周四 20:00」

## 4. 关键实现细节（踩过的坑，务必遵守）

1. **Lenis 与内部滚动容器**：全站 Lenis 平滑滚动会劫持 wheel/touch。任何弹层/抽屉内的滚动区必须加 `data-lenis-prevent`，否则滚不动（选题详情抽屉已修）。
2. **fixed 定位与 backdrop-filter**：带 `backdrop-blur` 的祖先会让 `fixed` 退化为相对该祖先定位。移动端全屏抽屉**必须放在 `<header>` 外**（已修，勿改回去）。
3. **红涨绿跌**：全站中国惯例 `up=#E5484D / down=#35B37E`；VIX、美元指数等反向指标只在卡片内文字注释，不改配色。
4. **动效库只用 framer-motion**（GSAP 已安装但禁用，库隔离规则）；同屏动画 ≤10；reduced-motion 降级。
5. **Layout 契约**：Layout 用 `<Outlet/>` 嵌套路由模式，App.tsx 不可混用 children 模式。
6. **导航栏**：`sticky top-0 z-50`；TickerTape 在首页 `sticky top-16`。
7. **Tailwind 自定义 token**：bg-0/surface-1~3/line/text-1~3/gold/up/down/us-blue 等定义在 `tailwind.config.js`，透明度修饰符用标准刻度（`/95`）或任意值（`/[0.12]`）。

## 5. 构建与部署

```bash
npm run build        # tsc + vite build，产物 dist/（纯静态，可托管任意静态平台）
```
- 当前线上版本由 Kimi 平台的 website_version_manager 管理（版本卡片预览）；dist/ 也可直接部署到 Vercel/Cloudflare Pages/自有服务器
- **不要**把 `node_modules`、`dist` 提交进仓库

## 6. Git 协作注意（重要）

- 项目最初构建于 Kimi 云端沙箱，沙箱间 **git 对象可能不同步**：跨环境传递改动时，除 commit 外务必额外导出补丁：
  `git format-patch master --stdout > /mnt/agents/output/patches/<name>.patch`
- workflow 文件（`.github/workflows/`）的推送需要带 `workflow` 权限的令牌；细粒度 PAT 无权推送，需经 GitHub 网页端 Add file 添加

## 7. 路线图（与用户对齐过的方向）

1. **一手披露层**（下一优先级）：SEC EDGAR 8-K/Form 4 + A股财报预告/公告（akshare `stock_yjyg_em`/`stock_notice_report`、edgartools 库）→ 看板新增「一手情报」分区，标注「一手·未发酵」徽标；取数可挂进现有 GitHub Actions 体系
2. **备稿日历层**：财报日历/宏观数据日历/解禁日历 → 「提前 N 天备稿」推荐
3. **后端化**（团队协作刚需时）：Hono + tRPC + 数据库，多人认领/排期状态同步、自定义域名
4. **选题 → 初稿**：选题一键生成公众号/小红书/播客提纲初稿

## 8. 数据源合规

RSS 内容版权归原出版方；行情数据来自 Yahoo Finance 公开接口与东方财富（akshare），页面已带「数据仅供参考，不构成投资建议」声明。对外公开发布前需复核各源 Robots 与条款。
