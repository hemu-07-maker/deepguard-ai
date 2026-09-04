import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]', 'utf8');
}

export function readUsers() {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

export function writeUsers(users) {
  ensure();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

export function findByEmail(email) {
  const e = email.toLowerCase().trim();
  return readUsers().find((u) => u.email === e) || null;
}

export function createUser({ email, passwordHash, name }) {
  const users = readUsers();
  const e = email.toLowerCase().trim();
  if (users.some((u) => u.email === e)) {
    throw new Error('Email already registered');
  }
  const user = {
    id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    email: e,
    name: name || e.split('@')[0],
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  return { id: user.id, email: user.email, name: user.name };
}
