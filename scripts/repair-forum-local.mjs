/** Explicit local-only repair. Production schema changes remain owned by Drizzle. */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const columns = (db, table) => db.prepare(`PRAGMA table_info(${table})`).all();

export function repairForum(db, migrations) {
  db.exec('BEGIN IMMEDIATE');
  try {
    let posts = columns(db, 'forum_posts');
    let archived = null;
    if (posts.length && (!posts.some(column => column.name === 'user_id') || posts.find(column => column.name === 'id')?.type.toUpperCase() !== 'TEXT')) {
      const count = db.prepare('SELECT COUNT(*) AS n FROM forum_posts').get().n;
      if (count !== 0) throw new Error('旧论坛包含帖子，需先确认 author_key 与账号的映射；未修改任何数据。');
      archived = `forum_posts_legacy_${Date.now()}`;
      db.exec(`ALTER TABLE forum_posts RENAME TO ${archived}`);
      posts = [];
    }
    if (posts.length) {
      const actual = new Set(posts.map(column => column.name));
      for (const name of ['id', 'user_id', 'request_id', 'content', 'status', 'is_deleted', 'created_at', 'updated_at']) {
        if (!actual.has(name)) throw new Error(`论坛结构无法自动修复：缺少 ${name}，未修改任何数据。`);
      }
    }
    // Reuse existing, immutable migration SQL; skip only objects already present.
    for (const statement of migrations[0].split('--> statement-breakpoint').map(sql => sql.trim()).filter(Boolean)) {
      const table = statement.match(/^CREATE TABLE `(forum_posts|forum_user_stats)`/);
      if (table && columns(db, table[1]).length) continue;
      if (/^PRAGMA optimize/i.test(statement)) continue;
      db.exec(statement.replace(/^CREATE (UNIQUE )?INDEX /, 'CREATE $1INDEX IF NOT EXISTS '));
    }
    for (const statement of migrations[1].split('--> statement-breakpoint').map(sql => sql.trim()).filter(Boolean)) {
      const name = statement.match(/ADD `(category|resolved)`/)?.[1];
      if (!name) throw new Error('无法识别的论坛迁移语句。');
      if (!columns(db, 'forum_posts').some(column => column.name === name)) db.exec(statement);
    }
    const stats = new Set(columns(db, 'forum_user_stats').map(column => column.name));
    if (['user_id','post_count','first_post_at','last_post_at','updated_at'].some(name => !stats.has(name))) throw new Error('论坛统计表需人工迁移，未修改任何数据。');
    db.exec('COMMIT');
    return { archived, posts: db.prepare('SELECT COUNT(*) AS n FROM forum_posts').get().n };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const directory = realpathSync(join(root, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject'));
  const candidates = readdirSync(directory).filter(name => /^[a-f0-9]+\.sqlite$/.test(name));
  if (candidates.length !== 1) throw new Error('无法唯一确定本地 D1 数据库，停止操作。');
  const filename = realpathSync(join(directory, candidates[0]));
  if (!filename.startsWith(directory + sep)) throw new Error('数据库路径不在本地 D1 目录内。');
  const db = new DatabaseSync(filename);
  try {
    db.exec('PRAGMA busy_timeout=5000');
    const backup = `${filename}.forum-backup-${Date.now()}`;
    // SQLite generates a consistent snapshot, including committed WAL contents.
    db.prepare('VACUUM INTO ?').run(backup);
    console.log('Backup:', backup);
    const migrations = ['0010_equal_orphan.sql', '0011_boring_toad.sql'].map(name => readFileSync(join(root, 'drizzle', name), 'utf8'));
    console.log('Repair:', repairForum(db, migrations));
    db.exec('PRAGMA optimize');
  } finally { db.close(); }
}
