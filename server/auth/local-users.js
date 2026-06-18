const crypto = require('crypto');

let db = null;

const HASH_ITERATIONS = 120000;
const HASH_KEY_LENGTH = 32;
const HASH_DIGEST = 'sha256';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(String(password), salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_DIGEST).toString('hex');
  return `pbkdf2:${HASH_DIGEST}:${HASH_ITERATIONS}:${salt}:${hash}`;
}

function verifyPassword(password, passwordHash) {
  const parts = String(passwordHash || '').split(':');
  if (parts.length !== 5 || parts[0] !== 'pbkdf2') return false;
  const [, digest, iterationsRaw, salt, expected] = parts;
  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;
  const actual = crypto.pbkdf2Sync(String(password), salt, iterations, Buffer.from(expected, 'hex').length, digest).toString('hex');
  const left = Buffer.from(actual, 'hex');
  const right = Buffer.from(expected, 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function normalizeUser(user) {
  return {
    username: String(user.username || '').trim(),
    name: user.name ? String(user.name) : String(user.username || '').trim(),
    email: user.email ? String(user.email) : null,
    role: user.role ? String(user.role) : 'admin'
  };
}

function init(database, initialUsers = []) {
  db = database;
  db.exec(`
    CREATE TABLE IF NOT EXISTS local_users (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const count = db.prepare('SELECT COUNT(*) as count FROM local_users').get().count;
  if (count === 0) {
    const users = initialUsers.length > 0
      ? initialUsers
      : [{ username: 'admin', password: 'admin', name: 'Administrator', role: 'admin' }];
    for (const user of users) {
      create(user);
    }
  }
}

function list() {
  return db.prepare(`
    SELECT username, name, email, role, created_at, updated_at
    FROM local_users
    ORDER BY username
  `).all();
}

function get(username) {
  return db.prepare(`
    SELECT username, name, email, role, created_at, updated_at
    FROM local_users
    WHERE username = ?
  `).get(username);
}

function getWithPassword(username) {
  return db.prepare('SELECT * FROM local_users WHERE username = ?').get(username);
}

function create(user) {
  const normalized = normalizeUser(user);
  if (!normalized.username) throw new Error('username is required');
  if (!user.password) throw new Error('password is required');

  db.prepare(`
    INSERT INTO local_users (username, password_hash, name, email, role, updated_at)
    VALUES (@username, @password_hash, @name, @email, @role, CURRENT_TIMESTAMP)
  `).run({
    ...normalized,
    password_hash: hashPassword(user.password)
  });

  return get(normalized.username);
}

function update(username, changes) {
  const existing = get(username);
  if (!existing) return null;

  const next = {
    username,
    name: changes.name !== undefined ? String(changes.name || username) : existing.name,
    email: changes.email !== undefined && changes.email !== '' ? String(changes.email) : null,
    role: changes.role !== undefined ? String(changes.role || 'admin') : existing.role,
  };

  db.prepare(`
    UPDATE local_users
    SET name = @name, email = @email, role = @role, updated_at = CURRENT_TIMESTAMP
    WHERE username = @username
  `).run(next);

  if (changes.password) {
    setPassword(username, changes.password);
  }

  return get(username);
}

function setPassword(username, password) {
  db.prepare(`
    UPDATE local_users
    SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
    WHERE username = ?
  `).run(hashPassword(password), username);
}

function remove(username) {
  const count = db.prepare('SELECT COUNT(*) as count FROM local_users').get().count;
  if (count <= 1) {
    throw new Error('cannot delete the last local user');
  }
  return db.prepare('DELETE FROM local_users WHERE username = ?').run(username).changes;
}

function authenticate(username, password) {
  const user = getWithPassword(username);
  if (!user || !verifyPassword(password, user.password_hash)) return null;
  return {
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

module.exports = {
  init,
  list,
  get,
  create,
  update,
  remove,
  authenticate
};
