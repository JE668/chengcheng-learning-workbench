import Link from 'next/link';
import { MokoHelper } from '@/components/MokoHelper';
import TextbookViewer from '@/components/study/TextbookViewer';

export default function TextbookPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/study" className="text-moko-violet font-bold hover:underline">‹ 学习首页</Link>
      </div>
      <h1 className="text-3xl font-black text-moko-violet mb-2">电子课本 📖</h1>
      <p className="text-gray-600 mb-4">和萌可一起，翻开真正的一年级上册课本吧！</p>

      <MokoHelper
        subject="语文"
        tips={[
          '这是程程真正的课本哦～遇到不懂的，先翻一翻，再回来玩游戏巩固！',
          '数学和语文课本都在这里，点开就能看，像捧着书一样。',
          '看课本累了，记得按「护眼」休息一下，萌可也会提醒你～',
        ]}
      />

      <div className="mt-6">
        <TextbookViewer />
      </div>

      <div className="mt-8 rounded-2xl p-5 bg-white shadow-lg border-2 border-moko-purple/20">
        <h3 className="text-lg font-black text-moko-violet mb-2">💡 小提示</h3>
        <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
          <li>课本已按章节切成小册：点左侧目录的某一章，才加载那一章的 PDF，更省流量、打开更快。</li>
          <li>读到哪一章会自动记住，下次打开这本书直接续上；想连续读就把几章依次点开即可。</li>
          <li>每章都能在页面内翻页，也可「在新标签打开」用系统阅读器；建议在 Wi-Fi 下使用。</li>
          <li>课本内容仅用于家庭学习，请妥善保管账号、不要外传。</li>
        </ul>
      </div>
    </div>
  );
}
