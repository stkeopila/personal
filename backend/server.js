const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*)?\s*$/);
      if (!m) return;
      const key = m[1].trim();
      let val = m[2] || '';
      val = val.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
      process.env[key] = val;
    });
  }
} catch (e) {}

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'tracker';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const PORT = process.env.PORT || 4000;

let usersColl;

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  usersColl = db.collection('users');
  await usersColl.createIndex({ username: 1 }, { unique: true });

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.post('/api/register', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    try {
      const saltRounds = 10;
      const hash = await bcrypt.hash(password, saltRounds);
      const result = await usersColl.insertOne({ username, passwordHash: hash, createdAt: new Date() });
      res.status(201).json({ id: result.insertedId.toString(), username });
    } catch (e) {
      if (e.code === 11000) return res.status(409).json({ error: 'username already exists' });
      console.error(e);
      res.status(500).json({ error: 'internal error' });
    }
  });

  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const user = await usersColl.findOne({ username });
    if (!user) return res.status(401).json({ error: 'User Not Found' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Wrong Username or Password' });
    const token = jwt.sign({ id: user._id.toString(), username: user.username }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, user: { id: user._id.toString(), username: user.username } });
  });

  function authMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer (.+)$/);
    if (!match) return res.status(401).json({ error: 'missing token' });
    const token = match[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      next();
    } catch (e) {
      return res.status(401).json({ error: 'invalid token' });
    }
  }

  app.get('/api/me', authMiddleware, async (req, res) => {
    try {
      const user = await usersColl.findOne({ _id: new ObjectId(req.user.id) }, { projection: { passwordHash: 0 } });
      if (!user) return res.status(404).json({ error: 'user not found' });
      res.json({ id: user._id.toString(), username: user.username });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'internal error' });
    }
  });

  app.listen(PORT, () => console.log(`Auth server listening on http://localhost:${PORT}`));
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
