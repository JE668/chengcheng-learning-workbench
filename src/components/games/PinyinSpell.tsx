'use client';

import { useEffect, useState } from 'react';
import { speakPinyin } from '@/lib/speak';

type Combo = { init: string; final: string; forms: string[]; han: string[] };

// 声母 + 韵母(带声调) → 拼出完整音节（如 b + ǎ → bǎ 把）
// 规则：只收录「四个声调都有真实汉字」的音节，且四个汉字互不重复、声调必须与 forms 一一对应
//（han 只用于 TTS 借字发音，一旦对错就会读错声调）。
// 已剔除 pa / kou / ding / shang 等缺声调的组合（原数据里用重复汉字凑数，导致读音错误）。
const COMBOS: Combo[] = [
  // ── a ──
  { init: 'b', final: 'a', forms: ['bā', 'bá', 'bǎ', 'bà'], han: ['八', '拔', '把', '爸'] },
  { init: 'm', final: 'a', forms: ['mā', 'má', 'mǎ', 'mà'], han: ['妈', '麻', '马', '骂'] },
  { init: 'd', final: 'a', forms: ['dā', 'dá', 'dǎ', 'dà'], han: ['搭', '答', '打', '大'] },
  { init: 'sh', final: 'a', forms: ['shā', 'shá', 'shǎ', 'shà'], han: ['沙', '啥', '傻', '厦'] },
  { init: 'zh', final: 'a', forms: ['zhā', 'zhá', 'zhǎ', 'zhà'], han: ['扎', '炸', '眨', '诈'] },
  // ── u ──
  { init: 'h', final: 'u', forms: ['hū', 'hú', 'hǔ', 'hù'], han: ['呼', '胡', '虎', '户'] },
  { init: 't', final: 'u', forms: ['tū', 'tú', 'tǔ', 'tù'], han: ['突', '图', '土', '兔'] },
  { init: 'l', final: 'u', forms: ['lū', 'lú', 'lǔ', 'lù'], han: ['噜', '炉', '鲁', '路'] },
  { init: 'sh', final: 'u', forms: ['shū', 'shú', 'shǔ', 'shù'], han: ['书', '熟', '鼠', '树'] },
  { init: 'zh', final: 'u', forms: ['zhū', 'zhú', 'zhǔ', 'zhù'], han: ['猪', '竹', '煮', '住'] },
  { init: 'ch', final: 'u', forms: ['chū', 'chú', 'chǔ', 'chù'], han: ['出', '厨', '础', '处'] },
  // ── i ──
  { init: 'b', final: 'i', forms: ['bī', 'bí', 'bǐ', 'bì'], han: ['逼', '鼻', '笔', '壁'] },
  { init: 'm', final: 'i', forms: ['mī', 'mí', 'mǐ', 'mì'], han: ['眯', '迷', '米', '蜜'] },
  { init: 't', final: 'i', forms: ['tī', 'tí', 'tǐ', 'tì'], han: ['踢', '提', '体', '剃'] },
  { init: 'n', final: 'i', forms: ['nī', 'ní', 'nǐ', 'nì'], han: ['妮', '泥', '你', '腻'] },
  { init: 'd', final: 'i', forms: ['dī', 'dí', 'dǐ', 'dì'], han: ['低', '敌', '底', '地'] },
  { init: 'p', final: 'i', forms: ['pī', 'pí', 'pǐ', 'pì'], han: ['批', '皮', '匹', '屁'] },
  { init: 'j', final: 'i', forms: ['jī', 'jí', 'jǐ', 'jì'], han: ['鸡', '急', '几', '记'] },
  { init: 'q', final: 'i', forms: ['qī', 'qí', 'qǐ', 'qì'], han: ['七', '骑', '起', '气'] },
  { init: 'x', final: 'i', forms: ['xī', 'xí', 'xǐ', 'xì'], han: ['西', '习', '洗', '细'] },
  { init: 'l', final: 'i', forms: ['lī', 'lí', 'lǐ', 'lì'], han: ['哩', '梨', '里', '立'] },
  // ── ao / ai ──
  { init: 'm', final: 'ao', forms: ['māo', 'máo', 'mǎo', 'mào'], han: ['猫', '毛', '卯', '帽'] },
  { init: 'b', final: 'ao', forms: ['bāo', 'báo', 'bǎo', 'bào'], han: ['包', '薄', '宝', '抱'] },
  { init: 'y', final: 'ao', forms: ['yāo', 'yáo', 'yǎo', 'yào'], han: ['腰', '摇', '咬', '药'] },
  { init: 'sh', final: 'ao', forms: ['shāo', 'sháo', 'shǎo', 'shào'], han: ['烧', '勺', '少', '哨'] },
  { init: 'b', final: 'ai', forms: ['bāi', 'bái', 'bǎi', 'bài'], han: ['掰', '白', '百', '败'] },
  { init: 'c', final: 'ai', forms: ['cāi', 'cái', 'cǎi', 'cài'], han: ['猜', '才', '彩', '菜'] },
  { init: 'h', final: 'ai', forms: ['hāi', 'hái', 'hǎi', 'hài'], han: ['嗨', '还', '海', '害'] },
  // ── an / ang / ong ──
  { init: 'f', final: 'an', forms: ['fān', 'fán', 'fǎn', 'fàn'], han: ['翻', '凡', '反', '饭'] },
  { init: 't', final: 'an', forms: ['tān', 'tán', 'tǎn', 'tàn'], han: ['摊', '谈', '毯', '炭'] },
  { init: 'h', final: 'an', forms: ['hān', 'hán', 'hǎn', 'hàn'], han: ['憨', '寒', '喊', '汗'] },
  { init: 'y', final: 'an', forms: ['yān', 'yán', 'yǎn', 'yàn'], han: ['烟', '盐', '眼', '雁'] },
  { init: 'w', final: 'an', forms: ['wān', 'wán', 'wǎn', 'wàn'], han: ['弯', '完', '晚', '万'] },
  { init: 't', final: 'ang', forms: ['tāng', 'táng', 'tǎng', 'tàng'], han: ['汤', '糖', '躺', '烫'] },
  { init: 'f', final: 'ang', forms: ['fāng', 'fáng', 'fǎng', 'fàng'], han: ['方', '房', '访', '放'] },
  { init: 'y', final: 'ang', forms: ['yāng', 'yáng', 'yǎng', 'yàng'], han: ['央', '羊', '养', '样'] },
  { init: 'ch', final: 'ang', forms: ['chāng', 'cháng', 'chǎng', 'chàng'], han: ['昌', '长', '场', '唱'] },
  { init: 'w', final: 'ang', forms: ['wāng', 'wáng', 'wǎng', 'wàng'], han: ['汪', '王', '网', '忘'] },
  { init: 't', final: 'ong', forms: ['tōng', 'tóng', 'tǒng', 'tòng'], han: ['通', '同', '桶', '痛'] },
  // ── ian ──
  { init: 'x', final: 'ian', forms: ['xiān', 'xián', 'xiǎn', 'xiàn'], han: ['先', '闲', '险', '线'] },
  { init: 'q', final: 'ian', forms: ['qiān', 'qián', 'qiǎn', 'qiàn'], han: ['千', '前', '浅', '欠'] },
  { init: 'n', final: 'ian', forms: ['niān', 'nián', 'niǎn', 'niàn'], han: ['蔫', '年', '捻', '念'] },
  // ── uo / ia / ie / e ──
  { init: 'g', final: 'uo', forms: ['guō', 'guó', 'guǒ', 'guò'], han: ['锅', '国', '果', '过'] },
  { init: 'h', final: 'uo', forms: ['huō', 'huó', 'huǒ', 'huò'], han: ['豁', '活', '火', '货'] },
  { init: 'j', final: 'ia', forms: ['jiā', 'jiá', 'jiǎ', 'jià'], han: ['家', '夹', '假', '价'] },
  { init: 'j', final: 'ie', forms: ['jiē', 'jié', 'jiě', 'jiè'], han: ['街', '节', '姐', '借'] },
  { init: 'x', final: 'ie', forms: ['xiē', 'xié', 'xiě', 'xiè'], han: ['些', '鞋', '写', '谢'] },
  { init: 'k', final: 'e', forms: ['kē', 'ké', 'kě', 'kè'], han: ['科', '壳', '可', '课'] },
  // ── ing / eng / ei / iu / iao ──
  { init: 'q', final: 'ing', forms: ['qīng', 'qíng', 'qǐng', 'qìng'], han: ['青', '情', '请', '庆'] },
  { init: 'x', final: 'ing', forms: ['xīng', 'xíng', 'xǐng', 'xìng'], han: ['星', '行', '醒', '姓'] },
  { init: 'sh', final: 'eng', forms: ['shēng', 'shéng', 'shěng', 'shèng'], han: ['生', '绳', '省', '胜'] },
  { init: 'f', final: 'eng', forms: ['fēng', 'féng', 'fěng', 'fèng'], han: ['风', '缝', '讽', '凤'] },
  { init: 'm', final: 'eng', forms: ['mēng', 'méng', 'měng', 'mèng'], han: ['蒙', '萌', '猛', '梦'] },
  { init: 'ch', final: 'eng', forms: ['chēng', 'chéng', 'chěng', 'chèng'], han: ['称', '成', '逞', '秤'] },
  { init: 'f', final: 'ei', forms: ['fēi', 'féi', 'fěi', 'fèi'], han: ['飞', '肥', '匪', '费'] },
  { init: 'l', final: 'iu', forms: ['liū', 'liú', 'liǔ', 'liù'], han: ['溜', '流', '柳', '六'] },
  { init: 'j', final: 'iao', forms: ['jiāo', 'jiáo', 'jiǎo', 'jiào'], han: ['交', '嚼', '脚', '叫'] },
  { init: 'p', final: 'iao', forms: ['piāo', 'piáo', 'piǎo', 'piào'], han: ['飘', '瓢', '瞟', '票'] },
];

function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => 0.5 - Math.random());
}

type Q = { init: string; final: string; forms: string[]; han: string[]; t: number; target: string; toneFinal: string; options: string[] };

function makeQ(): Q {
  const c = COMBOS[Math.floor(Math.random() * COMBOS.length)];
  const t = Math.floor(Math.random() * 4);
  const target = c.forms[t];
  const toneFinal = target.slice(c.init.length); // 带声调的韵母
  return { ...c, t, target, toneFinal, options: shuffle(c.forms) };
}

// 拼音拼拼拼：把「声母 + 带声调的韵母」拼成一个完整音节（拼 + 声调组合练习）。
export default function PinyinSpell({ onFinish, level = 1 }: { onFinish: (score: number) => void; level?: number }) {
  const lv = Math.min(3, Math.max(1, level));
  const timeLimit = [80, 75, 70][lv - 1];
  const [q, setQ] = useState<Q>(makeQ);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(timeLimit);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setTime((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [done]);

  useEffect(() => {
    if (time === 0 && !done) {
      setDone(true);
      onFinish(score);
    }
  }, [time, done, score, onFinish]);

  useEffect(() => {
    speakPinyin(q.target, q.t + 1, q.han[q.t]);
  }, [q]);

  function pick(form: string) {
    if (done) return;
    if (form === q.target) {
      const bonus = streak >= 2 ? 5 : 0;
      setScore((s) => s + 10 + bonus);
      setStreak((x) => x + 1);
    } else {
      setStreak(0);
    }
    setQ(makeQ());
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <div className="flex justify-between mb-3">
        <span className="font-bold text-moko-violet">⏱️ {time}s</span>
        <span className="font-bold text-moko-rose">积分 {score} {streak >= 2 ? '🔥x' + streak : ''}</span>
      </div>
      <p className="text-base text-gray-500 mb-3">声母 ＋ 韵母(带声调) ＝ 拼出一个音节</p>
      <div className="text-3xl md:text-4xl font-black text-moko-violet mb-2 py-3">
        {q.init} ＋ {q.toneFinal} ＝ ?
      </div>
      <button onClick={() => speakPinyin(q.target, q.t + 1, q.han[q.t])} className="mb-4 text-3xl" aria-label="听一听">
        🔊
      </button>
      <div className="grid grid-cols-2 gap-3">
        {q.options.map((f) => (
          <button
            key={f}
            onClick={() => pick(f)}
            className="py-5 rounded-2xl bg-gradient-to-r from-moko-purple to-moko-violet text-white text-3xl font-black shadow hover:scale-105 transition"
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}
