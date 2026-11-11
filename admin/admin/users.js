
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FILE = path.join(__dirname, "users.json");

function readUsers() {
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, "[]");
  }
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(FILE, JSON.stringify(users, null, 2));
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return salt + ":" + hash;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const test = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(test, Buffer.from(hash, "hex"));
}

function createUser(actor, data) {
  if (!actor || actor.role !== "MASTER") {
    throw new Error("غير مصرح");
  }

  const allowed = ["SUPER_MASTER", "AGENT", "CASHIER"];

  if (!allowed.includes(data.role)) {
    throw new Error("نوع الحساب غير صحيح");
  }

  if (!data.username || !data.password || data.password.length < 8) {
    throw new Error("اسم المستخدم وكلمة مرور من 8 أحرف مطلوبة");
  }

  const users = readUsers();

  if (users.some(u => u.username === data.username)) {
    throw new Error("اسم المستخدم موجود مسبقاً");
  }

  const user = {
    id: crypto.randomUUID(),
    username: data.username,
    password: hashPassword(data.password),
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
  const user = readUsers().find(u => u.username === username);

  if (!user || !verifyPassword(password, user.password)) {
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
