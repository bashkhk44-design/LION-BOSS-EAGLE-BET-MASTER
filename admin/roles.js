
const express = require("express");
const router = express.Router();

const users = require("./users");
const { ROLES, canCreate } = require("./roles");

// لوحة التحكم
router.get("/dashboard", (req, res) => {
  res.json({
    success: true,
    message: "LION MASTER PANEL",
    system: "EAGLE BET",
    roles: ROLES,
    sections: [
      "dashboard",
      "network",
      "agent-tree",
      "players",
      "file-center"
    ]
  });
});

// إنشاء حساب بواسطة MASTER
router.post("/users/create", (req, res) => {
  try {
    const actor = req.body.actor;
    const data = req.body;

    if (!actor || actor.role !== "MASTER") {
      return res.status(403).json({
        success: false,
        message: "غير مصرح"
      });
    }

    if (!canCreate(actor.role, data.role)) {
      return res.status(403).json({
        success: false,
        message: "لا تملك صلاحية إنشاء هذا الحساب"
      });
    }

    const user = users.createUser(actor, data);

    res.json({
      success: true,
      message: "تم إنشاء الحساب بنجاح",
      user
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
