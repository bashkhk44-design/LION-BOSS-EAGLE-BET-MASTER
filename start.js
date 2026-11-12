const express = require("express");
const session = require("express-session");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "100kb" }));

const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(48).toString("hex");
app.use(session({
  name: "lion.master.sid",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 12 * 60 * 60 * 1000 }
}));

const initializeMaster = require("./admin/bootstrap");
const adminRoutes = require("./admin/routes");
initializeMaster();

app.use("/api", adminRoutes);
app.use(express.static(path.join(__dirname, "public"), { index: false }));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/health", (req, res) => res.status(200).json({ ok: true, service: "BOSS EAGLE MASTER" }));

const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, "0.0.0.0", () => console.log("BOSS EAGLE MASTER running on port " + PORT));
