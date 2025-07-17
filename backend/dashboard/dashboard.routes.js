const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const { verifyToken } = require('../auth/auth.middleware');

router.get('/', verifyToken, dashboardController.getDashboardStats);

module.exports = router;