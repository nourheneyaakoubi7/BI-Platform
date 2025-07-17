const express = require('express');
const router = express.Router();

const {
    getAllChartsGroupedByUser,
    getChartDetails,
    deleteChart
} = require('./ChartManagement.controller');
const { verifyToken, authorize } = require('../../auth/auth.middleware');

router.get('/', verifyToken, authorize(['admin']), getAllChartsGroupedByUser);
router.get('/details/:id', verifyToken, authorize(['admin']), getChartDetails);
router.delete('/:id', verifyToken, authorize(['admin']), deleteChart);

module.exports = router;