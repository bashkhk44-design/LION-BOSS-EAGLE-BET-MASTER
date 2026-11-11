
const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "lion-master-secret-change-this",
  resave: false,
  saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("BOSS EAGLE BET MASTER PANEL IS RUNNING");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log("BOSS EAGLE MASTER running on port " + PORT);
});
