require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3001;
const CASES_FILE = path.join(__dirname, 'cases.json');
const IMAGES_DIR = path.join(__dirname, 'images');
const LOTTIE_DIR = path.join(__dirname, 'lottie');
const DB_PATH = path.join(__dirname, 'chat.db');

const FIREWORKS_API_KEY = process.env.FIREWORKS_API_KEY;
const FIREWORKS_MODEL = 'accounts/fireworks/models/deepseek-v4-pro';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
if (!fs.existsSync(LOTTIE_DIR)) fs.mkdirSync(LOTTIE_DIR, { recursive: true });

// ── SQLite ──
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  );
  CREATE TABLE IF NOT EXISTS rag_knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_conversations_visitor ON conversations(visitor_id);
`);

// seed admin password hash
const adminHash = bcrypt.hashSync(ADMIN_PASSWORD, 12);

// seed default RAG knowledge if empty
const ragCount = db.prepare('SELECT COUNT(*) as c FROM rag_knowledge').get().c;
if (ragCount === 0) {
  const insertRag = db.prepare('INSERT INTO rag_knowledge (question, answer, keywords) VALUES (?, ?, ?)');
  const defaultRag = [
    ['Какие услуги вы предлагаете?', 'Дмитрий делает:\n• Дизайн и разработка сайтов\n• UI/UX дизайн\n• Telegram-боты и Mini Apps\n• AI-интеграция для бизнеса\n• Поддержка и развитие проектов\nРаботает один, без наценок.', 'услуги сервис дизайн разработка бот мини апп'],
    ['Сколько стоит разработка сайта?', 'Зависит от типа проекта:\n• Лендинг — от 40 000 ₽\n• Корпоративный сайт — от 80 000 ₽\n• Интернет-магазин — от 100 000 ₽\n• Telegram-бот — от 10 000 ₽\n• Mini App — от 20 000 ₽\n• AI-подключение — от 20 000 ₽\nТочную сумму скажу после брифа. Без наценок.', 'стоимость цена деньги руб сколько стоит'],
    ['Какие сроки разработки?', 'Сроки зависят от ТЗ. Обсуждаем задачу — называю точные дедлайны. Обычно от 1 недели.', 'сроки время сколько ждать когда готово'],
    ['Как происходит оплата?', 'Принимаю оплату любыми способами: карта, банковский перевод, крипто. Работаю по предоплате. По желанию заключаю договор.', 'оплата деньги предоплата договор карта перевод крипто'],
    ['Как связаться в Telegram?', 'Telegram — @dmitryavva. Пишите, обсудим ваш проект! Отвечаю быстро.', 'телеграм telegram связаться контакт написать связь'],
    ['Кто вы?', 'Дмитрий Аввакумов — дизайнер-разработчик из Сочи. Опыт более 6 лет. Работал в Yandex. Создаю сайты, Telegram-боты, Mini Apps и внедряю AI. Не студия — работаю один, без наценок.', 'кто вы о себе дмитрий аввакумов bajgart'],
    ['Где вы находитесь?', 'Нахожусь в Сочи, но работаю удалённо с клиентами по всей России и за рубежом.', 'город адрес офис местоположение где сочи'],
    ['Как происходит работа?', 'Процесс:\n1. Бриф и обсуждение задачи\n2. Прототипирование и дизайн\n3. Разработка и тестирование\n4. Запуск и поддержка\nНа каждом этапе видите результат и можете вносить правки.', 'процесс работа этапы как работает ход'],
    ['На каких технологиях работаете?', 'React, Next.js, HTML/CSS, Figma, Photoshop, Premiere Pro, After Effects. Современный стек для быстрых и надёжных решений.', 'технологии стек react next js figma инструменты'],
    ['Какие гарантии?', 'По желанию заключаю договор. Гарантирую качество — работаю без наценок, лично отвечаю за каждый проект.', 'гарантии договор ответственность'],
    ['Чем вы отличаетесь от студий?', 'Я не студия — я Дмитрий Аввакумов, работаю один. Это значит: без наценок, прямая коммуникация, лично отвечаю за результат. Опыт 6+ лет, включая работу в Yandex.', 'отличие преимущества почему выбрать не студия наценки'],
    ['Что такое AI-интеграция?', 'Внедрение искусственного интеллекта в бизнес:\n• Чат-боты с AI для поддержки клиентов\n• Автоматизация рутины и документооборота\n• Персонализация пользовательского опыта\n• AI-аналитика и рекомендации\n• Умные формы обратной связи', 'ai ии искусственный интеллект интеграция автоматизация'],
    ['Делаете ли вы редизайн?', 'Да, делаю редизайн существующих сайтов. Анализирую текущий проект, предлагаю улучшения и реализую.', 'редизайн обновление улучшение переделать'],
    ['Есть ли поддержка после запуска?', 'Да, предлагаю техподдержку и развитие проектов. От мелких правок до масштабирования.', 'поддержка обслуживание после запуск техподдержка'],
    ['Что такое Mini App?', 'Mini App — веб-приложение внутри Telegram. Пользователям не нужно ничего скачивать, всё работает прямо в мессенджере. Идеально для магазинов, сервисов, игр.', 'mini app мини апп телеграм приложение веб апп'],
  ];
  for (const [q, a, k] of defaultRag) {
    insertRag.run(q, a, k);
  }
}

// ── Middleware ──
app.use(express.json());
app.use(cookieParser());
app.use(express.static(__dirname));
app.use('/images', express.static(IMAGES_DIR));

// ── Multer ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});
const upload = multer({ storage });

// ── Auth Middleware ──
function authAdmin(req, res, next) {
  const token = req.cookies?.admin_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Cases API (existing) ──
function readCases() {
  try { return JSON.parse(fs.readFileSync(CASES_FILE, 'utf8')); } catch { return []; }
}
function writeCases(cases) {
  fs.writeFileSync(CASES_FILE, JSON.stringify(cases, null, 2), 'utf8');
}

app.get('/api/cases', (req, res) => res.json(readCases()));
app.post('/api/cases', authAdmin, (req, res) => {
  const cases = readCases();
  if (cases.find(c => c.id === req.body.id)) return res.status(409).json({ error: 'Case exists' });
  cases.push(req.body);
  writeCases(cases);
  res.status(201).json(req.body);
});
app.get('/api/cases/:id', authAdmin, (req, res) => {
  const found = readCases().find(c => c.id === req.params.id);
  if (!found) return res.status(404).json({ error: 'Not found' });
  res.json(found);
});
app.put('/api/cases/:id', authAdmin, (req, res) => {
  const cases = readCases();
  const i = cases.findIndex(c => c.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: 'Not found' });
  req.body.id = req.params.id;
  cases[i] = req.body;
  writeCases(cases);
  res.json(req.body);
});
app.delete('/api/cases/:id', authAdmin, (req, res) => {
  let cases = readCases();
  const before = cases.length;
  cases = cases.filter(c => c.id !== req.params.id);
  if (cases.length === before) return res.status(404).json({ error: 'Not found' });
  writeCases(cases);
  res.json({ success: true });
});
app.post('/api/upload', authAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/images/${req.file.filename}` });
});
app.get('/api/tg-proxy', (req, res) => {
  const url = req.query.url;
  if (!url || !url.startsWith('https://api.telegram.org/')) return res.status(400).json({ error: 'Invalid URL' });
  https.get(url, { timeout: 30000 }, (tgRes) => {
    res.set('Content-Type', tgRes.headers['content-type'] || 'application/octet-stream');
    tgRes.pipe(res);
  }).on('error', (e) => res.status(502).json({ error: e.message }));
});
app.post('/api/save-lottie', express.json({ limit: '10mb' }), (req, res) => {
  const { slot, key, json } = req.body;
  if (!slot || !key || !json) return res.status(400).json({ error: 'Missing data' });
  fs.writeFileSync(path.join(LOTTIE_DIR, `${slot}.json`), JSON.stringify(json), 'utf8');
  res.json({ success: true, path: `/lottie/${slot}.json` });
});
app.post('/api/upload-lottie', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ success: true, path: `/images/${req.file.filename}` });
});

// ── Admin Auth ──
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  if (!bcrypt.compareSync(password, adminHash)) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  const token = jwt.sign({ role: 'admin', iat: Date.now() }, JWT_SECRET, { expiresIn: '24h' });
  db.prepare('INSERT INTO admin_sessions (token) VALUES (?)').run(token);
  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    maxAge: 86400000,
    path: '/'
  });
  res.json({ success: true, token });
});

app.post('/api/admin/logout', (req, res) => {
  const token = req.cookies?.admin_token;
  if (token) db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
  res.clearCookie('admin_token', { path: '/' });
  res.json({ success: true });
});

app.get('/api/admin/check', authAdmin, (req, res) => {
  res.json({ authenticated: true });
});

// ── Admin: Conversations ──
app.get('/api/admin/conversations', authAdmin, (req, res) => {
  const convs = db.prepare(`
    SELECT c.*, COUNT(m.id) as message_count
    FROM conversations c
    LEFT JOIN messages m ON m.conversation_id = c.id
    GROUP BY c.id
    ORDER BY c.updated_at DESC
  `).all();
  res.json(convs);
});

app.get('/api/admin/conversations/:id', authAdmin, (req, res) => {
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Not found' });
  const msgs = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json({ ...conv, messages: msgs });
});

app.delete('/api/admin/conversations/:id', authAdmin, (req, res) => {
  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(req.params.id);
  db.prepare('DELETE FROM conversations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── Admin: RAG Knowledge ──
app.get('/api/admin/rag', authAdmin, (req, res) => {
  const items = db.prepare('SELECT * FROM rag_knowledge ORDER BY id DESC').all();
  res.json(items);
});

app.post('/api/admin/rag', authAdmin, (req, res) => {
  const { question, answer, keywords } = req.body;
  if (!question || !answer) return res.status(400).json({ error: 'Question and answer required' });
  const result = db.prepare('INSERT INTO rag_knowledge (question, answer, keywords) VALUES (?, ?, ?)').run(question, answer, keywords || '');
  res.status(201).json({ id: result.lastInsertRowid, question, answer, keywords });
});

app.put('/api/admin/rag/:id', authAdmin, (req, res) => {
  const { question, answer, keywords } = req.body;
  if (!question || !answer) return res.status(400).json({ error: 'Question and answer required' });
  const result = db.prepare('UPDATE rag_knowledge SET question=?, answer=?, keywords=? WHERE id=?').run(question, answer, keywords || '', req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ id: Number(req.params.id), question, answer, keywords });
});

app.delete('/api/admin/rag/:id', authAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM rag_knowledge WHERE id=?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// ── RAG Search ──
function searchRag(query) {
  const words = query.toLowerCase().replace(/[^а-яёa-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return [];
  const allItems = db.prepare('SELECT * FROM rag_knowledge').all();
  return allItems.map(item => {
    const kw = (item.keywords || '').toLowerCase();
    const q = item.question.toLowerCase();
    const a = item.answer.toLowerCase();
    let score = 0;
    for (const w of words) {
      if (kw.includes(w)) score += 3;
      if (q.includes(w)) score += 2;
      if (a.includes(w)) score += 1;
    }
    return { ...item, score };
  }).filter(i => i.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
}

// ── FireWorks AI Chat ──
function callFireworks(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: FIREWORKS_MODEL,
      messages: messages,
      max_tokens: 200,
      temperature: 0.5,
      top_p: 0.9,
    });

    const options = {
      hostname: 'api.fireworks.ai',
      path: '/inference/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIREWORKS_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.choices && parsed.choices[0]) {
            let content = parsed.choices[0].message.content || '';
            const reasoning = parsed.choices[0].message.reasoning_content || '';
            if (reasoning && content) {
              resolve(content);
            } else if (reasoning && !content) {
              resolve(reasoning);
            } else {
              resolve(content);
            }
          } else if (parsed.error) {
            reject(new Error(parsed.error.message || 'API error'));
          } else {
            reject(new Error('No response from model'));
          }
        } catch (e) {
          reject(new Error('Parse error: ' + data.slice(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

// ── Chat API ──
app.post('/api/chat', async (req, res) => {
  const { message, conversation_id } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message required' });

  let visitorId = req.cookies?.visitor_id;
  if (!visitorId) {
    visitorId = uuidv4();
    res.cookie('visitor_id', visitorId, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000,
      path: '/'
    });
  }

  let convId = conversation_id;
  if (!convId) {
    convId = uuidv4();
    db.prepare('INSERT INTO conversations (id, visitor_id) VALUES (?, ?)').run(convId, visitorId);
  }

  db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(convId);

  db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)').run(convId, 'user', message.trim());

  const history = db.prepare('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(convId);

  const ragResults = searchRag(message);
  let systemPrompt = `Ты — AI-ассистент Дмитрия Аввакумова. Отвечай КРАТКО, прямо и дружелюбно на русском. НЕ размышляй вслух — просто отвечай. Дмитрий — дизайнер-разработчик из Сочи с опытом 6+ лет, работал в Yandex. Делает сайты, Telegram-боты, Mini Apps, AI-интеграцию. Работает один, без наценок. Цены: лендинг от 40к, корпоративный от 80к, магазин от 100к, бот от 10к, Mini App от 20к, AI от 20к. Сроки зависят от ТЗ. Оплата: карта, перевод, крипто, по предоплате, по желанию договор. Контакты: Telegram @dmitryavva. Если не знаешь — направь к Дмитрию.`;

    if (ragResults.length > 0) {
      systemPrompt += `\n\nИнформация для ответа (используй естественно, не цитируй дословно):\n`;
      for (const r of ragResults) {
        systemPrompt += `${r.question}: ${r.answer}\n`;
      }
    }

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map(m => ({ role: m.role, content: m.content }))
  ];

  try {
    const reply = await callFireworks(apiMessages);

    db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)').run(convId, 'assistant', reply);

    res.json({ reply, conversation_id: convId });
  } catch (err) {
    console.error('FireWorks error:', err.message);
    const fallback = ragResults.length > 0
      ? ragResults[0].answer
      : 'Извините, не удалось получить ответ. Напишите нам на hello@bajgart.com или в Telegram @bajgart.';
    db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)').run(convId, 'assistant', fallback);
    res.json({ reply: fallback, conversation_id: convId });
  }
});

// ── Get conversation history for visitor ──
app.get('/api/chat/history', (req, res) => {
  const visitorId = req.cookies?.visitor_id;
  if (!visitorId) return res.json({ conversations: [] });

  const convs = db.prepare(`
    SELECT c.*, COUNT(m.id) as message_count
    FROM conversations c
    LEFT JOIN messages m ON m.conversation_id = c.id
    WHERE c.visitor_id = ?
    GROUP BY c.id
    ORDER BY c.updated_at DESC
    LIMIT 5
  `).all(visitorId);

  if (convs.length === 0) return res.json({ conversations: [] });

  const latestConv = convs[0];
  const msgs = db.prepare('SELECT role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(latestConv.id);

  res.json({
    conversations: convs.map(c => ({ id: c.id, message_count: c.message_count, updated_at: c.updated_at })),
    latest_messages: msgs,
    conversation_id: latestConv.id
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin-chat.html`);
});
