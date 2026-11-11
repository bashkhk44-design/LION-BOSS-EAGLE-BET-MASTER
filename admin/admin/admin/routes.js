
const express = require("express");
const router = express.Router();

const users = require("./users");

function requireMaster(req, res, next) {
  if (!req.session.user || req.session.user.role !== "MASTER") {
    return res.status(403).json({
      error: "غير مصرح لك بهذه العملية"
    });
  }
  next();
}

// تسجيل الدخول
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.authenticate(username, password);

  if (!user) {
    return res.status(401).json({
      error: "بيانات الدخول غير صحيحة"
    });
  }

  req.session.regenerate(err => {
    if (err) {
      return res.status(500).json({ error: "خطأ في الجلسة" });
    }

    req.session.user = user;

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  });
});

// معلومات الحساب الحالي
router.get("/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "يجب تسجيل الدخول" });
  }

  res.json({ user: req.session.user });
});

// إنشاء حسابات الوكلاء
router.post("/users", requireMaster, (req, res) => {
  try {
    const user = users.createUser(req.session.user, req.body);
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// عرض شجرة الوكلاء
router.get("/tree", requireMaster, (req, res) => {
  const all = users.readUsers();

  res.json({
    master: req.session.user.username,
    agents: all.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      parentId: u.parentId,
      balance: u.balance
    }))
  });
});

// تسجيل الخروج
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

module.exports = router;
