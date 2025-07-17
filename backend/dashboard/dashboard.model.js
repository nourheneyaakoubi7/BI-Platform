const mongoose = require('mongoose');

const dashboardStatsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filesUploaded: { type: Number, default: 0 },
  chartsCreated: { type: Number, default: 0 },
  reportsCreated: { type: Number, default: 0 },
  userLogins: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

const DashboardStats = mongoose.model('DashboardStats', dashboardStatsSchema);

module.exports = DashboardStats;