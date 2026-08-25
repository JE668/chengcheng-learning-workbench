/* ============================================================
   英语 · 单词、句型、自然拼读、单元
   ============================================================ */

/* -------------------- 英语单词主题 -------------------- */
export interface LetterItem {
  letter: string;
  word: string;
  emoji: string;
}

export const LETTERS: LetterItem[] = [
  { letter: 'A', word: 'Apple', emoji: '🍎' }, { letter: 'B', word: 'Ball', emoji: '⚽' },
  { letter: 'C', word: 'Cat', emoji: '🐱' }, { letter: 'D', word: 'Dog', emoji: '🐶' },
  { letter: 'E', word: 'Elephant', emoji: '🐘' }, { letter: 'F', word: 'Fish', emoji: '🐟' },
  { letter: 'G', word: 'Giraffe', emoji: '🦒' }, { letter: 'H', word: 'Hat', emoji: '🎩' },
  { letter: 'I', word: 'Ice cream', emoji: '🍦' }, { letter: 'J', word: 'Juice', emoji: '🧃' },
  { letter: 'K', word: 'Kite', emoji: '🪁' }, { letter: 'L', word: 'Lion', emoji: '🦁' },
  { letter: 'M', word: 'Monkey', emoji: '🐒' }, { letter: 'N', word: 'Nose', emoji: '👃' },
  { letter: 'O', word: 'Orange', emoji: '🍊' }, { letter: 'P', word: 'Pig', emoji: '🐷' },
  { letter: 'Q', word: 'Queen', emoji: '👑' }, { letter: 'R', word: 'Rabbit', emoji: '🐰' },
  { letter: 'S', word: 'Sun', emoji: '☀️' }, { letter: 'T', word: 'Tree', emoji: '🌳' },
  { letter: 'U', word: 'Umbrella', emoji: '☂️' }, { letter: 'V', word: 'Violin', emoji: '🎻' },
  { letter: 'W', word: 'Water', emoji: '💧' }, { letter: 'X', word: 'Xylophone', emoji: '🎵' },
  { letter: 'Y', word: 'Yellow', emoji: '💛' }, { letter: 'Z', word: 'Zebra', emoji: '🦓' },
];

export interface WordItem {
  word: string;
  sound: string;
  emoji: string;
  cn: string;
  topic: string;
}

export const EN_WORD_TOPICS: { topic: string; emoji: string; words: WordItem[] }[] = [
  {
    topic: '问候', emoji: '👋',
    words: [
      { word: 'hello', sound: 'h-e-l-l-o', emoji: '👋', cn: '你好', topic: '问候' },
      { word: 'hi', sound: 'h-i', emoji: '😊', cn: '嗨', topic: '问候' },
      { word: 'goodbye', sound: 'g-o-o-d-b-y-e', emoji: '👋', cn: '再见', topic: '问候' },
      { word: 'thanks', sound: 't-h-a-n-k-s', emoji: '🙏', cn: '谢谢', topic: '问候' },
    ],
  },
  {
    topic: '学校', emoji: '🏫',
    words: [
      { word: 'school', sound: 's-c-h-o-o-l', emoji: '🏫', cn: '学校', topic: '学校' },
      { word: 'book', sound: 'b-o-o-k', emoji: '📕', cn: '书', topic: '学校' },
      { word: 'pen', sound: 'p-e-n', emoji: '🖊️', cn: '笔', topic: '学校' },
      { word: 'pencil', sound: 'p-e-n-c-i-l', emoji: '✏️', cn: '铅笔', topic: '学校' },
      { word: 'teacher', sound: 't-e-a-c-h-e-r', emoji: '👩‍🏫', cn: '老师', topic: '学校' },
      { word: 'student', sound: 's-t-u-d-e-n-t', emoji: '🧒', cn: '学生', topic: '学校' },
      { word: 'classroom', sound: 'c-l-a-s-s-r-o-o-m', emoji: '🏠', cn: '教室', topic: '学校' },
      { word: 'desk', sound: 'd-e-s-k', emoji: '🪑', cn: '课桌', topic: '学校' },
    ],
  },
  {
    topic: '身体', emoji: '😊',
    words: [
      { word: 'head', sound: 'h-e-a-d', emoji: '👧', cn: '头', topic: '身体' },
      { word: 'eye', sound: 'e-y-e', emoji: '👁️', cn: '眼睛', topic: '身体' },
      { word: 'ear', sound: 'e-a-r', emoji: '👂', cn: '耳朵', topic: '身体' },
      { word: 'nose', sound: 'n-o-s-e', emoji: '👃', cn: '鼻子', topic: '身体' },
      { word: 'mouth', sound: 'm-o-u-t-h', emoji: '👄', cn: '嘴巴', topic: '身体' },
      { word: 'hand', sound: 'h-a-n-d', emoji: '✋', cn: '手', topic: '身体' },
      { word: 'foot', sound: 'f-o-o-t', emoji: '🦶', cn: '脚', topic: '身体' },
      { word: 'hair', sound: 'h-a-i-r', emoji: '💇', cn: '头发', topic: '身体' },
    ],
  },
  {
    topic: '动物', emoji: '🐾',
    words: [
      { word: 'cat', sound: 'c-a-t', emoji: '🐱', cn: '猫', topic: '动物' },
      { word: 'dog', sound: 'd-o-g', emoji: '🐶', cn: '狗', topic: '动物' },
      { word: 'bird', sound: 'b-i-r-d', emoji: '🐦', cn: '鸟', topic: '动物' },
      { word: 'fish', sound: 'f-i-s-h', emoji: '🐟', cn: '鱼', topic: '动物' },
      { word: 'rabbit', sound: 'r-a-b-b-i-t', emoji: '🐰', cn: '兔子', topic: '动物' },
      { word: 'monkey', sound: 'm-o-n-k-e-y', emoji: '🐒', cn: '猴子', topic: '动物' },
      { word: 'panda', sound: 'p-a-n-d-a', emoji: '🐼', cn: '熊猫', topic: '动物' },
      { word: 'tiger', sound: 't-i-g-e-r', emoji: '🐯', cn: '老虎', topic: '动物' },
    ],
  },
  {
    topic: '数字', emoji: '🔢',
    words: [
      { word: 'one', sound: 'o-n-e', emoji: '1️⃣', cn: '一', topic: '数字' },
      { word: 'two', sound: 't-w-o', emoji: '2️⃣', cn: '二', topic: '数字' },
      { word: 'three', sound: 't-h-r-e-e', emoji: '3️⃣', cn: '三', topic: '数字' },
      { word: 'four', sound: 'f-o-u-r', emoji: '4️⃣', cn: '四', topic: '数字' },
      { word: 'five', sound: 'f-i-v-e', emoji: '5️⃣', cn: '五', topic: '数字' },
      { word: 'six', sound: 's-i-x', emoji: '6️⃣', cn: '六', topic: '数字' },
      { word: 'seven', sound: 's-e-v-e-n', emoji: '7️⃣', cn: '七', topic: '数字' },
      { word: 'eight', sound: 'e-i-g-h-t', emoji: '8️⃣', cn: '八', topic: '数字' },
      { word: 'nine', sound: 'n-i-n-e', emoji: '9️⃣', cn: '九', topic: '数字' },
      { word: 'ten', sound: 't-e-n', emoji: '🔟', cn: '十', topic: '数字' },
    ],
  },
  {
    topic: '颜色', emoji: '🌈',
    words: [
      { word: 'red', sound: 'r-e-d', emoji: '🔴', cn: '红色', topic: '颜色' },
      { word: 'blue', sound: 'b-l-u-e', emoji: '🔵', cn: '蓝色', topic: '颜色' },
      { word: 'yellow', sound: 'y-e-l-l-o-w', emoji: '🟡', cn: '黄色', topic: '颜色' },
      { word: 'green', sound: 'g-r-e-e-n', emoji: '🟢', cn: '绿色', topic: '颜色' },
      { word: 'orange', sound: 'o-r-a-n-g-e', emoji: '🟠', cn: '橙色', topic: '颜色' },
      { word: 'purple', sound: 'p-u-r-p-l-e', emoji: '🟣', cn: '紫色', topic: '颜色' },
      { word: 'black', sound: 'b-l-a-c-k', emoji: '⚫', cn: '黑色', topic: '颜色' },
      { word: 'white', sound: 'w-h-i-t-e', emoji: '⚪', cn: '白色', topic: '颜色' },
    ],
  },
  {
    topic: '食物', emoji: '🍎',
    words: [
      { word: 'apple', sound: 'a-p-p-l-e', emoji: '🍎', cn: '苹果', topic: '食物' },
      { word: 'banana', sound: 'b-a-n-a-n-a', emoji: '🍌', cn: '香蕉', topic: '食物' },
      { word: 'orange', sound: 'o-r-a-n-g-e', emoji: '🍊', cn: '橙子', topic: '食物' },
      { word: 'cake', sound: 'c-a-k-e', emoji: '🍰', cn: '蛋糕', topic: '食物' },
      { word: 'bread', sound: 'b-r-e-a-d', emoji: '🍞', cn: '面包', topic: '食物' },
      { word: 'milk', sound: 'm-i-l-k', emoji: '🥛', cn: '牛奶', topic: '食物' },
      { word: 'water', sound: 'w-a-t-e-r', emoji: '💧', cn: '水', topic: '食物' },
      { word: 'egg', sound: 'e-g-g', emoji: '🥚', cn: '鸡蛋', topic: '食物' },
    ],
  },
  {
    topic: '家人', emoji: '👨‍👩‍👧',
    words: [
      { word: 'father', sound: 'f-a-t-h-e-r', emoji: '👨', cn: '爸爸', topic: '家人' },
      { word: 'mother', sound: 'm-o-t-h-e-r', emoji: '👩', cn: '妈妈', topic: '家人' },
      { word: 'brother', sound: 'b-r-o-t-h-e-r', emoji: '👦', cn: '哥哥', topic: '家人' },
      { word: 'sister', sound: 's-i-s-t-e-r', emoji: '👧', cn: '妹妹', topic: '家人' },
      { word: 'baby', sound: 'b-a-b-y', emoji: '👶', cn: '宝宝', topic: '家人' },
      { word: 'grandpa', sound: 'g-r-a-n-d-p-a', emoji: '👴', cn: '爷爷', topic: '家人' },
      { word: 'grandma', sound: 'g-r-a-n-d-m-a', emoji: '👵', cn: '奶奶', topic: '家人' },
    ],
  },
  {
    topic: '衣物', emoji: '👕',
    words: [
      { word: 'shirt', sound: 's-h-i-r-t', emoji: '👕', cn: '衬衫', topic: '衣物' },
      { word: 'pants', sound: 'p-a-n-t-s', emoji: '👖', cn: '裤子', topic: '衣物' },
      { word: 'shoes', sound: 's-h-o-e-s', emoji: '👟', cn: '鞋子', topic: '衣物' },
      { word: 'socks', sound: 's-o-c-k-s', emoji: '🧦', cn: '袜子', topic: '衣物' },
      { word: 'hat', sound: 'h-a-t', emoji: '🎩', cn: '帽子', topic: '衣物' },
      { word: 'coat', sound: 'c-o-a-t', emoji: '🧥', cn: '外套', topic: '衣物' },
    ],
  },
  {
    topic: '自然', emoji: '🌤️',
    words: [
      { word: 'sun', sound: 's-u-n', emoji: '☀️', cn: '太阳', topic: '自然' },
      { word: 'moon', sound: 'm-o-o-n', emoji: '🌙', cn: '月亮', topic: '自然' },
      { word: 'star', sound: 's-t-a-r', emoji: '⭐', cn: '星星', topic: '自然' },
      { word: 'sky', sound: 's-k-y', emoji: '☁️', cn: '天空', topic: '自然' },
      { word: 'cloud', sound: 'c-l-o-u-d', emoji: '☁️', cn: '云', topic: '自然' },
      { word: 'rain', sound: 'r-a-i-n', emoji: '🌧️', cn: '雨', topic: '自然' },
      { word: 'wind', sound: 'w-i-n-d', emoji: '💨', cn: '风', topic: '自然' },
      { word: 'tree', sound: 't-r-e-e', emoji: '🌳', cn: '树', topic: '自然' },
    ],
  },
  {
    topic: '天气', emoji: '🌤️',
    words: [
      { word: 'sunny', sound: 's-u-n-n-y', emoji: '☀️', cn: '晴天', topic: '天气' },
      { word: 'rainy', sound: 'r-a-i-n-y', emoji: '🌧️', cn: '雨天', topic: '天气' },
      { word: 'cloudy', sound: 'c-l-o-u-d-y', emoji: '☁️', cn: '多云', topic: '天气' },
      { word: 'windy', sound: 'w-i-n-d-y', emoji: '💨', cn: '刮风', topic: '天气' },
      { word: 'snowy', sound: 's-n-o-w-y', emoji: '❄️', cn: '下雪', topic: '天气' },
    ],
  },
  {
    topic: '交通工具', emoji: '🚌',
    words: [
      { word: 'bus', sound: 'b-u-s', emoji: '🚌', cn: '公交车', topic: '交通工具' },
      { word: 'car', sound: 'c-a-r', emoji: '🚗', cn: '汽车', topic: '交通工具' },
      { word: 'train', sound: 't-r-a-i-n', emoji: '🚂', cn: '火车', topic: '交通工具' },
      { word: 'plane', sound: 'p-l-a-n-e', emoji: '✈️', cn: '飞机', topic: '交通工具' },
      { word: 'bike', sound: 'b-i-k-e', emoji: '🚲', cn: '自行车', topic: '交通工具' },
    ],
  },
  {
    topic: '玩具', emoji: '🧸',
    words: [
      { word: 'ball', sound: 'b-a-l-l', emoji: '⚽', cn: '球', topic: '玩具' },
      { word: 'doll', sound: 'd-o-l-l', emoji: '🧸', cn: '娃娃', topic: '玩具' },
      { word: 'kite', sound: 'k-i-t-e', emoji: '🪁', cn: '风筝', topic: '玩具' },
      { word: 'toy', sound: 't-o-y', emoji: '🎁', cn: '玩具', topic: '玩具' },
    ],
  },
  {
    topic: '场所', emoji: '🏠',
    words: [
      { word: 'home', sound: 'h-o-m-e', emoji: '🏠', cn: '家', topic: '场所' },
      { word: 'park', sound: 'p-a-r-k', emoji: '🌳', cn: '公园', topic: '场所' },
      { word: 'zoo', sound: 'z-o-o', emoji: '🦁', cn: '动物园', topic: '场所' },
      { word: 'store', sound: 's-t-o-r-e', emoji: '🏪', cn: '商店', topic: '场所' },
      { word: 'hospital', sound: 'h-o-s-p-i-t-a-l', emoji: '🏥', cn: '医院', topic: '场所' },
    ],
  },
  {
    topic: '时间', emoji: '🕒',
    words: [
      { word: 'morning', sound: 'm-o-r-n-i-n-g', emoji: '🌅', cn: '早上', topic: '时间' },
      { word: 'afternoon', sound: 'a-f-t-e-r-n-o-o-n', emoji: '🌞', cn: '下午', topic: '时间' },
      { word: 'evening', sound: 'e-v-e-n-i-n-g', emoji: '🌆', cn: '晚上', topic: '时间' },
      { word: 'night', sound: 'n-i-g-h-t', emoji: '🌙', cn: '夜晚', topic: '时间' },
      { word: 'today', sound: 't-o-d-a-y', emoji: '📅', cn: '今天', topic: '时间' },
      { word: 'tomorrow', sound: 't-o-m-o-r-r-o-w', emoji: '📅', cn: '明天', topic: '时间' },
    ],
  },
  {
    topic: '动词', emoji: '🏃',
    words: [
      { word: 'run', sound: 'r-u-n', emoji: '🏃', cn: '跑', topic: '动词' },
      { word: 'jump', sound: 'j-u-m-p', emoji: '🦘', cn: '跳', topic: '动词' },
      { word: 'walk', sound: 'w-a-l-k', emoji: '🚶', cn: '走', topic: '动词' },
      { word: 'swim', sound: 's-w-i-m', emoji: '🏊', cn: '游泳', topic: '动词' },
      { word: 'fly', sound: 'f-l-y', emoji: '🕊️', cn: '飞', topic: '动词' },
      { word: 'dance', sound: 'd-a-n-c-e', emoji: '💃', cn: '跳舞', topic: '动词' },
      { word: 'sing', sound: 's-i-n-g', emoji: '🎤', cn: '唱歌', topic: '动词' },
      { word: 'read', sound: 'r-e-a-d', emoji: '📖', cn: '读', topic: '动词' },
      { word: 'write', sound: 'w-r-i-t-e', emoji: '✍️', cn: '写', topic: '动词' },
      { word: 'draw', sound: 'd-r-a-w', emoji: '🎨', cn: '画画', topic: '动词' },
      { word: 'eat', sound: 'e-a-t', emoji: '🍽️', cn: '吃', topic: '动词' },
      { word: 'drink', sound: 'd-r-i-n-k', emoji: '🥤', cn: '喝', topic: '动词' },
      { word: 'sleep', sound: 's-l-e-e-p', emoji: '😴', cn: '睡觉', topic: '动词' },
      { word: 'play', sound: 'p-l-a-y', emoji: '🎮', cn: '玩', topic: '动词' },
      { word: 'cook', sound: 'c-o-o-k', emoji: '🍳', cn: '做饭', topic: '动词' },
    ],
  },
  {
    topic: '形容词', emoji: '🎨',
    words: [
      { word: 'big', sound: 'b-i-g', emoji: '🐘', cn: '大的', topic: '形容词' },
      { word: 'small', sound: 's-m-a-l-l', emoji: '🐜', cn: '小的', topic: '形容词' },
      { word: 'hot', sound: 'h-o-t', emoji: '🔥', cn: '热的', topic: '形容词' },
      { word: 'cold', sound: 'c-o-l-d', emoji: '❄️', cn: '冷的', topic: '形容词' },
      { word: 'happy', sound: 'h-a-p-p-y', emoji: '😊', cn: '开心的', topic: '形容词' },
      { word: 'sad', sound: 's-a-d', emoji: '😢', cn: '伤心的', topic: '形容词' },
      { word: 'fast', sound: 'f-a-s-t', emoji: '🚀', cn: '快的', topic: '形容词' },
      { word: 'slow', sound: 's-l-o-w', emoji: '🐢', cn: '慢的', topic: '形容词' },
      { word: 'tall', sound: 't-a-l-l', emoji: '🦒', cn: '高的', topic: '形容词' },
      { word: 'short', sound: 's-h-o-r-t', emoji: '🐭', cn: '矮的', topic: '形容词' },
      { word: 'good', sound: 'g-o-o-d', emoji: '👍', cn: '好的', topic: '形容词' },
      { word: 'bad', sound: 'b-a-d', emoji: '👎', cn: '坏的', topic: '形容词' },
      { word: 'new', sound: 'n-e-w', emoji: '✨', cn: '新的', topic: '形容词' },
      { word: 'old', sound: 'o-l-d', emoji: '🏺', cn: '旧的', topic: '形容词' },
      { word: 'clean', sound: 'c-l-e-a-n', emoji: '🧼', cn: '干净的', topic: '形容词' },
      { word: 'dirty', sound: 'd-i-r-t-y', emoji: '💩', cn: '脏的', topic: '形容词' },
    ],
  },
  {
    topic: '蔬菜水果', emoji: '🥕',
    words: [
      { word: 'carrot', sound: 'c-a-r-r-o-t', emoji: '🥕', cn: '胡萝卜', topic: '蔬菜水果' },
      { word: 'tomato', sound: 't-o-m-a-t-o', emoji: '🍅', cn: '西红柿', topic: '蔬菜水果' },
      { word: 'potato', sound: 'p-o-t-a-t-o', emoji: '🥔', cn: '土豆', topic: '蔬菜水果' },
      { word: 'grape', sound: 'g-r-a-p-e', emoji: '🍇', cn: '葡萄', topic: '蔬菜水果' },
      { word: 'strawberry', sound: 's-t-r-a-w-b-e-r-r-y', emoji: '🍓', cn: '草莓', topic: '蔬菜水果' },
      { word: 'watermelon', sound: 'w-a-t-e-r-m-e-l-o-n', emoji: '🍉', cn: '西瓜', topic: '蔬菜水果' },
      { word: 'peach', sound: 'p-e-a-c-h', emoji: '🍑', cn: '桃子', topic: '蔬菜水果' },
      { word: 'pear', sound: 'p-e-a-r', emoji: '🍐', cn: '梨', topic: '蔬菜水果' },
      { word: 'mango', sound: 'm-a-n-g-o', emoji: '🥭', cn: '芒果', topic: '蔬菜水果' },
      { word: 'pineapple', sound: 'p-i-n-e-a-p-p-l-e', emoji: '🍍', cn: '菠萝', topic: '蔬菜水果' },
    ],
  },
  {
    topic: '文具', emoji: '✏️',
    words: [
      { word: 'eraser', sound: 'e-r-a-s-e-r', emoji: '🧽', cn: '橡皮擦', topic: '文具' },
      { word: 'ruler', sound: 'r-u-l-e-r', emoji: '📏', cn: '尺子', topic: '文具' },
      { word: 'crayon', sound: 'c-r-a-y-o-n', emoji: '🖍️', cn: '蜡笔', topic: '文具' },
      { word: 'scissors', sound: 's-c-i-s-s-o-r-s', emoji: '✂️', cn: '剪刀', topic: '文具' },
      { word: 'glue', sound: 'g-l-u-e', emoji: '🧴', cn: '胶水', topic: '文具' },
    ],
  },
  {
    topic: '职业', emoji: '👩‍⚕️',
    words: [
      { word: 'doctor', sound: 'd-o-c-t-o-r', emoji: '👨‍⚕️', cn: '医生', topic: '职业' },
      { word: 'nurse', sound: 'n-u-r-s-e', emoji: '👩‍⚕️', cn: '护士', topic: '职业' },
      { word: 'driver', sound: 'd-r-i-v-e-r', emoji: '🚗', cn: '司机', topic: '职业' },
      { word: 'farmer', sound: 'f-a-r-m-e-r', emoji: '👨‍🌾', cn: '农夫', topic: '职业' },
      { word: 'singer', sound: 's-i-n-g-e-r', emoji: '🎤', cn: '歌手', topic: '职业' },
      { word: 'dancer', sound: 'd-a-n-c-e-r', emoji: '💃', cn: '舞者', topic: '职业' },
    ],
  },
];

export const ALL_EN_WORDS: WordItem[] = EN_WORD_TOPICS.flatMap((t) => t.words);

/* -------------------- 英语句型 -------------------- */
export interface EnSentenceItem {
  sentence: string;
  options: string[];
  answer: string;
  speak: string;
  emoji: string;
}

export const EN_SENTENCES: EnSentenceItem[] = [
  { sentence: 'I ___ a cat.', options: ['have', 'has', 'am'], answer: 'have', speak: 'I have a cat.', emoji: '🐱' },
  { sentence: 'This ___ a dog.', options: ['is', 'are', 'am'], answer: 'is', speak: 'This is a dog.', emoji: '🐶' },
  { sentence: 'I can ___ .', options: ['jump', 'jumps', 'jumping'], answer: 'jump', speak: 'I can jump.', emoji: '🦘' },
  { sentence: 'What ___ your name?', options: ['is', 'are', 'am'], answer: 'is', speak: 'What is your name?', emoji: '📛' },
  { sentence: 'I ___ happy.', options: ['am', 'is', 'are'], answer: 'am', speak: 'I am happy.', emoji: '😊' },
  { sentence: 'He ___ a ball.', options: ['has', 'have', 'is'], answer: 'has', speak: 'He has a ball.', emoji: '⚽' },
  { sentence: 'We ___ friends.', options: ['are', 'is', 'am'], answer: 'are', speak: 'We are friends.', emoji: '🤝' },
  { sentence: 'My name ___ Tom.', options: ['is', 'am', 'are'], answer: 'is', speak: 'My name is Tom.', emoji: '🏷️' },
  { sentence: 'I like ___ .', options: ['apples', 'apple', 'an apple'], answer: 'apples', speak: 'I like apples.', emoji: '🍎' },
  { sentence: 'How ___ you?', options: ['are', 'is', 'am'], answer: 'are', speak: 'How are you?', emoji: '🤗' },
  { sentence: 'She is a ___ .', options: ['teacher', 'teach', 'teaching'], answer: 'teacher', speak: 'She is a teacher.', emoji: '👩‍🏫' },
  { sentence: 'It is ___ .', options: ['hot', 'hots', 'hoting'], answer: 'hot', speak: 'It is hot.', emoji: '🔥' },
  { sentence: 'The cat is ___ .', options: ['small', 'smalls', 'smalling'], answer: 'small', speak: 'The cat is small.', emoji: '🐱' },
  { sentence: 'I want to ___ .', options: ['swim', 'swims', 'swimming'], answer: 'swim', speak: 'I want to swim.', emoji: '🏊' },
  { sentence: 'He can ___ fast.', options: ['run', 'runs', 'running'], answer: 'run', speak: 'He can run fast.', emoji: '🏃' },
  { sentence: 'They ___ playing.', options: ['are', 'is', 'am'], answer: 'are', speak: 'They are playing.', emoji: '🎮' },
  { sentence: 'The elephant is ___ .', options: ['big', 'bigs', 'bigging'], answer: 'big', speak: 'The elephant is big.', emoji: '🐘' },
  { sentence: 'I ___ to school.', options: ['go', 'goes', 'going'], answer: 'go', speak: 'I go to school.', emoji: '🏫' },
  { sentence: 'The turtle is ___ .', options: ['slow', 'slows', 'slowly'], answer: 'slow', speak: 'The turtle is slow.', emoji: '🐢' },
  { sentence: 'Do you like ___ ?', options: ['milk', 'milks', 'milking'], answer: 'milk', speak: 'Do you like milk?', emoji: '🥛' },
];

/* -------------------- 单元映射 -------------------- */
export interface EnUnit {
  unit: string;
  title: string;
  emoji: string;
  topics: string[];
  extra?: boolean;
}

export const EN_UNITS: EnUnit[] = [
  { unit: 'Unit 1', title: 'Hello! 你好', emoji: '👋', topics: ['问候'] },
  { unit: 'Unit 2', title: 'My school 我的学校', emoji: '🏫', topics: ['学校'] },
  { unit: 'Unit 3', title: 'My face 我的脸', emoji: '😊', topics: ['身体'] },
  { unit: 'Unit 4', title: 'Animals 动物', emoji: '🐾', topics: ['动物'] },
  { unit: 'Unit 5', title: 'Numbers 数字', emoji: '🔢', topics: ['数字'] },
  { unit: 'Unit 6', title: 'Colours 颜色', emoji: '🌈', topics: ['颜色'] },
  { unit: 'Unit 7', title: 'Fruit & food 水果食物', emoji: '🍎', topics: ['食物'] },
  { unit: 'Extra 1', title: 'My family 我的家人', emoji: '👨‍👩‍👧', topics: ['家人'], extra: true },
  { unit: 'Extra 2', title: 'Clothes 我的衣服', emoji: '👕', topics: ['衣物'], extra: true },
  { unit: 'Extra 3', title: 'Actions 动起来', emoji: '🏃', topics: ['动作', '动词'], extra: true },
  { unit: 'Extra 4', title: 'Nature & weather 自然天气', emoji: '🌤️', topics: ['自然', '天气'], extra: true },
  { unit: 'Extra 5', title: 'Transport 交通工具', emoji: '🚌', topics: ['交通工具'], extra: true },
  { unit: 'Extra 6', title: 'Toys & places 玩具去处', emoji: '🧸', topics: ['玩具', '场所'], extra: true },
  { unit: 'Extra 7', title: 'Time 时间', emoji: '🕒', topics: ['时间'], extra: true },
  { unit: 'Extra 8', title: 'Describe it! 形容词', emoji: '🎨', topics: ['形容词'], extra: true },
  { unit: 'Extra 9', title: 'Yummy! 蔬菜水果', emoji: '🥕', topics: ['蔬菜水果'], extra: true },
  { unit: 'Extra 10', title: 'Stationery 文具', emoji: '✏️', topics: ['文具'], extra: true },
  { unit: 'Extra 11', title: 'Jobs 职业', emoji: '👩‍⚕️', topics: ['职业'], extra: true },
];

export function enUnitsOfModule(moduleKey: string): EnUnit[] {
  return EN_UNITS.filter((u) => u.topics.includes(moduleKey));
}

/* -------------------- 英文儿歌（唱唱萌可+甜心萌可） -------------------- */
export interface EnSong {
  title: string;
  emoji: string;
  lyrics: string[];
  cn: string;
  keywords: { en: string; cn: string }[];
}

export const EN_SONGS: EnSong[] = [
  {
    title: 'Twinkle Twinkle Little Star',
    emoji: '⭐',
    lyrics: ['Twinkle, twinkle, little star,', 'How I wonder what you are!', 'Up above the world so high,', 'Like a diamond in the sky.'],
    cn: '一闪一闪亮晶晶，满天都是小星星，挂在天上放光明，好像许多小眼睛。',
    keywords: [{ en: 'star', cn: '星星' }, { en: 'sky', cn: '天空' }, { en: 'diamond', cn: '钻石' }, { en: 'high', cn: '高高' }],
  },
  {
    title: 'Head, Shoulders, Knees and Toes',
    emoji: '🙆',
    lyrics: ['Head, shoulders, knees and toes,', 'Knees and toes, knees and toes.', 'Head, shoulders, knees and toes,', 'Eyes, ears, mouth and nose.'],
    cn: '头、肩膀、膝盖和脚趾，膝盖和脚趾。眼睛、耳朵、嘴巴和鼻子。',
    keywords: [{ en: 'head', cn: '头' }, { en: 'shoulders', cn: '肩膀' }, { en: 'knees', cn: '膝盖' }, { en: 'toes', cn: '脚趾' }, { en: 'eyes', cn: '眼睛' }, { en: 'nose', cn: '鼻子' }],
  },
  {
    title: 'Old MacDonald Had a Farm',
    emoji: '🚜',
    lyrics: ['Old MacDonald had a farm, E-I-E-I-O.', 'And on his farm he had a cow, E-I-E-I-O.', 'With a moo-moo here and a moo-moo there,', 'Here a moo, there a moo, everywhere a moo-moo.'],
    cn: '老麦克唐纳有个农场，咿呀咿呀哟。农场里有一头牛，哞哞叫。',
    keywords: [{ en: 'farm', cn: '农场' }, { en: 'cow', cn: '奶牛' }, { en: 'moo', cn: '哞' }],
  },
  {
    title: 'If You\'re Happy and You Know It',
    emoji: '😄',
    lyrics: ['If you\'re happy and you know it, clap your hands!', 'If you\'re happy and you know it, clap your hands!', 'If you\'re happy and you know it, and you really want to show it,', 'If you\'re happy and you know it, clap your hands!'],
    cn: '如果你开心，就拍拍手！想要告诉大家你开心，就拍拍手！',
    keywords: [{ en: 'happy', cn: '开心' }, { en: 'clap', cn: '拍手' }, { en: 'hands', cn: '手' }],
  },
  {
    title: 'The Wheels on the Bus',
    emoji: '🚌',
    lyrics: ['The wheels on the bus go round and round,', 'Round and round, round and round.', 'The wheels on the bus go round and round,', 'All through the town.'],
    cn: '巴士的轮子转呀转，转呀转，转呀转，穿过整个小镇。',
    keywords: [{ en: 'wheels', cn: '轮子' }, { en: 'bus', cn: '公交车' }, { en: 'round', cn: '圆圈' }, { en: 'town', cn: '小镇' }],
  },
  {
    title: 'The ABC Song',
    emoji: '🔤',
    lyrics: ['A B C D E F G,', 'H I J K L M N O P,', 'Q R S, T U V,', 'W X Y and Z.', 'Now I know my ABCs,', 'Next time won\'t you sing with me?'],
    cn: 'A 到 Z，26 个字母我都会，下次跟我一起唱吧！',
    keywords: [{ en: 'A B C', cn: '字母 A B C' }, { en: 'sing', cn: '唱歌' }],
  },
];