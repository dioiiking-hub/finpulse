import { motion } from 'framer-motion'

const EASE = [0.22, 0.61, 0.36, 1] as [number, number, number, number]

interface RoleCard {
  mono: string
  color: string
  role: string
  desc: string
  feature: string
}

/** 四角色流水线（about.md S5）：monogram 圆 = 姓名首字 + 彩色描边（无人物照片） */
const ROLES: RoleCard[] = [
  {
    mono: '值',
    color: '#D8A94E',
    role: '值班编辑',
    desc: '09:00 晨会：刷热度榜 TOP10，圈定今日 3 个主攻方向',
    feature: '首页热度榜',
  },
  {
    mono: '主',
    color: '#9B8CF2',
    role: '主笔',
    desc: '从选题推荐认领任务，按建议大纲产出深度稿',
    feature: '选题卡 · 加入选题库',
  },
  {
    mono: '剪',
    color: '#6E9FFF',
    role: '剪辑',
    desc: '把 S 级选题改编为 60s 短视频口播与图卡',
    feature: '平台适配标签',
  },
  {
    mono: '运',
    color: '#43B8A9',
    role: '分发运营',
    desc: '按最佳发布时间多平台排期，回收数据复盘',
    feature: '选题库状态流转',
  },
]

/** 使用节奏建议（3 格） */
const RHYTHM = [
  { time: '09:00', text: '晨会定调 —— 热度榜 + 日历预警' },
  { time: '盘中', text: '盯突发 —— 热度 ≥80「爆发」即推送' },
  { time: '21:00', text: '晚间复盘 —— 联动观察 + 次日排期' },
]

function RoleCardItem({ card, index }: { card: RoleCard; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ delay: index * 0.12, duration: 0.5, ease: EASE }}
      className="relative w-full lg:flex-1"
    >
      {/* lg：横向虚线连接 */}
      {index < ROLES.length - 1 && (
        <motion.span
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + index * 0.12, duration: 1.4, ease: EASE }}
          className="absolute left-full top-11 hidden w-4 origin-left border-t border-dashed border-line lg:block"
          aria-hidden
        />
      )}
      <div className="h-full rounded-xl border border-line bg-surface-1 p-6 transition-colors duration-150 hover:border-gold/40">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 + index * 0.12, type: 'spring', stiffness: 260, damping: 26 }}
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 text-[15px] font-medium"
          style={{ borderColor: card.color, color: card.color, backgroundColor: `${card.color}14` }}
        >
          {card.mono}
        </motion.span>
        <h3 className="mt-4 text-[15px] font-medium text-text-1">{card.role}</h3>
        <p className="mt-2 text-[13px] leading-6 text-text-2">{card.desc}</p>
        <p className="mt-4 border-t border-line pt-3 font-mono text-[11px] leading-4 text-text-3">
          对应功能 → {card.feature}
        </p>
      </div>
    </motion.div>
  )
}

/** S5 · 团队协作工作流：横向时间线 + 使用节奏建议 */
export default function TeamWorkflow() {
  return (
    <div>
      <div className="flex flex-col items-center lg:flex-row lg:items-stretch lg:gap-4">
        {ROLES.map((r, i) => (
          <div key={r.role} className="flex w-full flex-col items-center lg:contents">
            <RoleCardItem card={r} index={i} />
            {/* mobile：纵向虚线连接 */}
            {i < ROLES.length - 1 && (
              <motion.span
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.12, duration: 0.8, ease: EASE }}
                className="my-0 block h-8 origin-top border-l border-dashed border-line lg:hidden"
                aria-hidden
              />
            )}
          </div>
        ))}
      </div>

      {/* 使用节奏建议 */}
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {RHYTHM.map((r, i) => (
          <motion.div
            key={r.time}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: EASE }}
            className="rounded-lg border border-line bg-surface-1 p-4"
          >
            <p className="tnum font-mono text-sm font-medium text-gold">{r.time}</p>
            <p className="mt-1.5 text-[13px] leading-6 text-text-2">{r.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
