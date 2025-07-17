const mongoose = require('mongoose');

const chartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'FileUpload', required: true },
  chartType: { type: String, required: true, enum: [
    'bar', 'line', 'pie', 'doughnut', 'scatter', 'bubble', 'radar', 'polarArea'
  ] },
  xAxis: { type: String },
  yAxis: { type: String },
  styleOptions: { type: Object, default: {} },
  data: { type: Array, default: [] },
  columns: { type: Array, default: [] }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for faster queries
chartSchema.index({ userId: 1 });
chartSchema.index({ fileId: 1 });
chartSchema.index({ title: 'text', description: 'text' });

// Virtual populate
chartSchema.virtual('file', {
  ref: 'FileUpload',
  localField: 'fileId',
  foreignField: '_id',
  justOne: true
});

const Chart = mongoose.model('Chart', chartSchema);

module.exports = Chart;