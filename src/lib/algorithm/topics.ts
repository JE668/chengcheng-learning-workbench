/**
 * 萌可算法 - 十大计算技巧主题
 * 每个主题包含：知识点、原理、萌可角色、口诀、典型示例
 *
 * 例题采用「分幕思维可视化」：scenes 里每一幕对应一种
 * 课本标准的呈现图式（十格阵 / 弧线分解图 / 拆数树 / 数轴 / 抱团…），
 * 由 ExampleVisuals.tsx 逐幕渲染，不再用竖式套所有方法。
 */

/** 萌可算法主题定义（不含具体题目，题目由 generators.ts 生成） */
export const ALGORITHM_TOPICS: Omit<import('./types').AlgorithmTopic, 'questions'>[] = [
  /* ==================== 1. 凑十法 ==================== */
  {
    id: 'making-ten',
    name: '凑十法',
    description: '把一个加数拆开，凑成 10，再算 10 加几。这是加法计算的基础魔法！',
    mantra: '一九一九好朋友，二八二八手拉手，三七三七真亲密，四六四六一起走，五五凑成一双手',
    mantraEmoji: '✋',
    moko: {
      name: '拆数萌可',
      img: '/moko/collection/02_魔方萌可_第一二季/变身萌可_render.webp',
      emoji: '✂️',
      color: 'from-pink-400 to-rose-500',
      line: '看到 9，想到 1，把数拆开凑成 10！',
    },
    principle: `加法的本质是「合成更大的数」。10 是一个非常容易计算的「整十数」，
所以当我们看到 9、8、7 这样的数字时，可以想办法把它「凑成 10」，变成 10 + 几就好算多了！
这就像搭积木：9 块积木还缺 1 块就能变成完整一座塔（10），所以找出那 1 块来填补。`,
    keyPoints: [
      '9 要找 1 凑成 10',
      '8 要找 2 凑成 10',
      '7 要找 3 凑成 10',
      '6 要找 4 凑成 10',
      '5 要找 5 凑成 10',
    ],
    signals: ['看到 9、8、7 要加几', '两个数加起来会超过 10', '题目里的十位只有个位'],
    pitfalls: [
      '拆错了：9 要 1，却从后一个数里拆了 2 出来',
      '把数拆开后，忘了把剩下的加回去',
      '先用 10 加完之后，忘了再加「小尾巴」',
    ],
    example: {
      problem: '9 + 5 = ?',
      scenes: [
        {
          caption: '萌可摆了两排格子：左边 9 颗豆，右边 5 颗。左边的格子还空着一个！',
          visual: { kind: 'ten-frame', a: 9, b: 5 },
          quiz: {
            prompt: '9 还差几颗豆，就能凑满 10 个？',
            options: ['1', '2', '3', '5'],
            answer: '1',
            praise: '对啦！9 的家还空 1 格～',
          },
          key: '9 还差 1 个凑成 10',
        },
        {
          caption: '把 5 拆成 1 和 4：1 颗跳去帮 9 凑成 10，剩下的 4 站在后面等着。',
          visual: { kind: 'arc-split', a: 9, b: 5 },
          quiz: {
            prompt: '5 送走了 1 颗，剩下几颗在后面等着？',
            options: ['3', '4', '5', '6'],
            answer: '4',
            praise: '没错，剩下 4！',
          },
          key: '5 = 1 + 4',
        },
        {
          caption: '连起来看一遍完整思维图——凑十法就是这三步！',
          visual: { kind: 'arc-split', a: 9, b: 5 },
          summary: true,
          flow: ['9 + 1 = 10', '10 + 4 = 14'],
          answer: 14,
          quiz: {
            prompt: '最后一步：10 + 4 = ?',
            options: ['13', '14', '15', '19'],
            answer: '14',
            praise: '太棒了，14！',
          },
          key: '10 + 4 = 14',
        },
      ],
    },
  },

  /* ==================== 2. 破十法 ==================== */
  {
    id: 'breaking-ten',
    name: '破十法',
    description: '十几减几，先用 10 减，再加剩下的数。减法也有魔法！',
    mantra: '十几减几，10 来帮忙，10 减去几，剩下的加回来',
    mantraEmoji: '🪄',
    moko: {
      name: '破十萌可',
      img: '/moko/collection/01_皇室萌可/勇气萌可_render.webp',
      emoji: '💪',
      color: 'from-blue-400 to-sky-500',
      line: '把 15 拆成 10 和 5，10 打头阵减去 8！',
    },
    principle: `十几减几的时候，我们可以把「十几」拆成 10 和几。
10 是个「勇敢的小将军」，它先去和减数战斗（10 - 几），剩下的「几」就是援军。
这样就把一个复杂的减法，变成了 10 减几的简单减法。`,
    keyPoints: [
      '把「十几」拆成 10 和几',
      '先用 10 减去减数',
      '再加上拆出来的那个几',
      '记住：10 - 9 = 1, 10 - 8 = 2, 10 - 7 = 3...',
    ],
    signals: ['十几减几，个位不够减（要退位）', '看到 15 − 8 这类式子'],
    pitfalls: [
      '减 10 的时候减反了（写成 8 − 10）',
      '拆出来的「小尾巴」忘了加回来',
      '把 15 拆成 10 和 5 之后，用 5 去减减数',
    ],
    example: {
      problem: '15 - 8 = ?',
      scenes: [
        {
          caption: '15 减 8 不好算？把 15 拆成 10 和 5，让勇敢的 10 先去打头阵！',
          visual: { kind: 'number-bond', whole: 15, parts: [10, 5] },
          quiz: {
            prompt: '15 拆成 10 和几？',
            options: ['3', '5', '6', '8'],
            answer: '5',
            praise: '对！15 = 10 + 5～',
          },
          key: '15 = 10 + 5',
        },
        {
          caption: '看 10 颗豆子：划掉 8 颗，数数还剩几颗——这就是 10 − 8！',
          visual: { kind: 'dot-take', total: 10, take: 8 },
          quiz: {
            prompt: '10 − 8 = ?',
            options: ['1', '2', '3', '8'],
            answer: '2',
            praise: '数对啦，还剩 2 颗！',
          },
          key: '10 − 8 = 2',
        },
        {
          caption: '连起来看完整思维图——先拆 15，再让 10 去减，最后加上小尾巴 5！',
          visual: { kind: 'number-bond', whole: 15, parts: [10, 5] },
          summary: true,
          flow: ['15 = 10 + 5', '10 − 8 = 2', '2 + 5 = 7'],
          answer: 7,
          quiz: {
            prompt: '小尾巴来啦：2 + 5 = ?',
            options: ['5', '6', '7', '8'],
            answer: '7',
            praise: '算得又快又准！',
          },
          key: '2 + 5 = 7',
        },
      ],
    },
  },

  /* ==================== 3. 平十法（连减法） ==================== */
  {
    id: 'leveling-ten',
    name: '平十法',
    description: '把减数拆成两段，先减到 10，再减剩下的。又叫「连减法」。',
    mantra: '减数分两段，先减到十整，再减剩下数，口诀要记牢',
    mantraEmoji: '⚔️',
    moko: {
      name: '平十将军',
      img: '/moko/collection/01_皇室萌可/正正萌可_render.webp',
      emoji: '🛡️',
      color: 'from-amber-400 to-orange-500',
      line: '一步步减，先减到 10 最厉害！',
    },
    principle: `有时候减数比较大，拆开减更容易。
把减数分成「能减到 10 的部分」+「剩下的部分」，先减到 10，再减剩下的。
这就像下山：先从山顶走到半山腰（10），再从半山腰走到山脚下。`,
    keyPoints: [
      '看「十几」的个位是几，就把减数拆出几',
      '先减到 10（个位变 0）',
      '再减去剩下的数',
      '确保最终答案 > 0',
    ],
    signals: ['减数比被减数的个位大', '想一步一步减、不愿意借位'],
    pitfalls: [
      '拆减数时没按个位拆（个位是 7 却拆了 6）',
      '先减到 10 之后，剩下的忘了减',
      '两次减法的顺序反了',
    ],
    example: {
      problem: '17 - 9 = ?',
      scenes: [
        {
          caption: '17 的个位是 7——先把减数 9 拆成 7 和 2，用 7 正好把 17 减到 10！',
          visual: { kind: 'number-bond', whole: 9, parts: [7, 2] },
          quiz: {
            prompt: '9 拆成 7 和几？',
            options: ['1', '2', '3', '9'],
            answer: '2',
            praise: '对，9 = 7 + 2！',
          },
          key: '9 = 7 + 2',
        },
        {
          caption: '看数轴小萌可跳格子：先往回跳 7 步正好落在 10，再往回跳 2 步就到了！',
          visual: { kind: 'number-line', from: 17, jumps: [7, 2] },
          quiz: {
            prompt: '跳到 10 之后，还要再减几？',
            options: ['1', '2', '7', '9'],
            answer: '2',
            praise: '没错，再减 2！',
          },
          key: '17 − 7 = 10',
        },
        {
          caption: '连起来看完整思维图——先减到 10（整十最好减），再减剩下的！',
          visual: { kind: 'number-line', from: 17, jumps: [7, 2] },
          summary: true,
          flow: ['17 − 7 = 10', '10 − 2 = 8'],
          answer: 8,
          quiz: {
            prompt: '最后一步：10 − 2 = ?',
            options: ['6', '7', '8', '9'],
            answer: '8',
            praise: '平十法学会了！',
          },
          key: '10 − 2 = 8',
        },
      ],
    },
  },

  /* ==================== 4. 交换律（加法） ==================== */
  {
    id: 'commutative',
    name: '交换律',
    description: '两个数交换位置，和不变。a + b = b + a',
    mantra: '加法排排队，位置换一换，总数不变样',
    mantraEmoji: '🔄',
    moko: {
      name: '交换萌可',
      img: '/moko/collection/02_魔方萌可_第一二季/仿仿萌可_render.webp',
      emoji: '🔀',
      color: 'from-purple-400 to-violet-500',
      line: '交换位置，答案不变！小不点排前面别扭，就让大个子站前面',
    },
    principle: `交换律让我们可以「选择先算哪个」。
比如 7 + 58，小数站在大数前面很别扭，交换成 58 + 7 就顺手多了——
反正答案一样，当然选好算的那边！这是数学中很重要的「自由」——顺序不重要，结果最重要。`,
    keyPoints: [
      'a + b = b + a',
      '可以选「看起来好算的」那边先算',
      '小数加在两位数前面别扭？交换成大数在前',
      '记住：交换只改变顺序，不改变结果',
    ],
    signals: ['小数站在大数前面', '一位数加两位数看着别扭'],
    pitfalls: ['以为交换位置答案会变', '把减法也随便交换（减法不能）', '交换时把数字带错了'],
    example: {
      problem: '7 + 58 = ?',
      scenes: [
        {
          caption: '小不点 7 站在大个子 58 前面，看着别扭？加法交换位置，答案不变！',
          visual: { kind: 'swap-pair', a: 7, b: 58 },
          quiz: {
            prompt: '交换位置后，算式变成 58 + ?',
            options: ['5', '7', '8', '58'],
            answer: '7',
            praise: '对，变成 58 + 7！',
          },
          key: '7 + 58 = 58 + 7',
        },
        {
          caption: '换过来就好算了：先算个位 8 + 7，再加上 50。',
          visual: { kind: 'calc-strip', steps: ['8 + 7 = 15', '50 + 15 = 65'] },
          quiz: {
            prompt: '个位先算：8 + 7 = ?',
            options: ['13', '14', '15', '16'],
            answer: '15',
            praise: '没错，8 + 7 = 15！',
          },
          key: '8 + 7 = 15',
        },
        {
          caption: '连起来看完整思维图——位置交换，答案不变，选好算的顺序！',
          visual: { kind: 'swap-pair', a: 7, b: 58 },
          summary: true,
          flow: ['7 + 58 → 58 + 7', '8 + 7 = 15', '50 + 15 = 65'],
          answer: 65,
          quiz: {
            prompt: '最后一步：50 + 15 = ?',
            options: ['55', '60', '65', '75'],
            answer: '65',
            praise: '交换律学会了！',
          },
          key: '58 + 7 = 65',
        },
      ],
    },
  },

  /* ==================== 5. 结合律（加法） ==================== */
  {
    id: 'associative',
    name: '结合律',
    description: '三个数相加，可以先把其中能凑整的两个相加，再加第三个',
    mantra: '三个数相加，好朋友先算，凑成整十整百，剩下就好算',
    mantraEmoji: '🤝',
    moko: {
      name: '结合萌可',
      img: '/moko/collection/01_皇室萌可/赞赞萌可_render.webp',
      emoji: '🫂',
      color: 'from-emerald-400 to-teal-500',
      line: '先把好朋友数拉到一起，凑成整十！',
    },
    principle: `三个数相加的时候，我们可以看哪两个数相加更好算（能凑成整十、整百），
先把它们「抱在一起」相加，再和第三个数相加。
这就像排队进教室：让走得快的两个人先走，走得慢的人就不会被拖累。`,
    keyPoints: [
      '先观察：哪两个数能凑成整十？',
      '先把它们相加',
      '再加上第三个数',
      '常见的好朋友：1↔9, 2↔8, 3↔7, 4↔6, 5↔5',
    ],
    signals: ['三个数相加', '其中两个数加起来正好是整十或整百'],
    pitfalls: ['把不能凑整的两个先加了', '凑整之后漏掉第三个数', '能凑整的两个隔得远，就没看出来'],
    example: {
      problem: '27 + 36 + 13 = ?',
      scenes: [
        {
          caption: '三个数排队相加——咦！27 和 13 是好朋友（27 + 13 = 40），隔着一个数也要抱团！',
          visual: { kind: 'brace-group', nums: [27, 36, 13], group: [0, 2], mode: 'heart' },
          quiz: {
            prompt: '好朋友抱团：27 + 13 = ?',
            options: ['30', '40', '46', '49'],
            answer: '40',
            praise: '对，凑成整十 40！',
          },
          key: '27 + 13 = 40',
        },
        {
          caption: '抱成 40 之后，再加上剩下的 36，就好算多了。',
          visual: { kind: 'calc-strip', steps: ['27 + 13 = 40', '40 + 36 = 76'] },
          quiz: {
            prompt: '40 + 36 = ?',
            options: ['66', '70', '76', '79'],
            answer: '76',
            praise: '算得漂亮！',
          },
          key: '40 + 36 = 76',
        },
        {
          caption: '连起来看完整思维图——先找好朋友抱团凑整十，再算剩下的！',
          visual: { kind: 'brace-group', nums: [27, 36, 13], group: [0, 2], mode: 'heart' },
          summary: true,
          flow: ['27 + 13 = 40', '40 + 36 = 76'],
          answer: 76,
          key: '27 + 13 = 40',
        },
      ],
    },
  },

  /* ==================== 6. 减法去括号 ==================== */
  {
    id: 'subtraction-parens',
    name: '减法去括号',
    description: '括号前面是减号，去掉括号要变号',
    mantra: '括号前面是减号，去括号要记牢，里面减号变加号',
    mantraEmoji: '⚡',
    moko: {
      name: '去括号萌可',
      img: '/moko/collection/03_宝石萌可_第三季/躲躲萌可_render.webp',
      emoji: '🔓',
      color: 'from-red-400 to-rose-500',
      line: '括号前面是减号？里面的符号要翻转！',
    },
    principle: `减法中的括号是一个「小陷阱」。
如果括号前面是减号，去掉括号的时候，里面的符号要「翻转」：减号变加号，加号变减号。
这就像打开一个「镜子房间」，左右是反的。`,
    keyPoints: [
      '括号前面是减号：-',
      '去掉括号，里面的符号要变',
      'a - (b + c) = a - b - c',
      'a - (b - c) = a - b + c（关键！）',
    ],
    signals: ['括号前面站着减号', '括号里面还有加减法'],
    pitfalls: ['里面忘记变号', '只把第一个数变了号，后面的没变', '变号之后自己又算错'],
    example: {
      problem: '33 - (22 - 18) = ?',
      scenes: [
        {
          caption: '括号前面站着减号——打开括号时，里面的符号要「翻跟头」变号！',
          visual: {
            kind: 'paren-flip',
            before: ['33', '−', '(', '22', '−', '18', ')'],
            after: ['33', '−', '22', '+', '18'],
            flip: true,
          },
          quiz: {
            prompt: '打开括号，里面的「− 18」应该变成？',
            options: ['+ 18', '− 18', '× 18', '18 变 0'],
            answer: '+ 18',
            praise: '对！减号前开括号要变号～',
          },
          key: '−(22−18) → −22+18',
        },
        {
          caption: '变成 33 − 22 + 18 之后，从左往右算。',
          visual: { kind: 'calc-strip', steps: ['33 − 22 = 11', '11 + 18 = 29'] },
          quiz: {
            prompt: '先算：33 − 22 = ?',
            options: ['9', '10', '11', '12'],
            answer: '11',
            praise: '没错，先算出 11！',
          },
          key: '33 − 22 = 11',
        },
        {
          caption: '连起来看完整思维图——开括号变号，再按顺序算！',
          visual: {
            kind: 'paren-flip',
            before: ['33', '−', '(', '22', '−', '18', ')'],
            after: ['33', '−', '22', '+', '18'],
            flip: true,
          },
          summary: true,
          flow: ['33 − 22 + 18', '33 − 22 = 11', '11 + 18 = 29'],
          answer: 29,
          quiz: {
            prompt: '最后一步：11 + 18 = ?',
            options: ['27', '28', '29', '30'],
            answer: '29',
            praise: '变号技巧学会啦！',
          },
          key: '11 + 18 = 29',
        },
      ],
    },
  },

  /* ==================== 7. 加法去括号（为正数准备） ==================== */
  {
    id: 'addition-parens',
    name: '加法去括号',
    description: '括号前面是加号，去掉括号不变号',
    mantra: '括号前面是加号，去括号不变号',
    mantraEmoji: '✨',
    moko: {
      name: '加法萌可',
      img: '/moko/collection/01_皇室萌可/闪闪萌可_render.webp',
      emoji: '➕',
      color: 'from-yellow-400 to-amber-500',
      line: '括号前面是加号？直接拆掉就行啦！',
    },
    principle: `如果括号前面是加号，去掉括号的时候不用改变任何符号。
就像打开一个普通的门，门里面和门外面是一样的。
这比减法的括号简单多了！`,
    keyPoints: [
      '括号前面是加号：+',
      '去掉括号，里面不变',
      'a + (b + c) = a + b + c',
      'a + (b - c) = a + b - c',
    ],
    signals: ['括号前面是加号', '括号里还挂着好几个数', '想省一步心算，直接把括号拆掉'],
    pitfalls: ['以为加号前面也要变号（受减号影响）', '直接拆掉括号后按顺序算错'],
    example: {
      problem: '25 + (15 + 12) = ?',
      scenes: [
        {
          caption: '括号前面是加号——放心打开！里面的符号一个都不用变。',
          visual: {
            kind: 'paren-flip',
            before: ['25', '+', '(', '15', '+', '12', ')'],
            after: ['25', '+', '15', '+', '12'],
            flip: false,
          },
          quiz: {
            prompt: '打开括号，里面的「+ 12」还是？',
            options: ['+ 12', '− 12', '× 12', '12 变 0'],
            answer: '+ 12',
            praise: '对！加号前开括号不变号～',
          },
          key: '+(15+12) → +15+12',
        },
        {
          caption: '拆掉括号变成 25 + 15 + 12，从左往右依次算。',
          visual: { kind: 'calc-strip', steps: ['25 + 15 = 40', '40 + 12 = 52'] },
          quiz: {
            prompt: '先算：25 + 15 = ?',
            options: ['35', '40', '45', '50'],
            answer: '40',
            praise: '又快又对！',
          },
          key: '25 + 15 = 40',
        },
        {
          caption: '连起来看完整思维图——加号前开括号，不变号直接拆！',
          visual: {
            kind: 'paren-flip',
            before: ['25', '+', '(', '15', '+', '12', ')'],
            after: ['25', '+', '15', '+', '12'],
            flip: false,
          },
          summary: true,
          flow: ['25 + 15 + 12', '25 + 15 = 40', '40 + 12 = 52'],
          answer: 52,
          quiz: {
            prompt: '最后一步：40 + 12 = ?',
            options: ['42', '50', '52', '54'],
            answer: '52',
            praise: '不变号的秘密记住啦！',
          },
          key: '40 + 12 = 52',
        },
      ],
    },
  },

  /* ==================== 8. 添括号 ==================== */
  {
    id: 'adding-parens',
    name: '添括号',
    description: '把两个数括起来一起计算，让算式更简洁',
    mantra: '想先算哪两个，就把它们抱在一起',
    mantraEmoji: '🎀',
    moko: {
      name: '添括号萌可',
      img: '/moko/collection/02_魔方萌可_第一二季/害羞萌可_render.webp',
      emoji: '🎁',
      color: 'from-cyan-400 to-blue-500',
      line: '想把谁先算，就用括号圈起来！',
    },
    principle: `添括号是结合律的「逆向思维」。
如果我们想先算某两个数，就可以把它们用括号括起来。
这就像一个拥抱，把两个好朋友抱在一起，让他们先成为一个小团体。`,
    keyPoints: [
      'a + b + c = a + (b + c)',
      '括号加了不影响结果',
      '但我们改变了计算的先后顺序',
      '目标：让括号里能凑成整十',
    ],
    signals: ['想先算某两个数', '有两个数加起来正好是整十、整百'],
    pitfalls: [
      '括号圈错了对象：圈了两个不好算的',
      '添了括号却忘了先算括号里',
      '以为添括号会改变结果',
    ],
    example: {
      problem: '38 + 62 + 47 = ?',
      scenes: [
        {
          caption: '38 和 62 是好朋友（38 + 62 = 100）！想先算它们，就给它们添上括号抱在一起。',
          visual: { kind: 'brace-group', nums: [38, 62, 47], group: [0, 1], mode: 'bracket' },
          quiz: {
            prompt: '好朋友先抱团：38 + 62 = ?',
            options: ['80', '90', '100', '110'],
            answer: '100',
            praise: '对，正好凑成 100！',
          },
          key: '38 + 62 = 100',
        },
        {
          caption: '括号里先算出 100，再加上 47——一下子就变简单了！',
          visual: { kind: 'calc-strip', steps: ['(38 + 62) = 100', '100 + 47 = 147'] },
          quiz: {
            prompt: '100 + 47 = ?',
            options: ['127', '137', '147', '157'],
            answer: '147',
            praise: '添完括号就是快！',
          },
          key: '100 + 47 = 147',
        },
        {
          caption: '连起来看完整思维图——想先算哪两个数，就添括号抱在一起！',
          visual: { kind: 'brace-group', nums: [38, 62, 47], group: [0, 1], mode: 'bracket' },
          summary: true,
          flow: ['(38 + 62) + 47', '38 + 62 = 100', '100 + 47 = 147'],
          answer: 147,
          key: '(38 + 62) + 47',
        },
      ],
    },
  },

  /* ==================== 9. 凑整法（好朋友数） ==================== */
  {
    id: 'rounding',
    name: '凑整法',
    description: '看到两个数相加能凑成 100，就把它们抱在一起先算',
    mantra: '几和几是好朋友，凑成一百不用愁，先把它们加一起，再和别的去牵手',
    mantraEmoji: '💯',
    moko: {
      name: '凑整萌可',
      img: '/moko/collection/01_皇室萌可/幸福萌可_render.webp',
      emoji: '🎊',
      color: 'from-fuchsia-400 to-pink-500',
      line: '63 和 37 是好朋友，加起来刚好是 100！',
    },
    principle: `两位数相加，如果能凑成 100（整百），那就特别好算！
我们需要找到「好朋友数」——两个数加起来是 100。
比如 63 和 37，65 和 35，28 和 72。
先把好朋友相加，再算剩下的。`,
    keyPoints: [
      '好朋友数：加起来正好是一百的两个数',
      '两个数**都有个位**时（如 63↔37、25↔75、5↔95）：十位凑 9，个位凑 10',
      '验一验 63 和 37：十位 6+3=9，个位 3+7=10 → 90 + 10 = 100',
      '**整十数**也有一对（如 10↔90、20↔80、30↔70）：十位凑 10，个位都是 0',
      '⚠️ 所以「十位凑 9，个位凑 10」只适用于两个数都有个位的情况，别拿它去套 10 和 90',
    ],
    signals: ['两个数加起来正好是一百', '看到 63 和 37、28 和 72 这种配对'],
    pitfalls: [
      '把「十位凑 9、个位凑 10」错用到整十数上（10 和 90 其实是十位凑 10）',
      '个位相加满十忘了进位',
      '把不是好朋友的两个数硬凑成一百',
    ],
    example: {
      problem: '63 + 37 = ?',
      scenes: [
        {
          caption: '63 和 37 是「好朋友数」：个位 3 和 7 拉手凑成 10，十位 6 和 3 抱团凑成 9！',
          visual: { kind: 'hundred-pair', a: 63, b: 37 },
          quiz: {
            prompt: '个位拉手：3 + 7 = ?',
            options: ['9', '10', '11', '13'],
            answer: '10',
            praise: '对，个位凑成 10！',
          },
          key: '3 + 7 = 10',
        },
        {
          caption: '十位加十位、个位加个位，最后合起来——正好 100！',
          visual: { kind: 'calc-strip', steps: ['60 + 30 = 90', '3 + 7 = 10', '90 + 10 = 100'] },
          quiz: {
            prompt: '十位抱团：60 + 30 = ?',
            options: ['80', '90', '93', '100'],
            answer: '90',
            praise: '十位凑成 9 就是 90！',
          },
          key: '60 + 30 = 90',
        },
        {
          caption: '连起来看完整思维图——好朋友数的秘诀：十位凑 9，个位凑 10！',
          visual: { kind: 'hundred-pair', a: 63, b: 37 },
          summary: true,
          flow: ['63 + 37', '60 + 30 = 90', '3 + 7 = 10', '90 + 10 = 100'],
          answer: 100,
          quiz: {
            prompt: '合起来：90 + 10 = ?',
            options: ['99', '100', '110', '1000'],
            answer: '100',
            praise: '好朋友数就是 100！',
          },
          key: '90 + 10 = 100',
        },
      ],
    },
  },

  /* ==================== 10. 带符号搬家（混合运算） ==================== */
  {
    id: 'symbol-move',
    name: '带符号搬家',
    description: 'a + b - c = a - c + b，符号跟着数字一起搬家',
    mantra: '加法减法混合运算，符号跟着数搬家，先算方便的',
    mantraEmoji: '📦',
    moko: {
      name: '搬家萌可',
      img: '/moko/collection/01_皇室萌可/热情萌可_render.webp',
      emoji: '🚛',
      color: 'from-indigo-400 to-blue-500',
      line: '把 −18 背着减号搬到后面，先算 56 + 24！',
    },
    principle: `加减混合的算式里，数字的位置可以交换，但是符号要跟着数字一起搬。
58 - 18 + 24 可以变成 58 + 24 - 18，这样先算加法更简单。
注意：交换的两个数的「符号」要一起搬走！`,
    keyPoints: [
      'a + b - c = a - c + b',
      'a - b + c = a + c - b',
      '符号跟着数字一起搬',
      '目标：让能凑整的先算',
    ],
    signals: ['加减混合运算', '有个带减号的数挡在中间，妨碍先凑整'],
    pitfalls: [
      '搬家时把符号丢了（−18 搬成 18）',
      '只有减号后面的数才带着减号一起搬',
      '搬完家之后把顺序算错',
    ],
    example: {
      problem: '56 - 18 + 24 = ?',
      scenes: [
        {
          caption: '每个数字都背着「符号小背包」！−18 挡在中间不好算——让它背着减号搬家！',
          visual: {
            kind: 'sign-move',
            tokens: [
              { sign: '+', n: 56 },
              { sign: '-', n: 18 },
              { sign: '+', n: 24 },
            ],
            moveFrom: 1,
          },
          quiz: {
            prompt: '−18 搬走后，56 先跟谁算？',
            options: ['+ 24', '− 18', '+ 56'],
            answer: '+ 24',
            praise: '对，先算 56 + 24！',
          },
          key: '56 − 18 + 24 → 56 + 24 − 18',
        },
        {
          caption: '搬家后：56 + 24 正好凑成整十 80，再减 18！',
          visual: { kind: 'calc-strip', steps: ['56 + 24 = 80', '80 − 18 = 62'] },
          quiz: {
            prompt: '先凑整：56 + 24 = ?',
            options: ['70', '76', '80', '86'],
            answer: '80',
            praise: '凑成 80，好算！',
          },
          key: '56 + 24 = 80',
        },
        {
          caption: '连起来看完整思维图——符号跟着数字搬家，让能凑整的先算！',
          visual: {
            kind: 'sign-move',
            tokens: [
              { sign: '+', n: 56 },
              { sign: '-', n: 18 },
              { sign: '+', n: 24 },
            ],
            moveFrom: 1,
          },
          summary: true,
          flow: ['56 − 18 + 24', '56 + 24 − 18', '56 + 24 = 80', '80 − 18 = 62'],
          answer: 62,
          quiz: {
            prompt: '最后一步：80 − 18 = ?',
            options: ['58', '62', '72', '78'],
            answer: '62',
            praise: '搬家技巧学会啦！',
          },
          key: '80 − 18 = 62',
        },
      ],
    },
  },
];

/** 获取指定主题 */
export function getTopic(topicId: string) {
  return ALGORITHM_TOPICS.find((t) => t.id === topicId);
}

/** 主题总数 */
export const TOPIC_COUNT = ALGORITHM_TOPICS.length;
