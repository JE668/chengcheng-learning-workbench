'use client';

import { useEffect, useState } from 'react';
import { speakZh } from '@/lib/speak';

// 词语接龙：尾字 → 新词首字。词库保证存在可接龙的词。
// 用 Set 去重，避免重复词让「排除自身」的判断失效。
const WORDS: string[] = Array.from(
  new Set([
    // ── 自然·天地 ──
    '天空', '空气', '气球', '球队', '队员', '员工', '工人', '人口', '口才', '才华',
    '华丽', '丽人', '人民', '民主', '主人', '人生', '生活', '活动', '动力', '力量',
    '力气', '太阳', '阳光', '光明', '明亮', '亮光', '月光', '月亮', '星星', '星空',
    '空中', '中午', '午饭', '饭菜', '菜园', '园丁', '丁香', '香蕉', '香味', '味道',
    '大风', '风筝', '风雨', '雨水', '雨伞', '水滴', '水草', '草地', '草原', '地面',
    '白云', '云朵', '雪花', '花草', '花朵', '花园', '花瓶', '原来', '来回', '回家',
    '春天', '夏天', '秋天', '冬天', '天气', '天亮', '高山', '山水', '水池', '池塘',
    '大海', '海洋', '洋葱', '葱花', '河流', '流水', '水牛', '牛奶', '奶茶', '茶杯',
    '杯子', '树林', '树叶', '叶子', '果树', '水果', '果汁', '汁液', '液体',
    // ── 校园·学习 ──
    '学生', '学校', '校园', '园林', '朋友', '友情', '情感', '感动', '早上', '上学',
    '学习', '习字', '晚上', '上课', '课本', '本子', '老师', '师生', '生字', '字典',
    '同学', '学问', '问题', '题目', '目光', '光线', '线条', '书包', '书本', '读书',
    '铅笔', '笔画', '笔记', '画家', '画笔', '家乡', '乡村', '村子', '黑板', '板凳',
    '凳子', '教室', '室内', '内心', '写字', '记号', '号码', '码头', '头发', '发现',
    '现在', '在家', '数学', '美术', '音乐', '乐园',
    // ── 生活·日常 ──
    '火车', '车站', '站点', '点心', '心情', '唱歌', '歌声', '声音', '跳舞', '舞台',
    '台风', '游泳', '泳池', '跑步', '步行', '行走', '走路', '道路', '路口', '口红',
    '红色', '色彩', '彩虹', '桥梁', '梁柱', '柱子', '子女', '女生', '生命', '命运',
    '运动', '动物', '物品', '时间', '分钟', '钟表', '表面', '面包', '包子', '面条',
    '电视', '电话', '话语', '语文', '文字', '字母', '母亲', '亲人', '日记', '生日',
    '年级', '新年', '快乐', '乐趣', '趣味', '开心', '心里', '里面', '安静', '干净',
    '努力', '笑容', '容易',
    // ── 动物·身体 ──
    '小鸟', '鸟窝', '大象', '象牙', '牙齿', '老虎', '虎口', '口水', '兔子', '猴子',
    '狮子', '鸭子', '鸽子', '小猫', '猫咪', '小狗', '狗窝', '蝴蝶', '蜜蜂', '蜂蜜',
    '蜜糖', '糖果', '金鱼', '鱼缸', '眼睛', '鼻子', '耳朵', '嘴巴', '巴掌', '掌心',
    '手心', '心跳', '跳高', '脚步', '头脑', '脑子', '身体', '体温', '温度', '温暖',
    '暖和', '和平', '平安', '安全', '全家', '家人', '家里', '家庭', '庭院', '院子',
    // ── 方位·数量 ──
    '今天', '天下', '下雨', '昨天', '明白', '白天', '中国', '国家', '北京', '京城',
    '城市', '市场', '场地', '地方', '方向', '向前', '前面', '东西', '西瓜', '瓜子',
    '南方', '北方', '左右', '右手', '手指', '指头', '前后', '后面', '上下', '下面',
    '一起', '起来', '来到', '到处', '绿色', '蓝天', '白色', '黑色', '红花',
  ])
);

const byFirst: Record<string, string[]> = {};
for (const w of WORDS) {
  const c = w[0];
  (byFirst[c] ||= []).push(w);
}

function lastChar(w: string) {
  return w[w.length - 1];
}

function shuffle<T>(a: T[]): T[] {
  return [...a].sort(() => 0.5 - Math.random());
}

// 只有「尾字能接上别的词」的词才有资格当题面，预先算一次即可。
const CHAINABLE = WORDS.filter((w) => (byFirst[lastChar(w)] || []).some((x) => x !== w));

function makeQuestion(prev?: string) {
  const candidates = prev ? CHAINABLE.filter((w) => w !== prev) : CHAINABLE;
  const prompt = candidates[Math.floor(Math.random() * candidates.length)];
  const lc = lastChar(prompt);
  const corrects = byFirst[lc].filter((x) => x !== prompt);
  const correct = corrects[Math.floor(Math.random() * corrects.length)];
  const distractPool = WORDS.filter((w) => w !== correct && w[0] !== lc);
  const distractors = shuffle(distractPool).slice(0, 3);
  return { prompt, correct, choices: shuffle([correct, ...distractors]) };
}

export default function WordChain({ onFinish, level = 1 }: { onFinish: (score: number) => void; level?: number }) {
  const lv = Math.min(3, Math.max(1, level));
  const timeLimit = [80, 70, 60][lv - 1];
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(timeLimit);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const [q, setQ] = useState(makeQuestion);
  const [feedback, setFeedback] = useState<{ ok: boolean; correct?: string } | null>(null);

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
    speakZh(q.prompt, 0.8);
  }, [q]);

  function next() {
    setFeedback(null);
    setQ((cur) => makeQuestion(cur.prompt));
  }

  function choose(w: string) {
    if (done || feedback) return;
    const ok = w === q.correct;
    if (ok) {
      const bonus = streak >= 2 ? 5 : 0;
      setScore((s) => s + 10 + bonus);
      setStreak((x) => x + 1);
      setFeedback({ ok: true });
    } else {
      setStreak(0);
      setFeedback({ ok: false, correct: q.correct });
    }
    setTimeout(next, 950);
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <div className="flex justify-between mb-4">
        <span className="font-bold text-moko-violet">⏱️ {time}s</span>
        <span className="font-bold text-moko-rose">积分 {score} {streak >= 2 ? '🔥x' + streak : ''}</span>
      </div>
      <p className="text-lg text-gray-600 mb-2">
        词语接龙：下一个词要以「<span className="font-extrabold text-moko-blue">{lastChar(q.prompt)}</span>」开头
      </p>
      <div className="text-4xl md:text-5xl font-black text-moko-violet mb-2 py-3">{q.prompt}</div>
      <button onClick={() => speakZh(q.prompt, 0.8)} className="mb-5 text-2xl" aria-label="朗读">🔊</button>
      <div className="grid grid-cols-2 gap-3">
        {q.choices.map((w) => (
          <button
            key={w}
            onClick={() => choose(w)}
            disabled={!!feedback}
            className={`py-5 rounded-2xl text-2xl font-black shadow transition ${
              feedback && w === q.correct
                ? 'bg-moko-mint text-white'
                : feedback && feedback.ok === false && w !== q.correct
                ? 'bg-gray-200 text-gray-400'
                : 'bg-gradient-to-r from-moko-purple to-moko-violet text-white hover:scale-105'
            }`}
          >
            {w}
          </button>
        ))}
      </div>
      {feedback && (
        <p className={`text-lg font-bold mt-3 ${feedback.ok ? 'text-green-600' : 'text-red-500'}`}>
          {feedback.ok ? '✅ 接对啦！' : `正确接龙：${q.correct}`}
        </p>
      )}
    </div>
  );
}
