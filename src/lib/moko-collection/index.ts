// 自动生成：由 scripts 按「季/文件夹」拆分扫描 public/moko/collection/ 生成，请勿手改。
// 重新生成：node scripts/gen-moko-collection.cjs
import type { MokoChar, MokoCategoryKey } from '../types';

import { mokoCollection_01 } from './by-season/01';
import { mokoCollection_02 } from './by-season/02';
import { mokoCollection_03 } from './by-season/03';
import { mokoCollection_04 } from './by-season/04';
import { mokoCollection_05 } from './by-season/05';
import { mokoCollection_06 } from './by-season/06';
import { mokoCollection_07 } from './by-season/07';
import { mokoCollection_08 } from './by-season/08';
import { mokoCollection_09 } from './by-season/09';
import { mokoCollection_10 } from './by-season/10';

export interface MokoCollectionCat {
  key: MokoCategoryKey;
  label: string;
  emoji: string;
  color: string;
  desc: string;
}

/** 本次新增的季分类（需并入 MOko_CATEGORIES） */
export const COLLECTION_CATEGORIES: MokoCollectionCat[] = [
  {
    "key": "mo",
    "label": "魔方萌可",
    "emoji": "🧊",
    "color": "text-moko-cyan",
    "desc": "第一、二季的魔法萌可"
  },
  {
    "key": "prince",
    "label": "王子萌可",
    "emoji": "🤴",
    "color": "text-moko-blue",
    "desc": "守护王国的王子们"
  },
  {
    "key": "villain",
    "label": "反派萌可",
    "emoji": "😈",
    "color": "text-slate-500",
    "desc": "搞怪的反派与神秘角色"
  },
  {
    "key": "legend",
    "label": "传奇萌可",
    "emoji": "🌟",
    "color": "text-moko-gold",
    "desc": "传说中的特别萌可"
  }
];

/** 全部萌可图片（由 public/moko/collection 扫描生成，key 以 col_ 前缀，category 见上） */
export const mokoCollection: MokoChar[] = [
  ...mokoCollection_01,
  ...mokoCollection_02,
  ...mokoCollection_03,
  ...mokoCollection_04,
  ...mokoCollection_05,
  ...mokoCollection_06,
  ...mokoCollection_07,
  ...mokoCollection_08,
  ...mokoCollection_09,
  ...mokoCollection_10
];

// 大数据表拆至独立文件，这里做再导出以保持原有导入路径不变（barrel）。
export { mokoCollectionByName } from './by-name';
export { COLLECTIBLE_MOKO_NAMES } from './collectible-names';
