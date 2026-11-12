const express = require("express");
const crypto = require("crypto");
const { readStore, writeStore, hashPassword, verifyPassword } = require("./bootstrap");

const router = express.Router();
const ROLES = ["SUPER_MASTER", "MASTER", "CASHIER"];
const clean = value => String(value == null ? "" : value).trim();
const safeUser = user => ({
  id: user.id, username: user.username, displayName: user.displayName,
  role: user.role, parentId: user.parentId, balance: Number(user.balance || 0),
  active: user.active !== false, createdAt: user.createdAt
});
const fail = (res, status, message) => res.status(status).json({ ok: false, message });

router.get("/setup-status", (req, res) => {
  const db = readStore();
  res.json({ ok: true, needsSetup: !db.users.some(u => u.role === "MASTER" && !u.parentId) });
});
router.post("/setup-master", (req, res) => {
  const db = readStore();
  if (db.users.some(u => u.role === "MASTER" && !u.parentId)) return fail(res, 409, "تم إنشاء حساب MASTER مسبقاً.");
  const username = clean(req.body.username);
  const password = String(req.body.password || "");
  if (!/^[a-zA-Z0-9_.-]{4,32}$/.test(username)) return fail(res, 400, "اسم المستخدم يجب أن يكون 4 إلى 32 حرفاً أو رقماً.");
  if (password.length < 10) return fail(res, 400, "كلمة المرور يجب ألا تقل عن 10 أحرف.");
  const credentials = hashPassword(password);
  const user = { id: crypto.randomUUID(), username, displayName: "MASTER", role: "MASTER", parentId: null, password: credentials, balance: 0, active: true, createdAt: new Date().toISOString() };
  db.users.push(user); writeStore(db);
  req.session.userId = user.id;
  res.status(201).json({ ok: true, user: safeUser(user) });
});
router.post("/auth/login", (req, res) => {
  const username = clean(req.body.username);
  const password = String(req.body.password || "");
  const db = readStore();
  const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user || user.active === false || !verifyPassword(password, user.password)) return fail(res, 401, "بيانات الدخول غير صحيحة أو الحساب موقوف.");
  req.session.userId = user.id;
  res.json({ ok: true, user: safeUser(user) });
});
router.post("/auth/logout", (req, res) => req.session.destroy(() => res.json({ ok: true })));
function requireAuth(req, res, next) {
  const db = readStore();
  const user = db.users.find(u => u.id === req.session.userId && u.active !== false);
  if (!user) return fail(res, 401, "يرجى تسجيل الدخول.");
  req.user = user; req.db = db; next();
}
function requireMaster(req, res, next) {
  if (!req.user || req.user.role !== "MASTER" || req.user.parentId) return fail(res, 403, "هذه الصلاحية للـ MASTER الرئيسي فقط.");
  next();
}
router.use(requireAuth);
router.get("/auth/me", (req, res) => res.json({ ok: true, user: safeUser(req.user) }));
router.get("/dashboard", (req, res) => {
  const users = req.db.users;
  res.json({ ok: true, stats: {
    superMasters: users.filter(u => u.role === "SUPER_MASTER").length,
    masters: users.filter(u => u.role === "MASTER" && u.parentId).length,
    cashiers: users.filter(u => u.role === "CASHIER").length,
    players: req.db.players.length,
    totalBalances: req.db.players.reduce((n,p) => n + Number(p.balance || 0), 0)
  }});
});
router.get("/agents", requireMaster, (req, res) => res.json({ ok: true, agents: req.db.users.filter(u => u.role !== "MASTER" || u.parentId).map(safeUser) }));
router.post("/agents", requireMaster, (req, res) => {
  const username = clean(req.body.username);
  const displayName = clean(req.body.displayName);
  const role = clean(req.body.role).toUpperCase();
  const password = String(req.body.password || "");
  const parentId = clean(req.body.parentId) || req.user.id;
  if (!/^[a-zA-Z0-9_.-]{4,32}$/.test(username)) return fail(res, 400, "اسم المستخدم يجب أن يكون 4 إلى 32 حرفاً أو رقماً.");
  if (password.length < 10) return fail(res, 400, "كلمة المرور يجب ألا تقل عن 10 أحرف.");
  if (!ROLES.includes(role)) return fail(res, 400, "نوع الوكيل غير صحيح.");
  if (req.db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) return fail(res, 409, "اسم المستخدم مستخدم مسبقاً.");
  const parent = req.db.users.find(u => u.id === parentId);
  if (!parent || parent.active === false) return fail(res, 400, "الوكيل الأب غير موجود أو موقوف.");
  const credentials = hashPassword(password);
  const agent = { id: crypto.randomUUID(), username, displayName: displayName || username, role, parentId, password: credentials, balance: 0, active: true, createdAt: new Date().toISOString() };
  req.db.users.push(agent); writeStore(req.db);
  res.status(201).json({ ok: true, agent: safeUser(agent) });
});
router.patch("/agents/:id/status", requireMaster, (req, res) => {
  const agent = req.db.users.find(u => u.id === req.params.id && u.parentId);
  if (!agent) return fail(res, 404, "الوكيل غير موجود.");
  agent.active = req.body.active === true; writeStore(req.db);
  res.json({ ok: true, agent: safeUser(agent) });
});
router.get("/players", (req, res) => res.json({ ok: true, players: req.db.players }));
router.post("/players", requireMaster, (req, res) => {
  const username = clean(req.body.username);
  const displayName = clean(req.body.displayName);
  if (username.length < 3 || username.length > 32) return fail(res, 400, "اسم اللاعب يجب أن يكون 3 إلى 32 حرفاً.");
  if (req.db.players.some(p => p.username.toLowerCase() === username.toLowerCase())) return fail(res, 409, "اسم اللاعب موجود مسبقاً.");
  const player = { id: crypto.randomUUID(), username, displayName: displayName || username, balance: 0, active: true, createdAt: new Date().toISOString() };
  req.db.players.push(player); writeStore(req.db);
  res.status(201).json({ ok: true, player });
});
router.post("/wallet/adjust", requireMaster, (req, res) => {
  const playerId = clean(req.body.playerId);
  const amount = Number(req.body.amount);
  const note = clean(req.body.note);
  if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 1000000000) return fail(res, 400, "أدخل مبلغاً صحيحاً غير صفري.");
  const player = req.db.players.find(p => p.id === playerId);
  if (!player) return fail(res, 404, "اللاعب غير موجود.");
  if (Number(player.balance || 0) + amount < 0) return fail(res, 400, "الرصيد لا يسمح بهذا الخصم.");
  player.balance = Number(player.balance || 0) + amount;
  const tx = { id: crypto.randomUUID(), playerId, username: player.username, amount, balanceAfter: player.balance, note, by: req.user.username, createdAt: new Date().toISOString() };
  req.db.transactions.unshift(tx); writeStore(req.db);
  res.json({ ok: true, player, transaction: tx });
});
router.get("/transactions", requireMaster, (req, res) => res.json({ ok: true, transactions: req.db.transactions.slice(0, 300) }));
router.get("/reports", requireMaster, (req, res) => {
  const transactions = req.db.transactions;
  res.json({ ok: true, report: {
    count: transactions.length,
    credits: transactions.filter(t => t.amount > 0).reduce((n,t) => n + t.amount, 0),
    debits: transactions.filter(t => t.amount < 0).reduce((n,t) => n + Math.abs(t.amount), 0)
  }});
});
module.exports = router;
