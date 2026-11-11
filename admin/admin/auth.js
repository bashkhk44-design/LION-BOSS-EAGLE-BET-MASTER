
const express = require("express");
const router = express.Router();
const users = require("./users");

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.authenticate(username, password);

  if (!user || user.role !== "MASTER") {
    return res.status(401).json({
      success: false,
      message: "بيانات الدخول غير صحيحة"
    });
  }

  req.session.user = user;

  res.json({
    success: true,
    message: "تم تسجيل دخول MASTER",
    user
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: "تم تسجيل الخروج" });
  });
});

module.exports = router;
