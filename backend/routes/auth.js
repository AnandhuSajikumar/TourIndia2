import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import path from 'path'
import { fileURLToPath } from 'url'

const router = Router()

// Setup SQLite database (backend/data/app.db) OR fallback to JSON file store
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbDir = path.join(__dirname, '..', 'data')
const dbPath = path.join(dbDir, 'app.db')
let db = null
let insertUser = null
let getUserByEmail = null

try {
  // Try to dynamically import the native better-sqlite3 package.
  // Using dynamic import prevents module-load-time crashes when the package
  // isn't installed (common on Windows without build tools).
  const { default: Database } = await import('better-sqlite3')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      hash TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run()
  // Keep the same prepared-statement-like API (`.run` / `.get`) used below
  insertUser = db.prepare('INSERT INTO users (email, hash, name, role) VALUES (?, ?, ?, ?)')
  getUserByEmail = db.prepare('SELECT id, email, hash, name, role, created_at FROM users WHERE email = ?')
  console.log('Using better-sqlite3 backend for users:', dbPath)
} catch (e) {
  console.warn('better-sqlite3 not available or failed to initialize — falling back to JSON file user store. Error:', e && e.message)
  // Fallback: simple JSON file store so the server can run without native build tools
  const fs = await import('fs')
  const fsSync = fs.promises || fs.defaultPromises || fs
  const usersFile = path.join(dbDir, 'users.json')
  // ensure data dir exists
  try {
    await fsSync.mkdir(dbDir, { recursive: true })
  } catch (err) {
    // ignore
  }
  // load or initialize
  let users = []
  try {
    const raw = await fsSync.readFile(usersFile, 'utf8')
    users = JSON.parse(raw || '[]')
  } catch (_) {
    users = []
    try { await fsSync.writeFile(usersFile, JSON.stringify(users, null, 2)) } catch (_) {}
  }

  // implement prepared-statement-like shims used by the rest of the module
  insertUser = {
    run: (email, hash, name, role) => {
      const id = users.length ? (users[users.length - 1].id || users.length) + 1 : 1
      const record = { id, email, hash, name, role: role || 'user', created_at: new Date().toISOString() }
      users.push(record)
      try { fsSync.writeFile(usersFile, JSON.stringify(users, null, 2)) } catch (_) {}
      return { lastInsertRowid: id }
    }
  }
  getUserByEmail = {
    get: (email) => {
      return users.find(u => u.email && u.email.toLowerCase() === (email && email.toLowerCase())) || null
    }
  }
  console.log('Using JSON file user store at', usersFile)
}

router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  const existing = getUserByEmail.get(email)
  if (existing) return res.status(400).json({ error: 'user exists' })
  // If registering as admin, require ADMIN_SECRET env var for safety
  if (role === 'admin') {
    const secret = process.env.ADMIN_SECRET || ''
    if (!req.body.adminSecret || req.body.adminSecret !== secret) {
      return res.status(403).json({ error: 'admin creation requires valid ADMIN_SECRET' })
    }
  }
  const hash = await bcrypt.hash(password, 10)
  try {
    insertUser.run(email, hash, name || null, role === 'admin' ? 'admin' : 'user')
    return res.json({ ok: true })
  } catch (e) {
    console.error('Register error:', e.message)
    return res.status(500).json({ error: 'failed to create user' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  const row = getUserByEmail.get(email)
  if (!row) return res.status(401).json({ error: 'invalid credentials' })
  const passOk = await bcrypt.compare(password, row.hash)
  if (!passOk) return res.status(401).json({ error: 'invalid credentials' })
  const token = jwt.sign({ sub: row.email, role: row.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })
  res.json({ token, user: { email: row.email, name: row.name, role: row.role } })
})

export default router


