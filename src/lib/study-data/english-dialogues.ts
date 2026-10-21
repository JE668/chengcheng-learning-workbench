/**
 * 🎭 萌可英语小剧场（2026-10-21 ⑤号内容升级）
 *
 * 一年级英语口语启蒙：每课一个生活情景（打招呼/感谢/道歉…），
 * 唱唱萌可说英文 → 孩子从三个选项里选出合适的回应 → 答对 praise。
 *
 * - 16 课情景对话，覆盖一年级口语大纲常见场景
 * - 全部台词固定（moko 的英文句 + 三个英文选项），预生成 en 静态集
 * - 模块挂进英语乐园（SubjectStudyPage featured），复用英语学堂壳
 * - 台词词汇量控制在 RAZ AA/一年级范围（hello/thank/sorry/like…）
 */

export interface DialogueScene {
  /** 情景名（中文，显示用） */
  scene: string;
  emoji: string;
  /** 萌可的英文台词（朗读 + 显示） */
  mokoLine: string;
  /** 中文提示（不朗读，帮助家长辅导） */
  hint: string;
  options: [string, string, string];
  answer: number;
}

export const DIALOGUE_SCENES: DialogueScene[] = [
  {
    scene: '早上见面',
    emoji: '👋',
    mokoLine: 'Hello! Good morning!',
    hint: '早上好呀！',
    options: ['Good morning!', 'Good night!', 'Bye bye!'],
    answer: 0,
  },
  {
    scene: '介绍自己',
    emoji: '🙋',
    mokoLine: 'Hi! I am Sing. Who are you?',
    hint: '我是唱唱，你是谁呀？',
    options: ['I am Chengcheng.', 'It is a cat.', 'I like apples.'],
    answer: 0,
  },
  {
    scene: '询问名字',
    emoji: '❓',
    mokoLine: 'What is your name?',
    hint: '你叫什么名字？',
    options: ['My name is Chengcheng.', 'This is a book.', 'I am six.'],
    answer: 0,
  },
  {
    scene: '表达感谢',
    emoji: '🎁',
    mokoLine: 'This star is for you!',
    hint: '这颗星星送给你！',
    options: ['Thank you!', 'Goodbye!', 'I am sorry.'],
    answer: 0,
  },
  {
    scene: '道歉时刻',
    emoji: '😔',
    mokoLine: 'Oh! You dropped your pencil.',
    hint: '呀！你的铅笔掉了。',
    options: ['I am sorry.', 'Good afternoon!', 'How are you?'],
    answer: 0,
  },
  {
    scene: '询问近况',
    emoji: '😊',
    mokoLine: 'How are you today?',
    hint: '你今天怎么样呀？',
    options: ['I am fine, thank you!', 'It is blue.', 'One two three!'],
    answer: 0,
  },
  {
    scene: '喜欢什么',
    emoji: '🍎',
    mokoLine: 'I like apples. What do you like?',
    hint: '我喜欢苹果，你喜欢什么？',
    options: ['I like bananas.', 'My name is Apple.', 'Good night!'],
    answer: 0,
  },
  {
    scene: '询问颜色',
    emoji: '🎨',
    mokoLine: 'Look! What color is it?',
    hint: '看！这是什么颜色？',
    options: ['It is red.', 'I am fine.', 'This is my mom.'],
    answer: 0,
  },
  {
    scene: '这是谁',
    emoji: '👨‍👩‍👧',
    mokoLine: 'Who is this?',
    hint: '这是谁呀？',
    options: ['This is my mom.', 'It is a dog.', 'I am seven.'],
    answer: 0,
  },
  {
    scene: '在做什么',
    emoji: '📖',
    mokoLine: 'What are you doing?',
    hint: '你在做什么呀？',
    options: ['I am reading.', 'It is sunny.', 'Nice to meet you.'],
    answer: 0,
  },
  {
    scene: '天气如何',
    emoji: '☀️',
    mokoLine: 'How is the weather today?',
    hint: '今天天气怎么样？',
    options: ['It is sunny.', 'I like cats.', 'Goodbye!'],
    answer: 0,
  },
  {
    scene: '多少个',
    emoji: '🔢',
    mokoLine: 'How many stars do you have?',
    hint: '你有几颗星星？',
    options: ['I have three stars.', 'It is green.', 'Good morning!'],
    answer: 0,
  },
  {
    scene: '请求帮忙',
    emoji: '🆘',
    mokoLine: 'Can you help me, please?',
    hint: '你能帮帮我吗？',
    options: ['Sure!', 'Good night!', 'It is big.'],
    answer: 0,
  },
  {
    scene: '夸奖朋友',
    emoji: '🌟',
    mokoLine: 'Look at my new kite!',
    hint: '看我的新风筝！',
    options: ['Wow, it is nice!', 'I am sorry.', 'My name is Kite.'],
    answer: 0,
  },
  {
    scene: '道别时刻',
    emoji: '👋',
    mokoLine: 'Goodbye! See you tomorrow!',
    hint: '再见！明天见！',
    options: ['See you!', 'I am hungry.', 'It is Monday.'],
    answer: 0,
  },
  {
    scene: '晚安告别',
    emoji: '🌙',
    mokoLine: 'It is bedtime now.',
    hint: '到睡觉时间啦。',
    options: ['Good night!', 'Good morning!', 'How are you?'],
    answer: 0,
  },
];
