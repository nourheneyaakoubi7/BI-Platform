const express = require('express');
const router = express.Router();
const aiController = require('./ai.controller');
const { verifyToken, authorize } = require('../auth/auth.middleware');

router.post('/conversation', verifyToken, authorize(['user']), aiController.saveConversation);
router.get('/conversations', verifyToken, authorize(['user']), aiController.getConversationList);
router.get('/conversation', verifyToken, authorize(['user']), aiController.getConversation);
router.delete('/conversation/:chatId', verifyToken, authorize(['user']), aiController.deleteConversation);
router.post('/query', verifyToken, authorize(['user']), aiController.processQuery);

module.exports = router;