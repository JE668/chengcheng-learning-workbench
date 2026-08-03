import type { ComponentType } from 'react';
import PinyinModule from '@/components/study/PinyinModule';
import { CharacterModule, PoemModule, TraceModule, CharacterQuizModule } from '@/components/study/ChineseModules';
import { CharacterLessonModule, TextModule } from '@/components/study/ChineseExtra';
import { StrokeRadicalModule, TextCharModule } from '@/components/study/MokoStudy';
import { NumberSenseModule, CompareModule, ShapeModule, MathQuizModule, AngleModule, CarryModule } from '@/components/study/MathModules';
import { PositionModule, SolidShapeModule, Numbers1120Module, ClockModule } from '@/components/study/MathExtra';
import { SplitModule } from '@/components/study/MokoStudy';
import { FindPatternModule } from '@/components/study/PatternModule';
import { LetterModule, WordModule, EnListenModule, EnSpeakModule, UnitModule } from '@/components/study/EnglishModules';
import {
  PinyinBlendModule,
  StrokeOrderModule,
  TextComprehensionModule,
  SentenceBuildModule,
  SchoolPrepModule,
} from '@/components/study/ChineseNew';
import {
  MathWordProblemModule,
  OrdinalModule,
  ClockHalfModule,
  CompareMoreModule,
  CalendarModule,
} from '@/components/study/MathNew';
import { EnglishPhonicsModule, EnglishSentenceModule } from '@/components/study/EnglishNew';
import { MathTableModule } from '@/components/study/MathTable';
import { EnListenPicModule, EnInitialSoundModule, EnTprModule } from '@/components/study/EnglishListen';
import { WordFormModule } from '@/components/study/ChineseWordForm';
import { FingerReadModule } from '@/components/study/ChineseFingerRead';
import { PoemFunModule } from '@/components/study/PoemFun';
import { MyDayModule } from '@/components/study/MyDay';

export interface StudyModuleMeta {
  key: string;
  label: string;
  emoji: string;
  desc: string;
  Component: ComponentType;
  color: string;
}

/** 每个学科的「小页面」清单（细化到每一项一个页面） */
export const STUDY_MODULES: Record<string, StudyModuleMeta[]> = {
  chinese: [
    { key: 'pinyin', label: '拼音乐园', emoji: '🔤', desc: '单韵母 · 声母 · 复韵母 · 整体认读', Component: PinyinModule, color: 'bg-moko-pink' },
    { key: 'lessons', label: '识字课文', emoji: '📖', desc: '天地人·金木水火土…按课本单元', Component: CharacterLessonModule, color: 'bg-moko-rose' },
    { key: 'characters', label: '识字小能手', emoji: '✏️', desc: '按类别认字，看释义选字', Component: CharacterModule, color: 'bg-moko-rose' },
    { key: 'strokes', label: '笔画与偏旁', emoji: '✍️', desc: '基本笔画 · 常用偏旁部首', Component: StrokeRadicalModule, color: 'bg-moko-rose' },
    { key: 'texts', label: '课文朗读', emoji: '📜', desc: '一年级上册课文，点读跟读', Component: TextModule, color: 'bg-moko-purple' },
    { key: 'textchars', label: '课文生字', emoji: '📘', desc: '一年级上册课文 1~14 生字', Component: TextCharModule, color: 'bg-moko-pink' },
    { key: 'poems', label: '古诗诵读', emoji: '🌙', desc: '小学必背古诗词', Component: PoemModule, color: 'bg-moko-purple' },
    { key: 'trace', label: '描红练习', emoji: '✍️', desc: '跟着模板写一写', Component: TraceModule, color: 'bg-moko-pink' },
    { key: 'quiz', label: '识字闯关', emoji: '🎯', desc: '难度会自己调整哦', Component: CharacterQuizModule, color: 'bg-moko-rose' },
    { key: 'pinyin-blend', label: '拼音拼读', emoji: '🀄', desc: '声母韵母拼一拼', Component: PinyinBlendModule, color: 'bg-moko-pink' },
    { key: 'strokes-order', label: '笔顺动画', emoji: '✍️', desc: '看萌可写一写笔画顺序', Component: StrokeOrderModule, color: 'bg-moko-rose' },
    { key: 'reading', label: '阅读理解', emoji: '📖', desc: '读短句答小问题', Component: TextComprehensionModule, color: 'bg-moko-purple' },
    { key: 'sentence', label: '连词成句', emoji: '🔤', desc: '把词语排成一句话', Component: SentenceBuildModule, color: 'bg-moko-pink' },
    { key: 'school-prep', label: '整理书包', emoji: '🎒', desc: '上学前要带些什么', Component: SchoolPrepModule, color: 'bg-moko-rose' },
    { key: 'word-form', label: '组词造句', emoji: '✍️', desc: '给字组词，再说一句完整的话', Component: WordFormModule, color: 'bg-moko-pink' },
    { key: 'finger-read', label: '指读高亮', emoji: '👆', desc: '点字跟读，小手指跟着滑过去', Component: FingerReadModule, color: 'bg-moko-rose' },
    { key: 'poem-fun', label: '古诗游乐场', emoji: '🌙', desc: '诗中有画·诗句排序·飞花令', Component: PoemFunModule, color: 'bg-moko-purple' },
    { key: 'my-day', label: '我的一天', emoji: '🕒', desc: '听一听一天的安排，排排序', Component: MyDayModule, color: 'bg-moko-blue' },
  ],
  math: [
    { key: 'count', label: '数感启蒙', emoji: '🔟', desc: '1~10 数一数', Component: NumberSenseModule, color: 'bg-moko-blue' },
    { key: 'compare', label: '比一比', emoji: '⚖️', desc: '比大小、比多少', Component: CompareModule, color: 'bg-moko-cyan' },
    { key: 'position', label: '位置', emoji: '🧭', desc: '上·下·前·后·左·右', Component: PositionModule, color: 'bg-moko-blue' },
    { key: 'shape', label: '图形王国', emoji: '🔷', desc: '圆、方、角，认图形', Component: ShapeModule, color: 'bg-moko-mint' },
    { key: 'solid', label: '立体图形', emoji: '📦', desc: '长方体·正方体·圆柱·球', Component: SolidShapeModule, color: 'bg-moko-mint' },
    { key: 'split', label: '分与合', emoji: '🍬', desc: '2~10 的分与合，正正萌可分糖果', Component: SplitModule, color: 'bg-moko-blue' },
    { key: '1120', label: '11~20 各数', emoji: '🔢', desc: '1个十和几个一', Component: Numbers1120Module, color: 'bg-moko-blue' },
    { key: 'calc', label: '加减法闯关', emoji: '➕➖', desc: '难度会自己调整哦', Component: MathQuizModule, color: 'bg-moko-cyan' },
    { key: 'carry', label: '进位加法', emoji: '➕', desc: '20 以内进位加法', Component: CarryModule, color: 'bg-moko-cyan' },
    { key: 'clock', label: '认识钟表', emoji: '🕐', desc: '认识整时', Component: ClockModule, color: 'bg-moko-cyan' },
    { key: 'angle', label: '角的世界', emoji: '📐', desc: '锐角、直角、钝角', Component: AngleModule, color: 'bg-moko-blue' },
    { key: 'pattern', label: '找规律', emoji: '🔍', desc: '发现顺序里的秘密', Component: FindPatternModule, color: 'bg-moko-violet' },
    { key: 'word-problem', label: '应用题', emoji: '🧮', desc: '20 以内加减应用题', Component: MathWordProblemModule, color: 'bg-moko-blue' },
    { key: 'ordinal', label: '序数排队', emoji: '🚩', desc: '第1~第10 排第几', Component: OrdinalModule, color: 'bg-moko-cyan' },
    { key: 'clock-half', label: '钟表半时', emoji: '🕡', desc: '认识几点半', Component: ClockHalfModule, color: 'bg-moko-cyan' },
    { key: 'compare-more', label: '比轻重长短', emoji: '⚖️', desc: '谁更重谁更长', Component: CompareMoreModule, color: 'bg-moko-blue' },
    { key: 'calendar', label: '星期日历', emoji: '📅', desc: '星期·日历·天气', Component: CalendarModule, color: 'bg-moko-blue' },
    { key: 'mult-table', label: '乘法口诀树', emoji: '🌳', desc: '萌可陪你背会九九乘法口诀', Component: MathTableModule, color: 'bg-moko-blue' },
  ],
  english: [
    { key: 'letters', label: '字母乐园', emoji: '🔤', desc: 'A ~ Z 认读', Component: LetterModule, color: 'bg-moko-yellow' },
    { key: 'units', label: '单元通关', emoji: '🗂️', desc: '人教版一年级起点 7 个单元', Component: UnitModule, color: 'bg-moko-yellow' },
    { key: 'words', label: '单词世界', emoji: '📚', desc: '动物·食物·颜色…点读跟读', Component: WordModule, color: 'bg-moko-yellow' },
    { key: 'listen', label: '听音选词', emoji: '🎧', desc: '难度会自己调整哦', Component: EnListenModule, color: 'bg-moko-yellow' },
    { key: 'speak', label: '口语跟读', emoji: '🎙️', desc: '逐词挑战，评发音', Component: EnSpeakModule, color: 'bg-moko-violet' },
    { key: 'phonics', label: '自然拼读', emoji: '🔡', desc: 'CVC 词 c-a-t', Component: EnglishPhonicsModule, color: 'bg-moko-yellow' },
    { key: 'sentences', label: '常见句型', emoji: '💬', desc: 'I can… / This is…', Component: EnglishSentenceModule, color: 'bg-moko-violet' },
    { key: 'en-listen-pic', label: '听音选图', emoji: '🖼️', desc: '听英语，选对应的图', Component: EnListenPicModule, color: 'bg-moko-yellow' },
    { key: 'en-initial', label: '首音辨析', emoji: '🔤', desc: '哪个单词以这个音开头', Component: EnInitialSoundModule, color: 'bg-moko-yellow' },
    { key: 'en-tpr', label: 'TPR 动作', emoji: '🏃', desc: '听指令做动作', Component: EnTprModule, color: 'bg-moko-violet' },
  ],
};

export const SUBJECT_META: Record<string, { label: string; emoji: string; color: string; sub: string }> = {
  chinese: { label: '语文城堡', emoji: '📖', color: 'text-moko-rose', sub: '爱心萌可陪你认字读诗' },
  math: { label: '数学星球', emoji: '🔢', color: 'text-moko-blue', sub: '正正萌可带你算算比一比' },
  english: { label: '英语乐园', emoji: '🔤', color: 'text-moko-yellow', sub: '唱唱萌可教你字母单词' },
};
