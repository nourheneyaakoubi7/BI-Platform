const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  theme: { type: String, enum: ["light", "dark"], default: "light" },
  language: { type: String, default: "en" }
});

const Settings = mongoose.model("Settings", settingsSchema);
module.exports = Settings;
