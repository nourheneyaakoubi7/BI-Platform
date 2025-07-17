const express = require("express");
const router = express.Router();
const settingsController = require("./settings.controller");
const { verifyToken } = require("../auth/auth.middleware"); 

router.get("/", verifyToken, settingsController.getSettings);
router.put("/", verifyToken, settingsController.updateSettings);

module.exports = router;
