const express = require("express");
const app = express();

const adminRoutes = require("./admin/routes");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("LION MASTER PANEL IS RUNNING");
});

app.use("/admin", adminRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("LION MASTER RUNNING ON PORT " + PORT);
});
