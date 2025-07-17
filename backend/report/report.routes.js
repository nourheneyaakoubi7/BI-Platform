const express = require('express');
const router = express.Router();
const reportController = require('./report.controller');
const { verifyToken, authorize } = require('../auth/auth.middleware');

router.post('/', verifyToken, authorize(['user']), reportController.createReport);
router.get('/', verifyToken, authorize(['user']), reportController.getUserReports);
router.get('/:id', verifyToken, authorize(['user']), reportController.getReportById);
router.delete('/:id', verifyToken, authorize(['user']), reportController.deleteReport);
router.get('/:id/download', verifyToken, authorize(['user']), reportController.downloadReport);

module.exports = router;