const express = require('express');
const router = express.Router();
const chartsController = require('./charts.controller');
const { verifyToken, authorize } = require('../auth/auth.middleware');

router.post('/', verifyToken, authorize(['user']), chartsController.createChart);
router.get('/', verifyToken, authorize(['user']), chartsController.getUserCharts);
router.get('/:id', verifyToken, authorize(['user']), chartsController.getChartById);
router.put('/:id', verifyToken, authorize(['user']), chartsController.updateChart);
router.delete('/:id', verifyToken, authorize(['user']), chartsController.deleteChart);
router.get('/:id/data', verifyToken, authorize(['user']), chartsController.getChartData);

module.exports = router;