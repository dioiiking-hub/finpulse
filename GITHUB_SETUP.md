# GitHub Actions 行情快照 · 部署指南

让行情快照脱离 Kimi 会话，由 GitHub 每小时自动刷新。全程免费、无需任何 API key。

## 原理

```
GitHub Actions（每小时）
  └─ scripts/make_snapshot_gh.py
       ├─ yfinance 拉取 13 项行情（Yahoo Finance 公开数据）
       └─ A股指数失败时 akshare（东方财富）兜底
  └─ 提交 public/data/market-snapshot.json 回仓库
看板前端（marketSnapshot.ts）
  └─ 每 30 分钟按序拉取：raw.githubusercontent → jsDelivr → 站点内置快照
```

取数失败的品种自动保留上一份快照的值；全部失败时 workflow 退出且不提交，旧快照不被覆盖。

## 部署步骤（约 10 分钟）

1. **创建仓库**：在 GitHub 新建一个仓库（如 `finpulse`，Public。Private 仓库的 raw 文件前端无法匿名读取，必须 Public）。
2. **推送代码**：把本项目完整推送到该仓库的 `main` 分支：
   ```bash
   git remote add github https://github.com/<你的用户名>/finpulse.git
   git push github main
   ```
3. **配置仓库名**：编辑 `src/lib/marketSnapshot.ts` 顶部的
   `REMOTE_SNAPSHOT_REPO = 'YOUR_GITHUB_USER/finpulse@main'`
   改为 `'<你的用户名>/finpulse@main'`，重新构建部署网站（或把仓库名告诉我，由我重建版本）。
4. **启用 Actions**：仓库页 → Actions 标签 → 允许 workflows。找到 `market-snapshot`，用 **Run workflow** 手动触发一次验证（约 1-2 分钟），确认仓库里 `public/data/market-snapshot.json` 出现 `finpulse-bot` 的提交。
5. 之后每小时整点自动运行（GitHub 定时任务可能延迟几分钟，正常）。

## 前端拉取顺序与缓存

| 层级 | 地址 | 缓存 |
|---|---|---|
| 1 | `raw.githubusercontent.com/<你>/finpulse/main/...` | 约 5 分钟，主用 |
| 2 | `cdn.jsdelivr.net/gh/<你>/finpulse@main/...` | 较久，备用 |
| 3 | 站点内置 `/data/market-snapshot.json` | 构建时快照，兜底 |

任一环节失败自动降级，看板永不空白。

## 注意事项

- GitHub 免费账号的 Actions 额度对公开仓库**无限制**；本 workflow 每次运行约 1-2 分钟。
- 定时 workflow 在仓库 60 天无活动后会被 GitHub 暂停——但本 workflow 自己每小时产生提交，仓库永远活跃，不会触发。
- 若未来需要 30 分钟粒度：把 `snapshot.yml` 的 cron 改为 `*/30 * * * *` 即可（GitHub 支持，但排程延迟会更明显）。
- A 股指数在 Yahoo 的代码：`000001.SS` / `399001.SZ` / `399006.SZ`；若 Yahoo 侧限流，akshare 自动兜底（数据源标注会变为「AKShare/东方财富」）。
