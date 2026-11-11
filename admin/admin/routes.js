
const express = require("express");
const router = express.Router();
const users = require("./users");

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      error: "يجب تسجيل الدخول"
    });
  }
  next();
}

function requireMaster(req, res, next) {
  if (!req.session.user || req.session.user.role !== "MASTER") {
    return res.status(403).json({
      error: "هذه الصلاحية للمدير الرئيسي فقط"
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
      error: "اسم المستخدم أو كلمة المرور غير صحيحة"
    });
  }

  req.session.regenerate(err => {
    if (err) {
      return res.status(500).json({
        error: "تعذر إنشاء الجلسة"
      });
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

// معلومات المستخدم
router.get("/me", requireLogin, (req, res) => {
  res.json({ user: req.session.user });
});

// إنشاء الوكلاء بواسطة MASTER فقط
router.post("/users", requireMaster, (req, res) => {
  try {
    const user = users.createUser(
      req.session.user,
      req.body
    );

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

// عرض شجرة الوكلاء
router.get("/tree", requireMaster, (req, res) => {
  const all = users.readUsers();

  res.json({
    master: req.session.user.username,
    agents: all.map(user => ({
      id: user.id,
      username: user.username,
      role: user.role,
      parentId: user.parentId,
      balance: user.balance,
      createdAt: user.createdAt
    }))
  });
});

// تسجيل الخروج
router.post("/logout", requireLogin, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({
        error: "تعذر تسجيل الخروج"
      });
    }

    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

module.exports = router;
