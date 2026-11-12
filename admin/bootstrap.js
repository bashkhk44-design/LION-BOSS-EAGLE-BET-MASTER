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
  const rootMaster = store.users.find(u => u.role === "MASTER" && !u.parentId);

  if (username && password) {
    const normalizedUsername = String(username).trim();
    if (!/^[a-zA-Z0-9_.-]{4,32}$/.test(normalizedUsername) || String(password).length < 12) {
      throw new Error("MASTER_USERNAME must be 4-32 valid characters and MASTER_PASSWORD must be at least 12 characters.");
    }
    const duplicate = store.users.find(u => u.username.toLowerCase() === normalizedUsername.toLowerCase() && (!rootMaster || u.id !== rootMaster.id));
    if (duplicate) throw new Error("MASTER_USERNAME is already used by another account.");
    const credentials = hashPassword(password);
    if (rootMaster) {
      rootMaster.username = normalizedUsername;
      rootMaster.password = credentials;
      rootMaster.active = true;
      rootMaster.displayName = "MASTER";
      writeStore(store);
      console.log("Root MASTER credentials synchronized from hosting environment.");
    } else {
      store.users.push({
        id: crypto.randomUUID(), username: normalizedUsername, displayName: "MASTER",
        role: "MASTER", parentId: null, password: credentials, balance: 0,
        active: true, createdAt: new Date().toISOString()
      });
      writeStore(store);
      console.log("Initial MASTER account created from environment settings.");
    }
  }
  return store;
}
module.exports = { DATA_DIR, DB_FILE, hashPassword, verifyPassword, readStore, writeStore, initializeMaster };
