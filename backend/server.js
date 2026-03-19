const fs = require('fs');
const path = require('path');

try {
  const envCandidates = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '.env'),
  ];
  envCandidates.forEach((envPath) => {
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*)?\s*$/);
      if (!m) return;
      const key = m[1].trim();
      let val = m[2] || '';
      val = val.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
      process.env[key] = val;
    });
  });
} catch (e) {}

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'tracker';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const PORT = process.env.PORT || 3000;

let usersColl;
let goalsColl;
let eventsColl;

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  usersColl = db.collection('users');
  goalsColl = db.collection('goals');
  eventsColl = db.collection('events');
  await usersColl.createIndex({ username: 1 }, { unique: true });
  await goalsColl.createIndex({ userId: 1 });
  await eventsColl.createIndex({ userId: 1, date: 1 });

  const app = express();
  app.use(cors());
  app.use(express.json());

  try {
    const staticDir = process.env.STATIC_DIR || '../frontend/dist';
    const absStatic = path.resolve(__dirname, staticDir);
    if (fs.existsSync(absStatic)) {
      app.use(express.static(absStatic));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
        res.sendFile(path.join(absStatic, 'index.html'));
      });
    }
  } catch (e) {}

  const preferredUploadDir = path.resolve(__dirname, process.env.IMAGE_UPLOAD_DIR || 'uploads');
  const fallbackUploadDir = path.resolve(__dirname, 'uploads');
  let uploadDir = preferredUploadDir;
  try {
    fs.mkdirSync(preferredUploadDir, { recursive: true });
    fs.accessSync(preferredUploadDir, fs.constants.W_OK);
  } catch (e) {
    uploadDir = fallbackUploadDir;
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
      fs.accessSync(uploadDir, fs.constants.W_OK);
      console.warn(`Upload dir not writable: ${preferredUploadDir}. Using fallback: ${uploadDir}`);
    } catch (e2) {
      console.error('No writable upload directory available', e2);
    }
  }
  const uploadServeDirs = Array.from(new Set([
    uploadDir,
    preferredUploadDir,
    fallbackUploadDir,
    path.resolve(process.cwd(), 'uploads'),
  ]));
  uploadServeDirs.forEach((dir) => {
    try {
      if (!fs.existsSync(dir)) return;
      app.use('/uploads', express.static(dir));
      app.use('/api/uploads', express.static(dir));
    } catch (e) {
    }
  });
  console.log(`Serving uploads from: ${uploadServeDirs.join(', ')}`);
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_')}`),
  });
  const upload = multer({ storage });

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.post('/api/register', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    try {
      const saltRounds = 10;
      const hash = await bcrypt.hash(password, saltRounds);
      const result = await usersColl.insertOne({ username, passwordHash: hash, createdAt: new Date(), streakCount: 0, lastStreakDate: null });
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
      res.json({ id: user._id.toString(), username: user.username, streakCount: user.streakCount || 0, lastStreakDate: user.lastStreakDate || null });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'internal error' });
    }
  });

  app.get('/api/goals', authMiddleware, async (req, res) => {
    try {
      const docs = await goalsColl.find({ userId: req.user.id }).toArray();
      res.json(docs.map(d => ({ id: d._id.toString(), title: d.title, notes: d.notes, deadline: d.deadline || null, imageUrl: d.imageUrl || null, createdAt: d.createdAt, completed: d.completed || false })));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'internal error' });
    }
  });

  app.post('/api/goals', authMiddleware, async (req, res) => {
    try {
      const { title, notes, deadline, imageUrl } = req.body || {};
      if (!title) return res.status(400).json({ error: 'title required' });
      const doc = { userId: req.user.id, title, notes: notes || '', deadline: deadline || null, imageUrl: imageUrl || null, createdAt: new Date() };
      const result = await goalsColl.insertOne(doc);
      try { await updateStreak(req.user.id); } catch (e) { console.error('streak update failed', e); }
      res.status(201).json({ id: result.insertedId.toString(), ...doc });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'internal error' });
    }
  });

  app.post('/api/upload', authMiddleware, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'no file' });
      const url = `/api/uploads/${req.file.filename}`;
      res.json({ url });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'upload failed' });
    }
  });

  app.use((err, req, res, next) => {
    if (err && err.name && err.name.startsWith('Multer')) {
      return res.status(400).json({ error: err.message || 'upload failed' });
    }
    return next(err);
  });

  app.put('/api/goals/:id', authMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const { title, notes, deadline, imageUrl } = req.body || {};
      const update = {};
      if (title !== undefined) update.title = title;
      if (notes !== undefined) update.notes = notes;
      if (deadline !== undefined) update.deadline = deadline;
      if (imageUrl !== undefined) update.imageUrl = imageUrl;
      if (Object.keys(update).length === 0) return res.status(400).json({ error: 'nothing to update' });
      update.updatedAt = new Date();
      const result = await goalsColl.findOneAndUpdate({ _id: new ObjectId(id), userId: req.user.id }, { $set: update }, { returnDocument: 'after' });
      if (!result.value) return res.status(404).json({ error: 'not found' });
      res.json({ id: result.value._id.toString(), ...result.value });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'internal error' });
    }
  });

  app.post('/api/goals/:id/complete', authMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const { imageUrl, date } = req.body || {};
      const completedAt = new Date();
      const update = { completed: true, completedAt };
      if (imageUrl !== undefined) update.imageUrl = imageUrl;
      const result = await goalsColl.findOneAndUpdate({ _id: new ObjectId(id), userId: req.user.id }, { $set: update }, { returnDocument: 'after' });
      if (!result.value) return res.status(404).json({ error: 'not found' });
      try { await updateStreak(req.user.id); } catch (e) { console.error('streak update failed', e); }

      try {
        const eventDate = date || completedAt.toISOString().slice(0,10);
        const text = `Completed goal: ${result.value.title}`;
        const eventDoc = { userId: req.user.id, date: eventDate, text, createdAt: new Date(), goalId: id };
        if (imageUrl) eventDoc.imageUrl = imageUrl;
        await eventsColl.insertOne(eventDoc);
      } catch (e) {
        console.error('failed to create completion event', e);
      }

      res.json({ id: result.value._id.toString(), ...result.value });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'internal error' });
    }
  });

  app.delete('/api/goals/:id', authMiddleware, async (req, res) => {
    try {
      const id = req.params.id;
      const result = await goalsColl.deleteOne({ _id: new ObjectId(id), userId: req.user.id });
      if (result.deletedCount === 0) return res.status(404).json({ error: 'not found' });
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'internal error' });
    }
  });

  app.get('/api/events', authMiddleware, async (req, res) => {
    try {
      const docs = await eventsColl.find({ userId: req.user.id }).toArray();
      res.json(docs.map(d => ({ ...d, id: d._id.toString() })));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'internal error' });
    }
  });

  app.post('/api/events', authMiddleware, async (req, res) => {
    try {
      const { date, text } = req.body || {};
      if (!date || !text) return res.status(400).json({ error: 'date and text required' });
      const doc = { userId: req.user.id, date, text, createdAt: new Date() };
      const result = await eventsColl.insertOne(doc);
      res.status(201).json({ id: result.insertedId.toString(), ...doc });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'internal error' });
    }
  });

  async function updateStreak(userId) {
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    const user = await usersColl.findOne({ _id: new ObjectId(userId) });
    if (!user) return;
    const last = user.lastStreakDate || null;
    let newCount = 1;
    if (last === todayKey) {
      return;
    }
    if (last) {
      try {
        const lastDate = new Date(last + 'T00:00:00Z');
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = yesterday.toISOString().slice(0, 10);
        if (last === yesterdayKey) {
          newCount = (user.streakCount || 0) + 1;
        }
      } catch (e) {
      }
    }
    await usersColl.updateOne({ _id: new ObjectId(userId) }, { $set: { lastStreakDate: todayKey, streakCount: newCount } });
  }

  app.listen(PORT, () => console.log(`Auth server listening on http://localhost:${PORT}`));
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
