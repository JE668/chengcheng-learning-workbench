// 自动生成：scripts/split-textbooks.py（按 PDF 书签一级目录切分）
// 不要手改；改了 PDF 或章节后重跑脚本即可。

export type Chapter = {
  idx: number;
  title: string;
  file: string;
  startPage: number;
  pages: number;
  sizeKB: number;
};
export type Textbook = {
  key: 'chinese' | 'math';
  title: string;
  sub: string;
  emoji: string;
  color: string;
  border: string;
  img: string;
  chapters: Chapter[];
};

export const TEXTBOOKS: Textbook[] = [
  {
    key: 'chinese',
    title: '语文 · 一年级上册',
    sub: '义务教育教科书（2022 年版课程标准修订）',
    emoji: '📕',
    color: 'bg-moko-pink',
    border: 'border-moko-pink/40',
    img: '/moko/heartping.jpg',
    chapters: [
      {
        idx: 1,
        title: '我上学了',
        file: '/textbooks/chapters/chinese/ch01.pdf',
        startPage: 7,
        pages: 6,
        sizeKB: 4066,
      },
      {
        idx: 2,
        title: '第一单元·识字',
        file: '/textbooks/chapters/chinese/ch02.pdf',
        startPage: 13,
        pages: 12,
        sizeKB: 7098,
      },
      {
        idx: 3,
        title: '第二单元·汉语拼音',
        file: '/textbooks/chapters/chinese/ch03.pdf',
        startPage: 25,
        pages: 12,
        sizeKB: 2008,
      },
      {
        idx: 4,
        title: '第三单元·汉语拼音',
        file: '/textbooks/chapters/chinese/ch04.pdf',
        startPage: 37,
        pages: 13,
        sizeKB: 2189,
      },
      {
        idx: 5,
        title: '第四单元·汉语拼音',
        file: '/textbooks/chapters/chinese/ch05.pdf',
        startPage: 50,
        pages: 15,
        sizeKB: 3259,
      },
      {
        idx: 6,
        title: '第五单元·阅读',
        file: '/textbooks/chapters/chinese/ch06.pdf',
        startPage: 65,
        pages: 13,
        sizeKB: 2113,
      },
      {
        idx: 7,
        title: '第六单元·识字',
        file: '/textbooks/chapters/chinese/ch07.pdf',
        startPage: 78,
        pages: 11,
        sizeKB: 1978,
      },
      {
        idx: 8,
        title: '第七单元·阅读',
        file: '/textbooks/chapters/chinese/ch08.pdf',
        startPage: 89,
        pages: 11,
        sizeKB: 1703,
      },
      {
        idx: 9,
        title: '第八单元·阅读',
        file: '/textbooks/chapters/chinese/ch09.pdf',
        startPage: 100,
        pages: 19,
        sizeKB: 2537,
      },
    ],
  },
  {
    key: 'math',
    title: '数学 · 一年级上册',
    sub: '义务教育教科书（2022 年版课程标准修订）',
    emoji: '📘',
    color: 'bg-moko-blue',
    border: 'border-moko-blue/40',
    img: '/moko/courageping.jpg',
    chapters: [
      {
        idx: 1,
        title: '数学游戏',
        file: '/textbooks/chapters/math/ch01.pdf',
        startPage: 6,
        pages: 11,
        sizeKB: 3536,
      },
      {
        idx: 2,
        title: '一  5以内数的认识和加、减法',
        file: '/textbooks/chapters/math/ch02.pdf',
        startPage: 17,
        pages: 22,
        sizeKB: 15203,
      },
      {
        idx: 3,
        title: '二  6～10的认识和加、 减法',
        file: '/textbooks/chapters/math/ch03.pdf',
        startPage: 39,
        pages: 33,
        sizeKB: 12615,
      },
      {
        idx: 4,
        title: '三  认识立体图形',
        file: '/textbooks/chapters/math/ch04.pdf',
        startPage: 72,
        pages: 6,
        sizeKB: 2255,
      },
      {
        idx: 5,
        title: '四 11～ 20的认识',
        file: '/textbooks/chapters/math/ch05.pdf',
        startPage: 78,
        pages: 15,
        sizeKB: 9200,
      },
      {
        idx: 6,
        title: '五 20以内的进位加法',
        file: '/textbooks/chapters/math/ch06.pdf',
        startPage: 93,
        pages: 15,
        sizeKB: 10322,
      },
      {
        idx: 7,
        title: '六 复习与关联',
        file: '/textbooks/chapters/math/ch07.pdf',
        startPage: 108,
        pages: 11,
        sizeKB: 3599,
      },
    ],
  },
];
