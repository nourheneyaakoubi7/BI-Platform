const express = require('express');
const router = express.Router();
const fileUploadController = require('./fileupload.controller');
const { verifyToken, authorize } = require('../auth/auth.middleware');

router.post('/', verifyToken, authorize(['user']), fileUploadController.uploadFile);
router.get('/', verifyToken, authorize(['user']), fileUploadController.getUserFiles);
router.get('/content/:id', verifyToken, authorize(['user']), fileUploadController.getFileContent);
router.put('/:id', verifyToken, authorize(['user']), fileUploadController.updateFile);
router.get('/download/:id', verifyToken, authorize(['user']), fileUploadController.downloadFile);
router.post('/new', verifyToken, authorize(['user']), fileUploadController.createNewFile);
router.delete('/:id', verifyToken, authorize(['user']), fileUploadController.deleteFile);

module.exports = router;