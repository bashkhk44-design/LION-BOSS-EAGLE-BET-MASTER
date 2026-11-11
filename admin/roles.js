
const ROLES = {
  MASTER: "المدير الرئيسي",
  SUPER_MASTER: "رئيس الوكلاء",
  AGENT: "الوكيل",
  CASHIER: "الكاشيرة"
};

function canCreate(actorRole, targetRole) {
  if (actorRole !== "MASTER") return false;

  return [
    "SUPER_MASTER",
    "AGENT",
    "CASHIER"
  ].includes(targetRole);
}

function canManage(actorRole) {
  return actorRole === "MASTER";
}

module.exports = {
  ROLES,
  canCreate,
  canManage
};
