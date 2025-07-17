const express = require('express');
const router = express.Router();

const {
    getAllReportsGroupedByUser,
    getReportDetails,
    deleteReport
} = require('./ReportManagement.controller');
const { verifyToken, authorize } = require('../../auth/auth.middleware');

router.get('/', verifyToken, authorize(['admin']), getAllReportsGroupedByUser);
router.get('/details/:id', verifyToken, authorize(['admin']), getReportDetails);
router.delete('/:id', verifyToken, authorize(['admin']), deleteReport);

module.exports = router;