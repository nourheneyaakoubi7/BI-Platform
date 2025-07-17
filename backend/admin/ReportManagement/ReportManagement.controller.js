const Report = require('../../report/report.model');
const User = require('../../auth/auth.model'); // Import the User model

exports.getAllReportsGroupedByUser = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('userId', 'username')
      .populate('fileIds', 'originalName') // Populate fileIds array
      .populate('chartIds', 'title');     // Populate chartIds array

    const reportsByUser = {};

    reports.forEach(report => {
      const username = report.userId ? report.userId.username : 'Unknown User';
      if (!reportsByUser[username]) {
        reportsByUser[username] = [];
      }
      reportsByUser[username].push(report);
    });

    res.json(reportsByUser);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ message: 'Error fetching reports', error: err.message });
  }
};

exports.getReportDetails = async (req, res) => {
  try {
    const reportId = req.params.id;
    const report = await Report.findById(reportId)
      .populate('fileIds', 'originalName')
      .populate('chartIds', 'title');

    if (!report) return res.status(404).json({ message: 'Report not found' });

    res.json(report);
  } catch (err) {
    console.error('Error fetching report details:', err);
    res.status(500).json({ message: 'Error fetching report details', error: err.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    await Report.findByIdAndDelete(reportId);
    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting report', error: err.message });
  }
};