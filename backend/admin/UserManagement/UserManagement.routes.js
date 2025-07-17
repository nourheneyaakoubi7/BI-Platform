const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} = require('./UserManagement.controller');
const { verifyToken, authorize } = require('../../auth/auth.middleware');

router.get('/', verifyToken, authorize(['admin']), getAllUsers);
router.get('/:id', verifyToken, authorize(['admin']), getUserById);
router.post('/', verifyToken, authorize(['admin']), createUser);
router.put('/:id', verifyToken, authorize(['admin']), updateUser);
router.delete('/:id', verifyToken, authorize(['admin']), deleteUser);

module.exports = router;