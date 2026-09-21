/**
 * 本文件由 study-data.ts 拆分而来（数据内容未改动，仅移动位置）。
 * 对外统一入口仍是 @/lib/study-data，见 src/lib/study-data.ts 的聚合 re-export。
 */

/* -------------------- 语文 · 基本笔画（写字基础） -------------------- */
export interface StrokeItem {
  stroke: string; // 笔画符号
  name: string; // 笔画名称
  example: string; // 例字
  dir: string; // 书写方向小提示
}
export const STROKES: StrokeItem[] = [
  { stroke: '一', name: '横', example: '一 二 三', dir: '从左到右' },
  { stroke: '丨', name: '竖', example: '十 中 上', dir: '从上到下' },
  { stroke: '丿', name: '撇', example: '八 人 天', dir: '从右上到左下' },
  { stroke: '㇏', name: '捺', example: '八 入 尺', dir: '从左上到右下' },
  { stroke: '丶', name: '点', example: '头 火 下', dir: '从轻到重' },
  { stroke: '㇀', name: '提', example: '虫 把 江', dir: '从下到右上' },
  { stroke: '𠃍', name: '横折', example: '口 五 日', dir: '横后折下' },
  { stroke: '㇇', name: '横撇', example: '又 水 子', dir: '横后向左撇' },
  { stroke: '乛', name: '横钩', example: '你 子 买', dir: '横后向左钩' },
  { stroke: '𠃊', name: '竖折', example: '山 牙 出', dir: '竖后向右折' },
  { stroke: '㇙', name: '竖提', example: '长 比 衣', dir: '竖后向右上提' },
  { stroke: '㇄', name: '竖弯', example: '四 西 酒', dir: '竖后向右弯' },
  { stroke: '亅', name: '竖钩', example: '小 可 水', dir: '竖后向左上钩' },
  { stroke: '㇁', name: '弯钩', example: '了 手 狗', dir: '弯弯地钩起' },
  { stroke: '㇂', name: '斜钩', example: '我 成 战', dir: '向右下斜钩' },
  { stroke: '𠃋', name: '撇折', example: '去 东 公', dir: '撇后向右折' },
  { stroke: '㇃', name: '卧钩', example: '心 思 怎', dir: '躺平后向上钩' },
  { stroke: '𡿨', name: '撇点', example: '女 妈 好', dir: '撇后向右点' },
  { stroke: '𠃌', name: '横折钩', example: '月 用 力', dir: '横折后向左钩' },
  { stroke: '乚', name: '竖弯钩', example: '儿 巴 毛', dir: '竖弯后向上钩' },
  { stroke: '㇈', name: '横折弯钩', example: '九 几 吃', dir: '横折弯后向上钩' },
  { stroke: '㇉', name: '竖折折钩', example: '马 鸟 妈', dir: '竖折折后向左钩' },
];

/* -------------------- 语文 · 常用偏旁部首 -------------------- */
export interface RadicalItem {
  radical: string;
  name: string;
  examples: string[];
}
export const RADICALS: RadicalItem[] = [
  { radical: '亻', name: '单人旁', examples: ['你', '们', '作', '他'] },
  { radical: '扌', name: '提手旁', examples: ['把', '挂', '打', '拍'] },
  { radical: '艹', name: '草字头', examples: ['莲', '芽', '花', '苗'] },
  { radical: '口', name: '口字旁', examples: ['叶', '吗', '吃', '听'] },
  { radical: '囗', name: '国字框', examples: ['国', '回', '园'] },
  { radical: '氵', name: '三点水', examples: ['江', '河', '洗', '洞'] },
  { radical: '讠', name: '言字旁', examples: ['说', '课', '语', '话'] },
  { radical: '虫', name: '虫字旁', examples: ['蛙', '蚂', '蚁', '蜘'] },
  { radical: '木', name: '木字旁', examples: ['树', '桃', '林', '桥'] },
  { radical: '日', name: '日字旁', examples: ['明', '晚', '时', '晴'] },
  { radical: '月', name: '月字旁', examples: ['朋', '肚', '肥', '脚'] },
  { radical: '女', name: '女字旁', examples: ['好', '妹', '妈', '奶'] },
  { radical: '纟', name: '绞丝旁', examples: ['红', '绿', '给', '纸'] },
  { radical: '宀', name: '宝盖', examples: ['它', '家', '字', '安'] },
  { radical: '辶', name: '走之', examples: ['远', '近', '送', '过'] },
  { radical: '犭', name: '反犬旁', examples: ['猫', '狗', '猪', '猴'] },
  { radical: '门', name: '门字框', examples: ['闪', '问', '间', '闲'] },
  { radical: '禾', name: '禾木旁', examples: ['和', '秋', '种', '香'] },
  { radical: '鸟', name: '鸟字边', examples: ['鸭', '鸡', '鹅', '鸦'] },
  { radical: '灬', name: '四点底', examples: ['点', '黑', '热', '煮'] },
  { radical: '目', name: '目字旁', examples: ['眼', '睛', '睡', '盯'] },
  { radical: '彳', name: '双人旁', examples: ['得', '很', '行', '往'] },
  { radical: '攵', name: '反文旁', examples: ['放', '收', '数', '教'] },
  { radical: '刂', name: '立刀', examples: ['到', '别', '刻', '剧'] },
];

/* -------------------- 语文 · 笔顺规则口诀（书写提示） -------------------- */
export interface StrokeRule {
  name: string; // 规则名称
  rhyme: string; // 顺口溜
  examples: string[]; // 例字
  emoji: string;
}
export const STROKE_RULES: StrokeRule[] = [
  { name: '先横后竖', rhyme: '横要平，竖要直，先写横来后写竖。', examples: ['十', '干', '王'], emoji: '一' },
  { name: '先撇后捺', rhyme: '撇向左，捺向右，先撇后捺字才正。', examples: ['人', '八', '天'], emoji: '丿' },
  { name: '从上到下', rhyme: '一笔一笔往下写，从上到下不乱跑。', examples: ['三', '云', '草'], emoji: '⬇️' },
  { name: '从左到右', rhyme: '左边写完写右边，从左到右排排队。', examples: ['川', '奶', '林'], emoji: '➡️' },
  { name: '先外后内', rhyme: '外面先写框，再写里面小娃娃。', examples: ['月', '用', '风'], emoji: '🔲' },
  { name: '先中间后两边', rhyme: '中间先站稳，左边右边再跟上。', examples: ['水', '小', '办'], emoji: '🎯' },
  { name: '先外后内再封口', rhyme: '先写大门框，里头写完再关门。', examples: ['日', '田', '口'], emoji: '🚪' },
];

/* -------------------- 语文 · 田字格书写提示（一课一贴练习册） -------------------- */
export interface WritingTip {
  char: string;
  rule: string;
  tip: string;
  emoji: string;
}
export const WRITING_TIPS: WritingTip[] = [
  { char: '十', rule: '先横后竖', tip: '第一笔横，第二笔竖，竖要穿过横的中间', emoji: '➕' },
  { char: '田', rule: '先外后里再封口', tip: '先写外面的大口框，再写里面的十字，最后封口', emoji: '⊞' },
  { char: '八', rule: '先撇后捺', tip: '先写左边的撇，再写右边的捺，撇捺对称', emoji: '八' },
  { char: '禾', rule: '先撇后捺', tip: '先写上面的撇，再写横，再写竖，最后写撇和捺', emoji: '🌱' },
  { char: '王', rule: '先横后竖', tip: '三横一竖，横要长短匀称，竖要居中', emoji: '👑' },
  { char: '六', rule: '先点后横', tip: '先写上面的点，再写横，最后写撇和点', emoji: '6️⃣' },
  { char: '七', rule: '先横后竖', tip: '先写横，再写竖弯钩，竖弯钩要写圆润', emoji: '7️⃣' },
  { char: '九', rule: '先撇后横折弯钩', tip: '先写撇，再写横折弯钩，钩要向上', emoji: '9️⃣' },
];

/* -------------------- 语文 · 笔顺（跟课本生字表同源） -------------------- */
export interface StrokeOrderItem {
  char: string;
  py: string;
  mean: string;
}
// 说明：笔顺字表不再单独维护，改为在 GRADE1_CHAR_UNITS 派生层里生成
// （见文件末尾的 STROKE_ORDER_CHARS / strokeOrderByChapter），全册 276 字都能看笔顺。
