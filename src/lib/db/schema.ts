import { Kysely, sql } from 'kysely';

/**
 * 数据库 Schema 类型定义
 * 与 src/lib/schema.ts 的建表语句保持同步
 * 运行 `pnpm db:generate` 可从现有数据库自动生成
 */
export interface DB {
  users: {
    id: number;
    username: string;
    password_hash: string;
    role: 'parent' | 'child';
    display_name: string;
    parent_id: number | null;
    selected_child_id: number | null;
    cert_pref: string | null;
    created_at: string;
  };
  sessions: {
    token: string;
    user_id: number;
    created_at: string;
  };
  tasks: {
    id: number;
    title: string;
    subject: string;
    description: string | null;
    points: number;
    created_by: number;
    created_at: string;
  };
  completions: {
    id: number;
    task_id: number | null;
    child_id: number;
    points: number;
    source: string | null;
    created_at: string;
  };
  redemptions: {
    id: number;
    child_id: number;
    reward_name: string;
    cost: number;
    status: 'pending' | 'approved' | 'rejected';
    created_by: number;
    created_at: string;
  };
  wishes: {
    id: number;
    child_id: number;
    text: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
  };
  castle_state: {
    child_id: number;
    sunlight: number;
    star_coins: number;
    prosperity: number;
    streak_days: number;
    last_settled_day: string | null;
    shield_equipped: number;
    last_stolen: number;
    skin: string;
  };
  moko_owned: {
    id: number;
    child_id: number;
    moko_key: string;
    subject: string | null;
    acquired_at: string;
    stage: string;
    stage_at: string;
    mood: number;
    status: string;
    last_harvest_day: string;
  };
  daily_checkins: {
    id: number;
    child_id: number;
    day: string;
    subject: string;
    status: string;
    child_done_at: string | null;
    confirmed_at: string | null;
  };
  inventory: {
    id: number;
    child_id: number;
    item_key: string;
    qty: number;
  };
  troublemakers: {
    id: number;
    child_id: number;
    moko_key: string;
    day: string;
    resolved: number;
    created_at: string;
  };
  mistakes: {
    id: number;
    child_id: number;
    subject: string;
    kind: string;
    prompt: string;
    answer: string;
    wrong: string | null;
    created_at: string;
    next_review: string;
    interval_days: number;
    reps: number;
    easiness_factor: number;
    resolved: number;
    source_module: string | null;
    chapter: string | null;
  };
  growth_events: {
    id: number;
    child_id: number;
    day: string;
    type: string;
    emoji: string;
    title: string;
    desc: string | null;
    created_at: string;
  };
  story_progress: {
    id: number;
    child_id: number;
    chapter_id: string;
    captured_at: string;
  };
  daily_practice: {
    child_id: number;
    day: string;
    completed: number;
    correct: number;
    total: number;
    questions: string | null;
    completed_at: string | null;
    streak_rewarded: number;
  };
  capture_tickets: {
    child_id: number;
    total: number;
    used: number;
  };
  story_read: {
    id: number;
    child_id: number;
    chapter_id: string;
    read_at: string;
  };
  story_quiz: {
    id: number;
    child_id: number;
    chapter_id: string;
    passed_at: string;
  };
  cert_requests: {
    id: number;
    child_id: number;
    status: string;
    created_at: string;
    decided_at: string | null;
  };
  module_progress: {
    id: number;
    child_id: number;
    subject: string;
    module_key: string;
    stars: number;
    rounds: number;
    last_played: string;
  };
  child_tasks: {
    id: number;
    child_id: number;
    task_key: string;
    done: number;
    done_at: string;
  };
  textbook_progress: {
    id: number;
    child_id: number;
    book_key: string;
    chapter_idx: number;
    updated_at: string;
  };
}

/** Kysely 实例类型 */
export type KyselyDB = Kysely<DB>;

/** 事务类型 */
export type Transaction = Kysely<DB>['transaction'];

/** 数据库方言配置 */
export const dialect = 'sqlite' as const;