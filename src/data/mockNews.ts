import type { Category, NewsItem, Region } from '@/lib/types'

/**
 * 内置演示数据流（design.md §7 降级约定）。
 * 贴近 2026 年 7 月时点的中美财经热点样本；publishedAt 以页面打开时刻为基准
 * 按 minutesAgo 偏移生成，保证相对时间永远"新鲜"。
 */

interface MockEntry {
  title: string
  summary: string
  source: string
  category: Category
  region: Region
  heat: number
  minutesAgo: number
  keywords: string[]
}

const MOCK_ENTRIES: MockEntry[] = [
  { title: '美联储主席鲍威尔参议院听证暗示：若就业持续降温，最早 9 月启动降息', summary: '鲍威尔在半年度货币政策听证会上表示，通胀回落路径"令人鼓舞"，若劳动力市场进一步走弱，将重新评估政策立场。利率期货显示 9 月降息概率升至 78%。', source: '华尔街见闻', category: '宏观政策', region: '美国', heat: 94, minutesAgo: 3, keywords: ['美联储', '降息', '鲍威尔'] },
  { title: '英伟达 Blackwell Ultra 出货超预期，数据中心单季营收同比 +62%，盘后涨 6%', summary: '英伟达公布最新财季业绩，数据中心业务营收 512 亿美元再超预期，公司同步上调全年指引，黄仁勋称 AI 推理需求"看不到天花板"。', source: 'CNBC', category: '科技AI', region: '美国', heat: 91, minutesAgo: 7, keywords: ['英伟达', 'AI', '财报'] },
  { title: 'COMEX 黄金突破 3,420 美元续创历史新高，全球央行连续第 14 个月净买入', summary: '避险与去美元化共振，金价年内涨幅扩大至 29%。世界黄金协会数据显示，新兴市场央行购金速度未见放缓迹象。', source: 'MarketWatch', category: '大宗商品', region: '全球', heat: 89, minutesAgo: 11, keywords: ['黄金', '央行', '新高'] },
  { title: '沪指放量站上 3,600 点创年内新高，两市成交额重返 1.8 万亿', summary: '大金融与科技双线发力，北向资金净流入超 130 亿元。机构观点认为盈利修复与增量资金入市形成正反馈。', source: '东方财富', category: 'A股港股', region: '中国', heat: 87, minutesAgo: 16, keywords: ['A股', '沪指', '成交'] },
  { title: '证监会发布程序化交易监管细则：高频交易差异化收费 10 月起实施', summary: '细则明确高频交易认定标准与报告义务，对异常交易行为实施差异化收费。市场认为新规利于中长期资金生态。', source: '财联社', category: '监管地缘', region: '中国', heat: 84, minutesAgo: 21, keywords: ['证监会', '量化', '监管'] },
  { title: '美国 6 月核心 CPI 同比 2.6% 低于预期，「降息交易」全线升温', summary: '住房与核心服务通胀同步降温，10 年期美债收益率快速下行 8BP，标普 500 期货拉升。', source: 'Reuters', category: '宏观政策', region: '美国', heat: 82, minutesAgo: 27, keywords: ['CPI', '通胀', '美债'] },
  { title: '恒生科技指数大涨 3.2%，南向资金单日净买入 180 亿港元创三月新高', summary: '互联网龙头集体走强，机构称港股估值修复行情正从"高股息"向"成长"扩散。', source: '华尔街见闻', category: 'A股港股', region: '中国', heat: 80, minutesAgo: 33, keywords: ['港股', '恒生科技', '南向资金'] },
  { title: '比特币升破 128,000 美元，现货 ETF 周净流入创历史第二高', summary: '机构配置需求持续释放，贝莱德 IBIT 单周吸金 26 亿美元。链上数据显示长期持有者占比升至新高。', source: 'Yahoo Finance', category: '加密货币', region: '美国', heat: 78, minutesAgo: 39, keywords: ['比特币', 'ETF', '净流入'] },
  { title: '国产大模型推理成本再降 40%，阿里云宣布主力模型全线降价', summary: '通义千问主力模型输入价格降至每百万 tokens 0.8 元，云厂商新一轮"以价换量"开启，AI 应用端加速渗透。', source: '财联社', category: '科技AI', region: '中国', heat: 77, minutesAgo: 45, keywords: ['大模型', '降价', '云计算'] },
  { title: 'WTI 原油涨逾 3% 突破 82 美元，红海航运扰动推升供应溢价', summary: '多家航运公司再度暂停红海航线，叠加 OPEC+ 延长自愿减产，油价触及三个月高位。', source: 'Reuters', category: '大宗商品', region: '全球', heat: 75, minutesAgo: 52, keywords: ['原油', 'OPEC', '红海'] },
  { title: '央行开展 8,000 亿元 MLF 操作并下调操作利率 10BP，本月 LPR 或跟进', summary: '中期借贷便利利率下调释放明确宽松信号，机构预计 1 年期与 5 年期 LPR 将同步下调。', source: '新浪财经', category: '宏观政策', region: '中国', heat: 73, minutesAgo: 58, keywords: ['央行', 'MLF', 'LPR'] },
  { title: '纳斯达克 100 指数站上 25,000 点，七巨头市值合计突破 22 万亿美元', summary: 'AI 盈利兑现推动科技权重再创新高，市场广度同步改善，等权重标普 500 亦刷新纪录。', source: 'CNBC', category: '美股', region: '美国', heat: 72, minutesAgo: 64, keywords: ['纳斯达克', '科技股', '新高'] },
  { title: '美商务部更新半导体出口管制清单，新增 12 家中国实体', summary: '新增实体涉及先进封装与 EDA 领域。外交部回应称将采取必要措施维护中企合法权益。', source: 'Bloomberg', category: '监管地缘', region: '美国', heat: 70, minutesAgo: 71, keywords: ['半导体', '出口管制', '实体清单'] },
  { title: '微软、谷歌、Meta 二季度资本开支合计超 750 亿美元，AI 军备竞赛再加码', summary: '三大云厂商一致上调全年资本开支指引，数据中心电力与散热产业链持续受益。', source: 'CNBC', category: '科技AI', region: '美国', heat: 69, minutesAgo: 78, keywords: ['资本开支', 'AI', '数据中心'] },
  { title: '科创 50 指数五连阳，半导体设备板块掀涨停潮', summary: '国产替代主线持续发酵，机构调研显示设备厂商在手订单排产已至明年下半年。', source: '东方财富', category: 'A股港股', region: '中国', heat: 67, minutesAgo: 84, keywords: ['科创板', '半导体', '国产替代'] },
  { title: '日本央行暗示 9 月可能再次加息，日元快速升值至 138', summary: '植田和男称若薪资—通胀循环延续将果断行动，套息交易平仓推升日元，亚太市场波动加大。', source: '金十数据', category: '宏观政策', region: '全球', heat: 66, minutesAgo: 90, keywords: ['日本央行', '加息', '日元'] },
  { title: '特斯拉 Robotaxi 运营城市扩至 12 座，股价盘中创历史新高', summary: '奥斯汀与凤凰城运营数据超预期，马斯克宣布 FSD 授权谈判进入实质阶段。', source: 'Yahoo Finance', category: '美股', region: '美国', heat: 65, minutesAgo: 96, keywords: ['特斯拉', 'Robotaxi', '自动驾驶'] },
  { title: '沪铜主力合约突破 85,000 元/吨，电网投资加速拉动需求', summary: '国家电网全年投资计划上调至 6,500 亿元，叠加海外矿端扰动，铜价创历史次高。', source: '新浪财经', category: '大宗商品', region: '中国', heat: 63, minutesAgo: 102, keywords: ['铜', '电网', '有色'] },
  { title: '欧盟通过对美 950 亿欧元商品反制关税清单，8 月 1 日生效', summary: '清单覆盖飞机、汽车与农产品，欧美贸易谈判进入最后窗口期，市场关注汽车板块冲击。', source: 'Reuters', category: '监管地缘', region: '全球', heat: 62, minutesAgo: 110, keywords: ['欧盟', '关税', '反制'] },
  { title: '以太坊质押率突破 32%，Layer2 日均交易量创历史新高', summary: '现货 ETF 质押功能获批预期升温，链上活跃地址数连续五周回升。', source: 'CoinDesk', category: '加密货币', region: '全球', heat: 60, minutesAgo: 118, keywords: ['以太坊', '质押', 'Layer2'] },
  { title: '国常会部署进一步扩大内需：加快「两重」项目建设、稳定大宗消费', summary: '会议指出要用好超长期特别国债资金，推动设备更新与消费品以旧换新政策落地见效。', source: '澎湃新闻', category: '宏观政策', region: '中国', heat: 59, minutesAgo: 126, keywords: ['内需', '国常会', '消费'] },
  { title: '苹果 Vision Pro 3 供应链拉货启动，A 股果链公司集体走强', summary: '新一代头显备货指引上调至 800 万台，立讯精密、蓝思科技等核心供应商获机构上调评级。', source: 'MarketWatch', category: '美股', region: '美国', heat: 58, minutesAgo: 134, keywords: ['苹果', 'Vision Pro', '供应链'] },
  { title: '白酒板块午后异动拉升，贵州茅台获北向资金增持 12 亿元', summary: '中秋备货动销数据好于预期，板块估值处于十年低位，高股息属性重获关注。', source: '东方财富', category: 'A股港股', region: '中国', heat: 57, minutesAgo: 142, keywords: ['白酒', '茅台', '北向资金'] },
  { title: 'OpenAI 发布新一代多模态旗舰模型，API 价格下调 50%', summary: '新模型在长视频理解与代码生成基准上大幅领先，企业级客户迁移意愿强烈。', source: '华尔街见闻', category: '科技AI', region: '全球', heat: 55, minutesAgo: 150, keywords: ['OpenAI', '多模态', 'API'] },
  { title: '智利最大铜矿罢工进入第二周，LME 铜库存降至十年低位', summary: '劳资谈判再度破裂，机构上调三季度铜价目标至 11,200 美元/吨。', source: 'Bloomberg', category: '大宗商品', region: '全球', heat: 54, minutesAgo: 158, keywords: ['铜', '罢工', '库存'] },
  { title: '网信办就生成式 AI 内容标识新规公开征求意见', summary: '新规要求 AI 生成内容添加显式与隐式双重标识，平台需在 9 月底前完成技术改造。', source: '财联社', category: '监管地缘', region: '中国', heat: 53, minutesAgo: 166, keywords: ['AI', '监管', '内容标识'] },
  { title: '美国 30 年期抵押贷款利率降至 5.9%，成屋销售环比回升', summary: '利率敏感型资产回暖，地产链与家装零售板块领涨标普细分行业。', source: 'CNBC', category: '宏观政策', region: '美国', heat: 52, minutesAgo: 174, keywords: ['房贷利率', '地产', '美国'] },
  { title: '伯克希尔现金储备升至 3,800 亿美元，巴菲特连续三个季度净卖出', summary: '市场解读分歧加大：防御姿态还是等待「大象级」猎物？股东大会问答成焦点。', source: 'Yahoo Finance', category: '美股', region: '美国', heat: 51, minutesAgo: 183, keywords: ['巴菲特', '伯克希尔', '现金'] },
  { title: '比亚迪 6 月交付 42 万辆创新高，新能源车国内渗透率突破 58%', summary: '第五代 DM 技术车型放量，海外工厂产能爬坡，机构上调全年销量预期至 460 万辆。', source: '新浪财经', category: 'A股港股', region: '中国', heat: 50, minutesAgo: 191, keywords: ['比亚迪', '新能源车', '销量'] },
  { title: '美参议院通过稳定币监管法案修正案，Circle 股价大涨 14%', summary: '法案明确储备资产审计与赎回规则，合规稳定币发行商迎来牌照红利期。', source: 'CoinDesk', category: '加密货币', region: '美国', heat: 49, minutesAgo: 200, keywords: ['稳定币', '监管', 'Circle'] },
  { title: '华为昇腾新一代 AI 芯片量产爬坡，国产算力订单排至 2027 年', summary: '三大运营商与头部互联网厂商采购份额持续提升，先进封装产能成为关键瓶颈。', source: '华尔街见闻', category: '科技AI', region: '中国', heat: 48, minutesAgo: 209, keywords: ['华为', '昇腾', '算力'] },
  { title: '国内成品油调价窗口开启，机构预计每吨上调 180 元', summary: '国际油价走强传导至国内，物流与出行成本小幅抬升，关注通胀预期边际变化。', source: '金十数据', category: '大宗商品', region: '中国', heat: 47, minutesAgo: 218, keywords: ['油价', '成品油', '调价'] },
  { title: '欧元区 7 月 PMI 重返扩张区间，欧央行官员称降息周期近尾声', summary: '制造业新订单指数 14 个月来首次站上荣枯线，欧元兑美元升破 1.18。', source: 'Reuters', category: '宏观政策', region: '全球', heat: 46, minutesAgo: 227, keywords: ['欧元区', 'PMI', '欧央行'] },
  { title: '星巴克中国业务出售进入二轮竞标，估值或达 90 亿美元', summary: '多家 PE 与产业资本入局，消费并购市场同步升温，交易预计四季度落地。', source: 'Bloomberg', category: '美股', region: '美国', heat: 45, minutesAgo: 236, keywords: ['星巴克', '并购', '消费'] },
  { title: '美贸易代表办公室启动对华 301 关税复审听证', summary: '涉及约 3,700 亿美元商品，零售商与制造业协会提交意见书分歧明显，结果或于四季度落地。', source: 'Reuters', category: '监管地缘', region: '美国', heat: 44, minutesAgo: 245, keywords: ['关税', '301', '中美'] },
  { title: '创新药板块持续走强，多款国产 ADC 药物获 FDA 突破性疗法认定', summary: 'License-out 交易金额屡创新高，港股 18A 公司估值修复明显，板块成交额环比翻倍。', source: '财联社', category: 'A股港股', region: '中国', heat: 43, minutesAgo: 254, keywords: ['创新药', 'ADC', 'License-out'] },
]

/** 演示数据流（打开页面时刻为基准生成时间戳），按时间倒序 */
export const MOCK_NEWS: NewsItem[] = MOCK_ENTRIES.map((e, i) => ({
  id: `mock-${String(i + 1).padStart(3, '0')}`,
  title: e.title,
  summary: e.summary,
  source: e.source,
  category: e.category,
  region: e.region,
  heat: e.heat,
  publishedAt: Date.now() - e.minutesAgo * 60_000,
  url: '#',
  keywords: e.keywords,
})).sort((a, b) => b.publishedAt - a.publishedAt)

/**
 * 演示流"持续生成"素材池：每次轮询取一条，
 * 赋予全新时间戳与轻微热度抖动，模拟新热点持续涌入。
 */
export const STREAM_POOL: MockEntry[] = [
  { title: '10 年期美债收益率跌破 3.9%，美元指数创阶段新低', summary: '降息预期发酵，全球风险资产共振走强，资金回流新兴市场迹象明显。', source: 'Reuters', category: '宏观政策', region: '美国', heat: 74, minutesAgo: 0, keywords: ['美债', '美元', '降息'] },
  { title: '离岸人民币升破 7.02 关口，创近 14 个月新高', summary: '美元走弱叠加结汇盘涌出，人民币资产吸引力回升，外资加仓中国债券。', source: '华尔街见闻', category: '宏观政策', region: '中国', heat: 71, minutesAgo: 0, keywords: ['人民币', '汇率', '外资'] },
  { title: '费城半导体指数涨 2.8%，台积电 2nm 产能预订至 2028', summary: 'AI 芯片需求外溢至先进制程全链条，设备与材料厂商指引普遍上调。', source: 'CNBC', category: '美股', region: '美国', heat: 68, minutesAgo: 0, keywords: ['半导体', '台积电', 'AI'] },
  { title: '现货黄金日内再涨 1.2%，白银跟涨突破 44 美元', summary: '金银比快速收敛，贵金属板块领涨两市，黄金股批量涨停。', source: '金十数据', category: '大宗商品', region: '全球', heat: 66, minutesAgo: 0, keywords: ['黄金', '白银', '贵金属'] },
  { title: '沪深两市融资余额单日增加 210 亿元，杠杆资金加速入场', summary: '两融余额创近三年新高，券商两融利率竞争白热化，关注市场情绪过热信号。', source: '东方财富', category: 'A股港股', region: '中国', heat: 64, minutesAgo: 0, keywords: ['两融', '杠杆', 'A股'] },
  { title: '苹果官宣秋季发布会定档 9 月 9 日，iPhone 18 系列将全系搭载自研 AI 芯片', summary: '供应链消息称 Pro 系列备货同比提升 15%，端侧 AI 功能成最大卖点。', source: 'MarketWatch', category: '科技AI', region: '美国', heat: 62, minutesAgo: 0, keywords: ['苹果', '发布会', 'AI芯片'] },
  { title: '以太坊 ETF 单日净流入 4.2 亿美元创纪录，质押收益产品获批在即', summary: 'SEC 态度转向积极，机构预测年底 ETH 配置规模将追平比特币 ETF 三成。', source: 'CoinDesk', category: '加密货币', region: '美国', heat: 61, minutesAgo: 0, keywords: ['以太坊', 'ETF', '质押'] },
  { title: '发改委：第三批「两重」建设项目清单下达，总投资超 1.2 万亿', summary: '重点投向城市更新、水利与新型基础设施，相关产业链订单能见度提升。', source: '澎湃新闻', category: '宏观政策', region: '中国', heat: 58, minutesAgo: 0, keywords: ['发改委', '两重', '基建'] },
  { title: '纳斯达克中国金龙指数涨 3.5%，中概股财报季开门红', summary: '电商与出行龙头业绩超预期，外资行集体上调中概互联网目标价。', source: 'Yahoo Finance', category: '美股', region: '美国', heat: 56, minutesAgo: 0, keywords: ['中概股', '财报', '金龙指数'] },
  { title: '上期所调整黄金、白银期货合约交易保证金比例', summary: '交易所提示贵金属波动加大，要求会员单位做好风险防范，投机交易降温预期升温。', source: '财联社', category: '监管地缘', region: '中国', heat: 52, minutesAgo: 0, keywords: ['上期所', '保证金', '风控'] },
]

let streamCursor = 0

/** 从素材池取下一条"新热点"（时间戳为当下，热度 ±4 抖动） */
export function nextStreamItem(): NewsItem {
  const e = STREAM_POOL[streamCursor % STREAM_POOL.length]
  streamCursor += 1
  const jitter = Math.round((Math.random() - 0.5) * 8)
  return {
    id: `stream-${Date.now()}-${streamCursor}`,
    title: e.title,
    summary: e.summary,
    source: e.source,
    category: e.category,
    region: e.region,
    heat: Math.max(30, Math.min(99, e.heat + jitter)),
    publishedAt: Date.now(),
    url: '#',
    keywords: e.keywords,
  }
}
