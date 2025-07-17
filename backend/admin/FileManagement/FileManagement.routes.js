const express = require('express');
const router = express.Router();

const {
    getAllFilesGroupedByUser,
    getFileContent,
    deleteFile
} = require('./FileManagement.controller');
const { verifyToken, authorize } = require('../../auth/auth.middleware');

router.get('/', verifyToken, authorize(['admin']), getAllFilesGroupedByUser);
router.get('/content/:id', verifyToken, authorize(['admin']), getFileContent);
router.delete('/:id', verifyToken, authorize(['admin']), deleteFile);

module.exports = router;