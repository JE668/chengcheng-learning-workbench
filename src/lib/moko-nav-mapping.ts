/**
 * 萌可陪伴式导航映射
 * 将孩子端 14 个入口与萌可图鉴角色绑定，形成「角色陪伴感」
 * 数据来源：moko-collection 自动生成，img 路径指向 public/moko/collection/
 */

export interface MokoNavEntry {
  href: string;
  label: string;
  icon: string;
  /** 绑定的萌可角色 */
  moko: {
    name: string;
    img: string;
    emoji: string;
    color: string;
    line: string;
  };
}

/** 孩子端导航入口 → 萌可角色绑定 */
export const MOKO_NAV_ENTRIES: MokoNavEntry[] = [
  {
    href: '/home',
    label: '萌可小屋',
    icon: '🏠',
    moko: {
      name: '爱心萌可',
      img: '/moko/collection/01_皇室萌可/爱心萌可_render.webp',
      emoji: '❤️',
      color: 'from-moko-pink to-moko-rose',
      line: '欢迎回家！今天也要元气满满哦～',
    },
  },
  {
    href: '/daily-practice',
    label: '萌可闯关',
    icon: '🎯',
    moko: {
      name: '勇气萌可',
      img: '/moko/collection/01_皇室萌可/勇气萌可_render.webp',
      emoji: '💪',
      color: 'from-moko-yellow to-moko-gold',
      line: '冲呀！每天一练，越闯关越厉害！',
    },
  },
  {
    href: '/study',
    label: '萌可学堂',
    icon: '📚',
    moko: {
      name: '智慧萌可',
      img: '/moko/collection/01_皇室萌可/优雅萌可_render.webp',
      emoji: '📘',
      color: 'from-moko-purple to-moko-violet',
      line: '知识是魔法的钥匙，跟我一起学吧！',
    },
  },
  {
    href: '/algorithm',
    label: '萌可算法',
    icon: '🧮',
    moko: {
      name: '智慧萌可',
      img: '/moko/collection/02_魔方萌可_第一二季/变身萌可_render.webp',
      emoji: '🧮',
      color: 'from-indigo-400 to-purple-500',
      line: '掌握方法，计算是魔法！',
    },
  },
  {
    href: '/my-tasks',
    label: '我的任务',
    icon: '📝',
    moko: {
      name: '好好萌可',
      img: '/moko/collection/01_皇室萌可/好好萌可_render.webp',
      emoji: '✅',
      color: 'from-moko-green to-moko-mint',
      line: '好好完成任务，好习惯养成记！',
    },
  },
  {
    href: '/textbook',
    label: '萌可课本',
    icon: '📖',
    moko: {
      name: '信信萌可',
      img: '/moko/collection/01_皇室萌可/信信萌可_render.webp',
      emoji: '📖',
      color: 'from-moko-cyan to-moko-blue',
      line: '课本里有大大的宝藏，翻开看看？',
    },
  },
  {
    href: '/games',
    label: '萌可游戏',
    icon: '🎮',
    moko: {
      name: '笑笑萌可',
      img: '/moko/collection/01_皇室萌可/笑笑萌可_render.webp',
      emoji: '😄',
      color: 'from-moko-orange to-moko-yellow',
      line: '玩中学！游戏时间到～',
    },
  },
  {
    href: '/moko-house',
    label: '萌可房间',
    icon: '🧸',
    moko: {
      name: '绵绵萌可',
      img: '/moko/collection/01_皇室萌可/绵绵萌可_render.webp',
      emoji: '🛏️',
      color: 'from-moko-pink to-moko-magic',
      line: '来我房间玩！超软的哦～',
    },
  },
  {
    href: '/co-op',
    label: '萌可帮帮忙',
    icon: '🤝',
    moko: {
      name: '幸福萌可',
      img: '/moko/collection/01_皇室萌可/幸福萌可_render.webp',
      emoji: '🤗',
      color: 'from-moko-gold to-moko-yellow',
      line: '互帮互助，幸福加倍！',
    },
  },
  {
    href: '/badges',
    label: '勋章墙',
    icon: '🥇',
    moko: {
      name: '赞赞萌可',
      img: '/moko/collection/01_皇室萌可/赞赞萌可_render.webp',
      emoji: '🏅',
      color: 'from-moko-gold to-moko-orange',
      line: '每枚勋章都是你的小骄傲！',
    },
  },
  {
    href: '/record',
    label: '成长记录',
    icon: '🏆',
    moko: {
      name: '正正萌可',
      img: '/moko/collection/01_皇室萌可/正正萌可_render.webp',
      emoji: '📊',
      color: 'from-moko-blue to-moko-cyan',
      line: '看看你的成长轨迹，超厉害！',
    },
  },
  {
    href: '/cert',
    label: '荣誉奖状',
    icon: '🎖️',
    moko: {
      name: '闪闪萌可',
      img: '/moko/collection/01_皇室萌可/闪闪萌可_render.webp',
      emoji: '🌟',
      color: 'from-moko-gold to-moko-white',
      line: '闪闪发光的你，值得最好的奖状！',
    },
  },
  {
    href: '/castle',
    label: '萌可城堡',
    icon: '🏰',
    moko: {
      name: '王子萌可',
      img: '/moko/collection/01_皇室萌可/王子萌可_render.webp',
      emoji: '👑',
      color: 'from-moko-purple to-moko-gold',
      line: '欢迎来到我的城堡！你是小主人～',
    },
  },
  {
    href: '/shop',
    label: '萌可商店',
    icon: '🛍️',
    moko: {
      name: '热情萌可',
      img: '/moko/collection/01_皇室萌可/热情萌可_render.webp',
      emoji: '🛒',
      color: 'from-moko-red to-moko-pink',
      line: '来逛逛！用星星币换超棒的东西～',
    },
  },
];

/** 5 个高频入口（移动端底部常驻）的萌可 */
export const MOKO_NAV_PRIMARY = MOKO_NAV_ENTRIES.filter(
  (e) => ['/home', '/study', '/daily-practice', '/games', '/castle'].includes(e.href),
);

/** 剩余入口（更多抽屉） */
export const MOKO_NAV_SECONDARY = MOKO_NAV_ENTRIES.filter(
  (e) => !['/home', '/study', '/daily-practice', '/games', '/castle'].includes(e.href),
);
