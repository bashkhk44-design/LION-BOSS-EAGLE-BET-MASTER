const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "master-data.json");

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return { salt, hash };
}
function verifyPassword(password, stored) {
  if (!stored || !stored.salt || !stored.hash) return false;
  const actual = crypto.scryptSync(String(password), stored.salt, 64);
  const expected = Buffer.from(stored.hash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
function emptyStore() {
  return { version: 1, users: [], players: [], transactions: [], createdAt: new Date().toISOString() };
}
function readStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(emptyStore(), null, 2));
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    return { ...emptyStore(), ...data };
  } catch (error) {
    throw new Error("تعذر قراءة قاعدة البيانات data/master-data.json: " + error.message);
  }
}
function writeStore(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const temp = DB_FILE + ".tmp";
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), { mode: 0o600 });
  fs.renameSync(temp, DB_FILE);
}
function initializeMaster() {
  const store = readStore();
  const username = process.env.MASTER_USERNAME;
  const password = process.env.MASTER_PASSWORD;
  if (username && password && !store.users.some(u => u.role === "MASTER" && !u.parentId)) {
    const credentials = hashPassword(password);
    store.users.push({
      id: crypto.randomUUID(), username: String(username).trim(), displayName: "MASTER",
      role: "MASTER", parentId: null, password: credentials, balance: 0,
      active: true, createdAt: new Date().toISOString()
    });
    writeStore(store);
    console.log("Initial MASTER account created from environment settings.");
  }
  return store;
}
module.exports = { DATA_DIR, DB_FILE, hashPassword, verifyPassword, readStore, writeStore, initializeMaster };
