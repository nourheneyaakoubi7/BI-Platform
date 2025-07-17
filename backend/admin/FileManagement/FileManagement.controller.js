const FileManagement = require('../../fileupload/fileupload.model');
const User = require('../../auth/auth.model'); // Import the User model
const xlsx = require('xlsx');
const csv = require('csv-parser');
const { Readable } = require('stream');

//parse file buffer
const parseFileBuffer = async (buffer, mimetype) => {
  if (mimetype === 'text/csv') {
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = Readable.from(buffer.toString());
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  } else {
    // for xls/xlsx
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  }
};

exports.getAllFilesGroupedByUser = async (req, res) => {
  try {
    const files = await FileManagement.find().populate('userId', 'username'); // Populate userId with username
    const filesByUser = {};

    files.forEach(file => {
      const username = file.userId ? file.userId.username : 'Unknown User';
      if (!filesByUser[username]) {
        filesByUser[username] = [];
      }
      filesByUser[username].push(file);
    });

    res.json(filesByUser);
  } catch (err) {
    console.error('Error fetching files:', err);
    res.status(500).json({ message: 'Error fetching files', error: err.message });
  }
};

exports.getFileContent = async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await FileManagement.findById(fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    if (!file.parsedData || file.parsedData.length === 0) {
      const parsedData = await parseFileBuffer(file.fileData, file.fileType);
      file.parsedData = parsedData;
      file.columns = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
      await file.save();
    }

    res.json({
      filename: file.originalName,
      content: file.parsedData,
      columns: file.columns,
      rowCount: file.parsedData.length,
      columnCount: file.columns.length
    });
  } catch (err) {
    console.error('Error fetching file content:', err);
    res.status(500).json({ message: 'Error fetching file content', error: err.message });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    await FileManagement.findByIdAndDelete(fileId);
    res.json({ message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting file', error: err.message });
  }
};