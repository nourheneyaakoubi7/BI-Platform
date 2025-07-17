const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    templateType: {
        type: String,
        required: true,
        enum: ['executive', 'technical', 'custom']
    },
    fileIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FileUpload' }],
    chartIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chart' }],
    content: { type: Object, default: {} },
    stylingOptions: {
        type: Object,
        default: {
            titleColor: '#4e73df',
            tableBorderColor: '#dddddd',
            tableHeaderColor: '#f8f9fc',
            fontType: 'Helvetica',
            fontSize: 12,
            lineHeight: 1.5
        }
    },
    pdfData: { type: Buffer },
    createdAt: { type: Date, default: Date.now }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals
reportSchema.virtual('files', {
    ref: 'FileUpload',
    localField: 'fileIds',
    foreignField: '_id'
});
reportSchema.virtual('charts', {
    ref: 'Chart',
    localField: 'chartIds',
    foreignField: '_id'
});

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;