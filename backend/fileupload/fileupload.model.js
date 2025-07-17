const mongoose = require('mongoose');

const fileUploadSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileData: { type: Buffer, default: Buffer.from('') },
  parsedData: { type: Array, default: [] },
  columns: { type: Array, default: [] },
}, { timestamps: true });

const FileUpload = mongoose.model('FileUpload', fileUploadSchema);

module.exports = FileUpload;