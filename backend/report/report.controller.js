const Report = require('./report.model');
const FileUpload = require('../fileupload/fileupload.model');
const Chart = require('../charts/charts.model');
const PDFDocument = require('pdfkit');
const { createCanvas } = require('canvas');
const ChartJS = require('chart.js/auto'); 

//function to generate chart image buffer using Chart.js
const generateChartImageBuffer = async (config, width = 600, height = 400) => {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const chart = new ChartJS.Chart(ctx, config);
    await chart.render();
    const buffer = canvas.toBuffer('image/png');
    chart.destroy();
    return buffer;
};

// Function to create Chart.js config object based on chart type and data
const createChartJsConfig = (chart) => {
    const labels = chart.data.map(d => d[chart.xAxis]);
    const datasetData = chart.data.map(d => d[chart.yAxis]);

    switch (chart.chartType) {
        case 'bar':
            return {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: chart.yAxis,
                        data: datasetData,
                        backgroundColor: chart.styleOptions.backgroundColor || 'rgba(78, 115, 223, 0.2)',
                        borderColor: chart.styleOptions.borderColor || 'rgba(78, 115, 223, 1)',
                        borderWidth: chart.styleOptions.borderWidth || 1,
                    }]
                },
                options: {
                    responsive: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            };
        case 'line':
            return {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: chart.yAxis,
                        data: datasetData,
                        fill: false,
                        borderColor: '#4e73df',
                        tension: 0.1,
                        pointBackgroundColor: '#4e73df'
                    }]
                },
                options: {
                    responsive: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            };
        case 'polarArea':
            return {
                type: 'polarArea',
                data: {
                    labels: labels.slice(0, 5),
                    datasets: [{
                        data: datasetData.slice(0, 5),
                        backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b']
                    }]
                },
                options: {
                    responsive: false,
                    plugins: { legend: { display: false } }
                }
            };
        case 'radar':
            return {
                type: 'radar',
                data: {
                    labels: labels.slice(0, 5),
                    datasets: [{
                        label: chart.yAxis,
                        data: datasetData.slice(0, 5),
                        fill: true,
                        backgroundColor: 'rgba(78, 115, 223, 0.2)',
                        borderColor: '#4e73df'
                    }]
                },
                options: {
                    responsive: false,
                    plugins: { legend: { display: false } }
                }
            };
        default:
            return {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: chart.yAxis,
                        data: datasetData,
                        backgroundColor: 'rgba(78, 115, 223, 0.2)',
                        borderColor: 'rgba(78, 115, 223, 1)',
                        borderWidth: 1,
                    }]
                },
                options: {
                    responsive: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            };
    }
};

// Main PDF generation
const generatePDFBuffer = async (reportData, files, charts, stylingOptions = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4',
                bufferPages: true
            });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Styling options
            const {
                titleColor = '#4e73df',
                tableBorderColor = '#dddddd',
                tableHeaderColor = '#f8f9fc',
                fontType = 'Helvetica',
                fontSize = 12,
                lineHeight = 1.5
            } = stylingOptions;

            const fontMap = {
                'Helvetica': { normal: 'Helvetica', bold: 'Helvetica-Bold' },
                'Times-Roman': { normal: 'Times-Roman', bold: 'Times-Bold' },
                'Courier': { normal: 'Courier', bold: 'Courier-Bold' }
            };

            const getFont = (isBold) => {
                const fm = fontMap[fontType] || fontMap['Helvetica'];
                return isBold ? fm.bold : fm.normal;
            };

            // Cover page
            doc.fillColor(titleColor)
                .font(getFont(true))
                .fontSize(24)
                .text(reportData.title, { align: 'center' });
            doc.moveDown();
            doc.fillColor('#333')
                .font(getFont(false))
                .fontSize(16)
                .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
            doc.addPage();

            // TOC
            doc.fillColor('#333')
                .font(getFont(true))
                .fontSize(18)
                .text('Table of Contents', { underline: true });
            doc.moveDown(0.5);
            doc.font(getFont(false))
                .fontSize(12)
                .text('1. Report Summary ...................... 3');
            doc.text('2. Data Sources ........................ 4');
            doc.text('3. Visualizations ...................... 5');
            doc.addPage();

            // Report Summary
            doc.fillColor('#333')
                .font(getFont(true))
                .fontSize(18)
                .text('1. Report Summary', { underline: true });
            doc.moveDown(0.5);
            if (reportData.description) {
                doc.fillColor('#333')
                    .font(getFont(false))
                    .fontSize(fontSize)
                    .text(reportData.description, { lineGap: 10 });
                doc.moveDown();
            }

            // Data Sources
            if (files.length > 0) {
                for (let file of files) {
                    doc.fillColor('#333')
                        .font(getFont(true))
                        .fontSize(14)
                        .text(`${file.originalName}`, { underline: true });
                    doc.fillColor('#333')
                        .font(getFont(false))
                        .fontSize(fontSize)
                        .text(`• Rows: ${file.parsedData.length}`);
                    doc.text(`• Columns: ${file.columns.join(', ')}`);
                    doc.moveDown(0.5);
                    if (file.parsedData.length > 0) {
                        const headers = Object.keys(file.parsedData[0]);
                        const columnWidths = headers.map(() => 120);
                        const startX = 50;
                        let startY = doc.y;

                        // Headers
                        doc.font(getFont(true));
                        headers.forEach((h, i) => {
                            doc.fillColor('#333')
                                .rect(startX + i * columnWidths[i], startY, columnWidths[i], 20)
                                .fillAndStroke(tableHeaderColor, tableBorderColor);
                            doc.fillColor('#000')
                                .text(h, startX + i * columnWidths[i] + 5, startY + 4, {
                                    width: columnWidths[i] - 10
                                });
                        });
                        // Rows
                        doc.font(getFont(false));
                        file.parsedData.slice(0, 5).forEach((row, ri) => {
                            startY += 20;
                            headers.forEach((h, i) => {
                                doc.fillColor('#fff')
                                    .rect(startX + i * columnWidths[i], startY, columnWidths[i], 20)
                                    .fillAndStroke('#fff', tableBorderColor);
                                doc.fillColor('#000')
                                    .text(String(row[h] || '-'), startX + i * columnWidths[i] + 5, startY + 4, {
                                        width: columnWidths[i] - 10
                                    });
                            });
                        });
                        doc.moveDown(1.5);
                    }
                }
            } else {
                doc.fillColor('#333')
                    .font(getFont(false))
                    .fontSize(fontSize)
                    .text('No data sources');
            }
            doc.addPage();

            // Visualizations
            if (charts.length > 0) {
                for (let chart of charts) {
                    // Info
                    doc.fillColor('#333')
                        .font(getFont(true))
                        .fontSize(14)
                        .text(`${chart.title}`, { underline: true });
                    doc.fillColor('#333')
                        .font(getFont(false))
                        .fontSize(fontSize)
                        .text(`Type: ${chart.chartType}`);
                    if (chart.xAxis && chart.yAxis) {
                        doc.text(`X: ${chart.xAxis}`);
                        doc.text(`Y: ${chart.yAxis}`);
                    }
                    if (chart.description) {
                        doc.moveDown(0.3);
                        doc.text(`Analysis:`);
                        doc.text(chart.description);
                    }
                    doc.moveDown(0.5);

                    // Data columns preview
                    if (chart.data && chart.data.length > 0) {
                        doc.fillColor('#333')
                            .font(getFont(true))
                            .fontSize(fontSize)
                            .text('Chart Data:', { underline: true });
                        doc.moveDown(0.3);
                        const relevantCols = [];
                        if (chart.xAxis) relevantCols.push(chart.xAxis);
                        if (chart.yAxis) relevantCols.push(chart.yAxis);
                        if (chart.groupBy) relevantCols.push(chart.groupBy);
                        const headers = relevantCols.length > 0 ? relevantCols : Object.keys(chart.data[0]);
                        const colWidth = (doc.page.width - 100) / headers.length;
                        const colWidths = headers.map(() => colWidth);
                        const startX = 50;
                        let startY = doc.y;

                        // Headers
                        doc.font(getFont(true));
                        headers.forEach((h, i) => {
                            doc.fillColor('#333')
                                .rect(startX + i * colWidths[i], startY, colWidths[i], 20)
                                .fillAndStroke(tableHeaderColor, tableBorderColor);
                            doc.fillColor('#000')
                                .text(h, startX + i * colWidths[i] + 5, startY + 4, {
                                    width: colWidths[i] - 10
                                });
                        });
                        // Data rows
                        doc.font(getFont(false));
                        chart.data.slice(0, 10).forEach((row, ri) => {
                            startY += 20;
                            headers.forEach((h, i) => {
                                doc.fillColor('#fff')
                                    .rect(startX + i * colWidths[i], startY, colWidths[i], 20)
                                    .fillAndStroke('#fff', tableBorderColor);
                                doc.fillColor('#000')
                                    .text(String(row[h] || '-'), startX + i * colWidths[i] + 5, startY + 4, {
                                        width: colWidths[i] - 10
                                    });
                            });
                        });
                        doc.moveDown(1);
                    }

                    // Generate chart image buffer
                    const chartWidth = 600;
                    const chartHeight = 400;
                    const chartX = (doc.page.width - chartWidth) / 2;
                    const chartY = doc.y;

                    const chartConfig = createChartJsConfig(chart);
                    const buffer = await generateChartImageBuffer(chartConfig, chartWidth, chartHeight);
                    // Insert into PDF
                    doc.image(buffer, chartX, chartY, { width: chartWidth, height: chartHeight });
                    doc.moveDown(3);
                    if (charts.indexOf(chart) !== charts.length - 1) {
                        doc.addPage();
                    }
                }
            } else {
                // no charts
                doc.fillColor('#333')
                    .font(getFont(false))
                    .fontSize(fontSize)
                    .text('No visualizations included in this report');
            }

            // Finalize PDF
            doc.end();

        } catch (err) {
            reject(err);
        }
    });
};

//createReport function
exports.createReport = async (req, res) => {
    try {
        const { title, description, templateType, fileIds, chartIds, content, stylingOptions } = req.body;
        const userId = req.user.id;

        const [files, charts] = await Promise.all([
            FileUpload.find({ _id: { $in: fileIds }, userId }),
            Chart.find({ _id: { $in: chartIds }, userId })
        ]);

        if (files.length !== (fileIds || []).length || charts.length !== (chartIds || []).length) {
            return res.status(403).json({ message: 'Some files/charts are inaccessible' });
        }

        const newReport = new Report({
            userId,
            title,
            description,
            templateType,
            fileIds,
            chartIds,
            content: content || {},
            stylingOptions: stylingOptions || {}
        });

        const pdfBuffer = await generatePDFBuffer(newReport, files, charts, stylingOptions);
        newReport.pdfData = pdfBuffer;

        await newReport.save();

        res.json({
            _id: newReport._id,
            title: newReport.title,
            description: newReport.description,
            templateType: newReport.templateType,
            createdAt: newReport.createdAt
        });
    } catch (err) {
        console.error('Error creating report:', err);
        res.status(500).json({ message: 'Error creating report', error: err.message });
    }
};

exports.getUserReports = async (req, res) => {
    try {
        const userId = req.user.id;
        const reports = await Report.find({ userId }, { pdfData: 0 }).sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Error fetching user reports', error: error.message });
    }
};

exports.getReportById = async (req, res) => {
    try {
        const reportId = req.params.id;
        const report = await Report.findById(reportId, { pdfData: 0 }).populate('files').populate('charts');

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        if (report.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Unauthorized access to report' });
        }

        res.json(report);
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({ message: 'Error fetching report', error: error.message });
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const reportId = req.params.id;
        const report = await Report.findById(reportId);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        if (report.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Unauthorized access to report' });
        }

        await Report.deleteOne({ _id: reportId });
        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ message: 'Error deleting report', error: error.message });
    }
};

exports.downloadReport = async (req, res) => {
    try {
        const reportId = req.params.id;
        const report = await Report.findById(reportId);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        if (report.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Unauthorized access to report' });
        }

        if (!report.pdfData) {
            return res.status(404).json({ message: 'PDF data not found' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${report.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
        res.send(report.pdfData);
    } catch (error) {
        console.error('Error downloading report:', error);
        res.status(500).json({ message: 'Error downloading report', error: error.message });
    }
};