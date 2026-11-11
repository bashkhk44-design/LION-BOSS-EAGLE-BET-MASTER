
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FILE = path.join(__dirname, "users.json");

function initializeMaster() {
  const username = process.env.MASTER_USERNAME;
  const password = process.env.MASTER_PASSWORD;

  if (!username || !password || password.length < 12) {
    console.log("MASTER credentials missing or invalid");
    return;
  }

  let users = [];

  if (fs.existsSync(FILE)) {
    users = JSON.parse(fs.readFileSync(FILE, "utf8"));
  }

  if (!Array.isArray(users)) {
    throw new Error("Invalid users database");
  }

  if (users.length > 0) {
    console.log("Existing accounts preserved");
    return;
  }

  const salt = crypto.randomBytes(16).toString("hex");

  const hash = crypto.scryptSync(
    password,
    salt,
    64
  ).toString("hex");

  const master = {
    id: crypto.randomUUID(),
    username,
    password: salt + ":" + hash,
    role: "MASTER",
    parentId: null,
    balance: 0,
    createdAt: new Date().toISOString()
  };

  fs.writeFileSync(
    FILE,
    JSON.stringify([master], null, 2),
    { mode: 0o600 }
  );

  console.log("MASTER account created successfully");
}

module.exports = initializeMaster;
