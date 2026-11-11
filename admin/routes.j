const express = require("express");
const router = express.Router();

const users = require("./users");

router.get("/dashboard", (req, res) => {
  res.json({
    success: true,
    message: "LION MASTER PANEL",
    system: "EAGLE BET",
    sections: [
      "dashboard",
      "network",
      "agent-tree",
      "players",
      "file-center"
    ]
  });
});

module.exports = router;
