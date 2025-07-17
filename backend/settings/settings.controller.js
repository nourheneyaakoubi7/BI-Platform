const Settings = require("./settings.model");

// GET /api/settings - Get user settings
exports.getSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    const settings = await Settings.findOne({ userId });
    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching settings", error: err });
  }
};

// PUT /api/settings - Update user settings
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { theme, language } = req.body;

    const updated = await Settings.findOneAndUpdate(
      { userId },
      { theme, language },
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating settings", error: err });
  }
};
