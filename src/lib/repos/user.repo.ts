import { getKysely, withTransaction } from '@/lib/db/kysely';
import { DB } from '@/lib/db/schema';
import type { User } from '@/lib/types';

type UserRow = DB['users'];
type UserInsert = Omit<UserRow, 'id' | 'created_at'>;
type UserUpdate = Partial<UserInsert>;

export class UserRepository {
  private db = getKysely();

  /** 查找用户 */
  async findById(id: number): Promise<User | null> {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? this.toUser(row) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where('username', '=', username)
      .executeTakeFirst();
    return row ? this.toUser(row) : null;
  }

  async findChildrenByParent(parentId: number): Promise<User[]> {
    const rows = await this.db
      .selectFrom('users')
      .selectAll()
      .where('parent_id', '=', parentId)
      .where('role', '=', 'child')
      .execute();
    return rows.map(this.toUser);
  }

  /** 创建用户 */
  async create(user: UserInsert): Promise<User> {
    return withTransaction(async (trx) => {
      const result = await trx
        .insertInto('users')
        .values(user)
        .returningAll()
        .executeTakeFirstOrThrow();
      return this.toUser(result);
    });
  }

  /** 更新用户 */
  async update(id: number, patch: UserUpdate): Promise<User | null> {
    const result = await this.db
      .updateTable('users')
      .set(patch)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    return result ? this.toUser(result) : null;
  }

  /** 更新选中的孩子 */
  async setSelectedChild(parentId: number, childId: number | null): Promise<void> {
    await this.db
      .updateTable('users')
      .set({ selected_child_id: childId })
      .where('id', '=', parentId)
      .execute();
  }

  /** 修改密码 */
  async updatePassword(id: number, passwordHash: string): Promise<void> {
    await this.db
      .updateTable('users')
      .set({ password_hash: passwordHash })
      .where('id', '=', id)
      .execute();
  }

  /** 删除用户（级联清理） */
  async delete(id: number): Promise<void> {
    await withTransaction(async (trx) => {
      // 删除关联数据
      await trx.deleteFrom('sessions').where('user_id', '=', id).execute();
      await trx.deleteFrom('tasks').where('created_by', '=', id).execute();
      await trx.deleteFrom('completions').where('child_id', '=', id).execute();
      await trx.deleteFrom('redemptions').where('child_id', '=', id).execute();
      await trx.deleteFrom('wishes').where('child_id', '=', id).execute();
      await trx.deleteFrom('castle_state').where('child_id', '=', id).execute();
      await trx.deleteFrom('moko_owned').where('child_id', '=', id).execute();
      await trx.deleteFrom('daily_checkins').where('child_id', '=', id).execute();
      await trx.deleteFrom('inventory').where('child_id', '=', id).execute();
      await trx.deleteFrom('troublemakers').where('child_id', '=', id).execute();
      await trx.deleteFrom('mistakes').where('child_id', '=', id).execute();
      await trx.deleteFrom('growth_events').where('child_id', '=', id).execute();
      await trx.deleteFrom('story_progress').where('child_id', '=', id).execute();
      await trx.deleteFrom('daily_practice').where('child_id', '=', id).execute();
      await trx.deleteFrom('capture_tickets').where('child_id', '=', id).execute();
      await trx.deleteFrom('story_read').where('child_id', '=', id).execute();
      await trx.deleteFrom('story_quiz').where('child_id', '=', id).execute();
      await trx.deleteFrom('cert_requests').where('child_id', '=', id).execute();
      await trx.deleteFrom('module_progress').where('child_id', '=', id).execute();
      await trx.deleteFrom('child_tasks').where('child_id', '=', id).execute();
      await trx.deleteFrom('textbook_progress').where('child_id', '=', id).execute();
      // 最后删除用户
      await trx.deleteFrom('users').where('id', '=', id).execute();
    });
  }

  private toUser(row: UserRow): User {
    return {
      id: row.id,
      username: row.username,
      role: row.role,
      displayName: row.display_name,
    };
  }
}

export const userRepo = new UserRepository();