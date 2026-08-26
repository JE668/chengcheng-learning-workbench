import { getKysely, withTransaction } from '@/lib/db/kysely';
import { DB } from '@/lib/db/schema';
import { dateStr } from '@/lib/date';

type CastleRow = DB['castle_state'];
type MokoOwnedRow = DB['moko_owned'];
type InventoryRow = DB['inventory'];
type TroublemakerRow = DB['troublemakers'];
type GrowthEventRow = DB['growth_events'];
type DailyCheckinRow = DB['daily_checkins'];

export interface CastleState {
  childId: number;
  sunlight: number;
  starCoins: number;
  prosperity: number;
  streakDays: number;
  lastSettledDay: string | null;
  shieldEquipped: boolean;
  lastStolen: number;
  skin: string;
}

export interface MokoOwned {
  id: number;
  childId: number;
  mokoKey: string;
  subject: string | null;
  acquiredAt: string;
  stage: string;
  stageAt: string;
  mood: number;
  status: string;
  lastHarvestDay: string;
}

export interface InventoryItem {
  childId: number;
  itemKey: string;
  qty: number;
}

export interface HarvestResult {
  stars: number;
  newBalance: number;
  friendTotal: number;
}

export class CastleRepository {
  private db = getKysely();

  /** 获取城堡状态 */
  async getState(childId: number): Promise<CastleState | null> {
    const row = await this.db
      .selectFrom('castle_state')
      .selectAll()
      .where('child_id', '=', childId)
      .executeTakeFirst();
    return row ? this.toState(row) : null;
  }

  /** 初始化城堡状态（若不存在） */
  async ensureState(childId: number): Promise<CastleState> {
    const existing = await this.getState(childId);
    if (existing) return existing;

    const today = dateStr();
    return withTransaction(async (trx) => {
      await trx
        .insertInto('castle_state')
        .values({
          child_id: childId,
          sunlight: 0,
          star_coins: 0,
          prosperity: 0,
          streak_days: 0,
          last_settled_day: today,
          shield_equipped: 0,
          last_stolen: 0,
          skin: 'default',
        })
        .execute();

      // 初始化捕捉券
      await trx
        .insertInto('capture_tickets')
        .values({ child_id: childId, total: 0, used: 0 })
        .onConflict((oc) => oc.doNothing())
        .execute();

      return this.getState(childId).then(s => s!);
    });
  }

  /** 增加阳光 */
  async addSunlight(childId: number, amount: number): Promise<CastleState> {
    await this.ensureState(childId);
    const row = await this.db
      .updateTable('castle_state')
      .set({ sunlight: (eb) => eb('sunlight', '+', amount) })
      .where('child_id', '=', childId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return this.toState(row);
  }

  /** 收获星星币 */
  async harvestStars(childId: number): Promise<HarvestResult> {
    return withTransaction(async (trx) => {
      await this.ensureState(childId);

      const state = await trx
        .selectFrom('castle_state')
        .selectAll()
        .where('child_id', '=', childId)
        .forUpdate()
        .executeTakeFirstOrThrow();

      const friends = await trx
        .selectFrom('moko_owned')
        .select('id')
        .where('child_id', '=', childId)
        .where('status', '=', 'resident')
        .execute();

      const friendTotal = friends.length;
      const stars = friendTotal * 5;
      const today = dateStr();

      await trx
        .updateTable('castle_state')
        .set({
          star_coins: state.star_coins + stars,
          last_harvest_day: today,
        })
        .where('child_id', '=', childId)
        .execute();

      // 记录成长事件
      await trx
        .insertInto('growth_events')
        .values({
          child_id: childId,
          day: today,
          type: 'harvest',
          emoji: '⭐',
          title: '城堡收获',
          desc: `好朋友萌可送来 ${stars} 星星币`,
        })
        .execute();

      return { stars, newBalance: state.star_coins + stars, friendTotal };
    });
  }

  /** 兑换星星币 */
  async spendStarCoins(childId: number, amount: number): Promise<boolean> {
    const state = await this.getState(childId);
    if (!state || state.starCoins < amount) return false;

    await this.db
      .updateTable('castle_state')
      .set({ star_coins: state.starCoins - amount })
      .where('child_id', '=', childId)
      .execute();
    return true;
  }

  /** 切换城堡皮肤 */
  async setSkin(childId: number, skin: string): Promise<void> {
    await this.ensureState(childId);
    await this.db
      .updateTable('castle_state')
      .set({ skin })
      .where('child_id', '=', childId)
      .execute();
  }

  /** 装备/卸下护盾 */
  async setShield(childId: number, equipped: boolean): Promise<void> {
    await this.ensureState(childId);
    await this.db
      .updateTable('castle_state')
      .set({ shield_equipped: equipped ? 1 : 0 })
      .where('child_id', '=', childId)
      .execute();
  }

  /** 记录被偷阳光 */
  async recordStolen(childId: number, amount: number): Promise<void> {
    await this.ensureState(childId);
    const today = dateStr();
    await this.db
      .updateTable('castle_state')
      .set({
        sunlight: (eb) => eb('sunlight', '-', amount),
        last_stolen: amount,
        last_settled_day: today,
      })
      .where('child_id', '=', childId)
      .execute();
  }

  /** 获取已拥有的萌可 */
  async getOwnedMokos(childId: number): Promise<MokoOwned[]> {
    const rows = await this.db
      .selectFrom('moko_owned')
      .selectAll()
      .where('child_id', '=', childId)
      .execute();
    return rows.map(this.toMokoOwned);
  }

  /** 拥有萌可 */
  async obtainMoko(childId: number, mokoKey: string, subject: string | null = null): Promise<MokoOwned> {
    await this.ensureState(childId);
    const now = new Date().toISOString();

    const row = await this.db
      .insertInto('moko_owned')
      .values({
        child_id: childId,
        moko_key: mokoKey,
        subject,
        acquired_at: now,
        stage: 'obtained',
        stage_at: now,
        mood: 3,
        status: 'resident',
        last_harvest_day: '',
      })
      .onConflict((oc) => oc.column('child_id', 'moko_key').doUpdateSet({
        status: 'resident',
        stage: 'obtained',
        stage_at: now,
        mood: 3,
      }))
      .returningAll()
      .executeTakeFirstOrThrow();

    // 记录成长事件
    await this.db
      .insertInto('growth_events')
      .values({
        child_id: childId,
        day: dateStr(),
        type: 'capture',
        emoji: '🧸',
        title: '捕捉萌可',
        desc: `新萌可 ${mokoKey} 入驻城堡`,
      })
      .execute();

    return this.toMokoOwned(row);
  }

  /** 更新萌可心情/阶段 */
  async updateMokoMood(childId: number, mokoKey: string, mood: number): Promise<void> {
    await this.db
      .updateTable('moko_owned')
      .set({ mood })
      .where('child_id', '=', childId)
      .where('moko_key', '=', mokoKey)
      .execute();
  }

  /** 获取背包物品 */
  async getInventory(childId: number): Promise<InventoryItem[]> {
    const rows = await this.db
      .selectFrom('inventory')
      .selectAll()
      .where('child_id', '=', childId)
      .execute();
    return rows.map(r => ({ childId: r.child_id, itemKey: r.item_key, qty: r.qty }));
  }

  /** 增加背包物品 */
  async addInventoryItem(childId: number, itemKey: string, qty: number = 1): Promise<void> {
    await this.ensureState(childId);
    await this.db
      .insertInto('inventory')
      .values({ child_id: childId, item_key: itemKey, qty })
      .onConflict((oc) => oc.columns(['child_id', 'item_key']).doUpdateSet({
        qty: (eb) => eb('qty', '+', qty),
      }))
      .execute();
  }

  /** 使用背包物品 */
  async useInventoryItem(childId: number, itemKey: string, qty: number = 1): Promise<boolean> {
    const item = await this.db
      .selectFrom('inventory')
      .selectAll()
      .where('child_id', '=', childId)
      .where('item_key', '=', itemKey)
      .executeTakeFirst();

    if (!item || item.qty < qty) return false;

    const newQty = item.qty - qty;
    if (newQty > 0) {
      await this.db
        .updateTable('inventory')
        .set({ qty: newQty })
        .where('child_id', '=', childId)
        .where('item_key', '=', itemKey)
        .execute();
    } else {
      await this.db
        .deleteFrom('inventory')
        .where('child_id', '=', childId)
        .where('item_key', '=', itemKey)
        .execute();
    }
    return true;
  }

  /** 获取捣蛋萌可 */
  async getTroublemakers(childId: number): Promise<TroublemakerRow[]> {
    return this.db
      .selectFrom('troublemakers')
      .selectAll()
      .where('child_id', '=', childId)
      .where('resolved', '=', 0)
      .execute();
  }

  /** 添加捣蛋萌可 */
  async addTroublemaker(childId: number, mokoKey: string, day: string): Promise<void> {
    await this.db
      .insertInto('troublemakers')
      .values({ child_id: childId, moko_key: mokoKey, day, resolved: 0 })
      .execute();
  }

  /** 解决捣蛋萌可 */
  async resolveTroublemaker(childId: number, mokoKey: string): Promise<void> {
    await this.db
      .updateTable('troublemakers')
      .set({ resolved: 1 })
      .where('child_id', '=', childId)
      .where('moko_key', '=', mokoKey)
      .where('resolved', '=', 0)
      .execute();
  }

  /** 获取今日打卡状态 */
  async getTodayCheckins(childId: number, day: string): Promise<DailyCheckinRow[]> {
    return this.db
      .selectFrom('daily_checkins')
      .selectAll()
      .where('child_id', '=', childId)
      .where('day', '=', day)
      .execute();
  }

  /** 更新打卡状态 */
  async upsertCheckin(
    childId: number,
    day: string,
    subject: string,
    status: 'pending' | 'confirmed',
    childDoneAt?: string
  ): Promise<void> {
    await this.db
      .insertInto('daily_checkins')
      .values({
        child_id: childId,
        day,
        subject,
        status,
        child_done_at: childDoneAt,
        confirmed_at: status === 'confirmed' ? new Date().toISOString() : null,
      })
      .onConflict((oc) => oc.columns(['child_id', 'day', 'subject']).doUpdateSet({
        status,
        child_done_at: childDoneAt,
        confirmed_at: status === 'confirmed' ? new Date().toISOString() : null,
      }))
      .execute();
  }

  /** 获取成长事件 */
  async getGrowthEvents(childId: number, limit = 50): Promise<GrowthEventRow[]> {
    return this.db
      .selectFrom('growth_events')
      .selectAll()
      .where('child_id', '=', childId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .execute();
  }

  private toState(row: CastleRow): CastleState {
    return {
      childId: row.child_id,
      sunlight: row.sunlight,
      starCoins: row.star_coins,
      prosperity: row.prosperity,
      streakDays: row.streak_days,
      lastSettledDay: row.last_settled_day,
      shieldEquipped: row.shield_equipped === 1,
      lastStolen: row.last_stolen,
      skin: row.skin,
    };
  }

  private toMokoOwned(row: MokoOwnedRow): MokoOwned {
    return {
      id: row.id,
      childId: row.child_id,
      mokoKey: row.moko_key,
      subject: row.subject,
      acquiredAt: row.acquired_at,
      stage: row.stage,
      stageAt: row.stage_at,
      mood: row.mood,
      status: row.status,
      lastHarvestDay: row.last_harvest_day,
    };
  }
}

export const castleRepo = new CastleRepository();