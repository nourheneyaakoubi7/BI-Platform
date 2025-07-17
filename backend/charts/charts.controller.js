const Chart = require('./charts.model');
const FileUpload = require('../fileupload/fileupload.model');

//function to parse file data if not already parsed
const parseFileData = async (file) => {
    if (!file.parsedData || file.parsedData.length === 0) {
        const xlsx = require('xlsx');
        const csv = require('csv-parser');
        const { Readable } = require('stream');

        if (file.fileType === 'text/csv') {
            return new Promise((resolve, reject) => {
                const results = [];
                const stream = Readable.from(file.fileData.toString());
                stream
                    .pipe(csv())
                    .on('data', (data) => results.push(data))
                    .on('end', () => resolve(results))
                    .on('error', (error) => reject(error));
            });
        } else {
            const workbook = xlsx.read(file.fileData, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        }
    }
    return file.parsedData;
};

// Create a new chart
exports.createChart = async (req, res) => {
    try {
        const { title, description, fileId, chartType, xAxis, yAxis, styleOptions } = req.body;
        const userId = req.user.id;

        if (!title || !fileId || !chartType) {
            return res.status(400).json({ message: 'Title, file ID, and chart type are required' });
        }

        const file = await FileUpload.findById(fileId);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        if (file.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Unauthorized access to file' });
        }

        // Ensure file data is parsed
        const parsedData = await parseFileData(file);
        const columns = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];

        const newChart = new Chart({
            userId,
            title,
            description: description || '',
            fileId,
            chartType,
            xAxis,
            yAxis,
            styleOptions: styleOptions || {},
            data: parsedData,
            columns
        });

        await newChart.save();
        res.status(201).json(newChart);
    } catch (error) {
        console.error('Error creating chart:', error);
        res.status(500).json({ message: 'Error creating chart', error: error.message });
    }
};

// Get all charts for a user (with pagination)
exports.getUserCharts = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        console.log("User ID:", userId); // Add this line
        const charts = await Chart.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        console.log("Charts found:", charts); // Add this line

        const count = await Chart.countDocuments({ userId });

        res.json({
            charts,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('Error fetching charts:', error);
        res.status(500).json({ message: 'Error fetching user charts', error: error.message });
    }
};

// Get a single chart by ID
exports.getChartById = async (req, res) => {
    try {
        const chartId = req.params.id;
        const chart = await Chart.findById(chartId);

        if (!chart) {
            return res.status(404).json({ message: 'Chart not found' });
        }

        if (chart.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Unauthorized access to chart' });
        }

        res.json(chart);
    } catch (error) {
        console.error('Error fetching chart:', error);
        res.status(500).json({ message: 'Error fetching chart', error: error.message });
    }
};

// Update a chart
exports.updateChart = async (req, res) => {
    try {
        const chartId = req.params.id;
        const { title, description, chartType, xAxis, yAxis, styleOptions } = req.body;

        const chart = await Chart.findById(chartId);
        if (!chart) {
            return res.status(404).json({ message: 'Chart not found' });
        }

        if (chart.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Unauthorized access to chart' });
        }

        // Update chart fields
        chart.title = title || chart.title;
        chart.description = description || chart.description;
        chart.chartType = chartType || chart.chartType;
        chart.xAxis = xAxis || chart.xAxis;
        chart.yAxis = yAxis || chart.yAxis;
        chart.styleOptions = styleOptions || chart.styleOptions;
        chart.updatedAt = new Date();

        await chart.save();
        res.json(chart);
    } catch (error) {
        console.error('Error updating chart:', error);
        res.status(500).json({ message: 'Error updating chart', error: error.message });
    }
};

// Delete a chart
exports.deleteChart = async (req, res) => {
    try {
        const chartId = req.params.id;
        const chart = await Chart.findById(chartId);

        if (!chart) {
            return res.status(404).json({ message: 'Chart not found' });
        }

        if (chart.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Unauthorized access to chart' });
        }

        await Chart.deleteOne({ _id: chartId });
        res.json({ message: 'Chart deleted successfully' });
    } catch (error) {
        console.error('Error deleting chart:', error);
        res.status(500).json({ message: 'Error deleting chart', error: error.message });
    }
};

// Get chart data (for preview/rendering)
exports.getChartData = async (req, res) => {
    try {
        const chartId = req.params.id;
        const chart = await Chart.findById(chartId);

        if (!chart) {
            return res.status(404).json({ message: 'Chart not found' });
        }

        if (chart.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Unauthorized access to chart' });
        }

        res.json({
            chartType: chart.chartType,
            data: chart.data,
            xAxis: chart.xAxis,
            yAxis: chart.yAxis,
            styleOptions: chart.styleOptions,
            columns: chart.columns
        });
    } catch (error) {
        console.error('Error getting chart data:', error);
        res.status(500).json({ message: 'Error getting chart data', error: error.message });
    }
};