import type { ComponentType } from 'react';
import PinyinModule from '@/components/study/PinyinModule';
import { CharacterModule, PoemModule, TraceModule, CharacterQuizModule } from '@/components/study/ChineseModules';
import { NumberSenseModule, CompareModule, ShapeModule, MathQuizModule, AngleModule } from '@/components/study/MathModules';
import { LetterModule, WordModule, EnListenModule, EnSpeakModule } from '@/components/study/EnglishModules';

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
    { key: 'characters', label: '识字小能手', emoji: '✏️', desc: '按类别认字，看释义选字', Component: CharacterModule, color: 'bg-moko-rose' },
    { key: 'poems', label: '古诗诵读', emoji: '🌙', desc: '小学必背古诗词', Component: PoemModule, color: 'bg-moko-purple' },
    { key: 'trace', label: '描红练习', emoji: '✍️', desc: '跟着模板写一写', Component: TraceModule, color: 'bg-moko-pink' },
    { key: 'quiz', label: '识字闯关', emoji: '🎯', desc: '难度会自己调整哦', Component: CharacterQuizModule, color: 'bg-moko-rose' },
  ],
  math: [
    { key: 'count', label: '数感启蒙', emoji: '🔟', desc: '1~10 数一数', Component: NumberSenseModule, color: 'bg-moko-blue' },
    { key: 'compare', label: '比一比', emoji: '⚖️', desc: '比大小、比多少', Component: CompareModule, color: 'bg-moko-cyan' },
    { key: 'shape', label: '图形王国', emoji: '🔷', desc: '圆、方、角，认图形', Component: ShapeModule, color: 'bg-moko-mint' },
    { key: 'calc', label: '加减法闯关', emoji: '➕➖', desc: '难度会自己调整哦', Component: MathQuizModule, color: 'bg-moko-cyan' },
    { key: 'angle', label: '角的世界', emoji: '📐', desc: '锐角、直角、钝角', Component: AngleModule, color: 'bg-moko-blue' },
  ],
  english: [
    { key: 'letters', label: '字母乐园', emoji: '🔤', desc: 'A ~ Z 认读', Component: LetterModule, color: 'bg-moko-yellow' },
    { key: 'words', label: '单词世界', emoji: '📚', desc: '动物·食物·颜色…点读跟读', Component: WordModule, color: 'bg-moko-yellow' },
    { key: 'listen', label: '听音选词', emoji: '🎧', desc: '难度会自己调整哦', Component: EnListenModule, color: 'bg-moko-yellow' },
    { key: 'speak', label: '口语跟读', emoji: '🎙️', desc: '逐词挑战，评发音', Component: EnSpeakModule, color: 'bg-moko-violet' },
  ],
};

export const SUBJECT_META: Record<string, { label: string; emoji: string; color: string; sub: string }> = {
  chinese: { label: '语文城堡', emoji: '📖', color: 'text-moko-rose', sub: '爱心萌可陪你认字读诗' },
  math: { label: '数学星球', emoji: '🔢', color: 'text-moko-blue', sub: '正正萌可带你算算比一比' },
  english: { label: '英语乐园', emoji: '🔤', color: 'text-moko-yellow', sub: '唱唱萌可教你字母单词' },
};
