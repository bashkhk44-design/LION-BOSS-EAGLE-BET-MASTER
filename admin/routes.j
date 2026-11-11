const express = require("express");
const router = express.Router();

const users = require("./users");

// لوحة المدير الرئيسي
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

// إنشاء رئيس وكيل أو وكيل أو كاشير
router.post("/users", (req, res) => {
  try {
    const actor = req.session?.user;

    const user = users.createUser(actor, req.body);

    res.status(201).json({
      success: true,
      user
    });

  } catch (error) {
    res.status(403).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
