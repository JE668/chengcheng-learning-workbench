'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { speakZh } from '@/lib/speak';
import { trackActivity } from '@/lib/activity';

interface Scene {
  id: string;
  emoji: string;
  title: string;
  questions: string[];
  example: string;
}

/* 内置若干生活场景（emoji 组合插画，无需外部图片资源） */
const SCENES: Scene[] = [
  { id: 'kite', emoji: '🧒🌳🌤️🪁', title: '放风筝', questions: ['谁在放风筝？', '他在哪里？', '他在做什么？'], example: '小男孩在公园的草地上放风筝。' },
  { id: 'cat', emoji: '🐱🥣🏠', title: '小猫吃饭', questions: ['这是谁？', '它在做什么？', '它喜欢吃什么？'], example: '小花猫在厨房里吃鱼。' },
  { id: 'school', emoji: '🧒🎒🏫', title: '去上学', questions: ['谁去上学？', '他背着什么？', '他去哪里？'], example: '小朋友背着书包去学校。' },
  { id: 'rain', emoji: '🌧️☔🧒', title: '下雨了', questions: ['天气怎么样？', '小朋友拿着什么？', '他要去哪里？'], example: '下雨了，小朋友打着伞回家。' },
  { id: 'fruit', emoji: '🍎🍊🧒', title: '水果摊', questions: ['图上有什么水果？', '谁在看水果？', '你想吃什么？'], example: '小女孩在水果摊前看红红的苹果。' },
  { id: 'park', emoji: '👵🧒🌸', title: '和奶奶散步', questions: ['谁和谁在一起？', '他们在哪里？', '他们在做什么？'], example: '小朋友和奶奶在花园里散步。' },
];

export default function TalkPage() {
  const [idx, setIdx] = useState(0);
  const [said, setSaid] = useState('');
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState('');
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const scene = SCENES[idx];

  const next = () => {
    setIdx((i) => (i + 1) % SCENES.length);
    setSaid('');
    setAudioUrl(null);
    setMicError('');
  };

  const readExample = () => speakZh(scene.example);

  const startRec = async () => {
    setMicError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mrRef.current = mr;
      setRecording(true);
    } catch {
      setMicError('没能打开麦克风（需要在 https 或 localhost 下访问，并已允许麦克风权限）。你可以先用文字把说的话记下来～');
    }
  };
  const stopRec = () => {
    mrRef.current?.stop();
    setRecording(false);
    trackActivity('talk');
  };

  return (
    <div className="relative max-w-3xl mx-auto min-h-screen p-4 fade-up">
      <Link href="/study" className="text-sm text-moko-rose font-bold">‹ 返回学习</Link>
      <h1 className="page-title mt-2 mb-1">🗣️ 看图说话</h1>
      <p className="text-gray-500 mb-4">看看下面的图，试着说 3 句话吧！说给爸爸妈妈听，也可以录下来回放。</p>

      <div className="card-moko">
        <div className="text-center">
          <div className="text-7xl mb-3">{scene.emoji}</div>
          <div className="text-xl font-black text-moko-violet mb-4">场景：{scene.title}</div>
        </div>
        <div className="bg-moko-cyan/10 rounded-2xl p-4 mb-4">
          <div className="text-sm text-gray-500 mb-2">小提示（照着这 3 个问题说就行）：</div>
          <ul className="space-y-1 text-moko-violet font-bold">
            {scene.questions.map((q) => (
              <li key={q}>· {q}</li>
            ))}
          </ul>
        </div>

        <label className="block text-sm text-gray-500 mb-1">我说的话（让爸爸妈妈帮忙记下来）：</label>
        <textarea
          value={said}
          onChange={(e) => setSaid(e.target.value)}
          placeholder="例如：小男孩在公园的草地上放风筝。"
          className="w-full rounded-2xl border-2 border-moko-purple/20 p-3 text-gray-700 focus:outline-none focus:border-moko-violet"
          rows={3}
        />

        <div className="flex flex-wrap gap-3 mt-4">
          <button onClick={readExample} className="px-5 py-3 rounded-2xl bg-gradient-to-r from-moko-pink to-moko-rose text-white font-black">🔊 听范文</button>
          {!recording ? (
            <button onClick={startRec} className="px-5 py-3 rounded-2xl bg-white border-2 border-moko-blue text-moko-blue font-black">🎤 开始录音</button>
          ) : (
            <button onClick={stopRec} className="px-5 py-3 rounded-2xl bg-red-500 text-white font-black">⏹ 停止录音</button>
          )}
          {audioUrl && (
            <a href={audioUrl} target="_blank" rel="noreferrer" className="px-5 py-3 rounded-2xl bg-moko-blue text-white font-black">▶ 回放我的声音</a>
          )}
        </div>
        {micError && <p className="text-sm text-red-500 mt-2">{micError}</p>}
      </div>

      <div className="text-center mt-6">
        <button onClick={next} className="px-8 py-4 rounded-3xl bg-moko-violet text-white font-black text-lg shadow hover:scale-105 transition">➡ 换一个场景</button>
      </div>
    </div>
  );
}
