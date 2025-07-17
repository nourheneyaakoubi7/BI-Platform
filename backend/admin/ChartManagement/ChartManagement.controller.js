const Chart = require('../../charts/charts.model');
const User = require('../../auth/auth.model'); // Import the User model
const FileManagement = require('../../fileupload/fileupload.model'); // Import FileManagement if needed for file details

exports.getAllChartsGroupedByUser = async (req, res) => {
    try {
        const charts = await Chart.find().populate('userId', 'username').populate('fileId', 'originalName'); // Populate userId and fileId
        const chartsByUser = {};

        charts.forEach(chart => {
            const username = chart.userId ? chart.userId.username : 'Unknown User';
            if (!chartsByUser[username]) {
                chartsByUser[username] = [];
            }
            chartsByUser[username].push(chart);
        });

        res.json(chartsByUser);
    } catch (err) {
        console.error('Error fetching charts:', err);
        res.status(500).json({ message: 'Error fetching charts', error: err.message });
    }
};

exports.getChartDetails = async (req, res) => {
    try {
        const chartId = req.params.id;
        const chart = await Chart.findById(chartId).populate('fileId', 'originalName');
        if (!chart) return res.status(404).json({ message: 'Chart configuration not found' });

        res.json(chart);
    } catch (err) {
        console.error('Error fetching chart details:', err);
        res.status(500).json({ message: 'Error fetching chart details', error: err.message });
    }
};

exports.deleteChart = async (req, res) => {
    try {
        const chartId = req.params.id;
        await Chart.findByIdAndDelete(chartId);
        res.json({ message: 'Chart configuration deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting chart configuration', error: err.message });
    }
};