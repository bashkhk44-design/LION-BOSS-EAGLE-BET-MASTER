
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FILE = path.join(__dirname, "users.json");

function initializeMaster() {
  const username = process.env.MASTER_USERNAME;
  const password = process.env.MASTER_PASSWORD;

  if (!username || !password || password.length < 12) {
    console.log("MASTER credentials are not configured");
    return;
  }

  let users = [];

  if (fs.existsSync(FILE)) {
    users = JSON.parse(fs.readFileSync(FILE, "utf8"));
  }

  if (users.length > 0) {
    console.log("Accounts already exist");
    return;
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");

  users.push({
    id: crypto.randomUUID(),
    username,
    password: salt + ":" + hash,
    role: "MASTER",
    parentId: null,
    balance: 0,
    createdAt: new Date().toISOString()
  });

  fs.writeFileSync(FILE, JSON.stringify(users, null, 2));

  console.log("MASTER account initialized");
}

module.exports = initializeMaster;
