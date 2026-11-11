
const express = require("express");
const session = require("express-session");

const app = express();

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing");
}

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: "auto",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000
  }
}));

const authRoutes = require("./admin/auth");
const adminRoutes = require("./admin/routes");

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("LION MASTER PANEL IS RUNNING");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("LION MASTER RUNNING ON PORT " + PORT);
});

