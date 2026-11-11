
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FILE = path.join(__dirname, "users.json");

function readUsers() {
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, "[]", { mode: 0o600 });
  }

  const users = JSON.parse(fs.readFileSync(FILE, "utf8"));

  if (!Array.isArray(users)) {
    throw new Error("قاعدة بيانات المستخدمين غير صحيحة");
  }

  return users;
}

function saveUsers(users) {
  const temp = FILE + ".tmp";

  fs.writeFileSync(
    temp,
    JSON.stringify(users, null, 2),
    { mode: 0o600 }
  );

  fs.renameSync(temp, FILE);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");

  const hash = crypto.scryptSync(
    password,
    salt,
    64
  ).toString("hex");

  return salt + ":" + hash;
}

function verifyPassword(password, stored) {
  if (typeof stored !== "string") return false;

  const parts = stored.split(":");

  if (parts.length !== 2) return false;

  if (!/^[a-f0-9]{32}$/i.test(parts[0])) return false;

  if (!/^[a-f0-9]{128}$/i.test(parts[1])) return false;

  const test = crypto.scryptSync(password, parts[0], 64);

  return crypto.timingSafeEqual(
    test,
    Buffer.from(parts[1], "hex")
  );
}

function createUser(actor, data) {
  if (!actor || actor.role !== "MASTER") {
    throw new Error("غير مصرح");
  }

  const allowed = [
    "SUPER_MASTER",
    "AGENT",
    "CASHIER"
  ];

  const username = String(data.username || "").trim();
  const password = String(data.password || "");

  if (!allowed.includes(data.role)) {
    throw new Error("نوع الحساب غير صحيح");
  }

  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) {
    throw new Error("اسم المستخدم غير صحيح");
  }

  if (password.length < 12) {
    throw new Error("كلمة المرور يجب أن تكون 12 حرفاً على الأقل");
  }

  const users = readUsers();

  if (users.some(u =>
    u.username.toLowerCase() === username.toLowerCase()
  )) {
    throw new Error("اسم المستخدم موجود مسبقاً");
  }

  const user = {
    id: crypto.randomUUID(),
    username,
    password: hashPassword(password),
    role: data.role,
    parentId: actor.id,
    balance: 0,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  saveUsers(users);

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    parentId: user.parentId,
    balance: user.balance
  };
}

function authenticate(username, password) {
  const users = readUsers();

  const user = users.find(u =>
    u.username.toLowerCase() ===
    String(username || "").trim().toLowerCase()
  );

  if (!user || !verifyPassword(String(password || ""), user.password)) {
    return null;
  }

  const { password: hidden, ...safeUser } = user;

  return safeUser;
}

module.exports = {
  readUsers,
  createUser,
  authenticate
};
