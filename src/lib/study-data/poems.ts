/**
 * 本文件由 study-data.ts 拆分而来（数据内容未改动，仅移动位置）。
 * 对外统一入口仍是 @/lib/study-data，见 src/lib/study-data.ts 的聚合 re-export。
 */

/* -------------------- 语文 · 古诗词（小学必背） -------------------- */
export interface PoemItem {
  title: string;
  author: string;
  lines: string[];
}

export const POEMS: PoemItem[] = [
  { title: '咏鹅', author: '骆宾王', lines: ['鹅，鹅，鹅，', '曲项向天歌。', '白毛浮绿水，', '红掌拨清波。'] },
  { title: '悯农（其二）', author: '李绅', lines: ['锄禾日当午，', '汗滴禾下土。', '谁知盘中餐，', '粒粒皆辛苦。'] },
  { title: '静夜思', author: '李白', lines: ['床前明月光，', '疑是地上霜。', '举头望明月，', '低头思故乡。'] },
  { title: '江南', author: '汉乐府', lines: ['江南可采莲，', '莲叶何田田。', '鱼戏莲叶间。', '鱼戏莲叶东，', '鱼戏莲叶西，', '鱼戏莲叶南，', '鱼戏莲叶北。'] },
  { title: '春晓', author: '孟浩然', lines: ['春眠不觉晓，', '处处闻啼鸟。', '夜来风雨声，', '花落知多少。'] },
  { title: '村居', author: '高鼎', lines: ['草长莺飞二月天，', '拂堤杨柳醉春烟。', '儿童散学归来早，', '忙趁东风放纸鸢。'] },
  { title: '咏柳', author: '贺知章', lines: ['碧玉妆成一树高，', '万条垂下绿丝绦。', '不知细叶谁裁出，', '二月春风似剪刀。'] },
  { title: '登鹳雀楼', author: '王之涣', lines: ['白日依山尽，', '黄河入海流。', '欲穷千里目，', '更上一层楼。'] },
  { title: '敕勒歌', author: '北朝民歌', lines: ['敕勒川，阴山下。', '天似穹庐，笼盖四野。', '天苍苍，野茫茫，', '风吹草低见牛羊。'] },
  { title: '池上', author: '白居易', lines: ['小娃撑小艇，', '偷采白莲回。', '不解藏踪迹，', '浮萍一道开。'] },
  { title: '小池', author: '杨万里', lines: ['泉眼无声惜细流，', '树阴照水爱晴柔。', '小荷才露尖尖角，', '早有蜻蜓立上头。'] },
  { title: '画', author: '王维', lines: ['远看山有色，', '近听水无声。', '春去花还在，', '人来鸟不惊。'] },
  // —— 一年级上册 必背补充 ——
  { title: '赠汪伦', author: '李白', lines: ['李白乘舟将欲行，', '忽闻岸上踏歌声。', '桃花潭水深千尺，', '不及汪伦送我情。'] },
  { title: '寻隐者不遇', author: '贾岛', lines: ['松下问童子，', '言师采药去。', '只在此山中，', '云深不知处。'] },
  { title: '风', author: '李峤', lines: ['解落三秋叶，', '能开二月花。', '过江千尺浪，', '入竹万竿斜。'] },
  { title: '画鸡', author: '唐寅', lines: ['头上红冠不用裁，', '满身雪白走将来。', '平生不敢轻言语，', '一叫千门万户开。'] },
];

/* -------------------- 语文 · 古诗趣味化（诗中有画） -------------------- */
export interface PoemPictureQ {
  poem: string;
  hint: string; // 诗句提示
  options: string[]; // emoji 选项
  answer: string; // 正确的 emoji
}

// 覆盖 POEMS 里全部 16 首，热门篇目再各配一题，共 28 题。
export const POEM_PICTURE_Q: PoemPictureQ[] = [
  { poem: '咏鹅', hint: '鹅，鹅，鹅，曲项向天歌。', options: ['🦢', '🐱', '🐟'], answer: '🦢' },
  { poem: '咏鹅', hint: '白毛浮绿水，红掌拨清波。', options: ['🌊', '⛰️', '🏜️'], answer: '🌊' },
  { poem: '悯农（其二）', hint: '锄禾日当午，汗滴禾下土。', options: ['🌾', '🍔', '🚗'], answer: '🌾' },
  { poem: '悯农（其二）', hint: '谁知盘中餐，粒粒皆辛苦。', options: ['🍚', '🍦', '🍟'], answer: '🍚' },
  { poem: '静夜思', hint: '举头望明月，低头思故乡。', options: ['🌙', '☀️', '⭐'], answer: '🌙' },
  { poem: '静夜思', hint: '床前明月光，疑是地上霜。', options: ['❄️', '🔥', '🌈'], answer: '❄️' },
  { poem: '江南', hint: '江南可采莲，莲叶何田田。', options: ['🪷', '🌲', '🍎'], answer: '🪷' },
  { poem: '江南', hint: '鱼戏莲叶间。', options: ['🐟', '🐘', '🐔'], answer: '🐟' },
  { poem: '春晓', hint: '春眠不觉晓，处处闻啼鸟。', options: ['🐦', '🐟', '🌸'], answer: '🐦' },
  { poem: '春晓', hint: '夜来风雨声，花落知多少。', options: ['🌧️', '☀️', '🌈'], answer: '🌧️' },
  { poem: '村居', hint: '儿童散学归来早，忙趁东风放纸鸢。', options: ['🪁', '📚', '🚲'], answer: '🪁' },
  { poem: '村居', hint: '草长莺飞二月天，拂堤杨柳醉春烟。', options: ['🌱', '🍂', '❄️'], answer: '🌱' },
  { poem: '咏柳', hint: '碧玉妆成一树高，万条垂下绿丝绦。', options: ['🌿', '🍎', '🌲'], answer: '🌿' },
  { poem: '咏柳', hint: '不知细叶谁裁出，二月春风似剪刀。', options: ['✂️', '🔨', '🥄'], answer: '✂️' },
  { poem: '登鹳雀楼', hint: '白日依山尽，黄河入海流。', options: ['🌄', '🌧️', '🏙️'], answer: '🌄' },
  { poem: '登鹳雀楼', hint: '欲穷千里目，更上一层楼。', options: ['🏯', '🚗', '⛵'], answer: '🏯' },
  { poem: '敕勒歌', hint: '风吹草低见牛羊。', options: ['🐑', '🐟', '🦅'], answer: '🐑' },
  { poem: '敕勒歌', hint: '天似穹庐，笼盖四野。', options: ['⛺', '🏢', '🚢'], answer: '⛺' },
  { poem: '池上', hint: '小娃撑小艇，偷采白莲回。', options: ['🛶', '🚗', '🛝'], answer: '🛶' },
  { poem: '小池', hint: '小荷才露尖尖角，早有蜻蜓立上头。', options: ['🦗', '🐱', '🌞'], answer: '🦗' },
  { poem: '小池', hint: '泉眼无声惜细流，树阴照水爱晴柔。', options: ['💧', '🔥', '🏔️'], answer: '💧' },
  { poem: '画', hint: '远看山有色，近听水无声。', options: ['🖼️', '📻', '🎈'], answer: '🖼️' },
  { poem: '赠汪伦', hint: '桃花潭水深千尺，不及汪伦送我情。', options: ['🌊', '🔥', '🏜️'], answer: '🌊' },
  { poem: '寻隐者不遇', hint: '松下问童子，言师采药去。', options: ['🌲', '🏖️', '🌵'], answer: '🌲' },
  { poem: '风', hint: '解落三秋叶，能开二月花。', options: ['🍃', '🔥', '🌊'], answer: '🍃' },
  { poem: '风', hint: '过江千尺浪，入竹万竿斜。', options: ['🎋', '🌵', '🍄'], answer: '🎋' },
  { poem: '画鸡', hint: '头上红冠不用裁，满身雪白走将来。', options: ['🐔', '🐶', '🐱'], answer: '🐔' },
  { poem: '画鸡', hint: '平生不敢轻言语，一叫千门万户开。', options: ['🌅', '🌃', '🕯️'], answer: '🌅' },
];
