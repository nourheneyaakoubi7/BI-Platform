const multer = require('multer');
const FileUpload = require('./fileupload.model');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const { Readable } = require('stream');

// File upload configuration
const allowedMimeTypes = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV, XLS, and XLSX files are allowed'), false);
  }
};

const storage = multer.memoryStorage();
const upload = multer({ storage, fileFilter }).single('file');

//function to parse file data
const parseFileData = async (fileBuffer, fileType) => {
  if (fileType === 'text/csv') {
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = Readable.from(fileBuffer.toString());
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  } else {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  }
};

exports.uploadFile = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Error uploading file', error: err.message });
    }

    try {
      const userId = req.user.id;
      const fileData = await parseFileData(req.file.buffer, req.file.mimetype);

      const newFile = new FileUpload({
        userId,
        filename: req.file.originalname,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        fileData: req.file.buffer,
        parsedData: fileData,
        columns: fileData.length > 0 ? Object.keys(fileData[0]) : []
      });

      await newFile.save();
      res.status(201).json(newFile);
    } catch (error) {
      console.error('Error saving file:', error);
      res.status(500).json({ message: 'Error saving file to database', error: error.message });
    }
  });
};

exports.getUserFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const files = await FileUpload.find({ userId }).sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: 'Error fetching user files', error: error.message });
  }
};

exports.getFileContent = async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await FileUpload.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (!file.parsedData || file.parsedData.length === 0) {
      file.parsedData = await parseFileData(file.fileData, file.fileType);
      await file.save();
    }

    res.json({
      filename: file.originalName,
      content: file.parsedData,
      columns: file.columns || [],
      rowCount: file.parsedData.length,
      columnCount: file.columns ? file.columns.length : 0
    });
  } catch (error) {
    console.error('Error getting file content:', error);
    res.status(500).json({ message: 'Error fetching file content', error: error.message });
  }
};

exports.updateFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const { content, newFilename, columnUpdates } = req.body;

    const file = await FileUpload.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    let updatedContent = content;
    if (columnUpdates) {
      if (columnUpdates.renamedColumns) {
        updatedContent = content.map(row => {
          const newRow = {};
          Object.keys(row).forEach(key => {
            const newKey = columnUpdates.renamedColumns[key] || key;
            newRow[newKey] = row[key];
          });
          return newRow;
        });
      }

      if (columnUpdates.deletedColumns) {
        updatedContent = content.map(row => {
          const newRow = { ...row };
          columnUpdates.deletedColumns.forEach(col => {
            delete newRow[col];
          });
          return newRow;
        });
      }
    }

    if (newFilename) {
      const newFile = new FileUpload({
        userId: file.userId,
        filename: newFilename,
        originalName: newFilename,
        fileType: file.fileType,
        fileData: file.fileData,
        parsedData: updatedContent,
        columns: updatedContent.length > 0 ? Object.keys(updatedContent[0]) : []
      });

      await newFile.save();
      return res.json({
        ...newFile.toObject(),
        content: updatedContent
      });
    }

    file.parsedData = updatedContent;
    file.columns = updatedContent.length > 0 ? Object.keys(updatedContent[0]) : [];
    await file.save();

    res.json({
      ...file.toObject(),
      content: updatedContent
    });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ message: 'Error updating file', error: error.message });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await FileUpload.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.set({
      'Content-Type': file.fileType,
      'Content-Disposition': `attachment; filename="${file.originalName}"`,
      'Content-Length': file.fileData.length
    });

    res.send(file.fileData);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Error downloading file', error: error.message });
  }
};

exports.createNewFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { filename, fileType } = req.body;

    if (!filename || !fileType) {
      return res.status(400).json({
        message: 'Filename and fileType are required',
        details: {
          received: { filename, fileType },
          expected: { filename: 'string', fileType: 'csv|xls|xlsx' }
        }
      });
    }

    const validTypes = ['csv', 'xls', 'xlsx'];
    if (!validTypes.includes(fileType)) {
      return res.status(400).json({
        message: 'Invalid file type',
        validTypes,
        received: fileType
      });
    }

    const mimeTypes = {
      csv: 'text/csv',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    const newFile = new FileUpload({
      userId,
      filename: filename,
      originalName: `${filename}.${fileType}`,
      fileType: mimeTypes[fileType],
      fileData: Buffer.from(''),
      parsedData: [],
      columns: []
    });

    const savedFile = await newFile.save();

    res.status(201).json({
      ...savedFile.toObject(),
      content: [],
      parsedData: []
    });
  } catch (error) {
    console.error('Error creating new file:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      error: error
    });

    res.status(500).json({
      message: 'Error creating new file',
      error: error.message,
      details: error.errors || null
    });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await FileUpload.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    await FileUpload.deleteOne({ _id: fileId });
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
};