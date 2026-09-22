const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware, roleMiddleware(['admin']));

router.get('/', adminController.getStudents);
router.post('/create', adminController.createStudent);
router.post('/import-json', adminController.importStudents);
router.put('/:id', adminController.updateStudent);
router.delete('/:id', adminController.deleteStudent);

module.exports = router;